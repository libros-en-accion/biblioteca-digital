---
tipo: arquitectura
area: tecnica
tags: [arquitectura, auditoria, rendimiento, optimizacion, cache, deepseek, redis]
fecha: 2026-06-05
---

# ⚡ Arquitectura: Auditoría y Rendimiento

Este documento detalla el análisis de rendimiento del sistema **Libractiva**, identificando decisiones de diseño críticas, cuellos de botella del lado del cliente y del servidor, y las estrategias de optimización de costos y velocidad aplicadas.

---

## 🏎️ Análisis del Lado del Cliente (Frontend)

### Carga del Catálogo en Memoria y Búsqueda Híbrida
*   **Mecanismo:** El catálogo completo de 3,005 obras se almacena en el archivo estático `libros.json` (~2.1 MB). Al cargar el sitio, el navegador realiza un único `fetch` para descargarlo e inyectarlo en memoria con directivas de caché HTTP (`max-age=86400`).
*   **Compresión de Tránsito:** Aunque el archivo pesa ~2.1 MB en crudo, Vercel aplica compresión **Brotli/Gzip** de manera automática, reduciendo la descarga inicial en red a solo **~450 KB**.
*   **Búsqueda Exacta y Fuzzy Search (Levenshtein):**
    *   *Fase 1 (Coincidencia Exacta y Substring):* Búsqueda instantánea (<5 ms) por palabras clave normalizadas (sin tildes ni mayúsculas) en título, autor y género.
    *   *Fase 2 (Fuzzy Search tolerante a typos):* Si la búsqueda exacta arroja pocos resultados o el usuario comete un error tipográfico, entra en acción el algoritmo de distancia de Levenshtein en memoria. Evalúa los tokens sobre las 3,005 entradas en **20 a 50 ms**, asegurando una experiencia interactiva fluida a 60 fps sin necesidad de servidores de búsqueda dedicados como Elasticsearch o Algolia.
*   **Iconografía Vectorial Sobria (Lucide):** Se eliminó el uso de emojis en los controles de navegación y botones de acción, sustituyéndolos por iconos SVG optimizados de Lucide (`lucide.min.js`). Esto evita la fragmentación visual entre sistemas operativos (Apple, Android, Windows) y aporta una estética editorial sobria y profesional.

---

## 🤖 Optimización del Recomendador IA (DeepSeek Caching)

El mayor costo potencial del proyecto proviene de la consulta de IA, debido al tamaño del catálogo de libros enviado en cada solicitud. Se implementan dos estrategias clave para mitigar esto:

### 1. Compactación del Catálogo
En lugar de enviar el objeto JSON con descripciones y metadatos extensos, la API `api/recomendar.js` mapea el catálogo en una estructura cruda minimalista separada por pipes (`|`):
```text
id|título|autor|género
```
Esto reduce la huella del catálogo drásticamente a texto plano, disminuyendo el consumo de tokens en más de un **85%**.

### 2. Prompt Caching (Prefix Caching)
*   **Estrategia:** La lista de libros compactada y las instrucciones fijas del sistema se inyectan en el **System Message**. La consulta personalizada del lector se coloca en el **User Message**.
*   **Mecanismo de DeepSeek V3:** Al recibir la solicitud, el modelo de DeepSeek V3 (`deepseek-chat`) detecta que el prefijo del System Message coincide con el de las solicitudes previas. En lugar de reprocesar el catálogo completo, lee los tokens directamente de la caché de contexto.
*   **Impacto Económico:** 
    *   Costo de tokens de entrada normales: **$0.14** por millón.
    *   Costo de tokens en caché (Cache Hit): **$0.014** por millón.
    *   Esta optimización representa un ahorro del **90% en costos de ejecución de IA** a partir del segundo usuario concurrente.

---

## 🔒 Base de Datos y Seguridad (Redis Cloud & Cookies)

La validación del acceso premium de descargas y el visor completo de PDFs utiliza un sistema híbrido ultra-rápido:

### 1. Fingerprint de Dispositivo (SHA-256)
Para evitar que se compartan de forma descontrolada los códigos de donadores, la API `api/validar-codigo.js` genera un hash SHA-256 de 16 caracteres a partir de:
$$\text{Fingerprint} = \text{SHA256}(\text{User-Agent} + \text{Accept-Language} + \text{IP Client})$$
Este identificador no almacena información personal sensible (GDPR compliant) pero permite identificar de forma estable el dispositivo del lector.

### 2. Base de Datos en Memoria (Redis Cloud / Upstash)
*   **Tiempo de Respuesta:** Redis procesa la validación del código y el registro del dispositivo en **< 5 ms**.
*   **Control de Límite:** Se valida si el dispositivo ya existe o si aún hay cupo (máximo 3 dispositivos por código) antes de firmar el token de acceso.
*   **Métrica de Lecturas:** Permite registrar atómicamente (`ZINCRBY ranking:lecturas 1 {id}`) las lecturas globales sin penalizar el rendimiento.

### 3. Criptografía de Sesión (HMAC-SHA-256)
*   Una vez que el backend valida el acceso, emite una cookie segura `donor_token` en formato `codigo.firma`.
*   La firma se genera con `crypto.createHmac('sha256', secret)`, garantizando que el cliente no pueda manipular la cookie localmente para desbloquear libros sin realizar una donación válida.

---

## 📦 Almacenamiento Dual (Cloudflare R2)

Para la lectura en tiempo real y descarga de más de 30 GB de libros en formatos PDF y EPUB, el sistema utiliza Cloudflare R2:

*   **Enlaces Efímeros (Presigned URLs):** La API `api/leer.js` nunca expone la ruta real o pública del archivo. En su lugar, genera URLs firmadas dinámicamente con una validez de:
    *   **5 minutos (300 s):** Para visualización fluida mediante el canvas de PDF.js.
    *   **10 minutos (600 s):** Para descargas de archivos PDF y EPUB en e-readers o dispositivos móviles.
*   **Ancho de Banda Gratuito:** Al utilizar Cloudflare R2, el proyecto tiene **$0 costos de salida de datos (egress fees)**, lo cual es vital para la sostenibilidad financiera frente a alternativas con altos costes por transferencia.

---

**Notas Relacionadas:**
*   [[Arquitectura - Vista General|Stack de tecnologías y componentes]]
*   [[Arquitectura - API de Recomendación|Flujos y fallbacks de DeepSeek]]
*   [[Guía - Gestión de Accesos|Administración local de accesos y terminal CLI]]
