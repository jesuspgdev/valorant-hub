/* ============================================================
   retrospectivas.js — Sección "Retrospectivas" (por jugador)
   ------------------------------------------------------------
   Mejora continua enlazada a cada estrategia. Organizado en carpetas
   por jugador (+ "Equipo general" para las retrospectivas colectivas).

   Cuando en partida ocurre una situación planificada, el entrenador
   apunta: qué pasó, qué falló, cómo se corregirá y el resultado del
   siguiente intento. Cada retrospectiva va asociada a una estrategia.

   Cada retrospectiva:
   { id, jugadorId, estrategiaId, quePaso, queFallo, correccion,
     resultadoSiguiente }
   ============================================================ */

window.App = window.App || {};

App.Retrospectivas = {

  CLAVE: "retrospectivas",
  carpeta: null,
  filtroEstrategia: "",

  render() {
    const contenedor = document.getElementById("retrospectivas-container");

    // ---- Vista de carpetas ----
    if (this.carpeta === null) {
      contenedor.innerHTML = `
        <div class="page-header">
          <div>
            <h1>🔁 Retrospectivas</h1>
            <p>Mejora continua por jugador o de equipo. Elige una carpeta.</p>
          </div>
        </div>
        ${App.Carpetas.gridHTML(this.CLAVE, "retrospectiva")}
      `;
      App.Carpetas.conectar(contenedor, (id) => { this.carpeta = id; this.render(); });
      return;
    }

    // ---- Vista dentro de una carpeta ----
    const estrategias = App.Storage.leer("estrategias");

    let retros = App.Carpetas.filtrar(App.Storage.leer(this.CLAVE), this.carpeta);
    if (this.filtroEstrategia) {
      retros = retros.filter((r) => r.estrategiaId === this.filtroEstrategia);
    }

    contenedor.innerHTML = `
      ${App.Carpetas.cabeceraCarpeta(this.carpeta)}
      <div class="page-header" style="margin-top:6px;">
        <div>
          <h2 style="font-size:20px;">Retrospectivas</h2>
          <p>${retros.length} registro${retros.length === 1 ? "" : "s"}.</p>
        </div>
        <button class="btn btn--primario" id="btn-nueva-retro">+ Nueva retrospectiva</button>
      </div>

      <div class="filtros">
        <span class="filtros__label">Estrategia:</span>
        <select class="select" id="filtro-estrategia">
          <option value="">Todas</option>
          ${estrategias.map((e) => `<option value="${e.id}" ${this.filtroEstrategia === e.id ? "selected" : ""}>${App.Utils.escapar(this.etiquetaEstrategia(e))}</option>`).join("")}
        </select>
      </div>

      <div id="lista-retros">
        ${retros.length ? retros.map((r) => this.plantillaRetro(r)).join("") : this.plantillaVacio(estrategias.length)}
      </div>
    `;

    App.Carpetas.conectar(contenedor, (id) => {
      this.carpeta = id;
      this.filtroEstrategia = "";
      this.render();
    });

    document.getElementById("filtro-estrategia").addEventListener("change", (ev) => {
      this.filtroEstrategia = ev.target.value; this.render();
    });

    document.getElementById("btn-nueva-retro")
      .addEventListener("click", () => this.abrirFormulario());

    document.getElementById("lista-retros").addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      if (boton.dataset.accion === "editar") this.abrirFormulario(boton.dataset.id);
      if (boton.dataset.accion === "borrar") this.borrar(boton.dataset.id);
    });
  },

  /** Etiqueta legible de una estrategia (mapa · agente). */
  etiquetaEstrategia(e) {
    if (!e) return "Estrategia eliminada";
    const mapa = App.Storage.buscarPorId("mapas", e.mapaId);
    const agente = App.Planificador.nombreAgenteDe(e);
    const partes = [];
    if (mapa) partes.push(mapa.nombre);
    if (agente) partes.push(agente);
    return partes.length ? partes.join(" · ") : "Estrategia sin nombre";
  },

  plantillaRetro(r) {
    const esc = App.Utils.escapar;
    const estrategia = App.Storage.buscarPorId("estrategias", r.estrategiaId);
    return `
      <article class="retro">
        <div class="retro__estrategia">▸ ${esc(this.etiquetaEstrategia(estrategia))}</div>
        ${r.quePaso ? `<div class="retro__field"><b>Qué pasó:</b> <span class="texto-multilinea">${esc(r.quePaso)}</span></div>` : ""}
        ${r.queFallo ? `<div class="retro__field"><b>Qué falló:</b> <span class="texto-multilinea">${esc(r.queFallo)}</span></div>` : ""}
        ${r.correccion ? `<div class="retro__field"><b>Cómo se corregirá:</b> <span class="texto-multilinea">${esc(r.correccion)}</span></div>` : ""}
        ${r.resultadoSiguiente ? `<div class="retro__field"><b>Resultado del siguiente intento:</b> <span class="texto-multilinea">${esc(r.resultadoSiguiente)}</span></div>` : ""}
        <div class="entry__actions" style="margin-top:12px;">
          <button class="btn btn--secundario btn--pequeno" data-accion="editar" data-id="${r.id}">Editar</button>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${r.id}">Borrar</button>
        </div>
      </article>
    `;
  },

  plantillaVacio(hayEstrategias) {
    if (!hayEstrategias) {
      return `
        <div class="empty">
          <span class="empty__icon">🔁</span>
          Primero crea una estrategia en el <b>Planificador de rondas</b>.<br>
          Las retrospectivas se asocian siempre a una estrategia.
        </div>`;
    }
    return `
      <div class="empty">
        <span class="empty__icon">🔁</span>
        Sin retrospectivas en esta carpeta.<br>
        Registra la primera con <b>“+ Nueva retrospectiva”</b>.
      </div>`;
  },

  abrirFormulario(id = null) {
    const estrategias = App.Storage.leer("estrategias");
    if (estrategias.length === 0) {
      alert("Crea antes una estrategia en el Planificador de rondas.");
      return;
    }

    const esEdicion = Boolean(id);
    const r = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { estrategiaId: this.filtroEstrategia || "", quePaso: "", queFallo: "", correccion: "", resultadoSiguiente: "" };

    const esc = App.Utils.escapar;

    App.Utils.abrirModal(esEdicion ? "Editar retrospectiva" : "Retrospectiva · " + App.Carpetas.nombreDe(this.carpeta), `
      <form id="form-retro">
        <div class="form-group">
          <label for="f-estrategia">Estrategia asociada</label>
          <select class="select" id="f-estrategia" required>
            <option value="">Elige estrategia…</option>
            ${estrategias.map((e) => `<option value="${e.id}" ${r.estrategiaId === e.id ? "selected" : ""}>${esc(this.etiquetaEstrategia(e))}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label for="f-quePaso">¿Qué pasó realmente?</label>
          <textarea class="textarea" id="f-quePaso" placeholder="La situación real en la partida">${esc(r.quePaso)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-queFallo">¿Qué falló?</label>
          <textarea class="textarea" id="f-queFallo" placeholder="El punto débil detectado">${esc(r.queFallo)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-correccion">¿Cómo se corregirá?</label>
          <textarea class="textarea" id="f-correccion" placeholder="El ajuste que se va a aplicar">${esc(r.correccion)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-resultado">Resultado del siguiente intento</label>
          <textarea class="textarea" id="f-resultado" placeholder="Qué ocurrió al aplicar la corrección">${esc(r.resultadoSiguiente)}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${esEdicion ? "Guardar cambios" : "Crear retrospectiva"}</button>
        </div>
      </form>
    `);

    document.getElementById("btn-cancelar").addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-retro").addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.guardar(id);
    });
  },

  guardar(id) {
    const datos = {
      jugadorId: this.carpeta,
      estrategiaId: document.getElementById("f-estrategia").value,
      quePaso: document.getElementById("f-quePaso").value.trim(),
      queFallo: document.getElementById("f-queFallo").value.trim(),
      correccion: document.getElementById("f-correccion").value.trim(),
      resultadoSiguiente: document.getElementById("f-resultado").value.trim()
    };

    if (!datos.estrategiaId) { alert("Elige la estrategia asociada."); return; }

    if (id) {
      App.Storage.actualizar(this.CLAVE, id, datos);
    } else {
      App.Storage.crear(this.CLAVE, datos);
    }

    App.Utils.cerrarModal();
    this.render();
  },

  borrar(id) {
    if (!confirm("¿Borrar esta retrospectiva?")) return;
    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
