// ── CONFIGURACIÓN DE LIBROS DESTACADOS ──
// Puedes actualizar manualmente los IDs de esta lista (por ejemplo, cada semana)
// según los libros más populares de Amazon u otra fuente de tu preferencia.
const LIBROS_DESTACADOS_IDS = [
  1581, // Carrie - Stephen King (#1)
  2835, // El poder del ahora
  2300, // La Sombra del Viento
  2079, // 1984
  1139, // Cien anos de soledad
  2828, // El monje que vendio su Ferrari
  1140, // El amor en los tiempos del colera
  2241, // Tormenta de espadas ed ilustrada
  2852, // Voces de Chernóbil
  1963, // After Dark
  14 // La divina comedia
];

// ── VARIABLES GLOBALES ──
let libros = [];
let colecciones = [];
let coleccionActiva = null;
let generoActivo = 'Todos';
let paginaActual = 1;
const LIBROS_POR_PAGINA = 24;
let listaFiltrada = [];
let ordenActivo = 'default'; // default | mas-leidos | titulo-asc | titulo-desc | autor-asc | anio-asc | anio-desc
let autorActivo = 'Todos';
let epocaActiva = 'Todas';
let ultimoElementoEnfocado = null;
let vistaActiva = localStorage.getItem('biblioteca-vista') || 'grid';
let moodActivo = 'Todos';
let soloFavoritos = false;
let soloLeyendo = false;
let letraActiva = 'Todas';
let extensionActiva = 'Todas'; // Todas | corta | media | larga
let idiomaActivo = 'Todos'; // Todos | es | en
let sagaActiva = 'Todas'; // Todas | __TODAS__ | nombre de la saga
let vistaColeccionActiva = 'colecciones'; // colecciones | sagas
let rankingMasLeidos = [];

const LETRAS_INDICE = ['Todas', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

const FAVORITOS_KEY = 'libractiva_favoritos';

// ── LÍMITE DE USOS DEL RECOMENDADOR IA (usuarios sin código) ──
const IA_USOS_KEY = 'libractiva_ia_usos';
const IA_USOS_LIMITE = 3;

function obtenerUsosIA() {
  try { return parseInt(localStorage.getItem(IA_USOS_KEY) || '0', 10); } catch { return 0; }
}

function incrementarUsoIA() {
  try { localStorage.setItem(IA_USOS_KEY, String(obtenerUsosIA() + 1)); } catch {}
}

function agotoUsosIA() {
  return !esDonadorLocal() && obtenerUsosIA() >= IA_USOS_LIMITE;
}

// ── MARCADORES DE PÁGINA ──
const MARCADORES_KEY = 'libractiva_marcadores';

function obtenerMarcadores(libroId) {
  try {
    const todos = JSON.parse(localStorage.getItem(MARCADORES_KEY)) || {};
    return todos[libroId] ? [...todos[libroId]].sort((a, b) => a - b) : [];
  } catch { return []; }
}

function guardarMarcadores(libroId, paginas) {
  try {
    const todos = JSON.parse(localStorage.getItem(MARCADORES_KEY)) || {};
    if (paginas.length === 0) {
      delete todos[libroId];
    } else {
      todos[libroId] = paginas;
    }
    localStorage.setItem(MARCADORES_KEY, JSON.stringify(todos));
  } catch {}
}

function esPaginaMarcada(libroId, pagina) {
  return obtenerMarcadores(libroId).includes(pagina);
}

function toggleMarcador(libroId, pagina) {
  const marcadores = obtenerMarcadores(libroId);
  const idx = marcadores.indexOf(pagina);
  if (idx >= 0) {
    marcadores.splice(idx, 1);
    guardarMarcadores(libroId, marcadores);
    return false; // desmarcado
  } else {
    marcadores.push(pagina);
    guardarMarcadores(libroId, marcadores);
    return true; // marcado
  }
}

function obtenerFavoritos() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITOS_KEY)) || [];
  } catch { return []; }
}

function guardarFavoritos(ids) {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(ids));
}

const PROGRESO_KEY = 'libractiva_progreso';

function guardarProgresoLectura(libroId, pagina) {
  try {
    const progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || {};
    const libro = Array.isArray(libros) ? libros.find(l => l.id === parseInt(libroId, 10)) : null;
    const total = (typeof lectorEstado !== 'undefined' && lectorEstado.totalPaginas) 
      ? lectorEstado.totalPaginas 
      : ((typeof progreso[libroId] === 'object' && progreso[libroId]?.totalPaginas) 
          ? progreso[libroId].totalPaginas 
          : (libro?.paginas || null));
    progreso[libroId] = {
      pagina: parseInt(pagina, 10),
      totalPaginas: total,
      fecha: Date.now()
    };
    localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso));
    if (typeof renderizarContinuarLeyendo === 'function') {
      renderizarContinuarLeyendo();
    }
  } catch (e) {
    console.error('Error al guardar progreso de lectura:', e);
  }
}

function obtenerProgresoLectura(libroId) {
  try {
    const progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || {};
    const val = progreso[libroId];
    if (!val) return null;
    return typeof val === 'object' ? val.pagina : parseInt(val, 10);
  } catch (e) {
    console.error('Error al obtener progreso de lectura:', e);
    return null;
  }
}

function obtenerInfoProgreso(libroId) {
  try {
    const progreso = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || {};
    const val = progreso[libroId];
    if (!val) return null;
    const pag = typeof val === 'object' ? (val.pagina || 1) : parseInt(val, 10);
    const libro = Array.isArray(libros) ? libros.find(l => l.id === parseInt(libroId, 10)) : null;
    const total = (typeof val === 'object' && val.totalPaginas) ? val.totalPaginas : (libro?.paginas || null);
    const porcentaje = total ? Math.min(100, Math.round((pag / total) * 100)) : 0;
    const esCompleto = total ? pag >= total : false;
    return {
      pagina: pag,
      totalPaginas: total,
      porcentaje,
      esCompleto,
      fecha: typeof val === 'object' ? (val.fecha || 0) : 0
    };
  } catch (e) {
    return null;
  }
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
  fetch('libros.json?v=14').then(r => {
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
    inicializarIndiceAZ();
    renderizarContinuarLeyendo();
    cargarRankingMasLeidos();
  })
  .catch(error => {
    console.error('Error al cargar el catálogo:', error);
    const galeria = document.getElementById('galeria');
    if (galeria) {
      galeria.innerHTML = `
        <div class="error-carga">
          <div class="error-icono"><i data-lucide="book-x" class="icono-xl"></i></div>
          <h2>No se pudo cargar el catálogo</h2>
          <p>${error.message}</p>
          <button id="btnReintentar" class="btn-recomendar">Reintentar</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons({ root: galeria });
      document.getElementById('btnReintentar')?.addEventListener('click', () => location.reload());
    }
  });

// ── OBTENER RANKING REAL DE LECTURAS (REDIS) ──
function cargarRankingMasLeidos() {
  fetch('/api/ranking')
    .then(r => {
      if (!r.ok) return { ranking: [] };
      return r.json();
    })
    .then(data => {
      if (data && Array.isArray(data.ranking) && data.ranking.length > 0) {
        rankingMasLeidos = data.ranking;
        renderizarDestacados();
        if (ordenActivo === 'mas-leidos') {
          filtrar();
        }
      }
    })
    .catch(() => {});
}

// ── INICIALIZAR PÁGINA ──
/* Adapta el placeholder del buscador según el tamaño del viewport */
function adaptarPlaceholder() {
  const input = document.getElementById('inputBusqueda');
  if (!input) return;
  const actualizar = () => {
    input.placeholder = window.innerWidth < 480
      ? 'Buscar libro, autor, saga…'
      : 'Buscar por título, autor, saga, género o año…';
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

  // Buscador con debounce
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
  }

  // Adaptar placeholder del buscador según viewport (móvil / desktop)
  adaptarPlaceholder();

  // Poblar e inicializar los custom dropdowns, chips y autocompletado
  poblarDropdownAutores();
  poblarDropdownSagas();
  inicializarDropdowns();
  inicializarAutocompletado();

  // Registrar TODOS los event listeners (zero onclick inline)
  registrarEventos();

  // Modo oscuro
  inicializarTema();

  // Soporte para parámetro de búsqueda ?q= en la URL (Schema.org SearchAction)
  const paramsUrl = new URLSearchParams(window.location.search);
  const queryUrl = paramsUrl.get('q');
  if (queryUrl && queryUrl.trim() && inputBusqueda) {
    inputBusqueda.value = queryUrl.trim();
    const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
    if (btnLimpiar) btnLimpiar.style.display = 'flex';
    filtrar();
  }

  // Rutas hash
  manejarRutaHash();

  // Inicializar vista (grid/lista)
  cambiarVista(vistaActiva);

  if (window.lucide) lucide.createIcons();

  // Verificar si el usuario regresa desde el checkout de Mercado Pago
  verificarRetornoPagoMercadoPago();
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

  // 1. Renderizar Tag "Todos" al principio (sobrio, estilo editorial)
  const btnTodos = document.createElement('button');
  btnTodos.className = 'tag-genero activo';
  btnTodos.dataset.genero = 'Todos';
  btnTodos.textContent = 'Todos';
  btnTodos.addEventListener('click', () => filtrarGenero('Todos', btnTodos));
  contenedor.appendChild(btnTodos);

  // 2. Renderizar los Mood Tags (Descubrimiento Inteligente con iconos temáticos)
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

  // 3. Renderizar Tags por género (texto sobrio y legible sin micro-iconos repetitivos)
  const MAX_GENEROS_VISIBLES = 8;
  const generosPrincipales = generosOrdenados.slice(0, MAX_GENEROS_VISIBLES);
  const generosRestantes = generosOrdenados.slice(MAX_GENEROS_VISIBLES);

  generosPrincipales.forEach(([genero, cantidad]) => {
    const btn = document.createElement('button');
    btn.className = 'tag-genero';
    btn.dataset.genero = genero;
    btn.textContent = genero;
    btn.title = `${cantidad} libros`;
    btn.addEventListener('click', () => filtrarGenero(genero, btn));
    contenedor.appendChild(btn);
  });

  // Botón "Ver todos" + géneros ocultos
  if (generosRestantes.length > 0) {
    const wrapperOculto = document.createElement('div');
    wrapperOculto.className = 'tags-generos-ocultos';
    wrapperOculto.style.display = 'contents';

    const grupoOculto = document.createElement('span');
    grupoOculto.className = 'tags-generos-extra';
    grupoOculto.style.display = 'none';
    grupoOculto.style.contents = 'none';

    generosRestantes.forEach(([genero, cantidad]) => {
      const btn = document.createElement('button');
      btn.className = 'tag-genero tag-genero-extra';
      btn.dataset.genero = genero;
      btn.textContent = genero;
      btn.title = `${cantidad} libros`;
      btn.addEventListener('click', () => filtrarGenero(genero, btn));
      grupoOculto.appendChild(btn);
    });

    const btnVerTodos = document.createElement('button');
    btnVerTodos.className = 'tag-genero tag-ver-todos';
    btnVerTodos.dataset.expandido = 'false';
    btnVerTodos.innerHTML = `<i data-lucide="plus" class="icono-sm"></i> +${generosRestantes.length} géneros`;
    btnVerTodos.addEventListener('click', () => {
      const expandido = btnVerTodos.dataset.expandido === 'true';
      if (expandido) {
        grupoOculto.style.display = 'none';
        btnVerTodos.innerHTML = `<i data-lucide="plus" class="icono-sm"></i> +${generosRestantes.length} géneros`;
        btnVerTodos.dataset.expandido = 'false';
      } else {
        grupoOculto.style.display = 'inline-flex';
        grupoOculto.style.flexWrap = 'wrap';
        grupoOculto.style.gap = 'inherit';
        btnVerTodos.innerHTML = `<i data-lucide="minus" class="icono-sm"></i> Ocultar`;
        btnVerTodos.dataset.expandido = 'true';
      }
      if (window.lucide) lucide.createIcons({ root: contenedor });
    });

    contenedor.appendChild(btnVerTodos);
    contenedor.appendChild(grupoOculto);
  }

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
    letraActiva !== 'Todas' ||
    extensionActiva !== 'Todas' ||
    idiomaActivo !== 'Todos' ||
    sagaActiva !== 'Todas' ||
    busquedaText !== '' ||
    paginaActual > 1 ||
    coleccionActiva !== null ||
    soloFavoritos ||
    soloLeyendo;

  if (tieneFiltros) {
    seccion.style.display = 'none';
    return;
  }

  // Orden fijo y estable según la lista curada LIBROS_DESTACADOS_IDS (#1 Carrie)
  const idsDestacados = [...LIBROS_DESTACADOS_IDS];

  const librosDestacados = idsDestacados
    .map(id => libros.find(l => l.id === id))
    .filter(Boolean);
  
  if (librosDestacados.length === 0) {
    seccion.style.display = 'none';
    return;
  }

  // Título de la sección
  const tituloSeccion = seccion.querySelector('.seccion-titulo-destacados');
  if (tituloSeccion) {
    tituloSeccion.textContent = 'Los más destacados';
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
    const infoProg = obtenerInfoProgreso(libro.id);
    const tieneProgreso = !!(infoProg && infoProg.pagina > 1);
    const podioClase = i === 0 ? 'podio-oro' : i === 1 ? 'podio-plata' : i === 2 ? 'podio-bronce' : 'podio-resto';
    const podioIcono = i === 0 ? '<i data-lucide="crown" class="icono-xs"></i> ' : i === 1 ? '<i data-lucide="medal" class="icono-xs"></i> ' : i === 2 ? '<i data-lucide="award" class="icono-xs"></i> ' : '';

    tarjeta.innerHTML = `
      <span class="destacado-rank-badge ${podioClase}" aria-label="Posición #${i + 1}">${podioIcono}#${i + 1}</span>
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
        ${libro.serie ? `<span class="tarjeta-serie-badge" title="Ver saga: ${libro.serie.nombre} · #${libro.serie.orden}"><i data-lucide="layers" class="icono-xs"></i> ${libro.serie.nombre} #${libro.serie.orden}</span>` : ''}
        ${(hasPdf && !esDonador) ? `<span class="badge-preview" aria-label="Vista previa gratuita de 15 páginas"><i data-lucide="eye" class="icono-xs"></i> Vista previa · 15 págs.</span>` : ''}
        <div class="tarjeta-titulo">${tituloLimpio}</div>
        <div class="tarjeta-autor">${libro.autor || ''}</div>
        <div class="tarjeta-meta-fila">
          ${libro.anio ? `<span class="tarjeta-anio">${libro.anio}</span>` : ''}
          ${libro.paginas ? `<span class="tarjeta-paginas">${libro.anio ? '· ' : ''}${libro.paginas} págs.</span>` : ''}
          ${libro.idioma === 'en' ? `<span class="tarjeta-idioma-en">EN</span>` : ''}
        </div>
        ${tieneProgreso ? `
          <div class="tarjeta-progreso-mini" title="${infoProg.esCompleto ? 'Lectura completada' : `Pág. ${infoProg.pagina}${infoProg.totalPaginas ? ` de ${infoProg.totalPaginas}` : ''} (${infoProg.porcentaje}%)`}">
            <div class="tarjeta-progreso-mini-barra">
              <div class="tarjeta-progreso-mini-fill ${infoProg.esCompleto ? 'leido' : ''}" style="width: ${infoProg.porcentaje > 0 ? infoProg.porcentaje : 20}%"></div>
            </div>
            <span class="tarjeta-progreso-mini-txt ${infoProg.esCompleto ? 'leido' : ''}">${infoProg.esCompleto ? '✓ Leído' : (infoProg.porcentaje > 0 ? infoProg.porcentaje + '%' : `Pág. ${infoProg.pagina}`)}</span>
          </div>
        ` : ''}
        <div class="tarjeta-descripcion">${libro.descripcion || ''}</div>
      </div>
      ${hasPdf ?
        `<div class="tarjeta-acciones-fila">
          <button class="btn-ver btn-leer-lector ${tieneProgreso ? 'btn-leer-continuar' : ''}" style="cursor:pointer">
            <i data-lucide="${tieneProgreso ? (infoProg.esCompleto ? 'rotate-ccw' : 'play') : 'book-open'}" class="icono-sm"></i> ${tieneProgreso ? (infoProg.esCompleto ? 'Releer' : `Pág. ${infoProg.pagina}`) : 'Leer'}
          </button>
          ${(esDonador && (libro.archivo_pdf || libro.archivo_epub)) ? `
            <div class="tarjeta-descarga-rapida">
              ${libro.archivo_pdf ? `<button class="btn-descarga-tarjeta btn-dl-pdf" data-libro-id="${libro.id}" title="Descargar PDF" aria-label="Descargar PDF"><i data-lucide="file-down" class="icono-sm"></i></button>` : ''}
              ${libro.archivo_epub ? `<button class="btn-descarga-tarjeta btn-dl-epub" data-libro-id="${libro.id}" title="Descargar EPUB" aria-label="Descargar EPUB"><i data-lucide="download" class="icono-sm"></i></button>` : ''}
            </div>
          ` : ''}
        </div>` :
        `<a href="${libro.pdf || '#'}" target="_blank" rel="noopener" class="btn-ver"><i data-lucide="file-text" class="icono-sm"></i> Ver documento</a>`
      }
    `;

    const badgeSerie = tarjeta.querySelector('.tarjeta-serie-badge');
    if (badgeSerie && libro.serie && libro.serie.nombre) {
      badgeSerie.addEventListener('click', (e) => {
        e.stopPropagation();
        seleccionarSaga(libro.serie.nombre);
      });
    }
    tarjeta.querySelector('.tarjeta-info').addEventListener('click', () => abrirDetalleLibro(libro.id));
    if (hasPdf) {
      tarjeta.querySelector('.btn-leer-lector').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirLector(libro.id, libro);
      });
      tarjeta.querySelectorAll('.btn-dl-pdf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          descargarArchivo(libro.id, 'pdf');
        });
      });
      tarjeta.querySelectorAll('.btn-dl-epub').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          descargarArchivo(libro.id, 'epub');
        });
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

// ── OBTENER SAGAS AGRUPADAS ──
function obtenerSagasAgrupadas() {
  const sagasMap = new Map();
  libros.forEach(l => {
    if (l.serie && l.serie.nombre) {
      const nombre = l.serie.nombre.trim();
      if (!sagasMap.has(nombre)) {
        sagasMap.set(nombre, {
          nombre,
          autor: l.autor || '',
          genero: l.genero || 'Literatura',
          libros: []
        });
      }
      sagasMap.get(nombre).libros.push(l);
    }
  });

  const sagasLista = Array.from(sagasMap.values());
  sagasLista.forEach(s => {
    s.libros.sort((a, b) => (a.serie?.orden || 999) - (b.serie?.orden || 999));
  });
  sagasLista.sort((a, b) => b.libros.length - a.libros.length || a.nombre.localeCompare(b.nombre, 'es'));
  return sagasLista;
}

// ── RENDERIZAR COLECCIONES CURADAS Y SAGAS ──
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
    letraActiva !== 'Todas' ||
    extensionActiva !== 'Todas' ||
    idiomaActivo !== 'Todos' ||
    sagaActiva !== 'Todas' ||
    busquedaText !== '' ||
    paginaActual > 1 ||
    coleccionActiva !== null ||
    soloFavoritos ||
    soloLeyendo;

  if (tieneFiltros) {
    seccion.style.display = 'none';
    return;
  }

  const sagasLista = obtenerSagasAgrupadas();

  if (colecciones.length === 0 && sagasLista.length === 0) {
    seccion.style.display = 'none';
    return;
  }

  // Actualizar contadores y estado activo en pestañas
  const countCol = document.getElementById('countTabColecciones');
  const countSag = document.getElementById('countTabSagas');
  if (countCol) countCol.textContent = colecciones.length;
  if (countSag) countSag.textContent = sagasLista.length;

  const tabCol = document.getElementById('tabVistaColecciones');
  const tabSag = document.getElementById('tabVistaSagas');
  const tituloSec = document.getElementById('tituloColeccionesSeccion');

  if (tabCol && tabSag) {
    const esSagas = vistaColeccionActiva === 'sagas';
    tabCol.classList.toggle('activo', !esSagas);
    tabCol.setAttribute('aria-selected', !esSagas ? 'true' : 'false');
    tabSag.classList.toggle('activo', esSagas);
    tabSag.setAttribute('aria-selected', esSagas ? 'true' : 'false');
  }
  if (tituloSec) {
    tituloSec.textContent = vistaColeccionActiva === 'sagas'
      ? 'Sagas y Series Literarias'
      : 'Colecciones Populares';
  }

  seccion.style.display = 'block';
  grid.innerHTML = '';

  if (vistaColeccionActiva === 'sagas') {
    sagasLista.forEach(saga => {
      const primerLibro = saga.libros[0];
      const bgPortada = (primerLibro && primerLibro.portada) ? primerLibro.portada : 'portadas/pack-generico.webp';
      const portadasAMostrar = saga.libros.slice(0, 3).map(l => l.portada).filter(Boolean);

      let stackHtml = '';
      if (portadasAMostrar.length > 0) {
        stackHtml = `
          <div class="pack-libros-stack">
            ${portadasAMostrar.map((portada, idx) => `
              <div class="pack-libro-stack-item portada-idx-${idx}">
                <img src="${portada}" alt="Tomo ${idx + 1} de ${saga.nombre}" loading="lazy" />
              </div>
            `).join('')}
          </div>
        `;
      }

      const tarjeta = document.createElement('div');
      tarjeta.className = 'pack-tarjeta saga-tarjeta';
      tarjeta.innerHTML = `
        <img src="${bgPortada}" alt="${saga.nombre}" class="pack-tarjeta-bg" loading="lazy" />
        <span class="pack-insignia saga-insignia"><i data-lucide="layers" class="icono-xs"></i> ${saga.libros.length} Tomos</span>
        ${stackHtml}
        <div class="pack-info">
          <span class="saga-autor-tag">${saga.autor}</span>
          <h4 class="pack-titulo">${saga.nombre}</h4>
          <p class="pack-descripcion">Inicia con: «${limpiarTitulo(primerLibro ? primerLibro.titulo : '')}»</p>
          <button class="btn-explorar-pack">Ver en orden <i data-lucide="arrow-right" class="icono-sm"></i></button>
        </div>
      `;

      tarjeta.addEventListener('click', () => seleccionarSaga(saga.nombre));
      grid.appendChild(tarjeta);
    });
  } else {
    colecciones.forEach(pack => {
      const librosDelPack = pack.libros.map(id => libros.find(l => l.id === id)).filter(Boolean);
      const primerLibro = librosDelPack[0];
      const bgPortada = pack.portada_pack || (primerLibro && primerLibro.portada) || 'portadas/pack-generico.webp';
      const portadasAMostrar = librosDelPack.slice(0, 3).map(l => l.portada).filter(Boolean);

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
        <span class="pack-insignia"><i data-lucide="sparkles" class="icono-xs"></i> ${pack.libros.length} Libros</span>
        ${stackHtml}
        <div class="pack-info">
          <h4 class="pack-titulo">${pack.titulo}</h4>
          ${pack.descripcion ? `<p class="pack-descripcion">${pack.descripcion}</p>` : ''}
          <button class="btn-explorar-pack">Explorar <i data-lucide="arrow-right" class="icono-sm"></i></button>
        </div>
      `;

      tarjeta.addEventListener('click', () => seleccionarColeccion(pack));
      grid.appendChild(tarjeta);
    });
  }

  if (window.lucide) lucide.createIcons({ root: grid });
}

