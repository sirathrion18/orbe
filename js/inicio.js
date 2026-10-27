// Pantalla de Inicio: saludo, anillo del día, widgets, buscador y universos.
import { SALUDOS } from "./saludos.js";
import { UNIVERSOS } from "./config.js";
import { ICONOS, TELA } from "./iconos.js";
import { DIAS, MESES, hhmm, duracion, urgentes, cuandoTexto } from "./contexto.js";
import { describirClima } from "./fuente.js";
import { leer } from "./almacen.js";

export const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const C = 2 * Math.PI * 100; // circunferencia del anillo (r = 100)

export function colorTipo(datos, tipo, tema) {
  const t = datos.tipos[tipo] || datos.tipos.otro;
  return tema === "oscuro" ? t.oscuro : t.claro;
}

export function colorUniverso(datos, u, tema) {
  if (u.color.startsWith("tipo:")) return colorTipo(datos, u.color.slice(5), tema);
  if (u.color === "texto") return "var(--text)";
  return u.color;
}

// ---------- Saludo ----------
function elegirSaludo(datos, ctx, clima) {
  const f = ctx.fecha;
  const semilla = f.getFullYear() * 400 + f.getMonth() * 32 + f.getDate();
  let cat;
  const hora = ctx.min / 60;
  const lluvia = clima && describirClima(clima.codigo).icono.match(/lluvia|tormenta/);
  const entregaHoy = (datos.pendientes || []).some((p) => p.tipo === "facu" && p.dias === 0);
  if (ctx.cumple) cat = "cumple";
  else if (ctx.modo === "river") cat = "river";
  else if (ctx.modo === "marvel") cat = "marvel";
  else if (ctx.modo === "noche") cat = "noche";
  else if (entregaHoy) cat = "entrega";
  else if (lluvia && semilla % 3 === 0) cat = "lluvia";
  else if (clima && clima.max >= 32 && semilla % 3 === 1) cat = "calor";
  else if (clima && clima.max <= 10 && semilla % 3 === 1) cat = "frio";
  else if (ctx.modo === "libre") cat = (ctx.dia === 0 || ctx.dia === 6) ? "finde" : "libre";
  else if (semilla % 2 === 0) cat = ["", "lunes", "martes", "miercoles", "jueves", "viernes", ""][ctx.dia] || "";
  if (!cat || !SALUDOS[cat]) cat = hora < 13 ? "manana" : hora < 20 ? "tarde" : "noche";
  const lista = SALUDOS[cat];
  const plantilla = lista[(semilla * 7 + 3) % lista.length];
  const nombre = plantilla.includes("{f}") ? datos.usuario.formal : datos.usuario.nombre;
  const [antes, despues] = plantilla.replace("{f}", "{n}").split("{n}");
  return esc(antes) + "<em>" + esc(nombre) + "</em>" + esc(despues ?? "");
}

// ---------- Bajada ----------
const unir = (xs) => xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1];

function bajada(ctx) {
  if (ctx.modo === "noche") {
    const p = ctx.manana[0];
    return p ? "Mañana arranca con " + p.titulo + " a las " + p.inicio + "." : "Mañana no tenés nada fijo.";
  }
  if (ctx.modo === "river" && ctx.partido) {
    if (ctx.min >= ctx.partido.fin) return "Terminó el partido. Mañana se sigue.";
    return "Juega River a las " + ctx.partido.inicio + ". Lo demás puede esperar.";
  }
  if (ctx.modo === "libre") {
    const p = ctx.hoy.find((b) => b.fin > ctx.min);
    return p ? "Nada urgente. Lo único fijo es " + p.titulo.toLowerCase() + " a las " + p.inicio + "." : "Sin planes. El día es tuyo.";
  }
  if (!ctx.hoy.length) return "Día sin nada fijo en la agenda.";
  const titulos = [...new Set(ctx.hoy.map((b) => b.titulo))];
  const total = ctx.hoy.reduce((s, b) => s + (b.fin - b.ini), 0);
  let hueco = 0;
  for (let i = 1; i < ctx.hoy.length; i++) hueco = Math.max(hueco, ctx.hoy[i].ini - ctx.hoy[i - 1].fin);
  return unir(titulos) + "." + (total >= 7 * 60 ? " Día largo" + (hueco >= 120 ? ", con un hueco a la tarde." : ".") : hueco >= 120 ? " Con un hueco en el medio." : "");
}

