// Páginas internas: universos, ideas, agenda, respiro, mis datos, ajustes, novedades.
import { UNIVERSOS, PROMOS, PROMOS_SIEMPRE, VERSION } from "./config.js";
import { NOVEDADES } from "./novedades.js";
import { ICONOS, MARCA } from "./iconos.js";
import { esc, colorTipo, colorUniverso } from "./inicio.js";
import { DIAS, DIAS_CORTOS, bloquesDe, cuandoTexto, duracion, MODOS } from "./contexto.js";
import { leer, todo } from "./almacen.js";

const volver = `<a class="volver" href="#/">${ICONOS.volver} Inicio</a>`;
const pronto = (titulo, texto) => `<section class="bloque pronto"><h2>${titulo}</h2><p class="vacio">${texto}</p></section>`;
const local = '<p class="vacio" style="margin-top:12px;font-size:12px">Por ahora se guarda solo en este dispositivo.</p>';

function cabecera(u, datos, tema) {
  return `${volver}<h1><i class="dot" style="width:12px;height:12px;border-radius:6px;vertical-align:middle;margin-right:10px;background:${colorUniverso(datos, u, tema)}"></i>${esc(u.nombre)}</h1>
    <p class="bajada">${esc(u.bajada)}</p>`;
}

// ---------- Universos ----------
const PAGINAS = {
  agus(datos) {
    const lista = leer("super", []);
    const menu = leer("menu", {});
    const orden = [1, 2, 3, 4, 5, 6, 0];
    return `
    <section class="bloque"><h2>Lista del súper <span class="tag">compartida pronto</span></h2>
      <ul class="lista">${lista.length ? lista.map((it, i) => `<li><label style="display:flex;gap:10px;align-items:center;flex:1">
        <input type="checkbox" data-accion="super-tilde" data-i="${i}" ${it.ok ? "checked" : ""} style="width:20px;height:20px">
        <span style="${it.ok ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(it.t)}</span></label>
        <button class="ojo" data-accion="super-borrar" data-i="${i}" aria-label="Sacar ${esc(it.t)}">${ICONOS.cruz}</button></li>`).join("") : '<li class="vacio">La lista está vacía.</li>'}</ul>
      <form class="form" data-form="super"><input name="t" placeholder="Agregar algo" aria-label="Agregar a la lista" required><button class="btn">Sumar</button></form>
      ${local}</section>
    <section class="bloque"><h2>Menú de la semana</h2>
      <div style="display:grid;gap:8px">${orden.map((d) => `<label style="display:flex;gap:10px;align-items:center">
        <span style="width:40px;font-size:13px;color:var(--muted)">${DIAS_CORTOS[d]}</span>
        <input class="campo-menu" data-dia="${d}" value="${esc(menu[d] || "")}" placeholder="¿Qué se come?" style="flex:1;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-size:15px"></label>`).join("")}</div>
      ${local}</section>
    <section class="bloque"><h2>Planes y fechas</h2><ul class="lista">${(datos.fechas || []).map((f) => `<li><span>${esc(f.titulo)}</span><span class="der">${esc(f.fecha.split("-").reverse().join("/"))}</span></li>`).join("") || '<li class="vacio">Sin planes cargados.</li>'}</ul></section>
    ${pronto("Cuenta de Agus", "Cuando la v1 te ande a vos, Agus entra con su Google y ve solo lo compartido.")}`;
  },

  bna(datos) {
    const filas = [1, 2, 3, 4, 5, 6, 0].map((d) => {
      const b = bloquesDe(datos, d).filter((x) => x.tipo === "bna");
      return b.length ? `<li><span>${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)}</span><span class="der">${b.map((x) => x.inicio + "–" + x.fin).join(", ")}</span></li>` : "";
    }).join("");
    return `<section class="bloque"><h2>Horarios <span class="ejemplo">Ejemplo</span></h2><ul class="lista">${filas || '<li class="vacio">Sin horarios.</li>'}</ul></section>
      ${pronto("Recibos de sueldo", "Los leo de tu carpeta de recibos en Drive y te muestro neto, descuentos y disponible real de cada mes.")}
      <section class="bloque"><h2>Lo que nunca entra</h2><p class="vacio">Clientes, procedimientos e informes del banco quedan afuera de Orbe, siempre.</p></section>`;
  },

  ufasta(datos) {
    const entregas = (datos.pendientes || []).filter((p) => p.tipo === "facu");
    const cursada = [1, 2, 3, 4, 5, 6, 0].flatMap((d) => bloquesDe(datos, d).filter((x) => x.tipo === "ufasta").map((x) => ({ d, x })));
    return `<section class="bloque"><h2>Entregas y TPs <span class="ejemplo">Ejemplo</span></h2><ul class="lista">${entregas.map((p) => `<li><span>${esc(p.titulo)}</span><span class="der ${p.dias < 3 ? "rojo" : ""}">${cuandoTexto(p.dias)}</span></li>`).join("") || '<li class="vacio">Nada pendiente.</li>'}</ul></section>
      <section class="bloque"><h2>Cursada</h2><ul class="lista">${cursada.map(({ d, x }) => `<li><span>${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)}</span><span class="der">${x.inicio}–${x.fin}</span></li>`).join("") || '<li class="vacio">Sin horarios.</li>'}</ul></section>
      ${pronto("Notas", "Las traigo del campus cuando aparezcan.")}
      ${pronto("Materiales y links", "Apuntes y links de cada materia, ordenados.")}
      <section class="bloque"><h2>Accesos</h2><div class="chips"><a class="chip" href="https://www.ufasta.edu.ar" target="_blank" rel="noopener">Sitio de UFASTA ${""}</a></div></section>`;
  },

  bienestar(datos) {
    const p = datos.pasos;
    const max = Math.max(...p.semana);
    const hoyDia = new Date().getDay();
    const etiquetas = p.semana.map((_, i) => DIAS_CORTOS[(hoyDia - (p.semana.length - 1 - i) + 70) % 7]);
    const mejor = p.semana.indexOf(max);
    const dif = Math.round((p.hoy / p.promedio - 1) * 100);
    const futbol = [0, 1, 2, 3, 4, 5, 6].flatMap((d) => bloquesDe(datos, d).filter((x) => x.tipo === "futbol"));
    const notas = leer("futbol", []);
    return `<section class="bloque"><h2>Pasos <span class="ejemplo">Ejemplo</span></h2>
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-family:var(--serif);font-size:44px">${p.hoy.toLocaleString("es-AR")}</span>
        <span class="vacio">${dif >= 0 ? "+" : ""}${dif}% contra tu promedio de ${p.promedio.toLocaleString("es-AR")}</span></div>
        <div class="barras">${p.semana.map((v, i) => `<div class="${i === p.semana.length - 1 ? "hoy" : ""}"><i style="height:${Math.round(v / max * 100)}%"></i>${etiquetas[i]}</div>`).join("")}</div>
        <p class="prom">Tu mejor día de la semana fue el ${etiquetas[mejor].toLowerCase()}, con ${max.toLocaleString("es-AR")} pasos.</p></section>
      <section class="bloque"><h2>Logros</h2><ul class="lista">
        <li><span>Récord de la semana</span><span class="der">${max.toLocaleString("es-AR")}</span></li>
        <li><span>Días arriba de tu promedio</span><span class="der">${p.semana.filter((v) => v > p.promedio).length} de 7</span></li></ul></section>
      <section class="bloque"><h2>Fútbol</h2><p>${futbol.length} partido${futbol.length === 1 ? "" : "s"} por semana en tu agenda.</p>
        <form class="form" data-form="futbol"><input name="t" placeholder="¿Cómo jugaste hoy?" aria-label="Nota del partido" required><button class="btn">Anotar</button></form>
        ${notas.length ? `<ul class="lista" style="margin-top:14px">${notas.slice(-3).reverse().map((n) => `<li><span>${esc(n.t)}</span><span class="tag">${esc(n.f)}</span></li>`).join("")}</ul>` : ""}
        <p class="vacio" style="margin-top:12px;font-size:12px">Con el reloj se suman distancia, velocidad y ritmo cardíaco.</p></section>
      <section class="bloque"><h2>Meditación</h2><div class="medita"><span class="reloj" id="medita-reloj">05:00</span>
        <div class="chips">${[3, 5, 10].map((m) => `<button class="chip" data-accion="medita" data-min="${m}">${m} min</button>`).join("")}<button class="chip" data-accion="medita-parar">Parar</button></div></div></section>
      <section class="bloque"><h2>Comida</h2><p>El menú de la semana vive en el universo compartido.</p><div class="chips" style="margin-top:12px"><a class="chip" href="#/u/agus">Ver menú con Agus</a></div></section>
      ${pronto("Gym", "La rutina personalizada la armamos más adelante.")}
      ${pronto("Sueño", "Llega con el reloj.")}
      ${pronto("Pasos reales", "Una mini app Android lee Health Connect en tu Xiaomi y los sube a tu Drive.")}`;
  },

  finanzas(datos, ctx) {
    const p = datos.plata;
    const deudas = (datos.pendientes || []).filter((x) => x.universo === "finanzas").sort((a, b) => a.dias - b.dias);
    const gastos = leer("gastos", []);
    const hoy = new Date();
    const porRubro = {};
    gastos.filter((g) => { const d = new Date(g.fecha); return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear(); }).forEach((g) => { porRubro[g.rubro] = (porRubro[g.rubro] || 0) + g.monto; });
    const rubros = Object.entries(porRubro).sort((a, b) => b[1] - a[1]);
    const dia = ctx.fecha.getDay();
    return `<section class="bloque"><h2>Disponible del mes</h2>
        <p style="font-family:var(--serif);font-size:36px;line-height:1.15;margin-bottom:10px">${p.disponible == null ? '<span style="font-size:20px;color:var(--muted)">Se conecta con tu planilla en la próxima versión</span>' : "$ " + Number(p.disponible).toLocaleString("es-AR")}</p>
        <div class="barra"><i style="width:${Math.round(p.usado * 100)}%"></i></div><p class="prom">Quedan ${p.diasRestantes} días de mes.</p></section>
      <section class="bloque"><h2>Tarjetas y vencimientos <span class="ejemplo">Ejemplo</span></h2><ul class="lista">${deudas.map((d) => `<li><span>${esc(d.titulo)}${d.nota ? ` <span class="tag">${esc(d.nota)}</span>` : ""}</span><span class="der ${d.dias < 7 ? "rojo" : ""}">${cuandoTexto(d.dias)}</span></li>`).join("")}</ul></section>
      <section class="bloque"><h2>Gastos del mes por rubro</h2>
        ${rubros.length ? `<ul class="lista">${rubros.map(([r, m]) => `<li><span>${esc(r)}</span><span class="der">$ ${m.toLocaleString("es-AR")}</span></li>`).join("")}</ul>` : '<p class="vacio">Todavía no cargaste gastos este mes.</p>'}
        <form class="form" data-form="gasto"><input name="monto" inputmode="decimal" placeholder="Monto" aria-label="Monto" required style="max-width:110px"><input name="desc" placeholder="Rubro (súper, uber…)" aria-label="Rubro"><button class="btn">+</button></form>
        <p class="vacio" style="margin-top:10px;font-size:12px">Atajo: escribí «gasto 3500 súper» en el buscador de Inicio.</p></section>
      <section class="bloque"><h2>Promos de hoy, ${DIAS[dia]}</h2><ul class="lista">${(PROMOS[dia] || []).concat(PROMOS_SIEMPRE).map((x) => `<li><span>${esc(x)}</span></li>`).join("")}</ul>
        <p class="vacio" style="margin-top:10px;font-size:12px">Los topes cambian seguido: verificalos antes de pagar.</p></section>
      <section class="bloque"><h2>Mercado</h2><p>La pizarra de CEDEARs, renta fija y cripto se pide en el chat con <b>/pizarra</b>.</p></section>`;
  },

  proyectos(datos) {
    return (datos.proyectos || []).map((p) => `<section class="bloque"><h2>${esc(p.nombre)} <span class="tag">${esc(p.estado)}</span></h2>
      ${p.proximo ? `<p><span class="vacio">Próximo paso:</span> ${esc(p.proximo)}</p>` : ""}
      <div class="chips" style="margin-top:${p.proximo ? 12 : 0}px">${p.url ? `<a class="chip" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir</a>` : ""}${p.repo ? `<a class="chip" href="${esc(p.repo)}" target="_blank" rel="noopener">Repo</a>` : ""}${!p.url && !p.repo ? '<span class="vacio">Acceso por cargar</span>' : ""}</div></section>`).join("");
  }
};

