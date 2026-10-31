// Días con color y referencias: la lista vive en tu Drive (doc «Orbe · referencias»), no en el código.
// Orbe la lee cada 12 horas, la guarda en este dispositivo y con eso:
//  · en ciertas fechas tiñe toda la app (color de acento, franja finita arriba) y pone una línea corta en el reloj;
//  · a ciertas horas muestra un iconito en el reloj que, si lo tocás, te dice qué es;
//  · responde palabras secretas en el buscador.
// Acá solo están los colores y la forma de leer el doc. Qué fechas y qué frases: eso es tuyo y está en tu Drive.
import { leer, guardar, sesion } from "./almacen.js";
import { pedirPase, permisos } from "./google.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
export const NOMBRE_DOC = "Orbe · referencias";
const DOCE_HORAS = 12 * 3600000;

// Los colores (genéricos) y los nombres que se pueden usar en el doc para cada uno.
const TEMAS = {
  celeste: "celeste", patria: "celeste", seleccion: "celeste", "selección": "celeste",
  sobrio: "sobrio", luto: "sobrio", memoria: "sobrio",
  rojo: "rojo", river: "rojo",
  heroe: "heroe", "héroe": "heroe", heroes: "heroe", "héroes": "heroe", superheroes: "heroe", "superhéroes": "heroe",
  rosa: "rosa", agus: "rosa", amor: "rosa"
};
export const ICONOS_REF = ["escarapela", "bandera", "banda", "copa", "copa-roja", "estrellas", "estrella", "telita", "pelota", "mate", "nota", "orbita", "corazon"];

const limpio = (t) => String(t || "").replace(/[​﻿]/g, "").trim();
const partes = (l) => l.split(/\s+[·|]\s+/).map(limpio).filter(Boolean);
const esHora = (t) => /^\d{1,2}:\d{2}$/.test(t);
const hora2 = (t) => t.padStart(5, "0");
const icono = (t) => { const k = limpio(t).toLowerCase().replace(/ó/g, "o").replace(/\s+/g, "-"); return ICONOS_REF.includes(k) ? k : null; };

