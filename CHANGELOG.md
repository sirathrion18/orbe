# Novedades de Orbe

## v0.5.0 · 27/10/2026

Alarmas.

- De noche y de madrugada, el centro del anillo muestra tu próxima alarma y cuánto dormís si te acostás ya.
- Una rayita roja marca en el anillo la hora en que suena.
- Si mañana arrancás antes de las 10 y no hay alarma, Orbe te avisa y podés anotarla ahí mismo.
- Lee las alarmas que lleguen al calendario «Alarmas» (aunque esté oculto) o eventos titulados «Alarma». Con varias seguidas, muestra siempre la que viene.

## v0.4.0 · 27/10/2026

El día correcto, y lo urgente más claro.

- El día cambia a las 00:00: de madrugada el anillo ya muestra hoy, con un saludo de «todavía despierto».
- El anillo pasa a mañana cuando termina tu último evento, nunca antes de las 21. A la noche, el clima es el de mañana.
- Nombres cortos en el anillo (BNA, UFASTA, Fútbol) y dos carriles cuando dos eventos se pisan.
- Lee también feriados y cumpleaños: el feriado o un evento «Vacaciones» vuelve libre el día; los cumpleaños se avisan el día antes y tienen saludo propio.
- Lo urgente muestra el monto aparte, lo vencido arriba en rojo, y se marca como hecho con un toque.
- Los vencimientos de Vernet quedan solo en Finanzas, con su etiqueta, y nunca como urgentes.
- Recordatorios y avisos salen del anillo y van a la Agenda. Los duplicados se muestran una sola vez.
- Horario fijo del BNA en Ajustes, guardado solo en tu celu, para los días que el calendario no lo tenga.
- La agenda se actualiza al volver a Orbe, y el pie de Inicio dice de cuándo es, con botón para actualizar.
- Arreglada la tipografía en la app instalada.

## v0.3.0 · 27/10/2026

Casa propia: https://orbe-5es.pages.dev

- Orbe se publica en Cloudflare Pages, con origen propio separado de a64 y Mateshka.
- Se instala como app independiente.
- Encabezados de seguridad (`_headers`): CSP con `frame-ancestors 'none'`, `nosniff`, sin referer, permisos de cámara, micrófono y ubicación bloqueados, HSTS.
- La dirección vieja de GitHub Pages redirige a la nueva.

## v0.2.2 · 27/10/2026

Arreglo de instalación.

- Identidad propia en el manifiesto (`id`), para instalar de cero aunque haya quedado una instalación trabada.

## v0.2.1 · 27/10/2026

Más seguridad.

- Lista blanca (Content Security Policy): solo Google, Open-Meteo y Google Fonts.
- Sin referer hacia otros sitios.
- Conexión con Google lista para usar desde Ajustes.

## v0.2.0 · 27/10/2026

Orbe se conecta con Google.

- Iniciar sesión con tu cuenta de Google desde Ajustes (solo lectura del calendario).
- El anillo de hoy y de mañana sale de tu calendario real, con colores según el tipo de actividad.
- Los eventos «Vence:» pasan a lo urgente y a Finanzas; las entregas, a UFASTA.
- Con la sesión abierta, la agenda se actualiza sola al abrir Orbe.
- Ícono renombrado para que el celu tome el logo nuevo.

## v0.1.1 · 27/10/2026

Logo nuevo: la o que es anillo.

- Ícono de la app con la o como anillo y el punto rojo de ahora.
- El nombre con el logo aparece al abrir, al pie de Inicio y en Ajustes.

## v0.1.0 · 27/10/2026

Primera versión para juguetear: el esqueleto completo con datos de ejemplo.

- Inicio con la portada elegida: saludo de revista, anillo de 24 horas con el punto de ahora, clima, urgente, plata y pasos.
- Clima real de CABA (Open-Meteo), con ícono, máxima y mínima.
- Cinco modos del día: normal, día libre, River, guiño Marvel y noche. Se prueban desde Ajustes.
- Tema claro de día y oscuro desde la puesta del sol en Buenos Aires, con botón para cambiarlo a mano.
- Más de 100 saludos que cambian según el día, la hora, el clima y el modo (`js/saludos.js`).
- Buscador de universos, secciones, accesos, Drive y Gmail, con los comandos «gasto 3500 súper» e «idea …».
- Los seis universos navegables: Agus, BNA, UFASTA, Bienestar, Finanzas y Proyectos.
- Ideas rápidas con el botón +, Respiro (zona sin registro) y Mis datos para exportar o borrar.
- PIN opcional para Finanzas y Bienestar.
- Instalable en celu y compu; sin internet muestra lo último que tenía.

### Pendiente para las próximas versiones
- Iniciar sesión con Google y leer los datos reales desde Drive (agenda, vencimientos, facu, recibos, planilla).
- Tareas programadas de mañana y noche que actualizan esos datos.
- Mini app Android para leer los pasos de Health Connect.
- Cuenta de Agus y universo compartido de verdad.
- Notas de voz y fotos en Ideas.
- Avisos al celu solo para lo urgente.
