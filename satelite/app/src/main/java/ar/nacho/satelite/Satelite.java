package ar.nacho.satelite;

import android.app.AlarmManager;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Build;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** El corazón de Satélite: qué apps escucha, qué guarda, cuándo y cómo le manda a Orbe. */
final class Satelite {
    static final String SERVIDOR = "https://orbe-5es.pages.dev";
    static final int TRABAJO = 1;
    static final long CADA = 30 * 60 * 1000L;          // cada 30 minutos
    static final long PING = 6 * 60 * 60 * 1000L;      // sin nada nuevo, avisa que está vivo cada 6 horas
    static final int MAX_PENDIENTES = 500;
    static final int MAX_EJEMPLOS = 30;
    static final long VIDA_EJEMPLO = 7L * 24 * 60 * 60 * 1000;

    static final String[] CLAVES = {"mercadopago", "bna", "personalpay"};
    static final String[] NOMBRES = {"Mercado Pago", "BNA+", "Personal Pay"};
    // Paquetes conocidos y, por las dudas, el nombre visible de la app (así no depende de adivinar el paquete).
    private static final Map<String, String> PAQUETES = new HashMap<>();
    static {
        PAQUETES.put("com.mercadopago.wallet", "mercadopago");
    }
    private static final Pattern[] ETIQUETAS = {
        Pattern.compile("^mercado ?pago$", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^(nueva )?bna\\+?$|banco (de la )?naci[oó]n", Pattern.CASE_INSENSITIVE),
        Pattern.compile("^personal ?pay$", Pattern.CASE_INSENSITIVE)
    };
    private static final Map<String, String> CACHE = new HashMap<>();
    // Un candado solo para guardar y mandar (no el de la clase): así leer qué app es nunca espera a la red.
    private static final Object CANDADO = new Object();

    private Satelite() {}

    static String nombre(String clave) {
        for (int i = 0; i < CLAVES.length; i++) if (CLAVES[i].equals(clave)) return NOMBRES[i];
        return clave;
    }

    /** Qué app de las permitidas es este paquete, o null si no es ninguna (y entonces no se lee nada). */
    static String appDe(Context c, String paquete) {
        if (paquete == null) return null;
        synchronized (CACHE) { if (CACHE.containsKey(paquete)) return CACHE.get(paquete); }
        String clave = PAQUETES.get(paquete);
        if (clave == null) {
            try {
                PackageManager pm = c.getPackageManager();
                ApplicationInfo ai = pm.getApplicationInfo(paquete, 0);
                String etiqueta = String.valueOf(pm.getApplicationLabel(ai)).trim();
                for (int i = 0; i < ETIQUETAS.length; i++) {
                    if (ETIQUETAS[i].matcher(etiqueta).find()) { clave = CLAVES[i]; break; }
                }
            } catch (Exception e) {
                clave = null;
            }
        }
        synchronized (CACHE) { CACHE.put(paquete, clave); }
        return clave;
    }

    /** Para la pantalla: cuáles de las tres apps están instaladas en este celu. */
    static Set<String> instaladas(Context c) {
        Set<String> out = new HashSet<>();
        try {
            PackageManager pm = c.getPackageManager();
            Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> r = pm.queryIntentActivities(i, 0);
            for (ResolveInfo x : r) {
                String clave = appDe(c, x.activityInfo.packageName);
                if (clave != null) out.add(clave);
            }
        } catch (Exception e) { /* nada */ }
        return out;
    }

    // ---------- Lo que llega ----------

    /** Una notificación de una app permitida: se guarda el aviso (si se entiende) y el ejemplo (solo en el celu). */
    // Mismo pago re-publicado (la app actualiza la notificación): 3 minutos de gracia.
    private static final Map<String, Long> RECIENTES = new HashMap<>();

    static void registrar(Context c, String app, String titulo, String texto, long ts) {
        synchronized (CANDADO) { registrar0(c, app, titulo, texto, ts); }
    }

    private static void registrar0(Context c, String app, String titulo, String texto, long ts) {
        Almacen a = new Almacen(c);
        a.num("ultimoOido", System.currentTimeMillis());
        Lector.Aviso av = Lector.leer(app, titulo, texto, ts);
        if (av != null) {
            long ahora = System.currentTimeMillis();
            for (Iterator<Map.Entry<String, Long>> it = RECIENTES.entrySet().iterator(); it.hasNext(); ) {
                if (ahora - it.next().getValue() > 3 * 60 * 1000L) it.remove();
            }
            String k = av.app + "|" + av.sentido + "|" + av.monto + "|" + av.comercio.toLowerCase(Locale.ROOT);
            if (RECIENTES.containsKey(k)) av = null; else RECIENTES.put(k, ahora);
        }
        // Ejemplos: para mejorar el lector. Nunca salen del celu salvo que los copies vos.
        try {
            JSONArray ej = listaOVacia(a, "ejemplos");
            JSONArray nuevo = new JSONArray();
            long ahora = System.currentTimeMillis();
            String crudo = ((titulo == null ? "" : titulo) + " · " + (texto == null ? "" : texto)).trim();
            if (crudo.length() > 240) crudo = crudo.substring(0, 240);
            boolean repetido = false;
            for (int i = 0; i < ej.length(); i++) {
                JSONObject o = ej.getJSONObject(i);
                if (ahora - o.optLong("ts") > VIDA_EJEMPLO) continue;
                if (o.optString("texto").equals(crudo)) repetido = true;
                nuevo.put(o);
            }
            if (!repetido) {
                JSONObject o = new JSONObject();
                o.put("app", app).put("ts", ts).put("texto", crudo).put("leido", av == null ? "" : resumen(av));
                nuevo.put(o);
            }
            while (nuevo.length() > MAX_EJEMPLOS) nuevo.remove(0);
            a.lista("ejemplos", nuevo);
        } catch (Exception e) { /* nada */ }
        if (av == null) return;
        try {
            JSONArray pend = listaOVacia(a, "pendientes");
            for (int i = 0; i < pend.length(); i++) if (av.id.equals(pend.getJSONObject(i).optString("id"))) return;
            // Ya mandado antes (la app a veces actualiza la misma notificación): tampoco se repite.
            String vistos = a.leerSeguro("vistos");
            if (vistos != null && vistos.contains(av.id)) return;
            JSONObject o = new JSONObject();
            o.put("id", av.id).put("app", av.app).put("monto", av.monto).put("moneda", av.moneda)
                .put("comercio", av.comercio).put("sentido", av.sentido).put("ts", av.ts);
            pend.put(o);
            while (pend.length() > MAX_PENDIENTES) pend.remove(0);
            a.lista("pendientes", pend);
            a.num("capturados", a.num("capturados") + 1);
            a.num("cap_" + app, a.num("cap_" + app) + 1);
        } catch (Exception e) { /* nada */ }
    }

    /** Si una lista guardada ya no se puede descifrar (el celu perdió la llave), se descarta y se empieza de cero. */
    static JSONArray listaOVacia(Almacen a, String k) {
        try {
            return a.lista(k);
        } catch (Exception e) {
            a.guardar(k, null);
            return new JSONArray();
        }
    }

    static void limpiarIlegibles(Almacen a) {
        for (String k : new String[]{"pendientes", "ejemplos", "vistos"}) {
            if (a.tiene(k) && a.leerSeguro(k) == null) a.guardar(k, null);
        }
    }

    static String resumen(Lector.Aviso av) {
        String m = (av.moneda.equals("USD") ? "US$ " : "$ ") + String.format(new Locale("es", "AR"), "%,.2f", av.monto).replace(",00", "");
        String s = av.sentido.equals("cobro") ? "cobro" : av.sentido.equals("transferencia") ? "transferencia" : "pago";
        return s + " " + m + (av.comercio.isEmpty() ? "" : " · " + av.comercio);
    }

    // ---------- Lo que se manda ----------

    static long proximaAlarma(Context c) {
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            AlarmManager.AlarmClockInfo i = am == null ? null : am.getNextAlarmClock();
            return i == null ? 0 : i.getTriggerTime();
        } catch (Exception e) {
            return 0;
        }
    }

