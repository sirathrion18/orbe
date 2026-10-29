package ar.nacho.satelite;

import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lee el texto de una notificación de una app de pago y saca solo lo que Orbe necesita:
 * monto, moneda, comercio y si fue un pago, un cobro o una transferencia.
 * Si no está seguro (promos, avisos sin monto, préstamos), devuelve null y no se manda nada.
 * Java puro, sin Android: se prueba en la compu.
 */
public final class Lector {

    public static final class Aviso {
        public final String id, app, moneda, comercio, sentido;
        public final double monto;
        public final long ts;

        Aviso(String id, String app, double monto, String moneda, String comercio, String sentido, long ts) {
            this.id = id; this.app = app; this.monto = monto; this.moneda = moneda;
            this.comercio = comercio; this.sentido = sentido; this.ts = ts;
        }

        @Override public String toString() {
            return app + " | " + sentido + " | " + moneda + " " + monto + " | " + comercio;
        }
    }

    private Lector() {}

    // Publicidad, beneficios y ofertas: nunca son movimientos.
    private static final Pattern PROMO = Pattern.compile(
        "promo|descuento|reintegr|cashback|hasta \\$|\\d+ ?%|cuotas sin inter|aprovech|beneficio|sorteo|gan[aá] |ganate|invert[ií]|rendimiento|rindi|prestamo|pr[eé]stamo|te prestamos|"
            + "disponible para|oferta|cup[oó]n|tope|l[ií]mite|cr[eé]dito pre|preaprobad|sum[aá] |descubr|record[aá] que|vence el|vencimiento|pag[aá] tu resumen|ultimo d[ií]a|"
            + "solicit|calific|encuesta|seguro de|nuevo dispositivo|inicio de sesi|c[oó]digo de|token|clave",
        Pattern.CASE_INSENSITIVE);

    private static final Pattern MONTO = Pattern.compile(
        "(US\\$|U\\$S|USD|\\$)\\s?(\\d{1,3}(?:\\.\\d{3})+|\\d+)(?:,(\\d{1,2}))?");

    private static final Pattern COBRO = Pattern.compile(
        "recibiste|te envi(ó|o|aron)|te transfiri|te pag(ó|o|aron)|te deposit|ingres(o|ó|aron) (dinero|plata|\\$)|acreditamos|se acredit|cobraste|te devolvi|devoluci[oó]n de",
        Pattern.CASE_INSENSITIVE);
    // Lo que todavía no pasó (o no pasó): rechazado, pendiente, programado, pedidos de plata.
    private static final Pattern NO_PASO = Pattern.compile(
        "rechaz|no pudimos|no pudo|no se pudo|cancel|anul|revert|pendiente|en proceso|procesando|programad|se debitar|vamos a debitar|debitaremos|te pidi|pedido de (dinero|plata)|solicitud|vencer|por vencer",
        Pattern.CASE_INSENSITIVE);
    // Pagar el resumen de la tarjeta: sale plata de la cuenta, pero no es un gasto nuevo.
    private static final Pattern TARJETA = Pattern.compile(
        "(pagaste|pago de|pago del|tu pago (de|del)|se acredit[oó] (tu|el) pago (de|del))\\s+(tu |la |el )?(tarjeta|resumen)|pago de tarjeta|pago del resumen"
            + "|(pagaste|abonaste)\\s+(US\\$|U\\$S|USD|\\$)\\s?[\\d.,]+\\s+(de|a|en|para)\\s+(tu |la |el )?(tarjeta|resumen)",
        Pattern.CASE_INSENSITIVE);
    // Avisos informativos con monto que no son un movimiento.
    private static final Pattern INFO = Pattern.compile(
        "resumen|del mes|total a pagar|saldo (disponible|actual)|tu saldo|consumos? del", Pattern.CASE_INSENSITIVE);
    // «Tu pago … se acreditó» es un pago, no un cobro.
    private static final Pattern TU_PAGO = Pattern.compile("\\b(tu pago|el pago de|tu compra)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRANSF = Pattern.compile(
        "transferiste|enviaste|transferencia (enviada|realizada|exitosa)|env[ií]o de dinero",
        Pattern.CASE_INSENSITIVE);
    private static final Pattern PAGO = Pattern.compile(
        "pagaste|compraste|tu compra|compra (aprobada|realizada|con)|realizaste una compra|pago (aprobado|realizado|exitoso|con)|debitamos|se debit[oó]|d[eé]bito (de|por|en)|abonaste|tu pago",
        Pattern.CASE_INSENSITIVE);
    // Cargar saldo, pasar entre tus cuentas o ahorrar no es gasto.
    private static final Pattern PROPIO = Pattern.compile(
        "cargaste|ingresaste dinero|entre tus cuentas|reserva|ahorr|retiraste", Pattern.CASE_INSENSITIVE);

