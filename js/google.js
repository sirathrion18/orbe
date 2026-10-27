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
export function conectar() { location.href = "/api/auth/login"; }

export async function desconectar() {
  pase = null;
  try { await fetch("/api/auth/salir", { method: "POST", credentials: "same-origin" }); } catch (e) { /* igual se limpia */ }
  borrar("cuenta"); borrar("agenda");
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
      return pase.valor;
    } catch (e) {
      if (e instanceof TypeError) estadoSesion = "sin-red";
      throw e;
    } finally { pedido = null; }
  })();
  return pedido;
}

async function api(url) {
  const t = await pedirPase();
  const r = await fetch(url, { headers: { Authorization: "Bearer " + t } });
  if (r.status === 401) { pase = null; throw new Error("reconectar"); }
  if (!r.ok) throw new Error("Google respondió " + r.status);
  return r.json();
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
  const facu = /entrega|\btp\b|parcial|final/i.test(titulo) && !/^vence/i.test(titulo);
  return {
    titulo: limpio, monto: m ? m[0].replace(/\s/g, " ").replace("$ ", "$ ") : null, fecha,
    tipo: facu ? "facu" : /tarjeta|visa|master/i.test(titulo) ? "tarjeta" : "vencimiento",
    universo: facu ? "ufasta" : "finanzas", vernet: /vernet/i.test(titulo),
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
  const porDia = {}, avisos = {}, feriados = {}, libres = {}, cumples = {}, pendientes = new Map(), alarmas = new Set();
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
      if (fin < hoy) return;
      const dia = iso(ini);
      const minutos = (fin - ini) / 60000;
      if (minutos <= 15) { (avisos[dia] = avisos[dia] || []).push({ titulo, inicio: hhmm(ini) }); return; } // recordatorios: fuera del anillo
      const tipo = tipoDe(titulo + " " + (c.summary || "") + " " + c.id);
      const finTxt = iso(fin) === dia ? hhmm(fin) : "23:59";
      (porDia[dia] = porDia[dia] || []).push({ inicio: hhmm(ini), fin: finTxt, titulo: NOMBRES[tipo] || titulo, original: titulo, tipo });
    });
  }));
  const agenda = { cuando: Date.now(), porDia, avisos, feriados, libres, cumples, pendientes: [...pendientes.values()],
    alarmas: [...alarmas].sort((a, b) => a - b) };
  guardar("agenda", agenda);
  return agenda;
}
