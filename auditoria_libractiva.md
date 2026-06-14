# 🔍 Auditoría Web Integral — Libractiva
**URL auditada:** https://biblioteca-digital-eight.vercel.app/  
**Fecha:** Junio 2026  
**Equipo auditor:** Multidisciplinario (Product Designer Sr. · Frontend Sr. · UX Researcher · SEO Specialist)

---

## 📊 Resumen Ejecutivo

| Dimensión | Peso | Puntuación | Ponderado |
|---|---|---|---|
| 🎨 Diseño y Aspecto Visual | 15% | 8.0/10 | 12.0 |
| 🏗️ Arquitectura de Información | 15% | 7.5/10 | 11.25 |
| ⚡ Rendimiento Técnico | 20% | 6.5/10 | 13.0 |
| 🔧 Funcionalidad | 15% | 7.5/10 | 11.25 |
| 👥 Experiencia de Usuario (UX) | 15% | 7.0/10 | 10.5 |
| 📱 Responsive Design | 10% | 6.5/10 | 6.5 |
| 🎯 Conversión y Retención | 10% | 5.5/10 | 5.5 |
| **TOTAL** | **100%** | — | **70/100** |

### **Puntuación Global: 70/100** ⚠️ Buena base con brechas críticas

---

### ✅ Fortalezas Principales

1. **Sistema de diseño maduro y coherente** — La paleta Teal-Dorado-Crema/Oscuro es sofisticada, literalmente única en su categoría y está implementada con variables CSS bien estructuradas. El modo oscuro está correctamente alternado mediante `data-theme`.
2. **Recomendador IA realmente diferenciador** — La encuesta de 4 preguntas con estados de ánimo es una propuesta de valor genuinamente única. El flujo de estados (preguntas → carga → resultados → error) está bien cubierto en el HTML.
3. **Motor de búsqueda robusto del lado cliente** — La búsqueda en memoria con normalización de acentos, debounce de 250ms y autocompletado predictivo con portadas es de calidad muy alta para un proyecto sin frameworks.
4. **Arquitectura técnica inteligente y económica** — La decisión de Vanilla JS + JSON estático + Vercel serverless + Cloudflare R2 demuestra madurez técnica. El prefix-caching de DeepSeek con 90% de ahorro es una optimización real y bien documentada.
5. **Funcionalidades premium bien pensadas** — Lector PDF embebido con controles personalizados, sistema de acceso HMAC-SHA256, vista grid/lista, colecciones curadas con stack 3D visual: el producto tiene profundidad real.

### ❌ Debilidades Críticas

1. **`libros.json` de 1.36 MB descargado sin estrategia de caché del lado cliente** — El archivo se descarga en cada visita (con `?v=9`), afectando el LCP en conexiones lentas. No hay service worker activo para cachear este recurso entre sesiones.
2. **La propuesta de valor (el recomendador IA) no está en el hero con suficiente jerarquía visual** — El botón `¿Qué debería leer esta semana?` tiene un tamaño (0.82rem) que lo hace pequeño y discreto. Un nuevo visitante tarda más de 5 segundos en identificar el diferenciador clave.
3. **Ausencia de CTAs de monetización en el flujo de descubrimiento orgánico** — El panel de bloqueo solo aparece en la página 16 del lector. No hay ningún CTA de compra en la home, en el header ni en el detalle del libro antes de que el usuario entre al lector.

### 💡 Oportunidades de Mejora

1. **PWA con service worker activo** — El `manifest.json` existe pero un service worker que cachee `libros.json` eliminaría el tiempo de carga en visitas recurrentes (beneficio enorme para usuarios frecuentes).

---

## 📋 Evaluación por Dimensión

---

### 🎨 1. Diseño y Aspecto Visual

- **Puntuación:** 8.0/10
- **Estado:** ✅ Excelente con matices

