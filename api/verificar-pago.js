// api/verificar-pago.js
// Endpoint Vercel Serverless: llamado por el navegador cuando el usuario regresa
// del Checkout de Mercado Pago (?payment_id=...).
// Verifica el pago en tiempo real, obtiene o crea el código LTD-XXXXX asociado,
// registra el primer dispositivo y emite la cookie segura donor_token.

const { createClient } = require('redis');
const {
  generarIdDispositivo,
  crearCookieHeader,
  consultarPagoMercadoPago,
  procesarPagoAprobado
} = require('./_lib/pagos');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { paymentId, email } = req.body || {};
  const idLimpio = String(paymentId || '').trim();

  if (!idLimpio || !/^\d{5,18}$/.test(idLimpio)) {
    return res.status(400).json({
      valido: false,
      error: 'Folio de pago no válido.'
    });
  }

  const secret = process.env.DONOR_COOKIE_SECRET;
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!secret || !redisUrl) {
    return res.status(500).json({
      valido: false,
      error: 'Error de configuración en el servidor.'
    });
  }

  try {
    const infoPago = await consultarPagoMercadoPago(idLimpio);
    if (!infoPago.ok) {
      return res.status(404).json({
        valido: false,
        error: infoPago.error || 'No se pudo verificar el pago en Mercado Pago.'
      });
    }

    if (infoPago.status === 'pending' || infoPago.status === 'in_process') {
      return res.status(200).json({
        valido: false,
        pendiente: true,
        status: infoPago.status,
        mensaje: 'Tu pago está en proceso de acreditación por Mercado Pago. En cuanto se confirme, recibirás tu código por correo o podrás activarlo ingresando tu folio de operación #' + idLimpio + ' en «Activar Acceso».'
      });
    }

    if (!infoPago.esValido) {
      return res.status(400).json({
        valido: false,
        status: infoPago.status,
        error: 'El pago aún no figura como aprobado en Mercado Pago.'
      });
    }

    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 2500,
        reconnectStrategy: () => false
      }
    });
    client.on('error', () => {});

    try {
      await client.connect();
      const idDispositivo = generarIdDispositivo(req);
      const resultado = await procesarPagoAprobado(client, infoPago.pago, {
        emailOverride: email,
        idDispositivo
      });

      const cookieHeader = crearCookieHeader(resultado.codigo, secret);
      res.setHeader('Set-Cookie', [cookieHeader]);

      return res.status(200).json({
        valido: true,
        codigo: resultado.codigo,
        paymentId: idLimpio,
        email: resultado.email,
        emailEnviado: resultado.emailEnviado,
        dispositivos: resultado.dispositivos,
        limite: resultado.limite
      });
    } finally {
      try {
        await client.quit();
      } catch (_) {}
    }
  } catch (error) {
    console.error('[verificar-pago] Error interno:', error);
    return res.status(500).json({
      valido: false,
      error: 'Error interno al verificar el pago. Inténtalo de nuevo.'
    });
  }
};