// ---------- Anillo ----------
function anillo(datos, ctx, tema) {
  const noche = ctx.modo === "noche";
  const bloques = noche ? ctx.manana : ctx.hoy;
  const segs = bloques.map((b) => {
    const ini = b.ini / 1440 * C + 4.5;
    const largo = Math.max(0.5, (b.fin - b.ini) / 1440 * C - 9);
    const pasado = !noche && b.fin <= ctx.min;
    return `<circle class="seg" cx="130" cy="130" r="100" fill="none" stroke="${colorTipo(datos, b.tipo, tema)}" stroke-width="9"
      stroke-linecap="round" stroke-dasharray="0 ${C}" data-largo="${largo}" stroke-dashoffset="${-ini}" ${pasado ? 'stroke-opacity=".4"' : ""}/>`;
  }).join("");
  const marcas = [0, 6, 12, 18].map((h) => {
    const a = h / 24 * 2 * Math.PI;
    return `<circle cx="${130 + 117 * Math.sin(a)}" cy="${130 - 117 * Math.cos(a)}" r="1.6" style="fill:var(--muted)" opacity=".6"/>`;
  }).join("");
  const a = ctx.min / 1440 * 2 * Math.PI;
  const punto = noche ? "" : `<circle cx="${130 + 100 * Math.sin(a)}" cy="${130 + -100 * Math.cos(a)}" r="7" style="fill:var(--text);stroke:var(--bg)" stroke-width="4"/>`;

  // Centro
  let lbl, big, sub;
  if (noche) {
    const p = ctx.manana[0];
    lbl = "Mañana"; big = p ? p.inicio : "Libre"; sub = p ? p.titulo : "sin nada fijo";
  } else if (ctx.modo === "river" && ctx.partido) {
    const p = ctx.partido;
    if (ctx.min < p.ini) { lbl = "Faltan"; big = duracion(p.ini - ctx.min); sub = esc(p.titulo) + " · " + p.inicio; }
    else if (ctx.min < p.fin) { lbl = "En juego"; big = hhmm(ctx.min); sub = esc(p.titulo); }
    else { lbl = "Terminó"; big = esc(p.detalle?.resultado || "—"); sub = esc(p.titulo); }
  } else {
    const actual = ctx.hoy.find((b) => b.ini <= ctx.min && ctx.min < b.fin);
    const prox = ctx.hoy.find((b) => b.ini > ctx.min);
    big = hhmm(ctx.min);
    if (actual) { lbl = "Ahora · " + esc(actual.titulo); sub = "te quedan " + duracion(actual.fin - ctx.min); }
    else if (prox && ctx.modo === "libre") { lbl = "Libre hasta las"; big = prox.inicio; sub = esc(prox.titulo); }
    else if (prox) { lbl = "Próximo · " + esc(prox.titulo); sub = "en " + duracion(prox.ini - ctx.min); }
    else { lbl = "Libre"; sub = "no queda nada por hoy"; }
  }

  return `<a class="anillo" href="#/agenda" aria-label="Abrir la agenda del día">
    <svg viewBox="0 0 260 260" aria-hidden="true">
      <circle cx="130" cy="130" r="100" style="fill:var(--bg);stroke:var(--track)" stroke-width="3"/>
      ${marcas}
      <g transform="rotate(-90 130 130)">${segs}</g>
      ${punto}
    </svg>
    <span class="centro"><span class="lbl">${lbl}</span><span class="big">${big}</span><span class="sub">${sub}</span></span>
  </a>`;
}

function leyenda(datos, ctx, tema) {
  const bloques = ctx.modo === "noche" ? ctx.manana : ctx.hoy;
  const tipos = [...new Set(bloques.map((b) => b.tipo))];
  if (!tipos.length) return "";
  return `<div class="leyenda">${tipos.map((t) => `<span><i class="dot" style="background:${colorTipo(datos, t, tema)}"></i>${esc((datos.tipos[t] || datos.tipos.otro).nombre)}</span>`).join("")}</div>`;
}

