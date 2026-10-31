// Finanzas › Planilla: tu ECONOMÍA tal cual (los mismos renglones y las mismas cuentas), más clara,
// con lo real al lado: el recibo, el talón, tu mitad de la DIVISIÓN y lo que Orbe ve en tus mails.
// Hasta diciembre manda tu planilla: Orbe la lee y no la toca.
import { sesion } from "./almacen.js";
import { datosEconomia, MESES_AR } from "./economia.js";
import { datosFinanzas } from "./finanzas.js";
import { datosBonos, datosSueldosHist } from "./recibos.js";
import { presupuesto, periodo } from "./presupuesto.js";
import { esc } from "./inicio.js";

const dos = (n) => String(n).padStart(2, "0");
const normal = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const may = (t) => t.charAt(0) + t.slice(1).toLowerCase();

// Los grupos y colores de tu planilla. Lo que no encaja va a «Otros».
const GRUPOS = [
  { id: "serv", nombre: "Servicios", color: "#F3C34B", re: /edesur|aysa|metrogas|agip|abl|luz|gas|agua/ },
  { id: "casa", nombre: "Casa", color: "#B4A7D6", re: /alquiler|terapia|expensas/ },
  { id: "net", nombre: "Internet", color: "#B6D7A8", re: /internet|telefon|celular/ },
  { id: "tarj", nombre: "Tarjetas", color: "#EA9999", re: /master|visa|\btc\b|tarjeta|amex/ },
  { id: "trans", nombre: "Transporte", color: "#D5A6BD", re: /transporte|sube|nafta|uber/ },
  { id: "pp", nombre: "PP + Gym", color: "#9FC5E8", re: /\bpp\b|gym|prestamo|talon/ },
  { id: "otros", nombre: "Otros", color: "#CFCFCF", re: /./ }
];
const grupoDe = (concepto) => GRUPOS.find((g) => g.re.test(normal(concepto)));

// Las hojas de años de tu ECONOMÍA (2024, 2025, 2026…).
export function aniosPlanilla() {
  const e = datosEconomia();
  if (!e) return {};
  return e.anios || (e.anio ? { [e.anio]: e.meses } : {});
}

// Lo real de un mes que no es el de ahora: el ingreso (recibo del mes anterior + bonos) y el talón.
function realPasado(anio, mes) {
  const clave = anio + "-" + dos(mes + 1);
  const r = (datosFinanzas()?.meses || []).find((x) => x.mes === clave);
  const num = (re) => { const m = re.exec(r?.fuente || ""); return m ? Number(m[1].replace(/\./g, "")) : null; };
  let neto = num(/neto \$\s?([\d.]+)/i), talon = num(/tal[oó]n \$\s?([\d.]+)/i), fuente = r ? (r.fuente || "").split(":")[0] : "";
  if (neto == null) {
    // De los recibos viejos (En dólares): el de este mes se cobra a fin del mes anterior.
    const d = new Date(anio, mes - 1, 1), k = d.getFullYear() + "-" + dos(d.getMonth() + 1);
    const h = datosSueldosHist()[k];
    if (h?.neto) { neto = h.neto; fuente = "Recibo " + dos(d.getMonth() + 1) + "/" + d.getFullYear(); }
  }
  const bonos = (datosBonos()[clave] || []).reduce((s, b) => s + (b.neto || 0), 0);
  return { ingreso: neto != null ? neto + bonos : null, fuente: fuente + (bonos ? " + bono" : ""), talon };
}

