// Productividad del BNA: tu puntaje diario, para saber cuánto te falta. La planilla oficial del banco es la que manda.
// Ni los pesos ni las metas viven en este código (es público): salen de la hoja PESOS_PRODUCTIVIDAD de tu planilla,
// que Orbe completa una vez desde «Orbe · semillas», en tu Drive. Solo tus números: nada de compañeros.
import { leer, guardar } from "./almacen.js";
import { leerRangos, escribirVarios, agregar, aFecha } from "./hoja.js";
import { api, pedirPase } from "./google.js";

export const HOJAS_PROD = {
  PESOS_PRODUCTIVIDAD: { cab: ["tarea", "puntos", "minutos", "grupo"], filas: [], semillas: "PESOS_PRODUCTIVIDAD" },
  // Las filas de arranque se suman por fecha + tarea: lo que ya cargaste no se pisa.
  PRODUCTIVIDAD: { cab: ["fecha", "tarea", "cantidad", "puntos"], filas: [], semillas: "PRODUCTIVIDAD", clave: [0, 1] }
};
export const HISTORICO = "Otras (histórico)";
// Fila que deja la comparación con la planilla del banco: el ajuste para que el día dé igual al oficial.
// Que exista quiere decir «día verificado».
export const OFICIAL = "Oficial (banco)";

const n = (v) => { const x = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(x) ? x : 0; };
const r4 = (x) => Math.round(x * 10000) / 10000;
export const isoHoy = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

export const datosProd = () => leer("prod");

export async function leerProd() {
  const [pesos, filas] = await leerRangos(["PESOS_PRODUCTIVIDAD!A2:D", "PRODUCTIVIDAD!A2:D"]);
  const p = {
    cuando: Date.now(),
    tareas: pesos.filter((f) => f[0] && String(f[3] || "").toLowerCase() !== "meta")
      .map((f, i) => ({ tarea: String(f[0]).trim(), puntos: n(f[1]), minutos: n(f[2]), grupo: String(f[3] || "otras").toLowerCase().trim() })),
    metas: pesos.filter((f) => String(f[3] || "").toLowerCase() === "meta" && f[0])
      .map((f) => ({ desde: aFecha(f[0]).slice(0, 10), meta: n(f[1]), minutos: n(f[2]) })).sort((a, b) => a.desde.localeCompare(b.desde)),
    filas: filas.filter((f) => f[0] && f[1]).map((f, i) => ({ fecha: aFecha(f[0]).slice(0, 10), tarea: String(f[1]).trim(), cantidad: n(f[2]), puntos: n(f[3]), fila: i + 2 })),
    filasPesos: pesos.map((f, i) => ({ tarea: String(f[0] || "").trim(), fila: i + 2 })).filter((x) => x.tarea)
  };
  guardar("prod", p, true);
  return p;
}

// Lo que tocaste y todavía no llegó a la planilla (sin señal, o esperando que dejes de tocar).
const pend = () => leer("prodPend", {});
const clave = (fecha, tarea) => fecha + "|" + tarea;

// Cantidades de un día: lo de la planilla, con lo pendiente encima.
export function cantidadesDe(fecha) {
  const p = datosProd();
  const c = {};
  (p?.filas || []).filter((f) => f.fecha === fecha).forEach((f) => { c[f.tarea] = { cantidad: f.cantidad, puntos: f.puntos }; });
  Object.entries(pend()).forEach(([k, v]) => {
    const [f, t] = k.split("|");
    if (f === fecha) c[t] = { cantidad: v.cantidad, puntos: v.puntos };
  });
  return c;
}

export const pesoDe = (tarea) => datosProd()?.tareas.find((t) => t.tarea === tarea);

// Meta y minutos efectivos que valen para una fecha.
export function metaDe(fecha) {
  const ms = datosProd()?.metas || [];
  return [...ms].reverse().find((m) => m.desde <= fecha) || null;
}

// Banda del día contra su meta: más de la meta Óptimo; hasta un 10% abajo Esperado; menos, Bajo.
export function banda(puntos, meta) {
  if (!meta) return null;
  if (puntos > meta + 1e-9) return { id: "optimo", txt: "Óptimo" };
  if (puntos >= meta * 0.9 - 1e-9) return { id: "esperado", txt: "Esperado" };
  return { id: "bajo", txt: "Bajo" };
}

