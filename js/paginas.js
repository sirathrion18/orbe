// Páginas internas: universos, ideas, agenda, respiro, mis datos, ajustes, novedades.
import { UNIVERSOS, PROMOS, PROMOS_SIEMPRE, VERSION } from "./config.js";
import { NOVEDADES } from "./novedades.js";
import { ICONOS, MARCA } from "./iconos.js";
import { esc, colorTipo, colorUniverso, datosPartido, resultadoTxt, torneoCorto, estadioCorto, regresiva } from "./inicio.js";
import { DIAS, DIAS_CORTOS, bloquesDe, bloquesFecha, pendientesCon, cuandoTexto, duracion, hhmm, MODOS, lunesDe, minutosDia, sumaTipo } from "./contexto.js";
import { datosListas, proximaAnual } from "./listas.js";
import { datosProd, resumenDia, banda, PRESETS, presetPuntos, historial, mesesConDatos, isoHoy, metaDe, HISTORICO, OFICIAL, hayPendientes } from "./productividad.js";
import { permisos as permisosG } from "./google.js";
import { leer, todo, sesion as sesionLeer } from "./almacen.js";
import { datosFinanzas, resumenMes, topesSugeridos } from "./finanzas.js";
import { linkHoja } from "./hoja.js";
import { ultimaSincro, activa as sincroActiva } from "./sincro.js";
import { RUBROS } from "./rubros.js";
import { datosFacu, promedio } from "./facu.js";
import { datosEconomia, linkEconomia, idEconomia } from "./economia.js";

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const volver = `<a class="volver" href="#/">${ICONOS.volver} Inicio</a>`;
const pronto = (titulo, texto) => `<section class="bloque pronto"><h2>${titulo}</h2><p class="vacio">${texto}</p></section>`;
const local = '<p class="vacio" style="margin-top:12px;font-size:12px">Por ahora se guarda solo en este dispositivo.</p>';

