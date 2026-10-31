// Amorcitos: la página de Agus (/amorcitos) y el universo Amorcitos de Orbe leen y escriben acá.
//   GET  login      entra con Google pidiendo solo el mail (nada de Gmail, Drive ni calendario)
//   GET  datos      súper, menú, planes, pelis, fechas y docs
//   POST op         un cambio chiquito (sumar, tildar, borrar, menú)
//   POST importar   solo Nacho, una vez: trae lo que ya tenía en Orbe
//   POST salir      cierra la sesión de Amorcitos
import { CLIENT_ID, configurado, cookieEstado, mismoOrigen, json } from "../../../servidor/sesion.js";
import { quien, leerDoc, aplicar, importar, paraVer, borrarAmor } from "../../../servidor/amor.js";

export async function onRequestGet({ request, env, params }) {
  if (params.accion === "login") {
    if (!configurado(env)) return new Response("Falta configurar Google.", { status: 503 });
    const url = new URL(request.url);
    const estado = "amor." + crypto.randomUUID();
    const q = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: url.origin + "/api/auth/callback", response_type: "code",
      scope: "openid email", access_type: "online", prompt: "select_account", state: estado });
    return new Response(null, { status: 302, headers: { Location: "https://accounts.google.com/o/oauth2/v2/auth?" + q, "Set-Cookie": cookieEstado(estado), "Cache-Control": "no-store" } });
  }
  if (params.accion === "datos") {
    const u = await quien(request, env);
    if (!u) return json({ error: "sin-sesion" }, 401);
    return json({ yo: u.rol, ...paraVer(await leerDoc(env)) });
  }
  return json({ error: "no" }, 404);
}

export async function onRequestPost({ request, env, params }) {
  if (!mismoOrigen(request)) return json({ error: "origen" }, 403);
  if (params.accion === "salir") return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": borrarAmor(), "Cache-Control": "no-store" } });
  const u = await quien(request, env);
  if (!u) return json({ error: "sin-sesion" }, 401);
  let cuerpo;
  try { const t = await request.text(); if (t.length > 300000) throw new Error("grande"); cuerpo = JSON.parse(t || "{}"); } catch (e) { return json({ error: "cuerpo" }, 400); }
  try {
    if (params.accion === "op") return json({ yo: u.rol, ...paraVer(await aplicar(env, u.rol, cuerpo)) });
    if (params.accion === "importar") {
      if (u.rol !== "nacho") return json({ error: "permiso" }, 403);
      const r = await importar(env, cuerpo);
      return json({ yo: u.rol, importado: r.importado, ...paraVer(r.d) });
    }
  } catch (e) { return json({ error: e.message }, e.message === "permiso" ? 403 : 400); }
  return json({ error: "no" }, 404);
}
