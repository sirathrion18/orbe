// Tus cuentas (alias y CBU): arrancan con la hoja ALIAS CBU de tu planilla y se editan acá.
// Lo que cambies queda en Orbe («cuentas», se sincroniza entre el celu y la compu); tu planilla no se toca.
import { leer, guardar, sesion } from "./almacen.js";
import { datosEconomia } from "./economia.js";
import { esc } from "./inicio.js";
import { ICONOS } from "./iconos.js";

export function cuentas() {
  const propias = leer("cuentas", null);
  if (Array.isArray(propias)) return propias;
  return (datosEconomia()?.alias?.cuentas || []).map((c) => ({ banco: c.banco, cbu: c.cbu, alias: c.alias }));
}
export function guardarCuentas(lista) {
  const limpias = (lista || []).map((c) => ({ banco: String(c.banco || "").trim().slice(0, 40), cbu: String(c.cbu || "").replace(/\s+/g, "").slice(0, 30), alias: String(c.alias || "").trim().slice(0, 40) }))
    .filter((c) => c.banco || c.cbu || c.alias);
  guardar("cuentas", limpias);
  return limpias;
}
// 22 dígitos, de a cuatro, para leerlo mejor (se copia sin espacios).
const lindo = (cbu) => /^\d{22}$/.test(cbu) ? cbu.replace(/(\d{4})(?=\d)/g, "$1 ") : cbu;
const tipo = (c) => /^0000/.test(c.cbu) ? "CVU" : "CBU";

export const filaCuentaEd = (c = {}) => `<li class="cta-ed"><button type="button" class="chk-sacar" data-accion="cta-ed-sacar" aria-label="Sacar esta cuenta">${ICONOS.cruz}</button>
    <input class="campo-linea" data-k="banco" value="${esc(c.banco || "")}" placeholder="Banco o billetera" aria-label="Banco o billetera" autocomplete="off">
    <input class="campo-linea" data-k="cbu" value="${esc(c.cbu || "")}" placeholder="CBU o CVU" aria-label="CBU o CVU" inputmode="numeric" autocomplete="off">
    <input class="campo-linea" data-k="alias" value="${esc(c.alias || "")}" placeholder="Alias" aria-label="Alias" autocomplete="off"></li>`;

export function bloqueCuentas() {
  const l = cuentas();
  if (sesion("ctasEditando")) {
    return `<section class="bloque cuentas"><h2>Tus cuentas</h2><form data-form="ctas-editar"><ul class="cta-ed-lista">${(l.length ? l : [{}]).map(filaCuentaEd).join("")}</ul>
      <button type="button" class="chip" data-accion="cta-ed-sumar">+ Sumar una cuenta</button>
      <div class="chk-ed-botones"><button type="button" class="btn sec" data-accion="ctas-cancelar">Cancelar</button><button class="btn">Listo</button></div></form>
      <p class="fuente-dato">Lo que cambies queda en Orbe y viaja entre el celu y la compu; tu planilla no se toca.</p></section>`;
  }
  if (!l.length) return `<section class="bloque cuentas"><h2>Tus cuentas</h2><p class="vacio">Todavía no hay cuentas. Sumalas acá o en la hoja ALIAS CBU de tu planilla.</p><div class="chips" style="margin-top:10px"><button class="chip" data-accion="ctas-editar">Sumar cuentas</button></div></section>`;
  return `<section class="bloque cuentas"><div class="cta-cab"><h2>Tus cuentas <span class="tag">tocá para copiar</span></h2><button class="chip" data-accion="ctas-editar">Editar</button></div>
    ${l.map((c) => `<div class="cta"><b>${esc(c.banco)}</b>
      ${c.alias ? `<div class="cta-row"><code>${esc(c.alias)}</code><button class="cta-copy" data-accion="copiar" data-texto="${esc(c.alias)}">Copiar alias</button></div>` : ""}
      ${c.cbu ? `<div class="cta-row"><code>${esc(lindo(c.cbu))}</code><button class="cta-copy" data-accion="copiar" data-texto="${esc(c.cbu)}">Copiar ${tipo(c)}</button></div>` : ""}</div>`).join("")}</section>`;
}