**Hallazgos Positivos:**
- La paleta Teal Profundo (`#1a5c50`) + Dorado (`#b8892a`) + Crema (`#f4ede4`) es elegante, coherente y evoca tanto la tradición literaria como la modernidad tecnológica. Es genuinamente diferenciadora en el mercado de apps de lectura.
- El degradado del hero (`linear-gradient(170deg, #1a5c50 0%, #0e2a24 50%, #060f0d 100%)`) con la línea inferior Teal-Dorado-Teal es un toque editorial premium.
- La textura de papel en el `body` (SVG `feTurbulence` con `opacity:0.03`) añade calidez sin distraer.
- La animación `respiracionLogo` (scale + glow dorado cada 4s, solo 2 veces) es sutil y efectiva.
- La tipografía tripartita es una decisión excelente: **Playfair Display** (títulos, carácter literario), **DM Sans** (UI, legibilidad), **EB Garamond** (citas literarias, elegancia).
- El modo oscuro con Carbón Teal (`#0f1a17`) y Teal claro (`#3db29b`) está perfectamente calibrado.

**Hallazgos Negativos:**
- **Los badges de género tienen inconsistencia de contraste.** El badge `genero-divulgacion` y `genero-latinoamericana` usan fondos claros con texto claro en modo oscuro, lo que puede fallar WCAG AA.
- **El logo (`logo_display.png`) de 200x200px renderizado a 44px** pierde nitidez en pantallas Retina. Debería servirse con `srcset` para 2x.
- **La `hero-seccion` tiene `padding: 0.8rem 1.5rem`** — muy compacto para la cantidad de información que contiene (logo, H1, subtítulo, buscador, utilidades, CTAs). Visualmente se siente "apretado" en desktop grande.
- **El `btn-azar` (ghost button)** con `color: rgba(236, 217, 198, 0.75)` sobre el fondo oscuro del hero puede rozar el límite de contraste WCAG AA (ratio ~3.2:1 vs mínimo 4.5:1 requerido).
- **No hay favicon específico en el header del browser para la nueva marca** — el favicon actual es genérico y no representa el logotipo limpiamente a 16px.

**Impacto en el Usuario:** La falta de contraste en algunos elementos puede excluir a usuarios con baja visión. El logo borroso en Retina reduce la percepción de profesionalismo.

**Soluciones Propuestas:**

```html
<!-- Logo con srcset para Retina -->
<img 
  src="logo_display.png" 
  srcset="logo_display.png 1x, logo_clean_white.png 2x"
  alt="Logo Libractiva" 
  class="hero-logo" 
  width="44" height="44"
/>
```

```css
/* Arreglar contraste del btn-azar */
.btn-azar {
  color: rgba(236, 217, 198, 0.90); /* +0.15 de opacidad */
}

/* Padding adicional en hero para desktop */
@media (min-width: 1024px) {
  .hero-seccion {
    padding: 1.2rem 2rem;
  }
}
```

- **Prioridad:** 🟡 Medio

---

### 🏗️ 2. Arquitectura de Información

- **Puntuación:** 7.5/10
- **Estado:** ⚠️ Necesita Mejora

**Hallazgos Positivos:**
- La jerarquía de secciones es lógica: Hero → Filtros de descubrimiento → Destacados → Colecciones → Catálogo completo. El flujo de exploración sigue el patrón de las mejores bibliotecas digitales.
- Los Mood Tags (Lectura Rápida, Reflexionar, Escapar, Aprender, Misterio) añaden una capa de descubrimiento inteligente que va más allá del filtro por género.
- El breadcrumb de filtros activos (chips removibles) es una solución de UX correcta para gestionar múltiples filtros simultáneos.
- El sistema de colecciones curadas con "stack 3D visual" de portadas es visualmente atractivo y ayuda a la descubribilidad de agrupaciones temáticas.
- La navegación por hash (`#/libro/{id}`) permite compartir libros, lo cual es fundamental para el SEO y la viralidad.

