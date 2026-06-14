// ── CONFIGURACIÓN DE LIBROS DESTACADOS ──
// Puedes actualizar manualmente los IDs de esta lista (por ejemplo, cada semana)
// según los libros más populares de Amazon u otra fuente de tu preferencia.
const LIBROS_DESTACADOS_IDS = [
  1233, // Las 48 leyes del poder
  2845, // Alas de sangre
  2763, // No tengo boca y debo gritar
  814, // Noches blancas (Ilustrado)
  2857, // Proyecto Hail Mary
  783, // El placebo eres tu
  1250, // La sociedad del cansancio
  2079, // 1984
  2875, // El túnel
  2820  // Los siete maridos de Evelyn Hugo 
];

// ── VARIABLES GLOBALES ──
let libros = [];
let colecciones = [];
let coleccionActiva = null;
let generoActivo = 'Todos';
let paginaActual = 1;
const LIBROS_POR_PAGINA = 24;
let listaFiltrada = [];
let ordenActivo = 'default'; // default | titulo-asc | titulo-desc | autor-asc | anio-asc | anio-desc
let autorActivo = 'Todos';
let epocaActiva = 'Todas';
let ultimoElementoEnfocado = null;
let vistaActiva = localStorage.getItem('biblioteca-vista') || 'grid';
let moodActivo = 'Todos';
let soloFavoritos = false;

const FAVORITOS_KEY = 'libractiva_favoritos';

function obtenerFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITOS_KEY)) || [];
  } catch { return []; }
}

function guardarFavoritos(ids) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(ids));
}

function esFavorito(libroId) {
  return obtenerFavoritos().includes(libroId);
}

function toggleFavorito(libroId) {
  const favs = obtenerFavoritos();
  const idx = favs.indexOf(libroId);
  if (idx >= 0) {
    favs.splice(idx, 1);
    guardarFavoritos(favs);
    return false;
  } else {
    favs.push(libroId);
    guardarFavoritos(favs);
    return true;
  }
}

const moodTagsData = [
  { id: 'rapido', label: 'Lectura Rápida', icon: 'clock', valor: 'rapido' },
  { id: 'reflexionar', label: 'Reflexionar', icon: 'brain', valor: 'reflexionar' },
  { id: 'escapar', label: 'Escapar', icon: 'compass', valor: 'escapar' },
  { id: 'aprender', label: 'Aprender', icon: 'microscope', valor: 'aprender' },
  { id: 'intriga', label: 'Misterio e Intriga', icon: 'ghost', valor: 'intriga' }
];

// ── FRASES LITERARIAS ──
const frases = [
  '«Un lector vive mil vidas antes de morir.» — George R.R. Martin',
  '«Los libros son espejos: solo se ve en ellos lo que uno ya lleva dentro.» — Carlos Ruiz Zafón',
  '«Leer es soñar con los ojos abiertos.» — Anónimo',
  '«No hay amigo más leal que un libro.» — Ernest Hemingway',
  '«La lectura es para la mente lo que el ejercicio es para el cuerpo.» — Joseph Addison',
  '«Un libro es un sueño que tienes en tus manos.» — Neil Gaiman',
  '«Siempre imaginé que el paraíso sería algún tipo de biblioteca.» — Jorge Luis Borges',
  '«Los libros que el mundo llama inmorales son los que muestran al mundo su propia vergüenza.» — Oscar Wilde',
];

// ── MAPA DE CLASES CSS POR GÉNERO ──
const generoClaseMap = {
  'ciencia ficcion': 'genero-ciencia-ficcion',
  'ciencia ficción': 'genero-ciencia-ficcion',
  'fantasia': 'genero-fantasia',
  'fantasía': 'genero-fantasia',
  'terror': 'genero-terror',
  'romance': 'genero-romance',
  'filosofia': 'genero-filosofia',
  'filosofía': 'genero-filosofia',
  'filosofia politica': 'genero-filosofia',
  'filosofía política': 'genero-filosofia',
  'poesia': 'genero-poesia',
  'poesía': 'genero-poesia',
  'historia y cronica': 'genero-historia',
  'historia y crónica': 'genero-historia',
  'misterio y thriller': 'genero-misterio',
  'misterio': 'genero-misterio',
  'teatro': 'genero-teatro',
  'divulgacion cientifica': 'genero-divulgacion',
  'divulgación científica': 'genero-divulgacion',
  'psicologia y autoayuda': 'genero-psicologia',
  'psicología y autoayuda': 'genero-psicologia',
  'biografia y memorias': 'genero-biografia',
  'biografía y memorias': 'genero-biografia',
  'literatura latinoamericana': 'genero-latinoamericana',
  'novela histórica': 'genero-historia',
  'novela juvenil': 'genero-fantasia',
  'novela negra': 'genero-misterio',
  'epistolar': 'genero-biografia',
  'economía y política': 'genero-divulgacion',
  'religión y teología': 'genero-filosofia',
  'otro': '',
};

// ── MAPA DE ICONOS POR GÉNERO (Lucide) ──
const generoIconMap = {
  'Novela': 'book',
  'Ensayo': 'pen-tool',
  'Ciencia Ficción': 'rocket',
  'Cuento': 'book-open',
  'Filosofía': 'brain',
  'Fantasía': 'wand-2',
  'Misterio y Thriller': 'search',
  'Divulgación Científica': 'microscope',
  'Romance': 'heart',
  'Terror': 'ghost',
  'Poesía': 'feather',
  'Teatro': 'ticket',
  'Novela histórica': 'scroll',
  'Psicología y Autoayuda': 'puzzle',
  'Historia y Crónica': 'landmark',
  'Biografía y Memorias': 'user',
  'Novela juvenil': 'star',
  'Novela negra': 'eye',
  'Otro': 'library',
  'Epistolar': 'mail',
  'Economía y Política': 'trending-up',
  'Religión y Teología': 'book-marked',
  'Literatura latinoamericana': 'globe',
  'Todos': 'library',
};

// ── LIMPIAR TÍTULO ──
function limpiarTitulo(titulo) {
  if (!titulo) return '';
  // Reemplaza guiones bajos y guiones largos por espacios
  let limpio = titulo.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Si está todo en mayúsculas o todo mal formateado, capitalizar
  if (limpio === limpio.toUpperCase() && limpio.length > 3) {
    limpio = limpio.toLowerCase().replace(/(?:^|\s)\S/g, l => l.toUpperCase());
  }

  return limpio;
}

// ── OBTENER CLASE CSS DE GÉNERO ──
function obtenerClaseGenero(genero) {
  if (!genero) return '';
  const clave = genero.toLowerCase().trim();
  return generoClaseMap[clave] || '';
}

// ── DEBOUNCE ──
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── MOSTRAR SKELETON LOADERS DURANTE LA CARGA ──
function mostrarSkeletons() {
  const galeria = document.getElementById('galeria');
  if (!galeria) return;
  
  galeria.innerHTML = Array.from({ length: 12 }, () => `
    <div class="tarjeta skeleton-tarjeta">
      <div class="skeleton skeleton-portada"></div>
      <div class="tarjeta-info">
        <div class="skeleton skeleton-badge"></div>
        <div class="skeleton skeleton-titulo"></div>
        <div class="skeleton skeleton-autor"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `).join('');
}

// ── CARGAR LIBROS AL INICIAR ──
mostrarSkeletons();
Promise.all([
  fetch('libros.json?v=9').then(r => {
    if (!r.ok) throw new Error(`Error HTTP al cargar libros: ${r.status}`);
    return r.json();
  }),
  fetch('colecciones.json').then(r => {
    if (!r.ok) throw new Error(`Error HTTP al cargar colecciones: ${r.status}`);
    return r.json();
  })
])
  .then(([datosLibros, datosColecciones]) => {
    libros = datosLibros;
    colecciones = datosColecciones;
    listaFiltrada = libros;
    mostrarPagina(1);
    inicializarPagina();
    renderizarColecciones();
  })
  .catch(error => {
    console.error('Error al cargar el catálogo:', error);
    const galeria = document.getElementById('galeria');
    if (galeria) {
      galeria.innerHTML = `
        <div class="error-carga">
          <div class="error-icono">📚</div>
          <h2>No se pudo cargar el catálogo</h2>
          <p>${error.message}</p>
          <button id="btnReintentar" class="btn-recomendar">Reintentar</button>
        </div>
      `;
      document.getElementById('btnReintentar')?.addEventListener('click', () => location.reload());
    }
  });

// ── INICIALIZAR PÁGINA ──
/* Adapta el placeholder del buscador según el tamaño del viewport */
function adaptarPlaceholder() {
  const input = document.getElementById('inputBusqueda');
  if (!input) return;
  const actualizar = () => {
    input.placeholder = window.innerWidth < 480
      ? 'Buscar libro, autor…'
      : 'Buscar por título, autor, género o año…';
  };
  actualizar();
  window.addEventListener('resize', actualizar, { passive: true });
}

function inicializarPagina() {
  // Frase literaria aleatoria
  const fraseEl = document.getElementById('fraseLiteraria');
  if (fraseEl) {
    fraseEl.textContent = frases[Math.floor(Math.random() * frases.length)];
  }

  // Footer
  const footerStats = document.getElementById('footerStats');
  if (footerStats) {
    footerStats.textContent = `${libros.length.toLocaleString('es-MX')} libros disponibles en el catálogo`;
  }
  const footerAnio = document.getElementById('footerAnio');
  if (footerAnio) {
    footerAnio.textContent = new Date().getFullYear();
  }

  // Generar tags dinámicamente
  generarTagsFiltro();

  // Conteos en chips de época
  actualizarConteosEpoca();

  // Scroll horizontal de tags con rueda de ratón (desktop)
  const filtrosTags = document.getElementById('filtrosTags');
  if (filtrosTags) {
    filtrosTags.addEventListener('wheel', (evt) => {
      if (evt.deltaY !== 0) {
        evt.preventDefault();
        filtrosTags.scrollLeft += evt.deltaY;
      }
    });
  }

  // Buscador con debounce + Enter para hacer scroll a resultados
  const inputBusqueda = document.getElementById('inputBusqueda');
  if (inputBusqueda) {
    const filtrarConDebounce = debounce(() => filtrar(), 250);
    inputBusqueda.addEventListener('input', () => {
      const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
      if (btnLimpiar) {
        btnLimpiar.style.display = inputBusqueda.value.length > 0 ? 'flex' : 'none';
      }
      filtrarConDebounce();
    });
    // Al presionar Enter: filtrar y desplazar la vista al catálogo
    inputBusqueda.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filtrar();
        const galeria = document.getElementById('galeria');
        if (galeria) {
          galeria.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  // Adaptar placeholder del buscador según viewport (móvil / desktop)
  adaptarPlaceholder();

  // Poblar e inicializar los custom dropdowns, chips y autocompletado
  poblarDropdownAutores();
  inicializarDropdowns();
  inicializarAutocompletado();

  // Registrar TODOS los event listeners (zero onclick inline)
  registrarEventos();

  // Modo oscuro
  inicializarTema();

  // Rutas hash
  manejarRutaHash();

  // Inicializar vista (grid/lista)
  cambiarVista(vistaActiva);

  if (window.lucide) lucide.createIcons();
}

// ── GENERAR TAGS DE FILTRO DINÁMICAMENTE ──
function generarTagsFiltro() {
  const contenedor = document.getElementById('filtrosTags');
  if (!contenedor) return;

  // Contar libros por género
  const conteo = {};
  libros.forEach(l => {
    const g = l.genero || 'Otro';
    conteo[g] = (conteo[g] || 0) + 1;
  });

  // Ordenar por cantidad (mayor a menor)
  const generosOrdenados = Object.entries(conteo)
    .filter(([, c]) => c >= 1) // Todos los géneros
    .sort((a, b) => b[1] - a[1]);

  contenedor.innerHTML = '';

  // 1. Renderizar primero los Mood Tags (Descubrimiento Inteligente)
  moodTagsData.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'tag-genero tag-mood-btn';
    btn.dataset.mood = m.valor;
    btn.setAttribute('aria-pressed', 'false');
    if (moodActivo === m.valor) {
      btn.classList.add('activo');
      btn.setAttribute('aria-pressed', 'true');
    }
    btn.innerHTML = `<i data-lucide="${m.icon}" class="icono-sm"></i> ${m.label}`;
    btn.addEventListener('click', () => filtrarMood(m.valor, btn));
    contenedor.appendChild(btn);
  });

  const separador = document.createElement('div');
  separador.className = 'tag-separador';
  separador.setAttribute('aria-hidden', 'true');
  contenedor.appendChild(separador);

  // 2. Renderizar Tag "Todos"
  const btnTodos = document.createElement('button');
  btnTodos.className = 'tag-genero activo';
  btnTodos.dataset.genero = 'Todos';
  btnTodos.innerHTML = `<i data-lucide="library" class="icono-sm"></i> Todos`;
  btnTodos.addEventListener('click', () => filtrarGenero('Todos', btnTodos));
  contenedor.appendChild(btnTodos);

  // 3. Renderizar Tags por género
  generosOrdenados.forEach(([genero, cantidad]) => {
    const iconName = generoIconMap[genero] || 'library';
    const btn = document.createElement('button');
    btn.className = 'tag-genero';
    btn.dataset.genero = genero;
    btn.innerHTML = `<i data-lucide="${iconName}" class="icono-sm"></i> ${genero}`;
    btn.title = `${cantidad} libros`;
    btn.addEventListener('click', () => filtrarGenero(genero, btn));
    contenedor.appendChild(btn);
  });
  
  if (window.lucide) lucide.createIcons({ root: contenedor });
}

