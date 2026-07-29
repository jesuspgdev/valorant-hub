/* ============================================================
   datos.js — Copias de seguridad y sincronización por archivo
   ------------------------------------------------------------
   El problema: localStorage vive solo en ESTE navegador. Si borras
   los datos de navegación, cambias de navegador o de ordenador, se
   pierde. Este módulo da soluciones sin necesidad de servidor:

   Pareja 1 (universal, funciona en cualquier navegador):
   - Exportar : descarga un .json con todos los datos (copia de seguridad).
   - Importar : carga un .json y rellena la app con esos datos.

   Pareja 2 (solo Chrome/Edge y con la app publicada en HTTPS):
   - Guardar en archivo : escribe directamente en un archivo real del
     disco que tú eliges (File System Access API).
   - Abrir archivo      : abre ese archivo y trabaja sobre él.

   Truco: si ese archivo está dentro de tu carpeta de Google Drive /
   OneDrive, se sincroniza solo entre ordenadores.
   ============================================================ */

window.App = window.App || {};

App.Datos = {

  // Colecciones que forman una copia completa del equipo
  COLECCIONES: [
    "jugadores", "entrenos", "objetivosSemanales",
    "agentes", "mapas", "catalogoAgentes", "estrategias",
    "micros", "retrospectivas"
  ],

  // Manejador del archivo local elegido (File System Access API).
  // Se guarda en memoria durante la sesión: así, tras "Abrir archivo",
  // el botón "Guardar en archivo" escribe en el mismo sin volver a preguntar.
  _handle: null,

  /** ¿Soporta el navegador la escritura directa en archivos? */
  soportaArchivosLocales() {
    return "showSaveFilePicker" in window;
  },

  /**
   * Reúne todas las colecciones en un único objeto para exportar.
   * Añadimos metadatos (app y fecha) para poder validar al importar.
   */
  recopilar() {
    const datos = {};
    this.COLECCIONES.forEach((clave) => {
      datos[clave] = App.Storage.leer(clave);
    });
    return {
      app: "valorant-hub",
      version: 1,
      exportado: new Date().toISOString(),
      datos
    };
  },

  /**
   * Vuelca un objeto importado en localStorage (reemplazando lo actual).
   * Solo copia las colecciones conocidas, ignorando cualquier otra cosa.
   * @returns {boolean} true si se aplicó correctamente
   */
  aplicar(objeto) {
    // Validación básica: debe tener la estructura esperada
    if (!objeto || typeof objeto !== "object" || !objeto.datos) {
      alert("El archivo no tiene el formato correcto de Valorant Hub.");
      return false;
    }

    this.COLECCIONES.forEach((clave) => {
      // Si el archivo trae esa colección, la guardamos; si no, la dejamos igual
      if (Array.isArray(objeto.datos[clave])) {
        App.Storage.guardar(clave, objeto.datos[clave]);
      }
    });
    return true;
  },

  /* ---------------- PAREJA 1: universal ---------------- */

  /** Descarga un archivo .json con toda la información. */
  exportar() {
    const contenido = JSON.stringify(this.recopilar(), null, 2);
    const blob = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Creamos un enlace temporal y simulamos el clic para descargar
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "equipo-valorant.json";
    enlace.click();

    URL.revokeObjectURL(url); // liberamos memoria
  },

  /** Abre el selector de archivos y carga el .json elegido. */
  importar() {
    // Creamos un <input type="file"> oculto al vuelo
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.addEventListener("change", () => {
      const archivo = input.files[0];
      if (!archivo) return;

      const lector = new FileReader();
      lector.onload = () => {
        try {
          const objeto = JSON.parse(lector.result);
          if (!confirm("Esto reemplazará los datos actuales por los del archivo. ¿Continuar?")) return;
          if (this.aplicar(objeto)) {
            App.refrescar();
            alert("Datos importados correctamente.");
          }
        } catch (e) {
          alert("No se pudo leer el archivo: " + e.message);
        }
      };
      lector.readAsText(archivo);
    });

    input.click();
  },

  /* ---------------- PAREJA 2: archivo local (Chrome/Edge) ---------------- */

  /**
   * Guarda los datos directamente en un archivo del disco.
   * La primera vez pide elegir/crear el archivo; después reutiliza
   * el mismo durante la sesión.
   */
  async guardarEnArchivo() {
    try {
      // Si aún no hay archivo elegido, pedimos uno
      if (!this._handle) {
        this._handle = await window.showSaveFilePicker({
          suggestedName: "equipo-valorant.json",
          types: [{ description: "Archivo JSON", accept: { "application/json": [".json"] } }]
        });
      }
      // Escribimos el contenido
      const escritor = await this._handle.createWritable();
      await escritor.write(JSON.stringify(this.recopilar(), null, 2));
      await escritor.close();
      alert("Datos guardados en el archivo.");
    } catch (e) {
      // AbortError = el usuario canceló el diálogo; no es un error real
      if (e.name !== "AbortError") alert("No se pudo guardar: " + e.message);
    }
  },

  /**
   * Abre un archivo del disco, carga sus datos y lo deja vinculado
   * para futuros "Guardar en archivo".
   */
  async abrirArchivo() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: "Archivo JSON", accept: { "application/json": [".json"] } }]
      });
      this._handle = handle;

      const archivo = await handle.getFile();
      const texto = await archivo.text();
      const objeto = JSON.parse(texto);

      if (!confirm("Esto reemplazará los datos actuales por los del archivo. ¿Continuar?")) return;
      if (this.aplicar(objeto)) {
        App.refrescar();
        alert("Archivo abierto. A partir de ahora, “Guardar en archivo” escribirá aquí.");
      }
    } catch (e) {
      if (e.name !== "AbortError") alert("No se pudo abrir: " + e.message);
    }
  },

  /* ---------------- ARRANQUE ---------------- */

  /** Conecta los botones de la barra de datos del menú lateral. */
  init() {
    document.getElementById("btn-exportar").addEventListener("click", () => this.exportar());
    document.getElementById("btn-importar").addEventListener("click", () => this.importar());

    const btnGuardar = document.getElementById("btn-guardar-archivo");
    const btnAbrir = document.getElementById("btn-abrir-archivo");

    if (this.soportaArchivosLocales()) {
      btnGuardar.addEventListener("click", () => this.guardarEnArchivo());
      btnAbrir.addEventListener("click", () => this.abrirArchivo());
    } else {
      // Navegador sin soporte (Firefox, Safari) o abierto con doble clic:
      // ocultamos esos botones y dejamos solo Exportar/Importar.
      btnGuardar.style.display = "none";
      btnAbrir.style.display = "none";
    }
  }
};
