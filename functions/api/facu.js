// Novedades del campus de UFASTA a partir de los mails que manda el aula virtual.
// Solo se leen los asuntos (no el cuerpo), y vuelven ya clasificados: entrega hecha, devolución, recordatorio, clase nueva, mensaje.
import { leerAsunto } from "../../servidor/facu.js";
import { configurado, descifrar, leerCookie, COOKIE, mismoOrigen, json, paseDe, GMAIL } from "../../servidor/sesion.js";

const POR_VEZ = 30;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return json({ error: "origen" }, 403);
  if (!configurado(env)) return json({ error: "sin-configurar" }, 503);
  const crudo = leerCookie(request, COOKIE);
  const s = crudo && await descifrar(env, crudo);
  if (!s || !s.rt) return json({ error: "sin-sesion" }, 401);
  if (!(s.scope || "").split(" ").includes(GMAIL)) return json({ error: "permiso" }, 403);
  let cuerpo = {};
  try { cuerpo = await request.json(); } catch (e) { /* vacío */ }
  const desde = Math.max(Math.floor(Number(cuerpo.desde || 0) / 1000), Math.floor(Date.now() / 1000) - 75 * 86400);

  const { ok, t } = await paseDe(env, s.rt, [GMAIL]);
  if (!ok) return json({ error: "google" }, 502);
  const auth = { headers: { Authorization: "Bearer " + t.access_token } };
  const q = encodeURIComponent("from:ufasta.edu.ar after:" + (desde - 1));
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=200&q=" + q, auth);
  if (!r.ok) return json({ error: r.status === 429 || r.status === 403 ? "pausa" : "gmail", status: r.status }, r.status === 429 ? 200 : 502);
  const ids = ((await r.json()).messages || []).map((m) => m.id).reverse().slice(0, POR_VEZ);
  const items = [];
  let ultimo = desde * 1000, frenado = false;
  for (const id of ids) {
    const x = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id + "?format=metadata&metadataHeaders=Subject", auth);
    if (!x.ok) { if (x.status === 429 || x.status === 403) { frenado = true; break; } continue; }
    const m = await x.json();
    ultimo = Math.max(ultimo, Number(m.internalDate));
    const asunto = (m.payload?.headers || []).find((h) => h.name.toLowerCase() === "subject")?.value || "";
    const d = leerAsunto(asunto);
    if (d) items.push({ id: m.id, ts: Number(m.internalDate), ...d });
    await espera(40);
  }
  return json({ items, ultimo, frenado });
}
