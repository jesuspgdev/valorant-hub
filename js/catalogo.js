/* ============================================================
   catalogo.js — Catálogo del juego (mapas y agentes) EDITABLE
   ------------------------------------------------------------
   Fuente única de la verdad para los mapas y los agentes del juego.

   Antes las listas estaban "clavadas" en el código. Ahora son datos
   editables que viven en el almacenamiento:
     - mapas            → colección "mapas"            ({id, nombre})
     - agentes del juego→ colección "catalogoAgentes"  ({id, nombre, rol})

   Las listas de abajo (…_DEFECTO) son solo la SEMILLA inicial: la
   primera vez se copian al almacenamiento y, a partir de ahí, el
   entrenador las gestiona desde la sección "Mapas y agentes"
   (añadir / borrar). Cualquier desplegable de la app (planificador,
   micros, fichas) se construye leyendo de aquí, así que lo que se
   añade o se borra en la gestión se refleja en todas partes.
   ============================================================ */

window.App = window.App || {};

App.Catalogo = {

  // ---- Roles (orden para agrupar en los desplegables) ----
  ROLES: ["Duelista", "Iniciador", "Centinela", "Controlador"],

  // ---- SEMILLA: mapas competitivos ----
  MAPAS_DEFECTO: [
    "Abyss", "Ascent", "Bind", "Breeze", "Corrode", "Fracture",
    "Haven", "Icebox", "Lotus", "Pearl", "Split", "Summit", "Sunset"
  ],

  // ---- SEMILLA: agentes del juego con su rol ----
  AGENTES_DEFECTO: [
    // Duelistas
    { nombre: "Jett", rol: "Duelista" }, { nombre: "Phoenix", rol: "Duelista" },
    { nombre: "Raze", rol: "Duelista" }, { nombre: "Reyna", rol: "Duelista" },
    { nombre: "Yoru", rol: "Duelista" }, { nombre: "Neon", rol: "Duelista" },
    { nombre: "Iso", rol: "Duelista" }, { nombre: "Waylay", rol: "Duelista" },
    // Iniciadores
    { nombre: "Sova", rol: "Iniciador" }, { nombre: "Breach", rol: "Iniciador" },
    { nombre: "Skye", rol: "Iniciador" }, { nombre: "KAY/O", rol: "Iniciador" },
    { nombre: "Fade", rol: "Iniciador" }, { nombre: "Gekko", rol: "Iniciador" },
    { nombre: "Tejo", rol: "Iniciador" },
    // Centinelas
    { nombre: "Sage", rol: "Centinela" }, { nombre: "Cypher", rol: "Centinela" },
    { nombre: "Killjoy", rol: "Centinela" }, { nombre: "Chamber", rol: "Centinela" },
    { nombre: "Deadlock", rol: "Centinela" }, { nombre: "Vyse", rol: "Centinela" },
    { nombre: "Veto", rol: "Centinela" },
    // Controladores
    { nombre: "Brimstone", rol: "Controlador" }, { nombre: "Viper", rol: "Controlador" },
    { nombre: "Omen", rol: "Controlador" }, { nombre: "Astra", rol: "Controlador" },
    { nombre: "Harbor", rol: "Controlador" }, { nombre: "Clove", rol: "Controlador" },
    { nombre: "Mik", rol: "Controlador" }
  ],

  /* ---------------- LECTURA (desde el almacenamiento) ---------------- */

  /** Mapas del catálogo, ordenados por nombre. */
  mapas() {
    return App.Storage.leer("mapas").slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
  },

  /** Agentes del catálogo del juego, ordenados por nombre. */
  agentes() {
    return App.Storage.leer("catalogoAgentes").slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
  },

  /** Solo los nombres de los agentes. */
  nombresAgentes() {
    return this.agentes().map((a) => a.nombre);
  },

  /** Rol de un agente por su nombre (o "" si no está en el catálogo). */
  rolDeAgente(nombre) {
    const a = this.agentes().find((ag) => ag.nombre === nombre);
    return a ? a.rol : "";
  },

  /**
   * Agentes agrupados por rol, respetando el orden de ROLES.
   * Si algún agente tiene un rol "raro" (no estándar), va a "Otros".
   * @returns {Array<{rol:string, agentes:Array}>}
   */
  agentesPorRol() {
    const ags = this.agentes();
    const grupos = this.ROLES.map((rol) => ({
      rol,
      agentes: ags.filter((a) => a.rol === rol)
    }));
    const otros = ags.filter((a) => !this.ROLES.includes(a.rol));
    if (otros.length) grupos.push({ rol: "Otros", agentes: otros });
    return grupos.filter((g) => g.agentes.length);
  },

  /**
   * Genera las <option> (agrupadas por rol con <optgroup>) para un
   * <select> de agentes del juego, marcando el nombre ya elegido.
   * @param {string} seleccion - nombre del agente ya elegido (o "")
   */
  opcionesAgentesHTML(seleccion = "") {
    const esc = App.Utils.escapar;
    return this.agentesPorRol().map(({ rol, agentes }) =>
      `<optgroup label="${esc(rol)}">` +
      agentes.map((a) =>
        `<option value="${esc(a.nombre)}" ${seleccion === a.nombre ? "selected" : ""}>${esc(a.nombre)}</option>`
      ).join("") +
      `</optgroup>`
    ).join("");
  }
};
