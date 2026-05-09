import json
import os
import re
import subprocess
import unicodedata
import glob

PDF_DIR = "/home/daniel/biblioteca-digital"
PORTADAS_DIR = "portadas"
JSON_PATH = "libros.json"


def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = re.sub(r"[^a-z0-9 ]", "", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto


def extraer_partes(nombre_archivo, nombre_carpeta):
    """Devuelve lista de (posible_titulo_normalizado, posible_autor_normalizado)."""
    base = nombre_archivo.rsplit(".", 1)[0]
    autor_carpeta = normalizar(nombre_carpeta)
    resultados = []

    if " - " in base:
        p1, p2 = base.split(" - ", 1)
        p1n, p2n = normalizar(p1), normalizar(p2)
        # Interpretacion 1: Titulo - Autor
        resultados.append((p1n, p2n))
        # Interpretacion 2: Autor - Titulo
        resultados.append((p2n, p1n))
        # Interpretacion 3: Titulo - Autor (carpeta)
        resultados.append((p1n, autor_carpeta))
        resultados.append((p2n, autor_carpeta))
    else:
        resultados.append((normalizar(base), autor_carpeta))

    return resultados


def portada_existe(libro_id):
    """Devuelve la ruta si ya existe portada (webp o jpg), o None."""
    for ext in (".webp", ".jpg"):
        ruta = os.path.join(PORTADAS_DIR, f"{libro_id}{ext}")
        if os.path.exists(ruta):
            return ruta
    return None


def generar_portada(libro, ruta_pdf):
    existente = portada_existe(libro["id"])
    if existente:
        return existente, False

    destino_jpg = os.path.join(PORTADAS_DIR, f"{libro['id']}.jpg")
    try:
        subprocess.run(
            [
                "pdftoppm",
                "-f", "1",
                "-l", "1",
                "-jpeg",
                "-scale-to-x", "440",
                "-scale-to-y", "-1",
                ruta_pdf,
                os.path.join(PORTADAS_DIR, str(libro["id"]))
            ],
            capture_output=True,
            timeout=15
        )
        matches = glob.glob(os.path.join(PORTADAS_DIR, f"{libro['id']}-*.jpg"))
        if matches:
            os.rename(matches[0], destino_jpg)
            # Convertir a WebP
            destino_webp = destino_jpg.replace(".jpg", ".webp")
            subprocess.run(
                ["convert", destino_jpg, "-resize", "300x", "-quality", "65", destino_webp],
                capture_output=True
            )
            if os.path.exists(destino_webp):
                os.remove(destino_jpg)
                return destino_webp, True
            return destino_jpg, True
    except Exception:
        pass
    return None, False


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    # Indice principal: titulo normalizado -> lista de indices
    indice_titulo = {}
    for i, libro in enumerate(libros):
        t_norm = normalizar(libro["titulo"])
        if t_norm not in indice_titulo:
            indice_titulo[t_norm] = []
        indice_titulo[t_norm].append(i)

        # Alias sin subtitulo
        if " - " in libro["titulo"]:
            partes_titulo = libro["titulo"].split(" - ", 1)
            alias_pre = normalizar(partes_titulo[0])
            alias_post = normalizar(partes_titulo[1])
            for alias in (alias_pre, alias_post):
                if alias not in indice_titulo:
                    indice_titulo[alias] = []
                if i not in indice_titulo[alias]:
                    indice_titulo[alias].append(i)
        if ":" in libro["titulo"]:
            alias = normalizar(libro["titulo"].split(":")[0])
            if alias not in indice_titulo:
                indice_titulo[alias] = []
            if i not in indice_titulo[alias]:
                indice_titulo[alias].append(i)

    # Indice de autores normalizados por id de libro
    autor_por_id = {}
    for i, libro in enumerate(libros):
        autor_por_id[i] = normalizar(libro["autor"])

    os.makedirs(PORTADAS_DIR, exist_ok=True)

    generadas = 0
    fallos = 0
    sin_match = 0

    for raiz, dirs, archivos in os.walk(PDF_DIR):
        for archivo in archivos:
            if not archivo.lower().endswith(".pdf"):
                continue

            carpeta = os.path.basename(raiz)
            candidatos = extraer_partes(archivo, carpeta)
            ruta_pdf = os.path.join(raiz, archivo)

            # Buscar match: probar cada interpretacion del nombre
            encontrado = None
            for t_norm, a_norm in candidatos:
                if t_norm not in indice_titulo:
                    continue
                indices = indice_titulo[t_norm]
                if len(indices) == 1:
                    encontrado = libros[indices[0]]
                    break
                # Titulo ambiguo: desempatar por autor
                for idx in indices:
                    if autor_por_id[idx] == a_norm:
                        encontrado = libros[idx]
                        break
                if encontrado:
                    break

            if encontrado is None:
                sin_match += 1
                continue

            destino, es_nueva = generar_portada(encontrado, ruta_pdf)
            if destino:
                encontrado["portada"] = destino
                if es_nueva:
                    generadas += 1
                    print(f"[{generadas}] {encontrado['titulo']} ({encontrado['autor']})")
            else:
                fallos += 1

    # Limpiar URLs viejas que hayan quedado
    for libro in libros:
        if libro["portada"] and libro["portada"].startswith("https://"):
            libro["portada"] = ""

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros, f, ensure_ascii=False, indent=2)

    print(f"\nPortadas generadas: {generadas}")
    print(f"Errores pdftoppm: {fallos}")
    print(f"PDFs sin match: {sin_match}")
    print(f"Total libros: {len(libros)}")


if __name__ == "__main__":
    main()