function sincronizarUISaga() {
  const menuSaga = document.getElementById('menuDropdownSaga');
  const labelSaga = document.getElementById('labelDropdownSaga');
  const btnTagSagas = document.getElementById('btnTagSagas');

  if (menuSaga) {
    menuSaga.querySelectorAll('.dropdown-item').forEach(li => {
      li.classList.toggle('seleccionado', li.dataset.valor === sagaActiva);
    });
  }

  if (labelSaga) {
    if (sagaActiva === 'Todas') {
      labelSaga.textContent = 'Sagas';
    } else if (sagaActiva === '__TODAS__') {
      labelSaga.textContent = 'Todas las sagas';
    } else {
      labelSaga.textContent = sagaActiva;
    }
  }

  if (btnTagSagas) {
    const activo = sagaActiva !== 'Todas';
    btnTagSagas.classList.toggle('activo', activo);
    btnTagSagas.setAttribute('aria-pressed', activo ? 'true' : 'false');
  }
}

function seleccionarSaga(nombreSaga) {
  coleccionActiva = null;
  sagaActiva = nombreSaga;
  sincronizarUISaga();

  const btnCerrar = document.getElementById('btnCerrarPack');
  if (btnCerrar) {
    btnCerrar.style.display = sagaActiva !== 'Todas' ? 'inline-flex' : 'none';
  }

  filtrar();

  const catalogoHeader = document.querySelector('.catalogo-header-barra');
  if (catalogoHeader) {
    catalogoHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function seleccionarColeccion(pack) {
  sagaActiva = 'Todas';
  sincronizarUISaga();
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
  sagaActiva = 'Todas';
  sincronizarUISaga();

  // Restaurar UI
  const titulo = document.getElementById('catalogoTitulo');
  const btnCerrar = document.getElementById('btnCerrarPack');
  
  if (titulo) titulo.textContent = 'Catálogo Completo';
  if (btnCerrar) btnCerrar.style.display = 'none';

  // Volver a filtrar y refrescar vistas
  filtrar();
  renderizarColecciones();
  renderizarDestacados();
  renderizarContinuarLeyendo();
}

// ── ÍNDICE ALFABÉTICO A–Z ──
function inicializarIndiceAZ() {
  const contenedor = document.getElementById('indiceAZLista');
  if (!contenedor) return;

  contenedor.innerHTML = LETRAS_INDICE.map(letra => `
    <button class="btn-indice-letra ${letra === letraActiva ? 'activo' : ''}" data-letra="${letra}" aria-label="Filtrar por letra ${letra}">
      ${letra}
    </button>
  `).join('');

  contenedor.querySelectorAll('.btn-indice-letra').forEach(btn => {
    btn.addEventListener('click', () => {
      const letra = btn.dataset.letra;
      if (letraActiva === letra) return;
      letraActiva = letra;
      contenedor.querySelectorAll('.btn-indice-letra').forEach(b => {
        b.classList.toggle('activo', b.dataset.letra === letraActiva);
      });
      filtrar();
    });
  });
}

// ── MÓDULO CONTINUAR LEYENDO (HISTORIAL DE LECTURA ACTIVA) ──
function renderizarContinuarLeyendo() {
  const seccion = document.getElementById('continuar-leyendo-seccion');
  if (!seccion || !Array.isArray(libros) || libros.length === 0) return;

  const inputBusqueda = document.getElementById('inputBusqueda');
  const busquedaText = inputBusqueda ? inputBusqueda.value.trim() : '';

  const tieneFiltros = 
    generoActivo !== 'Todos' || 
    autorActivo !== 'Todos' || 
    epocaActiva !== 'Todas' || 
    moodActivo !== 'Todos' || 
    letraActiva !== 'Todas' ||
    extensionActiva !== 'Todas' ||
    idiomaActivo !== 'Todos' ||
    sagaActiva !== 'Todas' ||
    busquedaText !== '' ||
    paginaActual > 1 ||
    coleccionActiva !== null ||
    soloFavoritos ||
    soloLeyendo;

  if (tieneFiltros) {
    seccion.style.display = 'none';
    return;
  }

  let progresoRaw = {};
  try {
    progresoRaw = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || {};
  } catch (_) {
    progresoRaw = {};
  }

  const librosEnProgreso = [];
  for (const [idStr, info] of Object.entries(progresoRaw)) {
    const id = parseInt(idStr, 10);
    const libro = libros.find(l => l.id === id);
    if (!libro) continue;
    const pag = typeof info === 'object' ? (info.pagina || 1) : parseInt(info, 10);
    const total = (typeof info === 'object' && info.totalPaginas) ? info.totalPaginas : (libro.paginas || null);
    const fecha = typeof info === 'object' ? (info.fecha || 0) : 0;
    if (pag > 1) {
      const porcentaje = total ? Math.min(100, Math.round((pag / total) * 100)) : 0;
      const esCompleto = total ? pag >= total : false;
      librosEnProgreso.push({ libro, pag, total, fecha, porcentaje, esCompleto });
    }
  }

  if (librosEnProgreso.length === 0) {
    seccion.style.display = 'none';
    seccion.innerHTML = '';
    return;
  }

  // Ordenar por fecha más reciente
  librosEnProgreso.sort((a, b) => b.fecha - a.fecha);
  const mostrar = librosEnProgreso.slice(0, 3);

  seccion.style.display = 'block';
  seccion.innerHTML = `
    <div class="continuar-leyendo-header">
      <div class="continuar-leyendo-titulo-grupo">
        <span class="continuar-ornamento">✦ Retoma tu lectura ✦</span>
        <h2 class="seccion-titulo-destacados" style="margin-bottom: 0.2rem;">Continuar leyendo</h2>
      </div>
      ${librosEnProgreso.length > 3 ? `
        <button id="btnVerTodosLeyendo" class="btn-ver-todos-leyendo" type="button" aria-label="Ver todos los libros en progreso">
          <span>Ver todos (${librosEnProgreso.length})</span>
          <i data-lucide="arrow-right" class="icono-xs"></i>
        </button>
      ` : ''}
    </div>
    <div class="continuar-leyendo-grid">
      ${mostrar.map(({ libro, pag, total, porcentaje, esCompleto }) => {
        const tituloLimpio = limpiarTitulo(libro.titulo);
        const txtProgreso = esCompleto 
          ? '<i data-lucide="check-circle" class="icono-xs"></i> ¡Libro completado! (100%)' 
          : (total ? `Pág. ${pag} de ${total} (${porcentaje}%)` : `Pág. ${pag}`);
        return `
          <div class="continuar-tarjeta" data-libro-id="${libro.id}">
            <button class="continuar-descartar-btn" title="Quitar de continuar leyendo" aria-label="Quitar de continuar leyendo">
              <i data-lucide="x" class="icono-sm"></i>
            </button>
            ${libro.portada 
              ? `<img src="${libro.portada}" alt="Portada de ${tituloLimpio}" class="continuar-portada" loading="lazy" width="72" height="100" />` 
              : `<div class="continuar-portada tarjeta-portada-placeholder" style="display:flex;align-items:center;justify-content:center;background:var(--fondo-tarjeta);">
                   <i data-lucide="book" class="icono-sm"></i>
                 </div>`
            }
            <div class="continuar-info">
              <div>
                <h3 class="continuar-titulo" title="${tituloLimpio}">${tituloLimpio}</h3>
                <p class="continuar-autor">${libro.autor || 'Autor desconocido'}</p>
              </div>
              <div>
                <div class="continuar-progreso-barra">
                  <div class="continuar-progreso-fill ${esCompleto ? 'leido' : ''}" style="width: ${porcentaje > 0 ? porcentaje : 20}%;"></div>
                </div>
                <div class="continuar-pag-txt ${esCompleto ? 'leido' : ''}">${txtProgreso}</div>
                <button class="btn-continuar-accion ${esCompleto ? 'btn-releer-accion' : ''}" data-libro-id="${libro.id}">
                  <i data-lucide="${esCompleto ? 'rotate-ccw' : 'book-open'}" class="icono-sm"></i> ${esCompleto ? 'Releer libro' : 'Continuar lectura'}
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Botón ver todos los libros en progreso (activa filtro 'Leyendo')
  const btnVerTodos = seccion.querySelector('#btnVerTodosLeyendo');
  if (btnVerTodos) {
    btnVerTodos.addEventListener('click', () => {
      const btnLey = document.getElementById('btnLeyendo');
      if (btnLey && !soloLeyendo) {
        btnLey.click();
      }
    });
  }

  // Asignar eventos de interacción
  seccion.querySelectorAll('.continuar-tarjeta').forEach(card => {
    const libroId = parseInt(card.dataset.libroId, 10);
    const libro = libros.find(l => l.id === libroId);
    if (!libro) return;

    const btnDescartar = card.querySelector('.continuar-descartar-btn');
    if (btnDescartar) {
      btnDescartar.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          const actual = JSON.parse(localStorage.getItem(PROGRESO_KEY)) || {};
          delete actual[libroId];
          localStorage.setItem(PROGRESO_KEY, JSON.stringify(actual));
        } catch (_) {}
        renderizarContinuarLeyendo();
        if (soloLeyendo) filtrar();
      });
    }

    const btnAccion = card.querySelector('.btn-continuar-accion');
    if (btnAccion) {
      btnAccion.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirLector(libro.id, libro);
      });
    }

    card.addEventListener('click', (e) => {
      if (e.target.closest('.continuar-descartar-btn') || e.target.closest('.btn-continuar-accion')) return;
      abrirLector(libro.id, libro);
    });
  });

  if (window.lucide) lucide.createIcons({ root: seccion });
}

