// Avisos de Orbe en el celu, por Satélite. Orbe arma la agenda de las próximas 36 horas (con el tono de Orbe y solo
// con datos que ya tiene: nada inventado), la deja cifrada en el buzón y Satélite la programa en el celu.
// Además manda «cuánto te queda hoy», así Satélite puede avisarte al toque después de cada pago.
// Lo que configurás (categorías, silencio, máximo por día) vive en «avisos» y se sincroniza entre celu y compu.
import { leer, guardar } from "./almacen.js";
import { pendientesCon, bloquesFecha, isoDe } from "./contexto.js";
import * as GUINOS from "./guinos.js";

export const CATEGORIAS = [
  ["plata", "Plata", "Vencimientos de tarjetas y pagos, y el aviso al toque después de cada gasto."],
  ["facu", "Facu y BNA", "Entregas del campus y de tus TPs (la víspera y el día)."],
  ["river", "River y guiños", "Una hora antes de cada partido, y las fechas especiales."],
  ["manana", "Resumen de la mañana", "Tu día en una línea: BNA, lo urgente y lo que tenés para gastar."]
];
export const AVISOS_DEF = { plata: true, facu: true, river: true, manana: true, hora: "08:00", desde: 0, hasta: 8, max: 6 };
export const configAvisos = () => ({ ...AVISOS_DEF, ...(leer("avisos") || {}) });
export function guardarAvisos(c) {
  const v = { ...configAvisos(), ...c };
  v.desde = Math.min(23, Math.max(0, Math.round(Number(v.desde) || 0)));
  v.hasta = Math.min(23, Math.max(0, Math.round(Number(v.hasta) || 0)));
  v.max = Math.min(12, Math.max(1, Math.round(Number(v.max) || 6)));
  if (!/^\d{2}:\d{2}$/.test(v.hora || "")) v.hora = AVISOS_DEF.hora;
  guardar("avisos", v);
  return v;
}

// Urgente gana a todo; el resumen de la mañana es lo primero que se cae si hay demasiados.
const PRIORIDAD = { urgente: 0, plata: 1, facu: 2, bna: 2, river: 3, manana: 4 };
const HORA = 3600000, VENTANA = 36 * HORA;

