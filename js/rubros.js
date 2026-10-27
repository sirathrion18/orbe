// Rubros de gasto y reglas genéricas por comercio. Sin datos personales: los nombres de personas
// y los casos propios viven en la hoja REGLAS de tu planilla, que manda sobre esto.
// Lo usan el servidor (al leer los mails) y la app (al mostrar y corregir).

export const RUBROS = [
  "Delivery", "Bares y restaurantes", "Uber y Cabify", "Supermercado", "Vivienda", "Servicios",
  "Educación", "Salidas", "Juegos y suscripciones", "River", "Combustible", "Farmacia y salud",
  "Mascotas", "Transporte", "Ropa y compras", "Regalos", "Otros"
];

// Clases: qué es cada movimiento para la cuenta del mes.
//  gasto          sale plata de tu cuenta para consumir (cuenta en el rubro y en lo que te queda)
//  gasto-tarjeta  compra con tarjeta de crédito (cuenta en el rubro al comprar; en lo que te queda, al pagar la tarjeta)
//  tarjeta        pago de un resumen de tarjeta (cuenta en lo que te queda)
//  deuda          cuota de un préstamo (cuenta en lo que te queda)
//  ahorro         plata que separás (Cocos, plazo fijo): cuenta en lo que te queda, aparte
//  propia         pase entre tus cuentas: no cuenta
//  usd            compra o venta de dólares: aparte, en USD
//  ingreso        plata que entra
//  devolucion     te devolvieron un pago: resta del rubro
export const CLASES = ["gasto", "gasto-tarjeta", "tarjeta", "deuda", "ahorro", "propia", "usd", "ingreso", "devolucion"];

const COMERCIOS = [
  [/rappi|pedidos ?ya|glovo|mcdonald|burger king|mostaza|starbucks delivery/i, "Delivery"],
  [/uber|cabify|didi|\bbeat\b/i, "Uber y Cabify"],
  [/coto|carrefour|\bdia\b|chango|jumbo|disco|\bvea\b|la an[oó]nima|maxiconsumo|diarco|vital|supermerc|mercado libre s[uú]per/i, "Supermercado"],
  [/farmacity|farmacia|osde|swiss medical|galeno/i, "Farmacia y salud"],
  [/ypf|shell|axion|puma energy|combustible/i, "Combustible"],
  [/cinemark|hoyts|cine ?fan|cinepolis|teatro|candlelight|ticketek|all ?access|passline/i, "Salidas"],
  [/steam|playstation|xbox|nintendo|netflix|spotify|youtube|google \*|disney|hbo|max\.com|prime video|paramount|meli\+|apple\.com/i, "Juegos y suscripciones"],
  [/river plate|club atletico r\b|\bcarp\b/i, "River"],
  [/fasta|ufasta|universidad/i, "Educación"],
  [/edesur|edenor|metrogas|naturgy|aysa|\babl\b|agip|personal|movistar|claro|telecentro|fibertel|flow/i, "Servicios"],
  [/expensas|consorcio|alquiler/i, "Vivienda"],
  [/veterinari|pet ?shop|puppis/i, "Mascotas"],
  [/sube|subte|emova|trenes argentinos/i, "Transporte"],
  [/bar\b|cervecer|resto|parrilla|caf[eé]|pizzer|sushi|burger|bodeg[oó]n/i, "Bares y restaurantes"]
];

export function rubroDe(texto) {
  const t = String(texto || "");
  const r = COMERCIOS.find(([re]) => re.test(t));
  return r ? r[1] : null;
}