// Del texto del doc a { dias, horas, azar, palabras }. Lo que no entiende, lo saltea.
export function leerReferencias(texto) {
  const out = { dias: [], horas: [], azar: [], palabras: [] };
  let sec = "dias";
  for (const crudo of String(texto || "").split(/\r?\n/)) {
    const l = limpio(crudo).replace(/^[-•*]\s+/, "");
    if (!l || /^\\?#/.test(l) || l.startsWith("//")) continue;
    const t = l.toLowerCase();
    if (/^d[ií]as con color\b/.test(t)) { sec = "dias"; continue; }
    if (/^[íi]conos (en el|del) reloj\b/.test(t)) { sec = "horas"; continue; }
    if (/^[íi]conos al azar\b/.test(t)) { sec = "azar"; continue; }
    if (/^palabras\b/.test(t)) { sec = "palabras"; continue; }
    const p = partes(l);
    if (sec === "dias") {
      const f = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(p[0] || "");
      const tema = TEMAS[(p[1] || "").toLowerCase()];
      if (!f || !tema || !p[2]) continue;
      const x = { d: +f[1], m: +f[2], a: f[3] ? +f[3] : null, tema, frase: p[2].slice(0, 80) };
      p.slice(3).forEach((e) => { if (esHora(e)) x.hora = hora2(e); else if (icono(e)) x.icono = icono(e); });
      out.dias.push(x);
    } else if (sec === "horas") {
      if (!esHora(p[0] || "") || !icono(p[1]) || !p[2]) continue;
      out.horas.push({ hora: hora2(p[0]), icono: icono(p[1]), texto: p[2].slice(0, 90) });
    } else if (sec === "azar") {
      if (!icono(p[0]) || !p[1]) continue;
      out.azar.push({ icono: icono(p[0]), texto: p[1].slice(0, 90) });
    } else if (sec === "palabras") {
      if (p.length < 2) continue;
      const ic = icono(p[1]);
      const resp = (ic ? p.slice(2) : p.slice(1)).join(" · ");
      if (!resp) continue;
      out.palabras.push({ ps: p[0].split(/\s*,\s*/).map((w) => w.toLowerCase()).filter(Boolean), icono: ic, texto: resp.slice(0, 120) });
    }
  }
  return out;
}

export const referencias = () => leer("referencias");

// Trae el doc de tu Drive (cada 12 horas como mucho, o cuando lo pedís).
export async function cargarReferencias(forzar = false) {
  if (!permisos().drive) return referencias();
  const r0 = referencias();
  if (!forzar && r0 && Date.now() - r0.cuando < DOCE_HORAS) return r0;
  const pase = await pedirPase();
  const q = `name = '${NOMBRE_DOC}' and mimeType = 'application/vnd.google-apps.document' and trashed = false`;
  const b = await fetch(DRIVE + "?" + new URLSearchParams({ q, pageSize: "1", fields: "files(id,name,webViewLink)" }), { headers: { Authorization: "Bearer " + pase } });
  if (!b.ok) throw new Error("drive " + b.status);
  const f = (await b.json()).files?.[0];
  if (!f) { const v = { cuando: Date.now(), falta: true, dias: [], horas: [], azar: [], palabras: [] }; guardar("referencias", v, true); return v; }
  const t = await fetch(DRIVE + "/" + f.id + "/export?mimeType=text%2Fplain", { headers: { Authorization: "Bearer " + pase } });
  if (!t.ok) throw new Error("drive " + t.status);
  const v = { cuando: Date.now(), doc: f.webViewLink, nombre: f.name, ...leerReferencias(await t.text()) };
  guardar("referencias", v, true);
  return v;
}

// Las fechas anuales que cargaste en Amorcitos (aniversarios, cumples) se tiñen solas de rosa.
function fechasAgus() {
  return (leer("listas")?.agus || []).filter((x) => x.tipo === "fecha" && x.fecha && /anual/i.test(x.nota || ""))
    .map((x) => { const [, m, d] = String(x.fecha).slice(0, 10).split("-").map(Number); return { d, m, a: null, tema: "rosa", frase: String(x.titulo).slice(0, 80), icono: "corazon" }; })
    .filter((x) => x.d && x.m);
}
const todos = () => [...(referencias()?.dias || []), ...fechasAgus()];
const clave = (x) => `${x.d}/${x.m}${x.a ? "/" + x.a : ""}${x.hora ? " " + x.hora : ""}`;

// Si dos fechas caen el mismo día, manda la patria (y lo sobrio), después River, Agus y los estrenos; si no, el orden del doc.
const PRIO = { sobrio: 0, celeste: 0, rojo: 1, rosa: 2, heroe: 3 };
const ordenar = (l) => l.map((x, i) => [x, i]).sort((a, b) => (PRIO[a[0].tema] - PRIO[b[0].tema]) || (a[1] - b[1])).map(([x]) => x);
// Los días con color de hoy (o el que estés probando desde Ajustes).
export function diasDeHoy(f = new Date()) {
  const demo = sesion("demoDia");
  const lista = todos();
  if (demo) { const x = lista.find((y) => clave(y) === demo); return x ? ordenar(lista.filter((y) => !y.hora && y.d === x.d && y.m === x.m && (!y.a || y.a === x.a))) : []; }
  const hoy = lista.filter((x) => !x.hora && x.d === f.getDate() && x.m === f.getMonth() + 1 && (!x.a || x.a === f.getFullYear()));
  return ordenar(hoy);
}
export const diaDeHoy = (f = new Date()) => diasDeHoy(f)[0] || null;
// La frase de una hora puntual de hoy (por ejemplo, un 26/7 a las 20:25).
export function horaDeHoy(f = new Date(), min) {
  const hhmm = String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
  return todos().find((x) => x.hora === hhmm && x.d === f.getDate() && x.m === f.getMonth() + 1 && (!x.a || x.a === f.getFullYear())) || null;
}
// El banner de hoy se puede cerrar con la cruz: el color de la app queda, el banner vuelve mañana.
const isoHoy = (f) => f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate();
export const bannerCerrado = (f = new Date()) => !sesion("demoDia") && leer("diaCerrado") === isoHoy(f);
export const cerrarBanner = (f = new Date()) => guardar("diaCerrado", isoHoy(f), true);

export const diasPrendidos = () => leer("diasColorOn", true) !== false;

// Tiñe la app (o la destiñe). Se llama al pintar.
export function aplicarDia(f = new Date()) {
  const raiz = document.documentElement;
  const d = diasPrendidos() ? diaDeHoy(f) : null;
  if (d) raiz.dataset.dia = d.tema; else delete raiz.dataset.dia;
  return d;
}

// Para Ajustes › Inicio: dónde está el doc, cuántas fechas hay, cuál viene y algunas para probar.
export function infoDias(f = new Date()) {
  const r = referencias(), lista = todos().filter((x) => !x.hora);
  let proximo = null;
  for (let i = 1; i <= 366 && !proximo; i++) {
    const g = new Date(f.getFullYear(), f.getMonth(), f.getDate() + i);
    const x = lista.find((y) => y.d === g.getDate() && y.m === g.getMonth() + 1 && (!y.a || y.a === g.getFullYear()));
    if (x) proximo = `${x.d}/${x.m} · ${x.frase}`;
  }
  const vistos = new Set(), prueba = [];
  for (const x of lista) { if (vistos.has(x.tema)) continue; vistos.add(x.tema); prueba.push([clave(x), `${x.d}/${x.m} · ${x.frase.split(/[.,]/)[0]}`]); }
  return { doc: r?.doc, nombre: r?.nombre, falta: !!r?.falta, cuantos: lista.length, proximo, prueba };
}