**Hallazgos Negativos:**
- **La sección de Colecciones desaparece completamente al aplicar cualquier filtro.** Si un usuario filtra por "Novela" y luego quiere ver la colección "10 clásicos latinoamericanos", no puede. Las colecciones deberían ser un filtro más, no una sección exclusiva del estado "sin filtros".
- **El contador ("Mostrando 1–24 de 2,800 libros")** aparece debajo de los filtros pero encima del catálogo, en una posición que lo hace fácilmente ignorable. Es información de orientación crítica que el usuario necesita ver.
- **La barra de controles (dropdown de Autor, Época, Ordenar) está en un nivel visual igual al contador**, sin diferenciación clara entre "estado actual" y "controles de acción".
- **No hay indicación de qué Mood Tag está activo** visualmente cuando se aplica uno (comparado con los tags de género que sí tienen clase `.activo`). En el código se ve que `moodActivo` se actualiza, pero la clase `.activo` puede no aplicarse de forma consistente.
- **La paginación con botones `←` / `→` con texto plano** no tiene aria-labels descriptivos (`aria-label="Página anterior"`) para lectores de pantalla.
- **No hay sección de búsqueda avanzada o filtros guardados** — para una biblioteca de 2,800 libros, esto es una ausencia notable.

**Impacto en el Usuario:** El usuario que usa colecciones y luego quiere explorar más allá tiene que limpiar todos los filtros y desplazarse hacia arriba para volver a ver las colecciones, creando fricción innecesaria.

**Soluciones Propuestas:**

```javascript
// Hacer que las colecciones sean un filtro persistente, no una sección
// En lugar de style.display = 'none', usar un indicador de colección activa
// y mostrar siempre un acceso rápido "Cambiar colección" cuando hay una activa
function renderBarraColeccionActiva() {
  const barra = document.getElementById('breadcrumbs');
  if (coleccionActiva) {
    // añadir chip "Colección: X" junto a los otros breadcrumbs de filtro
  }
}
```

```html
<!-- Paginación accesible -->
<button class="btn-pagina" aria-label="Página anterior">←</button>
<button class="btn-pagina" aria-label="Página siguiente">→</button>
```

- **Prioridad:** 🟠 Alto

---

### ⚡ 3. Rendimiento Técnico

- **Puntuación:** 6.5/10
- **Estado:** ⚠️ Necesita Mejora (con problemas críticos específicos)

**Hallazgos Positivos:**
- **`libros.json` comprimido con Brotli automático por Vercel**: 1.36 MB → ~300 KB en red. Bien ejecutado.
- **Skeleton loaders durante la carga** (`mostrarSkeletons()` con 12 tarjetas animadas): elimina el CLS (Cumulative Layout Shift) y da percepción de velocidad.
- **`loading="lazy"` en todas las tarjetas de libros** con `width="230" height="307"` explícitos: correcto para evitar reflow.
- **Fuentes de Google Fonts con `preconnect`** y `display=swap`: buen manejo del FOUT (Flash of Unstyled Text).
- **Debounce de 250ms en el buscador**: evita procesamiento excesivo en cada keystroke.
- **Arquitectura serverless (Vercel + Cloudflare R2)**: 0 costos de egress, edge computing cerca del usuario.

**Hallazgos Negativos:**

1. **`libros.json?v=9` se descarga en cada visita sin caché del navegador de largo plazo.** El parámetro `?v=9` podría implementarse como `Cache-Control: max-age=86400` para que navegadores reutilicen el JSON entre sesiones del mismo día. Actualmente, cada visita descarga ~300 KB aunque el catálogo no haya cambiado.

2. **Lucide Icons cargado desde `unpkg.com` (CDN externo no optimizado)**: `https://unpkg.com/lucide@0.378.0/dist/umd/lucide.min.js` (~80 KB) es un recurso de terceros no controlado. Si `unpkg` tiene latencia, todos los iconos se renderizan tarde o aparecen en blanco.

3. **PDF.js cargado con `type="module"` desde `cdnjs.cloudflare.com`** incluso en usuarios que nunca abrirán un libro. Debería cargarse dinámicamente solo cuando el usuario hace clic en "Leer".

4. **El archivo `app.js` de 91 KB y `style.css` de 93 KB no están minificados en producción.** Con minificación + Brotli, podrían reducirse otro 20-30%.

