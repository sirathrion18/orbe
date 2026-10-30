// Guiños grandes (solo con el nivel «Todos»; por defecto Orbe usa los huevitos de huevos.js): tres veces por día (uno a la mañana, uno a la tarde
// y uno a la noche, en un momento al azar), Inicio se viste un rato: 20 minutos desde que lo ves.
// Dos de los tres son «clásicos» (Laboratorio, Decreto, TVA) y uno es el «especial» del día, que rota en un
// ciclo de 7 (Arácnido, Millo, Ninja, Venom, Diez, Cazador, Maldición): ninguno se repite en una semana.
// Venom siempre cae a la noche. Tocando tres veces el saludo sale uno al toque.
// Además hay guiños de fecha (todo el día): Diego y Messi (30/10, 22/6, 18/12, 24/6), Madrid (9/12) y la
// previa del día de River (desde 5 horas antes del partido).
// Son guiños con formas, colores y frases propias: ningún personaje dibujado, ningún logo, ninguna cita.
import { leer, guardar, sesion } from "./almacen.js";

const CLASICOS = [["lab", "Laboratorio"], ["decreto", "Decreto"], ["tva", "TVA"]];
const ESPECIALES = [["arana", "Arácnido"], ["millo", "Millo"], ["ninja", "Ninja"], ["venom", "Venom"], ["diez", "Diez"], ["cazador", "Cazador"], ["maldicion", "Maldición"]];
export const GUINOS = [...ESPECIALES.slice(0, 1), ...CLASICOS, ...ESPECIALES.slice(1)];
// Los de fecha, para probarlos desde Ajustes (se fuerzan con «f:<id>»).
export const GUINOS_FECHA = [["diego", "30/10"], ["gol", "22/6"], ["tercera", "18/12"], ["messi", "24/6"], ["madrid", "9/12"], ["previa", "Previa"]];
const DURA = 20 * 60000;
const FRANJAS = [[9, 13, "a la mañana"], [13, 18, "a la tarde"], [18, 23, "a la noche"]];
// Cuántos guiños: «huevitos» (por defecto: detalles chiquitos y escondidos, ver huevos.js), «todos» (además
// los grandes de antes: tres por día, fechas con tarjeta, decoraciones) o «ninguno».
// El viejo interruptor apagado equivale a «ninguno»; los niveles viejos («pocos», «semana») pasan a huevitos.
export const NIVELES = [["huevitos", "Huevitos", "Detalles chiquitos y escondidos: una copita, una estrellita, una palabra. Aparecen en su momento y se van."], ["todos", "Todos", "Los huevitos y además los guiños grandes: tres por día, tarjetas de fecha y decoraciones."], ["ninguno", "Ninguno", "Orbe sobrio todo el tiempo."]];
export const nivelGuinos = () => leer("guinos", true) === false ? "ninguno" : (NIVELES.some(([k]) => k === leer("guinosNivel")) ? leer("guinosNivel") : "huevitos");
export const guinosPrendidos = () => nivelGuinos() !== "ninguno";
const escH = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
// Número de día local (el mismo en el celu y en la compu): el especial rota de a uno por día, ciclo de 7.
const nroDia = (f) => Math.floor(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) / 86400000);
export const especialDelDia = (f) => ESPECIALES[((nroDia(f) % 7) + 7) % 7][0];

// El plan del día sale de la fecha: los mismos momentos en el celu y en la compu.
function plan(f) {
  const dia = f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate();
  let p = leer("guinoPlan");
  if (!p || p.dia !== dia || p.v !== 3) {
    const r = azar(f.getFullYear() * 10007 + (f.getMonth() + 1) * 389 + f.getDate() * 31);
    const esp = especialDelDia(f);
    const franjaEsp = esp === "venom" ? 2 : Math.floor(r() * 3);
    const clasicos = CLASICOS.map(([k]) => k).sort(() => r() - .5);
    let c = 0;
    const momentos = FRANJAS.map(([a, b], i) => ({ min: Math.floor(a * 60 + r() * (b - a) * 60), tipo: i === franjaEsp ? esp : clasicos[c++], visto: 0 }));
    p = { v: 3, dia, momentos };
    guardar("guinoPlan", p, true);
  }
  return p;
}

