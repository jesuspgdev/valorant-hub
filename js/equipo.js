/* ============================================================
   equipo.js — Sección "Equipo" (plantilla de jugadores)
   ------------------------------------------------------------
   Aquí el entrenador da de alta a los jugadores de su equipo.
   Cada jugador se convierte automáticamente en una CARPETA dentro
   del resto de secciones (Diario, Objetivos, Agentes...).

   Cada jugador: { id, nombre, rol, notas }

   Si se borra un jugador, sus datos en otras secciones NO se borran
   de golpe: quedarían "sin carpeta". Por eso avisamos al borrar.
   ============================================================ */

window.App = window.App || {};

App.Equipo = {

  CLAVE: "jugadores",

  // Roles de juego que se pueden marcar/desmarcar (varios a la vez).
  // El rol de IGL/Capitán y el de Entrenador NO van aquí: son casillas
  // aparte, porque describen una función distinta a la del rol de agente.
  ROLES: ["Duelista", "Iniciador", "Centinela", "Controlador", "Flex"],

  /* ---------------- LECTURA DE ROLES (con compatibilidad) ----------------
     Antes cada jugador tenía un único `rol` (texto). Ahora guardamos:
       - roles: []      → varios roles de juego
       - igl: boolean   → es el IGL / Capitán
       - entrenador: boolean → es entrenador (staff)
     Estos helpers leen el formato nuevo y, si un jugador es antiguo,
     lo interpretan a partir de su `rol` de texto para no perder datos. */

  /** Lista de roles de juego de un jugador (array, formato nuevo o migrado). */
  rolesDe(j) {
    if (Array.isArray(j.roles)) return j.roles;
    // Migración de un jugador antiguo con `rol` de texto único
    if (j.rol && j.rol !== "IGL / Capitán") return [j.rol];
    return [];
  },

  /** ¿Es el IGL / Capitán del equipo? */
  esIGL(j) {
    if (typeof j.igl === "boolean") return j.igl;
    return j.rol === "IGL / Capitán"; // compatibilidad con datos antiguos
  },

  /** ¿Es entrenador (staff, no juega)? */
  esEntrenador(j) {
    return Boolean(j.entrenador);
  },

  /**
   * Construye un texto-resumen del rol ("Entrenador · IGL / Capitán · Duelista").
   * Se guarda también en `rol` para que otras vistas que aún leen ese
   * campo (inicio, carpetas) sigan mostrando algo con sentido.
   */
  etiquetaRol({ roles, igl, entrenador }) {
    const partes = [];
    if (entrenador) partes.push("Entrenador");
    if (igl) partes.push("IGL / Capitán");
    if (roles && roles.length) partes.push(...roles);
    return partes.join(" · ") || "Jugador";
  },

  /** Chips de colores para mostrar los roles de un jugador en su tarjeta. */
  chipsRolHTML(j) {
    const esc = App.Utils.escapar;
    const chips = [];
    if (this.esEntrenador(j)) chips.push(`<span class="chip chip--gris">🎓 Entrenador</span>`);
    if (this.esIGL(j)) chips.push(`<span class="chip chip--teal">🧠 IGL / Capitán</span>`);
    this.rolesDe(j).forEach((r) => chips.push(`<span class="chip chip--rojo">${esc(r)}</span>`));
    if (!chips.length) chips.push(`<span class="chip chip--rojo">Jugador</span>`);
    return chips.join(" ");
  },

  render() {
    const contenedor = document.getElementById("equipo-container");
    const jugadores = App.Storage.leer(this.CLAVE)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    contenedor.innerHTML = `
      <div class="page-header">
        <div>
          <h1>👥 Equipo</h1>
          <p>Da de alta a tus jugadores. Cada uno tendrá su carpeta en todas las secciones.</p>
        </div>
        <button class="btn btn--primario" id="btn-nuevo-jugador">+ Añadir jugador</button>
      </div>

      <div class="grid" id="grid-jugadores">
        ${jugadores.length ? jugadores.map((j) => this.plantillaJugador(j)).join("") : this.plantillaVacio()}
      </div>
    `;

    document.getElementById("btn-nuevo-jugador")
      .addEventListener("click", () => this.abrirFormulario());

    document.getElementById("grid-jugadores").addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      if (boton.dataset.accion === "editar") this.abrirFormulario(boton.dataset.id);
      if (boton.dataset.accion === "borrar") this.borrar(boton.dataset.id);
    });
  },

  plantillaJugador(j) {
    const esc = App.Utils.escapar;
    // Contamos su actividad en las demás secciones (resumen rápido)
    const nEntrenos = App.Carpetas.contar("entrenos", j.id);
    const nAgentes = App.Carpetas.contar("agentes", j.id);

    return `
      <article class="card">
        <div class="agente-card__head">
          <span class="carpeta__icono">${this.esEntrenador(j) ? "🎓" : "🎮"}</span>
          <div>
            <div class="agente-card__nombre">${esc(j.nombre)}</div>
            <div class="jugador-roles">${this.chipsRolHTML(j)}</div>
          </div>
        </div>
        ${j.notas ? `<div class="agente-card__field"><b>Notas</b><span class="texto-multilinea">${esc(j.notas)}</span></div>` : ""}
        <div class="jugador-stats">
          <span>📓 ${nEntrenos} entreno${nEntrenos === 1 ? "" : "s"}</span>
          <span>🕵️ ${nAgentes} agente${nAgentes === 1 ? "" : "s"}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn--secundario btn--pequeno" data-accion="editar" data-id="${j.id}">Editar</button>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${j.id}">Borrar</button>
        </div>
      </article>
    `;
  },

  plantillaVacio() {
    return `
      <div class="empty" style="grid-column:1/-1;">
        <span class="empty__icon">👥</span>
        Aún no has añadido jugadores.<br>
        Empieza por ti y tus compañeros con <b>“+ Añadir jugador”</b>.
      </div>`;
  },

  abrirFormulario(id = null) {
    const esEdicion = Boolean(id);
    const j = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { nombre: "", roles: [], igl: false, entrenador: false, notas: "" };

    const esc = App.Utils.escapar;
    const rolesSel = this.rolesDe(j);
    const igl = this.esIGL(j);
    const entrenador = this.esEntrenador(j);

    // Chips de rol que se marcan/desmarcan (se pueden elegir varios).
    const chipsRol = this.ROLES.map((r) =>
      `<button type="button" class="chip-toggle ${rolesSel.includes(r) ? "is-active" : ""}" data-rol="${esc(r)}">${esc(r)}</button>`
    ).join("");

    App.Utils.abrirModal(esEdicion ? "Editar jugador" : "Nuevo jugador", `
      <form id="form-jugador">
        <div class="form-group">
          <label for="f-nombre">Nombre / nick</label>
          <input class="input" type="text" id="f-nombre" value="${esc(j.nombre)}" placeholder="Ej: Alex" required>
        </div>

        <div class="form-group">
          <label>Rol(es) en el equipo</label>
          <p class="form-ayuda">Marca uno o varios roles de juego.</p>
          <div class="chips-toggle" id="roles-toggle">${chipsRol}</div>
        </div>

        <div class="form-group">
          <label>Funciones especiales</label>
          <label class="check-line">
            <input type="checkbox" id="f-igl" ${igl ? "checked" : ""}>
            <span>🧠 Es el <b>IGL / Capitán</b> del equipo</span>
          </label>
          <label class="check-line">
            <input type="checkbox" id="f-entrenador" ${entrenador ? "checked" : ""}>
            <span>🎓 Es <b>entrenador</b> (staff, no juega)</span>
          </label>
        </div>

        <div class="form-group">
          <label for="f-notas">Notas del entrenador</label>
          <textarea class="textarea" id="f-notas" placeholder="Puntos fuertes, aspectos a mejorar, actitud...">${esc(j.notas)}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">${esEdicion ? "Guardar cambios" : "Añadir jugador"}</button>
        </div>
      </form>
    `);

    // Los chips de rol alternan su estado al hacer clic.
    document.querySelectorAll("#roles-toggle .chip-toggle").forEach((chip) => {
      chip.addEventListener("click", () => chip.classList.toggle("is-active"));
    });

    document.getElementById("btn-cancelar").addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-jugador").addEventListener("submit", (ev) => {
      ev.preventDefault();

      const roles = [...document.querySelectorAll("#roles-toggle .chip-toggle.is-active")]
        .map((chip) => chip.dataset.rol);

      const datos = {
        nombre: document.getElementById("f-nombre").value.trim(),
        roles,
        igl: document.getElementById("f-igl").checked,
        entrenador: document.getElementById("f-entrenador").checked,
        notas: document.getElementById("f-notas").value.trim()
      };
      // `rol` (texto) se mantiene por compatibilidad con inicio/carpetas.
      datos.rol = this.etiquetaRol(datos);

      if (!datos.nombre) return;

      if (id) {
        App.Storage.actualizar(this.CLAVE, id, datos);
      } else {
        App.Storage.crear(this.CLAVE, datos);
      }
      App.Utils.cerrarModal();
      this.render();
    });
  },

  borrar(id) {
    // Comprobamos si el jugador tiene datos asociados en otras secciones
    const total = App.Carpetas.contar("entrenos", id)
      + App.Carpetas.contar("objetivosSemanales", id)
      + App.Carpetas.contar("agentes", id)
      + App.Carpetas.contar("estrategias", id)
      + App.Carpetas.contar("retrospectivas", id);

    const mensaje = total
      ? `Este jugador tiene ${total} elemento(s) en otras secciones (entrenos, objetivos...). `
        + `Si lo borras, esos datos quedarán sin carpeta asignada. ¿Continuar?`
      : "¿Borrar este jugador?";

    if (!confirm(mensaje)) return;
    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
