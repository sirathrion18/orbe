// Checklists que armás vos: se crean desde el «+», viven en Inicio hasta que tildás todo
// y después quedan en la página Checklists, listos para volver a usar.
import { leer, guardar, sesion } from "./almacen.js";
import { UNIVERSOS } from "./config.js";
import { ICONOS } from "./iconos.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const CLAVE = "checklists";
const MAX_COMPLETOS = 30;

export const todos = () => leer(CLAVE, []);
const guardarTodos = (l) => guardar(CLAVE, l);
export const abiertos = () => todos().filter((c) => !c.hecho);
export const completos = () => todos().filter((c) => c.hecho).sort((a, b) => (b.hecho || "").localeCompare(a.hecho || ""));

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fechaCorta = (d = new Date()) => d.getDate() + "/" + (d.getMonth() + 1);

// Un ítem por renglón; se sacan viñetas o guiones pegados de otro lado.
export function itemsDeTexto(texto) {
  return String(texto || "").split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)]|\[\s?[xX]?\s?\])\s*/, "").trim()).filter(Boolean);
}

export function crear(titulo, texto, universo) {
  const items = itemsDeTexto(texto);
  if (!items.length) return null;
  const c = { id: nuevoId(), titulo: String(titulo || "").trim() || "Checklist del " + fechaCorta(), u: universo || "", creado: new Date().toISOString(), hecho: null, items: items.map((t) => ({ t, ok: false })) };
  guardarTodos([c, ...todos()]);
  return c;
}

function cambiar(id, fn) {
  const l = todos();
  const c = l.find((x) => x.id === id);
  if (!c) return null;
  fn(c);
  // Se completa sola cuando está todo tildado, y se reabre si destildás algo.
  const lleno = c.items.length > 0 && c.items.every((i) => i.ok);
  c.hecho = lleno ? (c.hecho || new Date().toISOString()) : null;
  // Los completos más viejos se van para que la lista no crezca para siempre.
  const comp = l.filter((x) => x.hecho).sort((a, b) => b.hecho.localeCompare(a.hecho));
  const fuera = new Set(comp.slice(MAX_COMPLETOS).map((x) => x.id));
  guardarTodos(l.filter((x) => !fuera.has(x.id)));
  return c;
}

export const tildar = (id, i) => cambiar(id, (c) => { if (c.items[i]) c.items[i].ok = !c.items[i].ok; });
export const sumarItem = (id, texto) => cambiar(id, (c) => { itemsDeTexto(texto).forEach((t) => c.items.push({ t, ok: false })); });
export const sacarItem = (id, i) => cambiar(id, (c) => { c.items.splice(i, 1); });
export const usarDeNuevo = (id) => cambiar(id, (c) => { c.items.forEach((i) => { i.ok = false; }); });
export const borrarChecklist = (id) => guardarTodos(todos().filter((c) => c.id !== id));
// Editar todo junto: nombre, universo y los ítems (texto y orden). Los tildes se respetan.
export function editar(id, { titulo, u, items }) {
  const limpios = (items || []).map((i) => ({ t: String(i.t || "").trim(), ok: !!i.ok })).filter((i) => i.t);
  if (!limpios.length) return null;
  return cambiar(id, (c) => {
    c.titulo = String(titulo || "").trim() || c.titulo;
    c.u = UNIVERSOS.some((x) => x.nombre === u) ? u : "";
    c.items = limpios;
  });
}

// El color de la barra es el del universo (lo resuelve quien pinta, porque depende del tema).
let colorU = () => null;
export const usarColores = (fn) => { colorU = fn; };
const colorDe = (c) => {
  const u = UNIVERSOS.find((x) => x.nombre === c.u);
  return (u && colorU(u)) || "var(--text)";
};

// Barra de progreso en tramos, uno por ítem, como los tramos del anillo.
const barra = (c) => `<span class="chk-barra" aria-hidden="true" style="--c:${colorDe(c)}">${c.items.map((i) => `<i class="${i.ok ? "ok" : ""}"></i>`).join("")}</span>`;
const cuenta = (c) => { const n = c.items.filter((i) => i.ok).length; return `${n} de ${c.items.length}`; };

