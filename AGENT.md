# AGENT.md — Guía para Agentes de IA

## Descripción del Proyecto

**Libractiva** es una plataforma digital de lectura interactiva con un catálogo de **3,005 obras clásicas, novelas, ensayos y sagas completas**. Combina un catálogo estático optimizado en el cliente con un recomendador impulsado por IA (DeepSeek V3), lector web integrado (PDF.js), descargas en formatos PDF y EPUB alojados en Cloudflare R2, y un modelo de monetización de pago único (Lifetime Deal - LTD) de $100 MXN.

**Canal de contacto oficial:** `contacto.libractiva@gmail.com`
**URL de producción:** `https://biblioteca-digital-eight.vercel.app/`

---

## Stack Tecnológico

- **Frontend:** Vanilla HTML5 semántico, CSS3 modular (con modo claro/oscuro) y JavaScript ES6+ (sin frameworks pesados). Todo el filtrado, búsqueda difusa (*fuzzy*) y navegación ocurre en el cliente en memoria con latencias de 20-50 ms.
- **Backend:** Funciones serverless en Vercel (Node.js 24.x).
- **Almacenamiento de PDFs/EPUBs:** Cloudflare R2 Object Storage con URLs firmadas (`api/leer.js`).
- **Base de datos de accesos y métricas:** Redis Cloud / Upstash (validación de códigos, control de hasta 3 dispositivos por código y ranking semanal de lecturas).
- **IA:** DeepSeek V3 (`api/recomendar.js`) con Prompt Caching y límite de 3 consultas gratuitas por dispositivo (ilimitado para miembros Lifetime).
- **Lector Web:** PDF.js (Mozilla) renderizado en `<canvas>` con navegación de páginas, vista previa gratuita de 15 páginas, marcadores y guardado de progreso en `localStorage`.
- **Iconografía:** Lucide Icons (SVG vectoriales escalables mediante clases `.icono-xs`, `.icono-sm`, etc., sin emojis en la UI de control).
- **PWA:** Service Worker (`sw.js`) + `manifest.json` para instalación standalone y soporte offline de interfaz.
- **Despliegue:** Vercel (CI/CD automático desde GitHub, rama `main`).

### Tipografía
- **Cormorant Garamond:** Marca / logotipo.
- **Playfair Display:** Títulos y cabeceras editoriales.
- **DM Sans:** Texto de cuerpo y componentes de interfaz.
- **EB Garamond:** Citas literarias y destacados de lectura.

### Paleta de Colores
- **Teal Profundo:** `#1a5c50` / `#0e5254`
- **Teal Medio:** `#2a7b6a`
- **Dorado:** `#b8892a` / `#d4a94a`
- **Crema Cálido (fondo claro):** `#f4ede4`
- **Carbón Teal Oscuro (fondo oscuro):** `#0f1a17`

---

## Estructura del Proyecto

```
biblioteca/
├── index.html              # Interfaz principal (SPA)
├── style.css               # Estilos globales, variables CSS y modo oscuro
├── app.js                  # Motor del frontend: fuzzy search, paginación, lector, sagas
├── libros.json             # Catálogo estático (3,005 registros, ~1.8 MB) — NO LEER COMPLETO
├── colecciones.json        # 15 colecciones temáticas curadas con descripciones
├── manifest.json           # Manifiesto PWA
├── sw.js                   # Service Worker (PWA, caché offline)
├── robots.txt / sitemap.xml # SEO y directivas de rastreo
├── vercel.json             # Configuración de despliegue Vercel + CORS + Headers
├── package.json            # Dependencias Node (engines: Node 24.x)
├── portadas/               # Imágenes WebP optimizadas (~3,000 archivos) — NO LEER
├── api/                    # Funciones serverless (Vercel)
│   ├── recomendar.js       # Recomendador IA (DeepSeek V3 con Prompt Caching)
│   ├── leer.js             # URLs firmadas de Cloudflare R2 (PDF y EPUB)
│   ├── validar-codigo.js   # Validación de códigos de acceso con Redis Cloud
│   └── ranking.js          # Ranking semanal de lecturas populares desde Redis
├── scripts/                # Scripts de mantenimiento y automatización
│   ├── subir_a_r2.js       # Sincronización dinámica de PDFs y EPUBs hacia Cloudflare R2
│   ├── normalizar.js       # Normalización de géneros, títulos y autores
│   ├── asignar_sagas.js    # Detección y vinculación de sagas en libros.json
│   ├── extraer_paginas_e_idiomas.py # Conteo de páginas e idioma de cada libro
│   ├── agregar_nuevos_libros.py     # Carga masiva interactiva de PDFs
│   ├── mapear_epubs.py     # Mapeo de archivos EPUB hacia libros.json
│   ├── agregar_donador.py  # Administra códigos en Redis
│   ├── listar_donadores.py # Lista códigos y dispositivos activos en Redis
│   └── entregar_codigo.py  # Asignación interactiva desde lista_codigos.csv
└── boveda/                  # Documentación completa (Bóveda de Obsidian)
```

