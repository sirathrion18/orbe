// Orbe — arranque, navegación, tema, buscador y acciones.
import { cargarDatos, cargarClima, mezclar } from "./fuente.js";
import * as G from "./google.js";
import { construirContexto } from "./contexto.js";
import { renderInicio, despuesInicio, esc, colorUniverso, regresiva, renderAvisos } from "./inicio.js";
import { ICONOS } from "./iconos.js";
import { renderDetalle, DETALLE_UNI } from "./detalles.js";
import { hojaArchivosProd, renderAjustesGuinos } from "./paginas.js";
import { renderRiver, renderUniverso, renderBloqueo, renderAgenda, renderRespiro, renderDatos, renderAjustes, renderNovedades, renderNoEncontrado, renderSemanal, renderPedirDiario, renderUrgente, hojaMovimiento, hojaTp, hojaMateria, hojaAsignar, hojaAgus, hojaPartido, hojaPasos, hojaPesos, hojaGasto } from "./paginas.js";
import { HOJAS_PRESU, leerConfigPresu, cruzar, responder as responderPresu, confirmarIngreso } from "./presupuesto.js";
import { agregarManual } from "./finanzas.js";
import { HOJAS_ESC, leerEscalafon, cargarConformado, datosEsc } from "./escalafon.js";
import { HOJAS_ANALISIS, importarHistorico, reclasificar, leerHistorico, datosHist } from "./analisis.js";
import { elegirArchivoProd } from "./productividad.js";
import { HOJAS_PROD, leerProd, datosProd, compararOficial, mandar as mandarProd, hayPendientes as prodPendiente, cambiar as prodCambiar, fijar as prodFijar, aplicarPreset, guardarPesos, cantidadesDe, isoHoy } from "./productividad.js";
import { HOJAS_LISTAS, leerListas, datosListas, traerGithub, sumarSemanalAProyectos, agregarAgus, tildarAgus, anotarPartido, guardarProximos } from "./listas.js";
import { sincronizar, activa as sincroActiva } from "./sincro.js";
import { leerPlanilla, traerMails, corregir, datosFinanzas, pendientesDeTarjetas, guardarTope } from "./finanzas.js";
import { leerRecibos, leerRecibosViejos, datosSueldosHist } from "./recibos.js";
import { traerDolarMeses, datosDolarMeses, leerTodos as leerTodosRecibos } from "./sueldousd.js";
import { datosFacu, traerCampus, leerFacu, tildarTp, nuevoTp, guardarMateria, asignarTp, pendientesDeTps, HOJAS_FACU } from "./facu.js";
import { datosCampus, leerCampus, tildarCampus, pendientesDeCampus, HOJAS_CAMPUS } from "./campus.js";
import { datosSatelite, retirarSatelite, codigoSatelite, anularSatelite } from "./satelite.js";
import { mandarAgenda, guardarAvisos, CATEGORIAS as CATEGORIAS_AVISO } from "./avisos.js";
import { asegurarHojas, asegurarLeeme, fijarSemillas, escribir as escribirHoja } from "./hoja.js";
import { fijarHoja, idHoja } from "./hoja.js";
import { traerDolar, traerRiver, traerTransporte, traerEquipos, equiposSeguidos } from "./extras.js";
import { tachar as tacharHoy, contar as contarHoy, fijarCompanero, sumarItem as sumarHoy, sacarItem as sacarHoy, guardarNota, cambiarModo as modoHoy } from "./bnahoy.js";
import { responder } from "./preguntas.js";
import { fijarEconomia, leerEconomia, datosEconomia, idEconomia } from "./economia.js";
import { huellaActiva, huellaDisponible, registrarHuella, verificarHuella, sacarHuella } from "./huella.js";
import { UNIVERSOS, SECCIONES } from "./config.js";
import { actualizarSemanal, htmlEdicion, marcarLeida, pendientesDeSemanal, ultimaEdicion, edicionAbierta, abrirEdicion, conArchivo } from "./semanal.js";
import { enApp } from "./rastreador.js";
import { escribirResumen } from "./resumen.js";
import { leer, guardar, borrar, todo, borrarTodo, sesion } from "./almacen.js";
import { sol } from "./sol.js";
import { guinoActivo, guinoYa, guinosPrendidos, fechaGuino } from "./guinos.js";
import { marcarAgus, hojaAgus2, hojaPagado, hojaColchon, hojaSaldo } from "./finanzasui.js";
import { anotarSaldo, resolverDiferencia, discrepancia } from "./saldo.js";
import { marcarPagado, usarColchon, fijarColchonPct, mesReal } from "./mesreal.js";
import { periodo, cuentaEnDiario, iso as isoP } from "./presupuesto.js";
import { sincronizarRiver } from "./rivercal.js";
import { anotarCobros, escribirEnEconomia } from "./suscripciones.js";
import { mesActual, claveMes, mesViejo } from "./agendames.js";
import { pendientesDeSuscripciones, hojaSuscripcion, guardarSuscripcion, borrarSuscripcion } from "./suscripciones.js";
import { renderRastreador, formPrecio, mandarPedido } from "./rastreador.js";
import { renderChecklists, formChecklist, crear as crearChecklist, tildar as tildarChk, sumarItem, sacarItem, usarDeNuevo, borrarChecklist, itemsDeTexto, usarColores } from "./checklists.js";

import { renderIdeas, renderFicha, renderPropuestas, proyectos as listaProyectos, paraCosmos, destinosIdea, textosIdeas } from "./proyectosui.js";
import { leerCentral, leerPropuestas, responderPropuesta } from "./central.js";
import { elegirLogo } from "./proyectosid.js";

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
  const f = leer("fuentes", {});
  document.documentElement.dataset.reloj = f.reloj || "logo";
  document.documentElement.dataset.saludo = f.saludo || "revista";
  return tema;
}

// ---------- Navegación ----------
function ruta() { return (location.hash || "#/").slice(1).split("?")[0]; }
const AVISOS_GOOGLE = {
  "sin-configurar": "Falta cargar el secreto de Google en Cloudflare.",
  cancelado: "Cancelaste la conexión con Google.",
  estado: "La conexión tardó demasiado o vino de otro lado. Probá de nuevo.",
  google: "Google no devolvió la renovación. Probá de nuevo.",
  cuenta: "Esa cuenta de Google no está autorizada en Orbe."
};

function pintar(refresco = false) {
  const tema = aplicarTema();
  const demo = sesion("demo");
  // Lo que se deriva de Finanzas (pagar las tarjetas) se suma a los pendientes del calendario.
  if (!estado.datos.pendientesBase) estado.datos.pendientesBase = estado.datos.pendientes || [];
  estado.datos.pendientes = [...estado.datos.pendientesBase, ...pendientesDeTarjetas(datosFinanzas()), ...(datosCampus()?.datos ? pendientesDeCampus(datosCampus()) : pendientesDeTps(datosFacu())), ...pendientesDeSemanal(), ...pendientesDeSuscripciones()];
  estado.ctx = construirContexto(estado.datos, demo);
  const r = ruta();
  // Un link puede abrir un universo en una pestaña (#/u/finanzas?tab=mes, #/u/bna?tab=prod&mes=2026-09): se aplica una vez y se limpia.
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  if (q.get("tab") && (r === "/u/finanzas" || r === "/u/bna")) {
    sesion(r === "/u/bna" ? "bnaTab" : "finTab", q.get("tab"));
    if (q.get("mes")) sesion("prodMes", q.get("mes"));
    history.replaceState(null, "", "#" + r);
  }
  let html;
  const esInicio = r === "/" || r === "";
  estado.ctx.guino = esInicio ? guinoActivo(estado.ctx.fecha, sesion("demoGuino")) : null;
  estado.ctx.fechaGuino = esInicio ? fechaGuino(estado.ctx.fecha, estado.ctx, sesion("demoGuino")) : null;
  if (esInicio) html = renderInicio(estado.datos, estado.ctx, estado.clima, tema);
  else if (r.startsWith("/u/")) {
    const id = r.slice(3);
    const u = UNIVERSOS.find((x) => x.id === id);
    const bloqueado = u && u.bloqueo && (leer("pin") || huellaActiva()) && !sesion("abierto-" + id);
    html = bloqueado ? renderBloqueo(id, huellaActiva(), !!leer("pin")) : renderUniverso(id, estado.datos, estado.ctx, tema);
  }
  else if (r.startsWith("/d/")) {
    // Detalles (sueldo, plata, productividad, escalafón): se abren con el mismo PIN o huella que su universo.
    const id = r.slice(3), uni = DETALLE_UNI[id];
    const bloqueado = uni && (leer("pin") || huellaActiva()) && !sesion("abierto-" + uni);
    html = bloqueado ? renderBloqueo(uni, huellaActiva(), !!leer("pin")) : renderDetalle(id, estado.datos, estado.ctx);
  }
  else if (r === "/semanal") {
    const bloqueado = (leer("pin") || huellaActiva()) && !sesion("abierto-semanal");
    const ed = new URLSearchParams(location.hash.split("?")[1] || "").get("ed");
    html = bloqueado ? renderBloqueo("semanal", huellaActiva(), !!leer("pin")) : renderSemanal(ed);
    if (!bloqueado && ed && ed !== ultimaEdicion()?.id && edicionAbierta()?.e.id !== ed && abriendoEd !== ed) { abriendoEd = ed; abrirEdicion(ed).then(() => pintar(true)).catch(() => avisar("No pude bajar esa edición: probá con señal")).finally(() => { abriendoEd = null; }); }
  }
  else if (r === "/urgente") html = renderUrgente(estado.datos, estado.ctx);
  else if (r === "/ajustes/guinos") html = renderAjustesGuinos();
  else if (r === "/pedir-diario") html = renderPedirDiario();
  else if (r === "/avisos") html = renderAvisos(estado.datos, estado.ctx);
  else if (r === "/checklists") { usarColores((u) => colorUniverso(estado.datos, u, tema)); html = renderChecklists(); }
  else if (r === "/ideas") html = renderIdeas(estado.datos);
  else if (r.startsWith("/p/")) html = renderFicha(decodeURIComponent(r.slice(3)), estado.datos);
  else if (r === "/propuestas") html = renderPropuestas(estado.datos);
  else if (r === "/agenda") { html = renderAgenda(estado.datos, estado.ctx, tema); if (sesion("agendaTab") === "mes") setTimeout(traerMes, 0); }
  else if (r === "/respiro") html = renderRespiro();
  else if (r === "/rastreador") html = renderRastreador(`<a class="volver" href="#/">${ICONOS.volver} Inicio</a>`);
  else if (r === "/river") { html = renderRiver(estado.ctx); if (sesion("riverTab") === "otros" && !leer("equipos")) traerEquipos().then(() => pintar(true)).catch(() => {}); }
  else if (r === "/datos") html = renderDatos();
  else if (r === "/ajustes") {
    const ag = leer("agenda");
    html = renderAjustes(estadoTema(), demo, !!leer("pin"), {
      configurado: G.configurado(), cuenta: G.cuenta(), estado: G.estadoSesion, permisos: G.permisos(), hoja: idHoja(), huella: huellaActiva(), estadoAct: leer("estadoAct", {}),
      aviso: AVISOS_GOOGLE[new URLSearchParams(location.hash.split("?")[1] || "").get("google")] || null,
      agenda: ag ? new Date(ag.cuando).toLocaleString("es-AR", { weekday: "long", hour: "2-digit", minute: "2-digit" }) : null
    });
  }
  else if (r === "/novedades") html = renderNovedades();
  else html = renderNoEncontrado();

  // Día de River: la banda roja cruza también las demás pantallas.
  if (!esInicio && estado.ctx.modo === "river") html = '<div class="banda banda-pag" aria-hidden="true"></div>' + html;
  app.innerHTML = franjaSesion() + html + barraInferior(r, tema);
  document.body.classList.add("con-barra");
  document.body.classList.toggle("dock-nombres", !!leer("dockNombres"));
  riverEnNegrita(app);
  if (esInicio) { despuesInicio(app, !refresco); conectarBuscador(); }
  montarCosmos(r);
  // Tu sueldo en dólares: el dólar de cada mes se baja recién cuando abrís la página.
  if (r === "/d/dolares" && !datosDolarMeses()) traerDolarMeses().then((d) => { if (d && ruta() === "/d/dolares") pintar(true); });
  const lector = app.querySelector(".lector-ed");
  if (lector) {
    // srcdoc en vez de una dirección: la edición viene de lo guardado, así abre sin señal. Sin scripts, con los links afuera.
    const id = app.querySelector(".lector")?.dataset.ed;
    const esUltima = id === ultimaEdicion()?.id;
    const h = conArchivo(esUltima ? htmlEdicion() : edicionAbierta()?.html || "", id);
    if (lector.srcdoc !== h) lector.srcdoc = h;
    if (esUltima) marcarLeida();
  }
  document.title = esInicio ? "Orbe" : "Orbe · " + (app.querySelector("h1")?.textContent.trim() || "");
}

