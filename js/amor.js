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
// Orden (Nacho, 31/10): el mundito chiquito arriba (se abre en grande), súper, menú, ¿dónde comemos?,
// para ver, planes, salidas culturales y docs.
const CATS = { recital: "Recital", concierto: "Concierto", jazz: "Jazz", teatro: "Teatro", feria: "Feria", cine: "Cine", museo: "Museo", otro: "Salida" };
const ICO = {
  recital: '<path d="M12 3a3 3 0 013 3v5a3 3 0 01-6 0V6a3 3 0 013-3zM6 11a6 6 0 0012 0M12 17v4"/>',
  concierto: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  jazz: '<path d="M5 19c3 0 4-2 5-5l3-9h3"/><circle cx="7" cy="18" r="3"/>',
  teatro: '<path d="M4 5h9v6a4.5 4.5 0 01-9 0z"/><path d="M11 9h9v6a4.5 4.5 0 01-9 0"/>',
  feria: '<path d="M3 9l9-5 9 5M5 9v10h14V9M10 19v-5h4v5"/>',
  cine: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M8 6l2 4M14 6l2 4"/>',
  museo: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>', otro: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>' };
// El pingüino: cada tanto cruza la pantalla caminando. Si lo agarrás, se sorprende, se sonroja, dice «te amo» y se esconde.
const PINGU = `<svg viewBox="0 0 48 58" aria-hidden="true"><g class="pg-p pg-pi"><ellipse cx="17" cy="54" rx="5.5" ry="2.6" fill="#F2A33A"/></g><g class="pg-p pg-pd"><ellipse cx="31" cy="54" rx="5.5" ry="2.6" fill="#F2A33A"/></g>
  <g class="pg-c"><ellipse cx="24" cy="34" rx="15" ry="19" fill="#22232c"/><ellipse cx="24" cy="37" rx="10" ry="14" fill="#fff"/>
  <path class="pg-ai" d="M10 29c-5 5-5 11-3 13" stroke="#22232c" stroke-width="4" fill="none" stroke-linecap="round"/><path class="pg-ad" d="M38 29c5 5 5 11 3 13" stroke="#22232c" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="24" cy="15" r="11" fill="#22232c"/><ellipse cx="24" cy="17.5" rx="7" ry="6.2" fill="#fff"/>
  <g class="pg-o"><circle cx="21" cy="16" r="1.6" fill="#111"/><circle cx="27" cy="16" r="1.6" fill="#111"/></g>
  <g class="pg-oo"><circle cx="21" cy="15.6" r="2.6" fill="#fff" stroke="#111" stroke-width="1.2"/><circle cx="21" cy="15.8" r="1.2" fill="#111"/><circle cx="27" cy="15.6" r="2.6" fill="#fff" stroke="#111" stroke-width="1.2"/><circle cx="27" cy="15.8" r="1.2" fill="#111"/></g>
  <path d="M22 19.2l2 2.4 2-2.4z" fill="#F2A33A"/>
  <g class="pg-r"><ellipse cx="17.6" cy="20.4" rx="2.6" ry="1.5" fill="#F27E95"/><ellipse cx="30.4" cy="20.4" rx="2.6" ry="1.5" fill="#F27E95"/></g></g></svg>`;

let estadoGastro = { rubro: "", nuevo: false, salio: null, rk: "" };
let editando = "", salidasAbierta = false;
const LAPIZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const lapiz = (x) => `<button class="am-ed" data-am="editar" data-id="${esc(x.id)}" aria-label="Editar ${esc(x.titulo)}">${LAPIZ}</button>`;
// El formulario para corregir o borrar un ítem, en el mismo lugar donde estaba.
function edicion(x) {
  const sal = x.tipo === "salida";
  return `<form class="am-edita" data-am-form="editar" data-id="${esc(x.id)}">
    <input name="titulo" value="${esc(x.titulo)}" aria-label="Nombre" required autocomplete="off">
    ${sal ? `<div class="am-edita-fila"><select name="cat" aria-label="Qué fue">${Object.entries(CATS).map(([k, v]) => `<option value="${k}"${(x.cat || "otro") === k ? " selected" : ""}>${v}</option>`).join("")}</select>
      <label class="am-veces">Fuimos <input name="veces" type="number" min="1" max="99" value="${x.veces || 1}" inputmode="numeric"> ${(x.veces || 1) === 1 ? "vez" : "veces"}</label></div>`
      : `<input name="fecha" type="date" value="${esc((x.fecha || "").slice(0, 10))}" aria-label="Cuándo (opcional)">`}
    <input name="nota" value="${esc(x.nota || "")}" placeholder="Nota (opcional)" aria-label="Nota" autocomplete="off">
    <div class="am-edita-bot"><button class="btn">Guardar</button><button type="button" class="chip" data-am="no-editar">Cancelar</button><button type="button" class="chip am-borra" data-am="item-borrar" data-id="${esc(x.id)}">Borrar</button></div></form>`;
}

