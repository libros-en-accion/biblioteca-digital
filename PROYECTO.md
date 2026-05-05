# 📚 Biblioteca Digital — PROYECTO

> Archivo vivo de seguimiento del proyecto.
> Actualizado por Axón según se realicen cambios.

---

## 📋 Ficha técnica

| | |
|---|---|
| **Descripción** | Aplicación web de catálogo visual de libros + recomendador IA |
| **Stack** | HTML, CSS, JavaScript plano (sin frameworks) + Vercel Serverless Function (Node.js) |
| **IA** | DeepSeek v4 Flash via API serverless |
| **Libros** | 2,848 títulos en `libros.json` (~1 MB) |
| **PDFs** | 2,848 enlaces a Google Drive |
| **Estado** | 🟢 Funcional (sin deploy activo conocido) |
| **Git** | 26 commits (desde 2026-03-21) — rama principal |

---

## 🗺️ Roadmap / Pendientes

### 🔴 Prioridad alta
- [x] **Normalizar géneros** — 3 grupos duplicados unificados. ✅
- [ ] **Crear `vercel.json`** — necesario para el deploy correcto en Vercel (rutas, runtime, rewrites).
- [ ] **Crear `package.json`** — dependencias (si aplica) y scripts.
- [ ] **Crear `.gitignore`** — evitar subir basura a Git.
- [ ] **Documentar variables de entorno** — `DEEPSEEK_API_KEY` necesaria para el recomendador.

### 🟡 Prioridad media
- [ ] **Migrar `onclick` inline a event listeners** — el HTML mezcla onclick inline con JS moderno; limpiar para consistencia.
- [ ] **Refinar la paginación** — los IDs de libros no son secuenciales (saltan de 2488 a 2727), hay 3 IDs duplicados.
- [ ] **Agregar más géneros como filtros rápidos** — hay géneros con +30 libros que no están en los tags (ej: "Novela histórica", "Romance / Drama", "Thriller").
- [ ] **Indexación SEO** — agregar meta tags, sitemap.xml y `robots.txt`.

### 🟢 Prioridad baja / nice to have
- [ ] **Modo oscuro** toggle
- [ ] **Vista de detalles del libro al hacer clic** (modal con info extendida)
- [ ] **Estadísticas del catálogo** (gráfica de géneros, autores más frecuentes, etc.)
- [ ] **PWA** (service worker para offline)
- [ ] **Caché de recomendaciones** — si el usuario repite el mismo perfil, mostrar resultados cacheados.

---

## 📂 Estructura del proyecto

```
biblioteca/
├── index.html          # Página principal
├── style.css           # Estilos completos (modo claro, responsive, modal IA)
├── app.js              # Lógica: galería, búsqueda, filtros, modal IA, paginación
├── libros.json         # Catálogo completo (2,845 libros)
├── catalogo.csv        # Export CSV del catálogo
├── api/
│   └── recomendar.js   # Función serverless Vercel → DeepSeek API
├── PROYECTO.md         # ← Este archivo (seguimiento vivo)
├── libros.json.bak     # Backup anterior (~174 KB)
├── libros.json.bak2    # Backup anterior (~1 MB)
└── .git/
```

---

## ⚙️ Configuración necesaria para deploy

### Variables de entorno (Vercel)

```
DEEPSEEK_API_KEY=sk-...
```

### Archivos faltantes

| Archivo | Propósito |
|---|---|
| `vercel.json` | Configuración de rutas y runtime para Vercel |
| `package.json` | Dependencias (ninguna por ahora, pero necesario para Vercel) |
| `.gitignore` | Ignorar `*.bak`, `node_modules/`, etc. |

---

## 🔍 Issues conocidos

1. ~~**Géneros duplicados por mayúsculas/minúsculas (3 grupos):**~~ ✅ **Resuelto**
   - "Ciencia Ficción" (159) + "Ciencia ficción" (92) → 251 unificados
   - "Divulgación Científica" (47) + "Divulgación científica" (20) → 67 unificados
   - "Filosofía Política" (10) + "Filosofía política" (2) → 12 unificados

2. ~~**IDs duplicados en `libros.json`** — 2,845 libros con 3 IDs duplicados (2486, 2487, 2488).~~ ✅ **Resuelto**
   - Los 3 libros Ghostgirl reasignados a IDs 2846, 2847, 2848.
   - Ahora: 2,848 libros, todos con ID único.

3. **HTML mezcla `onclick` inline con `addEventListener`** — el modal IA usa addEventListener para Escape, pero los botones usan onclick en el HTML. Funciona, pero es inconsistente.

4. **No hay `vercel.json`** — se eliminó en un commit previo por error de validación y nunca se restauró.

5. **Los tags de filtro no cubren todos los géneros** — hay 17 tags pero géneros como "Novela histórica" (49 libros), "Romance / Drama" (88) o "Thriller" (27) no tienen botón propio.

---

## 📜 Historial de Git (resumido)

```
2026-05-01  chore: aprovechar el cache hit de deepseek
2026-05-01  chore: migrar a deepseek-v4-flash (mitad de precio)
2026-05-01  Corregir: reemplazar OpenRouter por DeepSeek correctamente
2026-03-31  Agrega 3 libros Ghostgirl (IDs 2486-2488)
2026-03-26  fix(ux): scroll horizontal de tags en desktop
2026-03-26  fix(ui): aclarar fondo del header y mejorar contraste
2026-03-26  feat(ui): rediseño visual completo
2026-03-26  Agregar libros 2727-2845 (119 nuevos)
2026-03-25  Varios fixes: migración OpenRouter → Gemini → DeepSeek
2026-03-25  feat: recomendador de libros con IA
2026-03-24  ampliación a 2700+ documentos
2026-03-22  paginación, buscador mejorado, 461 libros
2026-03-21  461 libros, catálogo completo con todos los géneros
2026-03-21  12 libros, nuevos géneros ciencia y filosofía natural
2026-03-21  primer commit: biblioteca digital funcional
```

---

## 🧠 Decisiones técnicas

- **DeepSeek v4 Flash** como modelo IA por ser económico (~$0.35/M tokens input) con cache.
- **Estrategia de cache**: el system message incluye el catálogo completo. DeepSeek cachea el prefijo tras la primera llamada, reduciendo costo ~80% en consultas subsecuentes.
- **Sin frameworks**: vanilla JS para mantener ligero y sin dependencias.
- **PDFs en Google Drive**: todos los enlaces usan `drive.google.com/.../preview` para visualización embebida.

---

*Última actualización: 2026-05-04*

---

## 📝 Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-05-04 | Normalización de 3 grupos de géneros duplicados (Ciencia Ficción, Divulgación Científica, Filosofía Política) |
| 2026-05-04 | Corregidos 3 IDs duplicados en los libros Ghostgirl (IDs 2846-2848) |
| 2026-05-04 | Corregido género `null` en los 3 libros Ghostgirl → "Novela" |
| 2026-05-04 | Agregado mapeo CSS para "Filosofía Política" en `app.js` |
| 2026-05-04 | Creado PROYECTO.md para seguimiento del proyecto |
