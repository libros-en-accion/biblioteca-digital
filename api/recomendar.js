// api/recomendar.js
// Función Serverless de Vercel — recibe preferencias del usuario y consulta DeepSeek directamente

module.exports = async function handler(req, res) {
  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // ── 1. RECIBIR DATOS DEL USUARIO ──
  const { estado, tiempo, objetivo, tema, libros } = req.body;

  if (!libros || libros.length === 0) {
    return res.status(400).json({ error: 'No se recibió el catálogo de libros' });
  }

  // ── 2. CONSTRUIR EL CATÁLOGO RESUMIDO ──
  const catalogo = libros.map(l => ({
    id: l.id,
    titulo: l.titulo,
    autor: l.autor,
    genero: l.genero,
  }));

  // ── 3. CONSTRUIR MENSAJES CON CACHE-FRIENDLY STRUCTURE ──
  // El system message contiene todo lo fijo (catálogo + instrucciones).
  // DeepSeek cacheará este prefijo tras la primera llamada,
  // reduciendo el costo de input ~80% en llamadas subsecuentes.
  const systemMessage = `Eres un bibliotecario experto, cálido y breve. Siempre respondes SOLO con JSON válido, sin texto adicional.

  CATÁLOGO DISPONIBLE (JSON):
  ${JSON.stringify(catalogo)}

  INSTRUCCIONES PARA RECOMENDAR:
  1. Analiza el perfil del lector que te enviará el usuario y compáralo con los géneros y títulos del catálogo.
  2. Elige los 3 libros que mejor se ajusten a su estado y necesidad actual.
  3. Responde ÚNICAMENTE con un JSON válido, sin texto extra, sin bloques de código (sin \`\`\`), sin explicaciones fuera del JSON.
  4. El formato debe ser exactamente este:
  [
    {
      "id": 12,
      "razon": "Una explicación de 2 a 3 oraciones, cálida y personalizada, dirigida directamente al lector usando 'tú'."
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
    // Útil para verificar que el cache está funcionando correctamente.
    // prompt_cache_hit_tokens > 0 confirma que el catálogo fue cacheado.
    const usage = data.usage;
    if (usage) {
      console.log('Tokens usados:', {
        input_total:     usage.prompt_tokens,
        cache_hit:       usage.prompt_cache_hit_tokens  ?? 0,
        cache_miss:      usage.prompt_cache_miss_tokens ?? 0,
        output:          usage.completion_tokens,
      });
    }

    // ── 6. LIMPIAR Y PARSEAR RESPUESTA ──
    // Limpia posibles bloques de código que la IA a veces añade
    const textoLimpio = textoRespuesta
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

    let recomendaciones;
    try {
      recomendaciones = JSON.parse(textoLimpio);
      // Extraer el array si DeepSeek lo envolvió en un objeto
      if (!Array.isArray(recomendaciones) && recomendaciones.recomendaciones) {
        recomendaciones = recomendaciones.recomendaciones;
      }
    } catch (parseError) {
      console.error('Error al parsear JSON:', textoLimpio);
      return res.status(502).json({ error: 'La IA no devolvió JSON válido', respuestaRaw: textoLimpio });
    }

    return res.status(200).json({ recomendaciones });

  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
  }
};
