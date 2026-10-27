// Estructura de Orbe: qué universos hay y qué trae cada uno.
// Esto es diseño, no datos: no hay nada personal acá.
export const VERSION = "0.2.0";

// ID de cliente de Google (es público por diseño: no es una contraseña).
// Se crea en Google Cloud con el origen https://sirathrion18.github.io
export const GOOGLE_CLIENT_ID = "";

export const UNIVERSOS = [
  { id: "agus", nombre: "Agus", corto: "Agus", color: "#E46A7E",
    bajada: "El universo compartido: compras, comidas y planes de los dos.",
    palabras: "pareja super compras menu comidas planes" },
  { id: "bna", nombre: "BNA", corto: "BNA", color: "tipo:bna",
    bajada: "Tus horarios y tus recibos. Nada del banco como empleador.",
    palabras: "trabajo laburo horario recibo sueldo turnos" },
  { id: "ufasta", nombre: "UFASTA", corto: "Facu", color: "tipo:ufasta",
    bajada: "Entregas, cursada, notas y materiales.",
    palabras: "facu facultad tp entregas campus notas materias" },
  { id: "bienestar", nombre: "Bienestar", corto: "Salud", color: "tipo:gym", bloqueo: true,
    bajada: "Pasos, fútbol, gym, comida y un rato para respirar.",
    palabras: "pasos futbol gym salud meditar meditacion sueño" },
  { id: "finanzas", nombre: "Finanzas", corto: "Plata", color: "#D99A2B", bloqueo: true,
    bajada: "Tu plata al día: disponible, tarjetas, gastos y promos.",
    palabras: "plata gastos tarjetas deuda promos disponible pizarra" },
  { id: "proyectos", nombre: "Proyectos", corto: "Proy.", color: "texto",
    bajada: "El hangar: todo lo que estás creando.",
    palabras: "a64 nexus mateshka linea ntn sur repos" }
];

export const SECCIONES = [
  { ruta: "#/ideas", nombre: "Ideas", palabras: "notas ideas anotar" },
  { ruta: "#/agenda", nombre: "Agenda del día", palabras: "agenda hoy mañana calendario anillo" },
  { ruta: "#/respiro", nombre: "Respiro", palabras: "respirar zona libre calma" },
  { ruta: "#/datos", nombre: "Mis datos", palabras: "datos exportar borrar privacidad" },
  { ruta: "#/ajustes", nombre: "Ajustes", palabras: "ajustes tema oscuro claro pin modos" },
  { ruta: "#/novedades", nombre: "Novedades de la versión", palabras: "version cambios novedades changelog" }
];

// Promociones por día (información pública, verificar topes porque cambian seguido).
export const PROMOS = {
  1: ["BNA+ MODO: ChangoMás 20%", "Buepp: ferias y gastronomía 30%"],
  2: ["BNA+ MODO: Jumbo 20%", "Mercado Pago: ChangoMás 15%", "Personal Pay: YPF 10% con Visa", "Buepp: ferias y gastronomía 30%"],
  3: ["BNA+ MODO: Maxiconsumo 30%", "Mercado Pago: Farmacity 30%", "Personal Pay: Diarco 25%"],
  4: ["Mercado Pago: tarjeta de crédito MP 20%", "Personal Pay: Diarco 25%", "Buepp: ferias y gastronomía 30%"],
  5: ["BNA+ MODO: combustible 20%; La Anónima, Disco y Vea 20%", "Mercado Pago: Coto 25%", "Personal Pay: Diarco 25%", "Buepp: Carrefour Maxi 10%"],
  6: ["Mercado Pago: Coto 20%, Diarco 15%", "Buepp: ferias y gastronomía 30%"],
  0: ["BNA+ MODO: Disco y Vea 20%", "Mercado Pago: Coto 20%, Diarco 15%"]
};
export const PROMOS_SIEMPRE = ["Mercado Pago: Mercado Libre Súper 35%", "Buepp: expensas y ABL 20%"];