function gastroLista(doc) { return (doc.gastro?.lista || []).filter((g) => g.nombre); }
function dado(doc) {
  const l = gastroLista(doc).filter((g) => !g.afuera && (estadoGastro.nuevo ? g.porIr : !g.porIr) && (!estadoGastro.rubro || g.rubro === estadoGastro.rubro));
  if (!l.length) return null;
  // Los de mejor puntaje salen un poco más seguido.
  const pesos = l.map((g) => g.porIr ? 1 : Math.max(.3, (g.puntaje || 3) - 2.5));
  let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < l.length; i++) { r -= pesos[i]; if (r <= 0) return l[i]; }
  return l[l.length - 1];
}
const maps = (g) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([g.nombre, g.lugar, "Buenos Aires"].filter(Boolean).join(" "));

export function render(doc, hoy, { puedeTodo = false } = {}) {
  if (!doc) return `<section class="bloque"><p class="vacio">Cargando Amorcitos…</p></section>`;
  const items = doc.items || [];
  // ---- Portada: el mundito y lo que se viene ----
  const fechas = items.filter((x) => x.tipo === "fecha" && x.fecha).map((x) => {
    const p = /anual/i.test(x.nota) ? proximaAnual(x.fecha, hoy) : { fecha: desde(x.fecha), dias: diasA(x.fecha, hoy) };
    return { ...x, cuando: p.fecha, dias: p.dias };
  }).filter((x) => x.dias >= 0).sort((a, b) => a.dias - b.dias);
  const viaje = items.filter((x) => x.tipo === "viaje" && x.fecha && diasA(x.fecha, hoy) >= 0).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const lugares = items.filter((x) => x.tipo === "lugar");
  const nFui = lugares.filter((x) => x.hecho).length, nPaises = new Set(lugares.filter((x) => x.hecho).map((x) => x.iso)).size;
  const prox = [...(viaje ? [{ t: viaje.titulo, d: diasA(viaje.fecha, hoy), viaje: true }] : []), ...fechas.slice(0, 2).map((x) => ({ t: x.titulo, d: x.dias }))];
  const portada = `<section class="bloque am-portada"><div class="am-globo" id="am-globo" role="button" tabindex="0" aria-label="Abrir nuestro mundo" data-am="mundo"></div>
    <div class="am-port-txt"><span class="am-k">Nuestro mundo</span>
      <b class="am-port-n">${nFui ? `${nFui} lugares · ${nPaises} ${nPaises === 1 ? "país" : "países"}` : "Todavía sin lugares"}</b>
      ${prox.length ? `<ul>${prox.map((p) => `<li${p.viaje ? ' class="viaje"' : ""}><span>${esc(p.t)}</span><b>${cuando(p.d)}</b></li>`).join("")}</ul>` : ""}
      <button class="am-abrir" data-am="mundo">Abrir el mundo ›</button></div></section>`;

  const borrar = (x) => puedeTodo ? `<button class="am-x" data-am="item-borrar" data-id="${esc(x.id)}" aria-label="Sacar ${esc(x.titulo)}">${X}</button>` : "";
  const tilde = (x, extra = "") => editando === x.id ? `<li class="am-li-ed">${edicion(x)}</li>` : `<li><label><input type="checkbox" data-am="item-tilde" data-id="${esc(x.id)}" ${x.hecho ? "checked" : ""}><span class="${x.hecho ? "am-hecho" : ""}">${esc(x.titulo)}${x.nota || extra ? `<br><small class="vacio">${esc([extra, x.nota].filter(Boolean).join(" · "))}</small>` : ""}</span></label>${x.fecha ? `<span class="tag">${esc(corta(x.fecha))}</span>` : ""}${lapiz(x)}</li>`;
  const lista = (l, vacio, f) => `<ul class="lista tps">${l.filter((x) => !x.hecho).map(f).join("") || `<li class="vacio">${vacio}</li>`}</ul>`;
  const hechos = (l, nombre, f) => l.some((x) => x.hecho) ? `<details class="mas"><summary>${nombre} (${l.filter((x) => x.hecho).length})</summary><ul class="lista tps">${l.filter((x) => x.hecho).map(f).join("")}</ul></details>` : "";

  // ---- Súper y menú ----
  const sup = doc.super || [];
  const bSuper = `<section class="bloque am-sec"><h2>Lista del súper</h2>
    <ul class="lista">${sup.length ? sup.map((it) => `<li><label class="am-sup"><input type="checkbox" data-am="super-tilde" data-id="${esc(it.id)}" ${it.ok ? "checked" : ""}><span class="${it.ok ? "am-hecho" : ""}">${esc(it.t)}</span></label>
      <button class="am-x" data-am="super-borrar" data-id="${esc(it.id)}" aria-label="Sacar ${esc(it.t)}">${X}</button></li>`).join("") : '<li class="vacio">La lista está vacía.</li>'}</ul>
    <form class="form" data-am-form="super"><input name="texto" placeholder="Agregar algo" aria-label="Agregar a la lista" required autocomplete="off"><button class="btn">Sumar</button></form>
    ${sup.some((x) => x.ok) ? '<div class="chips" style="margin-top:10px"><button class="chip" data-am="super-limpiar">Sacar lo tildado</button></div>' : ""}</section>`;
  const menu = doc.menu || {};
  const bMenu = `<section class="bloque am-sec"><h2>Menú de la semana</h2><div class="am-menu">${ORDEN.map((d) => `<label><span>${DIAS[d]}</span>
    <input data-am-menu="${d}" value="${esc(menu[d] || "")}" placeholder="¿Qué se come?" autocomplete="off"></label>`).join("")}</div></section>`;

  // ---- ¿Dónde comemos? (dado + ranking plegado) ----
  const gl = gastroLista(doc);
  const rubros = [...new Set(gl.filter((g) => !g.afuera && !g.porIr).map((g) => g.rubro))];
  const s = estadoGastro.salio;
  const rk = rubros.includes(estadoGastro.rk) ? estadoGastro.rk : rubros[0];
  const ranking = gl.filter((g) => g.rubro === rk && !g.afuera && !g.porIr && g.puntaje != null).sort((a, b) => b.puntaje - a.puntaje);
  const bComer = gl.length ? `<section class="bloque am-sec am-comer"><div class="am-dado-fila"><button class="am-dado" data-am="dado" aria-label="Tirar el dado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/></svg></button>
      <span><b>¿Dónde comemos?</b><small>Tocá el dado, o elegí del ranking.</small></span></div>
    ${s ? `<div class="am-salio"><span class="am-k">${s.porIr ? "Algo nuevo" : "Salió"} · ${esc(s.rubro)}</span><h3>${esc(s.nombre)}</h3><span class="am-meta">${s.porIr ? "Todavía no fueron: lo anotaron «por ir»" : s.puntaje != null ? `<span class="am-estr">★ ${String(s.puntaje).replace(".", ",")}</span> · el puntaje que le pusieron` : ""}${s.lugar ? " · " + esc(s.lugar) : ""}</span>
      <div class="chips"><a class="chip" href="${esc(maps(s))}" target="_blank" rel="noopener">Cómo llegar</a><button class="chip" data-am="dado">Otro ↻</button></div></div>` : ""}
    <div class="am-filt">${[["", "Cualquiera"], ...rubros.map((r) => [r, r])].map(([v, t]) => `<button class="chip ${!estadoGastro.nuevo && estadoGastro.rubro === v ? "on" : ""}" data-am="rubro" data-v="${esc(v)}">${esc(t)}</button>`).join("")}<button class="chip ${estadoGastro.nuevo ? "on" : ""}" data-am="nuevo">Algo nuevo (por ir)</button></div>
    ${rk ? `<details class="mas am-rk"><summary>Ranking</summary><div class="am-pest">${rubros.map((r) => `<button class="${r === rk ? "on" : ""}" data-am="rk" data-v="${esc(r)}">${esc(r)}</button>`).join("")}</div>
      <ol class="am-rank">${ranking.map((g, i) => `<li><span class="n">${i + 1}</span><span class="x">${esc(g.nombre)}${g.lugar ? ` <small>${esc(g.lugar)}</small>` : ""}</span><span class="am-estr">★ ${String(g.puntaje).replace(".", ",")}</span></li>`).join("")}</ol>
      <p class="fuente-dato">Sale del doc Gastronomía. Los de afuera (Madrid, Colonia, Nápoles…) no entran en el dado.</p></details>` : ""}</section>` : "";

  // ---- Para ver y planes ----
  const ver = items.filter((x) => x.tipo === "peli" || x.tipo === "serie");
  const fVer = (x) => tilde(x, x.tipo === "serie" ? "Serie" : "Peli");
  const bVer = `<section class="bloque am-sec"><h2>Para ver</h2>${lista(ver, "Nada en la lista todavía.", fVer)}${hechos(ver, "Vistas", fVer)}
    <form class="form am-form" data-am-form="ver"><input name="titulo" placeholder="Peli o serie" aria-label="Sumar algo para ver" required autocomplete="off"><select name="tipo" aria-label="Qué es"><option value="peli">Peli</option><option value="serie">Serie</option></select><button class="btn">Sumar</button></form></section>`;
  const planes = items.filter((x) => x.tipo === "plan").sort((a, b) => (a.fecha || "9").localeCompare(b.fecha || "9"));
  const bPlanes = `<section class="bloque am-sec"><h2>Planes</h2>${lista(planes, "Ningún plan anotado.", (x) => tilde(x))}${hechos(planes, "Hechos", (x) => tilde(x))}
    <form class="form am-form" data-am-form="plan"><input name="titulo" placeholder="Un plan (cena, salida…)" aria-label="Sumar un plan" required autocomplete="off"><input name="fecha" type="date" aria-label="Cuándo (opcional)"><button class="btn">Sumar</button></form></section>`;

  // ---- Salidas culturales: un cajón con las entradas, cerrado hasta que lo abrís ----
  const sal = items.filter((x) => x.tipo === "salida");
  const nVeces = sal.reduce((a, x) => a + (x.veces || 1), 0);
  const cats = [...new Set(sal.map((x) => x.cat || "otro"))].slice(0, 4);
  const bSal = `<details class="bloque am-sec am-cajon"${salidasAbierta || sal.some((x) => x.id === editando) ? " open" : ""} data-am-cajon>
    <summary><span class="am-cajon-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5V6.8C3 6.4 3.4 6 3.8 6h16.4c.4 0 .8.4.8.8v1.7a2.5 2.5 0 000 5v1.7c0 .4-.4.8-.8.8H3.8c-.4 0-.8-.4-.8-.8v-1.7a2.5 2.5 0 000-5z" transform="rotate(-8 12 11)"/><path d="M9 7v9" stroke-dasharray="1.6 1.8" transform="rotate(-8 12 11)"/><path d="M5 18.5h14" opacity=".45"/></svg></span>
      <span class="am-cajon-txt"><b>Salidas</b><small>${sal.length ? `${sal.length} ${sal.length === 1 ? "entrada" : "entradas"}${nVeces > sal.length ? ` · ${nVeces} salidas` : ""}` : "Todavía no hay entradas"}</small></span>
      <span class="am-cajon-cats">${cats.map((c) => `<i class="c-${esc(c)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICO[c] || ICO.otro}</svg></i>`).join("")}</span></summary>
    <div class="am-cajon-in">
    ${sal.length ? sal.map((x) => editando === x.id ? `<div class="am-ent am-ent-ed">${edicion(x)}</div>` : `<div class="am-ent"><span class="lado c-${esc(x.cat || "otro")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${ICO[x.cat] || ICO.otro}</svg>${CATS[x.cat] || "Salida"}</span>
      <span class="cuerpo"><b>${esc(x.titulo)}</b>${x.nota ? `<small>${esc(x.nota)}</small>` : ""}</span>
      <span class="am-vez">${(x.veces || 1) > 1 ? `<b>×${x.veces}</b>` : ""}${lapiz(x)}</span></div>`).join("") : '<p class="vacio">Cuando vayan a algo, guardalo acá.</p>'}
    <form class="form am-form" data-am-form="salida"><input name="titulo" placeholder="Obra, recital, muestra…" aria-label="Sumar una salida" required autocomplete="off"><select name="cat" aria-label="Qué fue">${Object.entries(CATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select><button class="btn">Sumar</button></form></div></details>`;

  const docs = items.filter((x) => x.tipo === "doc" && /^https:\/\//.test(x.url));
  const bDocs = docs.length ? `<section class="bloque am-sec"><h2>Docs</h2><div class="chips">${docs.map((d) => `<a class="chip" href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.titulo)}</a>`).join("")}</div></section>` : "";

  const bNacho = puedeTodo ? `<details class="bloque plegable"><summary>Sumar una fecha, el viaje, un vuelo o un doc</summary>
    <form class="form am-form am-otro" data-am-form="otro"><select name="tipo" aria-label="Qué es"><option value="fecha">Fecha (aniversario, cumple)</option><option value="viaje">Viaje</option><option value="vuelo">Vuelo</option><option value="doc">Doc (link)</option></select>
      <input name="titulo" placeholder="Nombre" required autocomplete="off"><input name="fecha" type="date" aria-label="Fecha"><input name="nota" placeholder="Nota (para que se repita cada año, poné «anual»)" autocomplete="off"><input name="url" placeholder="Link del doc (https://…)" autocomplete="off"><button class="btn">Sumar</button></form>
    <p class="fuente-dato">Agus ve todo esto, pero solo vos sumás o sacás fechas, viaje, vuelos y docs. Los lugares del mundito salen de «Orbe · amorcitos · semilla» en tu Drive.</p></details>` : "";
  return portada + bSuper + bMenu + bComer + bVer + bPlanes + bSal + bDocs + bNacho;
}

// Lo que va en el mundo grande, además del globo: la cuenta regresiva y los vuelos.
export function extraMundo(doc, hoy) {
  const items = doc?.items || [];
  const viaje = items.filter((x) => x.tipo === "viaje" && x.fecha && diasA(x.fecha, hoy) >= 0).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const vuelos = items.filter((x) => x.tipo === "vuelo" && x.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  return (viaje ? `<div class="regresiva"><span class="cifra">${diasA(viaje.fecha, hoy)}</span><span><b>${diasA(viaje.fecha, hoy) === 1 ? "día" : "días"} para ${esc(viaje.titulo)}</b><br><span class="vacio">${esc(viaje.nota || corta(viaje.fecha))}</span></span></div>` : "")
    + (vuelos.length ? `<details class="mas"><summary>Vuelos (${vuelos.length})</summary><ul class="lista">${vuelos.map((v) => `<li><span>${esc(v.titulo)}<br><small class="vacio">${esc(v.nota)}</small></span><span class="der">${esc(corta(v.fecha))}</span></li>`).join("")}</ul></details>` : "");
}

// Después de pintar: el mundito de la portada.
export async function montarMundo(doc) {
  const caja = document.getElementById("am-globo");
  const m = await import("./mundo.js");
  m.montarPortada(caja, doc, () => m.abrir(doc, caja, extraMundo(doc, new Date())));
}

// ---------- Toques ----------
// Se engancha una sola vez al documento. «cambio(doc)» repinta; «aviso(texto)» muestra un cartelito.
export function conectar({ cambio, aviso }) {
  // Lo que cambia solo en la pantalla (el dado, los filtros): se repinta sin ir al servidor.
  const local = () => { const d = docLocal(); if (d) cambio(d, true); };
  const hacer = (o, ok) => op(o).then((d) => { cambio(d); if (ok) aviso?.(ok); }).catch((e) => aviso?.(e.message === "sin-sesion" ? "Se cerró la sesión: volvé a entrar" : e.message === "permiso" ? "Eso lo maneja Nacho" : "No se pudo guardar: probá con señal"));
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-am]");
    if (!b || b.type === "checkbox") return;
    const t = b.dataset.am;
    if (t === "super-borrar") hacer({ t, id: b.dataset.id });
    else if (t === "item-borrar") { editando = ""; hacer({ t, id: b.dataset.id }, "Borrado"); }
    else if (t === "editar") { editando = b.dataset.id; local(); setTimeout(() => document.querySelector(".am-edita input")?.focus(), 30); }
    else if (t === "no-editar") { editando = ""; local(); }
    else if (t === "super-limpiar") hacer({ t }, "Listo");
    else if (t === "item-mas") hacer({ t, id: b.dataset.id }, "¡Otra vez!");
    else if (t === "mundo") import("./mundo.js").then((m) => { const d = docLocal(); m.abrir(d, document.getElementById("am-globo"), extraMundo(d, new Date())); });
    else if (t === "dado") { const d = docLocal(); estadoGastro.salio = dado(d); if (!estadoGastro.salio) aviso?.("No hay lugares con ese filtro"); local(); }
    else if (t === "rubro") { estadoGastro.rubro = b.dataset.v; estadoGastro.nuevo = false; estadoGastro.salio = null; local(); }
    else if (t === "nuevo") { estadoGastro.nuevo = !estadoGastro.nuevo; estadoGastro.rubro = ""; estadoGastro.salio = null; local(); }
    else if (t === "rk") { estadoGastro.rk = b.dataset.v; local(); }
  });
  // El menú se guarda solo mientras escribís (no hace falta salir del renglón), sin repintar debajo de tus dedos.
  const tMenu = {};
  function guardarMenu(el) {
    const dia = el.dataset.amMenu; clearTimeout(tMenu[dia]);
    const texto = el.value.trim();
    if (texto === ((docLocal()?.menu || {})[dia] || "")) return;
    op({ t: "menu", dia: Number(dia), texto }).then((d) => {
      if (document.activeElement?.dataset?.amMenu == null) cambio(d);
      aviso?.("Menú guardado");
    }).catch((e) => aviso?.(e.message === "sin-sesion" ? "Se cerró la sesión: volvé a entrar" : "No se pudo guardar el menú: probá con señal"));
  }
  document.addEventListener("input", (e) => { const el = e.target; if (el.dataset?.amMenu == null) return; clearTimeout(tMenu[el.dataset.amMenu]); tMenu[el.dataset.amMenu] = setTimeout(() => guardarMenu(el), 900); });
  // Lo que cambia el otro aparece solo: cada 12 segundos se fija si hay algo nuevo (si no estás escribiendo).
  const firma = (d) => JSON.stringify([d?.super, d?.menu, d?.items, d?.gastro?.firma]);
  setInterval(() => {
    const a = document.activeElement;
    if (document.hidden || !document.querySelector(".am-portada") || document.querySelector(".mu-capa") || editando) return;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest(".am-sec, .am-edita, form")) return;
    const antes = firma(docLocal());
    traer().then((d) => { if (firma(d) !== antes) cambio(d); }).catch(() => {});
  }, 12000);
  // El cajón de salidas recuerda si quedó abierto cuando se repinta.
  document.addEventListener("toggle", (e) => { if (e.target.matches?.("[data-am-cajon]")) salidasAbierta = e.target.open; }, true);
  pinguino();
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset?.am === "super-tilde") hacer({ t: "super-tilde", id: el.dataset.id, ok: el.checked });
    else if (el.dataset?.am === "item-tilde") hacer({ t: "item-tilde", id: el.dataset.id, hecho: el.checked });
    else if (el.dataset?.amMenu != null) guardarMenu(el);
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
    else if (k === "editar") { const id = f.dataset.id; editando = ""; hacer({ t: "item-editar", id, cambios: d }, "Guardado"); return; }
    else if (k === "salida") hacer({ t: "item-sumar", item: { tipo: "salida", titulo: d.titulo, cat: d.cat, hecho: true } }, "Anotada");
    else if (k === "otro") hacer({ t: "item-sumar", item: { tipo: d.tipo, titulo: d.titulo, fecha: d.fecha, nota: d.nota, url: d.url } }, "Agregado");
    setTimeout(() => document.querySelector(`[data-am-form="${k}"] input`)?.focus(), 50);
  });
}

// ---------- El pingüino que corre ----------
// Aparece solo en Amorcitos: un rato después de entrar, cruza caminando por abajo; si nadie lo agarra, vuelve más tarde.
let pinguHora = 0;
function pinguino() {
  const dormido = () => { try { return sessionStorage.getItem("amor.pingu") === "chau"; } catch (e) { return false; } };
  const prueba = new URLSearchParams(location.search).has("pingu");
  const programar = (s) => { clearTimeout(pinguHora); pinguHora = setTimeout(cruzar, s * 1000); };
  function cruzar() {
    if (dormido() && !prueba) return;
    if (!document.querySelector(".am-portada") || document.hidden || document.querySelector(".mu-capa")) return programar(8);
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const b = document.createElement("button");
    b.className = "am-pingu"; b.setAttribute("aria-label", "Un pingüino"); b.innerHTML = PINGU + '<span class="am-wow" aria-hidden="true">!</span><span class="am-globito">¡te amo!</span>';
    const izq = Math.random() < .5, w = innerWidth, ida = izq ? [-60, w + 10] : [w + 10, -60];
    if (!izq) b.classList.add("vuelta");
    document.body.append(b);
    const dur = quieto ? 0 : 7000 + Math.random() * 2500;
    const paso = quieto ? null : b.animate([{ transform: `translateX(${ida[0]}px)` }, { transform: `translateX(${ida[1]}px)` }], { duration: dur, easing: "linear", fill: "forwards" });
    if (quieto) { b.style.transform = `translateX(${w - 70}px)`; }
    const fin = () => { b.remove(); programar(35 + Math.random() * 40); };
    if (paso) paso.onfinish = () => { if (!b.classList.contains("agarrado")) fin(); }; else setTimeout(() => { if (!b.classList.contains("agarrado")) fin(); }, 9000);
    b.addEventListener("click", () => {
      if (b.classList.contains("agarrado")) return;
      b.classList.add("agarrado");
      const r = b.getBoundingClientRect(); b.classList.toggle("bi", r.left > innerWidth / 2);
      if (paso) { paso.commitStyles?.(); paso.cancel(); }
      try { sessionStorage.setItem("amor.pingu", "chau"); } catch (e) { /* nada */ }
      setTimeout(() => b.classList.add("rojo"), 450);
      setTimeout(() => b.classList.add("habla"), 750);
      setTimeout(() => b.classList.add("chau"), 2600);
      setTimeout(() => b.remove(), 3500);
    }, { once: false });
  }
  programar(prueba ? 1 : 6 + Math.random() * 8);
}

// ---------- Gastronomía: lee el doc de Nacho (texto plano) ----------
// «Parrilla» → rubro; «La Choza de Gascón (4.8)» → lugar con puntaje; «Mirutaki (por ir)» → para probar;
// «Hotaru (Madrid) (5)» → de afuera (no entra en el dado). Solo lo usa Orbe de Nacho, que tiene el doc.
const RUBROS = ["parrilla", "sushi", "ramen", "pizza", "pasta", "bodegon/tapas", "bodegon", "tapas", "comidas regionales", "fine dining", "bar", "comida rapida", "cafe", "pasteleria", "heladeria"];
const BARRIOS = /caballito|puerto madero|plaza serrano|palermo|belgrano|recoleta|almagro|villa crespo|san telmo|colegiales|nu[ñn]ez|boedo|flores|chacarita|parque chacabuco|microcentro|centro|once|balvanera|devoto|saavedra|barracas|la boca|retiro|vicente l[oó]pez|olivos|martinez|san isidro|turqu[ií]a|vietnam|rusia|per[uú]|china|jap[oó]n|corea|m[eé]xico|india|armenia|italia|espa[ñn]a/i;
export function leerGastro(texto) {
  const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const lineas = String(texto || "").replace(/\r/g, "").split("\n").map((l) => l.replace(/[*_]/g, "").replace(/\u00a0/g, " ").trim());
  const out = []; let rubro = "";
  lineas.forEach((l, k) => {
    if (!l || /^gastronom/i.test(l)) return;
    const vacioAntes = !lineas[k - 1], vacioDespues = !lineas[k + 1];
    if (RUBROS.includes(norm(l)) || (!/\(/.test(l) && l.length < 28 && vacioAntes && vacioDespues && !/\d/.test(l))) { rubro = l.replace(/\s+/g, " "); return; }
    if (!rubro) return;
    const par = [...l.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
    const nombre = l.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (!nombre) return;
    let puntaje = null, porIr = false, lugar = "";
    par.forEach((p) => {
      if (/^\d+([.,]\d+)?$/.test(p)) puntaje = Number(p.replace(",", "."));
      else { const partes = p.split(",").map((x) => x.trim()).filter(Boolean); if (partes.some((x) => /por ir/i.test(x))) porIr = true; const resto = partes.filter((x) => !/por ir/i.test(x)).join(", "); if (resto) lugar = resto; }
    });
    const afuera = !!lugar && !BARRIOS.test(lugar);
    out.push({ rubro: rubro.replace(/^Bodeg[oó]n\/Tapas$/i, "Bodegón"), nombre, puntaje: puntaje != null && puntaje <= 5 ? puntaje : null, lugar, porIr, afuera });
  });
  return out;
}
