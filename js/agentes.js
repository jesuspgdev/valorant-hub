/* ============================================================
   agentes.js — Sección "Fichas de agentes" (por jugador)
   ------------------------------------------------------------
   Cada jugador tiene su propio pool de agentes. La sección se
   organiza en carpetas (una por jugador + "Equipo general" para
   agentes de referencia comunes).

   Dentro de una carpeta, una ficha por agente con: cómo lo juega,
   posicionamiento, habilidades (una a una) y sinergias.

   Cada agente:
   { id, jugadorId, nombre, rol, comoJuego, posicionamiento,
     habilidades[], sinergias }
   habilidades = [{ nombre, uso }]
   ============================================================ */

window.App = window.App || {};

App.Agentes = {

  CLAVE: "agentes",
  carpeta: null,
  ROLES: ["Duelista", "Iniciador", "Centinela", "Controlador"],

  render() {
    const contenedor = document.getElementById("agentes-container");

    // ---- Vista de carpetas ----
    if (this.carpeta === null) {
      contenedor.innerHTML = `
        <div class="page-header">
          <div>
            <h1>🕵️ Fichas de agentes</h1>
            <p>El pool de agentes de cada jugador. Elige una carpeta.</p>
          </div>
        </div>
        ${App.Carpetas.gridHTML(this.CLAVE, "agente")}
      `;
      App.Carpetas.conectar(contenedor, (id) => { this.carpeta = id; this.render(); });
      return;
    }

    // ---- Vista dentro de una carpeta ----
    const agentes = App.Carpetas.filtrar(App.Storage.leer(this.CLAVE), this.carpeta)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    contenedor.innerHTML = `
      ${App.Carpetas.cabeceraCarpeta(this.carpeta)}
      <div class="page-header" style="margin-top:6px;">
        <div>
          <h2 style="font-size:20px;">Agentes</h2>
          <p>${agentes.length} ficha${agentes.length === 1 ? "" : "s"}.</p>
        </div>
        <button class="btn btn--primario" id="btn-nuevo-agente">+ Nueva ficha</button>
      </div>
      <div class="grid" id="grid-agentes">
        ${agentes.length ? agentes.map((a) => this.plantillaAgente(a)).join("") : this.plantillaVacio()}
      </div>
    `;

    App.Carpetas.conectar(contenedor, (id) => { this.carpeta = id; this.render(); });

    document.getElementById("btn-nuevo-agente")
      .addEventListener("click", () => this.abrirFormulario());

    document.getElementById("grid-agentes").addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      if (boton.dataset.accion === "editar") this.abrirFormulario(boton.dataset.id);
      if (boton.dataset.accion === "borrar") this.borrar(boton.dataset.id);
    });
  },

  plantillaAgente(a) {
    const esc = App.Utils.escapar;
    const habilidades = (a.habilidades || []).map((h) => `
      <div class="habilidad-item"><b>${esc(h.nombre)}:</b> ${esc(h.uso)}</div>
    `).join("");

    return `
      <article class="card agente-card">
        <div class="agente-card__head">
          <div>
            <div class="agente-card__nombre">${esc(a.nombre)}</div>
            <span class="chip chip--rojo">${esc(a.rol || "Sin rol")}</span>
          </div>
        </div>
        ${a.comoJuego ? `<div class="agente-card__field"><b>Cómo lo juega</b><span class="texto-multilinea">${esc(a.comoJuego)}</span></div>` : ""}
        ${a.posicionamiento ? `<div class="agente-card__field"><b>Posicionamiento</b><span class="texto-multilinea">${esc(a.posicionamiento)}</span></div>` : ""}
        ${habilidades ? `<div class="agente-card__field"><b>Habilidades</b>${habilidades}</div>` : ""}
        ${a.sinergias ? `<div class="agente-card__field"><b>Sinergias</b><span class="texto-multilinea">${esc(a.sinergias)}</span></div>` : ""}
        <div class="card-actions">
          <button class="btn btn--secundario btn--pequeno" data-accion="editar" data-id="${a.id}">Editar</button>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${a.id}">Borrar</button>
        </div>
      </article>
    `;
  },

  plantillaVacio() {
    return `
      <div class="empty" style="grid-column:1/-1;">
        <span class="empty__icon">🕵️</span>
        Sin fichas en esta carpeta.<br>
        Crea la primera con <b>“+ Nueva ficha”</b>.
      </div>`;
  },

  abrirFormulario(id = null) {
    const esEdicion = Boolean(id);
    const a = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { nombre: "", rol: "Duelista", comoJuego: "", posicionamiento: "", habilidades: [], sinergias: "" };

    const esc = App.Utils.escapar;
    const opcionesRol = this.ROLES.map((r) =>
      `<option value="${r}" ${a.rol === r ? "selected" : ""}>${r}</option>`
    ).join("");

    App.Utils.abrirModal(esEdicion ? "Editar ficha de agente" : "Nueva ficha · " + App.Carpetas.nombreDe(this.carpeta), `
      <form id="form-agente">
        <div class="form-row">
          <div class="form-group">
            <label for="f-nombre">Agente</label>
            <select class="select" id="f-nombre" required>
              <option value="">Elige agente…</option>
              ${App.Catalogo.opcionesAgentesHTML(a.nombre)}
            </select>
          </div>
          <div class="form-group">
            <label for="f-rol">Rol</label>
            <select class="select" id="f-rol">${opcionesRol}</select>
          </div>
        </div>
        <div class="form-group">
          <label for="f-comoJuego">Cómo lo juega</label>
          <textarea class="textarea" id="f-comoJuego" placeholder="Estilo general con este agente">${esc(a.comoJuego)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-posicionamiento">Posicionamiento</label>
          <textarea class="textarea" id="f-posicionamiento" placeholder="Dónde se coloca normalmente">${esc(a.posicionamiento)}</textarea>
        </div>
        <div class="form-group">
          <label>Habilidades</label>
          <div id="lista-habilidades"></div>
          <button type="button" class="btn btn--secundario btn--pequeno" id="btn-add-habilidad">+ Añadir habilidad</button>
        </div>
        <div class="form-group">
          <label for="f-sinergias">Sinergias con el equipo</label>
          <textarea class="textarea" id="f-sinergias" placeholder="Cómo combina con sus compañeros">${esc(a.sinergias)}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${esEdicion ? "Guardar cambios" : "Crear ficha"}</button>
        </div>
      </form>
    `);

    const habilidadesIniciales = (a.habilidades && a.habilidades.length)
      ? a.habilidades
      : [{ nombre: "", uso: "" }];
    habilidadesIniciales.forEach((h) => this.anadirFilaHabilidad(h));

    // Al elegir el agente, autocompletamos su rol con el del catálogo
    // (el entrenador puede cambiarlo después si lo juega de flex).
    document.getElementById("f-nombre").addEventListener("change", (ev) => {
      const rol = App.Catalogo.rolDeAgente(ev.target.value);
      if (rol) document.getElementById("f-rol").value = rol;
    });

    document.getElementById("btn-add-habilidad")
      .addEventListener("click", () => this.anadirFilaHabilidad({ nombre: "", uso: "" }));
    document.getElementById("btn-cancelar")
      .addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-agente").addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.guardar(id);
    });
  },

  anadirFilaHabilidad(habilidad) {
    const esc = App.Utils.escapar;
    const lista = document.getElementById("lista-habilidades");
    const fila = document.createElement("div");
    fila.className = "habilidad-fila";
    fila.innerHTML = `
      <input class="input hab-nombre" type="text" placeholder="Nombre (ej: Recon Bolt Q)" value="${esc(habilidad.nombre)}">
      <input class="input hab-uso" type="text" placeholder="Uso concreto" value="${esc(habilidad.uso)}">
      <button type="button" class="btn btn--peligro btn--pequeno hab-quitar" aria-label="Quitar">✕</button>
    `;
    fila.querySelector(".hab-quitar").addEventListener("click", () => fila.remove());
    lista.appendChild(fila);
  },

  guardar(id) {
    const habilidades = [];
    document.querySelectorAll("#lista-habilidades .habilidad-fila").forEach((fila) => {
      const nombre = fila.querySelector(".hab-nombre").value.trim();
      const uso = fila.querySelector(".hab-uso").value.trim();
      if (nombre || uso) habilidades.push({ nombre, uso });
    });

    const nombre = document.getElementById("f-nombre").value.trim();
    if (!nombre) { alert("Elige un agente de la lista."); return; }

    const datos = {
      jugadorId: this.carpeta,
      nombre,
      rol: document.getElementById("f-rol").value,
      comoJuego: document.getElementById("f-comoJuego").value.trim(),
      posicionamiento: document.getElementById("f-posicionamiento").value.trim(),
      habilidades,
      sinergias: document.getElementById("f-sinergias").value.trim()
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
    if (!confirm("¿Borrar esta ficha de agente?")) return;
    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
