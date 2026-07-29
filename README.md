# 🎯 Valorant Strategy Hub — Versión 1 (Entrenador)

Herramienta web tipo Notion centrada en **Valorant**, pensada para el **entrenador de
un equipo competitivo**: gestiona los entrenos, objetivos, agentes y estrategias de
**cada jugador** de la plantilla, además de las estrategias de equipo.

Es a la vez una herramienta real de uso diario y mi **primer proyecto de portafolio**
del ciclo de DAW (Desarrollo de Aplicaciones Web).

![Tecnologías](https://img.shields.io/badge/HTML5-CSS3-JavaScript-vanilla-informational)

---

## 📁 La idea clave: carpetas por jugador

Cada sección se organiza en **carpetas**: hay una carpeta por cada jugador del equipo
más una carpeta **"Equipo (general)"** para lo colectivo. Entras en la carpeta de un
jugador y dentro tienes *sus* entrenos, *sus* objetivos, *sus* agentes, etc. Así el
entrenador lleva el seguimiento individualizado de toda la plantilla desde un solo sitio.

---

## ✨ ¿Qué hace la app?

La app tiene un **panel del entrenador** de inicio y **6 secciones** en el menú lateral:

| Sección | Para qué sirve |
|---|---|
| 🏠 **Inicio** | Panel del entrenador: una tarjeta por jugador con su objetivo de la semana y su último entreno, más estadísticas del equipo. |
| 👥 **Equipo** | Alta/edición de jugadores (nombre, rol, notas). Cada jugador crea automáticamente su carpeta en el resto de secciones. |
| 📓 **Diario de entrenos** | Carpeta por jugador. Al abrirla se ve su objetivo semanal como referencia y se registra el entreno: objetivo del día, qué se practicó, **¿ha mejorado?**, errores y sensaciones. CRUD completo. |
| 🎯 **Objetivo semanal** | Un objetivo por semana **y por jugador**. Se marca como cumplido y guarda historial. La app **sugiere** un objetivo según los errores más repetidos del diario de ese jugador. |
| 🕵️ **Fichas de agentes** | El pool de agentes de cada jugador: cómo lo juega, posicionamiento, habilidades (una a una) y sinergias. |
| 🗺️ **Planificador de rondas** | Estrategias por jugador o de equipo, con **filtros** por mapa y agente: entrada, utilidad, compañeros y reacciones. |
| 🔁 **Retrospectivas** | Mejora continua enlazada a cada estrategia: qué pasó, qué falló, cómo se corrige y el resultado del siguiente intento. |

---

## 🛠️ Tecnologías utilizadas

- **HTML5** — estructura semántica.
- **CSS3** — diseño responsive con variables, flexbox y grid. Estética Valorant
  (fondo oscuro, rojo `#FF4655`, acentos teal/cian).
- **JavaScript puro (vanilla)** — sin frameworks, sin librerías, sin build tools.
- **localStorage** — toda la información se guarda en el navegador. **Sin servidor
  ni base de datos.**

> Es una aplicación **100% estática**, pensada para publicarse en **GitHub Pages**.

---

## 🚀 Cómo usarla

### Opción rápida (local)
Abre el archivo `index.html` directamente en el navegador (doble clic). No necesita
servidor porque no usa módulos ES ni peticiones externas.

### Publicar en GitHub Pages
1. Sube todos los archivos a un repositorio de GitHub.
2. En el repositorio: **Settings → Pages**.
3. En *Source*, elige la rama `main` y la carpeta `/root`.
4. Guarda. En unos minutos tu app estará online en
   `https://TU_USUARIO.github.io/NOMBRE_REPO/`.

---

## 💾 Copias de seguridad y sincronización (importante)

Los datos se guardan en el `localStorage` del navegador. Eso significa que se
**pierden** si borras los datos de navegación, cambias de navegador o de ordenador.
Para evitarlo, el menú lateral tiene una barra **💾 Datos** con cuatro botones:

| Botón | Qué hace | Dónde funciona |
|---|---|---|
| ⬇ **Exportar** | Descarga un archivo `equipo-valorant.json` con todo (copia de seguridad). | Cualquier navegador |
| ⬆ **Importar** | Carga un `.json` y rellena la app con esos datos. | Cualquier navegador |
| 📄 **Guardar en archivo** | Escribe directamente en un archivo real de tu disco que tú eliges. | Chrome/Edge + app publicada (HTTPS) |
| 📂 **Abrir archivo** | Abre ese archivo y trabaja directamente sobre él. | Chrome/Edge + app publicada (HTTPS) |

> **Truco para sincronizar sin servidor:** guarda ese `.json` dentro de tu carpeta de
> **Google Drive** u **OneDrive**. El programa de escritorio lo sube a la nube y lo
> sincroniza entre ordenadores. Así no lo pierdes aunque formatees el PC, y si tu
> entrenador abre el mismo archivo verá tus datos reales. (Si editáis los dos a la vez,
> gana el último que guarde.)

Las funciones "Guardar/Abrir archivo" usan la **File System Access API**, que solo
existe en navegadores tipo Chrome/Edge y con la app publicada (no con doble clic en
`file://`). Si tu navegador no la soporta, esos dos botones se ocultan y te quedan
Exportar/Importar, que funcionan siempre.

---

## 📂 Estructura del proyecto

```
.
├── index.html              # Página única (SPA) con las 5 secciones
├── css/
│   └── styles.css          # Todos los estilos (tema Valorant + responsive)
├── js/
│   ├── storage.js          # Capa de persistencia con localStorage (CRUD genérico)
│   ├── utils.js            # Utilidades: modal, escapado HTML, fechas y semanas
│   ├── carpetas.js         # Helper compartido de "carpetas por jugador"
│   ├── seed.js             # Datos iniciales (mapas + equipo de ejemplo)
│   ├── inicio.js           # Panel del entrenador
│   ├── equipo.js           # Sección Equipo (gestión de jugadores)
│   ├── diario.js           # Sección Diario de entrenos
│   ├── objetivos.js        # Sección Objetivo semanal
│   ├── agentes.js          # Sección Fichas de agentes
│   ├── planificador.js     # Sección Planificador de rondas
│   ├── retrospectivas.js   # Sección Retrospectivas
│   ├── datos.js            # Exportar/Importar y guardar/abrir archivo local
│   └── app.js              # Arranque: router de secciones, menú móvil y modal
└── README.md
```

Cada módulo de JS es independiente y sigue el mismo patrón (`render()` +
funciones de formulario/guardar/borrar), lo que hace el código **fácil de leer y
de mantener**.

---

## 🧠 Decisiones de diseño (para aprender)

- **Namespace `window.App`**: en vez de módulos ES (que requieren servidor), todo
  cuelga de un único objeto global. Así funciona incluso abriendo el `index.html`
  con doble clic.
- **`storage.js` como única puerta a los datos**: si en la Versión 2 migro a React
  + API, solo tendré que reescribir ese archivo.
- **`carpetas.js` como helper compartido**: la lógica de "carpetas por jugador" (listar,
  contar, filtrar, cabeceras) está en un único sitio y la reutilizan las 5 secciones,
  así no repito código.
- **Delegación de eventos**: los botones de editar/borrar se generan dinámicamente,
  así que escucho los clics en el contenedor padre.
- **Escapado de HTML** (`utils.escapar`): evito que el texto que escribo se
  interprete como etiquetas HTML.
- **Comentarios en español**: porque este proyecto también me sirve para estudiar.

---

## 🗺️ Modelo de datos (en `localStorage`)

Cada colección se guarda como un array JSON. El campo **`jugadorId`** es el que asigna
cada elemento a la carpeta de un jugador (o al valor `"equipo"` para la carpeta común):

```js
jugadores           → [{ id, nombre, rol, notas }]
entrenos            → [{ id, jugadorId, fecha, objetivoDia, practicado, progreso, errores, sensaciones }]
objetivosSemanales  → [{ id, jugadorId, semana, objetivo, completado }]
agentes             → [{ id, jugadorId, nombre, rol, comoJuego, posicionamiento, habilidades[], sinergias }]
mapas               → [{ id, nombre }]
estrategias         → [{ id, jugadorId, mapaId, agenteId, entrada, utilidad, companeros, reacciones }]
retrospectivas      → [{ id, jugadorId, estrategiaId, quePaso, queFallo, correccion, resultadoSiguiente }]
```

> Las claves reales llevan el prefijo `vhub_` (ej: `vhub_entrenos`) para no chocar
> con otras webs.

---

## 🔮 Roadmap (futuro, NO incluido en esta versión)

- **Versión 2** (1º del ciclo): reescritura con **React** y una base de datos real.
- **Versión 3** (2º curso): backend con **login** para todo el equipo, o app
  **Android** (DAM). Posible Proyecto Final de Ciclo.

Esta Versión 1 se mantiene **simple y bien hecha**, con código ordenado que facilite
la migración a React más adelante.

---

## 👤 Autor

Proyecto personal de aprendizaje. Hecho durante el verano antes de empezar DAW.
