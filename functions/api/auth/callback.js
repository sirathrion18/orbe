// Google vuelve acá con un código; lo cambio por la renovación y la guardo cifrada en la cookie.
import { CLIENT_ID, configurado, cifrar, cookieSesion, leerEstado, borrarEstado, mailPermitido, decodificarIdToken } from "../../../servidor/sesion.js";

const volver = (origen, motivo) => new Response(null, {
  status: 302, headers: { Location: origen + "/#/ajustes?google=" + motivo, "Set-Cookie": borrarEstado(), "Cache-Control": "no-store" }
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!configurado(env)) return volver(url.origin, "sin-configurar");
  const codigo = url.searchParams.get("code");
  const estado = url.searchParams.get("state");
  if (url.searchParams.get("error")) return volver(url.origin, "cancelado");
  if (!codigo || !estado || estado !== leerEstado(request)) return volver(url.origin, "estado");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: codigo, client_id: CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: url.origin + "/api/auth/callback", grant_type: "authorization_code"
    })
  });
  const t = await r.json();
  if (!r.ok || !t.refresh_token) return volver(url.origin, "google");
  const yo = decodificarIdToken(t.id_token);
  if (!yo.email_verified || !(await mailPermitido(yo.email))) return volver(url.origin, "cuenta");

  const valor = await cifrar(env, { rt: t.refresh_token, email: yo.email, desde: Date.now() });
  const h = new Headers({ Location: url.origin + "/#/?google=ok", "Cache-Control": "no-store" });
  h.append("Set-Cookie", cookieSesion(valor));
  h.append("Set-Cookie", borrarEstado());
  return new Response(null, { status: 302, headers: h });
}
