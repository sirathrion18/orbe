// Finanzas, la versión amigable: un número protagonista por tarjeta, el gasto día por día y el análisis.
// Todo sale de tus movimientos reales (mails del BNA y de Mercado Pago, más lo que cargás a mano).
import { leer, guardar, sesion } from "./almacen.js";
import { presupuesto, cuentaEnDiario, parte, iso, periodo, FIJOS } from "./presupuesto.js";
import { datosFinanzas } from "./finanzas.js";
import { ICONOS } from "./iconos.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const dm = (d) => d.getDate() + "/" + (d.getMonth() + 1);
const dia0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Gasto del día a día de los últimos N días (mismas reglas que el diario).
export function gastoPorDia(hoy = new Date(), n = 30) {
  const movs = (datosFinanzas()?.movs || []).filter((m) => m.ts && cuentaEnDiario(m));
  const h = dia0(hoy);
  const dias = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(h); d.setDate(h.getDate() - i);
    const k = iso(d);
    const del = movs.filter((m) => iso(new Date(m.ts)) === k);
    dias.push({ iso: k, fecha: d, total: del.reduce((s, m) => s + parte(m), 0), movs: del });
  }
  return dias;
}

// Racha: días seguidos (hasta ayer) gastando más que el diario de hoy.
export function racha(hoy = new Date()) {
  const b = presupuesto(hoy);
  if (!b.diario || b.diario <= 0) return 0;
  const dias = gastoPorDia(hoy, 10).slice(0, -1).reverse();
  let n = 0;
  for (const d of dias) { if (d.total > b.diario) n++; else break; }
  return n;
}

// ---------- Hoy ----------
export function heroHoy(ctx, $, oculto) {
  const b = presupuesto(ctx.fecha);
  const ojo = `<button class="ojo" data-accion="ocultar-plata" aria-label="${oculto ? "Mostrar" : "Ocultar"} la plata">${oculto ? ICONOS.ojoNo : ICONOS.ojo}</button>`;
  const mas = `<button class="mas-gasto" data-accion="gasto-rapido" aria-label="Cargar un gasto">+ Gasto</button>`;
  if (b.total == null || b.base == null || b.sinDiario || b.sinMargen) {
    const motivo = motivoSinDiario(b, $);
    return `<section class="fz hero"><div class="fz-cab"><span class="fz-k">Hoy</span><span class="fz-acc">${ojo}${mas}</span></div>
      <p class="fz-big rojo">${b.sinDiario || b.sinMargen ? "No queda diario" : "Sin diario"}</p><p class="fz-sub">${esc(motivo)}</p></section>`;
  }
  const rojo = b.quedaHoy < 0 && b.gastoHoy > 0;
  const uso = b.diario > 0 ? Math.min(1, Math.max(0, b.gastoHoy / b.diario)) : 1;
  return `<section class="fz hero ${rojo ? "pasado" : ""}"><div class="fz-cab"><span class="fz-k">${rojo ? "Hoy te pasaste" : "Hoy podés gastar"}</span><span class="fz-acc">${ojo}${mas}</span></div>
    <p class="fz-big ${rojo ? "rojo" : ""}">${oculto ? "••••••" : $(Math.abs(b.quedaHoy))}</p>
    <div class="fz-barra"><i style="width:${oculto ? 0 : Math.round(uso * 100)}%"></i></div>
    <div class="fz-mini"><span><small>Diario</small>${$(b.diario)}</span><span><small>Gastaste hoy</small>${$(b.gastoHoy)}</span><span><small>Hasta el ${dm(b.p.fin)}</small>${$(b.queda)}</span></div></section>`;
}

// Por qué no hay diario, en una frase (la usan Finanzas e Inicio).
export function motivoSinDiario(b, $) {
  if (b.total == null) return "Falta tu planilla de este período en ECONOMÍA.";
  if (b.base == null) return `Falta el ingreso de ${b.p.nombre}.`;
  if (b.sinMargen) return `Hoy no gastaste ${b.gastoHoy ? "casi nada" : "nada"}, pero lo del día a día desde el ${dm(b.p.inicio)} (${$(b.gastoAntes)}) ya usó lo que había para los ${b.p.restantes} días que quedan. Abajo ves en qué.`;
  return b.real ? `Tus egresos reales más el colchón superan el ingreso por ${$(-b.base)}. Mirá el detalle en Mes.` : `Los egresos de tu planilla superan el ingreso por ${$(-b.base)}.`;
}

