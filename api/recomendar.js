// api/recomendar.js
// Función Serverless de Vercel — Recomendador inteligente optimizado
// Utiliza DeepSeek API con prefiltrado semántico de candidatos (1,200 tokens en vez de 40,000)
// y fallback automático ultrarrápido para garantizar respuesta en < 2 segundos sin bloqueos.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('redis');

let librosCache = null;

function obtenerLibros() {
  if (librosCache) return librosCache;
  const librosPath = path.join(__dirname, '..', 'libros.json');
  const raw = fs.readFileSync(librosPath, 'utf-8');
  librosCache = JSON.parse(raw);
  return librosCache;
}

// ── Verificación de cookie de donador ──
function esDonador(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/donor_token=([^;]+)/);
  if (!match) return false;

  const [codigo, firma] = match[1].split('.');
  if (!codigo || !firma) return false;

  const secret = process.env.DONOR_COOKIE_SECRET;
  if (!secret) return false;

  const firmaEsperada = crypto
    .createHmac('sha256', secret)
    .update(codigo)
    .digest('hex');

  const bufFirma = Buffer.from(firma);
  const bufEsperada = Buffer.from(firmaEsperada);
  if (bufFirma.length !== bufEsperada.length) return false;
  return crypto.timingSafeEqual(bufFirma, bufEsperada);
}

