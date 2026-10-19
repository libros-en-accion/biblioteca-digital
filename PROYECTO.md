# 📚 Libractiva — PROYECTO

> Archivo vivo de seguimiento y especificación técnica del proyecto.
> Plataforma digital de lectura interactiva, catálogo visual y recomendador con IA.

---

## 📋 Ficha técnica

| Concepto | Detalle |
|---|---|
| **Nombre oficial** | **Libractiva** |
| **Descripción** | Biblioteca digital inteligente y cultural con catálogo interactivo, lector web integrado y recomendador por IA. |
| **Catálogo** | **3,005 títulos únicos** en `libros.json` (~1.8 MB), normalizados y con metadatos enriquecidos (páginas, año, idioma, sinopsis, sagas). |
| **Formatos de lectura** | **PDF y EPUB** completos alojados en Cloudflare R2 con URLs prefirmadas (`/api/leer`). |
| **Colecciones y Sagas** | **15 Colecciones temáticas curadas** (`colecciones.json`) y **58 Sagas literarias** agrupadas dinámicamente. |
| **Frontend** | Vanilla HTML5, CSS3 moderno (modo claro/oscuro) y JavaScript ES6+ modular, sin frameworks pesados. |
| **Iconografía** | **Lucide Icons** vectoriales (SVG en escala proporcional, sustituyendo emojis). |
| **Buscador** | Motor de búsqueda tolerante a errores tipográficos (*fuzzy search* con distancia de Levenshtein) y autocompletado en cliente. |
| **Lector Web** | PDF.js integrado con vista previa de 15 páginas, marcadores y guardado de progreso de lectura. |
| **Backend** | Vercel Serverless Functions (Node.js 24.x): `/api/leer`, `/api/recomendar`, `/api/validar-codigo`, `/api/ranking`. |
| **Almacenamiento Cloud** | **Cloudflare R2 Object Storage** (PDFs y EPUBs completos). |
| **Base de Datos** | **Redis Cloud (Upstash)** para control de accesos, límite de 3 dispositivos por código y ranking semanal de lecturas. |
| **IA** | DeepSeek V3 (`api/recomendar.js`) con Prompt Caching y límite de 3 consultas gratuitas por dispositivo (ilimitado para miembros Lifetime). |
| **PWA & SEO** | Service Worker (`sw.js`), `manifest.json`, metadatos JSON-LD `schema.org`, `robots.txt` y `sitemap.xml`. |
| **Monetización** | Acceso Lifetime ($100 MXN) de pago único vía Mercado Pago. |
| **Canal de contacto** | `contacto.libractiva@gmail.com` y WhatsApp. |

---

## 🗺️ Roadmap de Implementación

### ✅ Completado (Hitos Consolidados)
- [x] **Expansión del catálogo a 3,005 libros** — 100% con archivos PDF y EPUB sincronizados en Cloudflare R2.
- [x] **Script de subida a R2 (`scripts/subir_a_r2.js`)** — Inspección dinámica de `libros.json`, cálculo de MD5 y subida vía AWS SDK.
- [x] **Unificación de Sagas Literarias** — 58 sagas agrupadas dinámicamente en catálogo y filtros, eliminando discrepancias de conteo.
- [x] **Depuración de Colecciones Temáticas** — 15 colecciones curadas en `colecciones.json` sin incongruencias temáticas.
- [x] **UI Sobria y Vectorial (Lucide Icons)** — Sustitución completa de emojis en botones, modales, badges y alertas por iconos SVG escalables.
- [x] **Búsqueda tolerante a errores (Fuzzy Search)** — Tolerancia a fallos tipográficos (*«murakamy»*, *«harry poter»*, *«fundasion»*) con algoritmo Levenshtein y sugerencias automáticas.
- [x] **Consistencia de Marca** — Nombre unificado a Libractiva, autor unificado y nuevo correo oficial `contacto.libractiva@gmail.com`.
- [x] **Estabilidad en Destacados** — Eliminación del shuffle aleatorio en recarga; orden fijo basado en `LIBROS_DESTACADOS_IDS` y ranking en Redis.
- [x] **Lector PDF.js y Marcadores** — Lector embebido con límite de 15 páginas para no miembros, marcadores de página tipo Kindle y guardado de progreso.
- [x] **PWA & Modo Oscuro** — Soporte PWA instalable (`sw.js`), almacenamiento offline de assets y selector de tema claro/oscuro persistente.

