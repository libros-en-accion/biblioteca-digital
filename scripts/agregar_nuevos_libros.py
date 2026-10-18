#!/usr/bin/env python3
"""
scripts/agregar_nuevos_libros.py
Escanea la carpeta local biblioteca-digital/ buscando archivos PDF que no estén
registrados en libros.json y los agrega de forma interactiva preguntando al usuario
por su metadata (Título, Autor, Año, Género, Descripción) en caliente.
"""
import os
import json
import re
import sys
import unicodedata

PDF_DIR = "/home/daniel/biblioteca-digital"
JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

GENEROS_POPULARES = [
    "Novela", "Ensayo", "Ciencia Ficción", "Cuento", "Filosofía",
    "Fantasía", "Misterio y Thriller", "Divulgación Científica",
    "Romance", "Terror", "Poesía", "Teatro", "Psicología y Autoayuda",
    "Novela histórica", "Historia y Crónica", "Biografía y Memorias",
    "Novela juvenil", "Novela negra", "Epistolar",
    "Economía y Política", "Religión y Teología",
]

def normalizar_texto(texto):
    if not texto:
        return ""
    texto = texto.lower().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    texto = re.sub(r"[^a-z0-9]", "", texto)
    return texto

def revertir_nombre_autor(nombre_carpeta):
    """Convierte 'Allende, Isabel' -> 'Isabel Allende'."""
    if "," in nombre_carpeta:
        partes = nombre_carpeta.split(",", 1)
        return f"{partes[1].strip()} {partes[0].strip()}"
    return nombre_carpeta.strip()

def preguntar(texto, default=None, obligatorio=True):
    if default:
        prompt = f"  👉 {texto} [{default}]: "
    else:
        prompt = f"  👉 {texto}: "
    try:
        resp = input(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        print("\nOperación cancelada por el usuario.")
        sys.exit(0)
    if not resp and default:
        return default
    if not resp and obligatorio:
        print("    ⚠️  Campo obligatorio.")
        return preguntar(texto, default, obligatorio)
    return resp

def elegir_genero(libros):
    disponibles = sorted(set(l["genero"] for l in libros if l.get("genero")))
    todos = list(dict.fromkeys(GENEROS_POPULARES + disponibles))
    print("\n  📖 Géneros disponibles:")
    for i, g in enumerate(todos, 1):
        print(f"    {i:2d}. {g}")
    resp = input("\n  👉 Selecciona número de género o escribe uno nuevo: ").strip()
    if resp.isdigit():
        idx = int(resp) - 1
        if 0 <= idx < len(todos):
            return todos[idx]
    if resp:
        rl = resp.lower()
        hits = [g for g in todos if rl in g.lower()]
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            print(f"    ⚠️  Múltiples géneros coinciden: {', '.join(hits)}")
            return elegir_genero(libros)
        return resp
    return elegir_genero(libros)

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ No se encontró libros.json en {JSON_PATH}")
        return

    # Leer catálogo actual
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    # Crear conjunto de PDFs ya registrados
    pdf_registrados = set()
    max_id = 0
    for l in libros:
        if l.get("id", 0) > max_id:
            max_id = l["id"]
        ruta = l.get("archivo_pdf")
        if ruta:
            pdf_registrados.add(ruta.replace("\\", "/").strip())

    nuevos_agregados = 0
    print("🔍 Escaneando archivos PDF no registrados en local...")

    # Lista para almacenar los archivos a procesar
    pdfs_nuevos = []

    for raiz, dirs, archivos in os.walk(PDF_DIR):
        dirs[:] = [d for d in dirs if d != "001_EPUB" and not d.startswith(".")]

        for archivo in archivos:
            if not archivo.lower().endswith(".pdf"):
                continue

            ruta_abs = os.path.join(raiz, archivo)
            ruta_relativa = os.path.relpath(ruta_abs, PDF_DIR).replace("\\", "/").strip()

            if ruta_relativa not in pdf_registrados:
                pdfs_nuevos.append((ruta_relativa, archivo, os.path.basename(raiz)))

    if not pdfs_nuevos:
        print("\n✨ No se encontraron nuevos archivos PDF para agregar. Todo está al día.")
        return

    print(f"\n📚 Se detectaron {len(pdfs_nuevos)} libros nuevos sin registrar.")
    print("=" * 60)

    for idx_progreso, (ruta_relativa, archivo, nombre_carpeta_autor) in enumerate(pdfs_nuevos, 1):
        print(f"\n📖 [{idx_progreso}/{len(pdfs_nuevos)}] PROCESANDO NUEVO LIBRO")
        print(f"  Ruta local: {ruta_relativa}")
        print("-" * 60)

        # Autocompletado tentativo
        base = archivo.rsplit(".", 1)[0]
        titulo_auto = base
        autor_auto = revertir_nombre_autor(nombre_carpeta_autor)

        if " - " in base:
            partes = base.split(" - ", 1)
            p0_norm = partes[0].lower().strip()
            p1_norm = partes[1].lower().strip()
            carpeta_norm = nombre_carpeta_autor.lower().strip()
            autor_revertido_norm = autor_auto.lower().strip()

            if p1_norm in carpeta_norm or p1_norm in autor_revertido_norm:
                titulo_auto = partes[0].strip()
            elif p0_norm in carpeta_norm or p0_norm in autor_revertido_norm:
                titulo_auto = partes[1].strip()
            else:
                titulo_auto = partes[0].strip()
                autor_auto = partes[1].strip()

        titulo_auto = titulo_auto.replace("_", " ").strip()
        if titulo_auto.isupper() and len(titulo_auto) > 3:
            titulo_auto = titulo_auto.title()

        # Preguntar datos al usuario de forma estrictamente interactiva
        titulo = preguntar("Confirmar o editar Título", default=titulo_auto)
        autor = preguntar("Confirmar o editar Autor", default=autor_auto)
        
        # Validar año
        anio_valido = False
        anio = None
        while not anio_valido:
            anio_raw = preguntar("Año de publicación (o presiona Enter para 0/nulo)", obligatorio=False)
            if not anio_raw:
                anio = 0
                anio_valido = True
            elif anio_raw.isdigit():
                anio = int(anio_raw)
                anio_valido = True
            else:
                print("    ⚠️  El año debe ser un número entero.")

        genero = elegir_genero(libros)
        descripcion = preguntar("Ingresa una descripción breve del libro")

        max_id += 1
        nuevo_libro = {
            "id": max_id,
            "titulo": titulo,
            "autor": autor,
            "anio": anio,
            "genero": genero,
            "descripcion": descripcion,
            "portada": "",
            "archivo_pdf": ruta_relativa
        }

        libros.append(nuevo_libro)
        pdf_registrados.add(ruta_relativa)
        nuevos_agregados += 1
        print(f"✨ ¡Registrado con éxito! ID: {max_id} -> {titulo} — {autor}")

    if nuevos_agregados > 0:
        # Guardar catálogo actualizado
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(libros, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Proceso completado. Se agregaron {nuevos_agregados} nuevos libros a libros.json.")
        print("💡 Recuerda ejecutar el script de normalización si es necesario:")
        print("   node scripts/normalizar.js --apply")

if __name__ == "__main__":
    main()
