// Promos de la semana: las busca Claude en la web cada lunes (tarea programada) y las deja en tu Drive
// como «Orbe · promos · AAAA-MM-DD.json». Orbe lee la más nueva. Solo datos públicos: bancos, billeteras y comercios.
// Las promos viejas de tu planilla (ALIAS CBU) ya no se usan.
import { leer, guardar, sesion } from "./almacen.js";
import { api, permisos, pedirPase } from "./google.js";
import { esc } from "./inicio.js";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const datosPromos = () => leer("promosWeb");

export async function leerPromos(forzar = false) {
  if (!permisos().drive) return false;
  const previa = datosPromos();
  if (!forzar && previa?.cuando && Date.now() - previa.cuando < 3 * 3600000) return false;
  const q = encodeURIComponent("name contains 'Orbe · promos' and mimeType != 'application/vnd.google-apps.folder' and trashed = false");
  const r = await api(DRIVE + "?fields=files(id,name,createdTime,modifiedTime)&orderBy=createdTime%20desc&pageSize=1&q=" + q);
  const f = r.files?.[0];
  if (!f) return false;
  if (previa?.archivo === f.id && previa.mod === f.modifiedTime) { guardar("promosWeb", { ...previa, cuando: Date.now() }, true); return false; }
  const t = await (await fetch(DRIVE + "/" + f.id + "?alt=media", { headers: { Authorization: "Bearer " + await pedirPase() } })).text();
  let j; try { j = JSON.parse(t); } catch (e) { return false; }
  const txt = (v, n) => String(v ?? "").slice(0, n);
  const lista = (Array.isArray(j?.promos) ? j.promos : []).slice(0, 80).map((p) => ({
    dias: Array.isArray(p.dias) ? p.dias.map(Number).filter((d) => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6],
    pct: txt(p.pct, 12), comercio: txt(p.comercio, 60), medio: txt(p.medio, 60), detalle: txt(p.detalle, 160),
    estado: p.estado === "a confirmar" ? "a confirmar" : "confirmado", hasta: /^\d{4}-\d{2}-\d{2}$/.test(p.hasta || "") ? p.hasta : null,
    super: !!p.super, fuente: /^https:\/\//.test(p.fuente || "") ? txt(p.fuente, 300) : ""
  })).filter((p) => p.comercio && p.pct);
  guardar("promosWeb", { cuando: Date.now(), archivo: f.id, mod: f.modifiedTime, fecha: txt(j?.actualizado || f.createdTime.slice(0, 10), 10), lista }, true);
  return true;
}

const vigente = (p, hoyIso) => !p.hasta || p.hasta >= hoyIso;
const fila = (p, conDia) => `<div class="pr"><span class="pc">${esc(p.pct)}</span><b>${esc(conDia ? conDia + " · " + p.medio : p.comercio)}</b>
    <small><span class="pr-tag ${p.estado === "confirmado" ? "ok" : "av"}">${esc(p.estado)}</span>${esc(conDia ? p.detalle : p.medio + (p.detalle ? " · " + p.detalle : ""))}${p.hasta ? " · hasta el " + esc(p.hasta.slice(8, 10) + "/" + p.hasta.slice(5, 7)) : ""}${p.fuente ? ` · <a href="${esc(p.fuente)}" target="_blank" rel="noopener">fuente</a>` : ""}</small></div>`;

export function bloquePromos(fecha) {
  const d = datosPromos();
  const hoyIso = fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0") + "-" + String(fecha.getDate()).padStart(2, "0");
  if (!d?.lista?.length) return `<section class="bloque promos-web"><h2>Promos</h2><p class="vacio">Todavía no hay promos buscadas. Las busca Claude en la web los lunes a la mañana y aparecen acá.</p></section>`;
  const sel = sesion("promosDia");
  const dia = sel != null && sel >= 0 && sel <= 6 ? Number(sel) : fecha.getDay();
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const lista = d.lista.filter((p) => vigente(p, hoyIso));
  const delDia = lista.filter((p) => p.dias.includes(dia)).sort((a, b) => parseFloat(b.pct.replace(/[^\d.]/g, "")) - parseFloat(a.pct.replace(/[^\d.]/g, "")));
  const sup = lista.filter((p) => p.super);
  const nomSuper = sup[0]?.comercio || "el súper";
  const diaTxt = (p) => p.dias.length === 7 ? "Todos los días" : p.dias.length === 5 && [1, 2, 3, 4, 5].every((x) => p.dias.includes(x)) ? "Lunes a viernes" : orden.filter((x) => p.dias.includes(x)).map((x) => DIAS_LARGOS[x]).join(", ").replace(/^./, (c) => c.toUpperCase());
  return `<section class="bloque promos-web"><div class="pr-cab"><h2>Promos ${dia === fecha.getDay() ? "de hoy" : "del " + DIAS_LARGOS[dia]}</h2><span class="pr-al">al ${esc(d.fecha.slice(8, 10) + "/" + d.fecha.slice(5, 7))}</span></div>
    <div class="pr-dias" role="tablist">${orden.map((x) => `<button role="tab" aria-selected="${x === dia}" class="${x === dia ? "on" : ""}" data-accion="promos-dia" data-d="${x}">${DIAS[x]}</button>`).join("")}</div>
    ${delDia.length ? delDia.map((p) => fila(p)).join("") : '<p class="vacio">Ese día no encontré promos con tus bancos y billeteras.</p>'}
    ${sup.length ? `<div class="pr-super"><span class="pr-k">Para tu súper (${esc(nomSuper)}), la semana</span>${sup.map((p) => fila(p, diaTxt(p))).join("")}</div>` : ""}
    <p class="fuente-dato">Solo con lo que tenés (BNA+, Mercado Pago, Personal Pay, Cuenta DNI, Ciudad, Naranja X y Ualá). Se buscan en la web los lunes; cada una dice de dónde salió. Antes de pagar, mirá la app del banco: pueden cambiar sin aviso.</p></section>`;
}
