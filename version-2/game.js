/* centsible. — Swipe Through College (v2)
 * Flow: home → quick check (pre) → swipe deck → quick check (post, unlocks card) → results.
 * Replays skip the quick checks and go straight to the deck.
 */
(() => {
  'use strict';

  const C = window.CENTSIBLE_CONTENT;
  const Data = window.CentsibleData;
  const $stage = document.getElementById('stage');
  const $live = document.getElementById('live');

  // ---------- URL params: marketing source + friend challenges ----------
  const params = new URLSearchParams(location.search);
  const clean = (s, n) => (s || '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, n);
  const SRC = clean(params.get('src'), 24).toLowerCase() || 'direct';
  const BEAT = params.has('beat') ? Math.max(0, Math.min(1000, parseInt(params.get('beat'), 10) || 0)) : null;
  const BEAT_BY = clean(params.get('by'), 20);

  const session = Math.random().toString(36).slice(2, 10);
  Data.log('visit', SRC, { session, challenged: BEAT !== null });

  // ---------- helpers ----------
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const clamp = (n) => Math.max(0, Math.min(100, n));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const announce = (t) => { $live.textContent = t; };
  const METER_LABEL = { cash: '💰 Cash', grades: '📚 Grades', vibes: '😊 Vibes' };
  const METER_ICON = { cash: '💰', grades: '📚', vibes: '😊' };

  let muted = false;
  try { muted = localStorage.getItem('centsible_muted') === '1'; } catch {}
  let audio;
  function beep(freq, dur = 0.12, type = 'sine', vol = 0.12) {
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
    good: () => [523, 659, 784].forEach((f, k) => setTimeout(() => beep(f, .14, 'triangle'), k * 80)),
    bad: () => { beep(196, .28, 'sawtooth', .06); try { navigator.vibrate && navigator.vibrate([70, 40, 70]); } catch {} },
    swipe: () => beep(440, .06, 'triangle', .05),
  };

  function confetti(n = 80) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#b6f36a', '#ff5ca8', '#4cc9ff', '#ffd23f', '#ffffff'];
    for (let k = 0; k < n; k++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.background = colors[k % colors.length];
      el.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
      el.style.animationDelay = Math.random() * .4 + 's';
      el.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3800);
    }
  }
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
  function render(html, { lock = false } = {}) {
    document.body.classList.toggle('locked', lock);
    $stage.innerHTML = html;
    window.scrollTo(0, 0);
    $stage.focus({ preventScroll: true });
  }
  function topbar() {
    return `<div class="topbar"><span class="brand">cent<span>sible.</span></span>
      <button class="icon-btn" id="mute" aria-label="${muted ? 'Turn sound on' : 'Turn sound off'}">${muted ? '🔇' : '🔊'}</button></div>`;
  }
  function bindMute() {
    const b = document.getElementById('mute');
    if (!b) return;
    b.onclick = () => {
      muted = !muted;
      try { localStorage.setItem('centsible_muted', muted ? '1' : '0'); } catch {}
      b.textContent = muted ? '🔇' : '🔊';
      b.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
    };
  }

  // ---------- game state ----------
  let G;          // current run
  let plays = 0;  // runs started this page load
  let nick = '';
  try { nick = localStorage.getItem('centsible_nick') || ''; } catch {}

  function buildDeck() {
    const twist = shuffle(C.cards.filter((c) => c.twist))[0];
    const core = C.cards.filter((c) => c.core && !c.twist);
    const extras = shuffle(C.cards.filter((c) => !c.core && !c.twist)).slice(0, Math.max(0, C.deckSize - 1 - core.length));
    const order = (c) => C.chapters.indexOf(c.ch);
    return [...core, ...extras].sort((a, b) => order(a) - order(b) || C.cards.indexOf(a) - C.cards.indexOf(b)).concat(twist);
  }

  function newRun() {
    plays++;
    G = {
      deck: buildDeck(), i: 0, st: { ...C.start }, picks: {}, log: [],
      pre: null, post: null, quizzes: plays === 1, startedAt: Date.now(), broke: null,
    };
  }

  // ---------- home ----------
  function home() {
    const challenge = BEAT !== null
      ? `<div class="challenge">🏆 <b>${BEAT_BY ? esc(BEAT_BY) : 'A friend'}</b> scored <b>${BEAT}</b>. Think you can beat it?</div>` : '';
    render(`
      ${topbar()}
      <div class="center">
        <span class="badge">3 minutes · 10 choices</span>
        <h1 class="title">Swipe<br>through<br><span>college.</span></h1>
        <div><span class="demo" aria-hidden="true">👆</span></div>
        <p class="muted" style="margin:0">Senior year → your first job.<br>Keep your 💰 📚 😊 up and your debt down.</p>
        ${challenge}
        <label class="sr" for="nick">Nickname</label>
        <input class="nick" id="nick" maxlength="20" autocomplete="off" placeholder="Nickname (not your real name)" value="${esc(nick)}">
        <button class="big" id="go">Start swiping →</button>
      </div>`);
    bindMute();
    document.getElementById('go').onclick = () => {
      nick = clean(document.getElementById('nick').value, 20);
      try { localStorage.setItem('centsible_nick', nick); } catch {}
      beep(660, .08);
      newRun();
      Data.log('start', SRC, { session, nick, replay: plays > 1 });
      G.quizzes ? check('pre', 0, []) : deal();
    };
  }

  // ---------- quick check (same questions before and after) ----------
  function check(phase, i, answers) {
    const Q = C.quiz[i];
    const label = phase === 'pre' ? 'Warm-up · no pressure' : 'Last step · unlock your card 🔓';
    render(`
      ${topbar()}
      <div class="qhead">
        <div class="kind">${label}</div>
        <div class="dots">${C.quiz.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <h2 class="question">${esc(Q.q)}</h2>
      ${phase === 'pre' && i === 0 ? '<p class="muted small" style="margin-top:8px">4 quick questions so we can see what you learn.</p>' : ''}
      <div class="tiles" id="tiles">
        ${Q.a.map((a, k) => `<button class="tile" data-k="${k}"><span class="shape" aria-hidden="true">${'▲◆●■'[k]}</span>${esc(a)}</button>`).join('')}
      </div>`);
    bindMute();
    document.querySelectorAll('.tile').forEach((b) => {
      b.onclick = () => {
        const k = +b.dataset.k;
        const next = [...answers, k];
        const advance = () => {
          if (i + 1 < C.quiz.length) return check(phase, i + 1, next);
          const score = next.filter((a, q) => a === C.quiz[q].correct).length;
          G[phase] = { answers: next, score };
          phase === 'pre' ? deal() : results();
        };
        if (phase === 'post') {
          const tiles = document.getElementById('tiles');
          tiles.classList.add('locked');
          tiles.querySelectorAll('.tile').forEach((t) => t.classList.add(+t.dataset.k === Q.correct ? 'right' : 'dim'));
          k === Q.correct ? sfx.good() : sfx.bad();
          setTimeout(advance, 750);
        } else {
          beep(520, .06);
          advance();
        }
      };
    });
  }

  // ---------- deck ----------
  function meters() {
    const m = (k, lbl) => {
      const v = G.st[k];
      return `<div class="meter" id="m_${k}">
        <span class="dot"></span>
        <span class="ic" aria-hidden="true">${METER_ICON[k]}</span><span class="lbl">${lbl}</span>
        <div class="bar" role="meter" aria-label="${lbl}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"><i class="${v <= 25 ? 'low' : ''}" style="width:${v}%"></i></div>
      </div>`;
    };
    return `<div class="meters" id="meters">${m('cash', 'Cash')}${m('grades', 'Grades')}${m('vibes', 'Vibes')}
      <div class="meter debt"><span class="lbl">Debt</span><span class="num" id="debt">${money(G.st.debt)}</span></div></div>`;
  }
  function previewDots(fx) {
    ['cash', 'grades', 'vibes'].forEach((k) => {
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
    const asChoice = (t) => ({ ...t, debt: Math.round(card.cost * t.debtMult) });
    return { L: asChoice(T.L), R: asChoice(G.st.cash >= T.threshold ? T.R_ok : T.R_short) };
  }

  function deal() {
    const card = G.deck[G.i];
    const { L, R } = choicesFor(card);
    render(`
      ${meters()}
      <div class="chapter"><b>${card.ch}</b> · ${G.i + 1} of ${G.deck.length}</div>
      <div class="deck">
        ${G.i < G.deck.length - 1 ? '<div class="under"></div>' : ''}
        <div class="card enter" id="card" role="group" aria-roledescription="choice card" aria-labelledby="cardText">
          <div class="who"><span class="avatar" aria-hidden="true">${card.av}</span>${card.who}</div>
          <div class="art" aria-hidden="true">${card.art}</div>
          <div class="text" id="cardText">${card.text}</div>
          ${card.stake ? `<div class="stake">${card.stake}</div>` : ''}
          <span class="choice-tag l" id="tagL" aria-hidden="true">${L.label}</span>
          <span class="choice-tag r" id="tagR" aria-hidden="true">${R.label}</span>
        </div>
      </div>
      <div class="btns">
        <button class="pick l" id="pickL">◀ ${L.label}</button>
        <button class="pick r" id="pickR">${R.label} ▶</button>
      </div>
      <div class="hint">${G.i === 0 ? 'Swipe the card or tap a button' : '&nbsp;'}</div>`, { lock: true });
    announce(`${card.ch}. ${card.who}: ${card.text.replace(/<[^>]+>/g, '')}`);
    bindSwipe(card, L, R);
  }

  function bindSwipe(card, L, R) {
    const el = document.getElementById('card');
    const tagL = document.getElementById('tagL'), tagR = document.getElementById('tagR');
    let x0 = null, y0 = null, dx = 0, done = false;

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

    el.addEventListener('pointerdown', (e) => {
      x0 = e.clientX; y0 = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.transition = 'none'; el.style.cursor = 'grabbing';
    });
    el.addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      paint();
    });
    const release = (e) => {
      if (x0 === null) return;
      const moved = Math.abs(dx) + Math.abs((e && e.clientY || y0) - y0);
      x0 = null; el.style.cursor = '';
      if (Math.abs(dx) > 90) return commit(dx < 0 ? 'L' : 'R');
      if (moved < 6) { // a tap on the card: nudge to teach the gesture
        el.style.transition = 'transform .25s';
        el.style.transform = 'translateX(18px) rotate(1deg)';
        setTimeout(() => { el.style.transform = 'translateX(-18px) rotate(-1deg)'; }, 120);
        setTimeout(() => { el.style.transform = ''; }, 260);
        dx = 0;
        return;
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

  function isGood(card, side, ch) {
    if (card.twist) return !!ch.good;
    return !card.best || card.best === side;
  }

  function choose(card, side, ch) {
    const before = { ...G.st };
    Object.entries(ch.fx).forEach(([k, v]) => { G.st[k] = clamp(G.st[k] + v); });
    G.st.debt = Math.max(0, G.st.debt + ch.debt);
    G.picks[card.id] = side;
    const good = isGood(card, side, ch);
    G.log.push({ id: card.id, art: card.art, head: ch.head, good });

    // Animate the meters from old to new values.
    const tmp = document.createElement('div'); tmp.innerHTML = meters();
    document.getElementById('meters').replaceWith(tmp.firstElementChild);
    ['cash', 'grades', 'vibes'].forEach((k) => {
      if (G.st[k] === before[k]) return;
      const m = document.getElementById('m_' + k), bar = m.querySelector('.bar i');
      bar.style.width = before[k] + '%';
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = G.st[k] + '%'; }));
      m.classList.add('bump');
    });

    if (good) { sfx.good(); confetti(30); } else sfx.bad();

    const deltas = [
      ...Object.entries(ch.fx).map(([k, v]) => `<span class="d ${v > 0 ? 'up' : 'down'}">${METER_ICON[k]} ${v > 0 ? '+' : ''}${v}</span>`),
      ch.debt ? `<span class="d ${ch.debt < 0 ? 'up' : 'down'}">Debt ${ch.debt > 0 ? '+' : '−'}${money(Math.abs(ch.debt))}</span>` : '',
    ].join('');

    G.broke = ['cash', 'grades', 'vibes'].find((k) => G.st[k] <= 0) || null;
    const last = G.i + 1 >= G.deck.length || G.broke;
    const nextLabel = G.broke ? 'Uh oh… see what happened' : last ? (G.quizzes ? 'Unlock my money personality 🔓' : 'See my money personality ✨') : 'Next card →';

    const bg = document.createElement('div');
    bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetHead">
      <div class="head" id="sheetHead">${ch.head}</div>
      <div class="deltas">${deltas}</div>
      <div class="lesson">💡 ${ch.lesson}</div>
      ${G.broke ? `<p style="color:#a4161a;margin:12px 0 0">Your ${METER_LABEL[G.broke]} hit zero — game over!</p>` : ''}
      <button class="go" id="cont">${nextLabel}</button>
    </div>`;
    document.body.appendChild(bg);
    const cont = document.getElementById('cont');
    cont.focus();
    cont.onclick = () => {
      bg.remove();
      G.i++;
      if (!last) return deal();
      G.finishedAt = Date.now();
      G.quizzes ? check('post', 0, []) : results();
    };
  }

  // ---------- scoring + results ----------
  function score(st) {
    return Math.round(st.cash * 3 + st.grades * 2 + st.vibes * 2 + Math.max(0, 300 - st.debt / 150));
  }
  function personality() {
    return C.personalities.find((p) => p.when(G.st, G.picks));
  }

  function results() {
    const p = personality();
    const total = score(G.st);
    document.body.classList.remove('locked');

    Data.log('finish', SRC, {
      session, nick, replay: plays > 1, challenged: BEAT !== null, beat: BEAT,
      score: total, personality: p.id, ...G.st, broke: G.broke,
      pre: G.pre ? G.pre.score : null, post: G.post ? G.post.score : null, quizLen: C.quiz.length,
      picks: G.picks, seconds: Math.round(((G.finishedAt || Date.now()) - G.startedAt) / 1000),
    });

    const vs = BEAT !== null
      ? `<div class="vs ${total > BEAT ? 'win' : 'lose'}">${total > BEAT
          ? `🏆 You beat ${BEAT_BY ? esc(BEAT_BY) : 'your friend'}’s ${BEAT}!`
          : `${BEAT_BY ? esc(BEAT_BY) : 'Your friend'} still leads with ${BEAT}. Run it back?`}</div>` : '';
    const learned = G.pre && G.post ? `
      <div class="panel">
        <h3>What you learned</h3>
        <div class="compare">
          <div><b>${G.pre.score}/${C.quiz.length}</b><span>Before</span></div>
          <div><b>${G.post.score}/${C.quiz.length}</b><span>After</span></div>
        </div>
      </div>` : '';

    render(`
      ${topbar()}
      <div class="center" style="justify-content:flex-start;gap:14px;padding-top:6px">
        ${G.broke ? `<p style="margin:0;color:#ffb3b5">Your ${METER_LABEL[G.broke]} hit zero — game over early!</p>` : ''}
        <div class="wrapped" style="--c1:${p.c1};--c2:${p.c2}">
          <span class="brand">cent<span style="color:#fff">sible.</span></span>
          <div class="k">${nick ? esc(nick) + '’s' : 'My'} money personality</div>
          <div class="emoji" aria-hidden="true">${p.e}</div>
          <div class="type">${p.t}</div>
          <div class="desc">${p.d}</div>
          <div class="stats">
            <div><b>${total}</b><span>Score</span></div>
            <div><b>${money(G.st.debt)}</b><span>Student debt</span></div>
            <div><b>${G.st.cash}</b><span>💰 Cash</span></div>
          </div>
        </div>
        ${vs}
        <button class="big" id="share">Share my card 📲</button>
        <button class="ghost" id="challenge">Challenge a friend 🔗</button>
        ${learned}
        <div class="panel">
          <h3>Your choices</h3>
          <ul class="recap">${G.log.map((l) => `<li><span>${l.good ? '✅' : '⚠️'}</span><span>${l.art} ${l.head}</span></li>`).join('')}</ul>
        </div>
        <button class="ghost" id="again">Play again 🔁 <span class="muted small">(new cards each time)</span></button>
      </div>`);
    bindMute();
    confetti(110); sfx.good();
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
      const text = `I scored ${total} on Swipe Through College 💸 Bet you can’t beat me:`;
      try {
        if (navigator.share) await navigator.share({ title: 'Swipe Through College', text, url: challengeUrl() });
        else { await navigator.clipboard.writeText(`${text} ${challengeUrl()}`); toast('Link copied! Send it to a friend'); }
      } catch {}
    };
    document.getElementById('share').onclick = () => shareImage(p, total, challengeUrl());
    document.getElementById('again').onclick = () => {
      newRun();
      Data.log('start', SRC, { session, nick, replay: true });
      deal();
    };
  }

  // ---------- story-sized share image (1080×1920) ----------
  async function shareImage(p, total, url) {
    try { await document.fonts.load('800 80px "Bricolage Grotesque"'); } catch {}
    const W = 1080, H = 1920, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    const F = (w, s) => `${w} ${s}px "Bricolage Grotesque", system-ui, sans-serif`;

    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, p.c1); g.addColorStop(1, p.c2);
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    x.fillStyle = '#fff'; x.textBaseline = 'top';
    x.font = F(800, 64); x.fillText('centsible.', 90, 110);
    x.globalAlpha = .85; x.font = F(700, 40);
    x.fillText((nick ? nick + '’s' : 'MY') .toUpperCase() + ' MONEY PERSONALITY', 90, 330);
    x.globalAlpha = 1;
    x.font = '260px system-ui, "Apple Color Emoji", "Segoe UI Emoji"'; x.fillText(p.e, 80, 420);
    x.font = F(800, 132); x.fillText(p.t, 90, 730);

    x.font = F(500, 52);
    const words = p.d.split(' '); let line = '', y = 910;
    for (const w of words) {
      if (x.measureText(line + w).width > W - 180) { x.fillText(line.trim(), 90, y); line = ''; y += 70; }
      line += w + ' ';
    }
    x.fillText(line.trim(), 90, y);

    const stats = [[String(total), 'Score'], [money(G.st.debt), 'Student debt'], [String(G.st.cash), 'Cash']];
    const bw = (W - 180 - 40) / 3;
    stats.forEach(([v, l], k) => {
      const bx = 90 + k * (bw + 20), by = 1260;
      x.fillStyle = 'rgba(0,0,0,.2)';
      x.beginPath(); x.roundRect ? x.roundRect(bx, by, bw, 210, 36) : x.rect(bx, by, bw, 210); x.fill();
      x.fillStyle = '#fff'; x.font = F(800, v.length > 6 ? 58 : 76); x.fillText(v, bx + 30, by + 40);
      x.globalAlpha = .85; x.font = F(600, 34); x.fillText(l, bx + 30, by + 140); x.globalAlpha = 1;
    });

    x.font = F(800, 60); x.fillText('What’s yours? 👀', 90, 1600);
    x.globalAlpha = .85; x.font = F(500, 38); x.fillText('Swipe Through College', 90, 1690); x.globalAlpha = 1;

    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const file = new File([blob], 'my-money-personality.png', { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `I’m ${p.t} ${p.e} What are you? ${url}` });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Image saved — post it to your story!');
  }

  home();
})();
