// Conexión con Google a través del servidor de Orbe (Cloudflare).
// El servidor guarda, cifrada en una cookie que el navegador no puede leer, la renovación de Google.
// Acá solo se piden pases de 1 hora cuando hacen falta: la sesión dura semanas sin tocar nada.
import { leer, guardar, borrar } from "./almacen.js";

let pase = null;            // { valor, vence } en memoria, nunca en el almacenamiento del celu
let pedido = null;          // evita pedir dos pases a la vez
export let estadoSesion = "desconocido"; // "ok" | "reconectar" | "sin-configurar" | "sin-red"

export const configurado = () => true;
export const cuenta = () => leer("cuenta");

// Lleva a Google para conectar (o reconectar). Vuelve sola a Orbe.
export function conectar(todo) { location.href = "/api/auth/login" + (todo || permisos().sheets ? "?permisos=todo" : ""); }
// Qué permisos extra diste: { sheets, gmail }. Llega con cada pase.
export const permisos = () => leer("permisos", {});

export async function desconectar() {
  pase = null;
  try { await fetch("/api/auth/salir", { method: "POST", credentials: "same-origin" }); } catch (e) { /* igual se limpia */ }
  borrar("cuenta"); borrar("agenda"); borrar("permisos");
  estadoSesion = "reconectar";
}

export async function pedirPase() {
  if (pase && Date.now() < pase.vence - 60000) return pase.valor;
  if (pedido) return pedido;
  pedido = (async () => {
    try {
      const r = await fetch("/api/token", { method: "POST", credentials: "same-origin" });
      if (r.status === 401) { estadoSesion = "reconectar"; throw new Error("reconectar"); }
      if (r.status === 503) { estadoSesion = "sin-configurar"; throw new Error("sin-configurar"); }
      if (!r.ok) throw new Error("servidor " + r.status);
      const t = await r.json();
      pase = { valor: t.access_token, vence: Date.now() + t.expires_in * 1000 };
      estadoSesion = "ok";
      if (t.email && cuenta()?.email !== t.email) guardar("cuenta", { email: t.email });
      if (t.permisos) guardar("permisos", t.permisos);
      return pase.valor;
    } catch (e) {
      if (e instanceof TypeError) estadoSesion = "sin-red";
      throw e;
    } finally { pedido = null; }
  })();
  return pedido;
}