// ---------- Inicio ----------
// Cada checklist abierto es una tarjeta a lo ancho: se tilda ahí mismo y lo tildado se va.
export function wChecklists(maxTarjetas = 3, maxItems = 4) {
  const l = abiertos();
  if (!l.length) return "";
  const tarjetas = l.slice(0, maxTarjetas).map((c) => {
    const pend = c.items.map((it, i) => ({ ...it, i })).filter((x) => !x.ok);
    const resto = pend.length - maxItems;
    return `<div class="w ancho chk" data-id="${esc(c.id)}">
      <div class="fila"><a class="chk-tit" href="#/checklists">${esc(c.titulo)}</a><span class="chk-cuenta">${cuenta(c)}</span></div>
      ${barra(c)}
      <ul class="chk-items">${pend.slice(0, maxItems).map((x) => `<li><button class="chk-item" data-accion="chk-tildar" data-id="${esc(c.id)}" data-i="${x.i}" aria-label="Tildar: ${esc(x.t)}"><span class="caja">${ICONOS.check}</span><span class="txt">${esc(x.t)}</span></button></li>`).join("")}</ul>
      ${resto > 0 ? `<a class="chk-mas" href="#/checklists">y ${resto} más ›</a>` : ""}</div>`;
  });
  const extra = l.length - maxTarjetas;
  return tarjetas.join("") + (extra > 0 ? `<a class="w ancho chk-otros" href="#/checklists">${extra === 1 ? "1 checklist más" : extra + " checklists más"} ›</a>` : "");
}

// ---------- Página ----------
// Modo edición: nombre, universo, y cada ítem como un campo con ↑ ↓ y ✕.
export const filaEdicion = (t = "", ok = false) => `<li class="chk-ed-item" data-ok="${ok ? 1 : 0}">
    <span class="chk-ed-flechas"><button type="button" data-accion="chk-ed-mover" data-d="-1" aria-label="Subir">↑</button><button type="button" data-accion="chk-ed-mover" data-d="1" aria-label="Bajar">↓</button></span>
    <input class="campo-linea" value="${esc(t)}" aria-label="Ítem" autocomplete="off" placeholder="Ítem">
    <button type="button" class="chk-sacar" data-accion="chk-ed-sacar" aria-label="Sacar este ítem">${ICONOS.cruz}</button></li>`;
