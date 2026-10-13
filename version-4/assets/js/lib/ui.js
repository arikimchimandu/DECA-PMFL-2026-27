/* Centsible V4 — shared page shell and UI helpers (browser only). */
(function (root) {
  const C = root.Centsible;
  const F = C.Finance;
  const params = new URLSearchParams(root.location.search);

  // ---------- demo mode: isolated, nothing saved or sent ----------
  let demo = false;
  try {
    if (params.get('demo') === '1') sessionStorage.setItem('centsible_demo', '1');
    if (params.get('demo') === '0') sessionStorage.removeItem('centsible_demo');
    demo = sessionStorage.getItem('centsible_demo') === '1';
  } catch { demo = params.get('demo') === '1'; }
  C.Analytics.setDemo(demo);
  const memory = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const store = demo ? C.Store.create(memory()) : C.Store.create();

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, size = 20, stroke) => C.Icons.svg(name, { size, stroke });
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const $ = (sel, el = root.document) => el.querySelector(sel);
  const $$ = (sel, el = root.document) => [...el.querySelectorAll(sel)];

  const NAV = [
    ['home', 'Home', 'index.html'],
    ['simulator', 'Simulator', 'simulator.html'],
    ['academy', 'Academy', 'academy.html'],
    ['tools', 'Money Tools', 'tools.html'],
    ['progress', 'My Progress', 'progress.html'],
    ['about', 'About', 'about.html'],
  ];

  function mountShell(page) {
    const header = $('#site-header');
    if (header) {
      header.className = 'site-header';
      header.innerHTML = `
        ${demo ? `<div class="demo-banner" role="note">Presentation demo mode — sample data only. Nothing is saved or recorded. <a href="?demo=0" style="color:inherit">Exit demo</a></div>` : ''}
        <div class="container bar">
          <a class="brand" href="index.html" aria-label="Centsible home"><img class="brand-mark" src="../icons/logo.png" alt="" width="40" height="40"><b>cent<span>sible.</span></b></a>
          <button class="menu-btn" aria-expanded="false" aria-controls="site-nav">${icon('menu', 18)} Menu</button>
          <nav class="nav" id="site-nav" aria-label="Main">
            ${NAV.map(([id, label, href]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
        </div>`;
      const btn = $('.menu-btn', header), nav = $('#site-nav', header);
      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
      });
      root.document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    }
    const footer = $('#site-footer');
    if (footer) {
      footer.className = 'site-footer';
      footer.innerHTML = `
        <div class="container cols">
          <div style="max-width:420px">
            <a class="brand" href="index.html"><img class="brand-mark" src="../icons/logo.png" alt="" width="40" height="40"><b>cent<span>sible.</span></b></a>
            <p>Make smarter money decisions before they become real ones.</p>
            <p class="small">An educational project for DECA Project Management – Financial Literacy, 2026–27. Centsible is a learning simulation, not financial advice. All colleges, jobs, and offers in the game are hypothetical examples.</p>
          </div>
          <div>
            <p><b style="color:var(--cream)">Explore</b></p>
            <p>${NAV.slice(1).map(([, label, href]) => `<a href="${href}">${label}</a>`).join('<br>')}</p>
          </div>
          <div>
            <p><b style="color:var(--cream)">Privacy</b></p>
            <p class="small" style="max-width:260px">No account, name, or email needed. Your progress is saved in this browser. <a href="about.html#privacy">How we handle data</a></p>
          </div>
        </div>`;
    }
    // Count one visit per day per participant (for returning-participant stats).
    if (!demo) {
      const info = store.touch();
      const d = store.get();
      const today = new Date().toISOString().slice(0, 10);
      if (d.lastVisitLogged !== today) {
        store.update((x) => { x.lastVisitLogged = today; });
        C.Analytics.log('visit', d.participant, page, { returning: info.returning, daysSinceFirst: info.daysSinceFirst });
      }
    }
  }

  function toast(msg) {
    const el = root.document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    root.document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /** Record a scored answer as learning evidence (never in demo mode). */
  function recordAnswer(topic, concept, ok, src) {
    if (!topic) return;
    store.addEvidence(topic, concept, ok, src);
  }

  /**
   * Render a multiple-choice question.
   * opts.feedback: show right/wrong + explanation (default true)
   * opts.onAnswer(correct, chosenText)
   */
  function question(container, q, opts = {}) {
    const feedback = opts.feedback !== false;
    const id = 'q' + Math.random().toString(36).slice(2, 8);
    const order = opts.keepOrder ? q.a.map((_, i) => i) : shuffle(q.a.map((_, i) => i));
    container.innerHTML = `
      <div class="question" role="group" aria-labelledby="${id}">
        ${opts.label ? `<p class="eyebrow">${opts.label}</p>` : ''}
        <p class="q" id="${id}">${esc(q.q)}</p>
        <div class="answers">${order.map((i, k) => `<button type="button" class="answer" data-i="${i}"><span class="letter" aria-hidden="true">${'ABCD'[k]}</span><span>${esc(q.a[i])}</span></button>`).join('')}</div>
        <div class="fb" aria-live="polite"></div>
      </div>`;
    const buttons = $$('.answer', container);
    buttons.forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      const correct = i === q.correct;
      buttons.forEach((x) => { x.disabled = true; });
      if (feedback) {
        buttons.forEach((x) => {
          const xi = +x.dataset.i;
          if (xi === q.correct) x.classList.add('correct');
          else if (x === b) x.classList.add('wrong');
          else x.classList.add('dim');
        });
        $('.fb', container).innerHTML = `<div class="feedback ${correct ? 'good' : 'bad'}">${icon(correct ? 'check' : 'bulb', 20, 2)}<p><b>${correct ? 'Correct.' : 'Not quite.'}</b> ${esc(q.why || '')}</p></div>`;
      } else {
        b.classList.add('chosen');
      }
      if (opts.onAnswer) opts.onAnswer(correct, q.a[i]);
    }));
  }

  function fmtPct(x) { return x == null ? '—' : Math.round(x * 100) + '%'; }

  root.Centsible.UI = { params, demo, store, esc, icon, shuffle, $, $$, mountShell, toast, question, recordAnswer, money: F.money, pct: fmtPct };
})(window);
