// Detalles: las páginas a las que lleva cada número de Inicio, BNA y Finanzas.
//   #/d/sueldo         Tu sueldo, recibo por recibo (hoja MES + bonos leídos de Drive).
//   #/d/plata          Plata a fondo: cómo se arma el diario, paso por paso.
//   #/d/productividad  Tu productividad mes a mes (solo tu fila).
//   #/d/escalafon      Escalafón y aumentos: conformados, tu cargo y el Día del Bancario.
//   #/d/dolares        Tu sueldo en dólares: cada recibo desde 2020, a dólares de su mes y a pesos de hoy.
// Nada se inventa: si falta un dato, se dice cuál y cómo cargarlo.
import { leer } from "./almacen.js";
import { ICONOS } from "./iconos.js";
import { esc } from "./inicio.js";
import { MESES, DIAS, bloquesFecha } from "./contexto.js";
import { datosFinanzas } from "./finanzas.js";
import { datosBonos } from "./recibos.js";
import { presupuesto } from "./presupuesto.js";
import { discrepancia, ultimoControl, totalControl } from "./saldo.js";
import { linkEconomia } from "./economia.js";
import { linkHoja } from "./hoja.js";
import { datosProd, historial, mesesConDatos, isoHoy } from "./productividad.js";
import { datosEsc, conformadoDe, cargoEn, tuCargo, proximoCargo, grillaVsRecibo, estimadoNeto } from "./escalafon.js";
import { permisos } from "./google.js";
import { activa as sincroActiva } from "./sincro.js";
import { renderDolares } from "./sueldousd.js";

// A qué universo pertenece cada detalle (para el PIN o la huella).
export const DETALLE_UNI = { dolares: "bna", sueldo: "bna", productividad: "bna", escalafon: "bna", plata: "finanzas" };

const may = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const pct1 = (x) => (Math.round(x * 10) / 10).toLocaleString("es-AR", { maximumFractionDigits: 1 });
const f1 = (x) => (Math.round(x * 10) / 10).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const mesLargo = (clave, conAnio) => { const [y, m] = clave.split("-").map(Number); return MESES[m - 1] + (conAnio ? " " + y : ""); };
const mesCorto = (clave) => MESES[Number(clave.slice(5, 7)) - 1].slice(0, 3);
const volverA = (uni, nombre) => `<a class="volver" href="#/u/${uni}">${ICONOS.volver} ${nombre}</a>`;
const flecha = (d, chica) => d == null || !Number.isFinite(d) ? "" : `<span class="${d >= 0 ? "dt-sube" : "dt-baja"}${chica ? " chica" : ""}">${d >= 0 ? "▲" : "▼"} ${pct1(Math.abs(d))}%</span>`;
const falta = (titulo, texto, extra = "") => `<section class="bloque"><h2>${titulo}</h2><p class="vacio">${texto}</p>${extra}</section>`;

function pesos() {
  const oculto = leer("plataOculta", false);
  const $ = (n) => oculto ? "••••" : (n < 0 ? "−" : "") + "$ " + Math.round(Math.abs(n)).toLocaleString("es-AR");
  return { $, oculto };
}

export function renderDetalle(id, datos, ctx) {
  const f = { sueldo, plata, productividad, escalafon, dolares: renderDolares }[id];
  if (!f) return `<div class="pagina"><a class="volver" href="#/">${ICONOS.volver} Inicio</a><h1>No existe</h1><p class="bajada">Ese detalle no existe.</p></div>`;
  return `<div class="pagina detalle">${f(datos, ctx)}</div>`;
}

// ---------- Tu sueldo ----------
// Cada fila de la hoja MES es el mes en que se vive con un recibo (el de octubre se cobra a fin de mes y se vive en noviembre).
// Orbe la escribe como «Recibo 10/2026: neto $X − talón $Y (leído por Orbe)»; si la cargaste a mano, solo tiene el disponible.
export function recibosTodos() {
  const num = (re, t) => { const m = re.exec(t || ""); return m ? Number(m[1].replace(/\./g, "")) : null; };
  const bonos = datosBonos() || {};
  const filas = (datosFinanzas()?.meses || []).map((m) => {
    const r = /Recibo (\d{1,2})\/(\d{4})/i.exec(m.fuente || "");
    const bs = bonos[m.mes] || [];
    return { clave: m.mes, recibo: r ? r[2] + "-" + r[1].padStart(2, "0") : null, neto: num(/neto \$\s?([\d.]+)/i, m.fuente), talon: num(/tal[oó]n \$\s?([\d.]+)/i, m.fuente),
      disponible: m.disponible, bonos: bs, bono: bs.reduce((s, b) => s + (b.neto || 0), 0), fuente: m.fuente || "" };
  });
  // Bonos de un mes que todavía no tiene fila en MES.
  Object.entries(bonos).forEach(([clave, bs]) => {
    if (!filas.some((f) => f.clave === clave) && bs.length) filas.push({ clave, recibo: null, neto: null, talon: null, disponible: null, bonos: bs, bono: bs.reduce((s, b) => s + (b.neto || 0), 0), fuente: "" });
  });
  return filas.sort((a, b) => a.clave.localeCompare(b.clave));
}

