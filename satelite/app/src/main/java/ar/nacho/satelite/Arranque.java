package ar.nacho.satelite;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Al prender el celu (o al actualizar Satélite), se asegura de que el envío periódico siga programado. */
public class Arranque extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (Satelite.vinculado(c)) Satelite.programar(c);
    }
}
