// BNA › Hoy: tu libretita del día. Arranca precargada con tu mínimo y se tacha como con birome.
// Cada informe tachado suma una carga o un control a Productividad (así no sumás en dos lados).
// Solo tipos de informe y tus tareas: nada de clientes, compañeros ni el contenido de los informes.
import { leer, guardar } from "./almacen.js";
import { datosProd, cambiar, resumenDia, isoHoy } from "./productividad.js";
import { ICONOS } from "./iconos.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const CLAVE = "bnaDias";
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const f1 = (x) => (Math.round(x * 10) / 10).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// El mínimo, con los mismos nombres que tu archivo de productividad de informes.
const BASE = (companero, diaSemana) => [
  { t: "Descarga casuística APC / Tel / RRSS", modo: "carga" },
  { t: "Armado de casuística", modo: "carga" },
  { t: "Diario CAT", modo: companero ? "control" : "carga" },
  { t: "Diario Evoltis", modo: companero ? "control" : "carga" },
  { t: "Diario NS", modo: "carga" },
  // Siempre son varias: van con contador. Las escuchas son las de Calidad / Mystery (MS).
  { t: "Escucha de llamados (MS)", modo: "libre", contador: true, cuenta: 0, suma: "ms" },
  // Prueba de llamados: solo lunes y martes, que entrás a la mañana.
  ...(diaSemana === 1 || diaSemana === 2 ? [{ t: "Prueba de llamados", modo: "libre", contador: true, cuenta: 0, suma: "prueba" }] : [])
];
const MODOS = { carga: "Carga", control: "Control", libre: "Sin puntos" };

const todos = () => leer(CLAVE, {});
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function guardarDia(fecha, d) {
  const l = todos();
  l[fecha] = d;
  // Se guardan los últimos 400 días: el histórico de un año y pico.
  const fechas = Object.keys(l).sort();
  fechas.slice(0, Math.max(0, fechas.length - 400)).forEach((f) => delete l[f]);
  guardar(CLAVE, l);
}

// ¿Está tu compañero? Lo que pasó más seguido los últimos mismos días de la semana; si no hay historia, sí.
function deducirCompanero(fecha) {
  const dia = new Date(fecha + "T12:00").getDay();
  const prev = Object.entries(todos()).filter(([f, d]) => f < fecha && new Date(f + "T12:00").getDay() === dia && typeof d.companero === "boolean")
    .sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
  if (!prev.length) return { v: true, razon: "Supuse que sí: todavía no tengo días parecidos. Si no está, tocá «No»." };
  const si = prev.filter(([, d]) => d.companero).length;
  return { v: si * 2 >= prev.length, razon: `Lo supuse por los últimos ${DIAS[dia]}. Si no es así, tocá el otro.` };
}

// Lo que sumaste a mano 2 de los últimos 4 mismos días de la semana también se precarga (Orbe aprende).
function aprendidos(fecha) {
  const dia = new Date(fecha + "T12:00").getDay();
  const prev = Object.entries(todos()).filter(([f]) => f < fecha && new Date(f + "T12:00").getDay() === dia).sort(([a], [b]) => b.localeCompare(a)).slice(0, 4);
  const cuenta = {};
  prev.forEach(([, d]) => new Set((d.items || []).filter((i) => i.extra && i.t !== "Otros informes").map((i) => i.t + "|" + i.modo)).forEach((k) => { cuenta[k] = (cuenta[k] || 0) + 1; }));
  return Object.entries(cuenta).filter(([, n]) => n >= 2).map(([k]) => { const [t, modo] = k.split("|"); return { t, modo, extra: true }; });
}

export function diaDe(fecha = isoHoy()) {
  const d = todos()[fecha];
  if (d) return d;
  const ded = deducirCompanero(fecha);
  const companero = ded.v;
  const nuevo = { companero, deducido: true, razon: ded.razon, items: [...BASE(companero, new Date(fecha + "T12:00").getDay()), ...aprendidos(fecha)].map((x) => ({ id: nuevoId(), ...x, hecho: null })), nota: "" };
  // Se guarda al primer vistazo, así los renglones mantienen su identidad al tacharlos.
  guardarDia(fecha, nuevo);
  return nuevo;
}

