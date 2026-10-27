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

export const agregar = (rango, filas) =>
  api(BASE + idHoja() + "/values/" + encodeURIComponent(rango) + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS", "POST", { values: filas });

// Crea las hojas que falten (con sus encabezados y, si hay, filas de arranque). Una vez por día alcanza.
export async function asegurarHojas(spec) {
  const meta = await api(BASE + idHoja() + "?fields=sheets.properties.title");
  const hay = new Set((meta.sheets || []).map((s) => s.properties.title));
  const faltan = Object.keys(spec).filter((t) => !hay.has(t));
  // Hojas que ya existen pero quedaron vacías: si hay semillas, se completan.
  const vaciasConSemilla = Object.keys(spec).filter((t) => hay.has(t) && spec[t].semillas);
  if (vaciasConSemilla.length) {
    const actuales = await leerRangos(vaciasConSemilla.map((t) => t + "!A2:A"));
    const vacias = vaciasConSemilla.filter((t, i) => !actuales[i].length);
    if (vacias.length) {
      const sem = await leerSemillas(vacias.map((t) => spec[t].semillas));
      for (const t of vacias) if (sem[spec[t].semillas]?.length) await agregar(t + "!A:Z", sem[spec[t].semillas]);
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
    return Object.fromEntries(hojas.map((h, i) => [h, (r.valueRanges?.[i]?.values || []).map((fila) => fila.map((v) => typeof v === "number" && v > 30000 && v < 80000 ? aFecha(v) : String(v)))]));
  } catch (e) { return {}; }
}
