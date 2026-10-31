// Huevitos: los guiños de Orbe, en chiquito y solo como íconos (una escarapela, la banda roja, una telita).
// Aparecen adentro del reloj en su momento y, si los tocás, te dicen qué son. Nunca más de uno a la vez.
// Qué íconos, a qué hora y qué dicen vive en tu Drive (doc «Orbe · referencias»); acá solo están los dibujos.
// Además: palabras secretas en el buscador (también de tu doc), mantener apretado el punto del logo y una tecla famosa.
// Todo con formas propias: ningún personaje, persona, cara, logo ni escudo.
import { leer, guardar, sesion } from "./almacen.js";
import { nivelGuinos } from "./guinos.js";
import { referencias } from "./dias.js";

export const huevosPrendidos = () => nivelGuinos() !== "ninguno";
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dos = (n) => String(n).padStart(2, "0");

// ---------- Dibujitos (12 px, genéricos) ----------
const svg = (cuerpo, clase = "") => `<svg class="hv-svg ${clase}" viewBox="0 0 12 12" aria-hidden="true">${cuerpo}</svg>`;
export const D = {
  copa: svg('<path d="M3 1h6v2.6A3 3 0 0 1 3 3.6z" fill="currentColor"/><path d="M3 2H1.4v.8A1.8 1.8 0 0 0 3.2 4.6M9 2h1.6v.8a1.8 1.8 0 0 1-1.8 1.8" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M5.3 6.4h1.4v2.2H5.3zM3.8 9.2h4.4v1.4H3.8z" fill="currentColor"/>', "hv-oro"),
  copaRoja: svg('<path d="M3 1h6v2.6A3 3 0 0 1 3 3.6z" fill="currentColor"/><path d="M3 2H1.4v.8A1.8 1.8 0 0 0 3.2 4.6M9 2h1.6v.8a1.8 1.8 0 0 1-1.8 1.8" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M5.3 6.4h1.4v2.2H5.3zM3.8 9.2h4.4v1.4H3.8z" fill="currentColor"/>', "hv-rojo"),
  estrellas: `<svg class="hv-svg hv-ancho" viewBox="0 0 30 12" aria-hidden="true">${[5, 15, 25].map((x) => `<path transform="translate(${x - 5} 1)" d="M5 0l1.2 3.4H9.8L6.9 5.5 8 9 5 6.9 2 9l1.1-3.5L.2 3.4h3.6z" fill="currentColor"/>`).join("")}</svg>`,
  tela: svg('<path d="M0 0h12M0 0l11 7M0 0l5 12M0 0v12M4 0Q3.5 2.5 0 3M8 0Q7 4.5 2.6 6Q1 6.6 0 6.6" fill="none" stroke="currentColor" stroke-width=".6"/>', "hv-tela"),
  // La camiseta blanca con la banda roja: nace abajo, en la cadera derecha del que la lleva, y termina arriba sobre el hombro izquierdo, sin tocar el cuello (dibujo propio, sin escudo).
  banda: `<svg class="hv-svg" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="hv-cam"><path d="M8.2 2.2 3.4 4.6 1 9.6l3.8 1.7 1.2-1.6V22h12V9.7l1.2 1.6L23 9.6l-2.4-5-4.8-2.4c-.7 1.7-2.1 2.6-3.8 2.6s-3.1-.9-3.8-2.6z"/></clipPath></defs><path d="M8.2 2.2 3.4 4.6 1 9.6l3.8 1.7 1.2-1.6V22h12V9.7l1.2 1.6L23 9.6l-2.4-5-4.8-2.4c-.7 1.7-2.1 2.6-3.8 2.6s-3.1-.9-3.8-2.6z" fill="#fff"/><g clip-path="url(#hv-cam)"><path d="M18.5 0h4.4L8.6 23H4.2z" fill="#E30613"/></g><path d="M8.2 2.2 3.4 4.6 1 9.6l3.8 1.7 1.2-1.6V22h12V9.7l1.2 1.6L23 9.6l-2.4-5-4.8-2.4c-.7 1.7-2.1 2.6-3.8 2.6s-3.1-.9-3.8-2.6z" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width=".8" stroke-linejoin="round"/></svg>`,
  mate: svg('<path d="M3.2 4.4h5.6c.3 3.8-1 6.6-2.8 6.6S2.9 8.2 3.2 4.4z" fill="currentColor"/><path d="M6.6 4.4L9.6.6" stroke="currentColor" stroke-width=".9" fill="none"/><path d="M3 4.4h6" stroke="currentColor" stroke-width=".8"/>', "hv-verde"),
  espiral: svg('<path d="M6 6.2a.8.8 0 1 1 .9-.9 1.7 1.7 0 0 1-1.8 1.9A2.6 2.6 0 0 1 3.4 4.5 3.4 3.4 0 0 1 7 1.6a4.4 4.4 0 0 1 3.6 4.6A5 5 0 0 1 6 11" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>', "hv-naranja"),
  cuadros: svg('<rect x="1" y="1" width="5" height="5" fill="#1F7A46"/><rect x="6" y="6" width="5" height="5" fill="#1F7A46"/><rect x="6" y="1" width="5" height="5" fill="currentColor"/><rect x="1" y="6" width="5" height="5" fill="currentColor"/>'),
  circulo: svg('<circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="6" cy="6" r="1.4" fill="currentColor"/>', "hv-violeta"),
  pelota: svg('<circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M6 3.4l2.2 1.6-.8 2.6H4.6l-.8-2.6z" fill="currentColor"/>'),
  escarapela: svg('<circle cx="6" cy="6" r="5.4" fill="#75AADB"/><circle cx="6" cy="6" r="3.6" fill="#fff"/><circle cx="6" cy="6" r="1.9" fill="#75AADB"/>'),
  bandera: `<svg class="hv-svg hv-ancho" viewBox="0 0 18 12" aria-hidden="true"><rect width="18" height="4" fill="#75AADB"/><rect y="4" width="18" height="4" fill="#fff"/><rect y="8" width="18" height="4" fill="#75AADB"/><rect width="18" height="12" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width=".6"/></svg>`,
  estrella: svg('<path d="M6 .8l1.4 3.6h3.8L8.2 6.7l1.1 3.8L6 8.3l-3.3 2.2 1.1-3.8L.8 4.4h3.8z" fill="currentColor"/>'),
  orbita: svg('<circle cx="5.4" cy="6.6" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9.4" cy="2.6" r="1.6" fill="#C8102E"/>'),
  corazon: svg('<path d="M6 10.6S1 7.6 1 4.4A2.6 2.6 0 0 1 6 3.2a2.6 2.6 0 0 1 5 1.2c0 3.2-5 6.2-5 6.2z" fill="#D6457A"/>'),
  nota: svg('<path d="M4.4 9.4V2.2l5.6-1.2v7" fill="none" stroke="currentColor" stroke-width=".9"/><circle cx="3.2" cy="9.4" r="1.4" fill="currentColor"/><circle cx="8.8" cy="8" r="1.4" fill="currentColor"/>')
};
// Del nombre del doc al dibujo.
const DIBUJO = { escarapela: D.escarapela, bandera: D.bandera, banda: D.banda, copa: D.copa, "copa-roja": D.copaRoja, estrellas: D.estrellas, estrella: D.estrella, telita: D.tela, pelota: D.pelota, mate: D.mate, nota: D.nota, orbita: D.orbita, corazon: D.corazon };
export const dibujoRef = (k) => DIBUJO[k] || "";

