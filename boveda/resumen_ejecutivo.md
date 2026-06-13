# 🧠 Resumen Ejecutivo — Libractiva

Este documento proporciona una visión general ejecutiva de **Libractiva**, consolidando su identidad de marca, el diseño y justificación de su logotipo, la arquitectura de software y las decisiones de diseño clave del proyecto.

---

## 💡 1. Descripción del Proyecto

**Libractiva** (anteriormente conocido durante la fase de transición como *Libros en Acción*) es una plataforma digital de lectura interactiva que redefine la relación tradicional entre el lector y el libro digital. El proyecto combina un catálogo de más de 2,800 obras clásicas, novelas y ensayos con capacidades de inteligencia artificial de última generación.

### Propósito y Misión
La misión de Libractiva es transformar una biblioteca digital estática en una **experiencia literaria dinámica y viva**. A través de un recomendador personalizado impulsado por IA y una interfaz de usuario optimizada para la lectura, los textos dejan de ser planos para interactuar activamente con el perfil, intereses y estado de ánimo del lector.

---

## 🎨 2. Identidad y Marca

La identidad corporativa de Libractiva ha sido diseñada para reflejar la confluencia entre **tradición literaria** y **tecnología moderna**.

### Naming (Estrategia de Nomenclatura)
El nombre **Libractiva** es un neologismo eufónico y memorable resultante de la fusión directa de dos conceptos:
$$\text{Libro} + \text{Activa / Acción}$$

*   **Fonética:** Tiene un ritmo silábico (*Li-brac-ti-va*) fuerte y fluido, idóneo para el mercado hispanohablante.
*   **Memorabilidad:** Asocia inmediatamente la lectura tradicional con la interactividad de la era de la inteligencia artificial.
*   **Posicionamiento SEO:** Al ser un término único e inventado, facilita la indexación rápida en motores de búsqueda, logrando un excelente posicionamiento orgánico con baja competencia de palabras clave.

### Paleta de Colores Corporativos
La marca se articula a través de tres paletas de color integradas:
*   **Paleta Primaria de Marca (Teal):** Representada por el Teal Profundo (`#1a5c50` / `#0e5254`) y Teal Medio (`#2a7b6a`), que transmiten sofisticación, calma y profundidad intelectual.
*   **Paleta de Acento (Dorado):** Compuesta por el Dorado (`#b8892a`) y Dorado Claro (`#d4a94a`), que evocan valor premium, calidez editorial e iluminación intelectual.
*   **Colores de Fondo (Neutrales):** Un tono Crema Cálido (`#f4ede4`) en modo claro y un Carbón Teal Oscuro (`#0f1a17`) en modo oscuro, combinando confort de lectura y estética de alta gama.

---

## 🖼️ 3. Descripción del Logotipo

El logotipo de Libractiva es una representación minimalista de su concepto de marca, diseñado bajo el principio de simplicidad elegante.

### Elementos Gráficos
*   **El Libro Abierto (Teal):** En la base, trazado con líneas limpias y seguras de color teal (`#0e5254`). Representa el conocimiento estructurado, la biblioteca tradicional y la base sólida de la lectura.
*   **La Estela Ascendente (Oro):** Una línea curva y dinámica que brota del pliegue central del libro y asciende hacia la parte superior derecha en color dorado (`#c69a55`). Simboliza el dinamismo, el viaje de la lectura, la interactividad de la IA y el "cobrar vida" del contenido.
*   **La Estrella de Cuatro Puntas (Oro):** Corona la estela en el extremo superior derecho. Representa la chispa de la inteligencia artificial, la guía personalizada y la magia del descubrimiento literario.

