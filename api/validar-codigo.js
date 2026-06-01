// api/validar-codigo.js
// Endpoint Vercel Serverless: valida un código de donador y registra el dispositivo.
// Usa Vercel KV (Redis) para almacenar los códigos y los dispositivos permitidos.
// Límite: 3 dispositivos por código. Los códigos son permanentes (sin expiración de fecha).

const { kv } = require('@vercel/kv');
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

  const { codigo } = req.body;
  if (!codigo || typeof codigo !== 'string') {
    return res.status(400).json({ error: 'Se requiere un código de donador.' });
  }

  const codigoNormalizado = codigo.trim().toUpperCase();
  const kvKey = `donor:code:${codigoNormalizado}`;

  try {
    // 1. Verificar si el código existe en Vercel KV
    const registro = await kv.get(kvKey);

    if (!registro) {
      return res.status(404).json({
        valido: false,
        error: 'Código de donador no reconocido. Verifica que sea correcto.'
      });
    }

    // 2. Identificar el dispositivo actual
    const idDispositivo = generarIdDispositivo(req);
    const dispositivos = registro.dispositivos || [];
    const limite = registro.limite || 3;

    // 3. Verificar si el dispositivo ya está registrado
    if (dispositivos.includes(idDispositivo)) {
      // Dispositivo conocido — acceso permitido
      return res.status(200).json({ valido: true, dispositivos: dispositivos.length, limite });
    }

    // 4. Verificar si hay espacio para un nuevo dispositivo
    if (dispositivos.length >= limite) {
      return res.status(403).json({
        valido: false,
        error: `Este código ya alcanzó el límite de ${limite} dispositivos registrados. Si tienes problemas, contacta al administrador.`
      });
    }

    // 5. Registrar el nuevo dispositivo
    const nuevosDispositivos = [...dispositivos, idDispositivo];
    await kv.set(kvKey, { ...registro, dispositivos: nuevosDispositivos });

    // 6. Emitir una cookie segura firmada (donor_token) al navegador
    const secret = process.env.DONOR_COOKIE_SECRET || 'biblioteca-digital-secret';
    const firma = firmarCookie(codigoNormalizado, secret);
    const cookieValor = `${codigoNormalizado}.${firma}`;

    res.setHeader('Set-Cookie', [
      `donor_token=${cookieValor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=315360000`
      // Max-Age=315360000 = 10 años (permanente en la práctica)
    ]);

    return res.status(200).json({
      valido: true,
      nuevo: true,
      dispositivos: nuevosDispositivos.length,
      limite
    });

  } catch (error) {
    console.error('[validar-codigo] Error de KV:', error);
    return res.status(500).json({ error: 'Error interno del servidor. Inténtalo de nuevo.' });
  }
};
