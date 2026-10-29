package ar.nacho.satelite;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.text.InputFilter;
import android.text.InputType;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Set;

/** La única pantalla: estado, vincular, permisos, qué escucha, envíos y ejemplos. Sobria, como Orbe. */
public class Principal extends Activity {
    private LinearLayout raiz;
    private boolean oscuro;
    private int cFondo, cTexto, cSuave, cTarjeta, cLinea, cAcento;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        oscuro = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        cFondo = oscuro ? 0xFF0B0B0C : 0xFFFFFFFF;
        cTexto = oscuro ? 0xFFF2F2F0 : 0xFF111113;
        cSuave = oscuro ? 0xFFA1A1A6 : 0xFF5F5F66;
        cTarjeta = oscuro ? 0xFF161618 : 0xFFF4F4F5;
        cLinea = oscuro ? 0xFF2A2A2E : 0xFFE4E4E8;
        cAcento = oscuro ? 0xFFF87171 : 0xFFC8102E;
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(cFondo);
        sv.setFillViewport(true);
        raiz = new LinearLayout(this);
        raiz.setOrientation(LinearLayout.VERTICAL);
        raiz.setPadding(dp(20), dp(28), dp(20), dp(40));
        sv.addView(raiz);
        setContentView(sv);
        getWindow().setStatusBarColor(cFondo);
        getWindow().setNavigationBarColor(cFondo);
        if (!oscuro) getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    }

    @Override
    protected void onResume() {
        super.onResume();
        pintar();
        // Al abrir la app se manda lo pendiente (si está vinculada).
        if (Satelite.vinculado(this)) {
            new Thread(() -> {
                String r = Satelite.enviar(getApplicationContext(), false);
                runOnUiThread(this::pintar);
            }).start();
            Satelite.programar(this);
        }
    }

    private void pintar() {
        raiz.removeAllViews();
        Almacen a = new Almacen(this);
        boolean vinc = Satelite.vinculado(this);
        boolean oye = Satelite.permiso(this);
        if (oye) Satelite.reenganchar(this);

        // Encabezado
        LinearLayout cab = fila();
        TextView t = texto("Satélite", 36, cTexto, false);
        t.setTypeface(Typeface.create(Typeface.SERIF, Typeface.NORMAL));
        cab.addView(t);
        View punto = new View(this);
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(cAcento);
        punto.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(9), dp(9));
        lp.setMargins(dp(6), dp(10), 0, 0);
        punto.setLayoutParams(lp);
        cab.addView(punto);
        raiz.addView(cab);
        raiz.addView(texto("La antena de Orbe en tu celu. Escucha solo Mercado Pago, BNA+ y Personal Pay, y la próxima alarma.", 15, cSuave, false));

        // 1. Vincular
        LinearLayout t1 = tarjeta("1 · Vincular con Orbe");
        if (vinc) {
            t1.addView(estado(true, "Vinculado" + (a.texto("nombre") != null ? " como «" + a.texto("nombre") + "»" : "")));
        } else {
            t1.addView(texto("En Orbe: Ajustes › Satélite › «Vincular un celu». Escribí acá el código que te muestra.", 14, cSuave, false));
            final EditText cod = new EditText(this);
            cod.setHint("Código de 8 letras");
            cod.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS | InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
            cod.setFilters(new InputFilter[]{new InputFilter.LengthFilter(9), new InputFilter.AllCaps()});
            cod.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
            cod.setTypeface(Typeface.MONOSPACE);
            cod.setTextColor(cTexto);
            cod.setHintTextColor(cSuave);
            cod.setGravity(Gravity.CENTER);
            t1.addView(cod);
            t1.addView(boton("Vincular", true, v -> {
                final String c = cod.getText().toString().replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
                if (c.length() != 8) { aviso("El código tiene 8 letras y números."); return; }
                v.setEnabled(false);
                new Thread(() -> {
                    String err = Satelite.vincular(getApplicationContext(), c);
                    if (err == null) Satelite.enviar(getApplicationContext(), true);
                    runOnUiThread(() -> { aviso(err == null ? "¡Listo! Satélite ya está en órbita." : err); pintar(); });
                }).start();
            }));
        }
        raiz.addView(t1);

        // 2. Permiso
        LinearLayout t2 = tarjeta("2 · Permiso para leer avisos");
        t2.addView(estado(oye, oye ? "Permiso dado" : "Falta el permiso"));
        if (!oye) {
            t2.addView(texto("Android lo pide para cualquier app que lea notificaciones. Satélite igual ignora todo lo que no sea de esas tres apps.", 14, cSuave, false));
            t2.addView(boton("Dar permiso", true, v -> startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))));
        }
        raiz.addView(t2);

        // 3. Que el sistema no lo cierre
        LinearLayout t3 = tarjeta("3 · Que el Xiaomi no lo cierre");
        t3.addView(texto("En los ajustes de la app: «Inicio automático» activado y «Ahorro de batería» en «Sin restricciones». Satélite no corre todo el tiempo: se despierta cada 30 minutos, manda en tanda y se vuelve a dormir.", 14, cSuave, false));
        t3.addView(boton("Abrir ajustes de Satélite", false, v -> startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())))));
        raiz.addView(t3);

        // Qué escucha
        LinearLayout t4 = tarjeta("Qué escucha");
        Set<String> inst = Satelite.instaladas(this);
        for (int i = 0; i < Satelite.CLAVES.length; i++) {
            String k = Satelite.CLAVES[i];
            long n = a.num("cap_" + k);
            t4.addView(par(Satelite.NOMBRES[i], (inst.contains(k) ? "instalada" : "no la encuentro") + (n > 0 ? " · " + n + " avisos" : "")));
        }
        long alarma = Satelite.proximaAlarma(this);
        long oido = a.num("ultimoOido");
        t4.addView(par("Último aviso leído", oido > 0 ? hace(oido) : "todavía ninguno"));
        t4.addView(par("Próxima alarma", alarma > 0 ? new SimpleDateFormat("EEE d · HH:mm", new Locale("es", "AR")).format(new Date(alarma)) : "ninguna"));
        raiz.addView(t4);

        // Envíos
        LinearLayout t5 = tarjeta("Envíos a Orbe");
        int pend = a.listaSegura("pendientes").length();
        long ult = a.num("ultimoEnvio");
        t5.addView(par("Esperando para mandar", String.valueOf(pend)));
        t5.addView(par("Último envío", ult > 0 ? hace(ult) : "todavía nada"));
        t5.addView(par("Mandados en total", String.valueOf(a.num("mandados"))));
        String err = a.texto("error");
        if (err != null) t5.addView(texto(err, 14, cAcento, false));
        if (vinc) t5.addView(boton("Mandar ahora", false, v -> {
            v.setEnabled(false);
            new Thread(() -> {
                String r = Satelite.enviar(getApplicationContext(), true);
                runOnUiThread(() -> { aviso(r); pintar(); });
            }).start();
        }));
        raiz.addView(t5);

        // Ejemplos
        LinearLayout t6 = tarjeta("Ejemplos (solo en este celu)");
        final JSONArray ej = a.listaSegura("ejemplos");
        if (ej.length() == 0) {
            t6.addView(texto("Cuando llegue un aviso de esas apps, aparece acá cómo lo leyó Satélite. Sirve para mejorar el lector: nunca sale del celu, salvo que lo copies vos.", 14, cSuave, false));
        } else {
            SimpleDateFormat f = new SimpleDateFormat("d/M HH:mm", new Locale("es", "AR"));
            for (int i = ej.length() - 1; i >= 0 && i >= ej.length() - 10; i--) {
                JSONObject o = ej.optJSONObject(i);
                if (o == null) continue;
                String leido = o.optString("leido");
                t6.addView(texto(Satelite.nombre(o.optString("app")) + " · " + f.format(new Date(o.optLong("ts"))), 12, cSuave, true));
                t6.addView(texto(o.optString("texto"), 14, cTexto, false));
                t6.addView(texto(leido.isEmpty() ? "No lo mandé (no es un pago claro)" : "Leído: " + leido, 13, leido.isEmpty() ? cSuave : cAcento, false));
            }
            LinearLayout b2 = fila();
            b2.addView(boton("Copiar para Claude", false, v -> {
                StringBuilder s = new StringBuilder("Ejemplos de Satélite " + Satelite.version(this) + ":\n");
                for (int i = 0; i < ej.length(); i++) {
                    JSONObject o = ej.optJSONObject(i);
                    if (o != null) s.append("- [").append(o.optString("app")).append("] ").append(o.optString("texto")).append(" → ").append(o.optString("leido", "")).append('\n');
                }
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Satélite", s.toString()));
                aviso("Copiado. Pegalo en el chat con Claude.");
            }));
            b2.addView(boton("Borrar", false, v -> { a.lista("ejemplos", null); pintar(); }));
            t6.addView(b2);
        }
        raiz.addView(t6);

        if (vinc) {
            TextView des = texto("Desvincular este celu", 14, cSuave, false);
            des.setPadding(0, dp(18), 0, dp(4));
            des.setGravity(Gravity.CENTER);
            des.setOnClickListener(v -> {
                a.guardar("llave", null);
                a.texto("nombre", null);
                aviso("Desvinculado. Para anularlo del todo, tocá «Anular» en Orbe › Ajustes › Satélite.");
                pintar();
            });
            raiz.addView(des);
        }
        TextView pie = texto("Satélite " + Satelite.version(this) + " · todo va cifrado y Orbe lo borra del buzón apenas lo pasa a tu planilla.", 12, cSuave, false);
        pie.setGravity(Gravity.CENTER);
        pie.setPadding(0, dp(10), 0, 0);
        raiz.addView(pie);
    }

    // ---------- Piezas ----------
    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private LinearLayout fila() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.HORIZONTAL);
        l.setGravity(Gravity.CENTER_VERTICAL);
        return l;
    }

    private TextView texto(String s, int sp, int color, boolean mayus) {
        TextView t = new TextView(this);
        t.setText(mayus ? s.toUpperCase(new Locale("es", "AR")) : s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setLineSpacing(0, 1.2f);
        if (mayus) { t.setLetterSpacing(0.08f); t.setTypeface(Typeface.DEFAULT_BOLD); }
        t.setPadding(0, dp(3), 0, dp(3));
        return t;
    }

    private LinearLayout tarjeta(String titulo) {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(18), dp(16), dp(18), dp(16));
        GradientDrawable g = new GradientDrawable();
        g.setColor(cTarjeta);
        g.setCornerRadius(dp(22));
        l.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, dp(14), 0, 0);
        l.setLayoutParams(lp);
        l.addView(texto(titulo, 11, cSuave, true));
        return l;
    }

    private View estado(boolean ok, String s) {
        TextView t = texto((ok ? "✓  " : "•  ") + s, 17, ok ? cTexto : cAcento, false);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private View par(String k, String v) {
        LinearLayout l = fila();
        l.setPadding(0, dp(6), 0, dp(6));
        TextView a = texto(k, 15, cTexto, false);
        a.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        TextView b = texto(v, 15, cSuave, false);
        l.addView(a);
        l.addView(b);
        return l;
    }

    private Button boton(String s, boolean lleno, View.OnClickListener al) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setTextColor(lleno ? cFondo : cTexto);
        GradientDrawable g = new GradientDrawable();
        g.setCornerRadius(dp(999));
        if (lleno) g.setColor(cTexto); else { g.setColor(Color.TRANSPARENT); g.setStroke(dp(1), cLinea); }
        b.setBackground(g);
        b.setPadding(dp(18), 0, dp(18), 0);
        b.setStateListAnimator(null);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44));
        lp.setMargins(0, dp(10), dp(8), 0);
        b.setLayoutParams(lp);
        b.setOnClickListener(al);
        return b;
    }

    private void aviso(String s) { Toast.makeText(this, s, Toast.LENGTH_LONG).show(); }

    private static String hace(long t) {
        long m = Math.max(0, (System.currentTimeMillis() - t) / 60000);
        if (m < 1) return "recién";
        if (m < 60) return "hace " + m + " min";
        if (m < 48 * 60) return "hace " + (m / 60) + " h";
        return "hace " + (m / 1440) + " días";
    }
}
