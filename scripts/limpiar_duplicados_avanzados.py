#!/usr/bin/env python3
"""
scripts/limpiar_duplicados_avanzados.py
Resuelve duplicados complejos donde el título del nuevo libro contiene el autor
al final (ej: "Evangelio de Judas-Anonimo") y el libro original (ej: "Evangelio de Judas")
no tenía asociado su archivo PDF/EPUB.
"""
import os
import json
import re
import unicodedata

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

def normalizar_texto(texto):
    if not texto:
        return ""
    texto = texto.lower().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    # Quitar guiones bajos y especiales, dejar solo alfanumérico
    texto = re.sub(r"[^a-z0-9]", "", texto)
    return texto

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ No se encontró libros.json en {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    print(f"📊 Total de libros antes de la limpieza avanzada: {len(libros)}")

    # Separar libros en principales (con descripción) y candidatos a duplicados (sin descripción)
    principales = [l for l in libros if l.get("descripcion") and len(l["descripcion"].strip()) > 5]
    nuevos_sin_desc = [l for l in libros if not l.get("descripcion") or len(l["descripcion"].strip()) <= 5]

    print(f"  - Libros con descripción: {len(principales)}")
    print(f"  - Libros nuevos sin descripción: {len(nuevos_sin_desc)}")

    eliminados = set()
    fusiones = 0

    # Indexar principales por clave (titulo_normalizado, autor_normalizado)
    indice_principales = {}
    for p in principales:
        clave = (normalizar_texto(p["titulo"]), normalizar_texto(p["autor"]))
        indice_principales[clave] = p

    # Para cada libro nuevo sin descripción, buscar si es una versión duplicada de uno principal
    for n in nuevos_sin_desc:
        titulo_nuevo = n["titulo"]
        autor_nuevo = n["autor"]
        autor_nuevo_norm = normalizar_texto(autor_nuevo)
        
        # Limpiar el título quitando patrones comunes como "-Anonimo", "-Dumas Alexandre", etc.
        titulo_limpio = titulo_nuevo
        
        # Buscar guiones en el título y probar si lo que está después del guion es el autor o parte de él
        if "-" in titulo_nuevo:
            partes = titulo_nuevo.split("-")
            for i in range(1, len(partes)):
                prefijo = "-".join(partes[:i]).strip()
                sufijo = "-".join(partes[i:]).strip()
                sufijo_norm = normalizar_texto(sufijo)
                
                # Si el sufijo normalizado es parte del autor o viceversa, limpiamos el título
                if sufijo_norm and (sufijo_norm in autor_nuevo_norm or autor_nuevo_norm in sufijo_norm or sufijo_norm == "anonimo"):
                    titulo_limpio = prefijo
                    break

        # Intentar match directo del título limpio con los principales del mismo autor
        clave_limpia = (normalizar_texto(titulo_limpio), autor_nuevo_norm)
        
        match = None
        if clave_limpia in indice_principales:
            match = indice_principales[clave_limpia]
        else:
            # Match secundario: buscar si algún título principal del mismo autor está contenido en el título nuevo
            # (ej: "Evangelio de Judas" está contenido en "Evangelio de Judas-Anonimo")
            t_nuevo_norm = normalizar_texto(titulo_nuevo)
            for p in principales:
                if normalizar_texto(p["autor"]) == autor_nuevo_norm:
                    t_principal_norm = normalizar_texto(p["titulo"])
                    if t_principal_norm in t_nuevo_norm or t_nuevo_norm in t_principal_norm:
                        match = p
                        break

        if match:
            # Transferir datos al libro principal
            transferido = False
            if n.get("archivo_pdf") and not match.get("archivo_pdf"):
                match["archivo_pdf"] = n["archivo_pdf"]
                transferido = True
            if n.get("archivo_epub") and not match.get("archivo_epub"):
                match["archivo_epub"] = n["archivo_epub"]
                transferido = True

            print(f"🔗 Fusionando '{titulo_nuevo}' (ID {n['id']}) ➔ '{match['titulo']}' (ID {match['id']})")
            if transferido:
                print(f"  📂 Archivos transferidos: PDF: '{match.get('archivo_pdf')}' | EPUB: '{match.get('archivo_epub')}'")
            
            eliminados.add(n["id"])
            fusiones += 1
        else:
            # Si no hay match con los principales, se conserva el libro nuevo
            pass

    # Filtrar el catálogo final removiendo los duplicados eliminados
    libros_limpios = [l for l in libros if l["id"] not in eliminados]

    # Guardar
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(libros_limpios, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*50)
    print("📊 RESULTADOS DE LIMPIEZA AVANZADA")
    print("═"*50)
    print(f"  Libros fusionados/eliminados: {fusiones}")
    print(f"  Total final de catálogo:      {len(libros_limpios)} libros")
    print("═"*50)

if __name__ == "__main__":
    main()
