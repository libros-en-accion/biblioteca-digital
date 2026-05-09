# 🔍 Auditoría UX/UI — Biblioteca Digital

> Análisis experto de diseño, usabilidad y experiencia de producto.
> Fecha: 2026-05-08 · Sitio: biblioteca-digital-eight.vercel.app

---

## 1. Resumen Ejecutivo

La Biblioteca Digital es un catálogo de **2,847 libros** en vanilla HTML/CSS/JS con recomendador IA (DeepSeek). Tiene una estética editorial elegante y un stack técnico limpio. Sin embargo, presenta **problemas críticos** en calidad de datos, rendimiento, descubrimiento de contenido y experiencia móvil que la alejan mucho de los estándares de bibliotecas digitales profesionales.

---

## 2. Capturas del Sitio

````carousel
![Vista principal con buscador, filtros y grid de libros](/home/daniel/.gemini/antigravity/brain/f1ddd1f0-bbb5-4820-8d83-1f1a4c3fb703/homepage_view.png)
<!-- slide -->
![Búsqueda "Borges" — 57 resultados filtrados correctamente](/home/daniel/.gemini/antigravity/brain/f1ddd1f0-bbb5-4820-8d83-1f1a4c3fb703/search_borges.png)
<!-- slide -->
![Filtro Ciencia Ficción activado — 270 libros](/home/daniel/.gemini/antigravity/brain/f1ddd1f0-bbb5-4820-8d83-1f1a4c3fb703/filter_scifi.png)
<!-- slide -->
![Tarjetas de libro en vista móvil](/home/daniel/.gemini/antigravity/brain/f1ddd1f0-bbb5-4820-8d83-1f1a4c3fb703/card_view.png)
<!-- slide -->
![Modal de detalle de libro](/home/daniel/.gemini/antigravity/brain/f1ddd1f0-bbb5-4820-8d83-1f1a4c3fb703/book_detail_modal.png)
<!-- slide -->
![Vista móvil 375px](/home/daniel/.gemini/antigravity/brain/f1ddd1f0-bbb5-4820-8d83-1f1a4c3fb703/mobile_view.png)
````

---

## 3. Evaluación del Diseño Visual

### 3.1 Paleta de Colores

| Elemento | Color | Observación |
|---|---|---|
| Fondo principal | `#f4ede4` (crema) | Cálido, evoca papel viejo. ✅ |
| Header | `#1a0f08` → `#0f0804` | Oscuro elegante, buen contraste. ✅ |
| Acento primario (vino) | `#7a1a2e` | Clásico, coherente con la temática. ✅ |
| Dorado | `#b8892a` / `#d4a94a` | Refuerza la estética de biblioteca antigua. ✅ |
| Texto principal | `#2c1810` | Buen contraste sobre crema. ✅ |
| Texto suave | `#8a7060` | ⚠️ Ratio de contraste ~3.5:1 sobre `#f4ede4` — **falla WCAG AA** para texto normal |

**Modo oscuro**: Existe y funciona, con variables CSS bien implementadas. Los colores se adaptan correctamente.

**Veredicto**: La paleta es coherente y con personalidad. El problema principal es el contraste del texto secundario (`--texto-suave`) que es insuficiente para accesibilidad.

### 3.2 Tipografía

| Fuente | Uso | Observación |
|---|---|---|
| Playfair Display | Títulos, h1, nombres de libros | Serif display, elegante para títulos. ✅ |
| EB Garamond | Cuerpo, botones, inputs | Legible a tamaños pequeños. ✅ |
| Cormorant Garamond | Subtítulos, labels decorativos | Muy fina (weight 300) — difícil de leer en cuerpo. ⚠️ |

**Problema**: Se usan **3 familias serif** lo que genera inconsistencia sutil. EB Garamond y Cormorant Garamond compiten visualmente. Lo estándar es usar máximo 2 familias (una display + una de cuerpo).

### 3.3 Jerarquía Visual y Espaciado

