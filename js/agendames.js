// Agenda › Mes: la grilla del mes con tu Google Calendar más lo que Orbe ya sabe
// (partidos de River, vencimientos y TPs, cobros, renovaciones y cumpleaños). Tocás un día y ves el detalle.
import { leer, sesion } from "./almacen.js";
import { cobroDe } from "./presupuesto.js";
import { todas as suscripciones, renovacionDelMes } from "./suscripciones.js";
import { colorTipo } from "./inicio.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const hhmm = (d) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");

export function mesActual(ctx) {
  const m = sesion("agendaMes");
  if (m) { const [y, mm] = m.split("-").map(Number); return { anio: y, mes: mm - 1 }; }
  return { anio: ctx.fecha.getFullYear(), mes: ctx.fecha.getMonth() };
}
export const claveMes = ({ anio, mes }) => anio + "-" + String(mes + 1).padStart(2, "0");
export function mesViejo(m) {
  const c = leer("agendaMeses", {})[claveMes(m)];
  return !c || Date.now() - c.cuando > 30 * 60000;
}

function color(datos, tipo, tema) {
  if (tipo === "venc") return "var(--accent)";
  if (tipo === "cobro") return "#1F9D55";
  if (tipo === "renueva") return "#EE7B30";
  if (tipo === "cumple") return "#E46A7E";
  if (tipo === "feriado") return "var(--muted)";
  return colorTipo(datos, datos.tipos[tipo] ? tipo : "otro", tema);
}

// Todo lo del mes, por día.
function itemsDelMes(datos, m) {
  const dias = {};
  const sumar = (d, x) => { (dias[d] = dias[d] || []).push(x); };
  const cache = leer("agendaMeses", {})[claveMes(m)];
  if (cache) Object.entries(cache.dias).forEach(([d, l]) => l.forEach((x) => sumar(d, { ...x })));
  const enMes = (d) => d.getFullYear() === m.anio && d.getMonth() === m.mes;
  // River: si el calendario «River» ya trae el partido, no se repite.
  const rv = leer("river");
  [...(rv?.proximos || []), ...(rv?.ultimos || [])].forEach((p) => {
    const f = new Date(p.fecha);
    if (!enMes(f)) return;
    const d = iso(f);
    if ((dias[d] || []).some((x) => x.tipo === "river")) return;
    const rival = String(p.rival || "").replace(/ Juniors$/, "");
    sumar(d, { tipo: "river", titulo: (p.local ? "River vs " : "River en cancha de ") + rival + (p.jugado && p.gf != null ? ` (${p.gf}-${p.gc})` : ""), inicio: p.hora === false ? "" : hhmm(f), a: f.getTime() });
  });
  // Vencimientos y TPs (lo mismo que Urgente, con su fecha).
  const vistos = new Set();
  (datos.pendientes || []).forEach((p) => {
    if (!p.fecha || vistos.has(p.clave)) return;
    vistos.add(p.clave);
    const [y, mm, dd] = String(p.fecha).split("-").map(Number);
    const f = new Date(y, mm - 1, dd);
    if (enMes(f) && !(dias[iso(f)] || []).some((x) => x.titulo === p.titulo)) sumar(iso(f), { tipo: "venc", titulo: (p.universo === "ufasta" ? "Entrega: " : "Vence: ") + p.titulo + (p.monto ? " · " + p.monto : "") });
  });
  // Cobro del mes y renovaciones.
  const c = cobroDe(m.anio, m.mes);
  sumar(iso(c.fecha), { tipo: "cobro", titulo: "Cobro" + (c.extras ? " · " + c.extras : "") });
  suscripciones().forEach((s) => {
    const r = renovacionDelMes(s, m.anio, m.mes);
    const desde = new Date(s.desde || s.renueva);
    if (r >= new Date(desde.getFullYear(), desde.getMonth(), 1)) sumar(iso(r), { tipo: "renueva", titulo: "Renueva " + s.nombre + " · " + (s.moneda === "USD" ? "US$ " : "$ ") + s.monto.toLocaleString("es-AR") });
  });
  return { dias, leido: cache ? cache.cuando : null };
}

