#!/usr/bin/env python3
"""
scripts/agregar_nuevos_libros.py
Escanea la carpeta local biblioteca-digital/ buscando archivos PDF que no estén
registrados en libros.json y los agrega automáticamente asignándoles la descripción
correspondiente proporcionada.
"""
import os
import json
import re
import unicodedata

PDF_DIR = "/home/daniel/biblioteca-digital"
JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "libros.json")

# Mapa de descripciones proporcionadas por el usuario
MAPA_DESCRIPCIONES = {
    "elgrangatsby": "Ambientada en los vibrantes años veinte, esta novela examina las obsesiones, la opulencia y el desengaño del sueño americano. A través de la mirada de Nick Carraway, se narra la trágica historia del misterioso millonario Jay Gatsby y su incorregible amor por Daisy Buchanan.",
    "eldiariodeanafrank": "El conmovedor testimonio real de una niña judía que, junto a su familia, permaneció oculta en un anexo secreto en Ámsterdam durante la ocupación nazi. A través de sus páginas se plasman sus miedos, esperanzas y profunda madurez frente al horror de la guerra.",
    "lavidadepi": "Una extraordinaria novela de aventuras y supervivencia que narra la historia de Pi Patel, un joven indio que queda varado en el océano Pacífico a bordo de un bote salvavidas. Su única e inquietante compañía durante la travesía es un feroz tigre de Bengala llamado Richard Parker.",
    "cometasenelcielo": "Una emotiva y dolorosa historia de amistad, traición y redención ambientada en un Afganistán devastado por la transición política y la guerra. Sigue la vida de Amir, quien lucha por superar la culpa de haber traicionado a su leal amigo de la infancia, Hassan.",
    "demian": "Novela de aprendizaje que explora la dualidad humana y la compleja transición de la niñez a la madurez de Emil Sinclair. Bajo la mística influencia de su enigmático compañero Max Demian, el protagonista inicia un profundo viaje existencial hacia la autorrealización.",
    "elloboestepario": "Una profunda radiografía psicológica que retrata la crisis de identidad de Harry Haller, un intelectual maduro atrapado entre su naturaleza humana refinada y sus instintos salvajes. Es una feroz crítica a la sociedad burguesa y un viaje psicodélico hacia la aceptación.",
    "siddhartha": "Ambientada en la India antigua, esta lírica novela narra la búsqueda espiritual de un joven brahmán que abandona su hogar para hallar la iluminación. A través del ascetismo, los placeres mundanos y la contemplación de la naturaleza, descubre la verdadera esencia de la paz interior.",
    "lamaldiciondehillhouse": "Una obra maestra del terror gótico psicológico que sigue a cuatro personas que se alojan en una mansión laberíntica y supuestamente maldita. La tensión aumenta a medida que la frágil mente de la protagonista, Eleanor, comienza a fundirse de forma siniestra con la casa.",
    "recuerdossuenospensamientos": "Una obra autobiográfica única donde el célebre psiquiatra suizo detalla su mundo interior, sus experiencias místicas y su desarrollo intelectual. Más que un repaso cronológico de su vida, es un viaje a través de los conceptos de su inconsciente colectivo y la psicología analítica.",
    "loshombresquenoamabanalasmujeres": "El primer volumen de la aclamada saga Millennium introduce al periodista Mikael Blomkvist y a la brillante y antisocial hacker Lisbeth Salander. Juntos investigan la misteriosa desaparición de una joven ocurrida hace décadas, destapando los oscuros secretos de una poderosa familia.",
    "lachicaquesonabaconunacerillayunbidondegasolina": "En esta trepidante segunda entrega, Lisbeth Salander es injustamente acusada de un triple asesinato que conmociona a Suecia. Mientras huye de la ley, Mikael Blomkvist investiga el trasfondo del caso, destapando una siniestra red de trata de personas vinculada al pasado de Lisbeth.",
    "lareinaenelpalaciodelascorrientesdeaire": "El desenlace de la trilogía original encuentra a Lisbeth Salander gravemente herida en el hospital y bajo estricta vigilancia, esperando juicio. Con la ayuda de Blomkvist, se orquesta una batalla legal e informativa para desmantelar una sección secreta del servicio de seguridad del Estado.",
    "elbesodelamujerarana": "En una celda argentina, dos presos ideológicamente opuestos —un activista político y un homosexual mitómano— entablan una relación transformadora. Para evadir la cruda realidad de la prisión, comparten relatos de viejas películas, explorando la identidad, la libertad y el afecto.",
    "elcatalejolacado": "La épica conclusión de la trilogía 'La materia oscura' lleva a Lyra y Will a través de diversos mundos, incluyendo el reino de los muertos, para poner fin a la guerra celestial. Una deslumbrante aventura filosófica sobre la pérdida de la inocencia, el amor y el destino del universo.",
    "eloxforddelyra": "Un relato complementario que se sitúa un par de años después de los acontecimientos de la trilogía principal. En un Oxford alternativo, una Lyra más madura y su dæmon Pantalaimon rescatan al dæmon de una bruja, viéndose envueltos en un misterio lleno de antiguos rencores.",
    "labrujuladorada": "El inicio de 'La materia oscura' presenta a Lyra Belacqua, una huérfana que vive en un Oxford donde las almas humanas habitan fuera del cuerpo como compañeros animales. Su viaje al gélido Norte para rescatar a niños desaparecidos desvela una conspiración sobre una misteriosa sustancia.",
    "ladaga": "En el segundo volumen de la saga, Lyra conoce a Will Parry, un chico de nuestro propio mundo que posee un artefacto capaz de romper el tejido entre dimensiones. Juntos exploran la misteriosa ciudad desierta de Cittàgazze mientras huyen de terribles espectros comedores de almas.",
    "lasaventurasdesherlockholmes": "Recopilación de doce de los relatos más célebres del detective más famoso del mundo y su leal compañero, el doctor Watson. A través del razonamiento deductivo y una aguda observación, Holmes resuelve intrigantes misterios en las brumosas calles del Londres victoriano.",
    "eljuegodeender": "Clásico de la ciencia ficción donde la humanidad recluta a niños superdotados para entrenarlos en simulaciones de guerra táctica ante una inminente invasión alienígena. El pequeño Ender Wiggin destaca por su brillantez, soportando una brutal presión psicológica y moral en la Escuela de Batalla.",
    "asangrefria": "Obra cumbre del periodismo literario que reconstruye meticulosamente el brutal e injustificado asesinato de la familia Clutter en un tranquilo pueblo de Kansas. Capote fusiona el rigor documental con la potencia de la novela para indagar en las mentes de los asesinos y el dolor del pueblo.",
    "lospasosperdidos": "Un musicólogo frustrado emprende un viaje al corazón de la selva amazónica en busca de instrumentos musicales antiguos, huyendo de la vaciedad de la vida moderna. La travesía se convierte en un viaje de regreso en el tiempo donde el autor despliega su característico realismo mágico y barroco.",
    "exhalacion": "Una magistral antología de relatos de ciencia ficción que aborda dilemas existenciales a través de ingeniosos conceptos tecnológicos y científicos. Las historias exploran los viajes en el tiempo, la memoria cuántica y la inteligencia artificial, manteniendo siempre una mirada profundamente humana.",
    "lahistoriadetuvida": "Reconocida colección de relatos de ficción especulativa, cuyo cuento principal narra el encuentro de una lingüista con una raza extraterrestre. Al aprender su lenguaje no lineal, la protagonista adquiere la capacidad de percibir el tiempo de forma simultánea, transformando su visión del destino.",
    "hojasdehierba": "Obra cumbre de la poesía estadounidense que celebra la democracia, la naturaleza, el cuerpo humano y la libertad del espíritu individual. Con un estilo innovador de verso libre, el autor ofrece un canto vitalista y optimista que abraza la diversidad y la belleza de la experiencia mística cotidiana.",
    "poemasdelaoficinapoemasdelhoyporhoy": "Conjunto de poemas que retratan con sensibilidad la rutina, la monotonía y las pequeñas frustraciones del oficinista de clase media. Benedetti utiliza un lenguaje directo y cotidiano para rescatar la dignidad, el amor y la resistencia humana frente al gris panorama laboral de la burocracia.",
    "latregua": "Escrita en forma de diario, narra los últimos meses de trabajo de Martín Santomé, un viudo cercano a la jubilación cuya vida rutinaria cambia al conocer a la joven Laura Avellaneda. Es una tierna y melancólica historia de amor que representa un breve y luminoso oasis en una existencia gris.",
    "lainvenciondemorel": "Una genial novela de ciencia ficción en la que un prófugo de la justicia se esconde en una isla desierta donde operan extraños fenómenos. Pronto descubre que los habitantes del lugar son proyecciones holográficas perpetuas creadas por una máquina que inmortaliza las imágenes a costa de la vida.",
    "lanaranjamecanica": "Una distopía que sigue a Alex, un joven líder de una banda que disfruta de la ultraviolencia y la música clásica en una sociedad futurista. Tras ser capturado, es sometido a un brutal tratamiento estatal de lavado de cerebro, abriendo el debate ético sobre el libre albedrío y el control social.",
    "elninoconelpijamaderayas": "Una emotiva fábula sobre el Holocausto contada desde la perspectiva inocente de Bruno, el hijo de nueve años de un comandante de un campo de concentración. Bruno entabla una amistad prohibida a través de la alambrada con Shmuel, un niño judío cautivo que viste un misterioso 'pijama'.",
    "laladronadelibros": "Narrada por la mismísima Muerte, la historia sigue a Liesel Meminger, una niña que encuentra consuelo robando libros y compartiéndolos durante los bombardeos en la Alemania nazi. Junto a su familia adoptiva, es testigo de la crueldad de la guerra mientras ocultan a un joven judío en su sótano.",
    "elinfinitoenunjunco": "Un fascinante ensayo histórico que recorre la invención y evolución del libro en el mundo antiguo, rindiendo homenaje a quienes lo protegieron. Con una prosa poética, la autora viaja por los campos de batalla de Alejandro Magno, la Biblioteca de Alejandría y los primeros talleres de copistas.",
    "discursodelmetodomeditacionesmetafisicas": "Textos fundamentales de la filosofía moderna donde el autor establece la duda metódica como herramienta para alcanzar el conocimiento verdadero. A través de un riguroso examen racional, llega a certezas inquebrantables como la existencia del pensamiento propio ('pienso, luego existo') y de Dios.",
    "laspasionesdelalma": "El último tratado publicado por el filósofo francés, concebido como un estudio psicológico y fisiológico de las emociones humanas. En él intenta explicar cómo interactúan el cuerpo y el alma, analizando pasiones primarias como el amor, el odio, el deseo y la alegría desde una perspectiva racional.",
    "armasgermenesyacero": "Un ambicioso ensayo de historia transdisciplinaria que explica por qué las civilizaciones de ciertos continentes prosperaron más rápidamente que otras. El autor argumenta que el éxito geográfico y tecnológico no se debió a factores raciales, sino a ventajas ambientales, climáticas y de recursos.",
    "elcondedemontecristo": "Novela cumbre de aventuras y venganza que relata la historia de Edmundo Dantés, un marinero injustamente encarcelado el día de su boda por una traición. Tras escapar de prisión y hallar un fabuloso tesoro, adopta la identidad de un sofisticado conde para destruir metódicamente a sus enemigos.",
    "lostresmosqueteros": "Ambientada en la Francia del siglo XVII, narra las peripecias del joven y audaz gascón D'Artagnan en su viaje a París para unirse a los mosqueteros del rey. Junto a Athos, Porthos y Aramis, se enfrentará a las peligrosas intrigas políticas del Cardenal Richelieu y la enigmática Milady.",
    "pensarrapidopensardespacio": "Un revelador viaje por la mente humana de la mano del Premio Nobel de Economía, donde se detallan los dos sistemas que dirigen nuestro pensamiento. Uno es rápido, intuitivo y emocional, mientras que el otro es lento, deliberativo y lógico, afectando nuestras decisiones diarias de forma inconsciente.",
    "losriosprofundos": "Obra cumbre de la literatura indigenista peruana que sigue a Ernesto, un adolescente que deambula entre el mundo andino y el occidental. A través de sus ojos, la novela retrata la opresión social, la riqueza del folclor quechua y el desgarro de la identidad en un colegio internado de Abancay.",
    "patria": "Una monumental novela que retrata el impacto del terrorismo de ETA en la sociedad vasca a través de la historia de dos familias que solían ser inseparables. El asesinato de un empresario rompe los lazos comunitarios, mostrando las heridas, el fanatismo y la difícil búsqueda del perdón.",
    "cantardelmiocid": "Cantar de gesta medieval que narra las heroicas hazañas inspiradas libremente en los últimos años de vida del caballero castellano Rodrigo Díaz de Vivar. La epopeya se centra en la pérdida del honor ante el rey Alfonso VI y el arduo proceso de reconquista para recuperar el favor real.",
    "hyperion": "Una obra maestra de la ciencia ficción espacial que adopta la estructura de los Cuentos de Canterbury. Siete peregrinos viajan al remoto planeta Hyperion para visitar las Tumbas del Tiempo y encontrarse con el Alcaudón, una criatura mítica, compartiendo por el camino sus asombrosas historias.",
    "elguardianentreelcenteno": "Un clásico de la literatura contemporánea que captura la alienación, el desencanto y la rebeldía de la adolescencia. A través del monólogo de Holden Caulfield tras ser expulsado de su colegio, se ofrece una crítica mordaz a la hipocresía del mundo adulto y el dolor por la pérdida de la inocencia.",
    "lasenoritaelse": "Novela corta estructurada como un monólogo interior que retrata el dilema moral de una joven de la alta burguesía austriaca. Para salvar a su padre de la cárcel por deudas, Else debe acceder a la humillante petición de un adinerado marchante de arte, desnudando la hipocresía social de la época.",
    "relatosonado": "Una perturbadora exploración del matrimonio, el deseo reprimido y los celos que sigue al doctor Fridolin por las calles de Viena tras una confesión de su esposa. Su periplo nocturno lo arrastra a una misteriosa y aristocrática fiesta de máscaras secreta donde reinan el erotismo y el peligro.",
    "eltenientegustl": "Esta obra destaca por ser uno de los primeros ejemplos de la literatura en usar el monólogo interior continuo. Sigue los pensamientos obsesivos y angustiosos de un joven militar austriaco durante una noche, tras sufrir una afrenta a su honor que, según el código de la época, le exige el suicidio.",
    "elartedelaguerra": "Antiguo tratado militar chino cuyas estrategias tácticas e ideas sobre el conflicto trascienden el campo de batalla. Centrado en la importancia de la preparación, el engaño y el conocimiento del enemigo, propone vencer sin llegar a la confrontación, siendo muy usado hoy en los negocios.",
    "lacabanadeltiotom": "Una novela profundamente influyente que retrata la crueldad, el sufrimiento y la injusticia de la esclavitud en el sur de los Estados Unidos. A través de la historia del piadoso y paciente esclavo Tom, la obra conmovió las consciencias de la época, impulsando de forma decisiva la causa abolicionista.",
    "neuromante": "La novela fundacional del género cyberpunk que acuñó el término ciberespacio. Sigue a Case, un hacker informático de bajo nivel cuyo sistema nervioso fue dañado como castigo, a quien se le ofrece una última oportunidad de curación a cambio de hackear una inteligencia artificial corporativa masiva.",
    "elsenordelasmoscas": "Una fábula moral y distópica sobre un grupo de estudiantes británicos que queda varado en una isla desierta tras un accidente aéreo. Lo que inicia como una sociedad organizada y democrática degenera rápidamente en el salvajismo, explorando la innata oscuridad y crueldad del ser humano."
}