### Optimización y Adaptabilidad
El logotipo ha sido limpiado digitalmente a nivel de píxel (eliminando todo ruido de compresión JPEG y texturas de fondo no deseadas) y se almacena en el repositorio en tres variantes principales:
1.  **Visualización Web (`logo_display.png`):** Un archivo PNG de 200x200 píxeles, optimizado mediante remuestreo **LANCZOS** para renderizarse con perfecta suavidad en pantallas Retina y de alta densidad.
2.  **Versión HD Fondo Blanco (`logo_clean_white.png`):** Imagen de 1100x1100 píxeles, diseñada con una proporción de padding del 30% a los extremos laterales y del 46% verticales, lo que garantiza que la ilustración de formato horizontal quepa entera dentro de insignias circulares (`border-radius: 50%`) en CSS sin que sus esquinas sufran recortes (clipping).
3.  **Versión HD Transparente (`logo_clean_transparent.png`):** Imagen con canal alfa variable para anti-aliasing sobre cualquier color de fondo, idónea para material promocional y de marca.
4.  **Favicons y Recursos PWA:** Versiones de tamaño optimizado (`favicon.ico` multilote, PWA `icon-192x192.png`, `icon-512x512.png` y `apple-touch-icon.png`) que se despliegan en las pestañas del navegador y pantallas de inicio de dispositivos móviles.

---

## ⚙️ 4. Arquitectura y Stack Tecnológico

Libractiva está estructurada bajo una filosofía de **simplicidad técnica máxima en el cliente** y **servicios distribuidos en la nube** (serverless).

### Stack de Software
*   **Frontend (Cliente):** 
    *   **Vanilla Stack (HTML5, CSS3, ES6+ JS):** Sin frameworks pesados (como React o Vue). Todo el filtrado, búsqueda y navegación se realiza de manera instantánea del lado del cliente en memoria.
    *   **PDF.js (Mozilla):** Lector nativo integrado para renderizar los libros directamente en la página web mediante `<canvas>` HTML5 con controles responsivos adaptados a móviles.
    *   **Lucide Icons:** Iconografía vectorial interactiva.
*   **Backend (Serverless en Vercel):**
    *   `api/recomendar.js`: Integra consultas seguras a la API de **DeepSeek v4 Flash** para procesar los perfiles e intereses del lector y retornar recomendaciones.
    *   `api/leer.js`: Genera enlaces firmados y seguros de corta expiración para proteger y distribuir los archivos del catálogo en formato PDF y EPUB.
    *   `api/validar-codigo.js`: Controla las sesiones y límites de dispositivos asociados a códigos de acceso lifetime.
*   **Almacenamiento y Datos:**
    *   **Cloudflare R2 Object Storage:** Almacena el repositorio completo de archivos PDF y EPUB (más de 35 GB) de la biblioteca.
    *   **Redis Cloud:** Base de datos en memoria para la validación ultrarrápida de códigos y dispositivos.
    *   **Catálogo Estático (`libros.json`):** Catálogo completo (~2,800 registros, 1.36 MB) descargado en la primera visita del cliente para garantizar búsquedas inmediatas en local.

---

## 🌟 5. Características Clave y Diferenciadores

1.  **Recomendador Mágico por IA:** Encuesta dinámica sobre gustos y estados de ánimo del lector que consulta a la IA para entregar sugerencias personalizadas, presentadas en un modal de diseño envolvente.
2.  **Lector Embebido e Instantáneo y Descarga de EPUB:** Permite la lectura directa de PDFs sin salir de la plataforma y ofrece la descarga directa de libros optimizados para e-readers (como Kindle) en formato EPUB y PDF de alta calidad para usuarios con acceso activo.
3.  **Rutas Compartibles (SPA con Hashes):** Navegación fluida a través de rutas `#` (ej. `#/libro/123`), permitiendo enlaces directos para SEO e indexación dinámica sin pérdida de rendimiento.
4.  **PWA de Alto Rendimiento:** Registro de Manifiesto PWA para permitir la instalación de Libractiva como aplicación nativa standalone en dispositivos móviles y ordenadores con soporte offline básico.
5.  **Accesibilidad Triple A:** Contraste tipográfico optimizado para modo claro y oscuro, cumpliendo estrictamente con la norma **WCAG AA** de legibilidad en interfaces y **WCAG AAA** en textos de contenido.
6.  **Acceso Lifetime Exclusivo (LTD):** Un modelo de pago único de $100 MXN que desbloquea descargas completas de archivos, impresión directa y lectura ilimitada web de todo el catálogo, eliminando la fricción de lectura.
