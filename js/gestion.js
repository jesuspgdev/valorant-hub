/* ============================================================
   gestion.js — Sección "Mapas y agentes" (catálogo del juego)
   ------------------------------------------------------------
   Aquí el entrenador administra las listas predefinidas que usa toda
   la app: los MAPAS y los AGENTES del juego.

   - Añadir: escribe un nombre (y, para agentes, un rol) y aparece al
     instante en los desplegables del planificador, las micros y las
     fichas. Se permite añadir aunque el nombre ya exista (por si se
     quiere repetir); no se valida que sea único a propósito.
   - Borrar: se elimina del catálogo, así que deja de aparecer en los
     desplegables. Lo ya creado que apuntaba a ese mapa/agente no se
     borra, pero deja de ofrecerse como opción.

   Los mapas viven en la colección "mapas" y los agentes del juego en
   "catalogoAgentes" (ver catalogo.js).
   ============================================================ */

window.App = window.App || {};

App.Gestion = {

  render() {
    const contenedor = document.getElementById("gestion-container");
    const esc = App.Utils.escapar;
    const mapas = App.Catalogo.mapas();
    const grupos = App.Catalogo.agentesPorRol();
    const totalAgentes = App.Catalogo.agentes().length;

    const opcionesRol = App.Catalogo.ROLES
      .map((r) => `<option value="${r}">${r}</option>`).join("");

    contenedor.innerHTML = `
      <div class="page-header">
        <div>
          <h1>🗃️ Mapas y agentes</h1>
          <p>El catálogo del juego. Lo que añadas aquí aparece en los desplegables del resto de la app; si lo borras, desaparece de ellos.</p>
        </div>
      </div>

      <div class="gestion-grid">

        <!-- ---- MAPAS ---- -->
        <section class="card">
          <h2 class="gestion-titulo">🗺️ Mapas <span class="muted">(${mapas.length})</span></h2>
          <form id="form-add-mapa" class="gestion-add">
            <input class="input" id="nuevo-mapa" type="text" placeholder="Nombre del mapa (ej: Summit)" autocomplete="off">
            <button type="submit" class="btn btn--primario btn--pequeno">+ Añadir</button>
          </form>
          <div class="gestion-lista" id="lista-mapas">
            ${mapas.length
              ? mapas.map((m) => this.filaItem("mapa", m.id, m.nombre)).join("")
              : `<p class="muted">No hay mapas. Añade el primero arriba.</p>`}
          </div>
        </section>

        <!-- ---- AGENTES ---- -->
        <section class="card">
          <h2 class="gestion-titulo">🕵️ Agentes <span class="muted">(${totalAgentes})</span></h2>
          <form id="form-add-agente" class="gestion-add">
            <input class="input" id="nuevo-agente" type="text" placeholder="Nombre del agente" autocomplete="off">
            <select class="select" id="nuevo-agente-rol">${opcionesRol}</select>
            <button type="submit" class="btn btn--primario btn--pequeno">+ Añadir</button>
          </form>
          <div class="gestion-lista" id="lista-agentes">
            ${grupos.length
              ? grupos.map((g) => `
                  <div class="gestion-rol">
                    <h3 class="gestion-rol__titulo">${esc(g.rol)}</h3>
                    <div class="gestion-chips">
                      ${g.agentes.map((a) => this.filaItem("agente", a.id, a.nombre)).join("")}
                    </div>
                  </div>`).join("")
              : `<p class="muted">No hay agentes. Añade el primero arriba.</p>`}
          </div>
        </section>

      </div>
    `;

    // --- Añadir mapa ---
    document.getElementById("form-add-mapa").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const input = document.getElementById("nuevo-mapa");
      const nombre = input.value.trim();
      if (!nombre) return;
      App.Storage.crear("mapas", { nombre });
      this.render();
    });

    // --- Añadir agente ---
    document.getElementById("form-add-agente").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const input = document.getElementById("nuevo-agente");
      const nombre = input.value.trim();
      const rol = document.getElementById("nuevo-agente-rol").value;
      if (!nombre) return;
      App.Storage.crear("catalogoAgentes", { nombre, rol });
      this.render();
    });

    // --- Borrar (mapa o agente) ---
    contenedor.addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-borrar]");
      if (!boton) return;
      if (boton.dataset.tipo === "mapa") this.borrarMapa(boton.dataset.borrar);
      if (boton.dataset.tipo === "agente") this.borrarAgente(boton.dataset.borrar);
    });
  },

  /** Fila/chip de un elemento del catálogo con su botón de borrar. */
  filaItem(tipo, id, nombre) {
    const esc = App.Utils.escapar;
    return `
      <span class="gestion-item">
        <span class="gestion-item__nombre">${esc(nombre)}</span>
        <button class="gestion-item__borrar" data-borrar="${id}" data-tipo="${tipo}" title="Quitar del catálogo" aria-label="Quitar ${esc(nombre)}">✕</button>
      </span>`;
  },

  borrarMapa(id) {
    const mapa = App.Storage.buscarPorId("mapas", id);
    if (!mapa) return;
    // Avisamos si hay estrategias o micros que usan este mapa
    const usos = App.Storage.leer("estrategias").filter((e) => e.mapaId === id).length
               + App.Storage.leer("micros").filter((m) => m.mapaId === id).length;
    const msg = usos
      ? `“${mapa.nombre}” se usa en ${usos} estrategia(s)/micro(s). Si lo borras, dejará de ofrecerse en los desplegables (lo ya creado no se borra). ¿Continuar?`
      : `¿Quitar el mapa “${mapa.nombre}” del catálogo?`;
    if (!confirm(msg)) return;
    App.Storage.borrar("mapas", id);
    this.render();
  },

  borrarAgente(id) {
    const agente = App.Storage.buscarPorId("catalogoAgentes", id);
    if (!agente) return;
    if (!confirm(`¿Quitar el agente “${agente.nombre}” del catálogo? Dejará de aparecer en los desplegables.`)) return;
    App.Storage.borrar("catalogoAgentes", id);
    this.render();
  }
};
