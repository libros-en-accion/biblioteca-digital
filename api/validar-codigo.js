// api/validar-codigo.js
// Endpoint Vercel Serverless: valida un código de acceso lifetime y registra el dispositivo.
// Usa Vercel KV (Redis) para almacenar los códigos y los dispositivos permitidos.
// Límite: 3 dispositivos por código. Los códigos son permanentes (sin expiración de fecha).

const { createClient } = require('redis');
const crypto = require('crypto');

// Genera un ID de dispositivo único a partir de cabeceras de la petición.
// No contiene datos personales sensibles — solo crea un fingerprint estable del navegador.
function generarIdDispositivo(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLang = req.headers['accept-language'] || '';
  const cfIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '';
  const raw = `${userAgent}|${acceptLang}|${cfIp}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16);
}

// Firma simple para la cookie donor_token usando HMAC-SHA256.
function firmarCookie(codigoHash, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(codigoHash)
    .digest('hex');
}

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

  const codigoNormalizado = codigo.trim().toUpperCase();
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
    const registroRaw = await client.get(kvKey);
    const registro = registroRaw ? JSON.parse(registroRaw) : null;

    if (!registro) {
      return res.status(404).json({
        valido: false,
        error: 'Código de acceso no reconocido. Verifica que sea correcto o adquiere tu acceso en https://mpago.la/1Ek1HPz'
      });
    }

    // 2. Identificar el dispositivo actual
    const idDispositivo = generarIdDispositivo(req);
    const dispositivos = registro.dispositivos || [];
    const limite = registro.limite || 3;

    // Helper para emitir la cookie donor_token segura
    const firma = firmarCookie(codigoNormalizado, secret);
    const cookieValor = `${codigoNormalizado}.${firma}`;
    const cookieHeader = `donor_token=${cookieValor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=315360000`;

    // 3. Verificar si el dispositivo ya está registrado (reingreso o recuperación de sesión)
    if (dispositivos.includes(idDispositivo)) {
      // Dispositivo conocido — re-emitir siempre la cookie para restaurar permisos
      res.setHeader('Set-Cookie', [cookieHeader]);
      return res.status(200).json({
        valido: true,
        revalidado: true,
        dispositivos: dispositivos.length,
        limite
      });
    }

    // 4. Verificar si hay espacio para un nuevo dispositivo
    if (dispositivos.length >= limite) {
      return res.status(403).json({
        valido: false,
        error: `Este código de acceso ya está activo en el límite de ${limite} dispositivos. Si tienes problemas, contacta al soporte.`
      });
    }

    // 5. Registrar el nuevo dispositivo
    const nuevosDispositivos = [...dispositivos, idDispositivo];
    await client.set(kvKey, JSON.stringify({ ...registro, dispositivos: nuevosDispositivos }));

    // 6. Emitir cookie segura firmada (donor_token) al navegador
    res.setHeader('Set-Cookie', [cookieHeader]);

    return res.status(200).json({
      valido: true,
      nuevo: true,
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