// Cuántos te tocan hoy y cuántos quedan (sin decir cuál), para Ajustes.
export function resumenGuinos(f) {
  const p = plan(f);
  const min = f.getHours() * 60 + f.getMinutes();
  const quedan = p.momentos.filter((m) => m.min > min).map((m) => FRANJAS.find(([a, b]) => m.min >= a * 60 && m.min < b * 60)?.[2]).filter(Boolean);
  return quedan.length ? `Hoy te quedan ${quedan.length}: ${quedan.join(", ")}.` : "Por hoy ya pasaron los tres. Mañana hay más.";
}

// Uno al toque (tres toques en el saludo): dura 20 minutos o hasta cerrar Orbe. Venom solo de noche.
export function guinoYa(f = new Date()) {
  const actual = sesion("guinoYa")?.tipo;
  const noche = f.getHours() >= 18 || f.getHours() < 5;
  const opciones = GUINOS.map(([k]) => k).filter((k) => k !== actual && (k !== "venom" || noche));
  const tipo = opciones[Math.floor(Math.random() * opciones.length)];
  sesion("guinoYa", { tipo, hasta: Date.now() + DURA });
  sesion("gotaEscondida", null);
  return tipo;
}

// El guiño de ahora (o null). Se cuenta desde la primera vez que ves Inicio (con la pantalla prendida)
// después del momento sorteado, así no se pierde si justo no estabas mirando.
export function guinoActivo(f, demo) {
  if (demo) return String(demo).startsWith("f:") ? null : demo;
  if (nivelGuinos() !== "todos") return null; // los grandes, solo para quien los elige
  const ya = sesion("guinoYa");
  if (ya && Date.now() < ya.hasta) return ya.tipo;
  const p = plan(f);
  const momentos = p.momentos;
  const min = f.getHours() * 60 + f.getMinutes(), ahora = f.getTime();
  const visible = typeof document === "undefined" || document.visibilityState !== "hidden";
  for (const m of momentos) {
    if (m.min > min) continue;
    if (!m.visto) {
      if (!visible) return null; // con Orbe en segundo plano no se gasta
      m.visto = ahora; guardar("guinoPlan", p, true); return m.tipo;
    }
    if (ahora - m.visto < DURA) return m.tipo;
  }
  return null;
}

// ---------- Guiños de fecha (todo el día) ----------
// Cada uno: día y mes, clase de Inicio y el texto (los años se calculan, nunca fijos).
const FECHAS = {
  diego: { d: 30, m: 10, clase: "fg-diez", k: "30 de octubre", t: (y) => `El Diez cumpliría ${y - 1960}.`,
    x: "Hoy el anillo lleva un 10 de luz. Por el que nos enseñó a soñar con una pelota." },
  gol: { d: 22, m: 6, clase: "fg-diez", k: "22 de junio", t: (y) => `${y - 1986} años del gol.`,
    x: "Una tarde en México, media cancha y un país entero corriendo detrás. El 10 se prende." },
  tercera: { d: 18, m: 12, clase: "fg-diez", k: "18 de diciembre", t: (y) => `${y - 2022} ${y - 2022 === 1 ? "año" : "años"} de la tercera.`,
    x: "Hay noches que no terminan nunca. El 10 queda prendido todo el día." },
  messi: { d: 24, m: 6, clase: "fg-diez", k: "24 de junio", t: (y) => `El otro 10 cumple ${y - 1987}.`,
    x: "Rosario, una zurda y la paciencia de esperar la que faltaba." },
  madrid: { d: 9, m: 12, clase: "fg-madrid", k: "9 de diciembre", t: (y) => `${y - 2018} años de Madrid.`,
    x: "La final más larga terminó lejos de casa, con la banda roja bien arriba. Hay fechas que no se discuten." }
};
const FRASES_PREVIA = ["Camiseta lista, agenda despejada.", "Hoy todo lo demás es previa.", "Cábala en su lugar. Lo demás, a un costado.",
  "Mate, radio y paciencia hasta que ruede.", "Llegá temprano a todo lo que importa. Y esto importa."];