// Resumen de un día: total, minutos usados y lo que falta en MS / cambios de cartera.
export function resumenDia(fecha) {
  const c = cantidadesDe(fecha);
  const p = datosProd();
  let total = 0, minutos = 0;
  Object.entries(c).forEach(([t, v]) => {
    total += v.puntos;
    const w = pesoDe(t);
    if (w) minutos += v.cantidad * w.minutos;
  });
  const m = metaDe(fecha);
  const unidad = p?.tareas.find((t) => t.grupo === "ms");
  const falta = m ? Math.max(0, m.meta - total) : 0;
  const nUnidades = unidad && falta > 1e-9 ? Math.ceil(falta / unidad.puntos - 1e-9) : 0;
  return { fecha, c, total, minutos, meta: m, falta, unidad, nUnidades, minutosFalta: nUnidades * (unidad?.minutos || 0) };
}

// Sumar o restar unidades de una tarea en un día. Se guarda al toque en el dispositivo y a los segundos en la planilla.
let timer = null;
export function cambiar(fecha, tarea, delta, alTerminar) {
  const w = pesoDe(tarea);
  if (!w) return;
  const actual = cantidadesDe(fecha)[tarea]?.cantidad || 0;
  fijar(fecha, tarea, Math.max(0, actual + delta), alTerminar);
}
export function fijar(fecha, tarea, cantidad, alTerminar) {
  const w = pesoDe(tarea);
  if (!w) return;
  const pp = pend();
  pp[clave(fecha, tarea)] = { cantidad, puntos: r4(cantidad * w.puntos) };
  guardar("prodPend", pp, true);
  clearTimeout(timer);
  timer = setTimeout(() => mandar().then(alTerminar, alTerminar), 2500);
}

// Presets de día tipo: fijan cargas y controles de un toque (lo demás no se toca).
export const PRESETS = [
  { id: "liviana", nombre: "Carga liviana", carga: 4, control: 0 },
  { id: "martes", nombre: "Martes carga total", carga: 6, control: 0 },
  { id: "pesada", nombre: "Carga pesada", carga: 7, control: 0 },
  { id: "control", nombre: "Día de control", carga: 3, control: 5 },
  { id: "fuerte", nombre: "Control fuerte", carga: 2, control: 6 },
  { id: "maximo", nombre: "Máximo de octubre", carga: 7, control: 2 }
];
export function presetPuntos(pr) {
  const t = datosProd()?.tareas || [];
  const c = t.find((x) => x.grupo === "carga"), k = t.find((x) => x.grupo === "control");
  return (c ? pr.carga * c.puntos : 0) + (k ? pr.control * k.puntos : 0);
}
export function aplicarPreset(fecha, id, alTerminar) {
  const pr = PRESETS.find((x) => x.id === id);
  const t = datosProd()?.tareas || [];
  const c = t.find((x) => x.grupo === "carga"), k = t.find((x) => x.grupo === "control");
  if (!pr || !c || !k) return;
  const pp = pend();
  pp[clave(fecha, c.tarea)] = { cantidad: pr.carga, puntos: r4(pr.carga * c.puntos) };
  pp[clave(fecha, k.tarea)] = { cantidad: pr.control, puntos: r4(pr.control * k.puntos) };
  guardar("prodPend", pp, true);
  clearTimeout(timer);
  timer = setTimeout(() => mandar().then(alTerminar, alTerminar), 600);
}

// Manda lo pendiente: actualiza la fila de esa tarea en ese día o agrega una nueva.
let mandando = null;
export function mandar() {
  if (mandando) return mandando;
  mandando = (async () => {
    const pp = pend();
    const claves = Object.keys(pp);
    if (!claves.length) return;
    const p = await leerProd();
    const existe = new Map(p.filas.map((f) => [clave(f.fecha, f.tarea), f.fila]));
    const cambios = [], nuevas = [];
    claves.forEach((k) => {
      const [fecha, tarea] = k.split("|");
      const fila = [fecha, tarea, pp[k].cantidad, pp[k].puntos];
      if (existe.has(k)) cambios.push({ range: "PRODUCTIVIDAD!A" + existe.get(k) + ":D" + existe.get(k), values: [fila] });
      else if (pp[k].cantidad > 0) nuevas.push(fila);
    });
    if (cambios.length) await escribirVarios(cambios);
    if (nuevas.length) await agregar("PRODUCTIVIDAD!A:D", nuevas);
    // Solo se borra lo que se mandó (si tocaste algo mientras tanto, queda para la próxima).
    const ahora = pend();
    claves.forEach((k) => { if (JSON.stringify(ahora[k]) === JSON.stringify(pp[k])) delete ahora[k]; });
    guardar("prodPend", ahora, true);
    await leerProd();
  })().finally(() => { mandando = null; });
  return mandando;
}
export const hayPendientes = () => Object.keys(pend()).length > 0;

