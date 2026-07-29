/* ============================================================
   storage.js — Capa de persistencia con localStorage
   ------------------------------------------------------------
   ¿Por qué un módulo aparte?
   Toda la app guarda datos en el navegador. En lugar de llamar a
   localStorage por todas partes (y repetir JSON.parse/stringify),
   centralizamos aquí la lógica. Si algún día migramos a React + API
   (Versión 2), solo habrá que reescribir ESTE archivo.

   Cada "colección" (entrenos, agentes, etc.) se guarda como un array
   en formato JSON bajo una clave de localStorage.
   ============================================================ */

// Usamos un objeto global "App" como espacio de nombres para no
// contaminar el ámbito global con muchas variables sueltas.
window.App = window.App || {};

App.Storage = {

  // Prefijo para no chocar con otras webs que usen localStorage.
  PREFIJO: "vhub_",

  /**
   * Lee una colección completa y la devuelve como array.
   * @param {string} clave - nombre de la colección (ej: "entrenos")
   * @returns {Array} array de objetos (vacío si no existe)
   */
  leer(clave) {
    const bruto = localStorage.getItem(this.PREFIJO + clave);
    if (!bruto) return [];
    try {
      // Convertimos el texto JSON guardado de vuelta a array/objeto
      return JSON.parse(bruto);
    } catch (e) {
      // Si los datos están corruptos, no rompemos la app: devolvemos vacío
      console.warn("No se pudo leer la colección", clave, e);
      return [];
    }
  },

  /**
   * Guarda una colección completa (sobreescribe la anterior).
   * @param {string} clave
   * @param {Array} datos
   */
  guardar(clave, datos) {
    localStorage.setItem(this.PREFIJO + clave, JSON.stringify(datos));
  },

  /**
   * Añade un elemento nuevo a una colección y lo devuelve.
   * Genera automáticamente un id único.
   */
  crear(clave, objeto) {
    const lista = this.leer(clave);
    objeto.id = this.generarId();
    lista.push(objeto);
    this.guardar(clave, lista);
    return objeto;
  },

  /**
   * Actualiza un elemento existente buscándolo por su id.
   * @returns {boolean} true si lo encontró y actualizó
   */
  actualizar(clave, id, cambios) {
    const lista = this.leer(clave);
    const indice = lista.findIndex((item) => item.id === id);
    if (indice === -1) return false;
    // Combinamos el objeto original con los cambios (spread operator)
    lista[indice] = { ...lista[indice], ...cambios };
    this.guardar(clave, lista);
    return true;
  },

  /**
   * Borra un elemento por su id.
   */
  borrar(clave, id) {
    const lista = this.leer(clave).filter((item) => item.id !== id);
    this.guardar(clave, lista);
  },

  /**
   * Busca un único elemento por id (o undefined si no existe).
   */
  buscarPorId(clave, id) {
    return this.leer(clave).find((item) => item.id === id);
  },

  /**
   * Genera un identificador único sencillo.
   * Combina la marca de tiempo con un número aleatorio para
   * evitar colisiones. Suficiente para una app de un solo usuario.
   */
  generarId() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }
};