function actualizarConteosEpoca() {
  const rangos = {
    'pre-1800':    l => { const a = parseInt(l.anio); return a < 1800; },
    '1800-1899':   l => { const a = parseInt(l.anio); return a >= 1800 && a <= 1899; },
    '1900-1949':   l => { const a = parseInt(l.anio); return a >= 1900 && a <= 1949; },
    '1950-1999':   l => { const a = parseInt(l.anio); return a >= 1950 && a <= 1999; },
    '2000+':       l => { const a = parseInt(l.anio); return a >= 2000; }
  };

  Object.entries(rangos).forEach(([epoca, filtro]) => {
    const item = document.querySelector(`#menuDropdownEpoca .dropdown-item[data-valor="${epoca}"]`);
    if (!item) return;
    const count = libros.filter(l => l.anio && filtro(l)).length;
    item.setAttribute('title', `${count} libros`);

    let badge = item.querySelector('.chip-count');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'chip-count';
      item.appendChild(badge);
    }
    badge.textContent = count;
  });
}

// ── RENDERIZAR LIBROS DESTACADOS ──
function renderizarDestacados() {
  const seccion = document.getElementById('destacados-seccion');
  const galeriaDestacados = document.getElementById('destacados-galeria');
  
  if (!seccion || !galeriaDestacados) return;

  const inputBusqueda = document.getElementById('inputBusqueda');
  const busquedaText = inputBusqueda ? inputBusqueda.value.trim() : '';

  const tieneFiltros = 
    generoActivo !== 'Todos' || 
    autorActivo !== 'Todos' || 
    epocaActiva !== 'Todas' || 
    moodActivo !== 'Todos' || 
    busquedaText !== '' ||
    paginaActual > 1 ||
    coleccionActiva !== null;

  if (tieneFiltros) {
    seccion.style.display = 'none';
    return;
  }

  const librosDestacados = libros.filter(libro => LIBROS_DESTACADOS_IDS.includes(libro.id));
  
  if (librosDestacados.length === 0) {
    seccion.style.display = 'none';
    return;
  }

  // Mezclar el orden de manera aleatoria (Algoritmo Fisher-Yates)
  for (let i = librosDestacados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [librosDestacados[i], librosDestacados[j]] = [librosDestacados[j], librosDestacados[i]];
  }

  seccion.style.display = 'block';
  galeriaDestacados.innerHTML = '';

  const esDonador = esDonadorLocal();

  librosDestacados.forEach((libro, i) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.style.animationDelay = `${i * 0.03}s`;
    const claseGenero = obtenerClaseGenero(libro.genero);
    const tituloLimpio = limpiarTitulo(libro.titulo);
    const hasPdf = !!libro.archivo_pdf;
    const esFav = esFavorito(libro.id);

    tarjeta.innerHTML = `
      ${libro.portada 
        ? `<img src="${libro.portada}" alt="${tituloLimpio}" class="tarjeta-portada" loading="lazy" width="230" height="307" decoding="async" />` 
        : `<div class="tarjeta-portada tarjeta-portada-placeholder">
             <i data-lucide="book" class="icono-lg"></i>
           </div>`
      }
      <button class="tarjeta-fav-btn ${esFav ? 'favorito' : ''}" data-fav-id="${libro.id}" aria-label="${esFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
        <i data-lucide="heart"></i>
      </button>
      <div class="tarjeta-info" data-libro-id="${libro.id}" style="cursor:pointer">
        <span class="tarjeta-genero-badge ${claseGenero}">${libro.genero || 'General'}</span>
        ${(hasPdf && !esDonador) ? `<span class="badge-preview" aria-label="Vista previa gratuita de 15 páginas">📖 Vista previa · 15 págs.</span>` : ''}
        <div class="tarjeta-titulo">${tituloLimpio}</div>
        <div class="tarjeta-autor">${libro.autor || ''}</div>
        <div class="tarjeta-anio">${libro.anio || ''}</div>
        <div class="tarjeta-descripcion">${libro.descripcion || ''}</div>
      </div>
      ${hasPdf ?
        `<button class="btn-ver btn-leer-lector" style="cursor:pointer"><i data-lucide="book-open" class="icono-sm"></i> Leer</button>` :
        `<a href="${libro.pdf || '#'}" target="_blank" rel="noopener" class="btn-ver"><i data-lucide="file-text" class="icono-sm"></i> Ver documento</a>`
      }
    `;

    tarjeta.querySelector('.tarjeta-info').addEventListener('click', () => abrirDetalleLibro(libro.id));
    if (hasPdf) {
      tarjeta.querySelector('.btn-leer-lector').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirLector(libro.id, libro);
      });
    }
    tarjeta.querySelector('.tarjeta-fav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const nuevoEstado = toggleFavorito(libro.id);
      const btnFav = e.currentTarget;
      btnFav.classList.toggle('favorito', nuevoEstado);
      btnFav.setAttribute('aria-label', nuevoEstado ? 'Quitar de favoritos' : 'Añadir a favoritos');
      if (soloFavoritos) filtrar();
    });

    galeriaDestacados.appendChild(tarjeta);
  });

  if (window.lucide) lucide.createIcons({ root: galeriaDestacados });
}

// ── RENDERIZAR COLECCIONES CURADAS ──
function renderizarColecciones() {
  const seccion = document.getElementById('colecciones-seccion');
  const grid = document.getElementById('coleccionesGrid');
  if (!seccion || !grid) return;

  const inputBusqueda = document.getElementById('inputBusqueda');
  const busquedaText = inputBusqueda ? inputBusqueda.value.trim() : '';

  const tieneFiltros = 
    generoActivo !== 'Todos' || 
    autorActivo !== 'Todos' || 
    epocaActiva !== 'Todas' || 
    moodActivo !== 'Todos' || 
    busquedaText !== '' ||
    paginaActual > 1 ||
    coleccionActiva !== null;

  if (tieneFiltros) {
    seccion.style.display = 'none';
    return;
  }

  if (colecciones.length === 0) {
    seccion.style.display = 'none';
    return;
  }

  seccion.style.display = 'block';
  grid.innerHTML = '';

  colecciones.forEach(pack => {
    // Obtener los objetos completos de libros pertenecientes a este pack
    const librosDelPack = pack.libros.map(id => libros.find(l => l.id === id)).filter(Boolean);
    
    // Obtener la portada del primer libro para el fondo borroso (o una genérica si no hay)
    const primerLibro = librosDelPack[0];
    const bgPortada = (primerLibro && primerLibro.portada) ? primerLibro.portada : 'portadas/pack-generico.webp';
    
    // Obtener portadas de los primeros 3 libros para el stack visual
    const portadasAMostrar = librosDelPack.slice(0, 3).map(l => l.portada).filter(Boolean);
    
    // Construir el HTML para el stack tridimensional
    let stackHtml = '';
    if (portadasAMostrar.length > 0) {
      stackHtml = `
        <div class="pack-libros-stack">
          ${portadasAMostrar.map((portada, idx) => `
            <div class="pack-libro-stack-item portada-idx-${idx}">
              <img src="${portada}" alt="Portada de libro" loading="lazy" />
            </div>
          `).join('')}
        </div>
      `;
    }

    const tarjeta = document.createElement('div');
    tarjeta.className = 'pack-tarjeta';
    tarjeta.innerHTML = `
      <img src="${bgPortada}" alt="${pack.titulo}" class="pack-tarjeta-bg" loading="lazy" />
      <span class="pack-insignia">✦ ${pack.libros.length} Libros</span>
      ${stackHtml}
      <div class="pack-info">
        <h4 class="pack-titulo">${pack.titulo}</h4>
        <p class="pack-descripcion">${pack.descripcion}</p>
        <button class="btn-explorar-pack">Explorar Colección <i data-lucide="arrow-right" class="icono-sm"></i></button>
      </div>
    `;

    tarjeta.addEventListener('click', () => seleccionarColeccion(pack));
    grid.appendChild(tarjeta);
  });

  if (window.lucide) lucide.createIcons({ root: grid });
}

