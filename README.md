# Orbe

Sistema operativo personal: un solo lugar para el día, los universos (Agus, BNA, UFASTA, Bienestar, Finanzas, Proyectos) y las ideas.

**Abrir:** https://orbe-5es.pages.dev/

## Cómo está armado

- `index.html`, `css/`, `js/`: la app, sin herramientas de compilación. Se publica tal cual con Cloudflare Pages en cada cambio de la rama main.
- `js/config.js`: qué universos hay y qué trae cada uno (diseño, no datos).
- `js/saludos.js`: los saludos. Se editan a mano.
- `datos/ejemplo.json`: **datos de ejemplo, públicos y ficticios**. Los datos reales nunca se suben a este repositorio: van a vivir en el Google Drive de cada usuario.
- `js/fuente.js`: la única puerta por donde entran los datos. Cambiar de ejemplo a Drive se hace acá.
- `functions/api/` y `servidor/sesion.js`: el servidor chico (Cloudflare Pages Functions). Inicia sesión con Google y guarda la renovación cifrada en una cookie `HttpOnly`. El único secreto, `GOOGLE_CLIENT_SECRET`, vive en las variables cifradas de Cloudflare, nunca en este repo.
- `js/sincro.js` y `js/hoja.js`: sincronización entre dispositivos a través de una planilla de Google del usuario (no está en el repo).
- `js/finanzas.js`, `js/rubros.js`, `js/movimientos.js` y `servidor/mails.js`: finanzas. El servidor lee los avisos de pago de Gmail con reglas fijas y devuelve solo movimientos ya entendidos; los nombres y casos propios viven en la planilla del usuario, nunca en este repo.
- `CHANGELOG.md`: qué cambió en cada versión.

## Privacidad

Este repositorio es público. No contiene información personal, financiera ni de salud. Lo que se carga en la app queda en el dispositivo y en la planilla del usuario en su Drive.

© 2026 Ignacio Dubois. Todos los derechos reservados.
