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

Para mejorar la experiencia del usuario y evitar que se sienta abrumado por el catálogo de más de 3,000 libros, la página web cuenta con una sección superior dedicada a **Libros Destacados**. 

Esta sección muestra un carrusel con portadas seleccionadas y numeradas (por ejemplo, los libros más recomendados o los más leídos de la semana) antes de presentar la lista completa de libros.

---

## 🛠️ Cómo Actualizar los Libros Destacados

La lista se configura de manera estática y muy eficiente mediante sus IDs en el archivo principal de JavaScript.

### Paso 1: Obtener los IDs de los libros
Busca en el archivo `libros.json` el ID numérico de los libros que deseas destacar.

### Paso 2: Modificar la lista en `app.js`
1. Abre el archivo `/home/daniel/biblioteca/app.js` en tu editor de código.
2. Al principio del archivo, localiza la constante `LIBROS_DESTACADOS_IDS`:
   ```javascript
   // Puedes actualizar manualmente los IDs de esta lista (por ejemplo, cada semana)
   // según los libros más populares de Amazon u otra fuente de tu preferencia.
   const LIBROS_DESTACADOS_IDS = [
     3044, // Espejismo (Hugh Howey - Trilogía del Silo)
     1233, // Las 48 leyes del poder
     2845, // Alas de sangre
     2763, // No tengo boca y debo gritar
     814,  // Noches blancas (Ilustrado)
     2857, // Proyecto Hail Mary
     783,  // El placebo eres tu
     2777, // La sociedad del cansancio
     2079, // 1984
     1139, // Cien anos de soledad
     1140, // El amor en los tiempos del colera
     14,   // La divina comedia
     2828, // El monje que vendio su Ferrari
     2241, // Tormenta de espadas ed ilustrada
     1974, // Hombres sin mujeres
     2944  // La naranja mecanica
   ];
   ```
3. Reemplaza, añade o reordena los IDs. El libro que coloques en la primera posición será siempre el **#1**, el segundo el **#2**, y así sucesivamente.
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
   - No se ha seleccionado ningún filtro de género, autor, época, saga o estado de ánimo (mood).
   - No se ha seleccionado una colección o pack.
   
2. **Cuándo se oculta automáticamente:**
   - En cuanto el usuario escribe una letra en el buscador.
   - Si se hace clic en cualquier filtro o tag de la barra lateral/superior.
   - Al navegar a la página 2 del catálogo.
   - Al entrar a una colección o saga.

3. **Orden estable y predecible:**
   - La sección respeta **estrictamente el orden** definido en `LIBROS_DESTACADOS_IDS` (sin aleatoriedad en cada recarga), garantizando consistencia visual para el usuario entre visitas.
   - Si el sistema cuenta con al menos 4 registros en el ranking real de lecturas en Redis (`api/ranking`), mostrará automáticamente los libros más leídos de la semana ordenados por popularidad real.

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