export function renderMes(datos, ctx, tema, conGoogle) {
  const m = mesActual(ctx);
  const { dias, leido } = itemsDelMes(datos, m);
  const hoy = iso(ctx.fecha);
  const primero = new Date(m.anio, m.mes, 1);
  const enMesHoy = ctx.fecha.getFullYear() === m.anio && ctx.fecha.getMonth() === m.mes;
  let sel = sesion("agendaSel");
  if (!sel || !sel.startsWith(claveMes(m))) sel = enMesHoy ? hoy : iso(primero);
  const vacios = (primero.getDay() + 6) % 7; // la semana arranca el lunes
  const total = new Date(m.anio, m.mes + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < vacios; i++) celdas.push('<span class="dm vacia" aria-hidden="true"></span>');
  for (let d = 1; d <= total; d++) {
    const k = iso(new Date(m.anio, m.mes, d));
    const l = dias[k] || [];
    const finde = [(vacios + d - 1) % 7].some((x) => x >= 5);
    const marcas = l.slice(0, 4).map((x) => `<i style="background:${color(datos, x.tipo, tema)}"></i>`).join("") + (l.length > 4 ? `<small>+${l.length - 4}</small>` : "");
    const etiqueta = `${d} de ${MESES[m.mes]}${l.length ? ": " + l.length + (l.length === 1 ? " cosa" : " cosas") : ""}`;
    celdas.push(`<button class="dm ${k === hoy ? "hoy" : ""} ${k === sel ? "sel" : ""} ${finde ? "finde" : ""}" data-accion="mes-dia" data-d="${k}" aria-label="${etiqueta}" aria-pressed="${k === sel}"><b>${d}</b><span class="marcas">${marcas}</span></button>`);
  }
  const lista = (dias[sel] || []);
  const fSel = new Date(sel + "T12:00");
  const detalle = lista.length ? lista.map((x) => `<li><i class="dot" style="background:${color(datos, x.tipo, tema)}"></i><span class="t">${esc(x.titulo)}</span><span class="h">${x.todoElDia ? "todo el día" : x.inicio ? x.inicio + (x.fin ? "–" + x.fin : "") : ""}</span></li>`).join("")
    : '<li class="vacio">Nada anotado.</li>';
  const ref = [["bna", "BNA"], ["ufasta", "UFASTA"], ["river", "River"], ["venc", "Vencimientos"], ["cobro", "Cobro"], ["renueva", "Renovación"], ["cumple", "Cumple"]];
  return `<section class="bloque mes">
      <div class="mes-cab"><button class="icon-btn" data-accion="mes-nav" data-d="-1" aria-label="Mes anterior">‹</button>
        <h2>${MESES[m.mes]} ${m.anio !== ctx.fecha.getFullYear() ? m.anio : ""}</h2>
        <button class="icon-btn" data-accion="mes-nav" data-d="1" aria-label="Mes siguiente">›</button></div>
      <div class="mes-sem" aria-hidden="true">${["L", "M", "M", "J", "V", "S", "D"].map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="mes-grilla">${celdas.join("")}</div>
      <div class="mes-ref">${ref.map(([t, n]) => `<span><i style="background:${color(datos, t, tema)}"></i>${n}</span>`).join("")}</div>
    </section>
    <section class="bloque mes-det"><h2>${DIAS[fSel.getDay()]} ${fSel.getDate()} de ${MESES[fSel.getMonth()]}</h2><ul class="mes-lista">${detalle}</ul>
      <p class="fuente-dato">${conGoogle ? (leido ? "Tu Google Calendar, leído a las " + hhmm(new Date(leido)) + "." : "Leyendo tu Google Calendar…") : "Conectá Google en Ajustes para ver tu calendario acá."}</p></section>`;
}
