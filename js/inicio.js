// Pantalla de Inicio: saludo, anillo del día, widgets, buscador y universos.
import { proximaAnual } from "./listas.js";
import { SALUDOS } from "./saludos.js";
import { UNIVERSOS } from "./config.js";
import { ICONOS, TELA, MARCA } from "./iconos.js";
import { DIAS, MESES, hhmm, duracion, urgentes, urgentesTodos, cuandoTexto, pendientesCon } from "./contexto.js";
import { permisos as permisosG } from "./google.js";
import { describirClima } from "./fuente.js";
import { leer } from "./almacen.js";
import { resumenMes, datosFinanzas } from "./finanzas.js";
import { datosEconomia } from "./economia.js";
import { movimientoDolar } from "./extras.js";
import { presupuesto, preguntas } from "./presupuesto.js";
import { ultimaEdicion, esNueva, proximaSemanal } from "./semanal.js";
import { wChecklists, usarColores } from "./checklists.js";
import { decoracion, hudSobre, decreto, lineaTva } from "./guinos.js";

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
  else if (ctx.guino) cat = ctx.guino === "arana" ? "marvel" : ctx.guino;
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
  // Cambia a lo largo del día: un saludo distinto cada dos horas, sin repetir el de ayer a la misma hora.
  const tramo = Math.floor(ctx.min / 120);
  const plantilla = lista[(semilla * 7 + tramo * 13 + 3) % lista.length];
  const nombre = plantilla.includes("{f}") ? datos.usuario.formal : datos.usuario.nombre;
  const conNombre = (t) => {
    const [a, b] = t.replace("{f}", "{n}").split("{n}");
    return b === undefined ? esc(a) : esc(a) + "<em>" + esc(nombre) + "</em>" + esc(b);
  };
  // Una oración por renglón: "Buen día." arriba y "Café y a la cancha, Nacho." abajo, sin cortes en el medio.
  const m = plantilla.match(/^(.+?[.!?])\s+(.+)$/);
  return m ? `<span class="ls">${conNombre(m[1])}</span><span class="ls">${conNombre(m[2])}</span>` : `<span class="ls">${conNombre(plantilla)}</span>`;
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
  // Esfera de reloj de 24 h: puntitos a las 0, 6, 12 y 18; rayitas a las 3, 9, 15 y 21; rayitas finas en el resto.
  const marcas = Array.from({ length: 24 }, (_, h) => {
    const a = h / 24 * 2 * Math.PI, sx = Math.sin(a), cy = -Math.cos(a);
    if (h % 6 === 0) return `<circle cx="${130 + 117 * sx}" cy="${130 + 117 * cy}" r="3.2" style="fill:var(--muted)" opacity=".8"/>`;
    const media = h % 3 === 0, r1 = media ? 112 : 114, r2 = 120;
    return `<line x1="${(130 + r1 * sx).toFixed(2)}" y1="${(130 + r1 * cy).toFixed(2)}" x2="${(130 + r2 * sx).toFixed(2)}" y2="${(130 + r2 * cy).toFixed(2)}"
      style="stroke:var(--muted)" stroke-width="${media ? 1.6 : 0.8}" stroke-linecap="round" opacity="${media ? 0.55 : 0.35}"/>`;
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
function tira(ctx, datos) {
  // BNA: media hora antes de entrar, acordarte de fichar en Teams (hasta que lo marques o pasen 15 min de la entrada).
  const bna = ctx.demo ? null : ctx.hoy.find((b) => b.tipo === "bna");
  const hoyIso = ctx.fecha.getFullYear() + "-" + String(ctx.fecha.getMonth() + 1).padStart(2, "0") + "-" + String(ctx.fecha.getDate()).padStart(2, "0");
  if (bna && ctx.min >= bna.ini - 30 && ctx.min < bna.ini + 15 && leer("fichado") !== hoyIso) {
    return `<div class="tira tira-bna"><div><div class="k">BNA · entrás a las ${bna.inicio}</div><div class="t">Acordate de fichar en Teams</div></div>
      <button class="btn" style="height:40px;padding:0 14px" data-accion="fichado" data-dia="${hoyIso}">Listo</button></div>`;
  }
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
  // Te pasaste del diario: cuánto, y cómo quedan los próximos días.
  const pr = ctx.demo ? null : presupuesto(ctx.fecha);
  if (pr && pr.pasado && pr.diarioManana != null && !leer("plataOculta", false)) {
    return `<a class="tira" href="#/u/finanzas" style="text-decoration:none;border-color:var(--accent)"><div><div class="k">Te pasaste ${pesos(-pr.quedaHoy)} hoy</div>
      <div class="t">Los próximos días tenés ${pesos(Math.max(0, pr.diarioManana))} por día</div></div></a>`;
  }
  // Problemas en la línea E (la tuya, Emilio Mitre): alerta con alternativa, los días que vas al BNA.
  const tr = leer("transporte");
  if (bna && tr?.lineas?.E && !tr.lineas.E.ok && ctx.min < bna.fin && Date.now() - tr.cuando < 30 * 60000) {
    return `<div class="tira" style="border-color:var(--accent)"><div><div class="k">Línea E con problemas</div>
      <div class="t">${esc(tr.lineas.E.texto || "Servicio interrumpido o demorado")}</div><div class="sub" style="font-size:13px;color:var(--muted);margin-top:3px">Alternativa: colectivo 42, 26 o 135. Salí con margen.</div></div></div>`;
  }
  // Aniversario o cumple de Agus: aviso desde 3 días antes.
  const fa = (leer("listas")?.agus || []).filter((x) => x.tipo === "fecha" && x.fecha && /anual/i.test(x.nota))
    .map((x) => ({ ...x, ...proximaAnual(x.fecha, ctx.fecha) })).filter((x) => x.dias <= 3).sort((a, b) => a.dias - b.dias)[0];
  if (fa && ctx.modo !== "river") {
    return `<a class="tira" href="#/u/agus" style="text-decoration:none"><div><div class="k">Se viene</div><div class="t">${esc(fa.titulo)}</div></div><div class="n">${cuandoTexto(fa.dias)}</div></a>`;
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
  // Un rato libre hoy y una entrega cerca: sugerencia para estudiar (sin tocar el calendario, salvo que lo pidas).
  const est = ratoDeEstudio(ctx, datos);
  if (est) {
    const puede = permisosG().calendario;
    return `<div class="tira" style="flex-wrap:wrap"><div style="flex:1;min-width:170px"><div class="k">Rato para estudiar</div>
      <div class="t">${hhmm(est.ini)}–${hhmm(est.fin)} · ${esc(est.tp.titulo)} (${cuandoTexto(est.tp.dias)})</div></div>
      ${puede ? `<button class="btn" style="height:40px;padding:0 14px" data-accion="agendar-estudio" data-titulo="${esc(est.tp.titulo)}" data-ini="${est.desde}" data-fin="${est.hasta}">Agendar</button>` : ""}</div>`;
  }
  // El dólar, solo si se movió fuerte.
  const dm = movimientoDolar();
  if (dm && Math.abs(dm.pct) >= 2) {
    return `<a class="tira" href="#/u/finanzas" style="text-decoration:none"><div><div class="k">Dólar MEP</div><div class="t">${dm.pct > 0 ? "Subió" : "Bajó"} ${Math.abs(dm.pct).toFixed(1).replace(".", ",")}% desde ayer</div></div>
      <div class="n">$ ${Math.round(dm.mep).toLocaleString("es-AR")}</div></a>`;
  }
  return "";
}

function ratoDeEstudio(ctx, datos) {
  if (!["normal", "libre"].includes(ctx.modo) || ctx.demo) return null;
  const tp = pendientesCon(datos, ctx.fecha).filter((p) => p.tipo === "facu" && p.dias >= 0 && p.dias <= 7).sort((a, b) => a.dias - b.dias)[0];
  if (!tp) return null;
  let desde = Math.max(9 * 60, Math.ceil((ctx.min + 10) / 15) * 15);
  const tope = 22 * 60;
  for (const b of [...ctx.hoy].sort((a, c) => a.ini - c.ini).concat([{ ini: tope, fin: tope }])) {
    if (b.fin <= desde) continue;
    const hasta = Math.min(b.ini, tope);
    if (hasta - desde >= 75) {
      const fin = Math.min(hasta, desde + 120);
      const base = new Date(ctx.fecha); base.setHours(0, 0, 0, 0);
      return { tp, ini: desde, fin, desde: base.getTime() + desde * 60000, hasta: base.getTime() + fin * 60000 };
    }
    desde = Math.max(desde, b.fin + 15);
    if (desde >= tope) break;
  }
  return null;
}

// ---------- Widgets ----------
// Dibujos de línea para el clima: trazo fino del color del texto y un solo acento (el sol en ámbar, el rayo en rojo).
// Nada de cielo azul: con el sol amarillo serían los colores de Boca.
const SOL = "#D97706";
const rayos = (cx, cy, r1, r2) => Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4;
  return `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(cy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(cy + Math.sin(a) * r2).toFixed(1)}"/>`; }).join("");
const NUBE = '<path d="M30 98 a16 16 0 0 1 8-30 a22 22 0 0 1 42 4 a14 14 0 0 1 4 26 z" style="fill:var(--bg)" stroke="currentColor" stroke-width="1.8" opacity=".75"/>';
const NUBE_ALTA = '<path d="M36 50 a14 14 0 0 1 7-26 a20 20 0 0 1 38 3 a13 13 0 0 1 4 23 z" style="fill:var(--bg)" stroke="currentColor" stroke-width="1.8" opacity=".75"/>';
const gotas = (xs) => '<g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".55">' + xs.map(([x, y]) => `<line x1="${x}" y1="${y}" x2="${x - 4}" y2="${y + 9}"/>`).join("") + "</g>";
const DIBUJOS = {
  sol: `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5">${rayos(60, 58, 32, 41)}</g><circle cx="60" cy="58" r="23" fill="none" stroke="${SOL}" stroke-width="2"/>`,
  parcial: `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5">${rayos(60, 50, 30, 38)}</g><circle cx="60" cy="50" r="21" fill="none" stroke="${SOL}" stroke-width="2"/>${NUBE}`,
  nube: '<path d="M48 60 a12 12 0 0 1 6-22 a17 17 0 0 1 32 2 a11 11 0 0 1 3 20 z" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".4"/>' + NUBE,
  lluvia: NUBE_ALTA + gotas([[48, 58], [62, 62], [76, 58], [56, 74], [70, 76]]),
  tormenta: NUBE_ALTA + `<path d="M62 54 l-8 14 h9 l-6 14" fill="none" stroke="#C8102E" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` + gotas([[46, 58], [80, 58]]),
  luna: '<path d="M74 34 a26 26 0 1 0 14 40 a20 20 0 1 1 -14 -40 z" fill="none" stroke="currentColor" stroke-width="1.8" opacity=".75"/><g fill="currentColor" opacity=".5"><circle cx="34" cy="40" r="1.6"/><circle cx="26" cy="64" r="1.2"/><circle cx="46" cy="24" r="1.2"/></g>',
  niebla: '<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity=".55"><line x1="20" y1="56" x2="96" y2="56"/><line x1="30" y1="68" x2="104" y2="68"/><line x1="16" y1="80" x2="88" y2="80"/><line x1="28" y1="92" x2="100" y2="92"/></g>'
};
export function dibujoClima(codigo, deNoche) {
  const d = describirClima(codigo);
  let k = d.icono;
  if (codigo === 45 || codigo === 48) k = "niebla";
  if (deNoche && (k === "sol" || k === "parcial")) k = "luna";
  return `<svg class="clima-dib" viewBox="0 0 120 120" aria-hidden="true">${DIBUJOS[k] || DIBUJOS.parcial}</svg>`;
}

function wClima(clima, ctx) {
  const noche = clima && clima.manana && ctx && ctx.modo === "noche";
  const c = noche ? { ...clima.manana, temp: clima.manana.max } : clima;
  if (!c) return `<div class="w clima marco"><span class="k">CABA</span><div class="fila-clima"><span class="grande">—</span></div><span class="sub">Sin datos del clima</span></div>`;
  const d = describirClima(c.codigo);
  const h = ctx ? Math.floor(ctx.min / 60) : 12;
  return `<div class="w clima marco"><span class="k">${noche ? "Mañana" : "CABA"}</span>
    <div class="fila-clima"><span class="grande">${c.temp}°</span><span class="minmax"><span>↑${c.max}°</span><span>↓${c.min}°</span></span></div>
    <span class="sub">${d.estado}</span>${dibujoClima(c.codigo, !noche && (h >= 20 || h < 6))}</div>`;
}

// Transporte: estado en vivo de tus líneas de subte (E, H, A) y tus colectivos.
const LINEAS = [["E", "#6B2F8F"], ["H", "#F5C400"], ["A", "#00A8D6"]];
function wTransporte() {
  const t = leer("transporte");
  const vivo = t && t.lineas;
  const mal = vivo ? LINEAS.filter(([l]) => t.lineas[l] && !t.lineas[l].ok).map(([l]) => l) : [];
  const sub = !vivo ? (t?.error === "sin-configurar" ? "Esperando las credenciales de la Ciudad" : "Sin datos en vivo")
    : mal.length ? "Problemas en la " + mal.join(", ") : "Subte normal";
  return `<div class="w ancho trans ${mal.length ? "con-problemas" : ""}"><span class="k">Transporte</span>
    <div class="lineas">${LINEAS.map(([l, c]) => `<span class="linea ${vivo && mal.includes(l) ? "mal" : ""}" style="background:${c}">${l}</span>`).join("")}<span class="cole">42 · 26 · 135</span></div>
    <span class="sub">${sub}</span></div>`;
}

function wUrgente(datos, ctx) {
  const lista = urgentesTodos(datos, ctx);
  if (ctx.guino === "decreto") return decreto(lista, cuandoTexto, esc);
  if (!lista.length) {
    if (ctx.modo === "libre" || ctx.modo === "noche") {
      const libre = ctx.modo === "libre";
      return `<a class="w urg-vacio" href="${libre ? "#/u/proyectos" : "#/respiro"}" style="text-decoration:none"><span class="k">${libre ? "Para disfrutar" : "Para cerrar"}</span>
        <span class="tit">${libre ? "Nada urgente. Una partida en a64, un capítulo o un plan." : "Nada pendiente. Un rato de respiro antes de dormir."}</span>
        <span class="sub">${libre ? "Abrir Proyectos" : "Abrir Respiro"}</span></a>`;
    }
    return `<a class="w urg-vacio" href="#/urgente" style="text-decoration:none"><span class="k">Urgente</span><span class="tit">Nada urgente</span><span class="sub">Todo en orden por ahora</span></a>`;
  }
  // Tarjeta finita, a lo ancho: lo más urgente en una línea; el resto vive en la página de Urgente.
  const [p, ...resto] = lista;
  const etiqueta = ctx.guino === "tva" ? "Rama temporal" : p.dias < 0 ? "Vencido" : "Urgente";
  return `<div class="w urg urg-corta"><div class="fila"><span class="k">${etiqueta} · ${lista.length}</span>
      <span class="cuando-c">${cuandoTexto(p.dias)}</span>
      <button class="hecho" data-accion="hecho" data-clave="${esc(p.clave)}" aria-label="Marcar ${esc(p.titulo)} como hecho">${ICONOS.check}</button></div>
    <a class="urg-linea" href="#/urgente" aria-label="Abrir todo lo urgente"><span class="tit">${esc(p.titulo)}</span>${p.monto ? `<span class="monto">${esc(p.monto)}</span>` : ""}<span class="mas">${resto.length ? "+" + resto.length + " ›" : "›"}</span></a></div>`;
}

const pesos = (n) => "$\u00a0" + Math.round(n).toLocaleString("es-AR");

// Presupuesto diario (de cobro a cobro): cuánto podés gastar hoy, y un toque para cargar un gasto.
function wDiario(datos, ctx) {
  const b = presupuesto(ctx.fecha);
  const oculto = leer("plataOculta", false);
  const $ = (n) => oculto ? "••••" : pesos(n);
  const ojo = `<button class="ojo" data-accion="ocultar-plata" aria-label="${oculto ? "Mostrar" : "Ocultar"} la plata">${oculto ? ICONOS.ojoNo : ICONOS.ojo}</button>`;
  const mas = `<button class="mas-gasto" data-accion="gasto-rapido" aria-label="Cargar un gasto">+ Gasto</button>`;
  const finTxt = b.p.fin.getDate() + "/" + (b.p.fin.getMonth() + 1);
  if (b.total == null) return null; // sin tu planilla de este período: queda la tarjeta de siempre
  if (b.base == null) {
    return `<div class="w ancho"><div class="fila"><span class="k">Diario · ${b.p.nombre}</span>${mas}</div>
      <span class="medio" style="font-size:20px">Falta el ingreso de ${b.p.nombre}</span>
      ${b.ingreso.monto ? `<span class="sub">Lo que veo: ${$(b.ingreso.monto)} (${esc(b.ingreso.fuente)}).</span>
        <div class="chips"><button class="chip" data-accion="presu-confirmar" data-clave="${b.p.clave}" data-monto="${Math.round(b.ingreso.monto)}">Usar ${$(b.ingreso.monto)}</button><a class="chip" href="#/u/finanzas">Lo cargo en la planilla</a></div>`
        : '<span class="sub">Cargalo en tu planilla ECONOMÍA y el diario sale solo.</span>'}</div>`;
  }
  if (b.sinDiario) {
    return `<div class="w ancho"><div class="fila"><span class="k">Diario · ${b.p.nombre}</span><span class="fila" style="gap:8px">${ojo}${mas}</span></div>
      <span class="medio" style="font-size:20px;color:var(--accent)">No queda diario</span>
      <span class="sub">Los egresos de tu planilla (${$(b.total)}) superan el ingreso (${$(b.ingreso.monto)}${b.ingreso.propuesta ? ", estimado" : ""}) por ${$(-b.base)}. Revisá los Ingresos de ${b.p.nombre} en ECONOMÍA.</span></div>`;
  }
  const rojo = b.quedaHoy < 0;
  const uso = b.diario > 0 ? Math.min(1, Math.max(0, b.gastoHoy / b.diario)) : 1;
  return `<div class="w ancho diario"><div class="fila"><span class="k">${rojo ? "Hoy te pasaste" : "Hoy podés gastar"}</span><span class="fila" style="gap:8px">${ojo}${mas}</span></div>
    <a href="#/u/finanzas" style="text-decoration:none"><span class="medio ${oculto ? "oculto" : ""}" style="${rojo ? "color:var(--accent)" : ""}">${oculto ? "••••••" : pesos(Math.abs(b.quedaHoy))}</span></a>
    <div class="barra"><i style="width:${oculto ? 0 : Math.round(uso * 100)}%;${rojo ? "background:var(--accent)" : ""}"></i></div>
    <span class="sub">Diario ${$(b.diario)} · gastaste ${$(b.gastoHoy)} hoy · te quedan ${$(b.queda)} hasta el ${finTxt} (${b.p.restantes} ${b.p.restantes === 1 ? "día" : "días"})</span>
    ${b.ingreso.propuesta ? `<span class="sub" style="color:var(--accent)">Ingreso estimado: confirmalo en Finanzas.</span>` : ""}</div>`;
}

// Lo que no coincide entre lo que cargaste y los mails: de a una pregunta, con botones.
export function wPregunta() {
  const q = preguntas();
  if (!q.length) return "";
  const x = q[0], m = x.m, d = new Date(m.ts);
  const oculto = leer("plataOculta", false);
  return `<div class="w ancho pregunta"><div class="fila"><span class="k">¿Y esto?${q.length > 1 ? ` · 1 de ${q.length}` : ""}</span><span class="sub">${d.getDate()}/${d.getMonth() + 1}</span></div>
    <span class="tit">${oculto ? "••••" : pesos(m.monto || 0)} · ${esc(m.contra || m.tipo || "")}</span>
    <span class="sub">${esc(x.texto)}${m.medio ? " · " + esc(m.medio) : ""}</span>
    <div class="chips">${x.botones.map(([r, t]) => `<button class="chip" data-accion="presu-responder" data-id="${esc(x.id)}" data-r="${r}">${t}</button>`).join("")}</div></div>`;
}

// En Inicio, las preguntas de plata quedan en una línea que lleva a Finanzas, donde se contestan.
function avisoPreguntas() {
  const n = preguntas().length;
  if (!n) return "";
  return `<a class="aviso-plata" href="#/u/finanzas"><span class="pt"></span><span><b>${n} ${n === 1 ? "pregunta" : "preguntas"} de plata</b> para contestar en Finanzas</span><span class="fl">›</span></a>`;
}

function wPlata(datos, ctx) {
  const d = wDiario(datos, ctx);
  if (d) return d;
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

// River: tarjeta blanca con la banda roja. Toca y abre todo lo del club.
export function datosPartido(p, desde) {
  const f = new Date(p.fecha);
  const dias = Math.round((new Date(f.getFullYear(), f.getMonth(), f.getDate()) - new Date(desde.getFullYear(), desde.getMonth(), desde.getDate())) / 86400000);
  const dia = dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : DIAS[f.getDay()][0].toUpperCase() + DIAS[f.getDay()].slice(1) + " " + f.getDate() + "/" + (f.getMonth() + 1);
  const hora = p.hora === false ? "hora a confirmar" : String(f.getHours()).padStart(2, "0") + ":" + String(f.getMinutes()).padStart(2, "0");
  return { dias, dia, hora, titulo: (p.local ? "River recibe a " : "River visita a ") + p.rival };
}
export const resultadoTxt = (u) => (u.gf > u.gc ? "Ganó" : u.gf < u.gc ? "Perdió" : "Empató") + " " + u.gf + "-" + u.gc + (u.penales ? " (" + u.penales[0] + "-" + u.penales[1] + " pen.)" : "") + " vs " + u.rival;

// Nombres en criollo: ESPN los manda en inglés y largos.
export function torneoCorto(t) {
  const x = String(t || "");
  if (/liga profesional|\blpf\b|primera/i.test(x)) return "Liga Profesional";
  if (/copa argentina/i.test(x)) return "Copa Argentina";
  if (/libertadores/i.test(x)) return "Libertadores";
  if (/sudamericana/i.test(x)) return "Sudamericana";
  if (/trofeo de campeones|supercopa/i.test(x)) return x.replace(/^argentine\s+/i, "");
  return x.replace(/^argentine\s+/i, "");
}
export function estadioCorto(e) {
  const x = String(e || "");
  if (/bombonera|alberto j/i.test(x)) return "La Bombonera";
  if (/monumental|vespucio liberti/i.test(x)) return "El Monumental";
  const par = x.match(/\(([^)]+)\)/);
  return par ? par[1] : x;
}
// Cuenta regresiva apilada: días / horas / minutos (y segundos en la página de River).
export function regresiva(fecha, conSegundos) {
  let s = Math.max(0, Math.floor((new Date(fecha).getTime() - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const partes = [[d, "d"], [h, "h"], [m, "m"]].concat(conSegundos ? [[s, "s"]] : []).filter(([v], i) => i > 0 || v > 0);
  return `<span class="regre" data-hasta="${new Date(fecha).getTime()}" data-seg="${conSegundos ? 1 : 0}">${partes.map(([v, u]) => `<span><b>${String(v).padStart(u === "d" ? 1 : 2, "0")}</b><small>${u}</small></span>`).join("")}</span>`;
}

function wRiver(ctx) {
  const rv = leer("river");
  if (!rv || (!rv.proximo && !rv.ultimo)) return "";
  const p = rv.proximo, u = rv.ultimo;
  const d = p && datosPartido(p, ctx.fecha);
  const inicio = p ? new Date(p.fecha).getTime() : 0;
  const jugando = p && Date.now() >= inicio && Date.now() < inicio + 2 * 3600000;
  const banda = !p ? "" : jugando ? '<span class="banda-river"><span class="regre"><span><b>EN</b><small>juego</small></span></span></span>'
    : `<span class="banda-river">${regresiva(p.fecha, false)}</span>`;
  return `<a class="w ancho river ${p?.clasico ? "clasico" : ""}" href="#/river" aria-label="River: abrir todo lo del club">
    <span class="k">${p?.clasico ? "Superclásico" : "River"}${p?.torneo ? " · " + esc(torneoCorto(p.torneo)) : ""}</span>
    ${p ? `<span class="tit">${esc(d.titulo)}</span><span class="sub">${d.dia} · ${d.hora}${p.estadio ? " · " + esc(estadioCorto(p.estadio)) : ""}</span>` : '<span class="tit">Sin partido confirmado</span>'}
    ${u ? `<span class="sub">Último: ${esc(resultadoTxt(u))}</span>` : ""}${banda}</a>`;
}

// River en cuadradito: el próximo partido, la cuenta de días y horas, y la franja roja.
function wRiverMini(ctx) {
  const rv = leer("river");
  if (!rv || (!rv.proximo && !rv.ultimo)) return "";
  const p = rv.proximo, u = rv.ultimo;
  if (!p) return `<a class="w riv-mini" href="#/river"><span class="k">River</span><span class="vs">Último</span><span class="cuando2">${esc(resultadoTxt(u))}</span><span class="franja"></span></a>`;
  const d = datosPartido(p, ctx.fecha);
  const falta = new Date(p.fecha).getTime() - Date.now();
  const jugando = falta <= 0 && falta > -2 * 3600000;
  const dd = Math.max(0, Math.floor(falta / 86400000)), hh = Math.max(0, Math.floor(falta % 86400000 / 3600000));
  const cuenta = jugando ? "<b>En juego</b>" : dd ? `<b>${dd}</b>d <b>${String(hh).padStart(2, "0")}</b>h` : `<b>${hh}</b>h <b>${String(Math.max(0, Math.floor(falta % 3600000 / 60000))).padStart(2, "0")}</b>m`;
  return `<a class="w riv-mini ${p.clasico ? "clasico" : ""}" href="#/river" aria-label="River: abrir todo lo del club">
    <span class="k">${p.clasico ? "Superclásico" : esc(torneoCorto(p.torneo) || "River")}</span>
    <span class="vs">River vs ${esc(String(p.rival || "").replace(/ Juniors$| Club$/, ""))}</span>
    <span class="cuando2">${d.dia.replace(/^([A-Za-zÁÉÍÓÚáéíóú]{3})[a-záéíóú]+ /, "$1 ")} · ${d.hora}</span><span class="cuenta">${cuenta}</span><span class="franja"></span></a>`;
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
  return "actualizado " + hace + ' · <button class="link" data-accion="actualizar-todo">actualizar todo</button>';
}

// ---------- Pantalla ----------
export function renderInicio(datos, ctx, climaDatos, tema) {
  const f = ctx.fecha;
  const fechaTxt = `<span class="dia-largo">${DIAS[f.getDay()]}</span><span class="dia-corto">${DIAS[f.getDay()].slice(0, 3)}</span> ${f.getDate()} ${MESES[f.getMonth()].slice(0, 3)}`;
  const temaIcono = tema === "oscuro" ? ICONOS.sol : ICONOS.luna;
  const compacto = !!leer("inicioCompacto");
  const ahora = new Date();
  const seg = String(ahora.getSeconds()).padStart(2, "0");
  const saludo = `<div class="saludo"><h1>${elegirSaludo(datos, ctx, climaDatos)}</h1></div>`;
  // Lo que elegiste no ver en Ajustes › Diseño (Urgente siempre está).
  const oculto = new Set(leer("inicioOcultos", []));
  const ver = (k, html) => (oculto.has(k) ? "" : html);
  usarColores((u) => colorUniverso(datos, u, tema));
  const reloj = ctx.guino === "lab" ? hudSobre(anillo(datos, ctx, tema), ctx, datos, climaDatos, urgentesTodos(datos, ctx).length) : anillo(datos, ctx, tema);
  const river = ver("river", wRiverMini(ctx));
  const clima = ver("clima", wClima(climaDatos, ctx));
  const cuadros = clima && river ? clima + river : (clima || river).replace(/class="w (clima marco|riv-mini)/, 'class="w $1 ancho');
  return `
  ${ctx.modo === "river" ? '<div class="banda" aria-hidden="true"></div>' : ""}
  ${ctx.modo === "marvel" || ctx.guino === "arana" ? TELA : ""}
  <div class="inicio ${compacto ? "compacto" : ""} ${ctx.guino ? "guino-" + ctx.guino : ""}">
    ${decoracion(ctx.guino)}
    <div class="col-a">
      <div class="top"><span class="fecha-hora">${fechaTxt} <span class="hora">· <span id="hora-top">${hhmm(ctx.min)}</span><span class="seg" id="seg-top">:${seg}</span></span>${ctx.demo ? ' <a class="ejemplo" href="#/ajustes" style="text-decoration:none">Prueba</a>' : ""}</span>
        <span class="der">
          <button class="icon-btn" data-accion="buscar" aria-label="Buscar o escribir un comando">${ICONOS.buscar}</button>
          <button class="icon-btn" data-accion="actualizar-todo" aria-label="Actualizar todo">${ICONOS.recargar}</button>
          <button class="icon-btn" data-accion="tema" aria-label="Pasar a modo ${tema === "oscuro" ? "claro" : "oscuro"}">${temaIcono}</button>
          <a class="icon-btn" href="#/ajustes" aria-label="Ajustes">${ICONOS.ajustes}</a></span></div>
      <div class="buscador flotante" role="search" hidden>
        <label class="campo"><span class="sr">Buscar o escribir un comando</span>${ICONOS.buscar}
          <input id="q" type="search" autocomplete="off" placeholder="Buscar, o «gasto 3500 súper»"></label>
        <div class="resultados" id="resultados" role="listbox"></div>
      </div>
      ${compacto ? `<div class="cab">${anillo(datos, ctx, tema)}${saludo}</div>` : `${saludo}${reloj}${ctx.guino === "tva" ? lineaTva(urgentesTodos(datos, ctx).length) : leyenda(datos, ctx, tema)}`}
    </div>
    <div class="col-b">
      ${tira(ctx, datos)}
      <div class="widgets">${wUrgente(datos, ctx)}${ver("chk", wChecklists())}${cuadros}${ver("plata", wPlata(datos, ctx))}</div>
      ${ver("preguntas", avisoPreguntas())}
      ${ver("semanal", wSemanal())}
      ${ver("transporte", wTransporte())}
      <p class="pie">${MARCA}<br>${pieAgenda(datos)} · <a href="#/novedades">novedades</a> · <a href="privacidad.html">privacidad</a></p>
    </div>
  </div>
  <button class="fab" data-accion="idea" aria-label="Anotar una idea o armar un checklist">${ICONOS.mas}</button>`;
}

// ---------- El Semanal ----------
// La tapa de la última edición: logo, titular, el dibujo de la semana y cuándo sale la próxima.
// Si Orbe todavía no pudo leer Drive, lo dice; nunca muestra un número que no vio.
export const logoSemanal = (nombre = "El Semanal", cls = "") => {
  const [a, ...b] = nombre.split(" ");
  return `<span class="sem-logo ${cls}"><span class="el">${esc(a)}</span> ${esc(b.join(" "))}</span>`;
};
const dm = (iso) => { const [, m, d] = iso.split("-"); return Number(d) + "/" + Number(m); };
export function wSemanal() {
  const e = ultimaEdicion();
  const fil = '<span class="filetes"></span>';
  if (!e) {
    const err = leer("semanalError") || "";
    const motivo = !permisosG().drive ? "Para verla acá, conectá Drive en Ajustes."
      : /api-apagada:drive/.test(err) ? "Para verla acá falta prender Drive en tu proyecto de Google (una sola vez)."
      : err === "sin-ediciones" ? "Todavía no encontré ediciones en tu Drive."
      : "Todavía no la busqué en tu Drive.";
    return `<a class="sem" href="#/semanal" aria-label="El Semanal">${fil}<span class="fila">${logoSemanal()}</span><span class="sem-nota">${esc(motivo)}</span></a>`;
  }
  const f = new Date(e.fecha + "T12:00:00");
  let pie;
  if (e.tipo === "semanal") {
    const desde = new Date(f); desde.setDate(f.getDate() - 6);
    const rango = desde.getMonth() === f.getMonth() ? `del ${desde.getDate()} al ${dm(e.fecha)}` : `del ${desde.getDate()}/${desde.getMonth() + 1} al ${dm(e.fecha)}`;
    pie = `<span>${e.numero ? "N.º " + esc(e.numero) + " · " : ""}${rango}</span>`;
  } else pie = `<span>${DIAS[f.getDay()].slice(0, 3)} ${dm(e.fecha)}</span>`;
  const p = proximaSemanal();
  pie += `<span>Próxima: ${DIAS[p.getDay()].slice(0, 3)} ${p.getDate()}/${p.getMonth() + 1}, 20:00</span>`;
  const dib = e.dibujo ? `<svg class="sem-dib" viewBox="${esc(e.dibujo.viewBox)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${e.dibujo.partes}</svg>` : "";
  return `<a class="sem" href="#/semanal" aria-label="${esc(e.nombre)}${e.numero ? " N.º " + esc(e.numero) : ""}: ${esc(e.titular)}">${fil}
    <span class="fila">${logoSemanal(e.nombre)}${esNueva(e) ? '<span class="nueva">Nueva</span>' : ""}</span>
    ${e.titular ? `<span class="tapa">${esc(e.titular)}</span>` : ""}${dib}<span class="sem-pie">${pie}</span></a>`;
}

// Después de pintar: animar el anillo y ubicar la banda de River en el centro del círculo.
export function despuesInicio(app, animar = true) {
  // El saludo nunca se corta: si un renglón no entra, se achica la letra hasta que entre.
  const h1 = app.querySelector(".saludo h1");
  if (h1) {
    h1.style.fontSize = "";
    const ancho = h1.clientWidth;
    const base = parseFloat(getComputedStyle(h1).fontSize);
    const mayor = Math.max(...[...h1.querySelectorAll(".ls")].map((l) => l.scrollWidth));
    if (mayor > ancho && ancho > 0) h1.style.fontSize = Math.max(h1.closest(".compacto") ? 15 : 20, Math.floor(base * ancho / mayor * 0.98)) + "px";
  }
  const segs = app.querySelectorAll(".anillo .seg");
  const dibujar = () => segs.forEach((s) => s.setAttribute("stroke-dasharray", s.dataset.largo + " " + (s.dataset.circ || C)));
  if (animar) requestAnimationFrame(() => requestAnimationFrame(dibujar));
  else { segs.forEach((s) => { s.style.transition = "none"; }); dibujar(); }
  const banda = app.querySelector(".banda");
  const an = app.querySelector(".anillo");
  if (banda && an) {
    const ra = app.getBoundingClientRect(), rn = an.getBoundingClientRect();
    banda.style.top = (rn.top - ra.top + rn.height / 2 - 23) + "px";
    banda.style.left = (rn.left - ra.left + rn.width / 2 - banda.offsetWidth / 2) + "px";
  }
}
