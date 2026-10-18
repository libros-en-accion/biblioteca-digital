#!/usr/bin/env python3
"""
scripts/limpiar_duplicados_y_autores.py
Corrige los autores con sufijos raros/tomos y elimina registros de libros duplicados
en libros.json, transfiriendo los PDFs/EPUBs de los duplicados sin metadata al registro principal.
"""
import os
import json
import re
import unicodedata

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

def normalizar_texto(texto):
    """Genera una clave estricta para comparar strings sin acentos, espacios ni caracteres raros."""
    if not texto:
        return ""
    texto = texto.lower().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    texto = re.sub(r"[^a-z0-9]", "", texto)
    return texto

def corregir_autor(autor, titulo="", archivo_pdf=""):
    """Limpia nombres de autor erróneos o con sufijos/ruido."""
    if not autor:
        return ""
    
    a_limpio = autor.strip()

    # 1. Quitar (1), (2), etc.
    a_limpio = re.sub(r"\(\d+\)$", "", a_limpio).strip()

    # 2. Corregir variaciones de Haruki Murakami
    if "Haruki Murakami" in a_limpio:
        return "Haruki Murakami"

    # 3. Corregir Isaac Asimov con prefijos de Ciencias
    if "Isaac Asimov" in a_limpio:
        return "Isaac Asimov"

    # 4. Corregir autores llamados 'Tomo 1', 'Tomo 2', etc. (de Stephen King)
    if a_limpio in ["Tomo 1", "Tomo 2", "Tomo 3"]:
        if "Stephen King" in titulo or "King, Stephen" in (archivo_pdf or ""):
            return "Stephen King"

    # 5. Unificar nombres de Balzac y otros que varían solo en mayúsculas/acentos
    a_norm = normalizar_texto(a_limpio)
    if a_norm == "honoredebalzac":
        return "Honoré de Balzac"

    return a_limpio

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ No se encontró libros.json en {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    print(f"📊 Estado inicial: {len(libros)} libros en catálogo.")

    # ═══════════════════════════════════════════════════════
    # PASO 1: Limpieza básica de autores en todos los registros
    # ═══════════════════════════════════════════════════════
    print("\n🧹 Corrigiendo nombres de autores y normalizando...")
    for libro in libros:
        autor_original = libro.get("autor", "")
        titulo = libro.get("titulo", "")
        archivo_pdf = libro.get("archivo_pdf", "")
        
        autor_corregido = corregir_autor(autor_original, titulo, archivo_pdf)
        if autor_original != autor_corregido:
            print(f"  👤 [{libro['id']}] Autor: '{autor_original}' ➔ '{autor_corregido}'")
            libro["autor"] = autor_corregido

        # Limpiar títulos duplicados del tipo "Apocalipsis (Stephen King)" -> "Apocalipsis"
        titulo_original = libro.get("titulo", "")
        if " (Stephen King)" in titulo_original:
            titulo_corregido = titulo_original.replace(" (Stephen King)", "").strip()
            print(f"  📝 [{libro['id']}] Título: '{titulo_original}' ➔ '{titulo_corregido}'")
            libro["titulo"] = titulo_corregido

    # ═══════════════════════════════════════════════════════
    # PASO 2: Identificar y fusionar duplicados
    # ═══════════════════════════════════════════════════════
    print("\n🔎 Buscando duplicados para fusionar...")
    
    # Agrupar libros por (titulo_simplificado, autor_simplificado)
    grupos = {}
    for l in libros:
        clave = (normalizar_texto(l["titulo"]), normalizar_texto(l["autor"]))
        grupos.setdefault(clave, []).append(l)

    libros_fusionados = []
    eliminados = 0
    funsionados_count = 0

    for (t_key, a_key), items in grupos.items():
        if len(items) == 1:
            libros_fusionados.append(items[0])
            continue

        # Tenemos duplicados. Ordenar de tal forma que el mejor candidato (con portada y descripción) quede primero
        # Criterio de orden: tiene portada (True/False), tiene descripción (longitud de descripción)
        def puntuacion_candidato(libro):
            score = 0
            if libro.get("portada"):
                score += 10
            if libro.get("descripcion") and len(libro["descripcion"]) > 15:
                score += len(libro["descripcion"])
            if libro.get("pdf") and "drive.google.com" in libro["pdf"]:
                score += 5
            return score

        items_ordenados = sorted(items, key=puntuacion_candidato, reverse=True)
        principal = items_ordenados[0]
        secundarios = items_ordenados[1:]

        print(f"\n📂 Fusión para: '{principal['titulo']}' de {principal['autor']}")
        print(f"  🏆 Conservado: ID {principal['id']} (Portada: '{principal.get('portada')}', Desc: {bool(principal.get('descripcion'))})")

        # Fusionar rutas de archivos PDF/EPUB de los secundarios si el principal no las tiene
        for sec in secundarios:
            # Transferir archivo_pdf si falta en principal
            if sec.get("archivo_pdf") and not principal.get("archivo_pdf"):
                principal["archivo_pdf"] = sec["archivo_pdf"]
                print(f"    ➕ PDF transferido desde ID {sec['id']} ➔ '{sec['archivo_pdf']}'")
            
            # Transferir archivo_epub si falta en principal
            if sec.get("archivo_epub") and not principal.get("archivo_epub"):
                principal["archivo_epub"] = sec["archivo_epub"]
                print(f"    ➕ EPUB transferido desde ID {sec['id']} ➔ '{sec['archivo_epub']}'")
            
            # Si el principal no tiene link de Google Drive y el secundario sí
            if sec.get("pdf") and not principal.get("pdf"):
                principal["pdf"] = sec["pdf"]
                print(f"    ➕ Enlace Drive transferido desde ID {sec['id']} ➔ '{sec['pdf']}'")

            print(f"  ❌ ID {sec['id']} duplicado descartado.")
            eliminados += 1

        libros_fusionados.append(principal)
        funsionados_count += 1

    # Asegurar orden secuencial de IDs o simplemente guardarlos
    # No es necesario re-ordenar o cambiar los IDs porque romperíamos enlaces de cookies o lector,
    # es mejor mantener los IDs originales de los libros que conservamos.
    
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros_fusionados, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*50)
    print("📊 RESULTADOS FINALES DE LIMPIEZA")
    print("═"*50)
    print(f"  Total inicial:       {len(libros)} libros")
    print(f"  Registros removidos: {eliminados}")
    print(f"  Total final:         {len(libros_fusionados)} libros")
    print(f"  Libros saneados:     {funsionados_count} fusiones completadas")
    print("═"*50)

if __name__ == "__main__":
    main()
