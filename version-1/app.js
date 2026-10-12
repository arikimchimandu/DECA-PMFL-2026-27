/* centsible. — make cents of college.
 * Single-page app: pre-quiz → lessons → 3-Minute College Challenge → post-quiz → results.
 * Data is stored in this browser only (localStorage). A shared database is needed to combine data across devices.
 */
(() => {
  'use strict';

  // ---------- Content (edit these after professional review) ----------

  // Annual cost = tuition & fees + room & board. Figures approximate College Board, Trends in College Pricing 2024.
  const SCHOOLS = {
    cc: {
      name: 'Community college → state university',
      desc: '2 years at community college living at home, then transfer for 2 years',
      years: [4050 + 3000, 4050 + 3000, 11610 + 12770, 11610 + 12770],
      instAid: 0,
    },
    instate: {
      name: 'In-state public university',
      desc: '4 years, living on campus',
      years: Array(4).fill(11610 + 12770),
      instAid: 0,
    },
    outstate: {
      name: 'Out-of-state public university',
      desc: '4 years, living on campus',
      years: Array(4).fill(30780 + 12770),
      instAid: 0,
    },
    private: {
      name: 'Private university',
      desc: '4 years, living on campus. Offers $20,000/yr in school grants (requires FAFSA)',
      years: Array(4).fill(43350 + 14650),
      instAid: 20000,
    },
  };

  const AID = {
    fafsaGrant: 4000,      // per year, Pell/state grant estimate
    scholarship: 1500,     // per year, local scholarships
    family: 10000,         // total family savings / 529
    jobs: {
      none: { label: 'No job — focus on classes', perYear: 0, penalty: 0 },
      part: { label: 'Part-time, ~10 hrs/week', perYear: 5000, penalty: 0 },
      heavy: { label: 'Heavy hours, ~25 hrs/week', perYear: 12000, penalty: 75 },
    },
  };

  const LOANS = {
    federalCap: 27000,     // dependent undergrad 4-year federal Direct Loan limit
    federalRate: 0.0639,   // 2025–26 undergrad Direct Loan rate
    privateRate: 0.095,    // typical private student loan rate
    years: 10,
  };

  const TAKE_HOME = 3600;  // monthly take-home pay at a first job (~$52k salary)
  const SURPRISE = { label: 'Your car needs a $1,200 repair', cost: 1200 };
  const SIM_SECONDS = 180;

  const QUIZ = [
    {
      q: 'Which option usually has the lowest yearly tuition?',
      a: ['Private university', 'Out-of-state public university', 'Community college', 'In-state public university'],
      correct: 2,
      why: 'Community college tuition averages about $4,000/yr — roughly a third of in-state public tuition.',
    },
    {
      q: 'What makes a subsidized federal loan special?',
      a: ['It never has to be paid back', 'The government pays the interest while you’re in school', 'It has no borrowing limit', 'Only parents can take it out'],
      correct: 1,
      why: 'With subsidized loans, interest doesn’t pile up while you’re enrolled at least half-time.',
    },
    {
      q: 'You borrow $30,000 at 6% for 10 years. About how much is the monthly payment?',
      a: ['$250', '$333', '$500', '$3,000'],
      correct: 1,
      why: '$30,000 at 6% over 10 years is about $333/month — about $40,000 total, so ~$10,000 is interest.',
    },
    {
      q: 'In the 50/30/20 budgeting rule, what is the 20% for?',
      a: ['Rent', 'Fun and entertainment', 'Savings and paying down debt', 'Food'],
      correct: 2,
      why: '50% needs, 30% wants, 20% savings and extra debt payments.',
    },
    {
      q: 'What should you usually borrow first for college?',
      a: ['Private loans', 'Federal student loans', 'A credit card', 'A car title loan'],
      correct: 1,
      why: 'Federal loans have fixed rates, income-driven repayment, and deferment options private loans usually don’t.',
    },
  ];

  const LESSONS = [
    {
      icon: '🎓',
      title: 'Tuition: sticker price vs. what you pay',
      body: `
        <p>The <b>sticker price</b> is what a college lists. The <b>net price</b> is what you pay after grants and scholarships — and it can be very different.</p>
        <div class="stat-row">
          <div class="stat"><b>$4,050</b><span>Community college tuition / yr</span></div>
          <div class="stat"><b>$11,610</b><span>In-state public tuition / yr</span></div>
          <div class="stat"><b>$30,780</b><span>Out-of-state public tuition / yr</span></div>
          <div class="stat"><b>$43,350</b><span>Private nonprofit tuition / yr</span></div>
        </div>
        <ul>
          <li>Housing and food add roughly <b>$12,000–$15,000/yr</b> on campus.</li>
          <li>File the <b>FAFSA</b> every year — it unlocks federal grants, work-study, and most school aid.</li>
          <li>Use each college’s <b>Net Price Calculator</b> before you decide.</li>
        </ul>`,
    },
    {
      icon: '🏦',
      title: 'Loans: borrow smart',
      body: `
        <p>A loan is money you pay back <b>with interest</b>. The rate and the type matter a lot.</p>
        <ul>
          <li><b>Federal loans first.</b> Fixed rate (6.39% for 2025–26 undergrads), flexible repayment plans.</li>
          <li><b>Subsidized</b> loans don’t grow while you’re in school; <b>unsubsidized</b> loans do.</li>
          <li><b>Private loans</b> often cost more and depend on credit — usually a last resort.</li>
          <li>Dependent undergrads can borrow about <b>$27,000 total</b> in federal loans over 4 years.</li>
        </ul>
        <p class="muted small">Rule of thumb: try to keep total student debt below your expected first-year salary.</p>`,
    },
    {
      icon: '📊',
      title: 'Budgeting: give every dollar a job',
      body: `
        <p>A budget is a plan for your money <i>before</i> you spend it.</p>
        <div class="stat-row">
          <div class="stat"><b>50%</b><span>Needs — rent, food, transportation, loan payments</span></div>
          <div class="stat"><b>30%</b><span>Wants — fun, eating out, subscriptions</span></div>
          <div class="stat"><b>20%</b><span>Savings and extra debt payments</span></div>
          <div class="stat"><b>3–6 mo</b><span>Emergency fund goal</span></div>
        </div>
        <ul>
          <li>Try to keep rent under about <b>35%</b> of take-home pay.</li>
          <li>An <b>emergency fund</b> keeps surprise costs off a 24% credit card.</li>
        </ul>`,
    },
  ];

  // ---------- Storage (this device only) ----------

  const KEY = 'centsible_data_v1';
  const loadData = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { visits: [], runs: [] }; }
    catch { return { visits: [], runs: [] }; }
  };
  const saveData = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } };

  const params = new URLSearchParams(location.search);
  const SOURCE = (params.get('src') || 'direct').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'direct';
  const BEAT = params.has('beat') ? Math.max(0, Math.min(1000, parseInt(params.get('beat'), 10) || 0)) : null;
  const BEAT_BY = (params.get('by') || '').slice(0, 24);

  (function recordVisit() {
    const d = loadData();
    d.visits.push({ t: Date.now(), src: SOURCE, challenged: BEAT !== null });
    saveData(d);
  })();

  // ---------- Helpers ----------

  const $app = document.getElementById('app');
  const $timer = document.getElementById('timer');
  const money = (n) => (n < 0 ? '−' : '') + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const payment = (principal, rate, years) => {
    if (principal <= 0) return 0;
    const r = rate / 12, n = years * 12;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
  };

  function render(html) {
    $app.innerHTML = html;
    window.scrollTo(0, 0);
    $app.focus({ preventScroll: true });
  }
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // ---------- Session state ----------

  let S;
  function resetState(mode, name) {
    S = {
      mode, name: name || 'Anonymous',
      pre: null, post: null,
      c: { school: null, fafsa: false, scholarships: false, job: null, loan: null,
           budget: { housing: 1200, food: 400, transport: 250, fun: 300, savings: 0 } },
      timeLeft: SIM_SECONDS, timerId: null, finished: false,
    };
  }

  // ---------- Home ----------

  function home() {
    stopTimer();
    const beat = BEAT !== null
      ? `<div class="banner">🏆 ${BEAT_BY ? esc(BEAT_BY) : 'A friend'} scored <b>${BEAT}</b>. Can you beat it?</div>` : '';
    render(`
      <section class="hero">
        <h1>Make <span style="color:var(--accent)">cents</span> of college.</h1>
        <p class="tag">Learn how <b>tuition</b>, <b>loans</b>, and <b>budgeting</b> really work — then test yourself in the 3-Minute College Challenge.</p>
      </section>
      ${beat}
      <div class="features" aria-hidden="true">
        <div><span class="ic">🎓</span>Tuition</div>
        <div><span class="ic">🏦</span>Loans</div>
        <div><span class="ic">📊</span>Budgeting</div>
      </div>
      <div class="card">
        <label class="field" for="nick">Pick a nickname</label>
        <input id="nick" type="text" maxlength="24" autocomplete="off" placeholder="e.g. BudgetBoss" aria-describedby="nickHint">
        <p id="nickHint" class="muted small" style="margin-top:-10px">Shown on your score card. Please don’t use your full name.</p>
        <button class="btn" id="full">Start: quiz → lessons → challenge <span aria-hidden="true">(~8 min)</span></button>
        <button class="btn ghost" id="quick">Just the 3-Minute Challenge</button>
      </div>`);
    const nick = () => document.getElementById('nick').value.trim().slice(0, 24);
    document.getElementById('full').onclick = () => { resetState('full', nick()); quiz('pre', 0); };
    document.getElementById('quick').onclick = () => { resetState('quick', nick()); simIntro(); };
  }

  // ---------- Quiz ----------

  function quiz(phase, i, answers = []) {
    const item = QUIZ[i];
    let chosen = null;
    const label = phase === 'pre' ? 'Warm-up quiz' : 'Final quiz';
    render(`
      <span class="pill">${label} · ${i + 1} of ${QUIZ.length}</span>
      <div class="progress"><i style="width:${(i / QUIZ.length) * 100}%"></i></div>
      <h2>${esc(item.q)}</h2>
      ${phase === 'pre' && i === 0 ? '<p class="muted small">No pressure — this just shows what you know before you start.</p>' : ''}
      <div class="opts" role="group" aria-label="Answers">
        ${item.a.map((a, k) => `<button class="opt" aria-pressed="false" data-k="${k}"><span class="t">${esc(a)}</span></button>`).join('')}
      </div>
      <button class="btn" id="next" disabled>${i + 1 < QUIZ.length ? 'Next' : 'Done'}</button>`);
    $app.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        $app.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        chosen = +b.dataset.k;
        document.getElementById('next').disabled = false;
      };
    });
    document.getElementById('next').onclick = () => {
      const next = [...answers, chosen];
      if (i + 1 < QUIZ.length) return quiz(phase, i + 1, next);
      const score = next.filter((a, k) => a === QUIZ[k].correct).length;
      S[phase] = { answers: next, score };
      if (phase === 'pre') lesson(0); else results();
    };
  }

  // ---------- Lessons ----------

  function lesson(i) {
    const L = LESSONS[i];
    render(`
      <span class="pill">Lesson ${i + 1} of ${LESSONS.length}</span>
      <div class="progress"><i style="width:${((i + 1) / LESSONS.length) * 100}%"></i></div>
      <article class="card lesson">
        <h2><span aria-hidden="true">${L.icon}</span> ${L.title}</h2>
        ${L.body}
      </article>
      <button class="btn" id="next">${i + 1 < LESSONS.length ? 'Next lesson' : 'I’m ready for the challenge'}</button>
      ${i > 0 ? '<button class="btn ghost" id="back">Back</button>' : ''}`);
    document.getElementById('next').onclick = () => (i + 1 < LESSONS.length ? lesson(i + 1) : simIntro());
    const back = document.getElementById('back');
    if (back) back.onclick = () => lesson(i - 1);
  }

  // ---------- Simulation ----------

  function simIntro() {
    render(`
      <span class="pill">The 3-Minute College Challenge</span>
      <h2>You just got into college. 🎉</h2>
      <div class="card">
        <p>In <b>3 minutes</b>, make four decisions:</p>
        <ol>
          <li>Pick a school</li>
          <li>Find free money</li>
          <li>Choose your loans</li>
          <li>Build your first post-grad budget</li>
        </ol>
        <p class="muted small">Then life throws you a surprise. Your score (out of 1,000) depends on your debt, your budget, and whether you’re ready for the unexpected. If time runs out, unfinished choices are made for you — and not in a good way.</p>
      </div>
      <button class="btn" id="go">Start the clock ⏱</button>`);
    document.getElementById('go').onclick = () => { startTimer(); stepSchool(); };
  }

  function startTimer() {
    S.timeLeft = SIM_SECONDS;
    $timer.hidden = false;
    paintTimer();
    S.timerId = setInterval(() => {
      S.timeLeft -= 1;
      paintTimer();
      if (S.timeLeft <= 0) { stopTimer(); finishSim(true); }
    }, 1000);
  }
  function stopTimer() {
    if (S && S.timerId) { clearInterval(S.timerId); S.timerId = null; }
    $timer.hidden = true;
  }
  function paintTimer() {
    const t = Math.max(0, S.timeLeft);
    $timer.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    $timer.classList.toggle('low', t <= 30);
  }

  function stepHeader(n, title) {
    return `<span class="pill">Step ${n} of 4</span>
      <div class="progress"><i style="width:${((n - 1) / 4) * 100}%"></i></div>
      <h2>${title}</h2>`;
  }

  function stepSchool() {
    render(`
      ${stepHeader(1, 'Where are you going?')}
      <p class="muted">Total 4-year sticker price (tuition + housing + food).</p>
      <div class="opts" role="radiogroup" aria-label="School">
        ${Object.entries(SCHOOLS).map(([k, s]) => `
          <button class="opt" role="radio" aria-checked="${S.c.school === k}" data-k="${k}">
            <span><span class="t">${s.name}</span><span class="d">${s.desc}</span></span>
            <span class="amt">${money(sum(s.years))}</span>
          </button>`).join('')}
      </div>
      <button class="btn" id="next" ${S.c.school ? '' : 'disabled'}>Next</button>`);
    radios((k) => { S.c.school = k; document.getElementById('next').disabled = false; });
    document.getElementById('next').onclick = stepMoney;
  }

  function stepMoney() {
    const s = SCHOOLS[S.c.school];
    render(`
      ${stepHeader(2, 'Find free money')}
      <p class="muted">Money you don’t have to pay back. Pick everything you’ll do.</p>
      <div class="opts">
        <button class="opt" role="checkbox" aria-checked="${S.c.fafsa}" data-k="fafsa">
          <span class="box" aria-hidden="true">✓</span>
          <span><span class="t">File the FAFSA</span><span class="d">~30 minutes each year. Unlocks federal/state grants${s.instAid ? ' and this school’s $20,000/yr grant' : ''}.</span></span>
        </button>
        <button class="opt" role="checkbox" aria-checked="${S.c.scholarships}" data-k="scholarships">
          <span class="box" aria-hidden="true">✓</span>
          <span><span class="t">Apply to 5 local scholarships</span><span class="d">A few essays. About ${money(AID.scholarship)}/yr if you win.</span></span>
        </button>
      </div>
      <p class="group-label">Will you work during school?</p>
      <div class="opts" role="radiogroup" aria-label="Job">
        ${Object.entries(AID.jobs).map(([k, j]) => `
          <button class="opt" role="radio" aria-checked="${S.c.job === k}" data-k="${k}">
            <span><span class="t">${j.label}</span>${k === 'heavy' ? '<span class="d">More money, but grades and sleep may suffer</span>' : ''}</span>
            <span class="amt">+${money(j.perYear)}/yr</span>
          </button>`).join('')}
      </div>
      <button class="btn" id="next" ${S.c.job ? '' : 'disabled'}>Next</button>`);
    $app.querySelectorAll('[role=checkbox]').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k; S.c[k] = !S.c[k];
        b.setAttribute('aria-checked', S.c[k]);
      };
    });
    radios((k) => { S.c.job = k; document.getElementById('next').disabled = false; });
    document.getElementById('next').onclick = stepLoans;
  }

  function finances(c = S.c) {
    const s = SCHOOLS[c.school || 'instate'];
    const cost = sum(s.years);
    const grants = c.fafsa ? AID.fafsaGrant * 4 : 0;
    const inst = c.fafsa ? s.instAid * 4 : 0;
    const scholar = c.scholarships ? AID.scholarship * 4 : 0;
    const work = AID.jobs[c.job || 'none'].perYear * 4;
    const family = AID.family;
    const gap = Math.max(0, cost - grants - inst - scholar - work - family);
    const loanPlan = (type) => {
      const fed = type === 'federal' ? Math.min(gap, LOANS.federalCap) : 0;
      const priv = gap - fed;
      const pay = payment(fed, LOANS.federalRate, LOANS.years) + payment(priv, LOANS.privateRate, LOANS.years);
      return { fed, priv, pay, total: pay * LOANS.years * 12 };
    };
    return { s, cost, grants, inst, scholar, work, family, gap, loanPlan };
  }

  function stepLoans() {
    const f = finances();
    const ledger = `
      <table class="ledger">
        <tr><td>4-year cost</td><td>${money(f.cost)}</td></tr>
        ${f.grants ? `<tr><td>Federal/state grants</td><td class="neg">${money(-f.grants)}</td></tr>` : ''}
        ${f.inst ? `<tr><td>School grant</td><td class="neg">${money(-f.inst)}</td></tr>` : ''}
        ${f.scholar ? `<tr><td>Scholarships</td><td class="neg">${money(-f.scholar)}</td></tr>` : ''}
        ${f.work ? `<tr><td>Job earnings</td><td class="neg">${money(-f.work)}</td></tr>` : ''}
        <tr><td>Family savings</td><td class="neg">${money(-f.family)}</td></tr>
        <tr class="total"><td>You still need</td><td>${money(f.gap)}</td></tr>
      </table>`;
    if (f.gap === 0) {
      S.c.loan = 'none';
      render(`${stepHeader(3, 'Cover the gap')}${ledger}
        <div class="event good">🎉 No loans needed — your aid and savings cover everything.</div>
        <button class="btn" id="next">Next</button>`);
      document.getElementById('next').onclick = stepBudget;
      return;
    }
    const A = f.loanPlan('federal'), B = f.loanPlan('private');
    render(`
      ${stepHeader(3, 'Cover the gap')}
      ${ledger}
      <p class="muted">How will you borrow the rest? (10-year repayment)</p>
      <div class="opts" role="radiogroup" aria-label="Loan plan">
        <button class="opt" role="radio" aria-checked="${S.c.loan === 'federal'}" data-k="federal">
          <span><span class="t">Federal loans first, private for the rest</span>
          <span class="d">${money(A.fed)} federal at ${(LOANS.federalRate * 100).toFixed(2)}%${A.priv ? ` + ${money(A.priv)} private at ${(LOANS.privateRate * 100).toFixed(1)}%` : ''}</span></span>
          <span class="amt">${money(A.pay)}/mo</span>
        </button>
        <button class="opt" role="radio" aria-checked="${S.c.loan === 'private'}" data-k="private">
          <span><span class="t">One private loan for everything</span>
          <span class="d">Simpler — one application. ${money(B.priv)} at ${(LOANS.privateRate * 100).toFixed(1)}%</span></span>
          <span class="amt">${money(B.pay)}/mo</span>
        </button>
      </div>
      <button class="btn" id="next" ${S.c.loan && S.c.loan !== 'none' ? '' : 'disabled'}>Next</button>`);
    radios((k) => { S.c.loan = k; document.getElementById('next').disabled = false; });
    document.getElementById('next').onclick = stepBudget;
  }

  const BUDGET_FIELDS = [
    { k: 'housing', label: 'Rent & utilities', min: 700, max: 2000, hint: 'Shared apartment ≈ $900–1,300' },
    { k: 'food', label: 'Groceries & food', min: 250, max: 800, hint: 'Cooking at home ≈ $300–450' },
    { k: 'transport', label: 'Transportation', min: 100, max: 600, hint: 'Gas, insurance, or transit pass' },
    { k: 'fun', label: 'Fun & wants', min: 0, max: 1000, hint: 'Eating out, streaming, hobbies' },
    { k: 'savings', label: 'Savings', min: 0, max: 1500, hint: 'Emergency fund, future goals' },
  ];

  function loanPayment() {
    const f = finances();
    return S.c.loan === 'none' || f.gap === 0 ? 0 : f.loanPlan(S.c.loan || 'private').pay;
  }

  function stepBudget() {
    const loan = Math.round(loanPayment());
    const avail = TAKE_HOME - loan;
    render(`
      ${stepHeader(4, 'Your first budget after graduation')}
      <p class="muted">You landed a job! Take-home pay is <b>${money(TAKE_HOME)}/month</b>. Your loan payment of <b>${money(loan)}</b> comes out first.</p>
      <div class="meter" id="meter" aria-live="polite">
        <div class="row"><span>Left to assign</span><span class="left" id="left"></span></div>
      </div>
      ${BUDGET_FIELDS.map((b) => `
        <div class="slider">
          <div class="row"><label for="b_${b.k}">${b.label}</label><output id="o_${b.k}" for="b_${b.k}"></output></div>
          <input type="range" id="b_${b.k}" min="${b.min}" max="${b.max}" step="25" value="${S.c.budget[b.k]}">
          <div class="hint">${b.hint}</div>
        </div>`).join('')}
      <button class="btn" id="next">Lock in my budget</button>`);
    const update = () => {
      BUDGET_FIELDS.forEach((b) => {
        const v = +document.getElementById('b_' + b.k).value;
        S.c.budget[b.k] = v;
        document.getElementById('o_' + b.k).textContent = money(v);
      });
      const left = avail - sum(Object.values(S.c.budget));
      document.getElementById('left').textContent = left < 0 ? `Over by ${money(-left)}` : money(left);
      document.getElementById('meter').classList.toggle('over', left < 0);
      document.getElementById('next').disabled = left < 0;
    };
    BUDGET_FIELDS.forEach((b) => { document.getElementById('b_' + b.k).oninput = update; });
    update();
    document.getElementById('next').onclick = () => { stopTimer(); finishSim(false); };
  }

  function radios(onPick) {
    $app.querySelectorAll('[role=radio]').forEach((b) => {
      b.onclick = () => {
        b.parentElement.querySelectorAll('[role=radio]').forEach((x) => x.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
        onPick(b.dataset.k);
      };
    });
  }

  // ---------- Scoring ----------

  function score() {
    const c = S.c;
    const f = finances();
    const debt = f.gap;
    const loan = loanPayment();
    const B = c.budget;
    const spent = B.housing + B.food + B.transport + B.fun + B.savings;
    const leftover = TAKE_HOME - loan - spent;
    const savingsRate = B.savings / TAKE_HOME;
    const emergencyOk = B.savings * 3 >= SURPRISE.cost;

    const parts = {
      debt: Math.round(400 * Math.max(0, 1 - debt / 80000)),
      savings: Math.round(300 * Math.min(1, savingsRate / 0.2)),
      rent: B.housing <= TAKE_HOME * 0.35 ? 100 : 0,
      balance: B.fun > 0 ? 50 : 0,
      assigned: leftover >= 0 && leftover <= 100 ? 50 : 0,
      emergency: emergencyOk ? 100 : 0,
      job: -AID.jobs[c.job || 'none'].penalty,
    };
    const total = Math.max(0, Math.min(1000, sum(Object.values(parts))));
    return { total, parts, debt, loan, f, savingsRate, emergencyOk, leftover };
  }

  function finishSim(timedOut) {
    if (S.finished) return;
    S.finished = true;
    S.timedOut = timedOut;
    // Fill in anything left undecided with the "didn't plan" default.
    const c = S.c;
    if (!c.school) c.school = 'outstate';
    if (!c.job) c.job = 'none';
    if (!c.loan) c.loan = finances().gap === 0 ? 'none' : 'private';
    if (timedOut && document.getElementById('b_savings') === null) {
      c.budget = { housing: 1400, food: 500, transport: 300, fun: 600, savings: 0 };
    }
    S.result = score();
    S.timeUsed = SIM_SECONDS - Math.max(0, S.timeLeft);
    if (S.mode === 'full') {
      surprise(() => quiz('post', 0));
    } else {
      surprise(results);
    }
  }

  function surprise(next) {
    const r = S.result;
    render(`
      <span class="pill">${S.timedOut ? '⏰ Time’s up!' : 'Plot twist'}</span>
      <h2>Six months later… 🚗💥</h2>
      <p>${SURPRISE.label}.</p>
      ${r.emergencyOk
        ? `<div class="event good">✅ You’d saved ${money(S.c.budget.savings * 3)} by now. You pay it in cash and move on. <b>+100 points</b></div>`
        : `<div class="event bad">❌ Your savings (${money(S.c.budget.savings * 3)}) can’t cover it. It goes on a credit card at 24% interest. <b>+0 points</b></div>`}
      ${S.timedOut ? '<p class="muted small">Time ran out, so any unfinished choices were made for you.</p>' : ''}
      <button class="btn" id="next">${S.mode === 'full' ? 'One last quiz' : 'See my score'}</button>`);
    document.getElementById('next').onclick = next;
  }

  // ---------- Results ----------

  function rank(n) {
    if (n >= 800) return 'Money Master';
    if (n >= 600) return 'Cents-ible';
    if (n >= 400) return 'Getting There';
    return 'Learning Curve';
  }

  function tips(r) {
    const c = S.c, out = [];
    if (!c.fafsa) out.push('You skipped the FAFSA. It’s free, takes ~30 minutes, and unlocks most grants — including school aid at private colleges.');
    if (c.school === 'private' && c.fafsa) out.push('Private schools can cost less than their sticker price once school grants are applied. Always check the net price.');
    if (c.school === 'outstate') out.push('Out-of-state tuition is about 2.5× in-state. Look for in-state options or regional tuition exchange programs.');
    if (c.school === 'cc') out.push('Starting at community college cut your cost dramatically — make sure your credits transfer.');
    if (c.loan === 'private') out.push('Federal loans first: they usually have lower fixed rates and safer repayment options than private loans.');
    if (c.job === 'heavy') out.push('Working 25 hrs/week brought in money but cost points — heavy hours can hurt grades and delay graduation.');
    if (r.savingsRate < 0.1) out.push(`You saved ${Math.round(r.savingsRate * 100)}% of your pay. Aim for 10–20% so surprises don’t become debt.`);
    if (S.c.budget.housing > TAKE_HOME * 0.35) out.push('Rent was over 35% of take-home pay. A roommate can free up hundreds a month.');
    if (r.leftover > 100) out.push(`${money(r.leftover)}/month had no job in your budget. Assign every dollar — even if it’s to savings.`);
    if (!out.length) out.push('Strong plan! Low debt, healthy savings, and a buffer for emergencies.');
    return out;
  }

  function results() {
    const r = S.result;
    const d = loadData();
    const prior = d.runs.filter((x) => x.session === sessionId).length;
    d.runs.push({
      t: Date.now(), session: sessionId, src: SOURCE, name: S.name, mode: S.mode,
      pre: S.pre ? S.pre.score : null, post: S.post ? S.post.score : null,
      score: r.total, debt: Math.round(r.debt), school: S.c.school, loan: S.c.loan,
      timedOut: !!S.timedOut, timeUsed: S.timeUsed, replay: prior > 0, challenged: BEAT !== null,
    });
    saveData(d);

    const beat = BEAT !== null
      ? (r.total > BEAT
        ? `<div class="event good">🏆 You beat ${BEAT_BY ? esc(BEAT_BY) : 'your friend'}’s ${BEAT}!</div>`
        : `<div class="event bad">${BEAT_BY ? esc(BEAT_BY) : 'Your friend'} still leads with ${BEAT}. Try again?</div>`)
      : '';
    const quizBlock = S.pre && S.post ? `
      <div class="card">
        <h2 style="font-size:20px">What you learned</h2>
        <div class="compare">
          <div class="stat"><b>${S.pre.score}/${QUIZ.length}</b><span>Before</span></div>
          <div class="stat"><b>${S.post.score}/${QUIZ.length}</b><span>After</span></div>
        </div>
        <details style="margin-top:12px"><summary>Review answers</summary>
          <ol class="tips">${QUIZ.map((q, i) => `<li><b>${esc(q.q)}</b><br>${S.post.answers[i] === q.correct ? '✅' : '❌'} ${esc(q.a[q.correct])}. <span class="muted">${esc(q.why)}</span></li>`).join('')}</ol>
        </details>
      </div>` : '';

    render(`
      <section class="score-hero">
        <p class="muted">${esc(S.name)}’s score</p>
        <div class="score-num">${r.total}</div>
        <div class="rank">${rank(r.total)}</div>
      </section>
      ${beat}
      <div class="card">
        <table class="ledger">
          <tr><td>School</td><td>${SCHOOLS[S.c.school].name}</td></tr>
          <tr><td>Student debt at graduation</td><td>${money(r.debt)}</td></tr>
          <tr><td>Monthly loan payment</td><td>${money(r.loan)}</td></tr>
          <tr><td>Monthly savings</td><td>${money(S.c.budget.savings)} (${Math.round(r.savingsRate * 100)}%)</td></tr>
          <tr><td>Emergency covered?</td><td>${r.emergencyOk ? 'Yes' : 'No'}</td></tr>
        </table>
        <details><summary>Score breakdown</summary>
          <table class="ledger">
            <tr><td>Low debt (max 400)</td><td>${r.parts.debt}</td></tr>
            <tr><td>Savings rate (max 300)</td><td>${r.parts.savings}</td></tr>
            <tr><td>Rent ≤ 35% of pay (100)</td><td>${r.parts.rent}</td></tr>
            <tr><td>Room for fun (50)</td><td>${r.parts.balance}</td></tr>
            <tr><td>Every dollar assigned (50)</td><td>${r.parts.assigned}</td></tr>
            <tr><td>Emergency covered (100)</td><td>${r.parts.emergency}</td></tr>
            ${r.parts.job ? `<tr><td>Heavy work hours</td><td>${r.parts.job}</td></tr>` : ''}
          </table>
        </details>
      </div>
      <div class="card">
        <h2 style="font-size:20px">Your takeaways</h2>
        <ul class="tips">${tips(r).map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
      ${quizBlock}
      <button class="btn" id="share">Challenge a friend 📲</button>
      <button class="btn ghost" id="again">Play again</button>`);

    document.getElementById('share').onclick = async () => {
      const url = new URL(location.pathname, location.origin);
      url.searchParams.set('beat', r.total);
      if (S.name && S.name !== 'Anonymous') url.searchParams.set('by', S.name);
      url.searchParams.set('src', 'friend');
      const text = `I scored ${r.total} on the Centsible 3-Minute College Challenge. Can you beat me?`;
      try {
        if (navigator.share) { await navigator.share({ title: 'Centsible', text, url: url.toString() }); return; }
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast('Link copied — send it to a friend!');
      } catch { /* user cancelled share */ }
    };
    document.getElementById('again').onclick = () => { resetState('quick', S.name); simIntro(); };
  }

  // ---------- Team dashboard ----------

  function dashboard() {
    stopTimer();
    const d = loadData();
    const runs = d.runs;
    const full = runs.filter((x) => x.pre !== null && x.post !== null);
    const avg = (a) => (a.length ? sum(a) / a.length : 0);
    const preAvg = avg(full.map((x) => x.pre)), postAvg = avg(full.map((x) => x.post));
    const bySrc = {};
    d.visits.forEach((v) => { bySrc[v.src] = bySrc[v.src] || { visits: 0, runs: 0 }; bySrc[v.src].visits++; });
    runs.forEach((r) => { bySrc[r.src] = bySrc[r.src] || { visits: 0, runs: 0 }; bySrc[r.src].runs++; });
    const maxV = Math.max(1, ...Object.values(bySrc).map((x) => x.visits));
    const buckets = [0, 200, 400, 600, 800].map((lo) => ({ lo, n: runs.filter((r) => r.score >= lo && r.score < lo + 200 + (lo === 800 ? 1 : 0)).length }));
    const maxB = Math.max(1, ...buckets.map((b) => b.n));

    render(`
      <span class="pill">Team dashboard</span>
      <h2>Engagement &amp; learning</h2>
      <p class="muted small">Data from <b>this device only</b>. Add <code>?src=qr</code>, <code>?src=social</code>, <code>?src=newsletter</code>, or <code>?src=announce</code> to links to track each marketing channel.</p>
      <div class="kpis">
        <div class="stat"><b>${d.visits.length}</b><span>Site visits</span></div>
        <div class="stat"><b>${runs.length}</b><span>Completed simulations</span></div>
        <div class="stat"><b>${runs.filter((r) => r.replay).length}</b><span>Replays</span></div>
        <div class="stat"><b>${runs.length ? Math.round(avg(runs.map((r) => r.score))) : '—'}</b><span>Average score</span></div>
        <div class="stat"><b>${full.length ? (preAvg / QUIZ.length * 100).toFixed(0) + '%' : '—'}</b><span>Avg pre-quiz</span></div>
        <div class="stat"><b>${full.length ? (postAvg / QUIZ.length * 100).toFixed(0) + '%' : '—'}</b><span>Avg post-quiz</span></div>
      </div>
      <div class="card">
        <h2 style="font-size:20px">Visits by channel</h2>
        <div class="bars">${Object.entries(bySrc).sort((a, b) => b[1].visits - a[1].visits).map(([k, v]) => `
          <div class="bar"><span>${esc(k)}</span><span class="track"><i style="width:${(v.visits / maxV) * 100}%"></i></span><span class="n">${v.visits}</span></div>`).join('') || '<p class="muted">No visits yet.</p>'}
        </div>
      </div>
      <div class="card">
        <h2 style="font-size:20px">Score distribution</h2>
        <div class="bars">${buckets.map((b) => `
          <div class="bar"><span>${b.lo}–${b.lo === 800 ? 1000 : b.lo + 199}</span><span class="track"><i style="width:${(b.n / maxB) * 100}%"></i></span><span class="n">${b.n}</span></div>`).join('')}
        </div>
      </div>
      <button class="btn" id="csv">Export results (CSV)</button>
      <button class="btn ghost" id="reset">Clear data on this device</button>
      <button class="btn ghost" id="back">Back to app</button>`);

    document.getElementById('csv').onclick = () => {
      const cols = ['t', 'src', 'name', 'mode', 'pre', 'post', 'score', 'debt', 'school', 'loan', 'timedOut', 'timeUsed', 'replay', 'challenged'];
      const rows = [cols.join(',')].concat(runs.map((r) => cols.map((c) => {
        const v = c === 't' ? new Date(r.t).toISOString() : r[c];
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      }).join(',')));
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'centsible-results.csv'; a.click();
      URL.revokeObjectURL(a.href);
    };
    document.getElementById('reset').onclick = () => {
      if (confirm('Delete all Centsible data stored on this device?')) { saveData({ visits: [], runs: [] }); dashboard(); }
    };
    document.getElementById('back').onclick = home;
  }

  // ---------- Boot ----------

  const sessionId = Math.random().toString(36).slice(2, 10);
  document.getElementById('homeBtn').onclick = () => {
    if (S && S.timerId && !confirm('Leave the challenge? Your progress will be lost.')) return;
    home();
  };
  document.getElementById('dashBtn').onclick = () => {
    if (S && S.timerId && !confirm('Leave the challenge? Your progress will be lost.')) return;
    dashboard();
  };
  resetState('quick');
  home();
})();
