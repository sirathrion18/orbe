// Junta los avisos repetidos de una misma operación:
// BNA+ y Red Link avisan los dos la misma transferencia (el de Red Link viene marcado "eco"),
// y un Debin llega como "Recurrente" y "Confirmado" (mismo "grupo").
// Devuelve solo los nuevos que hay que guardar, comparando también contra lo ya guardado.
export function fusionar(existentes, nuevos) {
  const ids = new Set(existentes.map((m) => m.id));
  const grupos = new Set(existentes.map((m) => m.grupo).filter(Boolean));
  const vistos = [...existentes];
  const out = [];
  for (const m of [...nuevos].sort((a, b) => (a.eco ? 1 : 0) - (b.eco ? 1 : 0) || a.ts - b.ts)) {
    if (!m || ids.has(m.id)) continue;
    if (m.grupo) { if (grupos.has(m.grupo)) continue; grupos.add(m.grupo); }
    const gemelo = vistos.find((o) => !!o.eco !== !!m.eco && o.tipo === "transferencia" && m.tipo === "transferencia" &&
      o.clase === m.clase && o.monto === m.monto && Math.abs(o.ts - m.ts) < 15 * 60000);
    if (gemelo) continue;
    ids.add(m.id); vistos.push(m); out.push(m);
  }
  return out.sort((a, b) => a.ts - b.ts);
}