def simplificar_clave(texto):
    """Normaliza y limpia un texto para generar una clave de matching libre de acentos y caracteres especiales."""
    texto = texto.lower().strip()
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto) if unicodedata.category(c) != 'Mn')
    texto = re.sub(r"[^a-z0-9]", "", texto)
    return texto

def revertir_nombre_autor(nombre_carpeta):
    """Convierte 'Allende, Isabel' -> 'Isabel Allende'."""
    if "," in nombre_carpeta:
        partes = nombre_carpeta.split(",", 1)
        return f"{partes[1].strip()} {partes[0].strip()}"
    return nombre_carpeta.strip()

def sugerir_genero(titulo):
    """Sugiere un género básico según el título."""
    t = titulo.lower()
    if any(w in t for w in ["poema", "poesia", "versos", "antologia"]):
        return "Poesía"
    if any(w in t for w in ["filosofia", "ética", "tratado", "dialogo", "discurso", "meditacion"]):
        return "Filosofía"
    if any(w in t for w in ["ensayo", "critica", "estudio"]):
        return "Ensayo"
    if any(w in t for w in ["cuento", "relato", "fábula"]):
        return "Cuento"
    if any(w in t for w in ["historia", "cronica", "biografia", "memorias"]):
        return "Historia y Crónica"
    return "Novela"

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ No se encontró libros.json en {JSON_PATH}")
        return

    # Leer catálogo actual
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        libros = json.load(f)

    # Crear conjunto de PDFs ya registrados
    pdf_registrados = set()
    max_id = 0
    for l in libros:
        if l.get("id", 0) > max_id:
            max_id = l["id"]
        ruta = l.get("archivo_pdf")
        if ruta:
            pdf_registrados.add(ruta.replace("\\", "/").strip())

    nuevos_agregados = 0
    print("🔍 Escaneando archivos en local...")

    for raiz, dirs, archivos in os.walk(PDF_DIR):
        # Evitar entrar a carpetas de EPUB o carpetas ocultas
        dirs[:] = [d for d in dirs if d != "001_EPUB" and not d.startswith(".")]

        for archivo in archivos:
            if not archivo.lower().endswith(".pdf"):
                continue

            ruta_abs = os.path.join(raiz, archivo)
            ruta_relativa = os.path.relpath(ruta_abs, PDF_DIR).replace("\\", "/").strip()

            # Si ya está en la lista de registrados, ignorar
            if ruta_relativa in pdf_registrados:
                continue

            base = archivo.rsplit(".", 1)[0]
            nombre_carpeta_autor = os.path.basename(raiz)
            
            titulo = base
            autor = revertir_nombre_autor(nombre_carpeta_autor)

            # Separar por " - " si es aplicable
            if " - " in base:
                partes = base.split(" - ", 1)
                p0_norm = partes[0].lower().strip()
                p1_norm = partes[1].lower().strip()
                carpeta_norm = nombre_carpeta_autor.lower().strip()
                autor_revertido_norm = autor.lower().strip()

                if p1_norm in carpeta_norm or p1_norm in autor_revertido_norm:
                    titulo = partes[0].strip()
                elif p0_norm in carpeta_norm or p0_norm in autor_revertido_norm:
                    titulo = partes[1].strip()
                else:
                    titulo = partes[0].strip()
                    autor = partes[1].strip()

            titulo = titulo.replace("_", " ").strip()
            if titulo.isupper() and len(titulo) > 3:
                titulo = titulo.title()

            # Obtener descripción desde el mapa
            clave = simplificar_clave(titulo)
            descripcion = MAPA_DESCRIPCIONES.get(clave, "")

            if not descripcion:
                # Intento de matching secundario si el título tiene variantes menores
                for k, d in MAPA_DESCRIPCIONES.items():
                    if k in clave or clave in k:
                        descripcion = d
                        break

            max_id += 1
            nuevo_libro = {
                "id": max_id,
                "titulo": titulo,
                "autor": autor,
                "anio": None,
                "genero": sugerir_genero(titulo),
                "descripcion": descripcion,
                "portada": "",
                "archivo_pdf": ruta_relativa
            }

            libros.append(nuevo_libro)
            pdf_registrados.add(ruta_relativa)
            nuevos_agregados += 1
            desc_status = "✨ Con descripción" if descripcion else "⚠️  Sin descripción en mapa"
            print(f"➕ Agregado: [{max_id}] {titulo} — {autor} ({desc_status})")

    if nuevos_agregados > 0:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(libros, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Proceso completado. Se agregaron {nuevos_agregados} nuevos libros a libros.json.")
        print("💡 Recuerda ejecutar el script de normalización si es necesario:")
        print("   node scripts/normalizar.js --apply")
    else:
        print("\n✨ No se encontraron nuevos archivos PDF para agregar. Todo está al día.")

if __name__ == "__main__":
    main()