// Pesos editables: se guardan en PESOS_PRODUCTIVIDAD. Los días ya cargados no cambian (sus puntos quedaron fijos).
export async function guardarPesos(lista) {
  const p = datosProd();
  const filaDe = new Map((p?.filasPesos || []).map((x) => [x.tarea, x.fila]));
  const cambios = [], nuevas = [];
  lista.forEach((t) => {
    const fila = [t.tarea, t.puntos, t.minutos, t.grupo];
    if (filaDe.has(t.original || t.tarea)) { const r = filaDe.get(t.original || t.tarea); cambios.push({ range: "PESOS_PRODUCTIVIDAD!A" + r + ":D" + r, values: [fila] }); }
    else nuevas.push(fila);
  });
  if (cambios.length) await escribirVarios(cambios);
  if (nuevas.length) await agregar("PESOS_PRODUCTIVIDAD!A:D", nuevas);
  return leerProd();
}

// Historial por día de un mes ("2026-10"): total, meta y banda; promedio y días en meta.
export function historial(mes, hoy = isoHoy()) {
  const p = datosProd();
  const dias = [...new Set([...(p?.filas || []).map((f) => f.fecha), ...Object.keys(pend()).map((k) => k.split("|")[0])])]
    .filter((f) => f.startsWith(mes)).sort();
  const lista = dias.map((f) => {
    const r = resumenDia(f);
    const b = banda(r.total, r.meta?.meta);
    // Hoy, mientras está en curso, no cuenta para el promedio ni se marca «Bajo».
    return { fecha: f, total: r.total, meta: r.meta?.meta || null, enCurso: f === hoy, verificado: !!r.c[OFICIAL], banda: f === hoy && b?.id === "bajo" ? null : b };
  }).filter((d) => d.total > 0);
  const cerrados = lista.filter((d) => !d.enCurso);
  const prom = cerrados.length ? cerrados.reduce((s, d) => s + d.total, 0) / cerrados.length : null;
  const enMeta = cerrados.filter((d) => d.meta && d.total >= d.meta - 1e-9).length;
  const metaMes = metaDe(mes + "-28");
  return { mes, dias: lista, cerrados: cerrados.length, promedio: prom, enMeta, meta: metaMes?.meta || null, banda: prom !== null ? banda(prom, metaMes?.meta) : null };
}
export const mesesConDatos = () => [...new Set((datosProd()?.filas || []).map((f) => f.fecha.slice(0, 7)))].sort();

// Fija una fila sin peso (el ajuste oficial): cantidad 1 = verificado, puntos = diferencia.
function fijarCrudo(fecha, tarea, cantidad, puntos) {
  const pp = pend();
  pp[clave(fecha, tarea)] = { cantidad, puntos: r4(puntos) };
  guardar("prodPend", pp, true);
}

// ---------- Comparar con la planilla oficial del banco ----------
// Lee el Excel de tu carpeta PRODUCTIVIDAD en Drive, hoja «Mediciones», y se queda SOLO con tu fila.
// Nada de compañeros se guarda: el archivo se lee en memoria y se descarta.
const TU_FILA = "Dubois";
const MESES_X = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
let cargandoX = null;
function cargarSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (cargandoX) return cargandoX;
  cargandoX = new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "vendor/sheetjs/xlsx.mini.min.js";
    s.onload = () => ok(window.XLSX); s.onerror = () => mal(new Error("sheetjs"));
    document.head.appendChild(s);
  });
  return cargandoX;
}

export function leerMediciones(XLSX, buffer, anioRef) {
  const wb = XLSX.read(buffer, { type: "array", sheets: ["Mediciones"] });
  const ws = wb.Sheets.Mediciones;
  if (!ws) return null;
  const filas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const cab = filas.find((r) => r && r.filter((v) => typeof v === "string" && /^\d{1,2}-[a-zé]{3}$/i.test(v.trim())).length > 5);
  const yo = filas.find((r) => r && r.some((v) => typeof v === "string" && v.trim().toLowerCase() === TU_FILA.toLowerCase()));
  if (!cab || !yo) return null;
  const dias = {};
  cab.forEach((h, i) => {
    const m = typeof h === "string" && h.trim().toLowerCase().match(/^(\d{1,2})-([a-zé]{3})$/);
    if (!m || !MESES_X[m[2]] || typeof yo[i] !== "number" || yo[i] <= 0) return;
    const mes = MESES_X[m[2]];
    const anio = mes > anioRef.mes + 1 ? anioRef.anio - 1 : anioRef.anio;
    dias[anio + "-" + String(mes).padStart(2, "0") + "-" + m[1].padStart(2, "0")] = Math.round(yo[i] * 100) / 100;
  });
  return dias;
}

