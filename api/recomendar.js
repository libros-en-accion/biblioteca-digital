// api/recomendar.js
// Función Serverless de Vercel — recibe preferencias del usuario y consulta DeepSeek directamente
// El catálogo se lee del filesystem del servidor, NO del cliente.

const fs = require('fs');
const path = require('path');

// ── Cargar el catálogo una sola vez al arrancar la función ──
// En Vercel Serverless, el módulo se cachea entre invocaciones del mismo worker,
// así que esta lectura solo ocurre 1 vez por cold start.
let catalogoCache = null;

function obtenerCatalogo() {
  if (catalogoCache) return catalogoCache;

  const librosPath = path.join(__dirname, '..', 'libros.json');
  const raw = fs.readFileSync(librosPath, 'utf-8');
  const libros = JSON.parse(raw);

  // Compacto: id|titulo|autor|genero — menos tokens, mismo contenido
  catalogoCache = libros.map(l =>
    `${l.id}|${l.titulo}|${l.autor}|${l.genero}`
  );

  return catalogoCache;
}

module.exports = async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── 1. RECIBIR DATOS DEL USUARIO ──
  // Ya no recibimos el catálogo completo del cliente.
  // Aceptamos `libros` por retrocompatibilidad pero lo ignoramos.
  const { estado, tiempo, objetivo, tema } = req.body;

  if (!estado || !tiempo || !objetivo) {
    return res.status(400).json({ error: 'Faltan datos del perfil del lector (estado, tiempo, objetivo)' });
  }

  // ── 2. OBTENER EL CATÁLOGO DEL SERVIDOR ──
  const catalogo = obtenerCatalogo();

  // ── 3. CONSTRUIR MENSAJES CON CACHE-FRIENDLY STRUCTURE ──
  // El system message contiene todo lo fijo (catálogo + instrucciones).
  // DeepSeek cacheará este prefijo tras la primera llamada,
  // reduciendo el costo de input ~80% en llamadas subsecuentes.
  const systemMessage = `Eres un bibliotecario experto, calido y breve. Siempre respondes SOLO con JSON valido, sin texto adicional.

  CATALOGO DISPONIBLE (formato: id|titulo|autor|genero):
  ${catalogo.join('\n')}

  INSTRUCCIONES PARA RECOMENDAR:
  1. Analiza el perfil del lector que te enviara el usuario y comparalo con los generos y titulos del catalogo.
  2. Elige los 3 libros que mejor se ajusten a su estado y necesidad actual.
  3. Responde UNICAMENTE con un JSON valido, sin texto extra, sin bloques de codigo (sin \`\`\`), sin explicaciones fuera del JSON.
  4. El formato debe ser exactamente este:
  [
    {
      "id": 12,
      "razon": "Una explicacion de 2 a 3 oraciones, calida y personalizada, dirigida directamente al lector usando 'tu'."
    },
    {
      "id": 45,
      "razon": "..."
    },
    {
      "id": 7,
      "razon": "..."
    }
  ]`;

  // El user message contiene solo lo que cambia en cada consulta (perfil del lector).
  const userMessage = `PERFIL DEL LECTOR:
  - Estado de ánimo: ${estado}
  - Tiempo disponible para leer: ${tiempo}
  - Quiere: ${objetivo}
  - Tema de interés: ${tema || 'ninguno en particular'}`;

  // ── 4. LLAMAR A DEEPSEEK API ──
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key no configurada en el servidor' });
    }

    const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user",   content: userMessage   }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!deepseekRes.ok) {
      const errorData = await deepseekRes.json();
      console.error('Error en DeepSeek:', errorData);
      return res.status(502).json({ error: 'Error al consultar DeepSeek', detalle: errorData });
    }

    const data = await deepseekRes.json();
    const textoRespuesta = data.choices[0]?.message?.content;

    if (!textoRespuesta) {
      return res.status(502).json({ error: 'DeepSeek no devolvió una respuesta válida' });
    }

    // ── 5. OPCIONAL: LOGUEAR USO DE CACHÉ PARA MONITOREO ──
    const usage = data.usage;
    if (usage) {
      console.log('Tokens usados:', {
        input_total:     usage.prompt_tokens,
        cache_hit:       usage.prompt_cache_hit_tokens  ?? 0,
        cache_miss:      usage.prompt_cache_miss_tokens ?? 0,
        output:          usage.completion_tokens,
      });
    }

    // ── 6. PARSEAR RESPUESTA CON REINTENTO ──
    let recomendaciones = parsearRecomendaciones(textoRespuesta);

    if (!recomendaciones) {
      // Un reintento pidiendo a DeepSeek que devuelva solo JSON
      console.log('JSON invalido en primer intento, reintentando...');
      const retryRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user",   content: userMessage   },
            { role: "assistant", content: textoRespuesta },
            { role: "user", content: "Tu respuesta anterior no es JSON valido. Responde UNICAMENTE con el array JSON en el formato indicado, sin ningun otro texto." }
          ],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (retryRes.ok) {
        const retryData = await retryRes.json();
        const retryTexto = retryData.choices[0]?.message?.content;
        if (retryTexto) {
          recomendaciones = parsearRecomendaciones(retryTexto);
        }
      }

      if (!recomendaciones) {
        return res.status(502).json({ error: 'La IA no devolvio JSON valido', respuestaRaw: textoRespuesta });
      }
    }

    return res.status(200).json({ recomendaciones });

  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
  }
};

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
