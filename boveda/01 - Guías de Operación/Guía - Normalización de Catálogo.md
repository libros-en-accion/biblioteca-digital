---
tipo: guia
area: operacion
tags: [guia, normalizacion, js, catalogo, limpieza]
fecha: 2026-05-30
---

# 🏷️ Guía: Normalización de Catálogo

Esta guía detalla el funcionamiento de la herramienta de normalización de datos (`scripts/normalizar.js`), diseñada para unificar criterios en el catálogo, limpiar títulos sucios y consolidar la taxonomía de géneros literarios.

---

## 🧐 ¿Por qué normalizar el catálogo?

A lo largo del desarrollo del proyecto, el archivo `libros.json` acumuló más de **278 géneros únicos** debido a la falta de unificación (por ejemplo: "ciencia ficcion", "ciencia ficción", "cf", "ciencia ficción / terror", "distopía", etc.). 

El script de normalización soluciona esto reduciendo y unificando el catálogo a aproximadamente **25 géneros principales**, lo que permite:
1.  **Filtros consistentes:** Que los tags del frontend agrupen correctamente los libros.
2.  **Eficiencia en la IA:** Reducir la cantidad de tokens que la IA de DeepSeek debe procesar, facilitando su comprensión semántica de los géneros.
3.  **Calidad visual:** Eliminar títulos redundantes que contienen el nombre del autor pegado (ej. `"Mujercitas-Alcott Louisa May"` -> `"Mujercitas"`).

---

## 🚀 Cómo Ejecutar la Normalización

El script está construido en Node.js y se ejecuta desde la raíz del proyecto. Cuenta con un modo seguro de "vista previa" por defecto.

### 1. Modo Vista Previa (Preview - Seguro)
Muestra en la terminal un listado de los cambios propuestos (títulos, autores y géneros que se verían afectados) sin modificar ningún archivo.
```bash
node scripts/normalizar.js
```

### 2. Modo Aplicación (Apply - Modifica el archivo)
Aplica los cambios directamente sobre `libros.json`. El script genera automáticamente una copia de seguridad del catálogo antes de alterarlo.
```bash
node scripts/normalizar.js --apply
```

> [!important] Copias de seguridad automáticas
> Al ejecutar el script con `--apply`, se creará un archivo de respaldo llamado `libros.json.pre-normalizar.bak` en la raíz. Si ocurre algún inconveniente, puedes restaurar tu catálogo simplemente renombrando el backup de vuelta a `libros.json`.

---

## 🗺️ Mapa de Consolidación de Géneros

A continuación se muestra una muestra de cómo se agrupan los géneros originales en categorías estándar:

| Género de Destino | Algunos Géneros Originales Mapeados |
|---|---|
| **Novela** | novela, ficción, realismo mágico, drama, literatura |
| **Novela histórica** | novela histórica, ficción histórica, relato histórico |
| **Novela juvenil** | literatura juvenil, infantil, cuentos infantiles |
| **Novela negra** | novela negra, policial, crimen, thriller/policial, espionaje |
| **Ciencia Ficción** | ciencia ficción, cf, novela distópica, distopía |
| **Fantasía** | fantasía épica, fantasía oscura, épica |
| **Terror** | terror, novela gótica, terror cósmico, relatos de terror |
| **Misterio y Thriller** | misterio, thriller psicológico, suspense, aventuras |
| **Cuento** | cuento fantástico, antología de relatos, cuentos, fábulas |
| **Ensayo** | ensayo político, ensayo histórico, aforismos, crítica |
| **Filosofía** | filosofía política, teoría política, epistemología |
| **Divulgación Científica** | divulgación, ciencia, sociología, antropología |
| **Psicología y Autoayuda** | autoayuda, espiritualidad, psicología |
| **Biografía y Memorias** | autobiografía, memorias, diario, diario íntimo |

---

## 🧹 Reglas de Limpieza Automática

Además del mapeo de géneros, el script ejecuta las siguientes transformaciones en los textos:

### Para Títulos:
*   Reemplaza múltiples guiones bajos (`_`) por espacios.
*   Compacta espacios repetidos.
*   **Capitalización inteligente:** Si un título está completamente en mayúsculas, lo convierte a formato título (ej. `CRIMEN Y CASTIGO` -> `Crimen Y Castigo`).

### Para Autores:
*   Remueve espacios en blanco innecesarios en los extremos.
*   Normaliza el formato a `Apellido, Nombre` cuando corresponde.
*   Asegura que la primera letra del nombre y apellido siempre comience con mayúscula.

---
**Notas Relacionadas:**
*   [[Arquitectura - Estructura de Datos|Campos del catálogo libros.json]]
*   [[Guía - Agregar Libro|Cómo añadir libros sin romper el formato]]
*   [[Auditoría UX y Plan de Mejoras|Hallazgos de la auditoría de datos]]
