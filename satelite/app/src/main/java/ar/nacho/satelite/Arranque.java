package ar.nacho.satelite;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Al prender el celu (o al actualizar Satélite), se asegura de que el envío periódico siga programado
 * y vuelve a programar los avisos de Orbe (Android borra las alarmas al reiniciar).
 */
public class Arranque extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (!Satelite.vinculado(c)) return;
        Satelite.programar(c);
        final PendingResult pr = goAsync();
        new Thread(() -> {
            try { Avisos.programar(c.getApplicationContext()); } finally { pr.finish(); }
        }, "satelite-arranque").start();
    }
}
