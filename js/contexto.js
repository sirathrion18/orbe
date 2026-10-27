// El contexto del momento: qué hora es, qué hay hoy y mañana, y en qué modo está Orbe.
import { sol } from "./sol.js";
import { leer } from "./almacen.js";

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MODOS = ["normal", "libre", "river", "marvel", "noche"];

const aMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const hhmm = (min) => String(Math.floor(min / 60) % 24).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
export const duracion = (min) => {
  if (min < 60) return min + " min";
  const h = Math.floor(min / 60), m = min % 60;
  return m ? h + " h " + m : h + " h";
};

export const isoDe = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// Con Google conectado, los bloques salen de tu calendario real; si no, de la rutina de ejemplo.
export function bloquesFecha(datos, fecha) {
  if (datos.agenda) {
    const dia = isoDe(fecha);
    const lista = (datos.agenda.porDia[dia] || []).map((b) => ({ ...b }));
    // El horario fijo (cargado en Ajustes) rellena los días hábiles sin BNA en el calendario.
    const horario = leer("horario", {})[fecha.getDay()];
    const libre = datos.agenda.feriados?.[dia] || datos.agenda.libres?.[dia];
    if (horario && horario.inicio && horario.fin && !libre && !lista.some((b) => b.tipo === "bna")) {
      lista.push({ inicio: horario.inicio, fin: horario.fin, titulo: "BNA", tipo: "bna", fijo: true });
    }
    return lista.map((b) => ({ ...b, ini: aMin(b.inicio), fin: aMin(b.fin) })).sort((a, b) => a.ini - b.ini);
  }
  return bloquesDe(datos, fecha.getDay());
}

// Pendientes con los días contados desde la fecha que se mira, sin los marcados como hechos.
export function pendientesCon(datos, fecha) {
  const hechos = new Set(leer("hechos", []));
  return (datos.pendientes || [])
    .map((p) => ({ ...p, clave: p.clave || (p.titulo + "|" + (p.fecha || p.dias)).toLowerCase(), dias: p.fecha ? diasHasta(fecha, p.fecha) : p.dias }))
    .filter((p) => !hechos.has(p.clave))
    .sort((a, b) => a.dias - b.dias);
}

export function bloquesDe(datos, diaSemana) {
  return (datos.rutina[String(diaSemana)] || [])
    .map((b) => ({ ...b, ini: aMin(b.inicio), fin: aMin(b.fin) }))
    .sort((a, b) => a.ini - b.ini);
}

function diasHasta(desde, fechaISO) {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const [y, m, d] = fechaISO.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d) - a) / 86400000);
}

// Demo: cada modo se puede probar con un día y una hora de ejemplo.
const DEMOS = {
  normal: { dia: 2, min: 11 * 60 + 20 },
  libre: { dia: 6, min: 10 * 60 + 5 },
  river: { dia: 3, min: 17 * 60 + 40 },
  marvel: { dia: 2, min: 11 * 60 + 20 },
  noche: { dia: 2, min: 23 * 60 + 10 }
};

export function construirContexto(datos, demo) {
  const real = new Date();
  let fecha = real;
  if (demo && DEMOS[demo]) {
    const d = DEMOS[demo];
    fecha = new Date(real);
    fecha.setDate(real.getDate() + ((d.dia - real.getDay() + 7) % 7));
    fecha.setHours(Math.floor(d.min / 60), d.min % 60, 0, 0);
  }
  const dia = fecha.getDay();
  const min = fecha.getHours() * 60 + fecha.getMinutes();
  const base = demo ? { ...datos, agenda: null } : datos; // las pruebas usan la rutina de ejemplo
  const hoy = bloquesFecha(base, fecha);
  const manana = bloquesFecha(base, new Date(fecha.getTime() + 86400000));

  const iso = isoDe(fecha), isoManana = isoDe(new Date(fecha.getTime() + 86400000));
  const ag = base.agenda;
  const feriado = ag?.feriados?.[iso] || null;
  const diaLibre = ag?.libres?.[iso] || null;
  const cumpleHoy = ag?.cumples?.[iso] || [];
  const cumpleManana = ag?.cumples?.[isoManana] || [];
  const avisos = ag?.avisos?.[iso] || [];
  const partido = hoy.find((b) => b.tipo === "river");
  // El anillo pasa a mañana cuando termina tu último evento, nunca antes de las 21.
  const finUltimo = hoy.reduce((m, b) => Math.max(m, b.fin), 0);
  const corte = Math.max(21 * 60, finUltimo);
  const estreno = (datos.estrenos || []).map((e) => ({ ...e, dias: diasHasta(fecha, e.fecha) }))
    .filter((e) => e.dias >= 0).sort((a, b) => a.dias - b.dias)[0];
  const viaje = (datos.fechas || []).map((e) => ({ ...e, dias: diasHasta(fecha, e.fecha) }))
    .filter((e) => e.dias >= 0).sort((a, b) => a.dias - b.dias)[0];
  const diaDeGuino = fecha.getDate() === 7 || fecha.getDate() === 21; // uno o dos por mes
  const hayObligaciones = !feriado && !diaLibre && hoy.some((b) => b.tipo === "bna" || b.tipo === "ufasta");
  const cumple = datos.usuario.cumple &&
    datos.usuario.cumple === String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");

  let modo = "normal";
  if (demo) modo = demo;
  else if (partido && min < partido.fin + 60) modo = "river";
  else if (min < 5 * 60) modo = "madrugada";
  else if (min >= corte) modo = "noche";
  else if ((estreno && estreno.dias <= 14) || diaDeGuino) modo = "marvel";
  else if (!hayObligaciones) modo = "libre";

  const s = sol(fecha, datos.ciudad.lat, datos.ciudad.lon);
  return { fecha, dia, min, hoy, manana, partido, estreno, viaje, cumple, modo, sol: s, demo: !!demo,
    feriado, diaLibre, cumpleHoy, cumpleManana, avisos, corte };
}

export function urgentes(datos, ctx) {
  const lista = pendientesCon(datos, ctx.fecha).filter((p) => !p.vernet).filter((p) =>
    (p.dias < 0 && p.dias >= -30) ||
    ((p.tipo === "vencimiento" || p.tipo === "tarjeta") && p.dias <= 7) ||
    (p.tipo === "facu" && p.dias < 3) || p.agus);
  if (ctx.modo === "libre") return lista.filter((p) => p.dias <= 2);
  return lista;
}

export const cuandoTexto = (dias) =>
  dias < -1 ? "venció hace " + -dias + " días" : dias === -1 ? "venció ayer" :
  dias === 0 ? "hoy" : dias === 1 ? "mañana" : "en " + dias + " días";
