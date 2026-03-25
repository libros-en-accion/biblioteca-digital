// api/recomendar.js
// Función Serverless de Vercel — recibe preferencias del usuario y consulta Gemini

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

  // ── 2. CONSTRUIR EL CATÁLOGO RESUMIDO (solo campos esenciales) ──
  // Enviamos solo id, titulo, autor y genero para reducir el tamaño del payload
  const catalogo = libros.map(l => ({
    id:     l.id,
    titulo: l.titulo,
    autor:  l.autor,
    genero: l.genero,
  }));

  // ── 3. CONSTRUIR EL PROMPT ──
  const prompt = `
Eres un bibliotecario experto, cálido y breve. Siempre respondes SOLO con JSON válido, sin texto adicional.
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

  // ── 4. LLAMAR A GEMINI API ──
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API Key de Gemini no configurada en el servidor' });
    }

    // Usar gemini-2.0-flash con v1beta (modelo actual y estable)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json();
      console.error('Error de Gemini:', JSON.stringify(errorData));
      return res.status(502).json({ error: 'Error al consultar la IA', detalle: errorData });
    }

    const data = await geminiRes.json();
    const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textoRespuesta) {
      return res.status(502).json({ error: 'La IA no devolvió una respuesta válida' });
    }

    // Limpiar posibles bloques de código que Gemini a veces añade
    const textoLimpio = textoRespuesta
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');

    let recomendaciones;
    try {
      recomendaciones = JSON.parse(textoLimpio);
    } catch (parseError) {
      console.error('Error al parsear JSON de Gemini:', textoRespuesta);
      return res.status(502).json({ error: 'La IA no devolvió JSON válido', respuestaRaw: textoRespuesta });
    }

    return res.status(200).json({ recomendaciones });

  } catch (err) {
    console.error('Error interno:', err);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
  }
};
