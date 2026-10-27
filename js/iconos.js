// Íconos de línea, sin relleno. Toman el color del texto que los rodea.
const s = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const ICONOS = {
  sol: s('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'style="color:#E0A030"'),
  luna: s('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  nube: s('<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>'),
  parcial: s('<path d="M9 4.5V3M4.5 9H3M5.6 5.6 4.6 4.6M13.4 5.6l1-1"/><path d="M6.3 11.5A3.5 3.5 0 0 1 12.6 8"/><path d="M9 20h8a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 12.5 3.8 3.8 0 0 0 9 20z"/>'),
  lluvia: s('<path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>'),
  tormenta: s('<path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15z"/><path d="M12 15l-2 4h4l-2 4"/>'),
  buscar: s('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  mas: s('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.2"'),
  ojo: s('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  ojoNo: s('<path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  ajustes: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  volver: s('<path d="M15 18l-6-6 6-6"/>'),
  externo: s('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  candado: s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  check: s('<path d="M5 12l5 5 9-10"/>', 'stroke-width="2.4"'),
  cruz: s('<path d="M6 6l12 12M18 6L6 18"/>')
};

export const TELA = `<svg class="tela" viewBox="0 0 190 190" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
<path d="M190 0L0 0M190 0L20 120M190 0L80 190M190 0L190 190M190 0L140 190"/>
<path d="M150 0Q160 22 168 28Q178 35 190 38"/><path d="M105 0Q122 40 138 52Q160 70 190 78"/>
<path d="M58 0Q86 60 108 78Q140 105 190 118"/><path d="M12 0Q50 80 78 104Q118 140 190 158"/></svg>`;

// Logo: la "o" es un anillo con el punto rojo de ahora.
export const MARCA = `<span class="marca" aria-label="Orbe"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="16"/><circle cx="75.5" cy="24.5" r="11" fill="#C8102E" style="stroke:var(--bg)" stroke-width="5"/></svg><span aria-hidden="true">rbe</span></span>`;
