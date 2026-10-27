# Orbe

Sistema operativo personal: un solo lugar para el día, los universos (Agus, BNA, UFASTA, Bienestar, Finanzas, Proyectos) y las ideas.

**Abrir:** https://sirathrion18.github.io/orbe/

## Cómo está armado

- `index.html`, `css/`, `js/`: la app, sin herramientas de compilación. Se publica tal cual con GitHub Pages.
- `js/config.js`: qué universos hay y qué trae cada uno (diseño, no datos).
- `js/saludos.js`: los saludos. Se editan a mano.
- `datos/ejemplo.json`: **datos de ejemplo, públicos y ficticios**. Los datos reales nunca se suben a este repositorio: van a vivir en el Google Drive de cada usuario.
- `js/fuente.js`: la única puerta por donde entran los datos. Cambiar de ejemplo a Drive se hace acá.
- `CHANGELOG.md`: qué cambió en cada versión.

## Privacidad

Este repositorio es público. No contiene información personal, financiera ni de salud. Lo que se carga en la app queda en el dispositivo (y en una versión futura, en el Drive del usuario).

© 2026 Ignacio Dubois. Todos los derechos reservados.
