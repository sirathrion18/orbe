// El contexto del momento: qué hora es, qué hay hoy y mañana, y en qué modo está Orbe.
import { sol } from "./sol.js";

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

export function bloquesDe(datos, diaSemana) {
  return (datos.rutina[String(diaSemana)] || [])
    .map((b) => ({ ...b, ini: aMin(b.inicio), fin: aMin(b.fin) }))
    .sort((a, b) => a.ini - b.ini);
}

const diasHasta = (desde, fechaISO) => {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const [y, m, d] = fechaISO.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d) - a) / 86400000);
};

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
  const hoy = bloquesDe(datos, dia);
  const manana = bloquesDe(datos, (dia + 1) % 7);

  const partido = hoy.find((b) => b.tipo === "river");
  const estreno = (datos.estrenos || []).map((e) => ({ ...e, dias: diasHasta(fecha, e.fecha) }))
    .filter((e) => e.dias >= 0).sort((a, b) => a.dias - b.dias)[0];
  const viaje = (datos.fechas || []).map((e) => ({ ...e, dias: diasHasta(fecha, e.fecha) }))
    .filter((e) => e.dias >= 0).sort((a, b) => a.dias - b.dias)[0];
  const diaDeGuino = fecha.getDate() === 7 || fecha.getDate() === 21; // uno o dos por mes
  const hayObligaciones = hoy.some((b) => b.tipo === "bna" || b.tipo === "ufasta");
  const cumple = datos.usuario.cumple &&
    datos.usuario.cumple === String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");

  let modo = "normal";
  if (demo) modo = demo;
  else if (partido && min < partido.fin + 180) modo = "river";
  else if (min >= 22 * 60 || min < 5 * 60) modo = "noche";
  else if ((estreno && estreno.dias <= 14) || diaDeGuino) modo = "marvel";
  else if (!hayObligaciones) modo = "libre";

  const s = sol(fecha, datos.ciudad.lat, datos.ciudad.lon);
  return { fecha, dia, min, hoy, manana, partido, estreno, viaje, cumple, modo, sol: s, demo: !!demo };
}

export function urgentes(datos, ctx) {
  const lista = (datos.pendientes || []).filter((p) =>
    ((p.tipo === "vencimiento" || p.tipo === "tarjeta") && p.dias < 7) ||
    (p.tipo === "facu" && p.dias < 3) || p.agus);
  lista.sort((a, b) => a.dias - b.dias);
  if (ctx.modo === "libre") return lista.filter((p) => p.dias <= 2);
  return lista;
}

export const cuandoTexto = (dias) => dias === 0 ? "hoy" : dias === 1 ? "mañana" : "en " + dias + " días";
