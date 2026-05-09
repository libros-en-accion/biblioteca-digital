# Biblioteca Digital — PROYECTO

> Guia del proyecto. Actualizada 2026-05-08.

---

## Ficha tecnica

| | |
|---|---|
| **Descripcion** | Aplicacion web de catalogo visual de libros + recomendador IA |
| **Stack** | HTML, CSS, JavaScript plano (sin frameworks) + Vercel Serverless Function (Node.js) |
| **IA** | DeepSeek v4 Flash via API serverless (`api/recomendar.js`) |
| **Libros** | 2,847 titulos en `libros.json` |
| **Portadas** | 2,724 imagenes locales en `portadas/` (WebP, ~45 MB). 130 libros sin portada por falta de PDF coincidente. |
| **PDFs** | 2,847 enlaces a Google Drive (`/preview`). Almacenados localmente en `/home/daniel/biblioteca-digital/` |
| **Estado** | Desplegado en Vercel: https://biblioteca-digital-eight.vercel.app/ |
| **Git** | 43 commits — rama principal |

---

## Estructura del proyecto

```
biblioteca/
├── index.html              # Pagina principal
├── style.css               # Estilos (modo claro/oscuro, responsive)
├── app.js                  # Logica: galeria, busqueda, filtros, modal, paginacion
├── libros.json             # Catalogo completo (2,847 libros)
├── catalogo.csv            # Export CSV del catalogo
├── generar_portadas.py     # Script para extraer portadas desde PDFs locales
├── portadas/               # Imagenes de portada en WebP (~45 MB, 2,724 archivos)
│   ├── 1.webp
│   ├── 2.webp
│   └── ...
├── api/
│   └── recomendar.js       # Funcion serverless Vercel -> DeepSeek API
├── scripts/
│   └── normalizar.js       # Utilidad de normalizacion de datos
├── vercel.json             # Config de Vercel (version 2)
├── package.json            # Node 20.x, scripts dev/deploy
├── robots.txt              # SEO: permite crawlers en /, bloquea /api/ y /scripts/
├── sitemap.xml             # Sitemap basico
├── .gitignore
└── PROYECTO.md             # Este archivo
```

---

## Como agregar libros al proyecto

Cada vez que quieras sumar libros al catalogo, segui estos pasos en orden:

### 1. Preparar el PDF en Google Drive

1. Subi el PDF a tu Google Drive, dentro de la carpeta correspondiente en `/home/daniel/biblioteca-digital/{Letra}/{Autor}/`.
2. El archivo debe llamarse exactamente `{Titulo} - {Autor}.pdf`.
3. En Google Drive (web), hace clic derecho en el PDF > **Compartir** > **"Cualquiera con el enlace puede ver"** > copiar enlace.
4. El enlace tendra el formato `https://drive.google.com/file/d/{FILE_ID}/view`. Convertilo a formato preview:
   ```
   https://drive.google.com/file/d/{FILE_ID}/preview
   ```

### 2. Agregar la entrada en libros.json

Agrega un objeto al array en `libros.json` con esta estructura:

```json
{
  "id": 2848,
  "titulo": "Titulo del libro",
  "autor": "Nombre del Autor",
  "anio": 2024,
  "genero": "Novela",
  "descripcion": "Breve descripcion del libro.",
  "pdf": "https://drive.google.com/file/d/{FILE_ID}/preview",
  "portada": ""
}
```

- **`id`**: numero unico, autoincremental (ultimo usado + 1).
- **`titulo`**: exactamente igual que el nombre del archivo PDF (parte antes del ` - `).
- **`autor`**: como figura en el JSON existente.
- **`portada`**: dejalo vacio `""`. Se completa en el paso 3.

### 3. Generar la portada

Ejecuta el script desde la raiz del proyecto:

```bash
python3 generar_portadas.py
```

El script:
- Recorre los PDFs en `/home/daniel/biblioteca-digital/`
- Empareja cada PDF con su libro por titulo normalizado
- Extrae la primera pagina del PDF como imagen WebP (300px de ancho)
- La guarda en `portadas/{id}.webp`
- Actualiza el campo `portada` en `libros.json`

