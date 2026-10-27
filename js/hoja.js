// La planilla "Orbe · datos" en tu Drive (Google Sheets). Orbe solo toca esta planilla.
import { api } from "./google.js";
import { leer, guardar } from "./almacen.js";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets/";
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
  if (!faltan.length) return [];
  await api(BASE + idHoja() + ":batchUpdate", "POST", { requests: faltan.map((t) => ({ addSheet: { properties: { title: t } } })) });
  for (const t of faltan) {
    const { cab, filas = [] } = spec[t];
    await escribir(t + "!A1:" + String.fromCharCode(64 + cab.length) + (filas.length + 1), [cab, ...filas]);
  }
  return faltan;
}
