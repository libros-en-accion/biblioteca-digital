---
tipo: guia
area: operacion
tags: [guia, marketing, meta-ads, business-suite, conversiones, lanzamiento, libractiva]
fecha: 2026-11-14
---

# 🚀 Guía de Implementación: Lanzamiento y Campaña Meta Ads ($400 MXN)

Esta guía operativa reúne la estrategia, configuración exacta, textos aprobados, modelo financiero y plan de acción paso a paso para ejecutar la primera campaña pagada de **Libractiva** con un presupuesto máximo de **$400 MXN** ($80 MXN/día durante 5 días), maximizando compradores reales y evitando desperdicio de pauta.

> [!NOTE]
> Documento complementario a [[Guía - Dominio Propio Cloudflare y Vercel]] y [[resumen_ejecutivo]]. Mientras no se configure un dominio propio, el enlace activo de producción es `https://biblioteca-digital-eight.vercel.app/`.

---

## 📅 Cronograma Maestro

| Fase | Fechas sugeridas | Objetivo | Inversión | Estado |
| :--- | :--- | :--- | :---: | :---: |
| **Fase 1: Medición y código** | Sáb 14 – Dom 15 nov | Instalar Meta Pixel (`PageView`, `AddToCart`, `InitiateCheckout`, `Purchase`) + GA4 | \$0 | [ ] |
| **Fase 2: Vitrina orgánica** | Dom 15 – Mié 18 nov | Vestir Facebook e Instagram con 4 publicaciones reales antes de pagar pauta | \$0 | [ ] |
| **Fase 3: Configuración del anuncio** | Mié 18 nov (tarde) | Programar campaña en Meta Ads Manager para iniciar **Jue 19 nov 07:00** | \$0 | [ ] |
| **Fase 4: Campaña en vivo (5 días)** | Jue 19 – Lun 23 nov | Ejecución a $80 MXN/día con monitoreo nocturno y *Kill Switch* | **\$400 MXN máx.** | [ ] |
| **Fase 5: Auditoría y reinversión** | Mar 24 – Jue 26 nov | Cruzar Meta Ads + Mercado Pago + GA4 y decidir siguiente ciclo | \$0 | [ ] |

---

## 🛠️ Fase 1: Medición y Configuración Técnica (\$0 MXN)

**Regla de oro:** No lances publicidad antes de conectar los eventos de conversión al retorno de Mercado Pago. Sin evento `Purchase`, el algoritmo de Meta busca usuarios que hacen clics baratos pero no compran.

### 1.1 Crear identificadores de seguimiento (Acción manual)
- [ ] **Meta Pixel (Dataset):**
  1. Ir a `business.facebook.com` → **Todas las herramientas** → **Administrador de eventos** (*Events Manager*).
  2. Hacer clic en **Conectar orígenes de datos** → **Web** → **Conectar**.
  3. Nombrar `Pixel Libractiva`, ingresar `https://biblioteca-digital-eight.vercel.app/`, elegir **Instalar código manualmente** y guardar el **ID del Pixel** (número de ~15–16 dígitos).
- [ ] **Google Analytics 4 (Opcional, gratis):**
  1. Ir a `analytics.google.com` → **Administrar** → **Crear propiedad** (`Libractiva`) → Flujo **Web**.
  2. Guardar el **ID de medición** (`G-XXXXXXXXXX`).

### 1.2 Puntos de integración en el código de Libractiva
Al contar con los IDs, actualizar los siguientes archivos y elevar versión de caché (`sw.js` y `index.html`):

* **`index.html` (`<head>`, líneas 1–48):**
  * Insertar script base de Meta Pixel (`fbq('init', 'PIXEL_ID')` + `fbq('track', 'PageView')`) y snippet `gtag.js` de GA4.
* **`app.js` — Apertura del modal de compra (~líneas 3300–3308):**
  * Al interceptar clics en `a[href*="mpago.la/"]` para abrir `#modalCompra`, disparar:
    `fbq('track', 'AddToCart', { value: 100.00, currency: 'MXN' })`
