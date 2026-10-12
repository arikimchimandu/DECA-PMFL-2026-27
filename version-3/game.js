/* centsible. — Swipe Through College (v3)
 * Flow: home → warm-up quiz → for each chapter: interactive lesson, then swipe cards →
 *       final quiz (with explanations) → results + Money Notebook.
 * Replays skip the quizzes and lessons and go straight to the cards.
 */
(() => {
  'use strict';

  const C = window.CENTSIBLE_CONTENT;
  const Data = window.CentsibleData;
  const Icon = window.CentsibleIcons;
  const ic = (name, size = 24, stroke) => Icon.svg(name, { size, stroke });
  const $stage = document.getElementById('stage');
  const $live = document.getElementById('live');

  // ---------- URL params: marketing source + friend challenges ----------
  const params = new URLSearchParams(location.search);
  const clean = (s, n) => (s || '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, n);
  const SRC = clean(params.get('src'), 24).toLowerCase() || 'direct';
  const BEAT = params.has('beat') ? Math.max(0, Math.min(1000, parseInt(params.get('beat'), 10) || 0)) : null;
  const BEAT_BY = clean(params.get('by'), 20);

  const session = Math.random().toString(36).slice(2, 10);
  Data.log('visit', SRC, { session, v: 3, challenged: BEAT !== null });

  // ---------- helpers ----------
  const money = (n) => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const announce = (t) => { $live.textContent = t; };
  const METERS = { cash: { icon: 'wallet', label: 'Cash' }, grades: { icon: 'book', label: 'Grades' }, wellbeing: { icon: 'heart', label: 'Wellbeing' } };
  const unitOf = (id) => C.units.find((u) => u.id === id);
  const LETTERS = 'ABCD';

  // Loan math (standard monthly amortization)
  const payment = (P, apr, years) => { const r = apr / 12, n = years * 12; return r === 0 ? P / n : (P * r) / (1 - Math.pow(1 + r, -n)); };
  function payoff(balance, apr, monthly) {
    const r = apr / 12; let b = balance, months = 0, paid = 0;
    while (b > 0.005 && months < 600) { b += b * r; const p = Math.min(monthly, b); b -= p; paid += p; months++; }
    return { months, paid, interest: paid - balance };
  }
  const duration = (m) => { const y = Math.floor(m / 12), mo = m % 12; return [y ? `${y} yr` : '', mo ? `${mo} mo` : ''].filter(Boolean).join(' ') || '0 mo'; };

  // ---------- sound, confetti, toast ----------
  let muted = false;
  try { muted = localStorage.getItem('centsible_muted') === '1'; } catch {}
  let audio;
  function beep(freq, dur = 0.12, type = 'sine', vol = 0.1) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(audio.destination);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.start(); o.stop(audio.currentTime + dur);
    } catch {}
  }
  const sfx = {
    good: () => [523, 659, 784].forEach((f, k) => setTimeout(() => beep(f, .13, 'triangle'), k * 80)),
    bad: () => { beep(220, .25, 'triangle', .08); try { navigator.userActivation?.hasBeenActive && navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch {} },
    swipe: () => beep(440, .05, 'triangle', .05),
    tap: () => beep(600, .05, 'sine', .05),
  };
  function confetti(n = 70) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#6ED9B3', '#EFCB75', '#F7F5EC'];
    for (let k = 0; k < n; k++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[k % colors.length];
      el.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
      el.style.animationDelay = Math.random() * .4 + 's';
      el.style.borderRadius = k % 3 ? '2px' : '50%';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3800);
    }
  }
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
  function render(html, { lock = false } = {}) {
    document.body.classList.toggle('locked', lock);
    $stage.innerHTML = html;
    window.scrollTo(0, 0);
    $stage.focus({ preventScroll: true });
  }
  function topbar() {
    return `<div class="topbar"><span class="brand">cent<span>sible.</span></span>
      <button class="icon-btn" id="mute" aria-label="${muted ? 'Turn sound on' : 'Turn sound off'}">${ic(muted ? 'mute' : 'sound', 20)}</button></div>`;
  }
  function bindMute() {
    const b = document.getElementById('mute');
    if (!b) return;
    b.onclick = () => {
      muted = !muted;
      try { localStorage.setItem('centsible_muted', muted ? '1' : '0'); } catch {}
      b.innerHTML = ic(muted ? 'mute' : 'sound', 20);
      b.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    };
  }

  // ---------- run state ----------
  let G;
  let plays = 0;
  let nick = '';
  try { nick = localStorage.getItem('centsible_nick') || ''; } catch {}

  function buildDeck() {
    const twist = shuffle(C.cards.filter((c) => c.twist))[0];
    const core = C.cards.filter((c) => c.core && !c.twist);
    const extras = shuffle(C.cards.filter((c) => !c.core && !c.twist)).slice(0, Math.max(0, C.deckSize - 1 - core.length));
    const order = (c) => C.units.findIndex((u) => u.id === c.unit);
    return [...core, ...extras].sort((a, b) => order(a) - order(b) || C.cards.indexOf(a) - C.cards.indexOf(b)).concat(twist);
  }
  function newRun() {
    plays++;
    G = {
      deck: buildDeck(), i: 0, st: { ...C.start }, picks: {}, log: [], terms: new Set(), seenUnits: new Set(),
      pre: null, post: null, learn: plays === 1, startedAt: Date.now(), broke: null,
    };
  }

  // ---------- home ----------
  function home() {
    const challenge = BEAT !== null
      ? `<div class="challenge">${ic('award', 28)}<span><b>${BEAT_BY ? esc(BEAT_BY) : 'A friend'}</b> scored <b>${BEAT}</b>. Think you can beat it?</span></div>` : '';
    render(`
      ${topbar()}
      <div class="center">
        <span class="pill">${ic('swipe', 16, 2.25)} About 5 minutes</span>
        <h1 class="title">Swipe<br>through<br><span>college.</span></h1>
        <div class="hero-art" aria-hidden="true">
          <span class="medal gold">${ic('gradcap', 34)}</span>
          <span class="medal mint">${ic('coins', 34)}</span>
          <span class="medal cream">${ic('calendar', 34)}</span>
        </div>
        <p class="muted" style="margin:0">Make 10 real money decisions, from senior year to your first job. Learn what each choice really costs.</p>
        <div class="learn-list">
          <div>${ic('gradcap', 22)}Tuition</div>
          <div>${ic('bank', 22)}Loans</div>
          <div>${ic('chart', 22)}Budgeting</div>
        </div>
        ${challenge}
        <label class="sr" for="nick">Nickname</label>
        <input class="nick" id="nick" maxlength="20" autocomplete="off" placeholder="Nickname (not your real name)" value="${esc(nick)}">
        <button class="btn" id="go">Start ${ic('arrowR', 22, 2.25)}</button>
      </div>`);
    bindMute();
    document.getElementById('go').onclick = () => {
      nick = clean(document.getElementById('nick').value, 20);
      try { localStorage.setItem('centsible_nick', nick); } catch {}
      sfx.tap();
      newRun();
      Data.log('start', SRC, { session, v: 3, nick, replay: plays > 1 });
      G.learn ? quiz('pre', 0, []) : next();
    };
  }

  // ---------- quiz (same questions before and after) ----------
  function quiz(phase, i, answers) {
    const Q = C.quiz[i];
    const label = phase === 'pre' ? 'Warm-up · no pressure' : 'Final check · see what you learned';
    render(`
      ${topbar()}
      <div class="qhead">
        <div class="eyebrow">${label}</div>
        <div class="dots">${C.quiz.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <h2 class="question">${esc(Q.q)}</h2>
      ${phase === 'pre' && i === 0 ? '<p class="muted small" style="margin:8px 0 0">5 quick questions. Guessing is fine — you’ll see the answers at the end.</p>' : ''}
      <div class="answers" id="answers">
        ${Q.a.map((a, k) => `<button class="answer" data-k="${k}"><span class="letter">${LETTERS[k]}</span>${esc(a)}</button>`).join('')}
      </div>
      <div id="after"></div>`);
    bindMute();
    $stage.querySelectorAll('.answer').forEach((b) => {
      b.onclick = () => {
        const k = +b.dataset.k;
        const nextAnswers = [...answers, k];
        const advance = () => {
          if (i + 1 < C.quiz.length) return quiz(phase, i + 1, nextAnswers);
          G[phase] = { answers: nextAnswers, score: nextAnswers.filter((a, q) => a === C.quiz[q].correct).length };
          phase === 'pre' ? next() : results();
        };
        if (phase === 'pre') { sfx.tap(); return advance(); }

        const box = document.getElementById('answers');
        box.classList.add('locked');
        box.querySelectorAll('.answer').forEach((t) => {
          const kk = +t.dataset.k;
          t.classList.add(kk === Q.correct ? 'right' : kk === k ? 'wrong' : 'dim');
        });
        const ok = k === Q.correct;
        ok ? sfx.good() : sfx.bad();
        const after = document.getElementById('after');
        after.innerHTML = `
          <div class="explain">${ic(ok ? 'check' : 'bulb', 22)}<p><b>${ok ? 'Correct.' : 'Not quite.'}</b> ${esc(Q.why)}</p></div>
          <button class="btn" id="qnext" style="margin-top:12px">${i + 1 < C.quiz.length ? 'Next question' : 'See my results'} ${ic('arrowR', 22, 2.25)}</button>`;
        const nb = document.getElementById('qnext');
        nb.onclick = advance;
        nb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        nb.focus({ preventScroll: true });
      };
    });
  }

  // ---------- flow: lesson before each new chapter (first play only) ----------
  function next() {
    if (G.i >= G.deck.length || G.broke) {
      G.finishedAt = G.finishedAt || Date.now();
      return G.learn ? quiz('post', 0, []) : results();
    }
    const unit = unitOf(G.deck[G.i].unit);
    if (G.learn && !G.seenUnits.has(unit.id)) { G.seenUnits.add(unit.id); return lesson(unit); }
    deal();
  }

  // ---------- interactive chapter lessons ----------
  const CONCEPTS = {
    netprice: {
      title: 'Sticker price vs. net price',
      text: 'The price a college lists isn’t what most students pay. <b>Grants</b> and <b>scholarships</b> — money you never pay back — come off the top.',
      prompt: 'Tap each type of aid to see the net price drop.',
      html: () => `
        <div class="viz" id="viz">
          <div class="row">
            <div><div class="lbl">Sticker price (private college)</div><div class="big">$58,000</div></div>
            <div style="text-align:right"><div class="lbl">Net price</div><div class="big" id="net" style="color:var(--mint-dark)">$58,000</div></div>
          </div>
          <div class="stack"><i class="s-mint" id="sNet" style="width:100%"></i><i class="s-gold" id="sAid" style="width:0"></i></div>
          <div class="legend"><span><i style="background:var(--mint)"></i>You pay</span><span><i style="background:var(--gold)"></i>Grants &amp; scholarships</span></div>
          <div class="chips">
            ${[['Federal grant', 4000], ['School grant', 12000], ['Scholarship', 2000]].map(([l, a]) => `<button class="chip-toggle" aria-pressed="false" data-a="${a}">${ic('award', 18)} ${l} −${money(a)}</button>`).join('')}
          </div>
        </div>`,
      bind: () => {
        const sticker = 58000;
        const update = () => {
          const aid = [...document.querySelectorAll('.chip-toggle[aria-pressed=true]')].reduce((s, b) => s + +b.dataset.a, 0);
          document.getElementById('net').textContent = money(sticker - aid);
          document.getElementById('sNet').style.width = ((sticker - aid) / sticker) * 100 + '%';
          document.getElementById('sAid').style.width = (aid / sticker) * 100 + '%';
        };
        document.querySelectorAll('.chip-toggle').forEach((b) => {
          b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); sfx.tap(); update(); };
        });
      },
    },
    interest: {
      title: 'How loan interest works',
      text: 'Interest is the price of borrowing. A few percentage points sound small, but over 10 years they add up to real money.',
      prompt: 'Move the slider to change the interest rate on a $10,000 loan.',
      html: () => `
        <div class="viz">
          <div class="row">
            <div><div class="lbl">Interest rate</div><div class="big" id="rate">6.39%</div></div>
            <div style="text-align:right"><div class="lbl">Monthly payment</div><div class="big" id="pay">$113</div></div>
          </div>
          <label class="sr" for="rateIn">Interest rate</label>
          <input type="range" id="rateIn" min="2" max="15" step="0.01" value="6.39">
          <div class="presets"><button data-r="6.39">Federal 6.39%</button><button data-r="9.5">Private 9.5%</button><button data-r="14">Risky 14%</button></div>
          <div class="stack"><i class="s-navy" id="sP"></i><i class="s-gold" id="sI"></i></div>
          <div class="legend"><span><i style="background:var(--navy)"></i>$10,000 borrowed</span><span><i style="background:var(--gold)"></i>Interest: <b id="int" style="color:var(--ink)">$3,560</b></span></div>
          <p class="lbl" style="margin:10px 0 0">Total repaid over 10 years: <b id="tot" style="color:var(--ink)">$13,560</b></p>
        </div>`,
      bind: () => {
        const input = document.getElementById('rateIn');
        const update = () => {
          const rate = +input.value, m = payment(10000, rate / 100, 10), total = m * 120;
          document.getElementById('rate').textContent = rate.toFixed(2).replace(/\.?0+$/, '') + '%';
          document.getElementById('pay').textContent = money(m);
          document.getElementById('int').textContent = money(total - 10000);
          document.getElementById('tot').textContent = money(total);
          document.getElementById('sP').style.width = (10000 / total) * 100 + '%';
          document.getElementById('sI').style.width = ((total - 10000) / total) * 100 + '%';
        };
        input.oninput = update;
        document.querySelectorAll('.presets button').forEach((b) => { b.onclick = () => { input.value = b.dataset.r; sfx.tap(); update(); }; });
        update();
      },
    },
    credit: {
      title: 'Credit cards are loans',
      text: 'If you don’t pay your full balance each month, the card charges interest — often over 20% a year. Paying only a little keeps you in debt for years.',
      prompt: 'You owe $1,000 at 22% APR. Choose how much to pay each month.',
      html: () => `
        <div class="viz">
          <div class="row">
            <div><div class="lbl">Monthly payment</div><div class="big" id="cpay">$35</div></div>
            <div style="text-align:right"><div class="lbl">Time to pay off</div><div class="big" id="ctime">3 yr 5 mo</div></div>
          </div>
          <label class="sr" for="payIn">Monthly payment</label>
          <input type="range" id="payIn" min="25" max="250" step="5" value="35">
          <div class="stack"><i class="s-navy" id="cP"></i><i class="s-gold" id="cI"></i></div>
          <div class="legend"><span><i style="background:var(--navy)"></i>$1,000 balance</span><span><i style="background:var(--gold)"></i>Interest: <b id="cint" style="color:var(--ink)"></b></span></div>
        </div>`,
      bind: () => {
        const input = document.getElementById('payIn');
        const update = () => {
          const p = +input.value, r = payoff(1000, 0.22, p);
          document.getElementById('cpay').textContent = money(p);
          document.getElementById('ctime').textContent = duration(r.months);
          document.getElementById('cint').textContent = money(r.interest);
          document.getElementById('cP').style.width = (1000 / r.paid) * 100 + '%';
          document.getElementById('cI').style.width = (r.interest / r.paid) * 100 + '%';
        };
        input.oninput = update;
        update();
      },
    },
    budget: {
      title: 'Give every dollar a job',
      text: 'A <b>budget</b> is a plan for your paycheck before you spend it. The <b>50/30/20 rule</b> is an easy place to start.',
      prompt: 'Slide to change your monthly take-home pay.',
      html: () => `
        <div class="viz">
          <div class="row">
            <div><div class="lbl">Take-home pay / month</div><div class="big" id="inc">$3,600</div></div>
          </div>
          <label class="sr" for="incIn">Monthly take-home pay</label>
          <input type="range" id="incIn" min="2000" max="7000" step="100" value="3600">
          <div class="stack"><i class="s-navy" style="width:50%"></i><i class="s-gold" style="width:30%"></i><i class="s-mint" style="width:20%"></i></div>
          <div class="legend" style="display:grid;gap:6px">
            <span><i style="background:var(--navy)"></i>50% needs — rent, food, transportation, loan payments: <b id="b50" style="color:var(--ink)"></b></span>
            <span><i style="background:var(--gold)"></i>30% wants — fun, eating out, subscriptions: <b id="b30" style="color:var(--ink)"></b></span>
            <span><i style="background:var(--mint)"></i>20% savings &amp; extra debt payments: <b id="b20" style="color:var(--ink)"></b></span>
          </div>
        </div>`,
      bind: () => {
        const input = document.getElementById('incIn');
        const update = () => {
          const v = +input.value;
          document.getElementById('inc').textContent = money(v);
          document.getElementById('b50').textContent = money(v * .5);
          document.getElementById('b30').textContent = money(v * .3);
          document.getElementById('b20').textContent = money(v * .2);
        };
        input.oninput = update;
        update();
      },
    },
  };

  function lesson(unit) {
    const K = CONCEPTS[unit.concept];
    unit.terms.forEach((t) => G.terms.add(t));
    render(`
      ${topbar()}
      <div class="eyebrow" style="margin-top:14px">Chapter ${unit.n} of ${C.units.length} · ${unit.topic}</div>
      <div style="font-size:15px;color:var(--muted);margin-top:2px">${unit.title}</div>
      <article class="lesson-card">
        <span class="eyebrow lesson-tag">${ic('bulb', 15, 2.25)} Quick lesson</span>
        <h2>${K.title}</h2>
        <p>${K.text}</p>
        <p class="small" style="margin-bottom:8px;color:var(--muted-ink)"><b>Try it:</b> ${K.prompt}</p>
        ${K.html()}
        <div class="terms">
          ${unit.terms.map((t) => `<div class="term">${ic('bookmark', 18)}<span><b>${C.glossary[t].t}:</b> ${C.glossary[t].d}</span></div>`).join('')}
        </div>
      </article>
      <div style="height:14px"></div>
      <button class="btn" id="go">Start chapter ${unit.n} ${ic('arrowR', 22, 2.25)}</button>`);
    bindMute();
    K.bind();
    announce(`Chapter ${unit.n}: ${unit.title}. ${K.title}.`);
    document.getElementById('go').onclick = () => { sfx.tap(); deal(); };
  }

  // ---------- swipe cards ----------
  function meters() {
    const m = (k) => {
      const v = G.st[k], M = METERS[k];
      return `<div class="meter" id="m_${k}">
        <span class="dot"></span>${ic(M.icon, 20)}<span class="lbl">${M.label}</span>
        <div class="bar" role="meter" aria-label="${M.label}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"><i class="${v <= 25 ? 'low' : ''}" style="width:${v}%"></i></div>
      </div>`;
    };
    return `<div class="meters" id="meters">${m('cash')}${m('grades')}${m('wellbeing')}
      <div class="meter debt">${ic('receipt', 20)}<span class="lbl">Debt</span><span class="num" id="debt">${money(G.st.debt)}</span></div></div>`;
  }
  function previewDots(fx) {
    Object.keys(METERS).forEach((k) => {
      const dot = document.querySelector(`#m_${k} .dot`);
      if (!dot) return;
      const v = fx && fx[k];
      dot.classList.toggle('show', !!v);
      dot.classList.toggle('big', !!v && Math.abs(v) >= 15);
    });
  }
  function choicesFor(card) {
    if (!card.twist) return { L: card.L, R: card.R };
    const T = C.twist;
    const as = (t) => ({ ...t, debt: Math.round(card.cost * t.debtMult) });
    return { L: as(T.L), R: as(G.st.cash >= T.threshold ? T.R_ok : T.R_short) };
  }

  function deal() {
    const card = G.deck[G.i];
    const unit = unitOf(card.unit);
    const { L, R } = choicesFor(card);
    const medal = card.twist ? 'gold' : (G.i % 2 ? 'gold' : 'mint');
    render(`
      ${meters()}
      <div class="chapter"><b>${card.twist ? 'Plot twist' : unit.title}</b> · ${G.i + 1} of ${G.deck.length}</div>
      <div class="deck">
        ${G.i < G.deck.length - 1 ? '<div class="under"></div>' : ''}
        <div class="card enter" id="card" role="group" aria-roledescription="choice card" aria-labelledby="cardText">
          <div class="who"><span class="medal">${ic(card.whoIcon, 20)}</span>${card.who}</div>
          <div class="art"><span class="medal ${medal}">${ic(card.icon, 64, 1.5)}</span></div>
          <div class="text" id="cardText">${card.text}</div>
          ${card.stake ? `<div class="stake">${card.stake}</div>` : ''}
          <span class="choice-tag l" id="tagL" aria-hidden="true">${L.label}</span>
          <span class="choice-tag r" id="tagR" aria-hidden="true">${R.label}</span>
        </div>
      </div>
      <div class="btns">
        <button class="pick l" id="pickL">${ic('arrowL', 18, 2.25)}<span>${L.label}</span></button>
        <button class="pick r" id="pickR"><span>${R.label}</span>${ic('arrowR', 18, 2.25)}</button>
      </div>
      <div class="hint">${G.i === 0 ? `${ic('swipe', 16)} Swipe the card or tap a button` : ''}</div>`, { lock: true });
    announce(`${card.who}: ${card.text}`);
    bindSwipe(card, L, R);
  }

  function bindSwipe(card, L, R) {
    const el = document.getElementById('card');
    const tagL = document.getElementById('tagL'), tagR = document.getElementById('tagR');
    let x0 = null, y0 = 0, dx = 0, done = false;
    const paint = () => {
      el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      const p = Math.min(1, Math.abs(dx) / 100);
      tagL.style.opacity = dx < 0 ? p : 0;
      tagR.style.opacity = dx > 0 ? p : 0;
      previewDots(Math.abs(dx) > 30 ? (dx < 0 ? L.fx : R.fx) : null);
    };
    const commit = (side) => {
      if (done) return; done = true;
      document.removeEventListener('keydown', onKey);
      const dir = side === 'L' ? -1 : 1;
      el.style.transition = 'transform .32s ease-in';
      el.style.transform = `translateX(${dir * 520}px) rotate(${dir * 28}deg)`;
      (side === 'L' ? tagL : tagR).style.opacity = 1;
      sfx.swipe();
      setTimeout(() => choose(card, side, side === 'L' ? L : R), 240);
    };
    const onKey = (e) => {
      if (document.querySelector('.sheet-bg')) return;
      if (e.key === 'ArrowLeft') commit('L');
      if (e.key === 'ArrowRight') commit('R');
    };
    el.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; el.style.cursor = 'grabbing'; });
    el.addEventListener('pointermove', (e) => { if (x0 === null) return; dx = e.clientX - x0; paint(); });
    const release = (e) => {
      if (x0 === null) return;
      const moved = Math.abs(dx) + Math.abs(((e && e.clientY) || y0) - y0);
      x0 = null; el.style.cursor = '';
      if (Math.abs(dx) > 90) return commit(dx < 0 ? 'L' : 'R');
      if (moved < 6) { // a tap: wiggle to teach the gesture
        el.style.transition = 'transform .2s';
        el.style.transform = 'translateX(16px) rotate(1deg)';
        setTimeout(() => { el.style.transform = 'translateX(-16px) rotate(-1deg)'; }, 110);
        setTimeout(() => { el.style.transform = ''; }, 240);
        dx = 0; return;
      }
      el.style.transition = 'transform .3s cubic-bezier(.2,1.4,.4,1)';
      dx = 0; paint();
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    document.getElementById('pickL').onclick = () => commit('L');
    document.getElementById('pickR').onclick = () => commit('R');
    [['pickL', L], ['pickR', R]].forEach(([id, ch]) => {
      const b = document.getElementById(id);
      b.onmouseenter = b.onfocus = () => previewDots(ch.fx);
      b.onmouseleave = b.onblur = () => previewDots(null);
    });
    document.addEventListener('keydown', onKey);
  }

  const isGood = (card, side, ch) => (card.twist ? !!ch.good : !card.best || card.best === side);

  function choose(card, side, ch) {
    const before = { ...G.st };
    Object.entries(ch.fx).forEach(([k, v]) => { G.st[k] = clamp(G.st[k] + v); });
    G.st.debt = Math.max(0, G.st.debt + ch.debt);
    G.picks[card.id] = side;
    const good = isGood(card, side, ch);
    G.log.push({ id: card.id, icon: card.icon, head: ch.head, good });
    const newTerms = (card.terms || []).filter((t) => !G.terms.has(t));
    newTerms.forEach((t) => G.terms.add(t));

    // animate meters
    const tmp = document.createElement('div'); tmp.innerHTML = meters();
    document.getElementById('meters').replaceWith(tmp.firstElementChild);
    Object.keys(METERS).forEach((k) => {
      if (G.st[k] === before[k]) return;
      const m = document.getElementById('m_' + k), bar = m.querySelector('.bar i');
      bar.style.width = before[k] + '%';
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = G.st[k] + '%'; }));
      m.classList.add('bump');
    });
    if (good) { sfx.good(); confetti(24); } else sfx.bad();

    const deltas = [
      ...Object.entries(ch.fx).map(([k, v]) => `<span class="d ${v > 0 ? 'up' : 'down'}">${ic(METERS[k].icon, 16, 2)}${METERS[k].label} ${v > 0 ? '+' : '−'}${Math.abs(v)}</span>`),
      ch.debt ? `<span class="d ${ch.debt < 0 ? 'up' : 'down'}">${ic('receipt', 16, 2)}Debt ${ch.debt > 0 ? '+' : '−'}${money(Math.abs(ch.debt))}</span>` : '',
    ].join('');
    const termBox = newTerms.length ? `
      <div class="box term">${ic('bookmark', 20)}<p><span class="k">Added to your Money Notebook</span>
        ${newTerms.map((t) => `<b>${C.glossary[t].t}</b> — ${C.glossary[t].d}`).join('<br>')}</p></div>` : '';

    G.broke = Object.keys(METERS).find((k) => G.st[k] <= 0) || null;
    const last = G.i + 1 >= G.deck.length || G.broke;
    const nextUnit = !last && G.deck[G.i + 1].unit !== card.unit && G.learn && !G.seenUnits.has(G.deck[G.i + 1].unit);
    const nextLabel = G.broke ? 'See what happened' : last ? (G.learn ? 'Final check' : 'See my results') : nextUnit ? 'Next chapter' : 'Next card';

    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetHead">
      <div class="head" id="sheetHead"><span class="medal ${good ? 'good' : 'bad'}">${ic(good ? 'check' : 'alert', 24, 2.25)}</span>${ch.head}</div>
      <div class="deltas">${deltas}</div>
      <div class="box lesson">${ic('bulb', 20)}<p><span class="k">Why it matters</span>${ch.lesson}</p></div>
      ${ch.math ? `<div class="box math">${ic('calc', 20)}<p><span class="k">Quick math</span>${ch.math}</p></div>` : ''}
      ${termBox}
      ${G.broke ? `<p class="gameover">Your ${METERS[G.broke].label.toLowerCase()} hit zero — game over!</p>` : ''}
      <button class="btn dark" id="cont" style="margin-top:14px">${nextLabel} ${ic('arrowR', 20, 2.25)}</button>
    </div>`;
    document.body.appendChild(bg);
    const cont = document.getElementById('cont');
    cont.focus();
    cont.onclick = () => { bg.remove(); G.i++; next(); };
  }

  // ---------- results ----------
  const score = (st) => Math.round(st.cash * 3 + st.grades * 2 + st.wellbeing * 2 + Math.max(0, 300 - st.debt / 150));
  const personality = () => C.personalities.find((p) => p.when(G.st, G.picks));

  function results() {
    const p = personality();
    const total = score(G.st);
    document.body.classList.remove('locked');
    const terms = [...G.terms];

    Data.log('finish', SRC, {
      session, v: 3, nick, replay: plays > 1, challenged: BEAT !== null, beat: BEAT,
      score: total, personality: p.id, ...G.st, broke: G.broke, terms: terms.length,
      pre: G.pre ? G.pre.score : null, post: G.post ? G.post.score : null, quizLen: C.quiz.length,
      preAnswers: G.pre ? G.pre.answers : null, postAnswers: G.post ? G.post.answers : null,
      picks: G.picks, seconds: Math.round(((G.finishedAt || Date.now()) - G.startedAt) / 1000),
    });

    const vs = BEAT !== null
      ? (total > BEAT
        ? `<div class="vs win">${ic('award', 24)}You beat ${BEAT_BY ? esc(BEAT_BY) : 'your friend'}’s score of ${BEAT}!</div>`
        : `<div class="vs lose">${ic('replay', 24)}${BEAT_BY ? esc(BEAT_BY) : 'Your friend'} still leads with ${BEAT}. Try again?</div>`) : '';
    const learned = G.pre && G.post ? `
      <div class="panel">
        <h3>${ic('chart', 20)} What you learned</h3>
        <div class="compare">
          <div><b>${G.pre.score}/${C.quiz.length}</b><span>Before</span></div>
          <div class="after"><b>${G.post.score}/${C.quiz.length}</b><span>After</span></div>
        </div>
      </div>` : '';
    const allTerms = Object.keys(C.glossary).length;

    render(`
      ${topbar()}
      <div class="center" style="justify-content:flex-start;gap:14px;padding-top:6px">
        ${G.broke ? `<p style="margin:0;color:var(--gold)">Your ${METERS[G.broke].label.toLowerCase()} hit zero — game over early.</p>` : ''}
        <div class="result-card">
          <div class="eyebrow">${nick ? esc(nick) + '’s' : 'Your'} money personality</div>
          <div style="margin-top:12px"><span class="medal mint">${ic(p.icon, 48, 1.5)}</span></div>
          <div class="type">${p.t}</div>
          <p class="desc">${p.d}</p>
          <div class="stats">
            <div><b>${total}</b><span>Score</span></div>
            <div><b>${money(G.st.debt)}</b><span>Student debt</span></div>
            <div><b>${terms.length}</b><span>Terms learned</span></div>
          </div>
        </div>
        ${vs}
        <button class="btn" id="share">${ic('share', 22, 2.25)} Share my card</button>
        <button class="btn quiet" id="challenge">${ic('link', 20)} Challenge a friend</button>
        ${learned}
        <div class="panel">
          <h3>${ic('notebook', 20)} Your Money Notebook</h3>
          <p class="progress-note">${terms.length} of ${allTerms} terms collected${terms.length < allTerms ? ' — play again to find more' : ''}. Tap a term to review it.</p>
          <div class="notebook">${terms.map((t) => `<details><summary>${C.glossary[t].t}${ic('arrowR', 16)}</summary><p>${C.glossary[t].d}</p></details>`).join('')}</div>
        </div>
        <div class="panel">
          <h3>${ic('check', 20)} Your choices</h3>
          <ul class="recap">${G.log.map((l) => `<li><span class="${l.good ? 'ok' : 'no'}">${ic(l.good ? 'check' : 'alert', 20, 2)}</span>${l.head}</li>`).join('')}</ul>
        </div>
        <button class="btn quiet" id="again">${ic('replay', 20)} Play again with new cards</button>
      </div>`);
    bindMute();
    confetti(90); sfx.good();
    announce(`You're ${p.t}. Score ${total}.`);

    const challengeUrl = () => {
      const u = new URL(location.href);
      u.search = ''; u.hash = '';
      u.searchParams.set('beat', total);
      if (nick) u.searchParams.set('by', nick);
      u.searchParams.set('src', 'friend');
      return u.toString();
    };
    document.getElementById('challenge').onclick = async () => {
      const text = `I scored ${total} on Swipe Through College. Can you beat me?`;
      try {
        if (navigator.share) await navigator.share({ title: 'Swipe Through College', text, url: challengeUrl() });
        else { await navigator.clipboard.writeText(`${text} ${challengeUrl()}`); toast('Link copied — send it to a friend'); }
      } catch {}
    };
    document.getElementById('share').onclick = () => shareImage(p, total, terms.length, challengeUrl());
    document.getElementById('again').onclick = () => {
      newRun();
      Data.log('start', SRC, { session, v: 3, nick, replay: true });
      next();
    };
  }

  // ---------- story-sized share image (1080×1920) ----------
  async function shareImage(p, total, termCount, url) {
    try { await document.fonts.load('800 80px "Bricolage Grotesque"'); } catch {}
    const W = 1080, H = 1920, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const F = (w, s) => `${w} ${s}px "Bricolage Grotesque", system-ui, sans-serif`;
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.roundRect ? x.roundRect(X, Y, w, h, r) : x.rect(X, Y, w, h); };
    const circle = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); };

    x.fillStyle = '#162B49'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#EFCB75'; x.globalAlpha = .18; circle(W - 60, 160, 300); x.fill(); x.globalAlpha = 1;
    x.fillStyle = '#6ED9B3'; x.globalAlpha = .12; circle(80, H - 120, 260); x.fill(); x.globalAlpha = 1;

    x.textBaseline = 'top';
    x.fillStyle = '#F7F5EC'; x.font = F(800, 64); x.fillText('cent', 90, 110);
    const cw = x.measureText('cent').width;
    x.fillStyle = '#6ED9B3'; x.fillText('sible.', 90 + cw, 110);

    // cream card
    rr(70, 300, W - 140, 1180, 56); x.fillStyle = '#F7F5EC'; x.fill();
    x.fillStyle = '#5A6B82'; x.font = F(700, 36);
    x.fillText(((nick ? nick + '’s' : 'My') + ' money personality').toUpperCase(), 140, 370);
    circle(240, 590, 120); x.fillStyle = '#6ED9B3'; x.fill();
    Icon.draw(x, p.icon, 240 - 84, 590 - 84, 168, '#162B49', 1.5);
    x.fillStyle = '#162B49'; x.font = F(800, 112); x.fillText(p.t, 140, 760);

    x.fillStyle = '#33445E'; x.font = F(500, 48);
    let line = '', y = 910;
    for (const w of p.d.split(' ')) {
      if (x.measureText(line + w).width > W - 300) { x.fillText(line.trim(), 140, y); line = ''; y += 66; }
      line += w + ' ';
    }
    x.fillText(line.trim(), 140, y);

    const stats = [[String(total), 'Score'], [money(G.st.debt), 'Student debt'], [String(termCount), 'Terms learned']];
    const bw = (W - 280 - 40) / 3;
    stats.forEach(([v, l], k) => {
      const bx = 140 + k * (bw + 20), by = 1210;
      rr(bx, by, bw, 200, 32); x.fillStyle = '#162B49'; x.fill();
      let fs = 72;
      do { x.font = F(800, fs); fs -= 4; } while (x.measureText(v).width > bw - 56 && fs > 30);
      x.fillStyle = '#6ED9B3'; x.fillText(v, bx + 28, by + 36);
      x.fillStyle = '#A8B7CB'; x.font = F(600, 30); x.fillText(l, bx + 28, by + 132);
    });

    x.fillStyle = '#F7F5EC'; x.font = F(800, 64); x.fillText('What’s yours?', 90, 1580);
    x.fillStyle = '#EFCB75'; x.font = F(600, 40); x.fillText('Play Swipe Through College', 90, 1670);

    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const file = new File([blob], 'my-money-personality.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `I’m ${p.t}. What’s your money personality? ${url}` });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Image saved — post it to your story');
  }

  home();
})();