// ── MOSTRAR PÁGINA ──
function mostrarPagina(pagina, omitirScroll = false) {
  paginaActual = pagina;
  if (!omitirScroll) {
    renderizarColecciones();
    renderizarDestacados();
    renderizarContinuarLeyendo();
  }
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

    const textoSin = document.getElementById('sinResultadosTexto');
    if (textoSin) {
      if (soloLeyendo) {
        textoSin.textContent = 'Aún no has iniciado ninguna lectura. Abre cualquier libro en el lector para retomar tu progreso desde aquí.';
      } else if (soloFavoritos) {
        textoSin.textContent = 'Aún no tienes libros guardados en tus favoritos. Haz clic en el corazón de cualquier libro para añadirlo.';
      } else {
        textoSin.textContent = 'No se encontraron libros con ese criterio.';
      }
    }

    // Actualizar enlace y texto del botón de solicitar por WhatsApp
    const inputBusqueda = document.getElementById('inputBusqueda');
    const busquedaText = inputBusqueda ? inputBusqueda.value.trim() : '';
    const btnSolicitar = document.getElementById('btnSolicitarLibro');
    const subtituloSolicitar = document.getElementById('solicitarCardSubtitulo');

    const esDonador = esDonadorLocal();
    const etiquetaMiembro = esDonador ? ' (Miembro Lifetime Activo)' : '';

    if (btnSolicitar) {
      const msg = busquedaText
        ? `Hola Libractiva, estuve buscando el libro "${busquedaText}"${etiquetaMiembro} y no lo encontré en el catálogo. ¿Podrían agregarlo a la biblioteca?`
        : `Hola Libractiva, quisiera solicitar un libro${etiquetaMiembro} para que lo agreguen al catálogo: `;
      btnSolicitar.href = `https://wa.me/524811289106?text=${encodeURIComponent(msg)}`;

      btnSolicitar.innerHTML = '';
      const icon = document.createElement('i');
      icon.dataset.lucide = 'send';
      icon.className = 'icono-sm';
      btnSolicitar.appendChild(icon);
      const txt = document.createElement('span');
      txt.textContent = busquedaText 
        ? ` Solicitar "${busquedaText.slice(0, 30)}${busquedaText.length > 30 ? '…' : ''}" por WhatsApp` 
        : ' Solicitar este libro por WhatsApp';
      btnSolicitar.appendChild(txt);
    }

    if (subtituloSolicitar) {
      subtituloSolicitar.innerHTML = esDonador
        ? 'Como <strong>miembro Lifetime</strong>, tus solicitudes tienen prioridad preferente y te avisamos por WhatsApp en cuanto el libro esté disponible.'
        : 'Pídelo directamente por WhatsApp y lo añadiremos al catálogo en las próximas actualizaciones.';
    }

    if (window.lucide) lucide.createIcons({ root: sinResultados });
    return;
  }

  sinResultados.style.display = 'none';

  // Contador con info de paginación
  const total = listaFiltrada.length;
  const inicio = (paginaActual - 1) * LIBROS_POR_PAGINA + 1;
  const fin = Math.min(paginaActual * LIBROS_POR_PAGINA, total);
  contador.textContent = `Mostrando ${inicio}–${fin} de ${total.toLocaleString('es-MX')} libro${total !== 1 ? 's' : ''}`;

  const esDonador = esDonadorLocal();

  lista.forEach((libro, i) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.style.animationDelay = `${i * 0.03}s`;

    const claseGenero = obtenerClaseGenero(libro.genero);
    const tituloLimpio = limpiarTitulo(libro.titulo);

    const hasPdf = !!libro.archivo_pdf;
    const esFav = esFavorito(libro.id);
    const infoProg = obtenerInfoProgreso(libro.id);
    const tieneProgreso = !!(infoProg && infoProg.pagina > 1);

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
        ${libro.serie ? `<span class="tarjeta-serie-badge" title="Ver saga: ${libro.serie.nombre} · #${libro.serie.orden}"><i data-lucide="layers" class="icono-xs"></i> ${libro.serie.nombre} #${libro.serie.orden}</span>` : ''}
        ${(hasPdf && !esDonador) ? `<span class="badge-preview" aria-label="Vista previa gratuita de 15 páginas"><i data-lucide="eye" class="icono-xs"></i> Vista previa · 15 págs.</span>` : ''}
        <div class="tarjeta-titulo">${tituloLimpio}</div>
        <div class="tarjeta-autor">${libro.autor || ''}</div>
        <div class="tarjeta-meta-fila">
          ${libro.anio ? `<span class="tarjeta-anio">${libro.anio}</span>` : ''}
          ${libro.paginas ? `<span class="tarjeta-paginas">${libro.anio ? '· ' : ''}${libro.paginas} págs.</span>` : ''}
          ${libro.idioma === 'en' ? `<span class="tarjeta-idioma-en">EN</span>` : ''}
        </div>
        ${tieneProgreso ? `
          <div class="tarjeta-progreso-mini" title="${infoProg.esCompleto ? 'Lectura completada' : `Pág. ${infoProg.pagina}${infoProg.totalPaginas ? ` de ${infoProg.totalPaginas}` : ''} (${infoProg.porcentaje}%)`}">
            <div class="tarjeta-progreso-mini-barra">
              <div class="tarjeta-progreso-mini-fill ${infoProg.esCompleto ? 'leido' : ''}" style="width: ${infoProg.porcentaje > 0 ? infoProg.porcentaje : 20}%"></div>
            </div>
            <span class="tarjeta-progreso-mini-txt ${infoProg.esCompleto ? 'leido' : ''}">${infoProg.esCompleto ? '✓ Leído' : (infoProg.porcentaje > 0 ? infoProg.porcentaje + '%' : `Pág. ${infoProg.pagina}`)}</span>
          </div>
        ` : ''}
        <div class="tarjeta-descripcion">${libro.descripcion || ''}</div>
      </div>
      ${hasPdf ?
        `<div class="tarjeta-acciones-fila">
          <button class="btn-ver btn-leer-lector ${tieneProgreso ? 'btn-leer-continuar' : ''}" style="cursor:pointer">
            <i data-lucide="${tieneProgreso ? (infoProg.esCompleto ? 'rotate-ccw' : 'play') : 'book-open'}" class="icono-sm"></i> ${tieneProgreso ? (infoProg.esCompleto ? 'Releer' : `Pág. ${infoProg.pagina}`) : 'Leer'}
          </button>
          ${(esDonador && (libro.archivo_pdf || libro.archivo_epub)) ? `
            <div class="tarjeta-descarga-rapida">
              ${libro.archivo_pdf ? `<button class="btn-descarga-tarjeta btn-dl-pdf" data-libro-id="${libro.id}" title="Descargar PDF" aria-label="Descargar PDF"><i data-lucide="file-down" class="icono-sm"></i></button>` : ''}
              ${libro.archivo_epub ? `<button class="btn-descarga-tarjeta btn-dl-epub" data-libro-id="${libro.id}" title="Descargar EPUB" aria-label="Descargar EPUB"><i data-lucide="download" class="icono-sm"></i></button>` : ''}
            </div>
          ` : ''}
        </div>` :
        `<a href="${libro.pdf || '#'}" target="_blank" rel="noopener" class="btn-ver"><i data-lucide="file-text" class="icono-sm"></i> Ver documento</a>`
      }
    `;
    const badgeSerie = tarjeta.querySelector('.tarjeta-serie-badge');
    if (badgeSerie && libro.serie && libro.serie.nombre) {
      badgeSerie.addEventListener('click', (e) => {
        e.stopPropagation();
        seleccionarSaga(libro.serie.nombre);
      });
    }
    tarjeta.querySelector('.tarjeta-info').addEventListener('click', () => abrirDetalleLibro(libro.id));
    if (hasPdf) {
      tarjeta.querySelector('.btn-leer-lector').addEventListener('click', (e) => {
        e.stopPropagation();
        abrirLector(libro.id, libro);
      });
      tarjeta.querySelectorAll('.btn-dl-pdf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          descargarArchivo(libro.id, 'pdf');
        });
      });
      tarjeta.querySelectorAll('.btn-dl-epub').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          descargarArchivo(libro.id, 'epub');
        });
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

  // Botón primera página (si hay más de 6 páginas y estamos después de la página 3)
  if (totalPaginas > 6 && paginaActual > 3) {
    const btnPrimera = document.createElement('button');
    btnPrimera.className = 'btn-pagina btn-pagina-extremo';
    btnPrimera.textContent = '« 1';
    btnPrimera.setAttribute('aria-label', 'Ir a la primera página');
    btnPrimera.title = 'Primera página';
    btnPrimera.addEventListener('click', () => mostrarPagina(1));
    contenedor.appendChild(btnPrimera);
  }

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

  // Botón última página (si hay más de 6 páginas y estamos antes de las últimas 3)
  if (totalPaginas > 6 && paginaActual < totalPaginas - 2) {
    const btnUltima = document.createElement('button');
    btnUltima.className = 'btn-pagina btn-pagina-extremo';
    btnUltima.textContent = `${totalPaginas} »`;
    btnUltima.setAttribute('aria-label', `Ir a la última página (${totalPaginas})`);
    btnUltima.title = 'Última página';
    btnUltima.addEventListener('click', () => mostrarPagina(totalPaginas));
    contenedor.appendChild(btnUltima);
  }

  // Componente de salto rápido a página (cuando hay más de 3 páginas)
  if (totalPaginas > 3) {
    const cajaSalto = document.createElement('div');
    cajaSalto.className = 'paginacion-salto';
    cajaSalto.innerHTML = `
      <label for="paginacionInputSalto">Ir a:</label>
      <input type="number" id="paginacionInputSalto" class="paginacion-salto-input" min="1" max="${totalPaginas}" placeholder="${paginaActual}" aria-label="Número de página a saltar" />
      <span class="paginacion-salto-total">/ ${totalPaginas}</span>
      <button class="btn-salto-pag" type="button" aria-label="Saltar a página">Ir</button>
    `;
    const inputSalto = cajaSalto.querySelector('#paginacionInputSalto');
    const btnSalto = cajaSalto.querySelector('.btn-salto-pag');

    const ejecutarSalto = () => {
      const num = parseInt(inputSalto.value, 10);
      if (num && num >= 1 && num <= totalPaginas && num !== paginaActual) {
        mostrarPagina(num);
      }
    };

    btnSalto.addEventListener('click', ejecutarSalto);
    inputSalto.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ejecutarSalto();
      }
    });

    contenedor.appendChild(cajaSalto);
  }
}

// ── CALCULAR PÁGINAS VISIBLES ──
function paginasVisibles(actual, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);

  if (actual <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (actual >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', actual-1, actual, actual+1, '...', total];
}

// ── NORMALIZAR TEXTO PARA BÚSQUEDA ──
const normalizar = texto => (texto || '')
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// ── PUNTUAR RELEVANCIA DE BÚSQUEDA ──
function puntuarRelevanciaBusqueda(libro, queryNorm, terminos) {
  let score = 0;
  const tituloNorm = normalizar(limpiarTitulo(libro.titulo || ''));
  const autorNorm = normalizar(libro.autor || '');
  const serieNorm = normalizar(libro.serie ? libro.serie.nombre : '');
  const generoNorm = normalizar(libro.genero || '');

  if (tituloNorm === queryNorm) score += 1000;
  else if (tituloNorm.startsWith(queryNorm + ' ') || tituloNorm.startsWith(queryNorm)) score += 500;

  if (serieNorm && (serieNorm === queryNorm || serieNorm.includes(queryNorm))) {
    score += 400;
  }

  // Coincidencia de todos los términos en el título
  if (terminos.every(t => tituloNorm.includes(t))) {
    score += 200;
    const palabrasTitulo = tituloNorm.split(' ');
    if (terminos.every(t => palabrasTitulo.includes(t))) score += 150;
  }

  // Coincidencia de todos los términos en la saga
  if (serieNorm && terminos.every(t => serieNorm.includes(t))) {
    score += 180;
  }

  // Coincidencia en autor
  if (autorNorm === queryNorm) score += 350;
  else if (terminos.every(t => autorNorm.includes(t))) score += 160;

  // Coincidencias individuales por término
  terminos.forEach(t => {
    if (tituloNorm.includes(t)) score += 30;
    if (autorNorm.includes(t)) score += 25;
    if (serieNorm.includes(t)) score += 25;
    if (generoNorm.includes(t)) score += 10;
  });

  return score;
}

// ── RESALTAR COINCIDENCIAS (TOLERANTE A TILDES Y EN UNA SOLA PASADA) ──
function resaltarCoincidencias(texto, terminos) {
  if (!texto) return '';
  const escapado = String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  if (!terminos || terminos.length === 0) return escapado;

  const mapaAcentos = {
    a: '[aáàäâ]', e: '[eéèëê]', i: '[iíìïî]',
    o: '[oóòöô]', u: '[uúùüû]', n: '[nñ]', c: '[cç]'
  };
  const patrones = [...new Set(terminos.filter(t => t.length > 0))]
    .sort((a, b) => b.length - a.length)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aeiounc]/gi, ch => mapaAcentos[ch.toLowerCase()] || ch));

  if (patrones.length === 0) return escapado;
  const regex = new RegExp(`(${patrones.join('|')})`, 'gi');
  return escapado.replace(regex, '<strong>$1</strong>');
}

// ── BÚSQUEDA TOLERANTE A ERRORES (FUZZY SEARCH / DISTANCIA LEVENSHTEIN) ──
function distanciaLevenshtein(a, b) {
  if (a === b) return 0;
  const la = a.length, lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  let curr = new Array(lb + 1);
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const costo = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + costo);
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }
  return prev[lb];
}

function calcularScoreFuzzyLibro(terminos, libro) {
  if (!libro._tokensFuzzy) {
    const rawCompleto = normalizar([
      libro.titulo || '',
      libro.autor || '',
      libro.genero || '',
      libro.serie ? libro.serie.nombre : ''
    ].join(' '));
    const tokensTitulo = normalizar(libro.titulo || '').split(' ').filter(w => w.length > 0);
    const tokensAutor = normalizar(libro.autor || '').split(' ').filter(w => w.length > 0);
    const tokensSaga = normalizar(libro.serie ? libro.serie.nombre : '').split(' ').filter(w => w.length > 0);
    const tokensGenero = normalizar(libro.genero || '').split(' ').filter(w => w.length > 0);
    libro._tokensFuzzy = {
      raw: rawCompleto,
      titulo: tokensTitulo,
      autor: tokensAutor,
      saga: tokensSaga,
      genero: tokensGenero,
      todos: [...tokensTitulo, ...tokensAutor, ...tokensSaga, ...tokensGenero]
    };
  }

  const { raw, titulo, autor, saga, todos } = libro._tokensFuzzy;
  let scoreTotal = 0;

  for (const t of terminos) {
    const len = t.length;
    // Para conectores breves (ej: "y"), verificar presencia en texto normalizado
    if (len <= 1) {
      if (raw.includes(t)) {
        scoreTotal += 10;
        continue;
      } else {
        return 0;
      }
    }

    let mejorMatchTermino = 0;
    for (const w of todos) {
      if (w === t) {
        mejorMatchTermino = Math.max(mejorMatchTermino, 100);
        break;
      }
      if (w.startsWith(t) || t.startsWith(w)) {
        if (Math.abs(w.length - len) <= 3) {
          mejorMatchTermino = Math.max(mejorMatchTermino, 80);
        }
      }
      const maxDist = len <= 3 ? 1 : (len <= 5 ? 1 : 2);
      if (Math.abs(w.length - len) <= maxDist) {
        const dist = distanciaLevenshtein(t, w);
        if (dist <= maxDist) {
          const s = dist === 1 ? 75 : 45;
          mejorMatchTermino = Math.max(mejorMatchTermino, s);
        }
      }
    }

    if (mejorMatchTermino < 40) return 0;

    if (titulo.some(w => w === t || distanciaLevenshtein(t, w) <= (len <= 5 ? 1 : 2))) {
      mejorMatchTermino *= 1.5;
    } else if (saga.some(w => w === t || distanciaLevenshtein(t, w) <= (len <= 5 ? 1 : 2))) {
      mejorMatchTermino *= 1.4;
    } else if (autor.some(w => w === t || distanciaLevenshtein(t, w) <= (len <= 5 ? 1 : 2))) {
      mejorMatchTermino *= 1.2;
    }

    scoreTotal += mejorMatchTermino;
  }

  return scoreTotal;
}

function coincidenTerminosFuzzy(terminos, libro) {
  return calcularScoreFuzzyLibro(terminos, libro) > 0;
}

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
    const inputEl = document.getElementById('inputBusqueda');
    const rawQuery = inputEl ? inputEl.value.trim() : '';
    const queryNorm = normalizar(rawQuery);
    const terminos = queryNorm.split(' ').filter(t => t.length > 0);

    // Si hay búsqueda activa por texto, ordenar por relevancia y orden de saga
    if (terminos.length > 0) {
      const copia = [...lista];
      const cacheScores = new Map();
      copia.forEach(l => cacheScores.set(l.id, puntuarRelevanciaBusqueda(l, queryNorm, terminos)));
      copia.sort((a, b) => {
        if (a.serie && b.serie && a.serie.nombre === b.serie.nombre) {
          const serieNorm = normalizar(a.serie.nombre);
          if (terminos.every(t => serieNorm.includes(t))) {
            return (a.serie.orden || 999) - (b.serie.orden || 999);
          }
        }
        const scoreA = cacheScores.get(a.id) || 0;
        const scoreB = cacheScores.get(b.id) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.serie && b.serie && a.serie.nombre === b.serie.nombre) {
          return (a.serie.orden || 999) - (b.serie.orden || 999);
        }
        return 0;
      });
      return copia;
    }

    // Si hay filtro de saga activo, ordenar por nombre de saga y número de tomo (#1, #2, #3...)
    if (sagaActiva !== 'Todas') {
      const copia = [...lista];
      copia.sort((a, b) => {
        const sagaA = a.serie?.nombre || '';
        const sagaB = b.serie?.nombre || '';
        if (sagaA !== sagaB) return sagaA.localeCompare(sagaB, 'es');
        return (a.serie?.orden || 999) - (b.serie?.orden || 999);
      });
      return copia;
    }

    if (moodActivo !== 'Todos') {
      return shuffle(lista);
    }
    return lista;
  }

  const copia = [...lista];
  switch (ordenActivo) {
    case 'mas-leidos': {
      const scoreMap = new Map();
      rankingMasLeidos.forEach((r, idx) => {
        scoreMap.set(r.id, r.score || (1000 - idx));
      });
      LIBROS_DESTACADOS_IDS.forEach((id, idx) => {
        if (!scoreMap.has(id)) scoreMap.set(id, 50 - idx);
      });
      copia.sort((a, b) => {
        const scoreA = scoreMap.get(a.id) || 0;
        const scoreB = scoreMap.get(b.id) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.anio || 0) - (a.anio || 0);
      });
      break;
    }
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

  const cumpleFiltrosSecundarios = (libro) => {
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
          coincideMood = (typeof libro.paginas === 'number' && libro.paginas <= 150) || gen === 'Cuento' || gen === 'Poesía' || gen === 'Teatro';
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

    let coincideLeyendo = true;
    if (soloLeyendo) {
      const info = obtenerInfoProgreso(libro.id);
      coincideLeyendo = !!(info && info.pagina > 1);
    }

    // Filtro por índice alfabético (A-Z)
    let coincideLetra = true;
    if (letraActiva !== 'Todas') {
      const tituloParaLetra = normalizar(limpiarTitulo(libro.titulo || '')).trim();
      const primera = tituloParaLetra.charAt(0).toUpperCase();
      if (letraActiva === '#') {
        coincideLetra = !/^[A-Z]/.test(primera);
      } else {
        coincideLetra = primera === letraActiva;
      }
    }

    // Filtro por extensión (número de páginas)
    let coincideExtension = true;
    if (extensionActiva !== 'Todas') {
      const pags = libro.paginas || 0;
      switch (extensionActiva) {
        case 'corta': coincideExtension = pags > 0 && pags <= 150; break;
        case 'media': coincideExtension = pags > 150 && pags <= 350; break;
        case 'larga': coincideExtension = pags > 350; break;
      }
    }

    // Filtro por idioma
    let coincideIdioma = true;
    if (idiomaActivo !== 'Todos') {
      coincideIdioma = (libro.idioma || 'es') === idiomaActivo;
    }

    // Filtro por saga / serie
    let coincideSaga = true;
    if (sagaActiva !== 'Todas') {
      if (sagaActiva === '__TODAS__') {
        coincideSaga = !!(libro.serie && libro.serie.nombre);
      } else {
        coincideSaga = !!(libro.serie && libro.serie.nombre && libro.serie.nombre.trim() === sagaActiva);
      }
    }

    return coincideGenero && coincideAutor && coincideEpoca && coincideMood && coincideFavorito && coincideLeyendo && coincideLetra && coincideExtension && coincideIdioma && coincideSaga;
  };

  let esBusquedaFuzzy = false;
  listaFiltrada = librosDePartida.filter(libro => {
    const campos = [
      normalizar(libro.titulo || ''),
      normalizar(libro.autor || ''),
      normalizar(libro.genero || ''),
      normalizar(libro.descripcion || ''),
      normalizar(libro.serie ? libro.serie.nombre : ''),
      String(libro.anio || ''),
    ].join(' ');

    const coincideTexto = terminos.length === 0 || terminos.every(t => campos.includes(t));
    if (!coincideTexto) return false;
    return cumpleFiltrosSecundarios(libro);
  });

  // Si no hubo resultados con búsqueda exacta y hay términos de búsqueda, activar fuzzy search
  if (listaFiltrada.length === 0 && terminos.length > 0) {
    const candidatosFuzzy = [];
    for (const libro of librosDePartida) {
      if (!cumpleFiltrosSecundarios(libro)) continue;
      const score = calcularScoreFuzzyLibro(terminos, libro);
      if (score > 0) {
        candidatosFuzzy.push({ libro, score });
      }
    }

    if (candidatosFuzzy.length > 0) {
      candidatosFuzzy.sort((a, b) => b.score - a.score);
      listaFiltrada = candidatosFuzzy.map(c => c.libro);
      esBusquedaFuzzy = true;
    }
  }

  // Aplicar ordenamiento (si no es búsqueda difusa, para preservar la relevancia de mayor puntaje)
  if (!esBusquedaFuzzy) {
    listaFiltrada = ordenarLista(listaFiltrada);
  }

  // Actualizar título del catálogo dinámicamente
  const titulo = document.getElementById('catalogoTitulo');
  const btnCerrar = document.getElementById('btnCerrarPack');
  if (titulo) {
    if (soloFavoritos) {
      if (coleccionActiva) {
        titulo.textContent = `Favoritos en: ${coleccionActiva.titulo}`;
      } else {
        titulo.textContent = 'Mis Favoritos';
      }
    } else if (soloLeyendo) {
      if (coleccionActiva) {
        titulo.textContent = `Leyendo en: ${coleccionActiva.titulo}`;
      } else {
        titulo.textContent = 'Libros que estoy leyendo';
      }
    } else if (esBusquedaFuzzy) {
      titulo.textContent = `Resultados aproximados para «${raw.trim()}»`;
    } else {
      if (coleccionActiva) {
        titulo.textContent = `Colección: ${coleccionActiva.titulo}`;
      } else if (sagaActiva !== 'Todas') {
        titulo.textContent = sagaActiva === '__TODAS__'
          ? 'Sagas y Series Literarias'
          : `Saga: ${sagaActiva}`;
      } else {
        titulo.textContent = 'Catálogo Completo';
      }
    }
  }
  if (btnCerrar) {
    btnCerrar.style.display = (coleccionActiva || sagaActiva !== 'Todas') ? 'inline-flex' : 'none';
  }

  mostrarPagina(1, true);
  actualizarBreadcrumbs();

  // Refrescar visibilidad de secciones principales
  renderizarColecciones();
  renderizarDestacados();
  renderizarContinuarLeyendo();
}

// ── LIMPIAR BÚSQUEDA ──
function limpiarBusqueda(enfocar = true) {
  const input = document.getElementById('inputBusqueda');
  const btnLimpiar = document.getElementById('btnLimpiarBusqueda');
  const panel = document.getElementById('autocompletarPanel');
  if (input) {
    input.value = '';
    if (enfocar !== false) input.focus();
  }
  if (btnLimpiar) {
    btnLimpiar.style.display = 'none';
  }
  if (panel) {
    panel.innerHTML = '';
    panel.style.display = 'none';
  }
  filtrar();
}

// ── FILTRO POR TAG DE GÉNERO ──
function filtrarGenero(genero, boton) {
  generoActivo = genero;
  if (genero === 'Todos' && sagaActiva !== 'Todas') {
    sagaActiva = 'Todas';
    sincronizarUISaga();
  }
  
  // Desactivar mood tags al usar género tradicional
  moodActivo = 'Todos';
  document.querySelectorAll('.tag-mood-btn').forEach(b => {
    b.classList.remove('activo');
    b.setAttribute('aria-pressed', 'false');
  });

  // Actualizar clase activa en los tags normales
  document.querySelectorAll('.tag-genero:not(.tag-mood-btn):not(.tag-sagas-btn)').forEach(b => b.classList.remove('activo'));
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
      const inputBusqueda = document.getElementById('inputBusqueda');
      const btnLimpiarB = document.getElementById('btnLimpiarBusqueda');
      if (inputBusqueda) inputBusqueda.value = '';
      if (btnLimpiarB) btnLimpiarB.style.display = 'none';
      const inputAutor = document.getElementById('inputDropdownAutor');
      if (inputAutor) inputAutor.value = libro.autor;
      document.querySelectorAll('#menuDropdownAutor .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
      const targetItem = Array.from(document.querySelectorAll('#menuDropdownAutor .dropdown-item')).find(li => li.dataset.valor === libro.autor);
      if (targetItem) targetItem.classList.add('seleccionado');
      const btnClear = document.getElementById('btnLimpiarAutor');
      if (btnClear) btnClear.style.display = 'flex';
      autorActivo = libro.autor;
      filtrar();
      document.querySelector('.catalogo-header-barra')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    autorEl.appendChild(autorLink);
  } else {
    autorEl.textContent = 'Autor desconocido';
  }

  // Saga / Serie
  const serieWrapper = document.getElementById('detalle-serie-wrapper');
  const serieBtn = document.getElementById('detalle-serie-btn');
  const serieTexto = document.getElementById('detalle-serie-texto');
  if (serieWrapper && serieBtn && serieTexto) {
    if (libro.serie && libro.serie.nombre) {
      serieTexto.textContent = `${libro.serie.nombre} · Libro ${libro.serie.orden || ''}`;
      serieWrapper.style.display = 'block';
      serieBtn.onclick = (e) => {
        e.stopPropagation();
        cerrarDetalle();
        limpiarTodo();
        seleccionarSaga(libro.serie.nombre.trim());
      };
    } else {
      serieWrapper.style.display = 'none';
    }
  }

  document.getElementById('detalle-anio').textContent = libro.anio ? `Publicado en ${libro.anio}` : '';

  const infoProg = obtenerInfoProgreso(libro.id);

  const elPag = document.getElementById('detalle-paginas');
  if (elPag) {
    if (libro.paginas) {
      elPag.style.display = 'inline-flex';
      elPag.innerHTML = `<i data-lucide="book-open" class="icono-xs"></i> ${libro.paginas} págs.`;
    } else {
      elPag.style.display = 'none';
    }
  }

  const elIdi = document.getElementById('detalle-idioma');
  if (elIdi) {
    elIdi.style.display = 'inline-flex';
    const esIngles = libro.idioma === 'en';
    elIdi.innerHTML = `<i data-lucide="globe" class="icono-xs"></i> ${esIngles ? 'Inglés' : 'Español'}`;
    elIdi.className = `detalle-meta-pill ${esIngles ? 'detalle-meta-idioma-en' : ''}`;
  }

  const elProg = document.getElementById('detalle-progreso');
  if (elProg) {
    if (infoProg && infoProg.pagina > 1) {
      elProg.style.display = 'inline-flex';
      const pctTxt = infoProg.porcentaje > 0 ? ` (${infoProg.porcentaje}%)` : '';
      elProg.innerHTML = `<i data-lucide="${infoProg.esCompleto ? 'check-circle' : 'bookmark'}" class="icono-xs"></i> ${infoProg.esCompleto ? 'Leído (100%)' : `Leyendo: Pág. ${infoProg.pagina}${pctTxt}`}`;
    } else {
      elProg.style.display = 'none';
    }
  }

  const elMetaFila = document.getElementById('detalle-meta-fila');
  if (elMetaFila && window.lucide) {
    lucide.createIcons({ root: elMetaFila });
  }

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
    const inputBusqueda = document.getElementById('inputBusqueda');
    const btnLimpiarB = document.getElementById('btnLimpiarBusqueda');
    if (inputBusqueda) inputBusqueda.value = '';
    if (btnLimpiarB) btnLimpiarB.style.display = 'none';
    const tagBtn = document.querySelector(`.tag-genero[data-genero="${libro.genero}"]`);
    filtrarGenero(libro.genero, tagBtn);
    document.querySelector('.catalogo-header-barra')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    if (infoProg && infoProg.pagina > 1) {
      if (infoProg.esCompleto) {
        linkPdf.innerHTML = '<i data-lucide="rotate-ccw" class="icono-sm"></i> Releer libro (Completado)';
      } else {
        const pctTxt = infoProg.porcentaje > 0 ? ` · ${infoProg.porcentaje}%` : '';
        linkPdf.innerHTML = `<i data-lucide="play" class="icono-sm"></i> Continuar lectura (Pág. ${infoProg.pagina}${pctTxt})`;
      }
    } else {
      linkPdf.innerHTML = '<i data-lucide="book-open" class="icono-sm"></i> Leer libro';
    }
    linkPdf.onclick = (e) => {
      e.preventDefault();
      cerrarDetalle();
      abrirLector(libro.id, libro);
    };
  } else if (libro.pdf) {
    linkPdf.style.display = 'flex';
    linkPdf.innerHTML = '<i data-lucide="file-text" class="icono-sm"></i> Ver documento';
    linkPdf.onclick = (e) => {
      e.preventDefault();
      window.open(libro.pdf, '_blank', 'noopener,noreferrer');
    };
  } else {
    linkPdf.style.display = 'none';
  }
  if (window.lucide) lucide.createIcons({ root: linkPdf });

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

  // Libros relacionados (priorizar libros de la misma saga en orden, luego mismo autor, luego mismo género)
  let relacionadosSaga = [];
  if (libro.serie && libro.serie.nombre) {
    relacionadosSaga = libros
      .filter(l => l.serie && l.serie.nombre === libro.serie.nombre && l.id !== libro.id)
      .sort((a, b) => (a.serie.orden || 0) - (b.serie.orden || 0))
      .map(l => ({ ...l, relacion: `Vol. ${l.serie.orden || ''} de la saga`, esSaga: true }));
  }

  let relacionados = [...relacionadosSaga];

  if (relacionados.length < 4 && libro.autor) {
    const faltantes = 4 - relacionados.length;
    const relacionadosAutor = libros
      .filter(l => l.autor && libro.autor && l.autor.toLowerCase().trim() === libro.autor.toLowerCase().trim() && l.id !== libro.id && !relacionados.some(r => r.id === l.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, faltantes)
      .map(l => ({ ...l, relacion: 'Mismo autor', esSaga: false }));
    relacionados = relacionados.concat(relacionadosAutor);
  }

  if (relacionados.length < 4 && libro.genero) {
    const faltantes = 4 - relacionados.length;
    const relacionadosGenero = libros
      .filter(l => l.genero === libro.genero && l.id !== libro.id && !relacionados.some(r => r.id === l.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, faltantes)
      .map(l => ({ ...l, relacion: 'Mismo género', esSaga: false }));
    relacionados = relacionados.concat(relacionadosGenero);
  }

  const seccionRelacionados = document.getElementById('detalle-relacionados-seccion');
  const listaRelacionados = document.getElementById('detalle-relacionados');
  if (seccionRelacionados && listaRelacionados) {
    if (relacionados.length > 0) {
      listaRelacionados.innerHTML = '';
      relacionados.forEach(r => {
        const tLimpio = limpiarTitulo(r.titulo);
        const item = document.createElement('div');
        item.className = 'relacionado-item';
        item.innerHTML = `
          ${r.portada 
            ? `<img src="${r.portada}" alt="${tLimpio}" class="relacionado-portada" loading="lazy" width="100" height="150" />` 
            : `<div class="relacionado-portada tarjeta-portada-placeholder"><i data-lucide="book" class="icono-sm"></i></div>`
          }
          <span class="relacionado-badge ${r.esSaga ? 'relacionado-badge-saga' : ''}">${r.relacion}</span>
          <div class="relacionado-titulo">${tLimpio}</div>
          <div class="relacionado-autor">${r.autor || ''}</div>
        `;
        item.addEventListener('click', () => abrirDetalleLibro(r.id));
        listaRelacionados.appendChild(item);
      });
      seccionRelacionados.style.display = 'block';
      if (window.lucide) lucide.createIcons({ root: seccionRelacionados });
    } else {
      seccionRelacionados.style.display = 'none';
    }
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

// ── Abrir / Cerrar modal Compra ──
function abrirModalCompra() {
  const modal = document.getElementById('modalCompra');
  if (!modal) return;
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';

  const inputEmail = document.getElementById('inputEmailCompra');
  const msgEmail = document.getElementById('compraEmailMensaje');
  const estadoMp = document.getElementById('textoMercadoPagoCheckout');
  if (inputEmail) {
    const emailGuardado = localStorage.getItem('libractiva_email_compra') || '';
    if (!inputEmail.value && emailGuardado) inputEmail.value = emailGuardado;
  }
  if (msgEmail) {
    msgEmail.style.display = 'none';
    msgEmail.textContent = '';
  }
  if (estadoMp) {
    estadoMp.style.display = 'none';
  }
  if (window.lucide) lucide.createIcons({ root: modal });

  ultimoElementoEnfocado = document.activeElement;
  const btnCerrar = modal.querySelector('.modal-cerrar');
  if (btnCerrar) setTimeout(() => btnCerrar.focus(), 50);
}

function cerrarModalCompra() {
  const modal = document.getElementById('modalCompra');
  if (modal) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';
    if (ultimoElementoEnfocado) ultimoElementoEnfocado.focus();
  }
}

async function iniciarCheckoutMercadoPago(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('btnMercadoPagoCheckout');
  const inputEmail = document.getElementById('inputEmailCompra');
  const msgEmail = document.getElementById('compraEmailMensaje');
  const estadoMp = document.getElementById('textoMercadoPagoCheckout');

  const email = inputEmail ? inputEmail.value.trim().toLowerCase() : '';
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (email && !regexEmail.test(email)) {
    if (msgEmail) {
      msgEmail.textContent = 'Ingresa un correo electrónico válido o déjalo vacío.';
      msgEmail.className = 'codigo-mensaje error';
      msgEmail.style.display = 'block';
    }
    if (inputEmail) inputEmail.focus();
    return;
  }

  if (msgEmail) {
    msgEmail.style.display = 'none';
    msgEmail.textContent = '';
  }

  if (email) {
    localStorage.setItem('libractiva_email_compra', email);
  }

  if (btn) btn.style.pointerEvents = 'none';
  if (estadoMp) {
    estadoMp.textContent = 'Conectando con Mercado Pago…';
    estadoMp.style.display = 'block';
  }

  try {
    const resp = await fetch('/api/crear-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await resp.json();
    const urlDestino = (resp.ok && data && data.url) ? data.url : 'https://mpago.la/1Ek1HPz';
    window.location.href = urlDestino;
  } catch (err) {
    console.warn('[iniciarCheckoutMercadoPago] Fallback a link directo:', err);
    window.location.href = 'https://mpago.la/1Ek1HPz';
  } finally {
    if (btn) btn.style.pointerEvents = '';
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
  // Verificar límite de usos para usuarios sin código
  if (agotoUsosIA()) {
    mostrarModalLimiteIA();
    return;
  }
  const modal = document.getElementById('modalIA');
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  ultimoElementoEnfocado = document.activeElement;
  volverAPreguntas();
  const btnCerrar = modal.querySelector('.modal-cerrar');
  if (btnCerrar) setTimeout(() => btnCerrar.focus(), 50);
}

function mostrarModalLimiteIA() {
  const modal = document.getElementById('modalLimiteIA');
  if (modal) {
    modal.classList.add('abierto');
    document.body.style.overflow = 'hidden';
    ultimoElementoEnfocado = document.activeElement;
  }
}

function cerrarModalLimiteIA() {
  const modal = document.getElementById('modalLimiteIA');
  if (modal) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';
    if (ultimoElementoEnfocado) ultimoElementoEnfocado.focus();
  }
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let datos = null;
    try {
      datos = await respuesta.json();
    } catch (parseErr) {
      throw new Error('El servicio tardó demasiado en responder (Tiempo de espera agotado). Por favor reintenta.');
    }

    if (!respuesta.ok || !datos || !datos.recomendaciones) {
      throw new Error(datos?.error || 'No se pudo obtener la recomendación. Intenta de nuevo.');
    }

    renderizarResultados(datos.recomendaciones);

    // Incrementar contador de usos solo en usuarios sin código
    if (!esDonadorLocal()) {
      incrementarUsoIA();
      mostrarCTAEnResultadosIA();
      // Actualizar contador en el header del modal si existe
      actualizarContadorUsosIA();
    }

  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Error al pedir recomendación:', err);
    const mensaje = err.name === 'AbortError'
      ? 'La biblioteca tardó más de lo habitual en responder. Por favor reintenta.'
      : (err.message || 'No se pudo obtener una recomendación. Intenta de nuevo.');
    document.getElementById('ia-error-msg').textContent = mensaje;
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
      ${(hasPdf && !esDonador) ? `<span class="badge-preview" aria-label="Vista previa gratuita de 15 páginas"><i data-lucide="eye" class="icono-xs"></i> Vista previa · 15 págs.</span>` : ''}
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
  // Mostrar cuántos usos quedan en resultados
  if (!esDonadorLocal()) actualizarContadorUsosIA();
}

function mostrarCTAEnResultadosIA() {
  const contenedor = document.getElementById('resultados-lista');
  if (!contenedor) return;
  const usosRestantes = Math.max(0, IA_USOS_LIMITE - obtenerUsosIA());
  const ctaEl = document.createElement('div');
  ctaEl.className = 'ia-resultado-cta';
  ctaEl.innerHTML = `
    <p>¿Te gustaron las recomendaciones? Lee estos libros completos y descárgalos en PDF y EPUB.</p>
    ${usosRestantes > 0 ? `<p class="ia-usos-restantes"><i data-lucide="zap" class="icono-xs"></i> Te ${usosRestantes === 1 ? 'queda' : 'quedan'} <strong>${usosRestantes}</strong> consulta${usosRestantes === 1 ? '' : 's'} gratuita${usosRestantes === 1 ? '' : 's'}</p>` : '<p class="ia-usos-restantes ia-usos-agotados"><i data-lucide="alert-triangle" class="icono-xs"></i> Has agotado tus consultas gratuitas</p>'}
    <a href="https://mpago.la/1Ek1HPz" target="_blank" rel="noopener" class="btn-comprar-ia">
      <i data-lucide="sparkles" class="icono-sm"></i> Desbloquear acceso completo — $100 MXN
    </a>
  `;
  if (window.lucide) lucide.createIcons({ root: ctaEl });
  contenedor.appendChild(ctaEl);
}

function actualizarContadorUsosIA() {
  const badge = document.getElementById('ia-usos-badge');
  if (!badge) return;
  if (esDonadorLocal()) {
    badge.style.display = 'none';
    return;
  }
  const usosRestantes = Math.max(0, IA_USOS_LIMITE - obtenerUsosIA());
  badge.innerHTML = `<i data-lucide="zap" class="icono-xs"></i> ${usosRestantes} / ${IA_USOS_LIMITE} consultas gratuitas`;
  badge.className = usosRestantes === 0 ? 'ia-usos-badge ia-badge-agotado' : 'ia-usos-badge';
  badge.style.display = 'inline-flex';
  if (window.lucide) lucide.createIcons({ root: badge });
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

  if (soloFavoritos) {
    items.push({ label: 'Filtro', value: 'Favoritos', type: 'favoritos' });
  }

  if (soloLeyendo) {
    items.push({ label: 'Estantería', value: 'Leyendo ahora', type: 'leyendo' });
  }

  if (letraActiva !== 'Todas') {
    items.push({ label: 'Letra', value: letraActiva, type: 'letra' });
  }

  if (extensionActiva !== 'Todas') {
    let extLabel = extensionActiva === 'corta' ? '< 150 págs.' : (extensionActiva === 'media' ? '150–350 págs.' : '> 350 págs.');
    items.push({ label: 'Extensión', value: extLabel, type: 'extension' });
  }

  if (idiomaActivo !== 'Todos') {
    items.push({ label: 'Idioma', value: idiomaActivo === 'en' ? 'Inglés' : 'Español', type: 'idioma' });
  }

  if (sagaActiva !== 'Todas') {
    items.push({
      label: 'Saga',
      value: sagaActiva === '__TODAS__' ? 'Todas las sagas' : sagaActiva,
      type: 'saga'
    });
  }

  if (coleccionActiva) {
    items.push({ label: 'Colección', value: coleccionActiva.titulo, type: 'coleccion' });
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
      if (item.type === 'texto') limpiarBusqueda(false);
      if (item.type === 'coleccion') quitarColeccion();
      if (item.type === 'saga') {
        sagaActiva = 'Todas';
        sincronizarUISaga();
        filtrar();
      }
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
      if (item.type === 'favoritos') {
        soloFavoritos = false;
        actualizarSegmentoBiblioteca();
        filtrar();
      }
      if (item.type === 'leyendo') {
        soloLeyendo = false;
        actualizarSegmentoBiblioteca();
        filtrar();
      }
      if (item.type === 'letra') {
        letraActiva = 'Todas';
        document.querySelectorAll('.btn-indice-letra').forEach(b => b.classList.toggle('activo', b.dataset.letra === 'Todas'));
        filtrar();
      }
      if (item.type === 'extension') {
        extensionActiva = 'Todas';
        const labelExt = document.getElementById('labelDropdownExtension');
        if (labelExt) labelExt.textContent = 'Extensión';
        document.querySelectorAll('#menuDropdownExtension .dropdown-item').forEach(li => li.classList.toggle('seleccionado', li.dataset.valor === 'Todas'));
        filtrar();
      }
      if (item.type === 'idioma') {
        idiomaActivo = 'Todos';
        const labelIdi = document.getElementById('labelDropdownIdioma');
        if (labelIdi) labelIdi.textContent = 'Idioma';
        document.querySelectorAll('#menuDropdownIdioma .dropdown-item').forEach(li => li.classList.toggle('seleccionado', li.dataset.valor === 'Todos'));
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
  el('btnLimpiarBusqueda')?.addEventListener('click', () => limpiarBusqueda(true));
  el('btnCerrarPack')?.addEventListener('click', quitarColeccion);
  el('btnBuscarClick')?.addEventListener('click', () => {
    const btn = document.getElementById('btnBuscarClick');
    const panel = document.getElementById('autocompletarPanel');
    if (panel) panel.style.display = 'none';
    btn?.classList.add('busqueda-ejecutada');
    filtrar();
    const destino = document.querySelector('.catalogo-header-barra') || document.getElementById('galeria');
    if (destino) {
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => btn?.classList.remove('busqueda-ejecutada'), 500);
  });
  el('btnLimpiarTodo')?.addEventListener('click', limpiarTodo);
  el('btnTema')?.addEventListener('click', alternarTema);

  // Toggle Filtros en Móvil
  el('btnToggleFiltrosMovil')?.addEventListener('click', () => {
    const btn = el('btnToggleFiltrosMovil');
    const controlesDerecha = el('controlesDerecha');
    if (btn && controlesDerecha) {
      const estaAbierto = controlesDerecha.classList.toggle('abierto');
      btn.setAttribute('aria-expanded', estaAbierto ? 'true' : 'false');
      btn.classList.toggle('activo', estaAbierto);
    }
  });

  // Control Segmentado: Vistas de Biblioteca (Todos / Favoritos / Leyendo)
  el('btnSegmentoTodos')?.addEventListener('click', () => {
    if (!soloFavoritos && !soloLeyendo) return;
    soloFavoritos = false;
    soloLeyendo = false;
    actualizarSegmentoBiblioteca();
    paginaActual = 1;
    filtrar();
  });

  // Toggle Favoritos en segmento
  el('btnFavoritos')?.addEventListener('click', () => {
    soloFavoritos = !soloFavoritos;
    if (soloFavoritos) soloLeyendo = false;
    actualizarSegmentoBiblioteca();
    paginaActual = 1;
    filtrar();

    if (soloFavoritos) {
      const catalogoHeader = document.querySelector('.catalogo-header-barra');
      if (catalogoHeader) {
        catalogoHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // Toggle Leyendo en segmento
  el('btnLeyendo')?.addEventListener('click', () => {
    soloLeyendo = !soloLeyendo;
    if (soloLeyendo) soloFavoritos = false;
    actualizarSegmentoBiblioteca();
    paginaActual = 1;
    filtrar();

    if (soloLeyendo) {
      const catalogoHeader = document.querySelector('.catalogo-header-barra');
      if (catalogoHeader) {
        catalogoHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // Ocultar CTA de compra si el usuario ya es donador
  if (esDonadorLocal()) {
    const btnComprar = el('btnComprarHero');
    if (btnComprar) btnComprar.style.display = 'none';
  }

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

  // Modal IA — Límite de usos
  el('btnCerrarLimiteIA')?.addEventListener('click', cerrarModalLimiteIA);
  el('btnCerrarLimiteIACancel')?.addEventListener('click', cerrarModalLimiteIA);
  el('modalLimiteIA')?.addEventListener('click', (e) => {
    if (e.target === el('modalLimiteIA')) cerrarModalLimiteIA();
  });
  el('btnActivarCodigoDesdeIA')?.addEventListener('click', () => {
    cerrarModalLimiteIA();
    abrirModalCodigo(() => {
      // Tras activar código, resetear contador de usos IA (ya es donador)
      localStorage.removeItem(IA_USOS_KEY);
    });
  });
  // Inicializar badge de usos al cargar
  if (!esDonadorLocal()) actualizarContadorUsosIA();

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

  // Modal Compra
  el('btnCerrarCompra')?.addEventListener('click', cerrarModalCompra);
  el('modalCompra')?.addEventListener('click', (e) => {
    if (e.target === el('modalCompra')) cerrarModalCompra();
  });
  el('btnMercadoPagoCheckout')?.addEventListener('click', iniciarCheckoutMercadoPago);

  // Interceptar todos los clics a Mercado Pago para abrir el modal explicativo
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="mpago.la/"]');
    if (link && link.id !== 'btnMercadoPagoCheckout') {
      e.preventDefault();
      cerrarModalCodigo();
      abrirModalCompra();
    }
  });

  // Modal IA — acciones
  el('btnRecomendar')?.addEventListener('click', pedirRecomendacion);
  el('btnVolverIntentar')?.addEventListener('click', volverAPreguntas);
  el('btnVolverError')?.addEventListener('click', volverAPreguntas);

  // Botones de vista
  el('btnVistaGrid')?.addEventListener('click', () => cambiarVista('grid'));
  el('btnVistaLista')?.addEventListener('click', () => cambiarVista('lista'));

  // Botones de carrusel destacados (desplazamiento de 3 tarjetas por clic)
  el('btnCarruselIzq')?.addEventListener('click', () => {
    document.getElementById('destacados-galeria')?.scrollBy({ left: -660, behavior: 'smooth' });
  });
  el('btnCarruselDer')?.addEventListener('click', () => {
    document.getElementById('destacados-galeria')?.scrollBy({ left: 660, behavior: 'smooth' });
  });

  // Botones de carrusel colecciones y sagas
  el('btnColeccionesIzq')?.addEventListener('click', () => {
    document.getElementById('coleccionesGrid')?.scrollBy({ left: -620, behavior: 'smooth' });
  });
  el('btnColeccionesDer')?.addEventListener('click', () => {
    document.getElementById('coleccionesGrid')?.scrollBy({ left: 620, behavior: 'smooth' });
  });

  // Pestañas Colecciones / Sagas en la sección principal
  el('tabVistaColecciones')?.addEventListener('click', () => {
    if (vistaColeccionActiva === 'colecciones') return;
    vistaColeccionActiva = 'colecciones';
    renderizarColecciones();
    document.getElementById('coleccionesGrid')?.scrollTo({ left: 0, behavior: 'smooth' });
  });
  el('tabVistaSagas')?.addEventListener('click', () => {
    if (vistaColeccionActiva === 'sagas') return;
    vistaColeccionActiva = 'sagas';
    renderizarColecciones();
    document.getElementById('coleccionesGrid')?.scrollTo({ left: 0, behavior: 'smooth' });
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
      cerrarModalCompra();
      cerrarModalContacto();
      cerrarModalLimiteIA();
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

  // Limpiar Extensión dropdown
  extensionActiva = 'Todas';
  document.querySelectorAll('#menuDropdownExtension .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
  document.querySelector('#menuDropdownExtension .dropdown-item[data-valor="Todas"]')?.classList.add('seleccionado');
  const labelExt = document.getElementById('labelDropdownExtension');
  if (labelExt) labelExt.textContent = 'Extensión: Todas';

  // Limpiar Idioma dropdown
  idiomaActivo = 'Todos';
  document.querySelectorAll('#menuDropdownIdioma .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
  document.querySelector('#menuDropdownIdioma .dropdown-item[data-valor="Todos"]')?.classList.add('seleccionado');
  const labelIdi = document.getElementById('labelDropdownIdioma');
  if (labelIdi) labelIdi.textContent = 'Idioma: Todos';

  // Limpiar Orden custom
  document.querySelectorAll('#menuDropdownOrden .dropdown-item').forEach(li => li.classList.remove('seleccionado'));
  document.querySelector('#menuDropdownOrden .dropdown-item[data-valor="default"]')?.classList.add('seleccionado');
  const labelOrden = document.getElementById('labelDropdownOrden');
  if (labelOrden) labelOrden.textContent = 'Ordenar: Por defecto';
  ordenActivo = 'default';

  // Limpiar Mood Tags
  moodActivo = 'Todos';
  document.querySelectorAll('.tag-mood-btn').forEach(b => {
    b.classList.remove('activo');
    b.setAttribute('aria-pressed', 'false');
  });

  // Desactivar filtros de vistas personales (Segmentado)
  soloFavoritos = false;
  soloLeyendo = false;
  actualizarSegmentoBiblioteca();

  // Limpiar colección y saga
  coleccionActiva = null;
  sagaActiva = 'Todas';
  sincronizarUISaga();
  const titulo = document.getElementById('catalogoTitulo');
  const btnCerrar = document.getElementById('btnCerrarPack');
  if (titulo) titulo.textContent = 'Catálogo Completo';
  if (btnCerrar) btnCerrar.style.display = 'none';

  // Limpiar Índice A-Z
  letraActiva = 'Todas';
  document.querySelectorAll('.btn-indice-letra').forEach(b => b.classList.toggle('activo', b.dataset.letra === 'Todas'));

  filtrarGenero('Todos', document.querySelector('.tag-genero[data-genero="Todos"]'));
}

function actualizarSegmentoBiblioteca() {
  const btnTodos = document.getElementById('btnSegmentoTodos');
  const btnFav = document.getElementById('btnFavoritos');
  const btnLey = document.getElementById('btnLeyendo');

  const esTodos = !soloFavoritos && !soloLeyendo;
  if (btnTodos) {
    btnTodos.classList.toggle('activo', esTodos);
    btnTodos.setAttribute('aria-selected', esTodos ? 'true' : 'false');
  }
  if (btnFav) {
    btnFav.classList.toggle('activo', soloFavoritos);
    btnFav.setAttribute('aria-selected', soloFavoritos ? 'true' : 'false');
  }
  if (btnLey) {
    btnLey.classList.toggle('activo', soloLeyendo);
    btnLey.setAttribute('aria-selected', soloLeyendo ? 'true' : 'false');
  }
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

    const queryNorm = normalizar(raw);
    const terminos = queryNorm.split(' ').filter(t => t.length > 0);
    if (terminos.length === 0) {
      panel.innerHTML = '';
      panel.style.display = 'none';
      return;
    }
    
    // Buscar primero en título, autor y saga; si no hay, incluir género, año y sinopsis
    let coincidenciasAll = libros.filter(libro => {
      const tituloNorm = normalizar(libro.titulo || '');
      const autorNorm = normalizar(libro.autor || '');
      const serieNorm = normalizar(libro.serie ? libro.serie.nombre : '');
      return terminos.every(t => tituloNorm.includes(t) || autorNorm.includes(t) || serieNorm.includes(t));
    });

    if (coincidenciasAll.length === 0) {
      coincidenciasAll = libros.filter(libro => {
        const campos = [
          normalizar(libro.titulo || ''),
          normalizar(libro.autor || ''),
          normalizar(libro.genero || ''),
          normalizar(libro.descripcion || ''),
          normalizar(libro.serie ? libro.serie.nombre : ''),
          String(libro.anio || ''),
        ].join(' ');
        return terminos.every(t => campos.includes(t));
      });
    }

    let esFuzzyAutocompletado = false;
    if (coincidenciasAll.length === 0) {
      const candidatosFuzzy = [];
      for (const libro of libros) {
        const score = calcularScoreFuzzyLibro(terminos, libro);
        if (score > 0) candidatosFuzzy.push({ libro, score });
      }
      if (candidatosFuzzy.length > 0) {
        candidatosFuzzy.sort((a, b) => b.score - a.score);
        coincidenciasAll = candidatosFuzzy.map(c => c.libro);
        esFuzzyAutocompletado = true;
      }
    }

    if (coincidenciasAll.length === 0) {
      panel.innerHTML = '<div class="autocompletar-item vacio">No se encontraron coincidencias</div>';
      panel.style.display = 'block';
      return;
    }

    // Ordenar sugerencias por relevancia y orden de saga si no es fuzzy
    if (!esFuzzyAutocompletado) {
      const cacheScores = new Map();
      coincidenciasAll.forEach(l => cacheScores.set(l.id, puntuarRelevanciaBusqueda(l, queryNorm, terminos)));
      coincidenciasAll.sort((a, b) => {
        if (a.serie && b.serie && a.serie.nombre === b.serie.nombre) {
          const serieNorm = normalizar(a.serie.nombre);
          if (terminos.every(t => serieNorm.includes(t))) {
            return (a.serie.orden || 999) - (b.serie.orden || 999);
          }
        }
        const scoreA = cacheScores.get(a.id) || 0;
        const scoreB = cacheScores.get(b.id) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.serie && b.serie && a.serie.nombre === b.serie.nombre) {
          return (a.serie.orden || 999) - (b.serie.orden || 999);
        }
        return 0;
      });
    }

    const coincidencias = coincidenciasAll.slice(0, 5);

    panel.innerHTML = '';
    if (esFuzzyAutocompletado) {
      const cabeceraFuzzy = document.createElement('div');
      cabeceraFuzzy.className = 'autocompletar-item-sugerencia-header';
      cabeceraFuzzy.innerHTML = `<span><i data-lucide="sparkles" class="icono-xs"></i> Sugerencias aproximadas para «${resaltarCoincidencias(raw.trim(), [])}»</span>`;
      panel.appendChild(cabeceraFuzzy);
    }

    coincidencias.forEach(libro => {
      const item = document.createElement('div');
      item.className = 'autocompletar-item';
      
      const tituloResaltado = resaltarCoincidencias(limpiarTitulo(libro.titulo), terminos);
      const autorResaltado = resaltarCoincidencias(libro.autor || '', terminos);
      const badgeDerecho = libro.serie
        ? `<span class="autocompletar-genero autocompletar-saga"><i data-lucide="layers" class="icono-xs"></i> ${resaltarCoincidencias(libro.serie.nombre, terminos)} #${libro.serie.orden}</span>`
        : `<span class="autocompletar-genero">${libro.genero || 'General'}</span>`;

      item.innerHTML = `
        ${libro.portada ? `<img src="${libro.portada}" alt="" class="autocompletar-portada" />` : '<div class="autocompletar-portada-vacia"><i data-lucide="book-open" class="icono-sm"></i></div>'}
        <div class="autocompletar-info">
          <div class="autocompletar-titulo">${tituloResaltado}</div>
          <div class="autocompletar-autor">${autorResaltado}</div>
        </div>
        ${badgeDerecho}
      `;
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirDetalleLibro(libro.id);
        panel.style.display = 'none';
        indiceAutocompletar = -1;
      });

      panel.appendChild(item);
    });

    if (coincidenciasAll.length > 5) {
      const verTodos = document.createElement('div');
      verTodos.className = 'autocompletar-item autocompletar-ver-todos';
      verTodos.innerHTML = `<span><i data-lucide="search" class="icono-xs"></i> Ver los <strong>${coincidenciasAll.length}</strong> ${esFuzzyAutocompletado ? 'resultados aproximados' : 'resultados'} para «${resaltarCoincidencias(raw.trim(), [])}»</span>`;
      verTodos.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = 'none';
        indiceAutocompletar = -1;
        filtrar();
        const destino = document.querySelector('.catalogo-header-barra') || document.getElementById('galeria');
        if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      panel.appendChild(verTodos);
    }

    if (window.lucide) lucide.createIcons({ root: panel });
    panel.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (!inputBusqueda.contains(e.target) && !panel.contains(e.target)) {
      panel.style.display = 'none';
    }
  });

  inputBusqueda.addEventListener('keydown', (e) => {
    const items = panel.querySelectorAll('.autocompletar-item:not(.vacio)');
    const panelVisible = panel.style.display !== 'none' && items.length > 0;

    if (e.key === 'ArrowDown' && panelVisible) {
      e.preventDefault();
      indiceAutocompletar = Math.min(indiceAutocompletar + 1, items.length - 1);
      actualizarItemActivo(items);
    } else if (e.key === 'ArrowUp' && panelVisible) {
      e.preventDefault();
      indiceAutocompletar = Math.max(indiceAutocompletar - 1, -1);
      actualizarItemActivo(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (panelVisible && indiceAutocompletar >= 0 && items[indiceAutocompletar]) {
        e.stopPropagation();
        items[indiceAutocompletar].click();
        indiceAutocompletar = -1;
      } else {
        panel.style.display = 'none';
        indiceAutocompletar = -1;
        inputBusqueda.blur();
        filtrar();
        const destino = document.querySelector('.catalogo-header-barra') || document.getElementById('galeria');
        if (destino) {
          destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else if (e.key === 'Escape') {
      if (panel.style.display !== 'none') {
        e.stopPropagation();
        panel.style.display = 'none';
        indiceAutocompletar = -1;
      }
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
        if (labelOrden) {
          const txt = item.textContent.trim();
          labelOrden.textContent = txt.startsWith('Ordenar:') ? txt : `Ordenar: ${txt}`;
        }
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
        if (autorActivo !== 'Todos') {
          menuAutor.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('seleccionado'));
          menuAutor.querySelector('.dropdown-item[data-valor="Todos"]')?.classList.add('seleccionado');
          autorActivo = 'Todos';
          filtrar();
        }
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

    inputAutor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = normalizar(inputAutor.value);
        if (!query) {
          menuAutor.querySelector('.dropdown-item[data-valor="Todos"]')?.click();
          inputAutor.blur();
          return;
        }
        const primerVisible = Array.from(menuAutor.querySelectorAll('.dropdown-item:not([data-valor="Todos"])'))
          .find(item => item.style.display !== 'none');
        if (primerVisible) {
          primerVisible.click();
          inputAutor.blur();
        }
      } else if (e.key === 'Escape') {
        dropdownAutor.classList.remove('abierto');
        inputAutor.blur();
      }
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
          labelEpoca.textContent = labelText.startsWith('Época:') ? labelText : `Época: ${labelText}`;
        }
        dropdownEpoca.classList.remove('abierto');
        btnEpoca.setAttribute('aria-expanded', 'false');
        filtrar();
      });
    });
  }

  // Dropdown Extensión (Páginas)
  const dropdownExt = document.getElementById('dropdownExtension');
  const btnExt = document.getElementById('btnDropdownExtension');
  const menuExt = document.getElementById('menuDropdownExtension');
  const labelExt = document.getElementById('labelDropdownExtension');

  if (btnExt && menuExt) {
    btnExt.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarTodosDropdowns(dropdownExt);
      dropdownExt.classList.toggle('abierto');
      btnExt.setAttribute('aria-expanded', dropdownExt.classList.contains('abierto'));
    });

    menuExt.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        menuExt.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
        item.classList.add('seleccionado');
        extensionActiva = item.dataset.valor;
        if (labelExt) {
          const labelText = item.textContent.trim();
          labelExt.textContent = labelText.startsWith('Extensión:') ? labelText : `Extensión: ${labelText}`;
        }
        dropdownExt.classList.remove('abierto');
        btnExt.setAttribute('aria-expanded', 'false');
        filtrar();
      });
    });
  }

  // Dropdown Idioma
  const dropdownIdioma = document.getElementById('dropdownIdioma');
  const btnIdioma = document.getElementById('btnDropdownIdioma');
  const menuIdioma = document.getElementById('menuDropdownIdioma');
  const labelIdioma = document.getElementById('labelDropdownIdioma');

  if (btnIdioma && menuIdioma) {
    btnIdioma.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarTodosDropdowns(dropdownIdioma);
      dropdownIdioma.classList.toggle('abierto');
      btnIdioma.setAttribute('aria-expanded', dropdownIdioma.classList.contains('abierto'));
    });

    menuIdioma.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        menuIdioma.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('seleccionado'));
        item.classList.add('seleccionado');
        idiomaActivo = item.dataset.valor;
        if (labelIdioma) {
          const labelText = item.textContent.trim();
          labelIdioma.textContent = labelText.startsWith('Idioma:') ? labelText : `Idioma: ${labelText}`;
        }
        dropdownIdioma.classList.remove('abierto');
        btnIdioma.setAttribute('aria-expanded', 'false');
        filtrar();
      });
    });
  }

  // Dropdown Sagas y Series
  const dropdownSaga = document.getElementById('dropdownSaga');
  const btnSaga = document.getElementById('btnDropdownSaga');
  const menuSaga = document.getElementById('menuDropdownSaga');

  if (btnSaga && menuSaga && dropdownSaga) {
    btnSaga.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarTodosDropdowns(dropdownSaga);
      dropdownSaga.classList.toggle('abierto');
      btnSaga.setAttribute('aria-expanded', dropdownSaga.classList.contains('abierto'));
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
      labelEpoca.textContent = labelText.startsWith('Época:') ? labelText : `Época: ${labelText}`;
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

  menuAutor.innerHTML = '<li data-valor="Todos" class="dropdown-item seleccionado" role="option">Autor: Todos</li>';

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
    inputAutor.placeholder = 'Autor: Todos';
    if (btnLimpiarAutor) btnLimpiarAutor.style.display = 'none';
    dropdownAutor.classList.remove('abierto');
    filtrar();
  });
}

