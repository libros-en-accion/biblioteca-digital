---
tipo: guia
area: operacion
tags: [guia, portadas, pdf, imagemagick, poppler, python]
fecha: 2026-05-30
---

# 🖼️ Guía: Generación de Portadas

Esta guía describe el funcionamiento y uso del script `generar_portadas.py`, encargado de extraer automáticamente la primera página de los PDFs locales y convertirlos en portadas WebP optimizadas para la galería web.

---

## 🚀 Cómo Ejecutar el Script

El script se ejecuta desde la raíz del proyecto. No requiere argumentos y procesa únicamente los libros del catálogo que no posean portada aún.

```bash
python3 generar_portadas.py
```

### Qué hace el script en segundo plano:
1.  Lee el archivo `libros.json` y crea un índice de búsqueda rápida por título normalizado.
2.  Escanea el directorio local de PDFs (`/home/daniel/biblioteca-digital/`).
3.  Para cada PDF encontrado, extrae candidatos de Título y Autor a partir de su nombre de archivo y carpeta contenedora.
4.  Si encuentra una coincidencia con un libro en `libros.json` y dicho libro no tiene portada, extrae la primera página del PDF.
5.  Optimiza la imagen y la guarda en `portadas/{id}.webp`.
6.  Actualiza el campo `"portada"` en `libros.json` con la ruta de la nueva imagen (ej: `portadas/2848.webp`).

---

## 🛠️ Dependencias del Sistema

Para que el script pueda procesar los PDFs e imágenes, el sistema Linux requiere dos utilidades clave instaladas en el sistema:

1.  **`pdftoppm`** (Parte del paquete `poppler-utils`): Se utiliza para renderizar la primera página del PDF a una imagen JPEG de alta calidad de manera veloz.
2.  **`convert`** (Parte de `ImageMagick`): Se utiliza para redimensionar la imagen JPEG extraída a un ancho de 300 píxeles, comprimirla al 65% de calidad y guardarla en formato WebP.

> [!important] Instalación en Linux (Ubuntu/Debian)
> Si no cuentas con estas herramientas, puedes instalarlas usando tu gestor de paquetes ejecutando:
> ```bash
> sudo apt-get update
> sudo apt-get install poppler-utils imagemagick
> ```

---

## 🧠 Algoritmo de Emparejamiento (Matching)

El script es muy tolerante a discrepancias menores de nombres gracias al proceso de **normalización**:
*   **Limpieza:** Convierte el texto a minúsculas, elimina acentos/diacríticos (ej. `ó` -> `o`), remueve caracteres especiales que no sean letras, números o espacios, y compacta espacios múltiples.
*   **Tolerancia a subtítulos:** Si el PDF contiene un subtítulo separado por guion (`-`) o dos puntos (`:`), el script intenta buscar coincidencias tanto con el título completo como con la primera parte de este.
*   **Desempate por Autor:** Si existen varios libros en el catálogo con el mismo título normalizado, el script los diferencia comparando el nombre normalizado del autor.

### Ejemplo de coincidencia exitosa:
*   Nombre en `libros.json`: `Título: "1984", Autor: "George Orwell"` (normalizado: `1984` y `george orwell`).
*   Nombre de archivo PDF: `/home/daniel/biblioteca-digital/O/Orwell, George/1984 - George Orwell.pdf`.
*   El script detecta la carpeta `Orwell, George` y el archivo `1984 - George Orwell.pdf` y realiza la asociación perfecta.

---

## ⚠️ Consideraciones de Rendimiento y Almacenamiento

*   **Seguridad ante todo:** El script no vuelve a procesar imágenes de portadas que ya existen en la carpeta `portadas/`, por lo que re-ejecutarlo es sumamente rápido (solo toma fracciones de segundo).
*   **Velocidad de procesamiento:** La generación de una nueva portada toma aproximadamente **1 segundo** por libro debido al renderizado del PDF y la compresión WebP.
*   **Tamaño de archivos:** Las portadas WebP a 300px y calidad 65 pesan en promedio entre **15 KB y 25 KB** cada una, lo cual es óptimo para la carga móvil de la biblioteca sin saturar el ancho de banda.

---
**Notas Relacionadas:**
*   [[Guía - Agregar Libro|Procedimiento de catalogación]]
*   [[Arquitectura - Estructura de Datos|Estructura detallada del archivo libros.json]]
*   [[Guía - Normalización de Catálogo|Normalización masiva de datos]]
