(function () {
  "use strict";

  var WIDGET_ID = "spectra-pnjs";
  var APP_NAME = "spectra-pnjs-widget";
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

  var gruposColor = {
    primigenios: "#A53E67",
    arquitectos: "#0C459C",
    sabios: "#00674E",
    caoticos: "#5A4160",
    exterminadores: "#A53E4A"
  };

  var grupos = [
    ["all", "Todos"],
    ["primigenios", "Primigenios"],
    ["arquitectos", "Arquitectos"],
    ["sabios", "Sabios"],
    ["caoticos", "Caóticos"],
    ["exterminadores", "Exterminadores"]
  ];

  var allPNJs = [];
  var activeFilter = "all";
  var root;

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
      script.onload = function () {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureFirebase() {
    return FIREBASE_SCRIPTS.reduce(function (chain, src) {
      return chain.then(function () { return loadScript(src); });
    }, Promise.resolve());
  }

  function injectStyles() {
    if (document.getElementById("spectra-pnjs-style")) return;

    var style = document.createElement("style");
    style.id = "spectra-pnjs-style";
    style.textContent = `
      
      #spectra-pnjs .sp-header {
        padding: clamp(3rem, 6vw, 4.5rem) 2rem 3rem;
        text-align: center;
        border-bottom: 1px solid var(--mono-border1);
        position: relative;
        overflow: hidden;
      }
      #spectra-pnjs .sp-header::before {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--accent-solid1), transparent 85%), transparent);
        pointer-events: none;
      }
      #spectra-pnjs .sp-header h1 {
        position: relative;
        font: clamp(3.8rem, 6vw, 5.6rem) var(--f-deco);
        line-height: 1;
        margin: 0 0 .75rem;
      }
      #spectra-pnjs .sp-header p {
        position: relative;
        font: 300 .78rem var(--f-sans);
        color: var(--mono-text1);
        text-transform: uppercase;
        letter-spacing: .12em;
        margin: 0;
      }
      #spectra-pnjs .sp-filters {
        display: flex;
        flex-wrap: wrap;
        gap: .55rem;
        justify-content: center;
        padding: 1.4rem 2rem;
        border-bottom: 1px solid var(--mono-border1);
        background: var(--mono-surface2);
      }
      #spectra-pnjs .sp-filter-btn {
        font: 300 .64rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .1em;
        padding: .32rem .85rem;
        border: 1px solid var(--mono-border2);
        background: var(--mono-component1);
        color: var(--mono-text1);
        border-radius: var(--br-pill);
        cursor: pointer;
        transition: all .25s ease;
      }
      #spectra-pnjs .sp-filter-btn:hover,
      #spectra-pnjs .sp-filter-btn.active {
        background: var(--grupo-color, var(--accent-solid1));
        border-color: var(--grupo-color, var(--accent-solid1));
        color: #fff;
      }
      #spectra-pnjs .sp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1.6rem;
        padding: 3rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      #spectra-pnjs .sp-card {
        background: var(--mono-surface2);
        border: 1px solid var(--mono-border1);
        border-radius: var(--br);
        overflow: hidden;
        cursor: pointer;
        transition: all .35s ease;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      #spectra-pnjs .sp-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-xl);
      }
      #spectra-pnjs .sp-img-wrap {
        aspect-ratio: 3 / 4;
        overflow: hidden;
        background: var(--mono-component1);
        position: relative;
      }
      #spectra-pnjs .sp-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform .7s ease;
      }
      #spectra-pnjs .sp-card:hover .sp-img-wrap img { transform: scale(1.04); }
      #spectra-pnjs .sp-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        color: var(--mono-border2);
      }
      #spectra-pnjs .sp-pill {
        position: absolute;
        top: .85rem;
        left: .85rem;
        background: var(--grupo-color, var(--accent-solid1));
        color: #fff;
        font: 300 .64rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .1em;
        padding: 2px .55rem;
        border-radius: var(--br-pill);
      }
      #spectra-pnjs .sp-body {
        padding: 1.1rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: .55rem;
      }
      #spectra-pnjs .sp-name {
        font: italic 1.35rem var(--f-deco);
        line-height: 1.2;
      }
      #spectra-pnjs .sp-meta {
        font: 300 .64rem var(--f-mono);
        color: var(--mono-text1);
        display: flex;
        gap: .85rem;
        flex-wrap: wrap;
      }
      #spectra-pnjs .sp-desc {
        font: 300 .8rem var(--f-sans);
        color: var(--mono-text1);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      #spectra-pnjs .sp-empty,
      #spectra-pnjs .sp-loader,
      #spectra-pnjs .sp-error {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 1rem;
        color: var(--mono-text1);
        font: 300 .8rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .1em;
      }
      #spectra-pnjs .sp-detail-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.6);
        z-index: 9998;
        opacity: 0;
        pointer-events: none;
        transition: opacity .3s ease;
      }
      #spectra-pnjs .sp-detail-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      #spectra-pnjs .sp-detail {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: min(520px, 100vw);
        background: var(--mono-surface1);
        border-left: 1px solid var(--mono-border1);
        z-index: 9999;
        overflow-y: auto;
        transform: translateX(100%);
        transition: transform .4s cubic-bezier(.4,0,.2,1);
      }
      #spectra-pnjs .sp-detail.open { transform: translateX(0); }
      #spectra-pnjs .sp-detail-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 36px;
        height: 36px;
        border-radius: var(--br-pill);
        border: 1px solid var(--mono-border2);
        background: var(--mono-component2);
        color: var(--mono-text2);
        cursor: pointer;
        z-index: 2;
      }
      #spectra-pnjs .sp-detail-img {
        aspect-ratio: 3 / 2;
        overflow: hidden;
        background: var(--mono-component1);
        position: relative;
      }
      #spectra-pnjs .sp-detail-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      #spectra-pnjs .sp-detail-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 40%, var(--mono-surface1));
      }
      #spectra-pnjs .sp-detail-content { padding: 2rem; }
      #spectra-pnjs .sp-detail .sp-detail-pill {
        display: inline-block;
        background: var(--grupo-color, var(--accent-solid1));
        color: #fff;
        font: 300 .64rem var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .1em;
        padding: 3px .55rem;
        border-radius: var(--br-pill);
        margin-bottom: .85rem;
      }
      #spectra-pnjs .sp-detail-name {
        font: italic clamp(2.4rem, 5vw, 3.15rem) var(--f-deco);
        line-height: 1.1;
        margin-bottom: .85rem;
      }
      #spectra-pnjs .sp-detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: .85rem;
        margin-bottom: 1.5rem;
        font: 300 .64rem var(--f-mono);
        color: var(--mono-text1);
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      #spectra-pnjs .sp-detail-text {
        border-top: 1px solid var(--mono-border1);
        padding-top: 1.5rem;
        font: 300 1rem var(--f-sans);
        line-height: 1.7;
        white-space: pre-wrap;
      }
      @media (max-width: 600px) {
        #spectra-pnjs .sp-grid {
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: .85rem;
          padding: 1.2rem;
        }
        #spectra-pnjs .sp-header { padding-left: 1rem; padding-right: 1rem; }
      }
    `;
    document.head.appendChild(style);
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

  function colorFor(grupo) {
    return gruposColor[grupo] || "#b5a081";
  }

  function renderShell() {
    root.innerHTML = `
      <section class="sp-header">
        <h1>Personajes</h1>
        <p>No jugables · Parlamentos de Spectra</p>
      </section>
      <div class="sp-filters" data-role="filters"></div>
      <div class="sp-grid" data-role="grid">
        <div class="sp-loader">Cargando personajes...</div>
      </div>
      <div class="sp-detail-overlay" data-role="overlay"></div>
      <aside class="sp-detail" data-role="detail">
        <button class="sp-detail-close" type="button" data-role="close">${icon("x-lg")}</button>
        <div class="sp-detail-img" data-role="detail-img"></div>
        <div class="sp-detail-content">
          <span class="sp-detail-pill" data-role="detail-grupo"></span>
          <div class="sp-detail-name" data-role="detail-name"></div>
          <div class="sp-detail-meta" data-role="detail-meta"></div>
          <div class="sp-detail-text" data-role="detail-historia"></div>
        </div>
      </aside>
    `;

    root.querySelector('[data-role="filters"]').innerHTML = grupos.map(function (item) {
      var key = item[0];
      var label = item[1];
      var color = key === "all" ? "#b5a081" : colorFor(key);
      return '<button class="sp-filter-btn' + (key === activeFilter ? " active" : "") + '" type="button" data-grupo="' + key + '" style="--grupo-color:' + color + '">' + label + "</button>";
    }).join("");

    root.querySelector('[data-role="filters"]').addEventListener("click", function (event) {
      var button = event.target.closest(".sp-filter-btn");
      if (!button) return;
      activeFilter = button.getAttribute("data-grupo") || "all";
      Array.prototype.forEach.call(root.querySelectorAll(".sp-filter-btn"), function (btn) {
        btn.classList.toggle("active", btn === button);
      });
      renderGrid();
    });

    root.querySelector('[data-role="overlay"]').addEventListener("click", closeDetail);
    root.querySelector('[data-role="close"]').addEventListener("click", closeDetail);
  }

  function renderGrid() {
    var grid = root.querySelector('[data-role="grid"]');
    var filtered = activeFilter === "all"
      ? allPNJs
      : allPNJs.filter(function (p) { return p.grupo === activeFilter; });

    if (!filtered.length) {
      grid.innerHTML = '<div class="sp-empty">' + icon("person-slash") + "<br>Sin personajes en este parlamento</div>";
      return;
    }

    grid.innerHTML = filtered.map(function (p, index) {
      var color = colorFor(p.grupo);
      var image = p.imagen
        ? '<img src="' + escapeHTML(p.imagen) + '" alt="' + escapeHTML(p.nombre || "PNJ") + '" loading="lazy">'
        : '<div class="sp-placeholder">' + icon("person") + "</div>";

      return `
        <article class="sp-card" style="--grupo-color:${color}" data-id="${escapeHTML(p.id)}" data-order="${escapeHTML(p.orden == null ? index : p.orden)}">
          <div class="sp-img-wrap">
            ${image}
            <span class="sp-pill">${escapeHTML(p.grupo || "—")}</span>
          </div>
          <div class="sp-body">
            <div class="sp-name">${escapeHTML(p.nombre || "Sin nombre")}</div>
            <div class="sp-meta">
              ${p.edad ? '<span>' + icon("hourglass-split") + " " + escapeHTML(p.edad) + "</span>" : ""}
              ${p.ocupacion ? '<span>' + icon("briefcase") + " " + escapeHTML(p.ocupacion) + "</span>" : ""}
            </div>
            ${p.historia ? '<p class="sp-desc">' + escapeHTML(p.historia) + "</p>" : ""}
          </div>
        </article>`;
    }).join("");

    Array.prototype.forEach.call(grid.querySelectorAll(".sp-card"), function (card) {
      card.addEventListener("click", function () {
        openDetail(card.getAttribute("data-id"));
      });
    });
  }

  function openDetail(id) {
    var p = allPNJs.find(function (item) { return item.id === id; });
    if (!p) return;

    var color = colorFor(p.grupo);
    var detail = root.querySelector('[data-role="detail"]');
    var overlay = root.querySelector('[data-role="overlay"]');
    var imgWrap = root.querySelector('[data-role="detail-img"]');

    detail.style.setProperty("--grupo-color", color);
    root.querySelector('[data-role="detail-grupo"]').textContent = p.grupo || "—";
    root.querySelector('[data-role="detail-name"]').textContent = p.nombre || "Sin nombre";
    root.querySelector('[data-role="detail-meta"]').innerHTML = [
      p.edad ? '<span>' + icon("hourglass-split") + " " + escapeHTML(p.edad) + "</span>" : "",
      p.ocupacion ? '<span>' + icon("briefcase") + " " + escapeHTML(p.ocupacion) + "</span>" : ""
    ].join("");
    root.querySelector('[data-role="detail-historia"]').textContent = p.historia || "Sin descripción.";

    imgWrap.innerHTML = p.imagen
      ? '<img src="' + escapeHTML(p.imagen) + '" alt="' + escapeHTML(p.nombre || "PNJ") + '"><div class="sp-detail-gradient"></div>'
      : '<div class="sp-placeholder">' + icon("person") + "</div>";

    overlay.classList.add("open");
    detail.classList.add("open");
  }

  function closeDetail() {
    root.querySelector('[data-role="overlay"]').classList.remove("open");
    root.querySelector('[data-role="detail"]').classList.remove("open");
  }

  function renderError(message) {
    var grid = root && root.querySelector('[data-role="grid"]');
    if (!grid) return;
    grid.innerHTML = '<div class="sp-error">' + escapeHTML(message) + "</div>";
  }

  function initFirebaseApp() {
    if (!window.firebase) throw new Error("Firebase no se ha cargado.");

    var existing = null;
    try {
      existing = firebase.app(APP_NAME);
    } catch (err) {
      existing = null;
    }

    return existing || firebase.initializeApp(FIREBASE_CONFIG, APP_NAME);
  }

  function listenPNJs(db) {
    var ordered = db.collection("pnjs").orderBy("orden", "asc");

    ordered.onSnapshot(function (snap) {
      allPNJs = [];
      snap.forEach(function (doc) {
        allPNJs.push(Object.assign({ id: doc.id }, doc.data()));
      });
      renderGrid();
    }, function () {
      db.collection("pnjs").onSnapshot(function (snap) {
        allPNJs = [];
        snap.forEach(function (doc) {
          allPNJs.push(Object.assign({ id: doc.id }, doc.data()));
        });
        allPNJs.sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
        renderGrid();
      }, function (err) {
        renderError("No se pudieron cargar los PNJs: " + err.message);
      });
    });
  }

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
        listenPNJs(db);
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