function seleccionarColeccion(pack) {
  coleccionActiva = pack;
  
  // Actualizar UI
  const titulo = document.getElementById('catalogoTitulo');
  const btnCerrar = document.getElementById('btnCerrarPack');
  
  if (titulo) titulo.textContent = `Colección: ${pack.titulo}`;
  if (btnCerrar) btnCerrar.style.display = 'inline-flex';

  // Ocultar destacados y colecciones
  const descSeccion = document.getElementById('destacados-seccion');
  const colSeccion = document.getElementById('colecciones-seccion');
  if (descSeccion) descSeccion.style.display = 'none';
  if (colSeccion) colSeccion.style.display = 'none';

  // Filtrar y hacer scroll suave al catálogo
  filtrar();
  
  const catalogoHeader = document.querySelector('.catalogo-header-barra');
  if (catalogoHeader) {
    catalogoHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function quitarColeccion() {
  coleccionActiva = null;

  // Restaurar UI
  const titulo = document.getElementById('catalogoTitulo');
  const btnCerrar = document.getElementById('btnCerrarPack');
  
  if (titulo) titulo.textContent = 'Catálogo Completo';
  if (btnCerrar) btnCerrar.style.display = 'none';

  // Volver a filtrar y refrescar vistas
  filtrar();
  renderizarColecciones();
  renderizarDestacados();
}

// ── MOSTRAR PÁGINA ──
function mostrarPagina(pagina, omitirScroll = false) {
  paginaActual = pagina;
  renderizarDestacados();
  const inicio = (pagina - 1) * LIBROS_POR_PAGINA;
  const fin = inicio + LIBROS_POR_PAGINA;
  const paginaLibros = listaFiltrada.slice(inicio, fin);

  mostrarLibros(paginaLibros);
  renderPaginacion();

  // Scroll suave arriba al cambiar página
  if (!omitirScroll) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


// ── MOSTRAR LIBROS EN LA PÁGINA ──
function mostrarLibros(lista) {
  const galeria = document.getElementById('galeria');
  const sinResultados = document.getElementById('sinResultados');
  const contador = document.getElementById('contador');

  actualizarSchemaSEO(lista);

  galeria.innerHTML = '';

  if (lista.length === 0) {
    sinResultados.style.display = 'block';
    contador.textContent = '';
    renderPaginacion();
    return;
  }

  sinResultados.style.display = 'none';

  // Contador con info de paginación
  const total = listaFiltrada.length;
  const inicio = (paginaActual - 1) * LIBROS_POR_PAGINA + 1;
  const fin = Math.min(paginaActual * LIBROS_POR_PAGINA, total);
  contador.textContent = `Mostrando ${inicio}–${fin} de ${total} libro${total !== 1 ? 's' : ''}`;

  const esDonador = esDonadorLocal();

  lista.forEach((libro, i) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.style.animationDelay = `${i * 0.03}s`;

    const claseGenero = obtenerClaseGenero(libro.genero);
    const tituloLimpio = limpiarTitulo(libro.titulo);

    const hasPdf = !!libro.archivo_pdf;
    const esFav = esFavorito(libro.id);
    tarjeta.innerHTML = `
      ${libro.portada 
        ? `<img src="${libro.portada}" alt="${tituloLimpio}" class="tarjeta-portada" loading="lazy" width="230" height="307" decoding="async" />` 
        : `<div class="tarjeta-portada tarjeta-portada-placeholder">
             <i data-lucide="book" class="icono-lg"></i>
           </div>`
      }
      <button class="tarjeta-fav-btn ${esFav ? 'favorito' : ''}" data-fav-id="${libro.id}" aria-label="${esFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
        <i data-lucide="heart"></i>
      </button>
      <div class="tarjeta-info" data-libro-id="${libro.id}" style="cursor:pointer">
        <span class="tarjeta-genero-badge ${claseGenero}">${libro.genero || 'General'}</span>
        ${(hasPdf && !esDonador) ? `<span class="badge-preview" aria-label="Vista previa gratuita de 15 páginas">📖 Vista previa · 15 págs.</span>` : ''}
        <div class="tarjeta-titulo">${tituloLimpio}</div>
        <div class="tarjeta-autor">${libro.autor || ''}</div>
        <div class="tarjeta-anio">${libro.anio || ''}</div>
        <div class="tarjeta-descripcion">${libro.descripcion || ''}</div>
      </div>
      ${hasPdf ?
        `<button class="btn-ver btn-leer-lector" style="cursor:pointer"><i data-lucide="book-open" class="icono-sm"></i> Leer</button>` :
        `<a href="${libro.pdf || '#'}" target="_blank" rel="noopener" class="btn-ver"><i data-lucide="file-text" class="icono-sm"></i> Ver documento</a>`
      }
    `;
    tarjeta.querySelector('.tarjeta-info').addEventListener('click', () => abrirDetalleLibro(libro.id));
    if (hasPdf) {
      tarjeta.querySelector('.btn-leer-lector').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirLector(libro.id, libro);
      });
    }
    tarjeta.querySelector('.tarjeta-fav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const nuevoEstado = toggleFavorito(libro.id);
      const btnFav = e.currentTarget;
      btnFav.classList.toggle('favorito', nuevoEstado);
      btnFav.setAttribute('aria-label', nuevoEstado ? 'Quitar de favoritos' : 'Añadir a favoritos');
      if (soloFavoritos) filtrar();
    });
    galeria.appendChild(tarjeta);
  });

  if (window.lucide) lucide.createIcons({ root: galeria });
}

// ── RENDERIZAR PAGINACIÓN ──
function renderPaginacion() {
  const contenedor = document.getElementById('paginacion');
  if (!contenedor) return;

  const totalPaginas = Math.ceil(listaFiltrada.length / LIBROS_POR_PAGINA);
  contenedor.innerHTML = '';

  if (totalPaginas <= 1) return;

  // Botón anterior
  const btnAnterior = document.createElement('button');
  btnAnterior.className = 'btn-pagina' + (paginaActual === 1 ? ' desactivado' : '');
  btnAnterior.textContent = '←';
  btnAnterior.setAttribute('aria-label', 'Página anterior');
  btnAnterior.addEventListener('click', () => { if (paginaActual > 1) mostrarPagina(paginaActual - 1); });
  contenedor.appendChild(btnAnterior);

  // Páginas numeradas con elipsis
  const paginas = paginasVisibles(paginaActual, totalPaginas);
  paginas.forEach(p => {
    if (p === '...') {
      const elipsis = document.createElement('span');
      elipsis.className = 'pagina-elipsis';
      elipsis.textContent = '…';
      elipsis.setAttribute('aria-hidden', 'true');
      contenedor.appendChild(elipsis);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn-pagina' + (p === paginaActual ? ' activo' : '');
      btn.textContent = p;
      btn.setAttribute('aria-label', `Página ${p}`);
      btn.addEventListener('click', () => mostrarPagina(p));
      contenedor.appendChild(btn);
    }
  });

  // Botón siguiente
  const btnSiguiente = document.createElement('button');
  btnSiguiente.className = 'btn-pagina' + (paginaActual === totalPaginas ? ' desactivado' : '');
  btnSiguiente.textContent = '→';
  btnSiguiente.setAttribute('aria-label', 'Página siguiente');
  btnSiguiente.addEventListener('click', () => { if (paginaActual < totalPaginas) mostrarPagina(paginaActual + 1); });
  contenedor.appendChild(btnSiguiente);
}