// ---------- El catálogo (armado con tu doc) ----------
let catalogoDe = null, H = [], AZARES = [], PALABRAS = [];
function catalogo() {
  const r = referencias();
  const firma = r ? r.cuando : 0;
  if (catalogoDe === firma) return;
  catalogoDe = firma; H = [];
  const sumar = (id, html, que, prio, cuando) => H.push({ id, lugar: "reloj", html, que, prio, cuando });
  (r?.horas || []).forEach((x) => sumar("h" + x.hora.replace(":", ""), dibujoRef(x.icono), x.texto, 3, (c) => c.hhmm === x.hora));
  // Días de River (de los datos de River que ya trae Orbe).
  sumar("river-previa", D.banda, "Falta menos de una hora para que juegue River.", 3.5, (c) => c.partido && c.minPartido > 0 && c.minPartido <= 60);
  sumar("river-juega", D.pelota, "River está jugando.", 3.5, (c) => c.partido && c.minPartido <= 0 && c.minPartido > -115);
  (r?.azar || []).forEach((x, i) => sumar("a-" + x.icono + "-" + i, dibujoRef(x.icono), x.texto, 0, null));
  AZARES = H.filter((h) => h.cuando === null);
  PALABRAS = (r?.palabras || []).map((x) => [x.ps, `${x.icono ? dibujoRef(x.icono) + " " : ""}${esc(x.texto)}`]);
}
export const HUEVOS = () => { catalogo(); return H.map(({ id, lugar, que }) => ({ id, lugar, que })); };

