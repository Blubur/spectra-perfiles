(function () {
  "use strict";

  var WIDGET_ID = "spectra-registros";
  var APP_NAME  = "spectra-registros-widget";

  var FIREBASE_CONFIG = {
    apiKey:            "AIzaSyA_DTdVWhe54PRrPlFFmIkdbMuotiSssZU",
    authDomain:        "spectra-85df4.firebaseapp.com",
    projectId:         "spectra-85df4",
    storageBucket:     "spectra-85df4.firebasestorage.app",
    messagingSenderId: "321843589344",
    appId:             "1:321843589344:web:714ca78124d8aef4d66085"
  };

  var FIREBASE_SCRIPTS = [
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"
  ];

  var FONT_URL  = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&family=DM+Sans:wght@200;300;400;500&family=DM+Serif+Display:ital@0;1&display=swap";
  var ICONS_URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

  var PARL_COLOR = {
    primigenios:    "#A53E67",
    arquitectos:    "#0C459C",
    sabios:         "#00674E",
    caoticos:       "#5A4160",
    exterminadores: "#A53E4A",
    staff:          "#b5a081"
  };

  var allRows   = [];
  var filtroE   = "all";
  var filtroTxt = "";
  var sortCol   = "username";   /* ← cambiado: ordenar por username en lugar de charName */
  var sortDir   = "asc";
  var root;

  /* ══════════════════════════════════════════════════════════════
      UTILIDADES
  ══════════════════════════════════════════════════════════════ */

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fmtDate(str) {
    if (!str) return "";
    try {
      var p = str.split("-");
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) { return str; }
  }

  function loadStyleHref(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet"; link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "true") { resolve(); return; }
        existing.addEventListener("load", resolve, { once: true });
        return;
      }
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = function () { s.dataset.loaded = "true"; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureFirebase() {
    return FIREBASE_SCRIPTS.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  function initFirebaseApp() {
    if (!window.firebase) throw new Error("Firebase no cargado.");
    var existing = null;
    try { existing = firebase.app(APP_NAME); } catch (e) { existing = null; }
    return existing || firebase.initializeApp(FIREBASE_CONFIG, APP_NAME);
  }

  /* ══════════════════════════════════════════════════════════════
      ESTILOS
  ══════════════════════════════════════════════════════════════ */

  function injectStyles() {
    if (document.getElementById("spectra-registros-style")) return;
    var style = document.createElement("style");
    style.id = "spectra-registros-style";
    style.textContent = `
      #spectra-registros .s-post-wide {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
      }
      #spectra-registros .sr-header {
        padding: clamp(3rem, 6vw, 4.5rem) 2rem 3rem;
        text-align: center;
        border-bottom: 1px solid var(--mono-border1, #3b3a37);
        position: relative;
        overflow: hidden;
      }
      #spectra-registros .sr-header::before {
        content: "";
        position: absolute; inset: 0;
        background: radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--accent-solid1, #b5a081), transparent 85%), transparent);
        pointer-events: none;
      }
      #spectra-registros .sr-header h1 {
        position: relative;
        font: clamp(3.8rem, 6vw, 5.6rem) var(--f-deco, 'DM Serif Display', serif);
        font-style: italic;
        line-height: 1;
        margin: 0 0 .75rem;
        color: var(--mono-text2, #eeeeec);
      }
      #spectra-registros .sr-header p {
        position: relative;
        font: 300 .78rem var(--f-sans, 'DM Sans', sans-serif);
        color: var(--mono-text1, #b5b3ad);
        text-transform: uppercase;
        letter-spacing: .12em;
        margin: 0;
      }
      #spectra-registros .sr-toolbar {
        display: flex; flex-wrap: wrap; gap: .5rem; align-items: center;
        padding: 1rem 2rem;
        border-bottom: 1px solid var(--mono-border1, #3b3a37);
        background: var(--mono-surface2, #191918);
      }
      #spectra-registros .sr-search {
        flex: 1; min-width: 140px;
        background: var(--mono-component1, #222221);
        border: 1px solid var(--mono-border2, #494844);
        border-radius: 999px;
        padding: .35rem .9rem;
        font: 300 .75rem var(--f-mono, 'DM Mono', monospace);
        color: var(--mono-text2, #eeeeec);
        outline: none;
        transition: border-color .2s;
      }
      #spectra-registros .sr-search:focus { border-color: var(--accent-border2, #574a38); }
      #spectra-registros .sr-search::placeholder { color: var(--mono-text1, #b5b3ad); }
      #spectra-registros .sr-pills { display: flex; flex-wrap: wrap; gap: .35rem; }
      #spectra-registros .sr-pill {
        font: 300 .6rem var(--f-mono, 'DM Mono', monospace);
        text-transform: uppercase; letter-spacing: .08em;
        padding: .2rem .6rem;
        border: 1px solid var(--mono-border2, #494844);
        background: var(--mono-component1, #222221);
        color: var(--mono-text1, #b5b3ad);
        border-radius: 999px; cursor: pointer;
        transition: all .25s ease; user-select: none;
      }
      #spectra-registros .sr-pill:hover { border-color: var(--accent-border2, #574a38); color: var(--accent-text1, #cbb696); }
      #spectra-registros .sr-pill.active {
        background: var(--pill-bg, var(--accent-solid1, #b5a081));
        border-color: var(--pill-bg, var(--accent-solid1, #b5a081));
        color: #fff;
      }
      /* PNJ pill active: fondo azul suave */
      #spectra-registros .sr-pill[data-f="pnj"].active {
        background: #1e4a7a;
        border-color: #1e4a7a;
        color: #7ec8f7;
      }
      #spectra-registros .sr-count {
        font: 300 .6rem var(--f-mono, 'DM Mono', monospace);
        color: var(--mono-text1, #b5b3ad);
        margin-left: auto; white-space: nowrap;
      }
      #spectra-registros .sr-table-wrap { padding: 1.5rem 2rem; }
      #spectra-registros .sr-head {
        display: grid;
        /* ← CAMBIADO: sin columna de personaje, sólo usuario + parlamento + fc1 + fc2 + estado */
        grid-template-columns: 1.3fr 1fr 1fr 1fr .9fr;
        border-bottom: 2px solid var(--mono-border2, #494844);
        padding-bottom: .4rem; margin-bottom: .2rem;
      }
      #spectra-registros .sr-th {
        font: 300 var(--f-base) var(--f-mono, 'DM Mono', monospace);
        text-transform: uppercase; letter-spacing: .12em;
        color: var(--mono-text1, #b5b3ad);
        padding: .35rem .5rem;
        cursor: pointer; user-select: none; white-space: nowrap;
        transition: color .2s;
      }
      #spectra-registros .sr-th:hover { color: var(--accent-text1, #cbb696); }
      #spectra-registros .sr-th.asc::after  { content: " ↑"; color: var(--accent-solid1, #b5a081); }
      #spectra-registros .sr-th.desc::after { content: " ↓"; color: var(--accent-solid1, #b5a081); }
      #spectra-registros .sr-th.nosort { cursor: default; }
      #spectra-registros .sr-th.nosort:hover { color: var(--mono-text1, #b5b3ad); }
      #spectra-registros .sr-body { display: flex; flex-direction: column; }
      #spectra-registros .sr-row {
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr 1fr .9fr;
        border-bottom: 1px solid var(--mono-border1, #3b3a37);
        padding: .55rem 0; align-items: center; transition: background .15s;
      }
      #spectra-registros .sr-row:last-child { border-bottom: none; }
      #spectra-registros .sr-row:hover { background: var(--mono-component1, #222221); border-radius: 3px; }
      #spectra-registros .sr-td { padding: 0 .5rem; }

      /* ── Usuario: sólo el username con enlace ── */
      #spectra-registros .sr-user-link {
        font: 300 .8rem var(--f-mono, 'DM Mono', monospace);
        color: var(--accent-text1, #cbb696);
        text-decoration: none;
        display: inline-flex; align-items: center; gap: .3em;
        transition: opacity .2s;
      }
      #spectra-registros .sr-user-link:hover { opacity: .8; text-decoration: underline; }
      #spectra-registros .sr-user-link::after { content: "↗"; font-size: .55rem; }
      #spectra-registros .sr-user-plain {
        font: 300 .8rem var(--f-mono, 'DM Mono', monospace);
        color: var(--mono-text1, #b5b3ad);
      }

      #spectra-registros .sr-parl {
        font: 300 var(--f-s) var(--f-mono, 'DM Mono', monospace);
        text-transform: uppercase; letter-spacing: .06em;
        display: inline-flex; align-items: center; gap: .4em;
      }
      #spectra-registros .sr-parl::before {
        content: ""; width: 6px; height: 6px; border-radius: 50%;
        background: var(--parl-c, #b5b3ad); flex-shrink: 0;
      }
      #spectra-registros .sr-fc {
        font: 300 .72rem var(--f-mono, 'DM Mono', monospace);
        color: var(--mono-text1, #b5b3ad);
      }
      #spectra-registros .sr-fc.empty { opacity: .3; }
      #spectra-registros .sr-estado { display: flex; flex-direction: column; gap: .3rem; }
      #spectra-registros .sr-badge {
        display: inline-flex; align-items: center; gap: .3em;
        font: 300 .58rem var(--f-mono, 'DM Mono', monospace);
        text-transform: uppercase; letter-spacing: .06em;
        padding: 2px .5rem; border-radius: 999px; border: 1px solid;
        white-space: nowrap; width: fit-content;
      }
      #spectra-registros .sr-badge-activo   { background: var(--success-surface, #0f2e22); border-color: var(--success-border, #1b5745); color: var(--success-text, #adf0d4); }
      #spectra-registros .sr-badge-inactivo { background: var(--mono-component1, #222221); border-color: var(--mono-border2, #494844);   color: var(--mono-text1, #b5b3ad); }
      #spectra-registros .sr-badge-reserva  { background: var(--warning-surface, #331e0b); border-color: var(--warning-border, #66350c); color: var(--warning-text, #ffa057); }
      /* ← NUEVO: badge PNJ */
      #spectra-registros .sr-badge-pnj      { background: #0d2440; border-color: #1e4a7a; color: #7ec8f7; }
      #spectra-registros .sr-reserva-chip {
        font: 300 .58rem var(--f-mono, 'DM Mono', monospace);
        color: var(--warning-text, #ffa057);
        display: inline-flex; align-items: center; gap: .25em; white-space: nowrap;
      }
      #spectra-registros .sr-empty,
      #spectra-registros .sr-loader,
      #spectra-registros .sr-error {
        text-align: center; padding: 3rem 1rem;
        color: var(--mono-text1, #b5b3ad);
        font: 300 .8rem var(--f-mono, 'DM Mono', monospace);
        text-transform: uppercase; letter-spacing: .1em;
      }
      #spectra-registros .sr-dots { display: inline-flex; gap: .4rem; }
      #spectra-registros .sr-dots span {
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--accent-solid1, #b5a081);
        animation: srBounce 1.2s infinite;
      }
      #spectra-registros .sr-dots span:nth-child(2) { animation-delay: .2s; }
      #spectra-registros .sr-dots span:nth-child(3) { animation-delay: .4s; }
      @keyframes srBounce {
        0%,60%,100% { transform: translateY(0); opacity: .4; }
        30% { transform: translateY(-7px); opacity: 1; }
      }
      @media (max-width: 640px) {
        #spectra-registros .sr-head,
        #spectra-registros .sr-row { grid-template-columns: 1.3fr 1fr .9fr; }
        #spectra-registros .sr-th:nth-child(4),
        #spectra-registros .sr-td:nth-child(4) { display: none; }
        #spectra-registros .sr-table-wrap { padding: 1rem; }
        #spectra-registros .sr-toolbar { padding: .75rem 1rem; }
      }
      @media (max-width: 400px) {
        #spectra-registros .sr-head,
        #spectra-registros .sr-row { grid-template-columns: 1.3fr 1fr; }
        #spectra-registros .sr-th:nth-child(3),
        #spectra-registros .sr-td:nth-child(3) { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════════════════════════
      RENDER SHELL
  ══════════════════════════════════════════════════════════════ */

  function renderShell() {
    root.innerHTML =
      '<div class="s-post-wide">' +
        '<section class="sr-header">' +
          '<h1>Registro</h1>' +
          '<p>Registros de Play by y grupo</p>' +
        '</section>' +
        '<div class="sr-toolbar">' +
          '<input class="sr-search" type="search" placeholder="Buscar usuario, FC, parlamento…" autocomplete="off">' +
          '<div class="sr-pills">' +
            mkPill("all",      "Todos",     "") +
            mkPill("activo",   "Activos",   "#00674E") +
            mkPill("inactivo", "Inactivos", "#6f6d66") +
            mkPill("reserva",  "Reservas",  "#A53E4A") +
            mkPill("pnj",      "PNJ",       "#1e4a7a") +
          '</div>' +
          '<span class="sr-count" data-role="count"></span>' +
        '</div>' +
        '<div class="sr-table-wrap">' +
          '<div class="sr-head" data-role="head"></div>' +
          '<div class="sr-body" data-role="body">' +
            '<div class="sr-loader"><div class="sr-dots"><span></span><span></span><span></span></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    renderHead();

    var timer;
    root.querySelector(".sr-search").addEventListener("input", function (e) {
      clearTimeout(timer);
      var val = e.target.value;
      timer = setTimeout(function () {
        filtroTxt = val.trim().toLowerCase();
        renderBody();
      }, 180);
    });

    root.querySelector(".sr-pills").addEventListener("click", function (e) {
      var btn = e.target.closest(".sr-pill");
      if (!btn) return;
      filtroE = btn.dataset.f;
      root.querySelectorAll(".sr-pill").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderBody();
    });
  }

  function mkPill(f, label, bg) {
    var style = bg ? ' style="--pill-bg:' + bg + '"' : "";
    return '<span class="sr-pill' + (f === filtroE ? " active" : "") + '" data-f="' + f + '"' + style + '>' + label + '</span>';
  }

  /* ← CAMBIADO: primera columna es "Usuario" en lugar de "Personaje" */
  var COLS = [
    { col: "username",   label: "Usuario" },
    { col: "parlamento", label: "Parlamento" },
    { col: "faceclaim1", label: "Faceclaim 1" },
    { col: "faceclaim2", label: "Faceclaim 2" },
    { col: "",           label: "Estado", nosort: true }
  ];

  function renderHead() {
    var head = root.querySelector('[data-role="head"]');
    if (!head) return;
    head.innerHTML = COLS.map(function (c) {
      var cls = "sr-th" + (c.nosort ? " nosort" : "");
      if (!c.nosort && sortCol === c.col) cls += " " + sortDir;
      var attr = c.nosort ? "" : ' data-col="' + c.col + '"';
      return '<span class="' + cls + '"' + attr + '>' + c.label + '</span>';
    }).join("");

    head.querySelectorAll(".sr-th[data-col]").forEach(function (th) {
      th.addEventListener("click", function () {
        var col = th.dataset.col;
        sortDir = (sortCol === col && sortDir === "asc") ? "desc" : "asc";
        sortCol = col;
        head.querySelectorAll(".sr-th").forEach(function (t) { t.classList.remove("asc", "desc"); });
        th.classList.add(sortDir);
        renderBody();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
      RENDER BODY
  ══════════════════════════════════════════════════════════════ */

  function renderBody() {
    var body = root.querySelector('[data-role="body"]');
    if (!body) return;

    var filtered = allRows.filter(function (r) {
      if (filtroE !== "all" && r.estado !== filtroE) return false;
      if (filtroTxt) {
        /* ← búsqueda por username, parlamento y faceclaims (sin charName) */
        var hay = (r.username + r.parlamento + r.faceclaim1 + r.faceclaim2).toLowerCase();
        if (hay.indexOf(filtroTxt) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      var va = String(a[sortCol] || "").toLowerCase();
      var vb = String(b[sortCol] || "").toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    var countEl = root.querySelector('[data-role="count"]');
    if (countEl) countEl.textContent = filtered.length + " registro" + (filtered.length !== 1 ? "s" : "");

    if (!filtered.length) {
      body.innerHTML = '<div class="sr-empty">Sin resultados</div>';
      return;
    }

    body.innerHTML = filtered.map(function (r) {
      var color = PARL_COLOR[r.parlamento] || "#b5b3ad";

      /* ← CAMBIADO: sólo username con enlace al perfil, sin charName */
      var userCell = r.numUsuario
        ? '<a class="sr-user-link" href="/u' + esc(r.numUsuario) + '">' + esc(r.username) + '</a>'
        : '<span class="sr-user-plain">' + esc(r.username) + '</span>';

      var parlCell = '<span class="sr-parl" style="--parl-c:' + color + '">' + esc(r.parlamento || "—") + '</span>';
      var fc1Cell  = '<span class="sr-fc' + (r.faceclaim1 ? '' : ' empty') + '">' + esc(r.faceclaim1 || "—") + '</span>';
      var fc2Cell  = '<span class="sr-fc' + (r.faceclaim2 ? '' : ' empty') + '">' + esc(r.faceclaim2 || "—") + '</span>';

      /* ← AÑADIDO: caso pnj en badgeMap */
      var badgeMap = {
        activo:   ["sr-badge-activo",   "✓ Activo"],
        inactivo: ["sr-badge-inactivo", "— Inactivo"],
        reserva:  ["sr-badge-reserva",  "◷ Reserva"],
        pnj:      ["sr-badge-pnj",      "⬡ PNJ"]
      };
      var ep = badgeMap[r.estado] || ["sr-badge-inactivo", "—"];
      var estadoCell =
        '<div class="sr-estado">' +
          '<span class="sr-badge ' + ep[0] + '">' + ep[1] + '</span>' +
          (r.estado === "reserva" && r.fechaReserva
            ? '<span class="sr-reserva-chip">⧗ ' + esc(fmtDate(r.fechaReserva)) + '</span>'
            : '') +
        '</div>';

      return '<div class="sr-row">' +
        '<div class="sr-td">' + userCell   + '</div>' +
        '<div class="sr-td">' + parlCell   + '</div>' +
        '<div class="sr-td">' + fc1Cell    + '</div>' +
        '<div class="sr-td">' + fc2Cell    + '</div>' +
        '<div class="sr-td">' + estadoCell + '</div>' +
      '</div>';
    }).join("");
  }

  function renderError(msg) {
    var body = root && root.querySelector('[data-role="body"]');
    if (body) body.innerHTML = '<div class="sr-error">' + esc(msg) + '</div>';
  }

  /* ══════════════════════════════════════════════════════════════
      FIREBASE
  ══════════════════════════════════════════════════════════════ */

  function fetchData(db) {
    db.collection("users").onSnapshot(function (snap) {
      allRows = [];
      snap.forEach(function (d) {
        var u   = d.data();
        var reg = u.registro || {};
        /* ← INCLUIDO pnj: mostrar también usuarios con estado pnj */
        if (!reg.estado) return;
        allRows.push({
          username:     u.username      || d.id,
          numUsuario:   reg.numUsuario   || null,
          parlamento:   u.parlamento    || "",
          faceclaim1:   reg.faceclaim1   || "",
          faceclaim2:   reg.faceclaim2   || "",
          estado:       reg.estado       || "",
          fechaReserva: reg.fechaReserva || ""
        });
      });
      renderBody();
    }, function (err) {
      renderError("No se pudieron cargar los registros: " + err.message);
    });
  }

  /* ══════════════════════════════════════════════════════════════
      INICIO
  ══════════════════════════════════════════════════════════════ */

  function start() {
    root = document.getElementById(WIDGET_ID);
    if (!root) return;

    loadStyleHref(FONT_URL);
    loadStyleHref(ICONS_URL);
    injectStyles();
    renderShell();

    ensureFirebase()
      .then(function () {
        var app = initFirebaseApp();
        var db  = firebase.firestore(app);
        if (db.enableNetwork) db.enableNetwork().catch(function () {});
        fetchData(db);
      })
      .catch(function (err) {
        renderError("No se pudo iniciar Firebase: " + err.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
