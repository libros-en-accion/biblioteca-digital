---
tipo: arquitectura
area: tecnica
tags: [arquitectura, directorios, archivos, estructura, libractiva]
fecha: 2026-06-15
---

# 📁 Arquitectura: Estructura del Proyecto

Este documento detalla el mapa de archivos y directorios del repositorio de **Libractiva** y la responsabilidad técnica de cada elemento.

---

## 🌳 Árbol de Directorios

```text
biblioteca/
├── index.html              # Interfaz de usuario principal (HTML5)
├── style.css               # Estilos globales y variables de diseño (CSS3)
├── app.js                  # Lógica del cliente, lector PDF.js y eventos
├── style.css               # Estilos globales y variables de diseño (CSS3)
├── libros.json             # Catálogo completo en formato JSON (Base de datos estática)
├── colecciones.json        # Definición de packs temáticos curados
├── agregar_libro.py        # Script Python para catalogar libros (unitario, con rclone)
├── generar_portadas.py     # Script Python para extraer portadas desde PDFs
├── lucide.min.js           # Librería de iconos vectoriales Lucide
├── sw.js                   # Service Worker para caché offline (PWA)
├── manifest.json           # Manifiesto PWA para instalación standalone
├── robots.txt              # Instrucciones para crawlers y buscadores (SEO)
├── sitemap.xml             # Mapa del sitio para indexación en buscadores (SEO)
├── logo_display.png        # Logotipo 200x200px para web (LANCZOS)
├── logo_clean_white.png    # Logotipo HD 1100x1100px fondo blanco
├── logo_clean_transparent.png # Logotipo HD con canal alfa transparente
├── nuevo_logo.jpg          # Recurso gráfico: Logotipo oficial de la marca
├── portada-libractiva.jpeg # Recurso gráfico: Imagen de portada de la plataforma
├── favicon.ico             # Favicon multilote
├── favicon-16x16.png       # Favicon 16px
├── favicon-32x32.png       # Favicon 32px
├── icon-192x192.png        # Icono PWA 192px
├── icon-512x512.png        # Icono PWA 512px
├── apple-touch-icon.png    # Icono para iOS/Safari
├── portadas/               # Directorio con imágenes WebP optimizadas (miniaturas)
│   ├── 1.webp
│   └── ...
├── api/                    # Código ejecutado en el servidor (Vercel Serverless)
│   ├── recomendar.js       # Integración con la API de DeepSeek v4 Flash
│   ├── leer.js             # Generador de URLs firmadas de Cloudflare R2
│   └── validar-codigo.js   # Validador de códigos de acceso con Upstash Redis / Vercel KV
├── scripts/                # Scripts auxiliares y de mantenimiento
│   ├── normalizar.js       # Node.js: normalización de catálogo (géneros, títulos, autores)
│   ├── agregar_nuevos_libros.py  # Python: carga masiva interactiva de PDFs
│   ├── mapear_pdfs.py      # Python: mapea PDFs locales a libros.json
│   ├── mapear_epubs.py     # Python: mapea EPUBs locales a libros.json
│   ├── limpiar_duplicados_y_autores.py # Python: limpia autores y duplicados básicos
│   ├── limpiar_duplicados_avanzados.py # Python: fusión avanzada de duplicados
│   ├── fusionar_residuales.py    # Python: fusiona pares duplicados específicos
│   ├── actualizar_anios.py       # Python: actualiza años de publicación
│   ├── extraer_portadas_faltantes.py # Python: genera portadas para libros sin ellas
│   ├── entregar_codigo.py  # [Local/Ignorado] Asignador local en CSV y registro en Upstash
│   ├── estado_codigos.py   # [Local/Ignorado] Resumen de estadísticas de códigos y últimas entregas
│   ├── agregar_donador.py  # [Local/Ignorado] Crea códigos en Upstash Redis
│   ├── listar_donadores.py # [Local/Ignorado] Lista códigos activos en Upstash Redis
│   └── eliminar_donador.py # [Local/Ignorado] Elimina códigos de Upstash Redis
├── boveda/                 # Este Cerebro Digital (Bóveda de Obsidian)
│   ├── 00 - Inicio.md      # Nota de bienvenida y MOC principal
│   ├── resumen_ejecutivo.md # Visión ejecutiva consolidada del proyecto
│   ├── 01 - Guías de Operación/ # Procedimientos estándar de catálogo y sistemas
│   ├── 02 - Arquitectura Técnica/ # Notas sobre stack de desarrollo y rendimiento
│   └── 03 - Identidad y Marca/ # Nota sobre la estrategia de marca Libractiva
├── vercel.json             # Configuración de despliegue y CORS en Vercel
├── package.json            # Scripts NPM y dependencias del proyecto (Node)
└── .gitignore              # Archivos y carpetas excluidos del control de versiones
```

---

## 📝 Responsabilidad de Componentes

