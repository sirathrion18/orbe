package ar.nacho.satelite;

import android.app.job.JobParameters;
import android.app.job.JobService;

/** Cada 30 minutos (cuando Android lo junta con otras tareas y hay internet): manda lo pendiente. */
public class Envio extends JobService {
    @Override
    public boolean onStartJob(final JobParameters p) {
        new Thread(() -> {
            Satelite.reenganchar(getApplicationContext());
            try {
                Satelite.enviar(getApplicationContext(), false);
                if (Satelite.vinculado(getApplicationContext())) Avisos.programar(getApplicationContext());
            } catch (Exception e) { /* se reintenta en la próxima vuelta */ }
            jobFinished(p, false);
        }, "satelite-envio").start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters p) {
        return true;
    }
}
