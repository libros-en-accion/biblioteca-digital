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