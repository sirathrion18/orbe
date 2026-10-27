// Historial de versiones que se muestra dentro de Orbe (el mismo de CHANGELOG.md).
export const NOVEDADES = [
  {
    version: "0.6.0",
    fecha: "27/10/2026",
    titulo: "Sesión que no se corta.",
    cambios: [
      "La sesión de Google dura 30 días y se renueva sola cada vez que usás Orbe: se terminó la ventana de una hora.",
      "Si alguna vez se corta, aparece una franja arriba de Inicio con el botón Reconectar.",
      "Servidor chico de Orbe en Cloudflare: guarda la renovación de Google cifrada en una cookie que el navegador no puede leer. Sin base de datos.",
      "Solo tu cuenta de Google puede entrar; cualquier otra queda rechazada.",
      "Lista blanca más estricta: Orbe ya no carga código de terceros."
    ]
  },
  {
    version: "0.5.0",
    fecha: "27/10/2026",
    titulo: "Alarmas.",
    cambios: [
      "De noche y de madrugada, el centro del anillo muestra tu próxima alarma y cuánto dormís si te acostás ya.",
      "Una rayita roja marca en el anillo la hora en que suena.",
      "Si mañana arrancás antes de las 10 y no hay alarma, Orbe te avisa y podés anotarla ahí mismo.",
      "Lee las alarmas que lleguen al calendario «Alarmas» (aunque esté oculto) o eventos titulados «Alarma». Con varias seguidas, muestra siempre la que viene."
    ]
  },
  {
    version: "0.4.0",
    fecha: "27/10/2026",
    titulo: "El día correcto, y lo urgente más claro.",
    cambios: [
      "El día cambia a las 00:00: de madrugada el anillo ya muestra hoy, con un saludo de «todavía despierto».",
      "El anillo pasa a mañana cuando termina tu último evento, nunca antes de las 21. A la noche, el clima es el de mañana.",
      "Nombres cortos en el anillo (BNA, UFASTA, Fútbol) y dos carriles cuando dos eventos se pisan.",
      "Lee también feriados y cumpleaños: el feriado o un evento «Vacaciones» vuelve libre el día; los cumpleaños se avisan el día antes y tienen saludo propio.",
      "Lo urgente muestra el monto aparte, lo vencido arriba en rojo, y se marca como hecho con un toque.",
      "Los vencimientos de Vernet quedan solo en Finanzas, con su etiqueta, y nunca como urgentes.",
      "Recordatorios y avisos salen del anillo y van a la Agenda. Los duplicados se muestran una sola vez.",
      "Horario fijo del BNA en Ajustes, guardado solo en tu celu, para los días que el calendario no lo tenga.",
      "La agenda se actualiza al volver a Orbe, y el pie de Inicio dice de cuándo es, con botón para actualizar.",
      "Arreglada la tipografía en la app instalada."
    ]
  },
  {
    version: "0.3.0",
    fecha: "27/10/2026",
    titulo: "Casa propia: orbe-5es.pages.dev.",
    cambios: [
      "Orbe vive en su propia dirección, separada de a64 y Mateshka: ninguna otra app puede leer lo que guarda en tu celu.",
      "Se instala como app de verdad, sin la barra de Chrome.",
      "Protecciones extra del servidor: no se puede meter Orbe dentro de otra página y bloquea cámara, micrófono y ubicación.",
      "La dirección vieja redirige sola a la nueva."
    ]
  },
  {
    version: "0.2.2",
    fecha: "27/10/2026",
    titulo: "Arreglo de instalación.",
    cambios: ["Orbe tiene identidad propia como app, para que el celu la instale de cero aunque haya quedado una instalación trabada."]
  },
  {
    version: "0.2.1",
    fecha: "27/10/2026",
    titulo: "Más seguridad.",
    cambios: [
      "Lista blanca: Orbe solo puede conectarse con Google, el servicio del clima y las tipografías. Cualquier otra conexión queda bloqueada.",
      "Orbe no le cuenta a otros sitios desde dónde llegaste.",
      "Conexión con Google lista para usar desde Ajustes."
    ]
  },
  {
    version: "0.2.0",
    fecha: "27/10/2026",
    titulo: "Orbe se conecta con Google.",
    cambios: [
      "Iniciar sesión con tu cuenta de Google desde Ajustes.",
      "El anillo de hoy y de mañana sale de tu calendario real, con colores según el tipo de actividad.",
      "Los eventos «Vence:» de tu calendario pasan a lo urgente y a Finanzas; las entregas, a UFASTA.",
      "Con la sesión abierta, la agenda se actualiza sola al abrir Orbe.",
      "Ícono renombrado para que el celu tome el logo nuevo."
    ]
  },
  {
    version: "0.1.1",
    fecha: "27/10/2026",
    titulo: "Logo nuevo: la o que es anillo.",
    cambios: [
      "Ícono de la app con la o como anillo y el punto rojo de ahora.",
      "El nombre con el logo aparece al abrir, al pie de Inicio y en Ajustes."
    ]
  },
  {
    version: "0.1.0",
    fecha: "27/10/2026",
    titulo: "Primera versión para juguetear: el esqueleto completo con datos de ejemplo.",
    cambios: [
      "Inicio con la portada elegida: saludo de revista, anillo de 24 horas con el punto de ahora, clima, urgente, plata y pasos.",
      "Clima real de CABA, con ícono, máxima y mínima.",
      "Cinco modos del día: normal, día libre, River, guiño Marvel y noche. Se pueden probar desde Ajustes.",
      "Tema claro de día y oscuro desde la puesta del sol, con botón para cambiarlo a mano.",
      "Más de 100 saludos que cambian según el día, la hora, el clima y el modo.",
      "Buscador de universos, secciones, accesos, Drive y Gmail, con comandos «gasto» e «idea».",
      "Los seis universos navegables: Agus, BNA, UFASTA, Bienestar, Finanzas y Proyectos.",
      "Ideas rápidas con el botón +, Respiro (zona sin registro) y Mis datos para exportar o borrar.",
      "PIN opcional para Finanzas y Bienestar.",
      "Se instala en el celu y en la compu, y muestra lo último aunque no haya internet."
    ]
  }
];
