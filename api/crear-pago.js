// api/crear-pago.js
// Endpoint Vercel Serverless: crea una Preferencia de Checkout en Mercado Pago
// con auto_return, external_reference (correo del comprador) y notification_url al webhook.
// Si MP_ACCESS_TOKEN no está configurada, devuelve fallback al link estático de Mercado Pago.

const { esEmailValido } = require('./_lib/pagos');

const FALLBACK_MP_URL = 'https://mpago.la/1Ek1HPz';

function obtenerBaseUrl(req) {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/+$/, '');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) {
    const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return 'https://biblioteca-digital-eight.vercel.app';
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email } = req.body || {};
  const emailLimpio = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const tieneEmail = esEmailValido(emailLimpio);

  if (emailLimpio && !tieneEmail) {
    return res.status(400).json({ error: 'Por favor ingresa un correo electrónico válido.' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(200).json({
      ok: true,
      fallback: true,
      url: FALLBACK_MP_URL
    });
  }

  const baseUrl = obtenerBaseUrl(req);
  const esLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

  const payload = {
    items: [
      {
        id: 'LTD-LIBRACTIVA-100',
        title: 'Acceso Lifetime — Libractiva (+3,000 Libros)',
        description: 'Código de acceso permanente para lectura completa y descargas PDF/EPUB en hasta 3 dispositivos.',
        category_id: 'books',
        quantity: 1,
        currency_id: 'MXN',
        unit_price: 100
      }
    ],
    external_reference: tieneEmail ? emailLimpio : 'compra_directa_web',
    metadata: {
      email_comprador: tieneEmail ? emailLimpio : '',
      producto: 'libractiva_lifetime'
    },
    back_urls: {
      success: `${baseUrl}/?pago=exitoso`,
      pending: `${baseUrl}/?pago=pendiente`,
      failure: `${baseUrl}/?pago=fallido`
    },
    auto_return: 'approved',
    statement_descriptor: 'LIBRACTIVA'
  };

  if (tieneEmail) {
    payload.payer = { email: emailLimpio };
  }

  // Mercado Pago exige HTTPS público para notification_url
  if (!esLocal && baseUrl.startsWith('https://')) {
    payload.notification_url = `${baseUrl}/api/webhook-mp`;
  }

  try {
    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('[crear-pago] Error en Mercado Pago Preferences:', resp.status, errText);
      return res.status(200).json({
        ok: true,
        fallback: true,
        url: FALLBACK_MP_URL
      });
    }

    const data = await resp.json();
    return res.status(200).json({
      ok: true,
      fallback: false,
      preferenceId: data.id,
      url: data.init_point || FALLBACK_MP_URL
    });
  } catch (error) {
    console.error('[crear-pago] Excepción al crear preferencia:', error);
    return res.status(200).json({
      ok: true,
      fallback: true,
      url: FALLBACK_MP_URL
    });
  }
};
