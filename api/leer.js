// api/leer.js
// Endpoint Vercel Serverless: genera URLs firmadas de Cloudflare R2 para leer PDFs.
// Para descargas: verifica la cookie donor_token antes de generar el enlace de descarga.

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { createClient } = require('redis');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Registro de lecturas / descargas en Redis para ranking en tiempo real ──
async function registrarLecturaRedis(libroId) {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  if (!redisUrl) return;

  const client = createClient({ url: redisUrl });
  client.on('error', () => {});

  try {
    await client.connect();

    const now = new Date();
    const anio = now.getUTCFullYear();
    const primerDia = new Date(Date.UTC(anio, 0, 1));
    const semana = Math.ceil((((now - primerDia) / 86400000) + primerDia.getUTCDay() + 1) / 7);
    const keySemanal = `ranking:semanal:${anio}-W${semana}`;

    // Incrementar en ranking semanal y ranking histórico
    await client.zIncrBy(keySemanal, 1, String(libroId));
    await client.expire(keySemanal, 60 * 60 * 24 * 30); // 30 días
    await client.zIncrBy('ranking:historico', 1, String(libroId));
  } catch (err) {
    console.error('[ranking] Error no crítico al registrar lectura:', err.message);
  } finally {
    try { await client.disconnect(); } catch (_) {}
  }
}

// ── Inicializar cliente S3 compatible con Cloudflare R2 ──
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

// ── Cache del catálogo ──
let catalogoCache = null;
function obtenerCatalogo() {
  if (catalogoCache) return catalogoCache;
  const librosPath = path.join(__dirname, '..', 'libros.json');
  const raw = fs.readFileSync(librosPath, 'utf-8');
  catalogoCache = JSON.parse(raw);
  return catalogoCache;
}

// ── Verificación de cookie de donador ──
function esDonador(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/donor_token=([^;]+)/);
  if (!match) return false;

  const [codigo, firma] = match[1].split('.');
  if (!codigo || !firma) return false;

  const secret = process.env.DONOR_COOKIE_SECRET;
  if (!secret) {
    console.error('[leer] Error: DONOR_COOKIE_SECRET no configurada.');
    return false;
  }

  const firmaEsperada = crypto
    .createHmac('sha256', secret)
    .update(codigo)
    .digest('hex');

  const bufFirma = Buffer.from(firma);
  const bufEsperada = Buffer.from(firmaEsperada);
  if (bufFirma.length !== bufEsperada.length) return false;
  return crypto.timingSafeEqual(bufFirma, bufEsperada);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id, descargar, formato } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Se requiere el parámetro id del libro.' });
  }

  // Buscar el libro en el catálogo
  const libros = obtenerCatalogo();
  const libro = libros.find(l => String(l.id) === String(id));

  if (!libro) {
    return res.status(404).json({ error: 'Libro no encontrado en el catálogo.' });
  }

  const esEpub = formato === 'epub';
  const rutaArchivo = esEpub ? libro.archivo_epub : libro.archivo_pdf;

  if (!rutaArchivo) {
    return res.status(404).json({
      error: `Este libro aún no tiene archivo ${esEpub ? 'EPUB' : 'PDF'} asociado en el servidor.`
    });
  }

  // Verificar estado de donador con cookie firmada
  const usuarioEsDonador = esDonador(req);

  // Todo EPUB es descarga; en PDF se descarga si tiene el parámetro descargar === 'true'
  const quiereDescargar = descargar === 'true' || esEpub;

  if (quiereDescargar && !usuarioEsDonador) {
    return res.status(403).json({
      error: 'Acceso denegado. Se requiere un código de acceso activo para descargar este archivo.'
    });
  }

  try {
    // Normalizar la clave del objeto (separador de directorios en R2 es "/")
    const objectKey = rutaArchivo.replace(/\\/g, '/');

    const params = {
      Bucket: BUCKET,
      Key: objectKey,
    };

    if (quiereDescargar) {
      // Header que fuerza descarga en el navegador
      const ext = esEpub ? '.epub' : '.pdf';
      const nombreArchivo = encodeURIComponent(`${libro.titulo} - ${libro.autor}${ext}`);
      params.ResponseContentDisposition = `attachment; filename="${nombreArchivo}"`;
    }

    const command = new GetObjectCommand(params);

    // URL firmada con expiración corta:
    //   - Lectura online: 5 minutos (300 s) — tiempo suficiente para renderizar PDF.js
    //   - Descarga directa: 10 minutos (600 s) — tiempo para que complete la descarga
    const expiresIn = quiereDescargar ? 600 : 300;
    const url = await getSignedUrl(r2Client, command, { expiresIn });

    // Registrar métrica en Redis de forma no bloqueante y segura
    try {
      await Promise.race([
        registrarLecturaRedis(libro.id),
        new Promise(resolve => setTimeout(resolve, 400))
      ]);
    } catch (_) {}

    return res.status(200).json({ url, expira: expiresIn, esDonador: usuarioEsDonador });

  } catch (error) {
    console.error('[leer] Error al generar URL firmada:', error);
    return res.status(500).json({ error: 'Error al generar el enlace seguro. Inténtalo de nuevo.' });
  }
};