// La previa: el día de partido, desde 5 horas antes hasta que empieza.
function previa(f, ctx, forzar) {
  let inicio = null, rival = "";
  if (forzar) inicio = f.getTime() + (2 * 60 + 10) * 60000;
  else {
    const p = leer("river")?.proximo;
    const mismoDia = (d) => d.getFullYear() === f.getFullYear() && d.getMonth() === f.getMonth() && d.getDate() === f.getDate();
    if (p?.fecha && mismoDia(new Date(p.fecha))) { inicio = new Date(p.fecha).getTime(); rival = String(p.rival || "").replace(/ Juniors$| Club$/, ""); }
    else if (ctx?.partido) { const d = new Date(f); d.setHours(0, 0, 0, 0); inicio = d.getTime() + ctx.partido.ini * 60000; }
  }
  if (!inicio) return null;
  const falta = inicio - f.getTime();
  if (falta <= 0 || falta > 5 * 3600000) return null;
  const h = Math.floor(falta / 3600000), m = Math.floor(falta % 3600000 / 60000);
  const hora = new Date(inicio);
  const hh = String(hora.getHours()).padStart(2, "0") + ":" + String(hora.getMinutes()).padStart(2, "0");
  const frase = FRASES_PREVIA[(f.getDate() + f.getHours()) % FRASES_PREVIA.length];
  return { id: "previa", clase: "fg-previa", deco: '<div class="banda banda-guino" aria-hidden="true"></div>',
    tarjeta: `<a class="w ancho fecha-guino previa" href="#/river" aria-label="Previa de River: abrir todo lo del club"><span class="fk">Previa · River${rival ? " vs " + escH(rival) : ""} a las ${hh}</span><span class="ft">Faltan ${h ? h + " h " : ""}${m} min.</span><span class="fx">${frase}</span><span class="franja" aria-hidden="true"></span></a>` };
}

// El guiño de fecha de hoy (o null). La previa le gana a la fecha si coinciden.
export function fechaGuino(f, ctx, demo) {
  const forzado = demo && String(demo).startsWith("f:") ? String(demo).slice(2) : null;
  if (!forzado && nivelGuinos() !== "todos") return null;
  const pv = previa(f, ctx, forzado === "previa");
  if (pv) return pv;
  const id = forzado || Object.keys(FECHAS).find((k) => FECHAS[k].d === f.getDate() && FECHAS[k].m === f.getMonth() + 1);
  const g = FECHAS[id];
  if (!g) return null;
  return { id, clase: g.clase, deco: id === "madrid" ? '<div class="banda banda-guino" aria-hidden="true"></div>' : "",
    tarjeta: `<div class="w ancho fecha-guino ${id === "madrid" ? "madrid" : "diez"}"><span class="fk">${g.k}</span><span class="ft">${g.t(f.getFullYear())}</span><span class="fx">${g.x}</span></div>` };
}

// Las fechas de guiño de los próximos días (para los avisos): [{ fecha: "AAAA-MM-DD", id, titulo, texto }].
export function guinosProximos(desde = new Date(), dias = 7) {
  const out = [];
  for (let i = 0; i < dias; i++) {
    const f = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + i, 12);
    const id = Object.keys(FECHAS).find((k) => FECHAS[k].d === f.getDate() && FECHAS[k].m === f.getMonth() + 1);
    if (!id) continue;
    const g = FECHAS[id];
    out.push({ fecha: f.getFullYear() + "-" + String(f.getMonth() + 1).padStart(2, "0") + "-" + String(f.getDate()).padStart(2, "0"), id, titulo: g.t(f.getFullYear()), texto: g.x });
  }
  return out;
}

// La gota de Venom se esconde al tocarla (y no vuelve hasta el próximo guiño).
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const g = e.target.closest?.(".gota-venom");
    if (!g) return;
    g.classList.add("se-va");
    g.setAttribute("aria-hidden", "true");
    sesion("gotaEscondida", true);
  });
}

// ---------- Especiales: una línea propia en Inicio ----------
// Frases propias (nada textual de ninguna obra). Elige una por día y franja, así no cambia a cada repintada.
const FRASES = {
  arana: ["Barrio tranquilo. Por ahora.", "Un gran día empieza por una lista corta.", "Colgado de un hilo no: con todo atado."],
  millo: ["Banda roja puesta, cabeza fría.", "Se juega como se vive: de memoria y para adelante.", "Hoy se banca todo. Mañana, también."],
  ninja: ["Si hoy sale mal, mañana se entrena el doble.", "Dos de vos no alcanzan: arrancá por lo primero de la lista.", "Paso corto, paso rápido, sin ruido."],
  venom: ["Nosotros nos encargamos del resto.", "Hoy la agenda la llevamos entre los dos.", "Tranquilo: no estamos solos en esto."],
  diez: ["Hoy jugá de 10: que lo de al lado también brille.", "Pase corto, cabeza levantada.", "La pelota no se mancha. La agenda, tampoco."],
  cazador: ["Respirá hondo, cuatro tiempos. Lo pesado se corta de a una cosa.", "Concentración total un rato, y después, té.", "Un corte limpio vale más que diez a medias."],
  maldicion: ["Este rato es tuyo: lo que no es urgente queda afuera del círculo.", "Lo que pesa se exorciza tachándolo.", "Adentro del círculo mandás vos."]
};
const RUBRO = { arana: "Sentido arácnido", millo: "Millo", ninja: "Modo ninja", venom: "Nosotros", diez: "El 10", cazador: "Respiración", maldicion: "Dominio propio" };

