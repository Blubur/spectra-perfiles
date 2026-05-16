(function () {
  "use strict";

  var WIDGET_ID = "spectra-faqs";
  var APP_NAME = "spectra-faqs-widget";
  var FIREBASE_CONFIG = {
    apiKey: "AIzaSyA_DTdVWhe54PRrPlFFmIkdbMuotiSssZU",
    authDomain: "spectra-85df4.firebaseapp.com",
    projectId: "spectra-85df4",
    storageBucket: "spectra-85df4.firebasestorage.app",
    messagingSenderId: "321843589344",
    appId: "1:321843589344:web:714ca78124d8aef4d66085"
  };

  var FIREBASE_SCRIPTS = [
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"
  ];

  var FONT_URL = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&family=DM+Sans:wght@200;300;400;500&family=DM+Serif+Display:ital@0;1&display=swap";
  var ICONS_URL = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

  var allFaqs = [];
  var activeTag = "all";
  var searchQuery = "";
  var root;

  // ── UTILS ──────────────────────────────────────────

  function loadStyleHref(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "true") resolve();
        else existing.addEventListener("load", resolve, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = function () { script.dataset.loaded = "true"; resolve(); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureFirebase() {
    return FIREBASE_SCRIPTS.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name) {
    return '<i class="bi bi-' + name + '"></i>';
  }

  function getAllTags() {
    var set = {};
    allFaqs.forEach(function (f) {
      (f.tags || []).forEach(function (t) { set[t] = true; });
    });
    return Object.keys(set).sort();
  }

  function getFiltered() {
    return allFaqs.filter(function (f) {
      var matchTag = activeTag === "all" || (f.tags || []).indexOf(activeTag) !== -1;
      var q = searchQuery.toLowerCase();
      var matchSearch = !q ||
        (f.pregunta || "").toLowerCase().indexOf(q) !== -1 ||
        (f.respuesta || "").toLowerCase().indexOf(q) !== -1;
      return matchTag && matchSearch;
    });
  }

  function getLastUpdate() {
    var fechas = allFaqs.map(function (f) { return f.fecha || ""; }).filter(Boolean).sort().reverse();
    return fechas[0] || "";
  }

  // ── STYLES ──────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById("spectra-faqs-style")) return;
    var style = document.createElement("style");
    style.id = "spectra-faqs-style";
    style.textContent = `
      #spectra-faqs {
        container-type: inline-size;
      }

      /* ── HEADER ── */
      #spectra-faqs .sf-header {
        padding: clamp(3rem, 6vw, 4.5rem) 2rem 3rem;
        text-align: center;
        border-bottom: 1px solid var(--mono-border1);
        position: relative;
        overflow: hidden;
      }
      #spectra-faqs .sf-header::before {
        content: "";
        position: absolute; inset: 0;
        background: radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--accent-solid1), transparent 85%), transparent);
        pointer-events: none;
      }
      #spectra-faqs .sf-header h1 {
        position: relative;
        font: italic clamp(3.8rem, 6vw, 5.6rem) var(--f-deco);
        line-height: 1;
        margin: 0 0 .75rem;
      }
      #spectra-faqs .sf-header-meta {
        position: relative;
        font: 300 .72rem var(--f-mono);
        color: var(--mono-text1);
        text-transform: uppercase;
        letter-spacing: .14em;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      #spectra-faqs .sf-update-date {
        display: inline-flex;
        align-items: center;
        gap: .35em;
        background: var(--mono-component1);
        border: 1px solid var(--mono-border1);
        border-radius: 999px;
        padding: 2px .65rem;
        font: 300 .65rem var(--f-mono);
        color: var(--mono-text1);
        text-transform: uppercase;
        letter-spacing: .1em;
      }

      /* ── TOOLBAR (search + tags) ── */
      #spectra-faqs .sf-toolbar {
        padding: 1.2rem 2rem;
        border-bottom: 1px solid var(--mono-border1);
        background: var(--mono-surface2);
        display: flex;
        flex-direction: column;
        gap: .85rem;
      }
      #spectra-faqs .sf-search-wrap {
        position: relative;
      }
      #spectra-faqs .sf-search-wrap i {
        position: absolute;
        left: .85rem; top: 50%;
        transform: translateY(-50%);
        color: var(--mono-text1);
        font-size: .85rem;
        pointer-events: none;
      }
      #spectra-faqs .sf-search {
        width: 100%;
        background: var(--mono-component1);
        border: 1px solid var(--mono-border2);
        border-radius: 999px;
        padding: .45rem 1rem .45rem 2.2rem;
        font: 300 .82rem var(--f-sans);
        color: var(--mono-text2);
        outline: none;
        transition: border-color .2s;
      }
      #spectra-faqs .sf-search:focus {
        border-color: var(--accent-border2);
      }
      #spectra-faqs .sf-search::placeholder { color: var(--mono-text1); }

      #spectra-faqs .sf-tags {
        display: flex;
        flex-wrap: wrap;
        gap: .45rem;
      }
      #spectra-faqs .sf-tag-btn {
        font: 300 .62rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .1em;
        padding: .28rem .75rem;
        border: 1px solid var(--mono-border2);
        background: var(--mono-component1);
        color: var(--mono-text1);
        border-radius: 999px;
        cursor: pointer;
        transition: all .22s ease;
      }
      #spectra-faqs .sf-tag-btn:hover,
      #spectra-faqs .sf-tag-btn.active {
        background: var(--accent-solid1);
        border-color: var(--accent-solid1);
        color: #fff;
      }

      /* ── FAQ LIST ── */
      #spectra-faqs .sf-list {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 2rem;
      }
      #spectra-faqs .sf-item {
        border-bottom: 1px solid var(--mono-border1);
        padding: 0;
        transition: background .2s;
      }
      #spectra-faqs .sf-item:last-child { border-bottom: none; }

      #spectra-faqs .sf-question {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.1rem 0;
        cursor: pointer;
        user-select: none;
      }
      #spectra-faqs .sf-question-text {
        font: italic 1.15rem var(--f-deco);
        flex: 1;
        line-height: 1.3;
        transition: color .2s;
      }
      #spectra-faqs .sf-item:hover .sf-question-text,
      #spectra-faqs .sf-item.open .sf-question-text {
        color: var(--accent-text1);
      }
      #spectra-faqs .sf-chevron {
        color: var(--mono-text1);
        font-size: .9rem;
        flex-shrink: 0;
        transition: transform .3s ease;
      }
      #spectra-faqs .sf-item.open .sf-chevron {
        transform: rotate(90deg);
      }

      #spectra-faqs .sf-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height .45s cubic-bezier(.4,0,.2,1), padding .3s ease;
      }
      #spectra-faqs .sf-item.open .sf-answer {
        max-height: 9999px;
        padding-bottom: 1.2rem;
      }
      #spectra-faqs .sf-answer-text {
        font: 300 .88rem var(--f-sans);
        color: var(--mono-text1);
        line-height: 1.75;
        white-space: pre-wrap;
      }
      #spectra-faqs .sf-item-footer {
        display: flex;
        flex-wrap: wrap;
        gap: .4rem;
        align-items: center;
        margin-top: .75rem;
      }
      #spectra-faqs .sf-chip {
        display: inline-flex;
        align-items: center;
        font: 300 .6rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .08em;
        background: var(--accent-component1);
        border: 1px solid var(--accent-border2);
        color: var(--accent-text1);
        padding: 1px .55rem;
        border-radius: 999px;
      }
      #spectra-faqs .sf-item-date {
        font: 300 .6rem var(--f-mono);
        color: var(--mono-text1);
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: .3em;
      }

      /* ── EMPTY / ERROR / LOADER ── */
      #spectra-faqs .sf-empty,
      #spectra-faqs .sf-loader,
      #spectra-faqs .sf-error {
        text-align: center;
        padding: 4rem 1rem;
        color: var(--mono-text1);
        font: 300 .8rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .1em;
      }
      #spectra-faqs .sf-empty i,
      #spectra-faqs .sf-error i {
        display: block;
        font-size: 2rem;
        opacity: .25;
        margin-bottom: .75rem;
      }

      @media (max-width: 600px) {
        #spectra-faqs .sf-header { padding-left: 1rem; padding-right: 1rem; }
        #spectra-faqs .sf-toolbar { padding: 1rem; }
        #spectra-faqs .sf-list { padding: 1rem; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── RENDER ──────────────────────────────────────────

  function renderShell() {
    root.innerHTML = `
      <div class="sf-header">
        <h1>Preguntas frecuentes</h1>
        <div class="sf-header-meta">
          <span>Puedes usar el buscador para buscar por palabra y el filtro para buscar por categoría</span>
          <span class="sf-update-date" data-role="update-date" style="display:none">
            ${icon("calendar3")} <span data-role="update-date-text"></span>
          </span>
        </div>
      </div>
      <div class="sf-toolbar">
        <div class="sf-search-wrap">
          ${icon("search")}
          <input type="text" class="sf-search" placeholder="Buscar pregunta…" data-role="search">
        </div>
        <div class="sf-tags" data-role="tags"></div>
      </div>
      <div class="sf-list" data-role="list">
        <div class="sf-loader">Cargando preguntas…</div>
      </div>
    `;

    root.querySelector('[data-role="search"]').addEventListener("input", function () {
      searchQuery = this.value;
      renderList();
    });
  }

  function renderTagBar() {
    var tags = getAllTags();
    var wrap = root.querySelector('[data-role="tags"]');

    wrap.innerHTML = ['<button class="sf-tag-btn' + (activeTag === "all" ? " active" : "") + '" data-tag="all">Todas</button>']
      .concat(tags.map(function (t) {
        return '<button class="sf-tag-btn' + (activeTag === t ? " active" : "") + '" data-tag="' + escapeHTML(t) + '">' + escapeHTML(t) + '</button>';
      })).join("");

    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".sf-tag-btn");
      if (!btn) return;
      activeTag = btn.dataset.tag;
      Array.prototype.forEach.call(wrap.querySelectorAll(".sf-tag-btn"), function (b) {
        b.classList.toggle("active", b === btn);
      });
      renderList();
    });

    // Actualizar fecha en header
    var lastUpdate = getLastUpdate();
    var dateWrap = root.querySelector('[data-role="update-date"]');
    var dateText = root.querySelector('[data-role="update-date-text"]');
    if (lastUpdate && dateWrap && dateText) {
      dateText.textContent = "Actualizado " + lastUpdate;
      dateWrap.style.display = "";
    }
  }

  function renderList() {
    var list = root.querySelector('[data-role="list"]');
    var filtered = getFiltered();

    if (!filtered.length) {
      list.innerHTML = '<div class="sf-empty">' + icon("question-circle") + '<br>Sin preguntas que coincidan</div>';
      return;
    }

    list.innerHTML = filtered.map(function (f) {
      var tags = (f.tags || []).map(function (t) {
        return '<span class="sf-chip">' + escapeHTML(t) + '</span>';
      }).join("");
      var fecha = f.fecha
        ? '<span class="sf-item-date">' + icon("calendar3") + " " + escapeHTML(f.fecha) + '</span>'
        : "";

      return `
        <div class="sf-item" data-id="${escapeHTML(f.id)}">
          <div class="sf-question">
            <div class="sf-question-text">${escapeHTML(f.pregunta || "—")}</div>
            <i class="bi bi-chevron-right sf-chevron"></i>
          </div>
          <div class="sf-answer">
            <div class="sf-answer-text">${escapeHTML(f.respuesta || "")}</div>
            <div class="sf-item-footer">
              ${tags}
              ${fecha}
            </div>
          </div>
        </div>`;
    }).join("");

    // Accordion
    Array.prototype.forEach.call(list.querySelectorAll(".sf-item"), function (item) {
      item.querySelector(".sf-question").addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        // Cierra todos
        Array.prototype.forEach.call(list.querySelectorAll(".sf-item.open"), function (o) {
          o.classList.remove("open");
        });
        // Abre este si estaba cerrado
        if (!isOpen) item.classList.add("open");
      });
    });
  }

  function renderError(message) {
    var list = root && root.querySelector('[data-role="list"]');
    if (!list) return;
    list.innerHTML = '<div class="sf-error">' + icon("exclamation-circle") + "<br>" + escapeHTML(message) + "</div>";
  }

  // ── FIREBASE ──────────────────────────────────────────

  function initFirebaseApp() {
    if (!window.firebase) throw new Error("Firebase no se ha cargado.");
    var existing = null;
    try { existing = firebase.app(APP_NAME); } catch (e) { existing = null; }
    return existing || firebase.initializeApp(FIREBASE_CONFIG, APP_NAME);
  }

  function listenFaqs(db) {
    var ordered = db.collection("faqs").orderBy("orden", "asc");

    ordered.onSnapshot(function (snap) {
      allFaqs = [];
      snap.forEach(function (doc) {
        allFaqs.push(Object.assign({ id: doc.id }, doc.data()));
      });
      renderTagBar();
      renderList();
    }, function () {
      // Fallback sin orderBy si falta el índice
      db.collection("faqs").onSnapshot(function (snap) {
        allFaqs = [];
        snap.forEach(function (doc) {
          allFaqs.push(Object.assign({ id: doc.id }, doc.data()));
        });
        allFaqs.sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
        renderTagBar();
        renderList();
      }, function (err) {
        renderError("No se pudieron cargar las FAQs: " + err.message);
      });
    });
  }

  // ── INIT ──────────────────────────────────────────

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
        var db = firebase.firestore(app);
        if (db.enableNetwork) db.enableNetwork().catch(function () {});
        listenFaqs(db);
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
