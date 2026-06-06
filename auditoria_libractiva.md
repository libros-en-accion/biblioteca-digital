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
