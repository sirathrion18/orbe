// Tu planilla de siempre ("ECONOMÍA"): Orbe la lee tal como la cargás y la muestra más clara.
// Solo escribe la fila «Suscripciones» de Egresos, y solo si lo aprobaste (ver suscripciones.js). Entiende tres hojas: la del año (meses en columnas), DIVISIÓN (lo compartido con Agus)
// y ALIAS CBU (tus cuentas y las promos por día).
import { api } from "./google.js";
import { leer, guardar } from "./almacen.js";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets/";
export const MESES_AR = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const normal = (t) => String(t ?? "").trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const num = (v) => {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^\d,.-]/g, "");
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/\./g, ""));
  return Number.isFinite(n) ? n : null;
};

export const idEconomia = () => leer("economia");
export const linkEconomia = () => idEconomia() ? "https://docs.google.com/spreadsheets/d/" + idEconomia() + "/edit" : null;
export const datosEconomia = () => leer("economiaDatos");

export function fijarEconomia(texto) {
  const t = String(texto || "").trim();
  const m = t.match(/\/d\/([\w-]{20,})/) || t.match(/^([\w-]{20,})$/);
  if (!m) return false;
  guardar("economia", m[1]);
  return true;
}

// La hoja del año: fila 1 con los meses, columna A con los conceptos.
export function leerAnio(filas) {
  const cab = (filas[0] || []).map(normal);
  const meses = MESES_AR.map((m) => cab.indexOf(m));
  const fila = (nombre) => filas.find((f) => normal(f[0]) === nombre);
  const ingresos = fila("INGRESOS"), total = fila("TOTAL"), saldo = fila("SALDO"), semanal = fila("SEMANAL"), diario = fila("DIARIO");
  const iEgr = filas.findIndex((f) => normal(f[0]) === "EGRESOS");
  const iTot = filas.findIndex((f) => normal(f[0]) === "TOTAL");
  const conceptos = iEgr >= 0 && iTot > iEgr ? filas.slice(iEgr + 1, iTot).filter((f) => String(f[0] ?? "").trim()) : [];
  return MESES_AR.map((nombre, i) => {
    const c = meses[i];
    if (c < 0) return null;
    const egresos = conceptos.map((f) => ({ concepto: String(f[0]).trim(), monto: num(f[c]) })).filter((e) => e.monto);
    const ing = ingresos ? num(ingresos[c]) : null;
    const tot = total ? num(total[c]) : egresos.reduce((s, e) => s + e.monto, 0);
    if (!ing && !egresos.length) return null; // mes sin cargar
    const todos = conceptos.map((f) => ({ concepto: String(f[0]).trim(), monto: num(f[c]) || 0 }));
    return { mes: i, nombre, ingresos: ing, egresos: egresos.sort((a, b) => b.monto - a.monto), todos, total: tot,
      saldo: saldo ? num(saldo[c]) : (ing || 0) - (tot || 0), semanal: semanal ? num(semanal[c]) : null, diario: diario ? num(diario[c]) : null };
  });
}

// DIVISIÓN: bloques "Gasto | Monto" uno al lado del otro. Se queda con el último que tenga algo cargado.
export function leerDivision(filas) {
  const bloques = [];
  filas.forEach((f, r) => f.forEach((v, c) => {
    if (normal(v) !== "GASTO") return;
    const items = [];
    let total = null, mitad = null;
    for (let k = r + 1; k < filas.length; k++) {
      const n = normal(filas[k][c]);
      if (!n) break;
      const m = num(filas[k][c + 1]);
      if (n === "TOTAL") total = m; else if (n === "MITAD") { mitad = m; break; } else items.push({ concepto: String(filas[k][c]).trim(), monto: m || 0 });
    }
    bloques.push({ items, total, mitad, orden: bloques.length });
  }));
  const cargados = bloques.filter((b) => b.total > 0 && b.items.filter((i) => i.monto > 0).length >= 3);
  return { actual: cargados[cargados.length - 1] || null, anterior: cargados[cargados.length - 2] || null, cantidad: cargados.length };
}

// ALIAS CBU: cuentas (A:C) y promociones por día (columnas LUNES…DOMINGO).
const DIAS_AR = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
export function leerAlias(filas) {
  const cab = (filas[0] || []).map(normal);
  const cuentas = filas.slice(1).filter((f) => f[0] && (f[1] || f[2])).map((f) => ({ banco: String(f[0]).trim(), cbu: String(f[1] ?? "").trim(), alias: String(f[2] ?? "").trim() }));
  const promos = {};
  DIAS_AR.forEach((d, i) => {
    const c = cab.indexOf(d);
    let ultima = null;
    promos[i] = [];
    if (c < 0) return;
    filas.slice(1).forEach((f) => {
      let v = String(f[c] ?? "").trim();
      if (!v) return;
      if (/^promociones$/i.test(v)) return;
      if (v !== ultima) promos[i].push(v);
      ultima = v;
    });
  });
  return { cuentas, promos };
}

// Las celdas combinadas traen el valor solo en la primera: lo copio a todas las que abarca.
export function rellenar(filas, combinadas) {
  const out = filas.map((f) => [...f]);
  (combinadas || []).forEach((m) => {
    const v = (filas[m.startRowIndex] || [])[m.startColumnIndex];
    if (v === undefined || v === "") return;
    for (let r = m.startRowIndex; r < m.endRowIndex; r++) {
      out[r] = out[r] || [];
      for (let c = m.startColumnIndex; c < m.endColumnIndex; c++) out[r][c] = v;
    }
  });
  return out;
}

export async function leerEconomia() {
  const id = idEconomia();
  if (!id) return null;
  const meta = await api(BASE + id + "?fields=sheets(properties.title,merges)");
  const titulos = (meta.sheets || []).map((s) => s.properties.title);
  const merges = Object.fromEntries((meta.sheets || []).map((s) => [s.properties.title, s.merges || []]));
  const anio = String(new Date().getFullYear());
  const hojaAnio = titulos.find((t) => t.trim() === anio) || titulos.filter((t) => /^\d{4}$/.test(t.trim())).sort().pop();
  const hojaDiv = titulos.find((t) => normal(t).startsWith("DIVISION"));
  const hojaAlias = titulos.find((t) => normal(t).includes("ALIAS"));
  // Las otras hojas de años (2024, 2025…), para ver tu historia en Finanzas › Planilla.
  const otrosAnios = titulos.filter((t) => /^\d{4}$/.test(t.trim()) && t !== hojaAnio).sort();
  const rangos = [hojaAnio, hojaDiv, hojaAlias, ...otrosAnios].filter(Boolean).map((t) => "'" + t.replace(/'/g, "''") + "'!A1:Z60");
  const q = rangos.map((r) => "ranges=" + encodeURIComponent(r)).join("&");
  const j = await api(BASE + id + "/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&" + q);
  const v = (j.valueRanges || []).map((x) => x.values || []);
  let k = 0;
  const datos = {
    cuando: Date.now(), anio: hojaAnio,
    meses: hojaAnio ? leerAnio(v[k++]) : [],
    division: hojaDiv ? leerDivision(v[k++]) : null,
    alias: hojaAlias ? leerAlias(rellenar(v[k++], merges[hojaAlias])) : null
  };
  datos.anios = {};
  if (hojaAnio) datos.anios[hojaAnio.trim()] = datos.meses;
  otrosAnios.forEach((t) => { datos.anios[t.trim()] = leerAnio(v[k++] || []); });
  guardar("economiaDatos", datos, true);
  return datos;
}
