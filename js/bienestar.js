// Bienestar: rutina de gym, registro de cada entrenamiento, pasos y el sistema de logros
// (XP, niveles, poderes e insignias por temporadas de 3 meses).
// Todo lo que se anota vive en este dispositivo y en tu planilla; nada de eso está en el repo.
import { leer, guardar } from "./almacen.js";
import { datosListas } from "./listas.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
export const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const desdeIso = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
const lunesIso = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); };
const sumarDias = (s, n) => { const d = desdeIso(s); d.setDate(d.getDate() + n); return iso(d); };
const miles = (n) => Math.round(n).toLocaleString("es-AR");

// ---------- La rutina ----------
// Cuerpo completo, un día por semana, para arrancar. "peso": se anota el peso usado.
export const RUTINA = [
  { bloque: "Entrada en calor", min: "10 min", items: [
    { id: "calor", nombre: "Bici o cinta suave", dosis: "5 min", claves: ["Que puedas hablar mientras lo hacés."] },
    { id: "gato", nombre: "Gato-camello", dosis: "8 veces", claves: ["Lento, acompañando con la respiración."] },
    { id: "rotacion", nombre: "Rotación de la espalda alta en cuatro patas", dosis: "6 por lado", claves: ["La cadera quieta; gira solo el pecho."] },
    { id: "papada", nombre: "Mentón hacia atrás", dosis: "10 veces", claves: ["Como haciendo papada, sin bajar la cabeza."] },
  ] },
  { bloque: "Fuerza", min: "2 series de 10 a 12 · descanso 90 s", items: [
    { id: "sentadilla", nombre: "Sentadilla con mancuerna al pecho, al cajón", dosis: "2 × 10–12", peso: true, claves: ["Pecho arriba, la mancuerna pegada.", "Bajá en 2, rozá el cajón y subí en 1."] },
    { id: "remo", nombre: "Remo sentado en polea", dosis: "2 × 10–12", peso: true, claves: ["Hombros lejos de las orejas.", "Llevá los codos hacia atrás, no los hombros."] },
    { id: "puente", nombre: "Puente de glúteo con la espalda en un banco", dosis: "2 × 10–12", peso: true, claves: ["Empujá con los talones.", "Arriba, apretá la cola dos segundos."] },
    { id: "press", nombre: "Press de pecho en máquina, agarre neutro", dosis: "2 × 10–12", peso: true, claves: ["Palmas enfrentadas.", "Rango cómodo: no hace falta llegar al fondo."] },
    { id: "jalon", nombre: "Jalón al pecho, agarre neutro", dosis: "2 × 10–12", peso: true, claves: ["Siempre por delante, nunca por detrás de la nuca.", "Bajá hasta el pecho sin tirar el cuerpo atrás."] },
    { id: "facepull", nombre: "Face pull con soga en polea alta", dosis: "2 × 12–15", peso: true, claves: ["Tirá hacia la frente abriendo la soga.", "Liviano: es de postura, no de fuerza."] },
    { id: "estocada", nombre: "Estocada hacia atrás, agarrado de algo", dosis: "2 × 8 por pierna", peso: true, claves: ["La rodilla de adelante sobre el pie.", "Bajá derecho, como un ascensor."] },
  ] },
  { bloque: "Para el fútbol", min: "", items: [
    { id: "talones", nombre: "Elevación de talones", dosis: "2 × 15", claves: ["Subí rápido, bajá lento."] },
    { id: "aductores", nombre: "Aductores de costado, rodilla apoyada", dosis: "2 × 20 s por lado", claves: ["Cuerpo en línea recta, sin hundir la cadera."] },
  ] },
  { bloque: "Zona media", min: "", items: [
    { id: "deadbug", nombre: "Dead bug", dosis: "2 × 8 por lado", claves: ["La espalda baja pegada al piso todo el tiempo."] },
    { id: "birddog", nombre: "Bird dog", dosis: "2 × 8 por lado", claves: ["Brazo y pierna contrarios, sin girar la cadera."] },
    { id: "plancha", nombre: "Plancha", dosis: "3 × 20–30 s", claves: ["Apretá la cola y la panza; respirá."] },
  ] },
  { bloque: "Cierre", min: "5 a 10 min", items: [
    { id: "estirar", nombre: "Estirar cadera, pecho y cuello suave", dosis: "5 min", claves: ["Sin rebotes: 20 a 30 s cada uno."] },
    { id: "respirar", nombre: "Respiración lenta", dosis: "2 min", claves: ["Inhalá en 4, exhalá en 6."] },
  ] },
];
const TODOS = RUTINA.flatMap((b) => b.items);
const CUENTAN = TODOS.filter((x) => !["calor", "gato", "rotacion", "papada", "estirar", "respirar"].includes(x.id));

