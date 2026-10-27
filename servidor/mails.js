// Reglas fijas para entender los mails de aviso del BNA y de Mercado Pago.
// Cada mail se convierte en un movimiento { tipo, clase, monto, moneda, contra, medio, rubro, revisar }.
// Lo que no se entiende queda "a revisar"; lo que no es un movimiento (promos, avisos de seguridad) se ignora.
import { rubroDe } from "../js/rubros.js";

// "$ 35.000,00" · "$ 100000.00" · "$ 18.400" · "U$S 1.800,00" → número
export function numero(txt) {
  let s = String(txt).replace(/[^\d.,-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+\.\d{2}$/.test(s)) { /* punto decimal (Red Link) */ }
  else s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const PESOS = /\$\s?([\d.]+(?:,\d{1,2})?)/;
const titulo = (t) => String(t || "").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()).trim();
const limpiar = (t) => String(t || "").replace(/\s+/g, " ").trim();

// Saca un campo de las tablas de Red Link: "| Importe | $ 100000.00 |"
function campo(texto, nombre) {
  const m = texto.match(new RegExp(nombre + "\\s*\\|?\\s*([^|\\n]*)", "i"));
  return m ? limpiar(m[1]) : "";
}

const base = (mail, extra) => ({
  id: mail.id, ts: Number(mail.internalDate), moneda: "ARS", medio: "", contra: "", rubro: null,
  fuente: /mercadopago/i.test(mail.from) ? "Mail de Mercado Pago" : "Mail del BNA", ...extra,
  revisar: !!(extra.revisar || extra.monto == null)
});

export function leerMail(mail) {
  const asunto = limpiar(mail.subject);
  const texto = String(mail.text || "");
  const plano = limpiar(texto);
  const de = String(mail.from || "").toLowerCase();

  // ---------- BNA+ ----------
  if (de.includes("bnanet.bna.com.ar")) {
    let m = plano.match(/Realizaste una transferencia a (.+?) por \$\s?([\d.,]+)/i);
    if (m) return base(mail, { tipo: "transferencia", clase: "gasto", monto: numero(m[2]), contra: titulo(m[1]), medio: "BNA" });
    m = plano.match(/Recibiste una transferencia de (.+?) por \$\s?([\d.,]+)/i);
    if (m) return base(mail, { tipo: "transferencia", clase: "ingreso", monto: numero(m[2]), contra: titulo(m[1]), medio: "BNA" });
    m = plano.match(/operaci[oó]n de (Compra|Venta) de d[oó]lares por U\$S\s?([\d.,]+)/i);
    if (m) return base(mail, { tipo: m[1].toLowerCase() === "compra" ? "compra-usd" : "venta-usd", clase: "usd", moneda: "USD", monto: numero(m[2]), contra: "BNA", medio: "BNA" });
    if (/transferencia|d[oó]lares/i.test(asunto)) return base(mail, { tipo: "desconocido", clase: "gasto", monto: null, contra: asunto, revisar: true });
    return null; // accesos, destinatarios, stop debit: no son movimientos
  }

  // ---------- Red Link (bnainfo) ----------
  if (de.includes("bnainfo.bna.com.ar")) {
    const importe = numero(campo(texto, "Importe"));
    if (/^Transferencia Debitada/i.test(asunto)) {
      // Duplica el aviso de BNA+ de la misma transferencia: se marca para fusionar.
      return base(mail, { tipo: "transferencia", clase: "gasto", monto: importe, contra: titulo(campo(texto, "Nombre del Destinatario")) || "CUIT " + campo(texto, "CUIT del Destinatario"), medio: "BNA", eco: true });
    }
    if (/^Transferencia Acreditada/i.test(asunto)) {
      return base(mail, { tipo: "transferencia", clase: "ingreso", monto: importe, contra: titulo(campo(texto, "Nombre del Originante")) || "CUIT " + campo(texto, "CUIT del Originante"), medio: "BNA" });
    }
    if (/^Debin (Recurrente|Confirmado)/i.test(asunto)) {
      const cobrador = titulo(campo(texto, "Nombre del Cobrador"));
      return base(mail, { tipo: "debin", clase: /mercadolibre|mercado pago/i.test(cobrador) ? "propia" : "gasto", monto: importe, contra: cobrador || "Debin",
        medio: "BNA", grupo: "debin:" + campo(texto, "Identificador del Debin") });
    }
    if (/^Debin Acreditado/i.test(asunto)) {
      return base(mail, { tipo: "debin", clase: "ingreso", monto: importe, contra: titulo(campo(texto, "Nombre del (Originante|Pagador|Vendedor)")) || "Debin", medio: "BNA",
        grupo: "debin:" + campo(texto, "Identificador del Debin") });
    }
    return null;
  }

  // ---------- Mercado Pago ----------
  if (de.includes("mercadopago")) {
    let m;
    if (/^Pago aprobado en (.+)$/i.test(asunto)) {
      const comercio = asunto.replace(/^Pago aprobado en /i, "").trim();
      m = plano.match(/Pagaste \$\s?([\d.,]+)/i);
      const tarjeta = /cr[eé]dito\s*\*+\s*\d{4}|tarjeta de cr[eé]dito/i.test(plano);
      return base(mail, { tipo: "pago", clase: tarjeta ? "gasto-tarjeta" : "gasto", monto: m ? numero(m[1]) : null, contra: comercio,
        medio: tarjeta ? ((plano.match(/([A-Za-zÁÉÍÓÚáéíóúñ ]*Cr[eé]dito \*+ ?\d{4})/)?.[1] || "Tarjeta de crédito").trim()) : "Mercado Pago",
        rubro: rubroDe(comercio), revisar: !m });
    }
    if (/^Tu transferencia fue enviada/i.test(asunto)) {
      m = plano.match(/transferencia de \$\s?([\d.,]+)/i);
      const quien = plano.match(/Nombre y apellido:\s*(.+?)\s+(Entidad|CUIT|CVU|N[uú]mero)/i);
      return base(mail, { tipo: "transferencia", clase: "gasto", monto: m ? numero(m[1]) : null, contra: quien ? titulo(quien[1]) : "Transferencia", medio: "Mercado Pago", revisar: !m });
    }
    if (/^Recibiste (una transferencia|dinero|un pago)/i.test(asunto)) {
      m = plano.match(PESOS);
      return base(mail, { tipo: "transferencia", clase: "ingreso", monto: m ? numero(m[1]) : null, contra: "Mercado Pago", medio: "Mercado Pago", revisar: !m });
    }
    if (/^(Pagaste|Saldaste) tu cr[eé]dito/i.test(asunto)) {
      m = plano.match(/Monto pagado\s*\|?\s*\$\s?([\d.,]+)/i) || plano.match(PESOS);
      return base(mail, { tipo: "cuota", clase: "deuda", monto: m ? numero(m[1]) : null, contra: "Crédito Mercado Pago", medio: "Mercado Pago", revisar: !m });
    }
    if (/^Pagaste (el resumen|parte de tus consumos)/i.test(asunto)) {
      m = plano.match(/Pagaste \$\s?([\d.,]+)/i);
      return base(mail, { tipo: "pago-tarjeta", clase: "tarjeta", monto: m ? numero(m[1]) : null, contra: "Tarjeta Mercado Pago", medio: "Mercado Pago", revisar: !m });
    }
    if (/^Tu pago fue devuelto/i.test(asunto)) {
      m = plano.match(/devolvi[oó] el pago de \$\s?([\d.,]+)/i);
      return base(mail, { tipo: "devolucion", clase: "devolucion", monto: m ? numero(m[1]) : null, contra: "Devolución", medio: "Mercado Pago", revisar: !m });
    }
    if (/^Acreditamos tu Dinero Plus/i.test(asunto)) {
      m = plano.match(PESOS);
      return base(mail, { tipo: "credito-recibido", clase: "ingreso", monto: m ? numero(m[1]) : null, contra: "Dinero Plus (crédito MP)", medio: "Mercado Pago", revisar: true,
        nota: "Es un préstamo: plata que entra pero se devuelve." });
    }
    return null; // vencimientos, promociones, encuestas
  }
  return null;
}
