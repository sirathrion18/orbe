// UFASTA: materias, TPs con tildes, novedades del campus (desde los mails del aula) y notas.
// Todo vive en tu planilla Orbe · datos (hojas MATERIAS y TPS), así se ve igual en el celu y en la compu.
import { leer, guardar } from "./almacen.js";
import { leerRangos, agregar, escribir } from "./hoja.js";
import { servidor, permisos } from "./google.js";

export const HOJAS_FACU = {
  MATERIAS: {
    cab: ["materia", "pistas", "profe", "aula", "links", "notas"],
    filas: [
      ["Crítica de los Lenguajes", "FHM516; signo; discurso; Barthes; Saussure", "", "", "", ""],
      ["Formatos y Producción Audiovisual", "Aiello; audiovisual; relato", "Ricardo Aiello", "", "", ""],
      ["Lenguaje Visual", "visual", "", "", "", ""],
      ["Comunicación y Marketing Digital", "marketing", "", "", "", ""]
    ]
  },
  TPS: { cab: ["id", "materia", "titulo", "fecha", "hecho", "fuente"], filas: [] }
};

const normal = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const si = (v) => /^(s[ií]|si|true|1|x)$/i.test(String(v ?? "").trim());
const num = (v) => { const t = String(v ?? "").trim(); if (!t) return null; const n = Number(t.replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : null; };

export const datosFacu = () => leer("facu");

// ¿A qué materia pertenece un aviso? Por código, por profe o por palabras clave de la hoja MATERIAS.
export function materiaDe(item, materias) {
  const texto = normal([item.codigo, item.quien, item.titulo].join(" "));
  let mejor = null, puntos = 0;
  for (const m of materias) {
    const p = m.pistas.reduce((s, x) => s + (x && texto.includes(normal(x)) ? (x.length > 4 ? 2 : 1) : 0), 0);
    if (p > puntos) { mejor = m.materia; puntos = p; }
  }
  return mejor;
}

// Dos títulos de TP "son el mismo" si comparten la mayoría de las palabras importantes.
export function mismoTp(a, b) {
  const pa = normal(a).split(" ").filter((w) => w.length > 3), pb = new Set(normal(b).split(" ").filter((w) => w.length > 3));
  if (!pa.length || !pb.size) return normal(a) === normal(b);
  const comunes = pa.filter((w) => pb.has(w)).length;
  return comunes / Math.min(pa.length, pb.size) >= 0.6;
}

export async function leerFacu() {
  const [materias, tps] = await leerRangos(["MATERIAS!A2:F", "TPS!A2:F"]);
  const previo = leer("facu", {});
  const f = {
    cuando: Date.now(), ultimoMail: previo.ultimoMail || 0, feed: previo.feed || [],
    materias: materias.filter((m) => m[0]).map((m) => ({
      materia: String(m[0]), pistas: String(m[1] || "").split(";").map((x) => x.trim()).filter(Boolean), profe: m[2] || "", aula: m[3] || "",
      links: String(m[4] || "").split(";").map((x) => x.split("|").map((y) => y.trim())).filter((x) => x[0]).map(([t, u]) => ({ titulo: u ? t : "Link", url: u || t })),
      notas: String(m[5] || "").split(/[;\s]+/).map(num).filter((n) => n !== null)
    })),
    tps: tps.filter((t) => t[0]).map((t, i) => ({ id: String(t[0]), materia: t[1] || "", titulo: t[2] || "", fecha: t[3] ? String(t[3]).slice(0, 10) : "", hecho: si(t[4]), fuente: t[5] || "", fila: i + 2 }))
  };
  guardar("facu", f, true);
  return f;
}

// Trae los avisos nuevos del campus y actualiza los TPs: un recordatorio crea el TP; una entrega lo tilda.
export async function traerCampus() {
  let f = await leerFacu();
  if (!permisos().gmail) return f;
  const r = await servidor("/api/facu", { desde: f.ultimoMail || 0 });
  const nuevos = (r.items || []).filter((x) => !f.feed.some((y) => y.id === x.id)).map((x) => ({ ...x, materia: materiaDe(x, f.materias) }));
  const altas = [], cambios = [];
  for (const x of nuevos) {
    if (x.tipo === "recordatorio" || x.tipo === "entrega") {
      const tp = f.tps.find((t) => mismoTp(t.titulo, x.titulo)) || altas.find((t) => mismoTp(t[2], x.titulo));
      if (!tp) altas.push(["c" + x.id, x.materia || "", x.titulo, "", x.tipo === "entrega" ? "sí" : "", x.tipo === "entrega" ? "Entregado (aviso del campus)" : "Recordatorio del campus"]);
      else if (x.tipo === "entrega" && Array.isArray(tp)) tp[4] = "sí";
      else if (x.tipo === "entrega" && !tp.hecho) cambios.push({ ...tp, hecho: true, fuente: "Entregado (aviso del campus)" });
    }
  }
  if (altas.length) await agregar("TPS!A:F", altas);
  for (const c of cambios) await escribir("TPS!A" + c.fila + ":F" + c.fila, [[c.id, c.materia, c.titulo, c.fecha, "sí", c.fuente]]);
  f = await leerFacu();
  f.feed = [...nuevos, ...f.feed].sort((a, b) => b.ts - a.ts).slice(0, 80);
  f.ultimoMail = Math.max(f.ultimoMail || 0, r.ultimo || 0);
  guardar("facu", f, true);
  return f;
}

export async function tildarTp(id, hecho) {
  const f = leer("facu");
  const t = f?.tps.find((x) => x.id === id);
  if (!t) return;
  await escribir("TPS!A" + t.fila + ":F" + t.fila, [[t.id, t.materia, t.titulo, t.fecha, hecho ? "sí" : "", t.fuente || "Orbe"]]);
  return leerFacu();
}

export async function nuevoTp(materia, titulo, fecha) {
  await agregar("TPS!A:F", [["o" + Date.now().toString(36), materia, titulo, fecha || "", "", "Cargado en Orbe"]]);
  return leerFacu();
}

export async function guardarMateria(materia, campos) {
  const f = leer("facu");
  const i = f.materias.findIndex((m) => m.materia === materia);
  if (i < 0) return;
  const m = { ...f.materias[i], ...campos };
  const fila = i + 2;
  await escribir("MATERIAS!A" + fila + ":F" + fila, [[m.materia, m.pistas.join("; "), m.profe, m.aula,
    m.links.map((l) => l.titulo + "|" + l.url).join("; "), m.notas.join("; ")]]);
  return leerFacu();
}

// Los TPs pendientes con fecha, como pendientes de Inicio (tipo "facu").
export function pendientesDeTps(f) {
  if (!f) return [];
  return f.tps.filter((t) => !t.hecho && /^\d{4}-\d{2}-\d{2}$/.test(t.fecha)).map((t) => ({
    titulo: t.titulo, tipo: "facu", universo: "ufasta", fecha: t.fecha, nota: t.materia, clave: ("tp|" + t.id).toLowerCase(), tp: t.id,
    fuente: t.fuente || "Campus de UFASTA"
  }));
}

export const promedio = (ns) => ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null;

export async function asignarTp(id, materia, fecha) {
  const f = leer("facu");
  const t = f?.tps.find((x) => x.id === id);
  if (!t) return;
  await escribir("TPS!A" + t.fila + ":F" + t.fila, [[t.id, materia, t.titulo, fecha || t.fecha, t.hecho ? "sí" : "", t.fuente]]);
  return leerFacu();
}