* **`app.js` — Redirección a Mercado Pago (`iniciarCheckoutMercadoPago`, ~líneas 2610–2639):**
  * Antes de redirigir a `urlDestino` (`/api/crear-pago`), disparar:
    `fbq('track', 'InitiateCheckout', { value: 100.00, currency: 'MXN' })`
* **`app.js` — Compra confirmada (`verificarRetornoPagoMercadoPago`, ~líneas 4655–4662):**
  * Dentro de `if (resp.ok && data.valido && data.codigo)`, disparar **`Purchase` con deduplicación por `paymentId` en `localStorage`** para no duplicar ventas al recargar:
    `fbq('track', 'Purchase', { value: 100.00, currency: 'MXN', content_ids: ['LTD-LIBRACTIVA-100'], content_type: 'product' })`

### 1.3 Verificación en vivo antes de anunciar
- [ ] Instalar extensión **Meta Pixel Helper** en Chrome/Edge.
- [ ] Entrar a `https://biblioteca-digital-eight.vercel.app/`, abrir vista previa, abrir modal de compra y probar redirección a Mercado Pago comprobando que `PageView`, `AddToCart` e `InitiateCheckout` aparezcan en verde.

---

## 📱 Fase 2: Vitrina Orgánica Previa (\$0 MXN)

Antes de pagar tráfico frío, la página de Facebook e Instagram debe transmitir legitimidad y actividad real.

- [ ] **Vincular Página de Facebook + Cuenta profesional de Instagram** en Meta Business Suite (*Configuración → Cuentas vinculadas*).
- [ ] **Foto de perfil:** Logo oficial de Libractiva (verde botella y dorado).
- [ ] **Biografía:**
  > Biblioteca digital con +3,030 libros + Recomendador con IA 📚✨ Prueba 15 págs. gratis y obtén acceso de por vida por \$100 MXN (pago único en Mercado Pago). 👇
  > `https://biblioteca-digital-eight.vercel.app/`
- [ ] **Publicar 4 contenidos base (1 por día de domingo a miércoles):**
  1. **Domingo (Post fijado):** Imagen `anuncio_libractiva.jpg` explicando catálogo (+3,030 libros), lectura en cualquier dispositivo y pago seguro único de \$100 MXN con Mercado Pago.
  2. **Lunes (Reel / Video 15–20 s):** Grabación de pantalla vertical mostrando una pregunta real en *«¿Qué debería leer hoy?»* y los 3 libros sugeridos por la IA.
  3. **Martes (Carrusel):** 3 títulos de Psicología y Autoestima (*Maneras de amar*, *El cuerpo lleva la cuenta*, *Los seis pilares de la autoestima*) invitando a leer 15 páginas gratis.
  4. **Miércoles (Post comparativo):** *1 libro físico = \$350 MXN vs. 1 mes de app = \$129/mes vs. Libractiva Lifetime = \$100 MXN pago único*.

---

## 🎯 Fase 3: Configuración Óptima del Anuncio

### 3.1 Estrategia comercial elegida: Híbrida con pre-encuadre de precio
* Comunicar explícitamente el precio (**\$100 MXN pago único de por vida**) en imagen, texto y titular para filtrar curiosos gratuitos.
* Usar la prueba gratuita sin registro (**3 consultas IA + 15 páginas de lectura**) como **reductor de riesgo** para convertir en la primera visita.

### 3.2 Estructura en Meta Ads Manager (`adsmanager.facebook.com`)

> [!IMPORTANT]
> Aunque Meta Business Suite ofrece *«Get website visitors»*, ese objetivo optimiza para **clics baratos**, no para compradores. Usa **Meta Ads Manager** (con tu misma cuenta y presupuesto) para acceder al objetivo **Ventas (*Sales*)**.

