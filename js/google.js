// Conexión con Google: inicio de sesión y lectura del calendario.
// Todo pasa entre tu navegador y Google: Orbe no tiene servidor propio y no guarda tu contraseña.
import { GOOGLE_CLIENT_ID } from "./config.js";
import { leer, guardar, borrar, sesion } from "./almacen.js";

const ALCANCES = "openid email profile https://www.googleapis.com/auth/calendar.readonly";
let cliente = null;

export const configurado = () => !!GOOGLE_CLIENT_ID;
export const cuenta = () => leer("cuenta");

function cargarScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((ok, mal) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.onload = ok; s.onerror = () => mal(new Error("No pude cargar el inicio de sesión de Google"));
    document.head.appendChild(s);
  });
}

function tokenVigente() {
  const t = sesion("token");
  return t && Date.now() < t.vence - 60000 ? t.valor : null;
}

// Pide permiso (la primera vez muestra la ventana de Google; después, si ya diste permiso, es casi instantáneo).
export async function conectar(silencioso = false) {
  if (!configurado()) throw new Error("Falta el ID de cliente de Google");
  await cargarScript();
  return new Promise((ok, mal) => {
    cliente = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: ALCANCES,
      prompt: silencioso ? "" : "consent",
      login_hint: cuenta()?.email,
      callback: async (r) => {
        if (r.error) return mal(new Error(r.error));
        sesion("token", { valor: r.access_token, vence: Date.now() + r.expires_in * 1000 });
        try {
          const yo = await api("https://www.googleapis.com/oauth2/v3/userinfo");
          guardar("cuenta", { email: yo.email, nombre: yo.given_name || yo.name, foto: yo.picture });
          ok(yo);
        } catch (e) { mal(e); }
      },
      error_callback: (e) => mal(new Error(e.type || "cancelado"))
    });
    cliente.requestAccessToken();
  });
}

export function desconectar() {
  const t = tokenVigente();
  if (t && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(t, () => {});
  sesion("token", null);
  borrar("cuenta");
  borrar("agenda");
}

async function api(url) {
  const t = tokenVigente();
  if (!t) throw new Error("sin-token");
  const r = await fetch(url, { headers: { Authorization: "Bearer " + t } });
  if (r.status === 401) { sesion("token", null); throw new Error("sin-token"); }
  if (!r.ok) throw new Error("Google respondió " + r.status);
  return r.json();
}

// ---------- Calendario ----------
const TIPOS = [
  [/\briver\b/i, "river"], [/\bbna\b|banco/i, "bna"], [/ufasta|facu|clase|cursada|parcial|final\b/i, "ufasta"],
  [/gym|gimnasio/i, "gym"], [/f[uú]tbol|zorros/i, "futbol"], [/\bntn\b/i, "ntn"], [/agus/i, "agus"]
];
const tipoDe = (t) => (TIPOS.find(([re]) => re.test(t)) || [null, "otro"])[1];
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const hhmm = (d) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");

// Trae hoy, mañana y los vencimientos de las próximas dos semanas de todos tus calendarios.
export async function leerAgenda() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const desde = hoy.toISOString();
  const hasta = new Date(hoy.getTime() + 15 * 86400000).toISOString();
  const lista = await api("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader");
  const cals = (lista.items || []).filter((c) => c.selected !== false);
  const porDia = {}, pendientes = [];
  await Promise.all(cals.map(async (c) => {
    const url = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(c.id) +
      "/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=" + encodeURIComponent(desde) + "&timeMax=" + encodeURIComponent(hasta);
    let ev;
    try { ev = await api(url); } catch (e) { return; }
    (ev.items || []).forEach((e) => {
      if (e.status === "cancelled") return;
      const titulo = e.summary || "(sin título)";
      if (e.start.date) { // evento de día completo
        const [y, m, d] = e.start.date.split("-").map(Number);
        const dias = Math.round((new Date(y, m - 1, d) - hoy) / 86400000);
        if (/^vence/i.test(titulo)) {
          pendientes.push({ titulo: titulo.replace(/^vence:?\s*/i, "Vence "), tipo: /tarjeta|visa|master/i.test(titulo) ? "tarjeta" : "vencimiento", dias, universo: "finanzas" });
        } else if (/entrega|tp\b|parcial|final/i.test(titulo)) {
          pendientes.push({ titulo, tipo: "facu", dias, universo: "ufasta" });
        }
        return;
      }
      const ini = new Date(e.start.dateTime), fin = new Date(e.end.dateTime);
      const dia = iso(ini);
      const finTxt = iso(fin) === dia ? hhmm(fin) : "23:59";
      (porDia[dia] = porDia[dia] || []).push({ inicio: hhmm(ini), fin: finTxt, titulo, tipo: tipoDe(titulo + " " + (c.summary || "")) });
    });
  }));
  const agenda = { cuando: Date.now(), porDia, pendientes };
  guardar("agenda", agenda);
  return agenda;
}
