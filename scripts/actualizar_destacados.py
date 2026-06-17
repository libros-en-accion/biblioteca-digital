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

# URL de Amazon Best Sellers en Libros (se puede alternar a amazon.com.mx si se prefiere)
AMAZON_URL = "https://www.amazon.com/gp/bestsellers/books"

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
    Realiza la petición a Amazon y extrae el top 10 de libros (título y autor).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "es-MX,es;q=0.9,en;q=0.8,en-US;q=0.7"
    }
    
    print(f"Obteniendo datos de Amazon Best Sellers...")
    response = requests.get(AMAZON_URL, headers=headers, timeout=15)
    
    if response.status_code != 200:
        raise Exception(f"Error al conectar con Amazon: Status Code {response.status_code}")
        
    if "captcha" in response.text.lower():
        raise Exception("Amazon bloqueó la petición con un CAPTCHA. Se sugiere usar un proxy o API de scraping.")

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
        
        if title and author:
            libros_amazon.append((title, author))
            if len(libros_amazon) == 10:
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
    Busca de manera flexible (por subcadena y normalización) un libro en la DB local.
    """
    title_norm = normalizar(titulo_amazon)
    author_norm = normalizar(autor_amazon)
    
    # Coincidencia por autor y título
    for libro in base_datos:
        db_title_norm = normalizar(libro["titulo"])
        db_author_norm = normalizar(libro["autor"])
        
        # 1. Verificar si el autor es coincidente o subcadena
        if author_norm in db_author_norm or db_author_norm in author_norm:
            # 2. Verificar si el título coincide o uno es subcadena del otro
            if title_norm in db_title_norm or db_title_norm in title_norm:
                return libro["id"], libro["titulo"]
                
    # Fallback más agresivo: Buscar coincidencias directas en títulos muy específicos (ej. 1984)
    # sólo si el título buscado tiene suficiente longitud para evitar falsos positivos
    if len(title_norm) > 3:
        for libro in base_datos:
            db_title_norm = normalizar(libro["titulo"])
            if title_norm == db_title_norm:
                return libro["id"], libro["titulo"]
                
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
        # 1. Obtener libros populares
        libros_amazon = obtener_mas_vendidos()
        print(f"Libros obtenidos de Amazon:")
        for idx, (t, a) in enumerate(libros_amazon):
            print(f"  {idx+1}. {t} - {a}")
            
        # 2. Cargar base de datos local
        db_libros = cargar_base_datos()
        
        # 3. Cruzar información
        encontrados = []
        no_encontrados = []
        
        for titulo, autor in libros_amazon:
            resultado = buscar_libro_en_db(titulo, autor, db_libros)
            if resultado:
                book_id, db_title = resultado
                encontrados.append((book_id, db_title))
            else:
                no_encontrados.append(f"{titulo} - {autor}")
                
        # 4. Actualizar si hay al menos un libro coincidente
        if encontrados:
            actualizar_app_js(encontrados)
            print(f"\nSe actualizaron {len(encontrados)} libros destacados en app.js.")
        else:
            print("\nNo se encontró ningún libro coincidente en la base de datos local.")
            
        # 5. Avisar de los no encontrados
        if no_encontrados:
            print("\n" + "="*40)
            print("⚠️ AVISO: Libros no encontrados en el CSV:")
            for libro in no_encontrados:
                print(f"  - {libro}")
            print("="*40)
            
    except Exception as e:
        print(f"\n❌ Error en la ejecución: {e}")

if __name__ == "__main__":
    main()