| Parámetro | Configuración exacta recomendada | Notas / Justificación |
| :--- | :--- | :--- |
| **Estructura** | 1 Campaña → 1 Conjunto → 1 Anuncio | No dividir los \$400 MXN entre varios públicos o piezas. |
| **Objetivo (Campaña)** | **Ventas (*Sales*)** *(sin Pixel: Visitas al sitio en Business Suite)* | Entrena al algoritmo para buscar perfiles con historial de pago en web. |
| **Presupuesto diario** | **\$80.00 MXN/día** *(o **\$68.50 MXN/día** si el saldo tope incluye 16% IVA)* | Con 16% IVA de Meta México: \$68.50 × 5 = \$342.50 + \$54.80 IVA = **\$397.30 MXN**. |
| **Duración** | **5 días** (Jueves 07:00 → Lunes 23:59) | Captura fin de semana, cuando hay más tiempo libre para lectura. |
| **Evento de conversión** | Sitio web → **Comprar (*Purchase*)** | Ignorar advertencia inicial de "0 compras" en pixel nuevo. |
| **Ubicación** | México | Cobertura nacional; el algoritmo prioriza zonas de mayor intención. |
| **Edad y Sexo** | **23 a 54 años** · Todos los sexos | Excluye 18–22 (menor bancarización y mayor hábito de descarga pirata). |
| **Intereses (Advantage+)** | *Kindle*, *Librerías Gandhi*, *Literatura*, *Psicología*, *Desarrollo personal* | Señales iniciales para guiar el aprendizaje sin saturar. |
| **Ubicaciones (*Placements*)** | **Manuales:** Facebook Feed, Instagram Feed, Facebook Reels, Instagram Reels | Desactivar **Audience Network** y Messenger para evitar clics accidentales. |
| **Creatividad** | Imagen única: `anuncio_libractiva.jpg` (`1080 × 1080 px`) | Estética editorial verde/dorado; concentrar 100% de impresiones en una pieza. |
| **Llamada a la acción** | **Más información** (*Learn More*) | Reduce fricción inicial frente a *Comprar* al ofrecer prueba previa gratuita. |
| **URL de destino (con UTM)** | `https://biblioteca-digital-eight.vercel.app/?utm_source=meta&utm_medium=cpc&utm_campaign=lanzamiento_nov26` | Permite rastrear visitas reales y compras en GA4. |

### 3.3 Copy aprobado (Listo para copiar y pegar)

**Texto principal:**
```text
¿No sabes qué libro leer hoy o te cansaste de pagar $300 por cada libro? 📚

En Libractiva le escribes a nuestra IA algo como: «Tengo el fin de semana libre y quiero una novela de misterio o un libro de psicología que me atrape desde el inicio»… y en segundos te recomienda 3 libros exactos de nuestro catálogo explicándote por qué encajan contigo.

¿Qué incluye tu acceso?
• +3,030 libros seleccionados: Novela, thriller, psicología, superación, filosofía, ciencia ficción y sagas completas ordenadas tomo por tomo.
• Lee donde quieras: Lector integrado para celular y computadora que guarda automáticamente la página donde te quedaste.
• Formatos descargables: Baja cualquier obra en PDF y EPUB (listo para Kindle, Kobo o tu app favorita).

💡 Pruébala gratis antes de decidir: Entra ahora, hazle 3 consultas gratis al recomendador IA y lee las primeras 15 páginas de cualquier libro sin registrarte.

🔑 Si te convence, desbloquea todo para siempre por un PAGO ÚNICO de $100 MXN (sin mensualidades, hasta en 3 dispositivos, con pago seguro vía Mercado Pago y activación al instante).

👇 Toca en «Más información» para probar el recomendador IA ahora mismo.
```

**Título (Headline):**
```text
+3,000 Libros + IA por $100 MXN (Único Pago)
```

**Descripción:**
```text
Prueba 15 págs. gratis. Pago seguro con Mercado Pago.
```

---

## 📊 Fase 4: Finanzas, Monitoreo y Reglas de Corte (*Kill Switch*)

