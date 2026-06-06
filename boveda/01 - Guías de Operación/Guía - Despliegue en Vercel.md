---
tipo: guia
area: operacion
tags: [guia, despliegue, vercel, serverless, node, libractiva]
fecha: 2026-06-05
---

# 🚀 Guía: Despliegue en Vercel

Esta guía detalla el entorno de ejecución, la configuración de variables de entorno y los procedimientos necesarios para desplegar y probar localmente la plataforma **Libractiva** en Vercel.

---

## 🏗️ Flujo de Despliegue Continuo (CI/CD)

El proyecto está conectado a Vercel mediante integración con GitHub. Esto automatiza por completo el flujo de despliegue:

```mermaid
sequenceDiagram
    participant Dev as Daniel (Local)
    participant GH as GitHub (Repositorio)
    participant V as Vercel (Producción)

    Dev->>GH: git push (rama principal)
    activate GH
    GH-->>V: Trigger Webhook
    deactivate GH
    activate V
    V->>V: Descargar cambios
    V->>V: Compilar y validar funciones serverless
    V->>V: Desplegar en producción (Edge Network)
    V-->>Dev: Notificación / Sitio actualizado 🚀
    deactivate V
```

---

## 🛠️ Desarrollo y Pruebas Locales

Dado que el recomendador inteligente utiliza una **función serverless** de Node.js ubicada en `api/recomendar.js`, abrir el archivo `index.html` directamente en el navegador no permitirá que la IA funcione (dará error al hacer peticiones a `/api/recomendar`).

Para emular el entorno de Vercel en tu computadora local:

### 1. Requisitos Previos
Debes tener instalado Vercel CLI globalmente en tu sistema a través de npm:
```bash
sudo npm install -g vercel
```

### 2. Iniciar el Servidor de Desarrollo Local
Ejecuta el siguiente comando en la raíz del proyecto para levantar el emulador:
```bash
vercel dev
# O alternativamente usando el script configurado en package.json:
npm run dev
```

Esto iniciará un servidor local (usualmente en [http://localhost:3000](http://localhost:3000)) que:
*   Sirve los archivos estáticos (`index.html`, `style.css`, `app.js`, `libros.json`, y la carpeta `portadas/`).
*   Expone las rutas `/api/*` mapeando correctamente la función local `api/recomendar.js`.
*   Carga tus variables de entorno locales si configuraste un archivo `.env` en la raíz.

---

## 🔑 Variables de Entorno

El proyecto requiere varias variables de entorno en producción (Vercel Dashboard) y locales (archivo `.env.local` o `.env` para desarrollo) para poder operar la IA, Cloudflare R2 y Redis Cloud:

### Listado de Variables de Entorno

| Variable | Descripción | Ubicación / Origen |
|---|---|---|
| **`DEEPSEEK_API_KEY`** | Clave de API para el modelo de recomendación de IA (`deepseek-v4-flash`). | Proveedor de la IA (DeepSeek Console) |
| **`R2_ENDPOINT`** | Endpoint de conexión S3 a tu Cloudflare R2. Formato: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | Cloudflare Dashboard > R2 |
| **`R2_ACCESS_KEY_ID`** | Token de acceso S3 para Cloudflare R2 con permisos de lectura/escritura. | Cloudflare Dashboard > R2 > Manage API Tokens |
| **`R2_SECRET_ACCESS_KEY`** | Clave secreta del token de acceso S3 de Cloudflare R2. | Cloudflare Dashboard > R2 > Manage API Tokens |
| **`R2_BUCKET_NAME`** | Nombre del bucket donde están alojados tus PDFs. Ej: `biblioteca-digital`. | Cloudflare Dashboard > R2 |
| **`REDIS_URL`** (o `KV_URL`) | URL de conexión TCP para la base de datos de donadores. Formato: `redis://default:password@host:port` | Redis Cloud Dashboard > Database settings |
| **`DONOR_COOKIE_SECRET`** | Cadena de texto larga y aleatoria usada para firmar las cookies de sesión del donador. | Inventada por el administrador (mín. 32 caracteres) |

### En Producción (Panel de Vercel)
Para configurarlas en el servidor de producción:
1.  Ingresa a tu dashboard de proyecto en [vercel.com](https://vercel.com).
2.  Navega a: **Settings** > **Environment Variables**.
3.  Agrega cada una de las variables con sus respectivos valores.
4.  Cualquier cambio requiere re-desplegar el sitio para que tenga efecto.

### En Desarrollo Local
1.  Copia el archivo `.env.example` en la raíz como `.env.local` o `.env` (ambos ignorados en Git por seguridad).
2.  Rellena las claves con tus datos de prueba. Vercel dev cargará automáticamente estas variables.
3.  Alternativamente, puedes ejecutar `vercel env pull` desde la terminal local para traer las variables configuradas en la nube a tu computadora.

---

## 📦 Configuración del Proyecto (`vercel.json`)

El archivo `vercel.json` en la raíz contiene las directivas esenciales para indicarle a Vercel el comportamiento del despliegue:

```json
{
  "version": 2,
  "public": true,
  "github": {
    "silent": true
  }
}
```

*   **`version: 2`**: Especifica el uso de la plataforma de despliegue Vercel 2.0 (basada en microservicios y serverless).
*   **`public: true`**: Permite ver el código fuente desplegado en el inspector de Vercel (opcional).
*   **`github.silent: true`**: Evita comentarios excesivos del bot de Vercel en los commits de GitHub.

---
**Notas Relacionadas:**
*   [[Guía - Git y Flujo de Trabajo|Actualizar la biblioteca mediante Git]]
*   [[Arquitectura - API de Recomendación|Cómo funciona internamente la API de DeepSeek]]
*   [[Guía - Agregar Libro|Procedimiento para subir un libro]]