// Proyectos: el cosmos en 3D se carga recién cuando abrís el universo (así no pesa en el resto de Orbe)
// y deja de dibujar apenas salís.
let cosmos = null;
let abriendoEd = null;
function montarCosmos(r) {
  const caja = r === "/u/proyectos" ? document.getElementById("cosmos") : null;
  if (!caja) { cosmos?.parar(); return; }
  import("./cosmos.js").then((m) => {
    cosmos = m;
    if (!document.body.contains(caja)) return;
    if (!m.montar(caja, paraCosmos(listaProyectos(estado.datos)), { ideas: textosIdeas() })) caja.classList.add("sin-3d");
  }).catch(() => caja.classList.add("sin-3d"));
}

// «River», siempre en negrita, en todo Orbe.
function riverEnNegrita(raiz) {
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => /\bRiver\b/.test(n.nodeValue) && !n.parentElement.closest("b, strong, input, textarea, select, option, script, style, .riv")
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const nodos = [];
  while (w.nextNode()) nodos.push(w.currentNode);
  nodos.forEach((n) => {
    const frag = document.createDocumentFragment();
    n.nodeValue.split(/(\bRiver\b)/).forEach((parte) => {
      if (parte === "River") { const b = document.createElement("b"); b.className = "riv"; b.textContent = "River"; frag.append(b); }
      else if (parte) frag.append(document.createTextNode(parte));
    });
    n.replaceWith(frag);
  });
}

// La cuenta regresiva de River se mueve sola: segundos en su página, minutos en Inicio.
setInterval(() => {
  document.querySelectorAll(".regre[data-hasta]").forEach((el) => {
    if (el.dataset.seg === "1" || new Date().getSeconds() === 0) el.outerHTML = regresiva(Number(el.dataset.hasta), el.dataset.seg === "1");
  });
  // Arriba de Inicio: la hora con segundos.
  const ah = new Date(), hs = document.getElementById("seg-top"), hm = document.getElementById("hora-top");
  if (hs) hs.textContent = ":" + String(ah.getSeconds()).padStart(2, "0");
  if (hm) hm.textContent = String(ah.getHours()).padStart(2, "0") + ":" + String(ah.getMinutes()).padStart(2, "0");
  const ha = document.getElementById("hora-anillo");
  if (ha && hm) ha.textContent = hm.textContent;
}, 1000);

// Franja de arriba cuando hay que volver a conectar: un toque y listo.
function franjaSesion() {
  if (G.estadoSesion !== "reconectar" || !G.cuenta()) return "";
  return `<div class="franja" role="alert"><span>Se cortó la conexión con Google. Lo que ves es lo último guardado.</span>
    <button class="btn" data-accion="google-reconectar">Reconectar</button></div>`;
}

// La barra de abajo: Inicio y los seis universos, fija en todas las pantallas (también en la compu),
// a mano del pulgar. Manteniendo apretado un ícono aparece su nombre; en Ajustes › Diseño se pueden dejar los nombres fijos.
function barraInferior(r, tema) {
  const items = [{ id: "", nombre: "Inicio", color: "var(--text)", href: "#/", ico: ICONOS.inicio }]
    .concat(UNIVERSOS.map((u) => ({ id: u.id, nombre: u.corto, color: colorUniverso(estado.datos, u, tema), href: "#/u/" + u.id, ico: ICONOS["u_" + u.id] || "" })));
  const nombres = !!leer("dockNombres");
  return `<nav class="dock ${nombres ? "con-nombres" : ""}" aria-label="Universos">${items.map((it) => {
    const on = it.id ? r === "/u/" + it.id : (r === "/" || r === "");
    return `<a href="${it.href}" class="uf ${on ? "on" : ""}" ${on ? 'aria-current="page"' : ""} aria-label="${esc(it.nombre)}" data-nombre="${esc(it.nombre)}"><span class="u-ico" style="color:${it.color}">${it.ico}</span>${nombres ? `<small>${esc(it.nombre)}</small>` : ""}</a>`;
  }).join("")}</nav>`;
}

