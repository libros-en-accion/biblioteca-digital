// api/ranking.js
// Endpoint Vercel Serverless: obtiene el ranking de libros más leídos / descargados desde Redis.

const { createClient } = require('redis');

function obtenerRedisUrl() {
  if (process.env.STORAGE_URL) return process.env.STORAGE_URL;
  if (process.env.REDIS_CLOUD_URL) return process.env.REDIS_CLOUD_URL;
  // Priorizar cualquier nueva variable con prefijo personalizado antes de la antigua REDIS_URL
  for (const [key, val] of Object.entries(process.env)) {
    if (
      key !== 'REDIS_URL' &&
      key !== 'KV_URL' &&
      typeof val === 'string' &&
      (val.startsWith('redis://') || val.startsWith('rediss://'))
    ) {
      return val;
    }
  }
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  if (process.env.KV_URL) return process.env.KV_URL;
  if (process.env.UPSTASH_REDIS_URL) return process.env.UPSTASH_REDIS_URL;
  if (process.env.REDIS_URI) return process.env.REDIS_URI;
  if (process.env.REDIS_CONNECTION_STRING) return process.env.REDIS_CONNECTION_STRING;
  if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    const auth = process.env.REDIS_PASSWORD ? `default:${encodeURIComponent(process.env.REDIS_PASSWORD)}@` : '';
    return `redis://${auth}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Cache en CDN de Vercel por 5 minutos (300 s) con stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const redisUrl = obtenerRedisUrl();
  if (!redisUrl) {
    return res.status(200).json({ origen: 'fallback', ranking: [] });
  }

  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 800,
      reconnectStrategy: () => false
    }
  });
  client.on('error', () => {});

  try {
    await client.connect();

    const now = new Date();
    const anio = now.getUTCFullYear();
    const primerDia = new Date(Date.UTC(anio, 0, 1));
    const semana = Math.ceil((((now - primerDia) / 86400000) + primerDia.getUTCDay() + 1) / 7);
    const keySemanal = `ranking:semanal:${anio}-W${semana}`;

    // Obtener los 20 más leídos de la semana actual
    let resultados = await client.zRangeWithScores(keySemanal, 0, 19, { REV: true });

    let origen = 'semanal';
    // Si la semana actual tiene menos de 5 registros, complementar con el ranking histórico acumulado
    if (resultados.length < 5) {
      const historicos = await client.zRangeWithScores('ranking:historico', 0, 19, { REV: true });
      if (historicos.length > resultados.length) {
        resultados = historicos;
        origen = 'historico';
      }
    }

    const ranking = resultados.map(item => ({
      id: parseInt(item.value, 10),
      score: Math.round(item.score)
    })).filter(item => !isNaN(item.id));

    return res.status(200).json({ origen, ranking });
  } catch (error) {
    console.error('[ranking] Error al obtener ranking de Redis:', error);
    return res.status(200).json({ origen: 'error_fallback', ranking: [] });
  } finally {
    try { await client.disconnect(); } catch (_) {}
  }
};