// Tachar o destachar: suma o resta una carga o un control en Productividad.
const tareaDe = (modo) => (datosProd()?.tareas || []).find((t) => t.grupo === modo)?.tarea;
// Las escuchas suman a la tarea de tu planilla que hable de escuchas o pruebas de llamados (si hay una).
// Escuchas → la tarea de Calidad / Mystery (MS); prueba de llamados → «Prueba de llamados». Salen de tu planilla de pesos.
function tareaContador(it) {
  const ts = datosProd()?.tareas || [];
  if (it.suma === "prueba" || /prueba de llamad/i.test(it.t)) return ts.find((t) => /prueba de llamad/i.test(t.tarea))?.tarea;
  return ts.find((t) => /mystery|calidad/i.test(t.tarea))?.tarea || ts.find((t) => t.grupo === "ms")?.tarea;
}
export function contar(fecha, id, delta, alTerminar) {
  const d = diaDe(fecha);
  const it = d.items.find((i) => i.id === id);
  if (!it || !it.contador) return null;
  const antes = it.cuenta || 0;
  it.cuenta = Math.max(0, antes + delta);
  if (it.cuenta === 0) it.hecho = null;
  const tarea = tareaContador(it);
  if (tarea && it.cuenta !== antes) cambiar(fecha, tarea, it.cuenta - antes, alTerminar);
  guardarDia(fecha, d);
  return it;
}
export function tachar(fecha, id, alTerminar) {
  const d = diaDe(fecha);
  const it = d.items.find((i) => i.id === id);
  if (!it) return null;
  if (it.contador) {
    // Con contador: tachar sin haber contado ninguna cuenta como una.
    if (!it.hecho && !(it.cuenta > 0)) { guardarDia(fecha, d); contar(fecha, id, 1, alTerminar); const d2 = diaDe(fecha); const i2 = d2.items.find((x) => x.id === id); i2.hecho = Date.now(); guardarDia(fecha, d2); return i2; }
    it.hecho = it.hecho ? null : Date.now();
    guardarDia(fecha, d);
    return it;
  }
  it.hecho = it.hecho ? null : Date.now();
  const tarea = it.modo !== "libre" && tareaDe(it.modo);
  if (tarea) cambiar(fecha, tarea, it.hecho ? 1 : -1, alTerminar);
  guardarDia(fecha, d);
  return it;
}

// Cambiar si está el compañero: rearma lo que todavía no tachaste (lo tachado y lo que sumaste a mano quedan).
export function fijarCompanero(fecha, valor) {
  const d = diaDe(fecha);
  d.companero = valor; d.deducido = false;
  const base = BASE(valor, new Date(fecha + "T12:00").getDay());
  d.items = d.items.map((i) => {
    if (i.hecho || i.extra) return i;
    const b = base.find((x) => x.t === i.t);
    return b ? { ...i, modo: b.modo } : i;
  });
  guardarDia(fecha, d);
}
export function sumarItem(fecha, t, modo) {
  const d = diaDe(fecha);
  const txt = String(t || "").trim();
  if (!txt) return;
  d.items.push({ id: nuevoId(), t: txt, modo: MODOS[modo] ? modo : "libre", hecho: null, extra: true });
  guardarDia(fecha, d);
}
export function sacarItem(fecha, id) {
  const d = diaDe(fecha);
  d.items = d.items.filter((i) => i.id !== id || i.hecho);
  guardarDia(fecha, d);
}
export function guardarNota(fecha, nota) {
  const d = diaDe(fecha);
  d.nota = String(nota || "").slice(0, 500);
  guardarDia(fecha, d);
}
export const pendientesHoy = (fecha = isoHoy()) => diaDe(fecha).items.filter((i) => !i.hecho);

// ---------- Pantalla ----------
function renglon(fecha, it) {
  return `<li class="lb ${it.hecho ? "tachado" : ""}">
    <button class="lb-item" data-accion="hoy-tachar" data-f="${fecha}" data-id="${esc(it.id)}" aria-pressed="${!!it.hecho}" aria-label="${it.hecho ? "Destachar" : "Tachar"}: ${esc(it.t)}">
      <span class="lb-txt">${esc(it.t)}<svg class="birome" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 7c18-3 34 2 52-1s32-3 50 0 34 2 50-1 28-1 44 1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span>
      ${it.contador ? `<span class="lb-modo m-control">${it.suma === "prueba" || /prueba/i.test(it.t) ? "Prueba" : "MS"}</span>` : `<span class="lb-modo m-${it.modo}">${it.modo === "libre" ? "" : MODOS[it.modo]}</span>`}</button>
    ${it.contador ? `<span class="lb-cont"><button data-accion="hoy-contar" data-f="${fecha}" data-id="${esc(it.id)}" data-d="-1" aria-label="Una menos">−</button><b aria-live="polite">${it.cuenta || 0}</b><button data-accion="hoy-contar" data-f="${fecha}" data-id="${esc(it.id)}" data-d="1" aria-label="Una más">+</button></span>` : ""}
    ${it.hecho || it.contador ? "" : `<button class="lb-sacar" data-accion="hoy-sacar" data-f="${fecha}" data-id="${esc(it.id)}" aria-label="Sacar ${esc(it.t)}">${ICONOS.cruz}</button>`}</li>`;
}

