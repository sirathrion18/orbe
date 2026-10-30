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
        nota: typeof u.nota === "string" ? u.nota.slice(0, 90) : "", impacto: typeof u.impacto === "string" ? u.impacto.slice(0, 160) : "", link: /^https:\/\/mail\.google\.com\//.test(u.link || "") ? u.link : "" }));
  } catch (e) { return []; }
}

export function pendientesDeSemanal(e = ultimaEdicion(), hoy = new Date()) {
  if (!e?.urgentes?.length) return [];
  const h = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
  // Hasta que vencen (o los tildás): lo que ya pasó deja de aparecer.
  return e.urgentes.filter((u) => u.vence >= h).map((u) => ({
    titulo: u.titulo, tipo: "vencimiento", universo: "semanal", ruta: "#/semanal", fecha: u.vence, monto: u.monto,
    nota: u.nota || "", impacto: u.impacto || "", link: u.link || "",
    fuente: e.nombre + (e.numero ? " N.º " + e.numero : ""), clave: ("semanal|" + u.titulo + "|" + u.vence).toLowerCase()
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

// Busca la última edición de El Semanal y la baja si cambió. La tapa de Inicio abre siempre el Semanal;
// los Diarios (que pedís con /diario) viven en el Archivo, al final de cada edición.
export async function actualizarSemanal(forzar = false) {
  const previa = ultimaEdicion();
  if (!forzar && Date.now() - (leer("semanalCuando") || 0) < 30 * 60000) return false;
  const sem = await buscar("name contains 'El Semanal' and mimeType = 'text/html' and trashed = false");
  guardar("semanalCuando", Date.now(), true);
  leerArchivo().catch(() => {});
  const s = (sem.files || []).find((f) => /N\.?\s*º/.test(f.name));
  if (!s) { guardar("semanalError", "sin-ediciones", true); return false; }
  const [tipo, archivo] = ["semanal", s];
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

// ---------- El Archivo: todas las ediciones ----------
// La lista vive en este dispositivo (título, número y fecha de cada una); el contenido se baja cuando la abrís.
const buscarTodas = (q) => drive(DRIVE + "?" + new URLSearchParams({ q, orderBy: "createdTime desc", pageSize: "30", fields: "files(id,name,createdTime)" }));
export const datosArchivo = () => leer("semanalArchivo") || { lista: [] };
export async function leerArchivo(forzar = false) {
  const a = datosArchivo();
  if (!forzar && a.cuando && Date.now() - a.cuando < 30 * 60000) return false;
  const [sem, dia] = await Promise.all([
    buscarTodas("name contains 'El Semanal' and mimeType = 'text/html' and trashed = false"),
    buscarTodas("name contains 'El Diario' and mimeType = 'application/vnd.google-apps.document' and trashed = false").catch(() => ({ files: [] }))
  ]);
  const vistos = new Map((a.lista || []).map((x) => [x.id, x]));
  const archivos = [...(sem.files || []).filter((f) => /N\.?\s*º/.test(f.name)).map((f) => ["semanal", f]), ...(dia.files || []).map((f) => ["diario", f])];
  const lista = [];
  let bajadas = 0;
  for (const [tipo, f] of archivos) {
    let e = vistos.get(f.id);
    if (!e && bajadas < 6) {
      // Solo la primera vez: se baja la edición para sacar su titular (después queda guardado).
      try { bajadas++; e = resumen(leerEdicion(await bajar(tipo, f.id), f, tipo)); } catch (err) { e = null; }
    }
    lista.push(e || { id: f.id, tipo, nombre: tipo === "diario" ? "El Diario" : "El Semanal", numero: ((f.name.match(/N\.?\s*º\s*(\d+)/) || [])[1]) || "", fecha: fechaDeNombre(f.name) || f.createdTime.slice(0, 10), titular: "", pendiente: true });
  }
  guardar("semanalArchivo", { cuando: Date.now(), lista: lista.sort((x, y) => (y.fecha || "").localeCompare(x.fecha || "")) }, true);
  return true;
}
const resumen = (e) => ({ id: e.id, tipo: e.tipo, nombre: e.nombre, numero: e.numero, fecha: e.fecha, titular: e.titular, desde: e.desde, hasta: e.hasta });
const bajar = (tipo, id) => tipo === "diario" ? drive(DRIVE + "/" + id + "/export?mimeType=text%2Fhtml", true) : drive(DRIVE + "/" + id + "?alt=media", true);

// Abrir una edición vieja: se baja y queda guardada (solo la última que abriste, para no llenar el celu).
export const edicionAbierta = () => leer("semanalOtra");
export async function abrirEdicion(id) {
  const x = datosArchivo().lista.find((e) => e.id === id);
  if (!x) throw new Error("no-esta");
  const html = await bajar(x.tipo, id);
  const e = leerEdicion(html, { id, name: (x.nombre || "") + (x.numero ? " N.º " + x.numero : ""), createdTime: (x.fecha || "") + "T12:00:00Z" }, x.tipo);
  if (x.tipo === "diario") e.doc = id;
  if (!guardar("semanalOtra", { e, html: paraLeer(html) }, true)) guardar("semanalOtra", null, true);
  return e;
}

// La edición que se lee, con el Archivo pegado al final (recién aparece cuando terminás de leer).
// Los links del Archivo abren dentro de Orbe (#/semanal?ed=…) con un toque.
const escA = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function conArchivo(html, actual) {
  const o = location.origin;
  const dmA = (iso) => iso ? Number(iso.slice(8, 10)) + "/" + Number(iso.slice(5, 7)) : "";
  const fila = (x) => `<a class="oa-ed${x.id === actual ? " oa-on" : ""}" target="_top" href="${o}/#/semanal?ed=${encodeURIComponent(x.id)}"><span class="oa-tp${x.tipo === "diario" ? " oa-di" : ""}">${x.tipo === "diario" ? dmA(x.fecha) : "N.º " + escA(x.numero)}</span><span class="oa-tx"><b>${escA(x.titular || (x.tipo === "diario" ? "El Diario" : "El Semanal N.º " + x.numero))}</b><small>${x.tipo === "diario" ? "El Diario · " + dmA(x.fecha) : (x.desde ? dmA(x.desde) + " al " + dmA(x.hasta) : dmA(x.fecha))}${x.id === actual ? " · estás leyendo esta" : ""}</small></span></a>`;
  const l = datosArchivo().lista || [];
  const sem = l.filter((x) => x.tipo !== "diario"), dia = l.filter((x) => x.tipo === "diario");
  const bloque = `<style>.oa{all:initial;display:block;margin:28px 0 0;background:#111;color:#f2f2f0;padding:22px 18px 30px;font-family:Inter,system-ui,sans-serif}.oa *{box-sizing:border-box}
.oa h3{margin:0;font:400 30px/1 'Instrument Serif',Georgia,serif;color:#f2f2f0}.oa p{margin:6px 0 0;font-size:13px;color:#a1a1a6;line-height:1.45}
.oa-pedir{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding:14px 15px;border-radius:16px;background:#c8102e;color:#fff;font-weight:600;font-size:15px;text-decoration:none}
.oa-pedir small{display:block;font-weight:400;font-size:12px;opacity:.85;margin-top:2px}.oa-g{margin:18px 0 0;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#a1a1a6}
.oa-ed{display:flex;gap:12px;align-items:center;padding:11px 0;border-top:1px solid #2a2a2e;color:#f2f2f0;text-decoration:none}.oa-ed:first-of-type{border-top:0}
.oa-tp{flex:none;width:46px;height:58px;border-radius:6px;background:#f6f4ef;color:#c8102e;display:flex;align-items:center;justify-content:center;font:400 14px Georgia,serif;text-align:center}
.oa-tp.oa-di{background:#2a2a2e;color:#f2f2f0}.oa-tx b{display:block;font:400 18px/1.15 'Instrument Serif',Georgia,serif}.oa-tx small{display:block;font-size:12px;color:#a1a1a6;margin-top:3px}
.oa-on .oa-tx b{color:#f87171}</style>
<section class="oa" aria-label="Archivo de ediciones"><h3>Archivo</h3><p>Todo lo que se generó, desde tu Drive. Tocá una edición y se abre acá.</p>
<a class="oa-pedir" target="_top" href="${o}/#/pedir-diario"><span>Pedir un Diario<small>Copia /diario y abre Claude: llega en unos minutos.</small></span><span>›</span></a>
${sem.length ? `<div class="oa-g">El Semanal</div>${sem.map(fila).join("")}` : ""}${dia.length ? `<div class="oa-g">El Diario</div>${dia.map(fila).join("")}` : ""}
${!l.length ? "<p>Todavía no leí el archivo de tu Drive. Se trae solo con señal.</p>" : ""}</section>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, bloque + "</body>") : html + bloque;
}

// Próxima edición: el domingo siguiente a las 20:00.
export function proximaSemanal(hoy = new Date()) {
  const d = new Date(hoy);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || (d.getHours() >= 20 ? 7 : 0)));
  d.setHours(20, 0, 0, 0);
  return d;
}
