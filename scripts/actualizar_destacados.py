import re
import csv
import os
import requests
import unicodedata
from bs4 import BeautifulSoup

# Configuración de Rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "libros_reducido.csv")
APP_JS_PATH = os.path.join(BASE_DIR, "app.js")

# URL de Amazon Best Sellers en Libros en Español México (Categoría 13214803011)
AMAZON_URL = "https://www.amazon.com.mx/gp/bestsellers/books/13214803011"

def normalizar(texto):
    """
    Normaliza el texto para comparación difusa: convierte a minúsculas,
    remueve acentos, puntuación y colapsa espacios.
    """
    if not texto:
        return ""
    texto = texto.lower()
    # Remover acentos/diacríticos
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    # Conservar alfanuméricos y espacios
    texto = re.sub(r'[^a-z0-9\s]', '', texto)
    return ' '.join(texto.split())

def obtener_mas_vendidos():
    """
    Realiza la petición a Amazon México (Libros en español) y extrae el top de libros.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.google.com/",
        "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
    }
    
    print(f"Obteniendo datos de Amazon México (Libros en Español Best Sellers)...")
    response = requests.get(AMAZON_URL, headers=headers, timeout=15)
    
    if response.status_code != 200:
        raise Exception(f"Error al conectar con Amazon: Status Code {response.status_code}")
        
    if "captcha" in response.text.lower():
        raise Exception("Amazon bloqueó la petición con un CAPTCHA.")

    soup = BeautifulSoup(response.text, 'html.parser')
    cards = soup.select(".p13n-sc-uncoverable-faceout")
    
    libros_amazon = []
    for card in cards:
        # Extraer Título
        title_el = card.select_one('div[class*="p13n-sc-css-line-clamp-2"]')
        if not title_el:
            title_el = card.select_one('a.a-link-normal > span > div')
        title = title_el.get_text(strip=True) if title_el else None

        # Extraer Autor
        author_el = card.select_one('.a-link-child')
        if not author_el:
            author_el = card.select_one('div[class*="p13n-sc-css-line-clamp-1"]')
        if not author_el:
            author_el = card.select_one('.a-size-small.a-color-base')
        author = author_el.get_text(strip=True) if author_el else None
        
        if title:
            libros_amazon.append((title, author or ""))
            if len(libros_amazon) == 50:
                break
                
    return libros_amazon

def cargar_base_datos():
    """
    Carga el archivo CSV libros_reducido.csv en memoria.
    """
    base_datos = []
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"No se encontró el archivo: {CSV_PATH}")
        
    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            base_datos.append({
                "id": int(row["id"]),
                "titulo": row["titulo"],
                "autor": row["autor"]
            })
    return base_datos

def buscar_libro_en_db(titulo_amazon, autor_amazon, base_datos):
    """
    Busca de manera precisa (por autor y título normalizados) un libro en la DB local.
    """
    title_norm = normalizar(titulo_amazon)
    author_norm = normalizar(autor_amazon)
    title_clean = re.sub(r'\(.*?\)', '', title_norm).strip()
    
    # 1. Matching por autor y título
    if author_norm and len(author_norm) > 3:
        author_tokens = set(author_norm.split())
        for libro in base_datos:
            db_title = normalizar(libro['titulo'])
            db_author = normalizar(libro['autor'])
            db_author_tokens = set(db_author.split())
            
            # Si hay coincidencia significativa en el autor
            if len(author_tokens.intersection(db_author_tokens)) >= 1 or author_norm in db_author or db_author in author_norm:
                if title_clean == db_title or db_title in title_clean or title_clean in db_title:
                    return libro['id'], libro['titulo']

    # 2. Coincidencia exacta o casi exacta de título (títulos de más de 4 caracteres)
    if len(title_clean) > 4:
        for libro in base_datos:
            db_title = normalizar(libro['titulo'])
            if title_clean == db_title:
                return libro['id'], libro['titulo']
            # Para títulos largos, verificar subcadena con longitud comparable
            if len(db_title) > 5 and abs(len(title_clean) - len(db_title)) < 15:
                if title_clean in db_title or db_title in title_clean:
                    return libro['id'], libro['titulo']
    return None

def actualizar_app_js(libros_encontrados):
    """
    Edita app.js y reemplaza el bloque const LIBROS_DESTACADOS_IDS con los nuevos IDs.
    """
    if not os.path.exists(APP_JS_PATH):
        raise FileNotFoundError(f"No se encontró el archivo: {APP_JS_PATH}")
        
    with open(APP_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Construir el nuevo bloque de código
    nuevo_bloque = "const LIBROS_DESTACADOS_IDS = [\n"
    for i, (book_id, title) in enumerate(libros_encontrados):
        comma = "," if i < len(libros_encontrados) - 1 else ""
        nuevo_bloque += f"  {book_id}{comma} // {title}\n"
    nuevo_bloque += "];"
    
    # Expresión regular para buscar la definición de la constante
    pattern = r'const LIBROS_DESTACADOS_IDS\s*=\s*\[[^\]]*?\]\s*;'
    
    if not re.search(pattern, content):
        # Intentar una expresión regular alternativa sin punto y coma estricto
        pattern = r'const LIBROS_DESTACADOS_IDS\s*=\s*\[[^\]]*?\]'
        nuevo_bloque = nuevo_bloque.rstrip(";")
        
    if re.search(pattern, content):
        content_modificado = re.sub(pattern, nuevo_bloque, content)
        with open(APP_JS_PATH, "w", encoding="utf-8") as f:
            f.write(content_modificado)
        print("app.js actualizado con éxito.")
    else:
        raise Exception("No se pudo localizar el bloque const LIBROS_DESTACADOS_IDS en app.js")

def main():
    try:
        db_libros = cargar_base_datos()
        encontrados = []
        no_encontrados = []

        try:
            libros_amazon = obtener_mas_vendidos()
            print(f"Libros obtenidos de Amazon México (Español):")
            for idx, (t, a) in enumerate(libros_amazon):
                print(f"  {idx+1}. {t} - {a}")
                
            for titulo, autor in libros_amazon:
                resultado = buscar_libro_en_db(titulo, autor, db_libros)
                if resultado:
                    book_id, db_title = resultado
                    if (book_id, db_title) not in encontrados:
                        encontrados.append((book_id, db_title))
                        if len(encontrados) == 10:
                            break
                else:
                    no_encontrados.append(f"{titulo} - {autor}")
        except Exception as scrap_err:
            print(f"\n⚠️ Aviso durante el scraping: {scrap_err}")
            print("Activando modo de selección automática (Fallback)...")

        # Fallback si Amazon bloqueó o no se alcanzaron 10 libros
        if len(encontrados) < 10:
            ids_populares_fallback = [2835, 2300, 1139, 2079, 2828, 2089, 14, 670, 2494, 1140, 1974, 782, 1121, 2852, 2944]
            libros_fallback = [l for l in db_libros if l["id"] in ids_populares_fallback]
            import random
            random.shuffle(libros_fallback)
            for l in libros_fallback:
                item = (l["id"], l["titulo"])
                if item not in encontrados:
                    encontrados.append(item)
                    if len(encontrados) == 10:
                        break
                        
        if encontrados:
            actualizar_app_js(encontrados)
            print(f"\nSe actualizaron {len(encontrados)} libros destacados en app.js:")
            for b_id, b_title in encontrados:
                print(f"  - ID {b_id}: {b_title}")
        else:
            print("\nNo se pudo consolidar la lista de destacados.")
            
    except Exception as e:
        print(f"\n❌ Error general en la ejecución: {e}")

if __name__ == "__main__":
    main()
