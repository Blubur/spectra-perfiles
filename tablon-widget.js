(function () {
  "use strict";

  if (window.__spectraTablonLoaded) return;
  window.__spectraTablonLoaded = true;

  /* ─── Configuración ─── */
  var WIDGET_ID      = "spectra-tablon";
  var APP_NAME       = "spectra-tablon-widget";
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

  /* ─── Datos ─── */
  var allTablon = [];
  var root;


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

  /* ──────────────────────────────────────────────
     Estilos del widget
  ────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById("spectra-tablon-style")) return;
    var style = document.createElement("style");
    style.id = "spectra-tablon-style";
    style.textContent = `

      /* ── Sección raíz ── */
      #spectra-tablon.tablon {
        display: flex;
        flex-direction: column;
        gap: 0;
        font-family: var(--f-sans);
        color: var(--mono-text2);
        padding: 1rem;
      }

      /* ═══════════════════════════ ANUNCIOS ═══════════════════════════ */
      #spectra-tablon .anuncios {}
      #spectra-tablon .anuncios h3, #spectra-tablon .eventos h3 {
        font: 300 var(--f-s) var(--f-mono);
        text-transform: uppercase;
        letter-spacing: .12em;
        color: var(--mono-text1);
        padding: var(--spacing-2xs) 0 var(--spacing-2xs);
      }
      #spectra-tablon .anuncios ul {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        list-style: none;
      }
      #spectra-tablon .anuncios .anuncio {
        border: 1px solid var(--mono-border1);
        display: grid;
        grid-template-columns: .5fr 1fr;
      }
      #spectra-tablon .anuncios .anuncio em,
      #spectra-tablon .anuncios .anuncio a {
        padding: var(--spacing-3xs);
        display: flex;
        align-items: center;
        font: var(--f-tablon-subtitle, 300 .75rem var(--f-mono));
        text-decoration: none;
        text-transform: uppercase;
      }
      #spectra-tablon .anuncios .anuncio em { 
      font-style: italic;
      color: var(--accent-text1);
      }
      #spectra-tablon .anuncios .anuncio p {
        grid-column: 1 / -1;
        border-top: 1px solid var(--mono-border1);
        padding: var(--spacing-2xs);
        font-size: var(--f-s);
      }

      /* ═══════════════════════════ CICLO ═══════════════════════════ */
      #spectra-tablon .ciclo {}
      #spectra-tablon .ciclo ul { list-style: none; }
      #spectra-tablon .ciclo .capitulo {
        display: flex;
        align-items: center;
        font-family: var(--f-display, var(--f-deco));
        gap: var(--spacing-xs);
      }
      #spectra-tablon .ciclo .capitulo > span:first-of-type {
        font-size: var(--f-2xl);
      }
      #spectra-tablon .ciclo .capitulo > span:nth-of-type(2) {
        text-decoration: underline;
        text-decoration-color: var(--accent-solid1);
        text-underline-offset: var(--spacing-3xs);
      }
      #spectra-tablon .ciclo .periodo {
        font: bold var(--f-2xl) var(--f-display);
      }
      #spectra-tablon .ciclo .descripcion {
        font-size: var(--f-s);
        line-height: 1.6;
        color: var(--mono-text1);
        margin-top: var(--spacing-xs);
      }

      /* ═══════════════════════════  EVENTOS  ═══════════════════════════ */
      #spectra-tablon .eventos {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
      }
      #spectra-tablon .eventos a {
        display: flex;
        align-items: center;
        gap: var(--spacing-2xs);
        font: 500 var(--f-s, .8rem) var(--f-display-sans);
        letter-spacing: .08em;
        text-transform: uppercase;
        text-decoration: none;
        color: var(--mono-text2);
        border-top: 1px solid var(--mono-border2);
        padding-top: 1rem;
        transition: border-color .2s, box-shadow .2s;
      }
      
      #spectra-tablon .eventos .evento-img {
        width: 130px;
        height: 80px;
        object-fit: cover;
        border-radius: calc(var(--br, 5px) - 1px);
        flex-shrink: 0;
      }
      #spectra-tablon .eventos .evento-desc {
        font: 300 var(--f-s, .8rem) var(--f-sans, sans-serif);
        color: var(--mono-text1);
        text-transform: none;
        letter-spacing: 0;
        margin-top: 1px;
        font-size: .72rem;
      }
      #spectra-tablon .eventos .evento-inner {
        display: flex;
        flex-direction: column;
      }

      /* ═══════════════════════════  INTRO ═══════════════════════════ */
      #spectra-tablon .intro > span {
        font: italic var(--f-2xl, 1.95rem) var(--f-display);
        display: block;
        margin-bottom: var(--spacing-xs);
      }
      #spectra-tablon .intro > div {
        column-count: 2;
        font-size: var(--f-s);
        text-align: justify;
        column-gap: var(--spacing-l);
        line-height: 1.7;
      }
      @media (max-width: 520px) {
        #spectra-tablon .intro > div { column-count: 1; }
        #spectra-tablon .anuncios .anuncio { grid-template-columns: 1fr; }
      }

      /* ── Loader / Error ── */
      #spectra-tablon .st-loader,
      #spectra-tablon .st-error {
        padding: 2rem;
        text-align: center;
        font: 300 .75rem monospace;
        color: #999;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(style);
  }

  /* ────────────────────────────────────────────── Helpers ────────────────────────────────────────────── */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  /* ──────────────────────────────────────────────  Render ────────────────────────────────────────────── */
  function buildTablon() {
    var principios = allTablon.filter(function(m){ return m.categoria === 'principio'; });
    var prologos   = allTablon.filter(function(m){ return m.categoria === 'prologo'; });
    var anuncios   = allTablon.filter(function(m){ return m.categoria === 'anuncio'; });
    var eventos    = allTablon.filter(function(m){ return m.categoria === 'evento'; });

    var html = '<section class="tablon">';

    /* ── Anuncios ── */
    if (anuncios.length) {
      html += '<div class="anuncios"><h3>Anuncios</h3><ul>';
      anuncios.forEach(function(a) {
        // formato fecha dd.mm.aaaa
        var fechaDisp = a.fecha
          ? a.fecha.split('-').reverse().join('.')
          : '—';
        html += `
          <li class="anuncio">
            <em>${esc(fechaDisp)}</em>
            <a href="${esc(a.enlace || '#')}">${esc(a.enlaceTexto || a.enlace || 'Ver más')}</a>
            <p>${esc(a.descripcion || '')}</p>
          </li>`;
      });
      html += '</ul></div>';
    }

    /* ──  Ciclo ── */
    if (prologos.length) {
      var pr = prologos[0];
      // Separar número y título si el formato es "0. PRÓLOGO"
      var tituloRaw = pr.titulo || '';
      var numMatch  = tituloRaw.match(/^(\d+\.?)\s*(.*)/);
      var numSpan   = numMatch
        ? '<span>' + esc(numMatch[1]) + '</span><span>' + esc(numMatch[2]) + '</span>'
        : '<span>' + esc(tituloRaw) + '</span>';

      html += `
        <div class="ciclo">
          <ul>
            <li class="capitulo">${numSpan}</li>
            ${pr.subtitulo ? '<li class="periodo">' + esc(pr.subtitulo) + '</li>' : ''}
            ${pr.texto     ? '<li class="descripcion">' + esc(pr.texto) + '</li>' : ''}
          </ul>
        </div>`;
    }

    /* ──  eventos ── */
    if (eventos.length) {
      html += '<div class="eventos"><h3>Eventos</ht3>';
      eventos.forEach(function(ev) {
        var imgTag = ev.imagen
          ? '<img class="evento-img" src="' + esc(ev.imagen) + '" alt="">'
          : '';
        var descTag = ev.descripcion
          ? '<span class="evento-desc">' + esc(ev.descripcion) + '</span>'
          : '';
        html += `
          <a href="${esc(ev.enlace || '#')}">
            ${imgTag}
            <span class="evento-inner">
              <span>${esc(ev.titulo || 'Evento')}</span>
              ${descTag}
            </span>
          </a>`;
      });
      html += '</div>';
    }

    /* ──  Intro ── */
    if (principios.length) {
      var pr2 = principios[0];
      html += `
        <div class="intro">
          <span>${esc(pr2.titulo || 'Al principio…')}</span>
          <div>${esc(pr2.texto || '')}</div>
        </div>`;
    }

    html += '</section>';
    return html;
  }

  function render() {
    root.innerHTML = buildTablon();
  }

  function renderError(msg) {
    root.innerHTML = '<div class="st-error">' + esc(msg) + '</div>';
  }

  /* ────────────────────────────────────────────── Firebase ────────────────────────────────────────────── */
  function initFirebaseApp() {
    if (!window.firebase) throw new Error("Firebase no cargado.");
    var existing = null;
    try { existing = firebase.app(APP_NAME); } catch(e) { existing = null; }
    return existing || firebase.initializeApp(FIREBASE_CONFIG, APP_NAME);
  }

  function listenTablon(db) {
    // Intentar con orderBy; si falla (índice no existe), recae sin orden
    var ordered = db.collection("tablon").orderBy("orden", "asc");
    ordered.onSnapshot(function(snap) {
      allTablon = [];
      snap.forEach(function(d) { allTablon.push(Object.assign({ id: d.id }, d.data())); });
      render();
    }, function() {
      db.collection("tablon").onSnapshot(function(snap) {
        allTablon = [];
        snap.forEach(function(d) { allTablon.push(Object.assign({ id: d.id }, d.data())); });
        allTablon.sort(function(a,b){ return (a.orden||0)-(b.orden||0); });
        render();
      }, function(err) {
        renderError("No se pudo cargar el tablón: " + err.message);
      });
    });
  }

  /* ────────────────────────────────────────────── Init  ────────────────────────────────────────────── */
  function start() {
    root = document.getElementById(WIDGET_ID);
    if (!root) return;

    injectStyles();
    root.innerHTML = '<div class="st-loader">Cargando tablón…</div>';

    ensureFirebase()
      .then(function() {
        var app = initFirebaseApp();
        var db  = firebase.firestore(app);
        if (db.enableNetwork) db.enableNetwork().catch(function(){});
        listenTablon(db);
      })
      .catch(function(err) {
        renderError("No se pudo iniciar Firebase: " + err.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