export async function api(url, metodo = "GET", cuerpo) {
  const t = await pedirPase();
  const op = { method: metodo, headers: { Authorization: "Bearer " + t } };
  if (cuerpo !== undefined) { op.headers["Content-Type"] = "application/json"; op.body = JSON.stringify(cuerpo); }
  const r = await fetch(url, op);
  if (r.status === 401) { pase = null; throw new Error("reconectar"); }
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    // Servicio apagado en Google Cloud: hay que habilitarlo una vez en el proyecto.
    if (r.status === 403 && /has not been used|is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(txt)) {
      throw new Error("api-apagada:" + (/sheets/i.test(url) ? "sheets" : /gmail/i.test(url) ? "gmail" : /\/drive\//i.test(url) ? "drive" : "calendar"));
    }
    if (r.status === 403) throw new Error("permiso");
    if (r.status === 404) throw new Error("no-existe");
    throw new Error("Google respondió " + r.status);
  }
  return r.json();
}

// Llama al servidor de Orbe (mismo origen, con la cookie de sesión).
export async function servidor(ruta, cuerpo) {
  const r = await fetch(ruta, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo || {}) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { estadoSesion = "reconectar"; throw new Error("reconectar"); }
  if (!r.ok) throw new Error((j.error || "servidor " + r.status) + (j.status ? " " + j.status : "") + (j.detalle ? " — " + j.detalle : ""));
  return j;
}

// ---------- Calendario ----------
const TIPOS = [
  [/river/i, "river"], [/\bbna\b|banco/i, "bna"], [/ufasta|facu|clase|cursada|parcial|final\b/i, "ufasta"],
  [/gym|gimnasio/i, "gym"], [/f[uú]tbol|zorros/i, "futbol"], [/\bntn\b/i, "ntn"], [/agus/i, "agus"]
];
const NOMBRES = { bna: "BNA", ufasta: "UFASTA", gym: "Gym", futbol: "Fútbol", ntn: "NTN" };
const tipoDe = (t) => (TIPOS.find(([re]) => re.test(t)) || [null, "otro"])[1];
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const hhmm = (d) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
const FERIADOS_AR = "es.ar#holiday@group.v.calendar.google.com";
const MONTO = /\$\s?[\d.]+(,\d{1,2})?/;

// Separa "Vence Edesur Vernet 354 $ 45.677,67" en título y monto.
function pendienteDe(titulo, fecha) {
  const m = titulo.match(MONTO);
  const limpio = titulo.replace(MONTO, "").replace(/^vence:?\s*/i, "").replace(/\s{2,}/g, " ").trim();
  // Lo de la facu va a UFASTA aunque el evento empiece con «Vence» (foros, actividades, TPs, parciales…).
  const deFacu = /entrega|\btp\b|parcial|final\b|foro|actividad|campus|ufasta|cr[ií]tica de los lenguajes|marketing|c[aá]tedra|materia|consigna|trabajo pr[aá]ctico/i.test(titulo);
  // La cuota de la facu es plata: esa sí va a Finanzas.
  const facu = deFacu && !/cuota|arancel|matr[ií]cula \$/i.test(titulo);
  return {
    titulo: limpio, monto: m ? m[0].replace(/\s/g, " ").replace("$ ", "$ ") : null, fecha,
    tipo: facu ? "facu" : /tarjeta|visa|master/i.test(titulo) ? "tarjeta" : "vencimiento",
    universo: facu ? "ufasta" : "finanzas", vernet: /vernet/i.test(titulo), fuente: "Tu calendario",
    clave: (limpio + "|" + fecha).toLowerCase()
  };
}

// Trae del calendario: los últimos 30 días (para lo vencido) y las próximas dos semanas.
export async function leerAgenda() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const desde = new Date(hoy.getTime() - 30 * 86400000).toISOString();
  const hasta = new Date(hoy.getTime() + 15 * 86400000).toISOString();
  const lista = await api("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader");
  // El calendario "Alarmas" se lee aunque esté oculto en Google Calendar.
  const cals = (lista.items || []).filter((c) => c.selected !== false || /alarma/i.test(c.summary || ""));
  if (!cals.some((c) => c.id === FERIADOS_AR)) cals.push({ id: FERIADOS_AR, summary: "Feriados" });
  if (!cals.some((c) => c.id.includes("#contacts@"))) cals.push({ id: "addressbook#contacts@group.v.calendar.google.com", summary: "Cumpleaños" });
  const porDia = {}, avisos = {}, feriados = {}, libres = {}, cumples = {}, pendientes = new Map(), alarmas = new Set(), historial = {};
  await Promise.all(cals.map(async (c) => {
    const url = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(c.id) +
      "/events?singleEvents=true&orderBy=startTime&maxResults=500&timeMin=" + encodeURIComponent(desde) + "&timeMax=" + encodeURIComponent(hasta);
    let ev;
    try { ev = await api(url); } catch (e) { return; }
    const esFeriados = c.id.includes("#holiday@");
    const esCumples = c.id.includes("#contacts@");
    const esAlarmas = /alarma/i.test(c.summary || "");
    (ev.items || []).forEach((e) => {
      if (e.status === "cancelled") return;
      const titulo = (e.summary || "(sin título)").trim();
      if (e.start.date) { // día completo
        const [y, m, d] = e.start.date.split("-").map(Number);
        const ini = new Date(y, m - 1, d);
        const [y2, m2, d2] = e.end.date.split("-").map(Number);
        const fin = new Date(y2, m2 - 1, d2);
        const fecha = e.start.date;
        if (esFeriados) { feriados[fecha] = titulo; return; }
        if (esCumples || e.eventType === "birthday" || /^cumple/i.test(titulo)) {
          (cumples[fecha] = cumples[fecha] || []).push(titulo.replace(/^(cumpleaños de|cumple de|cumple)\s*/i, "").replace(/^feliz cumpleaños,?\s*/i, ""));
          return;
        }
        if (/vacaciones|licencia|franco|d[ií]a libre/i.test(titulo)) {
          for (let t = ini.getTime(); t < fin.getTime(); t += 86400000) libres[iso(new Date(t))] = titulo;
          return;
        }
        if (/^vence/i.test(titulo) || /entrega|\btp\b|parcial/i.test(titulo)) {
          const p = pendienteDe(titulo, fecha);
          if (!pendientes.has(p.clave)) pendientes.set(p.clave, p); // uno solo aunque esté en dos calendarios
          return;
        }
        (avisos[fecha] = avisos[fecha] || []).push({ titulo });
        return;
      }
      const ini = new Date(e.start.dateTime), fin = new Date(e.end.dateTime);
      if (esAlarmas || /^\s*(⏰\s*)?alarma\b/i.test(titulo)) { alarmas.add(ini.getTime()); return; }
      const dia = iso(ini);
      const minutos = (fin - ini) / 60000;
      if (fin < hoy) {
        // Lo pasado se guarda resumido para las cuentas del mes (horas del BNA, gym y fútbol).
        const t = tipoDe(titulo + " " + (c.summary || "") + " " + c.id);
        if (minutos > 15 && t !== "otro") (historial[dia] = historial[dia] || []).push({ tipo: t, min: minutos, a: ini.getTime(), b: fin.getTime(), creado: e.created || "" });
        return;
      }
      if (minutos <= 15) { (avisos[dia] = avisos[dia] || []).push({ titulo, inicio: hhmm(ini) }); return; } // recordatorios: fuera del anillo
      const tipo = tipoDe(titulo + " " + (c.summary || "") + " " + c.id);
      const finTxt = iso(fin) === dia ? hhmm(fin) : "23:59";
      (porDia[dia] = porDia[dia] || []).push({ inicio: hhmm(ini), fin: finTxt, titulo: NOMBRES[tipo] || titulo, original: titulo, tipo,
        a: ini.getTime(), b: fin.getTime(), creado: e.created || "", cal: c.summary || "" });
    });
  }));
  // Si dos eventos del mismo tipo se pisan (por ejemplo, un horario viejo del BNA en otro calendario),
  // queda el creado más recientemente y el otro se anota como conflicto para avisarte.
  const conflictos = {};
  const depurar = (lista, dia, avisar) => {
    const quedan = [];
    [...lista].sort((x, y) => String(y.creado).localeCompare(String(x.creado))).forEach((ev) => {
      const pisa = ev.tipo !== "otro" && quedan.find((q) => q.tipo === ev.tipo && ev.a < q.b && q.a < ev.b);
      if (pisa) { if (avisar) (conflictos[dia] = conflictos[dia] || []).push({ tipo: ev.tipo, descartado: hhmm(new Date(ev.a)) + "–" + hhmm(new Date(ev.b)), cal: ev.cal, queda: pisa.inicio + "–" + pisa.fin }); }
      else quedan.push(ev);
    });
    return quedan.sort((x, y) => x.a - y.a);
  };
  Object.keys(porDia).forEach((d) => { porDia[d] = depurar(porDia[d], d, true); });
  Object.keys(historial).forEach((d) => { historial[d] = depurar(historial[d], d, false).map(({ tipo, min }) => ({ tipo, min })); });
  const agenda = { cuando: Date.now(), porDia, avisos, feriados, libres, cumples, pendientes: [...pendientes.values()],
    alarmas: [...alarmas].sort((a, b) => a - b), historial, conflictos };
  guardar("agenda", agenda);
  return agenda;
}

