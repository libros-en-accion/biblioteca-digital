#!/usr/bin/env node
/**
 * scripts/normalizar.js
 * 
 * Script de normalización del catálogo de libros.
 * - Limpia títulos (quita guiones bajos, capitaliza correctamente)
 * - Normaliza nombres de autor (formato consistente)
 * - Consolida 278 géneros → ~25 categorías padre
 * - Genera reporte de cambios
 * 
 * Uso:
 *   node scripts/normalizar.js          → preview (no modifica nada)
 *   node scripts/normalizar.js --apply  → aplica cambios a libros.json
 */

const fs = require('fs');
const path = require('path');

const LIBROS_PATH = path.join(__dirname, '..', 'libros.json');
const APPLY = process.argv.includes('--apply');

// ═══════════════════════════════════════════════════
// MAPA DE NORMALIZACIÓN DE GÉNEROS (278 → ~25)
// ═══════════════════════════════════════════════════
const GENERO_MAP = {
  // ── NOVELA ──
  'novela': 'Novela',
  'novela corta': 'Novela',
  'novela / ficción': 'Novela',
  'novela / sátira': 'Novela',
  'novela / aventuras': 'Novela',
  'novela / filosofía': 'Novela',
  'novela / crónica': 'Novela',
  'novela / misterio': 'Novela',
  'novela / drama': 'Novela',
  'novela / terror': 'Novela',
  'novela / fantasía': 'Novela',
  'novela/sátira': 'Novela',
  'novela/poesía': 'Novela',
  'novela/ensayo': 'Novela',
  'novela/fábula': 'Novela',
  'novela contemporánea': 'Novela',
  'novela psicológica': 'Novela',
  'novela filosófica': 'Novela',
  'novela fantástica': 'Novela',
  'novela erótica': 'Novela',
  'novela gráfica': 'Novela',
  'ficción': 'Novela',
  'literatura / ficción': 'Novela',
  'literatura': 'Novela',
  'narrativa': 'Novela',
  'realismo': 'Novela',
  'realismo mágico': 'Novela',
  'ficción / relatos': 'Novela',
  'humor / ficción': 'Novela',
  'literatura modernista': 'Novela',
  'gótico sureño': 'Novela',
  'alegoría': 'Novela',
  'literatura uruguaya': 'Novela',
  'drama': 'Novela',

  // ── NOVELA HISTÓRICA ──
  'novela histórica': 'Novela histórica',
  'novela histórica / aventuras': 'Novela histórica',
  'novela histórica / misterio': 'Novela histórica',
  'novela histórica / suspense': 'Novela histórica',
  'ficción histórica': 'Novela histórica',
  'fantasía histórica': 'Novela histórica',
  'relato histórico': 'Novela histórica',
  'western / novela': 'Novela histórica',

  // ── NOVELA JUVENIL ──
  'novela juvenil': 'Novela juvenil',
  'literatura juvenil': 'Novela juvenil',
  'literatura infantil': 'Novela juvenil',
  'infantil': 'Novela juvenil',
  'infantil/arte': 'Novela juvenil',
  'infantil/cf': 'Novela juvenil',
  'infantil / fantasía': 'Novela juvenil',
  'historia / infantil': 'Novela juvenil',
  'fábula / infantil': 'Novela juvenil',
  'cuento infantil': 'Novela juvenil',
  'fantasía infantil': 'Novela juvenil',
  'educativo': 'Novela juvenil',
  'misterio juvenil': 'Novela juvenil',

  // ── NOVELA NEGRA ──
  'novela negra': 'Novela negra',
  'novela negra / crimen': 'Novela negra',
  'novela de espionaje': 'Novela negra',
  'espionaje': 'Novela negra',
  'policial / thriller': 'Novela negra',
  'thriller / policial': 'Novela negra',
  'crimen / drama': 'Novela negra',
  'novela de aventuras': 'Novela negra',

  // ── CIENCIA FICCIÓN ──
  'ciencia ficción': 'Ciencia Ficción',
  'ciencia ficcion': 'Ciencia Ficción',
  'ciencia ficción / terror': 'Ciencia Ficción',
  'ciencia ficción / fantasía': 'Ciencia Ficción',
  'ciencia ficción / thriller': 'Ciencia Ficción',
  'ciencia ficción / suspense': 'Ciencia Ficción',
  'ciencia ficción / romance': 'Ciencia Ficción',
  'terror / ciencia ficción': 'Ciencia Ficción',
  'sátira / ciencia ficción': 'Ciencia Ficción',
  'ciencia ficción/humor': 'Ciencia Ficción',
  'novela distópica': 'Ciencia Ficción',
  'distopía': 'Ciencia Ficción',

  // ── FANTASÍA ──
  'fantasía': 'Fantasía',
  'fantasia': 'Fantasía',
  'fantasía épica': 'Fantasía',
  'fantasía / aventura': 'Fantasía',
  'fantasía / terror': 'Fantasía',
  'fantasía / drama': 'Fantasía',
  'fantasía / western': 'Fantasía',
  'fantasía / romance': 'Fantasía',
  'fantasía / suspense': 'Fantasía',
  'fantasía / fan-fiction': 'Fantasía',
  'fantasía romántica': 'Fantasía',
  'fantasía oscura / terror': 'Fantasía',
  'fantasía gótica / terror': 'Fantasía',
  'fantasía juvenil': 'Fantasía',
  'drama / fantasía': 'Fantasía',
  'épica': 'Fantasía',

  // ── TERROR ──
  'terror': 'Terror',
  'terror / suspense': 'Terror',
  'terror / cuento': 'Terror',
  'terror / thriller': 'Terror',
  'terror / policial': 'Terror',
  'terror / misterio': 'Terror',
  'terror / h.p. lovecraft': 'Terror',
  'terror / fantasía': 'Terror',
  'terror / romance': 'Terror',
  'terror / relatos': 'Terror',
  'relatos / terror': 'Terror',
  'cuento/terror': 'Terror',
  'cuento / terror': 'Terror',
  'novela gótica': 'Terror',
  'novela gótica / terror': 'Terror',
  'novela gótica / horror': 'Terror',
  'novela de terror': 'Terror',
  'terror cósmico': 'Terror',

  // ── MISTERIO Y THRILLER ──
  'misterio': 'Misterio y Thriller',
  'misterio y thriller': 'Misterio y Thriller',
  'thriller': 'Misterio y Thriller',
  'suspense': 'Misterio y Thriller',
  'thriller psicológico': 'Misterio y Thriller',
  'thriller médico': 'Misterio y Thriller',
  'thriller / drama': 'Misterio y Thriller',
  'thriller / suspense': 'Misterio y Thriller',
  'thriller / western': 'Misterio y Thriller',
  'misterio / suspense': 'Misterio y Thriller',
  'misterio / novela': 'Misterio y Thriller',
  'misterio/espionaje': 'Misterio y Thriller',
  'novela / suspense': 'Misterio y Thriller',
  'drama / suspenso': 'Misterio y Thriller',
  'supervivencia / suspense': 'Misterio y Thriller',
  'guion / suspense': 'Misterio y Thriller',
  'aventuras/misterio': 'Misterio y Thriller',
  'aventuras': 'Misterio y Thriller',
  'novela / western': 'Misterio y Thriller',

  // ── ROMANCE ──
  'romance': 'Romance',
  'romance / drama': 'Romance',
  'romance erótico': 'Romance',
  'romance juvenil': 'Romance',
  'romance / ficción': 'Romance',

  // ── CUENTO ──
  'cuento': 'Cuento',
  'relatos': 'Cuento',
  'relato': 'Cuento',
  'cuento/novela': 'Cuento',
  'cuento/humor': 'Cuento',
  'cuento/folclore': 'Cuento',
  'cuento/poesía': 'Cuento',
  'cuento/sátira': 'Cuento',
  'cuento fantástico': 'Cuento',
  'cuento filosófico': 'Cuento',
  'cuento / novela corta': 'Cuento',
  'cuentos / sátira': 'Cuento',
  'cuentos / policial': 'Cuento',
  'cuentos': 'Cuento',
  'relato / drama': 'Cuento',
  'relato / ensayo': 'Cuento',
  'relato/ensayo': 'Cuento',
  'folclore/cuento': 'Cuento',
  'fábula': 'Cuento',
  'antología': 'Cuento',
  'antología / ensayo': 'Cuento',
  'miscelánea': 'Cuento',
  'varios': 'Cuento',

  // ── ENSAYO ──
  'ensayo': 'Ensayo',
  'ensayo político': 'Ensayo',
  'ensayo / crítica': 'Ensayo',
  'ensayo / crónica': 'Ensayo',
  'ensayo / biografía': 'Ensayo',
  'ensayo / historia': 'Ensayo',
  'ensayo / articulismo': 'Ensayo',
  'ensayo / relatos': 'Ensayo',
  'ensayo / cuento': 'Ensayo',
  'ensayo / humor': 'Ensayo',
  'ensayo / viajes': 'Ensayo',
  'ensayo / didáctico': 'Ensayo',
  'ensayo / filosofía': 'Ensayo',
  'ensayo / cine': 'Ensayo',
  'ensayo / sociología': 'Ensayo',
  'ensayo / cómic': 'Ensayo',
  'ensayo científico': 'Ensayo',
  'ensayo histórico': 'Ensayo',
  'ensayos': 'Ensayo',
  'ensayo/relatos': 'Ensayo',
  'ensayo/poesía': 'Ensayo',
  'ensayo/antología': 'Ensayo',
  'ensayo/historia': 'Ensayo',
  'ensayo/biografía': 'Ensayo',
  'ensayo/lingüística': 'Ensayo',
  'ensayo/etimología': 'Ensayo',
  'ensayo/épica': 'Ensayo',
  'ensayo/sátira': 'Ensayo',
  'ensayo/diario': 'Ensayo',
  'ensayo/filosofía': 'Ensayo',
  'articulismo / ensayo': 'Ensayo',
  'prosa / ensayo': 'Ensayo',
  'discurso / ensayo': 'Ensayo',
  'psicología / ensayo': 'Ensayo',
  'sátira': 'Ensayo',
  'sátira política': 'Ensayo',
  'aforismos': 'Ensayo',

  // ── FILOSOFÍA ──
  'filosofía': 'Filosofía',
  'filosofia': 'Filosofía',
  'filosofía política': 'Filosofía',
  'filosofia politica': 'Filosofía',
  'filosofía/ciencia': 'Filosofía',
  'filosofía/psicología': 'Filosofía',
  'filosofía/física': 'Filosofía',
  'filosofía/lógica': 'Filosofía',
  'filosofía/estética': 'Filosofía',
  'filosofía/retórica': 'Filosofía',
  'filosofía / economía': 'Filosofía',
  'filosofía / ficción': 'Filosofía',
  'epistolar/filosofía': 'Filosofía',
  'poesía / filosofía': 'Filosofía',
  'autoayuda/filosofía': 'Filosofía',
  'teoría política': 'Filosofía',

  // ── POESÍA ──
  'poesía': 'Poesía',
  'poesia': 'Poesía',
  'poesía épica': 'Poesía',
  'poesía / prosa': 'Poesía',
  'poesía / letras': 'Poesía',
  'poesía / crítica': 'Poesía',
  'poesía clásica': 'Poesía',
  'poesía dramática': 'Poesía',
  'poesía satírica': 'Poesía',
  'poesía/epistolar': 'Poesía',
  'teatro/poesía': 'Poesía',

  // ── TEATRO ──
  'teatro': 'Teatro',
  'teatro clásico': 'Teatro',
  'guion': 'Teatro',
  'cómic': 'Teatro',

  // ── HISTORIA Y CRÓNICA ──
  'historia': 'Historia y Crónica',
  'historia y crónica': 'Historia y Crónica',
  'crónica': 'Historia y Crónica',
  'crónica de viaje': 'Historia y Crónica',
  'crónica / no ficción': 'Historia y Crónica',
  'crónica/ciencia': 'Historia y Crónica',
  'historia/religión': 'Historia y Crónica',
  'no ficción / historia': 'Historia y Crónica',
  'periodismo': 'Historia y Crónica',
  'reportaje': 'Historia y Crónica',
  'entrevista': 'Historia y Crónica',
  'no ficción / crónica': 'Historia y Crónica',
  'viajes': 'Historia y Crónica',
  'viajes / humor': 'Historia y Crónica',
  'biografía histórica': 'Historia y Crónica',

  // ── DIVULGACIÓN CIENTÍFICA ──
  'divulgación científica': 'Divulgación Científica',
  'divulgacion cientifica': 'Divulgación Científica',
  'divulgación': 'Divulgación Científica',
  'ciencia': 'Divulgación Científica',
  'ciencia/biología': 'Divulgación Científica',
  'ciencia/ensayo': 'Divulgación Científica',
  'ciencia/psicología': 'Divulgación Científica',
  'ciencia / ia': 'Divulgación Científica',
  'ciencia / psicología': 'Divulgación Científica',
  'ciencia / lingüística': 'Divulgación Científica',
  'no ficción / ciencia': 'Divulgación Científica',
  'no ficción / teoría': 'Divulgación Científica',
  'no ficción / ensayo': 'Divulgación Científica',
  'diario/ciencia': 'Divulgación Científica',
  'medicina': 'Divulgación Científica',
  'antropología': 'Divulgación Científica',
  'sociología': 'Divulgación Científica',

  // ── PSICOLOGÍA Y AUTOAYUDA ──
  'psicología y autoayuda': 'Psicología y Autoayuda',
  'autoayuda': 'Psicología y Autoayuda',
  'psicología': 'Psicología y Autoayuda',
  'no ficción / autoayuda': 'Psicología y Autoayuda',
  'espiritualidad': 'Psicología y Autoayuda',
  'religión y espiritualidad': 'Psicología y Autoayuda',

  // ── BIOGRAFÍA Y MEMORIAS ──
  'biografía': 'Biografía y Memorias',
  'biografía y memorias': 'Biografía y Memorias',
  'memorias': 'Biografía y Memorias',
  'autobiografía': 'Biografía y Memorias',
  'memorias/recetario': 'Biografía y Memorias',
  'memorias/ensayo': 'Biografía y Memorias',
  'memorias / ensayo': 'Biografía y Memorias',
  'memorias / disputado': 'Biografía y Memorias',
  'no ficción / memorias': 'Biografía y Memorias',
  'no ficción': 'Biografía y Memorias',
  'diario': 'Biografía y Memorias',
  'memoria': 'Biografía y Memorias',

  // ── ECONOMÍA Y POLÍTICA ──
  'economía': 'Economía y Política',
  'economía / filosofía': 'Economía y Política',
  'finanzas': 'Economía y Política',
  'no ficción / didáctico': 'Economía y Política',

  // ── RELIGIÓN Y TEOLOGÍA ──
  'teología': 'Religión y Teología',
  'religión/gnosticismo': 'Religión y Teología',
  'mitología': 'Religión y Teología',

  // ── EPISTOLAR ──
  'epistolar': 'Epistolar',
  'epistolar / no ficción': 'Epistolar',

  // ── LITERATURA LATINOAMERICANA ──
  'literatura latinoamericana': 'Literatura latinoamericana',

  // ── OTRO / CATCH-ALL ──
  'otro': 'Otro',
  '': 'Otro',
  'modernismo': 'Novela',
};