function cabecera(u, datos, tema) {
  return `${volver}<h1><i class="dot" style="width:12px;height:12px;border-radius:6px;vertical-align:middle;margin-right:10px;background:${colorUniverso(datos, u, tema)}"></i>${esc(u.nombre)}</h1>
    <p class="bajada">${esc(u.bajada)}</p>`;
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
      <div class="trio"><div><span class="k">Ingresos</span><b>${$(m.ingresos || 0)}</b></div><div><span class="k">Egresos</span><b>${$(m.total || 0)}</b></div>
        <div><span class="k">Saldo</span><b style="${m.saldo < 0 ? "color:var(--accent)" : ""}">${$(m.saldo || 0)}</b></div></div>
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
      <div class="trio" style="margin-top:14px"><div><span class="k">Total</span><b>${$(div.total || 0)}</b></div><div><span class="k">Tu mitad</span><b>${$(div.mitad || 0)}</b></div><div></div></div>
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
    const tab = sesionLeer("bnaTab") || "prod";
    const pestanas = `<div class="pestanas" role="tablist">${[["prod", "Productividad"], ["horas", "Horarios y sueldo"]].map(([id, t]) =>
      `<button class="pestana ${tab === id ? "on" : ""}" role="tab" aria-selected="${tab === id}" data-accion="bna-tab" data-tab="${id}">${t}</button>`).join("")}</div>`;
    const nunca = `<section class="bloque"><h2>Lo que nunca entra</h2><p class="vacio">Solo tus números: nada de clientes, compañeros ni el contenido de los informes.</p></section>`;
    if (tab === "prod") return pestanas + bloqueProductividad(ctx) + nunca;
    return `${pestanas}${aviso}${semana(0)}${semana(1)}${horas}${sueldo}
      <section class="bloque"><h2>Fichar</h2><p>Media hora antes de entrar, Inicio te recuerda fichar en Teams. Tocás «Listo» y desaparece hasta el día siguiente.</p></section>
      ${nunca}`;
  },

  ufasta(datos, ctx) {
    const f = datosFacu();
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
    const venc = pendientesCon(datos, ctx.fecha).filter((x) => x.universo === "finanzas" && x.dias >= -60);
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
    return `${aviso}${bloqueEconomia(ctx, $)}${cabeza}${dolar}${revisar}${topes}${rubros}
      <section class="bloque"><h2>Vencimientos ${datos.agenda ? "" : '<span class="ejemplo">Ejemplo</span>'}</h2><ul class="lista">${venc.map((d) => `<li style="align-items:flex-start"><span style="display:flex;flex-direction:column;gap:4px;min-width:0"><span>${esc(d.titulo)}${d.vernet ? ' <span class="tag">Vernet</span>' : ""}${d.nota ? ` <span class="tag">${esc(d.nota)}</span>` : ""}</span>${d.monto ? `<b>${esc(d.monto)}</b>` : ""}<span class="der ${d.dias <= 7 && !d.vernet ? "rojo" : ""}" style="font-size:17px">${cuandoTexto(d.dias)}</span></span>
        <button class="hecho" style="margin:0" data-accion="hecho" data-clave="${esc(d.clave)}" aria-label="Marcar ${esc(d.titulo)} como hecho">${ICONOS.check}</button></li>`).join("") || '<li class="vacio">Nada pendiente.</li>'}</ul>
        ${leer("hechos", []).length ? '<button class="link" style="margin-top:12px;font-size:13px" data-accion="deshacer-hechos">Volver a mostrar los marcados como hechos</button>' : ""}</section>
      ${movs}${deudas}
      ${bloqueAlias()}
      <section class="bloque"><h2>Promos de hoy, ${DIAS[dia]}</h2><ul class="lista">${((datosEconomia()?.alias?.promos?.[dia]?.length ? datosEconomia().alias.promos[dia] : null) || (PROMOS[dia] || []).concat(PROMOS_SIEMPRE)).map((x) => `<li><span>${esc(x)}</span></li>`).join("")}</ul>
        <p class="vacio" style="margin-top:10px;font-size:12px">Los topes cambian seguido: verificalos antes de pagar.</p></section>
      ${linkHoja() ? `<section class="bloque"><h2>Planilla</h2><p>Todo vive en tu planilla <b>Orbe · datos</b>: podés corregir a mano lo que quieras.</p><div class="chips" style="margin-top:12px"><a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Abrir la planilla</a></div></section>` : ""}`;
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
      const ultimo = g?.fecha ? `<p class="fuente-dato" style="margin-top:0">Último cambio ${hace(g.fecha)}: ${esc(g.mensaje)}</p>` : g?.privado ? '<p class="fuente-dato" style="margin-top:0">Repo privado: sin datos de cambios.</p>' : "";
      return `<section class="bloque"><h2>${esc(p.nombre)} <span class="tag">${esc(p.estado)}</span></h2>${ultimo}
      ${p.proximos.length ? `<p class="vacio" style="font-size:12px;margin-top:10px">Próximos pasos</p><ul class="pasos">${p.proximos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      <div class="chips" style="margin-top:12px">${p.url ? `<a class="chip" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir</a>` : ""}${p.repo ? `<a class="chip" href="${esc(repoUrl(p.repo))}" target="_blank" rel="noopener">Repo</a>` : ""}${l?.proyectos?.length ? `<button class="chip" data-accion="proyecto-pasos" data-id="${esc(p.id)}">Editar pasos</button>` : ""}</div></section>`;
    }).join("") + (l ? "" : '<p class="fuente-dato">Con la sincronización activa, la lista vive en la hoja PROYECTOS de tu planilla y se ve el último cambio de cada repo.</p>');
  }
};

export function renderUniverso(id, datos, ctx, tema) {
  const u = UNIVERSOS.find((x) => x.id === id);
  if (!u) return renderNoEncontrado();
  return `<div class="pagina">${cabecera(u, datos, tema)}${PAGINAS[id](datos, ctx)}</div>`;
}

export function renderBloqueo(id, conHuella, conPin) {
  const u = UNIVERSOS.find((x) => x.id === id);
  return `<div class="pagina">${volver}<h1>${esc(u.nombre)}</h1><p class="bajada">Este universo está bloqueado.</p>
    ${conHuella ? `<button class="btn ancho-completo" data-accion="huella-abrir" data-id="${id}" style="height:56px;font-size:16px">Abrir con huella</button>` : ""}
    ${conPin ? `<form class="form" data-form="pin" data-id="${id}" style="margin-top:${conHuella ? 18 : 12}px"><input name="pin" type="password" inputmode="numeric" autocomplete="off" placeholder="${conHuella ? "o con el PIN" : "PIN"}" aria-label="PIN" required><button class="btn">Entrar</button></form>` : ""}</div>`;
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
  return `<div class="pagina">${volver}<h1>Agenda</h1><p class="bajada">${ag ? "De tu Google Calendar." : "Rutina de ejemplo: conectá Google en Ajustes para ver la tuya."}</p>
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
const PARTES = [["agenda", "Agenda"], ["sincro", "Celu y compu"], ["economia", "Planilla ECONOMÍA"], ["mails", "Mails del BNA y Mercado Pago"], ["recibos", "Recibos de sueldo (Drive)"], ["facu", "Campus de UFASTA"], ["listas", "Agus, fútbol y proyectos"], ["prod", "Productividad del BNA"]];
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
    <section class="bloque"><h2>Cuenta de Google</h2>${tarjeta}
      <p class="vacio" style="margin-top:12px;font-size:12px">La sesión dura 30 días y se renueva sola cada vez que usás Orbe. Orbe nunca ve tu contraseña.</p></section>

    <section class="bloque"><h2>Celu y compu sincronizados</h2>
      ${!conectado ? '<p class="vacio">Primero conectá tu Google.</p>'
        : !p.sheets || !p.gmail || !p.drive || !p.calendario ? `<p>${p.sheets ? "Hay permisos nuevos para dar: leer tus recibos de sueldo en Drive y crear eventos en tu calendario desde Orbe." : "Un solo permiso más y Orbe: sincroniza el celu y la compu (hechos, horario, ideas, súper, menú, tipografías) y lee los avisos del BNA y de Mercado Pago para Finanzas."}</p>
          <div class="chips" style="margin-top:12px"><button class="btn" data-accion="activar-todo">Dar permiso</button></div>
          <p class="vacio" style="margin-top:12px;font-size:12px">Tildá todas las casillas en la pantalla de Google. Mails y Drive: solo lectura (Orbe nunca escribe ni borra; el texto de los mails no sale del servidor). Planillas: Orbe solo escribe en «Orbe · datos». Calendario: solo crea los eventos que vos le pidas.</p>`
        : !google.hoja ? `<p>Pegá el link de tu planilla <b>Orbe · datos</b> (está en Drive, en Herramientas de IA → Orbe). Se hace una vez en cada dispositivo.</p>
          <form class="form" data-form="hoja"><input name="link" placeholder="https://docs.google.com/spreadsheets/d/…" aria-label="Link de la planilla" required><button class="btn">Listo</button></form>`
        : `${estadoPartes(google.estadoAct)}
          <div class="chips" style="margin-top:12px"><a class="chip" href="${esc(linkHoja())}" target="_blank" rel="noopener">Abrir la planilla Orbe · datos</a></div>
          <p class="vacio" style="margin-top:10px;font-size:12px">Se actualiza solo al abrir Orbe, al volver a la app y cada 5 minutos. Lo que cambiás se manda solo a la planilla en un par de segundos.</p>
          <p style="margin-top:16px">${idEconomia() ? "Tu planilla <b>ECONOMÍA</b> está conectada: Orbe la lee y nunca la modifica." : "Para ver tu planilla <b>ECONOMÍA</b> en Finanzas, pegá su link:"}</p>
          ${idEconomia() ? "" : '<form class="form" data-form="economia"><input name="link" placeholder="Link de ECONOMÍA" aria-label="Link de la planilla ECONOMÍA" required><button class="btn">Listo</button></form>'}`}
    </section>

    <section class="bloque"><h2>Tipografías</h2>
      <p class="vacio" style="font-size:13px;margin-bottom:10px">Reloj del anillo</p>
      <div class="muestras">${RELOJES.map((x) => muestra("reloj", x)).join("")}</div>
      <p class="vacio" style="font-size:13px;margin:16px 0 10px">Saludo</p>
      <div class="muestras">${SALUDOS_F.map((x) => muestra("saludo", x)).join("")}</div></section>

    <section class="bloque"><h2>Horario fijo del BNA</h2>
      <p class="vacio" style="font-size:13px;margin-bottom:14px">Completa los días hábiles que tu calendario no tenga cargados.</p>
      <form data-form="horario"><div class="horas"><span></span><span class="cab">Entrada</span><span class="cab">Salida</span>
        ${[1, 2, 3, 4, 5].map((d) => { const h = leer("horario", {})[d] || {}; return `<span class="dia">${DIAS_CORTOS[d]}</span>
        <input type="time" name="i${d}" value="${esc(h.inicio || "")}" aria-label="Entrada ${DIAS[d]}">
        <input type="time" name="f${d}" value="${esc(h.fin || "")}" aria-label="Salida ${DIAS[d]}">`; }).join("")}</div>
        <button class="btn ancho-completo" style="margin-top:14px">Guardar horario</button></form></section>

    <section class="bloque"><h2>Tema</h2><div class="chips">${[["auto", "Automático"], ["claro", "Claro"], ["oscuro", "Oscuro"]].map(([k, n]) => `<button class="chip ${tema === k ? "on" : ""}" data-accion="tema-fijo" data-tema="${k}">${n}</button>`).join("")}</div>
      <p class="vacio" style="margin-top:12px;font-size:13px">Automático: claro de día y oscuro desde la puesta del sol en Buenos Aires. El botón de Inicio lo cambia hasta la próxima salida o puesta.</p></section>
    <section class="bloque"><h2>Probar modos del día</h2><div class="chips"><button class="chip ${!demo ? "on" : ""}" data-accion="demo" data-modo="">Real</button>${MODOS.map((m) => `<button class="chip ${demo === m ? "on" : ""}" data-accion="demo" data-modo="${m}">${m === "normal" ? "Normal" : m === "libre" ? "Día libre" : m === "river" ? "River" : m === "marvel" ? "Guiño Marvel" : "Noche"}</button>`).join("")}</div>
      <p class="vacio" style="margin-top:12px;font-size:13px">Simula el día y la hora de cada modo. Se apaga al cerrar Orbe.</p></section>
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
  const CLASES_TXT = [["gasto", "Gasto"], ["gasto-tarjeta", "Con tarjeta"], ["tarjeta", "Pago de tarjeta"], ["deuda", "Cuota"], ["ahorro", "Ahorro"], ["propia", "Entre mis cuentas"], ["ingreso", "Ingreso"]];
  return `<h2>${esc(m.contra || m.tipo)}</h2>
    <p class="vacio" style="margin:-4px 0 4px">$ ${Math.round(m.monto || 0).toLocaleString("es-AR")} · ${esc(m.fuente || "")}</p>
    <form data-form="fin-mov" data-id="${esc(m.id)}">
      <div class="grupo"><span>Qué es</span><div class="chips">${CLASES_TXT.map(([k, n]) => `<label class="chip ${m.clase === k ? "on" : ""}"><input type="radio" class="sr" name="clase" value="${k}" ${m.clase === k ? "checked" : ""}>${n}</label>`).join("")}</div></div>
      <div class="grupo"><span>Rubro</span><div class="chips">${RUBROS.map((r) => `<label class="chip ${m.rubro === r ? "on" : ""}"><input type="radio" class="sr" name="rubro" value="${esc(r)}" ${m.rubro === r ? "checked" : ""}>${esc(r)}</label>`).join("")}</div></div>
      <div class="grupo"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="mitad" ${m.mitad ? "checked" : ""} style="width:20px;height:20px"> Se divide con Agus (cuenta tu mitad)</label></div>
      <div class="grupo"><label style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="aprender" checked style="width:20px;height:20px"> Recordarlo para la próxima vez que aparezca</label></div>
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
  const vuelta = `${volver}<h1>River</h1><p class="bajada">Próximos partidos, resultados y la tabla. Datos públicos de ESPN.</p>`;
  if (!rv || (!rv.proximo && !rv.ultimo)) return `<div class="pagina">${vuelta}<section class="bloque"><p class="vacio">Todavía no llegaron los datos. Tocá ↻ en Inicio.</p></section></div>`;
  const p = rv.proximo;
  const d = p && datosPartido(p, ctx.fecha);
  const hero = p ? `<section class="w river ancho hero ${p.clasico ? "clasico" : ""}"><span class="k">${p.clasico ? "Superclásico" : "Próximo partido"} · ${esc(torneoCorto(p.torneo))}</span>
      <span class="tit">${esc(d.titulo)}</span><span class="sub">${d.dia} · ${d.hora}${p.estadio ? " · " + esc(estadioCorto(p.estadio)) : ""}</span>
      <span class="banda-river">${regresiva(p.fecha, true)}</span></section>` : "";
  const prox = (rv.proximos || []).slice(1);
  const R = (u) => u.gf > u.gc ? "G" : u.gf < u.gc ? "P" : "E";
  const ult = rv.ultimos || (rv.ultimo ? [rv.ultimo] : []);
  const t = rv.tabla;
  return `<div class="pagina">${vuelta}${hero}
    ${prox.length ? `<section class="bloque"><h2>Lo que sigue</h2><ul class="lista">${prox.map((x) => { const dx = datosPartido(x, ctx.fecha); return `<li><span>${x.clasico ? "<b>Superclásico</b> · " : ""}${x.local ? "vs " : "en cancha de "}${esc(x.rival)}<br><small class="vacio">${esc(torneoCorto(x.torneo))}</small></span><span class="tag">${dx.dia} · ${dx.hora}</span></li>`; }).join("")}</ul></section>` : ""}
    ${ult.length ? `<section class="bloque"><h2>Últimos resultados</h2><ul class="lista">${ult.map((x) => `<li><span><span class="res res-${R(x)}">${R(x)}</span> ${x.gf}-${x.gc}${x.penales ? ` (${x.penales[0]}-${x.penales[1]} pen.)` : ""} ${x.local ? "vs" : "en cancha de"} ${esc(x.rival)}<br><small class="vacio">${esc(torneoCorto(x.torneo))}</small></span><span class="tag">${new Date(x.fecha).getDate()}/${new Date(x.fecha).getMonth() + 1}</span></li>`).join("")}</ul></section>` : ""}
    ${t ? `<section class="bloque"><h2>Tabla <span class="tag">${esc(t.zona)}</span></h2><div class="trio">
      <div><span class="k">Posición</span><b>${t.pos}° de ${t.equipos}</b></div><div><span class="k">Puntos</span><b>${t.pts}</b></div><div><span class="k">PJ · G-E-P</span><b>${t.pj} · ${t.g}-${t.e}-${t.p}</b></div></div>
      <p class="fuente-dato">${esc(torneoCorto(t.torneo))}. Diferencia de gol: ${t.dg > 0 ? "+" : ""}${t.dg}.</p></section>` : ""}
    <section class="bloque"><h2>Accesos</h2><div class="chips"><a class="chip" href="https://www.cariverplate.com.ar" target="_blank" rel="noopener">Sitio oficial</a><a class="chip" href="https://www.espn.com.ar/futbol/equipo/_/id/16/river-plate" target="_blank" rel="noopener">River en ESPN</a></div></section></div>`;
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