// ---------- Datos ----------
export const sesiones = () => leer("gymSesiones", []);
const meditaciones = () => leer("meditaciones", []);
const pasosMapa = () => leer("pasos", {}); // { "2026-10-29": 6840 } — lo llena Satélite.
const pausas = () => leer("bienPausas", []); // lunes de las semanas en pausa por dolor o enfermedad.

export function registrarMeditacion(min) {
  const l = meditaciones();
  l.push({ fecha: iso(new Date()), min });
  guardar("meditaciones", l.slice(-400));
}

export function pausarSemana(fecha) {
  const l = pausas(), k = lunesIso(fecha);
  if (l.includes(k)) guardar("bienPausas", l.filter((x) => x !== k));
  else guardar("bienPausas", [...l, k]);
}
export const semanaEnPausa = (fecha) => pausas().includes(lunesIso(fecha));

// Pasos: el promedio de los últimos 28 días con dato, sin contar hoy.
export function pasos(fecha) {
  const m = pasosMapa(), hoy = iso(fecha);
  const prev = Object.keys(m).filter((k) => k < hoy && k >= sumarDias(hoy, -28)).map((k) => m[k]).filter((n) => n > 0);
  const prom = prev.length ? prev.reduce((s, n) => s + n, 0) / prev.length : null;
  return { hoy: m[hoy] ?? null, prom, hay: Object.keys(m).length > 0 };
}

// ---------- Temporadas ----------
// La 1 arranca el lunes 26/10/2026 y termina el 31/1/2027; después, de a tres meses.
export function temporada(fecha) {
  const f = iso(fecha);
  if (f <= "2027-01-31") return { n: 1, desde: "2026-10-26", hasta: "2027-01-31" };
  let n = 2, a = 2027, m = 1; // febrero 2027
  for (;;) {
    const desde = iso(new Date(a, m, 1)), hasta = iso(new Date(a, m + 3, 0));
    if (f <= hasta) return { n, desde, hasta };
    n++; m += 3; if (m > 11) { m -= 12; a++; }
  }
}

// ---------- XP ----------
// Premia la constancia, no el exceso: topes por día y por semana.
export const XP = { gym: 100, ejercicio: 10, futbol: 60, pasos: 20, medita: 15, redonda: 50 };
export const POR_NIVEL = 400;

