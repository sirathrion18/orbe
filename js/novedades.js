// Historial de versiones que se muestra dentro de Orbe (el mismo de CHANGELOG.md).
export const NOVEDADES = [
  {
    version: "0.27.0",
    fecha: "28/10/2026",
    titulo: "BNA › Hoy (la libretita) y otros equipos.",
    cambios: [
      "BNA › Hoy, la libretita del día (primera pestaña de BNA): arranca precargada con tu mínimo, con los mismos nombres de tu archivo de informes (Descarga casuística APC / Tel / RRSS, Armado de casuística, Diario CAT, Diario Evoltis y Diario NS).",
      "Orbe deduce si tu compañero está a la mañana (por los mismos días de antes) y arma la lista: si está, CAT y Evoltis van como control; si no, todo como carga. Lo cambiás con un toque.",
      "Se tacha como con birome. Cada informe tachado suma una carga o un control a Productividad, así no cargás en dos lados. Lo que no da puntos también se tacha. «Otros informes» se suma las veces que haga falta.",
      "Nota del día para hitos e histórico de tus días (lo que tachaste, lo que quedó y la nota). Si sumás algo a mano dos veces el mismo día de la semana, Orbe empieza a precargarlo.",
      "Inicio, los días de BNA: una franja con lo que te falta tachar (se puede ocultar en Ajustes › Diseño).",
      "River › Otros equipos (escondido, al costado de las pestañas): Ferro, Morón, Racing e Independiente con su posición, cómo vienen (últimos 5) y qué juegan. Primera y Primera Nacional, datos públicos de ESPN. Sumás o sacás equipos por nombre.",
    ],
  },
  {
    version: "0.26.0",
    fecha: "28/10/2026",
    titulo: "River completo, calendario «River», Agenda del mes y suscripciones a ECONOMÍA.",
    cambios: [
      "River con pestañas: Partidos (el próximo con su cuenta regresiva, lo que sigue con día, fecha, hora y estadio, y los últimos resultados), Tabla (la tabla completa de ESPN, con River marcado en rojo) y Promiedos.",
      "Calendario «River» en tu Google Calendar: Orbe lo crea una vez y le carga los próximos partidos. Si cambia una fecha o una hora, lo actualiza solo, y ningún partido se repite. Pide un permiso nuevo (Ajustes › Dar permiso).",
      "Agenda › Mes: la grilla del mes con tu Google Calendar, los partidos de River, vencimientos y TPs, el cobro, las renovaciones y los cumpleaños, cada cosa con su color. Tocás un día y ves el detalle; con ‹ › cambiás de mes.",
      "Suscripciones → ECONOMÍA: el día que renueva una suscripción en dólares, Orbe la pasa a pesos con el dólar tarjeta de ese día. La primera vez te pide el OK y después escribe solo el total del mes en la fila «Suscripciones» de Egresos, adentro del rango que suma el TOTAL. Es lo único que Orbe escribe en ECONOMÍA.",
    ],
  },
  {
    version: "0.25.0",
    fecha: "28/10/2026",
    titulo: "Guiños, día de River en toda la app, Promiedos y suscripciones.",
    cambios: [
      "Guiños: con el switch de Ajustes › Diseño prendido, una o dos veces por día, en un momento al azar, Inicio se viste por 15 minutos de Arácnido (telarañas, una arañita que baja colgada y se va si la tocás, y un hilo de telaraña manteniendo apretado el +), Laboratorio (el reloj como pantalla que escanea tu día), Decreto (Urgente como decreto real, con sello verde) o TVA (la línea temporal sagrada, con una rama por cada cosa urgente). Apagado: Orbe sobria y seria, sin guiños ni días Marvel.",
      "En Ajustes › Diseño se puede probar cada guiño, y ahí se mudó «Probar modos del día».",
      "Día de River: si River juega hoy, toda la app se pone en modo River desde la mañana hasta un rato después del partido, con la banda roja cruzando también las demás pantallas.",
      "River › Promiedos: un botón para seguir el partido y accesos a River (fixture y plantel) y a los partidos del día. Promiedos no tiene API pública, así que Orbe te lleva directo a sus páginas.",
      "Finanzas › Suscripciones: cargás lo que se renueva solo cada mes (en dólares o en pesos), con el equivalente en pesos al dólar tarjeta del día. Unos días antes de renovar aparece en Urgente con lo que pasa si no lo revisás.",
    ],
  },
  {
    version: "0.24.0",
    fecha: "28/10/2026",
    titulo: "Checklists, barra de universos abajo y Ajustes › Diseño.",
    cambios: [
      "Checklists: el + ahora tiene dos pestañas, Idea y Checklist. Ponés un nombre y escribís un ítem por renglón (también podés pegar una lista o dictar ítem por ítem). Si elegís un universo, la barrita de progreso toma su color.",
      "Cada checklist abierto aparece en Inicio, debajo de Urgente: se tilda ahí mismo y lo tildado se va. Cuando tildás todo, sale de Inicio y queda en «Completos».",
      "Página Checklists: ves todos los ítems, sumás o sacás ítems, y con «Usar de nuevo» un checklist completo vuelve a Inicio destildado (ideal para el súper o la valija). Para borrar, dos toques. Se sincroniza entre el celu y la compu.",
      "La barra de universos ahora está abajo y fija, al alcance del pulgar: Inicio y los seis universos, igual en todas las pantallas y en la compu. Manteniendo apretado un ícono aparece su nombre.",
      "Ajustes › Diseño, arriba de todo: el modo de Inicio (reloj grande o compacto), nombres en la barra de abajo, qué tarjetas se ven en Inicio (Urgente siempre está), tema y tipografías.",
    ],
  },
  {
    version: "0.23.1",
    fecha: "28/10/2026",
    titulo: "Arreglos de Inicio en el celu.",
    cambios: [
      "Arriba ya no se rompe en el celu: el día va abreviado («Mié 28 oct · 12:33:02») y los íconos son un poco más chicos.",
      "Urgente en Inicio es una franja fina a lo ancho: lo primero que vence, cuándo, el tilde y cuántas cosas más hay.",
      "El reloj es un poco más chico en el celu.",
      "Modo compacto: el saludo ya no se corta; se achica para entrar al lado del reloj.",
    ],
  },
  {
    version: "0.23.0",
    fecha: "28/10/2026",
    titulo: "Inicio nuevo y página de Urgente.",
    cambios: [
      "Inicio nuevo, con todo más a mano. Debajo del reloj van los universos como íconos redondos (manteniendo apretado aparece el nombre). Después vienen Urgente a lo ancho, el clima y River en cuadraditos, el diario a lo ancho, El Semanal y, al final, Transporte.",
      "Arriba, la fecha y la hora con segundos («Viernes 30 oct · 14:00:23»), con los segundos en gris.",
      "El buscador ahora es una lupa arriba: se abre con un toque y se cierra con Esc.",
      "El clima tiene marco y un dibujo de línea que cambia con el día: sol, parcialmente nublado, nublado, lluvia, tormenta, noche y niebla.",
      "Reloj: los puntos de las 0, 6, 12 y 18 son más grandes, para que se lean al lado de las rayitas.",
      "Página de Urgente: junta lo urgente de todos los universos (vencido, hoy y mañana, esta semana) y se tilda ahí mismo, con «deshacer». Cada cosa dice de dónde sale y, solo si la fuente lo dice, qué pasa si no se hace.",
      "Las preguntas de plata («¿Y esto?») pasan a Finanzas; en Inicio queda una línea que te lleva a contestarlas.",
      "Modo compacto opcional en Ajustes › Inicio: el reloj chico al lado del saludo y los universos con su nombre.",
      "El botón «+» para anotar ideas es más chico."
    ]
  },
  {
    version: "0.22.0",
    fecha: "28/10/2026",
    titulo: "El Semanal, primer proyecto.",
    cambios: [
      "El Semanal entra a Proyectos, primero de la lista: fue tu primer proyecto. En vez de commits muestra la última edición, y «Leer» la abre.",
      "Proyectos cuenta los cambios de la semana de cada repo, además del último. La revista los usa para el seguimiento de proyectos.",
      "El Semanal cambia la forma de titular: más chispa en la tapa y en las notas, siempre con datos verdaderos."
    ]
  },
  {
    version: "0.21.0",
    fecha: "28/10/2026",
    titulo: "El Semanal lee de Orbe.",
    cambios: [
      "El Semanal ahora sale de los datos de Orbe: Orbe deja lo que ya calculó (plata, agenda, productividad, facu, River, Amorcitos, bienestar y proyectos) en una planilla chiquita de tu Drive, «Orbe · resumen para El Semanal», y la revista del domingo la lee en vez de rearmar todo de cero.",
      "Orbe la actualiza sola cuando lo abrís (como mucho cada 2 horas). Si el domingo está vieja, la revista usa lo que hay, completa lo que falta con tus mails y te dice al pie qué salió de dónde.",
      "Los pendientes con fecha que El Semanal encuentra en tus mails (facturas, expensas, trámites) aparecen en el Urgente de Inicio hasta que vencen o los tildás.",
      "La revista usa los mismos colores que Orbe y su contexto (horarios, proyectos, Amorcitos) sale de Orbe, así no se desactualiza.",
      "Secciones nuevas en la revista: BNA (tu productividad y tus horas), Bienestar, Amorcitos y Proyectos con estética TVA. «Tu plata» muestra el diario de Orbe al lado del disponible del recibo."
    ]
  },
  {
    version: "0.20.0",
    fecha: "28/10/2026",
    titulo: "El Semanal dentro de Orbe.",
    cambios: [
      "El Semanal en Inicio, entre el buscador y los universos: la tapa de la última edición con su titular, el dibujo de la semana que cerró y cuándo sale la próxima. Dice «Nueva» hasta que la abrís.",
      "Al tocarla, la edición se abre adentro de Orbe con su diseño completo; «Drive» lleva al Google Doc.",
      "Se lee sin señal: Orbe guarda la última edición en el celu cada vez que la encuentra.",
      "Se abre con tu huella (o tu PIN), como Finanzas y BNA, porque trae tu plata, tu sueldo y tus turnos.",
      "El Diario entra por el mismo botón: si hay uno más nuevo que El Semanal, el botón muestra ese.",
      "Si Orbe no puede leer tu Drive, el botón lo dice en vez de mostrar datos viejos o inventados."
    ]
  },
  {
    version: "0.19.0",
    fecha: "28/10/2026",
    titulo: "Análisis económico con tu historial.",
    cambios: [
      "Finanzas › Análisis: todo tu historial de extractos de cuenta y resúmenes de tarjeta, leído desde tus carpetas de Drive (EXTRACTOS HISTÓRICO y RESUMENES TC) con un botón.",
      "Cuatro gráficos: el sueldo contra el descuento complementario, en qué se va la plata mes a mes, el saldo de la caja de ahorro y las promos y reintegros.",
      "Cada extracto se controla solo: Orbe revisa que los saldos cierren renglón a renglón y te avisa si alguno no da.",
      "Las transferencias grandes te las pregunta con botones (alquiler y servicios, a mis cuentas, ahorro, otro gasto), y lo que contestás queda guardado en la hoja HISTORICO.",
      "Las semillas de cobros, ajustes y escalafón ahora viven en «Orbe · semillas 2», en tu Drive; las fechas se leen como texto para que no se dupliquen filas."
    ]
  },
  {
    version: "0.18.0",
    fecha: "28/10/2026",
    titulo: "Escalafón en BNA.",
    cambios: [
      "BNA › Horarios y sueldo › Escalafón: tu cargo (Auxiliar C) con sueldo, ROE, devolución de aportes, total y Día del Bancario; cuánto sería como Auxiliar B.",
      "Cargás el conformado nuevo cuando sale un acuerdo y toda la grilla se recalcula: cada cargo sube en la misma proporción, igual que las grillas que circulan.",
      "Grilla contra recibo: cuánto te llega neto de lo que dice la grilla, y una estimación del próximo recibo.",
      "Evolución de tu cargo con el aumento de cada acuerdo y el acumulado.",
      "El presupuesto diario usa esa estimación como ingreso propuesto cuando todavía no llegó el recibo."
    ]
  },
  {
    version: "0.17.0",
    fecha: "28/10/2026",
    titulo: "Presupuesto diario.",
    cambios: [
      "Presupuesto diario, de cobro a cobro: Inicio te dice cuánto podés gastar hoy. Sale de tu planilla ECONOMÍA (Ingresos − TOTAL de la columna del mes que vivís con ese sueldo), repartido en los días que faltan hasta el próximo cobro.",
      "Lo que no gastás un día se reparte en los que quedan; si te pasás, la tira de Inicio te dice cuánto y cómo quedan los próximos días.",
      "Botón «+ Gasto» en Inicio (y el buscador: «gasto 3500 súper»). Si después llega el mail del mismo gasto, se unen y cuenta una vez.",
      "Lo que no coincide te lo pregunta Inicio con botones: gastos de mail desde $5.000 que no cargaste (mío, de los dos, fijo de la planilla, no es gasto) y plata que te entra (Agus, otro ingreso, pase entre tus cuentas).",
      "Finanzas › Este período: de dónde sale el diario, los últimos días y el colchón de imprevistos (lo que te pasa Agus por la división, con el lavarropas descontado cuota a cuota).",
      "No cuentan los fijos de tu planilla, los pasajes ni los pases entre tus cuentas; de lo compartido, tu mitad. Las compras con tarjeta cuentan el día que comprás y después se descuentan del resumen."
    ]
  },
  {
    version: "0.16.0",
    fecha: "28/10/2026",
    titulo: "Lunes, River, Amorcitos, reloj y productividad verificada.",
    cambios: [
      "Lunes arreglado: si dos eventos del BNA se pisan, queda el más nuevo y BNA te avisa qué descartó. El horario fijo del lunes pasó a 8:00–15:30.",
      "River: la cuenta regresiva va apilada adentro de la banda (días, horas, minutos; en la página de River, también segundos). «Liga Profesional» en criollo, estadio con nombre corto y River siempre en negrita, en todo Orbe.",
      "El universo Agus ahora se llama Amorcitos.",
      "El reloj de Inicio tiene rayitas a las 3, 9, 15 y 21, y rayitas finas en el resto de las horas.",
      "Productividad: botón «Comparar con la planilla del banco». Lee tu Excel de la carpeta PRODUCTIVIDAD (solo tu fila), deja con ✓ los días que coinciden, ajusta los que no y suma los que faltaban."
    ]
  },
  {
    version: "0.15.1",
    fecha: "28/10/2026",
    titulo: "Arreglo de las semillas y del aviso de Drive.",
    cambios: [
      "Orbe ahora lee tus semillas (pesos, octubre y lo de Agus) aunque el servicio de Drive esté apagado: alcanza con abrir una vez el link de las semillas.",
      "El error «api-apagada:calendar» en realidad era Drive: ahora dice qué servicio falta y Ajustes trae el botón para prenderlo."
    ]
  },
  {
    version: "0.15.0",
    fecha: "28/10/2026",
    titulo: "Productividad en el BNA.",
    cambios: [
      "BNA tiene dos pestañas: Productividad y Horarios y sueldo.",
      "Productividad: contadores + y − por tarea, total en vivo y barra hacia la meta del día. «Te faltan» te dice los puntos y cuántos MS o cambios de cartera son, con los minutos.",
      "Minutos: lo que llevás contra los minutos efectivos de la jornada, y si con lo que falta la meta entra en el día.",
      "Día tipo: seis presets que cargan cargas y controles de un toque.",
      "Historial por mes: total de cada día con su banda (Óptimo, Esperado, Bajo), promedio, días en meta y gráfico con la línea de meta. Tocando un día lo corregís.",
      "Pesos y metas editables. Viven en tu planilla (PESOS_PRODUCTIVIDAD y PRODUCTIVIDAD), no en el código; tu octubre llegó desde «Orbe · semillas».",
      "Finanzas y BNA quedan abiertos 15 minutos después de salir de Orbe; pasado ese tiempo, piden la huella.",
      "El LEEME de tu planilla explica todas las hojas nuevas."
    ]
  },
  {
    version: "0.14.0",
    fecha: "27/10/2026",
    titulo: "River en Inicio y el aviso para fichar.",
    cambios: [
      "River tiene su tarjeta en Inicio, debajo de la de plata: blanca con la banda roja cruzada, el próximo partido y la cuenta regresiva en días. Si es el superclásico, se destaca.",
      "Tocando la tarjeta entrás a River: lo que sigue, últimos resultados, la tabla y accesos. Suma Liga, Copa Argentina y copas de CONMEBOL (ESPN).",
      "BNA: media hora antes de entrar, Inicio te recuerda fichar en Teams. «Listo» y desaparece hasta mañana.",
      "Transporte listo para el estado en vivo del subte (E, H y A): apenas cargues las credenciales de la Ciudad, se prende solo. Si la E tiene problemas un día de BNA, aparece arriba con la alternativa en colectivo."
    ]
  },
  {
    version: "0.13.0",
    fecha: "27/10/2026",
    titulo: "BNA, Agus, Bienestar y Proyectos con datos reales.",
    cambios: [
      "BNA: esta semana y la que viene, horas trabajadas de la semana y del mes (del calendario, con tu horario fijo para los días sin evento) y el disponible de tus últimos recibos. Productividad ya tiene su lugar, detrás de la huella.",
      "Agus: cuenta regresiva al viaje con los vuelos, aniversario y cumple (y aviso en Inicio 3 días antes), planes y salidas, pelis y series para ver con tildes, y los docs de los dos.",
      "Bienestar: la meta de la semana (1 gym + 1 fútbol) sale sola de tu calendario, con el resumen del mes. Registro de partidos con resultado, goles y cómo jugaste.",
      "Proyectos: el último cambio de cada repo en GitHub y los próximos pasos, editables desde Orbe. NTN y SUR salieron de la lista.",
      "Agenda: nuevo evento directo a tu Google Calendar.",
      "Todo esto vive en tu planilla (hojas AGUS, FUTBOL y PROYECTOS). Las fechas y vuelos de arranque salen de «Orbe · semillas», en tu Drive, no del código."
    ]
  },
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
