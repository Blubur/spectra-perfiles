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

  /* ── estado ── */
  var allRows   = [];
  var filtroE   = "all";
  var filtroTxt = "";
  var sortCol   = "charName";
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
    style.textContent = [

      /* ── toolbar ── */
      "#spectra-registros .sr-toolbar{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;padding:.85rem 0;border-bottom:1px solid var(--mono-border1,#3b3a37);margin-bottom:.5rem;}",

      "#spectra-registros .sr-search{flex:1;min-width:140px;background:var(--mono-component1,#222221);border:1px solid var(--mono-border2,#494844);border-radius:999px;padding:.35rem .9rem;font:300 .75rem var(--f-mono,'DM Mono',monospace);color:var(--mono-text2,#eeeeec);outline:none;transition:border-color .2s;}",
      "#spectra-registros .sr-search:focus{border-color:var(--accent-border2,#574a38);}",
      "#spectra-registros .sr-search::placeholder{color:var(--mono-text1,#b5b3ad);}",

      "#spectra-registros .sr-pills{display:flex;flex-wrap:wrap;gap:.35rem;}",

      "#spectra-registros .sr-pill{font:300 .6rem var(--f-mono,'DM Mono',monospace);text-transform:uppercase;letter-spacing:.08em;padding:.2rem .6rem;border:1px solid var(--mono-border2,#494844);background:var(--mono-component1,#222221);color:var(--mono-text1,#b5b3ad);border-radius:999px;cursor:pointer;transition:all .25s ease;user-select:none;}",
      "#spectra-registros .sr-pill:hover{border-color:var(--accent-border2,#574a38);color:var(--accent-text1,#cbb696);}",
      "#spectra-registros .sr-pill.active{background:var(--pill-bg,var(--accent-solid1,#b5a081));border-color:var(--pill-bg,var(--accent-solid1,#b5a081));color:#fff;}",

      "#spectra-registros .sr-count{font:300 .6rem var(--f-mono,'DM Mono',monospace);color:var(--mono-text1,#b5b3ad);margin-left:auto;white-space:nowrap;}",

      /* ── cabecera columnas ── */
      "#spectra-registros .sr-head{display:grid;grid-template-columns:1.2fr .9fr .9fr .9fr .8fr;border-bottom:2px solid var(--mono-border2,#494844);padding-bottom:.4rem;margin-bottom:.2rem;}",

      "#spectra-registros .sr-th{font:300 .6rem var(--f-mono,'DM Mono',monospace);text-transform:uppercase;letter-spacing:.12em;color:var(--mono-text1,#b5b3ad);padding:.35rem .5rem;cursor:pointer;user-select:none;white-space:nowrap;transition:color .2s;}",
      "#spectra-registros .sr-th:hover{color:var(--accent-text1,#cbb696);}",
      "#spectra-registros .sr-th.asc::after{content:' ↑';color:var(--accent-solid1,#b5a081);}",
      "#spectra-registros .sr-th.desc::after{content:' ↓';color:var(--accent-solid1,#b5a081);}",
      "#spectra-registros .sr-th.nosort{cursor:default;}",
      "#spectra-registros .sr-th.nosort:hover{color:var(--mono-text1,#b5b3ad);}",

      /* ── filas ── */
      "#spectra-registros .sr-body{display:flex;flex-direction:column;}",

      "#spectra-registros .sr-row{display:grid;grid-template-columns:1.2fr .9fr .9fr .9fr .8fr;border-bottom:1px solid var(--mono-border1,#3b3a37);padding:.55rem 0;align-items:center;transition:background .15s;}",
      "#spectra-registros .sr-row:last-child{border-bottom:none;}",
      "#spectra-registros .sr-row:hover{background:var(--mono-component1,#222221);border-radius:3px;}",

      "#spectra-registros .sr-td{padding:0 .5rem;}",

      /* celda personaje */
      "#spectra-registros .sr-char{display:flex;flex-direction:column;gap:2px;}",
      "#spectra-registros .sr-char-name{font:italic 1rem var(--f-deco,'DM Serif Display',serif);color:var(--mono-text2,#eeeeec);line-height:1.2;}",
      "#spectra-registros .sr-char-link{font:300 .6rem var(--f-mono,'DM Mono',monospace);color:var(--accent-text1,#cbb696);text-decoration:none;opacity:.7;transition:opacity .2s;display:inline-flex;align-items:center;gap:.25em;}",
      "#spectra-registros .sr-char-link:hover{opacity:1;text-decoration:underline;}",
      "#spectra-registros .sr-char-link::after{content:'↗';font-size:.55rem;}",

      /* celda parlamento */
      "#spectra-registros .sr-parl{font:300 .6rem var(--f-mono,'DM Mono',monospace);text-transform:uppercase;letter-spacing:.06em;display:inline-flex;align-items:center;gap:.4em;}",
      "#spectra-registros .sr-parl::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--parl-c,#b5b3ad);flex-shrink:0;}",

      /* celda FC */
      "#spectra-registros .sr-fc{font:300 .72rem var(--f-mono,'DM Mono',monospace);color:var(--mono-text1,#b5b3ad);}",
      "#spectra-registros .sr-fc.empty{opacity:.3;}",

      /* estado */
      "#spectra-registros .sr-estado{display:flex;flex-direction:column;gap:.3rem;}",

      "#spectra-registros .sr-badge{display:inline-flex;align-items:center;gap:.3em;font:300 .58rem var(--f-mono,'DM Mono',monospace);text-transform:uppercase;letter-spacing:.06em;padding:2px .5rem;border-radius:999px;border:1px solid;white-space:nowrap;width:fit-content;}",
      "#spectra-registros .sr-badge-activo{background:var(--success-surface,#0f2e22);border-color:var(--success-border,#1b5745);color:var(--success-text,#adf0d4);}",
      "#spectra-registros .sr-badge-inactivo{background:var(--mono-component1,#222221);border-color:var(--mono-border2,#494844);color:var(--mono-text1,#b5b3ad);}",
      "#spectra-registros .sr-badge-reserva{background:var(--warning-surface,#331e0b);border-color:var(--warning-border,#66350c);color:var(--warning-text,#ffa057);}",

      "#spectra-registros .sr-reserva-chip{font:300 .58rem var(--f-mono,'DM Mono',monospace);color:var(--warning-text,#ffa057);display:inline-flex;align-items:center;gap:.25em;white-space:nowrap;}",

      /* empty / loader */
      "#spectra-registros .sr-empty,#spectra-registros .sr-loader{text-align:center;padding:3rem 1rem;color:var(--mono-text1,#b5b3ad);font:300 .75rem var(--f-mono,'DM Mono',monospace);text-transform:uppercase;letter-spacing:.1em;}",

      "#spectra-registros .sr-dots{display:inline-flex;gap:.4rem;}",
      "#spectra-registros .sr-dots span{width:7px;height:7px;border-radius:50%;background:var(--accent-solid1,#b5a081);animation:srBounce 1.2s infinite;}",
      "#spectra-registros .sr-dots span:nth-child(2){animation-delay:.2s;}",
      "#spectra-registros .sr-dots span:nth-child(3){animation-delay:.4s;}",
      "@keyframes srBounce{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-7px);opacity:1;}}",

      /* responsive */
      "@media(max-width:640px){",
        "#spectra-registros .sr-head,#spectra-registros .sr-row{grid-template-columns:1.2fr .9fr .8fr;}",
        "#spectra-registros .sr-th:nth-child(4),#spectra-registros .sr-td:nth-child(4){display:none;}",
      "}",
      "@media(max-width:420px){",
        "#spectra-registros .sr-head,#spectra-registros .sr-row{grid-template-columns:1.3fr .8fr;}",
        "#spectra-registros .sr-th:nth-child(3),#spectra-registros .sr-td:nth-child(3),",
        "#spectra-registros .sr-th:nth-child(5),#spectra-registros .sr-td:nth-child(5){display:none;}",
      "}"

    ].join("");
    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER SHELL
  ══════════════════════════════════════════════════════════════ */

  function renderShell() {
    root.innerHTML =
      '<div class="sr-toolbar">' +
        '<input class="sr-search" type="search" placeholder="Buscar personaje, FC, jugador…" autocomplete="off">' +
        '<div class="sr-pills">' +
          pill("all",      "Todos",     "") +
          pill("activo",   "Activos",   "#00674E") +
          pill("inactivo", "Inactivos", "#494844") +
          pill("reserva",  "Reservas",  "#A53E4A") +
        "</div>" +
        '<span class="sr-count" id="sr-count"></span>' +
      "</div>" +
      '<div class="sr-head" id="sr-head"></div>' +
      '<div class="sr-body" id="sr-body">' +
        '<div class="sr-loader"><div class="sr-dots"><span></span><span></span><span></span></div></div>' +
      "</div>";

    renderHead();
    bindToolbar();
  }

  function pill(f, label, bg) {
    var style = bg ? ' style="--pill-bg:' + bg + '"' : "";
    var active = f === filtroE ? " active" : "";
    return '<span class="sr-pill' + active + '" data-f="' + f + '"' + style + ">" + label + "</span>";
  }

  /* ── cabecera con sort ── */
  var COLS = [
    { col: "charName",   label: "Personaje" },
    { col: "parlamento", label: "Parlamento" },
    { col: "faceclaim1", label: "Faceclaim 1" },
    { col: "faceclaim2", label: "Faceclaim 2" },
    { col: "",           label: "Estado", nosort: true }
  ];

  function renderHead() {
    var head = document.getElementById("sr-head");
    if (!head) return;
    head.innerHTML = COLS.map(function (c) {
      var cls = "sr-th" + (c.nosort ? " nosort" : "");
      if (!c.nosort && sortCol === c.col) cls += " " + sortDir;
      var attr = c.nosort ? "" : ' data-col="' + c.col + '"';
      return '<span class="' + cls + '"' + attr + ">" + c.label + "</span>";
    }).join("");

    head.querySelectorAll(".sr-th[data-col]").forEach(function (th) {
      th.addEventListener("click", function () {
        var col = th.dataset.col;
        sortDir = (sortCol === col && sortDir === "asc") ? "desc" : "asc";
        sortCol = col;
        head.querySelectorAll(".sr-th").forEach(function (t) { t.classList.remove("asc","desc"); });
        th.classList.add(sortDir);
        renderBody();
      });
    });
  }

  /* ── toolbar eventos ── */
  function bindToolbar() {
    var search = root.querySelector(".sr-search");
    var timer;
    search.addEventListener("input", function () {
      clearTimeout(timer);
      var val = search.value;
      timer = setTimeout(function () {
        filtroTxt = val.trim().toLowerCase();
        renderBody();
        updateCount();
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
      updateCount();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER BODY
  ══════════════════════════════════════════════════════════════ */

  function getFiltered() {
    return allRows.filter(function (r) {
      if (filtroE !== "all" && r.estado !== filtroE) return false;
      if (filtroTxt) {
        var hay = (r.charName + r.username + r.parlamento + r.faceclaim1 + r.faceclaim2).toLowerCase();
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
  }

  function renderBody() {
    var body = document.getElementById("sr-body");
    if (!body) return;
    var filtered = getFiltered();
    updateCount(filtered.length);

    if (!filtered.length) {
      body.innerHTML = '<div class="sr-empty">Sin resultados</div>';
      return;
    }

    body.innerHTML = filtered.map(rowHTML).join("");
  }

  function rowHTML(r) {
    var color = PARL_COLOR[r.parlamento] || "#b5b3ad";

    /* Personaje */
    var charCell =
      '<div class="sr-char">' +
        '<span class="sr-char-name">' + esc(r.charName) + "</span>" +
        (r.numUsuario
          ? '<a class="sr-char-link" href="/u' + esc(r.numUsuario) + '">' + esc(r.username) + "</a>"
          : "") +
      "</div>";

    /* Parlamento */
    var parlCell = '<span class="sr-parl" style="--parl-c:' + color + '">' + esc(r.parlamento || "—") + "</span>";

    /* FCs */
    var fc1Cell = '<span class="sr-fc' + (r.faceclaim1 ? "" : " empty") + '">' + esc(r.faceclaim1 || "—") + "</span>";
    var fc2Cell = '<span class="sr-fc' + (r.faceclaim2 ? "" : " empty") + '">' + esc(r.faceclaim2 || "—") + "</span>";

    /* Estado */
    var badgeMap = {
      activo:   ["sr-badge-activo",   "✓ Activo"],
      inactivo: ["sr-badge-inactivo", "— Inactivo"],
      reserva:  ["sr-badge-reserva",  "◷ Reserva"]
    };
    var ep = badgeMap[r.estado] || ["sr-badge-inactivo", "—"];
    var estadoCell =
      '<div class="sr-estado">' +
        '<span class="sr-badge ' + ep[0] + '">' + ep[1] + "</span>" +
        (r.estado === "reserva" && r.fechaReserva
          ? '<span class="sr-reserva-chip">⧗ ' + esc(fmtDate(r.fechaReserva)) + "</span>"
          : "") +
      "</div>";

    return '<div class="sr-row">' +
      '<div class="sr-td">' + charCell + "</div>" +
      '<div class="sr-td">' + parlCell + "</div>" +
      '<div class="sr-td">' + fc1Cell + "</div>" +
      '<div class="sr-td">' + fc2Cell + "</div>" +
      '<div class="sr-td">' + estadoCell + "</div>" +
    "</div>";
  }

  function updateCount(n) {
    var el = document.getElementById("sr-count");
    if (!el) return;
    var total = (n !== undefined) ? n : allRows.length;
    el.textContent = total + " registro" + (total !== 1 ? "s" : "");
  }

  /* ══════════════════════════════════════════════════════════════
     FIREBASE
  ══════════════════════════════════════════════════════════════ */

  function fetchData(db) {
    db.collection("users").get()
      .then(function (snap) {
        allRows = [];
        snap.forEach(function (d) {
          var u   = d.data();
          var reg = u.registro || {};
          if (!reg.estado) return;
          allRows.push({
            username:     u.username      || d.id,
            numUsuario:   reg.numUsuario   || null,
            charName:     u.charName      || u.username || d.id,
            parlamento:   u.parlamento    || "",
            faceclaim1:   reg.faceclaim1   || "",
            faceclaim2:   reg.faceclaim2   || "",
            estado:       reg.estado       || "",
            fechaReserva: reg.fechaReserva || ""
          });
        });
        renderBody();
      })
      .catch(function (err) {
        var body = document.getElementById("sr-body");
        if (body) body.innerHTML = '<div class="sr-empty">Error al cargar los datos.</div>';
        console.warn("[spectra-registros]", err);
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
        fetchData(db);
      })
      .catch(function (err) {
        var body = document.getElementById("sr-body");
        if (body) body.innerHTML = '<div class="sr-empty">No se pudo iniciar Firebase.</div>';
        console.warn("[spectra-registros]", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