// ---------- Tira de modo ----------
function tira(ctx) {
  if (ctx.modo === "river" && ctx.partido) {
    const p = ctx.partido;
    const fin = ctx.min >= p.fin;
    return `<div class="tira"><div><div class="k">${fin ? "Resultado" : "Formación probable"}</div>
      <div class="t">${esc(fin ? p.titulo : (p.detalle?.formacion || "—"))}</div></div>
      <div class="n">${fin ? esc(p.detalle?.resultado || "—") : p.inicio}</div></div>`;
  }
  if (ctx.modo === "marvel") {
    const e = ctx.estreno;
    if (e && (e.dias <= 14 || !ctx.viaje || ctx.fecha.getDate() === 7))
      return `<div class="tira"><div><div class="k">Se viene</div><div class="t">${esc(e.titulo)}</div></div><div class="n">${cuandoTexto(e.dias)}</div></div>`;
    if (ctx.viaje)
      return `<div class="tira"><div><div class="k">Cuenta regresiva</div><div class="t">${esc(ctx.viaje.titulo)}</div></div><div class="n">${cuandoTexto(ctx.viaje.dias)}</div></div>`;
  }
  return "";
}

// ---------- Widgets ----------
function wClima(clima) {
  if (!clima) {
    return `<div class="w"><div class="fila"><span class="k">CABA</span><span style="width:22px;height:22px;display:inline-flex;color:var(--muted)">${ICONOS.nube}</span></div>
      <span class="grande">—</span><span class="sub">Sin datos del clima</span></div>`;
  }
  const d = describirClima(clima.codigo);
  return `<div class="w"><div class="fila"><span class="k">CABA</span><span style="width:22px;height:22px;display:inline-flex;color:var(--muted)">${ICONOS[d.icono]}</span></div>
    <span class="grande">${clima.temp}°</span><span class="sub">${d.estado}</span>
    <span class="minmax"><span>↑ ${clima.max}°</span><span>↓ ${clima.min}°</span></span></div>`;
}

function wUrgente(datos, ctx) {
  const lista = urgentes(datos, ctx);
  if (!lista.length) {
    if (ctx.modo === "libre" || ctx.modo === "noche") {
      const libre = ctx.modo === "libre";
      return `<a class="w" href="${libre ? "#/u/proyectos" : "#/respiro"}" style="text-decoration:none"><span class="k">${libre ? "Para disfrutar" : "Para cerrar"}</span>
        <span class="tit">${libre ? "Nada urgente. Una partida en a64, un capítulo o un plan." : "Nada pendiente. Un rato de respiro antes de dormir."}</span>
        <span class="sub">${libre ? "Abrir Proyectos" : "Abrir Respiro"}</span></a>`;
    }
    return `<div class="w"><span class="k">Urgente</span><span class="tit">Nada urgente</span><span class="sub">Todo en orden por ahora</span></div>`;
  }
  const dos = lista.slice(0, 2);
  const resto = lista.length - dos.length;
  return `<a class="w urg" href="#/u/${esc(dos[0].universo || "finanzas")}" style="text-decoration:none"><span class="k">Urgente</span>
    ${dos.map((p, i) => `<span class="tit" ${i ? 'style="font-size:14px;font-weight:500;color:var(--muted)"' : ""}>${esc(p.titulo)}</span>${i ? "" : `<span class="cuando">${cuandoTexto(p.dias)}</span>`}`).join("")}
    ${resto > 0 ? `<span class="sub">+${resto} más esta semana</span>` : ""}</a>`;
}

function wPlata(datos, ctx) {
  const p = datos.plata;
  const oculto = leer("plataOculta", false);
  const mes = MESES[ctx.fecha.getMonth()].toUpperCase();
  const monto = p.disponible == null ? '<span style="font-size:22px;color:var(--muted)">Conectá la planilla</span>'
    : "$ " + Number(p.disponible).toLocaleString("es-AR");
  return `<div class="w ancho"><div class="fila"><span class="k">Disponible · ${mes}</span>
      <span class="fila" style="gap:10px"><span class="sub" style="font-size:12px">quedan ${p.diasRestantes} días</span>
      <button class="ojo" data-accion="ocultar-plata" aria-label="${oculto ? "Mostrar" : "Ocultar"} la plata">${oculto ? ICONOS.ojoNo : ICONOS.ojo}</button></span></div>
    <span class="medio ${oculto ? "oculto" : ""}">${oculto ? "••••••" : monto}</span>
    <div class="barra"><i style="width:${oculto ? 0 : Math.round(p.usado * 100)}%"></i></div>
    <span class="sub">Próximo: ${esc(p.proximo)}</span></div>`;
}

