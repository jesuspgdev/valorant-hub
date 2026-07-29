/* ============================================================
   micros.js — Sección "Micros" (jugadas concretas con nombre)
   ------------------------------------------------------------
   Una "micro" NO es una estrategia de ronda completa. Es una jugada
   pequeña y con nombre propio (p. ej. "Humo falso A", "Doble flash
   corto") en la que intervienen SOLO unos cuantos agentes, mientras
   el resto del equipo hace otra cosa en otra parte del mapa.

   Cada micro guarda:
   - nombre    : cómo la llamamos (obligatorio)
   - mapaId    : mapa donde se usa (opcional)
   - agentes[] : quiénes intervienen y qué habilidad usa cada uno
                 → [{ agente, habilidad }]
   - cuando    : en qué situación / ronda la sacamos
   - reaccion  : cómo reaccionamos según lo que pase

   A diferencia del planificador, aquí no hay carpetas por jugador:
   una micro es de equipo y se lista en plano, con filtro por mapa.
   ============================================================ */

window.App = window.App || {};

App.Micros = {

  CLAVE: "micros",
  filtroMapa: "",

  render() {
    const contenedor = document.getElementById("micros-container");
    const mapas = App.Catalogo.mapas();

    let micros = App.Storage.leer(this.CLAVE);
    if (this.filtroMapa) micros = micros.filter((m) => m.mapaId === this.filtroMapa);
    micros = micros.sort((a, b) => a.nombre.localeCompare(b.nombre));

    contenedor.innerHTML = `
      <div class="page-header">
        <div>
          <h1>⚡ Micros</h1>
          <p>Jugadas concretas con nombre: qué agentes intervienen, qué habilidad usa cada uno y cómo reaccionar.</p>
        </div>
        <button class="btn btn--primario" id="btn-nueva-micro">+ Nueva micro</button>
      </div>

      <div class="filtros">
        <span class="filtros__label">Filtrar:</span>
        <select class="select" id="filtro-mapa-micro">
          <option value="">Todos los mapas</option>
          ${mapas.map((m) => `<option value="${m.id}" ${this.filtroMapa === m.id ? "selected" : ""}>${App.Utils.escapar(m.nombre)}</option>`).join("")}
        </select>
      </div>

      <div class="grid" id="grid-micros">
        ${micros.length ? micros.map((m) => this.plantillaMicro(m)).join("") : this.plantillaVacio()}
      </div>
    `;

    document.getElementById("filtro-mapa-micro").addEventListener("change", (ev) => {
      this.filtroMapa = ev.target.value; this.render();
    });
    document.getElementById("btn-nueva-micro")
      .addEventListener("click", () => this.abrirFormulario());

    document.getElementById("grid-micros").addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      if (boton.dataset.accion === "editar") this.abrirFormulario(boton.dataset.id);
      if (boton.dataset.accion === "borrar") this.borrar(boton.dataset.id);
    });
  },

  nombreMapa(mapaId) {
    const m = App.Storage.buscarPorId("mapas", mapaId);
    return m ? m.nombre : "";
  },

  plantillaMicro(m) {
    const esc = App.Utils.escapar;
    const nombreMapa = this.nombreMapa(m.mapaId);

    const agentes = (m.agentes || []).map((a) => `
      <div class="micro-agente">
        <span class="chip chip--teal">${esc(a.agente || "—")}</span>
        <span class="micro-agente__hab texto-multilinea">${esc(a.habilidad)}</span>
      </div>
    `).join("");

    return `
      <article class="card">
        <div class="micro-cabecera">
          <h3 class="micro-titulo">${esc(m.nombre)}</h3>
          ${nombreMapa ? `<span class="chip chip--rojo">${esc(nombreMapa)}</span>` : ""}
        </div>
        ${agentes ? `<div class="agente-card__field"><b>Agentes y habilidades</b>${agentes}</div>` : ""}
        ${m.cuando ? `<div class="agente-card__field"><b>¿Cuándo la usamos?</b><span class="texto-multilinea">${esc(m.cuando)}</span></div>` : ""}
        ${m.reaccion ? `<div class="agente-card__field"><b>¿Cómo reaccionamos?</b><span class="texto-multilinea">${esc(m.reaccion)}</span></div>` : ""}
        <div class="card-actions">
          <button class="btn btn--secundario btn--pequeno" data-accion="editar" data-id="${m.id}">Editar</button>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${m.id}">Borrar</button>
        </div>
      </article>
    `;
  },

  plantillaVacio() {
    return `
      <div class="empty" style="grid-column:1/-1;">
        <span class="empty__icon">⚡</span>
        No hay micros para este filtro.<br>
        Crea una con <b>“+ Nueva micro”</b>.
      </div>`;
  },

  abrirFormulario(id = null) {
    const esEdicion = Boolean(id);
    const m = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { nombre: "", mapaId: "", agentes: [], cuando: "", reaccion: "" };

    const esc = App.Utils.escapar;
    const mapas = App.Catalogo.mapas();

    App.Utils.abrirModal(esEdicion ? "Editar micro" : "Nueva micro", `
      <form id="form-micro">
        <div class="form-row">
          <div class="form-group">
            <label for="f-nombre">Nombre de la micro</label>
            <input class="input" type="text" id="f-nombre" value="${esc(m.nombre)}" placeholder="Ej: Humo falso A + flash corto" required>
          </div>
          <div class="form-group">
            <label for="f-mapa">Mapa (opcional)</label>
            <select class="select" id="f-mapa">
              <option value="">Sin mapa</option>
              ${mapas.map((mp) => `<option value="${mp.id}" ${m.mapaId === mp.id ? "selected" : ""}>${esc(mp.nombre)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Agentes que intervienen y su habilidad</label>
          <p class="form-ayuda">Añade solo a los que participan en la micro. Escribe qué habilidad usa cada uno y para qué.</p>
          <div id="lista-agentes-micro"></div>
          <button type="button" class="btn btn--secundario btn--pequeno" id="btn-add-agente-micro">+ Añadir agente</button>
        </div>

        <div class="form-group">
          <label for="f-cuando">¿Cuándo la usamos?</label>
          <textarea class="textarea" id="f-cuando" placeholder="En qué ronda o situación tiene sentido sacarla">${esc(m.cuando)}</textarea>
        </div>
        <div class="form-group">
          <label for="f-reaccion">¿Cómo reaccionamos?</label>
          <textarea class="textarea" id="f-reaccion" placeholder="Qué hacemos según lo que pase (si funciona, si nos leen, si hay retake…)">${esc(m.reaccion)}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${esEdicion ? "Guardar cambios" : "Crear micro"}</button>
        </div>
      </form>
    `);

    // Filas de agente: al menos una al abrir
    const inicial = (m.agentes && m.agentes.length) ? m.agentes : [{ agente: "", habilidad: "" }];
    inicial.forEach((a) => this.anadirFilaAgente(a));

    document.getElementById("btn-add-agente-micro")
      .addEventListener("click", () => this.anadirFilaAgente({ agente: "", habilidad: "" }));
    document.getElementById("btn-cancelar")
      .addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-micro").addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.guardar(id);
    });
  },

  /** Añade una fila "agente + habilidad" al formulario. */
  anadirFilaAgente(fila) {
    const esc = App.Utils.escapar;
    const lista = document.getElementById("lista-agentes-micro");
    const div = document.createElement("div");
    div.className = "habilidad-fila";
    div.innerHTML = `
      <select class="select micro-ag">
        <option value="">Agente…</option>
        ${App.Catalogo.opcionesAgentesHTML(fila.agente)}
      </select>
      <input class="input micro-hab" type="text" placeholder="Habilidad y uso (ej: Flash de KAY/O sobre entrada)" value="${esc(fila.habilidad)}">
      <button type="button" class="btn btn--peligro btn--pequeno micro-quitar" aria-label="Quitar">✕</button>
    `;
    div.querySelector(".micro-quitar").addEventListener("click", () => div.remove());
    lista.appendChild(div);
  },

  guardar(id) {
    const agentes = [];
    document.querySelectorAll("#lista-agentes-micro .habilidad-fila").forEach((fila) => {
      const agente = fila.querySelector(".micro-ag").value;
      const habilidad = fila.querySelector(".micro-hab").value.trim();
      if (agente || habilidad) agentes.push({ agente, habilidad });
    });

    const datos = {
      nombre: document.getElementById("f-nombre").value.trim(),
      mapaId: document.getElementById("f-mapa").value,
      agentes,
      cuando: document.getElementById("f-cuando").value.trim(),
      reaccion: document.getElementById("f-reaccion").value.trim()
    };

    if (!datos.nombre) { alert("Ponle un nombre a la micro."); return; }

    if (id) {
      App.Storage.actualizar(this.CLAVE, id, datos);
    } else {
      App.Storage.crear(this.CLAVE, datos);
    }

    App.Utils.cerrarModal();
    this.render();
  },

  borrar(id) {
    if (!confirm("¿Borrar esta micro?")) return;
    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
