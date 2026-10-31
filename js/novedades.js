// Historial de versiones que se muestra dentro de Orbe (el mismo de CHANGELOG.md).
export const NOVEDADES = [
  {
    version: "0.46.0",
    fecha: "30/10/2026",
    titulo: "Tu planilla, clara.",
    cambios: [
      "Finanzas › Planilla: tu ECONOMÍA en Orbe, con los mismos renglones y las mismas cuentas (total, saldo, semanal = saldo ÷ 4, diario = saldo ÷ 24), pero más clara: cada grupo con su color y su total destacado.",
      "Al lado de cada número de tu planilla, el real: el neto del recibo, el talón (PP + Gym), tu mitad de la DIVISIÓN y lo que Orbe ve en tus mails. Lo que todavía es estimado va en gris.",
      "Años y meses: 2024, 2025 y 2026, como las hojas de tu Excel. Abajo, el año de un vistazo con el saldo de cada mes.",
      "División con Agus: lo compartido, su mitad, y la pregunta «¿Agus te pasó su mitad?» con Sí / Todavía no / Una parte.",
      "Finanzas va siempre con fondo blanco, para que los números se lean mejor.",
      "Hasta diciembre manda tu planilla: Orbe la lee y no la toca.",
    ],
  },
  {
    version: "0.45.1",
    fecha: "30/10/2026",
    titulo: "Checklists editables.",
    cambios: [
      "Checklists: cada uno tiene un botón «Editar». Podés cambiarle el nombre, corregir el texto de los ítems, ordenarlos con ↑ ↓, sacar o sumar ítems y moverlo a otro universo. Se guarda con «Listo».",
      "Lo que ya tildaste sigue tildado después de editar.",
    ],
  },
  {
    version: "0.45.0",
    fecha: "30/10/2026",
    titulo: "Tu sueldo en dólares.",
    cambios: [
      "BNA › Tu sueldo › «En dólares, desde 2020»: Orbe lee todos tus recibos de BNA › RECIBOS (una carpeta por año) y pasa cada neto a dólares blue del mes en que lo cobraste.",
      "Para cada recibo: cuánto cobraste, cuántos dólares eran y cuánto sería hoy a dólar de hoy. Arriba, tu primer recibo contra el último, con cuánto subió o bajó medido en dólares.",
      "Gráfico de US$ por mes, promedio por año, mejor y peor mes, y la lista mes por mes. Con una tecla, lo ves con el dólar oficial.",
      "Los recibos de 2020 a 2025 (los que dicen «Líquido a cobrar») ahora también se entienden. Los «DB» y los bonos aparte no entran.",
      "La cuenta se hace en tu celu: el servidor solo da el dólar de cada mes (dato público) y nunca ve tu sueldo.",
      "Arreglo: en enero, Orbe va a buscar sola la carpeta del año nuevo de recibos.",
    ],
  },
  {
    version: "0.44.0",
    fecha: "30/10/2026",
    titulo: "Llegaron los tableros.",
    cambios: [
      "BNA › Hoy: los tableros nuevos van fijos en la libretita, todos los días: Tablero CAC, Tablero Reclamos, Tablero Productividad y Tablero RRSS (con los mismos nombres que tu archivo de informes).",
      "Cada informe tiene un desplegable para elegir si hiciste carga o control. Si ya estaba tachado, el punto se pasa solo de uno al otro. Los puntajes de carga y control no cambian.",
      "Si cambiás a mano carga o control, Orbe lo respeta aunque después toques «¿Está tu compañero?».",
      "Si hoy ya tenías la libretita abierta, los tableros se suman abajo de Diario NS, sin tocar lo que ya tachaste.",
    ],
  },
  {
    version: "0.43.3",
    fecha: "30/10/2026",
    titulo: "Menos texto, más «?».",
    cambios: [
      "Cosmos sin cartelitos: al jugar ya no sale texto. Todo lo que hace cada chiche está en el «?», con qué hacés y qué pasa.",
      "◆ Tirar: cuando la piedra choca, se abre la ficha corta del planeta (con su próximo paso).",
      "Lluvia de ideas: tocás un meteorito y se abre una tarjetita con una idea tuya; la tocás y se cierra.",
    ],
  },
  {
    version: "0.43.2",
    fecha: "30/10/2026",
    titulo: "Pantalla completa.",
    cambios: [
      "Proyectos: el cosmos ocupa toda la primera pantalla, con el título encima, y se funde abajo en la lista de proyectos.",
      "Los logos de los planetas ahora se ven siempre, en cualquier celu (antes en algunos quedaban oscuros). Se siguen eligiendo como antes, en la ficha de cada proyecto.",
      "Los botones (Tirar, ?, Sobrio, zoom) bajaron, al pie del cosmos, para que el título quede limpio.",
      "Chau planeta «Archivo de proyectos cerrados y otros»: era un archivo, no un proyecto.",
      "El anillo de Nexus, más finito y suave.",
    ],
  },
  {
    version: "0.43.1",
    fecha: "30/10/2026",
    titulo: "ES.",
    cambios: [
      "El Semanal: el logo resumido ahora es «ES», con la E en rojo y la S en negro (también en las opciones 3 y 6).",
      "Proyectos › «Elegir logos»: un desplegable con las 10 opciones de cada proyecto, todos juntos. Tocás uno y queda.",
    ],
  },
  {
    version: "0.43.0",
    fecha: "30/10/2026",
    titulo: "Para jugar.",
    cambios: [
      "Proyectos se gira para todos lados: con un dedo de costado, como siempre; con dos dedos pellizcás para acercar, los subís o bajás para verlo de canto o desde abajo, y los girás como una perilla. Doble toque en el vacío vuelve a la vista de siempre.",
      "Chiches en el cosmos (tocá «?» para verlos): ◆ Tirar piedras contra un planeta (choca y te muestra su próximo paso), lluvia de ideas con dos dedos para arriba (tocás un meteorito y te tira una idea tuya), hilos de luz entre proyectos (mantené un planeta y soltá sobre otro), eclipses cuando un planeta tapa a Orbe, y un agujero negro si mantenés apretado el vacío.",
      "Logos: 10 opciones por proyecto. Se elige en la ficha de cada proyecto, en «Logo», y cambia en el planeta y en la lista.",
    ],
  },
  {
    version: "0.42.1",
    fecha: "30/10/2026",
    titulo: "La tapa correcta.",
    cambios: [
      "El Semanal: la tapa de Inicio ya no muestra El Diario. Orbe confundía la ficha «El Semanal y El Diario» de la central con una edición del Diario; ahora solo cuenta las ediciones de verdad, y la tapa se corrige sola al abrir Orbe.",
    ],
  },
  {
    version: "0.42.0",
    fecha: "30/10/2026",
    titulo: "Huevitos.",
    cambios: [
      "Huevitos: 201 detalles chiquitos y escondidos de lo que te gusta (una copita, tres estrellitas, un 10 celeste, una palabra en ruso, horas con guiño). Aparecen en su momento y nunca más de dos a la vez.",
      "Algunos se buscan: palabras secretas en el buscador, toques escondidos. Si tocás uno, te dice qué es.",
      "40 saludos nuevos con guiños, escritos con palabras propias, mezclados entre los de siempre.",
      "Ajustes › Diseño › Guiños: pantalla propia con el nivel (Huevitos, Todos o Ninguno), cuántos encontraste y, plegado, para probarlos. Los guiños grandes quedan solo en «Todos».",
    ],
  },
  {
    version: "0.41.0",
    fecha: "30/10/2026",
    titulo: "Más liviano.",
    cambios: [
      "Inicio más liviano: queda lo del momento (el anillo, la plata del día, River, el clima y El Semanal). Todo lo que te pide algo pasó a Avisos.",
      "Avisos, con la campanita de Inicio y su número: lo urgente (se tilda ahí mismo), lo de hoy (alarmas, fichar, Línea E, cumpleaños), las preguntas de plata, los checklists, el transporte cuando hay problemas y lo que te va a llegar al celu.",
      "El Semanal: la tapa abre siempre el último Semanal. Al terminar de leerlo aparece el Archivo con todos los Semanales y Diarios de tu Drive; tocás uno y se abre ahí, con «Ir a la última» arriba.",
      "«Pedir un Diario», al final del Semanal: copia /diario y abre Claude.",
      "Proyectos: pellizcá para alejar o acercar (o la ruedita en la compu) y «Ver todo». El anillo de Orbe brilla menos.",
      "Productividad: busca en toda tu carpeta PRODUCTIVIDAD (sin los «~$» de Excel), dice con qué planilla comparó y hasta qué día llega tu fila, y podés elegirla con «Elegir archivo».",
      "Guiños: pocos por defecto (las fechas y el día de River), elegibles en Ajustes. Venom sin mancha: la frase en plural y un borde de tinta que se va.",
    ],
  },
  {
    version: "0.40.0",
    fecha: "30/10/2026",
    titulo: "El cosmos.",
    cambios: [
      "Proyectos es un cosmos en 3D: Orbe en el centro y cada proyecto como un planeta con su color y su logo (El Semanal incluido). Deslizás para girarlo, tocás un planeta y la cámara vuela hasta él con su ficha corta.",
      "Orbe alimenta los rayos: junta energía y descarga sobre los planetas, con variaciones (rayo, cadena, triple, bola de energía) para que no aburra. Cada tanto pasan piedras de colores, una asoma al fondo con su halo y, muy de vez en cuando, un agujero negro.",
      "Cuando un proyecto avanza (su ficha cambia de versión), una piedra viene a festejarlo la próxima vez que abrís Proyectos.",
      "Modo sobrio: vista desde arriba, sin rayos y girando lento, para mirar todo con calma. Se acuerda de tu elección. Con «reducir movimiento» el cosmos queda quieto.",
      "Ficha de cada proyecto: estado, versión, próximos pasos, ideas, historia y conexiones, leídos de la central de proyectos de Drive. Si arrancás un proyecto nuevo en otro chat, aparece solo.",
      "Ideas: un solo lugar con las que anotás en Orbe y las de la Bandeja de la central, con dónde quedó cada una. Al anotar elegís el proyecto o universo. Cada noche viajan solas a la ficha que corresponde.",
      "Propuestas de Claude: martes y viernes a la noche te llegan de 3 a 5 propuestas (mejoras, áreas para encarar, cosas que no estás viendo). Respondés Dale, Después o No; lo que aceptás pasa a la Bandeja.",
      "Avisos de Orbe en el celu (con Satélite 1.1): resumen de la mañana, plata, facu y BNA, River y guiños, con silencio de 0 a 8 y un máximo por día. Después de cada pago: «Gastaste $X en Y. Hoy te quedan $Z». Se configura en Ajustes › Satélite.",
      "Nada muerto: los números de Inicio, BNA y Finanzas llevan a su detalle. Páginas nuevas: tu sueldo mes a mes, plata a fondo (del ingreso al diario, paso por paso), tu productividad y escalafón y aumentos.",
      "Guiños nuevos: Diego y Messi (30/10, 22/6, 18/12, 24/6), Madrid el 9/12, la previa de River el día de partido, Venom de noche (una gota que habla en plural), y un especial del día que rota sin repetirse en la semana (Arácnido renovado, Millo, Ninja, Cazador, Maldición).",
    ],
  },
  {
    version: "0.35.1",
    fecha: "29/10/2026",
    titulo: "El Rastreador abre en la app de Claude.",
    cambios: [
      "Rastreador: en el celu, el pedido y «Ver expedientes» abren directo en la app de Claude, con tu sesión, en vez del navegador (que pedía iniciar sesión y mandaba a descargar la app).",
      "En la app el pedido llega copiado: lo pegás en el cuadro y tocás «Mandar a rastrear».",
      "Nuevo botón «Hablarlo con Claude»: abre el chat del Rastreador para pedirle que resuelva lo que está en espera.",
    ],
  },
  {
    version: "0.35.0",
    fecha: "29/10/2026",
    titulo: "El Rastreador, a un toque.",
    cambios: [
      "Rastreador: decile a Orbe qué querés comprar (escrito o dictado) y lo manda a la Oficina de Compras de Claude, que compara precios, calidad y dónde conviene, y arma las 5 mejores opciones y una de reserva.",
      "Está en el «+» de Inicio, pestaña Precio, y en su propia página (buscá «precio» o «comprar»). La página guarda tus últimos pedidos y tiene el acceso a los expedientes.",
      "Dictar: Orbe ahora puede usar el micrófono (antes lo tenía bloqueado), así que «Dictar» anda en ideas, checklists y precios. Si el navegador no tiene el permiso, te lo avisa.",
    ],
  },
  {
    version: "0.34.3",
    fecha: "29/10/2026",
    titulo: "Satélite en órbita.",
    cambios: [
      "Ajustes › Satélite: el código de vinculación se esconde solo cuando el celu ya quedó vinculado.",
    ],
  },
  {
    version: "0.34.2",
    fecha: "29/10/2026",
    titulo: "Arreglo al vincular.",
    cambios: [
      "Ajustes › Satélite: al pedir el código después de crear el buzón, ahora aparece el código (antes se quedaba mostrando los pasos de «falta el buzón»).",
    ],
  },
  {
    version: "0.34.1",
    fecha: "29/10/2026",
    titulo: "Satélite, segunda revisión.",
    cambios: [
      "Satélite: segunda revisión. El lector ya no descarta pagos reales que mencionan el saldo, «del mes» o «pedido»; «Pagaste $… de tu tarjeta» va como pago de tarjeta; dos pagos iguales a comercios distintos en 3 minutos cuentan los dos.",
      "Satélite: leer qué app es nunca espera al envío (no se traba la pantalla), si el celu pierde la llave guardada se limpia solo y te pide volver a vincular, y en Xiaomi se reengancha mejor si el sistema suelta el oído. La pantalla muestra el último aviso leído.",
      "Cruces: un café repetido que llega solo por mail ya no se toma como duplicado del de ayer; el mismo cobro avisado por el celu y por mail cuenta una vez (también en «Tu plata real»), y al del celu se le sigue preguntando si es de Agus.",
      "«Tu plata real»: en Hoy, un recordatorio chiquito si hace una semana que no anotás cuánto tenés; y «Cargarlo como gasto» no carga dos veces si tocás dos veces.",
    ],
  },
  {
    version: "0.34.0",
    fecha: "29/10/2026",
    titulo: "Tu plata real y los bonos.",
    cambios: [
      "Finanzas › Cuentas: «Tu plata real». Le decís a Orbe cuánto tenés en BNA, Mercado Pago, Personal Pay, efectivo u otra. La vez siguiente compara con lo que vio entrar y salir y te dice cuánto se le escapó (pagos sin mail, efectivo sin anotar).",
      "Si se le escapó plata, la podés cargar como gasto del período con un toque: pesa en los días que ya pasaron, no en el de hoy. O dejarla así.",
      "Bonos: guardá el recibo de cada bono en una subcarpeta dentro de la del año (por ejemplo BNA/2026/Bonos). Orbe lo lee, lo anota en la hoja BONOS de tu planilla y lo suma al ingreso del período, aparte del sueldo.",
    ],
  },
  {
    version: "0.33.1",
    fecha: "29/10/2026",
    titulo: "Recibos más firmes.",
    cambios: [
      "Recibos: Orbe lee tu recibo de sueldo aunque otra parte (por ejemplo, Gmail pidiendo pausa) haya fallado. Y si el mes de un recibo reciente todavía falta en tu planilla, lo vuelve a intentar solo.",
      "Mes real: si tu planilla dice bastante más que el recibo (un bono con recibo aparte que todavía no subiste), usa tu planilla y te muestra lo que dice el recibo, en vez de desplomar el diario.",
      "Satélite: Orbe retira el buzón del celu aunque otra parte haya fallado.",
    ],
  },
  {
    version: "0.33.0",
    fecha: "29/10/2026",
    titulo: "Satélite y 200 saludos nuevos.",
    cambios: [
      "Satélite: la mini app Android de Orbe. Escucha solo los avisos de Mercado Pago, BNA+ y Personal Pay, y la próxima alarma del celu. De cada aviso manda app, monto, comercio y hora: nunca el texto completo ni otras notificaciones.",
      "Buzón cifrado: el celu deja los avisos cifrados en el servidor de Orbe; Orbe los pasa a tu planilla y los borra. Cada celu tiene su llave y se anula desde Ajustes.",
      "Ajustes › Satélite: vincular el celu con un código de 8 letras (sirve una vez, vence en 10 minutos), ver qué celus están vinculados, cuándo avisaron por última vez y anularlos.",
      "Finanzas: los pagos del celu aparecen como «del celu». Si después llega el mail del mismo pago, no se cuenta dos veces; si lo anotaste a mano, manda lo tuyo.",
      "Inicio: si Satélite ve una alarma antes de entrar al BNA, no te pregunta por las alarmas. Si no ve ninguna, te avisa.",
      "Batería: Satélite no corre todo el tiempo. Se despierta cada 30 minutos (cuando Android lo junta con otras tareas), manda en tanda y se vuelve a dormir. Sin nada nuevo, no usa internet.",
      "200 saludos nuevos (de 229 a 429): mañana, tarde, noche, madrugada, cada día de la semana, finde, lluvia, calor, frío, River y los guiños.",
    ],
  },
  {
    version: "0.32.0",
    fecha: "29/10/2026",
    titulo: "UFASTA desde el campus.",
    cambios: [
      "UFASTA nuevo: lo arma la revisión diaria que hace Claude en el campus (todos los días a las 8:20) y deja en tu carpeta Orbe de Drive. Orbe lee el archivo más nuevo.",
      "Arriba, lo próximo en grande: materia, cuántos días faltan, qué hay que hacer, «Abrir en el campus» y «Ya lo hice».",
      "Después, por urgencia: Ahora (vencido o 3 días o menos), Esta semana, Más adelante y Hecho. Cada cosa con su materia en color, la fecha y el link directo a la actividad.",
      "«Ya lo hice»: se tilda al toque y queda en tu planilla (hoja TILDES_FACU), igual en el celu y en la compu. Si el campus confirma la entrega, pasa a verde «Confirmado por el campus»; si no, queda como «lo marcaste vos».",
      "Marketing · camino al final: el plan por pasos con tildes por tarea y la barra de avance.",
      "Materias: una tarjeta por materia con cuántas cosas pendientes tiene y cómo viene.",
      "Las fechas que salen del cronograma (no de la actividad) dicen «estimada». Si la revisión de hoy no llegó, arriba lo avisa.",
      "Lo que vence en 3 días o menos aparece también en Urgente y en Inicio.",
    ],
  },
  {
    version: "0.31.1",
    fecha: "29/10/2026",
    titulo: "En qué gastaste, hoy y en el mes.",
    cambios: [
      "Finanzas › Hoy: «En qué gastaste hoy», con cada gasto, la hora, el rubro y de dónde salió (de un mail, del resumen o anotado por vos). Con las flechas o tocando una barra del gráfico ves cualquier otro día.",
      "Finanzas › Mes: «En qué vas gastando» desde el cobro, por rubro, con lo de tus mails y lo que anotaste. Abajo, aparte, lo que no cuenta en el diario y por qué.",
      "Cada gasto se toca y se corrige: qué día fue, si cuenta en el diario, qué es, el rubro y si es compartido.",
      "Inicio: debajo del diario, en qué gastaste hoy («Hoy: Rappi $ 3.100…»).",
      "Ya no dice «Hoy te pasaste» si hoy no gastaste nada. Si lo gastado los días anteriores ya usó el margen, dice «No queda diario» y te explica por qué.",
      "Mes real: «TC MP» ahora se reconoce como la tarjeta de Mercado Pago.",
    ],
  },
  {
    version: "0.31.0",
    fecha: "29/10/2026",
    titulo: "Mes real y colchón.",
    cambios: [
      "Mes real (Finanzas › Mes): los mismos renglones de tu ECONOMÍA, pero cada uno con la plata de verdad, de dónde salió y si está pagado, por pagar o estimado. El préstamo sale del talón del recibo; las tarjetas, del pago del resumen; lo compartido, de DIVISIÓN; lo demás, de tus mails o del aviso de vencimiento.",
      "Lo que Orbe no encuentra queda como estimado (el del mes pasado o tu planilla) hasta que lo tocás y le ponés «pagado» con el monto. Nada se inventa.",
      "Colchón en vez de gastos «de más»: un porcentaje del sueldo (5% de entrada, se cambia a 3 o 10%) que se aparta antes de calcular el diario. No se acumula; si un día te pasás, sale de los días que quedan. Solo usás el colchón si tocás «Usar».",
      "Lo compartido con Agus cuenta tu mitad.",
      "El ingreso del mes es el neto del recibo; el préstamo va como egreso.",
      "Lo de la facu ya no aparece en Finanzas: ahí quedan solo «Pagos y vencimientos». Lo urgente de todo vive en Inicio y cada cosa en su universo.",
      "Tu ECONOMÍA sigue igual: Orbe solo escribe la fila Suscripciones.",
    ],
  },
  {
    version: "0.30.0",
    fecha: "29/10/2026",
    titulo: "Finanzas nueva.",
    cambios: [
      "Finanzas nueva, con cuatro pestañas: Hoy, Mes, Análisis y Cuentas. Un número protagonista por tarjeta y lo demás chico, con etiqueta.",
      "Hoy: arriba lo mismo que en Inicio (cuánto podés gastar hoy), el gráfico de tu gasto día por día de los últimos 30 días con la línea del diario (tocás un día y ves en qué se fue) y la tarjeta de Agus.",
      "«Agus ya me pasó»: un toque, con el monto esperado ya cargado y editable. Sirve aunque te lo pase por Mercado Pago; si después llega el mail y le decís «Agus», no se cuenta dos veces.",
      "Mes: cuánto te queda para el día a día, si vas más rápido o más lento que los días, cómo se arma el período, vencimientos, tu ECONOMÍA y los movimientos.",
      "Análisis: en qué rubros se va, qué días gastás más, contra el período pasado a la misma altura y los gastos hormiga (lo chiquito que se repite). Abajo, tu historia con los extractos.",
      "Cuentas: deudas, suscripciones y alias; promos, dólar y topes, plegados.",
      "Aviso en Inicio si vas 3 días seguidos arriba del diario (se desliza para sacarlo).",
    ],
  },
  {
    version: "0.29.1",
    fecha: "28/10/2026",
    titulo: "Recordatorio de alarmas, la hora siempre en el reloj y recibos más rápido.",
    cambios: [
      "Alarmas: ya no muestra horarios ni botón. Es solo un recordatorio la noche antes de un día de BNA (desde las 23:30), con 50 mensajes que van cambiando («¿Pusiste las alarmas?», «Ni Doom se levanta sin alarma…»). Si ya las pusiste, lo deslizás y no vuelve esa noche.",
      "El reloj del anillo siempre muestra la hora de ahora (y se mueve solo). Lo de mañana, la alarma o River van arriba y abajo, en chico («Mañana · BNA 09:45», «faltan 9 h 50»).",
      "Recibos de sueldo: Orbe se fija cada media hora si subiste uno nuevo a tu carpeta BNA de Drive (antes, cada 6 horas). Cuando lo lee, te avisa y Finanzas y BNA › Sueldo lo usan al toque.",
    ],
  },
  {
    version: "0.29.0",
    fecha: "28/10/2026",
    titulo: "Deslizar avisos y alarmas a la hora de dormir.",
    cambios: [
      "Lo circunstancial de Inicio se desliza a la derecha y se va por hoy: el aviso de fichar, la alarma, cumpleaños, el diario pasado, la línea E, fechas de Agus, River, el rato de estudio, el dólar y la tarjeta de Transporte. Si había otro aviso esperando, aparece ese.",
      "Alarmas: aparecen solo cerca de la hora de dormir antes de un día de BNA (desde las 23:30, y hasta la 1:30 si ya pasó la medianoche). Muestra todas las que llegan al calendario «Alarmas» desde el celu, y el botón «Abrir» te lleva a las alarmas del teléfono.",
    ],
  },
  {
    version: "0.28.1",
    fecha: "28/10/2026",
    titulo: "Escuchas y pruebas de llamados con puntos.",
    cambios: [
      "BNA › Hoy: las escuchas son las de Calidad / Mystery (MS). Cada una que sumás con el contador suma sus puntos a Productividad (2,5 c/u según tu planilla).",
      "Los lunes y martes, que entrás a la mañana, se precarga también «Prueba de llamados» con contador, que suma a su tarea de Productividad.",
    ],
  },
  {
    version: "0.28.0",
    fecha: "28/10/2026",
    titulo: "Guiños más seguidos, tablas y copas de River, y ajustes del BNA.",
    cambios: [
      "Guiños, actualización grande: ahora son tres por día (uno a la mañana, uno a la tarde y uno a la noche) y duran 20 minutos desde que los ves. Solo cuentan con Orbe en pantalla, así no se gastan en segundo plano. Tocando tres veces el saludo sale uno al toque. En Ajustes › Diseño te dice cuántos te quedan hoy.",
      "River › Tablas: la zona de River completa (la otra, plegada abajo) y la tabla anual (Apertura + Clausura sumados, como en Promiedos).",
      "River › Copas: la Copa Sudamericana, la Libertadores y la Copa Argentina, con los partidos de River en cada una y la tabla de su grupo. Todos los grupos, plegados abajo. Primero va la copa que juega River.",
      "BNA › Hoy: «Escucha de llamados» entra siempre, con contador (− 3 +), porque siempre son varias.",
      "Inicio: la tarjeta del BNA va debajo de la plata y arriba de El Semanal, y aparece solo en tu horario del banco, un día hábil. El resto del tiempo vive solo en BNA.",
    ],
  },
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