// ── CALCULAR PÁGINAS VISIBLES ──
function paginasVisibles(actual, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);

  if (actual <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (actual >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', actual-1, actual, actual+1, '...', total];
}

// ── NORMALIZAR TEXTO PARA BÚSQUEDA ──
const normalizar = texto => texto
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// ── ORDENAR LISTA ──
function shuffle(array) {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function ordenarLista(lista) {
  if (ordenActivo === 'default') {
    if (moodActivo !== 'Todos') {
      return shuffle(lista);
    }
    return lista;
  }

  const copia = [...lista];
  switch (ordenActivo) {
    case 'titulo-asc':
      copia.sort((a, b) => normalizar(a.titulo || '').localeCompare(normalizar(b.titulo || ''), 'es'));
      break;
    case 'titulo-desc':
      copia.sort((a, b) => normalizar(b.titulo || '').localeCompare(normalizar(a.titulo || ''), 'es'));
      break;
    case 'autor-asc':
      copia.sort((a, b) => normalizar(a.autor || '').localeCompare(normalizar(b.autor || ''), 'es'));
      break;
    case 'anio-asc':
      copia.sort((a, b) => (a.anio || 9999) - (b.anio || 9999));
      break;
    case 'anio-desc':
      copia.sort((a, b) => (b.anio || 0) - (a.anio || 0));
      break;
  }
  return copia;
}

// ── BÚSQUEDA ──
function filtrar() {
  const raw = document.getElementById('inputBusqueda').value;
  const terminos = normalizar(raw).split(' ').filter(t => t.length > 0);

  const librosDePartida = coleccionActiva 
    ? libros.filter(libro => coleccionActiva.libros.includes(libro.id))
    : libros;

  listaFiltrada = librosDePartida.filter(libro => {
    const campos = [
      normalizar(libro.titulo || ''),
      normalizar(libro.autor || ''),
      normalizar(libro.genero || ''),
      normalizar(libro.descripcion || ''),
      String(libro.anio || ''),
    ].join(' ');

    const coincideTexto = terminos.length === 0 || terminos.every(t => campos.includes(t));
    
    // Filtro de género más flexible
    let coincideGenero = true;
    if (generoActivo !== 'Todos') {
      const genLibro = normalizar(libro.genero || '');
      const genFiltro = normalizar(generoActivo);
      
      const partesFiltro = generoActivo.includes(' y ') 
        ? generoActivo.split(' y ').map(p => normalizar(p.trim()))
        : [genFiltro];
        
      coincideGenero = partesFiltro.some(p => genLibro.includes(p));
    }

    // Filtro por autor
    let coincideAutor = true;
    if (autorActivo !== 'Todos') {
      coincideAutor = libro.autor && libro.autor.trim() === autorActivo;
    }

    // Filtro por época
    let coincideEpoca = true;
    if (epocaActiva !== 'Todas') {
      const anio = parseInt(libro.anio, 10);
      if (isNaN(anio)) {
        coincideEpoca = false;
      } else {
        switch (epocaActiva) {
          case 'pre-1800': coincideEpoca = anio < 1800; break;
          case '1800-1899': coincideEpoca = anio >= 1800 && anio <= 1899; break;
          case '1900-1949': coincideEpoca = anio >= 1900 && anio <= 1949; break;
          case '1950-1999': coincideEpoca = anio >= 1950 && anio <= 1999; break;
          case '2000+': coincideEpoca = anio >= 2000; break;
        }
      }
    }

    // Filtro por estado de ánimo (Mood Tags)
    let coincideMood = true;
    if (moodActivo !== 'Todos') {
      const gen = libro.genero || '';
      switch (moodActivo) {
        case 'rapido':
          coincideMood = gen === 'Cuento';
          break;
        case 'reflexionar':
          coincideMood = gen === 'Filosofía' || gen === 'Ensayo';
          break;
        case 'escapar':
          coincideMood = gen === 'Ciencia Ficción' || gen === 'Fantasía' || gen === 'Novela juvenil';
          break;
        case 'aprender':
          coincideMood = gen === 'Divulgación Científica' || gen === 'Economía y Política';
          break;
        case 'intriga':
          coincideMood = gen === 'Terror' || gen === 'Misterio y Thriller' || gen === 'Novela negra';
          break;
      }
    }

    let coincideFavorito = true;
    if (soloFavoritos) {
      coincideFavorito = esFavorito(libro.id);
    }

    return coincideTexto && coincideGenero && coincideAutor && coincideEpoca && coincideMood && coincideFavorito;
  });

  // Aplicar ordenamiento
  listaFiltrada = ordenarLista(listaFiltrada);

  mostrarPagina(1, true);
  actualizarBreadcrumbs();

  // Refrescar visibilidad de secciones principales
  renderizarColecciones();
  renderizarDestacados();
}

// ── LIMPIAR BÚSQUEDA ──
function limpiarBusqueda() {
  const input = document.getElementById('inputBusqueda');
  const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (btnLimpiar) {
    btnLimpiar.style.display = 'none';
  }
  filtrar();
}

// ── FILTRO POR TAG DE GÉNERO ──
function filtrarGenero(genero, boton) {
  generoActivo = genero;
  
  // Desactivar mood tags al usar género tradicional
  moodActivo = 'Todos';
  document.querySelectorAll('.tag-mood-btn').forEach(b => {
    b.classList.remove('activo');
    b.setAttribute('aria-pressed', 'false');
  });

  // Actualizar clase activa en los tags normales
  document.querySelectorAll('.tag-genero:not(.tag-mood-btn)').forEach(b => b.classList.remove('activo'));
  if (boton) boton.classList.add('activo');
  
  // Hacer scroll al tag activo
  if (boton) {
    boton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
  
  filtrar();
}

// ── LIBRO AL AZAR ──
function libroAlAzar() {
  if (libros.length === 0) return;
  const libro = libros[Math.floor(Math.random() * libros.length)];
  abrirDetalleLibro(libro.id);
}

// ════════════════════════════════════════════════════════
// MODAL DE DETALLE DEL LIBRO
// ════════════════════════════════════════════════════════

function abrirDetalleLibro(id, omitirPush = false) {
  const libro = libros.find(l => l.id === id);
  if (!libro) return;

  const modal = document.getElementById('modalDetalle');
  if (!modal) return;

  const tituloLimpio = limpiarTitulo(libro.titulo);
  const claseGenero = obtenerClaseGenero(libro.genero);

  document.getElementById('detalle-titulo').textContent = tituloLimpio;

  // Autor como enlace clickeable que filtra
  const autorEl = document.getElementById('detalle-autor');
  autorEl.innerHTML = '';
  if (libro.autor) {
    const autorLink = document.createElement('button');
    autorLink.className = 'detalle-enlace';
    autorLink.textContent = libro.autor;
    autorLink.setAttribute('aria-label', `Filtrar por autor: ${libro.autor}`);
    autorLink.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarDetalle();
      const inputAutor = document.getElementById('inputDropdownAutor');
      if (inputAutor) inputAutor.value = libro.autor;
      document.querySelectorAll('#menuDropdownAutor .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
      const targetItem = Array.from(document.querySelectorAll('#menuDropdownAutor .dropdown-item')).find(li => li.dataset.valor === libro.autor);
      if (targetItem) targetItem.classList.add('seleccionado');
      const btnClear = document.getElementById('btnLimpiarAutor');
      if (btnClear) btnClear.style.display = 'flex';
      autorActivo = libro.autor;
      filtrar();
    });
    autorEl.appendChild(autorLink);
  } else {
    autorEl.textContent = 'Autor desconocido';
  }

  document.getElementById('detalle-anio').textContent = libro.anio ? `Publicado en ${libro.anio}` : '';
  document.getElementById('detalle-descripcion').textContent = libro.descripcion || 'Sin descripción disponible.';
  
  // Género como enlace clickeable que filtra
  const badge = document.getElementById('detalle-genero');
  badge.innerHTML = '';
  badge.className = `tarjeta-genero-badge ${claseGenero}`;
  const generoLink = document.createElement('button');
  generoLink.className = 'detalle-enlace-badge';
  generoLink.textContent = libro.genero || 'General';
  generoLink.setAttribute('aria-label', `Filtrar por género: ${libro.genero}`);
  generoLink.addEventListener('click', (e) => {
    e.stopPropagation();
    cerrarDetalle();
    const tagBtn = document.querySelector(`.tag-genero[data-genero="${libro.genero}"]`);
    filtrarGenero(libro.genero, tagBtn);
  });
  badge.appendChild(generoLink);

  const detallePortada = document.getElementById('detalle-portada');
  if (libro.portada && detallePortada) {
    detallePortada.src = libro.portada;
    detallePortada.alt = tituloLimpio;
    detallePortada.style.display = 'block';
  } else if (detallePortada) {
    detallePortada.style.display = 'none';
  }

  // Botón Leer libro → abre lector embebido
  const linkPdf = document.getElementById('detalle-pdf-link');
  const btnDescargar = document.getElementById('detalle-descargar-btn');

  if (libro.archivo_pdf) {
    linkPdf.style.display = 'flex';
    linkPdf.onclick = (e) => {
      e.preventDefault();
      cerrarDetalle();
      abrirLector(libro.id, libro);
    };
  } else {
    linkPdf.style.display = 'none';
  }

  // Botón de Favoritos en detalle
  const detalleFavBtn = document.getElementById('detalle-fav-btn');
  if (detalleFavBtn) {
    const esFav = esFavorito(libro.id);
    detalleFavBtn.classList.toggle('favorito', esFav);
    detalleFavBtn.setAttribute('aria-label', esFav ? 'Quitar de favoritos' : 'Añadir a favoritos');
    detalleFavBtn.onclick = (e) => {
      e.stopPropagation();
      const nuevoEstado = toggleFavorito(libro.id);
      detalleFavBtn.classList.toggle('favorito', nuevoEstado);
      detalleFavBtn.setAttribute('aria-label', nuevoEstado ? 'Quitar de favoritos' : 'Añadir a favoritos');
    };
  }

  // Mostrar botones de descarga solo si es donador
  const btnDescargarEpub = document.getElementById('detalle-descargar-epub-btn');
  if (btnDescargar) {
    if (esDonadorLocal() && libro.archivo_pdf) {
      btnDescargar.style.display = 'flex';
      btnDescargar.onclick = () => descargarArchivo(libro.id, 'pdf');
    } else {
      btnDescargar.style.display = 'none';
    }
  }
  if (btnDescargarEpub) {
    if (esDonadorLocal() && libro.archivo_epub) {
      btnDescargarEpub.style.display = 'flex';
      btnDescargarEpub.onclick = () => descargarArchivo(libro.id, 'epub');
    } else {
      btnDescargarEpub.style.display = 'none';
    }
  }

  // Libros relacionados (mismo género, excluyendo el actual)
  const relacionados = libros
    .filter(l => l.genero === libro.genero && l.id !== libro.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  const listaRelacionados = document.getElementById('detalle-relacionados');
  if (relacionados.length > 0) {
    listaRelacionados.innerHTML = '';
    relacionados.forEach(r => {
      const tLimpio = limpiarTitulo(r.titulo);
      const item = document.createElement('div');
      item.className = 'relacionado-item';
      item.innerHTML = `
        ${r.portada ? `<img src="${r.portada}" alt="${tLimpio}" class="relacionado-portada" loading="lazy" />` : ''}
        <div class="relacionado-titulo">${tLimpio}</div>
        <div class="relacionado-autor">${r.autor || ''}</div>
      `;
      item.addEventListener('click', () => abrirDetalleLibro(r.id));
      listaRelacionados.appendChild(item);
    });
    document.getElementById('detalle-relacionados-seccion').style.display = 'block';
  } else {
    document.getElementById('detalle-relacionados-seccion').style.display = 'none';
  }

  actualizarSchemaSEO([libro], true);

  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';

  ultimoElementoEnfocado = document.activeElement;
  const btnCerrar = modal.querySelector('.modal-cerrar');
  if (btnCerrar) setTimeout(() => btnCerrar.focus(), 50);

  if (!omitirPush) {
    history.pushState(null, '', '#/libro/' + id);
  }
}

function cerrarDetalle(omitirPush = false) {
  const modal = document.getElementById('modalDetalle');
  if (modal && modal.classList.contains('abierto')) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';
    
    if (ultimoElementoEnfocado) ultimoElementoEnfocado.focus();

    // Restaurar SEO al catálogo visible
    const inicio = (paginaActual - 1) * LIBROS_POR_PAGINA;
    const paginaLibros = listaFiltrada.slice(inicio, inicio + LIBROS_POR_PAGINA);
    actualizarSchemaSEO(paginaLibros);

    if (!omitirPush && window.location.hash) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }
}

// ── Abrir / Cerrar modal Acerca de / FAQ ──
function abrirModalInfo(tabActiva = 'acerca') {
  const modal = document.getElementById('modalInfo');
  if (!modal) return;
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  
  // Seleccionar la pestaña activa inicial
  activarPestañaInfo(tabActiva);
  
  ultimoElementoEnfocado = document.activeElement;
  const btnCerrar = modal.querySelector('.modal-cerrar');
  if (btnCerrar) setTimeout(() => btnCerrar.focus(), 50);
}

function cerrarModalInfo() {
  const modal = document.getElementById('modalInfo');
  if (modal) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';
    if (ultimoElementoEnfocado) ultimoElementoEnfocado.focus();
  }
}

// ── Abrir / Cerrar modal Contacto ──
function abrirModalContacto() {
  const modal = document.getElementById('modalContacto');
  if (!modal) return;
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  
  ultimoElementoEnfocado = document.activeElement;
  const btnCerrar = modal.querySelector('.modal-cerrar');
  if (btnCerrar) setTimeout(() => btnCerrar.focus(), 50);
}

function cerrarModalContacto() {
  const modal = document.getElementById('modalContacto');
  if (modal) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';
    if (ultimoElementoEnfocado) ultimoElementoEnfocado.focus();
  }
}

function activarPestañaInfo(tabName) {
  const btnAcerca = document.getElementById('tabAcerca');
  const btnFAQ = document.getElementById('tabFAQ');
  const contentAcerca = document.getElementById('infoContentAcerca');
  const contentFAQ = document.getElementById('infoContentFAQ');
  
  if (tabName === 'acerca') {
    btnAcerca?.classList.add('activo');
    btnFAQ?.classList.remove('activo');
    contentAcerca?.classList.add('activo');
    contentFAQ?.classList.remove('activo');
  } else {
    btnAcerca?.classList.remove('activo');
    btnFAQ?.classList.add('activo');
    contentAcerca?.classList.remove('activo');
    contentFAQ?.classList.add('activo');
  }
}

// ════════════════════════════════════════════════════════
// RECOMENDADOR IA
// ════════════════════════════════════════════════════════

// Estado interno de las selecciones
const iaSeleccion = { estado: null, tiempo: null, objetivo: null };

// ── Abrir / Cerrar modal ──
function abrirModalIA() {
  const modal = document.getElementById('modalIA');
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  ultimoElementoEnfocado = document.activeElement;
  volverAPreguntas();
  const btnCerrar = modal.querySelector('.modal-cerrar');
  if (btnCerrar) setTimeout(() => btnCerrar.focus(), 50);
}

function cerrarModalIA() {
  document.getElementById('modalIA').classList.remove('abierto');
  document.body.style.overflow = '';
  if (ultimoElementoEnfocado) ultimoElementoEnfocado.focus();
}


// ── Resetear el modal al estado de preguntas ──
function volverAPreguntas() {
  mostrarPaso('ia-preguntas');
  document.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
  document.getElementById('ia-tema').value = '';
  iaSeleccion.estado   = null;
  iaSeleccion.tiempo   = null;
  iaSeleccion.objetivo = null;

  // Limpiar validaciones previas si existen
  document.querySelectorAll('.opciones-grid').forEach(contenedor => {
    contenedor.classList.remove('campo-incompleto');
    const msg = contenedor.parentElement.querySelector('.validacion-msg');
    if (msg) msg.remove();
  });

  document.querySelector('#modalIA .modal-panel').scrollTop = 0;
}

// ── Mostrar uno de los pasos del modal ──
function mostrarPaso(idActivo) {
  ['ia-preguntas', 'ia-cargando', 'ia-resultados', 'ia-error'].forEach(id => {
    document.getElementById(id).style.display = (id === idActivo) ? 'flex' : 'none';
  });
}