// ---------- Elegir los de ahora ----------
function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function contexto(ctx) {
  const f = ctx?.fecha instanceof Date ? ctx.fecha : new Date();
  const min = Number.isFinite(ctx?.min) ? ctx.min : f.getHours() * 60 + f.getMinutes();
  const hh = Math.floor(min / 60), mm = min % 60;
  const c = { f, d: f.getDate(), m: f.getMonth() + 1, a: f.getFullYear(), dow: f.getDay(), min, hh, hhmm: dos(hh) + ":" + dos(mm),
    ultimoDelMes: new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1).getDate() === 1, partido: false, minPartido: 0 };
  // El partido: el de los datos de River ({fecha}) o el de la agenda de hoy ({ini} en minutos).
  const p = ctx?.partido !== undefined && ctx?.partido !== null ? ctx.partido : leer("river")?.proximo;
  if (p && Number.isFinite(p.ini) && !p.fecha) { c.partido = true; c.minPartido = p.ini - min; }
  else if (p?.fecha) {
    const t = new Date(p.fecha);
    if (t.getFullYear() === c.a && t.getMonth() + 1 === c.m && t.getDate() === c.d) {
      c.partido = true;
      c.minPartido = t.getHours() * 60 + t.getMinutes() - min;
    }
  }
  c.dia = c.a + "-" + c.m + "-" + c.d;
  c.rato = Math.floor(min / 120);
  return c;
}
// Uno de los «al azar» para este rato de 2 horas (o ninguno): nunca el mismo que en el rato anterior.
function azarDe(dia, rato) {
  if (!AZARES.length) return null;
  if (hash(dia + "#" + rato + "?") % 100 >= 50) return null;
  const n = AZARES.length;
  let i = hash(dia + "#" + rato) % n;
  const antes = rato > 0 ? hash(dia + "#" + (rato - 1)) % n : -1;
  if (i === antes) i = (i + 1) % n;
  return AZARES[i];
}
let memo = { clave: "", activos: [] };
export function activos(ctx) {
  catalogo();
  const c = contexto(ctx);
  const forzado = sesion("demoHuevo");
  const clave = c.dia + "-" + c.min + "-" + c.partido + "-" + c.minPartido + "-" + (forzado || "") + "-" + nivelGuinos();
  if (memo.clave === clave) return memo.activos;
  let lista = [];
  if (huevosPrendidos()) {
    const f = forzado && H.find((h) => h.id === forzado);
    const cand = H.filter((h) => h.cuando && h.cuando(c));
    const az = azarDe(c.dia, c.rato);
    if (az) cand.push(az);
    cand.sort((x, y) => y.prio - x.prio);
    if (f) cand.unshift(f);
    for (const h of cand) {
      if (lista.length >= 1) break;
      if (lista.some((x) => x.lugar === h.lugar || x.id === h.id)) continue;
      lista.push(h);
    }
  }
  memo = { clave, activos: lista };
  return lista;
}

// ---------- Lo que usa Inicio ----------
// huevo("fecha" | "saludo" | "reloj" | "pie" | "vacio", ctx) → un pedacito de HTML, o "" si ahora no toca.
export function huevo(lugar, ctx) {
  if (!huevosPrendidos() || lugar !== "reloj") return "";
  const h = activos(ctx).find((x) => x.lugar === lugar);
  if (!h || !h.html) return "";
  visto(h.id);
  return `<span class="hv hv-${lugar}" data-hv="${h.id}" role="img" aria-label="${esc(h.que)}">${h.html}</span>`;
}