export function bloqueHoy(ctx) {
  const fecha = isoHoy(ctx.fecha);
  const d = diaDe(fecha);
  const r = resumenDia(fecha);
  const hechos = d.items.filter((i) => i.hecho).length;
  const meta = r.meta?.meta;
  const pts = `<a class="lb-pts" href="#/d/productividad" aria-label="Tu productividad mes a mes"><b>${f1(r.total)}</b>${meta ? " de " + f1(meta) : ""} pts <span aria-hidden="true">›</span></a>`;
  // Lo pendiente arriba, lo tachado abajo: como la hoja de la libretita a media mañana.
  const items = [...d.items.filter((i) => !i.hecho), ...d.items.filter((i) => i.hecho)];
  return `<section class="bloque libreta">
      <div class="lb-cab"><h2>${DIAS[ctx.fecha.getDay()]} ${ctx.fecha.getDate()}/${ctx.fecha.getMonth() + 1}</h2>${pts}</div>
      <div class="lb-comp"><span>¿Está tu compañero a la mañana?</span>
        <div class="chips">${[[true, "Sí"], [false, "No"]].map(([v, n]) => `<button class="chip ${d.companero === v ? "on" : ""}" data-accion="hoy-comp" data-f="${fecha}" data-v="${v ? 1 : 0}">${n}</button>`).join("")}</div>
        ${d.deducido ? `<small>${esc(d.razon || "Lo supuse por los mismos días de antes.")}</small>` : ""}</div>
      <ul class="lb-lista">${items.map((i) => renglon(fecha, i)).join("")}</ul>
      <p class="lb-cuenta">${hechos} de ${d.items.length} tachadas · cada informe tachado suma a Productividad</p>
      <div class="chips lb-rapidos"><button class="chip" data-accion="hoy-otros" data-f="${fecha}" data-modo="control">+ Otros informes (control)</button><button class="chip" data-accion="hoy-otros" data-f="${fecha}" data-modo="carga">+ Otros informes (carga)</button></div>
      <form class="form lb-sumar" data-form="hoy-sumar" data-f="${fecha}"><input name="t" placeholder="Otra tarea (una reunión, el tablero…)" aria-label="Sumar una tarea" autocomplete="off" required>
        <select name="modo" aria-label="Cómo cuenta"><option value="libre">Sin puntos</option><option value="carga">Carga</option><option value="control">Control</option></select><button class="btn sec">Sumar</button></form>
    </section>
    <section class="bloque"><h2>Nota del día</h2>
      <textarea class="campo-texto lb-nota" data-f="${fecha}" placeholder="Un hito, algo para acordarte («hoy presentamos el tablero»)">${esc(d.nota || "")}</textarea>
      <p class="fuente-dato">Se guarda sola. Sin datos de clientes ni de compañeros.</p></section>
    ${historialHtml(fecha)}`;
}

function historialHtml(hoy) {
  const dias = Object.entries(todos()).filter(([f]) => f < hoy).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30);
  if (!dias.length) return '<section class="bloque"><h2>Histórico</h2><p class="vacio">Acá van a quedar tus días: lo que tachaste y tus notas. Las fotos de la libretita se suman después.</p></section>';
  return `<section class="bloque"><h2>Histórico</h2><div class="lb-hist">${dias.map(([f, d]) => {
    const fx = new Date(f + "T12:00");
    const h = (d.items || []).filter((i) => i.hecho).length;
    return `<details class="lb-dia ${d.nota ? "con-nota" : ""}"><summary><span class="lb-f">${DIAS[fx.getDay()].slice(0, 3)} ${fx.getDate()}/${fx.getMonth() + 1}</span>
      <span class="lb-r">${h} de ${(d.items || []).length}${d.companero === false ? " · sin compañero" : ""}</span>${d.nota ? `<span class="lb-hito">${esc(d.nota)}</span>` : ""}</summary>
      <ul class="lb-lista chica">${(d.items || []).map((i) => `<li class="lb ${i.hecho ? "tachado" : "quedo"}"><span class="lb-txt">${esc(i.t)}${i.contador ? " × " + (i.cuenta || 0) : ""}${i.hecho ? '<svg class="birome" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 7c18-3 34 2 52-1s32-3 50 0 34 2 50-1 28-1 44 1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' : ""}</span><span class="lb-modo m-${i.modo}">${i.modo === "libre" ? "" : MODOS[i.modo]}</span></li>`).join("")}</ul></details>`;
  }).join("")}</div></section>`;
}

// Inicio, los días de BNA: una franja con lo que falta tachar.
export function wBnaHoy(ctx) {
  // Es un anotador del trabajo: aparece solo mientras estás en horario del BNA, un día hábil.
  const enHorario = (ctx.hoy || []).some((b) => b.tipo === "bna" && b.ini <= ctx.min && ctx.min < b.fin);
  if (!enHorario || ctx.feriado || ctx.diaLibre) return "";
  const fecha = isoHoy(ctx.fecha);
  const d = diaDe(fecha);
  const faltan = d.items.filter((i) => !i.hecho);
  if (!faltan.length) return `<a class="w ancho lb-ini listo" href="#/u/bna" data-accion="bna-hoy-ir"><span class="k">BNA · Hoy</span><span class="tit">Todo tachado. ${d.items.length} de ${d.items.length}.</span></a>`;
  return `<a class="w ancho lb-ini" href="#/u/bna" data-accion="bna-hoy-ir"><span class="fila"><span class="k">BNA · te ${faltan.length === 1 ? "falta" : "faltan"} ${faltan.length}</span><span class="lb-mini">${d.items.length - faltan.length}/${d.items.length}</span></span>
    <span class="lb-falta">${faltan.slice(0, 3).map((i) => esc(i.t)).join(" · ")}${faltan.length > 3 ? " · …" : ""}</span></a>`;
}