const pesos = (n) => "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR");
const corto = (t, n) => { const s = String(t ?? "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
const hhmm = (min) => String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
const enSilencio = (ts, c) => {
  const h = new Date(ts).getHours();
  if (c.desde === c.hasta) return false;
  return c.desde < c.hasta ? h >= c.desde && h < c.hasta : h >= c.desde || h < c.hasta;
};
// Un id corto y estable: el mismo aviso armado dos veces es el mismo (así el celu no lo programa dos veces).
function idDe(...partes) {
  let h = 2166136261;
  for (const ch of partes.join("|")) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
const a = (dia, hh, mm = 0) => { const d = new Date(dia); d.setHours(hh, mm, 0, 0); return d.getTime(); };
const diaDe = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };

/**
 * La agenda, sin tocar nada de afuera (así se puede probar):
 *   ahora, cfg, pendientes (con fecha AAAA-MM-DD, tipo, universo, titulo, monto, nota),
 *   river ({proximo}), bloques(fecha) → bloques del día, presupuesto(fecha) → { quedaHoy, diario, sinDiario, sinMargen, base },
 *   guinos(fecha) → [{ titulo, texto }] (opcional).
 */
export function armarAgenda(f) {
  const ahora = f.ahora, c = { ...AVISOS_DEF, ...(f.cfg || {}) };
  const hoy0 = new Date(ahora); hoy0.setHours(0, 0, 0, 0);
  const dias = [0, 1].map((k) => { const d = new Date(hoy0); d.setDate(d.getDate() + k); return d; });
  const out = [];
  const sumar = (cat, ts, titulo, texto) => {
    if (!(ts > ahora && ts <= ahora + VENTANA)) return;
    out.push({ id: idDe(cat, ts, titulo), ts, cat, titulo: corto(titulo, 60), texto: corto(texto, 160) });
  };
  const pend = (f.pendientes || []).filter((p) => p.fecha && /^\d{4}-\d{2}-\d{2}/.test(p.fecha));

  // Vencimientos: la víspera (plata 20:00, facu 19:00) y el mismo día a las 10 (urgente).
  for (const p of pend) {
    const dia = diaDe(p.fecha);
    const esPlata = p.universo === "finanzas" || p.tipo === "pago-tarjeta" || p.tipo === "tarjeta";
    const esFacu = p.universo === "ufasta" || p.tipo === "facu";
    const esBna = p.universo === "bna";
    if (!esPlata && !esFacu && !esBna) continue;
    if (esPlata && !c.plata) continue;
    if ((esFacu || esBna) && !c.facu) continue;
    const vispera = new Date(dia); vispera.setDate(vispera.getDate() - 1);
    const detalle = [p.nota, p.monto].filter(Boolean).join(" · ");
    if (esPlata) sumar("plata", a(vispera, 20), "Mañana vence " + p.titulo, (detalle ? detalle + ". " : "") + "Si ya lo pagaste, tildalo en Orbe y no te lo recuerdo más.");
    else sumar(esBna ? "bna" : "facu", a(vispera, 19), "Mañana vence " + p.titulo, (detalle ? detalle + ". " : "") + "¿Le metemos hoy?");
    sumar("urgente", a(dia, 10), "Hoy vence " + p.titulo, detalle || (esPlata ? "Que no se te pase." : "Último día."));
  }

  // River: una hora antes del partido (solo con la hora confirmada).
  const pr = f.river?.proximo;
  if (c.river && pr?.fecha && pr.hora !== false) {
    const t = new Date(pr.fecha).getTime();
    const rival = String(pr.rival || "").trim();
    if (rival) sumar("river", t - HORA, pr.clasico ? "En una hora: Superclásico" : "En una hora juega River",
      "Contra " + rival + (pr.local === true ? ", en el Monumental" : pr.local === false ? ", de visitante" : "") + ". Banda roja puesta.");
  }
  // Guiños con fecha (si guinos.js los tiene): a las 9 del día.
  if (c.river && typeof f.guinos === "function") {
    for (const d of dias) for (const g of f.guinos(d) || []) if (g?.titulo) sumar("river", a(d, 9), g.titulo, g.texto || "");
  }

  // Resumen de la mañana: a la hora que elegiste, con lo que ya se sabe de ese día.
  if (c.manana) {
    const [hh, mm] = c.hora.split(":").map(Number);
    for (const d of dias) {
      const partes = [];
      const bna = (f.bloques?.(d) || []).find((b) => b.tipo === "bna");
      if (bna) partes.push("BNA " + (bna.inicio || hhmm(bna.ini)) + " a " + (bna.fin != null && typeof bna.fin === "number" ? hhmm(bna.fin) : bna.fin));
      const iso = isoDe(d);
      const urg = pend.filter((p) => p.fecha.slice(0, 10) <= iso && p.fecha.slice(0, 10) >= isoDe(new Date(d.getTime() - 30 * 86400000)) && p.universo !== "semanal").length;
      partes.push(urg ? (urg === 1 ? "1 cosa urgente" : urg + " cosas urgentes") : "nada urgente");
      const b = c.plata && f.presupuesto ? f.presupuesto(d) : null;
      if (b && b.base != null && !b.sinDiario && !b.sinMargen && b.diario > 0) partes.push("para el día tenés " + pesos(b.diario));
      sumar("manana", a(d, hh, mm), "Buen día, Nacho.", partes.join(" · ") + ".");
    }
  }

  // Silencio, y como mucho «max» por día: se queda lo más importante.
  const vivos = out.filter((x) => !enSilencio(x.ts, c));
  const porDia = {};
  vivos.sort((x, y) => PRIORIDAD[x.cat] - PRIORIDAD[y.cat] || x.ts - y.ts).forEach((x) => {
    const k = isoDe(new Date(x.ts));
    (porDia[k] = porDia[k] || []).push(x);
  });
  const avisos = Object.values(porDia).flatMap((l) => l.slice(0, c.max)).sort((x, y) => x.ts - y.ts);

  // Lo que te queda hoy, para el aviso al toque de Satélite.
  const bh = c.plata && f.presupuesto ? f.presupuesto(new Date(ahora)) : null;
  const diario = bh && bh.base != null && bh.quedaHoy != null && !bh.sinDiario && !bh.sinMargen
    ? { fecha: isoDe(new Date(ahora)), queda: Math.round(bh.quedaHoy), ts: ahora } : null;
  return { avisos, diario, cfg: { desde: c.desde, hasta: c.hasta, plata: !!c.plata } };
}

// Con los datos reales de Orbe.
export async function agendaDeOrbe(datos, ahora = Date.now()) {
  const { presupuesto } = await import("./presupuesto.js");
  const fecha = new Date(ahora);
  return armarAgenda({
    ahora, cfg: configAvisos(),
    pendientes: pendientesCon(datos, fecha),
    river: leer("river"),
    bloques: (d) => bloquesFecha(datos, d),
    presupuesto: (d) => { try { return presupuesto(d); } catch (e) { return null; } },
    guinos: typeof GUINOS.fechasGuino === "function" ? GUINOS.fechasGuino : null
  });
}

// La huella de lo que importa (sin la hora en que se armó): si no cambió, no se manda.
const huella = (ag) => JSON.stringify([ag.avisos.map((x) => [x.id, x.texto]), ag.diario?.fecha, ag.diario?.queda, ag.cfg]);

/** Manda la agenda al buzón si hay un celu vinculado, si cambió y si pasaron 10 minutos desde la última vez. */
export async function mandarAgenda(datos, forzar = false) {
  const sat = leer("satelite");
  if (!sat?.dispositivos?.length) return { estado: "sin-celu" };
  const prev = leer("avisosEnvio") || {};
  if (!forzar && Date.now() - (prev.cuando || 0) < 10 * 60000) return { estado: "espera" };
  const ag = await agendaDeOrbe(datos);
  const h = huella(ag);
  if (!forzar && h === prev.huella) return { estado: "igual" };
  const r = await fetch("/api/satelite/avisos", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ag) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "servidor " + r.status);
  guardar("avisosEnvio", { cuando: Date.now(), huella: h, cantidad: ag.avisos.length, proximos: ag.avisos.slice(0, 3) }, true);
  return { estado: "mandada", cantidad: ag.avisos.length };
}