export function renderUniverso(id, datos, ctx, tema) {
  const u = UNIVERSOS.find((x) => x.id === id);
  if (!u) return renderNoEncontrado();
  return `<div class="pagina">${cabecera(u, datos, tema)}${PAGINAS[id](datos, ctx)}</div>`;
}

export function renderBloqueo(id) {
  const u = UNIVERSOS.find((x) => x.id === id);
  return `<div class="pagina">${volver}<h1>${esc(u.nombre)}</h1><p class="bajada">Este universo tiene PIN.</p>
    <form class="form" data-form="pin" data-id="${id}"><input name="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN" aria-label="PIN" required><button class="btn">Entrar</button></form></div>`;
}

// ---------- Secciones ----------
export function renderIdeas() {
  const ideas = leer("ideas", []);
  return `<div class="pagina">${volver}<h1>Ideas</h1><p class="bajada">Todo lo que se te cruza. Una vez por semana las ordeno y te marco las que se repiten.</p>
    <form class="form" data-form="idea"><input name="t" placeholder="Anotá algo" aria-label="Nueva idea" required><button class="btn">Guardar</button></form>
    <ul class="lista" style="margin-top:20px">${ideas.slice().reverse().map((i) => `<li><span>${esc(i.t)}</span><span class="tag">${esc(i.u || i.f)}</span></li>`).join("") || '<li class="vacio">Todavía no hay ideas.</li>'}</ul>
    ${pronto("Voz y fotos", "Las notas de voz y las fotos llegan en la próxima versión.")}</div>`;
}

