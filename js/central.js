// La central de proyectos (carpeta «Central de proyectos» de tu Drive): Orbe lee las fichas de cada
// proyecto y la Bandeja de ideas. Solo lectura: las fichas las mantiene Claude al cerrar cada tanda de trabajo.
// También trae las propuestas que deja Claude dos veces por semana («Orbe · propuestas · AAAA-MM-DD.json»).
import { leer, guardar } from "./almacen.js";
import { pedirPase, permisos } from "./google.js";
import { idDeFicha } from "./proyectosid.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const MEDIA_HORA = 30 * 60000;

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
const buscar = (q, campos = "files(id,name,modifiedTime,createdTime)", extra = "") =>
  drive(DRIVE + "?pageSize=60&fields=" + encodeURIComponent(campos) + extra + "&q=" + encodeURIComponent(q));
const textoDoc = (id) => drive(DRIVE + "/" + id + "/export?mimeType=text%2Fplain", true);

export const datosCentral = () => leer("central");

// ---------- Leer una ficha ----------
// Cabecera fija: «ESTADO: … · VERSIÓN: … · ACTUALIZADA: … · DÓNDE SE TRABAJA: …», y secciones numeradas.
const SECCION = [
  [/qu[eé] es/i, "que"], [/estado actual/i, "ahora"], [/decisiones/i, "decisiones"], [/reglas/i, "reglas"],
  [/falta|pr[oó]ximos/i, "falta"], [/d[oó]nde est/i, "donde"], [/historial/i, "historia"], [/conexiones/i, "conexiones"]
];
const limpiar = (s) => s.replace(/\*\*/g, "").replace(/^[\s*\-•●○■◦▪︎]+/, "").replace(/\s+/g, " ").trim();
export function leerFicha(texto) {
  const lineas = String(texto || "").replace(/\r/g, "").split("\n");
  const f = { estado: "", version: "", actualizada: "", dondeTrabaja: "", secciones: {} };
  let actual = null;
  for (const cruda of lineas) {
    const l = limpiar(cruda);
    if (!l) continue;
    if (/ESTADO\s*:/i.test(l) && /VERSI[OÓ]N\s*:/i.test(l)) {
      const campo = (re) => (new RegExp(re.source + "\\s*:\\s*([^·]*)", "i").exec(l)?.[1] || "").trim();
      f.estado = campo(/ESTADO/); f.version = campo(/VERSI[OÓ]N/); f.actualizada = campo(/ACTUALIZADA/); f.dondeTrabaja = campo(/D[OÓ]NDE SE TRABAJA/);
      continue;
    }
    const h = /^#*\s*(\d{1,2})\s*[.)]\s*(.{2,60})$/.exec(l);
    if (h) { const s = SECCION.find(([re]) => re.test(h[2])); actual = s ? s[1] : null; if (actual) f.secciones[actual] = []; continue; }
    if (actual && !/^#\s/.test(cruda)) f.secciones[actual].push(l.slice(0, 400));
  }
  for (const k of Object.keys(f.secciones)) f.secciones[k] = f.secciones[k].slice(0, 40);
  return f;
}

// ---------- La Bandeja de ideas ----------
export function leerBandeja(texto) {
  const b = { para: [], sin: [], procesadas: [] };
  let zona = null;
  for (const cruda of String(texto || "").replace(/\r/g, "").split("\n")) {
    const l = limpiar(cruda);
    if (!l) continue;
    if (/^PARA HACER/i.test(l)) { zona = "para"; continue; }
    if (/^sin procesar$/i.test(l)) { zona = "sin"; continue; }
    if (/^procesadas$/i.test(l)) { zona = "procesadas"; continue; }
    if (/^ejemplo\s*:/i.test(l) || l === "(vacío)") continue;
    if (zona === "para") { const m = /^([☐☑✓✔])?\s*(\d+\.)?\s*(.+)$/.exec(l); b.para.push({ hecho: /[☑✓✔]/.test(m[1] || ""), t: m[3] }); }
    else if (zona === "sin") b.sin.push({ t: l });
    else if (zona === "procesadas") {
      const m = /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s*·\s*(.+)$/.exec(l);
      const ficha = /pasada a\s+(ficha\s*·\s*[^,.;]+)/i.exec(l)?.[1] || "";
      b.procesadas.push({ fecha: m?.[1] || "", t: m ? m[2] : l, ficha: ficha.replace(/^ficha\s*·\s*/i, "").trim() });
    }
  }
  return b;
}

// ---------- Traer todo ----------
// Como mucho cada media hora; las fichas solo se bajan si cambiaron. Si algo falla queda lo último.
export async function leerCentral(forzar = false) {
  if (!permisos().drive) return false;
  const previa = datosCentral() || { fichas: {} };
  if (!forzar && previa.cuando && Date.now() - previa.cuando < MEDIA_HORA) return false;
  let carpeta = previa.carpeta;
  if (!carpeta) {
    const c = await buscar("name = 'Central de proyectos' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    carpeta = c.files?.[0]?.id;
    if (!carpeta) { guardar("central", { ...previa, cuando: Date.now(), error: "sin-carpeta" }, true); return false; }
  }
  const docs = (await buscar(`'${carpeta}' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false`)).files || [];
  const fichas = {};
  let cambio = false;
  for (const d of docs) {
    if (/^bandeja/i.test(d.name)) continue;
    if (!/^ficha\s*·/i.test(d.name)) continue;
    const id = idDeFicha(d.name);
    if (!id) continue;
    const vieja = Object.values(previa.fichas || {}).find((x) => x.doc === d.id);
    if (vieja && vieja.modificada === d.modifiedTime) { fichas[id] = vieja; continue; }
    try {
      fichas[id] = { ...leerFicha(await textoDoc(d.id)), nombre: d.name.replace(/^ficha\s*·\s*/i, "").trim(), doc: d.id, modificada: d.modifiedTime };
      cambio = true;
    } catch (e) { if (vieja) fichas[id] = vieja; }
  }
  let bandeja = previa.bandeja || null, bandejaDoc = previa.bandejaDoc || null;
  const bd = docs.find((d) => /^bandeja/i.test(d.name));
  if (bd && (bd.modifiedTime !== previa.bandejaMod || !bandeja)) {
    try { bandeja = leerBandeja(await textoDoc(bd.id)); bandejaDoc = bd.id; cambio = true; } catch (e) { /* queda la anterior */ }
  }
  marcarAvances(previa.fichas || {}, fichas);
  guardar("central", { cuando: Date.now(), carpeta, fichas, bandeja, bandejaDoc, bandejaMod: bd?.modifiedTime || previa.bandejaMod || null, error: null }, true);
  return cambio;
}

// Un proyecto «avanza» cuando su ficha cambia de versión o de fecha de actualización.
// El cosmos lo festeja la próxima vez que abrís Proyectos (una vez por avance).
function marcarAvances(antes, ahora) {
  const pend = new Set(leer("avances", []));
  for (const [id, f] of Object.entries(ahora)) {
    const a = antes[id];
    if (!a) continue; // la primera vez que se ve no cuenta como avance
    if ((f.version && f.version !== a.version) || (f.actualizada && f.actualizada !== a.actualizada)) pend.add(id);
  }
  guardar("avances", [...pend].slice(-6), true);
}
export const avancesPendientes = () => leer("avances", []);
export const avanceVisto = (id) => guardar("avances", leer("avances", []).filter((x) => x !== id), true);

// ---------- Propuestas de Claude ----------
// Claude deja un archivo dos veces por semana (martes y viernes a la noche). Orbe lee el más nuevo.
// Tus respuestas (dale, después, no) viven en «propuestasResp» y se sincronizan con la planilla:
// así la próxima tanda sabe qué te gustó y no repite lo que descartaste.
export const datosPropuestas = () => leer("propuestas");
export async function leerPropuestas(forzar = false) {
  if (!permisos().drive) return false;
  const previa = datosPropuestas();
  if (!forzar && previa?.cuando && Date.now() - previa.cuando < MEDIA_HORA) return false;
  const r = await buscar("name contains 'Orbe · propuestas' and trashed = false", "files(id,name,createdTime,modifiedTime)", "&orderBy=createdTime%20desc");
  const f = r.files?.[0];
  if (!f) { guardar("propuestas", { cuando: Date.now(), lista: [], archivo: null }, true); return false; }
  if (previa?.archivo === f.id && previa.mod === f.modifiedTime) { guardar("propuestas", { ...previa, cuando: Date.now() }, true); return false; }
  const j = await drive(DRIVE + "/" + f.id + "?alt=media", true).then((t) => JSON.parse(t)).catch(() => null);
  const lista = (Array.isArray(j?.propuestas) ? j.propuestas : []).slice(0, 6).map((p, i) => ({
    id: String(p.id || f.id + "-" + i).slice(0, 60),
    titulo: String(p.titulo || "").slice(0, 120), porque: String(p.porque || "").slice(0, 400),
    tipo: ["mejora", "area", "punto-ciego"].includes(p.tipo) ? p.tipo : "mejora",
    proyecto: String(p.proyecto || "").slice(0, 40), esfuerzo: ["chico", "medio", "grande"].includes(p.esfuerzo) ? p.esfuerzo : ""
  })).filter((p) => p.titulo);
  guardar("propuestas", { cuando: Date.now(), archivo: f.id, mod: f.modifiedTime, fecha: j?.fecha || f.createdTime.slice(0, 10), lista }, true);
  return true;
}
export const respuestas = () => leer("propuestasResp", {});
export function responderPropuesta(id, r) {
  const todas = { ...respuestas() };
  if (r) todas[id] = { r, cuando: Date.now() }; else delete todas[id];
  guardar("propuestasResp", todas);
}
export const propuestasNuevas = () => (datosPropuestas()?.lista || []).filter((p) => !respuestas()[p.id]);