export function renderPlanilla(ctx, $0, oculto) {
  const $ = (n) => (n < 0 && !oculto ? "−" + $0(-n) : $0(n));
  const anios = aniosPlanilla();
  const lista = Object.keys(anios).sort();
  if (!lista.length) return `<section class="bloque"><h2>Falta tu planilla</h2><p class="vacio">Conectá tu ECONOMÍA en Ajustes y Orbe la muestra acá, mes por mes.</p></section>`;
  const p = periodo(ctx.fecha);
  const anio = lista.includes(sesion("plAnio")) ? sesion("plAnio") : lista.includes(String(p.col.anio)) ? String(p.col.anio) : lista[lista.length - 1];
  const meses = anios[anio] || [];
  const cargados = meses.map((m, i) => (m ? i : -1)).filter((i) => i >= 0);
  const pedido = Number(sesion("plMes"));
  const mes = sesion("plAnio") === anio && cargados.includes(pedido) ? pedido : String(p.col.anio) === anio && cargados.includes(p.col.mes) ? p.col.mes : cargados[cargados.length - 1];
  const col = meses[mes];
  const esAhora = String(p.col.anio) === anio && p.col.mes === mes;

  const selAnios = `<div class="pl-anios" role="tablist">${lista.map((a) => `<button role="tab" aria-selected="${a === anio}" class="${a === anio ? "on" : ""}" data-accion="pl-anio" data-a="${a}">${a}</button>`).join("")}</div>`;
  const selMeses = `<div class="pl-meses">${MESES_AR.map((n, i) => meses[i] ? `<button class="${i === mes ? "on" : ""}" data-accion="pl-mes" data-a="${anio}" data-m="${i}" aria-pressed="${i === mes}">${may(n).slice(0, 3)}</button>` : "").join("")}</div>`;
  if (!col) return selAnios + selMeses + `<section class="bloque"><p class="vacio">Ese año todavía no tiene meses cargados.</p></section>`;

  // Lo real: el mes de ahora, renglón por renglón (mesReal); los otros, el recibo y el talón.
  const mr = esAhora ? presupuesto(ctx.fecha).real : null;
  const rp = esAhora ? null : realPasado(Number(anio), mes);
  const ingReal = mr?.ingreso?.estado === "real" ? mr.ingreso.monto : mr?.ingreso?.recibo || rp?.ingreso || null;
  const ingFuente = mr?.ingreso ? (mr.ingreso.estado === "real" ? mr.ingreso.fuente : mr.ingreso.recibo ? "neto de los recibos" : "") : rp?.fuente || "";
  const faltaBono = ingReal && col.ingresos && col.ingresos > ingReal * 1.05;

  const filas = (col.todos || col.egresos).map(({ concepto, monto }) => {
    const r = mr?.filas.find((f) => f.concepto === concepto);
    let real = null, nota = "", est = false;
    if (r) { real = r.real; est = r.estado === "estimado" || r.plan_; nota = r.estado === "estimado" ? "estimado" : r.fuente; }
    else if (rp?.talon && /\bpp\b|prestamo|talon/.test(normal(concepto))) { real = rp.talon; nota = "talón del recibo"; }
    return { concepto, plan: monto || 0, real, est, nota, g: grupoDe(concepto) };
  }).filter((f) => f.plan || f.real);
  const val = (f) => (f.real != null ? f.real : f.plan);

  const fila = (f) => `<li><span class="c">${esc(f.concepto)}${f.nota ? `<small>${esc(f.nota)}</small>` : ""}</span><span class="p">${f.plan ? $(f.plan) : "—"}</span>
      <span class="r ${f.real == null || f.est ? "est" : ""}">${f.real != null ? $(f.real) : f.plan ? $(f.plan) : "—"}</span></li>`;
  const grupos = GRUPOS.map((g) => ({ g, fs: filas.filter((f) => f.g === g) })).filter((x) => x.fs.length).map(({ g, fs }) =>
    `<section class="pl-grp g-${g.id}"><div class="pl-gh"><span>${g.nombre}</span><b>${$(fs.reduce((s, f) => s + val(f), 0))}</b></div><ul>${fs.map(fila).join("")}</ul></section>`).join("");

  // Las cuentas de tu Excel: total, saldo = ingresos − total, semanal = saldo ÷ 4, diario = saldo ÷ 24.
  const totP = col.total ?? filas.reduce((s, f) => s + f.plan, 0), totR = filas.reduce((s, f) => s + val(f), 0);
  const ingP = col.ingresos || 0, ingR = ingReal ?? ingP;
  const salP = col.saldo ?? ingP - totP, salR = ingR - totR;
  const hayReal = ingReal != null || filas.some((f) => f.real != null);
  const caja = (nom, r, pl, cls) => `<div class="pl-tt ${cls}"><span>${nom}</span><b>${$(hayReal ? r : pl)}</b>${hayReal ? `<small>planilla ${$(pl)}</small>` : ""}</div>`;
  const tots = `<div class="pl-tots">${caja("Total egresos", totR, totP, "total")}${caja("Saldo", salR, salP, "saldo" + ((hayReal ? salR : salP) < 0 ? " neg" : ""))}${caja("Semanal", salR / 4, salP / 4, "semanal")}${caja("Diario", salR / 24, salP / 24, "diario")}</div>`;

  // El año de un vistazo: el saldo de cada mes, según tu planilla.
  const sal = meses.map((m) => (m ? m.saldo ?? (m.ingresos || 0) - (m.total || 0) : null));
  const mx = Math.max(1, ...sal.filter((s) => s != null).map(Math.abs));
  const barras = oculto ? "" : `<div class="pl-vist"><span class="pl-k">El año de un vistazo · saldo</span><div class="pl-bars" role="img" aria-label="Saldo de cada mes de ${anio}, según tu planilla">${MESES_AR.map((n, i) => {
    const s = sal[i], h = s == null ? 0 : Math.round(Math.abs(s) / mx * 44);
    return `<div class="b ${s == null ? "vacio" : s < 0 ? "neg" : "pos"} ${i === mes ? "on" : ""}"><span class="arr"><i style="height:${s != null && s >= 0 ? h : 0}px"></i></span><span class="ab"><i style="height:${s != null && s < 0 ? h : 0}px"></i></span><small>${may(n).slice(0, 3)}</small></div>`;
  }).join("")}</div></div>`;

  const ing = `<div class="pl-ing"><span class="pl-k">Ingresos · ${may(MESES_AR[mes])} ${anio}</span><b>${$(ingReal ?? ingP)}</b>
      ${ingReal != null && ingP ? `<span class="pl-ingp">planilla<br>${$(ingP)}</span>` : ""}
      <small>${ingReal != null ? esc(ingFuente || "de tus recibos") + (faltaBono ? `. Tu planilla dice ${$(ingP)}: ¿falta sumar un bono?` : "") : "De tu planilla (todavía no tengo el recibo de este mes)."}</small></div>`;

  return selAnios + selMeses + ing + `<div class="pl-cols"><span>Egresos</span><span>Planilla</span><span>${hayReal ? "Real" : ""}</span></div>` + grupos + tots + barras + (esAhora ? division(ctx, $) : "")
    + `<p class="fuente-dato">Hasta diciembre manda tu planilla ECONOMÍA: Orbe la lee y no la toca. Las cuentas son las de tu Excel: saldo = ingresos − egresos, semanal = saldo ÷ 4, diario = saldo ÷ 24.${hayReal ? " En gris, lo que todavía es estimado." : ""}</p>`;
}