export function renderAgenda(datos, ctx, tema) {
  const fila = (b) => `<li><span><i class="dot" style="background:${colorTipo(datos, b.tipo, tema)};margin-right:10px"></i>${esc(b.titulo)}</span><span class="der">${b.inicio}–${b.fin}</span></li>`;
  return `<div class="pagina">${volver}<h1>Agenda</h1><p class="bajada">Por ahora sale de la rutina de ejemplo. Después, de tu Google Calendar.</p>
    <section class="bloque"><h2>Hoy, ${DIAS[ctx.dia]}</h2><ul class="lista">${ctx.hoy.map(fila).join("") || '<li class="vacio">Nada fijo.</li>'}</ul></section>
    <section class="bloque"><h2>Mañana, ${DIAS[(ctx.dia + 1) % 7]}</h2><ul class="lista">${ctx.manana.map(fila).join("") || '<li class="vacio">Nada fijo.</li>'}</ul></section></div>`;
}

export function renderRespiro() {
  return `<div class="pagina">${volver}<div class="respiro"><div class="circulo" aria-hidden="true"></div>
    <h1 style="margin:0">Respiro</h1><p class="bajada" style="max-width:320px">Acá no se mide nada y no se guarda nada. Inhalá cuando el círculo crece, soltá cuando se achica.</p>
    <label class="sr" for="respiro-txt">Escribir sin guardar</label>
    <textarea id="respiro-txt" class="campo-texto" placeholder="Si querés, escribí. Se borra al salir."></textarea></div></div>`;
}