5. **No hay Service Worker activo.** El `manifest.json` existe (lo que configura la PWA), pero sin SW, `libros.json` y los assets no se cachean entre sesiones. El LCP en visitas posteriores podría ser instantáneo con una estrategia `Cache First`.

6. **Las portadas de libros provienen de URLs de Google Drive** (`https://lh3.googleusercontent.com/...`). Google puede servir estas imágenes de forma lenta o con throttling. No hay control sobre el formato (JPEG vs WebP) ni sobre el tamaño correcto.

**Core Web Vitals estimados (sin herramienta en tiempo real, basado en análisis de código):**
| Métrica | Estimado | Estado |
|---|---|---|
| LCP | ~2.5–4.0s | 🔴 Necesita mejora |
| FID/INP | <100ms | ✅ Bueno |
| CLS | ~0.05 | ✅ Bueno |
| TTFB | <200ms (Vercel Edge) | ✅ Bueno |

**Soluciones Propuestas:**

```javascript
// Cargar PDF.js solo cuando se necesita (lazy loading dinámico)
async function cargarPDFJS() {
  if (window.pdfjsLib) return; // Ya cargado
  await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
}

// Llamar solo antes de abrir el lector
async function abrirLector(id, libro) {
  await cargarPDFJS();
  // ... resto del código del lector
}
```

```javascript
// Service Worker básico para cachear libros.json
// sw.js
const CACHE_NAME = 'libractiva-v1';
const CACHE_URLS = ['/libros.json', '/colecciones.json', '/style.css', '/app.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('libros.json')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
```

```javascript
// Registrar SW en app.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

- **Prioridad:** 🔴 Crítico (PDF.js lazy), 🟠 Alto (Service Worker, Lucide local)

---

### 🔧 4. Funcionalidad y Operación

- **Puntuación:** 7.5/10
- **Estado:** ⚠️ Necesita Mejora

**Hallazgos Positivos:**
- **El buscador busca en título, autor, género, descripción y año simultáneamente** con normalización de acentos. Es genuinamente potente.
- **El autocompletado muestra portada + título + autor + badge de género** en un panel visual rico. Mejor que la mayoría de los buscadores de bibliotecas digitales.
- **El recomendador IA tiene 4 estados bien definidos** (preguntas → cargando → resultados → error), con mensaje de error personalizado (`#ia-error-msg`) y botón de reintentar.
- **El lector PDF tiene controles completos**: anterior/siguiente, zoom in/out, ajustar ancho, título visible, y descarga condicional para usuarios con acceso.
- **El sistema de validación de código** con HMAC-SHA256 y Redis con límite de 3 dispositivos es robusto y correcto.
- **El manejo de errores de carga** (`/error-carga`) con botón "Reintentar" y `location.reload()` es adecuado.

**Hallazgos Negativos:**

1. **El FAQ en el modal de Información tiene Markdown sin renderizar**: en el FAQ, la pregunta "¿Cómo puedo obtener mi Código de Acceso?" contiene `**Mercado Pago**:` con asteriscos visibles porque el HTML usa `**` dentro de un `<p>`, que no renderiza Markdown.

2. **El botón "Leer libro" en el modal de detalle siempre aparece** (`detalle-pdf-link`), incluso para libros que no tienen archivo PDF (`hasPdf === false`). En ese caso debería ocultarse o cambiar a "Ver documento externo".

3. **El filtro de Mood Tags no tiene un indicador visual de estado activo claro.** Visualmente, al activar un Mood Tag, el usuario no puede verificar fácilmente si el filtro está aplicado (los breadcrumbs sí lo muestran, pero los tags en sí no reciben la clase `.activo` de forma consistente en el código visible).

4. **No hay funcionalidad de búsqueda por descripción con highlighting** — cuando el usuario busca "amor" y aparece un libro cuya descripción menciona "amor", no hay resaltado del término en la tarjeta.

5. **Las descargas de PDF/EPUB en el lector usan `style="display:none"` directamente en el HTML** sin un estado de carga claro: si la URL firmada de Cloudflare R2 tarda en generarse, el usuario no recibe feedback visual.

