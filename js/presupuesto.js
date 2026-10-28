// Presupuesto diario, de cobro a cobro.
// La base sale de tu planilla ECONOMÍA (la columna del mes que vivís con ese sueldo): Ingresos − TOTAL = lo que queda
// para el día a día. Cada día podés gastar lo que queda dividido por los días hasta el próximo cobro.
// Cuentan los gastos de todos los días (débito, transferencia, MP, efectivo y compras con tarjeta), de lo compartido solo
// tu mitad. No cuentan los fijos que ya están en la planilla, los pasajes ni los pases entre tus cuentas.
// Lo que te pasa Agus por la división va a un colchón aparte.
import { leer, guardar } from "./almacen.js";
import { leerRangos } from "./hoja.js";
import { datosEconomia, MESES_AR } from "./economia.js";
import { datosFinanzas, actualizarMovs } from "./finanzas.js";
import { estimadoNeto } from "./escalafon.js";

const dos = (n) => String(n).padStart(2, "0");
export const iso = (d) => d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate());
const dia0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const UMBRAL = 5000;
// Rubros que ya están en tu planilla como egreso fijo (o que dijiste que no cuentan): no tocan el diario.
export const FIJOS = ["Vivienda", "Servicios", "Transporte"];

// ---------- Hojas propias (COBROS y AJUSTES) ----------
export const HOJAS_PRESU = {
  COBROS: { cab: ["fecha", "extras"], filas: [], semillas: "COBROS", clave: [0] },
  AJUSTES: { cab: ["concepto", "monto", "desde", "cuota_desde", "cuotas", "nota"], filas: [], semillas: "AJUSTES", clave: [0] }
};
export async function leerConfigPresu() {
  const [cobros, ajustes] = await leerRangos(["COBROS!A2:B", "AJUSTES!A2:F"]);
  const c = {
    cuando: Date.now(),
    cobros: cobros.filter((f) => /^\d{4}-\d{2}-\d{2}/.test(String(f[0]))).map((f) => ({ fecha: String(f[0]).slice(0, 10), extras: String(f[1] || "") })),
    ajustes: ajustes.filter((f) => f[0]).map((f) => ({ concepto: String(f[0]), monto: Number(f[1]) || 0, desde: String(f[2] || "").slice(0, 7),
      cuotaDesde: Number(f[3]) || 1, cuotas: Number(f[4]) || 1, nota: String(f[5] || "") }))
  };
  guardar("presuConfig", c, true);
  return c;
}
const config = () => leer("presuConfig", { cobros: [], ajustes: [] });

// ---------- El período ----------
// Fecha de cobro de un mes: la de tu calendario de cobros; si no está, el 28 (o el hábil anterior si cae en finde).
function cobroDe(anio, mes) {
  const k = anio + "-" + dos(mes + 1);
  const c = config().cobros.find((x) => x.fecha.startsWith(k));
  if (c) { const [y, m, d] = c.fecha.split("-").map(Number); return { fecha: new Date(y, m - 1, d), extras: c.extras }; }
  const d = new Date(anio, mes, 28);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return { fecha: d, extras: "" };
}
export function periodo(hoy) {
  const h = dia0(hoy);
  let c = cobroDe(h.getFullYear(), h.getMonth());
  if (c.fecha > h) { const p = new Date(h.getFullYear(), h.getMonth() - 1, 1); c = cobroDe(p.getFullYear(), p.getMonth()); }
  const sig0 = new Date(c.fecha.getFullYear(), c.fecha.getMonth() + 1, 1);
  const sig = cobroDe(sig0.getFullYear(), sig0.getMonth());
  const fin = new Date(sig.fecha.getTime() - 86400000);
  // La columna de tu planilla es la del mes en que cae el próximo cobro (octubre = lo cobrado el 28/9).
  const col = { anio: sig.fecha.getFullYear(), mes: sig.fecha.getMonth() };
  const restantes = Math.round((fin - h) / 86400000) + 1;
  return { inicio: c.fecha, fin, proximo: sig.fecha, extrasProximo: sig.extras, extrasHoy: c.extras, col,
    clave: col.anio + "-" + dos(col.mes + 1), nombre: MESES_AR[col.mes].toLowerCase(), dias: Math.round((fin - c.fecha) / 86400000) + 1, restantes };
}

// ---------- Qué cuenta ----------
const esManual = (m) => m.fuente === "A mano";
export function cuentaEnDiario(m) {
  if (!m || m.moneda === "USD" || m.cruce && !esManual(m)) return false; // el mail que se unió con lo que cargaste: cuenta una sola vez
  if (m.diario === "no" || m.diario === "dup" || m.diario === "agus") return false;
  if (m.diario === "sí") return m.clase === "gasto" || m.clase === "gasto-tarjeta" || m.clase === "devolucion";
  if (m.clase === "devolucion") return !FIJOS.includes(m.rubro);
  return (m.clase === "gasto" || m.clase === "gasto-tarjeta") && !FIJOS.includes(m.rubro);
}
const parte = (m) => (m.monto || 0) * (m.mitad ? 0.5 : 1) * (m.clase === "devolucion" ? -1 : 1);
const enRango = (m, a, b) => m.ts >= a.getTime() && m.ts < b.getTime() + 86400000;

