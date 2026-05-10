#!/usr/bin/env python3
"""
agregar_libro.py — Helper para agregar libros al catálogo Biblioteca Digital.

Modos de uso:

  1) INTERACTIVO (recomendado en laptop):
     python3 agregar_libro.py

  2) DESDE RCLONE (cuando el PDF está en Google Drive):
     python3 agregar_libro.py --rclone "biblioteca:biblioteca-digital/W/Autor/libro.pdf"

  3) BATCH (todos los datos vía argumentos):
     python3 agregar_libro.py \\
       --titulo "..." \\
       --autor "..." \\
       --anio 2024 \\
       --genero "Novela" \\
       --descripcion "..." \\
       --pdf "https://drive.google.com/file/d/XXXX/preview" \\
       [--rclone "ruta/remota/pdf" | --pdf-local "~/Descargas/libro.pdf"]

Ejemplos:
    python3 agregar_libro.py --rclone "biblioteca:biblioteca-digital/W/Wolynn, Mark/Este dolor no es mío.pdf"
    python3 agregar_libro.py --batch --titulo "1984" --autor "George Orwell" --genero "Ciencia Ficción" --pdf-local ~/Descargas/1984.pdf
"""

import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "libros.json")
PDF_DIR = "/home/daniel/biblioteca-digital"


# ─── helpers ──────────────────────────────────────────

def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"[^a-z0-9 ]", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def primera_letra(titulo):
    for c in titulo:
        if c.isalpha():
            return c.upper()
    return "Z"


def leer_json():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def guardar_json(libros):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros, f, ensure_ascii=False, indent=2)


def proximo_id(libros):
    return libros[-1]["id"] + 1


# ─── modo batch ───────────────────────────────────────

def batch(args):
    libros = leer_json()
    print(f"📊 Catálogo: {len(libros)} libros (último ID: {libros[-1]['id']})")

    titulo = args.titulo
    autor = args.autor

    if not titulo or not autor:
        print("❌ --titulo y --autor son obligatorios en modo batch.")
        sys.exit(1)

    libro = {
        "id": proximo_id(libros),
        "titulo": titulo,
        "autor": autor,
        "anio": args.anio,
        "genero": args.genero or "Otro",
        "descripcion": args.descripcion or "",
        "pdf": args.pdf or "",
        "portada": "",
    }

    # ── Obtener PDF ──
    pdf_origen = None
    if args.rclone:
        print(f"📥 Descargando desde rclone: {args.rclone}")
        r = subprocess.run(
            ["rclone", "copy", "--drive-acknowledge-abuse", args.rclone, PDF_DIR],
            capture_output=True, text=True, timeout=60
        )
        if r.returncode != 0:
            print(f"❌ Error rclone: {r.stderr[:200]}")
            sys.exit(1)
        nombre = os.path.basename(args.rclone)
        for raiz, dirs, archivos in os.walk(PDF_DIR):
            if nombre in archivos:
                pdf_origen = os.path.join(raiz, nombre)
                break
        if pdf_origen:
            print(f"  ✅ PDF descargado")
        else:
            print(f"  ⚠️  Descargado pero no localizado — la portada podría fallar")
    elif args.pdf_local:
        pdf_origen = os.path.expanduser(args.pdf_local)
        if not os.path.exists(pdf_origen):
            print(f"❌ No existe: {pdf_origen}")
            sys.exit(1)

    # ── Copiar PDF a biblioteca-digital ──
    if pdf_origen and os.path.exists(pdf_origen):
        letra = primera_letra(titulo)
        autor_dir = autor.strip()
        dest_dir = os.path.join(PDF_DIR, letra, autor_dir)
        dest_file = os.path.join(dest_dir, f"{titulo} - {autor}.pdf")
        if not os.path.exists(dest_file):
            os.makedirs(dest_dir, exist_ok=True)
            subprocess.run(["cp", pdf_origen, dest_file], check=True)
            print(f"📄 PDF copiado a: {dest_file}")
        else:
            print(f"📄 PDF ya existente: {dest_file}")

    # ── Agregar a JSON ──
    libros.append(libro)
    guardar_json(libros)
    print(f"✅ Entrada agregada (ID {libro['id']})")

    # ── Portada ──
    print("🖼  Extrayendo portada...")
    r = subprocess.run(
        ["python3", os.path.join(BASE_DIR, "generar_portadas.py")],
        capture_output=True, text=True, timeout=120
    )
    print(r.stdout.strip())
    if r.stderr:
        print(f"  ⚠️  {r.stderr[:200]}")

    # ── Verificar ──
    libros = leer_json()
    entry = next((l for l in libros if l["id"] == libro["id"]), None)
    if entry and entry.get("portada"):
        ruta_portada = os.path.join(BASE_DIR, entry["portada"])
        if os.path.exists(ruta_portada):
            kb = os.path.getsize(ruta_portada) / 1024
            print(f"🖼  Portada: {entry['portada']} ({kb:.1f} KB)")
    elif entry and not entry.get("portada"):
        print("⚠️  Portada no generada — revisa que el título coincida con el nombre del PDF")

    # Validar JSON
    try:
        json.loads(open(JSON_PATH).read())
        print("✅ JSON válido")
    except json.JSONDecodeError as e:
        print(f"❌ JSON inválido: {e}")

    print(f"🎉 Libro agregado: {titulo} — {autor} (ID {libro['id']})")