const grandes = () => nivelGuinos() === "todos" || !!sesion("demoGuino");
export function lineaGuino(tipo, ctx) {
  if (!grandes()) return "";
  const lista = FRASES[tipo];
  if (!lista) return "";
  const f = ctx?.fecha || new Date();
  let texto = lista[(f.getDate() + Math.floor((ctx?.min ?? 0) / 240)) % lista.length];
  // Arácnido: el sentido avisa lo próximo de tu agenda, con su hora real.
  if (tipo === "arana") {
    const sigue = (ctx?.hoy || []).find((b) => b.ini > ctx.min);
    if (sigue) { const falta = sigue.ini - ctx.min; texto = `${sigue.titulo} en ${falta >= 60 ? Math.floor(falta / 60) + " h " + (falta % 60 ? (falta % 60) + " min" : "") : falta + " min"}. ${texto}`; }
  }
  return `<div class="w ancho guino-linea g-${tipo}">${tipo === "cazador" ? OLA : ""}<span class="fk">${RUBRO[tipo]}</span><span class="fx">${escH(texto)}</span></div>`;
}

// ---------- Dibujos (genéricos) ----------
const ARANA = `<svg viewBox="0 0 40 40" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
  <g fill="none"><path d="M16 17 8 11 4 14M15 20 6 19 3 23M16 23 8 27 6 32M17 25 12 31 12 36"/><path d="M24 17 32 11 36 14M25 20 34 19 37 23M24 23 32 27 34 32M23 25 28 31 28 36"/></g>
  <ellipse cx="20" cy="23" rx="5.2" ry="6.4" stroke="none"/><circle cx="20" cy="14.6" r="3.4" stroke="none"/></svg>`;

const HUD = `<svg class="hud" viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="currentColor">
  <circle cx="100" cy="100" r="97" stroke-width=".6" stroke-dasharray="2 4" opacity=".7"/>
  <g class="hud-giro"><path d="M100 6a94 94 0 0 1 81 47" stroke-width="2.2"/><path d="M19 147a94 94 0 0 1-6-73" stroke-width="2.2"/><path d="M146 182a94 94 0 0 1-34 11" stroke-width="2.2"/></g>
  <g class="hud-giro2"><circle cx="100" cy="100" r="88" stroke-width=".8" stroke-dasharray="18 10 4 10" opacity=".8"/></g>
  <g stroke-width="1"><path d="M100 0v7M100 193v7M0 100h7M193 100h7"/></g>
  <line class="hud-barrido" x1="100" y1="100" x2="100" y2="8" stroke-width="1.4"/>
  <g fill="currentColor" stroke="none" font-size="6" font-family="ui-monospace,monospace" letter-spacing=".5"><text x="128" y="20">SYS 100%</text><text x="18" y="186">ORBE·HUD</text></g></svg>`;

const TELA2 = `<svg class="tela tela-izq" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
<path d="M0 0L120 0M0 0L110 70M0 0L50 120M0 0L0 120"/><path d="M30 0Q26 18 0 24"/><path d="M62 0Q56 30 24 44Q12 50 0 50"/><path d="M95 0Q88 45 50 66Q24 80 0 80"/></svg>`;

// Lo que se suma arriba de Inicio según el guiño.
// Venom: una gota negra que asoma desde el borde derecho (forma propia, sin cara).
const GOTA = `<svg viewBox="0 0 90 240" aria-hidden="true"><path d="M90 0v150c-6 16-18 22-23 10-5-12 5-21 1-35-3-12-17-11-19-26-2-16 14-21 12-39-2-16-18-15-20-31C39 15 52 5 64 0z"/>
  <circle cx="64" cy="176" r="5"/><circle cx="56" cy="198" r="3"/><path class="brillo" d="M70 30c-6 10-4 22 2 30" fill="none"/></svg>`;
// Ninja: una nube de humo que aparece y se disipa (sale una sola vez).
const HUMO = `<svg class="humo" viewBox="0 0 120 70" aria-hidden="true"><g fill="currentColor"><circle cx="30" cy="42" r="18"/><circle cx="55" cy="30" r="22"/><circle cx="82" cy="40" r="19"/><circle cx="62" cy="50" r="16"/><circle cx="98" cy="50" r="11"/><circle cx="16" cy="54" r="9"/></g></svg>`;
// Cazador: la ola de una respiración, que se dibuja una vez.
const OLA = `<svg class="ola" viewBox="0 0 240 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path pathLength="1" d="M2 18c18 0 18-12 36-12s18 18 36 18 18-18 36-18 18 18 36 18 18-12 36-12 18 10 36 10"/></svg>`;

