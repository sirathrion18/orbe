package ar.nacho.satelite;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Los avisos de Orbe en el celu. Orbe arma la agenda (próximas 36 h) y la deja en su buzón; Satélite la baja
 * cuando cambia, la guarda cifrada y programa cada aviso con una alarma suave (ventana de 10 minutos: sin permiso
 * de alarmas exactas y gastando lo mínimo). En la alarma solo viaja el id: el texto queda cifrado en el celu.
 * Además, apenas lee un pago, avisa cuánto te queda hoy (con la cuenta que mandó Orbe).
 */
final class Avisos {
    static final String ACCION = "ar.nacho.satelite.AVISO";
    static final long REVISAR = 60 * 60 * 1000L;          // la agenda se pregunta como mucho una vez por hora
    static final long VENTANA = 10 * 60 * 1000L;
    static final long TARDE = 2 * 60 * 60 * 1000L;        // un aviso con más de 2 h de atraso ya no se muestra

    private static final String[][] CANALES = {
        {"urgente", "Urgente", "Lo que vence hoy."},
        {"plata", "Plata", "Vencimientos y lo que te queda después de cada pago."},
        {"facu", "Facu y BNA", "Entregas del campus y de tus TPs."},
        {"river", "River y guiños", "Antes de cada partido y en las fechas especiales."},
        {"manana", "Resumen de la mañana", "Tu día en una línea."}
    };

    private Avisos() {}

    static String canalDe(String cat) {
        if ("bna".equals(cat)) return "facu";
        for (String[] c : CANALES) if (c[0].equals(cat)) return cat;
        return "manana";
    }

    static void canales(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        for (String[] k : CANALES) {
            int imp = k[0].equals("urgente") ? NotificationManager.IMPORTANCE_HIGH
                : k[0].equals("manana") ? NotificationManager.IMPORTANCE_LOW : NotificationManager.IMPORTANCE_DEFAULT;
            NotificationChannel ch = new NotificationChannel(k[0], k[1], imp);
            ch.setDescription(k[2]);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            nm.createNotificationChannel(ch);
        }
    }

