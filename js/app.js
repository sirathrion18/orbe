// Orbe — arranque, navegación, tema, buscador y acciones.
import { cargarDatos, cargarClima } from "./fuente.js";
import { construirContexto } from "./contexto.js";
import { renderInicio, despuesInicio, esc, colorUniverso } from "./inicio.js";
import { renderUniverso, renderBloqueo, renderIdeas, renderAgenda, renderRespiro, renderDatos, renderAjustes, renderNovedades, renderNoEncontrado } from "./paginas.js";
import { UNIVERSOS, SECCIONES } from "./config.js";
import { leer, guardar, borrar, todo, borrarTodo, sesion } from "./almacen.js";
import { sol } from "./sol.js";

const app = document.getElementById("app");
const estado = { datos: null, clima: null, ctx: null };
const vibrar = () => { try { navigator.vibrate && navigator.vibrate(12); } catch (e) { /* nada */ } };

// ---------- Tema ----------
function estadoTema() {
  const t = leer("tema", { modo: "auto" });
  if (t.modo !== "auto" && t.hasta && Date.now() > t.hasta) return { modo: "auto" };
  return t;
}
function temaActual() {
  const t = estadoTema();
  if (t.modo === "claro" || t.modo === "oscuro") return t.modo;
  const c = estado.datos ? estado.datos.ciudad : { lat: -34.61, lon: -58.38 };
  const s = sol(new Date(), c.lat, c.lon);
  const ahora = new Date();
  return ahora >= s.sale && ahora < s.pone ? "claro" : "oscuro";
}
function proximoCambioDeLuz() {
  const c = estado.datos.ciudad, ahora = new Date();
  const hoy = sol(ahora, c.lat, c.lon);
  const manana = sol(new Date(ahora.getTime() + 86400000), c.lat, c.lon);
  return [hoy.sale, hoy.pone, manana.sale, manana.pone].map((d) => d.getTime()).find((t) => t > ahora.getTime());
}
function aplicarTema() {
  const tema = temaActual();
  document.documentElement.dataset.theme = tema;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = tema === "oscuro" ? "#0B0B0C" : "#FFFFFF";
  return tema;
}

// ---------- Navegación ----------
function ruta() { return (location.hash || "#/").slice(1); }

function pintar(refresco = false) {
  const tema = aplicarTema();
  const demo = sesion("demo");
  estado.ctx = construirContexto(estado.datos, demo);
  const r = ruta();
  let html;
  const esInicio = r === "/" || r === "";
  if (esInicio) html = renderInicio(estado.datos, estado.ctx, estado.clima, tema);
  else if (r.startsWith("/u/")) {
    const id = r.slice(3);
    const u = UNIVERSOS.find((x) => x.id === id);
    html = u && u.bloqueo && leer("pin") && !sesion("abierto-" + id) ? renderBloqueo(id) : renderUniverso(id, estado.datos, estado.ctx, tema);
  }
  else if (r === "/ideas") html = renderIdeas();
  else if (r === "/agenda") html = renderAgenda(estado.datos, estado.ctx, tema);
  else if (r === "/respiro") html = renderRespiro();
  else if (r === "/datos") html = renderDatos();
  else if (r === "/ajustes") html = renderAjustes(estadoTema(), demo, !!leer("pin"));
  else if (r === "/novedades") html = renderNovedades();
  else html = renderNoEncontrado();

  app.innerHTML = html + (esInicio ? "" : barraInferior(r, tema));
  document.body.classList.toggle("con-barra", !esInicio);
  if (esInicio) { despuesInicio(app, !refresco); conectarBuscador(); }
  document.title = esInicio ? "Orbe" : "Orbe · " + (app.querySelector("h1")?.textContent.trim() || "");
}

