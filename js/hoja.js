// La planilla "Orbe · datos" en tu Drive (Google Sheets). Orbe solo toca esta planilla.
import { api } from "./google.js";
import { leer, guardar } from "./almacen.js";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets/";
const dos = (n) => String(n).padStart(2, "0");
// Las fechas pueden llegar como texto ISO, como número de serie de Sheets o como "d/m/aaaa hh:mm".
export function aFecha(v) {
  const t = String(v ?? "").trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 16);
  if (/^\d{4,5}(\.\d+)?$/.test(t)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(Number(t) * 86400) * 1000);
    const f = d.getUTCFullYear() + "-" + dos(d.getUTCMonth() + 1) + "-" + dos(d.getUTCDate());
    return Number(t) % 1 ? f + "T" + dos(d.getUTCHours()) + ":" + dos(d.getUTCMinutes()) : f;
  }
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return m[3] + "-" + dos(m[2]) + "-" + dos(m[1]) + (m[4] ? "T" + dos(m[4]) + ":" + m[5] : "");
  return t;
}

export const idHoja = () => leer("hoja");
export const linkHoja = () => idHoja() ? "https://docs.google.com/spreadsheets/d/" + idHoja() + "/edit" : null;

// Acepta el link completo de la planilla o solo el ID.
export function fijarHoja(texto) {
  const t = String(texto || "").trim();
  const m = t.match(/\/d\/([\w-]{20,})/) || t.match(/^([\w-]{20,})$/);
  if (!m) return false;
  guardar("hoja", m[1], true);
  return true;
}

export async function leerRangos(rangos) {
  const q = rangos.map((r) => "ranges=" + encodeURIComponent(r)).join("&");
  const j = await api(BASE + idHoja() + "/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&" + q);
  return (j.valueRanges || []).map((v) => v.values || []);
}

export const escribir = (rango, filas) =>
  api(BASE + idHoja() + "/values/" + encodeURIComponent(rango) + "?valueInputOption=RAW", "PUT", { range: rango, values: filas });

export const escribirVarios = (datos) =>
  api(BASE + idHoja() + "/values:batchUpdate", "POST", { valueInputOption: "RAW", data: datos });

export const agregar = (rango, filas) =>
  api(BASE + idHoja() + "/values/" + encodeURIComponent(rango) + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS", "POST", { values: filas });

// Crea las hojas que falten (con sus encabezados y, si hay, filas de arranque). Una vez por día alcanza.
export async function asegurarHojas(spec) {
  const meta = await api(BASE + idHoja() + "?fields=sheets.properties.title");
  const hay = new Set((meta.sheets || []).map((s) => s.properties.title));
  const faltan = Object.keys(spec).filter((t) => !hay.has(t));
  // Hojas que ya existen y tienen semillas: si quedaron vacías se completan; si tienen clave, se suman las filas que falten.
  const conSemilla = Object.keys(spec).filter((t) => hay.has(t) && spec[t].semillas);
  if (conSemilla.length) {
    const actuales = await leerRangos(conSemilla.map((t) => t + "!A2:" + String.fromCharCode(64 + spec[t].cab.length)));
    const pedir = conSemilla.filter((t, i) => !actuales[i].length || spec[t].clave);
    if (pedir.length) {
      const sem = await leerSemillas(pedir.map((t) => spec[t].semillas));
      for (const t of pedir) {
        const filas = sem[spec[t].semillas] || [];
        if (!filas.length) continue;
        const act = actuales[conSemilla.indexOf(t)];
        const k = spec[t].clave;
        const llave = (f) => k.map((i) => String(f[i] ?? "").slice(0, i === 0 ? 10 : 200).trim()).join("|");
        const ya = new Set(k ? act.map((f) => llave([aFecha(f[0]), ...f.slice(1)])) : []);
        const faltan2 = !act.length ? filas : k ? filas.filter((f) => !ya.has(llave(f))) : [];
        if (faltan2.length) await agregar(t + "!A:Z", faltan2);
      }
    }
  }
  if (!faltan.length) return [];
  await api(BASE + idHoja() + ":batchUpdate", "POST", { requests: faltan.map((t) => ({ addSheet: { properties: { title: t } } })) });
  let semillas = {};
  if (faltan.some((t) => spec[t].semillas)) semillas = await leerSemillas(faltan.filter((t) => spec[t].semillas).map((t) => spec[t].semillas));
  for (const t of faltan) {
    const { cab } = spec[t];
    const filas = (spec[t].filas || []).concat(semillas[spec[t].semillas] || []);
    await escribir(t + "!A1:" + String.fromCharCode(64 + cab.length) + (filas.length + 1), [cab, ...filas]);
  }
  return faltan;
}

// Filas de arranque privadas: una planilla «Orbe · semillas» en tu Drive (necesita el permiso de leer Drive).
async function leerSemillas(hojas) {
  try {
    const q = encodeURIComponent("name = 'Orbe · semillas' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const f = (await api("https://www.googleapis.com/drive/v3/files?fields=files(id)&q=" + q)).files || [];
    if (!f[0]) return {};
    const r = await api(BASE + f[0].id + "/values:batchGet?valueRenderOption=UNFORMATTED_VALUE&" + hojas.map((h) => "ranges=" + encodeURIComponent(h + "!A2:Z")).join("&"));
    return Object.fromEntries(hojas.map((h, i) => [h, (r.valueRanges?.[i]?.values || []).map((fila) => fila.map((v) => typeof v === "number" && v > 30000 && v < 80000 ? aFecha(v) : v))]));
  } catch (e) { return {}; }
}

// El LEEME de la planilla: suma la explicación de las hojas nuevas, en el mismo estilo («HOJA: qué guarda»),
// antes del renglón en blanco del final. Lo que ya está no se toca.
export async function asegurarLeeme(lineas) {
  const meta = await api(BASE + idHoja() + "?fields=sheets.properties(title,sheetId)");
  const hoja = (meta.sheets || []).find((x) => x.properties.title === "LEEME");
  if (!hoja) return 0;
  const [col] = await leerRangos(["LEEME!A1:A60"]);
  const textos = col.map((f) => String(f[0] || ""));
  const faltan = lineas.filter((l) => !textos.some((t) => t.startsWith(l.split(":")[0] + ":")));
  if (!faltan.length) return 0;
  // Después de la última línea «HOJA: …» (las hojas van en mayúsculas).
  let ult = -1;
  textos.forEach((t, i) => { if (/^[A-ZÁÉÍÓÚÑ_]{3,}:/.test(t)) ult = i; });
  const en = ult >= 0 ? ult + 1 : textos.length;
  await api(BASE + idHoja() + ":batchUpdate", "POST", { requests: [{ insertDimension: {
    range: { sheetId: hoja.properties.sheetId, dimension: "ROWS", startIndex: en, endIndex: en + faltan.length }, inheritFromBefore: en > 0 } }] });
  await escribir("LEEME!A" + (en + 1) + ":A" + (en + faltan.length), faltan.map((l) => [l]));
  return faltan.length;
}