// ── Pedir recomendación a la API ──
async function pedirRecomendacion() {
  const camposFaltantes = [];
  
  ['estado', 'tiempo', 'objetivo'].forEach(grupo => {
    const contenedor = document.getElementById(`opciones-${grupo}`);
    if (!contenedor) return;
    const mensajeExistente = contenedor.parentElement.querySelector('.validacion-msg');
    
    if (!iaSeleccion[grupo]) {
      camposFaltantes.push(grupo);
      contenedor.classList.add('campo-incompleto');
      
      // Agregar mensaje de validación si no existe
      if (!mensajeExistente) {
        const msg = document.createElement('span');
        msg.className = 'validacion-msg';
        msg.textContent = 'Selecciona una opción';
        contenedor.parentElement.appendChild(msg);
      }
      
      setTimeout(() => {
        contenedor.classList.remove('campo-incompleto');
        const msg = contenedor.parentElement.querySelector('.validacion-msg');
        if (msg) msg.remove();
      }, 3000);
    } else {
      if (mensajeExistente) mensajeExistente.remove();
      contenedor.classList.remove('campo-incompleto');
    }
  });

  if (camposFaltantes.length > 0) {
    // Scroll al primer campo incompleto
    const primerCampo = document.getElementById(`opciones-${camposFaltantes[0]}`);
    primerCampo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const tema = document.getElementById('ia-tema').value.trim();

  mostrarPaso('ia-cargando');
  document.querySelector('#modalIA .modal-panel').scrollTop = 0;

  try {
    const respuesta = await fetch('/api/recomendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado:   iaSeleccion.estado,
        tiempo:   iaSeleccion.tiempo,
        objetivo: iaSeleccion.objetivo,
        tema:     tema || null,
      }),
    });

    const datos = await respuesta.json();

    if (!respuesta.ok || !datos.recomendaciones) {
      throw new Error(datos.error || 'Respuesta inesperada del servidor');
    }

    renderizarResultados(datos.recomendaciones);

    if (!esDonadorLocal()) mostrarCTAEnResultadosIA();

  } catch (err) {
    console.error('Error al pedir recomendación:', err);
    document.getElementById('ia-error-msg').textContent =
      err.message || 'No se pudo obtener una recomendación. Intenta de nuevo.';
    mostrarPaso('ia-error');
  }
}

// ── Renderizar las 3 tarjetas recomendadas ──
function renderizarResultados(recomendaciones) {
  const lista = document.getElementById('resultados-lista');
  lista.innerHTML = '';

  const nums = ['I', 'II', 'III'];
  const esDonador = esDonadorLocal();

  recomendaciones.forEach((rec, i) => {
    const libro = libros.find(l => l.id === rec.id);
    if (!libro) return;

    const tituloLimpio = limpiarTitulo(libro.titulo);
    const hasPdf = !!libro.archivo_pdf;

    const tarjeta = document.createElement('div');
    tarjeta.className = 'resultado-tarjeta';
    tarjeta.innerHTML = `
      <div class="resultado-num">Recomendación ${nums[i] || i + 1}</div>
      <div class="resultado-titulo">${tituloLimpio}</div>
      <div class="resultado-autor">${libro.autor}${libro.anio ? ` · ${libro.anio}` : ''}</div>
      <div class="resultado-razon">${rec.razon}</div>
      ${(hasPdf && !esDonador) ? `<span class="badge-preview" aria-label="Vista previa gratuita de 15 páginas">📖 Vista previa · 15 págs.</span>` : ''}
      ${hasPdf ? `
        <button class="resultado-btn btn-leer-recomendado" style="cursor:pointer">
          <i data-lucide="book-open" class="icono-sm"></i> Leer
        </button>
      ` : `
        <a href="${libro.pdf || '#'}" target="_blank" rel="noopener" class="resultado-btn">
          <i data-lucide="file-text" class="icono-sm"></i> Abrir documento
        </a>
      `}
    `;

    if (hasPdf) {
      tarjeta.querySelector('.btn-leer-recomendado').addEventListener('click', () => {
        cerrarModalIA();
        abrirLector(libro.id, libro);
      });
    }

    lista.appendChild(tarjeta);
  });

  if (window.lucide) lucide.createIcons({ root: lista });
  
  mostrarPaso('ia-resultados');
  document.querySelector('#modalIA .modal-panel').scrollTop = 0;
}

function mostrarCTAEnResultadosIA() {
  const contenedor = document.getElementById('resultados-lista');
  if (!contenedor) return;
  const ctaEl = document.createElement('div');
  ctaEl.className = 'ia-resultado-cta';
  ctaEl.innerHTML = `
    <p>¿Te gustaron las recomendaciones? Lee estos libros completos y descárgalos en PDF y EPUB.</p>
    <a href="https://mpago.la/1Ek1HPz" target="_blank" rel="noopener" class="btn-comprar-ia">
      🛒 Desbloquear acceso completo — $100 MXN
    </a>
  `;
  contenedor.appendChild(ctaEl);
}

// ── BREADCRUMBS / FILTROS ACTIVOS ──
function actualizarBreadcrumbs() {
  const container = document.getElementById('breadcrumbs');
  if (!container) return;
  
  container.innerHTML = '';
  const items = [];
  
  const rawBusqueda = document.getElementById('inputBusqueda').value.trim();
  if (rawBusqueda) {
    items.push({ label: 'Búsqueda', value: rawBusqueda, type: 'texto' });
  }
  
  if (generoActivo !== 'Todos') {
    items.push({ label: 'Género', value: generoActivo, type: 'genero' });
  }

  if (moodActivo !== 'Todos') {
    let moodLabel = moodActivo;
    const moodObj = moodTagsData.find(m => m.valor === moodActivo);
    if (moodObj) moodLabel = moodObj.label;
    items.push({ label: 'Estilo', value: moodLabel, type: 'mood' });
  }
  
  if (autorActivo !== 'Todos') {
    items.push({ label: 'Autor', value: autorActivo, type: 'autor' });
  }
  
  if (epocaActiva !== 'Todas') {
    let epocaLabel = epocaActiva;
    if (epocaActiva === 'pre-1800') epocaLabel = 'Antes de 1800';
    if (epocaActiva === '2000+') epocaLabel = '2000 en adelante';
    items.push({ label: 'Época', value: epocaLabel, type: 'epoca' });
  }
  
  if (items.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  
  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'breadcrumb-item';
    el.innerHTML = `
      <span class="breadcrumb-label">${item.label}:</span>
      <span class="breadcrumb-value">${item.value}</span>
      <button class="breadcrumb-btn-remove" aria-label="Eliminar filtro">
        <i data-lucide="x" class="icono-sm"></i>
      </button>
    `;
    
    el.querySelector('.breadcrumb-btn-remove').onclick = () => {
      if (item.type === 'texto') limpiarBusqueda();
      if (item.type === 'genero') filtrarGenero('Todos', document.querySelector('.tag-genero[data-genero="Todos"]'));
      if (item.type === 'mood') {
        moodActivo = 'Todos';
        document.querySelectorAll('.tag-mood-btn').forEach(b => {
          b.classList.remove('activo');
          b.setAttribute('aria-pressed', 'false');
        });
        filtrar();
      }
      if (item.type === 'autor') {
        const inputAutor = document.getElementById('inputDropdownAutor');
        if (inputAutor) inputAutor.value = '';
        document.querySelectorAll('#menuDropdownAutor .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
        document.querySelector('#menuDropdownAutor .dropdown-item[data-valor="Todos"]')?.classList.add('seleccionado');
        const btnClear = document.getElementById('btnLimpiarAutor');
        if (btnClear) btnClear.style.display = 'none';
        autorActivo = 'Todos';
        filtrar();
      }
      if (item.type === 'epoca') {
        epocaActiva = 'Todas';
        actualizarDropdownEpocaUI();
        filtrar();
      }
    };
    
    container.appendChild(el);
  });
  
  const btnClearAll = document.createElement('button');
  btnClearAll.className = 'breadcrumb-clear-all';
  btnClearAll.textContent = 'Limpiar todos los filtros';
  btnClearAll.onclick = limpiarTodo;
  container.appendChild(btnClearAll);
  
  if (window.lucide) lucide.createIcons({ root: container });
}

// ════════════════════════════════════════════════════════
// SEO DINÁMICO (JSON-LD)
// ════════════════════════════════════════════════════════
function actualizarSchemaSEO(librosList, unicoLibro = false) {
  let scriptEl = document.getElementById('seo-schema');
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'seo-schema';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }

  if (unicoLibro && librosList.length === 1) {
    const libro = librosList[0];
    const schema = {
      "@context": "https://schema.org",
      "@type": "Book",
      "name": limpiarTitulo(libro.titulo),
      "author": {
        "@type": "Person",
        "name": libro.autor || "Autor Desconocido"
      },
      "url": window.location.origin + window.location.pathname + "#/libro/" + libro.id,
      "genre": libro.genero || "General",
      "datePublished": libro.anio ? String(libro.anio) : undefined,
      "description": libro.descripcion || undefined,
      "image": libro.portada || undefined
    };
    scriptEl.textContent = JSON.stringify(schema);
  } else if (librosList.length > 0) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": librosList.map((libro, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Book",
          "name": limpiarTitulo(libro.titulo),
          "author": {
            "@type": "Person",
            "name": libro.autor || "Autor Desconocido"
          },
          "url": window.location.origin + window.location.pathname + "#/libro/" + libro.id
        }
      }))
    };
    scriptEl.textContent = JSON.stringify(schema);
  } else {
    scriptEl.textContent = '';
  }
}

// ════════════════════════════════════════════════════════
// REGISTRAR TODOS LOS EVENT LISTENERS (cero onclick inline)
// ════════════════════════════════════════════════════════

function registrarEventos() {
  // Botones principales
  const el = (id) => document.getElementById(id);

  el('btnAbrirIA')?.addEventListener('click', abrirModalIA);
  el('btnAzar')?.addEventListener('click', libroAlAzar);
  el('btnLimpiarBusqueda')?.addEventListener('click', limpiarBusqueda);
  el('btnCerrarPack')?.addEventListener('click', quitarColeccion);
  el('btnBuscarClick')?.addEventListener('click', () => {
    const btn = document.getElementById('btnBuscarClick');
    btn?.classList.add('busqueda-ejecutada');
    filtrar();
    const galeria = document.getElementById('galeria');
    if (galeria) {
      galeria.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => btn?.classList.remove('busqueda-ejecutada'), 500);
  });
  el('btnLimpiarTodo')?.addEventListener('click', limpiarTodo);
  el('btnTema')?.addEventListener('click', alternarTema);

  // Toggle Favoritos
  el('btnFavoritos')?.addEventListener('click', () => {
    soloFavoritos = !soloFavoritos;
    const btn = el('btnFavoritos');
    btn.classList.toggle('activo', soloFavoritos);
    btn.setAttribute('aria-pressed', soloFavoritos ? 'true' : 'false');
    paginaActual = 1;
    filtrar();
  });

  // Botón volver arriba
  const btnScrollTop = el('btnScrollTop');
  if (btnScrollTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        btnScrollTop.classList.add('visible');
        btnScrollTop.style.display = 'flex';
      } else {
        btnScrollTop.classList.remove('visible');
        setTimeout(() => {
          if (!btnScrollTop.classList.contains('visible')) {
            btnScrollTop.style.display = 'none';
          }
        }, 300);
      }
    });
    btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Modal detalle
  el('btnCerrarDetalle')?.addEventListener('click', cerrarDetalle);
  el('modalDetalle')?.addEventListener('click', (e) => {
    if (e.target === el('modalDetalle')) cerrarDetalle();
  });

  // Modal IA — botones de cierre
  el('btnCerrarIA')?.addEventListener('click', cerrarModalIA);
  el('btnCancelarIA')?.addEventListener('click', cerrarModalIA);
  el('btnCerrarResultados')?.addEventListener('click', cerrarModalIA);
  el('modalIA')?.addEventListener('click', (e) => {
    if (e.target === el('modalIA')) cerrarModalIA();
  });

  // Modal Información (Acerca de / FAQ)
  el('btnAcercaDe')?.addEventListener('click', () => abrirModalInfo('acerca'));
  el('btnFAQ')?.addEventListener('click', () => abrirModalInfo('faq'));
  el('btnCerrarInfo')?.addEventListener('click', cerrarModalInfo);
  el('tabAcerca')?.addEventListener('click', () => activarPestañaInfo('acerca'));
  el('tabFAQ')?.addEventListener('click', () => activarPestañaInfo('faq'));
  el('modalInfo')?.addEventListener('click', (e) => {
    if (e.target === el('modalInfo')) cerrarModalInfo();
  });

  // Modal Contacto
  el('btnContacto')?.addEventListener('click', abrirModalContacto);
  el('btnCerrarContacto')?.addEventListener('click', cerrarModalContacto);
  el('modalContacto')?.addEventListener('click', (e) => {
    if (e.target === el('modalContacto')) cerrarModalContacto();
  });

  // Modal IA — acciones
  el('btnRecomendar')?.addEventListener('click', pedirRecomendacion);
  el('btnVolverIntentar')?.addEventListener('click', volverAPreguntas);
  el('btnVolverError')?.addEventListener('click', volverAPreguntas);

  // Botones de vista
  el('btnVistaGrid')?.addEventListener('click', () => cambiarVista('grid'));
  el('btnVistaLista')?.addEventListener('click', () => cambiarVista('lista'));

  // Botones de carrusel destacados
  el('btnCarruselIzq')?.addEventListener('click', () => {
    document.getElementById('destacados-galeria')?.scrollBy({ left: -320, behavior: 'smooth' });
  });
  el('btnCarruselDer')?.addEventListener('click', () => {
    document.getElementById('destacados-galeria')?.scrollBy({ left: 320, behavior: 'smooth' });
  });

  // Opciones de la IA (delegación por data-grupo)
  document.querySelectorAll('.opcion-btn[data-grupo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const grupo = btn.dataset.grupo;
      const contenedor = btn.closest('.opciones-grid');
      contenedor.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
      btn.classList.add('seleccionado');
      iaSeleccion[grupo] = btn.dataset.valor;

      // Limpiar validación si existía
      contenedor.classList.remove('campo-incompleto');
      const mensajeExistente = contenedor.parentElement.querySelector('.validacion-msg');
      if (mensajeExistente) mensajeExistente.remove();
    });
  });

  // Tecla Escape para cerrar modales y Tab para focus trap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalIA();
      cerrarDetalle();
      cerrarModalCodigo();
      cerrarModalInfo();
      return;
    }

    if (e.key === 'Tab') {
      const modalAbierto = document.querySelector('.modal-overlay.abierto');
      if (!modalAbierto) return;

      const focusable = Array.from(modalAbierto.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === document.body)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('hashchange', manejarRutaHash);
}

function manejarRutaHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#/libro/')) {
    const idStr = hash.replace('#/libro/', '');
    const id = parseInt(idStr, 10);
    if (!isNaN(id)) {
      abrirDetalleLibro(id, true);
    }
  } else {
    cerrarDetalle(true);
  }
}

// ════════════════════════════════════════════════════════
// MODO OSCURO
// ════════════════════════════════════════════════════════

function inicializarTema() {
  const guardado = localStorage.getItem('tema');
  if (guardado) {
    document.documentElement.setAttribute('data-theme', guardado);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  actualizarIconoTema();

  // Escuchar cambios del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('tema')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      actualizarIconoTema();
    }
  });
}

function alternarTema() {
  const actual = document.documentElement.getAttribute('data-theme');
  const nuevo = actual === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nuevo);
  localStorage.setItem('tema', nuevo);
  actualizarIconoTema();
}

function actualizarIconoTema() {
  const btn = document.getElementById('btnTema');
  if (!btn) return;
  const esDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = esDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
  if (window.lucide) lucide.createIcons({ root: btn });
}

// ── CAMBIAR VISTA (GRID/LISTA) ──
function cambiarVista(nuevaVista) {
  vistaActiva = nuevaVista;
  const galeria = document.getElementById('galeria');
  const btnGrid = document.getElementById('btnVistaGrid');
  const btnLista = document.getElementById('btnVistaLista');
  
  if (nuevaVista === 'lista') {
    galeria?.classList.add('vista-lista');
    btnLista?.classList.add('activo');
    btnGrid?.classList.remove('activo');
  } else {
    galeria?.classList.remove('vista-lista');
    btnGrid?.classList.add('activo');
    btnLista?.classList.remove('activo');
  }
  
  localStorage.setItem('biblioteca-vista', nuevaVista);
}

// ════════════════════════════════════════════════════════
// LIMPIAR TODO
// ════════════════════════════════════════════════════════