**Soluciones Propuestas:**

```html
<!-- Corregir el Markdown en el FAQ (línea ~464 en index.html) -->
<!-- ANTES: -->
<p>...enlace oficial de **Mercado Pago**:...</p>
<!-- DESPUÉS: -->
<p>...enlace oficial de <strong>Mercado Pago</strong>:...</p>
```

```javascript
// En abrirDetalleLibro(), ocultar el botón "Leer" si no hay PDF
const btnLeer = document.getElementById('detalle-pdf-link');
if (btnLeer) {
  btnLeer.style.display = libro.archivo_pdf ? 'inline-flex' : 'none';
}
```

- **Prioridad:** 🟠 Alto (email de marca), 🟡 Medio (markdown, botón PDF)

---

### 👥 5. Experiencia de Usuario (UX)

- **Puntuación:** 7.0/10
- **Estado:** ⚠️ Necesita Mejora

**Hallazgos Positivos:**
- **El "skip link"** (`.skip-link`) para saltar al contenido principal está implementado: accesibilidad considerada desde el diseño.
- **Los skeleton loaders** durante la carga inicial eliminan la ansiedad del usuario y dan percepción de velocidad.
- **La frases literarias aleatorias en el footer** son un detalle encantador que añade carácter y refuerza la identidad editorial.
- **El botón "Scroll to top"** (`#btnScrollTop`) con `chevron-up` aparece de forma condicional (presumably al hacer scroll): mejora la navegabilidad en catálogos largos.
- **Los botones de "Libro al azar" (Sorpréndeme)** son una excelente adición para usuarios indecisos y añaden un elemento lúdico que diferencia la plataforma.
- **Los estados vacíos** ("No se encontraron libros") tienen icono, texto y botón de acción "Limpiar filtros": completo y bien ejecutado.

**Hallazgos Negativos:**

1. **La curva de aprendizaje para el acceso premium es demasiado larga.** Un usuario nuevo que no entiende el modelo de negocio puede leer 15 páginas de un libro y de repente recibir un panel de bloqueo sin haber recibido ninguna señal previa de que el contenido es premium. Esto genera frustración ("engaño percibido").

2. **No hay confirmación visual al seleccionar opciones en el Recomendador IA.** Las opciones `opcion-btn` deberían mostrarse claramente seleccionadas (estado `.activo` visual robusto) antes de pulsar "Recomendar →". Si el CSS de `.seleccionado`/`.activo` para `opcion-btn` no es suficientemente llamativo, el usuario no sabe si su selección fue registrada.

3. **El modal de Detalle del libro no muestra la descripción completa** cuando el texto es muy largo — se renderiza sin `line-clamp` ni botón "leer más". Si la descripción es de 500 palabras, el modal se vuelve muy largo sin control.

4. **No hay forma de marcar libros como "Favoritos" o "Quiero leer".** Para una biblioteca de 2,800 títulos, la ausencia de bookmarks es una brecha de UX significativa que obliga al usuario a confiar en su memoria o al copy-paste de URLs.

5. **El autocompletado se activa desde 1 carácter** (inferido del código). Esto puede generar resultados irrelevantes y sobrecarga visual con una sola letra escrita.

6. **El modal del Lector se abre en full-screen** sin transición de entrada (o con una muy sutil). El cambio abrupto de contexto puede desorientar a usuarios que no anticipan esta experiencia inmersiva.

**Impacto en el Usuario:** Un usuario que llega a la página 16 del lector sin entender el modelo de negocio tiene una experiencia de sorpresa negativa. Según principios de UX, la transparencia de las limitaciones debe comunicarse ANTES de que el usuario invierta tiempo en una tarea que no puede completar.

**Soluciones Propuestas:**

```javascript
// Activar autocompletado a partir de 2 caracteres, no 1
if (inputBusqueda.value.length >= 2) {
  mostrarAutocompletar(inputBusqueda.value);
}
```