function edicion(c0) {
  const b = sesion("chkBorrador");
  const c = b && b.id === c0.id ? { ...c0, titulo: b.titulo, u: b.u, items: b.items } : c0;
  return `<section class="bloque chk-bloque editando" id="chk-${esc(c.id)}">
    <form data-form="chk-editar" data-id="${esc(c.id)}">
      <label class="chk-ed-lbl" for="chk-ed-t-${esc(c.id)}">Nombre</label>
      <input id="chk-ed-t-${esc(c.id)}" name="titulo" class="campo-linea chk-ed-tit" value="${esc(c.titulo)}" autocomplete="off">
      <span class="chk-ed-lbl">Ítems</span>
      <ul class="chk-ed-lista">${c.items.map((i) => filaEdicion(i.t, i.ok)).join("")}</ul>
      <button type="button" class="chip" data-accion="chk-ed-sumar">+ Sumar un ítem</button>
      <div class="grupo"><span class="chk-ed-lbl">Universo</span><div class="chips"><label class="chip ${!c.u ? "on" : ""}"><input type="radio" name="u" value="" class="sr" ${!c.u ? "checked" : ""}>Ninguno</label>${UNIVERSOS.map((u) => `<label class="chip ${c.u === u.nombre ? "on" : ""}"><input type="radio" name="u" value="${esc(u.nombre)}" class="sr" ${c.u === u.nombre ? "checked" : ""}>${esc(u.nombre)}</label>`).join("")}</div></div>
      <div class="chk-ed-botones"><button type="button" class="btn sec" data-accion="chk-ed-cancelar">Cancelar</button><button class="btn">Listo</button></div>
    </form></section>`;
}
function bloque(c, abierto) {
  if (sesion("chkEditando") === c.id) return edicion(c);
  const items = c.items.map((it, i) => `<li class="${it.ok ? "ok" : ""}">
      <button class="chk-item" data-accion="chk-tildar" data-id="${esc(c.id)}" data-i="${i}" aria-pressed="${it.ok}"><span class="caja">${ICONOS.check}</span><span class="txt">${esc(it.t)}</span></button>
      <button class="chk-sacar" data-accion="chk-sacar" data-id="${esc(c.id)}" data-i="${i}" aria-label="Sacar «${esc(it.t)}»">${ICONOS.cruz}</button></li>`).join("");
  const fecha = new Date(abierto ? c.creado : c.hecho);
  return `<section class="bloque chk-bloque" id="chk-${esc(c.id)}">
    <div class="chk-cab"><h2>${esc(c.titulo)}</h2><span class="chk-cuenta">${cuenta(c)}</span></div>
    <p class="chk-meta">${c.u ? esc(c.u) + " · " : ""}${abierto ? "creado el" : "completo el"} ${fechaCorta(fecha)}</p>
    ${barra(c)}
    <ul class="chk-items todos">${items}</ul>
    ${abierto ? `<form class="form chk-sumar" data-form="chk-sumar" data-id="${esc(c.id)}"><input name="t" placeholder="Sumar un ítem" aria-label="Sumar un ítem a ${esc(c.titulo)}" autocomplete="off" required><button class="btn sec">Sumar</button></form>` : ""}
    <div class="chips chk-acciones"><button class="chip" data-accion="chk-editar" data-id="${esc(c.id)}">Editar</button>${abierto ? "" : `<button class="chip" data-accion="chk-de-nuevo" data-id="${esc(c.id)}">Usar de nuevo</button>`}
      <button class="chip chk-borrar" data-accion="chk-borrar" data-id="${esc(c.id)}">Borrar checklist</button></div></section>`;
}

export function renderChecklists() {
  const volver = `<a class="volver" href="#/">${ICONOS.volver} Inicio</a>`;
  const ab = abiertos(), co = completos();
  return `<div class="pagina chk-pag">${volver}<h1>Checklists</h1>
    <p class="bajada">Los abiertos están en Inicio hasta que tildás todo.</p>
    <div class="chips" style="margin:-4px 0 18px"><button class="btn" data-accion="nuevo-chk">Nuevo checklist</button></div>
    ${ab.length ? ab.map((c) => bloque(c, true)).join("") : '<section class="bloque"><p class="vacio">No hay checklists abiertos. Armá uno con «Nuevo checklist» o con el + de Inicio.</p></section>'}
    ${co.length ? `<details class="chk-completos"${ab.length ? "" : " open"}><summary>Completos · ${co.length}</summary>${co.map((c) => bloque(c, false)).join("")}</details>` : ""}</div>`;
}

// ---------- Hoja del «+» ----------
export function formChecklist() {
  return `<form data-form="chk-nuevo">
    <label class="sr" for="chk-titulo">Nombre</label><input id="chk-titulo" name="titulo" class="campo-linea" placeholder="Nombre: Súper, Valija, Mudanza…" autocomplete="off">
    <label class="sr" for="chk-lineas">Ítems</label><textarea id="chk-lineas" name="items" class="campo-texto chk-lineas" placeholder="Un ítem por renglón" required></textarea>
    <p class="chk-contador" aria-live="polite">Cada renglón es un ítem.</p>
    ${("webkitSpeechRecognition" in window || "SpeechRecognition" in window) ? '<button type="button" class="btn sec dictar" data-accion="dictar" style="display:inline-flex;gap:8px;align-items:center"><span style="width:18px;height:18px;display:inline-flex">' + ICONOS.mic + '</span>Dictar un ítem</button>' : ""}
    <div class="grupo"><span>Universo (opcional)</span><div class="chips">${UNIVERSOS.map((u) => `<label class="chip"><input type="radio" name="u" value="${esc(u.nombre)}" class="sr">${esc(u.nombre)}</label>`).join("")}</div></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Crear checklist</button></div></form>`;
}
