# Novedades de Orbe

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
