// El Semanal (y El Diario) dentro de Orbe. Las ediciones siguen viviendo en tu Drive; Orbe busca la última,
// la guarda en este dispositivo para leerla sin señal y saca de ahí el número, el titular y el dibujo de la semana.
// Nada de esto se inventa: si Orbe no pudo leer Drive, el botón lo dice.
import { leer, guardar } from "./almacen.js";
import { pedirPase } from "./google.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";

async function drive(url, comoTexto) {
  const t = await pedirPase();
  const r = await fetch(url, { headers: { Authorization: "Bearer " + t } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    if (r.status === 403 && /has not been used|is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(txt)) throw new Error("api-apagada:drive");
    if (r.status === 401) throw new Error("reconectar");
    throw new Error("Drive respondió " + r.status);
  }
  return comoTexto ? r.text() : r.json();
}
const buscar = (q) => drive(DRIVE + "?" + new URLSearchParams({ q, orderBy: "createdTime desc", pageSize: "3", fields: "files(id,name,createdTime)" }));

export const ultimaEdicion = () => leer("semanal");
export const esNueva = (e = ultimaEdicion()) => !!e && leer("semanalLeida") !== e.id;
export const marcarLeida = () => { const e = ultimaEdicion(); if (e) guardar("semanalLeida", e.id, true); };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
// «El Diario — jueves 15 de octubre de 2026» → 2026-10-15
function fechaDeNombre(nombre) {
  const iso = nombre.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const m = nombre.match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})/i);
  if (!m) return null;
  const mes = MESES.indexOf(m[2].toLowerCase());
  return mes < 0 ? null : m[3] + "-" + String(mes + 1).padStart(2, "0") + "-" + m[1].padStart(2, "0");
}

