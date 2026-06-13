// api/leer.js
// Endpoint Vercel Serverless: genera URLs firmadas de Cloudflare R2 para leer PDFs.
// Para descargas: verifica la cookie donor_token antes de generar el enlace de descarga.

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

  const secret = process.env.DONOR_COOKIE_SECRET || 'biblioteca-digital-secret';
  const firmaEsperada = crypto
    .createHmac('sha256', secret)
    .update(codigo)
    .digest('hex');

  return firma === firmaEsperada;
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

  // Verificar permiso de descarga
  const quiereDescargar = descargar === 'true';
  if (quiereDescargar && !esDonador(req)) {
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

    return res.status(200).json({ url, expira: expiresIn });

  } catch (error) {
    console.error('[leer] Error al generar URL firmada:', error);
    return res.status(500).json({ error: 'Error al generar el enlace seguro. Inténtalo de nuevo.' });
  }
};
