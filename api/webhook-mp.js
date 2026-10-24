// api/webhook-mp.js
// Endpoint Vercel Serverless: recibe notificaciones Webhook / IPN de Mercado Pago,
// verifica el estado del pago en la API oficial de Mercado Pago, genera el código LTD-XXXXX
// de forma idempotente en Redis y lo envía por correo electrónico al comprador.

const { createClient } = require('redis');
const { consultarPagoMercadoPago, procesarPagoAprobado } = require('./_lib/pagos');

function extraerDatosNotificacion(req) {
  const body = req.body || {};
  const query = req.query || {};

  const type = body.type || query.type || query.topic || body.topic || '';
  const action = body.action || query.action || '';
  const paymentId =
    body?.data?.id ||
    query['data.id'] ||
    (type === 'payment' ? body.id || query.id : '') ||
    '';

  return {
    type: String(type).toLowerCase(),
    action: String(action).toLowerCase(),
    paymentId: String(paymentId || '').trim()
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'libractiva-webhook-mp' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { type, action, paymentId } = extraerDatosNotificacion(req);

  // Ignorar notificaciones que no sean de pagos (ej. merchant_order)
  const esEventoPago = type === 'payment' || action.startsWith('payment.');
  if (!esEventoPago || !paymentId || !/^\d+$/.test(paymentId)) {
    return res.status(200).json({ received: true, ignored: true });
  }

  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) {
    console.error('[webhook-mp] REDIS_URL no configurada.');
    return res.status(500).json({ error: 'REDIS_URL no configurada' });
  }

  try {
    const infoPago = await consultarPagoMercadoPago(paymentId);
    if (!infoPago.ok) {
      // Si el pago no existe o no se pudo consultar, responder 200 para evitar reintentos infinitos de pruebas
      console.warn('[webhook-mp] No se pudo verificar el pago:', paymentId, infoPago.error);
      return res.status(200).json({ received: true, verified: false, reason: infoPago.error });
    }

    if (!infoPago.esValido) {
      // Pago aún pendiente, rechazado o de otro monto
      return res.status(200).json({
        received: true,
        status: infoPago.status,
        processed: false
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
      const resultado = await procesarPagoAprobado(client, infoPago.pago);
      return res.status(200).json({
        received: true,
        processed: true,
        codigo: resultado.codigo,
        emailEnviado: resultado.emailEnviado,
        yaExistia: resultado.yaExistia
      });
    } finally {
      try {
        await client.quit();
      } catch (_) {}
    }
  } catch (error) {
    console.error('[webhook-mp] Error al procesar notificación:', error);
    return res.status(500).json({ error: 'Error interno al procesar webhook' });
  }
};