function barraInferior(r, tema) {
  const items = [{ id: "", nombre: "Inicio", color: "var(--text)", href: "#/" }]
    .concat(UNIVERSOS.map((u) => ({ id: u.id, nombre: u.corto, color: colorUniverso(estado.datos, u, tema), href: "#/u/" + u.id })));
  return `<nav class="barra-inf" aria-label="Universos">${items.map((it) => {
    const on = it.id ? r === "/u/" + it.id : false;
    return `<a href="${it.href}" class="${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""}><i class="dot" style="background:${it.color}"></i>${esc(it.nombre)}</a>`;
  }).join("")}</nav>`;
}

// ---------- Buscador ----------
const normal = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function comando(q) {
  let m = q.match(/^gasto\s+\$?\s*([\d.,]+)\s*(.*)$/i);
  if (m) {
    const monto = Number(m[1].replace(/\./g, "").replace(",", "."));
    if (monto > 0) return { tipo: "gasto", monto, desc: (m[2] || "varios").trim() };
  }
  m = q.match(/^(idea|nota)\s+(.+)$/i);
  if (m) return { tipo: "idea", texto: m[2].trim() };
  return null;
}

function resultados(q) {
  const n = normal(q);
  const out = [];
  const cmd = comando(q);
  if (cmd && cmd.tipo === "gasto") out.push({ cmd, texto: `Guardar gasto de $ ${cmd.monto.toLocaleString("es-AR")} · ${cmd.desc}`, extra: "Enter" });
  if (cmd && cmd.tipo === "idea") out.push({ cmd, texto: `Guardar idea: ${cmd.texto}`, extra: "Enter" });
  UNIVERSOS.forEach((u) => { if (normal(u.nombre + " " + u.palabras).includes(n)) out.push({ href: "#/u/" + u.id, texto: u.nombre, extra: "Universo" }); });
  SECCIONES.forEach((s) => { if (normal(s.nombre + " " + s.palabras).includes(n)) out.push({ href: s.ruta, texto: s.nombre, extra: "Sección" }); });
  (estado.datos.accesos || []).forEach((a) => { if (normal(a.titulo + " " + a.palabras).includes(n)) out.push({ href: a.url, ext: true, texto: a.titulo, extra: "Acceso" }); });
  (estado.datos.proyectos || []).forEach((p) => { if (normal(p.nombre + " " + p.id).includes(n) && (p.url || p.repo)) out.push({ href: p.url || p.repo, ext: true, texto: p.nombre, extra: "Proyecto" }); });
  leer("ideas", []).forEach((i) => { if (normal(i.t).includes(n)) out.push({ href: "#/ideas", texto: i.t, extra: "Idea" }); });
  if (!cmd) {
    out.push({ href: "https://drive.google.com/drive/search?q=" + encodeURIComponent(q), ext: true, texto: `Buscar «${q}» en Drive`, extra: "Drive" });
    out.push({ href: "https://mail.google.com/mail/u/0/#search/" + encodeURIComponent(q), ext: true, texto: `Buscar «${q}» en Gmail`, extra: "Gmail" });
  }
  const vistos = new Set();
  return out.filter((r) => { const k = r.href || r.texto; if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 9);
}

function conectarBuscador() {
  const input = document.getElementById("q");
  const caja = document.getElementById("resultados");
  if (!input) return;
  let lista = [], sel = 0;
  const mostrar = () => {
    const q = input.value.trim();
    if (!q) { caja.classList.remove("on"); caja.innerHTML = ""; return; }
    lista = resultados(q); sel = 0;
    caja.innerHTML = lista.map((r, i) => r.cmd
      ? `<button class="res cmd ${i === sel ? "sel" : ""}" role="option" data-i="${i}">${esc(r.texto)}<small>${r.extra}</small></button>`
      : `<a class="res ${i === sel ? "sel" : ""}" role="option" data-i="${i}" href="${esc(r.href)}" ${r.ext ? 'target="_blank" rel="noopener"' : ""}>${esc(r.texto)}<small>${r.extra}</small></a>`).join("");
    caja.classList.toggle("on", lista.length > 0);
  };
  const ejecutar = (r) => {
    if (!r) return;
    if (r.cmd) { ejecutarComando(r.cmd); input.value = ""; mostrar(); return; }
    if (r.ext) window.open(r.href, "_blank", "noopener"); else location.hash = r.href;
  };
  input.addEventListener("input", mostrar);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); ejecutar(lista[sel]); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : lista.length - 1)) % Math.max(1, lista.length);
      caja.querySelectorAll(".res").forEach((el, i) => el.classList.toggle("sel", i === sel));
    } else if (e.key === "Escape") { input.value = ""; mostrar(); }
  });
  caja.addEventListener("click", (e) => {
    const b = e.target.closest("button.res");
    if (b) ejecutar(lista[Number(b.dataset.i)]);
  });
}

function ejecutarComando(cmd) {
  if (cmd.tipo === "gasto") {
    const gastos = leer("gastos", []);
    const rubro = cmd.desc.split(/\s+/)[0].toLowerCase() || "varios";
    gastos.push({ monto: cmd.monto, desc: cmd.desc, rubro: rubro[0].toUpperCase() + rubro.slice(1), fecha: new Date().toISOString() });
    guardar("gastos", gastos);
    avisar(`Gasto de $ ${cmd.monto.toLocaleString("es-AR")} guardado`);
  } else if (cmd.tipo === "idea") {
    guardarIdea(cmd.texto, "");
  }
}

function guardarIdea(t, u) {
  const ideas = leer("ideas", []);
  ideas.push({ t, u, f: new Date().toLocaleDateString("es-AR") });
  guardar("ideas", ideas);
  avisar("Idea guardada");
}

// ---------- Aviso y hoja ----------
let timerAviso;
function avisar(texto) {
  vibrar();
  let el = document.querySelector(".aviso");
  if (!el) { el = document.createElement("div"); el.className = "aviso"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = texto;
  el.classList.add("on");
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => el.classList.remove("on"), 2200);
}

function abrirHojaIdea() {
  cerrarHoja();
  const velo = document.createElement("div"); velo.className = "velo on"; velo.dataset.accion = "cerrar-hoja";
  const hoja = document.createElement("div"); hoja.className = "hoja"; hoja.setAttribute("role", "dialog"); hoja.setAttribute("aria-label", "Anotar una idea");
  hoja.innerHTML = `<h2>Una idea</h2><form data-form="idea-hoja">
    <label class="sr" for="idea-txt">Idea</label><textarea id="idea-txt" name="t" class="campo-texto" placeholder="Lo que se te cruce" required></textarea>
    <div class="grupo"><span>Universo (opcional)</span><div class="chips">${UNIVERSOS.map((u) => `<label class="chip"><input type="radio" name="u" value="${u.nombre}" class="sr">${esc(u.nombre)}</label>`).join("")}</div></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
  document.body.append(velo, hoja);
  requestAnimationFrame(() => { hoja.classList.add("on"); hoja.querySelector("textarea").focus(); });
  hoja.addEventListener("change", (e) => {
    if (e.target.name === "u") hoja.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.contains(e.target)));
  });
}
function cerrarHoja() { document.querySelectorAll(".velo, .hoja").forEach((el) => el.remove()); }

