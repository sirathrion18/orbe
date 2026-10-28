// Escalafón del BNA (rama Administrativa). Los datos viven en tu planilla, no en este código:
//   ESCALAFON: la grilla base (cargo, coeficiente, sueldo, ROE, devolución de aportes) de un mes de referencia.
//   CONFORMADOS: el sueldo mínimo («conformado», el de Auxiliar E) de cada mes.
//   BANCARIO: la fórmula del Día del Bancario de cada año (suma fija + valor por coeficiente).
// Cada mes todos los cargos suben en la misma proporción que el conformado: cargo = cargo base × (conformado ÷ conformado base).
import { leer, guardar } from "./almacen.js";
import { leerRangos, agregar } from "./hoja.js";
import { datosFinanzas } from "./finanzas.js";

export const HOJAS_ESC = {
  ESCALAFON: { cab: ["cargo", "coef", "sueldo", "roe", "dev", "base", "rama", "tuyo"], filas: [], semillas: "ESCALAFON" },
  CONFORMADOS: { cab: ["mes", "conformado", "fuente"], filas: [], semillas: "CONFORMADOS", clave: [0] },
  BANCARIO: { cab: ["anio", "suma_fija", "por_coef", "fuente"], filas: [], semillas: "BANCARIO", clave: [0] }
};
const n = (v) => { if (typeof v === "number") return v; const x = Number(String(v ?? "").replace(/\./g, "").replace(",", ".")); return Number.isFinite(x) ? x : 0; };

export const datosEsc = () => leer("escalafon");
export async function leerEscalafon() {
  const [esc, conf, banc] = await leerRangos(["ESCALAFON!A2:H", "CONFORMADOS!A2:C", "BANCARIO!A2:D"]);
  const e = {
    cuando: Date.now(),
    cargos: esc.filter((f) => f[0] && n(f[2])).map((f) => ({ cargo: String(f[0]).trim(), coef: n(f[1]), sueldo: n(f[2]), roe: n(f[3]), dev: n(f[4]),
      base: String(f[5] || "").slice(0, 7), rama: String(f[6] || "Administrativa"), tuyo: /^(s[ií]|x|1)$/i.test(String(f[7] || "").trim()) })),
    conformados: conf.filter((f) => /^\d{4}-\d{2}/.test(String(f[0])) && n(f[1])).map((f, i) => ({ mes: String(f[0]).slice(0, 7), conformado: n(f[1]), fuente: String(f[2] || ""), i }))
      .sort((a, b) => a.mes.localeCompare(b.mes) || a.i - b.i),
    bancario: banc.filter((f) => f[0]).map((f) => ({ anio: String(f[0]).slice(0, 4), fija: n(f[1]), porCoef: n(f[2]), fuente: String(f[3] || "") }))
  };
  guardar("escalafon", e, true);
  return e;
}

// El conformado que vale para un mes: el de ese mes o el último anterior.
export function conformadoDe(mes, e = datosEsc()) {
  const cs = e?.conformados || [];
  return [...cs].reverse().find((c) => c.mes <= mes) || null;
}

// Un cargo en un mes, escalado desde la grilla base.
export function cargoEn(c, mes, e = datosEsc()) {
  // La base es el conformado con el que se tomó la grilla (el primero cargado para ese mes); para el mes pedido vale el último.
  const base = (e?.conformados || []).find((x) => x.mes === c.base) || conformadoDe(c.base, e), ahora = conformadoDe(mes, e);
  if (!base || !ahora) return null;
  const f = ahora.conformado / base.conformado;
  const esMinimo = Math.abs(c.sueldo - base.conformado) < 2; // la fila del conformado (Auxiliar E) va exacta
  const sueldo = esMinimo ? ahora.conformado : Math.round(c.sueldo * f / 100) * 100;
  const roe = Math.round(c.roe * f), dev = Math.round(c.dev * f / 10) * 10;
  return { ...c, mes: ahora.mes, sueldo, roe, dev, total: sueldo + roe + dev, bancario: bancarioDe(c.coef, mes.slice(0, 4), e) };
}
export function bancarioDe(coef, anio, e = datosEsc()) {
  const b = (e?.bancario || []).find((x) => x.anio === anio) || [...(e?.bancario || [])].sort((x, y) => y.anio.localeCompare(x.anio))[0];
  return b ? Math.round(b.fija + b.porCoef * coef) : null;
}

export const tuCargo = (e = datosEsc()) => e?.cargos.find((c) => c.tuyo) || null;

// El cargo siguiente en la carrera (un coeficiente más arriba en la misma familia de puestos).
export function proximoCargo(e = datosEsc()) {
  const yo = tuCargo(e);
  if (!yo) return null;
  const familia = yo.cargo.replace(/\s+[A-E]$/, "");
  const misma = e.cargos.filter((c) => c.cargo.replace(/\s+[A-E]$/, "") === familia && c.coef > yo.coef).sort((a, b) => a.coef - b.coef);
  return misma[0] || e.cargos.filter((c) => c.coef > yo.coef).sort((a, b) => a.coef - b.coef)[0] || null;
}

// Tus recibos (de la hoja MES): mes del recibo y neto.
export function recibos() {
  return (datosFinanzas()?.meses || []).map((m) => {
    const r = /Recibo (\d{2})\/(\d{4}).*?neto \$\s?([\d.]+)/i.exec(m.fuente || "");
    return r ? { mes: r[2] + "-" + r[1], neto: Number(r[3].replace(/\./g, "")), disponible: m.disponible } : null;
  }).filter(Boolean).sort((a, b) => a.mes.localeCompare(b.mes));
}

// Grilla contra recibo: cuánto de lo que dice la grilla te llega neto. Y con eso, una estimación del próximo recibo.
export function grillaVsRecibo(e = datosEsc()) {
  const yo = tuCargo(e);
  const rs = recibos();
  const ult = rs[rs.length - 1];
  if (!yo || !ult) return null;
  const g = cargoEn(yo, ult.mes, e);
  if (!g) return null;
  return { recibo: ult, grilla: g, proporcion: ult.neto / g.total, descuentos: g.total - ult.neto };
}
export function estimadoNeto(mes, e = datosEsc()) {
  const v = grillaVsRecibo(e);
  const yo = tuCargo(e);
  if (!v || !yo) return null;
  const g = cargoEn(yo, mes, e);
  return g ? { neto: Math.round(g.total * v.proporcion), grilla: g, proporcion: v.proporcion } : null;
}

export async function cargarConformado(mes, monto, fuente) {
  await agregar("CONFORMADOS!A:C", [[mes, monto, fuente || "Cargado en Orbe"]]);
  return leerEscalafon();
}