export function eventos(fecha) {
  const t = temporada(fecha), hoy = iso(fecha);
  const dentro = (f) => f >= t.desde && f <= t.hasta && f <= hoy;
  const ev = [];
  const gymSem = {};
  sesiones().filter((s) => dentro(s.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach((s) => {
    const k = lunesIso(desdeIso(s.fecha));
    if ((gymSem[k] = (gymSem[k] || 0) + 1) > 2) return; // como mucho 2 por semana
    const hechos = Object.values(s.ej || {}).filter((e) => e.hecho).length;
    ev.push({ fecha: s.fecha, tipo: "gym", xp: XP.gym + XP.ejercicio * hechos, txt: "Gym · " + hechos + " ejercicios" });
  });
  const dias = new Set();
  (datosListas()?.futbol || []).filter((p) => dentro(p.fecha)).forEach((p) => {
    if (dias.has("f" + p.fecha)) return; dias.add("f" + p.fecha);
    ev.push({ fecha: p.fecha, tipo: "futbol", xp: XP.futbol, txt: "Fútbol" });
  });
  meditaciones().filter((m) => dentro(m.fecha)).forEach((m) => {
    if (dias.has("m" + m.fecha)) return; dias.add("m" + m.fecha);
    ev.push({ fecha: m.fecha, tipo: "medita", xp: XP.medita, txt: "Meditación" });
  });
  const pm = pasosMapa();
  Object.keys(pm).filter(dentro).forEach((f) => {
    const p = pasos(desdeIso(f));
    if (p.prom && pm[f] > p.prom) ev.push({ fecha: f, tipo: "pasos", xp: XP.pasos, txt: "Pasos sobre tu promedio" });
  });
  // Semana redonda: gym + fútbol (+ 3 días sobre el promedio, si hay datos de pasos esa semana).
  const sem = {};
  ev.forEach((e) => { const k = lunesIso(desdeIso(e.fecha)); (sem[k] = sem[k] || { gym: 0, futbol: 0, pasos: 0, conPasos: false })[e.tipo]++; });
  Object.keys(pm).forEach((f) => { const k = lunesIso(desdeIso(f)); if (sem[k]) sem[k].conPasos = true; });
  Object.entries(sem).forEach(([k, s]) => {
    if (s.gym && s.futbol && (!s.conPasos || s.pasos >= 3)) ev.push({ fecha: sumarDias(k, 6) > hoy ? hoy : sumarDias(k, 6), tipo: "redonda", xp: XP.redonda, txt: "Semana redonda" });
  });
  return ev.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function nivel(fecha) {
  const xp = eventos(fecha).reduce((s, e) => s + e.xp, 0);
  const n = Math.min(NIVEL_MAX, 1 + Math.floor(xp / POR_NIVEL));
  const base = (n - 1) * POR_NIVEL;
  return { xp, n, enNivel: xp - base, falta: n >= NIVEL_MAX ? 0 : n * POR_NIVEL - xp, max: n >= NIVEL_MAX };
}

// ---------- Racha de entrenamiento ----------
// Semanas seguidas con al menos un gym. Una semana en pausa (dolor o enfermedad) no corta ni suma.
// Con el poder Escudo, una semana salteada por mes se cubre sola.
export function racha(fecha) {
  const conGym = new Set(sesiones().map((s) => lunesIso(desdeIso(s.fecha))));
  const enPausa = new Set(pausas());
  const escudo = nivel(fecha).n >= nivelDe("escudo");
  const usados = new Set();
  let k = lunesIso(fecha), n = 0;
  if (!conGym.has(k)) k = sumarDias(k, -7); // la semana actual todavía puede cumplirse
  for (let i = 0; i < 160; i++, k = sumarDias(k, -7)) {
    if (conGym.has(k)) { n++; continue; }
    if (enPausa.has(k)) continue;
    const mes = k.slice(0, 7);
    if (escudo && !usados.has(mes) && n > 0) { usados.add(mes); continue; }
    break;
  }
  return n;
}

// ---------- Poderes (temporada 1) ----------
// Un desbloqueo por nivel: piezas del traje, efectos, movimientos y funciones de Orbe.
export const PODERES = [
  { id: "traje", nivel: 2, nombre: "Traje base", tipo: "Skin", desc: "Pedri cambia el buzo por el traje grafito de Orbe." },
  { id: "pulso", nivel: 3, nombre: "Pulso", tipo: "Efecto", desc: "El anillo del pecho late con tus pasos del día." },
  { id: "escudo", nivel: 4, nombre: "Escudo", tipo: "Función", desc: "Si un mes te salteás una semana, la racha no se corta. Se usa solo." },
  { id: "salto", nivel: 5, nombre: "Festejo: salto", tipo: "Movimiento", desc: "Pedri festeja los logros con un salto." },
  { id: "impulso", nivel: 6, nombre: "Impulso", tipo: "Efecto", desc: "Suelas rojas con estela cuando superás tu promedio de pasos." },
  { id: "guantes", nivel: 7, nombre: "Guantes", tipo: "Skin", desc: "Guantes verdes con el borde rojo." },
  { id: "calma", nivel: 8, nombre: "Calma", tipo: "Función", desc: "Respiración guiada con Pedri y la pausa activa para el laburo." },
  { id: "giro", nivel: 9, nombre: "Festejo: giro", tipo: "Movimiento", desc: "Un giro en el aire cuando cerrás una semana redonda." },
  { id: "orbita", nivel: 10, nombre: "Órbita", tipo: "Efecto", desc: "Un aro de luz gira alrededor de Pedri." },
  { id: "visor", nivel: 11, nombre: "Visor", tipo: "Skin", desc: "Un visor fino con la hora de Orbe." },
  { id: "nucleo", nivel: 12, nombre: "Núcleo", tipo: "Skin", desc: "Traje completo con el anillo encendido. El máximo de la temporada." },
];
const NIVEL_MAX = 12;
const nivelDe = (id) => PODERES.find((p) => p.id === id).nivel;
export const tienePoder = (id, fecha) => nivel(fecha).n >= nivelDe(id);

// ---------- Insignias ----------
function semanasSeguidasMax() {
  const ks = [...new Set(sesiones().map((s) => lunesIso(desdeIso(s.fecha))))].sort();
  let mejor = 0, act = 0, prev = null;
  ks.forEach((k) => { act = prev && sumarDias(prev, 7) === k ? act + 1 : 1; mejor = Math.max(mejor, act); prev = k; });
  return mejor;
}
export const INSIGNIAS = [
  { id: "primero", nombre: "Primer entrenamiento", ok: () => sesiones().length >= 1 },
  { id: "cuatro", nombre: "4 semanas seguidas de gym", ok: () => semanasSeguidasMax() >= 4 },
  { id: "ocho", nombre: "8 semanas seguidas de gym", ok: () => semanasSeguidasMax() >= 8 },
  { id: "completo", nombre: "Rutina completa en un día", ok: () => sesiones().some((s) => CUENTAN.every((e) => s.ej?.[e.id]?.hecho)) },
  { id: "sentadilla", nombre: "Sentadilla prolija 4 semanas", ok: () => sesiones().filter((s) => s.ej?.sentadilla?.comodo).length >= 4 },
  { id: "subi", nombre: "Subiste el peso por primera vez", ok: () => subioAlgunPeso() },
  { id: "zorros", nombre: "5 partidos anotados", ok: () => (datosListas()?.futbol || []).length >= 5 },
  { id: "calma7", nombre: "7 meditaciones", ok: () => meditaciones().length >= 7 },
  { id: "diezmil", nombre: "Un día de 10.000 pasos", ok: () => Object.values(pasosMapa()).some((n) => n >= 10000) },
  { id: "redonda3", nombre: "3 semanas redondas", ok: (f) => eventos(f).filter((e) => e.tipo === "redonda").length >= 3 },
];
function subioAlgunPeso() {
  const s = sesiones().slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  return CUENTAN.some((e) => { let max = null; return s.some((x) => { const p = Number(x.ej?.[e.id]?.peso); if (!p) return false; const sube = max !== null && p > max; max = Math.max(max ?? 0, p); return sube; }); });
}

// ---------- Progresión ----------
// Si las dos últimas veces salió cómodo con el mismo peso, toca subir un poco.
function sugerencia(id) {
  const s = sesiones().filter((x) => x.ej?.[id]?.hecho).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 2);
  const ult = s[0]?.ej?.[id];
  if (!ult) return { ultimo: null, subir: false };
  const subir = s.length === 2 && s.every((x) => x.ej[id].comodo) && Number(s[0].ej[id].peso || 0) === Number(s[1].ej[id].peso || 0);
  return { ultimo: ult.peso ? Number(ult.peso) : null, subir };
}

// ---------- Borrador del entrenamiento en curso ----------
export const borrador = () => leer("gymBorrador", null) || { fecha: iso(new Date()), ej: {}, molestia: false };
export function tocar(id, campo, valor) {
  const b = borrador();
  b.ej[id] = b.ej[id] || {};
  if (campo === "molestia") b.molestia = !b.molestia;
  else b.ej[id][campo] = valor === undefined ? !b.ej[id][campo] : valor;
  guardar("gymBorrador", b, true);
}
export function descartar() { guardar("gymBorrador", null, true); }
export function terminar(fecha) {
  const antes = nivel(fecha);
  const b = borrador();
  const hechos = Object.values(b.ej).filter((e) => e.hecho).length;
  if (!hechos) return { error: "Tildá al menos un ejercicio antes de terminar." };
  const l = sesiones().filter((s) => s.fecha !== iso(fecha));
  l.push({ fecha: iso(fecha), ej: b.ej, molestia: !!b.molestia });
  guardar("gymSesiones", l.slice(-300));
  descartar();
  const despues = nivel(fecha);
  return { hechos, xp: despues.xp - antes.xp, subio: despues.n > antes.n ? despues.n : 0, molestia: !!b.molestia };
}

// ---------- Pedri ----------
// Lugar reservado: el modelo 3D llega en una próxima versión.
function pedriSlot(n) {
  const ropa = n >= 2 ? "traje" : "calle";
  return `<div class="pedri-slot" id="pedri-escena" data-ropa="${ropa}" aria-label="Pedri, tu avatar, con ${ropa === "traje" ? "el traje de logro" : "su ropa de calle"}">
    <span class="ps-txt">Cargando a Pedri…</span><span class="ps-nivel">Nivel ${n}</span></div>`;
}

function anilloPasos(fecha) {
  const p = pasos(fecha);
  const R = 46, C = 2 * Math.PI * R;
  const frac = p.hoy !== null && p.prom ? Math.min(1, p.hoy / p.prom) : 0;
  const centro = p.hoy !== null ? `<text x="60" y="58" class="ap-num">${miles(p.hoy)}</text><text x="60" y="76" class="ap-k">pasos</text>`
    : `<text x="60" y="64" class="ap-k">sin datos</text>`;
  const linea = !p.hay ? "Los pasos llegan con Satélite, la mini app que lee Health Connect."
    : p.prom ? `Tu promedio: ${miles(p.prom)}${p.hoy !== null ? ` · ${p.hoy >= p.prom ? "+" : ""}${Math.round((p.hoy / p.prom - 1) * 100)}%` : ""}` : "Juntando días para tu promedio.";
  return `<div class="ap"><svg viewBox="0 0 120 120" role="img" aria-label="Pasos de hoy contra tu promedio">
    <circle cx="60" cy="60" r="${R}" class="ap-pista"/><circle cx="60" cy="60" r="${R}" class="ap-arco" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}" transform="rotate(-90 60 60)"/>${centro}</svg>
    <p class="fuente-dato" style="margin:0">${linea}</p></div>`;
}

// Arriba de Bienestar: Pedri, el nivel y el anillo de pasos.
export function heroBienestar(fecha) {
  const nv = nivel(fecha), t = temporada(fecha), rc = racha(fecha);
  const visto = leer("logrosVisto", 1);
  const nuevo = nv.n > visto ? PODERES.filter((p) => p.nivel > visto && p.nivel <= nv.n) : [];
  const festejo = nuevo.length ? `<div class="festejo" role="status"><b>¡Nivel ${nv.n}!</b><span>Desbloqueaste ${nuevo.map((p) => esc(p.nombre)).join(", ")}.</span>
    <button class="chip" data-accion="logros-visto" data-n="${nv.n}">Genial</button></div>` : "";
  const pausa = semanaEnPausa(fecha);
  return `${festejo}<section class="bloque bien-hero">
    <div class="bh-fila">${pedriSlot(nv.n)}${anilloPasos(fecha)}</div>
    <a class="bh-nivel" href="#/bienestar/logros"><span class="k">Temporada ${t.n} · Nivel ${nv.n}</span>
      <span class="bh-barra"><i style="width:${nv.max ? 100 : Math.round(nv.enNivel / POR_NIVEL * 100)}%"></i></span>
      <span class="fuente-dato" style="margin:0">${nv.max ? "Nivel máximo de la temporada" : `${miles(nv.enNivel)} / ${POR_NIVEL} XP · ${nv.falta} para el próximo poder`}${rc ? ` · racha de ${rc} semana${rc === 1 ? "" : "s"}` : ""}</span></a>
    <div class="chips" style="margin-top:12px"><a class="chip" href="#/bienestar/gym">Empezar entrenamiento</a><a class="chip" href="#/bienestar/logros">Logros</a>
      <button class="chip${pausa ? " on" : ""}" data-accion="bien-pausa">${pausa ? "Semana en pausa" : "Pausar esta semana"}</button></div>
    ${pausa ? '<p class="fuente-dato">Esta semana no corta tu racha. Si es por dolor, que lo vea un kinesiólogo si no afloja.</p>' : ""}</section>`;
}

// Tarjeta de la rutina dentro de Bienestar.
export function tarjetaRutina(fecha) {
  const s = sesiones().slice().sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const dias = s ? Math.round((desdeIso(iso(fecha)) - desdeIso(s.fecha)) / 86400000) : null;
  const cuando = s ? (dias === 0 ? "hoy" : dias === 1 ? "ayer" : `hace ${dias} días`) : null;
  return `<section class="bloque"><h2>Rutina <span class="tag">cuerpo completo · 1 día</span></h2>
    <p style="margin:0 0 6px">${CUENTAN.length} ejercicios en unos 60 minutos: entrada en calor, fuerza, prevención para el fútbol, zona media y cierre.</p>
    <p class="fuente-dato" style="margin:0">${s ? `Último entrenamiento ${cuando}: ${Object.values(s.ej).filter((e) => e.hecho).length} ejercicios.` : "Todavía no anotaste ningún entrenamiento."}</p>
    <div class="chips" style="margin-top:12px"><a class="chip" href="#/bienestar/gym">${leer("gymBorrador") ? "Seguir entrenamiento" : "Empezar"}</a></div></section>`;
}

// ---------- Página del entrenamiento ----------
const VER = { sentadilla: "sen", estocada: "est" };
export function renderGym(fecha) {
  const b = borrador();
  const hechos = Object.values(b.ej).filter((e) => e.hecho).length;
  const bloques = RUTINA.map((bl) => `<section class="bloque"><h2>${esc(bl.bloque)}${bl.min ? ` <span class="tag">${esc(bl.min)}</span>` : ""}</h2>
    <ul class="lista gym-lista">${bl.items.map((x) => {
      const e = b.ej[x.id] || {}, sg = x.peso ? sugerencia(x.id) : null;
      return `<li class="gym-ej${e.hecho ? " hecho" : ""}"><div class="ge-cab">
          <button class="ge-tilde" data-accion="gym-hecho" data-id="${x.id}" aria-pressed="${!!e.hecho}" aria-label="Hecho: ${esc(x.nombre)}"></button>
          <div class="ge-txt"><b>${esc(x.nombre)}</b><span class="ge-dosis">${esc(x.dosis)}</span></div></div>
        <ul class="ge-claves">${x.claves.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        ${VER[x.id] ? `<a class="chip ge-ver" href="/taller/pedri.html?modo=${VER[x.id]}">Ver a Pedri hacerlo</a>` : ""}
        ${x.peso ? `<div class="ge-peso"><label>Peso <input type="number" inputmode="decimal" min="0" step="0.5" data-accion="gym-peso" data-id="${x.id}" value="${esc(e.peso ?? "")}" placeholder="${sg.ultimo ?? "kg"}"> kg</label>
          <button class="chip${e.comodo ? " on" : ""}" data-accion="gym-comodo" data-id="${x.id}">Salió cómodo</button></div>
          ${sg.subir ? '<p class="fuente-dato ge-sube">Las dos últimas veces salió cómodo: probá con un poquito más.</p>' : sg.ultimo ? `<p class="fuente-dato" style="margin-top:4px">La vez pasada: ${sg.ultimo} kg.</p>` : ""}` : ""}</li>`;
    }).join("")}</ul></section>`).join("");
  return `<div class="pagina"><a class="volver" href="#/u/bienestar">← Bienestar</a><h1>Entrenamiento</h1>
    <p class="bajada">Tildá cada ejercicio cuando lo termines. Las primeras dos semanas, peso liviano y técnica prolija.</p>
    ${bloques}
    <section class="bloque"><h2>¿Cómo te sentiste?</h2>
      <div class="chips"><button class="chip${b.molestia ? " on" : ""}" data-accion="gym-molestia">Algo me molestó hoy</button></div>
      <p class="fuente-dato">Una molestia leve que no empeora está bien. Si es punzante, baja a una pierna o un brazo, o hormiguea, cortá ese ejercicio y que lo vea un kinesiólogo.</p></section>
    <div class="gym-pie"><button class="btn ancho-completo" data-accion="gym-terminar">Terminar · ${hechos} hecho${hechos === 1 ? "" : "s"}</button>
      ${hechos ? '<button class="chip" data-accion="gym-descartar" style="margin-top:10px">Descartar</button>' : ""}</div></div>`;
}

// ---------- Página de logros ----------
export function renderLogros(fecha) {
  const nv = nivel(fecha), t = temporada(fecha), ev = eventos(fecha), rc = racha(fecha);
  const fin = desdeIso(t.hasta), faltan = Math.max(0, Math.ceil((fin - desdeIso(iso(fecha))) / 86400000));
  const poderes = PODERES.map((p) => { const ok = nv.n >= p.nivel;
    return `<li class="poder${ok ? " ok" : ""}"><span class="pw-ic" aria-hidden="true">${ok ? "✓" : p.nivel}</span>
      <span class="pw-txt"><b>${esc(p.nombre)}</b> <span class="tag">${esc(p.tipo)}</span><br><small>${esc(p.desc)}</small></span><span class="tag">Nivel ${p.nivel}</span></li>`; }).join("");
  const ins = INSIGNIAS.map((i) => { const ok = i.ok(fecha); return `<span class="insignia${ok ? " ok" : ""}">${ok ? "★ " : ""}${esc(i.nombre)}</span>`; }).join("");
  const ult = ev.slice(0, 8).map((e) => `<li><span>${esc(e.txt)}<br><small class="vacio">${e.fecha.slice(8, 10)}/${e.fecha.slice(5, 7)}</small></span><span class="der">+${e.xp}</span></li>`).join("");
  return `<div class="pagina"><a class="volver" href="#/u/bienestar">← Bienestar</a><h1>Logros</h1>
    <p class="bajada">Temporada ${t.n}, hasta el ${fin.getDate()}/${fin.getMonth() + 1}/${fin.getFullYear()} (faltan ${faltan} días). Lo que ganes queda en tu vitrina.</p>
    <section class="bloque"><div class="trio"><div><span class="k">Nivel</span><b>${nv.n}</b></div><div><span class="k">XP</span><b>${miles(nv.xp)}</b></div><div><span class="k">Racha</span><b>${rc} sem.</b></div></div>
      <span class="bh-barra" style="margin-top:14px"><i style="width:${nv.max ? 100 : Math.round(nv.enNivel / POR_NIVEL * 100)}%"></i></span>
      <p class="fuente-dato">${nv.max ? "Llegaste al máximo de la temporada." : `Te faltan ${nv.falta} XP para el nivel ${nv.n + 1}.`}</p></section>
    <section class="bloque"><h2>Poderes</h2><ul class="lista poderes">${poderes}</ul>
      <p class="fuente-dato">Las skins, efectos y movimientos se ven en Pedri cuando llegue; Escudo ya funciona.</p></section>
    <section class="bloque"><h2>Insignias</h2><div class="insignias">${ins}</div></section>
    <section class="bloque"><h2>Cómo se gana XP</h2><ul class="lista">
      <li><span>Entrenamiento de gym</span><span class="der">+${XP.gym}</span></li><li><span>Cada ejercicio tildado</span><span class="der">+${XP.ejercicio}</span></li>
      <li><span>Partido de fútbol anotado</span><span class="der">+${XP.futbol}</span></li><li><span>Día con pasos sobre tu promedio</span><span class="der">+${XP.pasos}</span></li>
      <li><span>Meditación terminada</span><span class="der">+${XP.medita}</span></li><li><span>Semana redonda (gym + fútbol)</span><span class="der">+${XP.redonda}</span></li></ul>
      <p class="fuente-dato">Entrenar de más no suma: cuenta un gym por día y dos por semana, un partido y una meditación por día. Pausar una semana por dolor no corta la racha.</p></section>
    <section class="bloque"><h2>Lo último</h2>${ult ? `<ul class="lista">${ult}</ul>` : '<p class="vacio">Todavía no sumaste XP esta temporada. El primer entrenamiento suma 100.</p>'}</section></div>`;
}
