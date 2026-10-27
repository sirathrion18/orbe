// Pantalla de Inicio: saludo, anillo del día, widgets, buscador y universos.
import { SALUDOS } from "./saludos.js";
import { UNIVERSOS } from "./config.js";
import { ICONOS, TELA, MARCA } from "./iconos.js";
import { DIAS, MESES, hhmm, duracion, urgentes, cuandoTexto } from "./contexto.js";
import { describirClima } from "./fuente.js";
import { leer } from "./almacen.js";
import { resumenMes, datosFinanzas } from "./finanzas.js";
import { datosEconomia } from "./economia.js";

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
  if (!ctx.cumple && ctx.cumpleHoy && ctx.cumpleHoy.length && ctx.modo !== "madrugada") {
    return "Hoy cumple " + esc(unir(ctx.cumpleHoy)) + ", <em>" + esc(datos.usuario.nombre) + "</em>.";
  }
  if (ctx.cumple) cat = "cumple";
  else if (ctx.modo === "madrugada") cat = "madrugada";
  else if (ctx.modo === "river") cat = "river";
  else if (ctx.modo === "marvel") cat = "marvel";
  else if (ctx.modo === "noche") cat = "noche";
  else if (entregaHoy) cat = "entrega";
  else if (lluvia && semilla % 3 === 0) cat = "lluvia";
  else if (clima && clima.max >= 32 && semilla % 3 === 1) cat = "calor";
  else if (clima && clima.max <= 10 && semilla % 3 === 1) cat = "frio";
  else if (ctx.modo === "libre") cat = (ctx.dia === 0 || ctx.dia === 6) ? "finde" : "libre";
  else if (semilla % 2 === 0) cat = ["", "lunes", "martes", "miercoles", "jueves", "viernes", ""][ctx.dia] || "";
  if (!cat || !SALUDOS[cat]) cat = hora < 13 ? "manana" : "tarde";
  const lista = SALUDOS[cat];
  const plantilla = lista[(semilla * 7 + 3) % lista.length];
  const nombre = plantilla.includes("{f}") ? datos.usuario.formal : datos.usuario.nombre;
  const [antes, despues] = plantilla.replace("{f}", "{n}").split("{n}");
  return esc(antes) + "<em>" + esc(nombre) + "</em>" + esc(despues ?? "");
}

// ---------- Bajada ----------
export const unir = (xs) => xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " y " + xs[xs.length - 1];

