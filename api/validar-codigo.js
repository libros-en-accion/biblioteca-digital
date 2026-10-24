// api/validar-codigo.js
// Endpoint Vercel Serverless: valida un código de acceso lifetime y registra el dispositivo.
// Usa Vercel KV (Redis) para almacenar los códigos y los dispositivos permitidos.
// Límite: 3 dispositivos por código. Los códigos son permanentes (sin expiración de fecha).

const { createClient } = require('redis');
const {
  generarIdDispositivo,
  firmarCookie,
  crearCookieHeader,
  consultarPagoMercadoPago,
  procesarPagoAprobado
} = require('./_lib/pagos');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { codigo } = req.body || {};
  if (!codigo || typeof codigo !== 'string') {
    return res.status(400).json({ error: 'Se requiere un código de acceso.' });
  }

  const secret = process.env.DONOR_COOKIE_SECRET;
  if (!secret) {
    console.error('[validar-codigo] Error: DONOR_COOKIE_SECRET no configurada en el servidor.');
    return res.status(500).json({ error: 'Error de configuración de seguridad en el servidor.' });
  }

  const codigoNormalizado = codigo.trim().toUpperCase().replace(/^#/, '');
  const kvKey = `donor:code:${codigoNormalizado}`;

  const client = createClient({
    url: process.env.REDIS_URL || process.env.KV_URL,
    socket: {
      connectTimeout: 800,
      reconnectStrategy: () => false
    }
  });
  client.on('error', () => {});

  try {
    await client.connect();

    // Rate limiting: máx 10 intentos por minuto por IP para prevenir ataques de fuerza bruta
    const clientIp = req.headers['cf-connecting-ip'] || 
                     req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     req.socket?.remoteAddress || 
                     'unknown';
    const rateLimitKey = `ratelimit:validar:${clientIp}`;
    const intentos = await client.incr(rateLimitKey);
    if (intentos === 1) {
      await client.expire(rateLimitKey, 60);
    }
    if (intentos > 10) {
      return res.status(429).json({
        valido: false,
        error: 'Demasiados intentos de validación. Por favor espera un minuto antes de reintentar.'
      });
    }

    // 1. Verificar si el código existe en Redis
    let codigoFinal = codigoNormalizado;
    let kvKeyFinal = kvKey;
    let registroRaw = await client.get(kvKeyFinal);
    let recuperadoPorFolio = false;

    // Vía 3 de Respaldo: Si el usuario ingresó su número de operación/folio de Mercado Pago (solo dígitos)
    if (!registroRaw && /^\d{7,18}$/.test(codigoNormalizado)) {
      const paymentKey = `donor:payment:${codigoNormalizado}`;
      const pagoPrevioRaw = await client.get(paymentKey);

      if (pagoPrevioRaw) {
        const pagoPrevio = JSON.parse(pagoPrevioRaw);
        if (pagoPrevio && pagoPrevio.codigo) {
          codigoFinal = pagoPrevio.codigo;
          kvKeyFinal = `donor:code:${codigoFinal}`;
          registroRaw = await client.get(kvKeyFinal);
          recuperadoPorFolio = true;
        }
      } else if (process.env.MP_ACCESS_TOKEN) {
        const infoPago = await consultarPagoMercadoPago(codigoNormalizado);
        if (infoPago.ok && infoPago.esValido) {
          const idDisp = generarIdDispositivo(req);
          const resultado = await procesarPagoAprobado(client, infoPago.pago, { idDispositivo: idDisp });
          const cookieHeaderAuto = crearCookieHeader(resultado.codigo, secret);
          res.setHeader('Set-Cookie', [cookieHeaderAuto]);
          return res.status(200).json({
            valido: true,
            nuevo: true,
            recuperadoPorFolio: true,
            codigo: resultado.codigo,
            dispositivos: resultado.dispositivos,
            limite: resultado.limite
          });
        } else if (infoPago.ok && (infoPago.status === 'pending' || infoPago.status === 'in_process')) {
          return res.status(400).json({
            valido: false,
            error: 'Tu pago en Mercado Pago aún está en proceso de acreditación. Inténtalo de nuevo en unos minutos.'
          });
        }
      }
    }

    const registro = registroRaw ? JSON.parse(registroRaw) : null;

    if (!registro) {
      return res.status(404).json({
        valido: false,
        error: 'Código o folio no reconocido. Verifica que esté bien escrito o adquiere tu Acceso Lifetime por $100 MXN.'
      });
    }

    // 2. Identificar el dispositivo actual
    const idDispositivo = generarIdDispositivo(req);
    const dispositivos = registro.dispositivos || [];
    const limite = registro.limite || 3;

    // Helper para emitir la cookie donor_token segura
    const cookieHeader = crearCookieHeader(codigoFinal, secret);

    // 3. Verificar si el dispositivo ya está registrado (reingreso o recuperación de sesión)
    if (dispositivos.includes(idDispositivo)) {
      // Dispositivo conocido — re-emitir siempre la cookie para restaurar permisos
      res.setHeader('Set-Cookie', [cookieHeader]);
      return res.status(200).json({
        valido: true,
        revalidado: true,
        recuperadoPorFolio,
        codigo: codigoFinal,
        dispositivos: dispositivos.length,
        limite
      });
    }

    // 4. Verificar si hay espacio para un nuevo dispositivo
    if (dispositivos.length >= limite) {
      return res.status(403).json({
        valido: false,
        error: `Este código de acceso ya está activo en el límite de ${limite} dispositivos. Si tienes problemas, contacta a contacto.libractiva@gmail.com.`
      });
    }

    // 5. Registrar el nuevo dispositivo
    const nuevosDispositivos = [...dispositivos, idDispositivo];
    await client.set(kvKeyFinal, JSON.stringify({ ...registro, dispositivos: nuevosDispositivos }));

    // 6. Emitir cookie segura firmada (donor_token) al navegador
    res.setHeader('Set-Cookie', [cookieHeader]);

    return res.status(200).json({
      valido: true,
      nuevo: true,
      recuperadoPorFolio,
      codigo: codigoFinal,
      dispositivos: nuevosDispositivos.length,
      limite
    });

  } catch (error) {
    console.error('[validar-codigo] Error de Redis:', error);
    return res.status(500).json({ error: 'Error interno del servidor. Inténtalo de nuevo.' });
  } finally {
    try {
      await client.quit();
    } catch (_) {}
  }
};
