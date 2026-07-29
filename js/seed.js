/* ============================================================
   seed.js — Datos semilla iniciales (versión entrenador)
   ------------------------------------------------------------
   La primera vez que se abre la app, precargamos datos de ejemplo
   para que el entrenador vea cómo funciona todo con contenido real:
   - Los mapas oficiales de Valorant.
   - Un equipo de ejemplo (3 jugadores).
   - Para cada jugador: su objetivo de la semana, un entreno y una
     ficha de agente.

   Todo es editable/borrable. Solo se siembra si la colección
   correspondiente está vacía, para no pisar los datos reales.
   ============================================================ */

window.App = window.App || {};

App.Seed = {

  inicializar() {
    this.sembrarCatalogo();
    this.sembrarEquipoDemo();
  },

  // Catálogo del juego (mapas + agentes).
  // Se siembra UNA sola vez: usamos la existencia de "catalogoAgentes"
  // como señal de "ya migrado". Así, cuando el entrenador borre un mapa
  // o un agente desde la gestión, el borrado es permanente (no se
  // vuelven a re-crear en el siguiente arranque).
  //
  // La primera vez además completamos los mapas que falten, para que
  // quien ya tenía datos (mapas antiguos) reciba los nuevos del catálogo
  // sin duplicar los que ya existían.
  sembrarCatalogo() {
    if (App.Storage.leer("catalogoAgentes").length > 0) return;

    // Agentes del juego
    App.Catalogo.AGENTES_DEFECTO.forEach((a) =>
      App.Storage.crear("catalogoAgentes", { nombre: a.nombre, rol: a.rol })
    );

    // Mapas: añadimos los del catálogo que aún no estén
    const existentes = new Set(App.Storage.leer("mapas").map((m) => m.nombre));
    App.Catalogo.MAPAS_DEFECTO.forEach((nombre) => {
      if (!existentes.has(nombre)) App.Storage.crear("mapas", { nombre });
    });
  },

  /**
   * Siembra un equipo de ejemplo con datos en varias secciones.
   * Solo se ejecuta si aún no hay jugadores (primera vez que se abre
   * esta versión de entrenador).
   */
  sembrarEquipoDemo() {
    if (App.Storage.leer("jugadores").length > 0) return;

    const semana = App.Utils.idSemana(); // semana actual, para los objetivos

    // --- Jugador 1: Alex (IGL) ---
    const alex = App.Storage.crear("jugadores", {
      nombre: "Alex", rol: "IGL / Capitán",
      notas: "Lidera bien pero se frustra en rondas de eco."
    });
    App.Storage.crear("objetivosSemanales", {
      jugadorId: alex.id, semana, completado: false,
      objetivo: "Mantener la calma y dar calls claras en rondas de desventaja."
    });
    App.Storage.crear("entrenos", {
      jugadorId: alex.id, fecha: App.Utils.hoyISO(),
      objetivoDia: "Comunicación en rondas de eco",
      practicado: "Simulacros de rondas de fuerza y eco en Ascent.",
      progreso: "Ha mejorado: dio calls más ordenadas, menos gritos.",
      errores: "Se adelanta en la toma de decisiones cuando va perdiendo.",
      sensaciones: "Se le vio más centrado que la semana pasada."
    });
    App.Storage.crear("agentes", {
      jugadorId: alex.id, nombre: "Omen", rol: "Controlador",
      comoJuego: "Controla el mapa con humos flexibles y teleports de reposicionamiento.",
      posicionamiento: "Detrás del equipo dando visión de humos, saliendo por flancos con la TP.",
      habilidades: [
        { nombre: "Paranoia (Q)", uso: "Para abrir sitio junto a la entrada del duelista." },
        { nombre: "Dark Cover (E)", uso: "Humos de ejecución en los ángulos clave del sitio." },
        { nombre: "Shrouded Step (C)", uso: "Reposicionarse a un ángulo inesperado tras el humo." }
      ],
      sinergias: "Sus humos habilitan la entrada de Bruno (Jett)."
    });

    // --- Jugador 2: Bruno (Duelista) ---
    const bruno = App.Storage.crear("jugadores", {
      nombre: "Bruno", rol: "Duelista",
      notas: "Mucha mecánica, pero entra sin esperar la utilidad del equipo."
    });
    App.Storage.crear("objetivosSemanales", {
      jugadorId: bruno.id, semana, completado: false,
      objetivo: "Esperar los flashes del equipo antes de entrar a sitio."
    });
    App.Storage.crear("entrenos", {
      jugadorId: bruno.id, fecha: App.Utils.hoyISO(),
      objetivoDia: "Entradas coordinadas con utilidad",
      practicado: "Ejecuciones lentas practicando timing con las flashes de Alex.",
      progreso: "A medias: en 3 de 5 entradas esperó la flash correctamente.",
      errores: "Sigue peekeando en solitario cuando ve un hueco.",
      sensaciones: "Motivado, pide repetir los ejercicios."
    });
    App.Storage.crear("agentes", {
      jugadorId: bruno.id, nombre: "Jett", rol: "Duelista",
      comoJuego: "Entrada agresiva buscando picks de apertura con dash de seguridad.",
      posicionamiento: "Primera en entrar tras el flash del equipo, dash reservado para salir.",
      habilidades: [
        { nombre: "Cloudburst (C)", uso: "Humo corto para cruzar ángulos concretos." },
        { nombre: "Updraft (Q)", uso: "Subir a posiciones altas para el pick." },
        { nombre: "Tailwind (E)", uso: "Guardado para reposicionar tras el pick." },
        { nombre: "Blade Storm (X)", uso: "En eco rounds o espacios estrechos." }
      ],
      sinergias: "Necesita las flashes de Alex/Carla para entrar sin exponerse."
    });

    // --- Jugador 3: Carla (Centinela) ---
    const carla = App.Storage.crear("jugadores", {
      nombre: "Carla", rol: "Centinela",
      notas: "Muy sólida defendiendo, mejorar la comunicación de la info."
    });
    App.Storage.crear("objetivosSemanales", {
      jugadorId: carla.id, semana, completado: true,
      objetivo: "Avisar por voz cada vez que una trampa detecta flanco."
    });
    App.Storage.crear("entrenos", {
      jugadorId: carla.id, fecha: App.Utils.hoyISO(),
      objetivoDia: "Comunicar la información de la utilidad",
      practicado: "Colocaciones de utilidad y avisos de flanco en Split.",
      progreso: "Objetivo cumplido: avisó de todos los flancos detectados.",
      errores: "Gasta la utilidad demasiado pronto en algunas rondas.",
      sensaciones: "Confiada, cómoda ancleando el sitio."
    });
    App.Storage.crear("agentes", {
      jugadorId: carla.id, nombre: "Killjoy", rol: "Centinela",
      comoJuego: "Ancla el sitio con utilidad y juego reactivo esperando información.",
      posicionamiento: "Detrás de la utilidad, con ángulos cerrados hacia la entrada.",
      habilidades: [
        { nombre: "Alarmbot (C)", uso: "En rutas de flanco para avisar y aplicar vulnerable." },
        { nombre: "Turret (Q)", uso: "Cubriendo el segundo punto de entrada." },
        { nombre: "Nanoswarm (E)", uso: "Escondidas en el spike para negar el defuse." },
        { nombre: "Lockdown (X)", uso: "Para retakes o cerrar rondas 1vX." }
      ],
      sinergias: "Combina con los humos de Alex (Omen) para tapar mientras la torreta da info."
    });

    // --- Estrategia de equipo + retrospectiva (carpeta "Equipo general") ---
    const ascent = App.Storage.leer("mapas").find((m) => m.nombre === "Ascent");
    if (ascent) {
      const estrategia = App.Storage.crear("estrategias", {
        jugadorId: App.Carpetas.ID_EQUIPO, mapaId: ascent.id, agenteId: "",
        entrada: "Ejecución a B: agrupados por market esperando los humos de Omen.",
        utilidad: "Humos de Omen en Lane y CT, flash de Jett para cruzar market.",
        companeros: "Killjoy ancla, Jett entra primera, IGL apoya desde market.",
        reacciones: "Ante retake: Killjoy usa Lockdown; ante rush: Jett hace time y cuenta."
      });
      App.Storage.crear("retrospectivas", {
        jugadorId: App.Carpetas.ID_EQUIPO, estrategiaId: estrategia.id,
        quePaso: "Ejecutamos B pero nos retomaron desde CT sin avisar.",
        queFallo: "Nadie vigilaba el flanco de CT tras plantar.",
        correccion: "Asignar a Killjoy una trampa fija en CT tras el plante.",
        resultadoSiguiente: "Siguiente intento: detectamos el retake y ganamos la ronda."
      });
    }
  }
};