- **Header**: Ocupa mucho espacio vertical (~350px) antes de llegar al contenido útil. El subtexto decorativo (`⟡ Colección Literaria ⟡`) y la frase literaria aleatoria son ruido visual.
- **Sección IA**: Segundo bloque grande (~200px) antes de llegar a los libros. El usuario necesita **scrollear ~550px** para ver el primer libro.
- **Grid de libros**: `minmax(230px, 1fr)` funciona bien en desktop (4 columnas en 1400px). En móvil baja a 2 columnas `minmax(160px, 1fr)` ✅.
- **Tarjetas**: Buen espaciado interno (1.3rem padding). El `aspect-ratio: 3/4` en portadas es correcto para libros.

> [!WARNING]
> **Problema grave de jerarquía**: El contenido más importante (los libros) está enterrado debajo de ~550px de decoración. En Libby, Open Library y Google Books, el contenido principal aparece **above the fold**.

### 3.4 Consistencia Visual

- Los badges de género tienen **13 colores diferenciados** por clase CSS — excelente sistema de color-coding. ✅
- La línea decorativa dorada en el top de cada tarjeta (`::before`) es un buen detalle sutil. ✅
- **Inconsistencia**: Los emojis (📚, 🔍, 🎲, 📄, ✦) se mezclan con ornamentos tipográficos Unicode (`⟡`, `✦`, `✕`). Esto genera una estética fragmentada.

---

## 4. Experiencia de Búsqueda y Descubrimiento

### 4.1 Buscador

| Aspecto | Estado | Nota |
|---|---|---|
| Búsqueda por título | ✅ Funciona | Busca "Borges" → 57 resultados |
| Búsqueda por autor | ✅ Funciona | Normaliza acentos correctamente |
| Búsqueda por género | ✅ Funciona | Busca en campo `genero` |
| Búsqueda por año | ✅ Funciona | Busca como string |
| Debounce | ✅ 250ms | Evita búsquedas excesivas |
| Botón limpiar | ✅ Aparece al escribir | UX correcta |
| Búsqueda multi-término | ✅ Funciona | "borges ficcion" filtra por ambos |

**Problema**: No hay búsqueda avanzada. No se puede buscar `autor:"Borges" genero:"Cuento"` con operadores. Para 2,847 libros esto es una limitación real.

### 4.2 Filtros

| Filtro | Disponible | Nota |
|---|---|---|
| Por género | ✅ Tags horizontales | Solo muestra géneros con ≥10 libros (17 de 23) |
| Por autor | ❌ | No existe |
| Por año/década | ❌ | No existe |
| Por idioma | ❌ | No existe (pero todo parece ser español) |
| Por formato | ❌ | No aplica (todo es PDF) |
| Combinación filtro + búsqueda | ✅ | Funciona correctamente |

**Problema crítico**: Los filtros de tags solo muestran géneros con ≥10 libros. **6 géneros están ocultos** (Religión y Teología: 4, Literatura latinoamericana: 1, etc.). No hay forma de acceder a ellos excepto buscando.

### 4.3 Ordenamiento

5 opciones disponibles: Título A→Z/Z→A, Autor A→Z, Más recientes, Más antiguos. **Falta**: ordenar por popularidad, por relevancia de búsqueda, o "recién agregados".

### 4.4 Paginación

24 libros por página, con botones numéricos + elipsis. Funciona correctamente. **Problema**: no hay opción de cambiar el número de resultados por página, ni vista alternativa (lista vs grid).

---

## 5. Página de Detalle (Modal)

El detalle de libro se abre como un **modal overlay** en lugar de una página propia. Esto tiene consecuencias graves:

