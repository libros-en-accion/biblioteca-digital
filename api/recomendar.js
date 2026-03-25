// api/recomendar.js
// Función Serverless de Vercel — recibe preferencias del usuario y consulta OpenRouter

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
    id:     l.id,
    titulo: l.titulo,
    autor:  l.autor,
    genero: l.genero,
  }));

  // ── 3. CONSTRUIR EL PROMPT ──
  const prompt = `
Tu misión es recomendar exactamente 3 libros del catálogo que te proporciono, adaptados al perfil del lector.

PERFIL DEL LECTOR:
- Estado de ánimo: ${estado}
- Tiempo disponible para leer: ${tiempo}
- Quiere: ${objetivo}
- Tema de interés: ${tema || 'ninguno en particular'}

CATÁLOGO DISPONIBLE (JSON):
${JSON.stringify(catalogo)}

INSTRUCCIONES:
1. Analiza el perfil del lector y compáralo con los géneros y títulos del catálogo.
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
]
`.trim();

  // ── 4. LLAMAR A OPENROUTER API ──
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key no configurada en el servidor' });
    }

    // Usamos el modelo Gemini 2.0 Flash Lite gratuito a través de OpenRouter
    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://biblioteca-digital-eight.vercel.app/",
        "X-Title": "Biblioteca Digital IA"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: "Eres un bibliotecario experto, cálido y breve. Siempre respondes SOLO con JSON válido, sin texto adicional." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!openRouterRes.ok) {
        const errorData = await openRouterRes.json();
        console.error('Error de OpenRouter:', JSON.stringify(errorData));
        return res.status(502).json({ error: 'Error al consultar la IA', detalle: errorData });
    }

    const data = await openRouterRes.json();
    const textoRespuesta = data.choices[0]?.message?.content;

    if (!textoRespuesta) {
      return res.status(502).json({ error: 'La IA no devolvió una respuesta válida' });
    }

    // Limpiar posibles bloques de código que la IA a veces añade
    const textoLimpio = textoRespuesta
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');

    let recomendaciones;
    try {
      recomendaciones = JSON.parse(textoLimpio);
      // Extraer el array si OpenRouter lo envolvió en un objeto
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
