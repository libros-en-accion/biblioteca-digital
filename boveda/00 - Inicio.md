---
tipo: MOC
proyecto: Biblioteca Digital
tags: [inicio, MOC, dashboard]
fecha: 2026-05-30
---

# 🧠 Cerebro Digital — Biblioteca Digital

Bienvenido al **Cerebro Digital** de tu Biblioteca Digital. Este espacio está diseñado como una bóveda de Obsidian para consolidar toda la información técnica y operativa de tu catálogo visual y recomendador IA.

---

## 🗺️ Mapa de Contenido (MOC)

```mermaid
graph TD
    Inicio[00 - Inicio] --> Guias[01 - Guías de Operación]
    Inicio --> Arq[02 - Arquitectura Técnica]

    Guias --> G1[Agregar Libro]
    Guias --> G2[Generar Portadas]
    Guias --> G3[Normalización de Catálogo]
    Guias --> G4[Despliegue en Vercel]
    Guias --> G5[Git y Flujo de Trabajo]
    Guias --> G6[Uso con Agentes de IA]
    Guias --> G7[Gestión de Donadores]
    Guias --> G8[Gestión de Destacados]

    Arq --> A1[Vista General]
    Arq --> A2[API de Recomendación]
    Arq --> A3[Estructura de Datos]
    Arq --> A4[Estructura del Proyecto]
    
    style Inicio fill:#7a1a2e,stroke:#b8892a,stroke-width:2px,color:#fff
    style Guias fill:#2c1810,stroke:#8a7060,color:#fff
    style Arq fill:#2c1810,stroke:#8a7060,color:#fff
```

### 📋 [01 - Guías de Operación]([[01 - Guías de Operación]])
Procedimientos operativos estándar (SOP) para el mantenimiento y actualización del catálogo.
*   [[Guía - Agregar Libro|Guía: Agregar Libro al Catálogo]]: Instrucciones para registrar nuevos PDFs.
*   [[Guía - Generar Portadas|Guía: Generación de Portadas]]: Extracción de WebPs desde tus PDFs.
*   [[Guía - Normalización de Catálogo|Guía: Normalizar Datos]]: Consolidación de géneros y limpieza de títulos.
*   [[Guía - Despliegue en Vercel|Guía: Despliegue en Vercel]]: Configuración y comandos de producción.
*   [[Guía - Git y Flujo de Trabajo|Guía: Comandos de Git]]: Flujo de trabajo para actualizar la web.
*   [[Guía - Uso con Agentes de IA|Guía: Uso con Agentes de IA (Claude/Hermes)]]: Cómo guiar a otras IAs de forma eficiente y económica.
*   [[Guía - Gestión de Donadores|Guía: Gestión de Donadores y Códigos]]: Administración de accesos, límites y comandos locales de terminal.
*   [[Guía - Gestión de Libros Destacados|Guía: Gestión de Libros Destacados]]: Administración de la sección de recomendados en la Home.

### ⚙️ [02 - Arquitectura Técnica]([[02 - Arquitectura Técnica]])
Documentación técnica sobre cómo está construido el sistema.
*   [[Arquitectura - Vista General|Vista General de la Arquitectura]]: Stack tecnológico y decisiones clave.
*   [[Arquitectura - API de Recomendación|API de Recomendación]]: La integración con la IA de DeepSeek v4 Flash.
*   [[Arquitectura - Estructura de Datos|Estructura de Datos (JSON)]]: Desglose de `libros.json`.
*   [[Arquitectura - Estructura del Proyecto|Estructura del Proyecto (Archivos)]]: Mapeo de directorios.

---

## ⚡ Enlaces Rápidos
*   **Repositorio Local:** `/home/daniel/biblioteca/`
*   **PDFs Almacenados:** `/home/daniel/biblioteca-digital/`
*   **URL de Producción Vercel:** [https://biblioteca-digital-eight.vercel.app/](https://biblioteca-digital-eight.vercel.app/)

> [!tip] Navegación en Obsidian
> Presiona `Ctrl + clic` (o `Cmd + clic` en Mac) sobre cualquiera de los enlaces con corchetes dobles para abrir la nota correspondiente en una nueva pestaña o panel lateral.
