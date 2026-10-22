/* Centspire V5 — shared page shell and UI helpers (browser only). */
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
  if (C.Cloud) C.Cloud.attach(store, { isDemo: demo });
  const team = () => ((root.CENTSIBLE_CONFIG || {}).team) || {};

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
          <a class="brand" href="index.html" aria-label="Centspire home"><img class="brand-mark" src="../icons/logo.png" alt="" width="40" height="40"><b>cent<span>spire.</span></b></a>
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
      const t = team();
      footer.innerHTML = `
        ${demo ? '' : `<div class="container feedback-band no-print" id="fb-band"></div>`}
        <div class="container cols">
          <div style="max-width:420px">
            <a class="brand" href="index.html"><img class="brand-mark" src="../icons/logo.png" alt="" width="40" height="40"><b>cent<span>spire.</span></b></a>
            <p>Make smarter money decisions before they become real ones.</p>
            <p class="small">An educational project for DECA Project Management – Financial Literacy, 2026–27. Centspire is a learning simulation, not financial advice. All colleges, jobs, and offers in the game are hypothetical examples.</p>
            <p class="small">${t.creators ? `Created by ${esc(t.creators)}${t.school ? ` · ${esc(t.school)}` : ''}.` : ''}${t.contact ? ` Questions or feedback: <a href="mailto:${esc(t.contact)}">${esc(t.contact)}</a>` : ' <a href="about.html#team">Meet the team</a>'}</p>
          </div>
          <div>
            <p><b style="color:var(--cream)">Explore</b></p>
            <p>${NAV.slice(1).map(([, label, href]) => `<a href="${href}">${label}</a>`).join('<br>')}</p>
          </div>
          <div>
            <p><b style="color:var(--cream)">Privacy</b></p>
            <p class="small" style="max-width:260px">No account needed. Progress saves in this browser — or save it across devices with a code or your email on <a href="progress.html#sync">My Progress</a>. <a href="about.html#privacy">How we handle data</a></p>
          </div>
        </div>`;
    }
    if (!demo) mountFeedbackBand();
    // Returning from an email sign-in link?
    if (!demo && C.Cloud) {
      const r = C.Cloud.captureRedirect();
      if (r && r.error) toast('Sign-in link problem: ' + r.error);
      else if (r && r.session) {
        C.Cloud.afterSignIn().then(() => { toast('Signed in — your progress now saves to your account'); root.dispatchEvent(new Event('centspire:signin')); })
          .catch((e) => toast(e.message || 'Signed in, but syncing failed. Try “Sync now” on My Progress.'));
      }
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

  /** Quick rating survey: 1–5 stars, how likely to recommend (0–10), and whether you'd want it at school. */
  function feedbackForm(container, { page = 'site', reportId = null, onDone } = {}) {
    const chips = (name, vals, label) => `<div class="chips" role="group" aria-label="${label}">${vals.map(([v, l]) => `<button type="button" class="chip" data-${name}="${v}" aria-pressed="false">${l}</button>`).join('')}</div>`;
    container.innerHTML = `
      <div class="fb-form">
        <p class="fb-q"><b>How would you rate Centspire?</b></p>
        ${chips('rating', [1, 2, 3, 4, 5].map((n) => [n, '★'.repeat(n)]), 'Rating from 1 to 5 stars')}
        <p class="fb-q"><b>How likely are you to recommend it to a friend?</b> <span class="small muted">0 = not at all, 10 = definitely</span></p>
        ${chips('nps', Array.from({ length: 11 }, (_, i) => [i, String(i)]), 'Likelihood to recommend from 0 to 10')}
        <p class="fb-q"><b>Would you want your school to use Centspire in class?</b></p>
        ${chips('school', [['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No']], 'Would you want your school to use it')}
        <div class="row" style="margin-top:14px"><button class="btn btn-navy btn-sm" data-send disabled>Send feedback</button><span class="small muted">Anonymous. No written comments are collected.</span></div>
      </div>`;
    const pick = {};
    ['rating', 'nps', 'school'].forEach((name) => container.querySelectorAll(`[data-${name}]`).forEach((b) => b.addEventListener('click', () => {
      container.querySelectorAll(`[data-${name}]`).forEach((x) => x.setAttribute('aria-pressed', x === b));
      pick[name] = name === 'school' ? b.dataset[name] : +b.dataset[name];
      container.querySelector('[data-send]').disabled = pick.rating == null;
    })));
    container.querySelector('[data-send]').addEventListener('click', () => {
      C.Analytics.log('feedback', store.get().participant, page, { rating: pick.rating, nps: pick.nps ?? null, school: pick.school || null, report: reportId });
      store.update((d) => { d.feedbackAt = Date.now(); if (reportId) d.feedbackReports = [...(d.feedbackReports || []), reportId]; });
      container.innerHTML = `<p style="margin:0">${icon('check', 18)} Thank you! Your feedback helps us improve Centspire.</p>`;
      if (onDone) onDone(pick);
    });
  }

  function mountFeedbackBand() {
    const band = $('#fb-band');
    if (!band) return;
    const last = store.get().feedbackAt || 0;
    if (Date.now() - last < 14 * 86400000) { band.remove(); return; }
    band.innerHTML = `<div class="row" style="justify-content:space-between;gap:12px"><p style="margin:0"><b style="color:var(--cream)">How are we doing?</b> <span class="small">Rate Centspire in 20 seconds.</span></p>
      <button class="btn btn-gold btn-sm" id="fb-open" aria-expanded="false" aria-controls="fb-panel">${icon('star', 16)} Rate Centspire</button></div>
      <div id="fb-panel" class="card" style="margin-top:12px" hidden></div>`;
    $('#fb-open').addEventListener('click', () => {
      const panel = $('#fb-panel');
      const open = panel.hidden;
      panel.hidden = !open;
      $('#fb-open').setAttribute('aria-expanded', open);
      if (open && !panel.dataset.ready) { panel.dataset.ready = '1'; feedbackForm(panel, { page: root.document.body.dataset.page || 'site' }); }
    });
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

  root.Centsible.UI = { params, demo, store, esc, icon, shuffle, $, $$, mountShell, toast, question, recordAnswer, feedbackForm, money: F.money, pct: fmtPct };
})(window);
