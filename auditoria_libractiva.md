# 🔎 Auditoría UX/UI Exhaustiva — Libractiva

**Sitio auditado:** [https://biblioteca-digital-eight.vercel.app/](https://biblioteca-digital-eight.vercel.app/)  
**Fecha de auditoría:** 6 de junio de 2026  
**Auditor:** Product Designer Senior + Frontend Developer + Auditor UX/UI  

---

## 1. 📊 Resumen Ejecutivo

Libractiva es una plataforma de biblioteca digital ambiciosa con un stack técnico inteligente (Vanilla JS + PDF.js + APIs serverless) y una identidad de marca sólida (paleta teal + dorado). La arquitectura de información es funcional y el catálogo de +2,800 libros con filtrado en cliente es notable. Sin embargo, la experiencia del usuario se ve comprometida por **problemas de rendimiento en la carga inicial** (~1.36 MB de `libros.json` en bloque), **incoherencias en la jerarquía visual** del hero section que está demasiado comprimido, **falta de feedback visual en estados de transición críticos** (búsqueda, paginación, filtrado), y **deficiencias en responsive** que afectan la usabilidad táctil en dispositivos pequeños. El SEO técnico tiene buena base pero necesita mejoras en rutas canónicas y Open Graph. El recomendador IA es el diferenciador estrella pero su flujo puede optimizarse significativamente.

**Puntuación global: 7.2 / 10** — Buen concepto, buena base técnica, necesita pulido en UX/rendimiento/responsive.

| Categoría | Puntuación |
|---|---|
| Diseño Visual y Branding | 7.5/10 |
| Estructura y Navegación (UX) | 7.0/10 |
| Funcionalidad e Interactividad | 7.0/10 |
| Responsive Design | 6.5/10 |
| Rendimiento Técnico | 6.0/10 |
| Contenido y Copywriting | 8.0/10 |

---

## 2. 🔍 Hallazgos por Categoría

---

### 2.1 Diseño Visual y Branding

---



**📍 Problema identificado:**  
**Duplicación de regla CSS `.controles-barra` — Conflicto de estilos.**  
La clase `.controles-barra` está definida dos veces: primero en la línea 1618 con `padding: 0.3rem 2.5rem 0.5rem` y luego en la línea 2182 con `padding: 1rem 2.5rem`. La segunda declaración sobrescribe la primera, pero esto indica deuda técnica y riesgo de inconsistencias futuras.

**💥 Impacto en el usuario:**  
Ninguno directo visible (la cascada resuelve correctamente), pero genera inconsistencias durante el desarrollo y mantenimiento, aumentando la probabilidad de introducir bugs visuales.

**✅ Solución propuesta:**  
Eliminar la primera declaración duplicada (línea ~1618) y consolidar en una sola regla:

```css
/* Única declaración — eliminar la primera instancia */
.controles-barra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
  gap: 1.5rem;
  flex-wrap: wrap;
}
```

**🎯 Prioridad:** Bajo

---

**📍 Problema identificado:**  
**Duplicación de regla CSS `.btn-azar` — Dos definiciones con estilos distintos.**  
`.btn-azar` se define primero en la línea ~477 (dentro del hero) con `padding: 0.5rem 1rem` y luego se redefine en la línea ~1581 con `padding: 1rem 2rem`, `color: #d4a94a` y estilos completamente diferentes. La segunda declaración sobrescribe parcialmente a la primera, generando un botón "Sorpréndeme" con dimensiones y colores incoherentes.

**💥 Impacto en el usuario:**  
El botón "Sorpréndeme" puede renderizar con propiedades conflictivas de dos reglas CSS, lo que genera inconsistencia visual y problemas de mantenimiento.

**✅ Solución propuesta:**  
Consolidar en una sola definición de `.btn-azar`, eliminando la segunda declaración redundante:

```css
/* Botón Sorpréndeme — definición única y limpia */
.btn-azar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: var(--fuente-cuerpo);
  font-size: 0.88rem;
  color: #ecd9c6;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radio);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
```

**🎯 Prioridad:** Medio

---

**📍 Problema identificado:**  
**Abuso de `!important` en los Mood Tags (`.tag-mood-btn`) — 16+ declaraciones con `!important`.**  
En las líneas 2378-2415 del CSS, los estilos de `.tag-mood-btn`, `.tag-mood-btn:hover`, `.tag-mood-btn.activo`, y sus variantes dark mode, usan `!important` en prácticamente cada propiedad. Esto indica problemas de especificidad CSS que se resolvieron con fuerza bruta.

**💥 Impacto en el usuario:**  
No hay impacto visual directo, pero dificulta la personalización y el mantenimiento. Si se necesita sobreescribir estos estilos (por ejemplo, para una vista compacta o una animación), será extremadamente difícil.

**✅ Solución propuesta:**  
Incrementar la especificidad mediante selectores más precisos en lugar de `!important`:

```css
/* En lugar de .tag-mood-btn { background: ... !important; } */
.filtros-tags .tag-genero.tag-mood-btn {
  background: linear-gradient(135deg, #fbf7ef 0%, #ecdcb0 100%);
  border-color: #d8c290;
  color: #8c6a1b;
  font-weight: 500;
}

.filtros-tags .tag-genero.tag-mood-btn:hover {
  background: linear-gradient(135deg, #ecdcb0 0%, #d8c290 100%);
  color: #6a4f10;
  border-color: #cbb47e;
  box-shadow: 0 4px 12px rgba(184, 137, 42, 0.2);
}

.filtros-tags .tag-genero.tag-mood-btn.activo {
  background: linear-gradient(135deg, var(--dorado) 0%, #8c6a1b 100%);
  border-color: #8c6a1b;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(184, 137, 42, 0.35);
}

:root[data-theme="dark"] .filtros-tags .tag-genero.tag-mood-btn {
  background: linear-gradient(135deg, #2e261f 0%, #463b2a 100%);
  border-color: #6b5a30;
  color: #e8c56a;
}
```

**🎯 Prioridad:** Bajo

---

**📍 Problema identificado:**  
**Animación del logo (`respiracionLogo`) siempre activa — Distracción visual continua.**  
La animación `respiracionLogo` se ejecuta en bucle infinito (`animation: respiracionLogo 4s ease-in-out infinite`), haciendo que el logo "respire" constantemente. En un contexto de lectura, las animaciones permanentes compiten con el contenido principal y generan fatiga visual.

**💥 Impacto en el usuario:**  
Distracción sutil pero constante. Los usuarios enfocados en buscar un libro pueden sentir incomodidad visual subconsciente por el movimiento periférico perpetuo.

**✅ Solución propuesta:**  
Limitar la animación a las primeras iteraciones o activarla solo en hover:

```css
.hero-logo {
  /* Ejecutar solo 2 veces, no infinito */
  animation: respiracionLogo 4s ease-in-out 2;
}

/* Alternativa: animar solo al hacer hover */
.header-home-link:hover .hero-logo {
  animation: respiracionLogo 2s ease-in-out 1;
}
```

**🎯 Prioridad:** Medio

---

### 2.2 Estructura y Navegación (UX)

---

**📍 Problema identificado:**  
**No existe una sección "Acerca de" ni un enlace de ayuda/FAQ.**  
El sitio consta de una única página SPA sin ninguna sección informativa adicional. No hay forma de que un usuario nuevo entienda: ¿Quién está detrás de Libractiva? ¿Es legal? ¿Cómo funciona la donación? ¿Qué es el código de donador? ¿Cómo se seleccionan los libros? Esta información está completamente ausente.

**💥 Impacto en el usuario:**  
Falta de confianza. Los usuarios dudan de la legitimidad de la plataforma, especialmente cuando se les pide un "código de donador" sin contexto. Afecta la tasa de conversión de donaciones y la percepción de profesionalismo.

**✅ Solución propuesta:**  
Agregar un footer informativo con secciones mínimas y un modal "Acerca de":

```html
<!-- Agregar al footer existente, antes del cierre de </footer> -->
<div class="footer-enlaces">
  <button id="btnAcercaDe" class="footer-link-btn">Acerca de</button>
  <span class="footer-sep">·</span>
  <button id="btnFAQ" class="footer-link-btn">Preguntas frecuentes</button>
  <span class="footer-sep">·</span>
  <a href="mailto:contacto@libractiva.com" class="footer-link-btn">Contacto</a>
</div>
```

```css
.footer-enlaces {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.footer-link-btn {
  background: none;
  border: none;
  color: var(--texto-suave);
  font-family: var(--fuente-cuerpo);
  font-size: 0.82rem;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: all 0.2s;
  padding: 0.2rem 0.4rem;
}

.footer-link-btn:hover {
  color: var(--teal-profundo);
  text-decoration-color: currentColor;
}

.footer-sep {
  color: var(--texto-suave);
  opacity: 0.4;
  font-size: 0.82rem;
}
```

**🎯 Prioridad:** Alto

---

**📍 Problema identificado:**  
**Los filtros de "Época" (chips) no tienen indicación visual de su cantidad de libros.**  
A diferencia de los tags de género que al menos muestran un tooltip con la cantidad (`btn.title = \`${cantidad} libros\``), los chips de época no dan ninguna pista visual sobre cuántos libros contiene cada rango temporal. El usuario no sabe si "Antes de 1800" tiene 5 libros o 500.

**💥 Impacto en el usuario:**  
Los usuarios pueden seleccionar un filtro de época y encontrarse con muy pocos resultados, generando frustración. No hay expectativa informada sobre el volumen de contenido disponible en cada época.

**✅ Solución propuesta:**  
Agregar conteo dinámico a los chips de época después de cargar los libros:

```javascript
// Agregar a inicializarPagina() después de generarTagsFiltro()
function actualizarConteosEpoca() {
  const rangos = {
    'pre-1800': l => parseInt(l.anio) < 1800,
    '1800-1899': l => { const a = parseInt(l.anio); return a >= 1800 && a <= 1899; },
    '1900-1949': l => { const a = parseInt(l.anio); return a >= 1900 && a <= 1949; },
    '1950-1999': l => { const a = parseInt(l.anio); return a >= 1950 && a <= 1999; },
    '2000+': l => parseInt(l.anio) >= 2000,
  };

  Object.entries(rangos).forEach(([epoca, filtro]) => {
    const chip = document.querySelector(`.chip-epoca[data-epoca="${epoca}"]`);
    if (chip) {
      const count = libros.filter(l => l.anio && filtro(l)).length;
      chip.title = `${count} libros`;
      // Opcional: agregar badge visual
      if (!chip.querySelector('.chip-count')) {
        const badge = document.createElement('span');
        badge.className = 'chip-count';
        badge.textContent = count;
        chip.appendChild(badge);
      }
    }
  });
}
```

```css
.chip-count {
  font-size: 0.72rem;
  background: rgba(26, 92, 80, 0.15);
  color: var(--teal-profundo);
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  margin-left: 0.3rem;
  font-weight: 600;
}

.chip-epoca.activo .chip-count {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
```

**🎯 Prioridad:** Medio

---



**📍 Problema identificado:**  
**Los Mood Tags ("Lectura Rápida", "Reflexionar", etc.) se mezclan visualmente con los tags de género.**  
Los Mood Tags se ubican al inicio de la barra de filtros junto con los tags de género, pero representan un concepto completamente diferente (estado de ánimo vs. clasificación literaria). Aunque tienen un gradiente dorado diferenciado, la disposición lineal no transmite que son una categoría separada.

**💥 Impacto en el usuario:**  
Confusión cognitiva. Los usuarios no distinguen inmediatamente entre filtros por género y filtros por "mood". Algunos pueden ignorar los Mood Tags pensando que son géneros desconocidos.

**✅ Solución propuesta:**  
Separar visualmente los Mood Tags con un separador vertical o agruparlos en una sub-sección:

```javascript
// En generarTagsFiltro(), después de renderizar los mood tags, agregar separador
moodTagsData.forEach(m => {
  // ... código existente de creación de botones mood ...
});

// Añadir separador visual
const separador = document.createElement('div');
separador.className = 'tag-separador';
separador.setAttribute('aria-hidden', 'true');
contenedor.appendChild(separador);

// Continuar con el tag "Todos" y los demás...
```

```css
.tag-separador {
  width: 1px;
  height: 28px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--borde) 20%,
    var(--borde) 80%,
    transparent 100%
  );
  flex-shrink: 0;
  margin: 0 0.3rem;
  align-self: center;
}
```

**🎯 Prioridad:** Medio

---

### 2.3 Funcionalidad e Interactividad

---



**📍 Problema identificado:**  
**El botón "Buscar" (lupa derecha del input) no muestra estado de carga ni feedback visual al ejecutarse.**  
Al hacer clic en `#btnBuscarClick`, el filtrado se ejecuta instantáneamente (es local), pero no hay ninguna señal visual de que la acción se procesó. Esto es especialmente problemático en dispositivos lentos donde el filtrado de 2,800 registros puede tomar un momento perceptible.

**💥 Impacto en el usuario:**  
El usuario duda de si la acción tuvo efecto, pudiendo hacer clic múltiples veces.

**✅ Solución propuesta:**  
Agregar un micro-feedback de confirmación al botón:

```javascript
el('btnBuscarClick')?.addEventListener('click', () => {
  const btn = document.getElementById('btnBuscarClick');
  btn?.classList.add('busqueda-ejecutada');
  filtrar();
  const galeria = document.getElementById('galeria');
  if (galeria) {
    galeria.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setTimeout(() => btn?.classList.remove('busqueda-ejecutada'), 500);
});
```

```css
.btn-buscar-click.busqueda-ejecutada {
  color: var(--teal-profundo);
  transform: scale(1.2);
  transition: transform 0.15s ease;
}
```

**🎯 Prioridad:** Bajo

---

**📍 Problema identificado:**  
**El panel de bloqueo del lector PDF (página 16+) solo tiene la opción "Ya tengo un código" — falta el enlace de donación.**  
En el HTML (línea 372), el enlace de donación para obtener un código está comentado:  
```html
<!-- <p class="codigo-donacion-link">¿Aún no tienes un código? <a href="https://www.paypal.com"...>Realiza una donación voluntaria</a> para obtener el tuyo.</p> -->
```
Esto deja al usuario sin salida si no tiene un código. Solo puede cerrar el panel de bloqueo.

**💥 Impacto en el usuario:**  
Embudo roto: el usuario llega al punto de mayor interés (está leyendo y quiere continuar) pero no tiene forma de obtener un código de donador. Es una pérdida de conversión significativa.

**✅ Solución propuesta:**  
Descomentar el enlace de donación o agregar un CTA claro en el panel de bloqueo:

```html
<!-- En el lector-bloqueo, agregar después del botón "Ya tengo un código" -->
<a href="https://www.paypal.com" target="_blank" rel="noopener" class="btn-donar-preview">
  ❤️ Apoyar el proyecto
</a>
<p class="bloqueo-nota">Una donación voluntaria te da acceso completo al catálogo.</p>
```

```css
.bloqueo-nota {
  font-family: var(--fuente-cuerpo);
  font-size: 0.8rem;
  color: rgba(200, 184, 160, 0.6);
  margin-top: 0.5rem;
  font-style: italic;
}
```

**🎯 Prioridad:** Crítico

---

**📍 Problema identificado:**  
**El modal de código de donador (`#modalCodigo`) usa `style="display:none"` inline en el HTML pero se muestra/oculta con JavaScript manipulando `display` directamente, sin la clase `.abierto` que usan los otros modales.**  
Los modales de detalle e IA usan la clase `.abierto` en `.modal-overlay` para controlar su visibilidad con animaciones CSS. El modal de código usa `modal.style.display = 'flex'` / `modal.style.display = 'none'` directamente, sin animación de entrada/salida.

**💥 Impacto en el usuario:**  
El modal de código aparece y desaparece abruptamente, sin la animación suave `slideUp` / `fadeOverlay` que tienen los otros modales. Rompe la consistencia de la interfaz.

**✅ Solución propuesta:**  
Estandarizar el modal de código para usar el mismo sistema de clases `.abierto`:

```javascript
function abrirModalCodigo(callbackAlValidar) {
  _callbackCodigoValidado = callbackAlValidar || null;
  const modal = document.getElementById('modalCodigo');
  const input = document.getElementById('inputCodigoDonador');
  const msg = document.getElementById('codigoMensaje');
  if (modal) {
    modal.classList.add('abierto'); // Usar clase en vez de style.display
    document.body.style.overflow = 'hidden';
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    if (input) { input.value = ''; setTimeout(() => input.focus(), 80); }
    lucide.createIcons();
  }
}

function cerrarModalCodigo() {
  const modal = document.getElementById('modalCodigo');
  if (modal) {
    modal.classList.remove('abierto'); // Usar clase en vez de style.display
    document.body.style.overflow = '';
  }
}
```

Y en el HTML, eliminar el `style="display:none"` inline del `#modalCodigo`:

```html
<!-- Cambiar esto: -->
<div id="modalCodigo" class="modal-overlay" style="display:none">
<!-- Por esto: -->
<div id="modalCodigo" class="modal-overlay">
```

**🎯 Prioridad:** Medio

---

### 2.4 Responsive Design

---

**📍 Problema identificado:**  
**El botón "Código Donador" (`.btn-codigo-donador`) se superpone con el botón de tema (`.btn-tema`) en pantallas menores a 400px.**  
El botón de código donador está posicionado `position: absolute; top: 1rem; right: 4rem` y el botón de tema está en `position: absolute; top: 1rem; right: 1.2rem`. En móviles menores a 600px, el CSS cambia el botón de código a `right: 1.2rem; top: 4rem` y lo convierte en circular, pero entre 400-600px puede haber solapamiento.

**💥 Impacto en el usuario:**  
En tablets y móviles medianos, ambos botones pueden solaparse, dificultando la interacción táctil y generando taps accidentales.

**✅ Solución propuesta:**  
Mejorar el posicionamiento responsive para evitar solapamiento:

```css
@media (max-width: 768px) {
  .btn-codigo-donador {
    right: auto;
    left: 1rem;
    top: 1rem;
    /* Moverlo a la izquierda en tablets */
  }
}

@media (max-width: 480px) {
  .btn-codigo-donador {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: auto;
    padding: 0.35rem 0.6rem;
    font-size: 0.75rem;
  }
  
  .btn-codigo-donador span {
    display: none; /* Solo icono en móviles */
  }
}
```

**🎯 Prioridad:** Alto

---

**📍 Problema identificado:**  
**La barra de controles (`.controles-barra`) con chips de época, dropdown de autor y dropdown de orden se apila deficientemente en móviles.**  
En pantallas de 480px o menos, `.controles-barra` cambia a `flex-direction: column`, pero los chips de época se vuelven un scroll horizontal sin indicadores visuales de que hay más contenido fuera de la vista. Los dropdowns se estiran al 50% del ancho con `flex: 1 1 calc(50% - 0.4rem)`, lo que puede generar botones demasiado estrechos para el texto.

**💥 Impacto en el usuario:**  
Los usuarios móviles no descubren todos los filtros de época disponibles (el scroll horizontal es invisible). Los dropdowns truncan sus labels.

**✅ Solución propuesta:**  
Agregar indicadores de scroll y mejorar el layout de dropdowns en móvil:

```css
@media (max-width: 480px) {
  /* Indicadores de fade para scroll horizontal */
  .epoca-chips {
    position: relative;
    -webkit-mask-image: linear-gradient(
      90deg, transparent 0%, black 8%, black 92%, transparent 100%
    );
    mask-image: linear-gradient(
      90deg, transparent 0%, black 8%, black 92%, transparent 100%
    );
    padding: 0 0.5rem;
    flex-wrap: nowrap;
  }

  .chip-epoca {
    font-size: 0.78rem;
    padding: 0.3rem 0.7rem;
    white-space: nowrap;
  }

  /* Dropdowns al 100% del ancho en móvil */
  .controles-derecha > * {
    flex: 1 1 100%;
  }

  .custom-dropdown .dropdown-btn,
  .custom-dropdown .dropdown-input {
    min-width: auto;
    font-size: 0.85rem;
  }
}
```

**🎯 Prioridad:** Alto

---

**📍 Problema identificado:**  
**Las tarjetas del catálogo en vista grid a 480px usan `minmax(140px, 1fr)` lo que genera tarjetas con portadas extremadamente pequeñas.**  
Con un `minmax` de 140px, las portadas de libros en pantallas de ~375px (iPhone SE) resultan de aproximadamente 160px de ancho con aspect-ratio 3/4, generando imágenes de 160x213px. Esto hace que los títulos largos y las descripciones se corten agresivamente.

**💥 Impacto en el usuario:**  
Las tarjetas se ven apretadas y la información es difícil de leer en dispositivos pequeños. Los textos truncados impiden identificar el libro correctamente.

**✅ Solución propuesta:**  
Cambiar a un layout de 2 columnas fijo en móvil con más espacio entre tarjetas:

```css
@media (max-width: 480px) {
  .galeria {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
    padding: 0.5rem 0.8rem 3rem;
  }

  .tarjeta-info {
    padding: 0.8rem 0.8rem 0.5rem;
  }

  .tarjeta-titulo {
    font-size: 0.88rem;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tarjeta-descripcion {
    display: none; /* Ocultar en móvil para ahorrar espacio */
  }

  .tarjeta-autor {
    font-size: 0.8rem;
  }

  .btn-ver {
    margin: 0.5rem 0.8rem 0.8rem;
    padding: 0.5rem;
    font-size: 0.82rem;
  }
}

/* Ultra pequeño: iPhone SE y similares */
@media (max-width: 360px) {
  .galeria {
    grid-template-columns: 1fr;
  }

  .tarjeta {
    flex-direction: row;
    gap: 0;
  }

  .tarjeta-portada {
    width: 100px;
    height: auto;
    aspect-ratio: 3/4;
    border-radius: var(--radio) 0 0 var(--radio);
    border-bottom: none;
    border-right: 1px solid var(--borde-suave);
  }

  .tarjeta-descripcion {
    display: -webkit-box;
    -webkit-line-clamp: 2;
  }
}
```

**🎯 Prioridad:** Alto

---



### 2.5 Rendimiento Técnico

---










### 2.6 Contenido y Copywriting

---

**📍 Problema identificado:**  
**El texto del panel de bloqueo (página 16+) tiene tono transaccional agresivo: "Apoya nuestro proyecto con una donación para desbloquear...".**  
El copy actual en `.lector-bloqueo-texto` dice: *"Has llegado al final de la vista previa gratuita (15 páginas). Apoya nuestro proyecto con una donación para desbloquear el libro completo, la descarga en PDF y la impresión."* Esto suena más a un paywall que a una invitación a contribuir.

**💥 Impacto en el usuario:**  
El tono genera fricción emocional. Los lectores que están inmersos en un libro sienten que se les está vendiendo algo, rompiendo la magia de la experiencia de lectura. Puede generar sentimientos negativos hacia la plataforma.

**✅ Solución propuesta:**  
Reformular el copy con un enfoque de gratitud y comunidad:

```html
<h2 class="lector-bloqueo-titulo">Estamos felices de que disfrutes esta lectura ✨</h2>
<p class="lector-bloqueo-texto">
  Esta vista previa de 15 páginas es nuestra forma de invitarte a descubrir nuevas obras.
  Si deseas continuar leyendo este libro completo, descargarlo en PDF o imprimirlo,
  tu contribución voluntaria nos ayuda a mantener esta biblioteca viva y creciendo.
</p>
```

**🎯 Prioridad:** Alto

---

**📍 Problema identificado:**  
**Los CTAs del hero no tienen jerarquía visual clara — "¿Qué leer hoy? (Pregunta a la IA)" y "Sorpréndeme" compiten en importancia.**  
Ambos botones tienen aproximadamente el mismo peso visual, sin que quede claro cuál es la acción principal. El botón de IA debería ser claramente el CTA primario (es el diferenciador de la plataforma), mientras que "Sorpréndeme" debería ser secundario.

**💥 Impacto en el usuario:**  
Parálisis de decisión (paradoja de la elección). Los usuarios nuevos no saben cuál botón presionar primero, lo que reduce la tasa de conversión a la primera interacción.

**✅ Solución propuesta:**  
Ya existe una diferenciación de estilo, pero reforzarla:

```css
/* Hacer el botón de IA claramente más prominente */
.btn-ia-trigger {
  padding: 0.65rem 1.6rem; /* Más grande */
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(26, 92, 80, 0.4), 
              0 0 0 1px rgba(184, 137, 42, 0.2);
}

/* Hacer "Sorpréndeme" claramente secundario */
.btn-azar {
  padding: 0.45rem 0.9rem;
  font-size: 0.82rem;
  opacity: 0.85;
}

.btn-azar:hover {
  opacity: 1;
}
```

**🎯 Prioridad:** Medio

---

**📍 Problema identificado:**  
**El placeholder del buscador es demasiado largo para pantallas pequeñas.**  
El texto `Buscar por título, autor, género o año...` se trunca severamente en pantallas < 400px, mostrando solo "Buscar por tí..." que es poco informativo.

**💥 Impacto en el usuario:**  
Los usuarios móviles no reciben la pista completa de qué pueden buscar.

**✅ Solución propuesta:**  
Usar JavaScript para adaptar el placeholder según el viewport:

```javascript
// Agregar en inicializarPagina()
function adaptarPlaceholder() {
  const input = document.getElementById('inputBusqueda');
  if (!input) return;
  
  const actualizar = () => {
    if (window.innerWidth < 480) {
      input.placeholder = 'Buscar libro, autor...';
    } else {
      input.placeholder = 'Buscar por título, autor, género o año...';
    }
  };
  
  actualizar();
  window.addEventListener('resize', debounce(actualizar, 200));
}
```

**🎯 Prioridad:** Medio

---

## 3. 📋 Plan de Acción Priorizado

| # | Acción | Prioridad | Esfuerzo | Impacto |
|---|--------|-----------|----------|---------|
| 1 | **Descomentar/agregar CTA de donación en panel de bloqueo del lector** | Crítico | Bajo | Embudo de conversión reparado |
| 12 | **Mejorar copywriting del panel de bloqueo** | Alto | Bajo | Reduce fricción emocional del paywall |
| 13 | **Separar visualmente Mood Tags de tags de género** | Medio | Bajo | Claridad en sistema de filtros |
| 14 | **Estandarizar modal de código donador con clase `.abierto`** | Medio | Bajo | Consistencia de animaciones |
| 15 | **Agregar sección "Acerca de" y FAQ en footer** | Alto | Medio | Genera confianza en la plataforma |

---

## 4. 🎨 Recomendaciones de Diseño (Bonus)

### 4.1 Componente "Libro del Día" — Banner destacado

Una sección destacada rotativa que presente un libro diferente cada día agregaría dinamismo a la experiencia de la página principal. Podría posicionarse entre el hero y los filtros.

```html
<section class="libro-dia-section">
  <div class="libro-dia-badge">📖 Libro del Día</div>
  <div class="libro-dia-contenido">
    <img class="libro-dia-portada" src="" alt="" />
    <div class="libro-dia-info">
      <h3 class="libro-dia-titulo"></h3>
      <p class="libro-dia-autor"></p>
      <p class="libro-dia-frase"></p>
      <button class="btn-recomendar libro-dia-btn">
        <i data-lucide="book-open" class="icono-sm"></i> Descubrir
      </button>
    </div>
  </div>
</section>
```

```css
.libro-dia-section {
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 0 2.5rem;
}

.libro-dia-contenido {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--fondo-tarjeta) 0%, rgba(184, 137, 42, 0.05) 100%);
  border: 1px solid rgba(184, 137, 42, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--sombra);
}

.libro-dia-badge {
  font-family: var(--fuente-cuerpo);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--dorado);
  margin-bottom: 0.8rem;
}

.libro-dia-portada {
  width: 100px;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 4px 16px var(--sombra-media);
  flex-shrink: 0;
}

.libro-dia-titulo {
  font-family: var(--fuente-titulo);
  font-size: 1.2rem;
  color: var(--texto);
  margin-bottom: 0.3rem;
}

.libro-dia-autor {
  font-family: var(--fuente-cuerpo);
  color: var(--teal-medio);
  font-style: italic;
  font-size: 0.92rem;
  margin-bottom: 0.5rem;
}

.libro-dia-frase {
  font-family: var(--fuente-literaria);
  font-size: 0.95rem;
  color: var(--texto-medio);
  line-height: 1.6;
  font-style: italic;
  border-left: 2px solid var(--dorado);
  padding-left: 1rem;
  margin: 0.5rem 0 1rem;
}
```

---

### 4.2 Micro-interacción: Animación de "añadido a la lista"

Cuando el usuario interactúa con un libro (abre detalle, lee, etc.), una animación sutil podría reforzar el engagement:

```css
/* Efecto de ripple al hacer click en una tarjeta */
.tarjeta {
  position: relative;
  overflow: hidden;
}

.tarjeta::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, var(--teal-suave) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.5s ease, height 0.5s ease, opacity 0.5s ease;
  pointer-events: none;
  z-index: 0;
}

.tarjeta:active::after {
  width: 300px;
  height: 300px;
  opacity: 0.3;
  transition: width 0s, height 0s, opacity 0s;
}
```

---

### 4.3 Referencias de sitios similares bien diseñados

| Sitio | Qué hacen bien |
|---|---|
| [Standard Ebooks](https://standardebooks.org/) | Diseño limpio con tipografía literaria excelente, portadas generativas únicas |
| [Open Library](https://openlibrary.org/) | Sistema de búsqueda y filtrado potente, pages de autor bien diseñadas |
| [Literal.club](https://literal.club/) | UX de descubrimiento de libros con recomendaciones sociales, dark mode elegante |
| [Goodreads](https://www.goodreads.com/) | Reseñas de la comunidad, listas curadas (referencia de features a largo plazo) |

---

> [!TIP]
> **Priorización sugerida para sprint inmediato (1-2 días):** Las acciones #1 a #6 del plan son todas de esfuerzo bajo y impacto alto. Implementarlas primero generará la mayor mejora perceptible con el menor trabajo.

> [!IMPORTANT]
> **Hallazgo crítico sobre el embudo de monetización:** El panel de bloqueo del lector es el punto de mayor conversión potencial (el usuario ya está leyendo y enganchado), pero el enlace de donación está comentado en el HTML. Reparar esto debería ser la prioridad #1 absoluta.
