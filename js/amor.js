// Amorcitos compartido: lo mismo se ve en Orbe (universo Amorcitos) y en la página de Agus (/amorcitos).
// Este archivo no trae nada más de Orbe: lo usa también la página de Agus, que no carga el resto de la app.
// Los datos viven en el servidor (/api/amor), no en tu planilla.

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ORDEN = [1, 2, 3, 4, 5, 6, 0];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// ---------- Guardado local (para abrir rápido y sin señal) ----------
let CLAVE = "orbe.amorDoc";
export function usarClave(c) { CLAVE = c; }
export function docLocal() { try { return JSON.parse(localStorage.getItem(CLAVE) || "null"); } catch (e) { return null; } }
function guardarLocal(d) { try { localStorage.setItem(CLAVE, JSON.stringify({ ...d, visto: Date.now() })); } catch (e) { /* nada */ } }

// ---------- Servidor ----------
export async function traer() {
  const r = await fetch("/api/amor/datos", { credentials: "same-origin", cache: "no-store" });
  if (r.status === 401) throw new Error("sin-sesion");
  if (!r.ok) throw new Error("red");
  const d = await r.json(); guardarLocal(d); return d;
}
export async function op(o) {
  const r = await fetch("/api/amor/op", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "red");
  guardarLocal(d); return d;
}
export async function importar(doc) {
  const r = await fetch("/api/amor/importar", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(doc) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "red");
  guardarLocal(d); return d;
}

// ---------- Fechas ----------
const dia0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const desde = (iso) => new Date(iso.slice(0, 10) + "T12:00");
const diasA = (iso, hoy) => Math.round((dia0(desde(iso)) - dia0(hoy)) / 86400000);
function proximaAnual(iso, hoy) {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  let f = new Date(hoy.getFullYear(), m - 1, d, 12);
  if (dia0(f) < dia0(hoy)) f = new Date(hoy.getFullYear() + 1, m - 1, d, 12);
  return { fecha: f, dias: Math.round((dia0(f) - dia0(hoy)) / 86400000) };
}
const cuando = (n) => n === 0 ? "¡hoy!" : n === 1 ? "mañana" : "en " + n + " días";
const corta = (iso) => { const d = new Date(iso.length > 10 ? iso : iso + "T12:00"); return DIAS[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1) + (iso.length > 10 ? " · " + iso.slice(11, 16) : ""); };