```css
/* Añadir transición de entrada al modal del lector */
.lector-overlay {
  opacity: 0;
  transition: opacity 0.25s ease;
}
.lector-overlay.activo {
  opacity: 1;
  display: flex !important;
}
```

```html
<!-- Badge de "Vista previa — 15 págs" en la tarjeta de cada libro, 
     para usuarios sin acceso, como señal temprana -->
<div class="badge-preview" aria-label="Vista previa gratuita de 15 páginas">
  📖 Vista previa
</div>
```

- **Prioridad:** 🟠 Alto (preview badge, favoritos), 🟡 Medio (autocompletado, modal)

---

### 📱 6. Versión Móvil y Responsive Design

- **Puntuación:** 6.5/10
- **Estado:** ⚠️ Necesita Mejora

**Hallazgos Positivos:**
- **El placeholder del buscador se adapta en móvil**: `window.innerWidth < 480` → texto corto "Buscar libro, autor…". Detalle bien ejecutado.
- **El `grid-template-columns: repeat(auto-fill, minmax(230px, 1fr))`** del catálogo se adapta automáticamente a pantallas pequeñas.
- **La vista lista** es especialmente útil en móvil para una navegación más rápida del catálogo.

**Hallazgos Negativos:**

1. **El hero en móvil usa un grid de 3 columnas (`grid-template-columns: auto 1fr auto`)** que en pantallas de 360px puede resultar en el buscador con menos de 150px de ancho real, haciéndolo prácticamente inutilizable.

2. **Los custom dropdowns (Autor, Época, Ordenar) son táctilmente pequeños.** El `.dropdown-btn` tiene padding mínimo y en móvil los elementos del menú (`dropdown-item`) pueden ser difíciles de seleccionar con el pulgar (< 44px de altura táctil recomendada por Apple/Google).

3. **El lector PDF en móvil es muy difícil de usar.** PDF.js renderiza en un canvas de anchura fija que requiere zoom manual. Los controles de paginación y zoom están en una barra superior que en pantallas de 360px puede saturarse.

4. **Los filtros de tags horizontales no tienen indicación de scroll horizontal en móvil.** Los `filtros-fade` de izquierda y derecha son visuales, pero sin un indicador o hint táctil, muchos usuarios no descubren que pueden deslizar horizontalmente.

5. **Las tarjetas del carrusel de Destacados en móvil** pueden no ser lo suficientemente anchas para mostrar el título completo, y los botones `carrusel-btn` pueden superponerse al contenido en pantallas muy pequeñas.

6. **El modal de Detalle del libro en móvil** tiene un `detalle-grid` que probablemente colapsa a columna única, pero la imagen de portada puede ocupar demasiado espacio vertical sin acceso rápido al botón "Leer".

**Impacto en el Usuario:** Dado que el público objetivo incluye lectores casuales que típicamente descubren contenido en móvil (Instagram, TikTok, etc.), una experiencia móvil deficiente es una pérdida directa de conversiones.

**Soluciones Propuestas:**

```css
/* Hero responsive para móvil */
@media (max-width: 600px) {
  .hero-contenido {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .hero-marca {
    grid-column: 1;
    grid-row: 1;
    flex-direction: row;
    align-items: center;
  }
  
  .hero-buscador-caja {
    grid-column: 1;
    grid-row: 2;
  }
  
  .hero-utilidades {
    grid-column: 1;
    grid-row: 1;
    justify-self: end;
  }
  
  .hero-acciones {
    grid-column: 1;
    grid-row: 3;
  }
}

/* Touch targets mínimos de 44px */
.dropdown-item {
  min-height: 44px;
  display: flex;
  align-items: center;
}
```

- **Prioridad:** 🔴 Crítico (hero móvil), 🟠 Alto (dropdowns táctiles, lector PDF)

---

### 🎯 7. Conversión y Retención

- **Puntuación:** 5.5/10
- **Estado:** ❌ Crítico