function sueldo() {
  const { $, oculto } = pesos();
  const cab = `${volverA("bna", "BNA")}<h1>Tu sueldo</h1><p class="bajada">Todos tus recibos, del primero al último. Tocá un mes para verlo desarmado.</p>`;
  const rs = recibosTodos();
  if (!rs.length) {
    const como = !permisos().drive ? "Dale permiso de Drive en Ajustes y guardá los PDF del recibo en tu carpeta BNA/AAAA: Orbe los lee solo."
      : "Todavía no encontré recibos. Guardá los PDF en tu carpeta BNA/AAAA de Drive (los bonos, en una subcarpeta, por ejemplo BNA/2026/Bonos) y tocá «Actualizar todo».";
    return cab + falta("Sin recibos todavía", esc(como), '<div class="chips" style="margin-top:12px"><button class="chip" data-accion="actualizar-todo">Actualizar todo</button></div>');
  }
  const conNeto = rs.filter((r) => r.neto);
  const ult = conNeto[conNeto.length - 1], prev = conNeto[conNeto.length - 2];
  const mesDe = (r) => r.recibo || r.clave;
  let hero = "";
  if (ult) {
    const vsPrev = prev ? (ult.neto / prev.neto - 1) * 100 : null;
    const anio = mesDe(ult).slice(0, 4);
    const primero = conNeto.find((r) => mesDe(r).startsWith(anio));
    const vsAnio = primero && primero !== ult ? (ult.neto / primero.neto - 1) * 100 : null;
    hero = `<p class="k-dt">Neto de ${mesLargo(mesDe(ult))}</p><p class="dt-big">${$(ult.neto)}</p>
      <p class="dt-var">${vsPrev != null ? `${flecha(vsPrev)} <span>contra ${mesLargo(mesDe(prev))}</span>` : ""}</p>${vsAnio != null ? `<p class="dt-var" style="margin-top:2px">${flecha(vsAnio, true)} <span>en el año (desde ${mesLargo(mesDe(primero))})</span></p>` : ""}
      ${ult.bono ? `<p class="fuente-dato" style="margin-top:4px">Más ${$(ult.bono)} de ${ult.bonos.length === 1 ? "un bono" : ult.bonos.length + " bonos"} con recibo aparte.</p>` : ""}`;
  } else hero = `<p class="k-dt">Disponible de ${mesLargo(rs[rs.length - 1].clave)}</p><p class="dt-big">${$(rs[rs.length - 1].disponible || 0)}</p>`;

  // Barras: lo que te queda (neto − talón), el talón y los bonos. Los últimos 12.
  const ult12 = rs.slice(-12);
  const tot = (r) => (r.neto ?? r.disponible ?? 0) + r.bono;
  const max = Math.max(...ult12.map(tot), 1);
  const alto = 112;
  const h = (v) => Math.max(0, Math.round((v || 0) / max * alto));
  const barras = oculto ? "" : `<div class="dt-barras" role="img" aria-label="Tus últimos ${ult12.length} recibos: lo que te queda, el talón y los bonos">${ult12.map((r) => {
    const queda = r.neto != null ? r.neto - (r.talon || 0) : r.disponible || 0;
    return `<div class="dt-col"><div class="dt-pila" style="height:${alto}px">${r.bono ? `<i class="bo" style="height:${h(r.bono)}px"></i>` : ""}${r.talon ? `<i class="ta" style="height:${h(r.talon)}px"></i>` : ""}<i class="qu" style="height:${h(queda)}px"></i></div><span>${mesCorto(mesDe(r))}</span></div>`;
  }).join("")}</div>
    <p class="dt-ley"><span><i class="qu"></i>te queda</span><span><i class="ta"></i>talón (préstamo y otros)</span>${ult12.some((r) => r.bono) ? '<span><i class="bo"></i>bonos</span>' : ""}</p>`;

  // La lista: del más nuevo al más viejo, cada uno desarmado al tocarlo.
  const lista = rs.slice().reverse().map((r, i, arr) => {
    const ant = arr.slice(i + 1).find((x) => x.neto);
    const d = r.neto && ant ? (r.neto / ant.neto - 1) * 100 : null;
    const titulo = r.recibo ? may(mesLargo(r.recibo, r.recibo.slice(0, 4) !== String(new Date().getFullYear()))) : "Para vivir en " + mesLargo(r.clave, true);
    const sub = [r.recibo ? "se vive en " + mesLargo(r.clave) : "cargado a mano", r.bonos.length ? (r.bonos.length === 1 ? "con bono" : r.bonos.length + " bonos") : ""].filter(Boolean).join(" · ");
    const renglon = (a, v, n) => `<li><span>${a}${n ? `<br><small class="vacio">${n}</small>` : ""}</span><span class="der">${v}</span></li>`;
    return `<details class="dt-mes"><summary><span class="dt-m">${esc(titulo)}<small>${esc(sub)}</small></span><span class="dt-v">${r.neto != null ? $(r.neto) : r.disponible != null ? $(r.disponible) : $(r.bono)}${d != null ? `<small>${flecha(d, true)}</small>` : ""}</span><span class="dt-ch" aria-hidden="true">›</span></summary>
      <ul class="lista">${r.neto != null ? renglon("Neto del recibo", $(r.neto), "lo que depositan") : ""}
        ${r.talon != null ? renglon("Talón complementario", "− " + $(r.talon), "préstamo y otros descuentos que se cobran aparte") : ""}
        ${r.disponible != null ? renglon("Te queda del sueldo", $(r.disponible), r.neto != null ? "neto − talón" : "lo cargaste en la hoja MES") : ""}
        ${r.bonos.map((b) => renglon("Bono", "+ " + $(b.neto || 0), esc(b.archivo || "recibo aparte"))).join("")}
        ${r.bono && r.neto != null ? renglon("Cobrado en total", $(r.neto + r.bono), "neto + bonos") : ""}</ul>
      <p class="fuente-dato">${r.fuente ? "De la hoja MES de tu planilla: «" + esc(r.fuente) + "»." : "Solo bonos: el recibo del sueldo de este mes todavía no está."}</p></details>`;
  }).join("");

  return `${cab}<section class="bloque dt-hero">${hero}${barras}</section>
    <section class="bloque dt-lista-meses">${lista}</section>
    <p class="fuente-dato">Orbe lee los PDF de tu carpeta BNA en Drive (y los bonos de sus subcarpetas) y los anota en las hojas MES y BONOS de tu planilla. Solo tus números.</p>
    <div class="chips" style="margin-top:12px"><a class="chip" href="#/d/dolares">En dólares, desde 2020 ›</a><a class="chip" href="#/d/escalafon">Escalafón y aumentos ›</a>${linkHoja() ? `<a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Abrir la planilla</a>` : ""}</div>`;
}

