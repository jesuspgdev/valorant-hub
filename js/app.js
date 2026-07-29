/* ============================================================
   app.js — Arranque y orquestación de la aplicación
   ------------------------------------------------------------
   Este es el "director de orquesta". Se carga el último y:
   1. Inicializa los datos semilla (mapas y agentes de ejemplo).
   2. Configura la navegación entre secciones (router sencillo).
   3. Controla el menú lateral en móvil.
   4. Controla el cierre del modal genérico.

   Cada sección tiene su propio módulo (App.Diario, App.Agentes…)
   con un método render(). Aquí solo decidimos cuál mostrar.
   ============================================================ */

window.App = window.App || {};

// Mapa de secciones: relaciona el nombre con su módulo render().
// Añadir una sección nueva en el futuro es tan simple como sumar
// una entrada aquí (bajo acoplamiento).
App.secciones = {
  inicio: () => App.Inicio.render(),
  equipo: () => App.Equipo.render(),
  diario: () => App.Diario.render(),
  objetivos: () => App.Objetivos.render(),
  agentes: () => App.Agentes.render(),
  planificador: () => App.Planificador.render(),
  micros: () => App.Micros.render(),
  retrospectivas: () => App.Retrospectivas.render(),
  gestion: () => App.Gestion.render()
};

// Módulos que usan carpetas por jugador. Al entrar en la sección
// desde el menú, siempre empezamos en la vista de carpetas (carpeta = null).
App.modulosConCarpetas = [App.Diario, App.Objetivos, App.Agentes, App.Planificador, App.Retrospectivas];

/**
 * Navega a una sección: oculta las demás, muestra la elegida,
 * marca el botón activo del menú y llama a su render().
 * @param {string} nombre - clave de App.secciones
 */
App.navegarA = function (nombre) {
  if (!App.secciones[nombre]) return;

  // Recordamos la sección actual (la usa App.refrescar tras importar datos)
  App.seccionActual = nombre;

  // 0. Al navegar desde el menú, reiniciamos las secciones con carpetas
  //    para aterrizar siempre en la vista de carpetas (no dentro de una).
  App.modulosConCarpetas.forEach((m) => { m.carpeta = null; });

  // 1. Cambiamos la vista visible
  document.querySelectorAll(".view").forEach((vista) => vista.classList.remove("is-active"));
  document.getElementById("view-" + nombre).classList.add("is-active");

  // 2. Marcamos el botón de navegación activo
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.section === nombre);
  });

  // 3. Renderizamos el contenido de la sección
  App.secciones[nombre]();

  // 4. En móvil, cerramos el menú tras navegar
  App.cerrarMenuMovil();

  // 5. Subimos el scroll al principio del contenido
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * Vuelve a dibujar la sección actual. Se usa después de importar o
 * abrir un archivo de datos, para que la pantalla refleje lo cargado.
 */
App.refrescar = function () {
  App.navegarA(App.seccionActual || "inicio");
};

/* ---------------- MENÚ MÓVIL ---------------- */
App.abrirMenuMovil = function () {
  document.getElementById("sidebar").classList.add("is-open");
  document.getElementById("overlay").classList.add("is-visible");
};
App.cerrarMenuMovil = function () {
  document.getElementById("sidebar").classList.remove("is-open");
  document.getElementById("overlay").classList.remove("is-visible");
};

/* ---------------- INICIALIZACIÓN ---------------- */
// Esperamos a que el HTML esté listo antes de tocar el DOM.
document.addEventListener("DOMContentLoaded", () => {

  // Precargamos mapas y agentes de ejemplo (solo la primera vez)
  App.Seed.inicializar();

  // Conectamos la barra de datos (exportar/importar/guardar/abrir archivo)
  App.Datos.init();

  // --- Navegación del menú lateral ---
  document.querySelectorAll(".nav-item").forEach((boton) => {
    boton.addEventListener("click", () => App.navegarA(boton.dataset.section));
  });

  // --- Menú móvil: botón hamburguesa + overlay ---
  document.getElementById("btnMenu").addEventListener("click", () => App.abrirMenuMovil());
  document.getElementById("overlay").addEventListener("click", () => App.cerrarMenuMovil());

  // --- Modal: cerrar con la X, con el fondo o con la tecla Escape ---
  document.getElementById("modal-cerrar").addEventListener("click", () => App.Utils.cerrarModal());
  document.getElementById("modal").addEventListener("click", (ev) => {
    // Solo cerramos si se hace clic en el fondo oscuro, no en el contenido
    if (ev.target.id === "modal") App.Utils.cerrarModal();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") App.Utils.cerrarModal();
  });

  // --- Mostramos la sección de inicio al arrancar ---
  App.navegarA("inicio");
});
