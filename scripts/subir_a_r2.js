#!/usr/bin/env node
/**
 * scripts/subir_a_r2.js
 * Sube automáticamente archivos nuevos o específicos a Cloudflare R2
 * usando las credenciales configuradas en .env.local
 * 
 * Uso:
 *   node scripts/subir_a_r2.js --howey   (sube los 3 PDFs y 3 EPUBs de Hugh Howey)
 *   node scripts/subir_a_r2.js --help
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// 1. Cargar variables de entorno desde .env.local
const envFile = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envFile)) {
  console.error('❌ No se encontró el archivo .env.local');
  process.exit(1);
}

const env = {};
fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const requiredVars = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
for (const v of requiredVars) {
  if (!env[v]) {
    console.error(`❌ Falta la variable ${v} en .env.local`);
    process.exit(1);
  }
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = env.R2_BUCKET_NAME;
const BASE_LOCAL = '/home/daniel/biblioteca-digital';

const ARCHIVOS_HOWEY = [
  // PDFs
  {
    local: path.join(BASE_LOCAL, 'H/Howey, Hugh/Espejismo - Hugh Howey.pdf'),
    key: 'H/Howey, Hugh/Espejismo - Hugh Howey.pdf',
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, 'H/Howey, Hugh/Desolacion - Hugh Howey.pdf'),
    key: 'H/Howey, Hugh/Desolacion - Hugh Howey.pdf',
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, 'H/Howey, Hugh/Vestigios - Hugh Howey.pdf'),
    key: 'H/Howey, Hugh/Vestigios - Hugh Howey.pdf',
    contentType: 'application/pdf'
  },
  // EPUBs
  {
    local: path.join(BASE_LOCAL, '001_EPUB/H/Howey, Hugh/Espejismo - Hugh Howey.epub'),
    key: '001_EPUB/H/Howey, Hugh/Espejismo - Hugh Howey.epub',
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, '001_EPUB/H/Howey, Hugh/Desolacion - Hugh Howey.epub'),
    key: '001_EPUB/H/Howey, Hugh/Desolacion - Hugh Howey.epub',
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, '001_EPUB/H/Howey, Hugh/Vestigios - Hugh Howey.epub'),
    key: '001_EPUB/H/Howey, Hugh/Vestigios - Hugh Howey.epub',
    contentType: 'application/epub+zip'
  }
];

async function subirArchivo({ local, key, contentType }) {
  if (!fs.existsSync(local)) {
    console.warn(`  ⚠️ Archivo no encontrado en local: ${local}`);
    return false;
  }

  const stat = fs.statSync(local);
  const mb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`📤 Subiendo: ${key} (${mb} MB)...`);

  const fileStream = fs.createReadStream(local);
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  });

  await r2Client.send(command);
  console.log(`  ✅ Completado: ${key}`);
  return true;
}

async function main() {
  console.log(`🚀 Iniciando subida a Cloudflare R2 (Bucket: ${BUCKET})...\n`);

  let exitosos = 0;
  for (const item of ARCHIVOS_HOWEY) {
    try {
      const ok = await subirArchivo(item);
      if (ok) exitosos++;
    } catch (err) {
      console.error(`  ❌ Error al subir ${item.key}:`, err.message);
    }
  }

  console.log(`\n🎉 Finalizado: ${exitosos}/${ARCHIVOS_HOWEY.length} archivos subidos con éxito a Cloudflare R2.`);
}

main();
