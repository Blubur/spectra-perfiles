(function () {

  // ── CONFIGURACIÓN FIREBASE ──
  var firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  var db = firebase.firestore();

  // ── ESTILOS ──
  var style = document.createElement('style');
  style.textContent = '.fb-skills-wrap{padding:6px 12px 8px;background:var(--mono-surface1,#f5f3ef);border-top:1px solid var(--mono-border1,#ddd);display:flex;flex-direction:column;gap:5px}.fb-skill-row{display:flex;align-items:center;gap:6px}.fb-skill-icon{font-size:.85rem;width:1.2rem;text-align:center;flex-shrink:0}.fb-skill-name{font-family:var(--f-display-sans,sans-serif);font-size:.55rem;font-weight:300;text-transform:uppercase;letter-spacing:.07em;color:var(--mono-text2,#888);width:70px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fb-skill-bar-wrap{flex:1;height:2px;background:var(--mono-border1,#ddd);overflow:hidden}.fb-skill-bar-fill{height:100%;background:linear-gradient(90deg,var(--poster,#c4b49a),var(--poster,#7c6a52));transition:width .6s ease}.fb-skill-level{font-family:var(--f-display-sans,monospace);font-size:.52rem;color:var(--poster,#888);flex-shrink:0;min-width:28px;text-align:right;letter-spacing:.04em}.fb-link-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:1px solid var(--poster50,rgba(124,106,82,.5));background:var(--poster75,rgba(124,106,82,.15));color:var(--poster,#7c6a52);border-radius:var(--br,4px);font-size:.9rem;text-decoration:none;transition:all .2s}.fb-link-btn:hover{background:var(--poster,#7c6a52);color:var(--mono-contrast-text2,#fff)}';
  document.head.appendChild(style);

  // ── INYECCIÓN ──
  function injectFirebaseData() {
    var memberCards = document.querySelectorAll('article.member');
    if (!memberCards.length) return;

    Promise.all([
      db.collection('config').doc('fieldVisibility').get(),
      db.collection('config').doc('skills').get(),
      db.collection('users').get()
    ]).then(function (results) {
      var vis    = results[0].exists ? results[0].data() : {};
      var skills = results[1].exists ? results[1].data() : {};
      var fbUsers = {};
      results[2].forEach(function (d) { fbUsers[d.id] = d.data(); });

      memberCards.forEach(function (card) {
        var el = card.querySelector('a.username strong');
        if (!el) return;
        var username = el.textContent.trim();
        var userData = fbUsers[username];
        if (!userData) return;

        var parl       = userData.parlamento || '';
        var userSkills = userData.skills || {};
        var skillsDef  = skills[parl] || [];

        // enlaces en .contact
        var contact = card.querySelector('menu.contact');
        if (contact) {
          if (userData.fichaUrl && vis.fichaUrl !== false) {
            var li1 = document.createElement('li');
            li1.innerHTML = '<a href="' + userData.fichaUrl + '" class="fb-link-btn" title="Ficha" target="_blank"><i class="bi bi-person-lines-fill"></i></a>';
            contact.appendChild(li1);
          }
          if (userData.baulUrl && vis.baulUrl !== false) {
            var li2 = document.createElement('li');
            li2.innerHTML = '<a href="' + userData.baulUrl + '" class="fb-link-btn" title="Baúl" target="_blank"><i class="bi bi-archive"></i></a>';
            contact.appendChild(li2);
          }
        }

        // habilidades en .member-data
        var memberData = card.querySelector('menu.member-data');
        if (memberData && skillsDef.length && vis.skills !== false) {
          var wrap = document.createElement('div');
          wrap.className = 'fb-skills-wrap';
          var html = '';
          skillsDef.slice(0, 3).forEach(function (sk) {
            var us  = userSkills[sk.key] || { level: 0, maxLevel: sk.maxLevel || 5 };
            var pct = Math.round((us.level / (sk.maxLevel || 5)) * 100);
            html += '<div class="fb-skill-row">'
              + '<span class="fb-skill-icon">' + sk.icon + '</span>'
              + '<span class="fb-skill-name">' + sk.name + '</span>'
              + '<div class="fb-skill-bar-wrap"><div class="fb-skill-bar-fill" style="width:0%" data-pct="' + pct + '"></div></div>'
              + '<span class="fb-skill-level">Nv.' + us.level + '</span>'
              + '</div>';
          });
          wrap.innerHTML = html;
          memberData.appendChild(wrap);
          setTimeout(function () {
            wrap.querySelectorAll('.fb-skill-bar-fill').forEach(function (bar) {
              bar.style.width = bar.getAttribute('data-pct') + '%';
            });
          }, 200);
        }
      });

    }).catch(function (err) {
      console.error('[Firebase memberlist] Error:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFirebaseData);
  } else {
    injectFirebaseData();
  }

})();