function poblarDropdownSagas() {
  const menuSaga = document.getElementById('menuDropdownSaga');
  const dropdownSaga = document.getElementById('dropdownSaga');
  const btnSaga = document.getElementById('btnDropdownSaga');
  if (!menuSaga) return;

  const sagasLista = obtenerSagasAgrupadas();
  const totalLibrosSagas = sagasLista.reduce((acc, s) => acc + s.libros.length, 0);

  menuSaga.innerHTML = '';

  const crearItem = (valor, texto, count = null, seleccionado = false) => {
    const li = document.createElement('li');
    li.className = `dropdown-item ${seleccionado ? 'seleccionado' : ''}`;
    li.dataset.valor = valor;
    li.role = 'option';
    li.textContent = texto;
    if (count !== null) {
      const badge = document.createElement('span');
      badge.className = 'chip-count';
      badge.textContent = count;
      li.appendChild(badge);
    }
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownSaga?.classList.remove('abierto');
      btnSaga?.setAttribute('aria-expanded', 'false');
      if (valor === 'Todas') {
        sagaActiva = 'Todas';
        sincronizarUISaga();
        const btnCerrar = document.getElementById('btnCerrarPack');
        if (btnCerrar && !coleccionActiva) btnCerrar.style.display = 'none';
        filtrar();
      } else {
        seleccionarSaga(valor);
      }
    });
    return li;
  };

  menuSaga.appendChild(crearItem('Todas', 'Todas las obras', null, true));
  menuSaga.appendChild(crearItem('__TODAS__', 'Todas las sagas', sagasLista.length, false));

  sagasLista.forEach(saga => {
    menuSaga.appendChild(crearItem(saga.nombre, saga.nombre, saga.libros.length, false));
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
  const vistaForm = document.getElementById('vistaFormularioCodigo');
  const cajaEntregado = document.getElementById('cajaCodigoEntregado');
  if (modal) {
    modal.classList.add('abierto');
    document.body.style.overflow = 'hidden';
    if (vistaForm) vistaForm.style.display = 'block';
    if (cajaEntregado) cajaEntregado.style.display = 'none';
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

function mostrarCodigoEntregado({ codigo, email, emailEnviado }) {
  const modal = document.getElementById('modalCodigo');
  const vistaForm = document.getElementById('vistaFormularioCodigo');
  const cajaEntregado = document.getElementById('cajaCodigoEntregado');
  const valorEl = document.getElementById('valorCodigoEntregado');
  const notaCorreoEl = document.getElementById('notaCorreoCodigoEntregado');
  const btnCopiar = document.getElementById('btnCopiarCodigoEntregado');
  const btnComenzar = document.getElementById('btnComenzarALeerCodigo');

  if (!modal || !cajaEntregado || !valorEl) return;

  localStorage.setItem('libractiva_mi_codigo', codigo);

  cerrarModalCompra();
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';

  if (vistaForm) vistaForm.style.display = 'none';
  cajaEntregado.style.display = 'block';
  valorEl.textContent = codigo;

  if (notaCorreoEl) {
    if (email && emailEnviado) {
      notaCorreoEl.textContent = `También enviamos una copia de respaldo a ${email}.`;
    } else if (email) {
      notaCorreoEl.textContent = `Guarda este código en un lugar seguro para usarlo en tus otros dispositivos.`;
    } else {
      notaCorreoEl.textContent = `Guarda una captura o copia este código para activar tus otros dispositivos.`;
    }
  }

  if (btnCopiar) {
    btnCopiar.onclick = async () => {
      try {
        await navigator.clipboard.writeText(codigo);
        btnCopiar.innerHTML = '<i data-lucide="check"></i> ¡Copiado!';
        if (window.lucide) lucide.createIcons({ root: btnCopiar });
        setTimeout(() => {
          btnCopiar.innerHTML = '<i data-lucide="copy"></i> Copiar';
          if (window.lucide) lucide.createIcons({ root: btnCopiar });
        }, 2200);
      } catch (_) {
        // Fallback selección manual
        const range = document.createRange();
        range.selectNodeContents(valorEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };
  }

  if (btnComenzar) {
    btnComenzar.onclick = () => {
      cerrarModalCodigo();
      if (typeof _callbackCodigoValidado === 'function') {
        _callbackCodigoValidado();
      }
    };
  }

  if (window.lucide) lucide.createIcons({ root: modal });
}

async function verificarRetornoPagoMercadoPago() {
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get('payment_id') || params.get('collection_id');
  const status = params.get('status') || params.get('collection_status');
  const pagoFlag = params.get('pago');

  if (!paymentId && !pagoFlag) return;

  // Limpiar los query params de Mercado Pago de la barra de direcciones sin recargar
  const urlLimpia = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, urlLimpia);

  if (pagoFlag === 'pendiente' || status === 'pending' || status === 'in_process') {
    abrirModalCodigo();
    mostrarMensajeCodigo(
      'Tu pago está en proceso de acreditación por Mercado Pago. En cuanto se acredite recibirás tu código por correo o podrás escribir aquí tu número de operación.',
      'exito'
    );
    return;
  }

  if (!paymentId) return;

  abrirModalCodigo();
  mostrarMensajeCodigo('Verificando tu aportación con Mercado Pago y generando tu código…', 'exito');

  try {
    const emailGuardado = localStorage.getItem('libractiva_email_compra') || '';
    const resp = await fetch('/api/verificar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, email: emailGuardado }),
    });
    const data = await resp.json();

    if (resp.ok && data.valido && data.codigo) {
      localStorage.setItem('esDonador', 'true');
      localStorage.removeItem(IA_USOS_KEY);
      actualizarBtnCodigo(true);
      mostrarPagina(paginaActual, false);
      renderizarDestacados();
      mostrarCodigoEntregado(data);
    } else if (data && data.pendiente) {
      mostrarMensajeCodigo(
        data.error || 'Tu pago sigue procesándose. Cuando se acredite, ingresa tu número de operación aquí.',
        'exito'
      );
    } else {
      mostrarMensajeCodigo(
        (data && data.error) || 'No pudimos verificar el pago automáticamente. Ingresa tu número de operación de Mercado Pago aquí.',
        'error'
      );
    }
  } catch (err) {
    console.error('[verificarRetornoPagoMercadoPago]', err);
    mostrarMensajeCodigo(
      'Error de conexión al verificar el pago. Puedes ingresar tu número de operación de Mercado Pago directamente en este campo.',
      'error'
    );
  }
}

async function validarCodigo() {
  const input = document.getElementById('inputCodigoDonador');
  const btn = document.getElementById('btnValidarCodigo');
  const msg = document.getElementById('codigoMensaje');
  const codigo = input ? input.value.trim() : '';

  if (!codigo) {
    mostrarMensajeCodigo('Escribe tu código de acceso o número de operación de Mercado Pago.', 'error');
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
      localStorage.removeItem(IA_USOS_KEY);
      // Actualizar botón de código en el hero y ocultar botón de compra
      actualizarBtnCodigo(true);
      mostrarPagina(paginaActual, false);
      renderizarDestacados();

      if (data.recuperadoPorFolio && data.codigo) {
        mostrarCodigoEntregado(data);
        return;
      }

      mostrarMensajeCodigo(`¡Acceso activado! Tienes acceso completo en ${data.dispositivos}/${data.limite} dispositivos.`, 'exito');
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
  const btnComprar = document.getElementById('btnComprarHero');
  if (btnComprar) {
    btnComprar.style.display = esDonador ? 'none' : '';
  }
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
  historyPushed: false, // Flag para saber si se empujó estado al historial
  marcadoresPanelAbierto: false, // Panel de marcadores
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
  // Mostrar botones de marcadores solo a donadores
  const btnMarcadores = document.getElementById('lectorBtnMarcadores');
  const btnVerMarcadores = document.getElementById('lectorBtnVerMarcadores');
  if (btnMarcadores) {
    btnMarcadores.style.display = lectorEstado.esDonador ? 'flex' : 'none';
  }
  if (btnVerMarcadores) {
    btnVerMarcadores.style.display = lectorEstado.esDonador ? 'flex' : 'none';
  }
  // Cerrar panel de marcadores al abrir nuevo libro
  cerrarPanelMarcadores();

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  lucide.createIcons();

  // Push state to history to handle back button closing the reader
  if (window.history && window.history.pushState && !lectorEstado.historyPushed) {
    window.history.pushState({ lector: true }, '');
    lectorEstado.historyPushed = true;
  }

  try {
    // 1. Obtener URL firmada del servidor
    const resp = await fetch(`/api/leer?id=${encodeURIComponent(libroId)}`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      alert(err.error || 'No se pudo cargar el libro. Inténtalo de nuevo.');
      cerrarLector();
      return;
    }
    const data = await resp.json();
    const url = data.url;

    // Sincronizar estado de donador validado por cookie en el servidor
    if (typeof data.esDonador === 'boolean') {
      lectorEstado.esDonador = data.esDonador;
      if (data.esDonador) {
        localStorage.setItem('esDonador', 'true');
      } else {
        localStorage.removeItem('esDonador');
      }
      actualizarBtnCodigo(lectorEstado.esDonador);
      if (btnDescarga) {
        btnDescarga.style.display = (lectorEstado.esDonador && libro.archivo_pdf) ? 'flex' : 'none';
      }
      if (btnDescargaEpub) {
        btnDescargaEpub.style.display = (lectorEstado.esDonador && libro.archivo_epub) ? 'flex' : 'none';
      }
      const btnMarcadores = document.getElementById('lectorBtnMarcadores');
      const btnVerMarcadores = document.getElementById('lectorBtnVerMarcadores');
      if (btnMarcadores) btnMarcadores.style.display = lectorEstado.esDonador ? 'flex' : 'none';
      if (btnVerMarcadores) btnVerMarcadores.style.display = lectorEstado.esDonador ? 'flex' : 'none';
    }

    // 2. Cargar PDF con PDF.js (lazy, solo la primera vez)
    const pdfjsLib = await cargarPDFJS();

    const pdfDoc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
    lectorEstado.pdf = pdfDoc;
    lectorEstado.totalPaginas = pdfDoc.numPages;

    actualizarInfoPagina();

    // Calcular escala inicial para ajustar al ancho del contenedor
    await calcularEscalaFit();

    const savedPage = obtenerProgresoLectura(libroId);
    const maxPaginaPermitida = lectorEstado.esDonador ? lectorEstado.totalPaginas : 15;
    if (savedPage && savedPage > 1 && savedPage <= maxPaginaPermitida) {
      if (cargando) cargando.style.display = 'none';
      if (canvas) canvas.style.display = 'none';

      const panelContinuar = document.getElementById('lectorContinuar');
      const labelPagina = document.getElementById('lectorContinuarPagina');
      const btnSi = document.getElementById('btnLectorContinuarSi');
      const btnNo = document.getElementById('btnLectorContinuarNo');

      if (panelContinuar && labelPagina) {
        labelPagina.textContent = savedPage;
        panelContinuar.style.display = 'flex';

        btnSi.onclick = async () => {
          panelContinuar.style.display = 'none';
          if (canvas) canvas.style.display = 'block';
          await renderizarPagina(savedPage);
        };

        btnNo.onclick = async () => {
          panelContinuar.style.display = 'none';
          if (canvas) canvas.style.display = 'block';
          await renderizarPagina(1);
        };
      } else {
        if (canvas) canvas.style.display = 'block';
        await renderizarPagina(1);
      }
    } else {
      if (cargando) cargando.style.display = 'none';
      if (canvas) canvas.style.display = 'block';
      await renderizarPagina(lectorEstado.pagina);
    }

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

  // Sincronizar estado de página
  lectorEstado.pagina = numeroPagina;

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
    // Guardar progreso de lectura
    if (lectorEstado.libroId) {
      guardarProgresoLectura(lectorEstado.libroId, numeroPagina);
    }
    // Actualizar estado visual del botón de marcar página
    if (lectorEstado.esDonador) actualizarBtnMarcador();
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

function cerrarLector(volverAtras = true) {
  const modal = document.getElementById('modalLector');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  const panelContinuar = document.getElementById('lectorContinuar');
  if (panelContinuar) panelContinuar.style.display = 'none';
  cerrarPanelMarcadores();

  if (lectorEstado.renderTask) {
    try { lectorEstado.renderTask.cancel(); } catch (_) {}
  }
  lectorEstado.pdf = null;
  lectorEstado.pagina = 1;

  if (volverAtras && lectorEstado.historyPushed) {
    lectorEstado.historyPushed = false;
    window.history.back();
  }

  if (typeof renderizarContinuarLeyendo === 'function') {
    renderizarContinuarLeyendo();
  }
}

// ── SISTEMA DE MARCADORES EN EL LECTOR ──

function actualizarBtnMarcador() {
  const btn = document.getElementById('lectorBtnMarcadores');
  if (!btn || !lectorEstado.libroId) return;
  const marcado = esPaginaMarcada(lectorEstado.libroId, lectorEstado.pagina);
  btn.classList.toggle('marcador-activo', marcado);
  btn.title = marcado ? `Quitar marcador (pág. ${lectorEstado.pagina})` : `Marcar página ${lectorEstado.pagina}`;
}

function renderizarPanelMarcadores() {
  const panel = document.getElementById('lectorMarcadoresPanel');
  if (!panel || !lectorEstado.libroId) return;
  const marcadores = obtenerMarcadores(lectorEstado.libroId);
  if (marcadores.length === 0) {
    panel.innerHTML = `
      <div class="marcadores-panel-header">
        <span><i data-lucide="bookmark" class="icono-sm"></i> Mis marcadores</span>
        <button class="marcadores-cerrar-btn" onclick="cerrarPanelMarcadores()" aria-label="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <p class="marcadores-vacio">Aún no has marcado ninguna página.<br>Pulsa el botón de marcador para guardar la página actual.</p>
    `;
  } else {
    const items = marcadores.map(pag => `
      <div class="marcador-item ${pag === lectorEstado.pagina ? 'marcador-item-actual' : ''}" data-pag="${pag}">
        <span class="marcador-icono"><i data-lucide="bookmark" class="icono-xs"></i></span>
        <span class="marcador-pag">Página ${pag}</span>
        <button class="marcador-ir-btn" data-pag="${pag}" title="Ir a pág. ${pag}">Ir</button>
        <button class="marcador-del-btn" data-pag="${pag}" title="Eliminar marcador" aria-label="Eliminar marcador pág. ${pag}"><i data-lucide="trash-2"></i></button>
      </div>
    `).join('');
    panel.innerHTML = `
      <div class="marcadores-panel-header">
        <span><i data-lucide="bookmark" class="icono-sm"></i> Mis marcadores (${marcadores.length})</span>
        <button class="marcadores-cerrar-btn" onclick="cerrarPanelMarcadores()" aria-label="Cerrar"><i data-lucide="x"></i></button>
      </div>
      <div class="marcadores-lista">${items}</div>
    `;
    // Ir a página al hacer clic en "Ir"
    panel.querySelectorAll('.marcador-ir-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pag = parseInt(btn.dataset.pag, 10);
        await renderizarPagina(pag);
        cerrarPanelMarcadores();
      });
    });
    // Eliminar marcador
    panel.querySelectorAll('.marcador-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pag = parseInt(btn.dataset.pag, 10);
        toggleMarcador(lectorEstado.libroId, pag);
        actualizarBtnMarcador();
        renderizarPanelMarcadores();
      });
    });
  }
  if (window.lucide) lucide.createIcons({ root: panel });
}