| Aspecto | Estado | Problema |
|---|---|---|
| URL propia | ❌ | No hay URL por libro. Imposible compartir, guardar en favoritos, o indexar en Google. |
| Portada en modal | ✅ | Se muestra a 180px de ancho (baja resolución) |
| Título | ✅ | Pero **incluye el nombre del autor en el título** (ej: "Contar La Plata-maximiliano Alvarez") |
| Autor | ✅ | Formato "Apellido, Nombre" — no natural para lectura |
| Año | ✅ | "Publicado en 2017" — formato legible |
| Descripción | ✅ | 1-2 oraciones, suficiente |
| Género (badge) | ✅ | Color-coded, correcto |
| Link al PDF | ✅ | "Abrir documento" → Google Drive preview |
| Libros similares | ✅ | 4 libros aleatorios del mismo género. Grid 2×2. |
| ISBN / Páginas / Editorial | ❌ | No hay metadatos bibliográficos |
| Valoraciones / Reseñas | ❌ | No existe |
| Botón "Leer ahora" embebido | ❌ | Solo redirige a Google Drive |

> [!CAUTION]
> **Sin URLs por libro = invisible para SEO**. Google no puede indexar ningún libro individual. Open Library, Google Books y Standard Ebooks tienen URLs canónicas por obra (`/books/OL12345M`). Esto es fundamental para descubrimiento orgánico.

---

## 6. Problemas de Datos del Catálogo

El análisis del archivo `libros.json` (1.5 MB) revela:

### 6.1 Títulos con artefactos de nombre de archivo

Los títulos contienen el nombre del autor pegado con guiones, como si vinieran del nombre del archivo PDF:
- `"Contar La Plata-maximiliano Alvarez"` → debería ser `"Contar la plata"`
- `"Meditaciones Gredos - Marco Aurelio Antonino Augusto"` → debería ser `"Meditaciones"`
- `"Mujercitas-Alcott Louisa May"` → debería ser `"Mujercitas"`

Esto afecta tanto al display visual (en las tarjetas el título se ve redundante con el autor) como a la búsqueda.

### 6.2 Portadas de baja resolución

**2,837 de 2,837 portadas** usan parámetro `s220` de Google Drive, lo que limita a **220px de ancho**. En pantallas retina (2x) esto se ve pixelado. Cambiar a `s400` o `s512` mejoraría dramáticamente la calidad visual sin impacto significativo en ancho de banda (lazy loading ya está implementado).

### 6.3 Datos faltantes

| Campo | Faltantes | % |
|---|---|---|
| Portada | 10 | 0.35% ✅ |
| Descripción | 0 | 0% ✅ |
| Autor | 0 | 0% ✅ |
| Año | **220** | **7.7%** ⚠️ |

### 6.4 Archivo JSON de 1.5 MB descargado en cada visita

El cliente descarga **todo el catálogo** (1.5 MB) al cargar la página. No hay paginación server-side, caché, ni compresión gzip explícita (Vercel la aplica automáticamente, pero el parse sigue siendo costoso).

---

## 7. Rendimiento y Técnica

| Aspecto | Estado | Nota |
|---|---|---|
| JSON de 1.5 MB | ⚠️ | Se descarga completo. En 3G tarda ~8-10s |
| Lazy loading imágenes | ✅ | `loading="lazy"` en todas las portadas |
| Framework | ✅ Vanilla JS | Sin dependencias, bundle mínimo |
| Animaciones | ✅ CSS | `aparecer` con delay escalonado. Sutil y performante |
| Font loading | ⚠️ | 3 Google Fonts con múltiples weights = ~150KB extra |
| Service Worker / PWA | ❌ | No hay soporte offline |
| `libros.json` incluye `.bak` files en repo | ⚠️ | 3 backups de ~1-2 MB cada uno en producción |

---

## 8. Accesibilidad

| Criterio | Estado |
|---|---|
| `lang="es"` en HTML | ✅ |
| `aria-label` en botones icónicos | ✅ (botón tema, cerrar, limpiar) |
| Alt text en portadas | ⚠️ Usa el título (con artefactos) |
| Contraste texto suave | ❌ Falla WCAG AA (~3.5:1) |
| Navegación por teclado | ⚠️ Tab funciona pero no hay `focus-visible` styling global |
| Skip to content | ❌ No existe |
| Roles ARIA en modal | ❌ Falta `role="dialog"`, `aria-modal="true"` |
| Focus trap en modal | ❌ El focus no queda atrapado en el modal |

