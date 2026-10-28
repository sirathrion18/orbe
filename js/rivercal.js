// Calendario «River» en tu Google Calendar: Orbe lo crea una vez y le carga los próximos partidos.
// Cada partido tiene un id fijo (el de ESPN), así nunca se duplica; si cambia la fecha o la hora, se actualiza.
import { api, permisos } from "./google.js";
import { leer, guardar } from "./almacen.js";

const CAL = "https://www.googleapis.com/calendar/v3/calendars";
const NOMBRE = "River";
const PROMIEDOS = "https://www.promiedos.com.ar/team/river-plate/igi";

// Los ids de Google aceptan solo letras de la a a la v y números.
const idDe = (p) => "riverespn" + String(p.id).toLowerCase().replace(/[^a-v0-9]/g, "");

export const calendarioRiverListo = () => !!leer("riverCal")?.id;

async function asegurarCalendario() {
  const guardado = leer("riverCal");
  if (guardado?.id) {
    try { await api(CAL + "/" + encodeURIComponent(guardado.id)); return guardado.id; } catch (e) { if (e.message !== "no-existe") throw e; }
  }
  // Si ya existe uno creado por Orbe en otro dispositivo, se reusa.
  const lista = await api("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner");
  const ya = (lista.items || []).find((c) => c.summary === NOMBRE && /creado por orbe/i.test(c.description || ""));
  const id = ya ? ya.id : (await api(CAL, "POST", { summary: NOMBRE, description: "Partidos de River. Creado por Orbe: se actualiza solo.", timeZone: "America/Argentina/Buenos_Aires" })).id;
  guardar("riverCal", { id, desde: Date.now() });
  return id;
}

function eventoDe(p) {
  const rival = String(p.rival || "").replace(/ Juniors$| Club$/, "");
  const titulo = (p.local ? "River vs " + rival : rival + " vs River") + (p.torneo ? " · " + p.torneo : "");
  const desc = [p.estadio, p.hora === false ? "Horario a confirmar." : "", "Seguilo en Promiedos: " + PROMIEDOS].filter(Boolean).join("\n");
  const ini = new Date(p.fecha);
  if (p.hora === false) {
    // Sin hora confirmada: evento de día completo; cuando ESPN confirme la hora, pasa a tener horario.
    const d = (x) => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
    const sig = new Date(ini); sig.setDate(sig.getDate() + 1);
    return { summary: titulo + " (hora a confirmar)", description: desc, start: { date: d(ini) }, end: { date: d(sig) } };
  }
  const fin = new Date(ini.getTime() + 2 * 3600000);
  return { summary: titulo, description: desc, start: { dateTime: ini.toISOString() }, end: { dateTime: fin.toISOString() },
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] } };
}

const igual = (ev, nuevo) => ev.summary === nuevo.summary &&
  (ev.start?.dateTime ? new Date(ev.start.dateTime).getTime() : ev.start?.date) === (nuevo.start.dateTime ? new Date(nuevo.start.dateTime).getTime() : nuevo.start.date);

// Se corre al actualizar: como mucho cada 6 horas, o al toque si cambió la lista de partidos.
export async function sincronizarRiver(forzar) {
  if (!permisos().calPropios) return { estado: "sin-permiso" };
  const rv = leer("river");
  const proximos = (rv?.proximos || []).filter((p) => p.id && p.fecha);
  if (!proximos.length) return { estado: "sin-partidos" };
  const huella = proximos.map((p) => p.id + p.fecha + p.hora).join("|");
  const prev = leer("riverCalSinc");
  if (!forzar && prev && prev.huella === huella && Date.now() - prev.cuando < 6 * 3600000) return { estado: "al-dia", ...prev };
  const cal = await asegurarCalendario();
  let creados = 0, cambiados = 0;
  for (const p of proximos) {
    const nuevo = eventoDe(p);
    const url = CAL + "/" + encodeURIComponent(cal) + "/events/" + idDe(p);
    let ev = null;
    try { ev = await api(url); } catch (e) { if (e.message !== "no-existe") throw e; }
    if (!ev) { await api(CAL + "/" + encodeURIComponent(cal) + "/events", "POST", { id: idDe(p), ...nuevo }); creados++; }
    else if (ev.status === "cancelled" || !igual(ev, nuevo)) {
      // Se reemplaza entero, así un partido que pasa de "a confirmar" a tener hora queda bien.
      await api(url, "PUT", { ...nuevo, status: "confirmed" }); cambiados++;
    }
  }
  const r = { huella, cuando: Date.now(), partidos: proximos.length, creados, cambiados };
  guardar("riverCalSinc", r, true);
  return { estado: "ok", ...r };
}
