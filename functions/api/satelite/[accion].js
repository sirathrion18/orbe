// Buzón de Satélite. Rutas:
//   Desde Orbe (con tu sesión):  POST codigo · POST retirar · POST listo · POST anular
//   Desde el celu (con su llave): POST vincular · POST buzon
// Ver servidor/satelite.js para qué se guarda y cómo.
import { configurado, descifrar as descifrarSesion, leerCookie, COOKIE, mismoOrigen, json } from "../../../servidor/sesion.js";
import { cifrar, descifrar, sha256, codigoNuevo, llaveNueva, idNuevo, limpiarItem, DIAS30 } from "../../../servidor/satelite.js";

const MAX_ITEMS = 200;

async function usuario(request, env) {
  if (!mismoOrigen(request)) return { error: json({ error: "origen" }, 403) };
  const crudo = leerCookie(request, COOKIE);
  const s = crudo && await descifrarSesion(env, crudo);
  if (!s || !s.email) return { error: json({ error: "sin-sesion" }, 401) };
  return { u: (await sha256("orbe|" + String(s.email).toLowerCase())).slice(0, 24) };
}

// Llave del celu: «id.secreto». Se guarda solo la huella del secreto.
async function celu(request, env) {
  const m = /^Bearer\s+([A-Za-z0-9_-]{6,20})\.([A-Za-z0-9_-]{20,80})$/.exec(request.headers.get("Authorization") || "");
  if (!m) return null;
  const d = await env.SATELITE.get("dev:" + m[1], "json");
  if (!d || d.huella !== await sha256(m[2])) return null;
  return { id: m[1], ...d };
}

async function leerCuerpo(request, max = 200000) {
  const t = await request.text();
  if (t.length > max) throw new Error("grande");
  return t ? JSON.parse(t) : {};
}

export async function onRequest({ request, env, params }) {
  const accion = String(params.accion || "");
  if (!configurado(env)) return json({ error: "sin-configurar" }, 503);
  if (!env.SATELITE) return json({ error: "falta-buzon" }, 503);
  const KV = env.SATELITE;
  const metodo = request.method;

  // ---------- Desde el celu ----------
  if (accion === "vincular" && metodo === "POST") {
    // Freno a los intentos: 10 por IP cada 10 minutos.
    const ip = request.headers.get("CF-Connecting-IP") || "x";
    const kIp = "intentos:" + (await sha256(ip)).slice(0, 16);
    const n = Number(await KV.get(kIp) || 0);
    if (n >= 10) return json({ error: "muchos-intentos" }, 429);
    let c; try { c = await leerCuerpo(request, 2000); } catch (e) { return json({ error: "pedido" }, 400); }
    const codigo = String(c.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const par = codigo.length === 8 ? await KV.get("par:" + codigo, "json") : null;
    if (!par) { await KV.put(kIp, String(n + 1), { expirationTtl: 600 }); return json({ error: "codigo" }, 403); }
    await KV.delete("par:" + codigo);
    const id = idNuevo(), secreto = llaveNueva();
    const modelo = String(c.modelo || "").replace(/[^\w .,()+-]/g, "").slice(0, 40);
    await KV.put("dev:" + id, JSON.stringify({ u: par.u, huella: await sha256(secreto), nombre: par.nombre || "Celu", modelo, creado: Date.now(), visto: 0 }));
    return json({ llave: id + "." + secreto, nombre: par.nombre || "Celu" });
  }

  if (accion === "buzon" && metodo === "POST") {
    const d = await celu(request, env);
    if (!d) return json({ error: "llave" }, 401);
    let c; try { c = await leerCuerpo(request); } catch (e) { return json({ error: "pedido" }, 400); }
    const items = (Array.isArray(c.items) ? c.items : []).slice(0, MAX_ITEMS).map(limpiarItem).filter(Boolean);
    const ahora = Date.now();
    if (items.length) await KV.put("buz:" + d.u + ":" + ahora + "-" + idNuevo(), await cifrar(env, { dev: d.id, items }), { expirationTtl: DIAS30 });
    const alarma = Number(c.alarma) > ahora - 3600000 ? Number(c.alarma) : null;
    await KV.put("alarma:" + d.u, await cifrar(env, { ts: alarma, cuando: ahora, dev: d.id }), { expirationTtl: DIAS30 });
    await KV.put("dev:" + d.id, JSON.stringify({ u: d.u, huella: d.huella, nombre: d.nombre, modelo: d.modelo, creado: d.creado, visto: ahora, version: String(c.version || "").slice(0, 12) }));
    return json({ ok: true, recibidos: items.length });
  }

  // ---------- Desde Orbe ----------
  const yo = await usuario(request, env);
  if (yo.error) return yo.error;

  if (accion === "codigo" && metodo === "POST") {
    let c = {}; try { c = await leerCuerpo(request, 2000); } catch (e) { /* sin nombre */ }
    const codigo = codigoNuevo();
    const nombre = String(c.nombre || "Celu").replace(/[<>]/g, "").slice(0, 30);
    await KV.put("par:" + codigo, JSON.stringify({ u: yo.u, nombre }), { expirationTtl: 600 });
    return json({ codigo, vence: Date.now() + 600000 });
  }

  if (accion === "retirar" && metodo === "POST") {
    const lista = await KV.list({ prefix: "buz:" + yo.u + ":" });
    const tandas = [];
    for (const k of lista.keys.slice(0, 50)) {
      const v = await descifrar(env, await KV.get(k.name));
      if (v) tandas.push({ clave: k.name, ...v });
      else await KV.delete(k.name); // no se puede leer: no sirve guardarlo
    }
    const alarma = await descifrar(env, await KV.get("alarma:" + yo.u) || "");
    const devs = [];
    for (const k of (await KV.list({ prefix: "dev:" })).keys) {
      const d = await KV.get(k.name, "json");
      if (d && d.u === yo.u) devs.push({ id: k.name.slice(4), nombre: d.nombre, modelo: d.modelo, creado: d.creado, visto: d.visto, version: d.version || "" });
    }
    return json({ tandas, alarma, dispositivos: devs, ahora: Date.now() });
  }

  if (accion === "listo" && metodo === "POST") {
    let c; try { c = await leerCuerpo(request, 20000); } catch (e) { return json({ error: "pedido" }, 400); }
    const claves = (Array.isArray(c.claves) ? c.claves : []).filter((k) => typeof k === "string" && k.startsWith("buz:" + yo.u + ":")).slice(0, 100);
    for (const k of claves) await KV.delete(k);
    return json({ ok: true, borrados: claves.length });
  }

  if (accion === "anular" && metodo === "POST") {
    let c; try { c = await leerCuerpo(request, 2000); } catch (e) { return json({ error: "pedido" }, 400); }
    const id = String(c.id || "");
    const d = await KV.get("dev:" + id, "json");
    if (!d || d.u !== yo.u) return json({ error: "no-existe" }, 404);
    await KV.delete("dev:" + id);
    return json({ ok: true });
  }

  return json({ error: "ruta" }, 404);
}
