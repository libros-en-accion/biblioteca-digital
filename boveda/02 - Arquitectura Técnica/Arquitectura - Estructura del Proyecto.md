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
├── app.js                  # Lógica del cliente, búsqueda y paginación (JavaScript)
├── libros.json             # Catálogo completo en formato JSON (Base de datos estática)
├── catalogo.csv            # Exportación tabular del catálogo en formato CSV
├── agregar_libro.py        # Script automatizado en Python para catalogar libros
├── generar_portadas.py     # Script en Python para extraer portadas desde PDFs
├── portadas/               # Directorio con imágenes WebP optimizadas (miniaturas)
│   ├── 1.webp
│   ├── 2.webp
│   └── ...
├── api/                    # Código ejecutado en el servidor (Vercel Serverless)
│   └── recomendar.js       # Integración con la API de DeepSeek v4 Flash
├── scripts/                # Scripts auxiliares y de mantenimiento
│   └── normalizar.js       # Script de Node.js para normalización de catálogo
├── boveda/                 # Este Cerebro Digital (Bóveda de Obsidian)
├── vercel.json             # Configuración de despliegue para la nube de Vercel
├── package.json            # Scripts de ejecución NPM y metadatos de Node
├── robots.txt              # Instrucciones para crawlers y buscadores (SEO)
├── sitemap.xml             # Mapa del sitio para indexación en buscadores (SEO)
└── .gitignore              # Archivos y carpetas excluidos del control de versiones
```

---

## 📝 Responsabilidad de Componentes

### 1. Núcleo de la Aplicación Web (Frontend)
*   **`index.html`**: Define la estructura semántica de la SPA. Contiene el esqueleto del buscador, el menú de tags, el contenedor de la galería, y las estructuras de los modales de detalle y recomendador IA.
*   **`style.css`**: Contiene todo el diseño visual. Implementa un sistema de diseño con variables CSS (`--vino`, `--crema`, `--dorado`), animaciones de entrada fluidas, diseño adaptativo para móviles mediante CSS Grid/Flexbox y la redefinición de colores para el modo oscuro (`[data-theme="dark"]`).
*   **`app.js`**: El "motor" del frontend. Se encarga de descargar el catálogo al inicio, realizar búsquedas complejas en memoria, filtrar por género/autor/época, controlar la paginación de 24 libros por página, inyectar el SEO estructurado y manejar los eventos de los modales.

### 2. Base de Datos e Imágenes
*   **`libros.json`**: El archivo que almacena la información estructurada de los ~2,843 libros.
*   **`portadas/`**: Contiene las imágenes WebP de 300px generadas localmente. Alojar las portadas en el propio repositorio evita llamadas externas lentas y previene enlaces caídos de imágenes.

### 3. Procesamiento en el Servidor (Backend)
*   **`api/recomendar.js`**: Función serverless escrita en Node.js para Vercel. Procesa la encuesta del lector, lee el catálogo local desde el disco del servidor, realiza la consulta optimizada a DeepSeek y devuelve el resultado sanitizado.

### 4. Automatización y Mantenimiento (Herramientas)
*   **`agregar_libro.py`**: Utilidad escrita en Python que sirve de interfaz interactiva para añadir libros al catálogo sin cometer errores de formato.
*   **`generar_portadas.py`**: Utilidad que automatiza la extracción de imágenes desde los archivos PDF locales mediante `pdftoppm` e `ImageMagick`.
*   **`scripts/normalizar.js`**: Utilidad en Node.js que limpia los nombres y consolida la taxonomía de géneros literarios.

### 5. Configuración y SEO
*   **`package.json`**: Define los comandos de alias como `npm run dev` para iniciar el entorno local de Vercel.
*   **`vercel.json`**: Ajustes del despliegue en la plataforma de Vercel.
*   **`robots.txt` & `sitemap.xml`**: Archivos estándar de SEO para controlar la indexación en motores de búsqueda (ej. Google).

---
**Notas Relacionadas:**
*   [[Arquitectura - Vista General|Vista general del stack de software]]
*   [[Guía - Despliegue en Vercel|Cómo emular y desplegar el proyecto]]