### 1. Núcleo de la Aplicación Web (Frontend)
*   **`index.html`**: Define la estructura semántica de la SPA. Contiene el buscador, el menú de tags, el catálogo, el carrusel de destacados, las colecciones, el visor de PDF.js (`#modalLector`), y el modal para ingresar el código de acceso.
*   **`style.css`**: CSS modular con variables de diseño. Implementa tipografía Cormorant Garamond (marca), Playfair Display (títulos), DM Sans (cuerpo) y EB Garamond (literaria). Incluye el visor de PDF.js con adaptabilidad a móviles, modo oscuro, y la ventana de bloqueo de lectura (con efecto esmerilado blur).
*   **`app.js`**: El motor del frontend. Realiza búsquedas e indexación local, controla la paginación (24 libros por página), gestiona el estado del lector (limitador de 15 páginas para no-donadores), renderiza el carrusel de destacados (Fisher-Yates shuffle de 10 libros), las colecciones curadas, el recomendador IA multi-paso (con límite de **3 consultas gratuitas** para usuarios sin código), el botón "Sorpréndeme" (libro aleatorio), el sistema de **marcadores de página** (Kindle-style, solo para usuarios con código, `localStorage`:`libractiva_marcadores`) y el guardado de **progreso de lectura** (`localStorage`:`libractiva_progreso`).
*   **`lucide.min.js`**: Librería de iconos vectoriales usada en toda la interfaz.
*   **`sw.js`**: Service Worker que cachea recursos estáticos y datos (libros.json, colecciones.json) para soporte offline. Estrategia network-first para datos, cache-first para assets.

### 2. Base de Datos e Imágenes
*   **`libros.json`**: Catálogo completo (~2,800 registros) con metadatos y rutas a archivos en R2.
*   **`colecciones.json`**: Definición de los 9 packs temáticos curados con sus IDs de libros asociados.
*   **`portadas/`**: Imágenes WebP optimizadas (~15-25 KB c/u, 300px ancho) de las portadas de los libros y packs.

### 3. Procesamiento en el Servidor (Backend APIs)
*   **`api/recomendar.js`**: Consulta al modelo de recomendación de IA.
*   **`api/leer.js`**: Autentica si el usuario pide descargar y genera una URL firmada de Cloudflare R2 (expiración de 5 a 10 min).
*   **`api/validar-codigo.js`**: Verifica códigos de donadores contra la base de datos de Redis y asocia hasta 3 fingerprints de navegadores.

### 4. Automatización y Mantenimiento (Herramientas)
*   **`agregar_libro.py`**: Interfaz Python para carga unitaria de libros con integración rclone (descarga desde Google Drive), generación automática de portada y git push opcional.
*   **`generar_portadas.py`**: Extrae portadas desde PDFs locales mediante pdftoppm + ImageMagick (WebP, 300px, calidad 65%).
*   **`scripts/agregar_nuevos_libros.py`**: Carga masiva interactiva — escanea PDFs huérfanos en `~/biblioteca-digital/` y pregunta metadatos por consola.
*   **`scripts/mapear_pdfs.py`**: Asocia archivos PDF en `~/biblioteca-digital/` a entradas del catálogo por coincidencia título/autor.
*   **`scripts/mapear_epubs.py`**: Igual que el anterior pero para EPUBs en `~/biblioteca-digital/001_EPUB/`.
*   **`scripts/limpiar_duplicados_y_autores.py`**: Limpia sufijos en nombres de autor y fusiona duplicados por (título, autor).
*   **`scripts/limpiar_duplicados_avanzados.py`**: Fusión avanzada de duplicados transfiriendo archivos al registro con mejores metadatos.
*   **`scripts/fusionar_residuales.py`**: Fusiona pares duplicados específicos (Moby Dick, Discurso del Método, Frankenstein, etc.).
*   **`scripts/actualizar_anios.py`**: Actualiza años de publicación para libros específicos usando un mapa hardcodeado.
*   **`scripts/extraer_portadas_faltantes.py`**: Genera portadas WebP para todos los libros con campo `portada` vacío.
*   **`scripts/normalizar.js`**: Node.js — unifica ~278 géneros en ~25 canónicos, limpia títulos y autores.
*   **`scripts/entregar_codigo.py` / `scripts/estado_codigos.py` / `agregar_donador.py` / `listar_donadores.py` / `eliminar_donador.py`**: Scripts para la administración y consulta de códigos de acceso en local y en Upstash Redis. Ignorados en Git por seguridad.

### 5. Documentación y Estrategia (Bóveda)
*   **`boveda/`**: Bóveda de Obsidian estructurada con MOC (`00 - Inicio.md`), Resumen Ejecutivo, Guías de Operación (`01/`), notas de Arquitectura Técnica (`02/`) y Estrategia de Naming e Identidad (`03/`).

### 6. SEO, PWA y Configuración
*   **`manifest.json`**: Manifiesto PWA para instalación standalone (name: "Libractiva — Biblioteca Digital Inteligente").
*   **`sw.js`**: Service Worker con estrategia network-first para datos y cache-first para assets estáticos.
*   **`robots.txt`**: Permite indexación de `/`, bloquea `/api/` y `/scripts/`.
*   **`sitemap.xml`**: Mapa de sitio con entrada única para la raíz.
*   **`vercel.json`**: Configuración de despliegue Vercel 2.0 con CORS para rutas `/api/*`.
*   **`package.json`**: Dependencias Node (@aws-sdk, redis, @vercel/kv) y scripts npm.
*   **`.gitignore`**: Exclusión de backups, .env, node_modules y scripts de administración de donadores.

---
**Notas Relacionadas:**
*   [[Arquitectura - Vista General|Vista general del stack de software]]
*   [[Guía - Despliegue en Vercel|Cómo emular y desplegar el proyecto]]
*   [[Marca - Libractiva|Estrategia de marca e identidad visual]]
