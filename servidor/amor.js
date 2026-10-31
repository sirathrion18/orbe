// Amorcitos compartido: lo que editan Nacho y Agus (súper, menú, planes, pelis) más lo que Agus solo mira
// (cuenta regresiva, vuelos y docs). Vive en el KV de Cloudflare, aparte de la planilla de Nacho:
// Agus nunca toca los datos de Google de Nacho, y Nacho no le abre nada más que esto.
import { descifrar, leerCookie, COOKIE, mailPermitido, cifrar } from "./sesion.js";

export const COOKIE_AMOR = "__Host-amor";
const NOVENTA_DIAS = 90 * 24 * 3600;
export const cookieAmor = (v) => `${COOKIE_AMOR}=${encodeURIComponent(v)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${NOVENTA_DIAS}`;
export const borrarAmor = () => `${COOKIE_AMOR}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
const CLAVE = "amor:doc";
const TIPOS = ["plan", "peli", "serie", "fecha", "viaje", "vuelo", "doc", "lugar", "salida"];
const TIPOS_AGUS = ["plan", "peli", "serie", "salida"];
const CATS = ["recital", "concierto", "jazz", "teatro", "feria", "cine", "museo", "otro"];

// ¿Quién es? Nacho (con su sesión de Orbe o la de Amorcitos) o Agus (solo con la de Amorcitos).
export async function quien(request, env) {
  const o = leerCookie(request, COOKIE);
  if (o) { const s = await descifrar(env, o); if (s?.email && await mailPermitido(s.email)) return { rol: "nacho" }; }
  const a = leerCookie(request, COOKIE_AMOR);
  if (a) {
    const s = await descifrar(env, a);
    if (s?.amor && s.email) {
      if (await mailPermitido(s.email)) return { rol: "nacho" };
      if (esAgus(env, s.email)) return { rol: "agus" };
    }
  }
  return null;
}
export const esAgus = (env, mail) => !!env.AGUS_MAIL && String(env.AGUS_MAIL).trim().toLowerCase() === String(mail || "").trim().toLowerCase();
export const sesionAmor = (env, email) => cifrar(env, { amor: true, email, desde: Date.now() });

// Cómo se guarda: cada cosa en su propia clave (cada ítem del súper, cada día del menú, cada plan…).
// Antes era un solo documento, y si los dos tocaban casi a la vez, uno podía pisar lo del otro
// (el KV de Cloudflare tarda hasta un minuto en mostrar lo último en todos lados). Ahora cada cambio
// escribe solo lo suyo: nada se pisa, como mucho tarda unos segundos en verse del otro lado.
const P = "amor2:";
const vacio = () => ({ super: [], menu: {}, items: [], rev: 0, cuando: 0 });
const claves = (d) => {
  const m = new Map();
  (d.super || []).forEach((x) => m.set(P + "s:" + x.id, x));
  Object.entries(d.menu || {}).forEach(([k, v]) => { if (v) m.set(P + "m:" + k, { v }); });
  (d.items || []).forEach((x) => m.set(P + "i:" + x.id, x));
  if (d.gastro) m.set(P + "g", d.gastro);
  return m;
};
async function escribir(env, k, v) {
  const j = JSON.stringify(v);
  // Lo chico viaja en la «metadata» (se lee todo de una sola vez); lo grande, como valor aparte.
  if (j.length < 900) await env.SATELITE.put(k, "1", { metadata: v });
  else await env.SATELITE.put(k, j, { metadata: { grande: 1 } });
}
export async function leerDoc(env) {
  const kv = env.SATELITE, todo = [];
  let cursor;
  do { const r = await kv.list({ prefix: P, cursor }); todo.push(...r.keys); cursor = r.list_complete ? null : r.cursor; } while (cursor);
  if (!todo.length) {
    // Primera vez con el sistema nuevo: se pasa lo que había en el documento viejo (que queda de respaldo).
    const viejo = await kv.get(CLAVE, "json");
    const d = viejo || vacio();
    for (const [k, v] of claves(d)) await escribir(env, k, v);
    await kv.put(P + "x", "1", { metadata: { migrado: Date.now() } });
    if (viejo) { await kv.put("amor:doc-respaldo", JSON.stringify(viejo)); await kv.delete(CLAVE); }
    return { ...vacio(), ...d };
  }
  const d = vacio();
  await Promise.all(todo.map(async (k) => {
    let v = k.metadata;
    if (!v) return;
    if (v.grande) v = await kv.get(k.name, "json");
    if (!v) return;
    const n = k.name.slice(P.length);
    if (n.startsWith("s:")) d.super.push(v);
    else if (n.startsWith("m:")) d.menu[n.slice(2)] = v.v;
    else if (n.startsWith("i:")) d.items.push(v);
    else if (n === "g") d.gastro = v;
  }));
  d.super.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  d.items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  d.rev = todo.length; d.cuando = Date.now();
  return d;
}
// Escribe solo lo que cambió entre «antes» y «d», y borra lo que ya no está.
async function guardarDoc(env, d, antes) {
  const a = claves(antes || vacio()), n = claves(d);
  const tareas = [];
  for (const [k, v] of n) if (JSON.stringify(a.get(k)) !== JSON.stringify(v)) tareas.push(escribir(env, k, v));
  for (const k of a.keys()) if (!n.has(k)) tareas.push(env.SATELITE.delete(k));
  await Promise.all(tareas);
  d.rev = (d.rev || 0) + 1; d.cuando = Date.now();
  return d;
}

const txt = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fechaOk = (f) => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(String(f || "")) ? String(f) : "";
const urlOk = (u) => /^https:\/\/[^\s"<>]+$/.test(String(u || "")) ? String(u).slice(0, 400) : "";
function item(x) {
  const tipo = TIPOS.includes(x.tipo) ? x.tipo : "plan";
  const o = { id: txt(x.id, 20) || id(), tipo, titulo: txt(x.titulo, 120), fecha: fechaOk(x.fecha), nota: txt(x.nota, 160), hecho: !!x.hecho, url: urlOk(x.url) };
  if (tipo === "lugar") {
    const la = Number(x.lat), lo = Number(x.lon);
    Object.assign(o, { pais: txt(x.pais, 40), iso: /^\d{3}$/.test(String(x.iso || "")) ? String(x.iso) : "", lat: la >= -90 && la <= 90 ? Math.round(la * 1e4) / 1e4 : 0, lon: lo >= -180 && lo <= 180 ? Math.round(lo * 1e4) / 1e4 : 0 });
  }
  if (tipo === "salida") Object.assign(o, { cat: CATS.includes(x.cat) ? x.cat : "otro", veces: Math.max(1, Math.min(99, Math.round(Number(x.veces) || 1))) });
  return o;
}

// Cada cambio es una operación chiquita que se aplica sobre lo último guardado: si los dos tocan a la vez, no se pisan.
export async function aplicar(env, rol, op) {
  const d = await leerDoc(env), antes = JSON.parse(JSON.stringify(d));
  const t = op?.t;
  if (t === "super-sumar") { const s = txt(op.texto, 80); if (!s) throw new Error("vacio"); d.super.push({ id: id(), t: s, ok: false }); if (d.super.length > 150) d.super.splice(0, d.super.length - 150); }
  else if (t === "super-tilde") { const x = d.super.find((i) => i.id === op.id); if (x) x.ok = !!op.ok; }
  else if (t === "super-borrar") d.super = d.super.filter((i) => i.id !== op.id);
  else if (t === "super-limpiar") d.super = d.super.filter((i) => !i.ok);
  else if (t === "menu") { const dia = Number(op.dia); if (!(dia >= 0 && dia <= 6)) throw new Error("dia"); d.menu[dia] = txt(op.texto, 80); }
  else if (t === "item-sumar") {
    const x = item(op.item || {});
    if (!x.titulo) throw new Error("vacio");
    if (rol === "agus" && !TIPOS_AGUS.includes(x.tipo)) throw new Error("permiso");
    d.items.push(x); if (d.items.length > 400) throw new Error("lleno");
  }
  else if (t === "item-mas") {
    const x = d.items.find((i) => i.id === op.id && i.tipo === "salida");
    if (x) x.veces = Math.max(1, Math.min(99, (x.veces || 1) + (op.menos ? -1 : 1)));
  }
  // Solo Nacho: los viajes y salidas de arranque (desde su Drive) y la lista de Gastronomía (de su doc).
  else if (t === "sembrar") {
    if (rol !== "nacho") throw new Error("permiso");
    const ya = new Set(d.items.map((i) => i.tipo + "|" + i.titulo.toLowerCase()));
    [...(op.lugares || []).map((x) => ({ ...x, tipo: "lugar" })), ...(op.salidas || []).map((x) => ({ ...x, tipo: "salida" }))].slice(0, 300).forEach((x) => {
      const it = item(x); if (it.titulo && !ya.has(it.tipo + "|" + it.titulo.toLowerCase())) { d.items.push(it); ya.add(it.tipo + "|" + it.titulo.toLowerCase()); }
    });
  }
  else if (t === "gastro") {
    if (rol !== "nacho") throw new Error("permiso");
    const lista = (op.lista || []).slice(0, 400).map((g) => ({ rubro: txt(g.rubro, 40), nombre: txt(g.nombre, 80), puntaje: Number(g.puntaje) >= 0 && Number(g.puntaje) <= 5 ? Number(g.puntaje) : null, lugar: txt(g.lugar, 60), porIr: !!g.porIr, afuera: !!g.afuera })).filter((g) => g.nombre);
    d.gastro = { cuando: Date.now(), firma: txt(op.firma, 40), lista };
  }
  // Corregir un ítem (título, fecha, nota; en salidas también qué fue y cuántas veces). El tipo no cambia.
  else if (t === "item-editar") {
    const i = d.items.findIndex((x) => x.id === op.id);
    if (i < 0) return d;
    const x = d.items[i];
    if (rol === "agus" && !TIPOS_AGUS.includes(x.tipo)) throw new Error("permiso");
    const c = op.cambios || {}, sirve = {};
    ["titulo", "fecha", "nota", "cat", "veces"].forEach((k) => { if (c[k] !== undefined) sirve[k] = c[k]; });
    const nuevo = item({ ...x, ...sirve, id: x.id, tipo: x.tipo });
    if (!nuevo.titulo) throw new Error("vacio");
    d.items[i] = { ...x, ...nuevo };
  }
  else if (t === "item-tilde" || t === "item-borrar") {
    const x = d.items.find((i) => i.id === op.id);
    if (!x) return d;
    if (rol === "agus" && !TIPOS_AGUS.includes(x.tipo)) throw new Error("permiso");
    if (t === "item-tilde") x.hecho = !!op.hecho; else d.items = d.items.filter((i) => i.id !== op.id);
  }
  else throw new Error("op");
  return guardarDoc(env, d, antes);
}

// La primera vez: Nacho trae lo que ya tenía (su súper, su menú y la hoja AGUS). Solo si todavía no hay nada.
export async function importar(env, doc) {
  const d = await leerDoc(env), antes = JSON.parse(JSON.stringify(d));
  if (d.items.length || d.super.length || Object.values(d.menu).some(Boolean)) return { d, importado: false };
  d.super = (doc.super || []).slice(0, 150).map((x) => ({ id: id(), t: txt(x.t, 80), ok: !!x.ok })).filter((x) => x.t);
  d.menu = Object.fromEntries(Object.entries(doc.menu || {}).filter(([k]) => /^[0-6]$/.test(k)).map(([k, v]) => [k, txt(v, 80)]));
  d.items = (doc.items || []).slice(0, 400).map(item).filter((x) => x.titulo);
  return { d: await guardarDoc(env, d, antes), importado: true };
}
// Lo que ve Agus: todo el documento (no tiene nada más). Se manda igual a los dos.
export const paraVer = (d) => ({ super: d.super, menu: d.menu, items: d.items, gastro: d.gastro || null, rev: d.rev, cuando: d.cuando });