### 4.1 Economía unitaria real (Datos verificados)
* **Precio al público:** \$100.00 MXN.
* **Comisión Mercado Pago México (disponibilidad inmediata):** $3.49\% + \$4.00\text{ MXN} + 16\%\text{ IVA s/comisión}$ = **\$8.69 MXN por venta**.
* **Margen neto por venta (antes de publicidad):** **\$91.31 MXN** (`91.31%`).
* **CPA máximo de equilibrio (*Break-Even*):** **\$91.31 MXN** por comprador.
* **Punto de equilibrio de \$400 MXN:** **5 compradores reales** (\$456.55 MXN netos en Mercado Pago) o **6 compradores** contemplando el 16% IVA de Meta (\$464 MXN facturados).

### 4.2 Escenarios proyectados para \$400 MXN de pauta

| Escenario | CPC est. | Visitas reales (LPV) | Tasa de conversión | Ventas | Ingreso neto MP | Utilidad neta vs \$400 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Pesimista** | \$5.00 | 62 | 1.61% | 1 | \$91.31 | **-\$308.69 MXN** |
| **Conservador** | \$3.80 | 82 | 3.66% | 3 | \$273.93 | **-\$126.07 MXN** |
| **Intermedio** | \$2.85 | 109 | 4.59% | 5 | \$456.55 | **+\$56.55 MXN** |
| **Favorable** | \$2.10 | 148 | 6.08% | 9 | \$821.79 | **+\$421.79 MXN** |

### 4.3 Protocolo de revisión nocturna (21:00 h) y *Kill Switch*
* **Primeras 48 h (Jue y Vie):** **No editar** campaña ni segmentación para no reiniciar aprendizaje.
* **Corte Día 2 (al acumular ~\$160–\$180 MXN):** Si **CPC > \$7.00 MXN** y **CTR < 0.8%**, pausar el anuncio y preparar video screencast de 15 s mostrando la IA en acción.
* **Corte Día 3 (al acumular ~\$240 MXN):** Si hay **> 65 visitas reales** con **0 `InitiateCheckout` y 0 ventas**, pausar y auditar fricción en el modal de compra / límite de lectura antes de consumir los \$160 MXN restantes.
* **Si hay CPC entre \$2.00 y \$4.50 MXN + inicios de pago o ventas:** dejar completar los 5 días hasta el lunes 23:59.

---

## 🌱 Fase 5: Calendario Orgánico Complementario (30 Días — \$0 MXN)

Ejecución de ~30 min diarios enfocada en Reels de pantalla (*Consultorio Literario IA*), carruseles de psicología/estoicismo (aprovechando los 34 nuevos títulos integrados) y respuestas de valor en grupos de lectores en México.

