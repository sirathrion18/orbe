package ar.nacho.satelite;

import android.app.Notification;
import android.content.ComponentName;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * El oído de Satélite. Android le avisa de cada notificación, pero lo primero que hace es fijarse
 * de qué app es: si no es Mercado Pago, BNA+ o Personal Pay, la ignora sin leer nada más.
 */
public class Oido extends NotificationListenerService {
    private final ExecutorService cola = Executors.newSingleThreadExecutor();
    static volatile boolean conectado = false;

    @Override
    public void onListenerConnected() {
        conectado = true;
        Satelite.programar(this);
    }

    @Override
    public void onListenerDisconnected() {
        conectado = false;
        // Que Android lo vuelva a enganchar (pasa en Xiaomi después de matar la app o actualizarla).
        try { requestRebind(new ComponentName(this, Oido.class)); } catch (Exception e) { /* nada */ }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        final String app = Satelite.appDe(this, sbn.getPackageName());
        if (app == null) return; // otra app: ni se mira
        Notification n = sbn.getNotification();
        if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        Bundle e = n.extras;
        if (e == null) return;
        final String titulo = texto(e.getCharSequence(Notification.EXTRA_TITLE));
        String cuerpo = texto(e.getCharSequence(Notification.EXTRA_BIG_TEXT));
        if (cuerpo.isEmpty()) cuerpo = texto(e.getCharSequence(Notification.EXTRA_TEXT));
        final String t = cuerpo;
        final long cuando = sbn.getPostTime();
        cola.execute(() -> Satelite.registrar(getApplicationContext(), app, titulo, t, cuando));
    }

    private static String texto(CharSequence c) {
        return c == null ? "" : c.toString();
    }

    @Override
    public void onDestroy() {
        cola.shutdown();
        super.onDestroy();
    }
}