    private static final Pattern COMERCIO_DESPUES = Pattern.compile(
        "(?:US\\$|U\\$S|USD|\\$)\\s?[\\d.]+(?:,\\d{1,2})?\\s+(?:a|en|de|para|con)\\s+([^.!\\n$]{2,60})", Pattern.CASE_INSENSITIVE);
    private static final Pattern COMERCIO_ANTES = Pattern.compile(
        "\\b(?:en|a|de)\\s+([^.!\\n$]{2,50}?)\\s+(?:por|de)\\s+(?:US\\$|U\\$S|USD|\\$)", Pattern.CASE_INSENSITIVE);
    private static final Pattern COMERCIO_TU = Pattern.compile(
        "\\b(?:tu pago|tu compra|pagaste|compraste)\\s+(?:a|en)\\s+([^.!\\n$]{2,60})", Pattern.CASE_INSENSITIVE);
    // Si dice «pagaste» o «transferiste», manda eso aunque después diga «se acreditó».
    private static final Pattern PAGO_FUERTE = Pattern.compile("pagaste|compraste|abonaste|realizaste una compra", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRANSF_FUERTE = Pattern.compile("transferiste|enviaste", Pattern.CASE_INSENSITIVE);
    private static final Pattern COLA = Pattern.compile(
        "\\s+(con tu|con la|con el|desde tu|desde la|fue aprobad|fue realizad|se acredit|el d[ií]a|hoy|ayer|a las|por\\s|\\(|ver detalle|tocá|toca).*$",
        Pattern.CASE_INSENSITIVE);

    /** app: mercadopago, bna o personalpay. titulo y texto: lo que muestra la notificación. ts: cuándo llegó. */
    public static Aviso leer(String app, String titulo, String texto, long ts) {
        String t = ((titulo == null ? "" : titulo) + ". " + (texto == null ? "" : texto)).replace(' ', ' ').replaceAll("\\s+", " ").trim();
        if (t.length() < 6) return null;
        if (PROMO.matcher(t).find()) return null;
        if (NO_PASO.matcher(t).find()) return null;
        boolean esTarjeta = TARJETA.matcher(t).find();
        // «Saldo disponible», «del mes»… solo descartan si no hay un verbo claro de pago o cobro.
        boolean verbo = PAGO_FUERTE.matcher(t).find() || TRANSF_FUERTE.matcher(t).find() || COBRO.matcher(t).find() || PAGO.matcher(t).find();
        if (!esTarjeta && !verbo && INFO.matcher(t).find()) return null;
        Matcher m = MONTO.matcher(t);
        if (!m.find()) return null;
        String moneda = m.group(1).equals("$") ? "ARS" : "USD";
        double monto;
        try {
            monto = Double.parseDouble(m.group(2).replace(".", "") + (m.group(3) != null ? "." + m.group(3) : ""));
        } catch (NumberFormatException e) { return null; }
        if (!(monto > 0) || monto >= 1e9) return null;

        String sentido;
        if (esTarjeta) sentido = "tarjeta";
        else if (PROPIO.matcher(t).find()) return null;
        else if (PAGO_FUERTE.matcher(t).find()) sentido = "pago";
        else if (TU_PAGO.matcher(t).find() && PAGO.matcher(t).find()) sentido = "pago";
        else if (TRANSF_FUERTE.matcher(t).find()) sentido = "transferencia";
        else if (COBRO.matcher(t).find()) sentido = "cobro";
        else if (TRANSF.matcher(t).find()) sentido = "transferencia";
        else if (PAGO.matcher(t).find()) sentido = "pago";
        else return null; // sin un verbo claro, mejor no adivinar

        String comercio = "";
        Matcher c = COMERCIO_DESPUES.matcher(t);
        Matcher c2 = COMERCIO_ANTES.matcher(t);
        Matcher c3 = COMERCIO_TU.matcher(t);
        if (c.find()) comercio = c.group(1);
        else if (c2.find()) comercio = c2.group(1);
        else if (c3.find()) comercio = c3.group(1);
        comercio = comercio.replaceFirst("(?i)^(tu|la|una) cuenta( de [^ ]+ ?(pago|pay|nación|nacion)?)?\\s+de\\s+", "");
        comercio = limpiar(COLA.matcher(comercio).replaceAll(""));
        if (comercio.matches("(?i)(tu|la|el|una|un|tus)( .*)?|cuenta|tarjeta|mercado pago|dinero")) comercio = "";
        if (esTarjeta) comercio = "Pago de tarjeta";

        long minuto = ts / 60000;
        String id = huella(app + "|" + sentido + "|" + monto + "|" + comercio.toLowerCase(Locale.ROOT) + "|" + minuto);
        return new Aviso(id, app, monto, moneda, comercio, sentido, ts);
    }

    static String limpiar(String s) {
        String x = s == null ? "" : s.replaceAll("[\\p{Cntrl}<>\"]", " ").replaceAll("\\s+", " ").trim();
        x = x.replaceAll("[,;:\\-–]+$", "").trim();
        if (x.length() > 60) x = x.substring(0, 60).trim();
        // TODO EN MAYÚSCULAS → Como Nombre Propio, más lindo en Orbe.
        if (x.length() > 3 && x.equals(x.toUpperCase(Locale.ROOT)) && x.matches(".*[A-ZÁÉÍÓÚÑ].*")) {
            StringBuilder b = new StringBuilder();
            for (String w : x.toLowerCase(new Locale("es", "AR")).split(" ")) {
                if (w.isEmpty()) continue;
                if (b.length() > 0) b.append(' ');
                b.append(w.length() <= 2 && b.length() > 0 ? w : Character.toUpperCase(w.charAt(0)) + w.substring(1));
            }
            x = b.toString();
        }
        return x;
    }

    static String huella(String s) {
        try {
            MessageDigest d = MessageDigest.getInstance("SHA-256");
            byte[] h = d.digest(Normalizer.normalize(s, Normalizer.Form.NFC).getBytes("UTF-8"));
            StringBuilder b = new StringBuilder();
            for (int i = 0; i < 10; i++) b.append(String.format("%02x", h[i]));
            return b.toString();
        } catch (Exception e) {
            return Long.toHexString(s.hashCode() & 0xffffffffL);
        }
    }
}
