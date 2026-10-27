// Historial de versiones que se muestra dentro de Orbe (el mismo de CHANGELOG.md).
export const NOVEDADES = [
  {
    version: "0.12.0",
    fecha: "27/10/2026",
    titulo: "UFASTA al día (adiós, Facu al día).",
    cambios: [
      "UFASTA renovado: una tarjeta por materia con la próxima entrega, el avance de TPs con tildes, la última novedad del campus, notas con promedio y links.",
      "Novedades del campus: Orbe lee el asunto de los mails del aula virtual. Si dice que entregaste, tilda el TP solo; si es un recordatorio, lo agrega.",
      "TPs nuevos y notas desde Orbe; todo queda en tu planilla (hojas MATERIAS y TPS) y se ve igual en el celu y en la compu.",
      "Rato para estudiar: si hoy tenés un hueco libre y una entrega en los próximos 7 días, Inicio te lo sugiere, con botón para agendarlo si querés.",
      "Las entregas avisan 3 días antes en Inicio y el día en rojo."
    ]
  },
  {
    version: "0.11.0",
    fecha: "27/10/2026",
    titulo: "Finanzas que se cargan solas.",
    cambios: [
      "Recibos de sueldo: Orbe lee los PDF de tu carpeta BNA en Drive, saca el neto y el talón complementario y anota el disponible real del mes siguiente en tu planilla, solo.",
      "Pagar las tarjetas: 3 días antes del vencimiento aparece en lo urgente con el total para no financiar y el mínimo al lado.",
      "Aviso suave al abrir Finanzas cuando un rubro pasa su tope.",
      "Topes sugeridos según tu historial (20% menos que tu promedio), con un toque para usarlos. Aparecen cuando haya un mes completo de datos.",
      "Permisos nuevos para dar una vez: leer tus recibos en Drive y crear eventos en tu calendario.",
      "El signo $ ya no queda separado del número al cortar renglón."
    ]
  },
  {
    version: "0.10.0",
    fecha: "27/10/2026",
    titulo: "River, dólar, preguntas y huella en el BNA.",
    cambios: [
      "La barra de abajo con nombres completos (Bienestar, Proyectos) y los universos de Inicio con íconos de línea.",
      "Finanzas y BNA con huella; Bienestar queda libre. Se vuelven a bloquear apenas salís de Orbe.",
      "River: el próximo partido aparece en Inicio la semana del partido, con cuenta regresiva y el último resultado.",
      "Dólar oficial, MEP y blue en Finanzas; en Inicio solo si el MEP se movió 2% o más desde ayer.",
      "El buscador responde preguntas: «cuánto gasté en rappi», «cuánto gasté en uber en septiembre», «cuánto me queda», «cuándo vence edesur», «dólar hoy», «cuándo juega river».",
      "Ideas con dictado por voz y #etiquetas para filtrarlas."
    ]
  },
  {
    version: "0.9.2",
    fecha: "27/10/2026",
    titulo: "Mails sin trabas y saludos con mate.",
    cambios: [
      "Arreglado el error de cuota de Gmail: Orbe lee los mails de a 15 y de a uno, guarda lo avanzado en cada tanda y, si Google pide una pausa, sigue solo la próxima vez desde ahí.",
      "El saludo va una oración por renglón («Buen día.» arriba, «Mate y a la cancha, Nacho.» abajo) y nunca se corta: si un renglón no entra, la letra se achica.",
      "108 saludos nuevos, muchos con mate, y el saludo cambia cada dos horas a lo largo del día."
    ]
  },
  {
    version: "0.9.1",
    fecha: "27/10/2026",
    titulo: "Un botón para actualizar todo.",
    cambios: [
      "Botón ↻ arriba en Inicio (y «Actualizar todo» en Ajustes): trae agenda, sincronización, mails y ECONOMÍA de una.",
      "Además se pone al día solo al abrir, al volver a la app y cada 5 minutos.",
      "Ajustes dice qué anda y qué no, parte por parte (agenda, celu y compu, ECONOMÍA, mails), con el motivo real y el botón para arreglarlo.",
      "La barra de abajo dice «Finanzas» y Finanzas pasa a naranja, para no confundirse con el azul del BNA."
    ]
  },
  {
    version: "0.9.0",
    fecha: "27/10/2026",
    titulo: "Más compacto, y tu planilla ECONOMÍA adentro.",
    cambios: [
      "Inicio más compacto en el celu: tipografías más chicas, el anillo más arriba y todo a la vista sin tanto scroll.",
      "Clima en una tarjeta corta y, debajo, el lugar del transporte (tus líneas E, H y A y los colectivos 42, 26 y 135), los dos a la altura de lo urgente.",
      "Tu planilla ECONOMÍA, en Finanzas: ingresos, egresos y saldo del mes, cuánto te queda por día y por semana, cada gasto comparado con el mes anterior y el saldo de todo el año en un gráfico.",
      "Lo compartido con Agus (hoja DIVISIÓN), tus alias para copiar con un toque y las promos del día salen de tu propia planilla. Orbe la lee y nunca la modifica.",
      "En Inicio, el saldo del mes y cuánto te queda por día salen de tu planilla.",
      "Para apagar la huella (o sacar el PIN) primero hay que poner la huella.",
      "Si falta prender un servicio de Google, Ajustes lo dice y lleva al botón para habilitarlo.",
      "Afuera la tarjeta de pasos de ejemplo: los pasos reales llegan con Satélite (Google cerró la API de Fit)."
    ]
  },
  {
    version: "0.8.1",
    fecha: "27/10/2026",
    titulo: "Huella.",
    cambios: ["Finanzas y Bienestar se abren con tu huella: usa el lector del celu y la huella nunca sale del teléfono. El PIN queda como respaldo para la compu."]
  },
  {
    version: "0.8.0",
    fecha: "27/10/2026",
    titulo: "Finanzas conectada.",
    cambios: [
      "Finanzas conectada: lee los avisos de transferencias, compras de dólares y Debin del BNA, y los pagos, cuotas y resúmenes de Mercado Pago. El texto de los mails no sale del servidor de Orbe.",
      "«Te queda» del mes en Inicio y en Finanzas: el disponible real menos lo que salió de tus cuentas, contando tu mitad en lo que se divide con Agus.",
      "Topes de delivery, Uber y bares con barra; en rojo al pasar el 80%, con aviso en Inicio.",
      "Movimientos del mes con su fuente; los dudosos quedan «a revisar» y se corrigen con un toque. Orbe aprende la regla para la próxima.",
      "Tablero de deuda: tarjetas y préstamos con saldo, tasa, vencimiento y de dónde sale cada número; lo que falta dice «?».",
      "Los avisos repetidos de una misma operación (BNA+ y Red Link, Debin) se cuentan una sola vez. Los dólares van aparte.",
      "Arranca con las compras de tarjeta de los resúmenes de octubre ya cargadas."
    ]
  },
  {
    version: "0.7.0",
    fecha: "27/10/2026",
    titulo: "Celu y compu sincronizados, y tipografías a elección.",
    cambios: [
      "Sincronización entre el celu y la compu: hechos, horario, ideas, súper, menú, tipografías y PIN viajan solos a través de tu planilla «Orbe · datos» en Drive. Lo más nuevo de cada lado gana.",
      "Tipografías a elección en Ajustes, para el reloj del anillo y para el saludo. Por defecto: reloj con la del logo y saludo con la serif de revista.",
      "Arreglado el horario fijo del BNA: los campos de hora ya no se salen de la caja en el celu.",
      "Un solo permiso nuevo de Google (planillas y mails, solo lectura de mails) para sincronizar y para Finanzas. El pase que llega al navegador nunca incluye Gmail."
    ]
  },
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
