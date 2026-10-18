#!/usr/bin/env node
/**
 * scripts/subir_a_r2.js
 * Sube automáticamente archivos nuevos a Cloudflare R2
 * usando las credenciales configuradas en .env.local
 * 
 * Uso:
 *   node scripts/subir_a_r2.js
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

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

const ARCHIVOS_A_SUBIR = [
  // ── Louisa May Alcott (Reemplazo nueva edición Mujercitas) ──
  {
    local: path.join(BASE_LOCAL, "A/Alcott, Louisa May/Mujercitas - Louisa May Alcott.pdf"),
    key: "A/Alcott, Louisa May/Mujercitas - Louisa May Alcott.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/A/Alcott, Louisa May/Mujercitas - Louisa May Alcott.epub"),
    key: "001_EPUB/A/Alcott, Louisa May/Mujercitas - Louisa May Alcott.epub",
    contentType: 'application/epub+zip'
  },

  // ── Dante Alighieri (Reemplazo nueva edición ilustrada) ──
  {
    local: path.join(BASE_LOCAL, "A/Alighieri, Dante/La Divina Comedia - Dante Alighieri.pdf"),
    key: "A/Alighieri, Dante/La Divina Comedia - Dante Alighieri.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/A/Alighieri, Dante/La Divina Comedia - Dante Alighieri.epub"),
    key: "001_EPUB/A/Alighieri, Dante/La Divina Comedia - Dante Alighieri.epub",
    contentType: 'application/epub+zip'
  },

  // ── Antoine de Saint-Exupéry (Reemplazo nueva edición) ──
  {
    local: path.join(BASE_LOCAL, "S/Saint Exupery, Antoine De/El principito - Antoine de Saint-Exupery.pdf"),
    key: "S/Saint Exupery, Antoine De/El principito - Antoine de Saint-Exupery.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Saint Exupery, Antoine De/El principito - Antoine de Saint-Exupery.epub"),
    key: "001_EPUB/S/Saint Exupery, Antoine De/El principito - Antoine de Saint-Exupery.epub",
    contentType: 'application/epub+zip'
  },

  // ── Sarah J. Maas (Saga Una Corte de Rosas y Espinas) ──
  {
    local: path.join(BASE_LOCAL, "M/Maas, Sarah J./Una corte de rosas y espinas - Sarah J. Maas.pdf"),
    key: "M/Maas, Sarah J./Una corte de rosas y espinas - Sarah J. Maas.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/M/Maas, Sarah J./Una corte de rosas y espinas - Sarah J. Maas.epub"),
    key: "001_EPUB/M/Maas, Sarah J./Una corte de rosas y espinas - Sarah J. Maas.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "M/Maas, Sarah J./Una corte de niebla y furia - Sarah J. Maas.pdf"),
    key: "M/Maas, Sarah J./Una corte de niebla y furia - Sarah J. Maas.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/M/Maas, Sarah J./Una corte de niebla y furia - Sarah J. Maas.epub"),
    key: "001_EPUB/M/Maas, Sarah J./Una corte de niebla y furia - Sarah J. Maas.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "M/Maas, Sarah J./Una corte de alas y ruina - Sarah J. Maas.pdf"),
    key: "M/Maas, Sarah J./Una corte de alas y ruina - Sarah J. Maas.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/M/Maas, Sarah J./Una corte de alas y ruina - Sarah J. Maas.epub"),
    key: "001_EPUB/M/Maas, Sarah J./Una corte de alas y ruina - Sarah J. Maas.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "M/Maas, Sarah J./Una corte de hielo y estrellas - Sarah J. Maas.pdf"),
    key: "M/Maas, Sarah J./Una corte de hielo y estrellas - Sarah J. Maas.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/M/Maas, Sarah J./Una corte de hielo y estrellas - Sarah J. Maas.epub"),
    key: "001_EPUB/M/Maas, Sarah J./Una corte de hielo y estrellas - Sarah J. Maas.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "M/Maas, Sarah J./Una corte de llamas plateadas - Sarah J. Maas.pdf"),
    key: "M/Maas, Sarah J./Una corte de llamas plateadas - Sarah J. Maas.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/M/Maas, Sarah J./Una corte de llamas plateadas - Sarah J. Maas.epub"),
    key: "001_EPUB/M/Maas, Sarah J./Una corte de llamas plateadas - Sarah J. Maas.epub",
    contentType: 'application/epub+zip'
  },

  // ── James S. A. Corey (The Expanse) ──
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./El despertar del Leviatan - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./El despertar del Leviatan - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./El despertar del Leviatan - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./El despertar del Leviatan - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./La guerra de Caliban - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./La guerra de Caliban - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./La guerra de Caliban - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./La guerra de Caliban - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./La puerta de Abadon - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./La puerta de Abadon - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./La puerta de Abadon - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./La puerta de Abadon - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./La quema de Cibola - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./La quema de Cibola - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./La quema de Cibola - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./La quema de Cibola - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./Los juegos de Nemesis - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./Los juegos de Nemesis - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./Los juegos de Nemesis - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./Los juegos de Nemesis - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./Las cenizas de Babilonia - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./Las cenizas de Babilonia - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./Las cenizas de Babilonia - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./Las cenizas de Babilonia - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./El alzamiento de Persepolis - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./El alzamiento de Persepolis - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./El alzamiento de Persepolis - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./El alzamiento de Persepolis - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./La colera de Tiamat - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./La colera de Tiamat - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./La colera de Tiamat - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./La colera de Tiamat - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Corey, James S. A./La caida del Leviatan - James S. A. Corey.pdf"),
    key: "C/Corey, James S. A./La caida del Leviatan - James S. A. Corey.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Corey, James S. A./La caida del Leviatan - James S. A. Corey.epub"),
    key: "001_EPUB/C/Corey, James S. A./La caida del Leviatan - James S. A. Corey.epub",
    contentType: 'application/epub+zip'
  },

  // ── Dan Simmons (Cantos de Hyperion) ──
  {
    local: path.join(BASE_LOCAL, "S/Simmons, Dan/Hyperion - Dan Simmons.pdf"),
    key: "S/Simmons, Dan/Hyperion - Dan Simmons.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Simmons, Dan/Hyperion - Dan Simmons.epub"),
    key: "001_EPUB/S/Simmons, Dan/Hyperion - Dan Simmons.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "S/Simmons, Dan/La caida de Hyperion - Dan Simmons.pdf"),
    key: "S/Simmons, Dan/La caida de Hyperion - Dan Simmons.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Simmons, Dan/La caida de Hyperion - Dan Simmons.epub"),
    key: "001_EPUB/S/Simmons, Dan/La caida de Hyperion - Dan Simmons.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "S/Simmons, Dan/Endymion - Dan Simmons.pdf"),
    key: "S/Simmons, Dan/Endymion - Dan Simmons.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Simmons, Dan/Endymion - Dan Simmons.epub"),
    key: "001_EPUB/S/Simmons, Dan/Endymion - Dan Simmons.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "S/Simmons, Dan/El ascenso de Endymion - Dan Simmons.pdf"),
    key: "S/Simmons, Dan/El ascenso de Endymion - Dan Simmons.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Simmons, Dan/El ascenso de Endymion - Dan Simmons.epub"),
    key: "001_EPUB/S/Simmons, Dan/El ascenso de Endymion - Dan Simmons.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "S/Simmons, Dan/Huerfanos de la Helice - Dan Simmons.pdf"),
    key: "S/Simmons, Dan/Huerfanos de la Helice - Dan Simmons.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Simmons, Dan/Huerfanos de la Helice - Dan Simmons.epub"),
    key: "001_EPUB/S/Simmons, Dan/Huerfanos de la Helice - Dan Simmons.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "S/Simmons, Dan/Los cantos de Hyperion - Dan Simmons.pdf"),
    key: "S/Simmons, Dan/Los cantos de Hyperion - Dan Simmons.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/S/Simmons, Dan/Los cantos de Hyperion - Dan Simmons.epub"),
    key: "001_EPUB/S/Simmons, Dan/Los cantos de Hyperion - Dan Simmons.epub",
    contentType: 'application/epub+zip'
  },

  // ── Leigh Bardugo (Trilogía Sombra y Hueso) ──
  {
    local: path.join(BASE_LOCAL, "B/Bardugo, Leigh/Sombra y hueso - Leigh Bardugo.pdf"),
    key: "B/Bardugo, Leigh/Sombra y hueso - Leigh Bardugo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/B/Bardugo, Leigh/Sombra y hueso - Leigh Bardugo.epub"),
    key: "001_EPUB/B/Bardugo, Leigh/Sombra y hueso - Leigh Bardugo.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "B/Bardugo, Leigh/Asedio y tormenta - Leigh Bardugo.pdf"),
    key: "B/Bardugo, Leigh/Asedio y tormenta - Leigh Bardugo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/B/Bardugo, Leigh/Asedio y tormenta - Leigh Bardugo.epub"),
    key: "001_EPUB/B/Bardugo, Leigh/Asedio y tormenta - Leigh Bardugo.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "B/Bardugo, Leigh/Ruina y ascenso - Leigh Bardugo.pdf"),
    key: "B/Bardugo, Leigh/Ruina y ascenso - Leigh Bardugo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/B/Bardugo, Leigh/Ruina y ascenso - Leigh Bardugo.epub"),
    key: "001_EPUB/B/Bardugo, Leigh/Ruina y ascenso - Leigh Bardugo.epub",
    contentType: 'application/epub+zip'
  },

  // ── Leigh Bardugo (Bilogía Seis de Cuervos) ──
  {
    local: path.join(BASE_LOCAL, "B/Bardugo, Leigh/Seis de cuervos - Leigh Bardugo.pdf"),
    key: "B/Bardugo, Leigh/Seis de cuervos - Leigh Bardugo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/B/Bardugo, Leigh/Seis de cuervos - Leigh Bardugo.epub"),
    key: "001_EPUB/B/Bardugo, Leigh/Seis de cuervos - Leigh Bardugo.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "B/Bardugo, Leigh/Reino de ladrones - Leigh Bardugo.pdf"),
    key: "B/Bardugo, Leigh/Reino de ladrones - Leigh Bardugo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/B/Bardugo, Leigh/Reino de ladrones - Leigh Bardugo.epub"),
    key: "001_EPUB/B/Bardugo, Leigh/Reino de ladrones - Leigh Bardugo.epub",
    contentType: 'application/epub+zip'
  },

  // ── Rick Riordan (Percy Jackson y los Dioses del Olimpo) ──
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/El ladron del rayo - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/El ladron del rayo - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/El ladron del rayo - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/El ladron del rayo - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/El mar de los monstruos - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/El mar de los monstruos - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/El mar de los monstruos - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/El mar de los monstruos - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/La maldicion del Titan - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/La maldicion del Titan - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/La maldicion del Titan - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/La maldicion del Titan - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/La batalla del laberinto - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/La batalla del laberinto - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/La batalla del laberinto - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/La batalla del laberinto - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/El ultimo heroe del Olimpo - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/El ultimo heroe del Olimpo - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/El ultimo heroe del Olimpo - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/El ultimo heroe del Olimpo - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/Percy Jackson y el caliz de los dioses - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/Percy Jackson y el caliz de los dioses - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/Percy Jackson y el caliz de los dioses - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/Percy Jackson y el caliz de los dioses - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/La furia de la diosa de tres cabezas - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/La furia de la diosa de tres cabezas - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/La furia de la diosa de tres cabezas - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/La furia de la diosa de tres cabezas - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "R/Riordan, Rick/Percy Jackson La serie completa - Rick Riordan.pdf"),
    key: "R/Riordan, Rick/Percy Jackson La serie completa - Rick Riordan.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/R/Riordan, Rick/Percy Jackson La serie completa - Rick Riordan.epub"),
    key: "001_EPUB/R/Riordan, Rick/Percy Jackson La serie completa - Rick Riordan.epub",
    contentType: 'application/epub+zip'
  },

  // ── Javier Castillo (Trilogía Miren Triggs) ──
  {
    local: path.join(BASE_LOCAL, "C/Castillo, Javier/La chica de nieve - Javier Castillo.pdf"),
    key: "C/Castillo, Javier/La chica de nieve - Javier Castillo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Castillo, Javier/La chica de nieve - Javier Castillo.epub"),
    key: "001_EPUB/C/Castillo, Javier/La chica de nieve - Javier Castillo.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Castillo, Javier/El juego del alma - Javier Castillo.pdf"),
    key: "C/Castillo, Javier/El juego del alma - Javier Castillo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Castillo, Javier/El juego del alma - Javier Castillo.epub"),
    key: "001_EPUB/C/Castillo, Javier/El juego del alma - Javier Castillo.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "C/Castillo, Javier/La grieta del silencio - Javier Castillo.pdf"),
    key: "C/Castillo, Javier/La grieta del silencio - Javier Castillo.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Castillo, Javier/La grieta del silencio - Javier Castillo.epub"),
    key: "001_EPUB/C/Castillo, Javier/La grieta del silencio - Javier Castillo.epub",
    contentType: 'application/epub+zip'
  },

  // ── Joël Dicker (Serie Marcus Goldman) ──
  {
    local: path.join(BASE_LOCAL, "D/Dicker, Joël/La verdad sobre el caso Harry Quebert - Joel Dicker.pdf"),
    key: "D/Dicker, Joël/La verdad sobre el caso Harry Quebert - Joel Dicker.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/D/Dicker, Joël/La verdad sobre el caso Harry Quebert - Joel Dicker.epub"),
    key: "001_EPUB/D/Dicker, Joël/La verdad sobre el caso Harry Quebert - Joel Dicker.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "D/Dicker, Joël/El libro de los Baltimore - Joel Dicker.pdf"),
    key: "D/Dicker, Joël/El libro de los Baltimore - Joel Dicker.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/D/Dicker, Joël/El libro de los Baltimore - Joel Dicker.epub"),
    key: "001_EPUB/D/Dicker, Joël/El libro de los Baltimore - Joel Dicker.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "D/Dicker, Joël/El caso Alaska Sanders - Joel Dicker.pdf"),
    key: "D/Dicker, Joël/El caso Alaska Sanders - Joel Dicker.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/D/Dicker, Joël/El caso Alaska Sanders - Joel Dicker.epub"),
    key: "001_EPUB/D/Dicker, Joël/El caso Alaska Sanders - Joel Dicker.epub",
    contentType: 'application/epub+zip'
  },

  // ── Blake Crouch & Alex Michaelides (Misterio y Ciencia Ficción) ──
  {
    local: path.join(BASE_LOCAL, "C/Crouch, Blake/Materia oscura - Blake Crouch.pdf"),
    key: "C/Crouch, Blake/Materia oscura - Blake Crouch.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/C/Crouch, Blake/Materia oscura - Blake Crouch.epub"),
    key: "001_EPUB/C/Crouch, Blake/Materia oscura - Blake Crouch.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "M/Michaelides, Alex/La paciente silenciosa - Alex Michaelides.pdf"),
    key: "M/Michaelides, Alex/La paciente silenciosa - Alex Michaelides.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/M/Michaelides, Alex/La paciente silenciosa - Alex Michaelides.epub"),
    key: "001_EPUB/M/Michaelides, Alex/La paciente silenciosa - Alex Michaelides.epub",
    contentType: 'application/epub+zip'
  },

  // ── Charles Duhigg, Héctor García, David Goggins, Morgan Housel (Desarrollo y Finanzas) ──
  {
    local: path.join(BASE_LOCAL, "D/Duhigg, Charles/Supercomunicadores - Charles Duhigg.pdf"),
    key: "D/Duhigg, Charles/Supercomunicadores - Charles Duhigg.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/D/Duhigg, Charles/Supercomunicadores - Charles Duhigg.epub"),
    key: "001_EPUB/D/Duhigg, Charles/Supercomunicadores - Charles Duhigg.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "G/García, Héctor/Ikigai - Hector Garcia y Francesc Miralles.pdf"),
    key: "G/García, Héctor/Ikigai - Hector Garcia y Francesc Miralles.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/G/García, Héctor/Ikigai - Hector Garcia y Francesc Miralles.epub"),
    key: "001_EPUB/G/García, Héctor/Ikigai - Hector Garcia y Francesc Miralles.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "G/Goggins, David/No me puedes lastimar - David Goggins.pdf"),
    key: "G/Goggins, David/No me puedes lastimar - David Goggins.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/G/Goggins, David/No me puedes lastimar - David Goggins.epub"),
    key: "001_EPUB/G/Goggins, David/No me puedes lastimar - David Goggins.epub",
    contentType: 'application/epub+zip'
  },
  {
    local: path.join(BASE_LOCAL, "H/Housel, Morgan/La psicologia del dinero - Morgan Housel.pdf"),
    key: "H/Housel, Morgan/La psicologia del dinero - Morgan Housel.pdf",
    contentType: 'application/pdf'
  },
  {
    local: path.join(BASE_LOCAL, "001_EPUB/H/Housel, Morgan/La psicologia del dinero - Morgan Housel.epub"),
    key: "001_EPUB/H/Housel, Morgan/La psicologia del dinero - Morgan Housel.epub",
    contentType: 'application/epub+zip'
  },
];

async function subirArchivo({ local, key, contentType }) {
  if (!fs.existsSync(local)) {
    console.warn(`  ⚠️ Archivo no encontrado en local: ${local}`);
    return false;
  }

  const stat = fs.statSync(local);
  const mb = (stat.size / (1024 * 1024)).toFixed(2);

  // Comprobar si el archivo ya existe en R2 con el mismo tamaño para omitir subida redundante
  try {
    const head = await r2Client.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    if (head.ContentLength === stat.size) {
      console.log(`  ⏩ Ya sincronizado en R2 (${mb} MB, omitido): ${key}`);
      return true;
    }
  } catch (err) {
    // Si no existe (404 / NotFound) o falla el chequeo, se procede a subir
  }

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
  for (const item of ARCHIVOS_A_SUBIR) {
    try {
      const ok = await subirArchivo(item);
      if (ok) exitosos++;
    } catch (err) {
      console.error(`  ❌ Error al subir ${item.key}:`, err.message);
    }
  }

  console.log(`\n🎉 Finalizado: ${exitosos}/${ARCHIVOS_A_SUBIR.length} archivos subidos con éxito a Cloudflare R2.`);
}

main();
