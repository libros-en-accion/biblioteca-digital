# 📊 Tracking de Correcciones — Libractiva

**Fecha de inicio:** 2026-06-14
**Última actualización:** 2026-06-14

## 📈 Progreso General

- **Total de acciones:** 15
- **Completadas:** 15
- **En progreso:** 0
- **Pendientes:** 0
- **Saltadas:** 0
- **Avance:** 100.0% 🎉

## ✅ Acciones Completadas

| # | Acción | Dimensión | Prioridad | Esfuerzo | Impacto | Estado |
|---|--------|-----------|-----------|----------|---------|--------|
| 1 | Añadir propuesta de valor en el hero | 🎯 Conversión | 🔴 Crítico | Bajo | Alto | ✅ |
| 2 | Implementar lazy loading de PDF.js | ⚡ Rendimiento | 🔴 Crítico | Medio | Alto | ✅ |
| 3 | Arreglar hero responsive en móvil | 📱 Responsive | 🔴 Crítico | Medio | Alto | ✅ |
| 4 | Añadir CTA de compra en la home | 🎯 Conversión | 🔴 Crítico | Bajo | Alto | ✅ |
| 5 | Implementar badge "Vista previa · 15 págs." | 👥 UX | 🟠 Alto | Bajo | Medio | ✅ |
| 6 | Corregir Markdown sin renderizar en FAQ | 🔧 Funcionalidad | 🟡 Medio | Bajo | Bajo | ✅ |
| 7 | Añadir CTA de compra en resultados IA | 🎯 Conversión | 🔴 Crítico | Bajo | Alto | ✅ |
| 8 | Implementar Service Worker para caché | ⚡ Rendimiento | 🟠 Alto | Medio | Alto | ✅ |
| 9 | Aumentar touch target de dropdowns | 📱 Responsive | 🟠 Alto | Bajo | Medio | ✅ |
| 10 | Añadir logo con srcset Retina | 🎨 Diseño | 🟡 Medio | Bajo | Medio | ✅ |
| 11 | Alojar Lucide Icons localmente | ⚡ Rendimiento | 🟡 Medio | Bajo | Medio | ✅ |
| 12 | Ocultar botón "Leer" si no hay PDF | 🔧 Funcionalidad | 🟡 Medio | Bajo | Bajo | ✅ |
| 13 | Arreglar Mood Tag con clase .activo | 🏗️ Arquitectura | 🟠 Alto | Bajo | Medio | ✅ |
| 14 | Añadir aria-labels a paginación | 👥 UX | 🟡 Medio | Bajo | Medio | ✅ |
| 15 | Añadir funcionalidad de Favoritos | 👥 UX | 🟠 Alto | Medio | Alto | ✅ |

## 📝 Log Detallado de Cambios

### 2026-06-14

| # | Acción | Archivos | Descripción |
|---|--------|----------|-------------|
| 1 | Propuesta de valor en hero | `index.html`, `style.css` | Párrafo `.hero-propuesta-valor` con copy "2,800 libros + IA + $100 MXN" |
| 2 | Lazy loading PDF.js | `index.html`, `app.js` | Eliminado `<script>` estático. Helper `cargarPDFJS()` con caché ESM |
| 3 | Hero responsive móvil | `style.css` | Breakpoint 600px con layout 1 columna apilada |
| 4 | CTA compra en home | `index.html`, `style.css` | Botón `.btn-comprar-hero` dorado en hero-acciones |
| 5 | Badge Vista previa | `app.js`, `style.css` | Badge `.badge-preview` en catálogo, destacados y resultados IA |
| 6 | Markdown en FAQ | `index.html` | `**Mercado Pago**` → `<strong>Mercado Pago</strong>` |
| 7 | CTA en resultados IA | `app.js`, `style.css` | `mostrarCTAEnResultadosIA()` con botón dorado |
| 8 | Service Worker | `sw.js`, `app.js` | Precaché de assets, cache-first/stale-while-revalidate |
| 9 | Touch target dropdowns | `style.css` | `min-height: 44px` en dropdown items y botones |
| 10 | Logo srcset Retina | `index.html` | `srcset="logo_display.png 1x, logo_clean_white.png 2x"` |
| 11 | Lucide Icons local | `index.html`, `lucide.min.js`, `sw.js` | Descargado y alojado localmente |
| 12 | Ocultar botón Leer | `index.html` | `style="display:none"` en `#detalle-pdf-link` |
| 13 | Mood Tag .activo | `app.js` | `aria-pressed` en mood tags, init restore, consistencia en clears |
| 14 | Aria-labels paginación | `app.js` | `aria-label="Página anterior/siguiente/X"`, `aria-hidden` en elipsis |
| 15 | Favoritos | `app.js`, `style.css`, `index.html` | Botón heart en tarjetas y detalle, toggle en barra controles, filtro `soloFavoritos`, localStorage |
