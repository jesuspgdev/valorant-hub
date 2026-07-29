/* ============================================================
   carpetas.js — Helper compartido de "carpetas por jugador"
   ------------------------------------------------------------
   Esta app es para un ENTRENADOR que gestiona a todo su equipo.
   Por eso cada sección (Diario, Objetivos, Agentes, Planificador,
   Retrospectivas) se organiza en CARPETAS: una carpeta por jugador
   del equipo, más una carpeta especial "Equipo (general)" para lo
   que es común a todos.

   Para no repetir el mismo código de carpetas en las 5 secciones,
   lo centralizamos aquí. Cada elemento de cualquier colección lleva
   un campo `jugadorId` que indica a qué carpeta pertenece:
     - un id de jugador real  → carpeta de ese jugador
     - "equipo" (o vacío)     → carpeta "Equipo (general)"

   Así, si en el futuro quiero cambiar cómo se ven las carpetas,
   solo toco este archivo.
   ============================================================ */

window.App = window.App || {};

App.Carpetas = {

  // Id reservado para la carpeta común del equipo
  ID_EQUIPO: "equipo",

  /**
   * Devuelve la lista de carpetas a mostrar:
   * primero "Equipo (general)" y luego cada jugador (ordenado).
   */
  listar() {
    const jugadores = App.Storage.leer("jugadores")
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return [
      { id: this.ID_EQUIPO, nombre: "Equipo (general)", rol: "Común a todos", esEquipo: true },
      ...jugadores
    ];
  },

  /** Nombre legible de una carpeta a partir de su id. */
  nombreDe(carpetaId) {
    if (!carpetaId || carpetaId === this.ID_EQUIPO) return "Equipo (general)";
    const j = App.Storage.buscarPorId("jugadores", carpetaId);
    return j ? j.nombre : "Sin asignar";
  },

  /** Rol asociado a una carpeta (para las etiquetas). */
  rolDe(carpetaId) {
    if (!carpetaId || carpetaId === this.ID_EQUIPO) return "Común a todos";
    const j = App.Storage.buscarPorId("jugadores", carpetaId);
    return j ? (j.rol || "Jugador") : "";
  },

  /**
   * Cuenta cuántos elementos de una colección hay en una carpeta.
   * Los elementos sin jugadorId se consideran de "Equipo (general)".
   */
  contar(clave, carpetaId) {
    return App.Storage.leer(clave)
      .filter((it) => (it.jugadorId || this.ID_EQUIPO) === carpetaId)
      .length;
  },

  /**
   * Filtra los elementos de una colección que pertenecen a una carpeta.
   */
  filtrar(lista, carpetaId) {
    return lista.filter((it) => (it.jugadorId || this.ID_EQUIPO) === carpetaId);
  },

  /**
   * Genera el HTML de la rejilla de carpetas de una sección.
   * @param {string} clave - colección para contar elementos (ej: "entrenos")
   * @param {string} etiquetaElemento - singular del elemento (ej: "entreno")
   */
  gridHTML(clave, etiquetaElemento = "elemento") {
    const esc = App.Utils.escapar;
    const carpetas = this.listar();

    // Aviso si aún no hay jugadores dados de alta
    const soloEquipo = carpetas.length === 1;

    const tarjetas = carpetas.map((c) => {
      const n = this.contar(clave, c.id);
      return `
        <button class="carpeta ${c.esEquipo ? "carpeta--equipo" : ""}" data-carpeta="${c.id}">
          <span class="carpeta__icono">${c.esEquipo ? "👥" : "📁"}</span>
          <span class="carpeta__nombre">${esc(c.nombre)}</span>
          <span class="carpeta__rol">${esc(c.rol || "")}</span>
          <span class="carpeta__contador">${n} ${etiquetaElemento}${n === 1 ? "" : "s"}</span>
        </button>`;
    }).join("");

    return `
      <div class="carpetas-grid">${tarjetas}</div>
      ${soloEquipo ? `
        <p class="muted" style="margin-top:18px; font-size:13px;">
          💡 Ve a la sección <b>👥 Equipo</b> para dar de alta a tus jugadores.
          Cada jugador tendrá su propia carpeta aquí.
        </p>` : ""}
    `;
  },

  /**
   * Cabecera de una carpeta abierta: botón "volver" + nombre del jugador.
   * @param {string} carpetaId
   * @returns {string} HTML
   */
  cabeceraCarpeta(carpetaId) {
    const esEquipo = !carpetaId || carpetaId === this.ID_EQUIPO;
    return `
      <button class="btn btn--secundario btn--pequeno" data-volver="1" style="margin-bottom:16px;">
        ← Volver a carpetas
      </button>
      <div class="carpeta-abierta-cab">
        <span class="carpeta__icono">${esEquipo ? "👥" : "📁"}</span>
        <div>
          <div class="carpeta-abierta-nombre">${App.Utils.escapar(this.nombreDe(carpetaId))}</div>
          <span class="chip chip--gris">${App.Utils.escapar(this.rolDe(carpetaId))}</span>
        </div>
      </div>
    `;
  },

  /**
   * HTML de <option> con las carpetas, para los selectores de los
   * formularios (elegir a qué jugador pertenece un elemento).
   * @param {string} seleccionado - id de carpeta ya elegida
   */
  opcionesSelect(seleccionado = "") {
    const esc = App.Utils.escapar;
    return this.listar().map((c) =>
      `<option value="${c.id}" ${c.id === seleccionado ? "selected" : ""}>${esc(c.nombre)}</option>`
    ).join("");
  },

  /**
   * Conecta los clics de la rejilla de carpetas y del botón "volver".
   * Recibe el contenedor y una función que se llama con el id de
   * carpeta elegida (o null al volver).
   */
  conectar(contenedor, alCambiar) {
    contenedor.querySelectorAll("[data-carpeta]").forEach((btn) => {
      btn.addEventListener("click", () => alCambiar(btn.dataset.carpeta));
    });
    const volver = contenedor.querySelector("[data-volver]");
    if (volver) volver.addEventListener("click", () => alCambiar(null));
  }
};
