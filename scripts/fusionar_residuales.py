#!/usr/bin/env python3
"""
scripts/fusionar_residuales.py
Fusiona los 4 duplicados específicos detectados y limpia los nombres
de los nuevos libros legítimos eliminando los sufijos de autor del título.
"""
import os
import json

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

# Fusiones a realizar: ID_nuevo ➔ ID_principal
FUSIONES = {
    2888: 1918,  # Moby Dick-Herman Melville ➔ Moby Dick
    2953: 2952,  # Discurso del metodo-Rene Descartes ➔ Discurso del Metodo, Meditaciones metafisicas
    3001: 2382,  # Frankenstein-Mary Shelley ➔ Frankenstein, o el moderno Prometeo
    3021: 2553   # El principe y el mendigo-Twain Mark ➔ El principe y el mendigo (ilustrado)
}

# Títulos de libros legítimos a limpiar
LIMPIEZA_TITULOS = {
    2881: ("El sí de las niñas", "Leandro Fernández de Moratín"),
    2890: ("El paraíso perdido", "John Milton"),
    2904: ("La peste escarlata", "Jack London"),
    2965: ("Ante la ley", "Franz Kafka"),
    2999: ("Ubunchu 3", "Hiroshi Seo"),
    3020: ("El forastero misterioso", "Mark Twain")
}

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ No se encontró libros.json")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    print(f"📊 Libros iniciales: {len(libros)}")

    # Indexar libros por ID
    libros_by_id = {l["id"]: l for l in libros}

    eliminados = set()

    # 1. Realizar fusiones
    for id_nuevo, id_principal in FUSIONES.items():
        if id_nuevo in libros_by_id and id_principal in libros_by_id:
            n = libros_by_id[id_nuevo]
            p = libros_by_id[id_principal]

            # Transferir archivos
            if n.get("archivo_pdf") and not p.get("archivo_pdf"):
                p["archivo_pdf"] = n["archivo_pdf"]
            if n.get("archivo_epub") and not p.get("archivo_epub"):
                p["archivo_epub"] = n["archivo_epub"]

            print(f"🔗 Fusionado residual: '{n['titulo']}' (ID {id_nuevo}) ➔ '{p['titulo']}' (ID {id_principal})")
            eliminados.add(id_nuevo)

    # 2. Limpiar títulos y autores de libros nuevos legítimos
    for libro_id, (nuevo_titulo, nuevo_autor) in LIMPIEZA_TITULOS.items():
        if libro_id in libros_by_id:
            l = libros_by_id[libro_id]
            print(f"📝 Limpiando legítimo [{libro_id}]: '{l['titulo']}' ➔ '{nuevo_titulo}' | '{l['autor']}' ➔ '{nuevo_autor}'")
            l["titulo"] = nuevo_titulo
            l["autor"] = nuevo_autor

    # 3. Filtrar catálogo final
    libros_limpios = [l for l in libros if l["id"] not in eliminados]

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros_limpios, f, ensure_ascii=False, indent=2)

    print(f"📊 Libros finales: {len(libros_limpios)} (eliminados: {len(eliminados)})")

if __name__ == "__main__":
    main()
