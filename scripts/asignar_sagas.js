// scripts/asignar_sagas.js
// Enriquece libros.json asignando metadatos estructurados de sagas y series ("serie": { "nombre": "...", "orden": N })
const fs = require('fs');
const path = require('path');

const librosPath = path.join(__dirname, '..', 'libros.json');
const libros = JSON.parse(fs.readFileSync(librosPath, 'utf-8'));

// Mapeo explícito por ID y heurísticas seguras para sagas y series
const sagasPorId = {
  // Stephen King - La Torre Oscura
  1627: { nombre: 'La Torre Oscura', orden: 1 },
  1628: { nombre: 'La Torre Oscura', orden: 2 },
  1629: { nombre: 'La Torre Oscura', orden: 3 },
  1630: { nombre: 'La Torre Oscura', orden: 4 },
  1631: { nombre: 'La Torre Oscura', orden: 5 },
  1632: { nombre: 'La Torre Oscura', orden: 6 },
  1633: { nombre: 'La Torre Oscura', orden: 7 },
  1634: { nombre: 'La Torre Oscura', orden: 8 },

  // Haruki Murakami - 1Q84
  1962: { nombre: '1Q84', orden: 1 },
  1961: { nombre: '1Q84', orden: 2 },

  // George R.R. Martin - Canción de Hielo y Fuego
  2240: { nombre: 'Canción de Hielo y Fuego', orden: 1 },
  2237: { nombre: 'Canción de Hielo y Fuego', orden: 2 },
  2241: { nombre: 'Canción de Hielo y Fuego', orden: 3 },
  2239: { nombre: 'Canción de Hielo y Fuego', orden: 4 },
  2238: { nombre: 'Canción de Hielo y Fuego', orden: 5 },

  // J.K. Rowling - Harry Potter
  2281: { nombre: 'Harry Potter', orden: 1 },
  2279: { nombre: 'Harry Potter', orden: 2 },
  2278: { nombre: 'Harry Potter', orden: 3 },
  2276: { nombre: 'Harry Potter', orden: 4 },
  2280: { nombre: 'Harry Potter', orden: 5 },
  2277: { nombre: 'Harry Potter', orden: 6 },
  2282: { nombre: 'Harry Potter', orden: 7 },
  2286: { nombre: 'Harry Potter', orden: 8 },

  // J.R.R. Tolkien - El Señor de los Anillos
  2498: { nombre: 'El Señor de los Anillos', orden: 2 },
  2496: { nombre: 'El Señor de los Anillos', orden: 3 },

  // Patrick Rothfuss - Crónica del Asesino de Reyes
  2244: { nombre: 'Crónica del Asesino de Reyes', orden: 1 },
  2245: { nombre: 'Crónica del Asesino de Reyes', orden: 2 },

  // Isaac Asimov - Trilogía / Serie de la Fundación
  225: { nombre: 'Serie de la Fundación', orden: 1 },
  170: { nombre: 'Serie de la Fundación', orden: 2 },
  163: { nombre: 'Serie de la Fundación', orden: 3 },
  164: { nombre: 'Serie de la Fundación', orden: 4 },
  228: { nombre: 'Serie de la Fundación', orden: 5 },
  165: { nombre: 'Serie de la Fundación', orden: 6 },

  // Frank Herbert - Saga de Dune
  1285: { nombre: 'Saga de Dune', orden: 1 },
  1294: { nombre: 'Saga de Dune', orden: 2 },
  1297: { nombre: 'Saga de Dune', orden: 3 },
  1284: { nombre: 'Saga de Dune', orden: 4 },
  1296: { nombre: 'Saga de Dune', orden: 5 },
  1282: { nombre: 'Saga de Dune', orden: 6 },
  1286: { nombre: 'Saga de Dune', orden: 7 },

  // Stieg Larsson - Trilogía Millennium
  2901: { nombre: 'Trilogía Millennium', orden: 1 },
  2902: { nombre: 'Trilogía Millennium', orden: 2 },
  2903: { nombre: 'Trilogía Millennium', orden: 3 },

  // Tonya Hurley - Ghostgirl
  2847: { nombre: 'Ghostgirl', orden: 1 },
  2848: { nombre: 'Ghostgirl', orden: 2 },
  2846: { nombre: 'Ghostgirl', orden: 3 },

  // Stephen King & Richard Chizmar - Trilogía de Gwendy
  1616: { nombre: 'Trilogía de Gwendy', orden: 1 },
  1617: { nombre: 'Trilogía de Gwendy', orden: 2 },
  1618: { nombre: 'Trilogía de Gwendy', orden: 3 },

  // Dan Brown - Robert Langdon
  343: { nombre: 'Robert Langdon', orden: 1 },
  344: { nombre: 'Robert Langdon', orden: 2 },
  345: { nombre: 'Robert Langdon', orden: 3 },
  346: { nombre: 'Robert Langdon', orden: 4 },
  349: { nombre: 'Robert Langdon', orden: 5 },

  // C.S. Lewis - Las Crónicas de Narnia
  1707: { nombre: 'Las Crónicas de Narnia', orden: 1 },
  1706: { nombre: 'Las Crónicas de Narnia', orden: 2 },
  1708: { nombre: 'Las Crónicas de Narnia', orden: 4 },

  // Suzanne Collins - Los Juegos del Hambre
  627: { nombre: 'Los Juegos del Hambre', orden: 1 },
  622: { nombre: 'Los Juegos del Hambre', orden: 2 },
  628: { nombre: 'Los Juegos del Hambre', orden: 3 },

  // Brandon Sanderson - Nacidos de la Bruma (Mistborn)
  2314: { nombre: 'Nacidos de la Bruma (Mistborn)', orden: 1 },
  2315: { nombre: 'Nacidos de la Bruma (Mistborn)', orden: 2 },
  2313: { nombre: 'Nacidos de la Bruma (Mistborn)', orden: 3 },
  2310: { nombre: 'Nacidos de la Bruma (Mistborn)', orden: 4 },
  2323: { nombre: 'Nacidos de la Bruma (Mistborn)', orden: 5 },
  2311: { nombre: 'Nacidos de la Bruma (Mistborn)', orden: 6 },

  // Brandon Sanderson - El Archivo de las Tormentas
  2317: { nombre: 'El Archivo de las Tormentas', orden: 1 },
  2322: { nombre: 'El Archivo de las Tormentas', orden: 2 },
  2320: { nombre: 'El Archivo de las Tormentas', orden: 3 },
  2316: { nombre: 'El Archivo de las Tormentas', orden: 4 },

  // Carlos Ruiz Zafón - El Cementerio de los Libros Olvidados
  2300: { nombre: 'El Cementerio de los Libros Olvidados', orden: 1 },
  2294: { nombre: 'El Cementerio de los Libros Olvidados', orden: 2 },
  2299: { nombre: 'El Cementerio de los Libros Olvidados', orden: 3 },
  2295: { nombre: 'El Cementerio de los Libros Olvidados', orden: 4 },

  // Carlos Ruiz Zafón - Trilogía de la Niebla
  2298: { nombre: 'Trilogía de la Niebla', orden: 1 },
  2296: { nombre: 'Trilogía de la Niebla', orden: 2 },
  2303: { nombre: 'Trilogía de la Niebla', orden: 3 },

  // Stephen King - Apocalipsis
  1570: { nombre: 'Apocalipsis', orden: 1 },
  1571: { nombre: 'Apocalipsis', orden: 2 },

  // Stephen King - Las Cuatro Estaciones
  1651: { nombre: 'Las Cuatro Estaciones', orden: 1 },
  1652: { nombre: 'Las Cuatro Estaciones', orden: 2 },

  // Karl Marx - El Capital
  1870: { nombre: 'El Capital', orden: 1 },
  1871: { nombre: 'El Capital', orden: 2 },
  1872: { nombre: 'El Capital', orden: 3 },

  // Italo Calvino - Cuentos Populares Italianos
  417: { nombre: 'Cuentos Populares Italianos', orden: 1 },
  418: { nombre: 'Cuentos Populares Italianos', orden: 2 }
};

let actualizados = 0;
libros.forEach(libro => {
  if (sagasPorId[libro.id]) {
    libro.serie = sagasPorId[libro.id];
    actualizados++;
  } else if (libro.serie) {
    // Si ya tenía, preservarlo
  }
});

fs.writeFileSync(librosPath, JSON.stringify(libros, null, 2), 'utf-8');
console.log(`✅ Sagas asignadas con éxito a ${actualizados} libros en libros.json`);
