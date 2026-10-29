// UFASTA desde el campus: la revisión diaria de Claude lee el aula virtual y deja un archivo
// «Orbe · campus UFASTA · AAAA-MM-DD.json» en tu carpeta Orbe de Drive. Orbe lee el más nuevo.
// Tus tildes («ya lo hice») viven en tu planilla (hoja TILDES_FACU) y se ven igual en el celu y en la compu.
// Nada se inventa acá: si una fecha sale del cronograma, el archivo la trae marcada como estimada.
import { leer, guardar } from "./almacen.js";
import { pedirPase } from "./google.js";
import { leerRangos, escribir, agregar, asegurarHojas } from "./hoja.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
export const HOJAS_CAMPUS = { TILDES_FACU: { cab: ["id", "hecho", "cuando"], filas: [] } };

export const MATERIAS = {
  MKT: { corto: "Marketing", color: "#D9572B" },
  CL: { corto: "Crítica", color: "#7C5CC4" },
  AV: { corto: "Audiovisual", color: "#2F8F83" },
  LV: { corto: "L. Visual", color: "#C2418A" },
  FIN: { corto: "Finales", color: "#8A8A93" },
  GEN: { corto: "General", color: "#8A8A93" }
};
const HECHO_CAMPUS = new Set(["entregado", "aprobado", "calificado"]);
const TILDABLE = new Set(["tarea", "examen", "leer", "clase"]);

async function drive(url, comoTexto) {
  const t = await pedirPase();
  const r = await fetch(url, { headers: { Authorization: "Bearer " + t } });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    if (r.status === 403 && /has not been used|is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(txt)) throw new Error("api-apagada:drive");
    if (r.status === 401) throw new Error("reconectar");
    if (r.status === 403) throw new Error("permiso");
    throw new Error("Drive respondió " + r.status);
  }
  return comoTexto ? r.text() : r.json();
}

export const datosCampus = () => leer("campus");

// Trae el archivo más nuevo de la revisión y tus tildes. Si algo falla, queda lo último que había.
export async function leerCampus() {
  const q = "name contains 'Orbe · campus UFASTA' and trashed = false";
  const lista = await drive(DRIVE + "?" + new URLSearchParams({ q, orderBy: "createdTime desc", pageSize: "1", fields: "files(id,name,createdTime)" }));
  const f = (lista.files || [])[0];
  const previo = leer("campus", {}) || {};
  let datos = previo.datos || null, archivo = previo.archivo || null;
  if (f && f.id !== previo.archivo) {
    const txt = await drive(DRIVE + "/" + f.id + "?alt=media", true);
    try { datos = JSON.parse(txt); archivo = f.id; } catch (e) { throw new Error("El archivo del campus vino roto"); }
  }
  let tildes = previo.tildes || {};
  try { tildes = await leerTildes(); } catch (e) { /* sin planilla: quedan los de este dispositivo */ }
  const c = { cuando: Date.now(), archivo, datos, tildes };
  guardar("campus", c, true);
  return c;
}

async function leerTildes() {
  let filas;
  try { [filas] = await leerRangos(["TILDES_FACU!A2:C"]); } catch (e) { return leer("campus", {})?.tildes || {}; }
  const t = {};
  (filas || []).forEach((f, i) => { if (f[0]) t[String(f[0])] = { hecho: /^(s[ií]|true|1|x)$/i.test(String(f[1] || "").trim()), cuando: f[2] || "", fila: i + 2 }; });
  return t;
}