// ---------- Plata a fondo ----------
function plata(datos, ctx) {
  const { $ } = pesos();
  const cab = `${volverA("finanzas", "Finanzas")}<h1>Plata a fondo</h1><p class="bajada">Cómo sale lo que podés gastar hoy, paso por paso, y de dónde viene cada número.</p>`;
  if (!datosFinanzas()) return cab + falta("Falta activar Finanzas", "Activá la sincronización y las finanzas en Ajustes: Orbe lee tu planilla y tus mails del BNA y Mercado Pago.", '<div class="chips" style="margin-top:12px"><a class="chip" href="#/ajustes">Ir a Ajustes</a></div>');
  const b = presupuesto(ctx.fecha);
  const p = b.p;
  const dm = (d) => d.getDate() + "/" + (d.getMonth() + 1);
  if (b.total == null) return cab + falta("Falta tu planilla de " + esc(p.nombre), "El período va del " + dm(p.inicio) + " al " + dm(p.fin) + ". Cargá ese mes en tu planilla ECONOMÍA (ingresos y egresos) y el diario sale solo.",
    linkEconomia() ? `<div class="chips" style="margin-top:12px"><a class="chip" href="${esc(linkEconomia())}" target="_blank" rel="noopener">Abrir ECONOMÍA</a></div>` : "");
  const r = b.real;
  const fuente = (t, href, ext) => href ? `<a class="dt-fuente" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t} ›</a>` : `<span class="dt-fuente">${t}</span>`;
  const eco = linkEconomia();
  const pasos = [];
  // 1. Lo que entra
  const ing = r?.ingreso || (b.ingreso?.monto != null ? { monto: b.ingreso.monto, fuente: b.ingreso.fuente, estado: b.ingreso.propuesta ? "estimado" : "real" } : null);
  pasos.push({ t: "Lo que entra", v: ing ? $(ing.monto) : "falta", n: ing ? (ing.estado === "real" ? "Del " + esc(String(ing.fuente || "recibo").toLowerCase()) + (ing.bonos ? ", con el bono" : "") : ing.recibo ? "De tu planilla: los recibos dicen " + $(ing.recibo) + " (¿falta subir un bono?)" : "Estimado: " + esc(ing.fuente || "tu planilla")) : "Cargá el ingreso en ECONOMÍA o confirmalo en Finanzas.",
    f: fuente("Tu sueldo", "#/d/sueldo") });
  if (r) {
    const esTarjeta = (fl) => /master|visa|tarjeta|\btc\b/i.test(fl.concepto);
    const fijos = r.filas.filter((fl) => !esTarjeta(fl)), tarj = r.filas.filter(esTarjeta);
    const suma = (l) => l.reduce((s, fl) => s + (fl.real || 0), 0);
    const items = (l) => `<ul class="dt-items">${l.slice().sort((a, c) => (c.real || 0) - (a.real || 0)).map((fl) => `<li><span>${esc(fl.concepto)}<small>${esc(fl.estado)} · ${esc(fl.fuente)}${fl.nota ? " · " + esc(fl.nota) : ""}</small></span><b>${$(fl.real || 0)}</b></li>`).join("")}</ul>`;
    pasos.push({ t: "Lo que se va sí o sí", v: "− " + $(suma(fijos)), n: `${fijos.length} renglones de tu ECONOMÍA, cada uno con su número real cuando lo hay (recibo, DIVISIÓN, mails, lo que marcaste).`, extra: items(fijos), f: fuente("Tu planilla ECONOMÍA", eco, true) });
    if (tarj.length) pasos.push({ t: "Tarjetas", v: "− " + $(suma(tarj)), n: "Lo que pagás de cada resumen este período (o lo que pensás pagar, hasta que llegue el pago).", extra: items(tarj), f: fuente("Finanzas › Mes", "#/u/finanzas?tab=mes") });
    pasos.push({ t: `Colchón · ${r.pct}%`, v: "− " + $(r.colchon - r.usado), n: r.usado ? `Apartás ${$(r.colchon)} para imprevistos y ya usaste ${$(r.usado)}, que vuelven al día a día.` : `Se aparta antes del diario, para imprevistos. Si lo necesitás, lo usás desde Finanzas › Mes.`, f: fuente("Finanzas › Mes", "#/u/finanzas?tab=mes") });
  } else {
    pasos.push({ t: "Egresos de tu planilla", v: "− " + $(b.total), n: "El TOTAL de " + esc(p.nombre) + " en ECONOMÍA (todavía sin el mes real de Orbe).", f: fuente("Tu planilla ECONOMÍA", eco, true) });
  }
  if (b.tarjetaAnterior) pasos.push({ t: "Tarjeta que ya contaste", v: "+ " + $(b.tarjetaAnterior), n: "Compras con tarjeta del período anterior que ya pesaron en aquel diario: vienen dentro del resumen que pagás ahora, así que se devuelven." });
  pasos.push({ t: "Para el día a día", v: b.base != null ? $(b.base) : "—", n: `Lo que queda para ${p.dias} días, del ${dm(p.inicio)} al ${dm(p.fin)}.`, fuerte: true });
  if (b.base != null) {
    pasos.push({ t: "Ya gastaste", v: "− " + $(b.gastoAntes), n: `Del ${dm(p.inicio)} hasta ayer, en el día a día (de lo compartido, tu mitad). Los fijos y los pases entre tus cuentas no cuentan acá.`, f: fuente("Finanzas › Mes", "#/u/finanzas?tab=mes") });
    pasos.push({ t: "El diario de hoy", v: b.diario != null ? $(b.diario) : "—", n: `Lo que quedaba al empezar el día, repartido en los ${p.restantes} ${p.restantes === 1 ? "día que falta" : "días que faltan"} (hoy incluido).`, fuerte: true });
    pasos.push({ t: "Hoy", v: b.quedaHoy != null ? (b.quedaHoy < 0 ? "te pasaste " + $(-b.quedaHoy) : "te quedan " + $(b.quedaHoy)) : "—", n: `Gastaste ${$(b.gastoHoy)} hoy. Hasta el ${dm(p.fin)} te quedan ${$(b.queda)}.`, f: fuente("Finanzas › Hoy", "#/u/finanzas?tab=hoy") });
  }
  const lis = pasos.map((x, i) => `<li class="dt-paso ${x.fuerte ? "fuerte" : ""}"><span class="dt-n">${i + 1}</span><div class="dt-cuerpo"><div class="dt-fila"><b>${x.t}</b><span class="dt-monto">${x.v}</span></div>
    <p>${x.n}</p>${x.extra || ""}${x.f ? `<p class="dt-de">${x.f}</p>` : ""}</div></li>`).join("");

  // La plata de verdad contra lo que ve Orbe.
  const d = discrepancia(), ult = ultimoControl();
  const saldo = !ult ? `<p class="vacio">Todavía no le dijiste a Orbe cuánto tenés en cada cuenta. Anotalo en Finanzas › Cuentas y la próxima vez te compara.</p>`
    : !d ? `<p>El ${new Date(ult.ts).toLocaleDateString("es-AR")} anotaste ${$(totalControl(ult))}. Cuando lo anotes de nuevo, Orbe compara con lo que vio entrar y salir.</p>`
    : `<ul class="lista"><li><span>Tenías<br><small class="vacio">${new Date(d.ant.ts).toLocaleDateString("es-AR")}</small></span><span class="der">${$(totalControl(d.ant))}</span></li>
      <li><span>Entró<br><small class="vacio">lo que vio Orbe</small></span><span class="der">+ ${$(d.entra)}</span></li>
      <li><span>Salió<br><small class="vacio">${d.n} movimientos; la tarjeta cuenta cuando pagás el resumen</small></span><span class="der">− ${$(d.sale)}</span></li>
      <li><span>Orbe esperaba</span><span class="der">${$(d.esperado)}</span></li>
      <li><span>Tenés<br><small class="vacio">${new Date(d.ult.ts).toLocaleDateString("es-AR")}</small></span><span class="der">${$(d.real)}</span></li>
      <li><span><b>Diferencia</b><br><small class="vacio">${d.dif < 0 ? "salió plata que Orbe no vio" : d.dif > 0 ? "entró plata que Orbe no vio" : "cuadra"}${d.resuelto ? (d.resuelto.como === "gasto" ? " · la cargaste como gasto" : " · la dejaste así") : ""}</small></span><span class="der ${d.dif < 0 ? "rojo" : ""}"><b>${$(d.dif)}</b></span></li></ul>`;

  return `${cab}<section class="bloque"><h2>${esc(may(p.nombre))} <span class="tag">${dm(p.inicio)} → ${dm(p.fin)}</span></h2><ol class="dt-pasos">${lis}</ol></section>
    <section class="bloque" id="saldo"><h2>Tu plata real</h2>${saldo}<p class="dt-de">${fuente("Finanzas › Cuentas", "#/u/finanzas?tab=cuentas")}</p></section>
    <div class="chips" style="margin-top:14px">${eco ? `<a class="chip" href="${esc(eco)}" target="_blank" rel="noopener">ECONOMÍA</a>` : ""}${linkHoja() ? `<a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Orbe · datos</a>` : ""}<a class="chip" href="#/d/sueldo">Tu sueldo ›</a></div>
    <p class="fuente-dato">El próximo cobro es el ${DIAS[p.proximo.getDay()]} ${dm(p.proximo)}${p.extrasProximo ? " (" + esc(p.extrasProximo) + ")" : ""}. Ahí arranca un período nuevo.</p>`;
}