// División con Agus: lo compartido de tu hoja DIVISIÓN, su mitad, y si ya te la pasó.
function division(ctx, $) {
  const b = presupuesto(ctx.fecha);
  const d = b.division;
  if (!d) return "";
  const ya = b.agus > 0, esperado = b.esperadoAgus ?? d.mitad;
  const filas = d.items.filter((i) => i.monto > 0).map((i) => `<li><span>${esc(may(i.concepto))}</span><b>${$(i.monto)}</b></li>`).join("");
  return `<section class="pl-div"><span class="pl-k">División con Agus · ${esc(b.p.nombre)}</span>
    <ul>${filas}<li class="t"><span>Total</span><b>${$(d.total || 0)}</b></li></ul>
    <div class="pl-mitad"><span>Mitad de Agus${b.ajustes.length ? `<small>menos ${b.ajustes.map((a) => esc(a.concepto.toLowerCase())).join(" y ")}</small>` : ""}</span><b>${$(esperado || 0)}</b></div>
    ${ya ? `<div class="pl-ya"><span>✓ Agus te pasó ${$(b.agus)}${b.agusMail ? " (lo vio Orbe en tus mails)" : ""}</span><button class="chip" data-accion="agus-paso" data-monto="${Math.round(b.agus)}">Corregir</button></div>`
      : `<p class="pl-preg">¿Agus te pasó su mitad?</p><div class="pl-ops"><button class="si" data-accion="agus-si" data-monto="${Math.round(esperado || 0)}">Sí, me la pasó</button><button data-accion="agus-no">Todavía no</button><button data-accion="agus-paso" data-monto="">Una parte</button></div>`}
  </section>`;
}