# ─── modo interactivo ─────────────────────────────────

GENEROS_POPULARES = [
    "Novela", "Ensayo", "Ciencia Ficción", "Cuento", "Filosofía",
    "Fantasía", "Misterio y Thriller", "Divulgación Científica",
    "Romance", "Terror", "Poesía", "Teatro", "Psicología y Autoayuda",
    "Novela histórica", "Historia y Crónica", "Biografía y Memorias",
    "Novela juvenil", "Novela negra", "Epistolar",
    "Economía y Política", "Religión y Teología",
]


def preguntar(texto, default=None, obligatorio=True):
    if default:
        prompt = f"{texto} [{default}]: "
    else:
        prompt = f"{texto}: "
    try:
        resp = input(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        print("\nOperación cancelada.")
        sys.exit(0)
    if not resp and default:
        return default
    if not resp and obligatorio:
        print("  ⚠️  Campo obligatorio.")
        return preguntar(texto, default, obligatorio)
    return resp


def elegir_genero(libros):
    disponibles = sorted(set(l["genero"] for l in libros if l.get("genero")))
    todos = list(dict.fromkeys(GENEROS_POPULARES + disponibles))
    print("\n📖 Géneros:")
    for i, g in enumerate(todos, 1):
        print(f"  {i:2d}. {g}")
    resp = input("\nNúmero o escribe el nombre: ").strip()
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
            print(f"  Múltiples: {', '.join(hits)}")
            return elegir_genero(libros)
        return resp
    return elegir_genero(libros)


def interactivo():
    libros = leer_json()
    print(f"\n📊 Catálogo: {len(libros)} libros (último ID: {libros[-1]['id']})")

    # ── 1. Obtener PDF ──
    print("\n" + "=" * 50)
    print("📄 ORIGEN DEL PDF")
    print("=" * 50)
    print("  1) Ruta local")
    print("  2) Ya está en ~/biblioteca-digital/")
    print("  3) Desde Google Drive (rclone)")
    opc = input("\n  Opción [1/2/3]: ").strip()

    pdf_origen = None
    if opc == "2":
        pdf_origen = "existe"
    elif opc == "3":
        remoto = input("  Ruta rclone (ej: biblioteca:biblioteca-digital/W/...): ").strip()
        if remoto:
            print("\n📥 Descargando...")
            r = subprocess.run(
                ["rclone", "copy", "--drive-acknowledge-abuse", remoto, PDF_DIR],
                capture_output=True, text=True, timeout=60
            )
            if r.returncode != 0:
                print(f"  ❌ Error: {r.stderr[:200]}")
            else:
                nombre = os.path.basename(remoto)
                for raiz, dirs, archivos in os.walk(PDF_DIR):
                    if nombre in archivos:
                        pdf_origen = os.path.join(raiz, nombre)
                        print(f"  ✅ Descargado: {pdf_origen}")
                        break
                if not pdf_origen:
                    print("  ⚠️  Descargado pero no ubicado")
    else:
        ruta = os.path.expanduser(input("  Ruta del PDF: ").strip())
        if os.path.exists(ruta):
            pdf_origen = ruta
        else:
            print("  ❌ No encontrado")

    # ── 2. Datos ──
    print("\n" + "=" * 50)
    print("📝 DATOS DEL LIBRO")
    print("=" * 50)

    titulo_auto = autor_auto = ""
    if pdf_origen and pdf_origen != "existe":
        nombre = os.path.splitext(os.path.basename(pdf_origen))[0]
        if " - " in nombre:
            partes = nombre.split(" - ", 1)
            titulo_auto, autor_auto = partes[0].strip(), partes[1].strip()

    titulo = preguntar("Título", default=titulo_auto or None)
    autor = preguntar("Autor", default=autor_auto or None)
    anio_raw = preguntar("Año", obligatorio=False)
    anio = int(anio_raw) if anio_raw and anio_raw.isdigit() else None
    genero = elegir_genero(libros)
    desc = preguntar("Descripción", obligatorio=False)
    url_pdf = preguntar("Link de Google Drive", obligatorio=False)

    if url_pdf and "/preview" not in url_pdf:
        m = re.search(r"/file/d/([^/]+)", url_pdf)
        if m:
            url_pdf = f"https://drive.google.com/file/d/{m.group(1)}/preview"
            print(f"  🔗 Convertido: {url_pdf}")

    libro = {
        "id": proximo_id(libros),
        "titulo": titulo,
        "autor": autor,
        "anio": anio,
        "genero": genero,
        "descripcion": desc or "",
        "pdf": url_pdf or "",
        "portada": "",
    }

    # ── 3. Copiar PDF ──
    if pdf_origen and pdf_origen != "existe" and os.path.exists(pdf_origen):
        letra = primera_letra(titulo)
        autor_dir = autor.strip()
        dest_dir = os.path.join(PDF_DIR, letra, autor_dir)
        dest_file = os.path.join(dest_dir, f"{titulo} - {autor}.pdf")
        if not os.path.exists(dest_file):
            os.makedirs(dest_dir, exist_ok=True)
            subprocess.run(["cp", pdf_origen, dest_file], check=True)
            print(f"\n📄 Copiado a: {dest_file}")
        else:
            print(f"\n📄 Ya existe: {dest_file}")
    elif pdf_origen == "existe":
        print("\n📄 PDF ya en ~/biblioteca-digital/")

    # ── 4. JSON ──
    libros.append(libro)
    guardar_json(libros)
    print(f"✅ Entrada agregada (ID {libro['id']})")

    # ── 5. Portada ──
    print("\n🖼  Extrayendo portada...")
    subprocess.run(
        ["python3", os.path.join(BASE_DIR, "generar_portadas.py")],
        timeout=120
    )

    # ── 6. Verificar ──
    libros = leer_json()
    entry = next((l for l in libros if l["id"] == libro["id"]), None)
    print("\n" + "=" * 50)
    print("🔍 RESULTADO")
    print("=" * 50)
    if entry:
        print(f"  ✅ ID: {entry['id']}")
        print(f"  ✅ Título: {entry['titulo']}")
        print(f"  ✅ Autor: {entry['autor']}")
        if entry.get("anio"): print(f"  ✅ Año: {entry['anio']}")
        print(f"  ✅ Género: {entry['genero']}")
        if entry.get("portada"):
            ruta_p = os.path.join(BASE_DIR, entry["portada"])
            if os.path.exists(ruta_p):
                print(f"  ✅ Portada: {entry['portada']} ({os.path.getsize(ruta_p)/1024:.1f} KB)")
        else:
            print(f"  ⚠️  Sin portada — ¿coincide el título con el nombre del PDF?")
    print(f"  ✅ JSON válido")

    # ── 7. Git ──
    resp = input("\n¿Hacer commit y push? (s/N): ").strip().lower()
    if resp in ("s", "si", "y", "yes"):
        msg = f'nuevo libro: {libro["titulo"]} - {libro["autor"]}'
        subprocess.run(["git", "add", "libros.json", "portadas/"], cwd=BASE_DIR)
        subprocess.run(["git", "commit", "-m", msg], cwd=BASE_DIR)
        r = subprocess.run(["git", "push"], cwd=BASE_DIR, capture_output=True, text=True)
        if r.returncode != 0:
            print(f"  ⚠️  Push falló: {r.stderr[:200]}")
            print("  Hazlo manual con tu token de GitHub.")
        else:
            print("  ✅ Push exitoso — Vercel desplegando 🚀")

    print(f"\n🎉 ¡Libro agregado! {libro['titulo']} — {libro['autor']} (ID {libro['id']})")


def main():
    parser = argparse.ArgumentParser(
        description="Agregar libro al catálogo Biblioteca Digital",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--titulo", help="Título del libro")
    parser.add_argument("--autor", help="Autor del libro")
    parser.add_argument("--anio", type=int, help="Año de publicación")
    parser.add_argument("--genero", help="Género literario")
    parser.add_argument("--descripcion", help="Descripción breve")
    parser.add_argument("--pdf", help="Link de Google Drive en formato preview")
    parser.add_argument("--rclone", help="Ruta remota para descargar con rclone")
    parser.add_argument("--pdf-local", help="Ruta local del PDF")
    parser.add_argument("--batch", action="store_true", help="Modo batch (no interactivo)")

    args = parser.parse_args()

    if args.batch or args.titulo or args.rclone:
        batch(args)
    else:
        interactivo()


if __name__ == "__main__":
    main()
