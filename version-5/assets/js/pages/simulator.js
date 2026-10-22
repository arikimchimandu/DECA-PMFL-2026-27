/* Simulator page controller: screens, saving/resuming, assessments, and the live finances panel. */
(function () {
  const C = window.Centsible, U = C.UI, Sim = C.Sim, F = C.Finance, M = C.Mastery;
  const { $, icon, esc, store } = U;
  const money = F.money;
  U.mountShell('simulator');

  const stage = $('#stage'), side = $('#side'), chaptersEl = $('#chapters');
  let S = null;          // the saved session
  let lastLedger = {};   // for highlighting values that just changed

  const save = () => store.saveSim(S);
  const participant = () => store.get().participant;
  const forms = () => (store.get().counterbalance === 'BA' ? ['B', 'A'] : ['A', 'B']);

  // Presenter shortcut: ?demo=1&preset=credit starts at Chapter 3 with earlier choices filled in.
  const PRESETS = {
    credit: { c1_offers: 'lakeside', c1_housing: 'campus', c1_car: 'none', c1_borrow: 'federal-first', c2_job: 10, c2_budget: 300, c2_laptop: 'refurb', c2_scam: 'portal' },
    job: { c1_offers: 'whitmore', c1_housing: 'campus', c1_car: 'used-cash', c1_borrow: 'federal-first', c2_job: 10, c2_budget: 200, c2_laptop: 'refurb', c2_scam: 'portal', c3_card: 'student', c3_card_use: 'trip', c3_balance: 'minimum', c3_cosign: 'decline' },
    scam: { c1_offers: 'lakeside', c1_housing: 'campus', c1_car: 'none', c1_borrow: 'federal-first', c2_job: 10, c2_budget: 300, c2_laptop: 'refurb' },
  };

  function startNew(learn, presetName) {
    let state = Sim.newState();
    const preset = U.demo && PRESETS[presetName];
    if (preset) {
      for (let n = Sim.next(state); n && n.id in preset; n = Sim.next(state)) state = Sim.choose(state, n.id, preset[n.id]).state;
      state.seenChapters = [...new Set(Object.keys(preset).map((id) => Sim.nodeById(id).chapter))];
    }
    S = { state, phase: learn ? 'quiz' : 'play', quiz: learn ? { kind: 'pre', form: forms()[0], answers: [] } : null, pre: null, post: null, learn, lastOutcome: null };
    C.Analytics.log('sim_start', participant(), 'simulator', { learn, replay: store.get().reports.length > 0 });
    save();
    render();
  }

  // ------------------------------------------------------------ chapter progress + side panel
  function renderChapters() {
    const m = Sim.derive(S ? S.state.choices : {});
    const current = S && S.phase !== 'intro' ? (Sim.next(S.state) || { chapter: 5 }).chapter : 0;
    chaptersEl.innerHTML = Sim.CHAPTERS.map((ch) => {
      const nodes = Sim.NODES.filter((n) => n.chapter === ch.id && (!n.when || n.when(m)));
      const done = S ? nodes.filter((n) => n.id in S.state.choices).length : 0;
      return `<li class="${ch.id === current ? 'on' : ''}"><div class="cs"><i style="width:${nodes.length ? (done / nodes.length) * 100 : 0}%"></i></div>
        <div class="cl">${ch.id}. ${ch.title}</div><span class="sr-only">${done} of ${nodes.length} decisions done</span></li>`;
    }).join('');
  }

  function ring(score) {
    const r = 22, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="${r}" fill="none" stroke="#2B4C76" stroke-width="6"/>
      <circle cx="27" cy="27" r="${r}" fill="none" stroke="#6ED9B3" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - score / 100)}" transform="rotate(-90 27 27)"/>
      <text x="27" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#F7F5EC">${score}</text></svg>`;
  }

  function renderSide() {
    if (!S || S.phase === 'intro') { side.innerHTML = ''; return; }
    const ch = S.state.choices, m = Sim.derive(ch);
    const rows = [];
    if ('c1_offers' in ch) rows.push(['college', 'College', m.college.col.name.replace(' University', '').replace(' College', '')]);
    if ('c1_housing' in ch) rows.push(['net', 'Net price / year', money(m.college.netPrice)]);
    if ('c1_car' in ch) rows.push(['car', 'Car costs in college / month', m.teenCar ? money(m.teenCar.monthly) : 'No car']);
    if ('c1_borrow' in ch || ('c1_car' in ch && m.college.gapTotal === 0)) {
      rows.push(['debt', 'Student loans at graduation', money(m.loans.studentTotal)]);
      if (m.loans.plus) rows.push(['plus', 'Parent PLUS (your parent)', money(m.loans.plus)]);
    }
    if ('c2_budget' in ch) rows.push(['save', 'College savings / month', money(m.school.save)]);
    if ('c2_laptop' in ch) rows.push(['fund', 'Emergency savings', money(m.job.fund)]);
    if ('c2_scam' in ch && m.school.scamLoss) rows.push(['scam', 'Lost to scammers', money(m.school.scamLoss)]);
    if ('c3_card' in ch && m.credit.hasCard) rows.push(['util', 'Card utilization', F.pct(m.credit.util || 0)]);
    if ('c3_balance' in ch || ('c3_card_use' in ch && m.credit.balance)) rows.push(['card', 'Card balance', money(m.credit.balanceAtJob)]);
    if ('c4_offer' in ch) rows.push(['net4', 'Take-home pay / month', money(m.job.pay.monthly.net)]);
    if ('c4_housing' in ch) rows.push(['ess', 'Essentials / month', money(m.job.essentialTotal)]);
    if ('c4_housing' in ch) rows.push(['flex', 'Left after essentials', money(m.job.flexibility)]);
    const now = Object.fromEntries(rows.map((r) => [r[0], r[2]]));
    side.innerHTML = `<div class="ledger-card">
      <h3>${icon('wallet', 20)} Your finances</h3>
      ${rows.length ? `<div class="kv">${rows.map(([k, l, v]) => `<div class="${lastLedger[k] !== undefined && lastLedger[k] !== v ? 'changed' : ''}"><span class="k">${l}</span><span>${v}</span></div>`).join('')}</div>`
        : '<p class="small muted ledger-empty" style="margin:0">Your numbers will appear here as you make decisions. Every choice carries forward.</p>'}
      ${'c4_housing' in ch ? `<div class="health">${ring(m.health.score)}<div><b>Game Financial Health</b><br><span class="small muted">A teaching score for this game only — not a credit score.</span></div></div>` : ''}
      ${S.state.order.length ? (() => { const cs = C.Rewards.challenge(S.state); return `<div class="challenge-mini"><span class="k">${icon('star', 16)} Challenge Score</span><span class="v">${cs.total.toLocaleString('en-US')}<span class="small"> / ${cs.max.toLocaleString('en-US')}</span></span></div>`; })() : ''}
    </div>
    <p class="small muted" style="margin-top:12px">All colleges, jobs, and prices are hypothetical examples. <button class="link-btn" id="restart" style="color:var(--mint)">Start over</button></p>`;
    lastLedger = now;
    $('#restart', side).addEventListener('click', () => {
      if (confirm('Start a new game? Your current progress in this game will be lost.')) { store.clearSim(); S = null; lastLedger = {}; intro(); }
    });
  }

  function card(html, cls = '') {
    stage.innerHTML = `<section class="sim-card ${cls}">${html}</section>`;
    renderChapters(); renderSide();
    const h = stage.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // ------------------------------------------------------------ screens
  function intro() {
    const saved = store.get().sim;
    const replay = store.get().reports.length > 0;
    renderChapters(); side.innerHTML = '';
    if (saved && saved.state && saved.phase && !saved.finished) {
      const p = Sim.progress(saved.state);
      card(`<p class="eyebrow">Welcome back</p><h2>Pick up where you left off?</h2>
        <p class="scene">You’ve made ${p.done} of about ${p.total} decisions. Your game was saved on this device.</p>
        <div class="row" style="margin-top:20px"><button class="btn btn-primary" id="resume">${icon('play', 18)} Resume</button><button class="btn btn-ghost" id="fresh">Start a new game</button></div>`);
      $('#resume').onclick = () => { S = saved; render(); };
      $('#fresh').onclick = () => { store.clearSim(); S = null; intro(); };
      return;
    }
    card(`<p class="eyebrow">${icon('clock', 16)} About 10–15 minutes</p>
      <h2>Your financial life starts now</h2>
      <p class="scene">You’re a high school senior. Over four chapters you’ll choose a college, manage money on campus, get your first credit card, and start your first job. Every choice carries forward — and many have no single right answer.</p>
      <div class="grid grid-2" style="margin:18px 0">
        ${Sim.CHAPTERS.map((c) => `<div class="row" style="align-items:flex-start;gap:12px"><span class="medal medal-${c.id % 2 ? 'mint' : 'gold'}">${icon(c.icon, 22)}</span><span><b>${c.id}. ${c.title}</b><br><span class="small muted">${c.subtitle}</span></span></div>`).join('')}
      </div>
      <div class="callout callout-gold">${icon('chart', 20)}<p>${replay ? 'You’ve played before. You can skip the knowledge checks this time and just explore a different path.' : 'You’ll start and finish with a quick 12-question knowledge check (about 2 minutes each). It’s not graded — it shows what you learned and personalizes your report.'}</p></div>
      ${rewardsCallout()}
      ${replay ? `<label class="row small" style="margin-top:14px;gap:8px"><input type="checkbox" id="learn"> Take the knowledge checks again</label>` : ''}
      <div class="row" style="margin-top:20px"><button class="btn btn-primary" id="go">${icon('play', 18)} Start the simulation</button></div>
      <p class="small muted" style="margin-top:14px">No account needed. Your progress saves in this browser. Centspire is a learning tool, not financial advice.</p>`);
    $('#go').onclick = () => startNew(replay ? $('#learn').checked : true, U.params.get('preset'));
  }

  function rewardsCallout() {
    const rc = C.Rewards.config();
    if (!rc.enabled) return '';
    return `<div class="callout callout-mint" style="margin-top:12px">${icon('award', 20)}<div><p><b>Play for rewards.</b> Every decision earns up to 1,000 Challenge points.</p>
      <ul class="small" style="margin:6px 0 0;padding-left:18px"><li>Get more than ${Math.round(rc.accuracyThreshold * 100)}% of your answers right: <b>${esc(rc.accuracyReward)}</b></li>
      <li>Score over ${rc.scoreThreshold.toLocaleString('en-US')} Challenge points: <b>${esc(rc.scoreReward)}</b></li></ul>
      <p class="small" style="margin:6px 0 0"><a href="about.html#rewards">Reward rules</a></p></div></div>`;
  }

  function quizScreen() {
    const Q = S.quiz, form = C.Assessments.forms[Q.form], i = Q.answers.length;
    const pre = Q.kind === 'pre';
    card(`<p class="eyebrow">${pre ? 'Before you start' : 'Final knowledge check'} · Question ${i + 1} of ${form.length}</p>
      <div class="progress" style="margin-bottom:18px"><i style="width:${(i / form.length) * 100}%"></i></div>
      <div id="q"></div>
      <p class="small muted" style="margin-top:16px">${pre ? 'Just answer what you think — guessing is fine. You’ll see explanations in your report.' : 'Almost done! These questions are different from the first set but test the same skills.'}</p>`);
    U.question($('#q'), form[i], {
      feedback: false,
      onAnswer: (correct, text) => {
        Q.answers.push(text); save();
        setTimeout(() => (Q.answers.length < form.length ? quizScreen() : finishQuiz()), 220);
      },
    });
  }

  function finishQuiz() {
    const Q = S.quiz;
    const result = M.scoreAssessment(Q.form, Q.answers);
    S[Q.kind] = result;
    store.update((d) => { d.assessments.push({ phase: Q.kind, form: Q.form, score: result.score, total: result.total, byTopic: result.byTopic, items: result.items, at: Date.now(), runId: S.state.runId }); });
    C.Analytics.log('assessment', participant(), 'simulator', { phase: Q.kind, form: Q.form, score: result.score, total: result.total, byTopic: result.byTopic, items: result.items.map((x) => (x.correct ? 1 : 0)) });
    if (Q.kind === 'post') {
      result.items.forEach((x) => U.recordAnswer(x.topic, x.concept, x.correct, 'post'));
      S.quiz = null; finish(); return;
    }
    S.quiz = null; S.phase = 'play'; save(); render();
  }

  function play() {
    const node = Sim.next(S.state);
    if (!node) {
      if (S.learn && !S.post) { S.phase = 'quiz'; S.quiz = { kind: 'post', form: forms()[1], answers: [] }; save(); return quizScreen(); }
      return finish();
    }
    if (!S.state.seenChapters.includes(node.chapter)) return chapterIntro(node.chapter);
    decision(node);
  }

  function chapterIntro(n) {
    const ch = Sim.CHAPTERS[n - 1];
    const m = Sim.derive(S.state.choices);
    const recap = n === 2 ? `You chose <b>${esc(m.college.col.name)}</b> and will graduate owing about <b>${money(m.loans.studentTotal)}</b> in student loans.`
      : n === 3 ? `You finished college with <b>${money(m.school.fundAtGrad)}</b> in emergency savings.`
        : n === 4 ? `You’re carrying <b>${money(m.loans.studentTotal)}</b> in student loans${m.credit.balanceAtJob > 0 ? ` and <b>${money(m.credit.balanceAtJob)}</b> on a credit card` : ''} into your first job.` : '';
    card(`<div class="row" style="gap:16px;align-items:center"><span class="medal medal-lg medal-${n % 2 ? 'mint' : 'gold'}">${icon(ch.icon, 34)}</span>
        <div><p class="eyebrow" style="margin:0">Chapter ${n} of 4</p><h2 style="margin:0">${ch.title}: ${ch.subtitle}</h2></div></div>
      <p class="scene" style="margin-top:18px">${ch.intro}</p>
      ${recap ? `<div class="callout callout-navy">${icon('trend', 20)}<p>${recap}</p></div>` : ''}
      <div class="row" style="margin-top:20px"><button class="btn btn-primary" id="go">Begin chapter ${n} ${icon('arrowR', 18)}</button></div>`);
    $('#go').onclick = () => { S.state = { ...S.state, seenChapters: [...S.state.seenChapters, n] }; save(); play(); };
  }

  function offersTable(node, m) {
    if (node.id === 'c1_offers') {
      const rows = node.table(m);
      return `<div class="compare-cards">${rows.map((r) => `<div class="offer"><h4>${r.name}</h4><span class="kind">${r.kind}</span>
        <div class="kv" style="margin-top:8px"><div><span class="k">Sticker price</span><span>${money(r.coa)}</span></div><div><span class="k">Grants & scholarships</span><span>−${money(r.aid)}</span></div>
        <div class="strong net"><span>Net price / yr</span><span>${money(r.net)}</span></div></div>
        <p class="small muted" style="margin:8px 0 0">${r.aidNote}</p></div>`).join('')}</div>
        <p class="small muted" style="margin-top:8px">Example offers for learning — not real colleges. Sticker price = tuition + housing & food + books & other costs.</p>`;
    }
    if (node.id === 'c4_offer') {
      const rows = node.table(m);
      return `<div class="table-wrap compare-table"><table class="data"><thead><tr><th>Offer</th><th class="num">Salary</th><th class="num">Take-home / mo</th><th class="num">Rent w/ roommate</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td><b>${r.city}</b><br><span class="small muted">${r.title}</span></td><td class="num">${money(r.salary)}</td><td class="num">${money(r.net)}</td><td class="num">${money(r.rent)}</td></tr>`).join('')}</tbody></table></div>`;
    }
    return '';
  }

  function decision(node) {
    const m = Sim.derive(S.state.choices);
    const canBack = S.state.order.length > 0;
    let body = '';
    if (node.kind === 'allocate') {
      const r = node.range(m);
      if (node.blocked && node.blocked(m)) {
        body = `<div class="callout callout-coral" style="margin-top:16px">${icon('alert', 20)}<p>Your essentials cost <b>${money(-m.job.flexibility)}</b> more than your take-home pay each month. Change a recent decision to make it fit:</p></div>
          <div class="row" style="margin-top:14px">${node.backTo.filter((id) => id in S.state.choices).map((id) => `<button class="btn btn-navy" data-back="${id}">Change: ${Sim.nodeById(id).title}</button>`).join('')}</div>`;
      } else {
        const total = r.max, start = Math.min(r.default, r.max);
        body = `<div class="allocate">
          <div class="field"><label for="alloc" style="display:flex;justify-content:space-between"><span>${r.label}</span><output id="alloc-o"></output></label>
          <input type="range" id="alloc" min="${r.min}" max="${r.max}" step="${r.step}" value="${start}"></div>
          <div style="margin-top:8px" id="alloc-bar"></div>
          <div class="outputs"><div class="stat"><span class="k">Wants</span><span class="v" id="alloc-w"></span></div><div class="stat"><span class="k">Savings</span><span class="v" id="alloc-s"></span></div></div>
          <p class="small muted" id="alloc-tip" style="margin:10px 0 0"></p>
          <button class="btn btn-primary" id="lock" style="margin-top:16px">Lock in my budget ${icon('check', 18)}</button></div>`;
        setTimeout(() => {
          const inp = $('#alloc');
          const upd = () => {
            const w = +inp.value, s = total - w;
            $('#alloc-o').textContent = money(w);
            $('#alloc-w').textContent = money(w);
            $('#alloc-s').textContent = money(s);
            $('#alloc-bar').innerHTML = `<div class="stack-bar"><i class="c-gold" style="width:${total ? (w / total) * 100 : 0}%"></i><i class="c-mint" style="width:${total ? (s / total) * 100 : 0}%"></i></div>`;
            const net = node.id === 'c4_budget' ? m.job.pay.monthly.net : m.school.income;
            $('#alloc-tip').textContent = s >= net * 0.2 ? 'You’re saving at least 20% of your income — strong.' : s > 0 ? `Saving ${F.pct(s / net)} of income. Every bit builds your cushion.` : 'Nothing goes to savings — a surprise expense would become debt.';
          };
          inp.addEventListener('input', upd); upd();
          $('#lock').onclick = () => commit(node, +inp.value);
        });
      }
    } else {
      const opts = node.options(m);
      body = `${offersTable(node, m)}<div class="options" role="list">${opts.map((o) => `<button type="button" class="option" role="listitem" data-id="${esc(String(o.id))}" ${o.disabled ? 'aria-disabled="true"' : ''}>
        <span class="medal medal-cream">${icon(o.icon || 'arrowR', 22)}</span>
        <span><span class="t">${esc(o.label)}</span><span class="d">${esc(o.detail || '')}</span>${o.disabled && o.why ? `<span class="why">${esc(o.why)}</span>` : ''}</span></button>`).join('')}</div>`;
    }
    const pr = Sim.progress(S.state);
    const left = Math.max(1, Math.round((pr.total - pr.done) * 0.75));
    card(`<div class="decision-progress"><span><b>Decision ${pr.done + 1} of ${pr.total}</b> · Chapter ${node.chapter} of 4</span><span class="small muted">About ${left} min left</span></div>
      <div class="progress" style="margin:6px 0 16px" role="progressbar" aria-valuemin="0" aria-valuemax="${pr.total}" aria-valuenow="${pr.done}" aria-label="Decisions completed"><i style="width:${(pr.done / pr.total) * 100}%"></i></div>
      <p class="eyebrow">${icon(node.icon, 16)} ${Sim.CHAPTERS[node.chapter - 1].title}</p>
      <h2>${esc(node.title)}</h2>
      <p class="scene">${node.scene(m)}</p>
      ${body}
      ${canBack ? `<p style="margin:18px 0 0"><button class="link-btn" id="back">${icon('arrowL', 16)} Change my previous decision</button></p>` : ''}`);
    stage.querySelectorAll('.option').forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      const o = node.options(m).find((x) => String(x.id) === b.dataset.id);
      commit(node, o.id);
    }));
    stage.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => rewindTo(b.dataset.back)));
    const back = $('#back');
    if (back) back.onclick = () => rewindTo(S.state.order[S.state.order.length - 1]);
  }

  function rewindTo(id) {
    S.state = Sim.rewind(S.state, id);
    S.phase = 'play'; S.lastOutcome = null; save(); play();
  }

  function commit(node, value) {
    try {
      const r = Sim.choose(S.state, node.id, value);
      S.state = r.state; S.phase = 'outcome'; S.lastOutcome = node.id;
      r.flags.forEach((f) => store.flag(f));
      save(); outcome();
    } catch (e) {
      U.toast('That choice isn’t available right now.');
    }
  }

  function outcome() {
    const node = Sim.nodeById(S.lastOutcome);
    const m = Sim.derive(S.state.choices);
    const o = node.outcome(m);
    const answered = S.state.checks.some((c) => c.node === node.id);
    const needsCheck = node.check && !answered;
    const pts = Sim.decisionPoints(S.state, node.id);
    card(`<div class="outcome-head"><span class="medal">${icon(o.tone === 'good' ? 'check' : o.tone === 'bad' ? 'alert' : 'bulb', 26)}</span>
        <div><p class="eyebrow" style="margin:0">What happened</p><h2 style="margin:0">${esc(o.headline)}</h2></div>
        ${pts != null ? `<span class="points-pill" title="Challenge points for this decision">+${pts.toLocaleString('en-US')} pts</span>` : ''}</div>
      <p class="scene" style="margin-top:14px">${o.body}</p>
      ${o.facts && o.facts.length ? `<div class="card" style="padding:16px 18px;margin-top:10px"><div class="kv">${o.facts.map((f) => `<div class="${f.strong ? 'strong' : ''}"><span class="k">${f.label}</span><span>${f.value}</span></div>`).join('')}</div></div>` : ''}
      <div class="callout callout-mint" style="margin-top:14px">${icon('bulb', 20)}<div><p class="eyebrow" style="margin:0 0 4px;color:var(--mint-ink)">The concept</p><p>${o.lesson}</p></div></div>
      ${o.calc ? `<details class="mini-calc" open><summary style="cursor:pointer;font-weight:700;display:flex;gap:8px;align-items:center">${icon('calc', 18)} Try the math yourself</summary><div id="calc" style="margin-top:12px"></div></details>` : ''}
      ${node.check ? `<div class="card" style="margin-top:16px;padding:18px" id="check"></div>` : ''}
      <div class="row" style="margin-top:20px"><button class="btn btn-primary" id="next" ${needsCheck ? 'disabled aria-disabled="true"' : ''}>Continue ${icon('arrowR', 18)}</button>
      ${needsCheck ? '<span class="small muted" id="hint">Answer the quick check to continue.</span>' : ''}</div>`, 'tone-' + (o.tone || 'neutral'));
    if (o.calc) C.Widgets.mount($('#calc'), o.calc);
    if (node.check) {
      if (answered) {
        const c = S.state.checks.find((x) => x.node === node.id);
        $('#check').innerHTML = `<p class="small muted" style="margin:0">${icon(c.correct ? 'check' : 'bulb', 16)} Quick check answered ${c.correct ? 'correctly' : '— review the explanation in your report'}.</p>`;
      } else {
        U.question($('#check'), node.check, {
          label: 'Quick check',
          onAnswer: (ok) => {
            S.state = Sim.recordCheck(S.state, node.id, ok);
            U.recordAnswer(node.check.topic, node.check.concept, ok, 'sim');
            save();
            const nb = $('#next'); nb.disabled = false; nb.removeAttribute('aria-disabled');
            const h = $('#hint'); if (h) h.remove();
          },
        });
      }
    }
    $('#next').onclick = () => { S.phase = 'play'; S.lastOutcome = null; save(); play(); };
  }

  function finish() {
    const report = C.ReportBuilder.build(S.state, { pre: S.pre, post: S.post, lessonsState: store.get().lessons, participant: participant() });
    if (!U.demo) {
      store.addReport(report);
      const h = report.money.health, rw = report.challenge;
      C.Analytics.log('sim_complete', participant(), 'simulator', {
        learn: S.learn, health: h.score, flexibility: Math.round(report.money.flexibility), debt: Math.round(report.money.studentDebt),
        checks: S.state.checks.filter((c) => c.correct).length + '/' + S.state.checks.length, choices: S.state.choices,
        challenge: rw ? rw.challenge.total : null, accuracy: rw ? Math.round(rw.accuracy.pct * 1000) / 1000 : null,
      });
      if (rw && rw.claim) {
        const credits = rw.rewards.filter((x) => x.earned).reduce((t, x) => t + (x.credits || 0), 0);
        store.update((d) => {
          d.claims = [...(d.claims || []), { claim: rw.claim, rewards: rw.earned, score: rw.challenge.total, accuracy: rw.accuracy.pct, at: Date.now(), reportId: report.id }];
          if (credits) d.credits = [...(d.credits || []), { id: report.id, amount: credits, reason: 'Simulator accuracy reward', at: Date.now() }];
        });
        C.Analytics.log('reward', participant(), 'simulator', { claim: rw.claim, rewards: rw.earned, score: rw.challenge.total, accuracy: Math.round(rw.accuracy.pct * 1000) / 1000 });
      }
      store.clearSim();
    } else {
      try { sessionStorage.setItem('centsible_demo_report', JSON.stringify(report)); } catch {}
    }
    window.location.href = `report.html?id=${encodeURIComponent(report.id)}&new=1`;
  }

  function render() {
    if (!S) return intro();
    if (S.phase === 'quiz') return quizScreen();
    if (S.phase === 'outcome' && S.lastOutcome) return outcome();
    return play();
  }

  if (U.demo && U.params.get('preset')) startNew(false, U.params.get('preset'));
  else intro();
})();
