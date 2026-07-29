/* ============================================================
   inicio.js — Sección "Inicio" (panel del entrenador)
   ------------------------------------------------------------
   Primera pantalla al abrir la app. Da al entrenador una foto
   rápida del equipo:
   - Estadísticas generales (jugadores, entrenos, objetivos...).
   - Una tarjeta por jugador con su objetivo de la semana y su
     último entreno registrado.

   Solo LEE de las colecciones; no guarda nada por su cuenta.
   ============================================================ */

window.App = window.App || {};

App.Inicio = {

  render() {
    const contenedor = document.getElementById("inicio-container");

    const jugadores = App.Storage.leer("jugadores")
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    const entrenos = App.Storage.leer("entrenos");
    const estrategias = App.Storage.leer("estrategias");
    const objetivos = App.Storage.leer("objetivosSemanales");
    const semanaActual = App.Utils.idSemana();

    contenedor.innerHTML = `
      <div class="inicio-hero">
        <h1>Panel del <span class="accent">entrenador</span></h1>
        <p>Resumen del equipo: objetivos de la semana y últimos entrenos de cada jugador.
           ${App.Utils.formatearSemana(semanaActual)}.</p>
      </div>

      <div class="stats">
        <div class="stat"><div class="stat__num">${jugadores.length}</div><div class="stat__label">Jugadores</div></div>
        <div class="stat"><div class="stat__num">${entrenos.length}</div><div class="stat__label">Entrenos</div></div>
        <div class="stat"><div class="stat__num">${estrategias.length}</div><div class="stat__label">Estrategias</div></div>
        <div class="stat"><div class="stat__num">${objetivos.filter((o) => o.completado).length}</div><div class="stat__label">Objetivos cumplidos</div></div>
      </div>

      <div class="page-header" style="margin-bottom:18px;">
        <h2 style="font-size:20px;">Estado del equipo</h2>
        <button class="btn btn--secundario btn--pequeno" data-ir="equipo">Gestionar equipo</button>
      </div>

      ${jugadores.length
        ? `<div class="grid">${jugadores.map((j) => this.tarjetaJugador(j, semanaActual)).join("")}</div>`
        : this.plantillaSinEquipo()}
    `;

    // Botones que navegan a otras secciones
    contenedor.querySelectorAll("[data-ir]").forEach((boton) => {
      boton.addEventListener("click", () => App.navegarA(boton.dataset.ir));
    });
  },

  /** Tarjeta resumen de un jugador para el panel. */
  tarjetaJugador(j, semanaActual) {
    const esc = App.Utils.escapar;

    // Objetivo de la semana actual de este jugador
    const objetivo = App.Storage.leer("objetivosSemanales")
      .find((o) => o.jugadorId === j.id && o.semana === semanaActual);

    // Último entreno registrado de este jugador
    const ultimo = App.Storage.leer("entrenos")
      .filter((e) => e.jugadorId === j.id)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];

    return `
      <article class="card">
        <div class="agente-card__head">
          <span class="carpeta__icono">🎮</span>
          <div>
            <div class="agente-card__nombre">${esc(j.nombre)}</div>
            <span class="chip chip--rojo">${esc(j.rol || "Jugador")}</span>
          </div>
        </div>

        <div class="agente-card__field">
          <b>🎯 Objetivo de la semana</b>
          ${objetivo
            ? `<span class="texto-multilinea">${esc(objetivo.objetivo)}</span>
               <span class="chip ${objetivo.completado ? "chip--teal" : "chip--gris"}" style="margin-top:6px;">
                 ${objetivo.completado ? "✔ Cumplido" : "En curso"}
               </span>`
            : `<span class="muted">Sin objetivo definido</span>`}
        </div>

        <div class="agente-card__field">
          <b>📓 Último entreno</b>
          ${ultimo
            ? `<span class="muted" style="font-size:12px;">${App.Utils.formatearFecha(ultimo.fecha)}</span>
               <span class="texto-multilinea">${esc(ultimo.practicado || ultimo.objetivoDia || "Sin descripción")}</span>`
            : `<span class="muted">Sin entrenos aún</span>`}
        </div>

        <div class="card-actions">
          <button class="btn btn--secundario btn--pequeno" data-ir="objetivos">Objetivos</button>
          <button class="btn btn--secundario btn--pequeno" data-ir="diario">Diario</button>
        </div>
      </article>
    `;
  },

  plantillaSinEquipo() {
    return `
      <div class="empty">
        <span class="empty__icon">👥</span>
        Todavía no tienes jugadores en el equipo.<br>
        Empieza dándolos de alta en <b>👥 Equipo</b>.
        <div style="margin-top:16px;">
          <button class="btn btn--primario btn--pequeno" data-ir="equipo">Ir a Equipo</button>
        </div>
      </div>`;
  }
};