export function renderDatos() {
  const t = todo();
  const filas = [["ideas", "Ideas"], ["gastos", "Gastos"], ["super", "Lista del súper"], ["menu", "Menú semanal"], ["futbol", "Notas de fútbol"]]
    .map(([k, n]) => { const v = t[k]; const c = Array.isArray(v) ? v.length : v ? Object.keys(v).length : 0; return `<li><span>${n}</span><span class="der">${c}</span></li>`; }).join("");
  return `<div class="pagina">${volver}<h1>Mis datos</h1><p class="bajada">Lo que Orbe guarda en este dispositivo. Nada de esto está en GitHub.</p>
    <section class="bloque"><h2>Guardado acá</h2><ul class="lista">${filas}</ul></section>
    <section class="bloque"><h2>Acciones</h2><div class="chips"><button class="btn sec" data-accion="exportar">Exportar todo</button><button class="btn peligro" data-accion="borrar-todo">Borrar todo</button></div></section></div>`;
}

export function renderAjustes(estadoTema, demo, hayPin) {
  const tema = estadoTema.modo;
  return `<div class="pagina">${volver}<h1>Ajustes</h1><p class="bajada">${MARCA} versión ${VERSION}.</p>
    <section class="bloque"><h2>Tema</h2><div class="chips">${[["auto", "Automático"], ["claro", "Claro"], ["oscuro", "Oscuro"]].map(([k, n]) => `<button class="chip ${tema === k ? "on" : ""}" data-accion="tema-fijo" data-tema="${k}">${n}</button>`).join("")}</div>
      <p class="vacio" style="margin-top:12px;font-size:13px">Automático: claro de día y oscuro desde la puesta del sol en Buenos Aires. El botón de Inicio lo cambia hasta la próxima salida o puesta.</p></section>
    <section class="bloque"><h2>Probar modos del día</h2><div class="chips"><button class="chip ${!demo ? "on" : ""}" data-accion="demo" data-modo="">Real</button>${MODOS.map((m) => `<button class="chip ${demo === m ? "on" : ""}" data-accion="demo" data-modo="${m}">${m === "normal" ? "Normal" : m === "libre" ? "Día libre" : m === "river" ? "River" : m === "marvel" ? "Guiño Marvel" : "Noche"}</button>`).join("")}</div>
      <p class="vacio" style="margin-top:12px;font-size:13px">Simula el día y la hora de cada modo. Se apaga al cerrar Orbe.</p></section>
    <section class="bloque"><h2>PIN para Finanzas y Bienestar</h2>
      ${hayPin ? '<button class="btn sec" data-accion="pin-sacar">Sacar el PIN</button>' : '<form class="form" data-form="pin-nuevo"><input name="pin" type="password" inputmode="numeric" minlength="4" placeholder="4 dígitos o más" aria-label="Nuevo PIN" required><button class="btn">Poner PIN</button></form>'}
      <p class="vacio" style="margin-top:12px;font-size:13px">Es una cortina para miradas ajenas, no un cofre: en esta versión los datos siguen en el dispositivo.</p></section>
    <section class="bloque"><h2>Más</h2><div class="chips"><a class="chip" href="#/datos">Mis datos</a><a class="chip" href="#/respiro">Respiro</a><a class="chip" href="#/novedades">Novedades</a></div></section></div>`;
}

export function renderNovedades() {
  return `<div class="pagina">${volver}<h1>Novedades</h1><p class="bajada">Qué cambió en cada versión.</p>
    ${NOVEDADES.map((v) => `<section class="bloque"><h2>v${esc(v.version)} <span class="tag">${esc(v.fecha)}</span></h2><p style="margin-bottom:10px">${esc(v.titulo)}</p>
      <ul style="margin:0;padding-left:18px;line-height:1.6">${v.cambios.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>`).join("")}</div>`;
}

export function renderNoEncontrado() {
  return `<div class="pagina">${volver}<h1>No existe</h1><p class="bajada">Esa parte de Orbe todavía no está.</p></div>`;
}

export { duracion };
