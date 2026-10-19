---
tipo: guia
area: operacion
tags: [guia, colecciones, sagas, packs, json, frontend, configuracion, libractiva]
fecha: 2026-10-18
---

# 📚 Guía: Gestión de Colecciones Temáticas y Sagas Literarias

Esta guía describe el funcionamiento, la estructura de datos y los procedimientos para gestionar tanto las **15 Colecciones Curadas (Packs)** como las **58 Sagas y Series Literarias** en **Libractiva**.

---

## 🧐 Visión General: Sistema Dual de Exploración

La sección de exploración ubicada en la página de inicio cuenta con dos pestañas de navegación:

1. **Pestaña «Colecciones» (15 packs curados):** Agrupaciones temáticas diseñadas para motivar la lectura y resolver la parálisis de decisión (ej: *«Estoicismo y Filosofía para Tiempos Difíciles»*, *«Maestros del Terror y lo Sobrenatural»*, *«Finanzas Personales y Psicología del Dinero»*).
2. **Pestaña «Sagas y Series» (58 sagas literarias):** Agrupación automatizada en tiempo real a partir del catálogo `libros.json`. Muestra sagas completas (ej: *Harry Potter*, *Dune*, *Trilogía del Silo*, *Fundación*, *Canción de Hielo y Fuego*) ordenadas por número de tomo.

---

## 🗃️ 1. Gestión de Colecciones (`colecciones.json`)

Las colecciones se configuran en `/home/daniel/biblioteca/colecciones.json`. Su formato es una matriz de objetos JSON:

```json
{
  "id": "psicologia-humana",
  "titulo": "La biblioteca mínima para entender la psicología humana",
  "descripcion": "Comprende la mente, el comportamiento y las trampas del pensamiento.",
  "portada_pack": "portadas/pack-psicologia.webp",
  "libros": [2962, 2898, 2842, 1121, 1125, 1126, 3021, 3022, 3023]
}
```

### 📋 Diccionario de Campos de Colección

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| **`id`** | String | Sí | Slug único en minúsculas separado por guiones (ej: `maestros-terror`). |
| **`titulo`** | String | Sí | Título representativo de la colección. |
| **`descripcion`** | String | Sí | Breve sinopsis o propuesta de valor que explica por qué leer este pack. |
| **`portada_pack`** | String | No | Ruta a la portada del pack (`portadas/pack-*.webp`). Si se omite, se usa la portada del primer libro. |
| **`libros`** | Array[int] | Sí | Lista con los IDs numéricos exactos de `libros.json` que integran la colección. |

### Cómo agregar un libro a una colección:
1. Encuentra el ID numérico del libro en `libros.json`.
2. Abre `colecciones.json` y busca el pack por su `"id"`.
3. Agrega el número del ID en el arreglo `"libros"`.
4. Guarda y haz `git commit` y `git push`.

---

## 📖 2. Gestión de Sagas y Series (`libros.json`)

Las sagas **no requieren un archivo JSON adicional**, sino que se autogeneran dinámicamente cuando un libro incluye el atributo `serie` en `libros.json`:

```json
{
  "id": 3044,
  "titulo": "Espejismo",
  "autor": "Hugh Howey",
  "serie": {
    "nombre": "Silo",
    "orden": 1
  }
}
```

- **`serie.nombre`:** Nombre unificado de la saga (ej: *"Harry Potter"*, *"Fundación"*, *"Silo"*).
- **`serie.orden`:** Número de tomo o volumen dentro de la secuencia de lectura (1, 2, 3...).

### Cómo asignar una saga a un libro:
1. Abre `libros.json`.
2. Localiza el libro y agrégale la propiedad `"serie": { "nombre": "Nombre de la Saga", "orden": N }`.
3. También dispones del script automático `/home/daniel/biblioteca/scripts/asignar_sagas.js` para detectar y etiquetar sagas por patrones de título.
4. Al recargar la página, la saga aparecerá automáticamente tanto en la pestaña **Sagas y Series** como en el desplegable de filtros de la barra superior.

---

**Notas Relacionadas:**
- [[Modelo de Negocio|Propuesta de valor de la oferta LTD]]
- [[Guía - Agregar Libro|SOP para registrar libros en libros.json]]
- [[Guía - Git y Flujo de Trabajo|Actualizar la plataforma web mediante Git]]