---

## 9. Comparativa con Competidores

| Feature | Biblioteca Digital | Open Library | Libby/OverDrive | Standard Ebooks | Google Books |
|---|---|---|---|---|---|
| URL por libro | ❌ Modal | ✅ `/works/OL123` | ✅ Deep link | ✅ `/ebooks/...` | ✅ `/books?id=...` |
| Portadas HD | ❌ 220px | ✅ Multiple sizes | ✅ HD | ✅ SVG covers | ✅ Multiple |
| Lector embebido | ❌ Google Drive | ✅ Online reader | ✅ In-app reader | ✅ EPUB online | ✅ Google reader |
| Metadatos ricos | ❌ Básicos | ✅ ISBN, páginas, editorial | ✅ Completos | ✅ + tabla de contenidos | ✅ Completos |
| Búsqueda avanzada | ❌ Solo texto libre | ✅ Faceted search | ✅ Faceted | ✅ Por categoría | ✅ Avanzada |
| Listas / Estantes | ❌ | ✅ Reading lists | ✅ Tags, holds | ❌ | ✅ My Library |
| API pública | ❌ | ✅ REST API | ❌ | ❌ | ✅ Books API |
| Mobile app | ❌ | ✅ | ✅ Native | ❌ | ✅ |
| SEO por libro | ❌ | ✅ Schema.org | N/A | ✅ | ✅ |
| Recomendador IA | ✅ Único | ❌ | ❌ | ❌ | ✅ (básico) |

### Lo que hacen bien los competidores y aquí falta:

1. **Open Library**: Cada libro tiene una página completa con ediciones, portadas en múltiples tamaños, datos del autor como página separada, y listas de lectura del usuario.
2. **Libby**: UX de descubrimiento excepcional — carruseles por tema, "libros populares esta semana", sistema de préstamo con fechas claras.
3. **Standard Ebooks**: Portadas generadas con patrones SVG (nunca faltan), tipografía cuidada, EPUB/KEPUB descargable directamente.
4. **Google Books**: Snippet preview, información bibliográfica exhaustiva, reseñas de usuarios, y buy/borrow links.

---

## 10. Recomendaciones Priorizadas

### 🔴 Alta Urgencia (impacto inmediato)

| # | Problema | Recomendación | Esfuerzo |
|---|---|---|---|
| 1 | **Títulos con artefactos** | Limpiar `libros.json`: separar título real del nombre de autor que viene pegado con `-` o ` - `. Script de normalización. | Medio |
| 2 | **Portadas 220px pixeladas** | Cambiar `s220` → `s440` en todas las URLs de portada. Un `sed` de una línea. | Bajo |
| 3 | **Header de 550px** | Reducir header a ~200px. Mover o colapsar la sección IA. Los libros deben estar visible sin scroll. | Bajo |
| 4 | **Sin URL por libro** | Implementar rutas con hash (`#/libro/123`) o query params. Mínimo necesario para compartir y SEO. | Medio |
| 5 | **1.5 MB de JSON en cada carga** | Implementar paginación server-side con Vercel serverless, o al menos cargar un subset inicial y paginar via API. | Alto |
| 6 | **Formato autor "Apellido, Nombre"** | Invertir a "Nombre Apellido" para lectura natural. Guardar ambos formatos en el JSON. | Bajo |

### 🟡 Media Urgencia (mejora significativa)