function bajada(ctx) {
  if (ctx.modo === "madrugada") {
    const p = ctx.hoy.find((b) => b.ini >= ctx.min);
    return p ? "Hoy arrancás con " + p.titulo + " a las " + p.inicio + ". A descansar." : "Hoy no tenés nada fijo. A descansar.";
  }
  if (ctx.feriado && ctx.modo !== "noche") return "Feriado: " + ctx.feriado + ". El día es tuyo.";
  if (ctx.diaLibre && ctx.modo !== "noche") return ctx.diaLibre + ". El día es tuyo.";
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
  // Dos carriles: si un evento se pisa con otro, va por dentro.
  let finCarril = -1;
  const segs = bloques.map((b) => {
    const carril = b.ini < finCarril ? 1 : 0;
    if (!carril) finCarril = b.fin; else finCarril = Math.max(finCarril, b.fin);
    const r = carril ? 86 : 100;
    const circ = 2 * Math.PI * r;
    const ini = b.ini / 1440 * circ + 4.5;
    const largo = Math.max(0.5, (b.fin - b.ini) / 1440 * circ - 9);
    const pasado = !noche && b.fin <= ctx.min;
    return `<circle class="seg" cx="130" cy="130" r="${r}" fill="none" stroke="${colorTipo(datos, b.tipo, tema)}" stroke-width="${carril ? 7 : 9}"
      stroke-linecap="round" stroke-dasharray="0 ${circ}" data-largo="${largo}" data-circ="${circ}" stroke-dashoffset="${-ini}" ${pasado ? 'stroke-opacity=".4"' : ""}/>`;
  }).join("");
  const marcas = [0, 6, 12, 18].map((h) => {
    const a = h / 24 * 2 * Math.PI;
    return `<circle cx="${130 + 117 * Math.sin(a)}" cy="${130 - 117 * Math.cos(a)}" r="1.6" style="fill:var(--muted)" opacity=".6"/>`;
  }).join("");
  const a = ctx.min / 1440 * 2 * Math.PI;
  const punto = noche ? "" : `<circle cx="${130 + 100 * Math.sin(a)}" cy="${130 + -100 * Math.cos(a)}" r="7" style="fill:var(--text);stroke:var(--bg)" stroke-width="4"/>`;
  // Marca de la alarma: una rayita roja por fuera del anillo, a la hora en que suena.
  const alarma = noche ? ctx.alarmaManana : ctx.alarmaHoy;
  let marcaAlarma = "";
  if (alarma) {
    const d = new Date(alarma);
    const aa = (d.getHours() * 60 + d.getMinutes()) / 1440 * 2 * Math.PI;
    const p1 = [130 + 108 * Math.sin(aa), 130 - 108 * Math.cos(aa)], p2 = [130 + 121 * Math.sin(aa), 130 - 121 * Math.cos(aa)];
    marcaAlarma = `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" style="stroke:var(--accent)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${p2[0]}" cy="${p2[1]}" r="3.5" style="fill:var(--accent)"/>`;
  }

  // Centro
  let lbl, big, sub;
  const alarmaCentro = (noche && ctx.alarmaManana) || (ctx.modo === "madrugada" && ctx.alarmaHoy);
  if (alarmaCentro) {
    const d = new Date(alarmaCentro);
    const dormis = Math.max(0, Math.round((alarmaCentro - ctx.fecha.getTime()) / 60000));
    lbl = "Alarma" + (ctx.alarmaManual ? " · a mano" : "");
    big = hhmm(d.getHours() * 60 + d.getMinutes());
    sub = "dormís " + duracion(dormis) + " si te acostás ya";
  } else if (noche) {
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
      ${marcaAlarma}
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
  // Sin alarma para mañana y arrancás temprano: aviso, con opción de cargarla a mano.
  const primero = ctx.manana[0];
  if (ctx.modo === "noche" && !ctx.alarmaManana && primero && primero.ini < 10 * 60) {
    return `<form class="tira" data-form="alarma" style="flex-wrap:wrap"><div style="flex:1;min-width:150px"><div class="k">Sin alarma para mañana</div>
      <div class="t">${esc(primero.titulo)} a las ${primero.inicio}</div></div>
      <label style="display:flex;gap:8px;align-items:center"><span class="sr">Hora de la alarma</span>
        <input type="time" name="hora" required style="height:42px;padding:0 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-size:16px">
        <button class="btn" style="height:42px;padding:0 14px">Listo</button></label></form>`;
  }
  if (ctx.cumpleManana && ctx.cumpleManana.length && ctx.modo !== "river") {
    return `<div class="tira"><div><div class="k">Mañana cumple</div><div class="t">${esc(unir(ctx.cumpleManana))}</div></div><div class="n">mañana</div></div>`;
  }
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
function wClima(clima, ctx) {
  const noche = clima && clima.manana && ctx && ctx.modo === "noche";
  const c = noche ? { ...clima.manana, temp: clima.manana.max } : clima;
  if (!c) return `<div class="w clima"><span class="k">CABA</span><div class="fila-clima"><span class="grande">—</span></div><span class="sub">Sin datos del clima</span></div>`;
  const d = describirClima(c.codigo);
  return `<div class="w clima"><div class="fila"><span class="k">${noche ? "Mañana" : "CABA"}</span><span class="ico">${ICONOS[d.icono]}</span></div>
    <div class="fila-clima"><span class="grande">${c.temp}°</span><span class="minmax"><span>↑${c.max}°</span><span>↓${c.min}°</span></span></div>
    <span class="sub">${d.estado}</span></div>`;
}

// Transporte: el lugar ya está; el estado en vivo de tus líneas llega en la próxima versión.
const LINEAS = [["E", "#6B2F8F"], ["H", "#F5C400"], ["A", "#00A8D6"]];
function wTransporte() {
  return `<div class="w trans"><span class="k">Transporte</span>
    <div class="lineas">${LINEAS.map(([l, c]) => `<span class="linea" style="background:${c}">${l}</span>`).join("")}<span class="cole">42 · 26 · 135</span></div>
    <span class="sub">Estado en vivo, en la próxima versión</span></div>`;
}

function wUrgente(datos, ctx) {
  const lista = urgentes(datos, ctx);
  if (!lista.length) {
    if (ctx.modo === "libre" || ctx.modo === "noche") {
      const libre = ctx.modo === "libre";
      return `<a class="w alto" href="${libre ? "#/u/proyectos" : "#/respiro"}" style="text-decoration:none"><span class="k">${libre ? "Para disfrutar" : "Para cerrar"}</span>
        <span class="tit">${libre ? "Nada urgente. Una partida en a64, un capítulo o un plan." : "Nada pendiente. Un rato de respiro antes de dormir."}</span>
        <span class="sub">${libre ? "Abrir Proyectos" : "Abrir Respiro"}</span></a>`;
    }
    return `<div class="w alto"><span class="k">Urgente</span><span class="tit">Nada urgente</span><span class="sub">Todo en orden por ahora</span></div>`;
  }
  const [p, segundo] = lista;
  const resto = lista.length - (segundo ? 2 : 1);
  return `<div class="w urg alto"><div class="fila"><span class="k">${p.dias < 0 ? "Vencido" : "Urgente"}</span>
      <button class="hecho" data-accion="hecho" data-clave="${esc(p.clave)}" aria-label="Marcar ${esc(p.titulo)} como hecho">${ICONOS.check}</button></div>
    <a href="#/u/${esc(p.universo || "finanzas")}" style="text-decoration:none;display:flex;flex-direction:column;gap:6px">
      <span class="tit">${esc(p.titulo)}</span>
      ${p.monto ? `<span class="monto">${esc(p.monto)}</span>` : ""}
      <span class="cuando">${cuandoTexto(p.dias)}</span>
      ${segundo ? `<span class="sub">Después: ${esc(segundo.titulo)} · ${cuandoTexto(segundo.dias)}</span>` : ""}
      ${resto > 0 ? `<span class="sub">+${resto} más</span>` : ""}</a></div>`;
}

const pesos = (n) => "$ " + Math.round(n).toLocaleString("es-AR");

function wPlata(datos, ctx) {
  const r = resumenMes(datosFinanzas(), ctx.fecha);
  const e = datosEconomia();
  const m = e && e.meses[ctx.fecha.getMonth()];
  const oculto = leer("plataOculta", false);
  const mes = MESES[ctx.fecha.getMonth()].toUpperCase();
  const ojo = `<button class="ojo" data-accion="ocultar-plata" aria-label="${oculto ? "Mostrar" : "Ocultar"} la plata">${oculto ? ICONOS.ojoNo : ICONOS.ojo}</button>`;
  const alerta = r && r.alertas[0];
  const lineaAlerta = alerta ? `<span class="sub" style="color:var(--accent);font-weight:600">${esc(alerta.rubro)}: ${Math.round(alerta.pct * 100)}% del tope</span>` : "";
  // Tu planilla manda: saldo del mes y cuánto da por día.
  if (m && m.saldo != null) {
    const usado = m.ingresos ? Math.min(1, Math.max(0, (m.total || 0) / m.ingresos)) : 0;
    return `<a class="w ancho" href="#/u/finanzas" style="text-decoration:none"><div class="fila"><span class="k">Saldo · ${mes}</span>
        <span class="fila" style="gap:10px"><span class="sub" style="font-size:12px">${m.diario != null ? (oculto ? "••••" : pesos(Math.abs(m.diario))) + (m.diario < 0 ? " de menos" : "") + " por día" : ""}</span>${ojo}</span></div>
      <span class="medio ${oculto ? "oculto" : ""}" style="${m.saldo < 0 ? "color:var(--accent)" : ""}">${oculto ? "••••••" : pesos(m.saldo)}</span>
      <div class="barra"><i style="width:${oculto ? 0 : Math.round(usado * 100)}%;${m.saldo < 0 ? "background:var(--accent)" : ""}"></i></div>
      ${lineaAlerta || `<span class="sub">Ingresos ${oculto ? "••••" : pesos(m.ingresos || 0)} · egresos ${oculto ? "••••" : pesos(m.total || 0)}</span>`}</a>`;
  }
  if (!r || r.queda == null) {
    return `<a class="w ancho" href="#/u/finanzas" style="text-decoration:none"><div class="fila"><span class="k">Plata · ${mes}</span></div>
      <span class="medio" style="font-size:20px;color:var(--muted)">${r ? "Falta el disponible del mes" : "Activá finanzas en Ajustes"}</span>
      <span class="sub">${r ? "Cargalo en la hoja MES de tu planilla" : "Lee tu planilla y tus mails del BNA y Mercado Pago"}</span></a>`;
  }
  return `<div class="w ancho"><div class="fila"><span class="k">Te queda · ${mes}</span>
      <span class="fila" style="gap:10px"><span class="sub" style="font-size:12px">${r.diasRestantes} días</span>${ojo}</span></div>
    <a href="#/u/finanzas" style="text-decoration:none"><span class="medio ${oculto ? "oculto" : ""}" style="${r.queda < 0 ? "color:var(--accent)" : ""}">${oculto ? "••••••" : pesos(r.queda)}</span></a>
    <div class="barra"><i style="width:${oculto ? 0 : Math.round(r.usado * 100)}%;${r.queda < 0 ? "background:var(--accent)" : ""}"></i></div>
    ${lineaAlerta || `<span class="sub">Salió ${oculto ? "••••" : pesos(r.salio)} de ${oculto ? "••••" : pesos(r.disponible)}</span>`}</div>`;
}

function wPasos(datos) {
  const p = datos.pasos;
  const dif = Math.round((p.hoy / p.promedio - 1) * 100);
  return `<a class="w ancho" href="#/u/bienestar" style="text-decoration:none"><div class="fila"><span class="k">Pasos de hoy</span><span class="ejemplo">Ejemplo</span></div>
    <div class="fila" style="align-items:baseline"><span class="medio">${p.hoy.toLocaleString("es-AR")}</span>
    <span class="sub">${dif >= 0 ? "+" : ""}${dif}% contra tu promedio</span></div></a>`;
}

function pieAgenda(datos) {
  if (!datos.cuenta) return '<a href="#/ajustes">conectar con Google</a>';
  if (!datos.agenda) return '<button class="link" data-accion="google-actualizar">leer la agenda</button>';
  const min = Math.round((Date.now() - datos.agenda.cuando) / 60000);
  const hace = min < 1 ? "recién" : min < 60 ? "hace " + min + " min" : min < 1440 ? "hace " + Math.round(min / 60) + " h" : "hace " + Math.round(min / 1440) + " días";
  return "agenda " + hace + ' · <button class="link" data-accion="google-actualizar">actualizar</button>';
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
      <div class="widgets">${wClima(clima, ctx)}${wUrgente(datos, ctx)}${wTransporte()}${wPlata(datos, ctx)}</div>
      <div class="buscador" role="search">
        <label class="campo"><span class="sr">Buscar o escribir un comando</span>${ICONOS.buscar}
          <input id="q" type="search" autocomplete="off" placeholder="Buscar, o «gasto 3500 súper»"></label>
        <div class="resultados" id="resultados" role="listbox"></div>
      </div>
      <div class="universos">${UNIVERSOS.map((u) => `<a class="u" href="#/u/${u.id}"><i class="dot" style="background:${colorUniverso(datos, u, tema)}"></i>${esc(u.nombre)}</a>`).join("")}</div>
      <p class="pie">${MARCA}<br>${pieAgenda(datos)} · <a href="#/novedades">novedades</a> · <a href="privacidad.html">privacidad</a></p>
    </div>
  </div>
  <button class="fab" data-accion="idea" aria-label="Anotar una idea">${ICONOS.mas}</button>`;
}

// Después de pintar: animar el anillo y ubicar la banda de River en el centro del círculo.
export function despuesInicio(app, animar = true) {
  const segs = app.querySelectorAll(".anillo .seg");
  const dibujar = () => segs.forEach((s) => s.setAttribute("stroke-dasharray", s.dataset.largo + " " + (s.dataset.circ || C)));
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
