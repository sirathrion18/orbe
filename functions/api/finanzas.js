// Lee los mails de aviso del BNA y de Mercado Pago y devuelve solo los movimientos ya entendidos.
// El texto de los mails nunca sale del servidor, y el pase de Gmail tampoco llega al navegador.
// Cloudflare permite ~50 pedidos por llamada: se procesan hasta 40 mails por vez, del más viejo al más nuevo,
// y la app vuelve a llamar con "desde" hasta que no queden.
import { configurado, descifrar, leerCookie, COOKIE, mismoOrigen, json, paseDe, GMAIL } from "../../servidor/sesion.js";
import { leerMail } from "../../servidor/mails.js";

const POR_VEZ = 40;
const REMITENTES = "{from:bnanet.bna.com.ar from:bnainfo.bna.com.ar from:mercadopago.com from:mercadopago.com.ar} -category:promotions";

const b64 = (d) => { try { return decodeURIComponent(escape(atob(d.replace(/-/g, "+").replace(/_/g, "/")))); } catch (e) { return ""; } };
const sinHtml = (h) => h.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|tr|div|h\d)>/gi, "\n")
  .replace(/<\/td>/gi, " | ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ");

function textoDe(parte) {
  let plano = "", html = "";
  (function recorrer(p) {
    if (!p) return;
    if (p.mimeType === "text/plain" && p.body?.data) plano += b64(p.body.data);
    else if (p.mimeType === "text/html" && p.body?.data) html += b64(p.body.data);
    (p.parts || []).forEach(recorrer);
  })(parte);
  // El HTML trae las tablas de Red Link mejor armadas que el texto plano.
  return html ? sinHtml(html) : plano;
}

export async function onRequestPost({ request, env }) {
  if (!mismoOrigen(request)) return json({ error: "origen" }, 403);
  if (!configurado(env)) return json({ error: "sin-configurar" }, 503);
  const crudo = leerCookie(request, COOKIE);
  const s = crudo && await descifrar(env, crudo);
  if (!s || !s.rt) return json({ error: "sin-sesion" }, 401);
  if (!(s.scope || "").split(" ").includes(GMAIL)) return json({ error: "permiso" }, 403);

  let cuerpo = {};
  try { cuerpo = await request.json(); } catch (e) { /* vacío */ }
  const desde = Math.max(0, Math.floor(Number(cuerpo.desde || 0) / 1000));

  const { ok, t } = await paseDe(env, s.rt, [GMAIL]);
  if (!ok) return json({ error: t.error === "invalid_grant" ? "reconectar" : "google" }, 401);
  const auth = { headers: { Authorization: "Bearer " + t.access_token } };

  // Lista (de más nuevo a más viejo) y la doy vuelta para procesar desde lo más viejo.
  const ids = [];
  let pagina = "";
  for (let i = 0; i < 2; i++) {
    const q = encodeURIComponent(REMITENTES + (desde ? " after:" + desde : ""));
    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&q=" + q + (pagina ? "&pageToken=" + pagina : ""), auth);
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      const apagada = r.status === 403 && /has not been used|is disabled|SERVICE_DISABLED|accessNotConfigured/i.test(txt);
      return json({ error: apagada ? "api-apagada:gmail" : "gmail", status: r.status }, 502);
    }
    const j = await r.json();
    (j.messages || []).forEach((m) => ids.push(m.id));
    if (!j.nextPageToken) break;
    pagina = j.nextPageToken;
  }
  ids.reverse();
  const lote = ids.slice(0, POR_VEZ);

  const movimientos = [];
  let ultimo = desde * 1000;
  await Promise.all(lote.map(async (id) => {
    const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id + "?format=full", auth);
    if (!r.ok) return;
    const m = await r.json();
    const h = Object.fromEntries((m.payload?.headers || []).map((x) => [x.name.toLowerCase(), x.value]));
    ultimo = Math.max(ultimo, Number(m.internalDate));
    const mov = leerMail({ id: m.id, internalDate: m.internalDate, subject: h.subject || "", from: h.from || "", text: textoDe(m.payload) });
    if (mov) movimientos.push(mov);
  }));
  return json({ movimientos, ultimo, leidos: lote.length, quedan: Math.max(0, ids.length - lote.length) });
}
