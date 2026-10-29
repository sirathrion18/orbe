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

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
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

    private Satelite() {}

    static String nombre(String clave) {
        for (int i = 0; i < CLAVES.length; i++) if (CLAVES[i].equals(clave)) return NOMBRES[i];
        return clave;
    }

    /** Qué app de las permitidas es este paquete, o null si no es ninguna (y entonces no se lee nada). */
    static synchronized String appDe(Context c, String paquete) {
        if (paquete == null) return null;
        if (CACHE.containsKey(paquete)) return CACHE.get(paquete);
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
        CACHE.put(paquete, clave);
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
    static void registrar(Context c, String app, String titulo, String texto, long ts) {
        Almacen a = new Almacen(c);
        Lector.Aviso av = Lector.leer(app, titulo, texto, ts);
        // Ejemplos: para mejorar el lector. Nunca salen del celu salvo que los copies vos.
        try {
            JSONArray ej = a.lista("ejemplos");
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
            JSONArray pend = a.lista("pendientes");
            for (int i = 0; i < pend.length(); i++) if (av.id.equals(pend.getJSONObject(i).optString("id"))) return;
            // Ya mandado antes (la app a veces actualiza la misma notificación): tampoco se repite.
            String vistos = a.leer("vistos");
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

    static boolean vinculado(Context c) { return new Almacen(c).leer("llave") != null; }

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
    static synchronized String enviar(Context c, boolean forzar) {
        Almacen a = new Almacen(c);
        String llave = a.leer("llave");
        if (llave == null) return "Sin vincular";
        JSONArray pend = a.lista("pendientes");
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
                a.texto("error", "Orbe anuló este celu. Volvé a vincularlo.");
                a.guardar("llave", null);
                return "Desvinculado";
            }
            if (r.codigo != 200) {
                a.texto("error", r.codigo == 503 ? "El buzón de Orbe todavía no está creado." : "Orbe respondió " + r.codigo);
                return "No se pudo";
            }
            // Se sacan solo los que se mandaron (pudo llegar algo nuevo mientras tanto).
            JSONArray resto = new JSONArray();
            JSONArray actual = a.lista("pendientes");
            for (int i = 0; i < actual.length(); i++) {
                JSONObject o = actual.getJSONObject(i);
                if (!ids.contains(o.optString("id"))) resto.put(o);
            }
            a.lista("pendientes", resto);
            String vistos = a.leer("vistos");
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
                a.guardar("llave", j.getString("llave"));
                if (a.leer("llave") == null) return "Este celu no dejó guardar la llave cifrada. Probá de nuevo con otro código.";
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
