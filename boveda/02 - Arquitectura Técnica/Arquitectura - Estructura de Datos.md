---
tipo: arquitectura
area: tecnica
tags: [arquitectura, datos, json, base-de-datos, libractiva]
fecha: 2026-06-15
---

# 📊 Arquitectura: Estructura de Datos

Este documento define el formato y las especificaciones técnicas del archivo `libros.json`, que actúa como la base de datos principal y catálogo estático de **Libractiva**.

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
  "portada": "portadas/2848.webp",
  "archivo_pdf": "N/Nombre de Autor/Nombre del Libro - Nombre de Autor.pdf"
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
| **`pdf`** | Cadena (String) | Sí | URL completa del visor de Google Drive en formato preview. Actúa como método alternativo o fallback si el libro no tiene PDF en Cloudflare R2. |
| **`portada`** | Cadena (String) | Sí | Ruta relativa a la imagen de portada local. Ej: `portadas/12.webp`. Si el libro no tiene portada, se deja como cadena vacía `""`. |
| **`archivo_pdf`** | Cadena / Nulo | No | Ruta relativa del archivo PDF en el bucket de Cloudflare R2. Sirve de llave del objeto para generar los enlaces seguros y cargar el lector embebido. Ej: `A/Allende, Isabel/La casa de los espiritus - Isabel Allende.pdf`. |

---

## 📂 Colecciones Temáticas (`colecciones.json`)

El archivo `/home/daniel/biblioteca/colecciones.json` contiene la estructura y definición de los packs temáticos exclusivos de Libractiva. Consiste en un Array de objetos con el siguiente esquema:

```json
{
  "id": "evitar-burnout",
  "titulo": "Ficción para escapar del burnout: Novelas terapéuticas",
  "portada_pack": "portadas/pack-burnout.webp",
  "libros": [2896, 2346, 1988]
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| **`id`** | String | Sí | Identificador único y amigable del pack, utilizado por el filtrado en frontend. |
| **`titulo`** | String | Sí | Nombre de la colección desplegado al usuario. |
| **`portada_pack`** | String | Sí | Ruta relativa a la imagen WebP de portada del pack. |
| **`libros`** | Array (int) | Sí | Listado de IDs numéricos que componen la colección. |

---

## 🗄️ Base de Datos de Donadores (Upstash Redis / Vercel KV)

El sistema utiliza una base de datos Redis en la nube para gestionar los códigos de donador y los límites de dispositivos.

### Estructura de Claves

#### Código de Donador
*   **Formato de Clave:** `donor:code:{CODIGO_EN_MAYUSCULAS}`
*   **Tipo de Dato:** String (que almacena un JSON serializado)
*   **Ejemplo de Clave:** `donor:code:DONOR-DAN1907`
*   **Ejemplo de Valor (JSON):**
    ```json
    {
      "dispositivos": ["a3b5c7d8e9f01234", "b4c5d6e7f8a90123"],
      "limite": 3
    }
    ```

##### Campos del JSON:
*   `dispositivos` (Array de Strings): Lista de hashes SHA-256 de 16 caracteres, que representan los fingerprints de los navegadores que han activado el código.
*   `limite` (Entero): Cantidad máxima de dispositivos únicos que pueden activar el mismo código (por defecto, `3`).

---

## 📐 Reglas de Validación y Consistencia

Para evitar errores de renderizado en el sitio web, cualquier modificación manual o mediante scripts en `libros.json` debe respetar las siguientes restricciones:

1.  **Unicidad del ID:** No deben existir dos libros con el mismo valor en `"id"`.
2.  **Ruta de R2 Normalizada:** El campo `"archivo_pdf"` debe tener las barras inclinadas hacia adelante `/` como separadores (estilo UNIX), incluso si los scripts corren en Windows, para coincidir con la estructura de Cloudflare R2.
3.  **Enlace de Drive Embebido:** La URL del campo `"pdf"` debe tener el formato `https://drive.google.com/file/d/{FILE_ID}/preview`. Si se usa el enlace normal `/view`, el navegador podría bloquear la visualización por políticas de seguridad debido al uso de iframes.
4.  **Géneros Permitidos:** Para que los filtros rápidos funcionen correctamente, los géneros deben estar normalizados de acuerdo al mapeo unificado. Géneros mal escritos (como "ciencia ficcion" en minúscula y sin acento) no se agruparán en el tag "Ciencia Ficción" del menú.
5.  **Codificación de Archivo:** El archivo debe guardarse en codificación **UTF-8 sin BOM** para evitar problemas al renderizar caracteres especiales y acentos en español (ej: `á`, `ñ`, `ü`).

---
**Notas Relacionadas:**
*   [[Guía - Normalización de Catálogo|Normalización y consolidación de géneros]]
*   [[Guía - Agregar Libro|Cómo agregar entradas al catálogo]]
*   [[Arquitectura - Vista General|Funcionamiento de la base de datos en memoria]]
