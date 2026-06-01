---
tipo: guia
area: operacion
tags: [guia, donadores, codigos, base-de-datos, redis, terminal]
fecha: 2026-06-01
---

# 🔑 Guía: Gestión de Donadores y Códigos

Esta guía describe el funcionamiento del sistema de códigos de donadores, la seguridad del lector embebido y los procedimientos para crear, listar y eliminar códigos desde la terminal de tu computadora.

---

## ⚙️ Funcionamiento del Sistema

Para motivar la donación voluntaria y mantener la sostenibilidad del proyecto, la biblioteca implementa las siguientes restricciones:

1. **Lector con Límite de Vista Previa:** Los usuarios normales pueden abrir el visor embebido (PDF.js) y leer gratuitamente hasta la **página 15** de cualquier libro. Al intentar pasar a la página 16, se les bloquea la lectura y se muestra un aviso invitándoles a ingresar un código de donador.
2. **Descargas Restringidas:** El botón para descargar el archivo PDF completo en su computadora solo es visible y funcional para los usuarios que hayan validado un código de donador en el navegador. Las peticiones de descarga directa a la API son bloqueadas si no tienen la firma de la cookie del donador.
3. **Límite de Dispositivos (Fingerprint):** Cada código de donador está limitado por defecto a usarse en un máximo de **3 dispositivos** únicos de forma simultánea.

### 🛡️ Seguridad y Cookies
Cuando un donador ingresa su código:
- La API serverless (`api/validar-codigo.js`) calcula un *fingerprint* del navegador (basado en User-Agent, idioma y dirección IP).
- Si el dispositivo es nuevo y no excede el límite de 3, lo registra en la base de datos Redis.
- Devuelve al navegador una cookie segura llamada `donor_token`, la cual está firmada criptográficamente usando el `DONOR_COOKIE_SECRET`. Esto previene que los usuarios falsifiquen cookies para obtener acceso ilimitado.

---

## 🛠️ Administración de Códigos desde la Terminal

Hemos creado un conjunto de scripts en Python dentro de la carpeta `scripts/` de tu proyecto para que puedas administrar los códigos directamente de forma local, sin necesidad de ingresar a paneles web complicados.

> [!WARNING]
> Estos scripts contienen las credenciales de tu base de datos de Redis Cloud en sus variables de código. Por seguridad, están registrados en el archivo `.gitignore` para evitar que se suban accidentalmente a GitHub. **Nunca los compartas públicamente.**

### 1. Crear / Modificar un Código
Para registrar un nuevo donador o actualizar el límite de un código existente:

```bash
python3 scripts/agregar_donador.py <CODIGO> [limite_dispositivos]
```

*   **Ejemplo básico:**
    ```bash
    python3 scripts/agregar_donador.py DONOR-JUAN
    ```
    *(Crea el código `DONOR-JUAN` con un límite por defecto de 3 dispositivos).*
*   **Ejemplo con límite personalizado:**
    ```bash
    python3 scripts/agregar_donador.py DONOR-ESPECIAL 5
    ```
    *(Crea el código con límite para 5 dispositivos).*
*   **Protección contra sobrescrituras:**
    Si intentas agregar un código que ya existe, el script te advertirá y te preguntará de forma interactiva si deseas sobrescribirlo (lo que borrará los dispositivos previamente registrados y liberará los cupos).
*   **Forzar sobrescritura:**
    Para saltarte la confirmación (por ejemplo, en scripts automáticos), añade la bandera `-f` o `--forzar`:
    ```bash
    python3 scripts/agregar_donador.py DONOR-JUAN 3 --forzar
    ```

### 2. Listar Códigos Activos
Para ver un reporte completo de todos los códigos generados en tu base de datos, cuántos dispositivos han registrado cada uno y cuál es su límite:

```bash
python3 scripts/listar_donadores.py
```

*   **Ejemplo de salida:**
    ```text
    📋 Códigos de donador registrados (2 en total):

    Código               | Dispositivos Usados    | Límite
    ---------------------------------------------------------
    DONOR-DAN1907        | 1                      | 3
    DONOR-JUAN           | 0                      | 3
    ```

### 3. Eliminar un Código
Si necesitas revocar el acceso de un código de donador y borrarlo completamente de la base de datos:

```bash
python3 scripts/eliminar_donador.py <CODIGO>
```

*   **Ejemplo:**
    ```bash
    python3 scripts/eliminar_donador.py DONOR-ANTONIO
    ```

---

## 🖥️ Administración Visual (Redis Insight)

Si prefieres realizar estas tareas mediante una interfaz gráfica de usuario (GUI) en el navegador:

1. Entra a tu dashboard de **[Redis Cloud](https://cloud.redis.io)**.
2. Selecciona tu base de datos `biblioteca-kv`.
3. En el apartado **View and manage data with Redis Insight**, haz clic en el botón **Launch**.
4. Se abrirá una interfaz gráfica interactiva en otra pestaña donde podrás examinar todas las llaves (en formato `donor:code:*`), modificar el JSON interno de los dispositivos a mano o eliminar llaves usando el icono de bote de basura.

---
**Notas Relacionadas:**
*   [[Arquitectura - Estructura de Datos|Estructura de datos y esquema de claves en Redis]]
*   [[Arquitectura - Vista General|Stack técnico y flujos del lector embebido]]
*   [[Guía - Despliegue en Vercel|Configuración de variables de entorno de producción]]
