"""
scripts/extraer_paginas_e_idiomas.py
Extrae el número de páginas real de los archivos PDF usando pdfinfo
y asigna el campo idioma ("es" | "en") en libros.json.
"""
import json
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(BASE_DIR, "libros.json")
COLECCIONES_PATH = os.path.join(BASE_DIR, "colecciones.json")
PDF_BASE = "/home/daniel/biblioteca-digital"


def obtener_paginas(archivo_pdf):
    if not archivo_pdf:
        return None
    pdf_path = os.path.join(PDF_BASE, archivo_pdf)
    if not os.path.exists(pdf_path):
        return None
    try:
        res = subprocess.run(["pdfinfo", pdf_path], capture_output=True, text=True, timeout=5)
        for line in res.stdout.splitlines():
            if line.startswith("Pages:"):
                return int(line.split(":")[1].strip())
    except Exception:
        pass
    return None


def main():
    print("Cargando libros.json y colecciones.json...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    # Identificar libros en inglés a partir de la colección aprender-ingles
    ids_ingles = set()
    if os.path.exists(COLECCIONES_PATH):
        with open(COLECCIONES_PATH, "r", encoding="utf-8") as f:
            colecciones = json.load(f)
        for c in colecciones:
            if "ingles" in c.get("id", "").lower() or "inglés" in c.get("titulo", "").lower():
                ids_ingles.update(c.get("libros", []))

    print(f"Total libros a procesar: {len(libros)}. Libros identificados en inglés: {len(ids_ingles)}")

    def procesar_libro(libro):
        # 1. Asignar idioma
        if libro["id"] in ids_ingles:
            libro["idioma"] = "en"
        else:
            libro["idioma"] = "es"

        # 2. Asignar páginas si tiene archivo_pdf
        archivo = libro.get("archivo_pdf")
        if archivo:
            pags = obtener_paginas(archivo)
            if pags and pags > 0:
                libro["paginas"] = pags
        return libro

    with ThreadPoolExecutor(max_workers=10) as executor:
        libros_procesados = list(executor.map(procesar_libro, libros))

    con_paginas = sum(1 for l in libros_procesados if "paginas" in l)
    en_ingles = sum(1 for l in libros_procesados if l.get("idioma") == "en")

    print(f"Extracción finalizada: {con_paginas} libros con páginas, {en_ingles} en inglés.")

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros_procesados, f, ensure_ascii=False, indent=2)

    print("✅ libros.json actualizado con éxito.")


if __name__ == "__main__":
    main()