// El día que Orbe empezó a llevar tu diario (queda guardado y se sincroniza).
function arranque() {
  const p = leer("presupuesto", {});
  if (!p._desde) { p._desde = dia0(new Date()).getTime(); guardar("presupuesto", p); }
  return p._desde;
}

// Ingreso del período: tu planilla manda; si está vacío, lo que confirmaste en Orbe; si no, una propuesta.
function ingresoDe(p) {
  const eco = datosEconomia();
  const col = eco && String(eco.anio) === String(p.col.anio) ? eco.meses[p.col.mes] : null;
  if (col?.ingresos) return { monto: col.ingresos, fuente: "tu planilla ECONOMÍA" };
  const conf = leer("presupuesto", {})[p.clave];
  if (conf?.confirmado) return { monto: conf.ingreso, fuente: "confirmado en Orbe" };
  // Propuesta: el neto del recibo que se cobró al empezar el período (antes del talón: PP + Gym ya está en tus egresos).
  const reg = (datosFinanzas()?.meses || []).find((x) => x.mes === p.clave);
  const neto = reg && /neto \$\s?([\d.]+)/i.exec(reg.fuente || "");
  const monto = neto ? Number(neto[1].replace(/\./g, "")) : reg?.disponible || null;
  if (monto) return { monto, fuente: neto ? "neto de tu recibo (propuesta)" : "disponible de tu recibo (propuesta)", propuesta: true };
  // Sin recibo todavía: lo estimo con la grilla de tu cargo y lo que te llegó neto la última vez.
  const [y, m] = p.clave.split("-").map(Number);
  const mesRecibo = new Date(y, m - 2, 1);
  const est = estimadoNeto(mesRecibo.getFullYear() + "-" + dos(mesRecibo.getMonth() + 1));
  return { monto: est?.neto || null, fuente: est ? "estimado con la grilla (propuesta)" : null, propuesta: true };
}

// Cuota de un ajuste (ej. el lavarropas) en un período: «4 de 12», o null si ya terminó o no empezó.
export function cuotaDe(a, clave) {
  if (!a.desde) return null;
  const [y0, m0] = a.desde.split("-").map(Number), [y, m] = clave.split("-").map(Number);
  const n = a.cuotaDesde + (y - y0) * 12 + (m - m0);
  return n >= a.cuotaDesde && n <= a.cuotas ? n : null;
}

export function presupuesto(hoy = new Date()) {
  const p = periodo(hoy);
  const eco = datosEconomia();
  const col = eco && String(eco.anio) === String(p.col.anio) ? eco.meses[p.col.mes] : null;
  const fin = datosFinanzas();
  const movs = fin?.movs || [];
  const ing = ingresoDe(p);
  const total = col?.total ?? null;
  // Compras con tarjeta del período anterior que ya pesaron en el diario: vienen dentro del resumen que pagás ahora.
  const pAnt = periodo(new Date(p.inicio.getTime() - 86400000));
  // Solo las que Orbe ya contó en un diario: desde el día que empezó a llevarlo (antes, tu planilla las tenía en su línea).
  const desde = arranque();
  const tarjetaAnterior = movs.filter((m) => m.clase === "gasto-tarjeta" && enRango(m, pAnt.inicio, pAnt.fin) && m.ts >= desde && cuentaEnDiario(m)).reduce((s, m) => s + parte(m), 0);
  const base = ing.monto != null && total != null ? ing.monto - total + tarjetaAnterior : null;
  const delPeriodo = movs.filter((m) => m.ts && enRango(m, p.inicio, p.fin));
  const contados = delPeriodo.filter(cuentaEnDiario);
  const h = dia0(hoy);
  const hoyISO = iso(h);
  const gastoHoy = contados.filter((m) => iso(new Date(m.ts)) === hoyISO).reduce((s, m) => s + parte(m), 0);
  const gastoAntes = contados.filter((m) => m.ts < h.getTime()).reduce((s, m) => s + parte(m), 0);
  const gastoTotal = gastoAntes + gastoHoy;
  // El diario de hoy: lo que quedaba al empezar el día, repartido en los días que faltan (hoy incluido).
  const diario = base != null ? (base - gastoAntes) / Math.max(1, p.restantes) : null;
  const quedaHoy = diario != null ? diario - gastoHoy : null;
  const queda = base != null ? base - gastoTotal : null;
  // Mañana: lo que quede, repartido en los días que faltan.
  const diarioManana = base != null && p.restantes > 1 ? (base - gastoTotal) / (p.restantes - 1) : null;
  // Colchón: lo que te pasa Agus por la división (su mitad menos los descuentos acordados, como el lavarropas).
  const agus = delPeriodo.filter((m) => m.diario === "agus").reduce((s, m) => s + (m.monto || 0), 0);
  const div = eco?.division?.actual;
  const ajustes = config().ajustes.map((a) => ({ ...a, cuota: cuotaDe(a, p.clave) })).filter((a) => a.cuota);
  const esperadoAgus = div?.mitad ? div.mitad - ajustes.reduce((s, a) => s + a.monto, 0) : null;
  const porDia = {};
  contados.forEach((m) => { const d = iso(new Date(m.ts)); porDia[d] = (porDia[d] || 0) + parte(m); });
  return { p, col, ingreso: ing, total, tarjetaAnterior, base, diario, gastoHoy, quedaHoy, queda, gastoTotal, diarioManana,
    pasado: diario != null && diario > 0 && quedaHoy < 0, sinDiario: base != null && base <= 0, agus, esperadoAgus, ajustes, division: div, contados, porDia };
}

