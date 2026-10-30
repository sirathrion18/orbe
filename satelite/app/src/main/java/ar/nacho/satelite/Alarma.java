package ar.nacho.satelite;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

/** Sonó la alarma de un aviso de Orbe: lo publica (el texto se busca cifrado en el celu; acá solo llega el id). */
public class Alarma extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (i == null || !Avisos.ACCION.equals(i.getAction())) return;
        Uri u = i.getData();
        String id = u == null ? null : u.getLastPathSegment();
        if (id == null || !id.matches("[A-Za-z0-9_-]{1,24}")) return;
        final PendingResult pr = goAsync();
        new Thread(() -> {
            try { Avisos.mostrar(c.getApplicationContext(), id); } finally { pr.finish(); }
        }, "satelite-aviso").start();
    }
}