// Del HTML de la edición: primero las etiquetas orbe:* (las ediciones nuevas las traen); si no, la portada.
const COLOR = { "#111111": "currentColor", "#767676": "var(--muted)", "#c8102e": "var(--rojo)" };
function dibujoSeguro(svg) {
  if (!svg) return null;
  const vb = (svg.getAttribute("viewBox") || "").match(/^[\d.\s]+$/) ? svg.getAttribute("viewBox") : null;
  if (!vb) return null;
  const color = (v) => (v && COLOR[v.toLowerCase()]) || (v === "none" ? "none" : null);
  const num = (v) => (/^-?[\d.]+$/.test(v || "") ? v : null);
  const partes = [];
  svg.querySelectorAll("path, circle").forEach((n) => {
    if (n.tagName.toLowerCase() === "path") {
      const d = n.getAttribute("d") || "";
      if (/^[MCLSQTHVZmclsqthvz\d.,\s-]+$/.test(d)) partes.push(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>`);
    } else {
      const [cx, cy, r] = ["cx", "cy", "r"].map((a) => num(n.getAttribute(a)));
      if (!cx || !cy || !r) return;
      const fill = color(n.getAttribute("fill")) || "currentColor", stroke = color(n.getAttribute("stroke"));
      const op = num(n.getAttribute("opacity"));
      // En la tarjeta el dibujo va a un tercio del tamaño: puntos y trazos un poco más gordos para que se lean.
      partes.push(`<circle cx="${cx}" cy="${cy}" r="${Math.round(r * 1.4 * 10) / 10}" fill="${fill}"${stroke && stroke !== "none" ? ` stroke="${stroke}" stroke-width="${(num(n.getAttribute("stroke-width")) || 1.6) * 1.8}"` : ""}${op ? ` opacity="${op}"` : ""}/>`);
    }
  });
  return partes.length ? { viewBox: vb, partes: partes.join("") } : null;
}

// Los pendientes con fecha que la revista encontró en tus mails (facturas, trámites), para el widget Urgente.
// Vienen en un bloque de datos (no se ejecuta) que la edición deja en su <head>.
function urgentesDe(doc) {
  try {
    const j = JSON.parse(doc.querySelector('script#orbe-urgentes[type="application/json"]')?.textContent || "[]");
    return (Array.isArray(j) ? j : []).filter((u) => u && typeof u.titulo === "string" && /^\d{4}-\d{2}-\d{2}$/.test(u.vence || ""))
      .slice(0, 12).map((u) => ({ titulo: u.titulo.slice(0, 90), vence: u.vence, monto: typeof u.monto === "string" ? u.monto.slice(0, 30) : "",
        nota: typeof u.nota === "string" ? u.nota.slice(0, 90) : "", link: /^https:\/\/mail\.google\.com\//.test(u.link || "") ? u.link : "" }));
  } catch (e) { return []; }
}

export function pendientesDeSemanal(e = ultimaEdicion(), hoy = new Date()) {
  if (!e?.urgentes?.length) return [];
  const h = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
  // Hasta que vencen (o los tildás): lo que ya pasó deja de aparecer.
  return e.urgentes.filter((u) => u.vence >= h).map((u) => ({
    titulo: u.titulo, tipo: "vencimiento", universo: "semanal", ruta: "#/semanal", fecha: u.vence, monto: u.monto,
    nota: (u.nota ? u.nota + " · " : "") + e.nombre + (e.numero ? " N.º " + e.numero : ""), clave: ("semanal|" + u.titulo + "|" + u.vence).toLowerCase()
  }));
}

export function leerEdicion(html, archivo, tipo) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = (n) => doc.querySelector(`meta[name="orbe:${n}"]`)?.getAttribute("content")?.trim() || "";
  const texto = (sel) => doc.querySelector(sel)?.textContent.replace(/\s+/g, " ").trim() || "";
  const numero = meta("numero") || ((doc.title + " " + archivo.name).match(/N\.?\s*º\s*(\d+)/) || [])[1] || "";
  let titular = meta("titular") || (tipo === "semanal" ? texto(".portada h1") : "");
  if (!titular) titular = [...doc.querySelectorAll("h1, h2, .title")].map((h) => h.textContent.replace(/\s+/g, " ").trim()).find((t) => t && !/^El (Semanal|Diario)\b/i.test(t)) || "";
  const fecha = meta("fecha") || fechaDeNombre(archivo.name) || archivo.createdTime.slice(0, 10);
  return {
    id: archivo.id, tipo, nombre: tipo === "diario" ? "El Diario" : "El Semanal", numero, fecha, titular: titular.slice(0, 120),
    desde: meta("desde"), hasta: meta("hasta") || (tipo === "semanal" ? fecha : ""),
    volanta: meta("volanta") || texto(".portada .volanta"),
    dibujo: tipo === "semanal" ? dibujoSeguro(doc.querySelector('svg[viewBox="0 0 840 130"]')) : null,
    urgentes: urgentesDe(doc),
    creada: archivo.createdTime, bajada: Date.now()
  };
}

// La página que se muestra en el lector: la edición tal cual, con los links abriéndose afuera.
function paraLeer(html) {
  const base = '<base target="_blank">';
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html;
}

// Busca la última edición (El Semanal o El Diario, la más nueva de las dos) y la baja si cambió.
export async function actualizarSemanal(forzar = false) {
  const previa = ultimaEdicion();
  if (!forzar && Date.now() - (leer("semanalCuando") || 0) < 30 * 60000) return false;
  const [sem, dia] = await Promise.all([
    buscar("name contains 'El Semanal' and mimeType = 'text/html' and trashed = false"),
    buscar("name contains 'El Diario' and mimeType = 'application/vnd.google-apps.document' and trashed = false").catch(() => ({ files: [] }))
  ]);
  guardar("semanalCuando", Date.now(), true);
  const s = (sem.files || []).find((f) => /N\.?\s*º/.test(f.name)), d = (dia.files || [])[0];
  const elegido = s && d ? (d.createdTime > s.createdTime ? ["diario", d] : ["semanal", s]) : s ? ["semanal", s] : d ? ["diario", d] : null;
  if (!elegido) { guardar("semanalError", "sin-ediciones", true); return false; }
  const [tipo, archivo] = elegido;
  guardar("semanalError", null, true);
  if (previa && previa.id === archivo.id && leer("semanalHtml")) return false;
  const html = tipo === "diario"
    ? await drive(DRIVE + "/" + archivo.id + "/export?mimeType=text%2Fhtml", true)
    : await drive(DRIVE + "/" + archivo.id + "?alt=media", true);
  const e = leerEdicion(html, archivo, tipo);
  // El Doc de la misma edición, para el botón «Abrir en Drive».
  if (tipo === "semanal" && e.numero) {
    const docs = await buscar(`name contains 'El Semanal N.º ${e.numero}' and mimeType = 'application/vnd.google-apps.document' and trashed = false`).catch(() => ({ files: [] }));
    e.doc = docs.files?.[0]?.id || null;
  } else if (tipo === "diario") e.doc = archivo.id;
  if (!guardar("semanalHtml", paraLeer(html), true)) guardar("semanalHtml", null, true);
  guardar("semanal", e, true);
  return true;
}

export const htmlEdicion = () => leer("semanalHtml");

// Próxima edición: el domingo siguiente a las 20:00.
export function proximaSemanal(hoy = new Date()) {
  const d = new Date(hoy);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || (d.getHours() >= 20 ? 7 : 0)));
  d.setHours(20, 0, 0, 0);
  return d;
}