function wPasos(datos) {
  const p = datos.pasos;
  const dif = Math.round((p.hoy / p.promedio - 1) * 100);
  return `<a class="w ancho" href="#/u/bienestar" style="text-decoration:none"><div class="fila"><span class="k">Pasos de hoy</span><span class="ejemplo">Ejemplo</span></div>
    <div class="fila" style="align-items:baseline"><span class="medio">${p.hoy.toLocaleString("es-AR")}</span>
    <span class="sub">${dif >= 0 ? "+" : ""}${dif}% contra tu promedio</span></div></a>`;
}

// ---------- Pantalla ----------
export function renderInicio(datos, ctx, clima, tema) {
  const f = ctx.fecha;
  const fechaTxt = DIAS[f.getDay()] + " " + f.getDate() + " " + MESES[f.getMonth()].slice(0, 3);
  const temaIcono = tema === "oscuro" ? ICONOS.sol : ICONOS.luna;
  return `
  ${ctx.modo === "river" ? '<div class="banda" aria-hidden="true"></div>' : ""}
  ${ctx.modo === "marvel" ? TELA : ""}
  <div class="inicio">
    <div class="col-a">
      <div class="top"><span>${fechaTxt}${ctx.demo ? ' <a class="ejemplo" href="#/ajustes" style="text-decoration:none">Prueba</a>' : ""}</span>
        <span class="der"><span id="reloj">${hhmm(ctx.min)}</span>
          <button class="icon-btn" data-accion="tema" aria-label="Pasar a modo ${tema === "oscuro" ? "claro" : "oscuro"}">${temaIcono}</button>
          <a class="icon-btn" href="#/ajustes" aria-label="Ajustes">${ICONOS.ajustes}</a></span></div>
      <div class="saludo"><h1>${elegirSaludo(datos, ctx, clima)}</h1><p>${esc(bajada(ctx))}</p></div>
      ${anillo(datos, ctx, tema)}
      ${leyenda(datos, ctx, tema)}
    </div>
    <div class="col-b">
      ${tira(ctx)}
      <div class="widgets">${wClima(clima)}${wUrgente(datos, ctx)}${wPlata(datos, ctx)}${wPasos(datos)}</div>
      <div class="buscador" role="search">
        <label class="campo"><span class="sr">Buscar o escribir un comando</span>${ICONOS.buscar}
          <input id="q" type="search" autocomplete="off" placeholder="Buscar, o «gasto 3500 súper»"></label>
        <div class="resultados" id="resultados" role="listbox"></div>
      </div>
      <div class="universos">${UNIVERSOS.map((u) => `<a class="u" href="#/u/${u.id}"><i class="dot" style="background:${colorUniverso(datos, u, tema)}"></i>${esc(u.nombre)}</a>`).join("")}</div>
      <p class="pie">Orbe · datos de ejemplo + clima real · <a href="#/novedades">novedades</a></p>
    </div>
  </div>
  <button class="fab" data-accion="idea" aria-label="Anotar una idea">${ICONOS.mas}</button>`;
}

// Después de pintar: animar el anillo y ubicar la banda de River en el centro del círculo.
export function despuesInicio(app, animar = true) {
  const segs = app.querySelectorAll(".anillo .seg");
  const dibujar = () => segs.forEach((s) => s.setAttribute("stroke-dasharray", s.dataset.largo + " " + C));
  if (animar) requestAnimationFrame(() => requestAnimationFrame(dibujar));
  else { segs.forEach((s) => { s.style.transition = "none"; }); dibujar(); }
  const banda = app.querySelector(".banda");
  const an = app.querySelector(".anillo");
  if (banda && an) {
    const ra = app.getBoundingClientRect(), rn = an.getBoundingClientRect();
    banda.style.top = (rn.top - ra.top + rn.height / 2 - 23) + "px";
    banda.style.left = (rn.left - ra.left + rn.width / 2 - 410) + "px";
  }
}
