# AGENT.md — Guía para Agentes de IA

## Descripción del Proyecto

**Libractiva** es una plataforma digital de lectura interactiva con un catálogo de más de 2,800 obras clásicas, novelas y ensayos. Combina un catálogo estático con un recomendador impulsado por IA (DeepSeek v4 Flash) y un modelo de monetización de pago único (Lifetime Deal) de $100 MXN.

**URL de producción:** `https://biblioteca-digital-eight.vercel.app/`

---

## Stack Tecnológico

- **Frontend:** Vanilla HTML5, CSS3, JavaScript ES6+ (sin frameworks). Todo el filtrado, búsqueda y navegación ocurre en el cliente en memoria.
- **Backend:** Funciones serverless en Vercel (Node.js 20.x).
- **Almacenamiento de PDFs/EPUBs:** Cloudflare R2 Object Storage (~35 GB).
- **Base de datos de accesos:** Redis Cloud (validación de códigos y dispositivos).
- **IA:** DeepSeek v4 Flash (recomendador personalizado).
- **Lector de PDF:** PDF.js (Mozilla), renderizado en `<canvas>`.
- **Iconografía:** Lucide Icons.
- **PWA:** Service Worker + manifest.json para instalación standalone.
- **Despliegue:** Vercel (CI/CD automático desde GitHub, rama `main`).

### Tipografía
- **Cormorant Garamond:** Marca/logotipo.
- **Playfair Display:** Títulos.
- **DM Sans:** Cuerpo.
- **EB Garamond:** Citas literarias.

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
├── style.css               # Estilos globales y variables CSS
├── app.js                  # Motor del frontend: búsqueda, paginación, lector, filtros
├── libros.json             # Catálogo estático (~2,800 registros, ~1.36 MB) — NO LEER
├── colecciones.json        # 9 packs temáticos curados
├── agregar_libro.py        # Script para carga unitaria de libros
├── generar_portadas.py     # Extracción de portadas WebP desde PDFs
├── lucide.min.js           # Librería de iconos vectoriales
├── sw.js                   # Service Worker (PWA, caché offline)
├── manifest.json           # Manifiesto PWA
├── robots.txt / sitemap.xml # SEO
├── vercel.json             # Configuración de despliegue Vercel + CORS
├── package.json            # Dependencias Node y scripts npm
├── portadas/               # Imágenes WebP optimizadas (~2,850 archivos) — NO LEER
├── api/                    # Funciones serverless (Vercel)
│   ├── recomendar.js       # Recomendador IA (DeepSeek v4 Flash)
│   ├── leer.js             # URLs firmadas de Cloudflare R2 (5-10 min expiración)
│   └── validar-codigo.js   # Validación de códigos de acceso con Redis
├── scripts/                # Scripts de mantenimiento y automatización
│   ├── normalizar.js       # Node.js: normalización de géneros, títulos y autores
│   ├── agregar_nuevos_libros.py   # Carga masiva interactiva de PDFs
│   ├── mapear_pdfs.py             # Mapea PDFs locales a libros.json
│   ├── mapear_epubs.py            # Mapea EPUBs locales a libros.json
│   ├── limpiar_duplicados_y_autores.py
│   ├── limpiar_duplicados_avanzados.py
│   ├── fusionar_residuales.py
│   ├── actualizar_anios.py
│   ├── extraer_portadas_faltantes.py
│   ├── agregar_donador.py   # [Ignorado en Git] Administra códigos en Redis
│   ├── listar_donadores.py  # [Ignorado en Git] Lista códigos activos
│   └── eliminar_donador.py  # [Ignorado en Git] Elimina códigos de Redis
└── boveda/                  # Documentación (Bóveda de Obsidian)
```

---

## REGLAS CRÍTICAS — LEE ANTES DE TRABAJAR

### 1. NUNCA leas `libros.json` ni la carpeta `portadas/`
- `libros.json` pesa ~1.36 MB y contiene ~2,800 registros. Leerlo completo consume ~250,000 tokens y satura el contexto.
- `portadas/` contiene ~2,850 archivos WebP binarios. No aportan valor para entender o modificar el código.
- Si necesitas información sobre un libro específico, pide al usuario que te proporcione el ID o los datos relevantes.

### 2. No rompas los filtros del frontend
- Los géneros en `libros.json` deben coincidir con los ~25 géneros estándar definidos en el sistema de normalización.
- Los filtros se renderizan dinámicamente desde el catálogo en memoria.

### 3. Modo oscuro
- Se controla con el atributo `data-theme="dark"` en `<html>`.
- Las variables CSS cambian dinámicamente. El estado persiste en `localStorage` bajo la clave `tema`.

### 4. Rutas SPA con hashes
- La navegación usa rutas hash: `#/libro/{id}`.
- Los detalles de libro se muestran en un modal que actualiza el hash.