// ---------- Productividad ----------
function productividad(datos, ctx) {
  const cab = `${volverA("bna", "BNA")}<h1>Tu productividad</h1><p class="bajada">Mes a mes, contra tu meta. Solo tu fila.</p>`;
  if (!sincroActiva()) return cab + falta("Falta la planilla", "Tu productividad vive en tu planilla «Orbe · datos»: activá la sincronización en Ajustes.");
  const prod = datosProd();
  const meses = mesesConDatos();
  if (!prod || !meses.length) return cab + falta("Sin días cargados", "Cargá tus tareas en BNA › Productividad (o compará con la planilla del banco) y acá vas a ver cómo venís mes a mes.", '<div class="chips" style="margin-top:12px"><a class="chip" href="#/u/bna?tab=prod">Ir a Productividad</a></div>');
  const hoy = isoHoy(ctx.fecha), mesHoy = hoy.slice(0, 7);
  const hs = meses.map((m) => historial(m, hoy));
  const act = hs.find((x) => x.mes === mesHoy) || hs[hs.length - 1];
  const ant = hs[hs.indexOf(act) - 1];
  const vsAnt = act.promedio != null && ant?.promedio ? (act.promedio / ant.promedio - 1) * 100 : null;

  // Cómo viene el mes: qué promedio hace falta en los días de BNA que quedan para cerrar en meta.
  let comoViene = "";
  if (act.mes === mesHoy && act.meta) {
    const [y, m] = mesHoy.split("-").map(Number);
    const fin = new Date(y, m, 0);
    let quedan = 0;
    for (let d = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), ctx.fecha.getDate()); d <= fin; d.setDate(d.getDate() + 1)) {
      if (bloquesFecha(datos, d).some((x) => x.tipo === "bna")) quedan++;
    }
    const suma = act.dias.filter((d) => !d.enCurso).reduce((s, d) => s + d.total, 0);
    const necesita = quedan ? (act.meta * (act.cerrados + quedan) - suma) / quedan : null;
    comoViene = `<section class="bloque"><h2>Cómo viene ${MESES[m - 1]}</h2>
      ${necesita == null ? `<p>No quedan días de BNA en tu agenda este mes.</p>`
        : necesita <= 0 ? `<p>Ya tenés el mes en meta aunque los ${quedan} días que quedan sean flojos.</p>`
        : `<p>Para cerrar el mes con promedio en meta (${act.meta}), en los <b>${quedan} ${quedan === 1 ? "día" : "días"} de BNA</b> que quedan en tu agenda necesitás promediar <b>${f1(necesita)} pts</b>.${necesita > act.meta * 1.25 ? " Viene cuesta arriba." : necesita <= act.meta ? " Venís bien." : ""}</p>`}
      <p class="fuente-dato">Los días que quedan salen de tu agenda (y de tu horario fijo donde no hay evento). Hoy cuenta como día que queda.</p></section>`;
  }

  // Las tareas que más suman en el mes.
  const porTarea = {};
  (prod.filas || []).filter((f) => f.fecha.startsWith(act.mes)).forEach((f) => { porTarea[f.tarea] = (porTarea[f.tarea] || 0) + (f.puntos || 0); });
  const top = Object.entries(porTarea).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totTop = top.reduce((s, [, v]) => s + v, 0) || 1;

  // Mes a mes: promedio contra la meta.
  const tope = Math.max(...hs.map((x) => Math.max(x.promedio || 0, x.meta || 0)), 1) * 1.08;
  const filas = hs.slice().reverse().map((x) => `<li class="dt-pm"><a href="#/u/bna?tab=prod&amp;mes=${x.mes}">
      <span class="dt-m">${may(mesLargo(x.mes, x.mes.slice(0, 4) !== mesHoy.slice(0, 4)))}<small>${x.cerrados} ${x.cerrados === 1 ? "día" : "días"} · ${x.enMeta} en meta${x.mes === mesHoy ? " · en curso" : ""}</small></span>
      <span class="dt-pmb"><span class="dt-track"><i class="b-${x.banda?.id || "n"}" style="width:${Math.round((x.promedio || 0) / tope * 100)}%"></i>${x.meta ? `<em style="left:${Math.round(x.meta / tope * 100)}%" title="meta ${x.meta}"></em>` : ""}</span></span>
      <span class="dt-v">${x.promedio != null ? f1(x.promedio) : "—"}${x.banda ? `<small><span class="chip-banda chica b-${x.banda.id}">${x.banda.txt}</span></small>` : ""}</span><span class="dt-ch" aria-hidden="true">›</span></a></li>`).join("");
  const mejor = hs.filter((x) => x.promedio != null).sort((a, b) => b.promedio - a.promedio)[0];
  const verif = hs.reduce((s, x) => s + x.dias.filter((d) => d.verificado).length, 0);

  return `${cab}<section class="bloque dt-hero"><p class="k-dt">Promedio de ${mesLargo(act.mes)}${act.mes === mesHoy ? ", hasta ayer" : ""}</p>
      <p class="dt-big">${act.promedio != null ? f1(act.promedio) : "—"} <small>${act.meta ? "/ " + act.meta + " pts" : "pts"}</small></p>
      <p class="dt-var">${act.banda ? `<span class="chip-banda chica b-${act.banda.id}">${act.banda.txt}</span> ` : ""}${vsAnt != null ? `${flecha(vsAnt)} <span>contra ${mesLargo(ant.mes)}</span>` : ""}</p>
      <div class="trio" style="margin-top:14px"><div><span class="k">En meta</span><b>${act.enMeta} de ${act.cerrados}</b></div><div><span class="k">Mejor mes</span><b>${mejor ? may(MESES[Number(mejor.mes.slice(5)) - 1].slice(0, 3)) + " " + f1(mejor.promedio) : "—"}</b></div><div><span class="k">Verificados</span><b>${verif}</b></div></div></section>
    ${comoViene}
    <section class="bloque"><h2>Mes a mes <span class="tag">la rayita es la meta</span></h2><ul class="lista dt-pms">${filas}</ul></section>
    ${top.length ? `<section class="bloque"><h2>Lo que más suma en ${mesLargo(act.mes)}</h2><ul class="lista">${top.map(([t, v]) => `<li><span>${esc(t)}</span><span class="der">${f1(v)} pts · ${Math.round(v / totTop * 100)}%</span></li>`).join("")}</ul></section>` : ""}
    <p class="fuente-dato">Bandas: más de la meta Óptimo, hasta un 10% abajo Esperado, menos Bajo. Es tu seguimiento personal: la planilla oficial del banco es la que manda. ✓ verificados = días que coinciden con ella.</p>
    <div class="chips" style="margin-top:12px"><a class="chip" href="#/u/bna?tab=prod">Cargar el día ›</a></div>`;
}

