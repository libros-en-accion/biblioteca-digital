---
tipo: arquitectura
area: tecnica
tags: [arquitectura, vanilla-js, css, frontend, html]
fecha: 2026-05-30
---

# ⚙️ Arquitectura: Vista General

Este documento describe la estructura arquitectónica general y las decisiones de diseño del sistema para la **Biblioteca Digital**.

---

## 🎨 Diseño Conceptual

El proyecto está diseñado bajo una filosofía de **simplicidad técnica máxima en el cliente** y una **estética visual editorial premium**. Utiliza tecnologías puras de la web (Vanilla stack) para garantizar rapidez, mantenibilidad y nulas dependencias pesadas.

```mermaid
graph TD
    User([Lector]) <--> HTML[index.html & style.css]
    HTML <--> JS[app.js]
    JS <--> Cache[LocalStorage - Tema/Vistas]
    JS <--> Data[libros.json - Catálogo Local]
    JS <--> Serverless[api/recomendar.js]
    Serverless <--> DS[DeepSeek v4 API]

    style User fill:#7a1a2e,stroke:#b8892a,stroke-width:2px,color:#fff
    style HTML fill:#2c1810,stroke:#8a7060,color:#fff
    style JS fill:#2c1810,stroke:#8a7060,color:#fff
    style Serverless fill:#b8892a,stroke:#2c1810,color:#000
```

---

## 📦 Stack Tecnológico

### 1. Frontend (Cliente)
*   **HTML5 Semántico:** Estructura modular e interfaces accesibles (modales, buscador, filtros, paginación).
*   **Vanilla CSS3 (Variables Custom):** Estilos basados en un sistema de diseño estricto (vino, dorado, crema). Soporta transiciones suaves de color y un modo oscuro con la propiedad `data-theme`.
*   **Vanilla JavaScript (ES6+):** Lógica del lado del cliente sin frameworks (React/Vue). Se encarga de:
    *   Cargar y procesar el archivo `libros.json` de 1.1 MB mediante `fetch`.
    *   Filtrar los libros en tiempo real mediante búsqueda por palabras clave normalizadas.
    *   Navegar mediante rutas de hash (`#/libro/{id}`).
    *   Controlar la paginación y renderizar las tarjetas.
*   **Lucide Icons:** Iconografía moderna inyectada dinámicamente usando la biblioteca externa de Lucide.

### 2. Backend (Servicios Serverless)
*   **Vercel Serverless Functions:** Permite ejecutar código del lado del servidor de forma económica. El recomendador IA está construido en Node.js (`api/recomendar.js`).
*   **Node.js 20.x:** Entorno de ejecución en la nube para la API del recomendador.

### 3. Inteligencia Artificial
*   **DeepSeek v4 Flash:** API remota consultada mediante peticiones POST seguras para procesar perfiles de lectura y emitir recomendaciones.

---

## 💡 Decisiones de Diseño Clave

### 1. Carga Completa del Catálogo en el Cliente
*   **Decisión:** El catálogo de ~2,843 libros está almacenado en un solo JSON estático (`libros.json`). La aplicación lo descarga por completo al iniciar la web y realiza las búsquedas directamente en memoria en la computadora del usuario.
*   **Pros:** Búsquedas instantáneas, nulo costo de base de datos, arquitectura ultra simple.
*   **Contras:** La carga inicial requiere descargar ~1.1 MB (que se reduce a ~300 KB con compresión gzip en Vercel), lo cual puede tardar algunos segundos en conexiones móviles lentas.

### 2. Modo Oscuro Nativo
*   El tema se controla agregando el atributo `data-theme="dark"` al elemento raíz `<html>`. Las variables CSS cambian dinámicamente y el estado se almacena en el `localStorage` del cliente bajo la clave `tema` para persistir la preferencia en siguientes visitas.

### 3. Rutas Hash (`#/libro/{id}`)
*   Para evitar redireccionamientos y no perder la velocidad de una Single Page Application (SPA), la apertura de los detalles del libro se realiza con un modal que actualiza el hash de la URL. Esto permite a los usuarios compartir enlaces directos a obras específicas de la colección.

---

## 🔍 SEO e Indexación
Para asegurar que los motores de búsqueda indexen correctamente el sitio:
*   **JSON-LD SEO Dinámico:** El script `app.js` inyecta etiquetas de metadatos `schema.org` estructuradas en el `<head>` dependiendo de la página o libro activo.
*   **Sitemap y Robots:** Archivos estáticos en la raíz que guían a los buscadores a indexar la página principal bloqueando los scripts internos del backend.

---
**Notas Relacionadas:**
*   [[Arquitectura - Estructura del Proyecto|Estructura de archivos y carpetas]]
*   [[Arquitectura - API de Recomendación|Lógica del recomendador inteligente]]
*   [[Arquitectura - Estructura de Datos|Diseño de libros.json]]
