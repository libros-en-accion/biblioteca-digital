---
tipo: guia
area: operacion
tags: [guia, accesos, codigos, base-de-datos, redis, terminal, libractiva]
fecha: 2026-06-13
---

# 🔑 Guía: Gestión de Accesos y Códigos

Esta guía describe el funcionamiento del sistema de códigos de acceso (LTD), la seguridad del lector embebido y los procedimientos para crear, listar y eliminar códigos desde la terminal de tu computadora en **Libractiva**.

---

## ⚙️ Funcionamiento del Sistema

Para monetizar la plataforma mediante el modelo de **Pago Único (Lifetime Deal - LTD)** y garantizar la sostenibilidad del proyecto, Libractiva implementa las siguientes restricciones:

1. **Lector con Límite de Vista Previa:** Los usuarios normales pueden abrir el visor embebido (PDF.js) y leer gratuitamente hasta la **página 15** de cualquier libro. Al intentar pasar a la página 16, se les bloquea la lectura y se muestra un panel con un CTA directo para adquirir el Acceso Lifetime por $100 MXN o ingresar su código existente.
2. **Descargas Restringidas:** El botón para descargar el archivo PDF y EPUB completo en su computadora solo es visible y funcional para los usuarios que hayan validado su código de acceso. Las peticiones de descarga directa a la API son bloqueadas si no tienen la firma de la cookie del usuario activo.
3. **Límite de Dispositivos (Fingerprint):** Cada código de acceso está limitado por defecto a usarse en un máximo de **3 dispositivos** únicos de forma simultánea.

### 🛡️ Seguridad y Cookies
Cuando un usuario ingresa su código:
- La API serverless (`api/validar-codigo.js`) calcula un *fingerprint* del navegador (basado en User-Agent, idioma y dirección IP).
- Si el dispositivo es nuevo y no excede el límite de 3, lo registra en la base de datos Redis.
- Devuelve al navegador una cookie segura llamada `donor_token` (se mantiene el nombre interno por compatibilidad), la cual está firmada criptográficamente usando el `DONOR_COOKIE_SECRET`. Esto previene que los usuarios falsifiquen cookies para obtener acceso ilimitado.

---

## 🛠️ Administración de Códigos desde la Terminal

Los scripts de administración residen dentro de la carpeta `scripts/` de tu proyecto y se pueden ejecutar localmente para administrar los accesos en Redis Cloud.

> [!WARNING]
> Estos scripts contienen las credenciales de tu base de datos de Redis Cloud en sus variables de código. Por seguridad, están registrados en el archivo `.gitignore` para evitar que se suban accidentalmente a GitHub. **Nunca los compartas públicamente.**

### 1. Crear / Modificar un Código
Para registrar un nuevo acceso o actualizar el límite de un código existente:

```bash
python3 scripts/agregar_donador.py <CODIGO> [limite_dispositivos]
```
*(Nota: El nombre del script físico se conserva como `agregar_donador.py` para no romper dependencias, pero opera sobre códigos de acceso).*

*   **Ejemplo básico:**
    ```bash
    python3 scripts/agregar_donador.py LTD-JUAN
    ```
    *(Crea el código `LTD-JUAN` con un límite por defecto de 3 dispositivos).*
*   **Ejemplo con límite personalizado:**
    ```bash
    python3 scripts/agregar_donador.py LTD-ESPECIAL 5
    ```
    *(Crea el código con límite para 5 dispositivos).*
*   **Protección contra sobrescrituras:**
    Si intentas agregar un código que ya existe, el script te advertirá y te preguntará de forma interactiva si deseas sobrescribirlo (lo que borrará los dispositivos previamente registrados y liberará los cupos).
*   **Forzar sobrescritura:**
    Para saltarte la confirmación (por ejemplo, en scripts automáticos), añade la bandera `-f` o `--forzar`:
    ```bash
    python3 scripts/agregar_donador.py LTD-JUAN 3 --forzar
    ```

### 2. Listar Códigos Activos
Para ver un reporte completo de todos los códigos generados en tu base de datos, cuántos dispositivos han registrado cada uno y cuál es su límite:

```bash
python3 scripts/listar_donadores.py
```

*   **Ejemplo de salida:**
    ```text
    📋 Códigos registrados (2 en total):

    Código               | Dispositivos Usados    | Límite
    ---------------------------------------------------------
    LTD-DAN1907          | 1                      | 3
    LTD-JUAN             | 0                      | 3
    ```

### 3. Eliminar un Código
Si necesitas revocar el acceso de un código y borrarlo completamente de la base de datos:

```bash
python3 scripts/eliminar_donador.py <CODIGO>
```

*   **Ejemplo:**
    ```bash
    python3 scripts/eliminar_donador.py LTD-ANTONIO
    ```

---

## 🗃️ Generación y Control de Códigos en Local

Para generar nuevos códigos de forma segura sin repetirlos y mantener un control estricto de a quién se le entrega cada clave, se utiliza el sistema de administración local ubicado en:
`/home/daniel/002_CODIGOS/`

Este directorio contiene dos archivos clave:
1. `generar_codigo.py`: Script en Python encargado de generar códigos de acceso aleatorios **únicos (no repetidos)**.
2. `lista_codigos.csv`: Archivo que funge como base de datos local y registro histórico de los códigos.

### Estructura de lista_codigos.csv
El archivo CSV tiene las siguientes 4 columnas:
- **CODIGO:** El código de acceso único generado (ej. `LTD-XXXXXX` o `DONOR-XXXXXX`).
- **NOMBRE:** Nombre del usuario a quien se le asignó tras pagar.
- **CORREO:** Dirección de correo electrónico del usuario.
- **ESTATUS:** Estatus de disponibilidad del código (`disponible` o `usado`).

### Flujo de Trabajo para Entregar un Código:
1. **El usuario realiza el pago:** El usuario paga $100 MXN a través del enlace de Mercado Pago (`https://mpago.la/1Ek1HPz`).
2. **Generar el Código:** Ejecuta el generador local para obtener un nuevo código único disponible (esto lo registrará automáticamente en el CSV como `disponible`):
   ```bash
   python3 /home/daniel/002_CODIGOS/generar_codigo.py
   ```
3. **Asignar Información:** Abre `/home/daniel/002_CODIGOS/lista_codigos.csv`, localiza el código generado y asocia el **Nombre** y **Correo** del usuario comprador, cambiando su **Estatus** a `usado`.
4. **Activar el Código en la Nube (Redis):** Registra y activa el código en la base de datos de producción Redis de Libractiva usando el script del repositorio:
   ```bash
   # Posicionado en la carpeta ~/biblioteca
   python3 scripts/agregar_donador.py <CODIGO_GENERADO>
   ```
5. **Entrega:** Envía el código generado al usuario para que pueda ingresarlo en la interfaz web de Libractiva y desbloquear el acceso completo.

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
