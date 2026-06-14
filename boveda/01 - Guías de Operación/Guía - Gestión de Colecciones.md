---
tipo: guia
area: operacion
tags: [guia, colecciones, packs, json, frontend, configuracion, libractiva]
fecha: 2026-06-13
---

# 📚 Guía: Gestión de Colecciones Temáticas (Packs)

Esta guía describe el funcionamiento, la estructura de datos y los procedimientos para crear, modificar y eliminar las **Colecciones Exclusivas** (Packs de Libros) en **Libractiva**.

---

## 🧐 ¿Qué son las Colecciones Curadas?

Las colecciones o packs son agrupaciones temáticas de libros seleccionados meticulosamente para aportar valor inmediato al lector (resolviendo la parálisis por análisis) y motivar la compra del **Acceso Lifetime (LTD)** de $100 MXN.

La sección se presenta en la página principal, justo debajo de la galería de destacados, y permite a los usuarios hacer un filtrado dinámico instantáneo con un solo clic.

---

## 🗃️ Estructura del Archivo `colecciones.json`

Las colecciones se configuran de manera estática y muy ligera en el archivo `/home/daniel/biblioteca/colecciones.json`. Su formato es una matriz (Array) de objetos JSON con la siguiente estructura:

```json
  {
    "id": "psicologia-humana",
    "titulo": "La biblioteca mínima para entender la psicología humana",
    "descripcion": "Una selección enfocada en el autoanálisis, el comportamiento social, el inconsciente y los sesgos cognitivos.",
    "portada_pack": "portadas/pack-psicologia.webp",
    "libros": [2962, 2898, 2842, 1121, 1125, 1126, 3021, 3022, 3023]
  }
```

### 📋 Diccionario de Campos de la Colección

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| **`id`** | Cadena (String) | Sí | Identificador único del pack en minúsculas y separado por guiones. Se utiliza internamente por JavaScript para los eventos de filtrado. |
| **`titulo`** | Cadena (String) | Sí | Nombre comercial e inspirador de la colección que se muestra en la cabecera del catálogo y en la tarjeta. |
| **`descripcion`** | Cadena (String) | Sí | Sinopsis del enfoque y beneficio de leer esta curaduría (máximo 2 líneas de texto en la tarjeta). |
| **`portada_pack`** | Cadena (String) | Sí | Ruta relativa a la imagen de portada premium del pack en formato WebP optimizado (`portadas/pack-*.webp`). |
| **`libros`** | Array de Enteros | Sí | Lista con los IDs numéricos (de `libros.json`) de los libros que pertenecen al pack. |

---

## 🛠️ Cómo Modificar o Agregar un Libro a un Pack

Si has añadido un libro nuevo al catálogo y deseas incluirlo dentro de una colección existente:

1. Obtén el ID del libro en `libros.json`.
2. Abre `/home/daniel/biblioteca/colecciones.json`.
3. Busca el pack correspondiente por su `"id"` (ej: `evitar-burnout`).
4. Agrega el ID numérico del libro al final de la matriz `"libros"`.
5. Guarda el archivo.
6. Realiza un `git push` para desplegar los cambios.

---

## 🎨 Portadas WebP para Packs
Las imágenes de portada para las colecciones deben colocarse en `/home/daniel/biblioteca/portadas/` en formato `.webp` con dimensiones de 600px de ancho y compresión del 85% para optimizar la carga del sitio.

---
**Notas Relacionadas:**
- [[Modelo de Negocio|Propuesta de valor y precios de la oferta LTD]]
- [[Guía - Agregar Libro|SOP para registrar libros en libros.json]]
- [[Guía - Git y Flujo de Trabajo|Actualizar la plataforma web mediante Git]]