// ---------- Escalafón y aumentos ----------
function escalafon(datos, ctx) {
  const { $ } = pesos();
  const cab = `${volverA("bna", "BNA")}<h1>Escalafón y aumentos</h1><p class="bajada">Tu cargo en la grilla, cada aumento y lo que eso deja en tu recibo.</p>`;
  const e = datosEsc();
  if (!e || !e.cargos.length || !e.conformados.length) return cab + falta("Falta la grilla", "La grilla, los conformados y el Día del Bancario llegan con tus semillas (la planilla privada «Orbe · semillas» de tu Drive) y viven en las hojas ESCALAFON, CONFORMADOS y BANCARIO.", '<div class="chips" style="margin-top:12px"><button class="chip" data-accion="actualizar-todo">Actualizar todo</button></div>');
  const mesHoy = isoHoy(ctx.fecha).slice(0, 7);
  const yo = tuCargo(e), g = yo && cargoEn(yo, mesHoy, e);
  const conf = conformadoDe(mesHoy, e);
  const prox = proximoCargo(e), gp = prox && cargoEn(prox, mesHoy, e);
  // Aumentos: cada conformado contra el anterior (si hay dos en el mismo mes, vale el último).
  const porMes = [];
  e.conformados.forEach((c) => { const i = porMes.findIndex((x) => x.mes === c.mes); if (i >= 0) porMes[i] = c; else porMes.push(c); });
  const aumentos = porMes.map((c, i) => ({ ...c, pct: i ? (c.conformado / porMes[i - 1].conformado - 1) * 100 : null, tuyo: yo ? cargoEn(yo, c.mes, e)?.total : null }));
  const acum = porMes.length > 1 ? (porMes[porMes.length - 1].conformado / porMes[0].conformado - 1) * 100 : null;
  const anio = mesHoy.slice(0, 4);
  const delAnio = porMes.filter((c) => c.mes.startsWith(anio));
  const antesDelAnio = [...porMes].reverse().find((c) => c.mes < anio + "-01");
  const enElAnio = delAnio.length && antesDelAnio ? (delAnio[delAnio.length - 1].conformado / antesDelAnio.conformado - 1) * 100 : null;
  const vs = grillaVsRecibo(e);
  const sig = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth() + 1, 1);
  const est = estimadoNeto(isoHoy(sig).slice(0, 7), e);
  const bancarios = (e.bancario || []).slice().sort((a, b) => b.anio.localeCompare(a.anio));

  return `${cab}
    ${g ? `<section class="bloque dt-hero"><p class="k-dt">Tu cargo · ${esc(g.cargo)} (coef. ${String(g.coef).replace(".", ",")})</p>
      <p class="dt-big">${$(g.total)}</p><p class="dt-var"><span>sueldo + ROE + devolución de aportes, con el conformado de ${mesLargo(conf.mes)}</span></p>
      <div class="trio" style="margin-top:14px"><div><span class="k">Sueldo</span><b>${$(g.sueldo)}</b></div><div><span class="k">ROE</span><b>${$(g.roe)}</b></div><div><span class="k">Dev. aport.</span><b>${$(g.dev)}</b></div></div>
      ${gp ? `<p class="fuente-dato">El paso siguiente, ${esc(gp.cargo)}: ${$(gp.total)} (+${$(gp.total - g.total)} por mes).</p>` : ""}</section>`
      : `<section class="bloque"><h2>Tu cargo</h2><p class="vacio">Falta marcar cuál es tu cargo: poné «sí» en la columna «tuyo» de la hoja ESCALAFON.</p></section>`}
    <section class="bloque"><h2>Aumentos</h2>
      ${acum != null || enElAnio != null ? `<p class="dt-var" style="margin:0 0 10px">${enElAnio != null ? `${flecha(enElAnio)} <span>en ${anio}</span>` : ""}${acum != null && !(enElAnio != null && antesDelAnio === porMes[0]) ? `<span>${enElAnio != null ? " · " : ""}${flecha(acum, true)} desde ${mesLargo(porMes[0].mes, true)}</span>` : ""}</p>` : ""}
      <ul class="lista">${aumentos.slice().reverse().map((c) => `<li><span>${may(mesLargo(c.mes, true))}<br><small class="vacio">${esc(c.fuente || "sin fuente anotada")}</small></span>
        <span class="der">${$(c.conformado)}${c.pct != null ? `<br><small>${flecha(c.pct, true)}</small>` : ""}${c.tuyo ? `<br><small class="vacio">tu cargo ${$(c.tuyo)}</small>` : ""}</span></li>`).join("")}</ul>
      <p class="fuente-dato">El conformado es el sueldo de Auxiliar E. Cada mes todos los cargos suben en la misma proporción que el conformado: tu cargo = tu cargo en la grilla base × (conformado del mes ÷ conformado de la grilla). Valores estimados ±0,5%, como las grillas que circulan.</p></section>
    ${vs ? `<section class="bloque"><h2>De la grilla a tu recibo</h2><ul class="lista">
      <li><span>Según la grilla (${mesLargo(vs.grilla.mes)})</span><span class="der">${$(vs.grilla.total)}</span></li>
      <li><span>Te depositaron (recibo ${mesLargo(vs.recibo.mes)})<br><small class="vacio">neto, antes del talón complementario</small></span><span class="der">${$(vs.recibo.neto)}</span></li>
      <li><span>Descuentos de ley<br><small class="vacio">jubilación, obra social y demás</small></span><span class="der">${$(vs.descuentos)} · ${pct1((1 - vs.proporcion) * 100)}%</span></li>
      ${est ? `<li><span>Próximo recibo, estimado<br><small class="vacio">la grilla de ${mesLargo(est.grilla.mes)} × la misma proporción</small></span><span class="der">≈ ${$(est.neto)}</span></li>` : ""}</ul>
      <p class="dt-de"><a class="dt-fuente" href="#/d/sueldo">Tus recibos ›</a></p></section>`
      : `<section class="bloque"><h2>De la grilla a tu recibo</h2><p class="vacio">Cuando Orbe lea un recibo tuyo, compara lo que dice la grilla con lo que te depositaron.</p></section>`}
    ${bancarios.length ? `<section class="bloque"><h2>Día del Bancario</h2><ul class="lista">${bancarios.map((b) => `<li><span>${esc(b.anio)}<br><small class="vacio">${$(b.fija)} fijos + ${$(b.porCoef)} por punto de coeficiente${b.fuente ? " · " + esc(b.fuente) : ""}</small></span><span class="der">${yo ? $(Math.round(b.fija + b.porCoef * yo.coef)) : "—"}</span></li>`).join("")}</ul>
      <p class="fuente-dato">${yo ? "Lo tuyo, con tu coeficiente (" + String(yo.coef).replace(".", ",") + ")." : "Marcá tu cargo en ESCALAFON para ver lo tuyo."}</p></section>` : ""}
    <div class="chips" style="margin-top:12px"><a class="chip" href="#/u/bna?tab=horas">Cargar un conformado nuevo ›</a></div>`;
}