### 🟡 En progreso / Siguiente Hito
- [ ] **Fase 2: Pasarela automática con entrega inmediata de código**
  - Webhook de Mercado Pago (`api/webhook-mp.js`) para confirmación de pagos de $100 MXN en segundo plano.
  - Retorno automático desde Mercado Pago con activación instantánea en navegador (`api/verificar-pago.js`).
  - Envío transaccional automático del código `LTD-XXXXX` por correo desde `contacto.libractiva@gmail.com` (Gmail SMTP / Nodemailer).
  - Autovalidación por número de operación/comprobante de Mercado Pago en modal de código.

---

## 📂 Estructura del Proyecto

```
biblioteca/
├── index.html                  # Interfaz principal SPA (HTML5 semántico)
├── style.css                   # Sistema de diseño, variables CSS y modo oscuro
├── app.js                      # Motor frontend: catálogo, fuzzy search, paginación, lector, sagas
├── libros.json                 # Catálogo completo (3,005 títulos con metadatos)
├── colecciones.json            # 15 colecciones temáticas curadas
├── manifest.json               # Manifiesto PWA para instalación web
├── sw.js                       # Service Worker (PWA y caché de assets estáticos)
├── robots.txt / sitemap.xml     # Indexación y directivas SEO
├── package.json                # Dependencias Node (engines: Node 24.x)
├── vercel.json                 # Configuración de despliegue Vercel, headers de caché y tiempos de función
├── portadas/                   # Miniaturas WebP optimizadas de cada libro (~3,000 archivos)
├── api/                        # Funciones Serverless en Vercel
│   ├── recomendar.js           # Recomendador IA vía DeepSeek V3 con Prompt Caching
│   ├── leer.js                 # URLs firmadas temporales de Cloudflare R2 (PDF y EPUB)
│   ├── validar-codigo.js       # Validación de códigos LTD y fingerprint de dispositivos en Redis
│   └── ranking.js              # Ranking semanal de lecturas reales en Redis
├── scripts/                    # Herramientas de automatización y administración
│   ├── subir_a_r2.js           # Sincronización masiva y dinámica hacia Cloudflare R2
│   ├── normalizar.js           # Normalización de géneros, títulos y autores
│   ├── agregar_nuevos_libros.py # Carga masiva e interactiva de libros
│   ├── asignar_sagas.js        # Detección y asignación automática de sagas en libros.json
│   ├── extraer_paginas_e_idiomas.py # Enriquecimiento de metadatos de lectura
│   ├── agregar_donador.py      # Alta manual de códigos en Redis
│   ├── listar_donadores.py     # Auditoría de códigos y dispositivos en Redis
│   └── entregar_codigo.py      # Asignación interactiva de códigos desde lista_codigos.csv
└── boveda/                      # Bóveda de documentación en formato Obsidian
```

---

## ⚙️ Variables de Entorno Requeridas

Configuradas en `.env.local` (local) y en el Dashboard de Vercel (*Settings → Environment Variables*):

```env
# Cloudflare R2 (Almacenamiento de archivos PDF y EPUB)
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<tu_access_key_id>
R2_SECRET_ACCESS_KEY=<tu_secret_access_key>
R2_BUCKET_NAME=biblioteca-digital

# Redis Cloud / Upstash (Códigos, sesiones y ranking)
REDIS_URL=redis://default:<password>@<host>:<port>

# Seguridad: Firma de cookies de donadores (HMAC-SHA256)
DONOR_COOKIE_SECRET=<cadena_secreta_minimo_32_caracteres>

# Inteligencia Artificial
DEEPSEEK_API_KEY=<tu_api_key_de_deepseek>
```

---

## 🚀 Flujo de Despliegue en Producción

Cualquier cambio confirmado en la rama `main` despliega automáticamente a producción mediante la integración continua de Vercel:

```bash
git add .
git commit -m "feat/fix: descripción del cambio"
git push origin main
```