// ---------- Meditación ----------
let timerMedita = null;
function meditar(min) {
  clearInterval(timerMedita);
  let resta = min * 60;
  const pintarReloj = () => { const el = document.getElementById("medita-reloj"); if (el) el.textContent = String(Math.floor(resta / 60)).padStart(2, "0") + ":" + String(resta % 60).padStart(2, "0"); };
  pintarReloj();
  if (!min) return;
  timerMedita = setInterval(() => {
    resta--; pintarReloj();
    if (resta <= 0) { clearInterval(timerMedita); avisar("Listo. Buen rato."); try { navigator.vibrate && navigator.vibrate([80, 60, 80]); } catch (e) { /* nada */ } }
  }, 1000);
}

// ---------- PIN ----------
async function hash(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("orbe:" + t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- Eventos ----------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-accion]");
  if (!el) return;
  const a = el.dataset.accion;
  if (a === "tema") {
    const nuevo = temaActual() === "oscuro" ? "claro" : "oscuro";
    guardar("tema", { modo: nuevo, hasta: proximoCambioDeLuz() });
    vibrar(); pintar();
  } else if (a === "tema-fijo") {
    const t = el.dataset.tema;
    if (t === "auto") guardar("tema", { modo: "auto" }); else guardar("tema", { modo: t });
    pintar();
  } else if (a === "ocultar-plata") {
    guardar("plataOculta", !leer("plataOculta", false)); pintar();
  } else if (a === "idea") abrirHojaIdea();
  else if (a === "cerrar-hoja") cerrarHoja();
  else if (a === "demo") { sesion("demo", el.dataset.modo || null); avisar(el.dataset.modo ? "Probando: " + el.textContent : "Volviste al modo real"); pintar(); }
  else if (a === "super-borrar") { const l = leer("super", []); l.splice(Number(el.dataset.i), 1); guardar("super", l); pintar(); }
  else if (a === "medita") meditar(Number(el.dataset.min));
  else if (a === "medita-parar") { clearInterval(timerMedita); meditar(0); const r = document.getElementById("medita-reloj"); if (r) r.textContent = "05:00"; }
  else if (a === "pin-sacar") { borrar("pin"); avisar("PIN sacado"); pintar(); }
  else if (a === "exportar") {
    const blob = new Blob([JSON.stringify(todo(), null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = "orbe-mis-datos.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } else if (a === "borrar-todo") {
    if (confirm("¿Borrar todo lo que Orbe guardó en este dispositivo? No se puede deshacer.")) { borrarTodo(); avisar("Borrado"); pintar(); }
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".buscador")) document.getElementById("resultados")?.classList.remove("on");
});

document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.accion === "super-tilde") { const l = leer("super", []); l[Number(el.dataset.i)].ok = el.checked; guardar("super", l); vibrar(); pintar(); }
  if (el.classList.contains("campo-menu")) { const m = leer("menu", {}); m[el.dataset.dia] = el.value.trim(); guardar("menu", m); avisar("Menú guardado"); }
});

