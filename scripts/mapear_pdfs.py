"""
scripts/mapear_pdfs.py
Recorre biblioteca-digital/ y mapea cada PDF con su libro en libros.json,
agregando el campo "archivo_pdf" (ruta relativa dentro del bucket de R2).
"""
import json
import os
import re
import unicodedata
import glob

PDF_DIR = "/home/daniel/biblioteca-digital"
JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")


def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"[^a-z0-9 ]", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def extraer_candidatos(nombre_archivo, nombre_carpeta):
    """Genera pares (titulo_norm, autor_norm) a partir del nombre del archivo PDF."""
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
                indice_titulo.setdefault(alias, []).append(i)

    # Índice de autores: índice de libro -> autor normalizado
    autor_norm_por_idx = {i: normalizar(l["autor"]) for i, l in enumerate(libros)}

    mapeados = 0
    sin_match = 0

    for raiz, _, archivos in os.walk(PDF_DIR):
        for archivo in archivos:
            if not archivo.lower().endswith(".pdf"):
                continue

            carpeta = os.path.basename(raiz)
            ruta_abs = os.path.join(raiz, archivo)
            # Ruta relativa desde PDF_DIR (que es la clave en R2)
            ruta_relativa = os.path.relpath(ruta_abs, PDF_DIR)

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
            if not libros[encontrado].get("archivo_pdf"):
                libros[encontrado]["archivo_pdf"] = ruta_relativa
                mapeados += 1

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros, f, ensure_ascii=False, indent=2)

    total = len(libros)
    con_archivo = sum(1 for l in libros if l.get("archivo_pdf"))
    print(f"PDFs mapeados en esta ejecucion: {mapeados}")
    print(f"PDFs sin match:                  {sin_match}")
    print(f"Libros con 'archivo_pdf' ahora:  {con_archivo} / {total}")


if __name__ == "__main__":
    main()