// Agenda › Mes: trae el mes de Google si no está o tiene más de media hora.
let trayendoMes = null;
function traerMes() {
  const m = mesActual(estado.ctx);
  if (!G.cuenta() || G.estadoSesion === "reconectar" || !mesViejo(m) || trayendoMes === claveMes(m)) return;
  trayendoMes = claveMes(m);
  G.leerMes(m.anio, m.mes).then(() => { if (ruta() === "/agenda") pintar(true); }).catch(() => {}).finally(() => { trayendoMes = null; });
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
  const resp = responder(q, estado);
  if (resp) out.push({ respuesta: true, texto: resp.texto, extra: resp.extra || "", href: resp.href || "#/u/finanzas" });
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
    caja.innerHTML = lista.map((r, i) => r.respuesta
      ? `<a class="res resp ${i === sel ? "sel" : ""}" role="option" data-i="${i}" href="${esc(r.href)}">${r.texto}<small>${esc(r.extra)}</small></a>`
      : r.cmd
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
    // Va a tu planilla como gasto cargado a mano (en efectivo, salvo que digas otra cosa); si después llega el mail, se unen.
    const medio = /tarjeta|cr[eé]dito/i.test(cmd.desc) ? "tarjeta" : /d[eé]bito/i.test(cmd.desc) ? "debito" : /\bmp\b|mercado ?pago/i.test(cmd.desc) ? "mp" : /transf/i.test(cmd.desc) ? "transferencia" : "efectivo";
    const desc = cmd.desc.replace(/\b(con )?(tarjeta|cr[eé]dito|d[eé]bito|mp|mercado ?pago|transferencia|transf|efectivo)\b/gi, "").trim() || "varios";
    const mitad = /\b(de los dos|a medias|mitad)\b/i.test(cmd.desc);
    if (!sincroActiva()) {
      const gastos = leer("gastos", []);
      gastos.push({ monto: cmd.monto, desc, rubro: desc.split(/\s+/)[0], fecha: new Date().toISOString() });
      guardar("gastos", gastos); avisar(`Gasto de $ ${cmd.monto.toLocaleString("es-AR")} guardado`); return;
    }
    avisar("Guardando…");
    agregarManual({ monto: cmd.monto, desc: desc.replace(/\b(de los dos|a medias|mitad)\b/gi, "").trim(), medio, mitad })
      .then(() => cruzar()).then(() => { avisar(`Gasto de $ ${cmd.monto.toLocaleString("es-AR")} cargado`); pintar(true); })
      .catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (cmd.tipo === "idea") {
    guardarIdea(cmd.texto, "");
  }
}

function guardarIdea(t, u) {
  const ideas = leer("ideas", []);
  const tags = [...new Set((t.match(/#[\wáéíóúñ]+/gi) || []).map((x) => x.slice(1).toLowerCase()))];
  ideas.push({ t, u, f: new Date().toLocaleDateString("es-AR"), tags });
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

// La hoja del «+»: arriba elegís qué anotar (una idea o un checklist) y abajo cambia el formulario.
function formIdea() {
  return `<form data-form="idea-hoja">
    <label class="sr" for="idea-txt">Idea</label><textarea id="idea-txt" name="t" class="campo-texto" placeholder="Lo que se te cruce. Sumá #etiquetas si querés." required></textarea>
    ${("webkitSpeechRecognition" in window || "SpeechRecognition" in window) ? '<button type="button" class="btn sec dictar" data-accion="dictar" style="margin-top:8px;display:inline-flex;gap:8px;align-items:center"><span style="width:18px;height:18px;display:inline-flex">' + ICONOS.mic + '</span>Dictar</button>' : ""}
    <div class="grupo"><span>Para qué es (opcional)</span><div class="chips">${destinosIdea(estado.datos).map((n) => `<label class="chip"><input type="radio" name="u" value="${esc(n)}" class="sr">${esc(n)}</label>`).join("")}</div></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar idea</button></div></form>`;
}
function pestanaMas(hoja, cual) {
  hoja.querySelectorAll(".mas-tabs button").forEach((b) => { const on = b.dataset.tab === cual; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  hoja.querySelector(".mas-cuerpo").innerHTML = cual === "chk" ? formChecklist() : cual === "precio" ? formPrecio(true) : formIdea();
  hoja.setAttribute("aria-label", cual === "chk" ? "Armar un checklist" : cual === "precio" ? "Buscar un precio" : "Anotar una idea");
  guardar("masPestana", cual);
  const foco = hoja.querySelector(cual === "chk" ? "#chk-lineas" : "textarea");
  if (foco) foco.focus();
}
function abrirHojaIdea(cual = leer("masPestana") || "idea") {
  cerrarHoja();
  const velo = document.createElement("div"); velo.className = "velo on"; velo.dataset.accion = "cerrar-hoja";
  const hoja = document.createElement("div"); hoja.className = "hoja hoja-mas"; hoja.setAttribute("role", "dialog");
  hoja.style.maxHeight = "92vh"; hoja.style.overflowY = "auto";
  hoja.innerHTML = `<div class="mas-tabs" role="tablist" aria-label="Qué querés anotar">
      <button type="button" role="tab" data-accion="mas-tab" data-tab="idea">Idea</button>
      <button type="button" role="tab" data-accion="mas-tab" data-tab="chk">Checklist</button>
      <button type="button" role="tab" data-accion="mas-tab" data-tab="precio">Precio</button></div>
    <div class="mas-cuerpo"></div>`;
  document.body.append(velo, hoja);
  requestAnimationFrame(() => { hoja.classList.add("on"); pestanaMas(hoja, cual); });
  hoja.addEventListener("change", (e) => {
    if (e.target.name === "u") hoja.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.contains(e.target)));
  });
  hoja.addEventListener("input", (e) => {
    if (!e.target.classList.contains("chk-lineas")) return;
    const n = itemsDeTexto(e.target.value).length;
    hoja.querySelector(".chk-contador").textContent = n ? (n === 1 ? "1 ítem" : n + " ítems") : "Cada renglón es un ítem.";
  });
}
function abrirHoja(html, etiqueta) {
  cerrarHoja();
  const velo = document.createElement("div"); velo.className = "velo on"; velo.dataset.accion = "cerrar-hoja";
  const hoja = document.createElement("div"); hoja.className = "hoja"; hoja.setAttribute("role", "dialog"); hoja.setAttribute("aria-label", etiqueta);
  hoja.style.maxHeight = "88vh"; hoja.style.overflowY = "auto";
  hoja.innerHTML = html;
  document.body.append(velo, hoja);
  requestAnimationFrame(() => hoja.classList.add("on"));
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
  else if (a === "nuevo-chk") abrirHojaIdea("chk");
  else if (a === "mas-tab") pestanaMas(el.closest(".hoja"), el.dataset.tab);
  else if (a === "chk-tildar") {
    // Primero se ve el tilde y el tachado; recién después se acomoda la lista.
    vibrar();
    el.classList.add("tildando");
    setTimeout(() => {
      const c = tildarChk(el.dataset.id, Number(el.dataset.i));
      if (c && c.hecho && el.getAttribute("aria-pressed") !== "true") avisar(`«${c.titulo}» completo`);
      pintar(true);
    }, ruta() === "/checklists" ? 0 : 380);
  }
  else if (a === "chk-sacar") { sacarItem(el.dataset.id, Number(el.dataset.i)); pintar(true); }
  else if (a === "chk-de-nuevo") { usarDeNuevo(el.dataset.id); avisar("Listo: otra vez en Inicio"); pintar(true); }
  else if (a === "chk-borrar") {
    // Dos toques para borrar, sin ventanitas de confirmación.
    if (el.dataset.seguro !== "1") { el.dataset.seguro = "1"; el.textContent = "Tocá de nuevo para borrar"; el.classList.add("peligro"); setTimeout(() => { if (el.isConnected) { el.dataset.seguro = ""; el.textContent = "Borrar checklist"; el.classList.remove("peligro"); } }, 4000); return; }
    borrarChecklist(el.dataset.id); avisar("Checklist borrado"); pintar(true);
  }
  else if (a === "dock-nombres") { guardar("dockNombres", !leer("dockNombres")); vibrar(); pintar(true); }
  else if (a === "inicio-ver") {
    const l = new Set(leer("inicioOcultos", []));
    if (l.has(el.dataset.k)) l.delete(el.dataset.k); else l.add(el.dataset.k);
    guardar("inicioOcultos", [...l]); vibrar(); pintar(true);
  }
  else if (a === "inicio-compacto") { guardar("inicioCompacto", el.dataset.v === "1"); pintar(); }
  else if (a === "buscar") {
    // La lupa de arriba abre (y cierra) el buscador.
    const b = document.querySelector(".buscador.flotante");
    if (b) { b.hidden = !b.hidden; if (!b.hidden) document.getElementById("q")?.focus(); }
  }
  else if (a === "deshacer-hecho") {
    guardar("hechos", leer("hechos", []).filter((c) => c !== el.dataset.clave));
    const hc = leer("hechosCuando", {}); delete hc[el.dataset.clave]; guardar("hechosCuando", hc, true);
    avisar("Volvió a la lista"); pintar(true);
  }
  else if (a === "cerrar-hoja") cerrarHoja();
  else if (a === "river-tab") {
    sesion("riverTab", el.dataset.tab); pintar(true);
    if (el.dataset.tab === "otros") traerEquipos().then(() => pintar(true)).catch(() => avisar("No pude traer los otros equipos"));
  }
  else if (a === "mr-pagado") { abrirHoja(hojaPagado(el.dataset.c, Number(el.dataset.m) || 0), "Marcar pagado"); setTimeout(() => document.querySelector('.hoja [name="monto"]')?.select(), 250); }
  else if (a === "mr-pct") { fijarColchonPct(Number(el.dataset.v)); vibrar(); pintar(true); }
  else if (a === "mr-usar") { const r = mesReal(periodo(new Date())); abrirHoja(hojaColchon(r ? r.colchon : 0, Number(el.dataset.m) || 0), "Usar el colchón"); }
  else if (a === "fin-dia") { const delGrafico = !!el.closest(".grafico"); sesion("finDia", el.dataset.d); pintar(true); if (delGrafico) setTimeout(() => document.querySelector(".fz.gastos")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }
  else if (a === "agus-paso") { abrirHoja(hojaAgus2(periodo(new Date()).clave, Number(el.dataset.monto) || 0), "Agus te pasó"); setTimeout(() => document.querySelector('.hoja [name="monto"]')?.select(), 250); }
  else if (a === "river-tabla") { sesion("riverTabla", el.dataset.v); pintar(true); }
  else if (a === "eq-sacar") {
    const l = equiposSeguidos().slice(); l.splice(Number(el.dataset.i), 1); guardar("equiposSeguidos", l); pintar(true);
    traerEquipos(true).then(() => pintar(true)).catch(() => {});
  }
  else if (a === "hoy-tachar") {
    // El trazo de birome se ve primero; después se acomoda la lista (lo tachado baja).
    vibrar();
    const li = el.closest(".lb");
    const marcando = el.getAttribute("aria-pressed") !== "true";
    if (li && marcando) li.classList.add("tachando");
    setTimeout(() => { tacharHoy(el.dataset.f, el.dataset.id, () => pintar(true)); pintar(true); }, marcando ? 420 : 0);
  }
  else if (a === "hoy-contar") { vibrar(); contarHoy(el.dataset.f, el.dataset.id, Number(el.dataset.d), () => pintar(true)); pintar(true); }
  else if (a === "hoy-comp") { fijarCompanero(el.dataset.f, el.dataset.v === "1"); pintar(true); }
  else if (a === "hoy-otros") { sumarHoy(el.dataset.f, "Otros informes", el.dataset.modo); vibrar(); pintar(true); }
  else if (a === "hoy-sacar") { sacarHoy(el.dataset.f, el.dataset.id); pintar(true); }
  else if (a === "agenda-tab") { sesion("agendaTab", el.dataset.tab); pintar(true); if (el.dataset.tab === "mes") traerMes(); }
  else if (a === "mes-nav") {
    const m = mesActual(estado.ctx); const d = new Date(m.anio, m.mes + Number(el.dataset.d), 1);
    sesion("agendaMes", claveMes({ anio: d.getFullYear(), mes: d.getMonth() })); sesion("agendaSel", null); pintar(true); traerMes();
  }
  else if (a === "mes-dia") { sesion("agendaSel", el.dataset.d); pintar(true); document.querySelector(".mes-det")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
  else if (a === "eco-sus-ok") {
    guardar("ecoSusOk", true); avisar("Escribiendo en ECONOMÍA…");
    escribirEnEconomia().then(async (r) => {
      if (r.estado === "ok") { avisar(r.avisos?.length ? r.avisos[0] : "Listo: " + r.hechos.join(", ")); await leerEconomia().catch(() => {}); }
      pintar(true);
    }).catch((err) => { avisar("No se pudo: " + textoError(err.message)); pintar(true); });
  }
  else if (a === "eco-sus-no") { guardar("ecoSusNo", true); avisar("Queda anotado solo en Orbe"); pintar(true); }
  else if (a === "sus-editar") abrirHoja(hojaSuscripcion(el.dataset.id || ""), "Suscripción");
  else if (a === "sus-borrar") {
    if (el.dataset.seguro !== "1") { el.dataset.seguro = "1"; el.textContent = "Tocá de nuevo"; return; }
    borrarSuscripcion(el.dataset.id); cerrarHoja(); avisar("Suscripción borrada"); pintar(true);
  }
  else if (a === "demo-guino") { sesion("demoGuino", el.dataset.g || null); avisar(el.dataset.g ? "Probando el guiño " + el.textContent + ": andá a Inicio" : "Guiños en modo real"); pintar(); }
  else if (a === "guinos-nivel") { guardar("guinosNivel", el.dataset.n); guardar("guinos", el.dataset.n !== "ninguno"); vibrar(); pintar(true); }
  else if (a === "guinos") { guardar("guinos", leer("guinos", true) === false); vibrar(); pintar(true); }
  else if (a === "arana") {
    // La arañita sube por su hilo y se va.
    e.preventDefault(); vibrar(); el.classList.add("sube"); setTimeout(() => el.remove(), 900);
  }
  else if (a === "hud") { const c = document.querySelector(".hud-cont"); if (c) { c.classList.remove("escanea"); void c.offsetWidth; c.classList.add("escanea"); vibrar(); } }
  else if (a === "demo") { sesion("demo", el.dataset.modo || null); avisar(el.dataset.modo ? "Probando: " + el.textContent : "Volviste al modo real"); pintar(); }
  else if (a === "super-borrar") { const l = leer("super", []); l.splice(Number(el.dataset.i), 1); guardar("super", l); pintar(); }
  else if (a === "medita") meditar(Number(el.dataset.min));
  else if (a === "medita-parar") { clearInterval(timerMedita); meditar(0); const r = document.getElementById("medita-reloj"); if (r) r.textContent = "05:00"; }
  else if (a === "google-conectar") conectarGoogle(false);
  else if (a === "google-actualizar" || a === "actualizar-todo") actualizarTodo(true);
  else if (a === "hist-leer") leerTodosRecibos(leerRecibosViejos, () => { if (ruta() === "/d/dolares") pintar(true); }, avisar);
  else if (a === "usd-casa") { sesion("usdCasa", el.dataset.c === "oficial" ? "oficial" : null); pintar(true); }
  else if (a === "dolar-meses") traerDolarMeses(true).then(() => pintar(true));
  else if (a === "google-salir") { G.desconectar().then(recargarDatos); avisar("Google desconectado"); }
  else if (a === "google-reconectar") G.conectar();
  else if (a === "activar-todo") G.conectar(true);
  else if (a === "fuente") {
    const f = leer("fuentes", {}); f[el.dataset.grupo] = el.dataset.valor; guardar("fuentes", f); vibrar(); pintar(true);
  }
  else if (a === "sincronizar" || a === "fin-actualizar") actualizarTodo(true);
  else if (a === "usar-tope") {
    avisar("Guardando tope…");
    guardarTope(el.dataset.rubro, Number(el.dataset.tope)).then(() => { avisar("Tope de " + el.dataset.rubro + " guardado"); pintar(true); }).catch((e) => avisar("No se pudo: " + textoError(e.message)));
  }
  else if (a === "saldo-anotar") { abrirHoja(hojaSaldo(), "Tu plata real"); setTimeout(() => document.querySelector('.hoja [name="bna"]')?.focus(), 250); }
  else if (a === "saldo-dejar") { resolverDiferencia("dejar"); pintar(true); }
  else if (a === "saldo-gasto") {
    const d = discrepancia();
    const monto = Number(el.dataset.m) || 0;
    if (!d || d.resuelto || !(monto > 0) || el.disabled) return;
    el.disabled = true;
    resolverDiferencia("gasto"); // antes de esperar: un segundo toque ya no carga otro
    // Va a la mitad entre los dos controles (sin salir del período): pesa en los días que pasaron, no en hoy.
    const ts = Math.max(Math.round((d.ant.ts + d.ult.ts) / 2), periodo(new Date()).inicio.getTime() + 3600000, d.ant.ts + 60000);
    avisar("Cargando…");
    agregarManual({ monto, desc: "Sin registrar (diferencia de saldo)", medio: "efectivo", rubro: "Otros", ts: Math.min(ts, d.ult.ts - 1000), nota: "diferencia de saldo" })
      .then(() => { avisar("Cargado como gasto del período"); pintar(true); })
      .catch((e) => { resolverDiferencia(null); avisar("No se pudo: " + textoError(e.message)); pintar(true); });
  }
  else if (a === "sat-codigo") {
    avisar("Pidiendo un código…");
    codigoSatelite(el.dataset.nombre || "Celu").then((r) => {
      // Si hay código, el buzón existe: se olvida el aviso viejo de «falta el buzón».
      const st = datosSatelite() || {}; if (st.error) guardar("satelite", { ...st, error: null }, true);
      sesion("satCodigo", r); pintar(true);
    })
      .catch((e) => avisar(e.message === "falta-buzon" ? "Falta crear el buzón en Cloudflare (mirá los pasos en Ajustes)" : "No se pudo: " + textoError(e.message)));
  }
  else if (a === "sat-anular") {
    if (el.dataset.confirmar !== "si") { el.dataset.confirmar = "si"; el.textContent = "¿Seguro? Tocá de nuevo"; return; }
    anularSatelite(el.dataset.id).then(() => { avisar("Celu anulado: ya no puede mandar nada"); pintar(true); }).catch((e) => avisar("No se pudo: " + textoError(e.message)));
  }
  else if (a === "sat-retirar") {
    avisar("Mirando el buzón…");
    retirarSatelite().then((x) => { avisar(x.nuevos ? `Llegaron ${x.nuevos} del celu` : "Nada nuevo del celu"); pintar(true); })
      .catch((e) => avisar(e.message === "falta-buzon" ? "Falta crear el buzón en Cloudflare" : "No se pudo: " + textoError(e.message)));
  }
  else if (a === "campus-tilde" || a === "campus-hecho") {
    const hecho = a === "campus-hecho" ? true : el.checked;
    tildarCampus(el.dataset.id, hecho).then(() => { vibrar(); if (hecho && a === "campus-hecho") avisar("Anotado. Mañana el campus lo confirma."); pintar(true); })
      .catch((e) => { avisar("Quedó en este dispositivo; no llegó a la planilla: " + textoError(e.message)); pintar(true); });
    pintar(true);
  }
  else if (a === "tp-tilde") {
    tildarTp(el.dataset.id, el.checked).then(() => { vibrar(); pintar(true); }).catch((e) => avisar("No se pudo: " + textoError(e.message)));
  }
  else if (a === "tp-nuevo") abrirHoja(hojaTp(el.dataset.materia, datosFacu().materias), "Nuevo TP");
  else if (a === "materia-editar") abrirHoja(hojaMateria(datosFacu().materias.find((m) => m.materia === el.dataset.materia)), "Editar materia");
  else if (a === "tp-materia") abrirHoja(hojaAsignar(datosFacu().tps.find((t) => t.id === el.dataset.id), datosFacu().materias), "Asignar materia");
  else if (a === "agus-tilde") {
    tildarAgus(Number(el.dataset.fila), el.checked).then(() => { vibrar(); pintar(true); }).catch((e) => avisar("No se pudo: " + textoError(e.message)));
  }
  else if (a === "fichado") { guardar("fichado", el.dataset.dia); vibrar(); avisar("Fichado. Buen día de laburo."); pintar(true); }
  else if (a === "gasto-rapido") { abrirHoja(hojaGasto(), "Cargar un gasto"); setTimeout(() => document.querySelector('.hoja [name="monto"]')?.focus(), 250); }
  else if (a === "presu-responder") {
    el.closest(".pregunta")?.classList.add("girando");
    responderPresu(el.dataset.id, el.dataset.r).then(() => { vibrar(); pintar(true); }).catch((e) => avisar("No se pudo: " + textoError(e.message)));
  }
  else if (a === "presu-confirmar") { confirmarIngreso(el.dataset.clave, Number(el.dataset.monto)); avisar("Ingreso confirmado"); pintar(true); }
  else if (a === "fin-tab") { sesion("finTab", el.dataset.tab); if (el.dataset.tab === "analisis" && !datosHist() && sincroActiva()) leerHistorico().then(() => pintar(true)).catch(() => {}); pintar(true); }
  else if (a === "hist-importar") {
    el.disabled = true;
    importarHistorico((t) => avisar(t)).then((r) => { avisar(`Listo: ${r.archivos} archivos, ${r.filas} movimientos`); pintar(true); })
      .catch((e) => { avisar("No se pudo: " + textoError(e.message)); pintar(true); });
  }
  else if (a === "hist-clasif") reclasificar(Number(el.dataset.i), el.dataset.cat).then(() => { vibrar(); pintar(true); }).catch((e) => avisar("No se pudo: " + textoError(e.message)));
  else if (a === "bna-tab") { sesion("bnaTab", el.dataset.tab); pintar(true); }
  else if (a === "prod-mas" || a === "prod-menos") {
    prodCambiar(sesion("prodFecha") || isoHoy(), el.dataset.tarea, a === "prod-mas" ? 1 : -1, () => pintar(true));
    vibrar(); pintar(true);
  }
  else if (a === "prod-preset") { aplicarPreset(sesion("prodFecha") || isoHoy(), el.dataset.id, () => pintar(true)); vibrar(); pintar(true); }
  else if (a === "prod-mes") { if (el.dataset.mes) { sesion("prodMes", el.dataset.mes); pintar(true); } }
  else if (a === "prod-ir") { sesion("prodFecha", el.dataset.fecha === isoHoy() ? null : el.dataset.fecha); window.scrollTo({ top: 0, behavior: "smooth" }); pintar(true); }
  else if (a === "prod-pesos") abrirHoja(hojaPesos(), "Editar pesos");
  else if (a === "prod-elegir") abrirHoja(hojaArchivosProd(), "Elegir planilla");
  else if (a === "prod-comparar") {
    avisar("Comparando con la planilla del banco…");
    compararOficial().then((r) => { avisar(`Listo: ${r.verificados} coinciden, ${r.ajustados} ajustados, ${r.nuevos} agregados`); pintar(true); })
      .catch((e) => avisar(e.message === "sin-archivo" ? "No encontré la carpeta PRODUCTIVIDAD con el Excel en tu Drive" : e.message === "sin-tu-fila" ? "No encontré tu fila en «Mediciones»" : "No se pudo: " + textoError(e.message)));
  }
  else if (a === "agus-nuevo") abrirHoja(hojaAgus(el.dataset.tipo), "Agregar");
  else if (a === "partido-nuevo") abrirHoja(hojaPartido(), "Anotar partido");
  else if (a === "proyecto-pasos") {
    const p = datosListas()?.proyectos.find((x) => x.id === el.dataset.id);
    if (p) abrirHoja(hojaPasos(p), "Próximos pasos");
  }
  else if (a === "agendar-estudio") {
    const ini = new Date(Number(el.dataset.ini)), fin = new Date(Number(el.dataset.fin));
    G.crearEvento({ titulo: "Estudiar: " + el.dataset.titulo, inicio: ini, fin, descripcion: "Rato de estudio sugerido por Orbe" })
      .then(() => { avisar("Agendado en tu calendario"); actualizarTodo(false); })
      .catch((e) => avisar(e.message === "permiso" ? "Falta el permiso de calendario: Ajustes → Dar permiso" : "No se pudo agendar"));
  }
  else if (a === "copiar") {
    navigator.clipboard?.writeText(el.dataset.texto).then(() => avisar("Copiado: " + el.dataset.texto), () => avisar(el.dataset.texto));
  }
  else if (a === "fin-mov") {
    const m = (datosFinanzas()?.movs || []).find((x) => x.id === el.dataset.id);
    if (m) abrirHoja(hojaMovimiento(m), "Corregir movimiento");
  }
  else if (a === "hecho") {
    const h = leer("hechos", []); h.push(el.dataset.clave); guardar("hechos", h.slice(-300));
    const hc = leer("hechosCuando", {}); hc[el.dataset.clave] = Date.now(); guardar("hechosCuando", hc, true);
    avisar("Marcado como hecho"); pintar(true);
  }
  else if (a === "deshacer-hechos") { guardar("hechos", []); pintar(true); }
  else if (a === "dictar") {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const campo = el.closest("form")?.querySelector("textarea, input[name=t]");
    if (!SR || !campo) return;
    const rec = new SR(); rec.lang = "es-AR"; rec.interimResults = false;
    el.classList.add("escuchando"); el.lastChild.textContent = "Escuchando…";
    rec.onresult = (ev) => {
      const t = ev.results[0][0].transcript;
      // En un checklist, cada dictado es un renglón nuevo (un ítem).
      if (campo.classList.contains("chk-lineas")) { campo.value = campo.value.replace(/\s*$/, "") + (campo.value.trim() ? "\n" : "") + t; campo.dispatchEvent(new Event("input", { bubbles: true })); }
      else campo.value = (campo.value ? campo.value + " " : "") + t;
    };
    rec.onend = () => { el.classList.remove("escuchando"); el.lastChild.textContent = campo.classList.contains("chk-lineas") ? "Dictar un ítem" : "Dictar"; campo.focus(); };
    rec.onerror = (ev) => avisar(ev && ev.error === "not-allowed" ? "Orbe no tiene permiso para el micrófono: dáselo en los ajustes del navegador" : "No te escuché: probá de nuevo");
    rec.start();
  }
  else if (a === "idea-tag") { sesion("tagIdea", el.dataset.tag || null); pintar(true); }
  else if (a === "pedir-diario") {
    try { navigator.clipboard?.writeText("/diario").catch(() => {}); } catch (e) { /* nada */ }
    avisar("Copiado: /diario. Pegalo en Claude");
    const url = "https://claude.ai/new";
    if (/Android/i.test(navigator.userAgent)) location.href = enApp(url); else window.open(url, "_blank", "noopener");
  }
  else if (a === "logo-elegir") { sesion("logosAbierto", true); elegirLogo(el.dataset.id, el.dataset.i); avisar("Logo cambiado"); pintar(true); }
  else if (a === "demo-huevo") { sesion("demoHuevo", el.dataset.h || null); pintar(true); }
  else if (a === "avisos-ir") document.getElementById(el.dataset.id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  else if (a === "idea-dest") { sesion("destIdea", el.dataset.dest || null); pintar(true); }
  else if (a === "ficha-tab") { sesion("fichaTab", el.dataset.tab); pintar(true); }
  else if (a === "prop-resp") { responderPropuesta(el.dataset.id, el.dataset.r || null); if (el.dataset.r) avisar({ dale: "Anotado: va a la Bandeja", despues: "Queda para más adelante", no: "Descartada" }[el.dataset.r]); pintar(true); }
  else if (a === "huella-activar") {
    huellaDisponible().then(async (ok) => {
      if (!ok) { avisar("Este dispositivo no tiene lector de huella disponible"); return; }
      try { await registrarHuella(); avisar("Huella activada"); pintar(); } catch (err) { avisar("No se activó la huella"); }
    });
  }
  else if (a === "huella-sacar") {
    // Para apagarla, primero tu huella: nadie puede sacar el bloqueo con tu celu en la mano.
    verificarHuella().then((ok) => { if (ok) { sacarHuella(); avisar("Huella apagada"); pintar(); } else avisar("No se reconoció la huella: sigue activada"); });
  }
  else if (a === "huella-abrir") {
    const id = el.dataset.id;
    verificarHuella().then((ok) => { if (ok) { sesion("abierto-" + id, true); vibrar(); pintar(); } else avisar("No se reconoció la huella"); });
  }
  else if (a === "pin-sacar") {
    (huellaActiva() ? verificarHuella() : Promise.resolve(true)).then((ok) => { if (ok) { borrar("pin"); avisar("PIN sacado"); pintar(); } else avisar("No se reconoció la huella"); });
  }
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
  if (el.type === "radio" && el.closest(".chips")) el.closest(".chips").querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.contains(el) && el.checked));
  if (el.dataset.accion === "super-tilde") { const l = leer("super", []); l[Number(el.dataset.i)].ok = el.checked; guardar("super", l); vibrar(); pintar(); }
  if (el.dataset.accion === "hoy-modo") { modoHoy(el.dataset.f, el.dataset.id, el.value, () => pintar(true)); vibrar(); pintar(true); }
  if (el.dataset.accion === "prod-fecha" && el.value) { sesion("prodFecha", el.value === isoHoy() ? null : el.value); sesion("prodMes", null); pintar(true); }
  if (el.classList.contains("campo-menu")) { const m = leer("menu", {}); m[el.dataset.dia] = el.value.trim(); guardar("menu", m); avisar("Menú guardado"); }
});

// La nota del día del BNA se guarda sola, un segundo después de que dejás de escribir.
let timerNota = null;
document.addEventListener("input", (e) => {
  const t = e.target;
  if (!t.classList?.contains("lb-nota")) return;
  clearTimeout(timerNota);
  timerNota = setTimeout(() => guardarNota(t.dataset.f, t.value), 900);
});

document.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  const tipo = f.dataset.form;
  if (tipo === "super") { const l = leer("super", []); l.push({ t: d.t.trim(), ok: false }); guardar("super", l); vibrar(); pintar(); document.querySelector('[data-form="super"] input')?.focus(); }
  else if (tipo === "idea") { guardarIdea(d.t.trim(), ""); pintar(); }
  else if (tipo === "prod-archivo") { elegirArchivoProd(d.id || null); cerrarHoja(); document.querySelector('[data-accion="prod-comparar"]')?.click(); }
  else if (tipo === "idea-dest") { guardarIdea(d.t.trim(), d.u || ""); pintar(); }
  else if (tipo === "sus") {
    const sus = guardarSuscripcion(d, f.dataset.id || "");
    if (!sus) { avisar("Faltan el nombre o la fecha de renovación"); return; }
    cerrarHoja(); avisar(`${sus.nombre} guardada`); pintar(true);
  }
  else if (tipo === "mr-pagado" || tipo === "mr-usar") {
    const monto = Number(String(d.monto).replace(/\./g, "").replace(",", ".")) || 0;
    const clave = periodo(new Date()).clave;
    if (tipo === "mr-pagado") marcarPagado(clave, f.dataset.c, monto); else usarColchon(clave, monto);
    cerrarHoja(); avisar(tipo === "mr-usar" ? (monto ? "Pasaste $ " + Math.round(monto).toLocaleString("es-AR") + " del colchón al día a día" : "Colchón entero otra vez") : monto ? "Marcado como pagado" : "Vuelve a lo automático"); pintar(true);
  }
  else if (tipo === "agus-paso") {
    const monto = Number(String(d.monto).replace(/\./g, "").replace(",", "."));
    marcarAgus(f.dataset.clave, monto); cerrarHoja(); avisar(monto > 0 ? "Anotado: Agus te pasó $ " + Math.round(monto).toLocaleString("es-AR") : "Listo, lo borré"); pintar(true);
  }
  else if (tipo === "hoy-sumar") { sumarHoy(f.dataset.f, d.t, d.modo); pintar(true); document.querySelector('[data-form="hoy-sumar"] input')?.focus(); }
  else if (tipo === "eq-sumar") {
    const l = equiposSeguidos().slice(); if (d.t.trim() && !l.some((x) => x.toLowerCase() === d.t.trim().toLowerCase())) l.push(d.t.trim());
    guardar("equiposSeguidos", l); pintar(true); avisar("Buscando " + d.t.trim() + "…");
    traerEquipos(true).then(() => pintar(true)).catch(() => avisar("No pude traer los otros equipos"));
  }
  else if (tipo === "chk-nuevo") {
    const c = crearChecklist(d.titulo, d.items, d.u || "");
    if (!c) { avisar("Sumá al menos un ítem"); return; }
    cerrarHoja(); avisar(`«${c.titulo}» está en Inicio`); pintar(true);
  }
  else if (tipo === "chk-sumar") { sumarItem(f.dataset.id, d.t); pintar(true); document.querySelector(`[data-form="chk-sumar"][data-id="${f.dataset.id}"] input`)?.focus(); }
  else if (tipo === "precio") { if (!mandarPedido(d)) { avisar("Decime qué querés comprar"); return; } cerrarHoja(); avisar("Pedido al Rastreador"); if (ruta() === "/rastreador") pintar(true); }
  else if (tipo === "idea-hoja") { guardarIdea(d.t.trim(), d.u || ""); cerrarHoja(); if (ruta() === "/ideas") pintar(); }
  else if (tipo === "futbol") { const l = leer("futbol", []); l.push({ t: d.t.trim(), f: new Date().toLocaleDateString("es-AR") }); guardar("futbol", l); avisar("Partido anotado"); pintar(); }
  else if (tipo === "gasto") {
    const monto = Number(String(d.monto).replace(/\./g, "").replace(",", "."));
    if (monto > 0) { ejecutarComando({ tipo: "gasto", monto, desc: d.desc.trim() || "varios" }); pintar(); }
  } else if (tipo === "alarma") {
    const [h, m] = String(d.hora).split(":").map(Number);
    const t = new Date(); t.setHours(h, m, 0, 0);
    if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1);
    guardar("alarmaManual", { ts: t.getTime() }); avisar("Alarma anotada"); pintar(true);
  } else if (tipo === "avisos") {
    const cfg = { hora: d.hora, desde: d.desde, hasta: d.hasta, max: d.max };
    CATEGORIAS_AVISO.forEach(([k]) => { cfg[k] = d[k] === "on"; });
    guardarAvisos(cfg); avisar("Guardado. Mandando al celu…");
    mandarAgenda(estado.datos, true).then((r) => { avisar(r.estado === "mandada" ? (r.cantidad ? `Listo: ${r.cantidad} avisos programados` : "Listo: por ahora no hay nada para avisar") : "Sin celu vinculado"); pintar(true); })
      .catch((err) => avisar("No se pudo mandar: " + textoError(err.message)));
  } else if (tipo === "horario") {
    const h = {};
    [1, 2, 3, 4, 5].forEach((dd) => { if (d["i" + dd] && d["f" + dd]) h[dd] = { inicio: d["i" + dd], fin: d["f" + dd] }; });
    guardar("horario", h); avisar("Horario guardado"); pintar(true);
  } else if (tipo === "hoja") {
    if (!fijarHoja(d.link)) { avisar("Ese link no parece de una planilla de Google"); return; }
    avisar("Planilla conectada"); await refrescarTodo(true); pintar();
  } else if (tipo === "economia") {
    if (!fijarEconomia(d.link)) { avisar("Ese link no parece de una planilla de Google"); return; }
    avisar("Leyendo ECONOMÍA…"); await refrescarTodo(true); pintar();
  } else if (tipo === "tp-nuevo") {
    cerrarHoja(); avisar("Guardando…");
    nuevoTp(d.materia || "", d.titulo.trim(), d.fecha).then(() => { avisar("TP agregado"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "materia") {
    cerrarHoja(); avisar("Guardando…");
    const links = String(d.links || "").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((x) => x[0]).map(([t, u]) => ({ titulo: u ? t : "Link", url: u || t }));
    const notas = String(d.notas || "").split(/[;\s]+/).map((n) => Number(n.replace(",", "."))).filter((n) => Number.isFinite(n) && n > 0);
    guardarMateria(f.dataset.materia, { notas, links, aula: d.aula.trim(), profe: d.profe.trim(), pistas: String(d.pistas || "").split(";").map((x) => x.trim()).filter(Boolean) })
      .then(() => { avisar("Guardado"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "tp-materia") {
    cerrarHoja();
    asignarTp(f.dataset.id, d.materia, d.fecha).then(() => { avisar("Listo"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "fin-mov") {
    const id = f.dataset.id;
    cerrarHoja(); avisar("Guardando…");
    try {
      const m = (datosFinanzas()?.movs || []).find((x) => x.id === id);
      const cambios = { clase: d.clase, rubro: d.rubro || "", mitad: !!d.mitad };
      const cambioTipo = m && (m.clase !== cambios.clase || (m.rubro || "") !== cambios.rubro || !!m.mitad !== cambios.mitad);
      // Otro día: misma hora, la fecha que elegiste.
      if (m && d.dia && /^\d{4}-\d{2}-\d{2}$/.test(d.dia) && d.dia !== isoP(new Date(m.ts))) {
        const [y, mo, dd] = d.dia.split("-").map(Number), t = new Date(m.ts);
        cambios.ts = new Date(y, mo - 1, dd, t.getHours(), t.getMinutes()).getTime();
      }
      if (m && d.cuenta && (d.cuenta === "si") !== cuentaEnDiario({ ...m, ...cambios })) cambios.diario = d.cuenta === "si" ? "sí" : "no";
      await corregir(id, cambios, !!d.aprender && cambioTipo);
      avisar("Guardado en tu planilla"); pintar(true);
    } catch (err) { avisar("No se pudo guardar: " + err.message); }
  } else if (tipo === "saldo") {
    const num = (v) => Number(String(v || "").replace(/\./g, "").replace(",", "."));
    const cuentas = Object.fromEntries(["bna", "mp", "pp", "efectivo", "otra"].map((k) => [k, num(d[k])]).filter(([, v]) => Number.isFinite(v) && v > 0));
    if (!Object.keys(cuentas).length) { avisar("Poné al menos una cuenta"); return; }
    cerrarHoja(); anotarSaldo(cuentas); avisar("Anotado"); pintar(true);
  } else if (tipo === "gasto-rapido") {
    const monto = Number(String(d.monto).replace(/\./g, "").replace(",", "."));
    if (!(monto > 0)) { avisar("Poné cuánto fue"); return; }
    cerrarHoja(); avisar("Guardando…");
    agregarManual({ monto, desc: d.desc.trim(), medio: d.medio || "efectivo", mitad: !!d.mitad })
      .then(() => cruzar()).then(() => { avisar("Gasto cargado"); pintar(true); })
      .catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "conformado") {
    const monto = Number(String(d.monto).replace(/\./g, "").replace(",", "."));
    if (!(monto > 100000)) { avisar("Revisá el monto del conformado"); return; }
    avisar("Guardando…");
    cargarConformado(d.mes, monto).then(() => { avisar("Grilla recalculada"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "prod-otra") {
    if (d.tarea) { prodCambiar(sesion("prodFecha") || isoHoy(), d.tarea, 1, () => pintar(true)); vibrar(); pintar(true); }
  } else if (tipo === "prod-pesos") {
    const num = (v) => Number(String(v || "").replace(",", "."));
    const lista = [];
    for (let i = 0; i < Number(f.dataset.n); i++) {
      const pts = num(d["p" + i]), min = num(d["m" + i]);
      if (!(pts > 0)) { avisar("Revisá los puntos de " + d["o" + i]); return; }
      lista.push({ tarea: d["o" + i], original: d["o" + i], puntos: pts, minutos: min || 0, grupo: d["g" + i] });
    }
    if (d.nt && d.nt.trim()) {
      if (!(num(d.np) > 0)) { avisar("Falta cuántos puntos vale la tarea nueva"); return; }
      lista.push({ tarea: d.nt.trim(), puntos: num(d.np), minutos: num(d.nm) || 0, grupo: "otras" });
    }
    cerrarHoja(); avisar("Guardando pesos…");
    guardarPesos(lista).then(() => { avisar("Pesos guardados"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "agus-nuevo") {
    cerrarHoja(); avisar("Guardando…");
    agregarAgus(d.tipo || "plan", d.titulo.trim(), d.fecha || "", (d.nota || "").trim())
      .then(() => { avisar("Agregado"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "partido") {
    cerrarHoja(); avisar("Guardando…");
    anotarPartido(d.fecha, d.resultado, d.goles, (d.nota || "").trim())
      .then(() => { avisar("Partido anotado"); pintar(true); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "proyecto-pasos") {
    cerrarHoja(); avisar("Guardando…");
    guardarProximos(f.dataset.id, String(d.pasos || "").split("\n").map((x) => x.replace(/;/g, ",").trim()).filter(Boolean))
      .then(async () => { await recargarDatos(); avisar("Guardado"); }).catch((err) => avisar("No se pudo: " + textoError(err.message)));
  } else if (tipo === "evento") {
    const [y, m, dd] = d.fecha.split("-").map(Number), [hh, mi] = d.hora.split(":").map(Number);
    const ini = new Date(y, m - 1, dd, hh, mi), fin = new Date(ini.getTime() + Number(d.dur || 60) * 60000);
    avisar("Agendando…");
    try {
      await G.crearEvento({ titulo: d.titulo.trim(), inicio: ini, fin });
      f.reset(); avisar("Agendado en tu calendario"); await G.leerAgenda(); await recargarDatos();
    } catch (err) { avisar(err.message === "permiso" ? "Falta el permiso de calendario: Ajustes → Dar permiso" : "No se pudo agendar"); }
  } else if (tipo === "pin-nuevo") {
    if (!/^\d{4,}$/.test(d.pin)) { avisar("El PIN tiene que tener 4 números o más"); return; }
    guardar("pin", await hash(d.pin)); avisar("PIN puesto"); pintar();
  } else if (tipo === "pin") {
    if ((await hash(d.pin)) === leer("pin")) { sesion("abierto-" + f.dataset.id, true); vibrar(); pintar(); }
    else { avisar("PIN incorrecto"); f.reset(); }
  }
});

window.addEventListener("hashchange", () => { cerrarHoja(); clearInterval(timerMedita); pintar(); window.scrollTo(0, 0); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { cerrarHoja(); const b = document.querySelector(".buscador.flotante"); if (b && !b.hidden) b.hidden = true; }
});
// Deslizar a la derecha lo circunstancial de Inicio (tiras, transporte): se va por hoy.
let desl = null;
document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest("[data-desliza]");
  if (!el || e.target.closest("input, select, textarea")) return;
  desl = { el, x: e.clientX, y: e.clientY, dx: 0, activo: false };
});
document.addEventListener("pointermove", (e) => {
  if (!desl) return;
  const dx = e.clientX - desl.x, dy = e.clientY - desl.y;
  if (!desl.activo) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { desl = null; return; } if (dx > 10) desl.activo = true; else return; }
  desl.dx = Math.max(0, dx);
  desl.el.style.transition = "none";
  desl.el.style.transform = `translateX(${desl.dx}px)`;
  desl.el.style.opacity = String(Math.max(.2, 1 - desl.dx / 260));
});
["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, () => {
  if (!desl) return;
  const { el, dx, activo } = desl;
  desl = null;
  if (!activo) return;
  el.style.transition = "transform .22s ease, opacity .22s ease";
  if (dx > 90) {
    el.style.transform = "translateX(110%)"; el.style.opacity = "0";
    const h = new Date(); const dia = h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0") + "-" + String(h.getDate()).padStart(2, "0");
    const oc = leer("tirasOcultas", {});
    Object.keys(oc).forEach((k) => { if (oc[k] < dia && !(k.startsWith("alarma-") && k.slice(7) >= dia)) delete oc[k]; });
    oc[el.dataset.desliza] = dia; guardar("tirasOcultas", oc);
    vibrar(); el.dataset.deslizado = "1";
    setTimeout(() => pintar(true), 230);
  } else { el.style.transform = ""; el.style.opacity = ""; }
}));
// Un deslizamiento no cuenta como toque (no abre el link de la tira).
document.addEventListener("click", (e) => { const el = e.target.closest("[data-desliza]"); if (el && el.style.transform && el.style.transform !== "none" && el.style.transform !== "") { e.preventDefault(); e.stopPropagation(); } }, true);

// Tres toques en el saludo: un guiño al toque.
let toques = [];
document.addEventListener("click", (e) => {
  if (!e.target.closest(".saludo h1") || !guinosPrendidos()) return;
  const t = Date.now();
  toques = toques.filter((x) => t - x < 900).concat(t);
  if (toques.length >= 3) { toques = []; guinoYa(); vibrar(); pintar(); }
});
// Al volver a Orbe se repinta, así un guiño que tocaba mientras no mirabas aparece recién ahora.
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && (ruta() === "/" || ruta() === "")) pintar(true); });

// Guiño Arácnido: manteniendo apretado el + sale un hilo de telaraña hacia arriba.
let thwip = null, thwipHecho = false;
document.addEventListener("pointerdown", (e) => {
  const fab = e.target.closest(".fab");
  if (!fab || !document.querySelector(".inicio.guino-arana")) return;
  thwipHecho = false;
  thwip = setTimeout(() => {
    thwipHecho = true; vibrar();
    const r = fab.getBoundingClientRect();
    const x1 = r.left + r.width / 2, y1 = r.top + 4, x2 = Math.max(24, x1 - 120 - Math.random() * 120), y2 = 0;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "thwip"); svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1"/><text x="${(x1 + x2) / 2 + 12}" y="${(y1 + y2) / 2}">thwip</text>`;
    document.body.appendChild(svg); setTimeout(() => svg.remove(), 1400);
  }, 450);
});
["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, () => clearTimeout(thwip)));
document.addEventListener("click", (e) => { if (thwipHecho && e.target.closest(".fab")) { e.stopImmediatePropagation(); e.preventDefault(); thwipHecho = false; } }, true);

// Universos: manteniendo apretado un ícono aparece su nombre.
let apretado = null;
document.addEventListener("pointerdown", (e) => {
  const u = e.target.closest(".uf[data-nombre]");
  if (!u) return;
  apretado = setTimeout(() => { avisar(u.dataset.nombre); apretado = "mostrado"; }, 450);
});
["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, () => { if (apretado && apretado !== "mostrado") { clearTimeout(apretado); apretado = null; } }));
document.addEventListener("click", (e) => { if (apretado === "mostrado" && e.target.closest(".uf")) e.preventDefault(); apretado = null; }, true);
document.addEventListener("contextmenu", (e) => { if (e.target.closest(".uf")) e.preventDefault(); });

// Al volver a Orbe, refresca la agenda si la sesión de Google sigue abierta.
document.addEventListener("visibilitychange", async () => {
  // Al salir de Orbe, Finanzas y BNA quedan abiertos 15 minutos; después piden la huella de nuevo.
  if (document.visibilityState === "hidden") { sesion("ocultoDesde", Date.now()); if (prodPendiente()) mandarProd().catch(() => {}); return; }
  const fuera = sesion("ocultoDesde");
  sesion("ocultoDesde", null);
  if (fuera && Date.now() - fuera > 15 * 60000) { UNIVERSOS.forEach((u) => u.bloqueo && sesion("abierto-" + u.id, null)); sesion("abierto-semanal", null); }
  if (!estado.datos) return;
  pintar(true);
  const ag = leer("agenda");
  if (!ag || Date.now() - ag.cuando > 5 * 60000) await refrescarAgenda();
  await refrescarTodo();
});

// Cada 30 segundos se actualiza Inicio (hora, anillo, modo), salvo que estés escribiendo.
setInterval(() => {
  if ((ruta() === "/" || ruta() === "") && !document.querySelector(".hoja") && document.activeElement?.id !== "q") pintar(true);
}, 30000);

// ---------- Google ----------
async function recargarDatos() {
  const { datos } = await cargarDatos();
  estado.datos = datos;
  pintar(true);
}

async function conectarGoogle(soloActualizar) {
  if (!soloActualizar) { G.conectar(); return; }
  try {
    avisar("Actualizando…");
    await G.leerAgenda();
    await recargarDatos();
    avisar("Agenda al día");
  } catch (e) {
    if (e.message === "reconectar") { pintar(true); avisar("Hay que volver a conectar con Google"); }
    else if (e.message === "sin-configurar") avisar("Falta cargar el secreto en Cloudflare");
    else avisar("No se pudo actualizar");
  }
}

// Trae la agenda en silencio usando la sesión del servidor. Si hace falta reconectar, Inicio muestra la franja.
async function refrescarAgenda() {
  if (!G.cuenta() && G.estadoSesion !== "desconocido") return;
  try { await G.leerAgenda(); estadoParte("agenda"); await recargarDatos(); }
  catch (e) { estadoParte("agenda", e.message); pintar(true); }
}

// ---------- Sincronización y finanzas ----------
// Todo se actualiza solo: al abrir, al volver a Orbe y cada 5 minutos. El botón ↻ fuerza todo junto.
// El estado de cada parte queda guardado para que Ajustes diga exactamente qué anda y qué no.
const estadoParte = (parte, error, nota) => {
  const e = leer("estadoAct", {});
  e[parte] = error ? { msj: error, cuando: Date.now() } : { ok: Date.now(), nota: nota || "" };
  guardar("estadoAct", e, true);
};

async function refrescarTodo(forzar = false) {
  Promise.all([traerDolar(), traerRiver(), traerTransporte()]).then(async () => {
    anotarCobros();
    // Partidos al calendario «River» (si diste el permiso); nunca frena el resto.
    try { const r = await sincronizarRiver(forzar); if (r.estado === "ok") estadoParte("rivercal", null, r.partidos + " partidos" + (r.creados || r.cambiados ? ` · ${r.creados} nuevos, ${r.cambiados} actualizados` : "")); }
    catch (e) { estadoParte("rivercal", e.message); }
    pintar(true);
  }).catch(() => {});
  if (!sincroActiva()) return { ok: true };
  const fallas = [];
  try { const cambio = await sincronizar(); estadoParte("sincro"); if (cambio) pintar(true); }
  catch (e) { estadoParte("sincro", e.message); fallas.push(["sincro", e.message]); }
  if (!fallas.length && (forzar || Date.now() - (leer("hojasCuando") || 0) > 20 * 3600000)) {
    try {
      await asegurarHojas(HOJAS_EXTRA); guardar("hojasCuando", Date.now(), true);
      if (leer("leemeV") !== LEEME.length) { await asegurarLeeme(LEEME); guardar("leemeV", LEEME.length, true); }
      if (!leer("movCab18")) { await escribirHoja("MOVIMIENTOS!Q1:R1", [["diario", "cruce"]]); guardar("movCab18", true, true); }
    } catch (e) { /* se reintenta otro día */ }
  }
  // Productividad: primero se manda lo que tocaste; después se lee la planilla.
  if (!fallas.length) {
    try {
      if (prodPendiente()) await mandarProd();
      if (forzar || !datosProd() || Date.now() - datosProd().cuando > 5 * 60000) await leerProd();
      estadoParte("prod");
    } catch (e) { estadoParte("prod", e.message); fallas.push(["prod", e.message]); }
  }
  // Agus, fútbol y proyectos: viven en tu planilla; GitHub se consulta como mucho una vez por hora.
  if (!fallas.length && (forzar || !datosListas() || Date.now() - datosListas().cuando > 10 * 60000)) {
    try { await leerListas(); await sumarSemanalAProyectos().catch(() => {}); estadoParte("listas"); await recargarDatos(); traerGithub().then(() => pintar(true)); }
    catch (e) { estadoParte("listas", e.message); fallas.push(["listas", e.message]); }
  }
  // La central de proyectos (fichas y Bandeja de Drive) y las propuestas de Claude. Nunca frena el resto.
  if (G.permisos().drive) {
    try { const c1 = await leerCentral(forzar); const c2 = await leerPropuestas(forzar); estadoParte("central"); if ((c1 || c2) && /^\/(u\/proyectos|ideas|propuestas|p\/)/.test(ruta())) pintar(true); }
    catch (e) { estadoParte("central", e.message); }
  }
  if (!fallas.length && (forzar || !datosFacu() || Date.now() - datosFacu().cuando > 3 * 3600000)) {
    try { await traerCampus(); estadoParte("facu"); }
    catch (e) { estadoParte("facu", e.message); fallas.push(["facu", e.message]); }
  }
  // La revisión diaria del campus (archivo en tu Drive) y tus tildes. Nunca frena el resto.
  if (forzar || !datosCampus() || Date.now() - datosCampus().cuando > 30 * 60000) {
    try { const c = await leerCampus(); estadoParte("campus", null, c.datos?.actualizado ? "revisión del " + c.datos.actualizado.slice(8, 10) + "/" + c.datos.actualizado.slice(5, 7) : "todavía no hay revisión"); pintar(true); }
    catch (e) { estadoParte("campus", e.message); }
  }
  // Recibos (Drive): no dependen de lo demás, así un tropiezo de Gmail no los frena. Cada media hora.
  if (G.permisos().drive && (forzar || Date.now() - (leer("recibosCuando") || 0) > 30 * 60000)) {
    // Si ya leíste los recibos viejos, los nuevos de RECIBOS/AAAA también entran solos a «En dólares».
    if (Object.keys(datosSueldosHist()).length) leerRecibosViejos(4).catch(() => {});
    try { const n = await leerRecibos(); guardar("recibosCuando", Date.now(), true); estadoParte("recibos"); if (n) { await leerPlanilla(); avisar("Leí tu recibo nuevo: Finanzas y BNA ya lo usan"); } }
    catch (e) { estadoParte("recibos", e.message); }
  }
  // Satélite (independiente de lo demás) y antes que los mails: el aviso del celu llega primero, así cuenta ese.
  const sat = datosSatelite();
  const conCelu = sat?.dispositivos?.length;
  if (forzar || !sat || Date.now() - sat.cuando > (conCelu ? 5 * 60000 : 6 * 3600000)) {
    try { const x = await retirarSatelite(); estadoParte("satelite", null, x.dispositivos.length ? (x.nuevos ? x.nuevos + " nuevos del celu" : "al día") : "sin celu vinculado"); if (x.nuevos) avisar(x.nuevos === 1 ? "Llegó 1 pago del celu" : `Llegaron ${x.nuevos} pagos del celu`); }
    catch (e) { if (e.message === "falta-buzon") { guardar("satelite", { ...(sat || {}), cuando: Date.now(), error: "falta-buzon" }, true); estadoParte("satelite", null, "falta crear el buzón"); } else estadoParte("satelite", e.message); }
  }
  if (!fallas.length) {
    try {
      if (forzar || !leer("presuConfig") || Date.now() - leer("presuConfig").cuando > 6 * 3600000) await leerConfigPresu().catch(() => {});
      if (forzar || !datosEsc() || Date.now() - datosEsc().cuando > 6 * 3600000) await leerEscalafon().catch(() => {});
      const r = await actualizarFinanzas(forzar);
      await cruzar().catch(() => {});
      estadoParte("mails", null, r && (r.frenado || r.quedan) ? "trayendo el historial de a poco" : "");
    }
    catch (e) { estadoParte("mails", e.message); fallas.push(["mails", e.message]); }
    // El Semanal: la última edición de tu Drive, guardada para leer sin señal (se fija cada media hora).
    if (G.permisos().drive) {
      try { if (await actualizarSemanal(forzar)) pintar(true); estadoParte("semanal"); }
      catch (e) { guardar("semanalError", e.message, true); estadoParte("semanal", e.message); }
    }
    if (idEconomia()) {
      const eco = datosEconomia();
      if (forzar || !eco || Date.now() - eco.cuando > 10 * 60000) {
        try { await leerEconomia(); estadoParte("economia"); }
        catch (e) { estadoParte("economia", e.message); fallas.push(["economia", e.message]); }
      }
    }
  }
  // Suscripciones a ECONOMÍA: solo si lo aprobaste, y solo la fila «Suscripciones».
  if (!fallas.length && idEconomia() && leer("ecoSusOk")) {
    try { const r = await escribirEnEconomia(); if (r.estado === "ok") { (r.avisos || []).forEach((a) => avisar(a)); await leerEconomia(); } }
    catch (e) { estadoParte("economia", e.message); }
  }
  // Lo que Orbe le pasa a El Semanal: los números ya calculados, en la planilla «Orbe · resumen para El Semanal».
  if (!fallas.length && !sesion("demo")) {
    try { estado.ctx = construirContexto(estado.datos, sesion("demo")); await escribirResumen(estado.datos, estado.ctx, forzar); estadoParte("resumen"); }
    catch (e) { estadoParte("resumen", e.message); }
  }
  // Avisos para el celu (por Satélite): si hay celu vinculado y algo cambió; como mucho cada 10 minutos.
  if (!sesion("demo")) mandarAgenda(estado.datos).catch(() => { /* se reintenta en la próxima vuelta */ });
  pintar(true);
  return { ok: !fallas.length, fallas };
}

// Hojas que Orbe crea solo en tu planilla si todavía no están.
const HOJAS_EXTRA = { ...HOJAS_FACU, ...HOJAS_CAMPUS, ...HOJAS_LISTAS, ...HOJAS_PROD, ...HOJAS_PRESU, ...HOJAS_ESC, ...HOJAS_ANALISIS };
// Lo que dice el LEEME de tu planilla sobre cada hoja que Orbe fue sumando (mismo estilo que las demás).
const LEEME = [
  "MATERIAS: tus materias de UFASTA, con pistas para reconocer los mails del campus, profe, aula, links y notas.",
  "TPS: cada TP con su materia, fecha de entrega y si está hecho. Los avisos del campus lo tildan solo.",
  "BONOS: el neto de cada bono que cobrás con recibo aparte (lo lee Orbe de las subcarpetas de tu carpeta de recibos) y a qué período va.",
  "TILDES_FACU: lo que marcaste «ya lo hice» en UFASTA (id del ítem del campus o del plan de Marketing, sí/vacío y cuándo).",
  "AGUS: lo compartido con Agus: fechas (anual), viaje, vuelos, planes, pelis y series, docs.",
  "FUTBOL: cada partido: fecha, resultado (G/E/P), goles y cómo jugaste.",
  "PROYECTOS: tus proyectos con repo, estado y próximos pasos (separados por ;).",
  "PRODUCTIVIDAD: tu puntaje del BNA, una fila por tarea y por día (fecha, tarea, cantidad, puntos). Los puntos quedan fijos con el peso de ese día. «Otras (histórico)» es lo que no fue informe en los días traídos de la planilla del banco. Solo tus números.",
  "MOVIMIENTOS, columnas diario y cruce: «sí» cuenta para el presupuesto diario, «no» no cuenta, «agus» es plata de la división (va al colchón), «dup» es un mail que se unió con un gasto que cargaste (cruce = el otro). Vacío = automático.",
  "COBROS: los días de cobro del año y los extras de cada uno. Cada período del diario va de un cobro al día antes del siguiente.",
  "AJUSTES: descuentos acordados en cuotas (como el lavarropas que Agus resta de la división): monto, desde qué mes, cuota de ese mes y total de cuotas.",
  "ESCALAFON: la grilla base de la rama Administrativa (cargo, coeficiente, sueldo, ROE, devolución de aportes) del mes de referencia; «tuyo» marca tu cargo.",
  "CONFORMADOS: el sueldo mínimo (Auxiliar E) de cada mes. Con cada uno nuevo, toda la grilla sube en la misma proporción.",
  "BANCARIO: la fórmula del Día del Bancario de cada año: suma fija + valor por coeficiente.",
  "HISTORICO: cada movimiento de tus extractos de la caja de ahorro y de tus resúmenes de tarjeta (fecha, cuenta, concepto, monto, saldo, categoría y de qué archivo salió). Lo arma Orbe leyendo tus PDF de Drive; podés corregir la categoría a mano.",
  "PESOS_PRODUCTIVIDAD: cuánto vale cada tarea (puntos por unidad) y cuántos minutos lleva; grupo carga, control, ms (MS y cambio de cartera), otras o meta. Las filas «meta» dicen desde qué fecha vale cada meta diaria y los minutos efectivos."
];
const NOMBRE_PARTE = { satelite: "Satélite", campus: "la revisión del campus", facu: "el campus de UFASTA", sincro: "la sincronización", mails: "los mails", economia: "ECONOMÍA", agenda: "la agenda", recibos: "los recibos", listas: "Agus, fútbol y proyectos", central: "la central de proyectos", prod: "la productividad" };
export function textoError(m) {
  m = String(m || "");
  if (m === "reconectar" || m.startsWith("reconectar")) return "hay que volver a conectar con Google";
  if (m.startsWith("api-apagada:sheets")) return "falta prender el servicio de planillas en Google Cloud";
  if (m.startsWith("api-apagada:gmail")) return "falta prender el servicio de Gmail en Google Cloud";
  if (m.startsWith("api-apagada:drive")) return "falta prender el servicio de Drive en Google Cloud";
  if (m.startsWith("api-apagada:calendar")) return "falta prender el servicio de Calendar en Google Cloud";
  if (m === "permiso" || m.startsWith("permiso")) return "Google no dio permiso";
  if (m === "no-existe") return "no encuentro la planilla";
  return m;
}

let actualizando = false;
async function actualizarTodo(aMano) {
  if (actualizando) return;
  actualizando = true;
  document.querySelectorAll('[data-accion="actualizar-todo"]').forEach((b) => b.classList.add("girando"));
  if (aMano) avisar("Actualizando todo…");
  const fallas = [];
  try { await G.leerAgenda(); estadoParte("agenda"); await recargarDatos(); }
  catch (e) { estadoParte("agenda", e.message); fallas.push(["agenda", e.message]); }
  if (G.estadoSesion !== "reconectar") {
    const r = await refrescarTodo(true);
    fallas.push(...(r.fallas || []));
  }
  actualizando = false;
  document.querySelectorAll(".girando").forEach((b) => b.classList.remove("girando"));
  pintar(true);
  if (aMano) avisar(!fallas.length ? "Todo al día" : "Al día, salvo " + fallas.map(([p, m]) => NOMBRE_PARTE[p] + " (" + textoError(m) + ")").join(" y "));
}

let finEnCurso = false;
async function actualizarFinanzas(forzar) {
  if (!sincroActiva() || finEnCurso) return;
  const fin = datosFinanzas();
  if (!forzar && fin && Date.now() - fin.cuando < 10 * 60000) return;
  finEnCurso = true;
  try {
    if (G.permisos().gmail) return await traerMails();
    await leerPlanilla();
  } finally { finEnCurso = false; }
}

// Cada 5 minutos, si Orbe está a la vista, se pone al día solo.
setInterval(() => { if (document.visibilityState === "visible" && !actualizando) actualizarTodo(false); }, 5 * 60000);

// Un link con ?hoja=ID deja la planilla configurada en este dispositivo.
function leerHojaDelLink() {
  const q = new URLSearchParams(location.hash.split("?")[1] || "");
  let ok = false;
  if (q.get("hoja") && fijarHoja(q.get("hoja"))) ok = true;
  if (q.get("economia") && fijarEconomia(q.get("economia"))) ok = true;
  if (q.get("semillas") && fijarSemillas(q.get("semillas"))) { ok = true; guardar("hojasCuando", 0, true); }
  if (ok) avisar("Planillas conectadas");
  return ok;
}
window.addEventListener("hashchange", () => { if (leerHojaDelLink()) refrescarTodo(true); });

// ---------- Arranque ----------
// Ajustes de una sola vez entre versiones.
function migrar() {
  // v0.16: los lunes ahora son de 8:00 a 15:30 (antes 9:45 a 17:15).
  if (!leer("migr016")) {
    const h = leer("horario", {});
    if (h[1] && h[1].inicio === "09:45" && h[1].fin === "17:15") { h[1] = { inicio: "08:00", fin: "15:30" }; guardar("horario", h); }
    guardar("migr016", true, true);
  }
}

(async function arrancar() {
  migrar();
  try {
    const { datos } = await cargarDatos();
    estado.datos = datos;
    const pedido = cargarClima(datos.ciudad);
    estado.clima = await Promise.race([pedido, new Promise((r) => setTimeout(() => r(null), 1500))]);
    pintar();
    if (!estado.clima) { estado.clima = await pedido; if (estado.clima) pintar(true); }
    // Vuelta de Google después de conectar.
    if (location.hash.includes("google=ok")) { history.replaceState(null, "", location.pathname + "#/"); avisar("Conectado con Google"); }
    leerHojaDelLink();
    // Refresca la agenda sin preguntar: la sesión del servidor dura semanas.
    await refrescarAgenda();
    await refrescarTodo();
  } catch (e) {
    app.innerHTML = `<div class="pagina"><h1>Ups</h1><p class="bajada">No pude cargar Orbe. Revisá la conexión y volvé a abrir.</p></div>`;
  }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => { /* sin modo offline */ });
  }
})();