| Día | Formato | Tema | Gancho / Enfoque |
| :---: | :---: | :--- | :--- |
| **1** | Reel (Screen) | Demo IA Misterio | *"Le pedí a una IA 3 thrillers cortos para el fin de semana…"* |
| **2** | Carrusel | Psicología del Apego | *Maneras de amar* + 2 títulos clave para vínculos sanos. |
| **3** | Comunidad | Grupos de lectura | Responder 3 hilos de *"¿qué leo después?"* con resultados de Libractiva. |
| **4** | Post | Anclaje de precio | \$350 libro físico vs \$129/mes vs \$100 pago único de por vida. |
| **5** | Reel (Screen) | Demo IA Ansiedad | Qué leer cuando no puedes dejar de sobrepensar (*Adiós, ansiedad*, *Dejar ir*). |
| **6** | Post | Sagas ordenadas | Mostrar las 59 sagas ordenadas tomo por tomo. |
| **7** | Carrusel | Estoicismo práctico | Séneca, Epicteto y Marco Aurelio en la colección *Filosofía Estoica*. |
| **8** | Reel (Screen) | Continuidad de lectura | Empezar en el celular en el transporte y seguir en laptop en la misma página. |
| **9** | Comunidad | Grupos Kindle/Kobo | Explicar descarga instantánea en EPUB limpio y PDF. |
| **10** | Carrusel | Trauma y cuerpo | *El cuerpo lleva la cuenta* + *Cuando el cuerpo dice no*. |
| **11** | Reel (Screen) | Demo IA Lectura rápida | *"Dame algo adictivo de menos de 200 páginas para retomar el hábito."* |
| **12** | Post | Autoestima y límites | Branden, Walter Riso y Brené Brown. |
| **13** | Reel (Screen) | Botón *¿Qué debería leer hoy?* | Encontrar libro por estado de ánimo en 15 segundos. |
| **14** | Comunidad | Hilos de recomendación | Aportar reseñas cortas de títulos del catálogo sin spam. |
| **15** | Carrusel | Sueño y dopamina | *Por qué dormimos* (Walker) + *Generación dopamina* (Lembke). |
| **16** | Reel (Screen) | Demo IA Distopías | Novelas similares a *1984*. |
| **17** | Post | Transparencia LTD | Por qué pago único de \$100 MXN y acceso en 3 dispositivos. |
| **18** | Carrusel | Sanación familiar | *Hijos adultos de padres emocionalmente inmaduros*. |
| **19** | Reel (Screen) | Pasar EPUB a Kindle/Kobo | Demo de descarga en 2 clics desde el lector. |
| **20** | Comunidad | Dinámica en comentarios | *"Dime el último libro que amaste y te digo qué te recomienda nuestra IA."* |
| **21** | Carrusel | Gestión del tiempo | *Cuatro mil semanas* + *Esencialismo*. |
| **22** | Reel (Screen) | Demo IA Propósito | Viktor Frankl, Michael Newton y psicología existencial. |
| **23** | Post | Clásicos Latinoamericanos | Rulfo, García Márquez, Borges y Cortázar. |
| **24** | Reel (Screen) | Lectura nocturna | Demostración del modo oscuro integrado. |
| **25** | Carrusel | Psicología en la novela | *El día que Nietzsche lloró* (Yalom) y colección homónima. |
| **26** | Comunidad | Foros de psicología | Compartir colección *Lecturas Terapéuticas* (Burns, Santandreu, Bucay). |
| **27** | Reel (Screen) | Reto 15 páginas | Probar gratis el inicio de cualquiera de los 3,039 libros. |
| **28** | Carrusel | Ranking en tiempo real | Top 5 más leídos de la plataforma. |
| **29** | Reel (Screen) | Demo IA Fantasía épica | Por dónde empezar con Sanderson, Rothfuss y Maas. |
| **30** | Post de cierre | Propuesta Lifetime | Menos de \$0.03 MXN por libro para toda la vida vía Mercado Pago. |

---

## 🔄 Regla de Reinversión Post-Campaña

1. **5+ ventas ($\ge \$456.55\text{ MXN}$ netos):** Retirar **\$400 MXN** de las ganancias generadas y lanzar un segundo ciclo de 5 días optimizando ya con datos reales de `Purchase`.
2. **1–4 ventas (\$91–\$365 MXN netos):** No poner capital propio adicional; acumular ingresos orgánicos del calendario de 30 días y auditar dónde abandonó el usuario (IA vs. modal de Mercado Pago) antes de volver a pautar.
3. **Mejora futura de margen (AOV):** Evaluar agregar un paquete *Dúo/Familiar* (2 códigos o 6 dispositivos por **\$149 MXN**) o escalar el pase individual a \$129–\$149 MXN tras validar las primeras 20 ventas.

---

## 🔗 Referencias Oficiales

* **Meta Business Help Center — Objetivos publicitarios ODAX:** https://www.facebook.com/business/help/1438417719786914
* **Meta Business Help Center — Visitas a la página de destino vs. Clics en enlace:** https://www.facebook.com/business/help/898752960195806
* **Meta Business Help Center — Público Advantage+:** https://www.facebook.com/business/help/273679548550751
* **Meta Business Help Center — IVA en anuncios en México (16%):** https://www.facebook.com/business/help/2316686575280802
* **Mercado Pago México — Costos por recibir pagos en Checkout:** https://www.mercadopago.com.mx/ayuda/costo-recibir-pagos-checkout_220
