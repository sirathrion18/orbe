// Páginas internas: universos, ideas, agenda, respiro, mis datos, ajustes, novedades.
import { UNIVERSOS, PROMOS, PROMOS_SIEMPRE, VERSION } from "./config.js";
import { NOVEDADES } from "./novedades.js";
import { ICONOS, MARCA } from "./iconos.js";
import { wPregunta, logoSemanal, esc, colorTipo, colorUniverso, datosPartido, resultadoTxt, torneoCorto, estadioCorto, regresiva } from "./inicio.js";
import { urgentesTodos, DIAS, DIAS_CORTOS, bloquesDe, bloquesFecha, pendientesCon, cuandoTexto, duracion, hhmm, MODOS, lunesDe, minutosDia, sumaTipo } from "./contexto.js";
import { datosListas, proximaAnual } from "./listas.js";
import { presupuesto, cuentaEnDiario, iso as isoDia } from "./presupuesto.js";
import { analisis, datosHist } from "./analisis.js";
import { datosEsc, cargoEn, conformadoDe, tuCargo, proximoCargo, grillaVsRecibo, estimadoNeto } from "./escalafon.js";
import { datosProd, resumenDia, banda, PRESETS, presetPuntos, historial, mesesConDatos, isoHoy, metaDe, HISTORICO, OFICIAL, hayPendientes } from "./productividad.js";
import { permisos as permisosG } from "./google.js";
import { leer, todo, sesion as sesionLeer } from "./almacen.js";
import { datosFinanzas, resumenMes, topesSugeridos } from "./finanzas.js";
import { linkHoja } from "./hoja.js";
import { ultimaSincro, activa as sincroActiva } from "./sincro.js";
import { RUBROS } from "./rubros.js";
import { datosFacu, promedio } from "./facu.js";
import { datosCampus } from "./campus.js";
import { paginaCampus } from "./campusui.js";
import { bloqueSatelite } from "./sateliteui.js";
import { datosEconomia, linkEconomia, idEconomia } from "./economia.js";
import { ultimaEdicion, htmlEdicion } from "./semanal.js";
import { GUINOS, guinosPrendidos, resumenGuinos } from "./guinos.js";
import { bloqueSuscripciones } from "./suscripciones.js";
import { heroHoy, avisoRacha, graficoDias, tarjetaAgus, heroMes, analisisGastos, bloqueMesReal, bloqueGastosHoy, bloqueGastosMes, bloqueSaldo } from "./finanzasui.js";
import { renderMes } from "./agendames.js";
import { bloqueHoy } from "./bnahoy.js";
import { equiposSeguidos } from "./extras.js";

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const volver = `<a class="volver" href="#/">${ICONOS.volver} Inicio</a>`;
const pronto = (titulo, texto) => `<section class="bloque pronto"><h2>${titulo}</h2><p class="vacio">${texto}</p></section>`;
const local = '<p class="vacio" style="margin-top:12px;font-size:12px">Por ahora se guarda solo en este dispositivo.</p>';

function cabecera(u, datos, tema) {
  return `${volver}<h1><i class="dot" style="width:12px;height:12px;border-radius:6px;vertical-align:middle;margin-right:10px;background:${colorUniverso(datos, u, tema)}"></i>${esc(u.nombre)}</h1>
    <p class="bajada">${esc(u.bajada)}</p>`;
}

// ---------- Este período (de cobro a cobro) ----------
function bloquePeriodo(ctx, $0) {
  const $ = (n) => (n < 0 ? "−" : "") + $0(Math.abs(n));
  const b = presupuesto(ctx.fecha);
  if (b.total == null) return "";
  const p = b.p;
  const dm = (d) => d.getDate() + "/" + (d.getMonth() + 1);
  const filas = [
    ["Ingreso", b.ingreso.monto != null ? $(b.ingreso.monto) : "falta", b.ingreso.fuente || "cargalo en ECONOMÍA"],
    ["Egresos de tu planilla", "− " + $(b.total), "TOTAL de " + p.nombre + " (con tus redondeos)"],
    ...(b.tarjetaAnterior ? [["Tarjeta ya contada", "+ " + $(b.tarjetaAnterior), "compras del período anterior que vienen en el resumen"]] : []),
    ["Para el día a día", b.base != null ? $(b.base) : "—", p.dias + " días, del " + dm(p.inicio) + " al " + dm(p.fin)]
  ];
  const dias = Object.entries(b.porDia).sort((x, y) => y[0].localeCompare(x[0])).slice(0, 7);
  const confirmar = b.ingreso.propuesta && b.ingreso.monto ? `<div class="chips" style="margin-top:10px"><button class="chip" data-accion="presu-confirmar" data-clave="${p.clave}" data-monto="${Math.round(b.ingreso.monto)}">Usar ${$(b.ingreso.monto)} como ingreso</button></div>
    <p class="fuente-dato">Ojo: tus egresos ya restan «PP + Gym», así que el ingreso tiene que ser el neto del recibo antes del descuento complementario; si no, el préstamo se cuenta dos veces.</p>` : "";
  const colchon = b.division || b.agus ? `<section class="bloque"><h2>Colchón de imprevistos</h2>
      <div class="trio"><div><span class="k">Agus te pasó</span><b>${$(b.agus)}</b></div><div><span class="k">Esperado</span><b>${b.esperadoAgus != null ? $(b.esperadoAgus) : "—"}</b></div><div></div></div>
      ${b.ajustes.map((a) => `<p class="fuente-dato">${esc(a.concepto)}: −${$(a.monto)} · cuota ${a.cuota} de ${a.cuotas}${a.cuota === a.cuotas ? " · ¡última!" : ""}</p>`).join("")}
      <p class="fuente-dato">Lo que te pasa Agus por la división no infla el diario: queda acá para los imprevistos.</p></section>` : "";
  return `<section class="bloque"><h2>Cómo se arma <span class="tag">${dm(p.inicio)} → ${dm(p.fin)}</span></h2>
      <ul class="lista">${filas.map(([a, v, n]) => `<li><span>${a}<br><small class="vacio">${esc(n)}</small></span><span class="der" style="font-size:18px">${v}</span></li>`).join("")}</ul>${confirmar}
      <p class="fuente-dato">Próximo cobro: ${DIAS[p.proximo.getDay()]} ${dm(p.proximo)}${p.extrasProximo ? " · " + esc(p.extrasProximo) : ""}. Cuentan tus gastos del día a día (de lo compartido, tu mitad); no cuentan los fijos de tu planilla, los pasajes ni los pases entre tus cuentas.</p></section>`;
}

// ---------- Tu planilla ECONOMÍA ----------
const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
function bloqueEconomia(ctx, $) {
  const e = datosEconomia();
  if (!idEconomia()) return "";
  if (!e) return '<section class="bloque"><h2>Tu planilla ECONOMÍA</h2><p class="vacio">Se lee en cuanto termine la sincronización.</p></section>';
  const cargados = e.meses.filter(Boolean);
  const m = e.meses[ctx.fecha.getMonth()] || cargados[cargados.length - 1];
  if (!m) return '<section class="bloque"><h2>Tu planilla ECONOMÍA</h2><p class="vacio">Todavía no hay meses cargados en la hoja ' + esc(e.anio || "") + '.</p></section>';
  const previo = [...cargados].reverse().find((x) => x.mes < m.mes);
  const antes = (c) => previo ? (previo.egresos.find((x) => x.concepto === c) || {}).monto || 0 : null;
  const max = Math.max(...m.egresos.map((x) => x.monto), 1);
  const maxSaldo = Math.max(...cargados.map((x) => Math.abs(x.saldo || 0)), 1);
  const div = e.division && e.division.actual;
  return `<section class="bloque"><h2>${esc(m.nombre.toLowerCase())} · tu planilla <a class="link" href="${esc(linkEconomia())}" target="_blank" rel="noopener" style="font-size:12px;letter-spacing:0;text-transform:none">abrir</a></h2>
      <p class="fz-big chico ${m.saldo < 0 ? "rojo" : ""}">${$(m.saldo || 0)}</p><p class="fz-sub" style="margin-top:0">${m.saldo < 0 ? "te falta" : "te sobra"} en ${esc(m.nombre.toLowerCase())}, según tu planilla</p>
      <div class="fz-mini" style="margin-bottom:6px"><span><small>Ingresos</small>${$(m.ingresos || 0)}</span><span><small>Egresos</small>${$(m.total || 0)}</span></div>
      ${m.diario != null ? `<p class="prom">${m.saldo < 0 ? "Te faltan" : "Te quedan"} unos <b>${$(Math.abs(m.diario))} por día</b> · ${$(Math.abs(m.semanal || 0))} por semana.</p>` : ""}
      ${(() => { const fila = (x) => { const a = antes(x.concepto); const d = a == null ? 0 : x.monto - a;
          return `<div class="eg"><div class="fila"><span>${esc(x.concepto)}</span><span>${$(x.monto)}${a != null && d !== 0 ? ` <small class="${d > 0 ? "sube" : "baja"}">${d > 0 ? "▲" : "▼"} ${$(Math.abs(d))}</small>` : ""}</span></div>
            <div class="barra"><i style="width:${Math.round(x.monto / max * 100)}%"></i></div></div>`; };
        const top = m.egresos.slice(0, 5), resto = m.egresos.slice(5);
        return `<div class="egresos">${top.map(fila).join("")}</div>${resto.length ? `<details class="mas"><summary>Ver los otros ${resto.length}</summary><div class="egresos">${resto.map(fila).join("")}</div></details>` : ""}`; })()}
      ${previo ? `<p class="fuente-dato">Flechas: contra ${esc(previo.nombre.toLowerCase())}.</p>` : ""}
      ${cargados.length > 1 ? `<div class="saldos" aria-label="Saldo de cada mes">${cargados.map((x) => { const h = Math.max(3, Math.round(Math.abs(x.saldo || 0) / maxSaldo * 48));
          return `<div class="${x.mes === m.mes ? "hoy" : ""}"><span class="arr">${x.saldo >= 0 ? `<i style="height:${h}px"></i>` : ""}</span><span class="aba">${x.saldo < 0 ? `<i class="neg" style="height:${h}px"></i>` : ""}</span><small>${MESES_CORTOS[x.mes]}</small></div>`; }).join("")}</div>
        <p class="fuente-dato" style="text-align:center">Saldo de cada mes ${esc(e.anio || "")}: arriba sobró, en rojo faltó.</p>` : ""}
    </section>
    ${div ? `<section class="bloque"><h2>Con Agus <span class="tag">DIVISIÓN</span></h2>
      <ul class="lista">${div.items.filter((i) => i.monto > 0).map((i) => `<li><span>${esc(i.concepto.charAt(0) + i.concepto.slice(1).toLowerCase())}</span><span class="der">${$(i.monto)}</span></li>`).join("")}</ul>
      <div class="fz-mini" style="margin-top:14px"><span><small>Total</small>${$(div.total || 0)}</span><span><small>Tu mitad</small>${$(div.mitad || 0)}</span></div>
      <p class="fuente-dato">El último bloque cargado de la hoja DIVISIÓN.</p></section>` : ""}`;
}

function bloqueAlias() {
  const a = datosEconomia()?.alias;
  if (!a || !a.cuentas.length) return "";
  return `<section class="bloque"><h2>Tus alias <span class="tag">tocá para copiar</span></h2><div class="alias">${a.cuentas.map((c) =>
    `<button class="al" data-accion="copiar" data-texto="${esc(c.alias || c.cbu)}"><span>${esc(c.banco)}</span><b>${esc(c.alias || c.cbu)}</b></button>`).join("")}</div></section>`;
}

