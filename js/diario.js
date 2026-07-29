/* ============================================================
   diario.js — Sección "Diario de entrenos" (por jugador)
   ------------------------------------------------------------
   El entrenador registra cada entreno del equipo. La sección se
   organiza en CARPETAS (una por jugador + "Equipo general").

   Flujo del entrenador:
   1. Entra en la carpeta de un jugador.
   2. Ve arriba el objetivo semanal activo de ESE jugador (referencia).
   3. Apunta el entreno de hoy: qué se practicó, si ha mejorado,
      errores, sensaciones y el objetivo del día.

   Cada entreno:
   { id, jugadorId, fecha, practicado, errores, sensaciones,
     objetivoDia, progreso }
   ============================================================ */

window.App = window.App || {};

App.Diario = {

  CLAVE: "entrenos",
  carpeta: null, // null = vista de carpetas; id = dentro de una carpeta

  render() {
    const contenedor = document.getElementById("diario-container");

    // ---- Vista 1: rejilla de carpetas ----
    if (this.carpeta === null) {
      contenedor.innerHTML = `
        <div class="page-header">
          <div>
            <h1>📓 Diario de entrenos</h1>
            <p>Elige la carpeta de un jugador para registrar y ver sus entrenos.</p>
          </div>
        </div>
        ${App.Carpetas.gridHTML(this.CLAVE, "entreno")}
      `;
      // Al pulsar una carpeta, entramos en ella
      App.Carpetas.conectar(contenedor, (carpetaId) => {
        this.carpeta = carpetaId;
        this.render();
      });
      return;
    }

    // ---- Vista 2: contenido de una carpeta (jugador) ----
    const entrenos = App.Carpetas.filtrar(App.Storage.leer(this.CLAVE), this.carpeta)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

    contenedor.innerHTML = `
      ${App.Carpetas.cabeceraCarpeta(this.carpeta)}
      ${this.bannerObjetivo()}
      <div class="page-header" style="margin-top:6px;">
        <div>
          <h2 style="font-size:20px;">Entrenos</h2>
          <p>${entrenos.length} registro${entrenos.length === 1 ? "" : "s"}.</p>
        </div>
        <button class="btn btn--primario" id="btn-nuevo-entreno">+ Nuevo entreno</button>
      </div>
      <div class="entry-list" id="lista-entrenos">
        ${entrenos.length ? entrenos.map((e) => this.plantillaEntreno(e)).join("") : this.plantillaVacio()}
      </div>
    `;

    // Botón volver a carpetas
    App.Carpetas.conectar(contenedor, (carpetaId) => {
      this.carpeta = carpetaId;
      this.render();
    });

    document.getElementById("btn-nuevo-entreno")
      .addEventListener("click", () => this.abrirFormulario());

    document.getElementById("lista-entrenos").addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      const id = boton.dataset.id;
      if (boton.dataset.accion === "editar") this.abrirFormulario(id);
      if (boton.dataset.accion === "borrar") this.borrar(id);
    });
  },

  /**
   * Banner de referencia con el objetivo semanal activo del jugador
   * de la carpeta actual. Ayuda al entrenador a saber en qué debe
   * fijarse durante el entreno de hoy.
   */
  bannerObjetivo() {
    if (this.carpeta === App.Carpetas.ID_EQUIPO) return "";
    const semana = App.Utils.idSemana();
    const objetivo = App.Storage.leer("objetivosSemanales")
      .find((o) => o.jugadorId === this.carpeta && o.semana === semana);

    if (!objetivo) return "";
    return `
      <div class="card objetivo-destacado" style="margin-bottom:18px;">
        <span class="chip ${objetivo.completado ? "chip--teal" : "chip--rojo"}">
          🎯 Objetivo de la semana ${objetivo.completado ? "· cumplido" : ""}
        </span>
        <p class="objetivo-texto" style="margin:8px 0 0;">${App.Utils.escapar(objetivo.objetivo)}</p>
      </div>`;
  },

  plantillaEntreno(e) {
    const esc = App.Utils.escapar;
    return `
      <article class="entry">
        <div class="entry__head">
          <span class="entry__fecha">${App.Utils.formatearFecha(e.fecha)}</span>
          <div class="entry__actions">
            <button class="btn btn--secundario btn--pequeno" data-accion="editar" data-id="${e.id}">Editar</button>
            <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${e.id}">Borrar</button>
          </div>
        </div>
        ${e.objetivoDia ? `<div class="entry__field"><b>Objetivo del entreno:</b> <span class="texto-multilinea">${esc(e.objetivoDia)}</span></div>` : ""}
        ${e.practicado ? `<div class="entry__field"><b>Qué se practicó:</b> <span class="texto-multilinea">${esc(e.practicado)}</span></div>` : ""}
        ${e.progreso ? `<div class="entry__field"><b>¿Ha mejorado?:</b> <span class="texto-multilinea">${esc(e.progreso)}</span></div>` : ""}
        ${e.errores ? `<div class="entry__field"><b>Errores:</b> <span class="texto-multilinea">${esc(e.errores)}</span></div>` : ""}
        ${e.sensaciones ? `<div class="entry__field"><b>Sensaciones:</b> <span class="texto-multilinea">${esc(e.sensaciones)}</span></div>` : ""}
      </article>
    `;
  },

  plantillaVacio() {
    return `
      <div class="empty">
        <span class="empty__icon">📓</span>
        Sin entrenos en esta carpeta.<br>
        Pulsa <b>“+ Nuevo entreno”</b> para registrar el de hoy.
      </div>`;
  },

  abrirFormulario(id = null) {
    const esEdicion = Boolean(id);
    const e = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { fecha: App.Utils.hoyISO(), practicado: "", errores: "", sensaciones: "", objetivoDia: "", progreso: "" };

    const esc = App.Utils.escapar;

    App.Utils.abrirModal(esEdicion ? "Editar entreno" : "Nuevo entreno · " + App.Carpetas.nombreDe(this.carpeta), `
      <form id="form-entreno">
        <div class="form-group">
          <label for="f-fecha">Fecha</label>
          <input class="input" type="date" id="f-fecha" value="${esc(e.fecha)}" required>
        </div>
        <div class="form-group">
          <label for="f-objetivo">Objetivo del jugador para este entreno</label>
          <input class="input" type="text" id="f-objetivo" value="${esc(e.objetivoDia)}" placeholder="Ej: mejorar el timing de entrada">
        </div>
        <div class="form-group">
          <label for="f-practicado">¿Qué se practicó?</label>
          <textarea class="textarea" id="f-practicado" placeholder="Ejercicios y situaciones trabajadas">${esc(e.practicado)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-progreso">¿Ha mejorado? ¿Qué pasó en las prácticas?</label>
          <textarea class="textarea" id="f-progreso" placeholder="Progreso observado respecto a su objetivo">${esc(e.progreso)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-errores">Errores cometidos</label>
          <textarea class="textarea" id="f-errores" placeholder="Fallos concretos a corregir">${esc(e.errores)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-sensaciones">Sensaciones</label>
          <textarea class="textarea" id="f-sensaciones" placeholder="Cómo se le vio / cómo se sintió">${esc(e.sensaciones)}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${esEdicion ? "Guardar cambios" : "Añadir entreno"}</button>
        </div>
      </form>
    `);

    document.getElementById("btn-cancelar").addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-entreno").addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.guardar(id);
    });
  },

  guardar(id) {
    const datos = {
      // jugadorId = carpeta actual (a qué jugador pertenece el entreno)
      jugadorId: this.carpeta,
      fecha: document.getElementById("f-fecha").value,
      objetivoDia: document.getElementById("f-objetivo").value.trim(),
      practicado: document.getElementById("f-practicado").value.trim(),
      progreso: document.getElementById("f-progreso").value.trim(),
      errores: document.getElementById("f-errores").value.trim(),
      sensaciones: document.getElementById("f-sensaciones").value.trim()
    };

    if (id) {
      App.Storage.actualizar(this.CLAVE, id, datos);
    } else {
      App.Storage.crear(this.CLAVE, datos);
    }

    App.Utils.cerrarModal();
    this.render();
  },

  borrar(id) {
    if (!confirm("¿Seguro que quieres borrar este entreno?")) return;
    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
