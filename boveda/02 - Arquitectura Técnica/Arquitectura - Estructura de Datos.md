---
tipo: arquitectura
area: tecnica
tags: [arquitectura, datos, json, base-de-datos]
fecha: 2026-05-30
---

# 📊 Arquitectura: Estructura de Datos

Este documento define el formato y las especificaciones técnicas del archivo `libros.json`, que actúa como la base de datos principal y catálogo estático de la **Biblioteca Digital**.

---

## 🗃️ Estructura del Archivo

El catálogo consiste en una única matriz (Array) de objetos JSON. Cada objeto representa un libro y debe cumplir estrictamente con los siguientes campos y tipos de datos:

```json
{
  "id": 2848,
  "titulo": "Nombre del Libro",
  "autor": "Apellido, Nombre",
  "anio": 2024,
  "genero": "Novela",
  "descripcion": "Sinopsis breve del libro.",
  "pdf": "https://drive.google.com/file/d/XXXX_FILE_ID_XXXX/preview",
  "portada": "portadas/2848.webp"
}
```

---

## 📋 Diccionario de Campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| **`id`** | Entero | Sí | Identificador único y secuencial para cada libro. Se utiliza para enlazar la portada (`portadas/{id}.webp`) y controlar la navegación. |
| **`titulo`** | Cadena (String) | Sí | Nombre de la obra. Debe estar limpio de artefactos del nombre del archivo (como guiones o nombres de autor pegados). |
| **`autor`** | Cadena (String) | Sí | Creador de la obra. La convención actual del catálogo es usar el formato `Apellido, Nombre` para facilitar ordenamientos alfabéticos consistentes. |
| **`anio`** | Entero / Nulo | No | Año original de publicación. Si se desconoce por completo, se deja como `null` en el JSON. |
| **`genero`** | Cadena (String) | Sí | Categoría literaria. Debe coincidir con uno de los ~25 géneros estándar consolidados para no romper los filtros visuales. |
| **`descripcion`** | Cadena (String) | Sí | Breve sinopsis de 1 o 2 oraciones para mostrar en las tarjetas y detalles. Si no hay descripción, debe ir como cadena vacía `""`. |
| **`pdf`** | Cadena (String) | Sí | URL completa del visor de Google Drive en formato preview. Debe terminar obligatoriamente con `/preview`. |
| **`portada`** | Cadena (String) | Sí | Ruta relativa a la imagen de portada local. Ej: `portadas/12.webp`. Si el libro no tiene portada, se deja como cadena vacía `""`. |

---

## 📐 Reglas de Validación y Consistencia

Para evitar errores de renderizado en el sitio web, cualquier modificación manual o mediante scripts en `libros.json` debe respetar las siguientes restricciones:

1.  **Unicidad del ID:** No deben existir dos libros con el mismo valor en `"id"`.
2.  **Enlace de Drive Embebido:** La URL del campo `"pdf"` debe tener el formato `https://drive.google.com/file/d/{FILE_ID}/preview`. Si se usa el enlace normal `/view`, el navegador podría bloquear la visualización por políticas de seguridad debido al uso de iframes.
3.  **Géneros Permitidos:** Para que los filtros rápidos funcionen correctamente, los géneros deben estar normalizados de acuerdo al mapeo unificado. Géneros mal escritos (como "ciencia ficcion" en minúscula y sin acento) no se agruparán en el tag "Ciencia Ficción" del menú.
4.  **Codificación de Archivo:** El archivo debe guardarse en codificación **UTF-8 sin BOM** para evitar problemas al renderizar caracteres especiales y acentos en español (ej: `á`, `ñ`, `ü`).

---
**Notas Relacionadas:**
*   [[Guía - Normalización de Catálogo|Normalización y consolidación de géneros]]
*   [[Guía - Agregar Libro|Cómo agregar entradas al catálogo]]
*   [[Arquitectura - Vista General|Funcionamiento de la base de datos en memoria]]