### 5. SEO dinámico
- `app.js` inyecta etiquetas JSON-LD `schema.org` en `<head>` según la página activa.

---

## Arquitectura de la API (Backend Serverless)

### `api/recomendar.js`
- Recibe un POST con el perfil del lector (estado de ánimo, tiempo, objetivo, tema).
- Consulta a DeepSeek v4 Flash con el catálogo compacto en el System Message (formato `id|título|autor|género`).
- Usa **Prompt Caching** (prefix caching) para ahorrar ~90% en costos de tokens.
- Devuelve 3 recomendaciones en JSON con IDs y razones.
- Implementa un ciclo de reintento con temperatura reducida si la respuesta no es JSON válido.

### `api/leer.js`
- Genera URLs firmadas (presigned) de Cloudflare R2.
- Expiración: 5 min para lectura, 10 min para descarga.
- Requiere cookie `donor_token` válida para descargas.

### `api/validar-codigo.js`
- Valida códigos de acceso contra Redis Cloud.
- Genera un fingerprint SHA-256 del dispositivo (User-Agent + Accept-Language + IP).
- Máximo 3 dispositivos por código.
- Emite cookie `donor_token` firmada con HMAC-SHA-256.

---

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `DEEPSEEK_API_KEY` | Clave de API de DeepSeek |
| `R2_ENDPOINT` | Endpoint S3 de Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Token de acceso S3 para R2 |
| `R2_SECRET_ACCESS_KEY` | Clave secreta S3 para R2 |
| `R2_BUCKET_NAME` | Nombre del bucket (ej: `biblioteca-digital`) |
| `REDIS_URL` | URL de conexión a Redis Cloud |
| `DONOR_COOKIE_SECRET` | Cadena secreta para firmar cookies (mín. 32 chars) |

En local, usar `.env.local` o `.env`. Vercel dev las carga automáticamente.

---

## Desarrollo Local

```bash
# Instalar Vercel CLI globalmente
sudo npm install -g vercel

# Iniciar servidor de desarrollo (emula serverless + estáticos)
vercel dev
# o
npm run dev
```

Esto levanta un servidor local (usualmente `http://localhost:3000`) que sirve archivos estáticos y expone `/api/*`.

---

## Despliegue

El flujo es automático: `git push origin main` → Vercel detecta el cambio → redespliega en ~1 minuto.

```bash
git add <archivos>
git commit -m "tipo: descripción del cambio"
git push origin main
```

### Tipos de commit recomendados
- `feat:` para nuevas funcionalidades.
- `fix:` para correcciones de bugs.
- `style:` para cambios de CSS/visual.
- `docs:` para documentación.
- `refactor:` para refactorizaciones.

---

## Gestión del Catálogo

### Estructura de un libro en `libros.json`
```json
{
  "id": 2848,
  "titulo": "Nombre del Libro",
  "autor": "Apellido, Nombre",
  "anio": 2024,
  "genero": "Novela",
  "descripcion": "Sinopsis breve.",
  "pdf": "https://drive.google.com/file/d/XXXX/preview",
  "portada": "portadas/2848.webp",
  "archivo_pdf": "A/Autor, Nombre/Libro - Autor.pdf"
}
```