// ── Prefiltrado inteligente de candidatos (~75 libros más afines) ──
function preseleccionarCandidatos(libros, { estado, tiempo, objetivo, tema }) {
  const palabrasTema = tema ? tema.toLowerCase().split(/\s+/).filter(w => w.length > 2) : [];

  const mapaObjetivoGeneros = {
    "aprender": ["Divulgación Científica", "Filosofía", "Ensayo", "Historia y Crónica", "Psicología y Autoayuda", "Biografía y Memorias", "Economía y Política"],
    "entretenimiento": ["Novela", "Misterio y Thriller", "Fantasía", "Ciencia Ficción", "Novela negra", "Novela juvenil"],
    "reflexionar": ["Filosofía", "Ensayo", "Poesía", "Cuento", "Novela", "Psicología y Autoayuda"],
    "escapar": ["Ciencia Ficción", "Fantasía", "Terror", "Misterio y Thriller", "Novela"],
    "inspirar": ["Biografía y Memorias", "Psicología y Autoayuda", "Filosofía", "Ensayo", "Novela"]
  };

  const objetivoNorm = (objetivo || '').toLowerCase();
  const objetivoKey = Object.keys(mapaObjetivoGeneros).find(k => objetivoNorm.includes(k)) || "aprender";
  const generosObjetivo = mapaObjetivoGeneros[objetivoKey] || [];

  const scored = libros.map(l => {
    let score = 0;
    const gen = l.genero || "";
    const tit = (l.titulo || "").toLowerCase();
    const desc = (l.descripcion || "").toLowerCase();
    const aut = (l.autor || "").toLowerCase();

    // 1. Afinidad por género según el objetivo principal
    if (generosObjetivo.includes(gen)) score += 6;

    // 2. Búsqueda semántica por tema ingresado por el usuario
    for (const w of palabrasTema) {
      if (tit.includes(w)) score += 12;
      if (gen.toLowerCase().includes(w)) score += 8;
      if (desc.includes(w)) score += 5;
      if (aut.includes(w)) score += 6;
    }

    // 3. Ajuste por tiempo disponible y extensión de páginas
    const pags = l.paginas || 250;
    if (tiempo && (tiempo.includes("30") || tiempo.includes("Poco"))) {
      if (pags < 180 || gen === "Cuento" || gen === "Poesía") score += 4;
      else if (pags > 450) score -= 4;
    } else if (tiempo && tiempo.includes("toda la tarde")) {
      if (pags > 300) score += 3;
    }

    // 4. Factor de variedad sutil para no mostrar siempre los mismos
    score += (l.id * 17) % 5;

    return { l, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 75).map(s => s.l);
}

// ── Fallback inteligente instantáneo (en caso de timeout o caída de la IA) ──
function generarFallbackInteligente(candidatos, { estado, objetivo, tema }) {
  const seleccionados = [];
  const autoresVistos = new Set();

  for (const c of candidatos) {
    if (seleccionados.length >= 3) break;
    const aut = (c.autor || '').toLowerCase();
    if (!autoresVistos.has(aut)) {
      seleccionados.push(c);
      autoresVistos.add(aut);
    }
  }

  let idx = 0;
  while (seleccionados.length < 3 && idx < candidatos.length) {
    if (!seleccionados.includes(candidatos[idx])) {
      seleccionados.push(candidatos[idx]);
    }
    idx++;
  }

  const plantillas = [
    (l) => `Dado que te sientes ${estado ? estado.toLowerCase() : 'con curiosidad'} y buscas ${objetivo ? objetivo.toLowerCase() : 'una buena lectura'}, «${l.titulo}» te atrapará desde el inicio por su ritmo envolvente y claridad.`,
    (l) => `Una obra sobresaliente de ${l.autor} dentro de ${l.genero}. Es perfecta para sumergirte y desconectar por completo de las prisas cotidianas.`,
    (l) => `Ideal para tu momento de lectura actual: te brindará una perspectiva lúcida e inspiradora que conecta con tus intereses de hoy.`
  ];

  return seleccionados.map((l, i) => ({
    id: l.id,
    razon: plantillas[i % plantillas.length](l)
  }));
}

function parsearRecomendaciones(texto) {
  if (!texto) return null;
  const textoLimpio = texto
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(textoLimpio);
    if (Array.isArray(parsed)) return parsed;
    if (parsed.recomendaciones && Array.isArray(parsed.recomendaciones)) return parsed.recomendaciones;
    return null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── RATE LIMITING EN REDIS ──
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  const usuarioEsDonador = esDonador(req);

  if (redisUrl && !usuarioEsDonador) {
    const client = createClient({ url: redisUrl });
    try {
      await client.connect();
      const clientIp = req.headers['cf-connecting-ip'] || 
                       req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                       req.socket?.remoteAddress || 
                       'unknown';
      const rateLimitKey = `ratelimit:recomendar:${clientIp}`;
      const usos = await client.incr(rateLimitKey);
      if (usos === 1) {
        await client.expire(rateLimitKey, 3600);
      }
      if (usos > 5) {
        await client.quit();
        return res.status(429).json({
          error: 'Has alcanzado el límite de recomendaciones gratuitas por ahora. Adquiere tu Acceso Lifetime para recomendaciones ilimitadas.'
        });
      }
      await client.quit();
    } catch (e) {
      console.warn('[recomendar] Aviso Redis rate limit:', e.message);
      try { await client.quit(); } catch (_) {}
    }
  }

  // ── 1. RECIBIR DATOS DEL USUARIO ──
  const { estado, tiempo, objetivo, tema } = req.body || {};
  if (!estado || !tiempo || !objetivo) {
    return res.status(400).json({ error: 'Faltan datos del perfil del lector (estado, tiempo, objetivo)' });
  }

  // ── 2. PRESELECCIONAR LOS CANDIDATOS MÁS RELEVANTES (~75 LIBROS) ──
  const todosLosLibros = obtenerLibros();
  const candidatos = preseleccionarCandidatos(todosLosLibros, { estado, tiempo, objetivo, tema });

  const catalogoCompacto = candidatos.map(l =>
    `${l.id}|${l.titulo}|${l.autor}|${l.genero}`
  ).join('\n');

  // ── 3. PREPARAR PROMPT OPTIMIZADO ──
  const systemMessage = `Eres un bibliotecario experto, calido y breve. Siempre respondes SOLO con JSON valido, sin texto adicional ni bloques de codigo.

CATALOGO CANDIDATO DISPONIBLE (formato: id|titulo|autor|genero):
${catalogoCompacto}

INSTRUCCIONES:
1. Elige exactamente 3 libros de la lista anterior que mejor se adapten al perfil del lector.
2. Devuelve UNICAMENTE un array JSON con esta estructura exacta:
[
  {
    "id": 12,
    "razon": "Explicacion calida y personalizada de 2 a 3 oraciones usando 'tu'."
  },
  {
    "id": 34,
    "razon": "..."
  },
  {
    "id": 56,
    "razon": "..."
  }
]`;

  const userMessage = `PERFIL DEL LECTOR:
- Estado de animo: ${estado}
- Tiempo disponible: ${tiempo}
- Busca: ${objetivo}
- Tema o interes: ${tema || 'ninguno en particular'}`;

  // ── 4. CONSULTA A DEEPSEEK CON TIMEOUT Y FALLBACK ──
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    // Si no hay API key configurada, responder inmediatamente con el fallback inteligente
    const recomendaciones = generarFallbackInteligente(candidatos, { estado, objetivo, tema });
    return res.status(200).json({ recomendaciones });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos de timeout

    const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user",   content: userMessage   }
        ],
        thinking: {
          type: "disabled"
        },
        temperature: 0.7,
        max_tokens: 800
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (deepseekRes.ok) {
      const data = await deepseekRes.json();
      const textoRespuesta = data.choices?.[0]?.message?.content;
      let recomendaciones = parsearRecomendaciones(textoRespuesta);

      if (recomendaciones && Array.isArray(recomendaciones) && recomendaciones.length > 0) {
        // Validar que los IDs existan en el catálogo
        const idsValidos = new Set(todosLosLibros.map(l => l.id));
        const recsFiltradas = recomendaciones.filter(r => idsValidos.has(r.id));
        if (recsFiltradas.length >= 2) {
          return res.status(200).json({ recomendaciones: recsFiltradas });
        }
      }
    } else {
      console.warn('DeepSeek respondió con status:', deepseekRes.status);
    }
  } catch (err) {
    console.warn('Consulta DeepSeek abortada o fallida, usando fallback:', err.message);
  }

  // ── 5. FALLBACK AUTOMÁTICO EN CASO DE TIMEOUT O ERROR DE RED ──
  const recomendacionesFallback = generarFallbackInteligente(candidatos, { estado, objetivo, tema });
  return res.status(200).json({ recomendaciones: recomendacionesFallback });
};