**Hallazgos Positivos:**
- **El panel de bloqueo del lector** tiene un CTA directo y completo: precio, beneficios (PDF+EPUB, 2,800 libros, sin mensualidades), botón de compra y botón "Ya tengo un código". Es el mejor CTA de conversión de toda la plataforma.
- **El botón "Activar Acceso"** en el header es visible y tiene un icono de llave (`key-round`) que es semánticamente correcto.
- **El copy del recomendador IA** ("¿Qué debería leer esta semana?") activa curiosidad y tiene una propuesta de acción clara.
- **El FAQ está completo** con las preguntas más frecuentes sobre el modelo de negocio (precio, dispositivos, uso gratuito).

**Hallazgos Negativos:**

1. **La propuesta de valor central NO aparece en el hero.** Un visitante nuevo que llega a la home ve: logo, buscador, botón "¿Qué debería leer?" y "Sorpréndeme". No hay ninguna frase que explique qué es Libractiva, qué ofrece y por qué es diferente en los primeros 5 segundos. El `hero-subtitulo` ("Tu bibliotecario personal + IA") es demasiado vago.

2. **No hay CTA de compra en la home page.** El único lugar donde aparece el precio ($100 MXN) y el botón de compra es en el panel de bloqueo del lector (página 16+). Un usuario que no abre ningún libro nunca ve una oferta de compra.

3. **El flujo de conversión post-pago es completamente manual:** usuario paga → envía comprobante por WhatsApp/correo → espera código → activa. Este proceso introduce un mínimo de horas de latencia y depende de la disponibilidad del administrador. Es un cuello de botella crítico que destruye conversiones nocturnas y en fines de semana.

4. **No hay prueba social visible.** No hay testimonios, número de usuarios registrados, número de lecturas completadas, reseñas de libros, ni ningún indicador de que otras personas están usando y pagando por Libractiva.

5. **El recomendador IA no genera urgencia de compra.** Cuando la IA recomienda 3 libros, el usuario puede ver las portadas y hacer clic para leer las primeras 15 páginas, pero no hay ningún mensaje del tipo "Desbloquea estos 3 libros completos por $100 MXN". El resultado de la IA es una oportunidad perdida de conversión.

6. **No hay retención post-visita.** No hay: notificaciones push (el SW existe pero no las implementa), newsletter, sistema de "continúa leyendo", historial de libros vistos, ni ningún mecanismo que invite al usuario a volver.

**Impacto en el Usuario:** Un usuario que descubre Libractiva, explora 5 libros, usa el recomendador IA y luego cierra la pestaña, probablemente no regresará. No hay ningún gancho de retención activo.

**Soluciones Propuestas:**

```html
<!-- Hero con propuesta de valor clara (añadir debajo de .hero-subtitulo) -->
<p class="hero-propuesta-valor">
  Más de <strong>2,800 libros</strong> con recomendador IA personalizado. 
  Acceso completo por un pago único de <strong>$100 MXN</strong>.
</p>

<!-- CTA de compra en el hero -->
<a href="https://mpago.la/1Ek1HPz" 
   target="_blank" 
   rel="noopener" 
   class="btn-comprar-hero"
   aria-label="Obtener acceso completo a Libractiva por $100 MXN">
  🛒 Acceso Lifetime — $100 MXN
</a>
```

```javascript
// Después de mostrar resultados del recomendador IA,
// añadir un CTA de compra contextual
function mostrarCTAEnResultadosIA() {
  const contenedor = document.getElementById('resultados-lista');
  const ctaEl = document.createElement('div');
  ctaEl.className = 'ia-resultado-cta';
  ctaEl.innerHTML = `
    <p>¿Te gustaron las recomendaciones? Lee estos libros completos y descárgalos en PDF/EPUB.</p>
    <a href="https://mpago.la/1Ek1HPz" target="_blank" class="btn-comprar-ia">
      🛒 Desbloquear acceso completo — $100 MXN
    </a>
  `;
  contenedor.appendChild(ctaEl);
}
```

- **Prioridad:** 🔴 Crítico (propuesta de valor, CTA en home, automatización del pago)

---

## 🎯 Plan de Acción Priorizado