// «Ya lo hice» (o destildar). Se guarda al toque en el dispositivo y después en la planilla.
export async function tildarCampus(id, hecho) {
  const c = leer("campus") || { tildes: {} };
  const n = new Date(), dd = (x) => String(x).padStart(2, "0");
  const ahora = n.getFullYear() + "-" + dd(n.getMonth() + 1) + "-" + dd(n.getDate()) + " " + dd(n.getHours()) + ":" + dd(n.getMinutes());
  const previo = c.tildes[id];
  c.tildes = { ...c.tildes, [id]: { ...(previo || {}), hecho, cuando: ahora } };
  guardar("campus", c, true);
  const fila = [[id, hecho ? "sí" : "", ahora]];
  const mandar = () => previo && previo.fila ? escribir("TILDES_FACU!A" + previo.fila + ":C" + previo.fila, fila) : agregar("TILDES_FACU!A:C", fila);
  // La primera vez la hoja puede no existir todavía: se crea y se reintenta.
  try { await mandar(); } catch (e) { await asegurarHojas(HOJAS_CAMPUS); await mandar(); }
  try { c.tildes = await leerTildes(); guardar("campus", c, true); } catch (e) { /* queda lo local */ }
  return c;
}

const dia0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export function diasA(vence, hoy) {
  if (!vence) return null;
  const v = new Date(vence);
  return Math.round((dia0(v) - dia0(hoy)) / 86400000);
}

// Cada ítem con su estado para mostrar: pendiente, vencido, marcado (lo tildaste vos) o confirmado (lo dice el campus).
export function itemsCampus(c, hoy) {
  if (!c || !c.datos) return [];
  return (c.datos.items || []).map((it) => {
    const t = c.tildes?.[it.id];
    const campusHecho = HECHO_CAMPUS.has(it.estado);
    const marcado = !!(t && t.hecho);
    const vista = campusHecho ? "confirmado" : marcado ? "marcado" : it.estado === "vencido" ? "vencido" : "pendiente";
    return { ...it, vista, dias: diasA(it.vence, hoy), tildable: TILDABLE.has(it.tipo) && !campusHecho, marcado };
  });
}

// Ahora (vencido o ≤3 días), Esta semana (4 a 7), Más adelante (resto) y Hecho.
export function gruposCampus(items) {
  const g = { ahora: [], semana: [], despues: [], sinFecha: [], hecho: [] };
  for (const it of items) {
    if (it.vista === "confirmado" || it.vista === "marcado") g.hecho.push(it);
    else if (it.vista === "vencido" || (it.dias !== null && it.dias <= 3)) g.ahora.push(it);
    else if (it.dias !== null && it.dias <= 7) g.semana.push(it);
    else if (it.dias === null) g.sinFecha.push(it);
    else g.despues.push(it);
  }
  const porFecha = (a, b) => (a.dias ?? 999) - (b.dias ?? 999) || (a.orden ?? 99) - (b.orden ?? 99);
  // En «Ahora», lo que tiene fecha va antes que lo vencido viejo (lo vencido ya no se salva por apurarse).
  g.ahora.sort((a, b) => (a.vista === "vencido") - (b.vista === "vencido") || porFecha(a, b));
  g.semana.sort(porFecha); g.despues.sort(porFecha); g.sinFecha.sort(porFecha);
  g.hecho.sort((a, b) => (b.dias ?? -999) - (a.dias ?? -999));
  return g;
}

// Lo que tiene fecha y falta hacer, como pendiente de Inicio y Urgente (tipo «facu», avisa 3 días antes).
export function pendientesDeCampus(c, hoy = new Date()) {
  return itemsCampus(c, hoy).filter((it) => it.vence && (it.vista === "pendiente") && it.tipo !== "info").map((it) => ({
    titulo: it.titulo, tipo: "facu", universo: "ufasta", fecha: it.vence.slice(0, 10), nota: (MATERIAS[it.materia]?.corto || it.materia),
    clave: ("campus|" + it.id).toLowerCase(), fuente: "Campus de UFASTA" + (it.estimado ? " (fecha estimada)" : ""), url: it.url
  }));
}

// Plan de Marketing: cada tarea se tilda con su propio id (plan-p3-1).
export const idPlan = (paso, i) => "plan-" + paso + "-" + i;