// ═══════════════════════════════════════════════════
// FUNCIONES DE NORMALIZACIÓN
// ═══════════════════════════════════════════════════

function limpiarTitulo(titulo) {
  if (!titulo) return titulo;
  let limpio = titulo
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Si está todo en mayúsculas, capitalizar
  if (limpio === limpio.toUpperCase() && limpio.length > 3) {
    limpio = limpio.toLowerCase().replace(/(?:^|\s)\S/g, l => l.toUpperCase());
  }

  return limpio;
}

function normalizarAutor(autor) {
  if (!autor) return autor;
  let limpio = autor.trim();

  // Si está todo en mayúsculas, normalizar a "Apellido, Nombre"
  if (limpio === limpio.toUpperCase() && limpio.length > 3) {
    limpio = limpio.toLowerCase().replace(/(?:^|\s|,\s*)\S/g, l => l.toUpperCase());
  }

  // Corregir primera letra minúscula
  if (limpio[0] && limpio[0] === limpio[0].toLowerCase() && limpio[0] !== limpio[0].toUpperCase()) {
    limpio = limpio[0].toUpperCase() + limpio.slice(1);
  }

  return limpio;
}

function normalizarGenero(genero) {
  if (!genero) return 'Otro';
  const clave = genero.toLowerCase().trim();
  return GENERO_MAP[clave] || genero; // Si no está mapeado, dejarlo como está
}