| # | Problema | Recomendación | Esfuerzo |
|---|---|---|---|
| 7 | **Sin filtro por autor** | Agregar dropdown o autocomplete de autores más frecuentes | Medio |
| 8 | **Sin filtro por década/periodo** | Agregar slider o tags de décadas (1800s, 1900-1950, 1950-2000, 2000+) | Medio |
| 9 | **Contraste texto suave** | Cambiar `--texto-suave` de `#8a7060` → `#6a5a48` para cumplir WCAG AA (4.5:1) | Bajo |
| 10 | **3 tipografías serif** | Eliminar Cormorant Garamond. Usar solo Playfair (display) + EB Garamond (cuerpo) | Bajo |
| 11 | **Sin lector embebido** | Abrir PDFs en un iframe modal en lugar de redirigir a Google Drive | Medio |
| 12 | **Emojis inconsistentes** | Reemplazar emojis nativos por iconos SVG (Lucide, Heroicons) para consistencia cross-platform | Medio |
| 13 | **Sin Schema.org** | Agregar JSON-LD `Book` schema para cada libro visible en la página | Medio |
| 14 | **Modal sin ARIA** | Agregar `role="dialog"`, `aria-modal="true"`, focus trap | Bajo |
| 15 | **Géneros ocultos (6)** | Mostrar todos los géneros en los tags, o agregar un botón "Más géneros..." | Bajo |

### 🟢 Baja Urgencia (polish)

| # | Problema | Recomendación | Esfuerzo |
|---|---|---|---|
| 16 | Sin vista de lista | Agregar toggle grid/lista para usuarios que prefieren escanear títulos rápidamente | Medio |
| 17 | Sin historial/favoritos | localStorage para guardar libros visitados y favoritos | Medio |
| 18 | Sin estadísticas visibles | Mostrar stats del catálogo (géneros, autores top) en una sección visual | Medio |
| 19 | Sin skip-to-content | Agregar link oculto para usuarios de screen reader | Bajo |
| 20 | Backups en producción | Mover `*.bak` y `*.bak2` a `.gitignore` y eliminar del deploy | Bajo |
| 21 | Sin PWA | Agregar service worker para caché de portadas y catálogo offline | Alto |
| 22 | Frase literaria aleatoria | Ocupa espacio valioso sin añadir utilidad. Mover al footer o eliminar | Bajo |
| 23 | Sin breadcrumbs/navegación | Al aplicar un filtro, no queda claro cómo "volver" — agregar breadcrumb o indicador activo persistente | Bajo |
| 24 | 220 libros sin año | Completar metadatos faltantes en el JSON | Alto (investigación manual) |

---

## 11. Quick Wins (implementables en <1 hora)

1. **Portadas HD**: `sed -i 's/=s220/=s440/g' libros.json` — mejora visual inmediata y dramática.
2. **Contraste**: Cambiar un valor CSS (`--texto-suave: #6a5a48`).
3. **Header reducido**: Reducir padding de `.header-inner` de `4.5rem/3.5rem` → `2.5rem/2rem`.
4. **Eliminar backups del deploy**: Agregar `*.bak*` a `.gitignore`.
5. **Género ocultos**: Cambiar el filtro de `c >= 10` a `c >= 1` en `generarTagsFiltro()`.

---

## 12. Veredicto Final

**Lo bueno**: La estética editorial es genuinamente atractiva — la paleta vino/dorado/crema es coherente y evocadora. El recomendador IA es un diferenciador único que ningún competidor importante ofrece. El stack vanilla es una decisión técnica inteligente. La búsqueda full-text funciona correctamente.

**Lo crítico**: Los títulos sucios (con nombre de archivo), las portadas pixeladas, la ausencia de URLs por libro, y los 550px de decoración antes del contenido son problemas que degradan la experiencia de forma sustancial. Para un catálogo de casi 3,000 libros, la falta de filtros por autor, año, y la descarga de 1.5 MB de JSON son limitaciones serias.

**Posición competitiva**: Está significativamente por debajo de Open Library y Google Books en funcionalidad de descubrimiento, pero tiene una ventaja estética sobre Project Gutenberg y una feature única (recomendador IA) que ninguno ofrece. Con las mejoras de alta urgencia implementadas, podría ser una experiencia muy competitiva en su nicho.