// ---------- En qué gastaste: lo que Orbe leyó de tus mails y lo que anotaste vos ----------
// Un mail que se unió con lo que anotaste se muestra una sola vez (el tuyo, con «anotado y en mail»).
const esGasto = (m) => m.ts && m.moneda !== "USD" && ["gasto", "gasto-tarjeta", "devolucion"].includes(m.clase) && m.diario !== "dup" && !(m.cruce && m.fuente !== "A mano" && !/^Celu/.test(m.fuente || ""));
const origen = (m) => m.fuente === "A mano" ? (m.cruce ? "anotado y en " + (/^cel-/.test(m.cruce) ? "el celu" : "mail") : "anotado")
  : /^Celu/.test(m.fuente || "") ? "del celu" + (m.cruce ? " y en mail" : "") : /^resumen/i.test(m.fuente || "") ? "del resumen" : "de un mail";
const hora = (ts) => { const d = new Date(ts); return d.getHours() || d.getMinutes() ? d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0") : ""; };
const porQueNo = (m) => m.diario === "no" ? "lo sacaste del diario" : m.diario === "agus" ? "es de Agus" : FIJOS.includes(m.rubro) ? "ya está en tus fijos" : "no cuenta en el diario";
function filaGasto(m, $, conDia) {
  const cuenta = cuentaEnDiario(m);
  const d = new Date(m.ts);
  const det = [conDia ? DIAS[d.getDay()].slice(0, 3) + " " + dm(d) : hora(m.ts), m.rubro || "", origen(m), m.mitad ? "tu mitad" : "", m.clase === "gasto-tarjeta" ? "tarjeta" : ""].filter(Boolean).join(" · ");
  return `<li><button class="fz-g ${cuenta ? "" : "no"}" data-accion="fin-mov" data-id="${esc(m.id)}"><span class="q">${esc(m.contra || m.tipo || "Gasto")}<small>${esc(det)}${cuenta ? "" : " · <em>" + esc(porQueNo(m)) + "</em>"}</small></span><b>${m.clase === "devolucion" ? "+ " : ""}${$(Math.abs(cuenta ? parte(m) : m.monto || 0))}</b></button></li>`;
}
const gastosDe = (desde, hasta) => (datosFinanzas()?.movs || []).filter((m) => esGasto(m) && m.ts >= desde && m.ts < hasta).sort((a, c) => c.ts - a.ts);
const suma = (l) => l.filter(cuentaEnDiario).reduce((s, m) => s + parte(m), 0);

// Para Inicio: «Hoy: Rappi $ 8.000 · Café $ 3.500».
export function resumenGastosHoy(fecha, $) {
  const h0 = dia0(fecha).getTime();
  const l = gastosDe(h0, h0 + 86400000).filter(cuentaEnDiario);
  if (!l.length) return "";
  const top = l.slice(0, 3).map((m) => (m.contra || m.rubro || "Gasto").slice(0, 18) + " " + $(parte(m)));
  return "Hoy: " + top.join(" · ") + (l.length > 3 ? ` y ${l.length - 3} más` : "");
}

export function bloqueGastosHoy(ctx, $) {
  if (!datosFinanzas()) return "";
  const hoyK = iso(ctx.fecha), sel = sesion("finDia") || hoyK;
  const [y, mo, d] = sel.split("-").map(Number);
  const t0 = new Date(y, mo - 1, d).getTime();
  const l = gastosDe(t0, t0 + 86400000);
  const esHoy = sel === hoyK, ayerK = iso(new Date(dia0(ctx.fecha).getTime() - 86400000));
  const nombre = esHoy ? "hoy" : sel === ayerK ? "ayer" : "el " + DIAS[new Date(t0).getDay()] + " " + dm(new Date(t0));
  const prev = iso(new Date(y, mo - 1, d - 1)), next = iso(new Date(y, mo - 1, d + 1));
  return `<section class="fz gastos"><div class="fz-cab"><span class="fz-k">En qué gastaste ${nombre}</span><b class="fz-tot">${$(suma(l))}</b></div>
    ${l.length ? `<ul class="fz-gl">${l.map((m) => filaGasto(m, $)).join("")}</ul>`
      : `<p class="fz-sub">${esHoy ? "Hoy todavía nada. Lo que pagás con débito, tarjeta o Mercado Pago aparece solo cuando llega el mail; lo de efectivo, anotalo con «+ Gasto»." : "Ese día no hay gastos."}</p>`}
    <div class="fz-nav"><button class="icon-btn" data-accion="fin-dia" data-d="${prev}" aria-label="Día anterior">‹</button>
      <span>${esHoy ? "Mirá otros días con las flechas o tocando el gráfico" : `<button class="link" data-accion="fin-dia" data-d="${hoyK}">Volver a hoy</button>`}</span>
      <button class="icon-btn" data-accion="fin-dia" data-d="${next}" aria-label="Día siguiente" ${esHoy ? "disabled" : ""}>›</button></div>
    <p class="fz-pie">Tocá un gasto para corregirlo: el día, si cuenta en el diario, el rubro o si es compartido.</p></section>`;
}

// Mes: todo lo del período, por rubro, con cada gasto a mano.
export function bloqueGastosMes(ctx, $) {
  if (!datosFinanzas()) return "";
  const b = presupuesto(ctx.fecha);
  const l = gastosDe(b.p.inicio.getTime(), b.p.fin.getTime() + 86400000);
  const cuentan = l.filter(cuentaEnDiario), no = l.filter((m) => !cuentaEnDiario(m));
  const total = suma(cuentan), anotado = suma(cuentan.filter((m) => m.fuente === "A mano"));
  const rub = {};
  cuentan.forEach((m) => { const k = m.rubro || "Otros"; (rub[k] = rub[k] || []).push(m); });
  const rubros = Object.entries(rub).map(([k, ms]) => [k, suma(ms), ms]).sort((a, c) => c[1] - a[1]);
  const max = Math.max(...rubros.map((r) => r[1]), 1);
  const lista = (ms) => `<ul class="fz-gl">${ms.map((m) => filaGasto(m, $, true)).join("")}</ul>`;
  return `<section class="fz gastos"><div class="fz-cab"><span class="fz-k">En qué vas gastando · desde el ${dm(b.p.inicio)}</span></div>
    <p class="fz-big chico">${$(total)}</p>
    <p class="fz-sub">${cuentan.length ? `${cuentan.length} ${cuentan.length === 1 ? "gasto" : "gastos"} del día a día: ${$(total - anotado)} de tus mails y ${$(anotado)} que anotaste vos.` : "Todavía no hay gastos del día a día en este período."}</p>
    ${rubros.map(([k, v, ms]) => `<details class="fz-rub"><summary><span class="n">${esc(k)}</span><span class="v">${$(v)}<small>${ms.length}</small></span><i style="width:${Math.max(2, Math.round(v / max * 100))}%"></i></summary>${lista(ms)}</details>`).join("")}
    ${no.length ? `<details class="fz-rub no"><summary><span class="n">No cuentan en el diario</span><span class="v">${$(no.reduce((s, m) => s + (m.monto || 0), 0))}<small>${no.length}</small></span></summary>${lista(no)}</details>` : ""}
    <p class="fz-pie">Tocá cualquiera para corregirlo. Lo que está en tus fijos (vivienda, servicios, transporte) va en el mes real, no acá.</p></section>`;
}

export function avisoRacha(ctx, $) {
  const n = racha(ctx.fecha);
  if (n < 3) return "";
  const b = presupuesto(ctx.fecha);
  return `<section class="fz aviso"><p><b>Vas ${n} días seguidos arriba del diario.</b> Mañana tenés ${$(Math.max(0, b.diarioManana || 0))} para el día; si aflojás un par de días se acomoda.</p></section>`;
}

// Barras de 30 días con la línea del diario. Tocás una barra y abajo ves en qué se fue.
export function graficoDias(ctx, $, oculto) {
  const dias = gastoPorDia(ctx.fecha, 30);
  const b = presupuesto(ctx.fecha);
  const diario = b.diario > 0 ? b.diario : null;
  const conGasto = dias.filter((d) => d.total > 0);
  if (!conGasto.length) return `<section class="fz"><span class="fz-k">Tu gasto, día por día</span><p class="fz-sub" style="margin-top:8px">Todavía no hay gastos del día a día en los últimos 30 días.</p></section>`;
  // La escala no la arruina un día excepcional: se recorta y ese día lleva una flechita.
  const orden = conGasto.map((d) => d.total).sort((a, c) => a - c);
  const p85 = orden[Math.floor((orden.length - 1) * 0.85)] || 0;
  const techo = Math.max(diario ? diario * 2 : 0, p85 * 1.6, 1);
  const max = Math.min(Math.max(...dias.map((d) => d.total), diario ? diario * 1.25 : 0, 1), techo);
  const W = 300, H = 120, paso = W / dias.length, ancho = paso - 2.4;
  const y = (v) => H - (v / max) * (H - 6);
  const sel = sesion("finDia") || iso(ctx.fecha); // el detalle del día está arriba, en «En qué gastaste»
  const barras = dias.map((d, i) => {
    const recortado = d.total > max;
    const alto = Math.max(d.total > 0 ? 2 : 0, H - y(Math.min(d.total, max)));
    const pasa = diario && d.total > diario;
    const hoy = d.iso === iso(ctx.fecha);
    return `<g class="fz-dia ${d.iso === sel ? "sel" : ""}" data-accion="fin-dia" data-d="${d.iso}" role="button" aria-label="${DIAS[d.fecha.getDay()]} ${dm(d.fecha)}: ${oculto ? "oculto" : $(d.total)}">
      <rect class="toque" x="${(i * paso).toFixed(1)}" y="0" width="${paso.toFixed(1)}" height="${H}" />
      <rect class="b ${pasa ? "pasa" : ""} ${hoy ? "hoy" : ""}" x="${(i * paso + 1.2).toFixed(1)}" y="${(H - alto).toFixed(1)}" width="${ancho.toFixed(1)}" height="${alto.toFixed(1)}" rx="1.6" />
      ${recortado ? `<path class="corte" d="M${(i * paso + 1.2).toFixed(1)} 5 L${(i * paso + paso / 2).toFixed(1)} 0 L${(i * paso + paso - 1.2).toFixed(1)} 5" />` : ""}</g>`;
  }).join("");
  const linea = diario ? `<line class="fz-linea" x1="0" x2="${W}" y1="${y(diario).toFixed(1)}" y2="${y(diario).toFixed(1)}" />` : "";
  const prom = conGasto.reduce((s, d) => s + d.total, 0) / dias.length;
  const caro = [...dias].sort((a, b2) => b2.total - a.total)[0];
  const d0 = dias[0].fecha, d1 = dias[dias.length - 1].fecha;
  return `<section class="fz grafico"><div class="fz-cab"><span class="fz-k">Tu gasto, día por día</span><span class="fz-ley">${diario ? `<i class="l"></i> diario ${oculto ? "" : $(diario)}` : ""}</span></div>
      <svg class="fz-svg ${oculto ? "oculto" : ""}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${barras}${linea}</svg>
      <div class="fz-eje"><span>${dm(d0)}</span><span>hoy</span></div>
      <div class="fz-mini"><span><small>Promedio por día</small>${$(prom)}</span><span><small>El más caro</small>${DIAS[caro.fecha.getDay()].slice(0, 3)} ${dm(caro.fecha)} · ${$(caro.total)}</span></div>
      </section>`;
}

// ---------- Agus ----------
// Lo que te pasa Agus por la división: si Orbe lo vio en un mail (y le dijiste que era de Agus), eso; si no, lo que marcaste a mano.
export function agusManual(clave) { return leer("presupuesto", {})[clave]?.agusManual || null; }
export function marcarAgus(clave, monto) {
  const p = leer("presupuesto", {});
  p[clave] = { ...(p[clave] || {}), agusManual: monto > 0 ? { monto, cuando: Date.now() } : null };
  guardar("presupuesto", p);
}
export function tarjetaAgus(ctx, $) {
  const b = presupuesto(ctx.fecha);
  if (!b.division && !b.agus && !agusManual(b.p.clave)) return "";
  const esperado = b.esperadoAgus;
  const ya = b.agus > 0;
  const man = agusManual(b.p.clave);
  return `<section class="fz agus ${ya ? "ok" : ""}"><div class="fz-cab"><span class="fz-k">${ya ? "Agus te pasó" : "Agus te tiene que pasar"}</span>${ya ? `<span class="fz-ok">${ICONOS.check}</span>` : ""}</div>
    <p class="fz-big">${ya ? $(b.agus) : esperado != null ? $(esperado) : "—"}</p>
    <p class="fz-sub">${ya ? (man && !b.agusMail ? "Lo marcaste el " + dm(new Date(man.cuando)) + "." : "Lo vio Orbe en tus mails.") + (esperado != null ? ` Esperado: ${$(esperado)}.` : "") : "Su mitad de lo compartido" + (b.ajustes.length ? ", menos " + b.ajustes.map((a) => esc(a.concepto.toLowerCase())).join(" y ") : "") + "."} Cubre su mitad de lo compartido (alquiler, expensas, servicios), que en tu mes ya cuenta como tu mitad.</p>
    <div class="chips" style="margin-top:10px">${ya ? `<button class="chip" data-accion="agus-paso" data-monto="${Math.round(b.agus)}">Corregir</button>` : `<button class="btn" data-accion="agus-paso" data-monto="${Math.round(esperado || 0)}">Agus ya me pasó</button>`}</div></section>`;
}
export function hojaAgus2(clave, monto) {
  return `<h2>Agus te pasó</h2><form data-form="agus-paso" data-clave="${esc(clave)}">
    <label class="campo-sus"><span>Monto</span><input name="monto" inputmode="decimal" value="${monto ? Math.round(monto).toLocaleString("es-AR") : ""}" required></label>
    <p class="fuente-dato">Si te lo pasó por Mercado Pago o en efectivo, igual va acá. Si después Orbe ve el mail, no se cuenta dos veces.</p>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}

// ---------- Mes ----------
export function heroMes(ctx, $) {
  const b = presupuesto(ctx.fecha);
  if (b.base == null) return "";
  const p = b.p;
  const transcurridos = Math.max(0, p.dias - p.restantes);
  const pctDias = p.dias ? transcurridos / p.dias : 0;
  const pctGasto = b.base > 0 ? Math.min(1, b.gastoTotal / b.base) : 1;
  return `<section class="fz hero"><span class="fz-k">Te quedan para el día a día</span>
    <p class="fz-big ${b.queda < 0 ? "rojo" : ""}">${b.queda < 0 ? "−" : ""}${$(Math.abs(b.queda))}</p>
    <div class="fz-doble"><div><small>Gastaste</small><div class="fz-barra"><i style="width:${Math.round(pctGasto * 100)}%"></i></div></div>
      <div><small>Pasó del período</small><div class="fz-barra gris"><i style="width:${Math.round(pctDias * 100)}%"></i></div></div></div>
    <p class="fz-sub">${pctGasto > pctDias + 0.05 ? "Vas gastando más rápido de lo que pasan los días." : pctGasto < pctDias - 0.05 ? "Vas más lento que los días: bien ahí." : "Vas parejo con los días."} Del ${dm(p.inicio)} al ${dm(p.fin)} · faltan ${p.restantes} ${p.restantes === 1 ? "día" : "días"}.</p></section>`;
}

// ---------- Análisis ----------
const barrasH = (filas, $, color) => {
  const max = Math.max(...filas.map((f) => f[1]), 1);
  return `<ul class="fz-bh">${filas.map(([n, v, extra]) => `<li><span class="n">${esc(n)}</span><span class="v">${$(v)}${extra ? `<small>${esc(extra)}</small>` : ""}</span><i style="width:${Math.max(2, Math.round(v / max * 100))}%;${color ? "background:" + color : ""}"></i></li>`).join("")}</ul>`;
};
export function analisisGastos(ctx, $, oculto) {
  const b = presupuesto(ctx.fecha);
  const movs = (datosFinanzas()?.movs || []).filter((m) => m.ts && cuentaEnDiario(m));
  if (!movs.length) return `<section class="fz"><p class="fz-sub">El análisis aparece cuando Orbe tenga gastos del día a día.</p></section>`;
  // Rubros del período.
  const rub = {};
  b.contados.forEach((m) => { const k = m.rubro || "Otros"; rub[k] = (rub[k] || 0) + parte(m); });
  const rubros = Object.entries(rub).sort((a, c) => c[1] - a[1]).slice(0, 8);
  // Días de la semana: promedio de las últimas 8 semanas.
  const dias = gastoPorDia(ctx.fecha, 56);
  const porDow = [1, 2, 3, 4, 5, 6, 0].map((dw) => { const ds = dias.filter((d) => d.fecha.getDay() === dw); return [DIAS[dw], ds.reduce((s, d) => s + d.total, 0) / Math.max(1, ds.length)]; });
  const topDow = [...porDow].sort((a, c) => c[1] - a[1])[0];
  // Contra el período anterior, a la misma altura.
  const pa = periodo(new Date(b.p.inicio.getTime() - 86400000));
  const n = Math.max(1, b.p.dias - b.p.restantes + 1);
  const acum = (desde, k) => { const out = []; let s = 0; for (let i = 0; i < k; i++) { const d = new Date(desde); d.setDate(desde.getDate() + i); const x = iso(d); s += movs.filter((m) => iso(new Date(m.ts)) === x).reduce((t, m) => t + parte(m), 0); out.push(s); } return out; };
  const este = acum(b.p.inicio, n), antes = acum(pa.inicio, Math.max(n, Math.min(pa.dias, 31)));
  const W = 300, H = 90, maxA = Math.max(...este, ...antes, 1), dias2 = Math.max(antes.length, este.length, 2);
  const pts = (arr) => arr.map((v, i) => `${(i / (dias2 - 1) * W).toFixed(1)},${(H - v / maxA * (H - 4)).toFixed(1)}`).join(" ");
  const dif = este[este.length - 1] - (antes[n - 1] ?? antes[antes.length - 1] ?? 0);
  // Gastos hormiga: chiquitos (menos de $ 5.000) que se repiten en 30 días.
  const ult = movs.filter((m) => m.ts >= Date.now() - 30 * 86400000 && parte(m) > 0 && parte(m) < 5000);
  const grupos = {};
  // Mismo lugar aunque venga escrito distinto («Café Martínez» y «CAFE MARTINEZ»).
  const clave = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  ult.forEach((m) => { const n0 = String(m.contra || m.rubro || "Otros").trim(); const k = clave(n0); const g = (grupos[k] = grupos[k] || { n: 0, total: 0, nombre: n0 }); g.n++; g.total += parte(m); });
  const hormiga = Object.entries(grupos).filter(([, g]) => g.n >= 3).sort((a, c) => c[1].total - a[1].total).slice(0, 6);
  const totHormiga = hormiga.reduce((s, [, g]) => s + g.total, 0);
  return `<section class="fz"><span class="fz-k">En qué se va · este período</span>
      ${rubros.length ? barrasH(rubros, $) : '<p class="fz-sub">Sin gastos todavía en este período.</p>'}</section>
    <section class="fz"><span class="fz-k">Qué días gastás más</span>
      <p class="fz-sub" style="margin:6px 0 4px">Los <b>${esc(topDow[0])}</b>: ${$(topDow[1])} en promedio (últimas 8 semanas).</p>
      ${barrasH(porDow.map(([nn, v]) => [nn.slice(0, 3), v]), $, "var(--muted)")}</section>
    <section class="fz"><span class="fz-k">Contra el período pasado</span>
      <p class="fz-big chico ${dif > 0 ? "rojo" : ""}">${dif > 0 ? "+" : dif < 0 ? "−" : ""}${$(Math.abs(dif))}</p>
      <p class="fz-sub">${dif > 0 ? "más" : "menos"} que el período pasado a esta altura (día ${n}).</p>
      <svg class="fz-svg lineas ${oculto ? "oculto" : ""}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline class="antes" points="${pts(antes)}"/><polyline class="este" points="${pts(este)}"/></svg>
      <div class="fz-ley2"><span><i class="este"></i>este período</span><span><i class="antes"></i>el pasado</span></div></section>
    <section class="fz"><span class="fz-k">Gastos hormiga · 30 días</span>
      ${hormiga.length ? `<p class="fz-big chico">${$(totHormiga)}</p><p class="fz-sub">en cosas de menos de $ 5.000 que se repiten.</p>${barrasH(hormiga.map(([, g]) => [g.nombre, g.total, g.n + " veces"]), $, "var(--accent)")}` : '<p class="fz-sub">No hay gastos chiquitos que se repitan. Bien ahí.</p>'}</section>`;
}

// ---------- Mes real: tus renglones de ECONOMÍA con la plata de verdad ----------
const ESTADO = { pagado: "pagado", "por pagar": "por pagar", estimado: "estimado" };
export function bloqueMesReal(ctx, $, oculto, linkEco) {
  const b = presupuesto(ctx.fecha);
  const r = b.real;
  if (!r) return "";
  const dif = (real, plan) => { const d = Math.round((real || 0) - (plan || 0)); return !plan || Math.abs(d) < 1 ? "" : `<small class="mr-dif ${d > 0 ? "sube" : "baja"}">${d > 0 ? "+" : "−"}${oculto ? "••" : $(Math.abs(d))} vs. planilla</small>`; };
  const filas = [...r.filas].sort((a, c) => (c.real || 0) - (a.real || 0)).map((f) => `<li><button class="mr-fila" data-accion="mr-pagado" data-c="${esc(f.concepto)}" data-m="${Math.round(f.real || 0)}">
      <span class="mr-izq"><b>${esc(f.concepto)}</b><small><span class="mr-est ${f.estado.replace(" ", "-")}">${ESTADO[f.estado]}</span> ${esc(f.fuente)}${f.nota ? " · " + esc(f.nota) : ""}</small></span>
      <span class="mr-der"><b>${$(f.real || 0)}</b>${dif(f.real, f.plan)}</span></button></li>`).join("");
  const base = (r.ingreso?.monto || 0) - r.totalReal - (r.colchon - r.usado);
  return `<section class="fz mesreal"><div class="fz-cab"><span class="fz-k">Tu mes real · ${esc(b.p.nombre)}</span>${linkEco ? `<a class="fz-link" href="${esc(linkEco)}" target="_blank" rel="noopener">tu planilla</a>` : ""}</div>
      <div class="mr-ing"><span><small>Ingreso</small><b>${r.ingreso ? $(r.ingreso.monto) : "—"}</b></span><small>${r.ingreso ? (r.ingreso.estado === "real" ? "del " + esc(r.ingreso.fuente.toLowerCase()) : r.ingreso.recibo ? "de tu planilla: el recibo dice " + $(r.ingreso.recibo) + " (¿falta un bono?)" : "estimado, de tu planilla") : "falta el recibo"}${r.planIngreso && r.ingreso && !r.ingreso.recibo ? " · planilla " + $(r.planIngreso) : ""}</small></div>
      <ul class="mr-lista">${filas}</ul>
      <div class="mr-colchon"><div><small>Colchón · ${r.pct}% del ingreso</small><b>${$(r.colchon - r.usado)}</b>${r.usado ? `<small>usaste ${$(r.usado)}</small>` : ""}</div>
        <div class="chips">${[3, 5, 10].map((x) => `<button class="chip ${r.pct === x ? "on" : ""}" data-accion="mr-pct" data-v="${x}">${x}%</button>`).join("")}<button class="chip" data-accion="mr-usar" data-m="${r.usado || 0}">${r.usado ? "Cambiar" : "Usar"}</button></div></div>
      <div class="mr-tot"><span><small>Egresos reales</small>${$(r.totalReal)}</span><span><small>Planilla</small>${$(r.totalPlan)}</span><span class="mr-base"><small>Para el día a día, al empezar el período</small><b class="${base < 0 ? "rojo" : ""}">${base < 0 ? "−" : ""}${$(Math.abs(base))}</b></span></div>
      <p class="fz-sub">${r.estimados ? `${r.estimados} ${r.estimados === 1 ? "renglón todavía no es definitivo" : "renglones todavía no son definitivos"} (estimados o lo que pensás pagar): tocá cualquiera para marcarlo pagado con el monto real. ` : "Todos los renglones tienen su número real. "}El colchón se aparta antes del diario; si lo necesitás, tocás «Usar».</p></section>`;
}
export function hojaPagado(concepto, monto) {
  return `<h2>${esc(concepto)}</h2><form data-form="mr-pagado" data-c="${esc(concepto)}">
    <label class="campo-sus"><span>Lo que pagaste (o vas a pagar) este mes</span><input name="monto" inputmode="decimal" value="${monto ? Math.round(monto).toLocaleString("es-AR") : ""}" required></label>
    <p class="fuente-dato">Queda como «pagado, lo marcaste vos» y manda sobre el resto. Para volver a lo automático, poné 0.</p>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}
export function hojaColchon(disponible, usado) {
  return `<h2>Usar el colchón</h2><form data-form="mr-usar">
    <label class="campo-sus"><span>Cuánto pasás al día a día (de ${Math.round(disponible).toLocaleString("es-AR")})</span><input name="monto" inputmode="decimal" value="${usado ? Math.round(usado).toLocaleString("es-AR") : ""}" required></label>
    <p class="fuente-dato">Para una emergencia o un gasto que no estaba. Se suma a lo que te queda y sube el diario. Con 0 lo devolvés.</p>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}