// Los Excel de productividad que hay en tu Drive: los de la carpeta PRODUCTIVIDAD y cualquier otro que se llame así.
// Se saltean los «~$…» (archivos de bloqueo de Excel) y los vacíos. De cada uno se mira hasta qué día tiene tu fila.
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
async function archivosProd(XLSX) {
  const DRIVE = "https://www.googleapis.com/drive/v3/files";
  const q = (s) => DRIVE + "?fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc&pageSize=30&q=" + encodeURIComponent(s);
  const carpetas = (await api(q("name = 'PRODUCTIVIDAD' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"))).files || [];
  let todos = [];
  for (const c of carpetas) todos = todos.concat((await api(q(`'${c.id}' in parents and mimeType = '${XLSX_MIME}' and trashed = false`))).files || []);
  todos = todos.concat((await api(q(`name contains 'PRODUCTIVIDAD' and mimeType = '${XLSX_MIME}' and trashed = false`))).files || []);
  const vistos = new Set();
  const lista = todos.filter((f) => !vistos.has(f.id) && vistos.add(f.id) && !/^~\$/.test(f.name) && !(Number(f.size) > 0 && Number(f.size) < 2048))
    .sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime)).slice(0, 8);
  const out = [];
  for (const f of lista) {
    const r = await fetch(DRIVE + "/" + f.id + "?alt=media", { headers: { Authorization: "Bearer " + await pedirPase() } });
    if (!r.ok) continue;
    const mod = new Date(f.modifiedTime);
    let dias = null;
    try { dias = leerMediciones(XLSX, new Uint8Array(await r.arrayBuffer()), { anio: mod.getFullYear(), mes: mod.getMonth() + 1 }); } catch (e) { dias = null; }
    const ultimo = dias && Object.keys(dias).length ? Object.keys(dias).sort().pop() : null;
    out.push({ id: f.id, archivo: f.name, mod: f.modifiedTime, ultimo, dias });
  }
  guardar("prodArchivos", { cuando: Date.now(), lista: out.map(({ dias, ...x }) => x) }, true);
  return out;
}
export const datosArchivosProd = () => leer("prodArchivos");
export const archivoElegidoProd = () => leer("prodArchivo");
export function elegirArchivoProd(id) { guardar("prodArchivo", id || null, true); }

// Compara con el Excel elegido (o, si no elegiste, con el que tiene tu fila más al día).
export async function compararOficial() {
  const XLSX = await cargarSheetJS();
  const lista = await archivosProd(XLSX);
  if (!lista.length) throw new Error("sin-archivo");
  const con = lista.filter((f) => f.ultimo);
  const elegido = archivoElegidoProd();
  const mejor = con.find((f) => f.id === elegido) || con.sort((a, b) => b.ultimo.localeCompare(a.ultimo) || b.mod.localeCompare(a.mod))[0] || null;
  if (!mejor) throw new Error("sin-tu-fila");
  // Solo se compara desde que Orbe tiene datos tuyos (las semillas de octubre en adelante).
  const p = datosProd();
  const desde = (p?.filas || []).map((x) => x.fecha).sort()[0] || "0000";
  const res = { archivo: mejor.archivo, id: mejor.id, hasta: mejor.ultimo, verificados: 0, ajustados: 0, nuevos: 0 };
  Object.entries(mejor.dias).filter(([f]) => f >= desde).forEach(([fecha, oficial]) => {
    const c = cantidadesDe(fecha);
    const base = Object.entries(c).filter(([t]) => t !== OFICIAL).reduce((s, [, v]) => s + v.puntos, 0);
    const dif = r4(oficial - base);
    if (!Object.keys(c).filter((t) => t !== OFICIAL).length) res.nuevos++;
    else if (Math.abs(dif) < 0.01) res.verificados++;
    else res.ajustados++;
    fijarCrudo(fecha, OFICIAL, 1, Math.abs(dif) < 0.01 ? 0 : dif);
  });
  guardar("prodOficial", { cuando: Date.now(), ...res }, true);
  await mandar();
  return res;
}