export function decoracion(tipo) {
  if (!grandes()) return "";
  if (tipo === "arana") return `${TELA2}<button class="arana" data-accion="arana" aria-label="Una arañita. Tocala y sube."><span class="hilo"></span>${ARANA}</button>`;
  if (tipo === "venom") return '<div class="tinta-venom" aria-hidden="true"></div>'; // un borde de tinta que aparece y se va
  if (tipo === "ninja") return HUMO;
  if (tipo === "cazador") return '<div class="cuadros" aria-hidden="true"></div>';
  if (tipo === "millo") return '<div class="banda banda-guino" aria-hidden="true"></div>';
  return "";
}

// El reloj, en modo Laboratorio, con la pantalla de escaneo encima y una lectura del día abajo.
export function hudSobre(anilloHtml, ctx, datos, clima, urgentes) {
  const hoy = ctx.hoy || [];
  const enCurso = hoy.find((b) => b.ini <= ctx.min && ctx.min < b.fin);
  const sigue = hoy.find((b) => b.ini > ctx.min);
  const partes = [enCurso ? "en curso: " + enCurso.titulo : sigue ? "después: " + sigue.titulo : "agenda libre", urgentes ? urgentes + (urgentes === 1 ? " urgente" : " urgentes") : "nada urgente", clima ? Math.round(clima.temp) + "° afuera" : ""].filter(Boolean);
  return `<div class="hud-cont escanea">${anilloHtml}${HUD}</div>
    <button class="hud-lectura" data-accion="hud" aria-label="Volver a escanear el día"><span class="pt"></span><span class="txt">Escaneo · ${partes.map((x) => x.replace(/[<>&]/g, "")).join(" · ")}</span></button>`;
}

// Urgente como decreto real (o el reino en orden, si no hay nada).
export function decreto(lista, cuandoTexto, esc) {
  const sello = `<span class="sello" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="currentColor"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#0E1A12" stroke-width="1.2" opacity=".5"/><path d="M20 11l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z" fill="#0E1A12" opacity=".55"/></svg></span>`;
  if (!lista.length) return `<a class="w ancho decreto" href="#/urgente">${sello}<span class="dk">Decreto del día</span><span class="dt">El reino está en orden. Nada vence, nada arde.</span><span class="df">Firmado: el que manda</span></a>`;
  const [p, ...resto] = lista;
  return `<a class="w ancho decreto" href="#/urgente" aria-label="Abrir todo lo urgente">${sello}<span class="dk">Decreto real${lista.length > 1 ? " · " + lista.length : ""}</span>
    <span class="dt">Por orden del soberano: ${esc(p.titulo)}${p.monto ? ", " + esc(p.monto) : ""}. ${p.dias < 0 ? "Debió cumplirse: " + esc(cuandoTexto(p.dias)) : "Plazo: " + esc(cuandoTexto(p.dias))}.</span>
    <span class="df">${resto.length ? resto.length + (resto.length === 1 ? " decreto más ›" : " decretos más ›") : "Firmado: el que manda"}</span></a>`;
}

// TVA: debajo del reloj, la línea temporal con una rama por cada cosa vencida, y el sello de variante.
export function lineaTva(vencidos) {
  const ramas = Math.min(vencidos, 5);
  const xs = [28, 66, 104, 142, 180].slice(0, ramas);
  return `<div class="tva-bloque"><svg class="linea-tva" viewBox="0 0 220 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <path d="M4 26H216"/>${xs.map((x, i) => `<path d="M${x} 26c10 0 16-${10 + (i % 2) * 6} 30-${12 + (i % 2) * 6}" stroke-dasharray="2.5 3.5"/><circle cx="${x + 30}" cy="${14 - (i % 2) * 6}" r="2" fill="currentColor" stroke="none"/>`).join("")}
    <circle cx="110" cy="26" r="3.6" fill="currentColor" stroke="none"/></svg>
    <span class="tva-txt">Línea temporal sagrada · ${vencidos ? vencidos + (vencidos === 1 ? " rama" : " ramas") : "sin ramas"}</span>
    <span class="sello-tva">Variante detectada</span></div>`;
}