### Estructura de una colección en `colecciones.json`
```json
{
  "id": "evitar-burnout",
  "titulo": "Ficción para escapar del burnout: Novelas terapéuticas",
  "portada_pack": "portadas/pack-burnout.webp",
  "libros": [2896, 2346, 1988]
}
```

### Libros Destacados
La lista de destacados se configura en `app.js` con la constante `LIBROS_DESTACADOS_IDS` (máximo 10 IDs). Se muestra en la home como carrusel aleatorio (Fisher-Yates) y se oculta automáticamente al buscar o filtrar.

---

## Scripts de Mantenimiento

| Comando | Propósito |
|---|---|
| `python3 scripts/agregar_nuevos_libros.py` | Carga masiva interactiva de PDFs |
| `python3 scripts/mapear_epubs.py` | Asocia EPUBs al catálogo |
| `python3 scripts/limpiar_duplicados_y_autores.py` | Limpieza básica de autores y duplicados |
| `python3 scripts/limpiar_duplicados_avanzados.py` | Fusión avanzada de duplicados |
| `node scripts/normalizar.js` | Vista previa de normalización (sin cambios) |
| `node scripts/normalizar.js --apply` | Aplica normalización (crea backup automático) |
| `python3 scripts/extraer_portadas_faltantes.py` | Genera portadas WebP faltantes |
| `python3 generar_portadas.py` | Genera portadas desde PDFs (requiere poppler-utils + imagemagick) |
| `rclone copy /home/daniel/biblioteca-digital/ cloudflare:biblioteca-digital/ --progress` | Sincroniza archivos con Cloudflare R2 (incremental) |

---

## Reglas de Estilo y Arquitectura

1. **Sin frameworks:** Todo el frontend es Vanilla JS. No introduzcas React, Vue u otros frameworks.
2. **SPA con hashes:** La navegación usa `#/ruta`. No uses History API ni rutas tradicionales.
3. **CSS con variables:** Los colores y estilos se definen con CSS Custom Properties. Respeta la paleta existente.
4. **Modo oscuro:** Usa `data-theme="dark"` en `<html>` y define variables alternativas en CSS.
5. **Accesibilidad WCAG AA/AAA:** Mantén contraste óptimo en modo claro y oscuro.
6. **Responsivo:** Todos los componentes deben adaptarse a móvil.
7. **Serverless:** Las APIs en `api/` son funciones independientes de Vercel. No compartas estado entre invocaciones.
8. **UTF-8 sin BOM:** Todos los archivos JSON y de código deben ser UTF-8.
9. **Separadores UNIX:** Las rutas en `archivo_pdf` usan `/` (no `\`).

---

## Modelo de Negocio (Contexto)

- **Precio:** $100 MXN, pago único (Lifetime Deal).
- **Procesador de pagos:** Mercado Pago (`https://mpago.la/1Ek1HPz`).
- **Flujo:** Usuario paga → admin genera código → se registra en Redis → se entrega al usuario.
- **Restricciones para no-donadores:** Lectura limitada a 15 páginas, sin descargas.
- **Límite:** 3 dispositivos simultáneos por código.

---

## Documentación Completa

Toda la documentación detallada del proyecto está en la carpeta `boveda/`:

- `boveda/00 - Inicio.md` — Mapa de contenido principal.
- `boveda/resumen_ejecutivo.md` — Visión ejecutiva consolidada.
- `boveda/01 - Guías de Operación/` — Procedimientos operativos (agregar libros, portadas, normalización, despliegue, Git, accesos, colecciones, destacados, uso con IA).
- `boveda/02 - Arquitectura Técnica/` — Stack, estructura de datos, APIs, rendimiento.
- `boveda/03 - Identidad y Marca/` — Marca, modelo de negocio, copywriting.
