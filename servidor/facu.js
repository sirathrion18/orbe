// Clasifica los asuntos de los mails del aula virtual de UFASTA.
const limpiar = (t) => String(t || "").replace(/\s+/g, " ").trim();

export function leerAsunto(asunto) {
  const a = limpiar(asunto);
  let m = a.match(/^Usted ha realizado su entrega en la tarea (.+)$/i);
  if (m) return { tipo: "entrega", titulo: m[1] };
  m = a.match(/^(.+?) ha hecho un comentario en la tarea (.+)$/i);
  if (m) return { tipo: "devolucion", titulo: m[2], quien: m[1] };
  m = a.match(/^Mensaje nuevo de \((.+)\)$/i);
  if (m) return { tipo: "mensaje", titulo: "Mensaje de " + m[1], quien: m[1] };
  m = a.match(/^Confirmación de inscripción a examen final/i);
  if (m) return { tipo: "examen", titulo: "Inscripción a examen final confirmada" };
  m = a.match(/^([A-Z]{2,4}\d{2,4})[-\w]*:\s*(.+)$/);
  if (m) {
    const resto = m[2];
    if (/^Recordatorio:\s*/i.test(resto)) return { tipo: "recordatorio", codigo: m[1], titulo: resto.replace(/^Recordatorio:\s*/i, "") };
    if (/clase|semana|disponible|subid|actividad|unidad/i.test(resto)) return { tipo: "clase", codigo: m[1], titulo: resto };
    return { tipo: "aviso", codigo: m[1], titulo: resto };
  }
  m = a.match(/^OVAA[^:]*:\s*(.+)$/);
  if (m) return { tipo: "general", titulo: m[1] };
  return null;
}

