// ── VARIABLES GLOBALES ──
let libros = [];           // Aquí vivirán todos los libros
let generoActivo = 'Todos'; // Filtro de género activo

// ── CARGAR LIBROS AL INICIAR ──
// fetch() lee el archivo libros.json y lo convierte en array de objetos
fetch('libros.json')
  .then(respuesta => respuesta.json())
  .then(datos => {
    libros = datos;
    mostrarLibros(libros); // Mostrar todos al cargar
  });

// ── MOSTRAR LIBROS EN LA PÁGINA ──
function mostrarLibros(lista) {
  const galeria = document.getElementById('galeria');
  const sinResultados = document.getElementById('sinResultados');
  const contador = document.getElementById('contador');

  galeria.innerHTML = ''; // Limpiar antes de redibujar

  if (lista.length === 0) {
    sinResultados.style.display = 'block';
    contador.textContent = '';
    return;
  }

  sinResultados.style.display = 'none';
  contador.textContent = `${lista.length} libro${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}`;

  // Por cada libro, crear una tarjeta HTML
  lista.forEach(libro => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';

    tarjeta.innerHTML = `
      <img src="${libro.portada}" alt="Portada de ${libro.titulo}" 
           onerror="this.src='https://via.placeholder.com/220x200?text=Sin+portada'"/>
      <div class="tarjeta-info">
        <div class="tarjeta-titulo">${libro.titulo}</div>
        <div class="tarjeta-autor">${libro.autor}</div>
        <div class="tarjeta-anio">${libro.anio}</div>
        <span class="tarjeta-genero">${libro.genero}</span>
        <div class="tarjeta-descripcion">${libro.descripcion}</div>
      </div>
      <a href="${libro.pdf}" target="_blank" class="btn-ver">📄 Ver documento</a>
    `;

    galeria.appendChild(tarjeta);
  });
}

// ── FUNCIÓN DE BÚSQUEDA ──
// Se llama cada vez que el usuario escribe en el input
function filtrar() {
  const texto = document.getElementById('inputBusqueda').value
    .toLowerCase()
    .normalize('NFD')                        // Separar tildes
    .replace(/[\u0300-\u036f]/g, '');        // Eliminar tildes para búsqueda flexible

  const resultado = libros.filter(libro => {
    // Normalizar título y autor también
    const titulo = libro.titulo.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const autor = libro.autor.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const coincideTexto = titulo.includes(texto) || autor.includes(texto);
    const coincideGenero = generoActivo === 'Todos' || libro.genero === generoActivo;

    return coincideTexto && coincideGenero;
  });

  mostrarLibros(resultado);
}

// ── FUNCIÓN DE FILTRO POR GÉNERO ──
function filtrarGenero(genero, boton) {
  generoActivo = genero;

  // Quitar clase activo de todos los botones
  document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('activo'));
  // Poner activo solo en el que se clickeó
  boton.classList.add('activo');

  // Volver a filtrar con el género nuevo
  filtrar();
}