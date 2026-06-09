#!/usr/bin/env python3
"""
scripts/extraer_portadas_faltantes.py
Busca libros en libros.json que tengan el campo 'portada' vacío pero cuenten con
un 'archivo_pdf' válido, e intenta generar su portada automáticamente.
"""
import os
import json
import glob
import subprocess

PDF_DIR = "/home/daniel/biblioteca-digital"
PORTADAS_DIR = "portadas"
JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

def main():
    if not os.path.exists(JSON_PATH):
        print("❌ No se encontró libros.json")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    os.makedirs(PORTADAS_DIR, exist_ok=True)
    generadas = 0
    errores = 0

    print("🔍 Escaneando libros sin portada en el catálogo...")
    
    for libro in libros:
        # Si no tiene portada pero sí tiene PDF
        if (not libro.get("portada") or libro["portada"] == "") and libro.get("archivo_pdf"):
            ruta_pdf = os.path.join(PDF_DIR, libro["archivo_pdf"])
            
            if not os.path.exists(ruta_pdf):
                # Intentar normalizar separadores por si acaso
                ruta_pdf = os.path.join(PDF_DIR, libro["archivo_pdf"].replace("\\", "/"))

            if not os.path.exists(ruta_pdf):
                continue

            print(f"🖼  Generando portada para ID {libro['id']}: '{libro['titulo']}'")
            destino_jpg = os.path.join(PORTADAS_DIR, f"{libro['id']}.jpg")
            destino_webp = os.path.join(PORTADAS_DIR, f"{libro['id']}.webp")

            try:
                # 1. Extraer primera página en JPG
                r_pdf = subprocess.run(
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

                if r_pdf.returncode != 0:
                    print(f"  ❌ Error pdftoppm: {r_pdf.stderr.decode('utf-8', errors='ignore')[:150]}")
                    errores += 1
                    continue

                # pdftoppm crea archivos del tipo id-1.jpg, buscarlo y renombrarlo
                matches = glob.glob(os.path.join(PORTADAS_DIR, f"{libro['id']}-*.jpg"))
                if matches:
                    os.rename(matches[0], destino_jpg)
                    
                    # 2. Convertir a WebP optimizado con ImageMagick
                    r_conv = subprocess.run(
                        ["convert", destino_jpg, "-resize", "300x", "-quality", "75", destino_webp],
                        capture_output=True
                    )

                    if os.path.exists(destino_webp):
                        libro["portada"] = f"portadas/{libro['id']}.webp"
                        os.remove(destino_jpg)  # Limpiar temporal JPG
                        generadas += 1
                        print(f"  ✅ Portada WebP creada con éxito: {libro['portada']}")
                    else:
                        # Si no pudo convertir a webp, dejar el JPG
                        libro["portada"] = f"portadas/{libro['id']}.jpg"
                        generadas += 1
                        print(f"  ⚠️  Dejado en JPG (error al convertir a WebP): {libro['portada']}")
                else:
                    print("  ❌ No se encontró archivo JPG extraído por pdftoppm")
                    errores += 1
            except Exception as e:
                print(f"  ❌ Error inesperado: {str(e)}")
                errores += 1

    if generadas > 0:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(libros, f, ensure_ascii=False, indent=2)
        print(f"\n✨ Finalizado. Se crearon {generadas} portadas nuevas. Errores: {errores}")
    else:
        print("\n✨ No había portadas pendientes de generar o no se pudieron localizar sus PDFs en local.")

if __name__ == "__main__":
    main()