// ---------- Pantalla ----------
// puedeTodo: Nacho (también suma fechas, viaje, vuelos y docs). Agus suma y tilda súper, menú, planes y pelis.
export function render(doc, hoy, { puedeTodo = false } = {}) {
  if (!doc) return `<section class="bloque"><p class="vacio">Cargando Amorcitos…</p></section>`;
  const items = doc.items || [];
  const fechas = items.filter((x) => x.tipo === "fecha" && x.fecha).map((x) => {
    const p = /anual/i.test(x.nota) ? proximaAnual(x.fecha, hoy) : { fecha: desde(x.fecha), dias: diasA(x.fecha, hoy) };
    return { ...x, cuando: p.fecha, dias: p.dias };
  }).filter((x) => x.dias >= 0).sort((a, b) => a.dias - b.dias);
  const viaje = items.filter((x) => x.tipo === "viaje" && x.fecha && diasA(x.fecha, hoy) >= 0).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const vuelos = items.filter((x) => x.tipo === "vuelo" && x.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const borrar = (x) => puedeTodo ? `<button class="am-x" data-am="item-borrar" data-id="${esc(x.id)}" aria-label="Sacar ${esc(x.titulo)}">${X}</button>` : "";
  const cuenta = (viaje || fechas.length) ? `<section class="bloque"><h2>Cuenta regresiva</h2>
    ${viaje ? `<div class="regresiva"><span class="cifra">${diasA(viaje.fecha, hoy)}</span><span><b>${diasA(viaje.fecha, hoy) === 1 ? "día" : "días"} para ${esc(viaje.titulo)}</b><br><span class="vacio">${esc(viaje.nota || corta(viaje.fecha))}</span></span>${borrar(viaje)}</div>` : ""}
    ${fechas.length ? `<ul class="lista" style="margin-top:${viaje ? 14 : 0}px">${fechas.map((x) => `<li><span>${esc(x.titulo)}<br><small class="vacio">${x.cuando.getDate()} de ${MESES[x.cuando.getMonth()]}</small></span><span class="der">${cuando(x.dias)}${borrar(x)}</span></li>`).join("")}</ul>` : ""}
    ${vuelos.length ? `<details class="mas"><summary>Vuelos (${vuelos.length})</summary><ul class="lista">${vuelos.map((v) => `<li><span>${esc(v.titulo)}<br><small class="vacio">${esc(v.nota)}</small></span><span class="der">${esc(corta(v.fecha))}${borrar(v)}</span></li>`).join("")}</ul></details>` : ""}</section>` : "";

  const tilde = (x, extra = "") => `<li><label><input type="checkbox" data-am="item-tilde" data-id="${esc(x.id)}" ${x.hecho ? "checked" : ""}><span class="${x.hecho ? "am-hecho" : ""}">${esc(x.titulo)}${x.nota || extra ? `<br><small class="vacio">${esc([extra, x.nota].filter(Boolean).join(" · "))}</small>` : ""}</span></label>${x.fecha ? `<span class="tag">${esc(corta(x.fecha))}</span>` : ""}<button class="am-x" data-am="item-borrar" data-id="${esc(x.id)}" aria-label="Sacar ${esc(x.titulo)}">${X}</button></li>`;
  const lista = (l, vacio, f) => `<ul class="lista tps">${l.filter((x) => !x.hecho).map(f).join("") || `<li class="vacio">${vacio}</li>`}</ul>`;
  const hechos = (l, nombre, f) => l.some((x) => x.hecho) ? `<details class="mas"><summary>${nombre} (${l.filter((x) => x.hecho).length})</summary><ul class="lista tps">${l.filter((x) => x.hecho).map(f).join("")}</ul></details>` : "";
  const planes = items.filter((x) => x.tipo === "plan").sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
  const ver = items.filter((x) => x.tipo === "peli" || x.tipo === "serie");
  const fVer = (x) => tilde(x, x.tipo === "serie" ? "Serie" : "Peli");
  const bPlanes = `<section class="bloque"><h2>Planes y salidas</h2>${lista(planes, "Ningún plan anotado.", (x) => tilde(x))}${hechos(planes, "Hechos", (x) => tilde(x))}
    <form class="form am-form" data-am-form="plan"><input name="titulo" placeholder="Un plan (cena, salida…)" aria-label="Sumar un plan" required autocomplete="off"><input name="fecha" type="date" aria-label="Cuándo (opcional)"><button class="btn">Sumar</button></form></section>`;
  const bVer = `<section class="bloque"><h2>Para ver</h2>${lista(ver, "Nada en la lista todavía.", fVer)}${hechos(ver, "Vistas", fVer)}
    <form class="form am-form" data-am-form="ver"><input name="titulo" placeholder="Peli o serie" aria-label="Sumar algo para ver" required autocomplete="off"><select name="tipo" aria-label="Qué es"><option value="peli">Peli</option><option value="serie">Serie</option></select><button class="btn">Sumar</button></form></section>`;
  const docs = items.filter((x) => x.tipo === "doc" && /^https:\/\//.test(x.url));
  const bDocs = docs.length ? `<section class="bloque"><h2>Docs</h2><div class="chips">${docs.map((d) => `<a class="chip" href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.titulo)}</a>`).join("")}</div></section>` : "";

  const sup = doc.super || [];
  const bSuper = `<section class="bloque"><h2>Lista del súper</h2>
    <ul class="lista">${sup.length ? sup.map((it) => `<li><label class="am-sup"><input type="checkbox" data-am="super-tilde" data-id="${esc(it.id)}" ${it.ok ? "checked" : ""}><span class="${it.ok ? "am-hecho" : ""}">${esc(it.t)}</span></label>
      <button class="am-x" data-am="super-borrar" data-id="${esc(it.id)}" aria-label="Sacar ${esc(it.t)}">${X}</button></li>`).join("") : '<li class="vacio">La lista está vacía.</li>'}</ul>
    <form class="form" data-am-form="super"><input name="texto" placeholder="Agregar algo" aria-label="Agregar a la lista" required autocomplete="off"><button class="btn">Sumar</button></form>
    ${sup.some((x) => x.ok) ? '<div class="chips" style="margin-top:10px"><button class="chip" data-am="super-limpiar">Sacar lo tildado</button></div>' : ""}</section>`;
  const menu = doc.menu || {};
  const bMenu = `<section class="bloque"><h2>Menú de la semana</h2><div class="am-menu">${ORDEN.map((d) => `<label><span>${DIAS[d]}</span>
    <input data-am-menu="${d}" value="${esc(menu[d] || "")}" placeholder="¿Qué se come?" autocomplete="off"></label>`).join("")}</div></section>`;

  const bNacho = puedeTodo ? `<details class="bloque plegable"><summary>Sumar una fecha, el viaje, un vuelo o un doc</summary>
    <form class="form am-form am-otro" data-am-form="otro"><select name="tipo" aria-label="Qué es"><option value="fecha">Fecha (aniversario, cumple)</option><option value="viaje">Viaje</option><option value="vuelo">Vuelo</option><option value="doc">Doc (link)</option></select>
      <input name="titulo" placeholder="Nombre" required autocomplete="off"><input name="fecha" type="date" aria-label="Fecha"><input name="nota" placeholder="Nota (para que se repita cada año, poné «anual»)" autocomplete="off"><input name="url" placeholder="Link del doc (https://…)" autocomplete="off"><button class="btn">Sumar</button></form>
    <p class="fuente-dato">Agus ve todo esto, pero solo vos sumás o sacás fechas, viaje, vuelos y docs.</p></details>` : "";
  return cuenta + bSuper + bMenu + bPlanes + bVer + bDocs + bNacho;
}

