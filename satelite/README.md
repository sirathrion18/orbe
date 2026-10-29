# Satélite

La mini app Android de Orbe. Escucha solo los avisos de pago de Mercado Pago, BNA+ y Personal Pay y la próxima alarma,
y los deja cifrados en el buzón de Orbe (Ajustes › Satélite). El APK lo arma GitHub: Releases › `satelite-v1.0.N` › `Satelite.apk`.

- Firma: secreto `SATELITE_CLAVE` del repo; la firma cifrada vive en `firma.enc`.
- Batería: un trabajo cada 30 minutos con internet; sin novedades no usa la red.
- Privacidad: de cada aviso viaja app, monto, moneda, comercio, tipo y hora. Nunca el texto completo.