// ---------- Cruce entre lo que cargás y lo que llega por mail ----------
// Mismo monto (±1%) dentro de 24 h: se unen y cuenta una sola vez (el que cargaste, con tu categoría y tu mitad).
export function buscarCruces(movs) {
  const libres = movs.filter((m) => !m.cruce && (m.clase === "gasto" || m.clase === "gasto-tarjeta") && m.moneda !== "USD");
  const manuales = libres.filter(esManual), mails = libres.filter((m) => !esManual(m));
  const usados = new Set(), cambios = [];
  manuales.forEach((a) => {
    const b = mails.find((x) => !usados.has(x.id) && Math.abs(x.ts - a.ts) <= 86400000 && Math.abs((x.monto || 0) - (a.monto || 0)) <= Math.max(1, a.monto * 0.01));
    if (!b) return;
    usados.add(b.id);
    cambios.push({ id: a.id, cruce: b.id }, { id: b.id, cruce: a.id, diario: "dup" });
  });
  return cambios;
}
export async function cruzar() {
  const fin = datosFinanzas();
  if (!fin) return 0;
  const c = buscarCruces(fin.movs);
  if (c.length) await actualizarMovs(c);
  return c.length / 2;
}

// ---------- Preguntas ----------
// Lo que no coincide te lo pregunta Orbe en Inicio, de a uno: gastos de mail desde $5.000 que no cargaste,
// ingresos que no sabe de dónde vienen y gastos que cargaste (no en efectivo) que nunca aparecieron en un mail.
export function preguntas(hoy = new Date()) {
  const fin = datosFinanzas();
  if (!fin) return [];
  const desde = Math.max(periodo(hoy).inicio.getTime(), arranque());
  const ahora = hoy.getTime();
  const out = [];
  fin.movs.filter((m) => m.ts >= desde && !m.cruce && m.moneda !== "USD" && !/^resumen/i.test(m.fuente || "")).forEach((m) => {
    if (esManual(m)) {
      if (!/efectivo/i.test(m.medio) && m.diario === "sí" && ahora - m.ts > 2 * 86400000 && !m.nota.includes("sin mail"))
        out.push({ id: m.id, tipo: "manual", m, texto: "Lo cargaste pero no apareció en ningún mail", botones: [["efectivo", "Fue en efectivo"], ["dejar", "Dejarlo así"], ["borrar", "No va"]] });
      return;
    }
    if (m.diario) return; // ya respondido
    if ((m.clase === "gasto" || m.clase === "gasto-tarjeta") && !FIJOS.includes(m.rubro) && (m.monto || 0) >= UMBRAL)
      out.push({ id: m.id, tipo: "gasto", m, texto: "Llegó por mail y no lo cargaste", botones: [["mio", "Mío"], ["dos", "De los dos"], ["fijo", "Fijo de la planilla"], ["no", "No es gasto"]] });
    else if (m.clase === "ingreso" && (m.monto || 0) >= UMBRAL)
      out.push({ id: m.id, tipo: "ingreso", m, texto: "Te entró plata", botones: [["agus", "Agus (división)"], ["otro", "Otro ingreso"], ["propia", "Pase entre mis cuentas"]] });
  });
  return out.sort((a, b) => b.m.ts - a.m.ts);
}
export async function responder(id, r) {
  const fin = datosFinanzas();
  const m = fin?.movs.find((x) => x.id === id);
  if (!m) return;
  const c = { id };
  if (r === "mio") Object.assign(c, { diario: "sí", mitad: false });
  else if (r === "dos") Object.assign(c, { diario: "sí", mitad: true });
  else if (r === "fijo" || r === "no") Object.assign(c, { diario: "no" });
  else if (r === "agus") Object.assign(c, { diario: "agus" });
  else if (r === "otro") Object.assign(c, { diario: "no" });
  else if (r === "propia") Object.assign(c, { diario: "no", clase: "propia" });
  else if (r === "efectivo") Object.assign(c, { medio: "Efectivo" });
  else if (r === "dejar") Object.assign(c, { nota: (m.nota ? m.nota + " · " : "") + "sin mail" });
  else if (r === "borrar") Object.assign(c, { diario: "no", nota: (m.nota ? m.nota + " · " : "") + "borrado en Orbe" });
  return actualizarMovs([c]);
}

// Lo que confirmás como ingreso del período cuando tu planilla todavía no lo tiene.
export function confirmarIngreso(clave, monto) {
  const p = leer("presupuesto", {});
  p[clave] = { ingreso: monto, confirmado: true, cuando: Date.now() };
  guardar("presupuesto", p);
}
