/* ============================================================
   utils.js — Funciones de ayuda reutilizables
   ------------------------------------------------------------
   Aquí van pequeñas herramientas que usan varias secciones:
   - Manejo del modal genérico (abrir/cerrar formularios)
   - Escapado de HTML (seguridad frente a inyección de texto)
   - Formateo y cálculo de fechas y semanas
   ============================================================ */

window.App = window.App || {};

App.Utils = {

  /* ---------------- MODAL GENÉRICO ----------------
     Un único modal en el HTML se reutiliza para todos los
     formularios. Le inyectamos título y contenido desde JS. */

  /**
   * Abre el modal con un título y un HTML de contenido.
   * @param {string} titulo
   * @param {string} htmlContenido - HTML (normalmente un <form>)
   */
  abrirModal(titulo, htmlContenido) {
    document.getElementById("modal-titulo").textContent = titulo;
    document.getElementById("modal-body").innerHTML = htmlContenido;
    document.getElementById("modal").classList.add("is-open");
  },

  /** Cierra el modal y limpia su contenido. */
  cerrarModal() {
    document.getElementById("modal").classList.remove("is-open");
    document.getElementById("modal-body").innerHTML = "";
  },

  /* ---------------- SEGURIDAD ---------------- */

  /**
   * Escapa caracteres especiales de HTML.
   * ¿Por qué? Cuando mostramos texto que ha escrito el usuario dentro
   * de innerHTML, si no lo escapamos podría inyectar etiquetas. Esto
   * lo evita convirtiendo < > & " en entidades seguras.
   */
  escapar(texto) {
    if (texto === undefined || texto === null) return "";
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  /* ---------------- FECHAS Y SEMANAS ---------------- */

  /**
   * Devuelve la fecha de hoy en formato AAAA-MM-DD (para inputs date).
   */
  hoyISO() {
    return new Date().toISOString().slice(0, 10);
  },

  /**
   * Convierte "2026-07-29" en algo legible: "mié, 29 jul 2026".
   */
  formatearFecha(iso) {
    if (!iso) return "";
    const fecha = new Date(iso + "T00:00:00");
    return fecha.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  },

  /**
   * Calcula el identificador de la semana ISO de una fecha, tipo "2026-W31".
   * Se usa para asociar cada objetivo a una semana concreta.
   * (Algoritmo estándar de semana ISO 8601.)
   */
  idSemana(fecha = new Date()) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    // El jueves de la misma semana determina el año/número ISO
    const dia = d.getUTCDay() || 7; // domingo pasa de 0 a 7
    d.setUTCDate(d.getUTCDate() + 4 - dia);
    const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const numSemana = Math.ceil((((d - inicioAnio) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + "-W" + String(numSemana).padStart(2, "0");
  },

  /**
   * Texto legible de una semana, ej: "Semana 31 · 2026".
   */
  formatearSemana(idSemana) {
    if (!idSemana) return "";
    const [anio, sem] = idSemana.split("-W");
    return "Semana " + sem + " · " + anio;
  }
};