// ---------- Toques ----------
// Se engancha una sola vez al documento. «cambio(doc)» repinta; «aviso(texto)» muestra un cartelito.
export function conectar({ cambio, aviso }) {
  const hacer = (o, ok) => op(o).then((d) => { cambio(d); if (ok) aviso?.(ok); }).catch((e) => aviso?.(e.message === "sin-sesion" ? "Se cerró la sesión: volvé a entrar" : e.message === "permiso" ? "Eso lo maneja Nacho" : "No se pudo guardar: probá con señal"));
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-am]");
    if (!b || b.type === "checkbox") return;
    const t = b.dataset.am;
    if (t === "super-borrar" || t === "item-borrar") hacer({ t, id: b.dataset.id });
    else if (t === "super-limpiar") hacer({ t }, "Listo");
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset?.am === "super-tilde") hacer({ t: "super-tilde", id: el.dataset.id, ok: el.checked });
    else if (el.dataset?.am === "item-tilde") hacer({ t: "item-tilde", id: el.dataset.id, hecho: el.checked });
    else if (el.dataset?.amMenu != null) hacer({ t: "menu", dia: Number(el.dataset.amMenu), texto: el.value }, "Menú guardado");
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-am-form]");
    if (!f) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const k = f.dataset.amForm;
    if (k === "super") hacer({ t: "super-sumar", texto: d.texto });
    else if (k === "plan") hacer({ t: "item-sumar", item: { tipo: "plan", titulo: d.titulo, fecha: d.fecha } }, "Plan anotado");
    else if (k === "ver") hacer({ t: "item-sumar", item: { tipo: d.tipo, titulo: d.titulo } }, "Anotado");
    else if (k === "otro") hacer({ t: "item-sumar", item: { tipo: d.tipo, titulo: d.titulo, fecha: d.fecha, nota: d.nota, url: d.url } }, "Agregado");
    setTimeout(() => document.querySelector(`[data-am-form="${k}"] input`)?.focus(), 50);
  });
}