// Crea un evento en tu calendario principal (solo cuando vos lo pedís desde Orbe).
export async function crearEvento({ titulo, inicio, fin, descripcion }) {
  return api("https://www.googleapis.com/calendar/v3/calendars/primary/events", "POST", {
    summary: titulo, description: descripcion || "Creado desde Orbe",
    start: { dateTime: inicio.toISOString() }, end: { dateTime: fin.toISOString() }
  });
}

// ---------- Un mes entero (para la vista Mes de la Agenda) ----------
// Trae todos los calendarios visibles del mes, más los cumpleaños. Se guarda por mes para abrir sin señal.
export async function leerMes(anio, mes) {
  const desde = new Date(anio, mes, 1).toISOString();
  const hasta = new Date(anio, mes + 1, 1).toISOString();
  const lista = await api("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader");
  const cals = (lista.items || []).filter((c) => c.selected !== false && !/alarma/i.test(c.summary || ""));
  if (!cals.some((c) => c.id === FERIADOS_AR)) cals.push({ id: FERIADOS_AR, summary: "Feriados" });
  if (!cals.some((c) => c.id.includes("#contacts@"))) cals.push({ id: "addressbook#contacts@group.v.calendar.google.com", summary: "Cumpleaños" });
  const dias = {};
  const sumar = (d, x) => { (dias[d] = dias[d] || []).push(x); };
  await Promise.all(cals.map(async (c) => {
    let ev;
    try {
      ev = await api("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(c.id) +
        "/events?singleEvents=true&orderBy=startTime&maxResults=500&timeMin=" + encodeURIComponent(desde) + "&timeMax=" + encodeURIComponent(hasta));
    } catch (e) { return; }
    const esFeriados = c.id.includes("#holiday@"), esCumples = c.id.includes("#contacts@");
    (ev.items || []).forEach((e) => {
      if (e.status === "cancelled") return;
      const titulo = (e.summary || "(sin título)").trim();
      if (e.start.date) {
        const tipo = esFeriados ? "feriado" : (esCumples || e.eventType === "birthday" || /^cumple/i.test(titulo)) ? "cumple" : tipoDe(titulo + " " + (c.summary || ""));
        const nombre = tipo === "cumple" ? titulo.replace(/^(cumpleaños de|cumple de|cumple)\s*/i, "").replace(/^feliz cumpleaños,?\s*/i, "") : titulo;
        const [y, m, d] = e.start.date.split("-").map(Number);
        const [y2, m2, d2] = e.end.date.split("-").map(Number);
        for (let t = new Date(y, m - 1, d); t < new Date(y2, m2 - 1, d2); t.setDate(t.getDate() + 1)) {
          if (t.getMonth() === mes) sumar(iso(t), { titulo: nombre, tipo, todoElDia: true });
        }
        return;
      }
      const ini = new Date(e.start.dateTime), fin = new Date(e.end.dateTime);
      if ((fin - ini) / 60000 <= 15 && !/river/i.test(c.summary || "")) return; // recordatorios sueltos
      sumar(iso(ini), { titulo, tipo: tipoDe(titulo + " " + (c.summary || "") + " " + c.id), inicio: hhmm(ini), fin: hhmm(fin), a: ini.getTime() });
    });
  }));
  // Lo mismo en dos calendarios (o el partido en «River» y en el principal) se muestra una sola vez.
  Object.keys(dias).forEach((d) => { const vistos = new Set(); dias[d] = dias[d].filter((x) => { const k = x.titulo + "|" + (x.inicio || ""); if (vistos.has(k)) return false; vistos.add(k); return true; }); });
  Object.values(dias).forEach((l) => l.sort((x, y) => (x.todoElDia ? -1 : 0) - (y.todoElDia ? -1 : 0) || (x.a || 0) - (y.a || 0)));
  const clave = anio + "-" + String(mes + 1).padStart(2, "0");
  const meses = leer("agendaMeses", {});
  meses[clave] = { cuando: Date.now(), dias };
  // Se guardan los últimos 4 meses consultados.
  Object.keys(meses).sort((a, b) => meses[b].cuando - meses[a].cuando).slice(4).forEach((k) => delete meses[k]);
  guardar("agendaMeses", meses, true);
  return meses[clave];
}
