/* ============================================================
   planificador.js — Sección "Planificador de rondas" (por jugador)
   ------------------------------------------------------------
   Estrategias organizadas en carpetas por jugador (+ "Equipo general"
   para las estrategias colectivas de equipo, que es lo más habitual).

   Dentro de una carpeta, las estrategias se pueden filtrar además
   por mapa y por agente.

   Cada estrategia:
   { id, jugadorId, mapaId, agenteId, entrada, utilidad,
     companeros, reacciones }
   ============================================================ */

window.App = window.App || {};

App.Planificador = {

  CLAVE: "estrategias",
  carpeta: null,
  filtroMapa: "",
  filtroAgente: "",

  render() {
    const contenedor = document.getElementById("planificador-container");

    // ---- Vista de carpetas ----
    if (this.carpeta === null) {
      contenedor.innerHTML = `
        <div class="page-header">
          <div>
            <h1>🗺️ Planificador de rondas</h1>
            <p>Estrategias por jugador o para el equipo. Elige una carpeta.</p>
          </div>
        </div>
        ${App.Carpetas.gridHTML(this.CLAVE, "estrategia")}
      `;
      App.Carpetas.conectar(contenedor, (id) => { this.carpeta = id; this.render(); });
      return;
    }

    // ---- Vista dentro de una carpeta ----
    const mapas = App.Storage.leer("mapas").sort((a, b) => a.nombre.localeCompare(b.nombre));

    let estrategias = App.Carpetas.filtrar(App.Storage.leer(this.CLAVE), this.carpeta);
    if (this.filtroMapa) estrategias = estrategias.filter((e) => e.mapaId === this.filtroMapa);
    if (this.filtroAgente) estrategias = estrategias.filter((e) => this.nombreAgenteDe(e) === this.filtroAgente);

    contenedor.innerHTML = `
      ${App.Carpetas.cabeceraCarpeta(this.carpeta)}
      <div class="page-header" style="margin-top:6px;">
        <div>
          <h2 style="font-size:20px;">Estrategias</h2>
          <p>${estrategias.length} plan${estrategias.length === 1 ? "" : "es"}.</p>
        </div>
        <button class="btn btn--primario" id="btn-nueva-estrategia">+ Nueva estrategia</button>
      </div>

      <div class="filtros">
        <span class="filtros__label">Filtrar:</span>
        <select class="select" id="filtro-mapa">
          <option value="">Todos los mapas</option>
          ${mapas.map((m) => `<option value="${m.id}" ${this.filtroMapa === m.id ? "selected" : ""}>${App.Utils.escapar(m.nombre)}</option>`).join("")}
        </select>
        <select class="select" id="filtro-agente">
          <option value="">Cualquier agente</option>
          ${App.Catalogo.opcionesAgentesHTML(this.filtroAgente)}
        </select>
      </div>

      <div class="grid" id="grid-estrategias">
        ${estrategias.length ? estrategias.map((e) => this.plantillaEstrategia(e)).join("") : this.plantillaVacio()}
      </div>
    `;

    App.Carpetas.conectar(contenedor, (id) => {
      this.carpeta = id;
      // Al cambiar de carpeta reseteamos los filtros
      this.filtroMapa = ""; this.filtroAgente = "";
      this.render();
    });

    document.getElementById("filtro-mapa").addEventListener("change", (ev) => {
      this.filtroMapa = ev.target.value; this.render();
    });
    document.getElementById("filtro-agente").addEventListener("change", (ev) => {
      this.filtroAgente = ev.target.value; this.render();
    });

    document.getElementById("btn-nueva-estrategia")
      .addEventListener("click", () => this.abrirFormulario());

    document.getElementById("grid-estrategias").addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      if (boton.dataset.accion === "editar") this.abrirFormulario(boton.dataset.id);
      if (boton.dataset.accion === "borrar") this.borrar(boton.dataset.id);
    });
  },

  nombreDe(coleccion, id) {
    const item = App.Storage.buscarPorId(coleccion, id);
    return item ? item.nombre : "—";
  },

  /**
   * Nombre del agente de una estrategia.
   * Nuevo formato: se guarda directamente el nombre del agente del
   * juego en `agenteNombre`. Formato antiguo: se guardaba `agenteId`
   * apuntando a una ficha de agente; para esas estrategias lo
   * resolvemos aquí, así no se pierde nada de lo ya creado.
   * @returns {string} nombre del agente, o "" si la estrategia no tiene
   */
  nombreAgenteDe(e) {
    if (e.agenteNombre) return e.agenteNombre;
    if (e.agenteId) {
      const ficha = App.Storage.buscarPorId("agentes", e.agenteId);
      if (ficha) return ficha.nombre;
    }
    return "";
  },

  plantillaEstrategia(e) {
    const esc = App.Utils.escapar;
    return `
      <article class="card">
        <div style="margin-bottom:12px;">
          <span class="chip chip--rojo">${esc(this.nombreDe("mapas", e.mapaId))}</span>
          ${this.nombreAgenteDe(e) ? `<span class="chip chip--teal">${esc(this.nombreAgenteDe(e))}</span>` : ""}
        </div>
        ${e.entrada ? `<div class="agente-card__field"><b>Entrada a la ronda</b><span class="texto-multilinea">${esc(e.entrada)}</span></div>` : ""}
        ${e.utilidad ? `<div class="agente-card__field"><b>Colocación de utilidad</b><span class="texto-multilinea">${esc(e.utilidad)}</span></div>` : ""}
        ${e.companeros ? `<div class="agente-card__field"><b>Qué hacen mis compañeros</b><span class="texto-multilinea">${esc(e.companeros)}</span></div>` : ""}
        ${e.reacciones ? `<div class="agente-card__field"><b>Reacciones (rush / lento / retake)</b><span class="texto-multilinea">${esc(e.reacciones)}</span></div>` : ""}
        <div class="card-actions">
          <button class="btn btn--secundario btn--pequeno" data-accion="editar" data-id="${e.id}">Editar</button>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${e.id}">Borrar</button>
        </div>
      </article>
    `;
  },

  plantillaVacio() {
    return `
      <div class="empty" style="grid-column:1/-1;">
        <span class="empty__icon">🗺️</span>
        No hay estrategias para este filtro.<br>
        Crea una con <b>“+ Nueva estrategia”</b>.
      </div>`;
  },

  abrirFormulario(id = null) {
    const esEdicion = Boolean(id);
    const e = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { mapaId: "", agenteNombre: "", entrada: "", utilidad: "", companeros: "", reacciones: "" };

    const esc = App.Utils.escapar;
    const mapas = App.Storage.leer("mapas").sort((a, b) => a.nombre.localeCompare(b.nombre));
    const agenteSeleccionado = this.nombreAgenteDe(e);

    App.Utils.abrirModal(esEdicion ? "Editar estrategia" : "Estrategia · " + App.Carpetas.nombreDe(this.carpeta), `
      <form id="form-estrategia">
        <div class="form-row">
          <div class="form-group">
            <label for="f-mapa">Mapa</label>
            <select class="select" id="f-mapa" required>
              <option value="">Elige mapa…</option>
              ${mapas.map((m) => `<option value="${m.id}" ${e.mapaId === m.id ? "selected" : ""}>${esc(m.nombre)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label for="f-agente">Agente (opcional)</label>
            <select class="select" id="f-agente">
              <option value="">Sin agente</option>
              ${App.Catalogo.opcionesAgentesHTML(agenteSeleccionado)}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="f-entrada">¿Cómo entra el equipo a la ronda?</label>
          <textarea class="textarea" id="f-entrada" placeholder="Timing, punto de entrada, agrupación…">${esc(e.entrada)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-utilidad">¿Dónde se coloca la utilidad?</label>
          <textarea class="textarea" id="f-utilidad" placeholder="Humos, flashes, molys…">${esc(e.utilidad)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-companeros">¿Qué hacen los compañeros?</label>
          <textarea class="textarea" id="f-companeros" placeholder="Roles y posiciones del equipo">${esc(e.companeros)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-reacciones">¿Cómo se reacciona ante cada situación?</label>
          <textarea class="textarea" id="f-reacciones" placeholder="Rush, ejecución lenta, retake…">${esc(e.reacciones)}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${esEdicion ? "Guardar cambios" : "Crear estrategia"}</button>
        </div>
      </form>
    `);

    document.getElementById("btn-cancelar").addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-estrategia").addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.guardar(id);
    });
  },

  guardar(id) {
    const datos = {
      jugadorId: this.carpeta,
      mapaId: document.getElementById("f-mapa").value,
      agenteNombre: document.getElementById("f-agente").value,
      agenteId: "", // migramos al nuevo formato por nombre; limpiamos el antiguo
      entrada: document.getElementById("f-entrada").value.trim(),
      utilidad: document.getElementById("f-utilidad").value.trim(),
      companeros: document.getElementById("f-companeros").value.trim(),
      reacciones: document.getElementById("f-reacciones").value.trim()
    };

    if (!datos.mapaId) { alert("Elige un mapa para la estrategia."); return; }

    if (id) {
      App.Storage.actualizar(this.CLAVE, id, datos);
    } else {
      App.Storage.crear(this.CLAVE, datos);
    }

    App.Utils.cerrarModal();
    this.render();
  },

  borrar(id) {
    const retros = App.Storage.leer("retrospectivas").filter((r) => r.estrategiaId === id);
    const mensaje = retros.length
      ? `Esta estrategia tiene ${retros.length} retrospectiva(s) asociada(s). ¿Borrar la estrategia igualmente?`
      : "¿Borrar esta estrategia?";
    if (!confirm(mensaje)) return;

    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