function abrirPanelMarcadores() {
  const panel = document.getElementById('lectorMarcadoresPanel');
  if (!panel) return;
  lectorEstado.marcadoresPanelAbierto = true;
  renderizarPanelMarcadores();
  panel.style.display = 'flex';
  panel.classList.add('abierto');
}

function cerrarPanelMarcadores() {
  const panel = document.getElementById('lectorMarcadoresPanel');
  if (!panel) return;
  lectorEstado.marcadoresPanelAbierto = false;
  panel.style.display = 'none';
  panel.classList.remove('abierto');
}

function inicializarLector() {
  const btnPrev = document.getElementById('lectorBtnPrev');
  const btnNext = document.getElementById('lectorBtnNext');
  const btnZoomIn = document.getElementById('lectorBtnZoomIn');
  const btnZoomOut = document.getElementById('lectorBtnZoomOut');
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

  // Botón de marcadores
  const btnMarcadores = document.getElementById('lectorBtnMarcadores');
  if (btnMarcadores) {
    btnMarcadores.addEventListener('click', () => {
      if (!lectorEstado.libroId) return;
      toggleMarcador(lectorEstado.libroId, lectorEstado.pagina);
      actualizarBtnMarcador();
      if (lectorEstado.marcadoresPanelAbierto) {
        renderizarPanelMarcadores();
      }
    });
  }

  // Botón para ver lista de marcadores (si se define por separado)
  const btnVerMarcadores = document.getElementById('lectorBtnVerMarcadores');
  if (btnVerMarcadores) {
    btnVerMarcadores.addEventListener('click', () => {
      if (lectorEstado.marcadoresPanelAbierto) {
        cerrarPanelMarcadores();
      } else {
        abrirPanelMarcadores();
      }
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
        // Mostrar botones de marcadores al activar código
        const btnMarc = document.getElementById('lectorBtnMarcadores');
        if (btnMarc) btnMarc.style.display = 'flex';
        const btnVerMarc = document.getElementById('lectorBtnVerMarcadores');
        if (btnVerMarc) btnVerMarc.style.display = 'flex';

        const bloqueo = document.getElementById('lectorBloqueo');
        if (bloqueo) bloqueo.style.display = 'none';
        await renderizarPagina(lectorEstado.pagina);
        actualizarBtnMarcador();
        lucide.createIcons();
      });
    });
  }

  // Navegación con teclado cuando el lector está abierto
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('modalLector');
    if (!modal || modal.style.display === 'none') return;

    // Ignorar flechas de navegación si el diálogo de continuar lectura está activo
    const panelContinuar = document.getElementById('lectorContinuar');
    if (panelContinuar && panelContinuar.style.display !== 'none') {
      if (e.key === 'Escape') cerrarLector();
      return;
    }

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

  // Handle mobile back button to close modal reader
  window.addEventListener('popstate', (e) => {
    const modal = document.getElementById('modalLector');
    if (modal && modal.style.display === 'flex') {
      cerrarLector(false);
    }
  });
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