function limpiarTodo() {
  document.getElementById('inputBusqueda').value = '';
  document.getElementById('btnLimpiarBusqueda').style.display = 'none';
  
  // Limpiar panel de autocompletado
  const panel = document.getElementById('autocompletarPanel');
  if (panel) {
    panel.innerHTML = '';
    panel.style.display = 'none';
  }

  // Limpiar Autor custom
  const inputAutor = document.getElementById('inputDropdownAutor');
  if (inputAutor) inputAutor.value = '';
  document.querySelectorAll('#menuDropdownAutor .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
  document.querySelector('#menuDropdownAutor .dropdown-item[data-valor="Todos"]')?.classList.add('seleccionado');
  const btnLimpiarAutor = document.getElementById('btnLimpiarAutor');
  if (btnLimpiarAutor) btnLimpiarAutor.style.display = 'none';
  autorActivo = 'Todos';

  // Limpiar Época dropdown
  epocaActiva = 'Todas';
  actualizarDropdownEpocaUI();

  // Limpiar Orden custom
  document.querySelectorAll('#menuDropdownOrden .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
  document.querySelector('#menuDropdownOrden .dropdown-item[data-valor="default"]')?.classList.add('seleccionado');
  const labelOrden = document.getElementById('labelDropdownOrden');
  if (labelOrden) labelOrden.textContent = 'Ordenar por…';
  ordenActivo = 'default';

  // Limpiar Mood Tags
  moodActivo = 'Todos';
  document.querySelectorAll('.tag-mood-btn').forEach(b => {
    b.classList.remove('activo');
    b.setAttribute('aria-pressed', 'false');
  });

  // Desactivar filtro de favoritos
  soloFavoritos = false;
  const btnFav = document.getElementById('btnFavoritos');
  if (btnFav) {
    btnFav.classList.remove('activo');
    btnFav.setAttribute('aria-pressed', 'false');
  }

  // Limpiar colección
  coleccionActiva = null;
  const titulo = document.getElementById('catalogoTitulo');
  const btnCerrar = document.getElementById('btnCerrarPack');
  if (titulo) titulo.textContent = 'Catálogo Completo';
  if (btnCerrar) btnCerrar.style.display = 'none';

  filtrarGenero('Todos', document.querySelector('.tag-genero[data-genero="Todos"]'));
}

// ── CUSTOM LOGIC FOR REDESIGNED CONTROLS ──

function filtrarMood(mood, boton) {
  if (moodActivo === mood) {
    moodActivo = 'Todos';
    boton.classList.remove('activo');
    boton.setAttribute('aria-pressed', 'false');
  } else {
    moodActivo = mood;
    document.querySelectorAll('.tag-mood-btn').forEach(b => {
      b.classList.remove('activo');
      b.setAttribute('aria-pressed', 'false');
    });
    boton.classList.add('activo');
    boton.setAttribute('aria-pressed', 'true');
    
    // Resetear género convencional al usar mood
    generoActivo = 'Todos';
    document.querySelectorAll('.tag-genero:not(.tag-mood-btn)').forEach(b => b.classList.remove('activo'));
    document.querySelector('.tag-genero[data-genero="Todos"]')?.classList.add('activo');
  }
  filtrar();
}

function inicializarAutocompletado() {
  const inputBusqueda = document.getElementById('inputBusqueda');
  const panel = document.getElementById('autocompletarPanel');
  if (!inputBusqueda || !panel) return;

  let indiceAutocompletar = -1;

  function actualizarItemActivo(items) {
    items.forEach((item, i) => {
      if (i === indiceAutocompletar) {
        item.classList.add('autocompletar-activo');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('autocompletar-activo');
      }
    });
  }

  inputBusqueda.addEventListener('input', () => {
    indiceAutocompletar = -1;
    const raw = inputBusqueda.value;
    if (raw.trim().length === 0) {
      panel.innerHTML = '';
      panel.style.display = 'none';
      return;
    }

    const terminos = normalizar(raw).split(' ').filter(t => t.length > 0);
    if (terminos.length === 0) {
      panel.innerHTML = '';
      panel.style.display = 'none';
      return;
    }
    
    const coincidencias = libros.filter(libro => {
      const tituloNorm = normalizar(libro.titulo || '');
      const autorNorm = normalizar(libro.autor || '');
      return terminos.every(t => tituloNorm.includes(t) || autorNorm.includes(t));
    }).slice(0, 5);

    if (coincidencias.length === 0) {
      panel.innerHTML = '<div class="autocompletar-item vacio">No hay resultados rápidos</div>';
      panel.style.display = 'block';
      return;
    }

    panel.innerHTML = '';
    coincidencias.forEach(libro => {
      const item = document.createElement('div');
      item.className = 'autocompletar-item';
      
      let tituloResaltado = limpiarTitulo(libro.titulo);
      terminos.forEach(t => {
        const regex = new RegExp(`(${t})`, 'gi');
        tituloResaltado = tituloResaltado.replace(regex, '<strong>$1</strong>');
      });

      item.innerHTML = `
        ${libro.portada ? `<img src="${libro.portada}" alt="" class="autocompletar-portada" />` : '<div class="autocompletar-portada-vacia">📚</div>'}
        <div class="autocompletar-info">
          <div class="autocompletar-titulo">${tituloResaltado}</div>
          <div class="autocompletar-autor">${libro.autor || ''}</div>
        </div>
        <span class="autocompletar-genero">${libro.genero || 'General'}</span>
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirDetalleLibro(libro.id);
        panel.style.display = 'none';
        inputBusqueda.value = '';
        document.getElementById('btnLimpiarBusqueda').style.display = 'none';
        indiceAutocompletar = -1;
      });

      panel.appendChild(item);
    });

    panel.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!inputBusqueda.contains(e.target) && !panel.contains(e.target)) {
      panel.style.display = 'none';
    }
  });

  inputBusqueda.addEventListener('keydown', (e) => {
    const items = panel.querySelectorAll('.autocompletar-item:not(.vacio)');
    if (panel.style.display === 'none' || items.length === 0) {
      if (e.key === 'Escape') panel.style.display = 'none';
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      indiceAutocompletar = Math.min(indiceAutocompletar + 1, items.length - 1);
      actualizarItemActivo(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      indiceAutocompletar = Math.max(indiceAutocompletar - 1, -1);
      actualizarItemActivo(items);
    } else if (e.key === 'Enter') {
      if (indiceAutocompletar >= 0) {
        e.preventDefault();
        e.stopPropagation();
        items[indiceAutocompletar]?.click();
        indiceAutocompletar = -1;
      } else {
        panel.style.display = 'none';
      }
    } else if (e.key === 'Escape') {
      panel.style.display = 'none';
      indiceAutocompletar = -1;
    }
  });
}

function inicializarDropdowns() {
  // Dropdown Orden
  const dropdownOrden = document.getElementById('dropdownOrden');
  const btnOrden = document.getElementById('btnDropdownOrden');
  const menuOrden = document.getElementById('menuDropdownOrden');
  const labelOrden = document.getElementById('labelDropdownOrden');

  if (btnOrden && menuOrden) {
    btnOrden.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarTodosDropdowns(dropdownOrden);
      dropdownOrden.classList.toggle('abierto');
      const abierto = dropdownOrden.classList.contains('abierto');
      btnOrden.setAttribute('aria-expanded', abierto);
    });

    menuOrden.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        menuOrden.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
        item.classList.add('seleccionado');
        ordenActivo = item.dataset.valor;
        if (labelOrden) labelOrden.textContent = item.textContent;
        dropdownOrden.classList.remove('abierto');
        btnOrden.setAttribute('aria-expanded', 'false');
        filtrar();
      });
    });
  }

  // Dropdown Autor
  const dropdownAutor = document.getElementById('dropdownAutor');
  const inputAutor = document.getElementById('inputDropdownAutor');
  const menuAutor = document.getElementById('menuDropdownAutor');
  const btnLimpiarAutor = document.getElementById('btnLimpiarAutor');

  if (inputAutor && menuAutor) {
    inputAutor.addEventListener('focus', (e) => {
      e.stopPropagation();
      cerrarTodosDropdowns(dropdownAutor);
      dropdownAutor.classList.add('abierto');
    });

    inputAutor.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    inputAutor.addEventListener('input', () => {
      dropdownAutor.classList.add('abierto');
      const query = normalizar(inputAutor.value);
      
      if (inputAutor.value.trim().length > 0) {
        btnLimpiarAutor.style.display = 'flex';
      } else {
        btnLimpiarAutor.style.display = 'none';
      }

      menuAutor.querySelectorAll('.dropdown-item').forEach(item => {
        if (item.dataset.valor === 'Todos') {
          item.style.display = 'block';
          return;
        }
        const autorNorm = normalizar(item.dataset.valor);
        if (autorNorm.includes(query)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });

    btnLimpiarAutor.addEventListener('click', (e) => {
      e.stopPropagation();
      inputAutor.value = '';
      btnLimpiarAutor.style.display = 'none';
      menuAutor.querySelectorAll('.dropdown-item').forEach(item => {
        item.style.display = 'block';
        item.classList.remove('seleccionado');
      });
      menuAutor.querySelector('.dropdown-item[data-valor="Todos"]')?.classList.add('seleccionado');
      autorActivo = 'Todos';
      dropdownAutor.classList.remove('abierto');
      filtrar();
    });
  }

  // Dropdown Época
  const dropdownEpoca = document.getElementById('dropdownEpoca');
  const btnEpoca = document.getElementById('btnDropdownEpoca');
  const menuEpoca = document.getElementById('menuDropdownEpoca');
  const labelEpoca = document.getElementById('labelDropdownEpoca');

  if (btnEpoca && menuEpoca) {
    btnEpoca.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarTodosDropdowns(dropdownEpoca);
      dropdownEpoca.classList.toggle('abierto');
      const abierto = dropdownEpoca.classList.contains('abierto');
      btnEpoca.setAttribute('aria-expanded', abierto);
    });

    menuEpoca.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        menuEpoca.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
        item.classList.add('seleccionado');
        epocaActiva = item.dataset.valor;
        if (labelEpoca) {
          const labelText = item.childNodes[0].textContent.trim();
          labelEpoca.textContent = labelText;
        }
        dropdownEpoca.classList.remove('abierto');
        btnEpoca.setAttribute('aria-expanded', 'false');
        filtrar();
      });
    });
  }

  document.addEventListener('click', () => {
    cerrarTodosDropdowns();
  });
}

function cerrarTodosDropdowns(excepto = null) {
  document.querySelectorAll('.custom-dropdown').forEach(d => {
    if (d !== excepto) {
      d.classList.remove('abierto');
      const btn = d.querySelector('.dropdown-btn') || d.querySelector('.dropdown-input');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function actualizarDropdownEpocaUI() {
  const menuEpoca = document.getElementById('menuDropdownEpoca');
  const labelEpoca = document.getElementById('labelDropdownEpoca');
  if (menuEpoca && labelEpoca) {
    menuEpoca.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
    const targetItem = menuEpoca.querySelector(`.dropdown-item[data-valor="${epocaActiva}"]`);
    if (targetItem) {
      targetItem.classList.add('seleccionado');
      const labelText = targetItem.childNodes[0].textContent.trim();
      labelEpoca.textContent = labelText;
    }
  }
}

function poblarDropdownAutores() {
  const menuAutor = document.getElementById('menuDropdownAutor');
  const inputAutor = document.getElementById('inputDropdownAutor');
  const btnLimpiarAutor = document.getElementById('btnLimpiarAutor');
  const dropdownAutor = document.getElementById('dropdownAutor');
  if (!menuAutor || !inputAutor) return;

  const autoresSet = new Set();
  libros.forEach(l => {
    if (l.autor && l.autor.trim() !== '') autoresSet.add(l.autor.trim());
  });

  const autoresOrdenados = Array.from(autoresSet).sort((a, b) => a.localeCompare(b, 'es'));

  menuAutor.innerHTML = '<li data-valor="Todos" class="dropdown-item seleccionado" role="option">Todos los autores</li>';

  autoresOrdenados.forEach(autor => {
    const li = document.createElement('li');
    li.className = 'dropdown-item';
    li.dataset.valor = autor;
    li.role = 'option';
    li.textContent = autor;
    
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      menuAutor.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
      li.classList.add('seleccionado');
      autorActivo = autor;
      inputAutor.value = autor;
      if (btnLimpiarAutor) btnLimpiarAutor.style.display = 'flex';
      dropdownAutor.classList.remove('abierto');
      filtrar();
    });

    menuAutor.appendChild(li);
  });

  menuAutor.querySelector('.dropdown-item[data-valor="Todos"]').addEventListener('click', (e) => {
    e.stopPropagation();
    menuAutor.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
    menuAutor.querySelector('.dropdown-item[data-valor="Todos"]').classList.add('seleccionado');
    autorActivo = 'Todos';
    inputAutor.value = '';
    if (btnLimpiarAutor) btnLimpiarAutor.style.display = 'none';
    dropdownAutor.classList.remove('abierto');
    filtrar();
  });
}

// ════════════════════════════════════════════════════════
// SISTEMA DE DONADORES — COOKIE LOCAL
// ════════════════════════════════════════════════════════

/**
 * Comprueba si la cookie donor_token está presente en el navegador.
 * La validez real se verifica en el servidor; aquí solo decidimos si
 * mostrar la UI de donador sin hacer un fetch adicional.
 */
function esDonadorLocal() {
  return localStorage.getItem('esDonador') === 'true';
}

/**
 * Descarga un archivo (PDF o EPUB) llamando a /api/leer?id=X&descargar=true&formato=pdf|epub
 * Solo funciona si la cookie donor_token está presente (el servidor la verifica).
 */
async function descargarArchivo(libroId, formato = 'pdf') {
  try {
    const resp = await fetch(`/api/leer?id=${encodeURIComponent(libroId)}&descargar=true&formato=${formato}`);
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      alert(data.error || 'No se pudo generar el enlace de descarga.');
      return;
    }
    const { url } = await resp.json();
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error(`[descargarArchivo] ${formato}`, err);
    alert(`Error de red al intentar descargar el ${formato.toUpperCase()}.`);
  }
}

// ════════════════════════════════════════════════════════
// MODAL: CÓDIGO DE DONADOR
// ════════════════════════════════════════════════════════

// Callback opcional que se llama cuando el código se valida con éxito.
let _callbackCodigoValidado = null;

function abrirModalCodigo(callbackAlValidar) {
  _callbackCodigoValidado = callbackAlValidar || null;
  const modal = document.getElementById('modalCodigo');
  const input = document.getElementById('inputCodigoDonador');
  const msg = document.getElementById('codigoMensaje');
  if (modal) {
    modal.classList.add('abierto');
    document.body.style.overflow = 'hidden';
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    if (input) { input.value = ''; setTimeout(() => input.focus(), 80); }
    lucide.createIcons();
  }
}

function cerrarModalCodigo() {
  const modal = document.getElementById('modalCodigo');
  if (modal) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';
  }
}

async function validarCodigo() {
  const input = document.getElementById('inputCodigoDonador');
  const btn = document.getElementById('btnValidarCodigo');
  const msg = document.getElementById('codigoMensaje');
  const codigo = input ? input.value.trim() : '';

  if (!codigo) {
    mostrarMensajeCodigo('Escribe tu código de acceso.', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verificando…';

  try {
    const resp = await fetch('/api/validar-codigo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    });
    const data = await resp.json();

    if (resp.ok && data.valido) {
      localStorage.setItem('esDonador', 'true');
      mostrarMensajeCodigo(`✅ ¡Acceso activado! Tienes acceso completo en ${data.dispositivos}/${data.limite} dispositivos.`, 'exito');
      // Actualizar botón de código en el hero
      actualizarBtnCodigo(true);
      setTimeout(() => {
        cerrarModalCodigo();
        if (typeof _callbackCodigoValidado === 'function') {
          _callbackCodigoValidado();
        }
      }, 1800);
    } else {
      mostrarMensajeCodigo(data.error || 'Código inválido.', 'error');
    }
  } catch (err) {
    console.error('[validarCodigo]', err);
    mostrarMensajeCodigo('Error de conexión. Inténtalo de nuevo.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="check"></i> Verificar código';
    lucide.createIcons();
  }
}

function mostrarMensajeCodigo(texto, tipo) {
  const msg = document.getElementById('codigoMensaje');
  if (!msg) return;
  msg.textContent = texto;
  msg.className = `codigo-mensaje ${tipo}`;
  msg.style.display = 'block';
}

function actualizarBtnCodigo(esDonador) {
  const btn = document.getElementById('btnCodigo');
  const etiqueta = document.getElementById('etiquetaCodigo');
  if (!btn) return;
  if (esDonador) {
    btn.classList.add('activo');
    if (etiqueta) etiqueta.textContent = '✓ Activo';
  } else {
    btn.classList.remove('activo');
    if (etiqueta) etiqueta.textContent = 'Activar Acceso';
  }
}

function inicializarModalCodigo() {
  // Botón en el hero
  const btnHero = document.getElementById('btnCodigo');
  if (btnHero) {
    btnHero.addEventListener('click', () => abrirModalCodigo());
  }

  // Botones del modal
  const btnCerrar = document.getElementById('btnCerrarCodigo');
  const btnCancelar = document.getElementById('btnCancelarCodigo');
  const btnValidar = document.getElementById('btnValidarCodigo');
  const inputCodigo = document.getElementById('inputCodigoDonador');
  const overlay = document.getElementById('modalCodigo');

  if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalCodigo);
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalCodigo);
  if (btnValidar) btnValidar.addEventListener('click', validarCodigo);
  if (inputCodigo) {
    inputCodigo.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') validarCodigo();
    });
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarModalCodigo();
    });
  }

  // Reflejar estado actual en el botón del hero
  actualizarBtnCodigo(esDonadorLocal());
}

// ════════════════════════════════════════════════════════
// LECTOR DE PDF EMBEBIDO (PDF.js)
// ════════════════════════════════════════════════════════

const PREVIEW_LIMIT = 15; // Páginas gratuitas

let lectorEstado = {
  pdf: null,         // Objeto PDFDocumentProxy
  pagina: 1,
  totalPaginas: 0,
  escala: 1.0,
  renderTask: null,  // Tarea de render en curso
  libroId: null,
  esDonador: false,
};

let _pdfjsLibCache = null;

/**
 * Carga PDF.js dinámicamente con caché de módulo ESM.
 * Solo se importa la primera vez que un usuario abre un libro.
 */
async function cargarPDFJS() {
  if (_pdfjsLibCache) return _pdfjsLibCache;
  _pdfjsLibCache = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
  _pdfjsLibCache.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';
  return _pdfjsLibCache;
}

/**
 * Abre el lector embebido para el libro dado.
 * Solicita la URL firmada a /api/leer y renderiza con PDF.js.
 */
async function abrirLector(libroId, libro) {
  const modal = document.getElementById('modalLector');
  const canvas = document.getElementById('lectorCanvas');
  const cargando = document.getElementById('lectorCargando');
  const bloqueo = document.getElementById('lectorBloqueo');
  const titulo = document.getElementById('lectorTituloTexto');
  const btnDescarga = document.getElementById('lectorBtnDescarga');
  const btnDescargaEpub = document.getElementById('lectorBtnDescargaEpub');

  if (!modal || !canvas) return;

  // Resetear estado
  lectorEstado.libroId = libroId;
  lectorEstado.pagina = 1;
  lectorEstado.pdf = null;
  lectorEstado.esDonador = esDonadorLocal();

  if (titulo) titulo.textContent = `${libro.titulo}${libro.autor ? ' — ' + libro.autor : ''}`;
  if (bloqueo) bloqueo.style.display = 'none';
  if (cargando) cargando.style.display = 'flex';
  if (canvas) canvas.style.display = 'none';
  
  if (btnDescarga) {
    btnDescarga.style.display = (lectorEstado.esDonador && libro.archivo_pdf) ? 'flex' : 'none';
  }
  if (btnDescargaEpub) {
    btnDescargaEpub.style.display = (lectorEstado.esDonador && libro.archivo_epub) ? 'flex' : 'none';
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  lucide.createIcons();

  try {
    // 1. Obtener URL firmada del servidor
    const resp = await fetch(`/api/leer?id=${encodeURIComponent(libroId)}`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      alert(err.error || 'No se pudo cargar el libro. Inténtalo de nuevo.');
      cerrarLector();
      return;
    }
    const { url } = await resp.json();

    // 2. Cargar PDF con PDF.js (lazy, solo la primera vez)
    const pdfjsLib = await cargarPDFJS();

    const pdfDoc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
    lectorEstado.pdf = pdfDoc;
    lectorEstado.totalPaginas = pdfDoc.numPages;

    actualizarInfoPagina();

    if (cargando) cargando.style.display = 'none';
    if (canvas) canvas.style.display = 'block';

    // Calcular escala inicial para ajustar al ancho del contenedor
    await calcularEscalaFit();
    await renderizarPagina(lectorEstado.pagina);

  } catch (error) {
    console.error('[abrirLector]', error);
    if (cargando) cargando.style.display = 'none';
    alert('Error al cargar el PDF. Verifica tu conexión o inténtalo más tarde.');
    cerrarLector();
  }
}

/**
 * Calcula la escala para que la página se ajuste al ancho del contenedor.
 */
async function calcularEscalaFit() {
  if (!lectorEstado.pdf) return;
  const page = await lectorEstado.pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const container = document.getElementById('lectorContainer');
  if (!container) return;
  const containerWidth = container.clientWidth - 32; // 2x padding
  lectorEstado.escala = Math.max(0.5, containerWidth / viewport.width);
}

/**
 * Renderiza la página especificada en el canvas.
 */
async function renderizarPagina(numeroPagina) {
  if (!lectorEstado.pdf) return;

  const bloqueo = document.getElementById('lectorBloqueo');

  // Verificar límite de páginas
  if (!lectorEstado.esDonador && numeroPagina > PREVIEW_LIMIT) {
    if (bloqueo) bloqueo.style.display = 'flex';
    return;
  }
  if (bloqueo) bloqueo.style.display = 'none';

  // Cancelar render previo si está en curso
  if (lectorEstado.renderTask) {
    try { lectorEstado.renderTask.cancel(); } catch (_) {}
  }

  const canvas = document.getElementById('lectorCanvas');
  if (!canvas) return;

  const page = await lectorEstado.pdf.getPage(numeroPagina);
  
  // Soporte para pantallas de alta densidad (Retina, dispositivos móviles) para evitar textos pixelados
  const dpr = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: lectorEstado.escala * dpr });

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width / dpr}px`;
  canvas.style.height = `${viewport.height / dpr}px`;

  const ctx = canvas.getContext('2d');
  lectorEstado.renderTask = page.render({ canvasContext: ctx, viewport });

  try {
    await lectorEstado.renderTask.promise;
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error('[renderizarPagina]', err);
    }
  }

  actualizarBotonesNavegacion();
}

function actualizarInfoPagina() {
  const pagActual = document.getElementById('lectorPagActual');
  const pagTotal = document.getElementById('lectorPagTotal');
  const inputPag = document.getElementById('inputLectorPag');

  if (lectorEstado.esDonador) {
    if (pagActual) pagActual.style.display = 'none';
    if (inputPag) {
      inputPag.style.display = 'inline-block';
      inputPag.value = lectorEstado.pagina;
    }
  } else {
    if (pagActual) {
      pagActual.style.display = 'inline';
      pagActual.textContent = lectorEstado.pagina;
    }
    if (inputPag) inputPag.style.display = 'none';
  }

  if (pagTotal) pagTotal.textContent = lectorEstado.totalPaginas;
}

function actualizarBotonesNavegacion() {
  actualizarInfoPagina();
  const btnPrev = document.getElementById('lectorBtnPrev');
  const btnNext = document.getElementById('lectorBtnNext');
  if (btnPrev) btnPrev.disabled = lectorEstado.pagina <= 1;
  if (btnNext) btnNext.disabled = lectorEstado.pagina >= lectorEstado.totalPaginas;
}

async function irPaginaAnterior() {
  if (lectorEstado.pagina > 1) {
    lectorEstado.pagina--;
    await renderizarPagina(lectorEstado.pagina);
  }
}

async function irPaginaSiguiente() {
  if (!lectorEstado.esDonador && lectorEstado.pagina >= PREVIEW_LIMIT) {
    const bloqueo = document.getElementById('lectorBloqueo');
    if (bloqueo) bloqueo.style.display = 'flex';
    return;
  }
  if (lectorEstado.pagina < lectorEstado.totalPaginas) {
    lectorEstado.pagina++;
    await renderizarPagina(lectorEstado.pagina);
  }
}

async function aplicarZoom(factor) {
  lectorEstado.escala = Math.min(4, Math.max(0.3, lectorEstado.escala * factor));
  await renderizarPagina(lectorEstado.pagina);
}

async function ajustarAlAncho() {
  await calcularEscalaFit();
  await renderizarPagina(lectorEstado.pagina);
}

function cerrarLector() {
  const modal = document.getElementById('modalLector');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  if (lectorEstado.renderTask) {
    try { lectorEstado.renderTask.cancel(); } catch (_) {}
  }
  lectorEstado.pdf = null;
  lectorEstado.pagina = 1;
}

function inicializarLector() {
  const btnPrev = document.getElementById('lectorBtnPrev');
  const btnNext = document.getElementById('lectorBtnNext');
  const btnZoomIn = document.getElementById('lectorBtnZoomIn');
  const btnZoomOut = document.getElementById('lectorBtnZoomOut');
  const btnFit = document.getElementById('lectorBtnFit');
  const btnCerrar = document.getElementById('lectorBtnCerrar');
  const btnDescarga = document.getElementById('lectorBtnDescarga');
  const btnDescargaEpub = document.getElementById('lectorBtnDescargaEpub');
  const btnIngresarCodigo = document.getElementById('lectorBtnIngresarCodigo');
  const inputPag = document.getElementById('inputLectorPag');

  const btnCerrarBloqueo = document.getElementById('btnCerrarBloqueo');

  if (btnPrev) btnPrev.addEventListener('click', irPaginaAnterior);
  if (btnNext) btnNext.addEventListener('click', irPaginaSiguiente);

  if (inputPag) {
    const irAPaginaIngresada = async () => {
      let val = parseInt(inputPag.value, 10);
      if (isNaN(val) || val < 1 || val > lectorEstado.totalPaginas) {
        inputPag.value = lectorEstado.pagina;
        return;
      }
      lectorEstado.pagina = val;
      await renderizarPagina(lectorEstado.pagina);
    };

    inputPag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        irAPaginaIngresada();
        inputPag.blur();
      }
    });

    inputPag.addEventListener('blur', irAPaginaIngresada);
  }
  if (btnZoomIn) btnZoomIn.addEventListener('click', () => aplicarZoom(1.25));
  if (btnZoomOut) btnZoomOut.addEventListener('click', () => aplicarZoom(0.8));
  if (btnFit) btnFit.addEventListener('click', ajustarAlAncho);
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarLector);
  if (btnCerrarBloqueo) {
    btnCerrarBloqueo.addEventListener('click', () => {
      const bloqueo = document.getElementById('lectorBloqueo');
      if (bloqueo) bloqueo.style.display = 'none';
    });
  }

  if (btnDescarga) {
    btnDescarga.addEventListener('click', () => {
      if (lectorEstado.libroId) descargarArchivo(lectorEstado.libroId, 'pdf');
    });
  }

  if (btnDescargaEpub) {
    btnDescargaEpub.addEventListener('click', () => {
      if (lectorEstado.libroId) descargarArchivo(lectorEstado.libroId, 'epub');
    });
  }

  if (btnIngresarCodigo) {
    btnIngresarCodigo.addEventListener('click', () => {
      abrirModalCodigo(async () => {
        // Tras validar el código, actualizar estado del lector y re-renderizar
        lectorEstado.esDonador = true;
        
        // Obtener el libro actual para saber si tiene epub/pdf
        const libroActual = libros.find(l => l.id === lectorEstado.libroId);
        
        const btnDesc = document.getElementById('lectorBtnDescarga');
        if (btnDesc) {
          btnDesc.style.display = (libroActual && libroActual.archivo_pdf) ? 'flex' : 'none';
        }
        
        const btnDescEp = document.getElementById('lectorBtnDescargaEpub');
        if (btnDescEp) {
          btnDescEp.style.display = (libroActual && libroActual.archivo_epub) ? 'flex' : 'none';
        }

        const bloqueo = document.getElementById('lectorBloqueo');
        if (bloqueo) bloqueo.style.display = 'none';
        await renderizarPagina(lectorEstado.pagina);
        lucide.createIcons();
      });
    });
  }

  // Navegación con teclado cuando el lector está abierto
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('modalLector');
    if (!modal || modal.style.display === 'none') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') irPaginaSiguiente();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') irPaginaAnterior();
    if (e.key === 'Escape') cerrarLector();
  });

  // Soporte de gestos táctiles (swipe) para cambiar página en móvil
  function inicializarGestosTactiles() {
    const container = document.getElementById('lectorContainer');
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let distX = 0;
    let distY = 0;
    
    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      distX = 0;
      distY = 0;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      distX = e.touches[0].clientX - startX;
      distY = e.touches[0].clientY - startY;
    }, { passive: true });

    container.addEventListener('touchend', () => {
      const modal = document.getElementById('modalLector');
      if (!modal || modal.style.display === 'none') return;
      
      const umbral = 60; // Mínimo de pixeles horizontales para considerarlo swipe
      const maxDesviacionVertical = 45; // Para evitar cambiar página durante el scroll vertical
      
      if (Math.abs(distX) > umbral && Math.abs(distY) < maxDesviacionVertical) {
        if (distX < 0) {
          irPaginaSiguiente();
        } else {
          irPaginaAnterior();
        }
      }
      distX = 0;
      distY = 0;
    }, { passive: true });
  }

  inicializarGestosTactiles();
}

// ════════════════════════════════════════════════════════
// INICIALIZACIÓN COMPLETA DEL SISTEMA
// ════════════════════════════════════════════════════════
// Llama a estos inits desde DOMContentLoaded (ya se llama registrarEventos() allí)
document.addEventListener('DOMContentLoaded', () => {
  inicializarModalCodigo();
  inicializarLector();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