---

## REGLAS CRÍTICAS — LEE ANTES DE TRABAJAR

### 1. NUNCA leas `libros.json` completo ni la carpeta `portadas/`
- `libros.json` pesa ~1.8 MB y contiene 3,005 registros. Leerlo completo consume más de 300,000 tokens y satura el contexto.
- `portadas/` contiene ~3,000 archivos WebP binarios.
- Para inspeccionar libros, filtra con scripts de Node/Python o mediante grep por ID o título.

### 2. Iconografía sobria y coherencia de marca
- **No uses emojis como iconos en controles de UI, botones o modales**. Utiliza exclusivamente iconos SVG de Lucide con `data-lucide` y las clases de tamaño utilitarias (`.icono-xs`, `.icono-sm`, `.icono-md`, `.icono-lg`, `.icono-xl`).
- Tras manipular el DOM dinámicamente en JavaScript, invoca siempre `lucide.createIcons({ root: elemento })`.
- El nombre del sitio es estrictamente **Libractiva** y el correo de soporte es `contacto.libractiva@gmail.com`.

### 3. Búsqueda tolerante a errores (Fuzzy Search)
- `app.js` implementa el algoritmo de distancia de Levenshtein.
- Primero ejecuta coincidencia exacta; si devuelve 0 resultados, activa automáticamente la búsqueda difusa (*fuzzy*) para tolerar erratas (ej. *«murakamy»*, *«harry poter»*, *«fundasion»*) y muestra sugerencias en el autocompletado y catálogo. No sustituyas esta lógica sin comprobar rendimiento.

### 4. Estabilidad de libros destacados
- La constante `LIBROS_DESTACADOS_IDS` en `app.js` define el orden estricto de destacados cuando el ranking en Redis no supera el umbral. **No agregues `Math.random()` ni shuffles aleatorios**, ya que desestabilizan el podio de destacados entre recargas.

### 5. Respetar los géneros y las 58 Sagas
- Los géneros en `libros.json` están normalizados.
- La pestaña de sagas agrupa automáticamente los libros que contienen el objeto `"serie": { "nombre": "...", "orden": N }`. Existen 58 sagas catalogadas.

---

## Arquitectura de la API (Backend Serverless)

### `api/recomendar.js`
- Recibe un `POST` con las respuestas del usuario (ánimo, tiempo disponible, objetivo, género).
- Construye un prompt compacto con el catálogo en formato `id|título|autor|género` dentro del System Message.
- Utiliza **Prompt Caching** de DeepSeek V3 (~90% de ahorro en tokens de entrada).
- Límite de 3 consultas gratuitas por fingerprint de dispositivo (ilimitado si cuenta con cookie `donor_token`).

### `api/leer.js`
- Genera URLs firmadas (`presigned`) para Cloudflare R2 vía AWS SDK v3.
- Expiración: 5 minutos para lectura en streaming, 10 minutos para descargas completas.
- Las descargas (`descargar=true`) requieren obligatoriamente la cookie `donor_token` verificada por HMAC-SHA256.

### `api/validar-codigo.js`
- Valida códigos de acceso contra Redis Cloud (`donor:code:<CODIGO>`).
- Genera un fingerprint estable SHA-256 del dispositivo (User-Agent + Accept-Language + IP).
- Admite hasta 3 dispositivos simultáneos.
- Emite la cookie segura HttpOnly `donor_token` firmada con `DONOR_COOKIE_SECRET`.

### `api/ranking.js`
- Lee de Redis el ranking de libros más leídos en la semana (`ranking:semanal:<anio>-W<semana>`) o el acumulado histórico (`ranking:historico`).
- Cuenta con cabeceras de caché CDN (`s-maxage=300, stale-while-revalidate=600`).

---

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `DEEPSEEK_API_KEY` | Clave de API de DeepSeek V3 |
| `R2_ENDPOINT` | Endpoint S3 de Cloudflare R2 (`https://<id>.r2.cloudflarestorage.com`) |
| `R2_ACCESS_KEY_ID` | Clave de acceso S3 de Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Clave secreta S3 de Cloudflare R2 |
| `R2_BUCKET_NAME` | Nombre del bucket (ej: `biblioteca-digital`) |
| `REDIS_URL` | URL de conexión a Redis Cloud (`rediss://default:...`) |
| `DONOR_COOKIE_SECRET` | Secreto criptográfico para firma HMAC-SHA256 de cookies |

---

## Flujo de Despliegue

```bash
git add <archivos>
git commit -m "tipo: descripción clara del cambio"
git push origin main
```
Vercel detecta el push en `main` y realiza el despliegue automático a producción.