document.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  const tipo = f.dataset.form;
  if (tipo === "super") { const l = leer("super", []); l.push({ t: d.t.trim(), ok: false }); guardar("super", l); vibrar(); pintar(); document.querySelector('[data-form="super"] input')?.focus(); }
  else if (tipo === "idea") { guardarIdea(d.t.trim(), ""); pintar(); }
  else if (tipo === "idea-hoja") { guardarIdea(d.t.trim(), d.u || ""); cerrarHoja(); if (ruta() === "/ideas") pintar(); }
  else if (tipo === "futbol") { const l = leer("futbol", []); l.push({ t: d.t.trim(), f: new Date().toLocaleDateString("es-AR") }); guardar("futbol", l); avisar("Partido anotado"); pintar(); }
  else if (tipo === "gasto") {
    const monto = Number(String(d.monto).replace(/\./g, "").replace(",", "."));
    if (monto > 0) { ejecutarComando({ tipo: "gasto", monto, desc: d.desc.trim() || "varios" }); pintar(); }
  } else if (tipo === "pin-nuevo") {
    if (!/^\d{4,}$/.test(d.pin)) { avisar("El PIN tiene que tener 4 números o más"); return; }
    guardar("pin", await hash(d.pin)); avisar("PIN puesto"); pintar();
  } else if (tipo === "pin") {
    if ((await hash(d.pin)) === leer("pin")) { sesion("abierto-" + f.dataset.id, true); vibrar(); pintar(); }
    else { avisar("PIN incorrecto"); f.reset(); }
  }
});

window.addEventListener("hashchange", () => { cerrarHoja(); clearInterval(timerMedita); pintar(); window.scrollTo(0, 0); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarHoja(); });

// Cada 30 segundos se actualiza Inicio (hora, anillo, modo), salvo que estés escribiendo.
setInterval(() => {
  if ((ruta() === "/" || ruta() === "") && !document.querySelector(".hoja") && document.activeElement?.id !== "q") pintar(true);
}, 30000);

// ---------- Arranque ----------
(async function arrancar() {
  try {
    const { datos } = await cargarDatos();
    estado.datos = datos;
    const pedido = cargarClima(datos.ciudad);
    estado.clima = await Promise.race([pedido, new Promise((r) => setTimeout(() => r(null), 1500))]);
    pintar();
    if (!estado.clima) { estado.clima = await pedido; if (estado.clima) pintar(true); }
  } catch (e) {
    app.innerHTML = `<div class="pagina"><h1>Ups</h1><p class="bajada">No pude cargar Orbe. Revisá la conexión y volvé a abrir.</p></div>`;
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => { /* sin modo offline */ });
  }
})();
