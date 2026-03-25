// ── VARIABLES GLOBALES ──
let libros = [];
let generoActivo = 'Todos';
let paginaActual = 1;
const LIBROS_POR_PAGINA = 24;
let listaFiltrada = [];

// ── CARGAR LIBROS AL INICIAR ──
fetch('libros.json')
  .then(respuesta => respuesta.json())
  .then(datos => {
    libros = datos;
    listaFiltrada = libros;
    mostrarPagina(1);
  });

// ── MOSTRAR PÁGINA ──
function mostrarPagina(pagina) {
  paginaActual = pagina;
  const inicio = (pagina - 1) * LIBROS_POR_PAGINA;
  const fin = inicio + LIBROS_POR_PAGINA;
  const paginaLibros = listaFiltrada.slice(inicio, fin);

  mostrarLibros(paginaLibros);
  renderPaginacion();

  // Scroll suave arriba al cambiar página
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  lista.forEach(libro => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = `
      <div class="tarjeta-info">
        <span class="tarjeta-genero-badge">${libro.genero}</span>
        <div class="tarjeta-titulo">${libro.titulo}</div>
        <div class="tarjeta-autor">${libro.autor}</div>
        <div class="tarjeta-anio">${libro.anio || ''}</div>
        <div class="tarjeta-descripcion">${libro.descripcion || ''}</div>
      </div>
      <a href="${libro.pdf}" target="_blank" class="btn-ver">📄 Ver documento</a>
    `;
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
  btnAnterior.onclick = () => { if (paginaActual > 1) mostrarPagina(paginaActual - 1); };
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
      btn.onclick = () => mostrarPagina(p);
      contenedor.appendChild(btn);
    }
  });

  // Botón siguiente
  const btnSiguiente = document.createElement('button');
  btnSiguiente.className = 'btn-pagina' + (paginaActual === totalPaginas ? ' desactivado' : '');
  btnSiguiente.textContent = '→';
  btnSiguiente.onclick = () => { if (paginaActual < totalPaginas) mostrarPagina(paginaActual + 1); };
  contenedor.appendChild(btnSiguiente);
}

// ── CALCULAR PÁGINAS VISIBLES ──
function paginasVisibles(actual, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);

  if (actual <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (actual >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total];
  return [1, '...', actual-1, actual, actual+1, '...', total];
}

// ── BÚSQUEDA ──
function filtrar() {
  const raw = document.getElementById('inputBusqueda').value;

  const normalizar = texto => texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

  mostrarPagina(1); // Siempre volver a página 1 al buscar
}

// ── FILTRO POR SELECT ──
function filtrarPorSelect() {
  const select = document.getElementById('selectGenero');
  generoActivo = select.value;
  filtrar();
}

// ── FILTRO POR BOTÓN (por si lo usas en algún lado) ──
function filtrarGenero(genero, boton) {
  generoActivo = genero;
  document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('activo'));
  if (boton) boton.classList.add('activo');
  filtrar();
}

// ════════════════════════════════════════════════════════
// RECOMENDADOR IA
// ════════════════════════════════════════════════════════

// Estado interno de las selecciones
const iaSeleccion = { estado: null, tiempo: null, objetivo: null };

// ── Abrir / Cerrar modal ──
function abrirModalIA() {
  document.getElementById('modalIA').classList.add('abierto');
  document.body.style.overflow = 'hidden'; // Bloquea scroll del fondo
  volverAPreguntas(); // Siempre arranca desde el inicio
}

function cerrarModalIA() {
  document.getElementById('modalIA').classList.remove('abierto');
  document.body.style.overflow = '';
}

// Cerrar si el usuario hace clic fuera del panel
function cerrarModalSiOverlay(event) {
  if (event.target === document.getElementById('modalIA')) {
    cerrarModalIA();
  }
}

// Tecla Escape para cerrar
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModalIA();
});

// ── Selección de opciones (botones tipo chip) ──
function seleccionarOpcion(boton, grupo) {
  // Quita la selección previa en ese grupo
  const contenedor = document.getElementById(`opciones-${grupo}`);
  contenedor.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
  // Marca el nuevo
  boton.classList.add('seleccionado');
  iaSeleccion[grupo] = boton.dataset.valor;
}

// ── Resetear el modal al estado de preguntas ──
function volverAPreguntas() {
  mostrarPaso('ia-preguntas');
  // Limpia selecciones visuales
  document.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('seleccionado'));
  document.getElementById('ia-tema').value = '';
  iaSeleccion.estado   = null;
  iaSeleccion.tiempo   = null;
  iaSeleccion.objetivo = null;
  // Scroll al inicio del modal
  document.querySelector('.modal-panel').scrollTop = 0;
}

// ── Mostrar uno de los pasos del modal ──
function mostrarPaso(idActivo) {
  ['ia-preguntas', 'ia-cargando', 'ia-resultados', 'ia-error'].forEach(id => {
    document.getElementById(id).style.display = (id === idActivo) ? 'flex' : 'none';
  });
}

// ── Pedir recomendación a la API ──
async function pedirRecomendacion() {
  // Validar que las 3 preguntas obligatorias estén respondidas
  if (!iaSeleccion.estado || !iaSeleccion.tiempo || !iaSeleccion.objetivo) {
    // Resalta visualmente los grupos sin respuesta
    ['estado', 'tiempo', 'objetivo'].forEach(grupo => {
      if (!iaSeleccion[grupo]) {
        const contenedor = document.getElementById(`opciones-${grupo}`);
        contenedor.style.outline = '2px solid var(--vino)';
        contenedor.style.borderRadius = '2px';
        setTimeout(() => {
          contenedor.style.outline = '';
        }, 2000);
      }
    });
    return;
  }

  const tema = document.getElementById('ia-tema').value.trim();

  // Mostrar pantalla de carga
  mostrarPaso('ia-cargando');
  document.querySelector('.modal-panel').scrollTop = 0;

  try {
    const respuesta = await fetch('/api/recomendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado:   iaSeleccion.estado,
        tiempo:   iaSeleccion.tiempo,
        objetivo: iaSeleccion.objetivo,
        tema:     tema || null,
        libros:   libros, // El array completo ya cargado en memoria
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
    // Buscar el libro completo en la lista global por ID
    const libro = libros.find(l => l.id === rec.id);
    if (!libro) return; // Si no lo encuentra, lo salta

    const tarjeta = document.createElement('div');
    tarjeta.className = 'resultado-tarjeta';
    tarjeta.innerHTML = `
      <div class="resultado-num">Recomendación ${nums[i] || i + 1}</div>
      <div class="resultado-titulo">${libro.titulo}</div>
      <div class="resultado-autor">${libro.autor}${libro.anio ? ` · ${libro.anio}` : ''}</div>
      <div class="resultado-razon">${rec.razon}</div>
      <a href="${libro.pdf}" target="_blank" rel="noopener" class="resultado-btn">
        📄 Abrir documento
      </a>
    `;
    lista.appendChild(tarjeta);
  });

  mostrarPaso('ia-resultados');
  document.querySelector('.modal-panel').scrollTop = 0;
}