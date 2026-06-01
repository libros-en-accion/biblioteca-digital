---
tipo: arquitectura
area: tecnica
tags: [arquitectura, directorios, archivos, estructura]
fecha: 2026-05-30
---

# 📁 Arquitectura: Estructura del Proyecto

Este documento detalla el mapa de archivos y directorios del repositorio de la **Biblioteca Digital** y la responsabilidad técnica de cada elemento.

---

## 🌳 Árbol de Directorios

```text
biblioteca/
├── index.html              # Interfaz de usuario principal (HTML5)
├── style.css               # Estilos globales y variables de diseño (CSS3)
├── app.js                  # Lógica del cliente, lector PDF.js y eventos
├── libros.json             # Catálogo completo en formato JSON (Base de datos estática)
├── agregar_libro.py        # Script automatizado en Python para catalogar libros
├── generar_portadas.py     # Script en Python para extraer portadas desde PDFs
├── portadas/               # Directorio con imágenes WebP optimizadas (miniaturas)
│   ├── 1.webp
│   └── ...
├── api/                    # Código ejecutado en el servidor (Vercel Serverless)
│   ├── recomendar.js       # Integración con la API de DeepSeek v4 Flash
│   ├── leer.js             # Generador de URLs firmadas de Cloudflare R2
│   └── validar-codigo.js   # Validador de códigos de donadores con Redis Cloud
├── scripts/                # Scripts auxiliares y de mantenimiento
│   ├── normalizar.js       # Script de Node.js para normalización de catálogo
│   ├── mapear_pdfs.py      # Mapeador de PDFs locales a libros.json
│   ├── agregar_donador.py  # [Local/Ignorado] Crea códigos en la DB Redis
│   ├── listar_donadores.py  # [Local/Ignorado] Lista códigos activos en la DB
│   └── eliminar_donador.py # [Local/Ignorado] Elimina códigos de la DB
├── boveda/                 # Este Cerebro Digital (Bóveda de Obsidian)
├── vercel.json             # Configuración de despliegue y CORS en Vercel
├── package.json            # Scripts NPM y dependencias del proyecto (Node)
├── robots.txt              # Instrucciones para crawlers y buscadores (SEO)
├── sitemap.xml             # Mapa del sitio para indexación en buscadores (SEO)
└── .gitignore              # Archivos y carpetas excluidos del control de versiones
```

---

## 📝 Responsabilidad de Componentes

### 1. Núcleo de la Aplicación Web (Frontend)
*   **`index.html`**: Define la estructura semántica de la SPA. Contiene el buscador, el menú de tags, el catálogo, el visor de PDF.js (`#modalLector`), y el modal para ingresar el código de donador.
*   **`style.css`**: CSS modular con variables de diseño. Implementa el visor de PDF.js con adaptabilidad a móviles y la ventana de bloqueo de lectura (con efecto esmerilado blur) y botón de cierre.
*   **`app.js`**: El motor del frontend. Realiza búsquedas e indexación local, controla la paginación, gestiona el estado del lector (límitador de 15 páginas para no-donadores) e interactúa con las APIs de Vercel.

### 2. Base de Datos e Imágenes
*   **`libros.json`**: Almacena el catálogo con la ruta del PDF en R2 en el campo `"archivo_pdf"`.
*   **`portadas/`**: Imágenes WebP optimizadas de las portadas de los libros.

### 3. Procesamiento en el Servidor (Backend APIs)
*   **`api/recomendar.js`**: Consulta al modelo de recomendación de IA.
*   **`api/leer.js`**: Autentica si el usuario pide descargar y genera una URL firmada de Cloudflare R2 (expiración de 5 a 10 min).
*   **`api/validar-codigo.js`**: Verifica códigos de donadores contra la base de datos de Redis y asocia hasta 3 fingerprints de navegadores.

### 4. Automatización y Mantenimiento (Herramientas)
*   **`agregar_libro.py`**: Interfaz interactiva en Python para registrar libros nuevos.
*   **`generar_portadas.py`**: Automatización de la extracción de imágenes desde los PDFs.
*   **`scripts/mapear_pdfs.py`**: Python script que recorre la colección local de PDFs y mapea sus rutas a `libros.json`.
*   **`scripts/agregar_donador.py` / `listar_donadores.py` / `eliminar_donador.py`**: Scripts en Python para administrar los códigos de donador directo desde la terminal local conectándose por TCP sockets a Redis Cloud. Ignorados en Git por seguridad.

---
**Notas Relacionadas:**
*   [[Arquitectura - Vista General|Vista general del stack de software]]
*   [[Guía - Despliegue en Vercel|Cómo emular y desplegar el proyecto]]