// ═══════════════════════════════════════════════════
// EJECUCIÓN
// ═══════════════════════════════════════════════════

console.log('📚 Normalización del catálogo de libros');
console.log('═'.repeat(50));
console.log(`Modo: ${APPLY ? '⚡ APLICAR CAMBIOS' : '👁  PREVIEW (sin cambios)'}`);
console.log();

const raw = fs.readFileSync(LIBROS_PATH, 'utf-8');
const libros = JSON.parse(raw);

let cambiosTitulo = 0;
let cambiosAutor = 0;
let cambiosGenero = 0;
const generoAntes = {};
const generoDespues = {};

const librosNormalizados = libros.map(libro => {
  const nuevoTitulo = limpiarTitulo(libro.titulo);
  const nuevoAutor = normalizarAutor(libro.autor);
  const nuevoGenero = normalizarGenero(libro.genero);

  if (nuevoTitulo !== libro.titulo) {
    if (cambiosTitulo < 10) {
      console.log(`📝 Título: "${libro.titulo}" → "${nuevoTitulo}"`);
    }
    cambiosTitulo++;
  }

  if (nuevoAutor !== libro.autor) {
    if (cambiosAutor < 10) {
      console.log(`👤 Autor: "${libro.autor}" → "${nuevoAutor}"`);
    }
    cambiosAutor++;
  }

  if (nuevoGenero !== libro.genero) {
    if (cambiosGenero < 15) {
      console.log(`🏷  Género: "${libro.genero}" → "${nuevoGenero}"`);
    }
    cambiosGenero++;
  }

  // Tracking de géneros
  generoAntes[libro.genero || '(vacío)'] = (generoAntes[libro.genero || '(vacío)'] || 0) + 1;
  generoDespues[nuevoGenero] = (generoDespues[nuevoGenero] || 0) + 1;

  return {
    ...libro,
    titulo: nuevoTitulo,
    autor: nuevoAutor,
    genero: nuevoGenero,
  };
});

