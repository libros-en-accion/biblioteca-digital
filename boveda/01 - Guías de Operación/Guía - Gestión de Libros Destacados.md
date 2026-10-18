---
tipo: guia
area: operacion
tags: [guia, destacados, frontend, configuracion, app.js, libractiva]
fecha: 2026-06-15
---

# 🌟 Guía: Gestión de Libros Destacados en la Home

Esta guía describe el funcionamiento, estructura e instrucciones para actualizar la sección de **Libros Destacados** en la página de inicio de **Libractiva**.

---

## 🧐 ¿Qué es la Sección de Destacados?

Para mejorar la experiencia del usuario y evitar que se sienta abrumado por el catálogo de más de 2800 libros, la página web cuenta con una sección superior dedicada a **Libros Destacados**. 

Esta sección muestra un carrusel horizontal con 10 portadas seleccionadas manualmente (por ejemplo, los más leídos de la semana o los recomendados de la temporada) antes de presentar la lista completa de libros.

---

## 🛠️ Cómo Actualizar los Libros Destacados

La lista se configura de manera estática y muy eficiente mediante sus IDs en el archivo principal de JavaScript.

### Paso 1: Obtener los IDs de los libros
Busca en el archivo `libros.json` el ID numérico de los libros que deseas destacar. Por ejemplo:
- *El túnel* -> `2875`
- *Sobre héroes y tumbas* -> `2876`

### Paso 2: Modificar la lista en `app.js`
1. Abre el archivo `/home/daniel/biblioteca/app.js` en tu editor de código.
2. Al principio del archivo, localiza la constante `LIBROS_DESTACADOS_IDS`:
   ```javascript
   // Puedes actualizar manualmente los IDs de esta lista (por ejemplo, cada semana)
   // según los libros más populares de Amazon u otra fuente de tu preferencia.
   const LIBROS_DESTACADOS_IDS = [
     1233, // Las 48 leyes del poder
     2845, // Alas de sangre
     2763, // No tengo boca y debo gritar
     814,  // Noches blancas (Ilustrado)
     2857, // Proyecto Hail Mary
     783,  // El placebo eres tu
     1250, // La sociedad del cansancio
     2079, // 1984
     2875, // El túnel
     2820  // Los siete maridos de Evelyn Hugo
   ];
   ```
3. Reemplaza o añade los IDs de los libros que quieras destacar (máximo 10). Los comentarios a la derecha te ayudarán a recordar qué libro corresponde a cada ID.
4. Guarda el archivo.

### Paso 3: Desplegar los cambios
Para aplicar los cambios a la versión en producción, haz un commit y envíalo a GitHub:
```bash
git add app.js
git commit -m "docs: actualizar lista de libros destacados semanales"
git push origin main
```

---

## ⚙️ Funcionamiento Técnico y Visibilidad

Para asegurar que los destacados no estorben al usuario cuando está buscando activamente un libro, la sección cuenta con lógica de **visibilidad condicionada**:

1. **Cuándo se muestra:**
   - El usuario está en la página principal (`paginaActual === 1`).
   - No hay ningún filtro de búsqueda por texto.
   - No se ha seleccionado ningún filtro de género, autor, época o estado de ánimo (mood).
   
2. **Cuándo se oculta automáticamente:**
   - En cuanto el usuario escribe una letra en el buscador.
   - Si se hace clic en cualquier filtro o tag de la barra lateral/superior.
   - Al navegar a la página 2 del catálogo.

3. **Orden aleatorio:** Los libros se muestran en orden aleatorio (algoritmo Fisher-Yates shuffle) cada vez que se renderiza la sección, para dar variedad visual.

Esta lógica es controlada por la función `renderizarDestacados()` en `app.js` y llamada automáticamente por la función `mostrarPagina()`.

---

## 🎨 Estructura HTML y Estilos

- **Contenedor HTML:** `<section id="destacados-seccion">` en [index.html](file:///home/daniel/biblioteca/index.html).
- **Contenedor de tarjetas:** `<div id="destacados-galeria">` (reutiliza los estilos responsivos del catálogo convencional).
- **Estilos CSS:** Agrupados bajo la sección `/* ── Sección de destacados ── */` en [style.css](file:///home/daniel/biblioteca/style.css), diseñados con un borde suave, tipografía clásica en color vino y un detalle de estrella dorada (`✦`).

---
**Notas Relacionadas:**
- [[Guía - Agregar Libro|Cómo añadir libros sin romper el formato]]
- [[Arquitectura - Estructura del Proyecto|Estructura del Proyecto]]
- [[Guía - Git y Flujo de Trabajo|Actualizaciones con comandos de Git]]
