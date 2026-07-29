/* ============================================================
   objetivos.js — Sección "Objetivo semanal" (por jugador)
   ------------------------------------------------------------
   El entrenador define UN objetivo semanal para cada jugador.
   Organizado en carpetas (una por jugador + "Equipo general", que
   sirve para el objetivo colectivo del equipo).

   Dentro de la carpeta de un jugador:
   - Se muestra destacado su objetivo de la semana actual.
   - Se puede marcar como cumplido y ver el historial.
   - La app sugiere un objetivo a partir de los errores más
     repetidos EN EL DIARIO DE ESE JUGADOR.

   Cada objetivo: { id, jugadorId, semana, objetivo, completado }
   ============================================================ */

window.App = window.App || {};

App.Objetivos = {

  CLAVE: "objetivosSemanales",
  carpeta: null,

  render() {
    const contenedor = document.getElementById("objetivos-container");

    // ---- Vista de carpetas ----
    if (this.carpeta === null) {
      contenedor.innerHTML = `
        <div class="page-header">
          <div>
            <h1>🎯 Objetivo semanal</h1>
            <p>Un objetivo por semana y por jugador. Elige una carpeta.</p>
          </div>
        </div>
        ${App.Carpetas.gridHTML(this.CLAVE, "objetivo")}
      `;
      App.Carpetas.conectar(contenedor, (id) => { this.carpeta = id; this.render(); });
      return;
    }

    // ---- Vista dentro de una carpeta ----
    const semanaActual = App.Utils.idSemana();
    const objetivos = App.Carpetas.filtrar(App.Storage.leer(this.CLAVE), this.carpeta);
    const activo = objetivos.find((o) => o.semana === semanaActual);
    const historial = objetivos
      .filter((o) => o.semana !== semanaActual)
      .sort((a, b) => (a.semana < b.semana ? 1 : -1));

    contenedor.innerHTML = `
      ${App.Carpetas.cabeceraCarpeta(this.carpeta)}
      <div class="page-header" style="margin-top:6px;">
        <div>
          <h2 style="font-size:20px;">Objetivo semanal</h2>
          <p>${App.Utils.formatearSemana(semanaActual)}.</p>
        </div>
      </div>

      ${activo ? this.plantillaActivo(activo) : this.plantillaSinObjetivo(semanaActual)}

      <h3 style="margin:30px 0 14px; font-size:16px;">Historial</h3>
      ${historial.length ? historial.map((o) => this.plantillaHistorial(o)).join("") : `
        <div class="empty"><span class="empty__icon">📜</span>Aún no hay objetivos anteriores.</div>`}
    `;

    this.conectarEventos();
  },

  plantillaActivo(o) {
    const esc = App.Utils.escapar;
    return `
      <div class="card objetivo-destacado">
        <span class="chip ${o.completado ? "chip--teal" : "chip--rojo"}">
          ${o.completado ? "✔ Cumplido" : "En curso"}
        </span>
        <p class="objetivo-texto">${esc(o.objetivo)}</p>
        <div class="card-actions" style="border:none; padding:0;">
          ${o.completado
            ? `<button class="btn btn--secundario btn--pequeno" data-accion="reabrir">Marcar como pendiente</button>`
            : `<button class="btn btn--primario btn--pequeno" data-accion="completar">Marcar como cumplido</button>`}
          <button class="btn btn--secundario btn--pequeno" data-accion="editar">Editar</button>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${o.id}">Borrar</button>
        </div>
      </div>`;
  },

  plantillaSinObjetivo(semana) {
    const sugerencia = this.sugerirDesdeErrores();
    return `
      <div class="card">
        <p class="muted" style="margin-bottom:14px;">
          Aún no hay objetivo para esta semana en esta carpeta.
        </p>
        ${sugerencia ? `
          <div class="card" style="background:var(--fondo-3); margin-bottom:16px;">
            <span class="chip chip--teal">Sugerencia basada en su diario</span>
            <p style="margin-top:10px;">El error más repetido de este jugador es
              <b class="accent">“${App.Utils.escapar(sugerencia)}”</b>.
              Podrías enfocar la semana en corregirlo.</p>
          </div>` : ""}
        <button class="btn btn--primario" data-accion="definir"
          data-sugerencia="${App.Utils.escapar(sugerencia || "")}">
          Definir objetivo de la semana
        </button>
      </div>`;
  },

  plantillaHistorial(o) {
    const esc = App.Utils.escapar;
    return `
      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          <div>
            <span class="chip chip--gris">${App.Utils.formatearSemana(o.semana)}</span>
            <span class="chip ${o.completado ? "chip--teal" : "chip--rojo"}">
              ${o.completado ? "✔ Cumplido" : "No cumplido"}
            </span>
          </div>
          <button class="btn btn--peligro btn--pequeno" data-accion="borrar" data-id="${o.id}">Borrar</button>
        </div>
        <p style="margin-top:12px;">${esc(o.objetivo)}</p>
      </div>`;
  },

  /**
   * Sugerencia de objetivo a partir de los errores más repetidos
   * EN EL DIARIO DEL JUGADOR de la carpeta actual.
   * (En la carpeta "Equipo general" analiza todos los entrenos.)
   */
  sugerirDesdeErrores() {
    let entrenos = App.Storage.leer("entrenos");
    if (this.carpeta !== App.Carpetas.ID_EQUIPO) {
      entrenos = entrenos.filter((e) => e.jugadorId === this.carpeta);
    }

    const conteo = {};
    entrenos.forEach((e) => {
      if (!e.errores) return;
      e.errores.split(/[\n,.;]+/).forEach((trozo) => {
        const clave = trozo.trim().toLowerCase();
        if (clave.length < 4) return;
        conteo[clave] = (conteo[clave] || 0) + 1;
      });
    });

    let mejor = null, maximo = 0;
    for (const texto in conteo) {
      if (conteo[texto] > maximo) { maximo = conteo[texto]; mejor = texto; }
    }
    return maximo >= 2 ? mejor : null;
  },

  conectarEventos() {
    const contenedor = document.getElementById("objetivos-container");

    // Volver a carpetas
    App.Carpetas.conectar(contenedor, (id) => { this.carpeta = id; this.render(); });

    // Acciones sobre el objetivo (delegación). Usamos una bandera para
    // no acumular listeners al repintar dentro de la misma carpeta.
    if (this._contenedorConEventos === contenedor) return;
    this._contenedorConEventos = contenedor;

    contenedor.addEventListener("click", (ev) => {
      const boton = ev.target.closest("button[data-accion]");
      if (!boton) return;
      const accion = boton.dataset.accion;
      const semanaActual = App.Utils.idSemana();
      const activo = App.Carpetas.filtrar(App.Storage.leer(this.CLAVE), this.carpeta)
        .find((o) => o.semana === semanaActual);

      if (accion === "definir") this.abrirFormulario(semanaActual, null, boton.dataset.sugerencia);
      if (accion === "editar" && activo) this.abrirFormulario(semanaActual, activo.id);
      if (accion === "completar" && activo) this.cambiarEstado(activo.id, true);
      if (accion === "reabrir" && activo) this.cambiarEstado(activo.id, false);
      if (accion === "borrar") this.borrar(boton.dataset.id);
    });
  },

  abrirFormulario(semana, id = null, sugerencia = "") {
    const esEdicion = Boolean(id);
    const o = esEdicion
      ? App.Storage.buscarPorId(this.CLAVE, id)
      : { objetivo: sugerencia ? "Corregir: " + sugerencia : "" };

    App.Utils.abrirModal(esEdicion ? "Editar objetivo" : "Objetivo · " + App.Carpetas.nombreDe(this.carpeta), `
      <form id="form-objetivo">
        <div class="form-group">
          <label for="f-objetivo-txt">Objetivo de ${App.Utils.formatearSemana(semana)}</label>
          <textarea class="textarea" id="f-objetivo-txt" required
            placeholder="Ej: mejorar el trade en las entradas a sitio">${App.Utils.escapar(o.objetivo)}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn--secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="btn btn--primario">Guardar</button>
        </div>
      </form>
    `);

    document.getElementById("btn-cancelar").addEventListener("click", () => App.Utils.cerrarModal());
    document.getElementById("form-objetivo").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const texto = document.getElementById("f-objetivo-txt").value.trim();
      if (!texto) return;

      if (id) {
        App.Storage.actualizar(this.CLAVE, id, { objetivo: texto });
      } else {
        App.Storage.crear(this.CLAVE, {
          jugadorId: this.carpeta, semana, objetivo: texto, completado: false
        });
      }
      App.Utils.cerrarModal();
      this.render();
    });
  },

  cambiarEstado(id, completado) {
    App.Storage.actualizar(this.CLAVE, id, { completado });
    this.render();
  },

  borrar(id) {
    if (!confirm("¿Borrar este objetivo?")) return;
    App.Storage.borrar(this.CLAVE, id);
    this.render();
  }
};