// Detectar géneros no mapeados
const noMapeados = {};
libros.forEach(l => {
  const clave = (l.genero || '').toLowerCase().trim();
  if (!GENERO_MAP[clave]) {
    noMapeados[l.genero] = (noMapeados[l.genero] || 0) + 1;
  }
});

console.log('\n' + '═'.repeat(50));
console.log('📊 RESUMEN DE CAMBIOS');
console.log('═'.repeat(50));
console.log(`  Títulos modificados:  ${cambiosTitulo}`);
console.log(`  Autores modificados:  ${cambiosAutor}`);
console.log(`  Géneros modificados:  ${cambiosGenero}`);
console.log(`  Géneros ANTES:        ${Object.keys(generoAntes).length} únicos`);
console.log(`  Géneros DESPUÉS:      ${Object.keys(generoDespues).length} únicos`);

if (Object.keys(noMapeados).length > 0) {
  console.log(`\n⚠️  Géneros sin mapear (se mantienen igual): ${Object.keys(noMapeados).length}`);
  Object.entries(noMapeados).sort((a, b) => b[1] - a[1]).forEach(([g, c]) => {
    console.log(`    ${c.toString().padStart(3)}  "${g}"`);
  });
}

console.log('\n📋 Distribución DESPUÉS:');
Object.entries(generoDespues)
  .sort((a, b) => b[1] - a[1])
  .forEach(([g, c]) => {
    console.log(`  ${c.toString().padStart(4)}  ${g}`);
  });

if (APPLY) {
  // Backup
  const backupPath = LIBROS_PATH + '.pre-normalizar.bak';
  fs.writeFileSync(backupPath, raw);
  console.log(`\n💾 Backup guardado en: ${backupPath}`);

  // Escribir
  fs.writeFileSync(LIBROS_PATH, JSON.stringify(librosNormalizados, null, 2) + '\n');
  console.log(`✅ libros.json actualizado con ${libros.length} libros normalizados.`);
} else {
  console.log('\n💡 Para aplicar los cambios, ejecuta:');
  console.log('   node scripts/normalizar.js --apply');
}
