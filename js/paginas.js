// Páginas internas: universos, ideas, agenda, respiro, mis datos, ajustes, novedades.
import { UNIVERSOS, PROMOS, PROMOS_SIEMPRE, VERSION } from "./config.js";
import { NOVEDADES } from "./novedades.js";
import { ICONOS, MARCA } from "./iconos.js";
import { esc, colorTipo, colorUniverso } from "./inicio.js";
import { DIAS, DIAS_CORTOS, bloquesDe, bloquesFecha, pendientesCon, cuandoTexto, duracion, hhmm, MODOS } from "./contexto.js";
import { leer, todo, sesion as sesionLeer } from "./almacen.js";
import { datosFinanzas, resumenMes, topesSugeridos } from "./finanzas.js";
import { linkHoja } from "./hoja.js";
import { ultimaSincro, activa as sincroActiva } from "./sincro.js";
import { RUBROS } from "./rubros.js";
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
  agus(datos) {
    const lista = leer("super", []);
    const menu = leer("menu", {});
    const orden = [1, 2, 3, 4, 5, 6, 0];
    return `
    <section class="bloque"><h2>Lista del súper <span class="tag">compartida pronto</span></h2>
      <ul class="lista">${lista.length ? lista.map((it, i) => `<li><label style="display:flex;gap:10px;align-items:center;flex:1">
        <input type="checkbox" data-accion="super-tilde" data-i="${i}" ${it.ok ? "checked" : ""} style="width:20px;height:20px">
        <span style="${it.ok ? "text-decoration:line-through;color:var(--muted)" : ""}">${esc(it.t)}</span></label>
        <button class="ojo" data-accion="super-borrar" data-i="${i}" aria-label="Sacar ${esc(it.t)}">${ICONOS.cruz}</button></li>`).join("") : '<li class="vacio">La lista está vacía.</li>'}</ul>
      <form class="form" data-form="super"><input name="t" placeholder="Agregar algo" aria-label="Agregar a la lista" required><button class="btn">Sumar</button></form>
      ${local}</section>
    <section class="bloque"><h2>Menú de la semana</h2>
      <div style="display:grid;gap:8px">${orden.map((d) => `<label style="display:flex;gap:10px;align-items:center">
        <span style="width:40px;font-size:13px;color:var(--muted)">${DIAS_CORTOS[d]}</span>
        <input class="campo-menu" data-dia="${d}" value="${esc(menu[d] || "")}" placeholder="¿Qué se come?" style="flex:1;height:42px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-size:15px"></label>`).join("")}</div>
      ${local}</section>
    <section class="bloque"><h2>Planes y fechas</h2><ul class="lista">${(datos.fechas || []).map((f) => `<li><span>${esc(f.titulo)}</span><span class="der">${esc(f.fecha.split("-").reverse().join("/"))}</span></li>`).join("") || '<li class="vacio">Sin planes cargados.</li>'}</ul></section>
    ${pronto("Cuenta de Agus", "Cuando la v1 te ande a vos, Agus entra con su Google y ve solo lo compartido.")}`;
  },

  bna(datos, ctx) {
    const real = !!datos.agenda;
    const filas = real
      ? [0, 1, 2, 3, 4, 5, 6].map((i) => {
          const f = new Date(ctx.fecha.getTime() + i * 86400000);
          const b = bloquesFecha(datos, f).filter((x) => x.tipo === "bna");
          return b.length ? `<li><span>${i === 0 ? "Hoy" : i === 1 ? "Mañana" : DIAS[f.getDay()][0].toUpperCase() + DIAS[f.getDay()].slice(1) + " " + f.getDate()}</span><span class="der">${b.map((x) => x.inicio + "–" + hhmm(x.fin)).join(", ")}</span></li>` : "";
        }).join("")
      : [1, 2, 3, 4, 5, 6, 0].map((d) => {
          const b = bloquesDe(datos, d).filter((x) => x.tipo === "bna");
          return b.length ? `<li><span>${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)}</span><span class="der">${b.map((x) => x.inicio + "–" + hhmm(x.fin)).join(", ")}</span></li>` : "";
        }).join("");
    return `<section class="bloque"><h2>${real ? "Próximos 7 días" : 'Horarios <span class="ejemplo">Ejemplo</span>'}</h2><ul class="lista">${filas || '<li class="vacio">Sin horarios.</li>'}</ul></section>
      ${pronto("Recibos de sueldo", "Los leo de tu carpeta de recibos en Drive y te muestro neto, descuentos y disponible real de cada mes.")}
      <section class="bloque"><h2>Lo que nunca entra</h2><p class="vacio">Clientes, procedimientos e informes del banco quedan afuera de Orbe, siempre.</p></section>`;
  },

  ufasta(datos, ctx) {
    const entregas = pendientesCon(datos, ctx.fecha).filter((p) => p.tipo === "facu");
    const cursada = [1, 2, 3, 4, 5, 6, 0].flatMap((d) => bloquesDe(datos, d).filter((x) => x.tipo === "ufasta").map((x) => ({ d, x })));
    return `<section class="bloque"><h2>Entregas y TPs <span class="ejemplo">Ejemplo</span></h2><ul class="lista">${entregas.map((p) => `<li><span>${esc(p.titulo)}</span><span class="der ${p.dias < 3 ? "rojo" : ""}">${cuandoTexto(p.dias)}</span></li>`).join("") || '<li class="vacio">Nada pendiente.</li>'}</ul></section>
      <section class="bloque"><h2>Cursada</h2><ul class="lista">${cursada.map(({ d, x }) => `<li><span>${DIAS[d][0].toUpperCase() + DIAS[d].slice(1)}</span><span class="der">${x.inicio}–${hhmm(x.fin)}</span></li>`).join("") || '<li class="vacio">Sin horarios.</li>'}</ul></section>
      ${pronto("Notas", "Las traigo del campus cuando aparezcan.")}
      ${pronto("Materiales y links", "Apuntes y links de cada materia, ordenados.")}
      <section class="bloque"><h2>Accesos</h2><div class="chips"><a class="chip" href="https://www.ufasta.edu.ar" target="_blank" rel="noopener">Sitio de UFASTA ${""}</a></div></section>`;
  },

  bienestar(datos) {
    const p = datos.pasos;
    const max = Math.max(...p.semana);
    const hoyDia = new Date().getDay();
    const etiquetas = p.semana.map((_, i) => DIAS_CORTOS[(hoyDia - (p.semana.length - 1 - i) + 70) % 7]);
    const mejor = p.semana.indexOf(max);
    const dif = Math.round((p.hoy / p.promedio - 1) * 100);
    const futbol = [0, 1, 2, 3, 4, 5, 6].flatMap((d) => bloquesDe(datos, d).filter((x) => x.tipo === "futbol"));
    const notas = leer("futbol", []);
    return `<section class="bloque"><h2>Pasos <span class="ejemplo">Ejemplo</span></h2>
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap"><span style="font-family:var(--serif);font-size:44px">${p.hoy.toLocaleString("es-AR")}</span>
        <span class="vacio">${dif >= 0 ? "+" : ""}${dif}% contra tu promedio de ${p.promedio.toLocaleString("es-AR")}</span></div>
        <div class="barras">${p.semana.map((v, i) => `<div class="${i === p.semana.length - 1 ? "hoy" : ""}"><i style="height:${Math.round(v / max * 100)}%"></i>${etiquetas[i]}</div>`).join("")}</div>
        <p class="prom">Tu mejor día de la semana fue el ${etiquetas[mejor].toLowerCase()}, con ${max.toLocaleString("es-AR")} pasos.</p></section>
      <section class="bloque"><h2>Logros</h2><ul class="lista">
        <li><span>Récord de la semana</span><span class="der">${max.toLocaleString("es-AR")}</span></li>
        <li><span>Días arriba de tu promedio</span><span class="der">${p.semana.filter((v) => v > p.promedio).length} de 7</span></li></ul></section>
      <section class="bloque"><h2>Fútbol</h2><p>${futbol.length} partido${futbol.length === 1 ? "" : "s"} por semana en tu agenda.</p>
        <form class="form" data-form="futbol"><input name="t" placeholder="¿Cómo jugaste hoy?" aria-label="Nota del partido" required><button class="btn">Anotar</button></form>
        ${notas.length ? `<ul class="lista" style="margin-top:14px">${notas.slice(-3).reverse().map((n) => `<li><span>${esc(n.t)}</span><span class="tag">${esc(n.f)}</span></li>`).join("")}</ul>` : ""}
        <p class="vacio" style="margin-top:12px;font-size:12px">Con el reloj se suman distancia, velocidad y ritmo cardíaco.</p></section>
      <section class="bloque"><h2>Meditación</h2><div class="medita"><span class="reloj" id="medita-reloj">05:00</span>
        <div class="chips">${[3, 5, 10].map((m) => `<button class="chip" data-accion="medita" data-min="${m}">${m} min</button>`).join("")}<button class="chip" data-accion="medita-parar">Parar</button></div></div></section>
      <section class="bloque"><h2>Comida</h2><p>El menú de la semana vive en el universo compartido.</p><div class="chips" style="margin-top:12px"><a class="chip" href="#/u/agus">Ver menú con Agus</a></div></section>
      ${pronto("Gym", "La rutina personalizada la armamos más adelante.")}
      ${pronto("Sueño", "Llega con el reloj.")}
      ${pronto("Pasos reales", "Una mini app Android lee Health Connect en tu Xiaomi y los sube a tu Drive.")}`;
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
    return (datos.proyectos || []).map((p) => `<section class="bloque"><h2>${esc(p.nombre)} <span class="tag">${esc(p.estado)}</span></h2>
      ${p.proximo ? `<p><span class="vacio">Próximo paso:</span> ${esc(p.proximo)}</p>` : ""}
      <div class="chips" style="margin-top:${p.proximo ? 12 : 0}px">${p.url ? `<a class="chip" href="${esc(p.url)}" target="_blank" rel="noopener">Abrir</a>` : ""}${p.repo ? `<a class="chip" href="${esc(p.repo)}" target="_blank" rel="noopener">Repo</a>` : ""}${!p.url && !p.repo ? '<span class="vacio">Acceso por cargar</span>' : ""}</div></section>`).join("");
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
    <section class="bloque"><h2>Mañana, ${DIAS[manana.getDay()]}</h2><ul class="lista">${ctx.manana.map(fila).join("") || '<li class="vacio">Nada fijo.</li>'}</ul>${extra(isoDe(manana))}</section></div>`;
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
const PARTES = [["agenda", "Agenda"], ["sincro", "Celu y compu"], ["economia", "Planilla ECONOMÍA"], ["mails", "Mails del BNA y Mercado Pago"], ["recibos", "Recibos de sueldo (Drive)"]];
function estadoPartes(est) {
  const hace = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "recién" : m < 60 ? "hace " + m + " min" : "hace " + Math.round(m / 60) + " h"; };
  const filas = PARTES.filter(([k]) => est[k]).map(([k, n]) => {
    const e = est[k];
    if (e.ok) return `<li><span>${n}${e.nota ? `<br><small class="vacio">${esc(e.nota)}</small>` : ""}</span><span class="estado ok">✓ ${hace(e.ok)}</span></li>`;
    const apagada = /api-apagada:(sheets|gmail)/.exec(e.msj || "");
    const sinPermiso = /insufficient|scope|permiso/i.test(e.msj || "");
    const arreglo = sinPermiso && !apagada ? `<button class="btn" style="margin-top:8px" data-accion="activar-todo">Volver a dar permiso</button><span class="vacio" style="font-size:12px">En la pantalla de Google, tildá todas las casillas (sobre todo la de Gmail).</span>`
      : apagada ? `<a class="chip" style="margin-top:8px;display:inline-block" target="_blank" rel="noopener" href="https://console.cloud.google.com/apis/library/${apagada[1]}.googleapis.com?project=orbe-512903">Prender el servicio de ${apagada[1] === "sheets" ? "planillas" : "Gmail"}</a>` : "";
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