// ---------- Universos ----------
const PAGINAS = {
  agus(datos, ctx) {
    const lista = leer("super", []);
    const menu = leer("menu", {});
    const orden = [1, 2, 3, 4, 5, 6, 0];
    const l = datosListas();
    const items = l?.agus || [];
    const hoy0 = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), ctx.fecha.getDate());
    const diasA = (iso) => Math.round((new Date(iso.slice(0, 10) + "T00:00") - hoy0) / 86400000);
    const fechaCorta = (iso) => { const d = new Date(iso.length > 10 ? iso : iso + "T12:00"); return DIAS_CORTOS[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1) + (iso.length > 10 ? " · " + iso.slice(11, 16) : ""); };

    // Cuentas regresivas: el viaje y las fechas que se repiten cada año.
    const fechas = items.filter((x) => x.tipo === "fecha" && x.fecha).map((x) => {
      const anual = /anual/i.test(x.nota);
      const p = anual ? proximaAnual(x.fecha, ctx.fecha) : { fecha: new Date(x.fecha.slice(0, 10) + "T12:00"), dias: diasA(x.fecha) };
      return { ...x, cuando: p.fecha, dias: p.dias };
    }).filter((x) => x.dias >= 0).sort((a, b) => a.dias - b.dias);
    const viaje = items.filter((x) => x.tipo === "viaje" && x.fecha && diasA(x.fecha) >= 0).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    const vuelos = items.filter((x) => x.tipo === "vuelo" && x.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const cuenta = (viaje || fechas.length) ? `<section class="bloque"><h2>Cuenta regresiva</h2>
      ${viaje ? `<div class="regresiva"><span class="cifra">${diasA(viaje.fecha)}</span><span><b>${diasA(viaje.fecha) === 1 ? "día" : "días"} para ${esc(viaje.titulo)}</b><br><span class="vacio">${esc(viaje.nota || fechaCorta(viaje.fecha))}</span></span></div>` : ""}
      ${fechas.length ? `<ul class="lista" style="margin-top:${viaje ? 14 : 0}px">${fechas.map((x) => `<li><span>${esc(x.titulo)}<br><small class="vacio">${x.cuando.getDate()} de ${MESES_LARGOS[x.cuando.getMonth()]}</small></span><span class="der">${cuandoTexto(x.dias)}</span></li>`).join("")}</ul>` : ""}
      ${vuelos.length ? `<details class="mas"><summary>Vuelos (${vuelos.length})</summary><ul class="lista">${vuelos.map((v) => `<li><span>${esc(v.titulo)}<br><small class="vacio">${esc(v.nota)}</small></span><span class="der">${esc(fechaCorta(v.fecha))}</span></li>`).join("")}</ul></details>` : ""}</section>` : "";

    // Planes y salidas.
    const planes = items.filter((x) => x.tipo === "plan").sort((a, b) => (a.hecho - b.hecho) || (a.fecha || "9").localeCompare(b.fecha || "9"));
    const tilde = (x) => `<li><label><input type="checkbox" data-accion="agus-tilde" data-fila="${x.fila}" ${x.hecho ? "checked" : ""}><span style="${x.hecho ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(x.titulo)}${x.nota ? `<br><small class="vacio">${esc(x.nota)}</small>` : ""}</span></label>${x.fecha ? `<span class="tag">${esc(fechaCorta(x.fecha))}</span>` : ""}</li>`;
    const bPlanes = `<section class="bloque"><h2>Planes y salidas</h2>
      <ul class="lista tps">${planes.filter((x) => !x.hecho).map(tilde).join("") || '<li class="vacio">Ningún plan anotado.</li>'}</ul>
      ${planes.some((x) => x.hecho) ? `<details class="mas"><summary>Hechos (${planes.filter((x) => x.hecho).length})</summary><ul class="lista tps">${planes.filter((x) => x.hecho).map(tilde).join("")}</ul></details>` : ""}
      <div class="chips" style="margin-top:12px"><button class="chip" data-accion="agus-nuevo" data-tipo="plan">+ Plan</button></div></section>`;

    // Pelis y series por ver.
    const ver = items.filter((x) => x.tipo === "peli" || x.tipo === "serie");
    const filaVer = (x) => tilde({ ...x, nota: (x.tipo === "serie" ? "Serie" : "Peli") + (x.nota ? " · " + x.nota : "") });
    const bVer = `<section class="bloque"><h2>Para ver</h2>
      <ul class="lista tps">${ver.filter((x) => !x.hecho).map(filaVer).join("") || '<li class="vacio">Nada en la lista todavía.</li>'}</ul>
      ${ver.some((x) => x.hecho) ? `<details class="mas"><summary>Vistas (${ver.filter((x) => x.hecho).length})</summary><ul class="lista tps">${ver.filter((x) => x.hecho).map(filaVer).join("")}</ul></details>` : ""}
      <div class="chips" style="margin-top:12px"><button class="chip" data-accion="agus-nuevo" data-tipo="peli">+ Peli o serie</button></div></section>`;

    const docs = items.filter((x) => x.tipo === "doc" && /^https:\/\//.test(x.url));
    const bDocs = docs.length ? `<section class="bloque"><h2>Docs</h2><div class="chips">${docs.map((d) => `<a class="chip" href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.titulo)}</a>`).join("")}</div></section>` : "";

    const sinHoja = !l ? `<section class="bloque"><h2>Planes y fechas</h2><ul class="lista">${(datos.fechas || []).map((f) => `<li><span>${esc(f.titulo)}</span><span class="der">${esc(f.fecha.split("-").reverse().join("/"))}</span></li>`).join("") || '<li class="vacio">Sin planes cargados.</li>'}</ul>
      <p class="fuente-dato">Fechas, viaje, planes y pelis se arman en tu planilla cuando actives la sincronización en Ajustes.</p></section>` : "";

    return `${cuenta}${l ? bPlanes + bVer + bDocs : sinHoja}
    <section class="bloque"><h2>Lista del súper</h2>
      <ul class="lista">${lista.length ? lista.map((it, i) => `<li><label style="display:flex;gap:10px;align-items:center;flex:1">
        <input type="checkbox" data-accion="super-tilde" data-i="${i}" ${it.ok ? "checked" : ""} style="width:20px;height:20px">
        <span style="${it.ok ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(it.t)}</span></label>
        <button class="ojo" data-accion="super-borrar" data-i="${i}" aria-label="Sacar ${esc(it.t)}">${ICONOS.cruz}</button></li>`).join("") : '<li class="vacio">La lista está vacía.</li>'}</ul>
      <form class="form" data-form="super"><input name="t" placeholder="Agregar algo" aria-label="Agregar a la lista" required><button class="btn">Sumar</button></form></section>
    <section class="bloque"><h2>Menú de la semana</h2>
      <div style="display:grid;gap:8px">${orden.map((d) => `<label style="display:flex;gap:10px;align-items:center">
        <span style="width:40px;font-size:13px;color:var(--muted)">${DIAS_CORTOS[d]}</span>
        <input class="campo-menu" data-dia="${d}" value="${esc(menu[d] || "")}" placeholder="¿Qué se come?" style="flex:1;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-size:15px"></label>`).join("")}</div>
      ${sincroActiva() ? "" : local}</section>
    ${pronto("Cuenta de Agus", "Más adelante Agus entra con su Google y ve solo esto: súper, menú, planes, pelis y fechas.")}`;
  },

  bna(datos, ctx) {
    const hoy0 = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), ctx.fecha.getDate());
    const nombreDia = (f) => {
      const n = Math.round((f - hoy0) / 86400000);
      return n === 0 ? "Hoy" : n === 1 ? "Mañana" : DIAS_CORTOS[f.getDay()] + " " + f.getDate();
    };
    const semana = (n) => {
      const l = lunesDe(ctx.fecha, n);
      const dias = [0, 1, 2, 3, 4, 5, 6].map((i) => new Date(l.getFullYear(), l.getMonth(), l.getDate() + i));
      const s = sumaTipo(datos, l, dias[6], "bna", ctx.fecha);
      const filas = dias.map((f) => {
        const m = minutosDia(datos, f, "bna", ctx.fecha);
        if (!m.hecho && !m.agenda) return "";
        const pasado = f < hoy0;
        const der = pasado ? `<span class="vacio">${duracion(m.hecho)}${m.estimado ? " · horario fijo" : ""}</span>`
          : bloquesFecha(datos, f).filter((x) => x.tipo === "bna").map((x) => x.inicio + "–" + hhmm(x.fin)).join(", ");
        return `<li style="${pasado ? "opacity:.6" : ""}"><span>${nombreDia(f)}</span><span class="der">${der}</span></li>`;
      }).join("");
      return `<section class="bloque"><h2>${n === 0 ? "Esta semana" : "Semana que viene"} <span class="tag">${duracion(s.hecho + s.agenda)}</span></h2>
        <ul class="lista">${filas || '<li class="vacio">Sin horarios.</li>'}</ul></section>`;
    };
    // Horas: lo trabajado y lo que falta, de la semana y del mes.
    const sem = sumaTipo(datos, lunesDe(ctx.fecha, 0), new Date(lunesDe(ctx.fecha, 0).getTime() + 6 * 86400000), "bna", ctx.fecha);
    const pm = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), 1), um = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth() + 1, 0);
    const mes = sumaTipo(datos, pm, um, "bna", ctx.fecha);
    const h = (min) => (Math.round(min / 6) / 10).toLocaleString("es-AR") + " h";
    // Choques: dos eventos del BNA el mismo día, o el calendario distinto del horario fijo.
    const ag = datos.agenda;
    const avisosHorario = [];
    if (ag) {
      Object.entries(ag.conflictos || {}).filter(([d]) => d >= isoHoy(ctx.fecha)).forEach(([d, cs]) => cs.filter((c) => c.tipo === "bna").forEach((c) =>
        avisosHorario.push(`${diaLargo(d)}: dejé ${c.queda} y descarté ${c.descartado}${c.cal ? " (calendario «" + esc(c.cal) + "»)" : ""}.`)));
      const fijo = leer("horario", {});
      for (let i = 0; i < 7; i++) {
        const f = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), ctx.fecha.getDate() + i);
        const h = fijo[f.getDay()], cal = (ag.porDia[isoHoy(f)] || []).find((b) => b.tipo === "bna");
        if (h && h.inicio && cal && (cal.inicio !== h.inicio || cal.fin !== h.fin)) avisosHorario.push(`${diaLargo(isoHoy(f))}: el calendario dice ${cal.inicio}–${cal.fin} y tu horario fijo ${h.inicio}–${h.fin}.`);
      }
    }
    const aviso = avisosHorario.length ? `<section class="bloque aviso-suave"><h2>Ojo con los horarios</h2><ul class="lista">${[...new Set(avisosHorario)].map((t) => `<li><span>${t}</span></li>`).join("")}</ul>
      <p class="fuente-dato">El horario fijo se cambia en Ajustes; el del calendario, en Google Calendar.</p></section>` : "";
    const horas = `<section class="bloque"><h2>Horas</h2><div class="trio">
        <div><span class="k">Semana</span><b>${h(sem.hecho)}</b><span class="fuente-dato" style="margin:0">de ${h(sem.hecho + sem.agenda)}</span></div>
        <div><span class="k">${MESES_LARGOS[ctx.fecha.getMonth()]}</span><b>${h(mes.hecho)}</b><span class="fuente-dato" style="margin:0">de ${h(mes.hecho + mes.agenda)}</span></div>
        <div><span class="k">Días</span><b>${mes.diasHechos}</b><span class="fuente-dato" style="margin:0">de ${mes.dias} en el mes</span></div></div>
      <p class="fuente-dato">Trabajadas hasta ahora, sobre el total con lo que queda en tu agenda${mes.estimado ? ". Los días sin evento en el calendario se cuentan con tu horario fijo" : ""}.</p></section>`;
    // Sueldo: lo que Orbe leyó de tus recibos (hoja MES).
    const oculto = leer("plataOculta", false);
    const $ = (n) => oculto ? "••••" : "$\u00a0" + Math.round(n).toLocaleString("es-AR");
    const meses = (datosFinanzas()?.meses || []).slice().sort((a, b) => b.mes.localeCompare(a.mes)).slice(0, 3);
    const nombreMes = (m) => { const [y, mm] = m.split("-").map(Number); return MESES_LARGOS[mm - 1] + (y !== ctx.fecha.getFullYear() ? " " + y : ""); };
    const sueldo = meses.length ? `<section class="bloque"><h2>Sueldo <span class="tag">de tus recibos</span></h2><ul class="lista">${meses.map((m) =>
      `<li><span>Para vivir en ${nombreMes(m.mes)}<br><small class="vacio">${esc(m.fuente)}</small></span><span class="der">${$(m.disponible)}</span></li>`).join("")}</ul>
      <p class="fuente-dato">Disponible real = neto − talón complementario. Lo leo de tu carpeta BNA en Drive.</p></section>`
      : pronto("Sueldo", "Cuando des permiso de Drive en Ajustes, leo tus recibos de la carpeta BNA y te muestro el disponible real de cada mes.");
    const tab = sesionLeer("bnaTab") || "hoy";
    const pestanas = `<div class="pestanas" role="tablist">${[["hoy", "Hoy"], ["prod", "Productividad"], ["horas", "Horarios y sueldo"]].map(([id, t]) =>
      `<button class="pestana ${tab === id ? "on" : ""}" role="tab" aria-selected="${tab === id}" data-accion="bna-tab" data-tab="${id}">${t}</button>`).join("")}</div>`;
    const nunca = `<section class="bloque"><h2>Lo que nunca entra</h2><p class="vacio">Solo tus números: nada de clientes, compañeros ni el contenido de los informes.</p></section>`;
    if (tab === "hoy") return pestanas + bloqueHoy(ctx) + nunca;
    if (tab === "prod") return pestanas + bloqueProductividad(ctx) + nunca;
    return `${pestanas}${aviso}${semana(0)}${semana(1)}${horas}${sueldo}
      <section class="bloque"><h2>Fichar</h2><p>Media hora antes de entrar, Inicio te recuerda fichar en Teams. Tocás «Listo» y desaparece hasta el día siguiente.</p></section>
      ${bloqueEscalafon(ctx, $)}${nunca}`;
  },

  ufasta(datos, ctx) {
    const f = datosFacu();
    const c = datosCampus();
    if (c && c.datos) {
      const hace = (ts) => { const d = Math.round((Date.now() - ts) / 86400000); return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días"; };
      const feed = (f?.feed || []).slice(0, 8);
      const mails = feed.length ? `<section class="bloque"><details class="mas"><summary>Avisos por mail (${feed.length})</summary><ul class="lista">${feed.map((x) => `<li><span>${esc(x.titulo)}${x.materia ? `<br><small class="vacio">${esc(x.materia)}</small>` : ""}</span><span class="tag">${hace(x.ts)}</span></li>`).join("")}</ul></details></section>` : "";
      return paginaCampus(c, ctx, mails);
    }
    const entregas = pendientesCon(datos, ctx.fecha).filter((p) => p.tipo === "facu" && p.dias >= -3);
    const proximas = `<section class="bloque"><h2>Próximas entregas</h2><ul class="lista">${entregas.map((p) => `<li><span>${esc(p.titulo)}${p.nota ? `<br><small class="vacio">${esc(p.nota)}</small>` : ""}</span><span class="der ${p.dias <= 3 ? "rojo" : ""}">${cuandoTexto(p.dias)}</span></li>`).join("") || '<li class="vacio">Nada con fecha. Cuando cargues la fecha de un TP, aparece acá y en Inicio 3 días antes.</li>'}</ul></section>`;
    if (!f) return proximas + '<section class="bloque"><h2>Materias</h2><p class="vacio">Se arman en cuanto actives la sincronización en Ajustes.</p></section>';
    const hace = (ts) => { const d = Math.round((Date.now() - ts) / 86400000); return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días"; };
    const ICON = { entrega: "✓", devolucion: "💬", recordatorio: "⏰", clase: "📘", mensaje: "✉", examen: "🎓", aviso: "•", general: "•" };
    const notasTodas = f.materias.flatMap((m) => m.notas);
    const tarjetas = f.materias.map((m) => {
      const tps = f.tps.filter((t) => t.materia === m.materia);
      const hechos = tps.filter((t) => t.hecho).length;
      const pend = tps.filter((t) => !t.hecho).sort((a, b) => (a.fecha || "9") .localeCompare(b.fecha || "9"));
      const prox = pend.find((t) => t.fecha);
      const diasProx = prox ? Math.round((new Date(prox.fecha + "T12:00") - ctx.fecha) / 86400000) : null;
      const ult = f.feed.find((x) => x.materia === m.materia);
      const prom = promedio(m.notas);
      return `<section class="bloque materia"><h2>${esc(m.materia)}${prom !== null ? ` <span class="tag">promedio ${prom.toFixed(1).replace(".", ",")}</span>` : ""}</h2>
        ${prox ? `<p><b>${esc(prox.titulo)}</b> <span class="${diasProx <= 3 ? "rojo-txt" : "vacio"}">· ${cuandoTexto(diasProx)}</span></p>` : pend.length ? `<p>${pend.length} pendiente${pend.length === 1 ? "" : "s"} sin fecha</p>` : '<p class="vacio">Nada pendiente.</p>'}
        ${tps.length ? `<div class="barra" style="margin:10px 0 4px"><i style="width:${Math.round(hechos / tps.length * 100)}%;background:var(--text);opacity:.55"></i></div><p class="fuente-dato" style="margin-top:2px">${hechos} de ${tps.length} TPs hechos</p>` : ""}
        ${ult ? `<p class="fuente-dato">${ICON[ult.tipo] || "•"} ${esc(ult.titulo)} · ${hace(ult.ts)}</p>` : ""}
        ${tps.length ? `<details class="mas"><summary>Ver TPs</summary><ul class="lista tps">${tps.map((t) => `<li><label><input type="checkbox" data-accion="tp-tilde" data-id="${esc(t.id)}" ${t.hecho ? "checked" : ""}><span style="${t.hecho ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(t.titulo)}</span></label>${t.fecha ? `<span class="tag">${esc(t.fecha.slice(8, 10) + "/" + t.fecha.slice(5, 7))}</span>` : ""}</li>`).join("")}</ul></details>` : ""}
        <div class="chips" style="margin-top:12px"><button class="chip" data-accion="tp-nuevo" data-materia="${esc(m.materia)}">+ TP</button><button class="chip" data-accion="materia-editar" data-materia="${esc(m.materia)}">Notas y links</button>
          ${m.aula ? `<a class="chip" href="${esc(m.aula)}" target="_blank" rel="noopener">Aula</a>` : ""}${m.links.map((l) => `<a class="chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.titulo)}</a>`).join("")}</div></section>`;
    }).join("");
    const sueltos = f.tps.filter((t) => !t.materia && !t.hecho);
    const feed = f.feed.slice(0, 8);
    return `${notasTodas.length ? `<section class="bloque"><h2>Promedio general</h2><p class="cifra">${promedio(notasTodas).toFixed(2).replace(".", ",")}</p><p class="fuente-dato">${notasTodas.length} notas cargadas.</p></section>` : ""}
      ${proximas}${tarjetas}
      ${sueltos.length ? `<section class="bloque"><h2>Sin materia asignada</h2><ul class="lista">${sueltos.map((t) => `<li><span>${esc(t.titulo)}</span><button class="chip" data-accion="tp-materia" data-id="${esc(t.id)}">Asignar</button></li>`).join("")}</ul></section>` : ""}
      <section class="bloque"><h2>Novedades del campus</h2>${feed.length ? `<ul class="lista">${feed.map((x) => `<li><span>${ICON[x.tipo] || "•"} ${esc(x.titulo)}${x.materia ? `<br><small class="vacio">${esc(x.materia)}</small>` : ""}</span><span class="tag">${hace(x.ts)}</span></li>`).join("")}</ul>` : '<p class="vacio">Llegan de los mails del aula virtual.</p>'}
        <p class="fuente-dato">Orbe lee solo el asunto de los mails del aula: si dice que entregaste, tilda el TP solo; si es un recordatorio, lo agrega.</p></section>
      <section class="bloque"><h2>Accesos</h2><div class="chips"><a class="chip" href="https://ead01.ufasta.edu.ar" target="_blank" rel="noopener">Aula virtual</a><a class="chip" href="https://www.ufasta.edu.ar" target="_blank" rel="noopener">Sitio de UFASTA</a></div></section>`;
  },

  bienestar(datos, ctx) {
    const l0 = lunesDe(ctx.fecha, 0), d0 = new Date(l0.getTime() + 6 * 86400000);
    const meta = (tipo, nombre) => {
      const s = sumaTipo(datos, l0, d0, tipo, ctx.fecha);
      const ok = s.diasHechos >= 1;
      // Próximo en agenda esta semana, si todavía no se cumplió.
      let prox = "";
      if (!ok) for (let d = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), ctx.fecha.getDate()); d <= d0; d.setDate(d.getDate() + 1)) {
        if (minutosDia(datos, new Date(d), tipo, ctx.fecha).agenda) { prox = DIAS[d.getDay()]; break; }
      }
      return `<div class="meta ${ok ? "ok" : ""}"><span class="k">${nombre}</span><b>${s.diasHechos} / 1</b>
        <span class="fuente-dato" style="margin:0">${ok ? "Cumplido" : prox ? "En agenda el " + prox : "Sin nada en agenda"}</span></div>`;
    };
    // Las últimas 3 semanas completas.
    const cumplidas = [1, 2, 3].filter((n) => {
      const l = lunesDe(ctx.fecha, -n), d = new Date(l.getTime() + 6 * 86400000);
      return sumaTipo(datos, l, d, "gym", ctx.fecha).diasHechos >= 1 && sumaTipo(datos, l, d, "futbol", ctx.fecha).diasHechos >= 1;
    }).length;
    const pm = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), 1);
    const hoy0 = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth(), ctx.fecha.getDate());
    const gymMes = sumaTipo(datos, pm, hoy0, "gym", ctx.fecha).diasHechos, futMes = sumaTipo(datos, pm, hoy0, "futbol", ctx.fecha).diasHechos;
    const semanaHtml = `<section class="bloque"><h2>Esta semana <span class="tag">meta: 1 gym + 1 fútbol</span></h2>
      <div class="metas">${meta("gym", "Gym")}${meta("futbol", "Fútbol")}</div>
      <p class="fuente-dato">En ${MESES_LARGOS[ctx.fecha.getMonth()]}: ${gymMes} de gym y ${futMes} de fútbol. Cumpliste ${cumplidas} de las últimas 3 semanas. Sale de tu calendario.</p></section>`;

    // Fútbol: registro de cada partido en tu planilla.
    const l = datosListas();
    const ps = (l?.futbol || []).slice().sort((a, b) => b.fecha.localeCompare(a.fecha));
    const R = { G: "Ganamos", E: "Empate", P: "Perdimos" };
    const cuenta = (r) => ps.filter((p) => p.resultado === r).length;
    const goles = ps.reduce((s, p) => s + p.goles, 0);
    const futbol = l ? `<section class="bloque"><h2>Fútbol</h2>
      ${ps.length ? `<div class="trio"><div><span class="k">Partidos</span><b>${ps.length}</b></div><div><span class="k">G · E · P</span><b>${cuenta("G")} · ${cuenta("E")} · ${cuenta("P")}</b></div><div><span class="k">Goles</span><b>${goles}</b></div></div>
        <ul class="lista" style="margin-top:14px">${ps.slice(0, 5).map((p) => `<li><span>${R[p.resultado] || "Jugado"}${p.goles ? ` · ${p.goles} gol${p.goles === 1 ? "" : "es"}` : ""}${p.nota ? `<br><small class="vacio">${esc(p.nota)}</small>` : ""}</span><span class="tag">${esc(p.fecha.slice(8, 10) + "/" + p.fecha.slice(5, 7))}</span></li>`).join("")}</ul>`
        : '<p class="vacio">Todavía no anotaste partidos.</p>'}
      <div class="chips" style="margin-top:12px"><button class="chip" data-accion="partido-nuevo">+ Anotar partido</button></div></section>`
      : `<section class="bloque"><h2>Fútbol</h2><p class="vacio">El registro de partidos vive en tu planilla: activá la sincronización en Ajustes.</p></section>`;

    return `${semanaHtml}${futbol}
      <section class="bloque"><h2>Meditación</h2><div class="medita"><span class="reloj" id="medita-reloj">05:00</span>
        <div class="chips">${[3, 5, 10].map((m) => `<button class="chip" data-accion="medita" data-min="${m}">${m} min</button>`).join("")}<button class="chip" data-accion="medita-parar">Parar</button></div></div></section>
      <section class="bloque"><h2>Comida</h2><p>El menú de la semana vive en Amorcitos.</p><div class="chips" style="margin-top:12px"><a class="chip" href="#/u/agus">Ver menú con Agus</a></div></section>
      ${pronto("Pasos y sueño", "Llegan con Satélite, la mini app Android que lee Health Connect de tu celu y del reloj.")}
      ${pronto("Rutina de gym", "La armamos más adelante.")}`;
  },

  finanzas(datos, ctx) {
    const fin = datosFinanzas();
    const r = resumenMes(fin, ctx.fecha);
    const oculto = leer("plataOculta", false);
    const $ = (n) => oculto ? "••••" : "$\u00a0" + Math.round(n).toLocaleString("es-AR");
    // En Finanzas, solo lo que es plata (lo urgente de todo junto vive en Inicio).
    const esFacu = (x) => x.tipo === "facu" || x.universo === "ufasta" || /foro|\btp\b|entrega|parcial|actividad|campus|consigna/i.test(x.titulo || "");
    const venc = pendientesCon(datos, ctx.fecha).filter((x) => x.universo === "finanzas" && x.dias >= -60 && !esFacu(x));
    const dia = ctx.fecha.getDay();
    const cuandoMov = (ts) => { const d = new Date(ts); return d.getDate() + "/" + (d.getMonth() + 1); };
    const CLASE = { gasto: "", "gasto-tarjeta": "tarjeta", tarjeta: "pago de tarjeta", deuda: "cuota", ahorro: "ahorro", propia: "entre tus cuentas", usd: "dólares", ingreso: "ingreso", devolucion: "devolución" };
    const filaMov = (m) => {
      const entra = m.clase === "ingreso" || m.clase === "devolucion";
      return `<button class="mov" data-accion="fin-mov" data-id="${esc(m.id)}"><span class="q">${esc(m.contra || m.tipo)}</span>
        <span class="m ${entra ? "entra" : ""}">${entra ? "+ " : ""}${m.moneda === "USD" ? "US$ " + m.monto : $(m.monto || 0)}</span>
        <span class="d">${cuandoMov(m.ts)} · ${esc(m.rubro || CLASE[m.clase] || m.clase)}${m.clase === "gasto-tarjeta" ? ' <span class="tag">tarjeta</span>' : ""}${CLASE[m.clase] && m.clase !== "gasto-tarjeta" && m.rubro ? ` <span class="tag">${CLASE[m.clase]}</span>` : ""}${m.mitad ? ' <span class="tag">tu mitad</span>' : ""}${m.revisar ? ' <span class="tag rojo">a revisar</span>' : ""}</span></button>`;
    };

    let cabeza;
    if (!fin) {
      cabeza = `<section class="bloque"><h2>Tu plata al día</h2><p>Orbe lee los avisos del BNA y de Mercado Pago, los ordena por rubro y te dice cuánto te queda del mes.</p>
        <div class="chips" style="margin-top:14px"><a class="btn" href="#/ajustes" style="display:inline-flex;align-items:center;text-decoration:none">Activar en Ajustes</a></div></section>`;
    } else {
      cabeza = `<section class="bloque"><h2>Según tus movimientos <button class="link" data-accion="fin-actualizar" style="font-size:12px;letter-spacing:0;text-transform:none">actualizar</button></h2>
        ${r.queda == null ? '<p class="vacio">Falta el disponible del mes: cargalo en la hoja MES de tu planilla.</p>' : `
        <p class="cifra" style="${r.queda < 0 ? "color:var(--accent)" : ""}">${$(r.queda)}</p>
        <div class="barra" style="margin:10px 0 8px"><i style="width:${Math.round(r.usado * 100)}%"></i></div>
        <p class="prom" style="margin-top:0">Salió ${$(r.salio)} de ${$(r.disponible)} · quedan ${r.diasRestantes} días.</p>
        <p class="fuente-dato">Disponible: ${esc(r.base.fuente || "hoja MES")}${r.propio ? "" : " (último cargado, de " + esc(r.base.mes) + ")"}.
          Las compras con tarjeta cuentan en su rubro al comprar y en lo que te queda cuando pagás la tarjeta.</p>`}
      </section>`;
    }

    const sugeridos = topesSugeridos(fin, ctx.fecha);
    const pasados = r ? r.topes.filter((t) => t.pct >= 1) : [];
    const aviso = pasados.length ? `<section class="bloque aviso-suave"><p><b>${esc(pasados[0].rubro)}</b> ya va ${Math.round(pasados[0].pct * 100)}% del tope del mes: ${$(pasados[0].gastado)} de ${$(pasados[0].tope)}${r.diasRestantes ? `, y faltan ${r.diasRestantes} días` : ""}.${pasados.length > 1 ? ` También ${pasados.slice(1).map((t) => esc(t.rubro)).join(" y ")}.` : ""}</p></section>` : "";
    const topes = r && (r.topes.length || sugeridos.length) ? `<section class="bloque"><h2>Topes del mes</h2>${r.topes.map((t) => `<div class="tope ${t.pct >= 0.8 ? "alerta" : ""}">
        <div class="fila"><span>${esc(t.rubro)}</span><span>${$(t.gastado)} de ${$(t.tope)} · ${Math.round(t.pct * 100)}%</span></div>
        <div class="barra"><i style="width:${Math.min(100, Math.round(t.pct * 100))}%"></i></div></div>`).join("")}
        ${sugeridos.length ? `<h2 style="margin-top:18px">Sugeridos según tu historial</h2><ul class="lista">${sugeridos.map((x) => { const actual = r.topes.find((t) => t.rubro === x.rubro);
          return `<li><span>${esc(x.rubro)}<br><small class="vacio">promedio ${$(x.promedio)}/mes${actual ? " · hoy " + $(actual.tope) : ""}</small></span>
            ${actual && actual.tope === x.sugerido ? '<span class="estado ok">✓</span>' : `<button class="chip" data-accion="usar-tope" data-rubro="${esc(x.rubro)}" data-tope="${x.sugerido}">Usar ${$(x.sugerido)}</button>`}</li>`; }).join("")}</ul>
          <p class="fuente-dato">Un 20% menos que tu promedio de los últimos ${sugeridos[0].meses} meses con datos.</p>` : ""}
        ${!sugeridos.length ? '<p class="fuente-dato">Las sugerencias de topes aparecen cuando Orbe tenga un mes completo de datos (desde noviembre).</p>' : ""}
        <p class="fuente-dato">Por ahora Orbe ve las compras con tarjeta de los resúmenes y de los avisos de Mercado Pago; el resto llega con Satélite.</p></section>` : "";

    const revisar = r && r.revisar.length ? `<section class="bloque" style="background:var(--urg-bg)"><h2>A revisar <span class="tag">${r.revisar.length}</span></h2>
        <p class="vacio" style="margin-bottom:8px">Tocá cada uno para decirme qué es. Lo aprendo para la próxima.</p>
        <div class="lista-mov">${r.revisar.slice(0, 8).map(filaMov).join("")}</div></section>` : "";

    const rubros = r && r.porRubro.length ? `<section class="bloque"><h2>Gastos por rubro</h2><ul class="lista">${r.porRubro.map(([k, v]) => `<li><span>${esc(k)}</span><span class="der">${$(v)}</span></li>`).join("")}</ul></section>` : "";

    const movs = r ? `<section class="bloque"><h2>Movimientos del mes <span class="tag">${r.movs.length}</span></h2>
        ${r.movs.length ? `<div class="lista-mov">${r.movs.slice(0, 40).map(filaMov).join("")}</div>` : '<p class="vacio">Todavía no hay movimientos este mes.</p>'}
        ${r.usd.length ? `<p class="fuente-dato">En dólares, aparte: ${r.usd.map((m) => esc(m.contra) + " US$ " + m.monto).join(" · ")}.</p>` : ""}</section>` : "";

    const deudas = fin && fin.deudas.length ? `<section class="bloque"><h2>Deuda</h2>${fin.deudas.map((d) => `<div class="deuda">
        <div class="fila"><span>${esc(d.nombre)}${d.tasa ? ` <span class="tag">${String(d.tasa).replace(".", ",")}% mensual</span>` : d.tasa === 0 ? ' <span class="tag">sin interés</span>' : ' <span class="tag rojo">tasa ?</span>'}</span>
          <span class="der" style="font-family:var(--serif);font-size:20px">${d.saldo != null ? $(d.saldo) : d.cuota ? $(d.cuota) + "/mes" : "?"}</span></div>
        <div class="nota">${d.saldo != null && d.cuota ? (d.tipo === "tarjeta" ? "Mínimo " : "Cuota ") + $(d.cuota) + " · " : ""}${d.vence ? "vence " + esc(d.vence) + " · " : ""}${esc(d.nota || "")}<br>Fuente: ${esc(d.fuente || "?")}${d.al ? ", al " + esc(d.al) : ""}.</div></div>`).join("")}
        ${(() => { const caras = fin.deudas.filter((d) => d.tasa > 0 && d.saldo > 0); const costo = caras.reduce((s, d) => s + d.saldo * d.tasa / 100, 0); return costo ? `<p class="fuente-dato">Lo que cuesta no bajar las tarjetas: unos ${$(costo)} por mes de intereses, al ritmo de hoy.</p>` : ""; })()}</section>` : "";

    const dl = leer("dolar");
    const dolar = dl?.oficial ? `<section class="bloque"><h2>Dólar hoy <span class="tag">dolarapi.com</span></h2><div class="trio">
        <div><span class="k">Oficial</span><b>$ ${Math.round(dl.oficial.venta).toLocaleString("es-AR")}</b></div>
        <div><span class="k">MEP</span><b>$ ${Math.round(dl.mep?.venta || 0).toLocaleString("es-AR")}</b></div>
        <div><span class="k">Blue</span><b>${dl.blue ? "$\u00a0" + Math.round(dl.blue.venta).toLocaleString("es-AR") : "—"}</b></div></div></section>` : "";
    let tabF = sesionLeer("finTab") || "hoy";
    if (tabF === "periodo") tabF = "hoy";
    const pestF = `<div class="pestanas" role="tablist">${[["hoy", "Hoy"], ["mes", "Mes"], ["analisis", "Análisis"], ["cuentas", "Cuentas"]].map(([id, t]) =>
      `<button class="pestana ${tabF === id ? "on" : ""}" role="tab" aria-selected="${tabF === id}" data-accion="fin-tab" data-tab="${id}">${t}</button>`).join("")}</div>`;
    const vencHtml = `<section class="bloque"><h2>Pagos y vencimientos ${datos.agenda ? "" : '<span class="ejemplo">Ejemplo</span>'}</h2><ul class="lista">${venc.map((d) => `<li style="align-items:flex-start"><span style="display:flex;flex-direction:column;gap:4px;min-width:0"><span>${esc(d.titulo)}${d.vernet ? ' <span class="tag">Vernet</span>' : ""}${d.nota ? ` <span class="tag">${esc(d.nota)}</span>` : ""}</span>${d.monto ? `<b>${esc(d.monto)}</b>` : ""}<span class="der ${d.dias <= 7 && !d.vernet ? "rojo" : ""}" style="font-size:17px">${cuandoTexto(d.dias)}</span></span>
        <button class="hecho" style="margin:0" data-accion="hecho" data-clave="${esc(d.clave)}" aria-label="Marcar ${esc(d.titulo)} como hecho">${ICONOS.check}</button></li>`).join("") || '<li class="vacio">Nada pendiente.</li>'}</ul>
        ${leer("hechos", []).length ? '<button class="link" style="margin-top:12px;font-size:13px" data-accion="deshacer-hechos">Volver a mostrar los marcados como hechos</button>' : ""}</section>`;
    const plegable = (titulo, html) => html ? `<details class="bloque plegable"><summary>${titulo}</summary>${html.replace(/^<section class="bloque[^"]*">/, "").replace(/<\/section>\s*$/, "")}</details>` : "";
    const promos = `<section class="bloque"><ul class="lista">${((datosEconomia()?.alias?.promos?.[dia]?.length ? datosEconomia().alias.promos[dia] : null) || (PROMOS[dia] || []).concat(PROMOS_SIEMPRE)).map((x) => `<li><span>${esc(x)}</span></li>`).join("")}</ul>
        <p class="vacio" style="margin-top:10px;font-size:12px">Los topes cambian seguido: verificalos antes de pagar.</p></section>`;
    if (tabF === "analisis") return pestF + analisisGastos(ctx, $, oculto) + `<h2 class="fz-titulo">Tu historia con la plata</h2>` + bloqueAnalisis($);
    if (tabF === "mes") { const mr = bloqueMesReal(ctx, $, oculto, linkEconomia()); return `${pestF}${heroMes(ctx, $)}${bloqueGastosMes(ctx, $)}${mr || bloquePeriodo(ctx, $)}${vencHtml}${revisar}${mr ? "" : bloqueEconomia(ctx, $)}${plegable("Todos los movimientos del mes", movs.replace(/<h2>[\s\S]*?<\/h2>/, ""))}`; }
    if (tabF === "cuentas") return `${pestF}${bloqueSaldo(ctx, $, oculto)}${deudas}${bloqueSuscripciones(ctx.fecha)}${bloqueAlias()}
      ${plegable("Promos de hoy, " + DIAS[dia], promos)}${plegable("Dólar hoy", dolar)}${plegable("Topes del mes", topes)}
      ${linkHoja() ? `<section class="bloque"><h2>Planilla</h2><p>Todo vive en tu planilla <b>Orbe · datos</b>: podés corregir a mano lo que quieras.</p><div class="chips" style="margin-top:12px"><a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Abrir la planilla</a></div></section>` : ""}`;
    // Hoy: lo mismo que Inicio, el gasto día por día y Agus.
    return `${pestF}${heroHoy(ctx, $, oculto)}${avisoRacha(ctx, $)}${aviso}${wPregunta() ? `<section class="preg-fin">${wPregunta()}</section>` : ""}${bloqueGastosHoy(ctx, $)}${graficoDias(ctx, $, oculto)}${tarjetaAgus(ctx, $)}${cabeza.includes("Activar en Ajustes") ? cabeza : ""}`;
  },

  proyectos(datos) {
    const l = datosListas();
    const gh = l?.github || {};
    const lista = (l?.proyectos?.length ? l.proyectos : (datos.proyectos || []).map((p) => ({ ...p, proximos: p.proximo ? [p.proximo] : [] })))
      .filter((p) => !/^(ntn|sur)$/i.test(p.id));
    const hace = (iso) => { const d = Math.round((Date.now() - new Date(iso)) / 86400000); return d <= 0 ? "hoy" : d === 1 ? "ayer" : "hace " + d + " días"; };
    const repoUrl = (r) => !r ? "" : /^https?:/.test(r) ? r : "https://github.com/" + r;
    return lista.map((p) => {
      const g = gh[p.repo];
      let ultimo = g?.fecha ? `<p class="fuente-dato" style="margin-top:0">Último cambio ${hace(g.fecha)}: ${esc(g.mensaje)}${g.semana ? ` · ${g.semana} ${g.semana === 1 ? "cambio" : "cambios"} esta semana` : ""}</p>` : g?.privado ? '<p class="fuente-dato" style="margin-top:0">Repo privado: sin datos de cambios.</p>' : "";
      if (p.id === "semanal") {
        // El Semanal no tiene repo: su seguimiento son las ediciones.
        const e = ultimaEdicion();
        ultimo = e ? `<p class="fuente-dato" style="margin-top:0">Última edición: ${esc(e.nombre)}${e.numero ? " N.º " + esc(e.numero) : ""} · ${esc(e.fecha.split("-").reverse().slice(0, 2).join("/"))}${e.titular ? " — «" + esc(e.titular) + "»" : ""}</p>` : '<p class="fuente-dato" style="margin-top:0">Sale los domingos a las 20:00.</p>';
      }
      const interno = /^#\//.test(p.url || "");
      return `<section class="bloque"><h2>${esc(p.nombre)} <span class="tag">${esc(p.estado)}</span></h2>${ultimo}
      ${p.proximos.length ? `<p class="vacio" style="font-size:12px;margin-top:10px">Próximos pasos</p><ul class="pasos">${p.proximos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="chips" style="margin-top:12px">${p.url ? `<a class="chip" href="${esc(p.url)}"${interno ? "" : ' target="_blank" rel="noopener"'}>${interno ? "Leer" : "Abrir"}</a>` : ""}${p.repo ? `<a class="chip" href="${esc(repoUrl(p.repo))}" target="_blank" rel="noopener">Repo</a>` : ""}${l?.proyectos?.length ? `<button class="chip" data-accion="proyecto-pasos" data-id="${esc(p.id)}">Editar pasos</button>` : ""}</div></section>`;
    }).join("") + (l ? "" : '<p class="fuente-dato">Con la sincronización activa, la lista vive en la hoja PROYECTOS de tu planilla y se ve el último cambio de cada repo.</p>');
  }
};

export function renderUniverso(id, datos, ctx, tema) {
  const u = UNIVERSOS.find((x) => x.id === id);
  if (!u) return renderNoEncontrado();
  return `<div class="pagina">${cabecera(u, datos, tema)}${PAGINAS[id](datos, ctx)}</div>`;
}

export function renderBloqueo(id, conHuella, conPin) {
  const u = UNIVERSOS.find((x) => x.id === id) || { nombre: id === "semanal" ? "El Semanal" : id };
  return `<div class="pagina">${volver}<h1>${esc(u.nombre)}</h1><p class="bajada">${u.id ? "Este universo está bloqueado." : "Trae tu plata, tu sueldo y tus turnos: se abre con " + (conHuella ? "tu huella." : "tu PIN.")}</p>
    ${conHuella ? `<button class="btn ancho-completo" data-accion="huella-abrir" data-id="${id}" style="height:56px;font-size:16px">Abrir con huella</button>` : ""}
    ${conPin ? `<form class="form" data-form="pin" data-id="${id}" style="margin-top:${conHuella ? 18 : 12}px"><input name="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="${conHuella ? "o con el PIN" : "PIN"}" aria-label="PIN" required><button class="btn">Entrar</button></form>` : ""}</div>`;
}

// ---------- Urgente ----------
// Todo lo urgente de cualquier universo en un solo lugar: se tilda acá mismo, y cada cosa dice de dónde sale
// y qué pasa si no se hace (solo cuando la fuente lo dice).
const NOMBRE_UNI = (id) => id === "semanal" ? ["El Semanal", ""] : (() => { const u = UNIVERSOS.find((x) => x.id === id); return u ? [u.nombre, ICONOS["u_" + u.id] || ""] : ["Agenda", ""]; })();
export function renderUrgente(datos, ctx) {
  const lista = urgentesTodos(datos, ctx);
  const f = ctx.fecha;
  const ahora = new Date();
  const hora = String(ahora.getHours()).padStart(2, "0") + ":" + String(ahora.getMinutes()).padStart(2, "0");
  const venc = lista.filter((p) => p.dias < 0).length;
  const unis = [...new Set(lista.map((p) => NOMBRE_UNI(p.universo || "finanzas")[0]))];
  const resumen = !lista.length ? "Nada urgente. Todo en orden por ahora."
    : `${lista.length} ${lista.length === 1 ? "cosa" : "cosas"}${venc ? ` · ${venc} ${venc === 1 ? "vencida" : "vencidas"}` : ""} · de ${unis.length > 1 ? unis.slice(0, -1).join(", ") + " y " + unis[unis.length - 1] : unis[0]}`;
  const item = (p) => {
    const [un, ui] = NOMBRE_UNI(p.universo || "finanzas");
    const ir = p.link ? `<a class="ir" href="${esc(p.link)}" target="_blank" rel="noopener">Abrir el mail ›</a>`
      : `<a class="ir" href="${esc(p.ruta || "#/u/" + (p.universo || "finanzas"))}">Ver en ${esc(un)} ›</a>`;
    return `<article class="it">
      <button class="tilde" data-accion="hecho" data-clave="${esc(p.clave)}" aria-label="Marcar ${esc(p.titulo)} como hecho">${ICONOS.check}</button>
      <div class="cuerpo">
        <div class="umeta"><span class="uni">${ui}<span>${esc(un)}</span></span><span class="cuando ${p.dias <= 1 ? "rojo" : ""}">${cuandoTexto(p.dias)}</span></div>
        <h3>${esc(p.titulo)}</h3>${p.monto ? `<p class="monto">${esc(p.monto)}</p>` : ""}
        ${p.impacto ? `<p class="imp"><b>Si no lo hacés:</b> ${esc(p.impacto)}</p>` : '<p class="imp nada">La fuente no dice qué pasa si no se hace.</p>'}
        ${p.nota && p.tipo !== "facu" ? `<p class="nota">${esc(p.nota)}</p>` : ""}
        <p class="src">${esc(p.fuente || "")}${p.fuente ? " · " : ""}${ir}</p>
      </div></article>`;
  };
  const grupos = [["Vencido", (p) => p.dias < 0], ["Hoy y mañana", (p) => p.dias >= 0 && p.dias <= 1], ["Esta semana", (p) => p.dias > 1]]
    .map(([t, fn]) => { const its = lista.filter(fn); return its.length ? `<h2 class="g">${t}<span>${its.length}</span></h2>${its.map(item).join("")}` : ""; }).join("");
  // Lo que tildaste hoy, por si te equivocaste.
  const hc = leer("hechosCuando", {});
  const hoy0 = new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
  const hechos = (datos.pendientes || []).map((p) => ({ ...p, clave: p.clave || (p.titulo + "|" + (p.fecha || p.dias)).toLowerCase() }))
    .filter((p) => hc[p.clave] >= hoy0);
  const hora2 = (t) => { const d = new Date(t); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  return `<div class="urg-pag">
    <header class="cab-urg"><a class="atras" href="#/" aria-label="Volver a Inicio">${ICONOS.volver}</a>
      <div><p class="sup">${DIAS[f.getDay()]} ${f.getDate()} ${MESES_LARGOS[f.getMonth()].slice(0, 3)} · ${hora}</p><h1>Urgente</h1><p class="resumen">${resumen}</p></div></header>
    <div class="urg-lista">${grupos || '<p class="vacio" style="margin:24px 4px">Cuando algo venza o tenga fecha cerca, aparece acá, venga del universo que venga.</p>'}
    ${hechos.length ? `<details class="hechos" open><summary>Hecho hoy · ${hechos.length}</summary><ul>${hechos.map((p) => `<li><span class="ok">${ICONOS.check}</span><s>${esc(p.titulo)}</s><small>${hora2(hc[p.clave])} · <button class="link" data-accion="deshacer-hecho" data-clave="${esc(p.clave)}">deshacer</button></small></li>`).join("")}</ul></details>` : ""}</div></div>`;
}

// ---------- El Semanal ----------
// El lector: la edición tal cual salió (la que está guardada en este dispositivo, así se lee sin señal).
export function renderSemanal() {
  const e = ultimaEdicion(), html = htmlEdicion();
  if (!e || !html) {
    const err = leer("semanalError") || "";
    const motivo = !permisosG().drive ? "Orbe todavía no tiene permiso para leer tu Drive. Conectalo en Ajustes y volvé."
      : /api-apagada:drive/.test(err) ? "El servicio de Drive está apagado en tu proyecto de Google. Prendelo una vez y Orbe trae la edición sola."
      : err === "sin-ediciones" ? "No encontré ediciones de El Semanal ni de El Diario en tu Drive."
      : "Todavía no bajé ninguna edición. Tocá actualizar en Inicio (con señal) y queda guardada para leer sin conexión.";
    return `<div class="pagina">${volver}<h1>${logoSemanal()}</h1><p class="bajada">${esc(motivo)}</p>
      <div class="chips" style="margin-top:12px">${/api-apagada:drive/.test(err) ? '<a class="chip" target="_blank" rel="noopener" href="https://console.cloud.google.com/apis/library/drive.googleapis.com?project=orbe-512903">Prender Drive</a>' : ""}
      <a class="chip" target="_blank" rel="noopener" href="https://drive.google.com/drive/search?q=%22El%20Semanal%22">Buscarla en Drive</a></div></div>`;
  }
  const f = new Date(e.fecha + "T12:00:00");
  const meta = (e.numero ? "N.º " + esc(e.numero) + " · " : "") + DIAS[f.getDay()].slice(0, 3) + " " + f.getDate() + "/" + (f.getMonth() + 1);
  const drive = e.doc ? `<a class="lector-drive" target="_blank" rel="noopener" href="https://docs.google.com/document/d/${encodeURIComponent(e.doc)}/edit">Drive</a>` : "";
  return `<div class="lector"><div class="lector-bar"><a class="lector-volver" href="#/" aria-label="Volver a Inicio">${ICONOS.volver}</a>
    <span class="lector-tit">${logoSemanal(e.nombre, "chico")}<span class="lector-meta">${meta}</span></span>${drive}</div>
    <iframe class="lector-ed" title="${esc(e.nombre)}${e.numero ? " N.º " + esc(e.numero) : ""}" sandbox="allow-popups allow-popups-to-escape-sandbox"></iframe></div>`;
}

// ---------- Secciones ----------
export function renderIdeas() {
  const ideas = leer("ideas", []);
  const tags = [...new Set(ideas.flatMap((i) => i.tags || []))].sort();
  const filtro = sesionLeer("tagIdea");
  const lista = ideas.slice().reverse().filter((i) => !filtro || (i.tags || []).includes(filtro));
  const dictar = ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ? `<button type="button" class="btn sec" data-accion="dictar" aria-label="Dictar una idea" style="display:inline-flex;align-items:center;gap:6px;padding:0 14px"><span style="width:18px;height:18px;display:inline-flex">${ICONOS.mic}</span><span>Dictar</span></button>` : "";
  return `<div class="pagina">${volver}<h1>Ideas</h1><p class="bajada">Todo lo que se te cruza. Sumá #etiquetas para encontrarlas después.</p>
    <form class="form" data-form="idea"><input name="t" placeholder="Anotá algo #etiqueta" aria-label="Nueva idea" required>${dictar}<button class="btn">Guardar</button></form>
    ${tags.length ? `<div class="chips" style="margin-top:14px"><button class="chip ${!filtro ? "on" : ""}" data-accion="idea-tag" data-tag="">Todas</button>${tags.map((t) => `<button class="chip ${filtro === t ? "on" : ""}" data-accion="idea-tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : ""}
    <ul class="lista" style="margin-top:20px">${lista.map((i) => `<li><span>${esc(i.t)}</span><span class="tag">${esc(i.u || i.f)}</span></li>`).join("") || '<li class="vacio">Todavía no hay ideas.</li>'}</ul></div>`;
}

export function renderAgenda(datos, ctx, tema) {
  const fila = (b) => `<li><span><i class="dot" style="background:${colorTipo(datos, b.tipo, tema)};margin-right:10px"></i>${esc(b.titulo)}${b.fijo ? ' <span class="tag">horario fijo</span>' : ""}</span><span class="der">${b.inicio}–${hhmm(b.fin)}</span></li>`;
  const ag = datos.agenda;
  const extra = (iso) => {
    if (!ag) return "";
    const items = [];
    if (ag.feriados?.[iso]) items.push(`<li><span>Feriado: ${esc(ag.feriados[iso])}</span></li>`);
    if (ag.libres?.[iso]) items.push(`<li><span>${esc(ag.libres[iso])}</span></li>`);
    (ag.cumples?.[iso] || []).forEach((n) => items.push(`<li><span>Cumple ${esc(n)}</span></li>`));
    (ag.avisos?.[iso] || []).forEach((a) => items.push(`<li><span>${esc(a.titulo)}</span>${a.inicio ? `<span class="der">${a.inicio}</span>` : ""}</li>`));
    return items.length ? `<h2 style="margin-top:18px">Avisos</h2><ul class="lista">${items.join("")}</ul>` : "";
  };
  const isoDe = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const manana = new Date(ctx.fecha.getTime() + 86400000);
  const tabA = sesionLeer("agendaTab") || "dia";
  const pestA = `<div class="pestanas" role="tablist">${[["dia", "Hoy y mañana"], ["mes", "Mes"]].map(([id, t]) =>
    `<button class="pestana ${tabA === id ? "on" : ""}" role="tab" aria-selected="${tabA === id}" data-accion="agenda-tab" data-tab="${id}">${t}</button>`).join("")}</div>`;
  if (tabA === "mes") return `<div class="pagina">${volver}<h1>Agenda</h1><p class="bajada">Tu Google Calendar, más los partidos de River, vencimientos, cobros, renovaciones y cumpleaños.</p>${pestA}${renderMes(datos, ctx, tema, !!ag)}</div>`;
  return `<div class="pagina">${volver}<h1>Agenda</h1><p class="bajada">${ag ? "De tu Google Calendar." : "Rutina de ejemplo: conectá Google en Ajustes para ver la tuya."}</p>${pestA}
    <section class="bloque"><h2>Hoy, ${DIAS[ctx.dia]}</h2><ul class="lista">${ctx.hoy.map(fila).join("") || '<li class="vacio">Nada fijo.</li>'}</ul>${extra(isoDe(ctx.fecha))}</section>
    <section class="bloque"><h2>Mañana, ${DIAS[manana.getDay()]}</h2><ul class="lista">${ctx.manana.map(fila).join("") || '<li class="vacio">Nada fijo.</li>'}</ul>${extra(isoDe(manana))}</section>
    ${ag ? (permisosG().calendario ? `<section class="bloque"><h2>Nuevo evento</h2><form data-form="evento" class="evento">
        <input class="campo-hora" name="titulo" required placeholder="Qué es (Gym, Fútbol, Cena con Agus…)" aria-label="Título" style="text-align:left">
        <div class="fila-evento"><input class="campo-hora" type="date" name="fecha" required value="${isoDe(ctx.fecha)}" aria-label="Día">
        <input class="campo-hora" type="time" name="hora" required aria-label="Hora">
        <select class="campo-hora" name="dur" aria-label="Duración">${[[30, "30 min"], [60, "1 h"], [90, "1 h 30"], [120, "2 h"], [180, "3 h"]].map(([v, t]) => `<option value="${v}" ${v === 60 ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <button class="btn">Agendar en tu calendario</button></form>
        <p class="fuente-dato">Va a tu calendario principal de Google. Las palabras Gym, Fútbol, BNA o UFASTA le dan su color en Orbe.</p></section>`
      : `<section class="bloque"><h2>Nuevo evento</h2><p class="vacio">Para agendar desde Orbe falta el permiso de escribir en tu calendario.</p><div class="chips" style="margin-top:12px"><button class="chip" data-accion="activar-todo">Dar permiso</button></div></section>`) : ""}</div>`;
}

export function renderRespiro() {
  return `<div class="pagina">${volver}<div class="respiro"><div class="circulo" aria-hidden="true"></div>
    <h1 style="margin:0">Respiro</h1><p class="bajada" style="max-width:320px">Acá no se mide nada y no se guarda nada. Inhalá cuando el círculo crece, soltá cuando se achica.</p>
    <label class="sr" for="respiro-txt">Escribir sin guardar</label>
    <textarea id="respiro-txt" class="campo-texto" placeholder="Si querés, escribí. Se borra al salir."></textarea></div></div>`;
}

export function renderDatos() {
  const t = todo();
  const filas = [["ideas", "Ideas"], ["gastos", "Gastos"], ["super", "Lista del súper"], ["menu", "Menú semanal"], ["futbol", "Notas de fútbol"]]
    .map(([k, n]) => { const v = t[k]; const c = Array.isArray(v) ? v.length : v ? Object.keys(v).length : 0; return `<li><span>${n}</span><span class="der">${c}</span></li>`; }).join("");
  return `<div class="pagina">${volver}<h1>Mis datos</h1><p class="bajada">Lo que Orbe guarda en este dispositivo. Nada de esto está en GitHub.</p>
    <section class="bloque"><h2>Guardado acá</h2><ul class="lista">${filas}</ul></section>
    <section class="bloque"><h2>Acciones</h2><div class="chips"><button class="btn sec" data-accion="exportar">Exportar todo</button><button class="btn peligro" data-accion="borrar-todo">Borrar todo</button></div></section></div>`;
}

const RELOJES = [["logo", "Logo", "Inter, como «Orbe»"], ["revista", "Revista", "La serif del saludo"], ["fina", "Fina", "Inter liviana"], ["mono", "Máquina", "Monoespaciada"]];
const SALUDOS_F = [["revista", "Revista", "Serif"], ["cursiva", "Cursiva", "Serif inclinada"], ["logo", "Logo", "Inter"]];
const FAMILIA = { logo: "var(--sans);font-weight:600;letter-spacing:-.045em", revista: "var(--serif)", fina: "var(--sans);font-weight:300", mono: "ui-monospace,monospace;letter-spacing:-.06em",
  cursiva: "var(--serif);font-style:italic" };

// Qué anda y qué no, parte por parte, con el motivo y el arreglo cuando lo hay.
const PARTES = [["agenda", "Agenda"], ["sincro", "Celu y compu"], ["economia", "Planilla ECONOMÍA"], ["mails", "Mails del BNA y Mercado Pago"], ["recibos", "Recibos de sueldo (Drive)"], ["campus", "Revisión del campus (Drive)"], ["satelite", "Satélite (tu celu)"], ["facu", "Campus de UFASTA"], ["listas", "Agus, fútbol y proyectos"], ["prod", "Productividad del BNA"], ["semanal", "El Semanal (Drive)"], ["resumen", "Resumen para El Semanal"], ["rivercal", "Calendario «River»"]];
function estadoPartes(est) {
  const hace = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "recién" : m < 60 ? "hace " + m + " min" : "hace " + Math.round(m / 60) + " h"; };
  const filas = PARTES.filter(([k]) => est[k]).map(([k, n]) => {
    const e = est[k];
    if (e.ok) return `<li><span>${n}${e.nota ? `<br><small class="vacio">${esc(e.nota)}</small>` : ""}</span><span class="estado ok">✓ ${hace(e.ok)}</span></li>`;
    const apagada = /api-apagada:(sheets|gmail|drive|calendar)/.exec(e.msj || "");
    const sinPermiso = /insufficient|scope|permiso/i.test(e.msj || "");
    const arreglo = sinPermiso && !apagada ? `<button class="btn" style="margin-top:8px" data-accion="activar-todo">Volver a dar permiso</button><span class="vacio" style="font-size:12px">En la pantalla de Google, tildá todas las casillas (sobre todo la de Gmail).</span>`
      : apagada ? `<a class="chip" style="margin-top:8px;display:inline-block" target="_blank" rel="noopener" href="https://console.cloud.google.com/apis/library/${apagada[1] === "calendar" ? "calendar-json" : apagada[1]}.googleapis.com?project=orbe-512903">Prender el servicio de ${({ sheets: "planillas", gmail: "Gmail", drive: "Drive", calendar: "Calendar" })[apagada[1]]}</a>` : "";
    return `<li style="flex-direction:column;align-items:flex-start;gap:4px"><span style="display:flex;justify-content:space-between;width:100%"><span>${n}</span><span class="estado mal">no anda</span></span>
      <span class="vacio" style="font-size:12px;word-break:break-word">${esc(apagada ? "Falta prender el servicio en Google Cloud, una sola vez." : sinPermiso ? "Google no le dio a Orbe el permiso de leer los mails." : e.msj)}</span>${arreglo}</li>`;
  });
  return filas.length ? `<ul class="lista">${filas.join("")}</ul>` : '<p class="vacio">Todavía no se actualizó nada en este dispositivo.</p>';
}

// Ajustes › Diseño: todo lo que cambia cómo se ve Inicio, junto y arriba de todo.
const VER_INICIO = [["bnahoy", "BNA · lo que falta tachar", "solo en tu horario del banco"], ["chk", "Checklists"], ["clima", "Clima"], ["river", "River"], ["plata", "Diario de plata"], ["preguntas", "Preguntas de plata"], ["semanal", "El Semanal"], ["transporte", "Transporte", "solo aparece si hay problemas"]];
const DIBUJO_MODO = {
  normal: '<svg viewBox="0 0 64 56" aria-hidden="true"><rect x="8" y="6" width="30" height="3" rx="1.5"/><rect x="8" y="12" width="20" height="3" rx="1.5"/><circle cx="32" cy="32" r="11" fill="none" stroke-width="2.5"/><circle cx="14" cy="50" r="2.4"/><circle cx="23" cy="50" r="2.4"/><circle cx="32" cy="50" r="2.4"/><circle cx="41" cy="50" r="2.4"/><circle cx="50" cy="50" r="2.4"/></svg>',
  compacto: '<svg viewBox="0 0 64 56" aria-hidden="true"><circle cx="16" cy="14" r="7.5" fill="none" stroke-width="2.2"/><rect x="28" y="9" width="28" height="3" rx="1.5"/><rect x="28" y="15" width="18" height="3" rx="1.5"/><rect x="8" y="28" width="48" height="8" rx="3" opacity=".55"/><rect x="8" y="40" width="23" height="11" rx="3" opacity=".55"/><rect x="33" y="40" width="23" height="11" rx="3" opacity=".55"/></svg>'
};
function bloqueDiseno(tema, f, muestra, demo) {
  const compacto = !!leer("inicioCompacto");
  const ocultos = new Set(leer("inicioOcultos", []));
  const modo = (k, n, d) => `<button class="muestra modo-ini ${compacto === k ? "on" : ""}" data-accion="inicio-compacto" data-v="${k ? 1 : 0}" aria-pressed="${compacto === k}">${DIBUJO_MODO[k ? "compacto" : "normal"]}<b>${n}</b><small>${d}</small></button>`;
  return `<section class="bloque diseno" id="diseno"><h2>Diseño</h2>
    <h3 class="sub-aj">Inicio</h3>
    <div class="muestras">${modo(false, "Reloj grande", "el reloj al medio")}${modo(true, "Compacto", "más cosas sin bajar")}</div>
    <ul class="interruptores"><li><button class="interruptor" role="switch" aria-checked="${!!leer("dockNombres")}" data-accion="dock-nombres"><span><b>Nombres en la barra de abajo</b><small>si no, solo los íconos (manteniendo apretado aparece el nombre)</small></span><i aria-hidden="true"></i></button></li></ul>
    <h3 class="sub-aj">Qué se ve en Inicio</h3>
    <ul class="interruptores">${VER_INICIO.map(([k, n, d]) => { const on = !ocultos.has(k); return `<li><button class="interruptor" role="switch" aria-checked="${on}" data-accion="inicio-ver" data-k="${k}"><span><b>${n}</b>${d ? `<small>${d}</small>` : ""}</span><i aria-hidden="true"></i></button></li>`; }).join("")}</ul>
    <p class="fuente-dato">Urgente siempre se ve, para que nada se pase.</p>
    <h3 class="sub-aj">Tema</h3>
    <div class="chips">${[["auto", "Automático"], ["claro", "Claro"], ["oscuro", "Oscuro"]].map(([k, n]) => `<button class="chip ${tema === k ? "on" : ""}" data-accion="tema-fijo" data-tema="${k}">${n}</button>`).join("")}</div>
    <p class="fuente-dato">Automático: claro de día y oscuro desde la puesta del sol en Buenos Aires. El botón de Inicio lo cambia hasta la próxima salida o puesta.</p>
    <h3 class="sub-aj">Guiños</h3>
    <ul class="interruptores"><li><button class="interruptor" role="switch" aria-checked="${guinosPrendidos()}" data-accion="guinos"><span><b>Prendidos</b><small>${guinosPrendidos() ? "Tres por día (mañana, tarde y noche), en un momento al azar: Inicio se viste de Arácnido, Laboratorio, Decreto o TVA por 20 minutos. " + resumenGuinos(new Date()) + " Tocando tres veces el saludo sale uno al toque." : "Apagado: Orbe sobria y seria, sin guiños ni días especiales."}</small></span><i aria-hidden="true"></i></button></li></ul>
    <p class="fuente-dato" style="margin:10px 0 8px">Probar un guiño ahora (se apaga al cerrar Orbe):</p>
    <div class="chips"><button class="chip ${!sesionLeer("demoGuino") ? "on" : ""}" data-accion="demo-guino" data-g="">Real</button>${GUINOS.map(([k, n]) => `<button class="chip ${sesionLeer("demoGuino") === k ? "on" : ""}" data-accion="demo-guino" data-g="${k}">${n}</button>`).join("")}</div>
    <h3 class="sub-aj">Probar modos del día</h3>
    <div class="chips"><button class="chip ${!demo ? "on" : ""}" data-accion="demo" data-modo="">Real</button>${MODOS.map((m) => `<button class="chip ${demo === m ? "on" : ""}" data-accion="demo" data-modo="${m}">${m === "normal" ? "Normal" : m === "libre" ? "Día libre" : m === "river" ? "River" : m === "marvel" ? "Guiño Marvel" : "Noche"}</button>`).join("")}</div>
    <p class="fuente-dato">Simula el día y la hora de cada modo. Se apaga al cerrar Orbe.</p>
    <h3 class="sub-aj">Tipografía del reloj</h3>
    <div class="muestras">${RELOJES.map((x) => muestra("reloj", x)).join("")}</div>
    <h3 class="sub-aj">Tipografía del saludo</h3>
    <div class="muestras">${SALUDOS_F.map((x) => muestra("saludo", x)).join("")}</div></section>`;
}

export function renderAjustes(estadoTema, demo, hayPin, google) {
  const tema = estadoTema.modo;
  const f = { reloj: "logo", saludo: "revista", ...leer("fuentes", {}) };
  const sinc = ultimaSincro();
  const conectado = google.cuenta && google.estado !== "reconectar";
  const p = google.permisos || {};
  const tarjeta = !google.configurado ? '<p class="vacio">Falta un paso de configuración en Google Cloud para poder conectar.</p>'
    : google.cuenta && google.estado === "reconectar" ? `<p>Se cortó la conexión con <b>${esc(google.cuenta.email)}</b>.</p><div class="chips" style="margin-top:12px"><button class="btn" data-accion="google-reconectar">Reconectar</button><button class="btn sec" data-accion="google-salir">Desconectar</button></div>`
    : google.cuenta ? `<p>Conectado como <b>${esc(google.cuenta.email)}</b>.</p><p class="vacio" style="margin-top:6px;font-size:13px">${google.agenda ? "Agenda actualizada " + esc(google.agenda) + "." : "Todavía no se leyó la agenda."}</p>
        <div class="chips" style="margin-top:12px"><button class="btn" data-accion="actualizar-todo">Actualizar todo</button><button class="btn sec" data-accion="google-salir">Desconectar</button></div>`
    : '<p>Conectá tu Google para que el anillo, lo urgente y la agenda salgan de tu calendario real.</p><div class="chips" style="margin-top:12px"><button class="btn" data-accion="google-conectar">Conectar con Google</button></div>';
  const muestra = (grupo, [k, n, d]) => `<button class="muestra ${f[grupo] === k ? "on" : ""}" data-accion="fuente" data-grupo="${grupo}" data-valor="${k}" aria-pressed="${f[grupo] === k}">
      <b style="font-family:${FAMILIA[k]}">${grupo === "reloj" ? "10:24" : "Buen día"}</b><small>${n} · ${d}</small></button>`;
  return `<div class="pagina">${volver}<h1>Ajustes</h1><p class="bajada">${MARCA} versión ${VERSION}.</p>
    ${google.aviso ? `<section class="bloque" role="alert" style="background:var(--urg-bg)"><p>${esc(google.aviso)}</p></section>` : ""}
    ${bloqueDiseno(tema, f, muestra, demo)}
    <section class="bloque"><h2>Cuenta de Google</h2>${tarjeta}
      <p class="vacio" style="margin-top:12px;font-size:12px">La sesión dura 30 días y se renueva sola cada vez que usás Orbe. Orbe nunca ve tu contraseña.</p></section>

    <section class="bloque"><h2>Celu y compu sincronizados</h2>
      ${!conectado ? '<p class="vacio">Primero conectá tu Google.</p>'
        : !p.sheets || !p.gmail || !p.drive || !p.calendario || !p.calPropios ? `<p>${p.sheets ? "Hay permisos nuevos para dar: " + [!p.drive ? "leer tus recibos de sueldo en Drive" : "", !p.calendario ? "crear eventos en tu calendario desde Orbe" : "", !p.calPropios ? "crear y mantener el calendario «River» con los partidos" : ""].filter(Boolean).join(", ") + "." : "Un solo permiso más y Orbe: sincroniza el celu y la compu (hechos, horario, ideas, súper, menú, tipografías) y lee los avisos del BNA y de Mercado Pago para Finanzas."}</p>
          <div class="chips" style="margin-top:12px"><button class="btn" data-accion="activar-todo">Dar permiso</button></div>
          <p class="vacio" style="margin-top:12px;font-size:12px">Tildá todas las casillas en la pantalla de Google. Mails y Drive: solo lectura (Orbe nunca escribe ni borra; el texto de los mails no sale del servidor). Planillas: Orbe escribe en «Orbe · datos» y, si lo aprobás, en la fila «Suscripciones» de ECONOMÍA. Calendario: solo crea los eventos que vos le pidas y el calendario «River», que mantiene él.</p>`
        : !google.hoja ? `<p>Pegá el link de tu planilla <b>Orbe · datos</b> (está en Drive, en Herramientas de IA → Orbe). Se hace una vez en cada dispositivo.</p>
          <form class="form" data-form="hoja"><input name="link" placeholder="https://docs.google.com/spreadsheets/d/…" aria-label="Link de la planilla" required><button class="btn">Listo</button></form>`
        : `${estadoPartes(google.estadoAct)}
          <div class="chips" style="margin-top:12px"><a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Abrir la planilla Orbe · datos</a></div>
          <p class="vacio" style="margin-top:10px;font-size:12px">Se actualiza solo al abrir Orbe, al volver a la app y cada 5 minutos. Lo que cambiás se manda solo a la planilla en un par de segundos.</p>
          <p style="margin-top:16px">${idEconomia() ? "Tu planilla <b>ECONOMÍA</b> está conectada: Orbe la lee y solo escribe la fila «Suscripciones», si se lo aprobaste en Finanzas." : "Para ver tu planilla <b>ECONOMÍA</b> en Finanzas, pegá su link:"}</p>
          ${idEconomia() ? "" : '<form class="form" data-form="economia"><input name="link" placeholder="Link de ECONOMÍA" aria-label="Link de la planilla ECONOMÍA" required><button class="btn">Listo</button></form>'}`}
    </section>

    ${bloqueSatelite(conectado)}

    <section class="bloque"><h2>Horario fijo del BNA</h2>
      <p class="vacio" style="font-size:13px;margin-bottom:14px">Completa los días hábiles que tu calendario no tenga cargados.</p>
      <form data-form="horario"><div class="horas"><span></span><span class="cab">Entrada</span><span class="cab">Salida</span>
        ${[1, 2, 3, 4, 5].map((d) => { const h = leer("horario", {})[d] || {}; return `<span class="dia">${DIAS_CORTOS[d]}</span>
        <input type="time" name="i${d}" value="${esc(h.inicio || "")}" aria-label="Entrada ${DIAS[d]}">
        <input type="time" name="f${d}" value="${esc(h.fin || "")}" aria-label="Salida ${DIAS[d]}">`; }).join("")}</div>
        <button class="btn ancho-completo" style="margin-top:14px">Guardar horario</button></form></section>

    <section class="bloque"><h2>Bloqueo de Finanzas y Bienestar</h2>
      <p style="margin-bottom:12px">Huella en este dispositivo: <b>${google.huella ? "activada" : "apagada"}</b></p>
      <div class="chips">${google.huella ? '<button class="btn sec" data-accion="huella-sacar">Apagar la huella</button>' : '<button class="btn" data-accion="huella-activar">Activar huella</button>'}</div>
      <p class="vacio" style="margin:16px 0 0;font-size:13px">PIN de respaldo (para la compu sin lector, o si la huella falla):</p>
      ${hayPin ? '<button class="btn sec" data-accion="pin-sacar" style="margin-top:10px">Sacar el PIN</button>' : '<form class="form" data-form="pin-nuevo"><input name="pin" type="password" inputmode="numeric" minlength="4" placeholder="4 dígitos o más" aria-label="Nuevo PIN" required><button class="btn">Poner PIN</button></form>'}
      <p class="vacio" style="margin-top:12px;font-size:13px">Usa el lector del celu: la huella nunca sale del teléfono. Se pide una vez cada vez que abrís Orbe, y también para activarla o apagarla. Es una cortina para miradas ajenas, no un cofre.</p></section>
    <section class="bloque"><h2>Más</h2><div class="chips"><a class="chip" href="#/datos">Mis datos</a><a class="chip" href="#/respiro">Respiro</a><a class="chip" href="#/novedades">Novedades</a></div></section></div>`;
}

// Hoja para corregir un movimiento: rubro, tipo y si se divide con Agus.
export function hojaMovimiento(m) {
  const esGasto = ["gasto", "gasto-tarjeta", "devolucion"].includes(m.clase) && m.ts;
  const cuenta = cuentaEnDiario(m);
  const CLASES_TXT = [["gasto", "Gasto"], ["gasto-tarjeta", "Con tarjeta"], ["tarjeta", "Pago de tarjeta"], ["deuda", "Cuota"], ["ahorro", "Ahorro"], ["propia", "Entre mis cuentas"], ["ingreso", "Ingreso"]];
  return `<h2>${esc(m.contra || m.tipo)}</h2>
    <p class="vacio" style="margin:-4px 0 4px">$ ${Math.round(m.monto || 0).toLocaleString("es-AR")} · ${m.fuente === "A mano" ? "lo anotaste vos" : esc(m.fuente || "")}${m.medio ? " · " + esc(m.medio) : ""}</p>
    <form data-form="fin-mov" data-id="${esc(m.id)}">
      ${esGasto ? `<div class="grupo"><span>¿Cuenta en el diario?</span><div class="chips">${[["si", "Sí, es del día a día"], ["no", "No (fijo, no es mío o no va)"]].map(([k, n]) => `<label class="chip ${(cuenta ? "si" : "no") === k ? "on" : ""}"><input type="radio" class="sr" name="cuenta" value="${k}" ${(cuenta ? "si" : "no") === k ? "checked" : ""}>${n}</label>`).join("")}</div></div>
      <div class="grupo"><span>Qué día fue</span><input class="campo-hora" type="date" name="dia" value="${isoDia(new Date(m.ts))}" max="${isoDia(new Date())}" style="text-align:left"></div>` : ""}
      <div class="grupo"><span>Qué es</span><div class="chips">${CLASES_TXT.map(([k, n]) => `<label class="chip ${m.clase === k ? "on" : ""}"><input type="radio" class="sr" name="clase" value="${k}" ${m.clase === k ? "checked" : ""}>${n}</label>`).join("")}</div></div>
      <div class="grupo"><span>Rubro</span><div class="chips">${RUBROS.map((r) => `<label class="chip ${m.rubro === r ? "on" : ""}"><input type="radio" class="sr" name="rubro" value="${esc(r)}" ${m.rubro === r ? "checked" : ""}>${esc(r)}</label>`).join("")}</div></div>
      <div class="grupo"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="mitad" ${m.mitad ? "checked" : ""} style="width:20px;height:20px"> Se divide con Agus (cuenta tu mitad)</label></div>
      <div class="grupo"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="aprender" checked style="width:20px;height:20px"> Si cambiás qué es o el rubro, recordarlo para la próxima vez que aparezca</label></div>
      <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div>
    </form>`;
}

export function renderNovedades() {
  return `<div class="pagina">${volver}<h1>Novedades</h1><p class="bajada">Qué cambió en cada versión.</p>
    ${NOVEDADES.map((v) => `<section class="bloque"><h2>v${esc(v.version)} <span class="tag">${esc(v.fecha)}</span></h2><p style="margin-bottom:10px">${esc(v.titulo)}</p>
      <ul style="margin:0;padding-left:18px;line-height:1.6">${v.cambios.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>`).join("")}</div>`;
}

export function renderNoEncontrado() {
  return `<div class="pagina">${volver}<h1>No existe</h1><p class="bajada">Esa parte de Orbe todavía no está.</p></div>`;
}

export { duracion };

// Hojas de UFASTA: nuevo TP, notas y links de una materia, asignar materia.
export function hojaTp(materia, materias) {
  return `<h2>Nuevo TP</h2><form data-form="tp-nuevo">
    <div class="grupo"><span>Materia</span><div class="chips">${materias.map((m) => `<label class="chip ${m.materia === materia ? "on" : ""}"><input type="radio" class="sr" name="materia" value="${esc(m.materia)}" ${m.materia === materia ? "checked" : ""}>${esc(m.materia)}</label>`).join("")}</div></div>
    <div class="grupo"><span>Qué hay que entregar</span><input class="campo-hora" name="titulo" required placeholder="TP 2: análisis de un spot" style="text-align:left"></div>
    <div class="grupo"><span>Fecha de entrega (opcional)</span><input class="campo-hora" type="date" name="fecha"></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Agregar</button></div></form>`;
}

export function hojaMateria(m) {
  return `<h2>${esc(m.materia)}</h2><form data-form="materia" data-materia="${esc(m.materia)}">
    <div class="grupo"><span>Notas (separadas por ;)</span><input class="campo-hora" name="notas" value="${esc(m.notas.join("; ").replace(/\./g, ","))}" placeholder="8; 7,5" style="text-align:left"></div>
    <div class="grupo"><span>Profe</span><input class="campo-hora" name="profe" value="${esc(m.profe)}" style="text-align:left"></div>
    <div class="grupo"><span>Link del aula</span><input class="campo-hora" name="aula" value="${esc(m.aula)}" placeholder="https://…" style="text-align:left"></div>
    <div class="grupo"><span>Links (uno por renglón: Título | link)</span><textarea class="campo-texto" name="links" style="height:96px">${esc(m.links.map((l) => l.titulo + " | " + l.url).join("\n"))}</textarea></div>
    <div class="grupo"><span>Pistas para reconocer sus mails (código, profe, palabras; separadas por ;)</span><input class="campo-hora" name="pistas" value="${esc(m.pistas.join("; "))}" style="text-align:left"></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}

export function hojaAsignar(tp, materias) {
  return `<h2>${esc(tp.titulo)}</h2><form data-form="tp-materia" data-id="${esc(tp.id)}">
    <div class="grupo"><span>¿De qué materia es?</span><div class="chips">${materias.map((m) => `<label class="chip"><input type="radio" class="sr" name="materia" value="${esc(m.materia)}" required>${esc(m.materia)}</label>`).join("")}</div></div>
    <div class="grupo"><span>Fecha de entrega (opcional)</span><input class="campo-hora" type="date" name="fecha" value="${esc(tp.fecha)}"></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}

// Hojas de Agus, fútbol y proyectos.
const pie = (txt) => `<div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">${txt}</button></div>`;
export function hojaAgus(tipo) {
  const ver = tipo === "peli" || tipo === "serie";
  return `<h2>${ver ? "Para ver" : "Un plan"}</h2><form data-form="agus-nuevo">
    ${ver ? `<div class="grupo"><span>Qué es</span><div class="chips"><label class="chip on"><input type="radio" class="sr" name="tipo" value="peli" checked>Peli</label><label class="chip"><input type="radio" class="sr" name="tipo" value="serie">Serie</label></div></div>` : '<input type="hidden" name="tipo" value="plan">'}
    <div class="grupo"><span>${ver ? "Título" : "Qué plan"}</span><input class="campo-hora" name="titulo" required placeholder="${ver ? "Dune: Parte Dos" : "Cena en Chui"}" style="text-align:left"></div>
    ${ver ? "" : '<div class="grupo"><span>Cuándo (opcional)</span><input class="campo-hora" type="date" name="fecha"></div>'}
    <div class="grupo"><span>Nota (opcional)</span><input class="campo-hora" name="nota" placeholder="${ver ? "Netflix, la recomendó Juan" : "reservar antes"}" style="text-align:left"></div>
    ${pie("Agregar")}</form>`;
}
export function hojaPartido() {
  const hoy = new Date();
  const iso = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-" + String(hoy.getDate()).padStart(2, "0");
  return `<h2>Partido</h2><form data-form="partido">
    <div class="grupo"><span>Resultado</span><div class="chips"><label class="chip"><input type="radio" class="sr" name="resultado" value="G" required>Ganamos</label><label class="chip"><input type="radio" class="sr" name="resultado" value="E">Empate</label><label class="chip"><input type="radio" class="sr" name="resultado" value="P">Perdimos</label></div></div>
    <div class="grupo" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label><span class="sr">Día</span><input class="campo-hora" type="date" name="fecha" value="${iso}" required></label>
      <label><span class="sr">Goles</span><input class="campo-hora" type="number" name="goles" min="0" max="20" value="0" inputmode="numeric" aria-label="Goles"></label></div>
    <div class="grupo"><span>¿Cómo jugaste?</span><input class="campo-hora" name="nota" placeholder="Bien atrás, cansado al final" style="text-align:left"></div>
    ${pie("Anotar")}</form>`;
}
export function hojaPasos(p) {
  return `<h2>${esc(p.nombre)}</h2><form data-form="proyecto-pasos" data-id="${esc(p.id)}">
    <div class="grupo"><span>Próximos pasos (uno por renglón)</span><textarea class="campo-texto" name="pasos">${esc(p.proximos.join("\n"))}</textarea></div>
    ${pie("Guardar")}</form>`;
}

// River: todo lo del club en una página (se entra desde la tarjeta de Inicio).
export function renderRiver(ctx) {
  const rv = leer("river");
  const vuelta = `${volver}<h1>River</h1><p class="bajada">Partidos, tabla y Promiedos. Datos públicos de ESPN.</p>`;
  if (!rv || (!rv.proximo && !rv.ultimo)) return `<div class="pagina">${vuelta}<section class="bloque"><p class="vacio">Todavía no llegaron los datos. Tocá ↻ en Inicio.</p></section></div>`;
  const tab = sesionLeer("riverTab") || "partidos";
  const pest = `<div class="pestanas" role="tablist">${[["partidos", "Partidos"], ["tabla", "Tablas"], ["copas", "Copas"], ["promiedos", "Promiedos"]].map(([id, t]) =>
    `<button class="pestana ${tab === id ? "on" : ""}" role="tab" aria-selected="${tab === id}" data-accion="river-tab" data-tab="${id}">${t}</button>`).join("")}</div>`
    + `<button class="otros-link ${tab === "otros" ? "on" : ""}" data-accion="river-tab" data-tab="otros">${tab === "otros" ? "Otros equipos" : "Otros equipos ›"}</button>`;
  const p = rv.proximo;
  const R = (u) => u.gf > u.gc ? "G" : u.gf < u.gc ? "P" : "E";
  let cuerpo = "";
  if (tab === "partidos") {
    const d = p && datosPartido(p, ctx.fecha);
    const hero = p ? `<section class="w river ancho hero ${p.clasico ? "clasico" : ""}"><span class="k">${p.clasico ? "Superclásico" : "Próximo partido"} · ${esc(torneoCorto(p.torneo))}</span>
      <span class="tit">${esc(d.titulo)}</span><span class="sub">${d.dia} · ${d.hora}${p.estadio ? " · " + esc(estadioCorto(p.estadio)) : ""}</span>
      <span class="banda-river">${regresiva(p.fecha, true)}</span></section>` : "";
    const prox = (rv.proximos || []).slice(1);
    const ult = rv.ultimos || (rv.ultimo ? [rv.ultimo] : []);
    const fechaLarga = (x) => { const f = new Date(x.fecha); return `<span class="fx-fecha"><span class="fx-dia">${DIAS[f.getDay()].slice(0, 3)}</span><span class="fx-num">${f.getDate()}/${f.getMonth() + 1}</span></span>`; };
    const sinc = leer("riverCalSinc");
    const cal = permisosG().calPropios
      ? `<p class="fuente-dato riv-cal">${sinc ? `Los ${sinc.partidos} próximos partidos están en tu calendario «River» de Google y se actualizan solos.` : "Se suman a tu calendario «River» de Google en la próxima actualización."}</p>`
      : `<div class="riv-cal-pedir"><p>Para que los partidos aparezcan solos en tu Google Calendar (en un calendario «River» aparte), falta un permiso.</p><button class="chip" data-accion="activar-todo">Dar permiso</button></div>`;
    cuerpo = `${hero}
    ${prox.length ? `<section class="bloque"><h2>Lo que sigue</h2><ul class="fixture">${prox.map((x) => { const dx = datosPartido(x, ctx.fecha); return `<li>${fechaLarga(x)}<span class="fx-rival">${x.clasico ? "<b>Superclásico</b> · " : ""}${x.local ? "vs " : "en cancha de "}${esc(String(x.rival).replace(/ Juniors$/, ""))}<small>${esc(torneoCorto(x.torneo))}${x.estadio ? " · " + esc(estadioCorto(x.estadio)) : ""}</small></span><span class="fx-hora">${dx.hora}</span></li>`; }).join("")}</ul>${cal}</section>` : `<section class="bloque">${cal}</section>`}
    ${ult.length ? `<section class="bloque"><h2>Últimos resultados</h2><ul class="lista">${ult.map((x) => `<li><span><span class="res res-${R(x)}">${R(x)}</span> ${x.gf}-${x.gc}${x.penales ? ` (${x.penales[0]}-${x.penales[1]} pen.)` : ""} ${x.local ? "vs" : "en cancha de"} ${esc(x.rival)}<br><small class="vacio">${esc(torneoCorto(x.torneo))}</small></span><span class="tag">${new Date(x.fecha).getDate()}/${new Date(x.fecha).getMonth() + 1}</span></li>`).join("")}</ul></section>` : ""}`;
  } else if (tab === "tabla") {
    const t = rv.tabla && rv.tabla.pos ? rv.tabla : null;
    const sub = sesionLeer("riverTabla") || "zona";
    const subs = `<div class="chips sub-tabs">${[["zona", "Zonas"], ["anual", "Anual"]].map(([k, n]) => `<button class="chip ${sub === k ? "on" : ""}" data-accion="river-tabla" data-v="${k}">${n}</button>`).join("")}</div>`;
    if (sub === "anual") {
      const an = rv.anual;
      cuerpo = subs + (!an ? '<section class="bloque"><p class="vacio">ESPN todavía no tiene los datos para armar la anual.</p></section>'
        : `<section class="bloque">${tablaPos(an.nombre, an.filas, true)}<p class="fuente-dato">Suma de ${an.torneos.join(" y ")} con los datos de ESPN, como la arma Promiedos. Decide los cupos a las copas y el descenso.</p></section>`);
    } else {
      const grupos = t?.grupos || [];
      // Primero la zona de River; la otra, abajo y plegada.
      const suya = grupos.find((g) => g.filas.some((f) => f.river));
      const otras = grupos.filter((g) => g !== suya);
      cuerpo = subs + (!t ? '<section class="bloque"><p class="vacio">ESPN todavía no publicó la tabla. Probá más tarde.</p></section>'
        : `<section class="bloque"><div class="trio"><div><span class="k">Posición</span><b>${t.pos}° de ${t.equipos}</b></div><div><span class="k">Puntos</span><b>${t.pts}</b></div><div><span class="k">PJ · G-E-P</span><b>${t.pj} · ${t.g}-${t.e}-${t.p}</b></div></div>
          <p class="fuente-dato">${esc(torneoCorto(t.torneo))}${t.zona ? " · " + esc(zonaTxt(t.zona)) : ""}. Diferencia de gol: ${t.dg > 0 ? "+" : ""}${t.dg}.</p></section>
        ${suya ? `<section class="bloque">${tablaPos(zonaTxt(suya.nombre), suya.filas)}</section>` : ""}
        ${otras.map((g) => `<details class="bloque plegable"><summary>${esc(zonaTxt(g.nombre))}</summary>${tablaPos("", g.filas)}</details>`).join("")}`);
    }
  } else if (tab === "copas") {
    const cs = rv.copas || [];
    const partidosDe = (re) => (rv.partidos || []).filter((x) => re.test(torneoCorto(x.torneo)));
    const fila = (x) => { const f = new Date(x.fecha); return `<li><span class="fx-fecha"><span class="fx-dia">${DIAS[f.getDay()].slice(0, 3)}</span><span class="fx-num">${f.getDate()}/${f.getMonth() + 1}</span></span><span class="fx-rival">${x.local ? "vs " : "en cancha de "}${esc(x.rival)}</span><span class="fx-hora">${x.jugado && x.gf !== null ? `<span class="res res-${x.gf > x.gc ? "G" : x.gf < x.gc ? "P" : "E"}">${x.gf > x.gc ? "G" : x.gf < x.gc ? "P" : "E"}</span>${x.gf}-${x.gc}` : x.hora === false ? "a conf." : String(f.getHours()).padStart(2, "0") + ":" + String(f.getMinutes()).padStart(2, "0")}</span></li>`; };
    const bloqueCopa = (nombre, re, copa) => {
      const ps = partidosDe(re);
      const suyo = copa?.grupos.find((g) => g.filas.some((f) => f.river));
      if (!ps.length && !copa) return "";
      return `<section class="bloque copa"><h2>${esc(nombre)}</h2>
        ${ps.length ? `<ul class="fixture">${ps.map(fila).join("")}</ul>` : '<p class="vacio">River no juega esta copa en esta temporada.</p>'}
        ${suyo ? tablaPos(grupoTxt(suyo.nombre), suyo.filas) : ""}
        ${copa ? `<details class="plegable"><summary>Todos los grupos</summary>${copa.grupos.filter((g) => g !== suyo).map((g) => tablaPos(grupoTxt(g.nombre), g.filas)).join("")}</details>` : ""}</section>`;
    };
    const lib = cs.find((c) => /libertadores/.test(c.liga)), sud = cs.find((c) => /sudamericana/.test(c.liga));
    // Primero la copa que juega River.
    const orden = [["Copa Libertadores", /Libertadores/, lib], ["Copa Sudamericana", /Sudamericana/, sud], ["Copa Argentina", /Copa Argentina/, null]]
      .sort((a, b) => (partidosDe(b[1]).length ? 1 : 0) - (partidosDe(a[1]).length ? 1 : 0));
    cuerpo = orden.map(([n, re, c]) => bloqueCopa(n, re, c)).join("") || '<section class="bloque"><p class="vacio">Todavía no hay datos de copas.</p></section>';
  } else if (tab === "otros") {
    cuerpo = bloqueOtros(ctx);
  } else {
    cuerpo = `<section class="bloque promiedos"><h2>Promiedos</h2>
      ${ctx.modo === "river" ? '<a class="btn ancho-completo" href="https://www.promiedos.com.ar/team/river-plate/igi" target="_blank" rel="noopener" style="margin-bottom:10px">Seguir el partido en Promiedos</a>' : ""}
      <div class="chips"><a class="chip" href="https://www.promiedos.com.ar/team/river-plate/igi" target="_blank" rel="noopener">River: fixture y plantel</a><a class="chip" href="https://www.promiedos.com.ar/" target="_blank" rel="noopener">Partidos de hoy</a></div>
      <p class="fuente-dato">Promiedos no tiene una API pública: Orbe te lleva directo a sus páginas (o a la app, si la tenés).</p></section>
    <section class="bloque"><h2>Accesos</h2><div class="chips"><a class="chip" href="https://www.cariverplate.com.ar" target="_blank" rel="noopener">Sitio oficial</a><a class="chip" href="https://www.espn.com.ar/futbol/equipo/_/id/16/river-plate" target="_blank" rel="noopener">River en ESPN</a></div></section>`;
  }
  return `<div class="pagina">${vuelta}${pest}${cuerpo}</div>`;
}

// Tabla de posiciones (con River en rojo). Con «anual», también la diferencia de gol y los partidos.
const grupoTxt = (n) => String(n || "").replace(/^Group\s+/i, "Grupo ");
const zonaTxt = (n) => String(n || "").replace(/^Group\s+/i, "Zona ").replace(/^Grupo\s+/i, "Grupo ");
function tablaPos(titulo, filas, conGep) {
  return `${titulo ? `<h2>${esc(titulo)}</h2>` : ""}<table class="tabla-pos"><thead><tr><th>#</th><th class="eq">Equipo</th><th>PJ</th>${conGep ? "<th>G-E-P</th>" : ""}<th>DG</th><th>Pts</th></tr></thead><tbody>
    ${filas.map((f) => `<tr class="${f.river ? "river" : ""}"><td>${f.pos ?? ""}</td><td class="eq">${esc(f.equipo)}</td><td>${f.pj ?? ""}</td>${conGep ? `<td>${f.g}-${f.e}-${f.p}</td>` : ""}<td>${f.dg > 0 ? "+" : ""}${f.dg ?? ""}</td><td><b>${f.pts ?? ""}</b></td></tr>`).join("")}</tbody></table>`;
}

// Otros equipos: un resumen chico de cada uno (posición, cómo viene, qué juega). River sigue siendo lo principal.
function bloqueOtros(ctx) {
  const d = leer("equipos");
  const lista = equiposSeguidos();
  const R = (u) => u.gf > u.gc ? "G" : u.gf < u.gc ? "P" : "E";
  const cards = !d ? '<p class="vacio">Trayendo los datos de ESPN…</p>' : (d.equipos || []).map((e) => {
    if (!e.encontrado) return `<li class="eq-card"><b>${esc(e.pedido)}</b><small class="vacio">No lo encontré en Primera ni en la Primera Nacional.</small></li>`;
    const px = e.proximo;
    const pf = px && new Date(px.fecha);
    return `<li class="eq-card"><div class="eq-cab"><b>${esc(e.nombre)}</b><span class="eq-pos">${e.pos ?? "–"}°<small> de ${e.equiposZona} · ${e.pts ?? 0} pts</small></span></div>
      <small class="eq-liga">${esc(e.liga)}${e.zona ? " · " + esc(e.zona) : ""}</small>
      <div class="eq-forma" aria-label="Últimos resultados">${(e.ultimos || []).slice().reverse().map((u) => `<span class="res res-${R(u)}" title="${u.gf}-${u.gc} ${u.local ? "vs" : "en cancha de"} ${esc(u.rival)}">${R(u)}</span>`).join("") || '<small class="vacio">Sin partidos jugados</small>'}</div>
      ${px ? `<small class="eq-prox">Próximo: ${DIAS[pf.getDay()].slice(0, 3)} ${pf.getDate()}/${pf.getMonth() + 1}${px.hora ? " " + String(pf.getHours()).padStart(2, "0") + ":" + String(pf.getMinutes()).padStart(2, "0") : ""} · ${px.local ? "vs" : "en cancha de"} ${esc(px.rival)}</small>` : ""}</li>`;
  }).join("");
  return `<section class="bloque otros"><h2>Otros equipos</h2><ul class="eq-lista">${cards}</ul>
    <div class="chips eq-chips">${lista.map((n, i) => `<button class="chip" data-accion="eq-sacar" data-i="${i}" aria-label="Dejar de seguir a ${esc(n)}">${esc(n)} ×</button>`).join("")}</div>
    <form class="form" data-form="eq-sumar"><input name="t" placeholder="Sumar un equipo (Primera o Nacional)" aria-label="Sumar un equipo" autocomplete="off" required><button class="btn sec">Sumar</button></form>
    <p class="fuente-dato">Datos públicos de ESPN${d?.cuando ? ", al " + new Date(d.cuando).toLocaleString("es-AR", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) : ""}.</p></section>`;
}

// ---------- BNA · Productividad ----------
const f1 = (x) => (Math.round(x * 10) / 10).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const diaLargo = (iso) => { const d = new Date(iso + "T12:00"); return DIAS[d.getDay()] + " " + d.getDate() + "/" + (d.getMonth() + 1); };

function bloqueProductividad(ctx) {
  const p = datosProd();
  if (!sincroActiva()) return `<section class="bloque"><h2>Productividad</h2><p class="vacio">Vive en tu planilla «Orbe · datos»: activá la sincronización en Ajustes.</p></section>`;
  const errSem = leer("semillasError");
  if (!p || !p.tareas.length) return `<section class="bloque"><h2>Productividad</h2><p>Faltan tus pesos y metas. Salen de «Orbe · semillas», tu planilla privada en Drive.</p>
    ${errSem && /api-apagada:drive/.test(errSem) ? '<p class="fuente-dato">No la pude buscar: el servicio de Drive está apagado en tu proyecto de Google. Abrí el link de las semillas que te pasé, o prendé Drive.</p><div class="chips" style="margin-top:8px"><a class="chip" target="_blank" rel="noopener" href="https://console.cloud.google.com/apis/library/drive.googleapis.com?project=orbe-512903">Prender Drive</a></div>'
      : errSem ? `<p class="fuente-dato">No la pude leer (${esc(errSem)}).</p>` : ""}
    <div class="chips" style="margin-top:12px"><button class="chip" data-accion="activar-todo">Dar permiso de Drive</button><button class="chip" data-accion="actualizar-todo">Actualizar</button></div>
    <p class="fuente-dato">También podés cargarlos a mano en la hoja PESOS_PRODUCTIVIDAD.</p></section>`;
  const hoy = isoHoy(ctx.fecha);
  const fecha = sesionLeer("prodFecha") || hoy;
  const r = resumenDia(fecha);
  const meta = r.meta?.meta || null, efectivos = r.meta?.minutos || null;
  // Mientras el día está en curso no se marca «Bajo»: la banda aparece cuando llegás a Esperado.
  const b0 = banda(r.total, meta);
  const b = fecha === hoy && b0?.id === "bajo" ? null : b0;
  const pct = meta ? Math.min(100, r.total / meta * 100) : 0;
  const titulo = fecha === hoy ? "Hoy" : diaLargo(fecha);
  // Te faltan / minutos
  const unidadTxt = r.unidad ? (r.nUnidades === 1 ? "1 MS o cambio de cartera" : r.nUnidades + " MS o cambios de cartera") : "";
  const falta = !meta ? '<p class="vacio">Sin meta cargada para esta fecha.</p>'
    : r.falta > 1e-9 ? `<p class="te-faltan">Te faltan <b>${f1(r.falta)} pts</b>${r.unidad ? `: <b>${unidadTxt}</b> (${r.minutosFalta} min)` : ""}</p>`
    : `<p class="te-faltan ok">Meta cumplida${r.total - meta > 0.05 ? `: <b>+${f1(r.total - meta)} pts</b> arriba` : ""}.</p>`;
  const usados = Math.round(r.minutos), conFalta = usados + r.minutosFalta;
  const minutos = efectivos ? `<div class="minutos"><div class="barra"><i style="width:${Math.min(100, usados / efectivos * 100)}%"></i><i class="falta" style="width:${Math.max(0, Math.min(100 - usados / efectivos * 100, r.minutosFalta / efectivos * 100))}%"></i></div>
      <p class="fuente-dato">${usados} de ${efectivos} min estimados${r.minutosFalta ? ` · con lo que falta, ${conFalta} min: ${conFalta <= efectivos ? `<b>entra</b> (sobran ${efectivos - conFalta})` : `<b class="rojo-txt">no entra</b> (te pasás ${conFalta - efectivos})`}` : ""}.</p></div>` : "";
  const hoyHtml = `<section class="bloque prod-hoy"><div class="fila-prod"><h2>${esc(titulo)}</h2>
      <label class="cambiar-dia"><span class="sr">Elegir día</span><input type="date" data-accion="prod-fecha" value="${fecha}" max="${hoy}"></label></div>
    <div class="prod-total"><span class="cifra">${f1(r.total)}</span><span class="de">${meta ? "/ " + meta + " pts" : "pts"}</span>${b ? `<span class="chip-banda b-${b.id}">${b.txt}</span>` : ""}</div>
    <div class="barra prod"><i class="${b ? "b-" + b.id : ""}" style="width:${pct}%"></i></div>
    ${falta}${minutos}${hayPendientes() ? '<p class="fuente-dato">Guardando en tu planilla…</p>' : ""}</section>`;

  // Contadores
  const fila = (t, v) => `<li class="contador"><span><b>${esc(t.tarea)}</b><br><small class="vacio">${f1(t.puntos).replace(",0", "")} pts · ${String(t.minutos).replace(".", ",")} min</small></span>
    <span class="botones"><button class="mm" data-accion="prod-menos" data-tarea="${esc(t.tarea)}" aria-label="Restar ${esc(t.tarea)}" ${!v ? "disabled" : ""}>−</button>
    <b class="cant">${v || 0}</b><button class="mm" data-accion="prod-mas" data-tarea="${esc(t.tarea)}" aria-label="Sumar ${esc(t.tarea)}">+</button></span>
    <span class="pts">${v ? f1(v * t.puntos) : ""}</span></li>`;
  const habituales = p.tareas.filter((t) => t.grupo !== "otras");
  const otras = p.tareas.filter((t) => t.grupo === "otras");
  const usadas = otras.filter((t) => r.c[t.tarea]?.cantidad);
  const hist = r.c[HISTORICO];
  const tareas = `<section class="bloque"><h2>Tareas</h2><ul class="lista contadores">
      ${habituales.map((t) => fila(t, r.c[t.tarea]?.cantidad)).join("")}${usadas.map((t) => fila(t, r.c[t.tarea]?.cantidad)).join("")}
      ${hist ? `<li class="contador"><span><b>${HISTORICO}</b><br><small class="vacio">MS, cambios de cartera y otras, del total del banco</small></span><span></span><span class="pts">${f1(hist.puntos)}</span></li>` : ""}
      ${r.c[OFICIAL] ? `<li class="contador"><span><b>✓ Verificado con la planilla del banco</b><br><small class="vacio">${Math.abs(r.c[OFICIAL].puntos) >= 0.05 ? "Ajuste para que dé igual al oficial" : "Coincide con el oficial"}</small></span><span></span><span class="pts">${Math.abs(r.c[OFICIAL].puntos) >= 0.05 ? (r.c[OFICIAL].puntos > 0 ? "+" : "") + f1(r.c[OFICIAL].puntos) : ""}</span></li>` : ""}</ul>
    <form class="form" data-form="prod-otra"><select name="tarea" aria-label="Otra tarea" required><option value="">Otras tareas…</option>${otras.map((t) => `<option value="${esc(t.tarea)}">${esc(t.tarea)} · ${f1(t.puntos).replace(",0", "")}</option>`).join("")}</select><button class="btn">Sumar</button></form></section>`;

  // Presets
  const carga = p.tareas.find((t) => t.grupo === "carga"), control = p.tareas.find((t) => t.grupo === "control");
  const presets = carga && control ? `<section class="bloque"><h2>Día tipo <span class="tag">fija cargas y controles</span></h2><div class="presets">${PRESETS.map((pr) => {
    const pts = presetPuntos(pr), fal = meta && r.unidad ? Math.max(0, Math.ceil((meta - pts) / r.unidad.puntos - 1e-9)) : null;
    const activo = (r.c[carga.tarea]?.cantidad || 0) === pr.carga && (r.c[control.tarea]?.cantidad || 0) === pr.control;
    return `<button class="preset ${activo ? "on" : ""}" data-accion="prod-preset" data-id="${pr.id}"><b>${pr.nombre}</b>
      <span>${pr.carga} carga${pr.carga === 1 ? "" : "s"}${pr.control ? " + " + pr.control + " control" + (pr.control === 1 ? "" : "es") : ""}</span>
      <span>${f1(pts)} pts${fal === null ? "" : fal ? " · faltan " + fal + " MS/CC" : " · llega a la meta"}</span></button>`;
  }).join("")}</div></section>` : "";

  // Historial
  const meses = mesesConDatos();
  const mes = sesionLeer("prodMes") || (meses.includes(fecha.slice(0, 7)) ? fecha.slice(0, 7) : meses[meses.length - 1] || fecha.slice(0, 7));
  const hi = historial(mes, hoy);
  const i = meses.indexOf(mes);
  const [yy, mm] = mes.split("-").map(Number);
  const tope = Math.max(...hi.dias.map((d) => d.total), (hi.meta || 0) * 1.25, 1);
  const grafico = hi.dias.length ? `<div class="grafico-prod" role="img" aria-label="Puntos por día de ${MESES_LARGOS[mm - 1]}, con la línea de meta">
      <div class="area">${hi.meta ? `<span class="linea-meta" style="bottom:${hi.meta / tope * 100}%"><em>meta ${hi.meta}</em></span>` : ""}
      ${hi.dias.map((d) => `<i class="b-${d.banda?.id || "n"}" style="height:${d.total / tope * 100}%" title="${d.fecha.slice(8)}: ${f1(d.total)}"></i>`).join("")}</div>
      <div class="etiquetas">${hi.dias.map((d) => `<span>${Number(d.fecha.slice(8))}</span>`).join("")}</div></div>` : "";
  const historialHtml = `<section class="bloque"><div class="fila-prod"><h2>Historial · ${MESES_LARGOS[mm - 1]}${yy !== ctx.fecha.getFullYear() ? " " + yy : ""}</h2>
      <span class="nav-mes"><button class="mm" data-accion="prod-mes" data-mes="${meses[i - 1] || ""}" ${i > 0 ? "" : "disabled"} aria-label="Mes anterior">‹</button><button class="mm" data-accion="prod-mes" data-mes="${meses[i + 1] || ""}" ${i >= 0 && i < meses.length - 1 ? "" : "disabled"} aria-label="Mes siguiente">›</button></span></div>
    ${hi.dias.length ? `<div class="trio"><div><span class="k">Promedio</span><b>${hi.promedio !== null ? f1(hi.promedio) : "—"}</b>${hi.banda ? `<span class="chip-banda chica b-${hi.banda.id}">${hi.banda.txt}</span>` : ""}</div>
      <div><span class="k">En meta</span><b>${hi.enMeta} de ${hi.cerrados}</b><span class="fuente-dato" style="margin:0">días en ${hi.meta || "—"} o más</span></div>
      <div><span class="k">Mejor día</span><b>${f1(Math.max(...hi.dias.map((d) => d.total)))}</b></div></div>
      ${grafico}
      ${((fila) => { const ds = hi.dias.slice().reverse(); return `<ul class="lista dias-prod">${ds.slice(0, 5).map(fila).join("")}</ul>` +
        (ds.length > 5 ? `<details class="mas"><summary>Ver los ${ds.length} días</summary><ul class="lista dias-prod">${ds.slice(5).map(fila).join("")}</ul></details>` : ""); })((d) => `<li><button class="dia-prod" data-accion="prod-ir" data-fecha="${d.fecha}"><span>${diaLargo(d.fecha)}</span><span class="der">${f1(d.total)}${d.verificado ? ' <span class="verif" title="Verificado con la planilla del banco">✓</span>' : ""}${d.banda ? ` <span class="chip-banda chica b-${d.banda.id}">${d.banda.txt}</span>` : d.enCurso ? ' <span class="tag">en curso</span>' : ""}</span></button></li>`)}`
      : '<p class="vacio">Sin días cargados en este mes.</p>'}
    <p class="fuente-dato">Bandas: más de la meta Óptimo, hasta un 10% abajo Esperado, menos es Bajo. La meta va según la fecha.</p>
    ${(() => { const o = leer("prodOficial"); return `<div class="chips" style="margin-top:12px"><button class="chip" data-accion="prod-comparar">Comparar con la planilla del banco</button></div>
      <p class="fuente-dato">${o ? `Última comparación: ${new Date(o.cuando).toLocaleDateString("es-AR")} con «${esc(o.archivo)}» (hasta el ${o.hasta.slice(8)}/${o.hasta.slice(5, 7)}): ${o.verificados} coinciden, ${o.ajustados} ajustados, ${o.nuevos} agregados. ` : ""}Lee tu carpeta PRODUCTIVIDAD de Drive y toma solo tu fila; los días que coinciden quedan con ✓.</p>`; })()}</section>`;

  const pie = `<section class="bloque"><h2>Pesos y metas</h2><p>Cuánto vale cada tarea y la meta de cada período. Si el banco cambia un peso, lo cambiás acá y vale desde ese día: lo ya cargado no se mueve.</p>
    <div class="chips" style="margin-top:12px"><button class="chip" data-accion="prod-pesos">Editar pesos</button>${linkHoja() ? `<a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Abrir la planilla</a>` : ""}</div>
    <p class="fuente-dato">Esto es tu seguimiento personal: la planilla oficial del banco es la que manda.</p></section>`;
  return hoyHtml + tareas + presets + historialHtml + pie;
}

export function hojaPesos() {
  const p = datosProd();
  const filas = (p?.tareas || []).map((t, i) => `<div class="peso"><input type="hidden" name="o${i}" value="${esc(t.tarea)}"><input type="hidden" name="g${i}" value="${esc(t.grupo)}">
    <span class="nombre">${esc(t.tarea)}</span><label><span class="sr">Puntos de ${esc(t.tarea)}</span><input class="campo-hora" name="p${i}" inputmode="decimal" value="${String(Math.round(t.puntos * 1e6) / 1e6).replace(".", ",")}"></label>
    <label><span class="sr">Minutos de ${esc(t.tarea)}</span><input class="campo-hora" name="m${i}" inputmode="decimal" value="${String(t.minutos).replace(".", ",")}"></label></div>`).join("");
  return `<h2>Pesos</h2><form data-form="prod-pesos" data-n="${(p?.tareas || []).length}">
    <div class="peso cab"><span>Tarea</span><span>Puntos</span><span>Min</span></div>${filas}
    <div class="grupo"><span>Nueva tarea (opcional)</span><div class="peso"><input class="campo-hora" name="nt" placeholder="Nombre" style="text-align:left"><input class="campo-hora" name="np" inputmode="decimal" placeholder="Pts"><input class="campo-hora" name="nm" inputmode="decimal" placeholder="Min"></div></div>
    <p class="fuente-dato">Las metas se cambian en la hoja PESOS_PRODUCTIVIDAD: filas con grupo «meta» (desde qué fecha, meta del día y minutos efectivos).</p>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}

// Cargar un gasto en un toque.
export function hojaGasto() {
  const medios = [["efectivo", "Efectivo"], ["debito", "Débito"], ["tarjeta", "Tarjeta"], ["mp", "Mercado Pago"], ["transferencia", "Transferencia"]];
  return `<h2>Un gasto</h2><form data-form="gasto-rapido">
    <div class="grupo"><span>Cuánto</span><input class="campo-hora" name="monto" inputmode="decimal" required placeholder="3500" style="text-align:left;font-size:22px" autofocus></div>
    <div class="grupo"><span>En qué</span><input class="campo-hora" name="desc" required placeholder="Súper, café, Rappi…" style="text-align:left"></div>
    <div class="grupo"><span>Cómo pagaste</span><div class="chips">${medios.map(([v, t], i) => `<label class="chip ${i === 0 ? "on" : ""}"><input type="radio" class="sr" name="medio" value="${v}" ${i === 0 ? "checked" : ""}>${t}</label>`).join("")}</div></div>
    <div class="grupo"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="mitad" style="width:20px;height:20px"> Es de los dos (cuenta tu mitad)</label></div>
    <div class="grupo" style="display:flex;gap:10px"><button type="button" class="btn sec" data-accion="cerrar-hoja" style="flex:1">Cancelar</button><button class="btn" style="flex:2">Guardar</button></div></form>`;
}

// ---------- BNA · Escalafón ----------
const pct1 = (x) => (Math.round(x * 10) / 10).toLocaleString("es-AR", { maximumFractionDigits: 1 });
function bloqueEscalafon(ctx, $) {
  const e = datosEsc();
  const mesHoy = isoHoy(ctx.fecha).slice(0, 7);
  const nombreMes = (m) => { const [y, mm] = m.split("-").map(Number); return MESES_C[mm - 1] + "-" + String(y).slice(2); };
  if (!e || !e.cargos.length || !e.conformados.length) return `<section class="bloque"><h2>Escalafón</h2><p class="vacio">Llega con tus semillas: la grilla, los conformados y el Día del Bancario viven en tu planilla.</p></section>`;
  const conf = conformadoDe(mesHoy, e);
  const yo = tuCargo(e), g = yo && cargoEn(yo, mesHoy, e);
  const prox = proximoCargo(e), gp = prox && cargoEn(prox, mesHoy, e);
  const vs = grillaVsRecibo(e);
  const sig = new Date(ctx.fecha.getFullYear(), ctx.fecha.getMonth() + 1, 1);
  const est = estimadoNeto(isoHoy(sig).slice(0, 7), e);
  // Evolución de tu cargo con cada conformado cargado.
  const evo = yo ? e.conformados.map((c) => ({ mes: c.mes, total: cargoEn(yo, c.mes, e)?.total || 0 })).filter((x) => x.total) : [];
  const max = Math.max(...evo.map((x) => x.total), 1);
  const acum = evo.length > 1 ? (evo[evo.length - 1].total / evo[0].total - 1) * 100 : null;
  const tabla = e.cargos.map((c) => cargoEn(c, mesHoy, e)).filter(Boolean);
  return `<section class="bloque escalafon"><h2>Escalafón <span class="tag">Administrativa · conformado ${nombreMes(conf.mes)} ${$(conf.conformado)}</span></h2>
    ${g ? `<div class="tu-cargo"><span class="k">Tu cargo · ${esc(g.cargo)} (coef. ${String(g.coef).replace(".", ",")})</span>
      <div class="trio"><div><span class="k">Sueldo</span><b>${$(g.sueldo)}</b></div><div><span class="k">ROE</span><b>${$(g.roe)}</b></div><div><span class="k">Dev. aport.</span><b>${$(g.dev)}</b></div></div>
      <div class="trio" style="margin-top:8px"><div><span class="k">Total</span><b>${$(g.total)}</b></div><div><span class="k">Día del Bancario</span><b>${g.bancario ? $(g.bancario) : "—"}</b></div><div></div></div>
      ${gp ? `<p class="fuente-dato">Como ${esc(gp.cargo)}: ${$(gp.total)} (+${$(gp.total - g.total)} por mes).</p>` : ""}</div>` : ""}
    ${vs ? `<h2 style="margin-top:18px">Grilla y recibo</h2><ul class="lista">
      <li><span>Según grilla (${nombreMes(vs.grilla.mes)})<br><small class="vacio">sueldo + ROE + dev. aportes</small></span><span class="der" style="font-size:18px">${$(vs.grilla.total)}</span></li>
      <li><span>Te depositaron (recibo ${vs.recibo.mes.slice(5)}/${vs.recibo.mes.slice(0, 4)})<br><small class="vacio">neto, antes del descuento complementario</small></span><span class="der" style="font-size:18px">${$(vs.recibo.neto)}</span></li>
      <li><span>Descuentos de ley<br><small class="vacio">jubilación, obra social y demás</small></span><span class="der" style="font-size:18px">${$(vs.descuentos)} · ${pct1((1 - vs.proporcion) * 100)}%</span></li>
      ${est ? `<li><span>Próximo recibo, estimado<br><small class="vacio">con la grilla de ${nombreMes(est.grilla.mes)}</small></span><span class="der" style="font-size:18px">≈ ${$(est.neto)}</span></li>` : ""}</ul>` : ""}
    ${evo.length > 1 ? `<h2 style="margin-top:18px">Evolución de tu cargo <span class="tag">+${pct1(acum)}% desde ${nombreMes(evo[0].mes)}</span></h2>
      <div class="barras-esc">${evo.map((x, i) => `<div><span class="v">${i ? "+" + pct1((x.total / evo[i - 1].total - 1) * 100) + "%" : ""}</span><i style="height:${Math.round(x.total / max * 88)}px"></i><span>${nombreMes(x.mes)}</span></div>`).join("")}</div>` : ""}
    <details class="mas"><summary>Toda la grilla (${tabla.length} cargos)</summary><div class="tabla-esc"><table><thead><tr><th>Cargo</th><th>Coef.</th><th>Sueldo</th><th>Total</th><th>Bancario</th></tr></thead><tbody>
      ${tabla.map((c) => `<tr class="${c.tuyo ? "yo" : ""}"><td>${esc(c.cargo)}</td><td>${String(c.coef).replace(".", ",")}</td><td>${$(c.sueldo)}</td><td>${$(c.total)}</td><td>${c.bancario ? $(c.bancario) : "—"}</td></tr>`).join("")}</tbody></table></div></details>
    <form class="form" data-form="conformado" style="margin-top:14px;flex-wrap:wrap"><input type="month" name="mes" required value="${isoHoy(ctx.fecha).slice(0, 7)}" aria-label="Mes" style="flex:1 1 140px">
      <input name="monto" inputmode="decimal" required placeholder="Conformado nuevo" aria-label="Conformado" style="flex:1 1 140px"><button class="btn">Cargar</button></form>
    <p class="fuente-dato">Cuando sale un acuerdo nuevo, cargás el conformado (el sueldo de Auxiliar E) y toda la grilla se recalcula. Valores estimados ±0,5%, como las grillas que circulan.</p></section>`;
}

// ---------- Finanzas · Análisis (histórico) ----------
const COLORES_R = ["#4F7DF3", "#EE7B30", "#1F9D55", "#C8102E", "#8A5CF6", "#D99A00", "#9AA0A6"];
const mesCorto = (m) => { const [y, mm] = m.split("-").map(Number); return MESES_C[mm - 1] + (mm === 1 ? " " + String(y).slice(2) : ""); };
const mil = (n) => Math.abs(n) >= 1e6 ? (Math.round(n / 1e5) / 10).toLocaleString("es-AR") + " M" : Math.round(n / 1000).toLocaleString("es-AR") + " mil";
function barrasApiladas(meses, series, colores, alto = 150) {
  const tot = meses.map((m, i) => series.reduce((s, x) => s + Math.max(0, x.valores[i] || 0), 0));
  const max = Math.max(...tot, 1);
  return `<div class="graf-scroll"><div class="graf" style="height:${alto + 34}px">${meses.map((m, i) => `<div class="col" title="${mesCorto(m)}: ${series.map((x) => x.nombre + " " + mil(x.valores[i] || 0)).join(" · ")}">
    <div class="pila" style="height:${alto}px">${series.map((x, k) => `<i style="height:${Math.round(Math.max(0, x.valores[i] || 0) / max * alto)}px;background:${colores[k]}"></i>`).join("")}</div><span>${mesCorto(m)}</span></div>`).join("")}</div></div>
    <div class="leyenda">${series.map((x, k) => `<span><i style="background:${colores[k]}"></i>${esc(x.nombre)}</span>`).join("")}</div>`;
}
function linea(meses, valores, alto = 140) {
  const pts = meses.map((m, i) => [m, valores[m]]).filter(([, v]) => v != null);
  if (pts.length < 2) return "";
  const max = Math.max(...pts.map(([, v]) => v)), min = Math.min(0, ...pts.map(([, v]) => v));
  const W = Math.max(320, pts.length * 34), x = (i) => 16 + i * (W - 32) / (pts.length - 1), y = (v) => 10 + (alto - 20) * (1 - (v - min) / (max - min || 1));
  return `<div class="graf-scroll"><svg width="${W}" height="${alto + 22}" role="img" aria-label="Saldo a fin de cada mes">
    <polyline fill="none" stroke="#4F7DF3" stroke-width="2.5" stroke-linejoin="round" points="${pts.map(([, v], i) => x(i) + "," + y(v)).join(" ")}"/>
    ${pts.map(([m, v], i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="#4F7DF3"><title>${mesCorto(m)}: $ ${Math.round(v).toLocaleString("es-AR")}</title></circle><text x="${x(i)}" y="${alto + 18}" text-anchor="middle" class="eje">${mesCorto(m)}</text>`).join("")}</svg></div>`;
}
function bloqueAnalisis($) {
  const a = analisis();
  const imp = leer("historicoImport");
  const boton = `<div class="chips" style="margin-top:12px"><button class="chip" data-accion="hist-importar">${a ? "Buscar extractos nuevos" : "Leer extractos y resúmenes"}</button></div>
    <p class="fuente-dato">Lee los PDF de tus carpetas «EXTRACTOS…» y «RESUMENES TC» en Drive y los guarda en la hoja HISTORICO de tu planilla. Los que ya leyó no los repite.${imp ? ` Última lectura: ${new Date(imp.cuando).toLocaleDateString("es-AR")} · ${imp.archivos} archivos, ${imp.filas} movimientos${imp.noCierran.length ? ` · no cierran: ${imp.noCierran.map(esc).join(", ")}` : " · todos los saldos cierran"}.` : ""}</p>`;
  if (!a) return `<section class="bloque"><h2>Análisis económico</h2><p>Tu historia con la plata, desde el extracto más viejo hasta hoy: sueldo y descuentos, en qué se va, cómo evolucionó el saldo y cuánto te devolvieron las promos.</p>${boton}</section>`;
  const m = a.meses;
  const neto = m.map((x) => (a.sueldo[x] || 0) - (a.descuentos[x] || 0));
  const totPromos = m.reduce((s, x) => s + (a.promos[x] || 0), 0);
  const ultSueldo = [...m].reverse().find((x) => a.sueldo[x] > 0);
  const priSueldo = m.find((x) => a.sueldo[x] > 0);
  return `<section class="bloque"><h2>Análisis económico <span class="tag">${mesCorto(a.desde)} → ${mesCorto(a.hasta)} · ${a.total} movimientos</span></h2>
      ${priSueldo && ultSueldo && priSueldo !== ultSueldo ? `<div class="trio"><div><span class="k">Sueldo ${mesCorto(priSueldo)}</span><b>${$(a.sueldo[priSueldo])}</b></div><div><span class="k">Sueldo ${mesCorto(ultSueldo)}</span><b>${$(a.sueldo[ultSueldo])}</b></div><div><span class="k">Promos y rendim.</span><b>${$(totPromos)}</b></div></div>` : ""}${boton}</section>
    <section class="bloque"><h2>Sueldo: lo que te queda y los descuentos</h2>${barrasApiladas(m, [{ nombre: "Te queda", valores: neto }, { nombre: "Descuento complementario", valores: m.map((x) => a.descuentos[x] || 0) }], ["#4F7DF3", "#C8102E"])}
      <p class="fuente-dato">Acreditación de haberes menos el descuento complementario (préstamo y demás) que sale el mismo día.</p></section>
    <section class="bloque"><h2>En qué se va, mes a mes</h2>${barrasApiladas(m, a.top.map((r) => ({ nombre: r, valores: a.rubros.map((o) => o[r] || 0) })), COLORES_R)}
      <p class="fuente-dato">Compras con tarjeta (por rubro) y con débito, efectivo y transporte. No suma pagos de tarjeta ni pases entre tus cuentas, para no contar dos veces.</p></section>
    <section class="bloque"><h2>Saldo de la caja de ahorro</h2>${linea(m, a.saldo)}<p class="fuente-dato">El saldo con el que terminó cada mes.</p></section>
    <section class="bloque"><h2>Promos y reintegros</h2>${barrasApiladas(m, [{ nombre: "Promos, reintegros y rendimientos", valores: m.map((x) => a.promos[x] || 0) }], ["#1F9D55"], 100)}
      <p class="fuente-dato">Reintegros de MODO, devoluciones y rendimientos de la cuenta: en total ${$(totPromos)}.</p></section>
    ${a.grandes.filter((g) => g.categoria === "Transferencia enviada").length ? `<section class="bloque"><h2>Transferencias grandes: ¿a dónde fueron?</h2><ul class="lista">${a.grandes.slice(0, 12).map((g) => `<li style="flex-wrap:wrap;gap:8px"><span>${diaLargo(g.fecha)} · ${$(-g.monto)}<br><small class="vacio">${esc(g.concepto)}</small></span>
      <span class="chips">${[["Alquiler y servicios", "Alquiler y servicios"], ["A mis cuentas", "Pase propio"], ["Ahorro", "Inversión"], ["Otro gasto", "Otros gastos"]].map(([t, c]) => `<button class="chip" data-accion="hist-clasif" data-i="${g.i}" data-cat="${esc(c)}">${t}</button>`).join("")}</span></li>`).join("")}</ul>
      <p class="fuente-dato">Lo que elijas queda en tu planilla y corrige los gráficos.</p></section>` : ""}`;
}