    static boolean puede(Context c) {
        if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return false;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    // ---------- Bajar la agenda ----------

    /** Le pregunta a Orbe si hay agenda nueva (solo si pasó una hora o si se fuerza). Corre en el hilo del envío. */
    static void actualizar(Context c, String llave, boolean forzar) {
        Almacen a = new Almacen(c);
        long ahora = System.currentTimeMillis();
        if (!forzar && ahora - a.num("agendaCuando") < REVISAR) return;
        try {
            JSONObject cuerpo = new JSONObject();
            String v = a.texto("agendaV");
            // Si la agenda guardada se perdió, se pide de nuevo entera.
            cuerpo.put("v", v == null || agenda(a) == null ? "" : v);
            Satelite.Respuesta r = Satelite.post(Satelite.SERVIDOR + "/api/satelite/agenda", cuerpo.toString(), llave);
            if (r.codigo != 200) return;
            a.num("agendaCuando", ahora);
            JSONObject j = new JSONObject(r.cuerpo);
            if (j.optBoolean("igual")) return;
            JSONObject ag = j.optJSONObject("agenda");
            if (ag == null) return;
            a.guardar("agenda", ag.toString());
            a.texto("agendaV", j.optString("v", ""));
            programar(c);
        } catch (Exception e) { /* sin red: queda la agenda que había */ }
    }

    private static JSONObject agenda(Almacen a) {
        try {
            String s = a.leer("agenda");
            return s == null ? null : new JSONObject(s);
        } catch (Exception e) {
            a.guardar("agenda", null);
            return null;
        }
    }

    private static PendingIntent alarma(Context c, String id, boolean crear) {
        Intent i = new Intent(c, Alarma.class).setAction(ACCION).setData(Uri.parse("satelite://aviso/" + id));
        int f = PendingIntent.FLAG_IMMUTABLE | (crear ? PendingIntent.FLAG_UPDATE_CURRENT : PendingIntent.FLAG_NO_CREATE);
        return PendingIntent.getBroadcast(c, 0, i, f);
    }

    /** Programa los avisos que vienen (y cancela los que ya no están en la agenda). También al prender el celu. */
    static void programar(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Almacen a = new Almacen(c);
        JSONObject ag = agenda(a);
        Set<String> nuevos = new HashSet<>();
        long ahora = System.currentTimeMillis();
        String mostrados = a.texto("avisosMostrados");
        if (ag != null) {
            JSONArray l = ag.optJSONArray("avisos");
            for (int i = 0; l != null && i < l.length() && i < 40; i++) {
                JSONObject x = l.optJSONObject(i);
                if (x == null) continue;
                String id = x.optString("id");
                long ts = x.optLong("ts");
                if (!id.matches("[A-Za-z0-9_-]{1,24}") || ts <= ahora - TARDE) continue;
                if (mostrados != null && mostrados.contains("," + id + ",")) continue;
                nuevos.add(id);
                am.setWindow(AlarmManager.RTC_WAKEUP, Math.max(ts, ahora + 1000), VENTANA, alarma(c, id, true));
            }
        }
        String antes = a.texto("avisosProgramados");
        if (antes != null) {
            for (String id : antes.split(",")) {
                if (id.isEmpty() || nuevos.contains(id)) continue;
                PendingIntent p = alarma(c, id, false);
                if (p != null) { am.cancel(p); p.cancel(); }
            }
        }
        a.texto("avisosProgramados", nuevos.isEmpty() ? null : "," + String.join(",", nuevos) + ",");
    }

    /** Al desvincular: se cancela todo y se borra la agenda. */
    static void olvidar(Context c) {
        Almacen a = new Almacen(c);
        a.guardar("agenda", null);
        a.texto("agendaV", null);
        a.num("agendaCuando", 0);
        a.guardar("pagosHoy", null);
        programar(c);
    }

    // ---------- Mostrar ----------

    static boolean enSilencio(JSONObject cfg, long ts) {
        if (cfg == null) return false;
        int desde = cfg.optInt("desde", 0), hasta = cfg.optInt("hasta", 8);
        if (desde == hasta) return false;
        Calendar k = Calendar.getInstance();
        k.setTimeInMillis(ts);
        int h = k.get(Calendar.HOUR_OF_DAY);
        return desde < hasta ? h >= desde && h < hasta : h >= desde || h < hasta;
    }

    /** La alarma de un aviso sonó: se busca su texto (cifrado en el celu) y se publica una sola vez. */
    static void mostrar(Context c, String id) {
        if (!Satelite.vinculado(c)) return;
        Almacen a = new Almacen(c);
        JSONObject ag = agenda(a);
        if (ag == null || id == null) return;
        String mostrados = a.texto("avisosMostrados");
        if (mostrados != null && mostrados.contains("," + id + ",")) return;
        JSONArray l = ag.optJSONArray("avisos");
        JSONObject x = null;
        for (int i = 0; l != null && i < l.length(); i++) {
            JSONObject o = l.optJSONObject(i);
            if (o != null && id.equals(o.optString("id"))) { x = o; break; }
        }
        if (x == null) return;
        long ahora = System.currentTimeMillis();
        String m = (mostrados == null ? "," : mostrados) + id + ",";
        if (m.length() > 2000) m = "," + m.substring(m.length() - 1500).replaceFirst("^[^,]*,", "");
        a.texto("avisosMostrados", m);
        if (ahora - x.optLong("ts") > TARDE) return;
        if (enSilencio(ag.optJSONObject("cfg"), ahora) && !enSilencio(ag.optJSONObject("cfg"), x.optLong("ts"))) return;
        publicar(c, canalDe(x.optString("cat")), id.hashCode(), x.optString("titulo"), x.optString("texto"));
    }

    static void publicar(Context c, String canal, int nid, String titulo, String texto) {
        if (!puede(c) || titulo == null || titulo.isEmpty()) return;
        canales(c);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        Intent abrir = new Intent(Intent.ACTION_VIEW, Uri.parse(Satelite.SERVIDOR + "/")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(c, 0, abrir, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification publica = new Notification.Builder(c, canal).setSmallIcon(R.drawable.ic_aviso)
            .setContentTitle("Orbe").setContentText("Tenés un aviso.").build();
        Notification n = new Notification.Builder(c, canal)
            .setSmallIcon(R.drawable.ic_aviso)
            .setColor(0xFFC8102E)
            .setContentTitle(titulo)
            .setContentText(texto)
            .setStyle(new Notification.BigTextStyle().bigText(texto))
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setVisibility(Notification.VISIBILITY_PRIVATE)
            .setPublicVersion(publica)
            .build();
        nm.notify(nid, n);
    }

    // ---------- Al toque, después de un pago ----------

    static String pesos(double v) {
        return "$" + String.format(new Locale("es", "AR"), "%,.0f", Math.abs(v));
    }

    /** Lector leyó un pago: con la cuenta del día que mandó Orbe, «Gastaste $X en Y. Hoy te quedan $Z.» */
    static void pago(Context c, Lector.Aviso av) {
        if (av == null || !("pago".equals(av.sentido) || "tarjeta".equals(av.sentido)) || !"ARS".equals(av.moneda)) return;
        if (!Satelite.vinculado(c)) return;
        Almacen a = new Almacen(c);
        JSONObject ag = agenda(a);
        if (ag == null) return;
        JSONObject cfg = ag.optJSONObject("cfg");
        JSONObject d = ag.optJSONObject("diario");
        if (d == null || (cfg != null && !cfg.optBoolean("plata", true))) return;
        // «visto»: hasta qué hora Orbe ya contó los pagos del celu en su cuenta. Se suman los de hoy posteriores.
        long visto = d.optLong("visto", d.optLong("ts"));
        Calendar k = Calendar.getInstance();
        String hoy = String.format(Locale.ROOT, "%04d-%02d-%02d", k.get(Calendar.YEAR), k.get(Calendar.MONTH) + 1, k.get(Calendar.DAY_OF_MONTH));
        if (!hoy.equals(d.optString("fecha")) || av.ts <= visto) return;
        double suma = 0;
        JSONArray nuevos = new JSONArray();
        try {
            String g = a.leer("pagosHoy");
            JSONObject o = g == null ? null : new JSONObject(g);
            JSONArray l = o != null && hoy.equals(o.optString("fecha")) ? o.optJSONArray("l") : null;
            for (int i = 0; l != null && i < l.length() && i < 80; i++) {
                JSONObject p = l.optJSONObject(i);
                if (p == null || av.id.equals(p.optString("id"))) continue;
                nuevos.put(p);
                if (p.optLong("ts") > visto) suma += p.optDouble("m", 0);
            }
        } catch (Exception e) { /* se arranca de cero */ }
        suma += av.monto;
        try {
            nuevos.put(new JSONObject().put("id", av.id).put("ts", av.ts).put("m", av.monto));
            a.guardar("pagosHoy", new JSONObject().put("fecha", hoy).put("l", nuevos).toString());
        } catch (Exception e) { /* nada */ }
        if (enSilencio(cfg, System.currentTimeMillis())) return;
        double queda = d.optDouble("queda", 0) - suma;
        String titulo = "Gastaste " + pesos(av.monto) + (av.comercio.isEmpty() ? "" : " en " + av.comercio);
        String texto = queda >= 0 ? "Hoy te quedan " + pesos(queda) + "." : "Te pasaste " + pesos(queda) + " del día.";
        publicar(c, "plata", ("pago" + av.id).hashCode(), titulo.length() > 60 ? titulo.substring(0, 59) + "…" : titulo, texto);
    }
}