    static boolean vinculado(Context c) { return new Almacen(c).tiene("llave"); }

    static boolean permiso(Context c) {
        String s = Settings.Secure.getString(c.getContentResolver(), "enabled_notification_listeners");
        return s != null && s.contains(new ComponentName(c, Oido.class).flattenToString());
    }

    /** Xiaomi a veces suelta el oído sin avisar: si hay permiso y no está conectado, se le pide a Android que lo vuelva a enganchar. */
    static void reenganchar(Context c) {
        try {
            if (!permiso(c) || Oido.conectado) return;
            ComponentName oido = new ComponentName(c, Oido.class);
            // En Xiaomi lo más confiable es apagar y prender el componente; después, pedir que lo vuelva a enganchar.
            PackageManager pm = c.getPackageManager();
            pm.setComponentEnabledSetting(oido, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
            pm.setComponentEnabledSetting(oido, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
            NotificationListenerService.requestRebind(oido);
        } catch (Exception e) { /* nada */ }
    }

    static String version(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Manda lo pendiente y la próxima alarma. Sin nada nuevo y con la alarma igual, no usa internet
     * (salvo un aviso de «sigo vivo» cada 6 horas). Devuelve un texto corto para la pantalla.
     */
    static String enviar(Context c, boolean forzar) {
        synchronized (CANDADO) { return enviar0(c, forzar); }
    }

    private static String enviar0(Context c, boolean forzar) {
        Almacen a = new Almacen(c);
        String llave;
        JSONArray pend;
        try {
            llave = a.leer("llave");
            if (llave == null) return "Sin vincular";
            pend = a.lista("pendientes");
        } catch (Exception e) {
            // Lo guardado ya no se puede descifrar (el celu cambió la llave): se limpia para no quedar trabado.
            if (a.leerSeguro("llave") == null) a.guardar("llave", null);
            limpiarIlegibles(a);
            a.texto("error", "El celu perdió la llave guardada. Volvé a vincular con un código nuevo.");
            return "Error de llave";
        }
        long alarma = proximaAlarma(c);
        long ahora = System.currentTimeMillis();
        boolean cambioAlarma = alarma != a.num("alarmaMandada");
        if (!forzar && pend.length() == 0 && !cambioAlarma && ahora - a.num("ultimoEnvio") < PING) return "Nada nuevo";
        try {
            JSONArray items = new JSONArray();
            Set<String> ids = new HashSet<>();
            for (int i = 0; i < pend.length() && i < 200; i++) {
                JSONObject o = pend.getJSONObject(i);
                items.put(o);
                ids.add(o.optString("id"));
            }
            JSONObject cuerpo = new JSONObject();
            cuerpo.put("items", items).put("alarma", alarma > 0 ? alarma : JSONObject.NULL).put("version", version(c));
            Respuesta r = post(SERVIDOR + "/api/satelite/buzon", cuerpo.toString(), llave);
            if (r.codigo == 401) {
                // Un rechazo suelto puede ser el servidor que todavía no se enteró (recién vinculado).
                // Recién con 3 seguidos y al menos una hora de diferencia se da por anulado.
                long n = a.num("n401") + 1;
                a.num("n401", n);
                if (n == 1) a.num("primer401", ahora);
                if (n >= 3 && ahora - a.num("primer401") > 60 * 60 * 1000L) {
                    a.texto("error", "Orbe anuló este celu. Volvé a vincularlo.");
                    a.guardar("llave", null);
                    a.num("n401", 0);
                    return "Desvinculado";
                }
                a.texto("error", "Orbe no reconoció la llave (intento " + n + "). Se reintenta solo.");
                return "No reconocido";
            }
            a.num("n401", 0);
            if (r.codigo != 200) {
                a.texto("error", r.codigo == 503 ? "El buzón de Orbe todavía no está creado." : "Orbe respondió " + r.codigo);
                return "No se pudo";
            }
            // Se sacan solo los que se mandaron (pudo llegar algo nuevo mientras tanto).
            JSONArray resto = new JSONArray();
            JSONArray actual;
            actual = listaOVacia(a, "pendientes");
            for (int i = 0; i < actual.length(); i++) {
                JSONObject o = actual.getJSONObject(i);
                if (!ids.contains(o.optString("id"))) resto.put(o);
            }
            a.lista("pendientes", resto);
            String vistos = a.leerSeguro("vistos");
            StringBuilder v = new StringBuilder(vistos == null ? "" : vistos);
            for (String id : ids) v.append(id).append(',');
            String vs = v.toString();
            if (vs.length() > 6000) vs = vs.substring(vs.length() - 6000);
            a.guardar("vistos", vs);
            a.num("ultimoEnvio", ahora);
            a.num("alarmaMandada", alarma);
            a.num("mandados", a.num("mandados") + ids.size());
            a.texto("error", null);
            return ids.isEmpty() ? "Al día" : (ids.size() == 1 ? "Mandé 1 aviso" : "Mandé " + ids.size() + " avisos");
        } catch (Exception e) {
            a.texto("error", "Sin conexión con Orbe");
            return "Sin conexión";
        }
    }

    /** Vincula este celu con el código que muestra Orbe en Ajustes › Satélite. */
    static String vincular(Context c, String codigo) {
        try {
            JSONObject cuerpo = new JSONObject();
            cuerpo.put("codigo", codigo).put("modelo", (Build.MANUFACTURER + " " + Build.MODEL).trim());
            Respuesta r = post(SERVIDOR + "/api/satelite/vincular", cuerpo.toString(), null);
            if (r.codigo == 200) {
                JSONObject j = new JSONObject(r.cuerpo);
                Almacen a = new Almacen(c);
                limpiarIlegibles(a);
                a.guardar("llave", j.getString("llave"));
                if (a.leerSeguro("llave") == null) return "Este celu no dejó guardar la llave cifrada. Probá de nuevo con otro código.";
                a.texto("nombre", j.optString("nombre", "Celu"));
                a.texto("error", null);
                a.num("alarmaMandada", -1);
                programar(c);
                return null;
            }
            if (r.codigo == 403) return "Ese código no sirve o ya venció. Pedí otro en Orbe.";
            if (r.codigo == 429) return "Muchos intentos. Esperá 10 minutos.";
            if (r.codigo == 503) return "El buzón de Orbe todavía no está creado.";
            return "Orbe respondió " + r.codigo;
        } catch (Exception e) {
            return "Sin conexión con Orbe.";
        }
    }

    static final class Respuesta {
        final int codigo;
        final String cuerpo;
        Respuesta(int codigo, String cuerpo) { this.codigo = codigo; this.cuerpo = cuerpo; }
    }

    private static Respuesta post(String url, String cuerpo, String llave) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        try {
            h.setConnectTimeout(15000);
            h.setReadTimeout(20000);
            h.setRequestMethod("POST");
            h.setDoOutput(true);
            h.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            h.setRequestProperty("User-Agent", "Satelite");
            if (llave != null) h.setRequestProperty("Authorization", "Bearer " + llave);
            byte[] b = cuerpo.getBytes(StandardCharsets.UTF_8);
            h.setFixedLengthStreamingMode(b.length);
            try (OutputStream o = h.getOutputStream()) { o.write(b); }
            int codigo = h.getResponseCode();
            InputStream in = codigo >= 400 ? h.getErrorStream() : h.getInputStream();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (in != null) {
                byte[] buf = new byte[4096];
                int n;
                while ((n = in.read(buf)) > 0 && out.size() < 100000) out.write(buf, 0, n);
                in.close();
            }
            return new Respuesta(codigo, out.toString("UTF-8"));
        } finally {
            h.disconnect();
        }
    }

    // ---------- Cuándo ----------

    /** Un solo trabajo periódico (cada 30 min, solo con internet). Android lo agrupa con otros para gastar menos. */
    static void programar(Context c) {
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js == null) return;
        if (js.getPendingJob(TRABAJO) != null) return;
        JobInfo j = new JobInfo.Builder(TRABAJO, new ComponentName(c, Envio.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(CADA, 10 * 60 * 1000L)
            .setPersisted(true)
            .build();
        js.schedule(j);
    }
}
