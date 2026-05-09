// ── VARIABLES GLOBALES ──
let libros = [];
let generoActivo = 'Todos';
let paginaActual = 1;
const LIBROS_POR_PAGINA = 24;
let listaFiltrada = [];
let ordenActivo = 'default'; // default | titulo-asc | titulo-desc | autor-asc | anio-asc | anio-desc

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

// ── MAPA DE EMOJIS POR GÉNERO ──
const generoEmojiMap = {
  'Novela': '📕',
  'Ensayo': '📝',
  'Ciencia Ficción': '🚀',
  'Cuento': '📖',
  'Filosofía': '🧠',
  'Fantasía': '🐉',
  'Misterio y Thriller': '🔍',
  'Divulgación Científica': '🔬',
  'Romance': '💕',
  'Terror': '👻',
  'Poesía': '🌹',
  'Teatro': '🎭',
  'Novela histórica': '⚔️',
  'Psicología y Autoayuda': '🧩',
  'Historia y Crónica': '📜',
  'Biografía y Memorias': '👤',
  'Novela juvenil': '🌟',
  'Novela negra': '🕵️',
  'Otro': '📚',
  'Epistolar': '✉️',
  'Economía y Política': '📊',
  'Religión y Teología': '⛪',
  'Literatura latinoamericana': '🌎',
  'Todos': '📖',
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

// ── CARGAR LIBROS AL INICIAR ──
fetch('libros.json')
  .then(respuesta => {
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    return respuesta.json();
  })
  .then(datos => {
    libros = datos;
    listaFiltrada = libros;
    mostrarPagina(1);
    inicializarPagina();
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

  // Selector de ordenamiento
  const selectOrden = document.getElementById('selectOrden');
  if (selectOrden) {
    selectOrden.addEventListener('change', (e) => {
      ordenActivo = e.target.value;
      filtrar();
    });
  }

  // Registrar TODOS los event listeners (zero onclick inline)
  registrarEventos();

  // Modo oscuro
  inicializarTema();

  // Rutas hash
  manejarRutaHash();
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

  // Ordenar por cantidad (mayor a menor), excluir los muy pequeños
  const generosOrdenados = Object.entries(conteo)
    .filter(([, c]) => c >= 1) // Todos los géneros
    .sort((a, b) => b[1] - a[1]);

  contenedor.innerHTML = '';

  // Tag "Todos"
  const btnTodos = document.createElement('button');
  btnTodos.className = 'tag-genero activo';
  btnTodos.dataset.genero = 'Todos';
  btnTodos.textContent = `📖 Todos`;
  btnTodos.addEventListener('click', () => filtrarGenero('Todos', btnTodos));
  contenedor.appendChild(btnTodos);

  // Tags por género
  generosOrdenados.forEach(([genero, cantidad]) => {
    const emoji = generoEmojiMap[genero] || '📚';
    const btn = document.createElement('button');
    btn.className = 'tag-genero';
    btn.dataset.genero = genero;
    btn.textContent = `${emoji} ${genero}`;
    btn.title = `${cantidad} libros`;
    btn.addEventListener('click', () => filtrarGenero(genero, btn));
    contenedor.appendChild(btn);
  });
}

// ── MOSTRAR PÁGINA ──
function mostrarPagina(pagina, omitirScroll = false) {
  paginaActual = pagina;
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

  lista.forEach((libro, i) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.style.animationDelay = `${i * 0.03}s`;

    const claseGenero = obtenerClaseGenero(libro.genero);
    const tituloLimpio = limpiarTitulo(libro.titulo);

    tarjeta.innerHTML = `
      ${libro.portada ? `<img src="${libro.portada}" alt="${tituloLimpio}" class="tarjeta-portada" loading="lazy" />` : ''}
      <div class="tarjeta-info" data-libro-id="${libro.id}" style="cursor:pointer">
        <span class="tarjeta-genero-badge ${claseGenero}">${libro.genero || 'General'}</span>
        <div class="tarjeta-titulo">${tituloLimpio}</div>
        <div class="tarjeta-autor">${libro.autor || ''}</div>
        <div class="tarjeta-anio">${libro.anio || ''}</div>
        <div class="tarjeta-descripcion">${libro.descripcion || ''}</div>
      </div>
      <a href="${libro.pdf}" target="_blank" class="btn-ver">📄 Ver documento</a>
    `;
    tarjeta.querySelector('.tarjeta-info').addEventListener('click', () => abrirDetalleLibro(libro.id));
    galeria.appendChild(tarjeta);
  });
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
  btnAnterior.addEventListener('click', () => { if (paginaActual > 1) mostrarPagina(paginaActual - 1); });
  contenedor.appendChild(btnAnterior);

  // Páginas numeradas con elipsis
  const paginas = paginasVisibles(paginaActual, totalPaginas);
  paginas.forEach(p => {
    if (p === '...') {
      const elipsis = document.createElement('span');
      elipsis.className = 'pagina-elipsis';
      elipsis.textContent = '…';
      contenedor.appendChild(elipsis);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn-pagina' + (p === paginaActual ? ' activo' : '');
      btn.textContent = p;
      btn.addEventListener('click', () => mostrarPagina(p));
      contenedor.appendChild(btn);
    }
  });

  // Botón siguiente
  const btnSiguiente = document.createElement('button');
  btnSiguiente.className = 'btn-pagina' + (paginaActual === totalPaginas ? ' desactivado' : '');
  btnSiguiente.textContent = '→';
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
function ordenarLista(lista) {
  if (ordenActivo === 'default') return lista;

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

  listaFiltrada = libros.filter(libro => {
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
      
      // Si el filtro es compuesto (ej: "Misterio y Thriller"), separamos por "y"
      const partesFiltro = generoActivo.includes(' y ') 
        ? generoActivo.split(' y ').map(p => normalizar(p.trim()))
        : [genFiltro];
        
      coincideGenero = partesFiltro.some(p => genLibro.includes(p));
    }

    return coincideTexto && coincideGenero;
  });

  // Aplicar ordenamiento
  listaFiltrada = ordenarLista(listaFiltrada);

  mostrarPagina(1, true); // Omitimos el scroll al buscar o filtrar
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
  
  // Actualizar clase activa en los tags
  document.querySelectorAll('.tag-genero').forEach(b => b.classList.remove('activo'));
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
  document.getElementById('detalle-autor').textContent = libro.autor || 'Autor desconocido';
  document.getElementById('detalle-anio').textContent = libro.anio ? `Publicado en ${libro.anio}` : '';
  document.getElementById('detalle-descripcion').textContent = libro.descripcion || 'Sin descripción disponible.';
  
  const badge = document.getElementById('detalle-genero');
  badge.textContent = libro.genero || 'General';
  badge.className = `tarjeta-genero-badge ${claseGenero}`;

  const detallePortada = document.getElementById('detalle-portada');
  if (libro.portada && detallePortada) {
    detallePortada.src = libro.portada;
    detallePortada.alt = tituloLimpio;
    detallePortada.style.display = 'block';
  } else if (detallePortada) {
    detallePortada.style.display = 'none';
  }

  const linkPdf = document.getElementById('detalle-pdf-link');
  linkPdf.href = libro.pdf;

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

  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';

  if (!omitirPush) {
    history.pushState(null, '', '#/libro/' + id);
  }
}

function cerrarDetalle(omitirPush = false) {
  const modal = document.getElementById('modalDetalle');
  if (modal && modal.classList.contains('abierto')) {
    modal.classList.remove('abierto');
    document.body.style.overflow = '';

    if (!omitirPush && window.location.hash.startsWith('#/libro/')) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }
}

// ════════════════════════════════════════════════════════
// RECOMENDADOR IA
// ════════════════════════════════════════════════════════

// Estado interno de las selecciones
const iaSeleccion = { estado: null, tiempo: null, objetivo: null };

// ── Abrir / Cerrar modal ──
function abrirModalIA() {
  document.getElementById('modalIA').classList.add('abierto');
  document.body.style.overflow = 'hidden';
  volverAPreguntas();
}

function cerrarModalIA() {
  document.getElementById('modalIA').classList.remove('abierto');
  document.body.style.overflow = '';
}


// ── Selección de opciones (botones tipo chip) ──
function seleccionarOpcion(boton, grupo) {
  const contenedor = document.getElementById(`opciones-${grupo}`);
  contenedor.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
  boton.classList.add('seleccionado');
  iaSeleccion[grupo] = boton.dataset.valor;
}

// ── Resetear el modal al estado de preguntas ──
function volverAPreguntas() {
  mostrarPaso('ia-preguntas');
  document.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
  document.getElementById('ia-tema').value = '';
  iaSeleccion.estado   = null;
  iaSeleccion.tiempo   = null;
  iaSeleccion.objetivo = null;
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
  if (!iaSeleccion.estado || !iaSeleccion.tiempo || !iaSeleccion.objetivo) {
    ['estado', 'tiempo', 'objetivo'].forEach(grupo => {
      if (!iaSeleccion[grupo]) {
        const contenedor = document.getElementById(`opciones-${grupo}`);
        contenedor.style.outline = '2px solid var(--vino)';
        contenedor.style.borderRadius = '6px';
        setTimeout(() => {
          contenedor.style.outline = '';
        }, 2000);
      }
    });
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

  recomendaciones.forEach((rec, i) => {
    const libro = libros.find(l => l.id === rec.id);
    if (!libro) return;

    const tituloLimpio = limpiarTitulo(libro.titulo);

    const tarjeta = document.createElement('div');
    tarjeta.className = 'resultado-tarjeta';
    tarjeta.innerHTML = `
      <div class="resultado-num">Recomendación ${nums[i] || i + 1}</div>
      <div class="resultado-titulo">${tituloLimpio}</div>
      <div class="resultado-autor">${libro.autor}${libro.anio ? ` · ${libro.anio}` : ''}</div>
      <div class="resultado-razon">${rec.razon}</div>
      <a href="${libro.pdf}" target="_blank" rel="noopener" class="resultado-btn">
        📄 Abrir documento
      </a>
    `;
    lista.appendChild(tarjeta);
  });

  mostrarPaso('ia-resultados');
  document.querySelector('#modalIA .modal-panel').scrollTop = 0;
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
  el('btnLimpiarTodo')?.addEventListener('click', limpiarTodo);
  el('btnTema')?.addEventListener('click', alternarTema);

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

  // Modal IA — acciones
  el('btnRecomendar')?.addEventListener('click', pedirRecomendacion);
  el('btnVolverIntentar')?.addEventListener('click', volverAPreguntas);
  el('btnVolverError')?.addEventListener('click', volverAPreguntas);

  // Opciones de la IA (delegación por data-grupo)
  document.querySelectorAll('.opcion-btn[data-grupo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const grupo = btn.dataset.grupo;
      const contenedor = btn.closest('.opciones-grid');
      contenedor.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
      btn.classList.add('seleccionado');
      iaSeleccion[grupo] = btn.dataset.valor;
    });
  });

  // Tecla Escape para cerrar modales
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarModalIA();
      cerrarDetalle();
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
  btn.textContent = esDark ? '☀️' : '🌙';
}

// ════════════════════════════════════════════════════════
// LIMPIAR TODO
// ════════════════════════════════════════════════════════

function limpiarTodo() {
  document.getElementById('inputBusqueda').value = '';
  document.getElementById('btnLimpiarBusqueda').style.display = 'none';
  document.getElementById('selectOrden').value = 'default';
  ordenActivo = 'default';
  filtrarGenero('Todos', document.querySelector('.tag-genero[data-genero="Todos"]'));
}