Es seguro re-ejecutarlo: solo procesa libros cuya portada no existe aun.

### 4. Verificar y desplegar

```bash
# Verificar que el JSON es valido
python3 -c "import json; json.load(open('libros.json')); print('OK')"

# Commitear y pushear (Vercel despliega automaticamente)
git add libros.json portadas/
git commit -m "nuevo libro: Titulo del libro"
git push
```

### Notas importantes

- Si el titulo en `libros.json` no coincide con el nombre del archivo PDF (ignorando mayusculas y acentos), el script no encontrara el match y la portada quedara vacia.
- Si el PDF no esta compartido como "Cualquiera con el enlace", el link de preview no funcionara en la web.
- Si queres agregar muchos libros de una vez, el script tarda ~1 segundo por portada nueva (extrae miniatura del PDF).

---

## Roadmap

### Completado

- [x] Normalizar generos duplicados (Ciencia Ficcion, Divulgacion Cientifica, Filosofia Politica)
- [x] Corregir IDs duplicados (Ghostgirl)
- [x] Crear `vercel.json`, `package.json`, `.gitignore`
- [x] Configurar deploy en Vercel (via GitHub, auto-deploy)
- [x] Variables de entorno (`DEEPSEEK_API_KEY` en Vercel)
- [x] Portadas locales (extraidas de PDFs, formato WebP)
- [x] `robots.txt` y `sitemap.xml`
- [x] Modo oscuro

### Pendiente

- [ ] Migrar `onclick` inline a event listeners — consistencia JS
- [ ] Refinar paginacion — IDs no secuenciales, saltos grandes
- [ ] Agregar mas generos como filtros rapidos (Novela historica, Romance/Drama, Thriller)
- [ ] Vista de detalle del libro con info extendida (modal)
- [ ] Estadisticas del catalogo
- [ ] PWA (service worker para offline)
- [ ] Cache de recomendaciones IA

---

## Configuracion para deploy

### Variables de entorno (Vercel)

Configurado en Vercel dashboard (Project > Settings > Environment Variables):

```
DEEPSEEK_API_KEY=sk-...
```

### Deploy

El proyecto esta conectado a GitHub. Cada `git push` a la rama principal dispara un deploy automatico en Vercel.

Para desarrollo local:

```bash
vercel dev        # servidor local que emula Vercel (incluye API)
```

---

## Decisiones tecnicas

- **Portadas locales en WebP**: antes se usaban URLs efimeras de Google Drive (`lh3.googleusercontent.com/drive-storage/...`) que caducaban. Ahora las portadas se extraen de los PDFs locales con `pdftoppm`, se convierten a WebP (300px, calidad 65) y se alojan en el repositorio. No dependen de servicios externos.
- **DeepSeek v4 Flash**: modelo IA economico (~$0.35/M tokens input) con cache activado. El system message incluye el catalogo completo; tras la primera llamada DeepSeek cachea el prefijo, reduciendo costo ~80% en consultas subsecuentes.
- **Sin frameworks**: vanilla JS para mantener el proyecto ligero y sin dependencias.
- **PDFs en Google Drive**: todos los enlaces usan `drive.google.com/.../preview` para visualizacion embebida. Los archivos deben estar compartidos como "Cualquiera con el enlace puede ver".

---

## Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-05-08 | Portadas: reemplazadas URLs efimeras de Drive por imagenes WebP locales extraidas de PDFs |
| 2026-05-08 | Creado `generar_portadas.py` para automatizar la extraccion de portadas |
| 2026-05-04 | Normalizacion de 3 grupos de generos duplicados |
| 2026-05-04 | Corregidos 3 IDs duplicados en libros Ghostgirl (IDs 2846-2848) |
| 2026-05-04 | Creados vercel.json, package.json, .gitignore, PROYECTO.md |
| 2026-05-01 | Migracion a DeepSeek v4 Flash (cache hit) |
| 2026-03-31 | +3 libros Ghostgirl |
| 2026-03-26 | Rediseno visual completo, modo oscuro, scroll horizontal de tags |
| 2026-03-25 | Recomendador de libros con IA |
| 2026-03-21 | Primer commit: biblioteca digital funcional |