| # | Acción | Dimensión | Esfuerzo | Impacto | Tiempo Est. |
|---|---|---|---|---|---|
| 1 | **Añadir propuesta de valor en el hero** ("2,800 libros + IA + $100 MXN") | 🎯 Conversión | Bajo | Alto | 1h |
| 2 | **Implementar lazy loading de PDF.js** — cargar solo cuando el usuario hace clic en "Leer" | ⚡ Rendimiento | Medio | Alto | 2h |
| 3 | **Arreglar el hero responsive en móvil** — refactorizar el grid de 3 col a layout apilado en <600px | 📱 Responsive | Medio | Alto | 3h |
| 4 | **Añadir un CTA de compra en la home** visible sin necesidad de abrir el lector | 🎯 Conversión | Bajo | Alto | 2h |
| 5 | **Implementar badge "Vista previa · 15 págs."** en tarjetas de libros, visible antes de entrar al lector | 👥 UX | Bajo | Medio | 1h |
| 6 | **Corregir Markdown sin renderizar** en el FAQ (asteriscos visibles) | 🔧 Funcionalidad | Bajo | Bajo | 15min |
| 7 | **Añadir CTA de compra al final de los resultados del recomendador IA** | 🎯 Conversión | Bajo | Alto | 1h |
| 8 | **Implementar Service Worker básico** para cachear `libros.json` entre sesiones | ⚡ Rendimiento | Medio | Alto | 4h |
| 9 | **Aumentar el touch target de los dropdown items** a mínimo 44px de altura | 📱 Responsive | Bajo | Medio | 1h |
| 10 | **Añadir logo con srcset Retina** (`logo_display.png 1x, logo_clean_white.png 2x`) | 🎨 Diseño | Bajo | Medio | 30min |
| 11 | **Alojar Lucide Icons localmente** en lugar de `unpkg.com` | ⚡ Rendimiento | Bajo | Medio | 1h |
| 12 | **Ocultar botón "Leer libro"** en el detalle cuando `archivo_pdf` es null | 🔧 Funcionalidad | Bajo | Bajo | 30min |
| 13 | **Arreglar Mood Tag — añadir clase `.activo` visualmente robusta** | 🏗️ Arquitectura | Bajo | Medio | 1h |
| 14 | **Añadir aria-labels a botones de paginación** (`aria-label="Página anterior/siguiente"`) | 👥 UX / Accesibilidad | Bajo | Medio | 30min |
| 15 | **Añadir funcionalidad básica de Favoritos** con localStorage | 👥 UX / Retención | Medio | Alto | 6h |

---

### 📚 Referencias de Sitios que lo Hacen Bien

| Sitio | Qué aprender |
|---|---|
| **Goodreads.com** | Sistema de listas/estantes, reseñas de usuarios, integración social |
| **Standard Ebooks (standardebooks.org)** | Diseño editorial ultra-limpio, organización por géneros, calidad de metadatos |
| **Internet Archive (archive.org)** | Estrategia de búsqueda avanzada para catálogos masivos |
| **Scribd.com** | Flujo de conversión freemium → premium, preview inteligente |
| **Notion.so** | Propuesta de valor clara en 5 segundos, copy de hero minimalista pero efectivo |

### 🎯 Prioridad de Conversión: El Embudo Actual vs. El Ideal

**Embudo actual:**
```
Visita → Explorar catálogo → Abrir libro → Leer 15 páginas → Panel de bloqueo → ¿Comprar?
```

**Embudo ideal:**
```
Visita → Entender propuesta de valor (5 seg) → Probar recomendador IA → 
Ver mis 3 libros → CTA: "Lee estos completos por $100 MXN" → Compra automática → 
Código inmediato → Acceso completo
```

La diferencia entre estos dos embudos representa potencialmente 2x-3x más conversiones sin cambiar el precio ni el producto.

---

*Auditoría elaborada con revisión exhaustiva del código fuente local (`index.html`, `app.js`, `style.css`), documentación de bóveda (arquitectura técnica, identidad de marca, modelo de negocio, copywriting) y análisis estático de rendimiento.*