// Los que ya encontraste (se sincronizan entre el celu y la compu).
export const huevosVistos = () => leer("huevosVistos", []);
function visto(id) {
  const v = huevosVistos();
  if (v.includes(id)) return;
  guardar("huevosVistos", [...v, id].slice(-600));
}

// ---------- Interactivos ----------
let timerEco;
function eco(html, id) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(".hv-eco");
  if (!el) { el = document.createElement("div"); el.className = "hv-eco"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); }
  el.innerHTML = `<span class="hv-eco-t">${html}</span>`;
  el.classList.remove("on"); void el.offsetWidth; el.classList.add("on");
  clearTimeout(timerEco);
  timerEco = setTimeout(() => el.classList.remove("on"), 3800);
  if (id) visto(id);
}
const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normSinAcento = (s) => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
export function palabraSecreta(texto) {
  catalogo();
  const t = norm(texto), u = normSinAcento(texto);
  const i = PALABRAS.findIndex(([ps]) => ps.some((p) => p === t || normSinAcento(p) === u));
  return i < 0 ? null : { id: "p" + i, html: PALABRAS[i][1] };
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konami = 0, tecladoListo = false;

// Se llama después de pintar Inicio (una vez por pintada; no duplica escuchas).
export function huevosDespues(raiz) {
  if (!raiz || typeof document === "undefined" || !huevosPrendidos()) return;
  if (raiz.dataset.hvListo === "1") return;
  raiz.dataset.hvListo = "1";
  // Tocar un huevito: te dice qué es.
  raiz.addEventListener("click", (e) => {
    const h = e.target.closest?.(".hv[data-hv]");
    if (!h) return;
    eco(esc(h.getAttribute("aria-label")), "t-revela");
  });
  // Mantener apretado el punto rojo del logo de abajo.
  let apretar = null;
  raiz.addEventListener("pointerdown", (e) => {
    const m = e.target.closest?.('[data-hv-marca], .pie .marca');
    if (!m) return;
    apretar = setTimeout(() => { m.classList.add("hv-gira"); setTimeout(() => m.classList.remove("hv-gira"), 1400); eco(`${D.orbita} Orbe gira desde la v0.1.`, "t-marca"); }, 700);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => raiz.addEventListener(ev, () => clearTimeout(apretar)));
  // Palabras secretas en el buscador.
  const q = raiz.querySelector("#q");
  if (q && q.dataset.hvListo !== "1") {
    q.dataset.hvListo = "1";
    let ultima = "";
    q.addEventListener("input", () => {
      const p = palabraSecreta(q.value);
      if (p && p.id !== ultima) { ultima = p.id; eco(p.html, p.id); }
      if (!p) ultima = "";
    });
  }
  // La tecla famosa, en la compu.
  if (!tecladoListo) {
    tecladoListo = true;
    document.addEventListener("keydown", (e) => {
      if (e.target?.closest?.("input, textarea, select, [contenteditable]")) { konami = 0; return; }
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      konami = k === KONAMI[konami] ? konami + 1 : (k === KONAMI[0] ? 1 : 0);
      if (konami === KONAMI.length) { konami = 0; if (huevosPrendidos()) eco("↑↑↓↓←→←→BA. Treinta vidas no, pero el día rinde.", "t-konami"); }
    });
  }
}

// Para Ajustes: cuántos hay y cuántos encontraste.
export function cuentaHuevos() {
  catalogo();
  const ids = new Set([...H.map((h) => h.id), ...PALABRAS.map((_, i) => "p" + i), "t-marca", "t-konami", "t-revela"]);
  return { total: ids.size, vistos: huevosVistos().filter((x) => ids.has(x)).length };
}
// Algunos para probar desde Ajustes (se fuerzan con sesion("demoHuevo")).
export function huevosPrueba() { catalogo(); return H.filter((h) => h.html).slice(0, 8).map((h) => [h.id, h.que.split(/[.:]/)[0].slice(0, 22)]); }
