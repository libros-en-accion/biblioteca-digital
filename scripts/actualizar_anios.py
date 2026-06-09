#!/usr/bin/env python3
"""
scripts/actualizar_anios.py
Actualiza de forma estricta los años de publicación de los 49 libros nuevos en libros.json.
"""
import os
import json
import re
import unicodedata

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

# Mapa estricto de (titulo_normalizado, autor_normalizado) -> anio
MAPA_ANIO_ESTRICTO = {
    ("elgrangatsby", "francisscottfitzgerald"): 1925,
    ("eldiariodeanafrank", "annefrank"): 1947,
    ("lavidadepi", "yannmartel"): 2001,
    ("cometasenelcielo", "khaledhosseini"): 2003,
    ("demian", "hermannhesse"): 1919,
    ("elloboestepario", "hermannhesse"): 1927,
    ("siddhartha", "hermannhesse"): 1922,
    ("lamaldiciondehillhouse", "shirleyjackson"): 1959,
    ("recuerdossuenospensamientos", "carlgustavjung"): 1961,
    ("loshombresquenoamabanalasmujeres", "stieglarsson"): 2005,
    ("lachicaquesonabaconunacerillayunbidondegasolina", "stieglarsson"): 2006,
    ("lareinaenelpalaciodelascorrientesdeaire", "stieglarsson"): 2007,
    ("elbesodelamujerarana", "manuelpuig"): 1976,
    ("elcatalejolacado", "philippullman"): 2000,
    ("eloxforddelyra", "philippullman"): 2003,
    ("labrujuladorada", "philippullman"): 1995,
    ("ladaga", "philippullman"): 1997,
    ("lasaventurasdesherlockholmes", "arthurconandoyle"): 1892,
    ("eljuegodeender", "orsonscottcard"): 1985,
    ("asangrefria", "trumancapote"): 1966,
    ("lospasosperdidos", "alejocarpentier"): 1953,
    ("exhalacion", "tedchiang"): 2019,
    ("lahistoriadetuvida", "tedchiang"): 2002,
    ("hojasdehierba", "waltwhitman"): 1855,
    ("poemasdelaoficinapoemasdelhoyporhoy", "mariobenedetti"): 1956,
    ("latregua", "mariobenedetti"): 1960,
    ("lainvenciondemorel", "adolfobioycasares"): 1940,
    ("lanaranjamecanica", "anthonyburgess"): 1962,
    ("elninoconelpijamaderayas", "johnboyne"): 2006,
    ("laladronadelibros", "markuszusak"): 2005,
    ("elinfinitoenunjunco", "irenevallejo"): 2019,
    ("discursodelmetodomeditacionesmetafisicas", "renedescartes"): 1637,
    ("laspasionesdelalma", "renedescartes"): 1649,
    ("armasgermenesyacero", "jareddiamond"): 1997,
    ("elcondedemontecristo", "alexandredumas"): 1844,
    ("lostresmosqueteros", "alexandredumas"): 1844,
    ("pensarrapidopensardespacio", "danielkahneman"): 2011,
    ("losriosprofundos", "josemariaarguedas"): 1958,
    ("patria", "fernandoaramburu"): 2016,
    ("cantardelmiocid", "anonimo"): 1200,
    ("hyperion", "dansimmons"): 1989,
    ("elguardianentreelcenteno", "jdsalinger"): 1951,
    ("lasenoritaelse", "arthurschnitzler"): 1924,
    ("relatosonado", "arthurschnitzler"): 1926,
    ("eltenientegustl", "arthurschnitzler"): 1900,
    ("elartedelaguerra", "suntzu"): 0,  # Siglo V a.C.
    ("lacabanadeltiotom", "harrietbeecherstowe"): 1852,
    ("neuromante", "williamgibson"): 1984,
    ("elsenordelasmoscas", "williamgolding"): 1954
}

def normalizar_texto(texto):
    if not texto:
        return ""
    texto = texto.lower().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    texto = re.sub(r"[^a-z0-9]", "", texto)
    return texto

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ No se encontró libros.json en {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    actualizados = 0

    for libro in libros:
        t_norm = normalizar_texto(libro["titulo"])
        a_norm = normalizar_texto(libro["autor"])
        
        # Par exacto
        par = (t_norm, a_norm)
        if par in MAPA_ANIO_ESTRICTO:
            libro["anio"] = MAPA_ANIO_ESTRICTO[par]
            print(f"📅 [{libro['id']}] '{libro['titulo']}' por {libro['autor']} ➔ Año: {MAPA_ANIO_ESTRICTO[par]}")
            actualizados += 1

    if actualizados > 0:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(libros, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Proceso finalizado. Se actualizaron estrictamente los años de {actualizados} libros en libros.json.")
    else:
        print("\n✨ No se encontraron libros elegibles para actualizar el año.")

if __name__ == "__main__":
    main()
