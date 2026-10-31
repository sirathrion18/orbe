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

// Vive en una sola clave del KV («amor:doc»). El 31/10 se probó guardar cada cosa en su clave («amor2:…»),
// pero en el plan gratis de Cloudflare listar claves tiene un cupo diario chico; se volvió al documento único.
// Si «amor:doc» no está (porque ese intento lo movió), se rearma una sola vez desde esas claves o el respaldo.
const P = "amor2:";
const vacio = () => ({ super: [], menu: {}, items: [], rev: 0, cuando: 0 });
export async function leerDoc(env) {
  const kv = env.SATELITE;
  const d = await kv.get(CLAVE, "json");
  if (d) return d;
  const r = await kv.list({ prefix: P }).catch(() => ({ keys: [] }));
  const resp = await kv.get("amor:doc-respaldo", "json");
  if (!r.keys.length) return resp || vacio();
  const n = { ...vacio(), gastro: resp?.gastro || null };
  await Promise.all(r.keys.map(async (k) => {
    let v = k.metadata;
    if (!v) return;
    if (v.grande) v = await kv.get(k.name, "json");
    if (!v) return;
    const c = k.name.slice(P.length);
    if (c.startsWith("s:")) n.super.push(v);
    else if (c.startsWith("m:")) n.menu[c.slice(2)] = v.v;
    else if (c.startsWith("i:")) n.items.push(v);
    else if (c === "g") n.gastro = v;
  }));
  n.super.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  n.rev = (resp?.rev || 0) + 1; n.cuando = Date.now();
  await kv.put(CLAVE, JSON.stringify(n));
  return n;
}
async function guardarDoc(env, d) { d.rev = (d.rev || 0) + 1; d.cuando = Date.now(); await env.SATELITE.put(CLAVE, JSON.stringify(d)); return d; }

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
  const d = await leerDoc(env);
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
  return guardarDoc(env, d);
}

// La primera vez: Nacho trae lo que ya tenía (su súper, su menú y la hoja AGUS). Solo si todavía no hay nada.
export async function importar(env, doc) {
  const d = await leerDoc(env);
  if (d.items.length || d.super.length || Object.values(d.menu).some(Boolean)) return { d, importado: false };
  d.super = (doc.super || []).slice(0, 150).map((x) => ({ id: id(), t: txt(x.t, 80), ok: !!x.ok })).filter((x) => x.t);
  d.menu = Object.fromEntries(Object.entries(doc.menu || {}).filter(([k]) => /^[0-6]$/.test(k)).map(([k, v]) => [k, txt(v, 80)]));
  d.items = (doc.items || []).slice(0, 400).map(item).filter((x) => x.titulo);
  return { d: await guardarDoc(env, d), importado: true };
}
// Lo que ve Agus: todo el documento (no tiene nada más). Se manda igual a los dos.
export const paraVer = (d) => ({ super: d.super, menu: d.menu, items: d.items, gastro: d.gastro || null, rev: d.rev, cuando: d.cuando });
