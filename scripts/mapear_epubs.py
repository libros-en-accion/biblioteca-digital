"""
scripts/mapear_epubs.py
Recorre la carpeta de EPUBs y mapea cada EPUB con su libro en libros.json,
agregando el campo "archivo_epub" (ruta relativa dentro del bucket de R2).
"""
import json
import os
import re
import unicodedata
import argparse

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"[^a-z0-9 ]", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto

def extraer_candidatos(nombre_archivo, nombre_carpeta):
    """Genera pares (titulo_norm, autor_norm) a partir del nombre del archivo EPUB."""
    base = nombre_archivo.rsplit(".", 1)[0]
    autor_carpeta = normalizar(nombre_carpeta)
    candidatos = []

    if " - " in base:
        p1, p2 = base.split(" - ", 1)
        p1n, p2n = normalizar(p1), normalizar(p2)
        candidatos.append((p1n, p2n))
        candidatos.append((p2n, p1n))
        candidatos.append((p1n, autor_carpeta))
        candidatos.append((p2n, autor_carpeta))
    else:
        candidatos.append((normalizar(base), autor_carpeta))

    return candidatos

def main():
    parser = argparse.ArgumentParser(description="Mapea archivos EPUB con libros.json")
    parser.add_argument("--dir", default="/home/daniel/biblioteca-digital/001_EPUB", help="Directorio local con los EPUBs")
    args = parser.parse_args()

    EPUB_DIR = os.path.expanduser(args.dir)
    if not os.path.exists(EPUB_DIR):
        print(f"❌ El directorio de EPUBs no existe: {EPUB_DIR}")
        print("Usa --dir para indicar la ruta correcta de tu carpeta local de EPUBs.")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    # Índice: titulo normalizado -> lista de índices en libros
    indice_titulo = {}
    for i, libro in enumerate(libros):
        t_norm = normalizar(libro["titulo"])
        indice_titulo.setdefault(t_norm, []).append(i)
        # Alias sin subtítulo separado por ":"
        if ":" in libro["titulo"]:
            alias = normalizar(libro["titulo"].split(":")[0])
            if alias not in indice_titulo:
                indice_titulo.setdefault(alias, []).append(i)
        # Alias sin subtítulo separado por " - "
        if " - " in libro["titulo"]:
            for parte in libro["titulo"].split(" - ", 1):
                alias = normalizar(parte)
                if alias not in indice_titulo:
                    indice_titulo.setdefault(alias, []).append(i)

    # Índice de autores: índice de libro -> autor normalizado
    autor_norm_por_idx = {i: normalizar(l["autor"]) for i, l in enumerate(libros)}

    mapeados = 0
    sin_match = 0

    # Usamos el directorio padre para que la ruta relativa incluya "001_EPUB/"
    parent_dir = os.path.dirname(EPUB_DIR)

    for raiz, _, archivos in os.walk(EPUB_DIR):
        for archivo in archivos:
            if not archivo.lower().endswith(".epub"):
                continue

            carpeta = os.path.basename(raiz)
            ruta_abs = os.path.join(raiz, archivo)
            # Ruta relativa desde el directorio padre (ej: "001_EPUB/A/Autor/libro.epub")
            ruta_relativa = os.path.relpath(ruta_abs, parent_dir)

            candidatos = extraer_candidatos(archivo, carpeta)
            encontrado = None

            for t_norm, a_norm in candidatos:
                if t_norm not in indice_titulo:
                    continue
                indices = indice_titulo[t_norm]
                if len(indices) == 1:
                    encontrado = indices[0]
                    break
                for idx in indices:
                    if autor_norm_por_idx[idx] == a_norm:
                        encontrado = idx
                        break
                if encontrado is not None:
                    break

            if encontrado is None:
                sin_match += 1
                continue

            # Solo actualizar si no tiene ya una ruta asignada
            if not libros[encontrado].get("archivo_epub"):
                libros[encontrado]["archivo_epub"] = ruta_relativa
                mapeados += 1

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros, f, ensure_ascii=False, indent=2)

    total = len(libros)
    con_archivo = sum(1 for l in libros if l.get("archivo_epub"))
    print(f"📚 EPUBs mapeados en esta ejecucion: {mapeados}")
    print(f"⚠️ EPUBs sin match en libros.json:    {sin_match}")
    print(f"📊 Libros con 'archivo_epub' ahora:   {con_archivo} / {total}")

if __name__ == "__main__":
    main()
