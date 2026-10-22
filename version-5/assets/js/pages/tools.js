/* Money Tools: student loan calculator, car cost calculator, monthly budget planner, savings growth calculator. */
(function () {
  const C = window.Centsible, U = C.UI, F = C.Finance, A = C.Assumptions;
  const { $, icon, esc } = U;
  const money = F.money;
  U.mountShell('tools');

  const numField = (id, label, value, { prefix = '', suffix = '', hint = '', min, max } = {}) => `
    <div class="field">
      <label for="${id}">${label}</label>
      <div class="${prefix ? 'input-prefix' : suffix ? 'input-suffix' : ''}">${prefix ? `<span>${prefix}</span>` : ''}
        <input class="input" id="${id}" inputmode="decimal" autocomplete="off" value="${value}" data-min="${min}" data-max="${max}" aria-describedby="${id}-err${hint ? ' ' + id + '-hint' : ''}">${suffix ? `<span>${suffix}</span>` : ''}</div>
      ${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ''}
      <span class="error" id="${id}-err"></span>
    </div>`;

  /** Read and validate a numeric input. Returns a number or null (and shows an error). */
  function read(id, label) {
    const el = $('#' + id), err = $('#' + id + '-err');
    const v = F.parseAmount(el.value);
    const min = +el.dataset.min, max = +el.dataset.max;
    let msg = '';
    if (Number.isNaN(v)) msg = `Enter a number for ${label.toLowerCase()}.`;
    else if (v < min) msg = `${label} must be at least ${min.toLocaleString()}.`;
    else if (v > max) msg = `${label} must be ${max.toLocaleString()} or less.`;
    err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return msg ? null : v;
  }

  $('#tools').innerHTML = `
    <section class="hero on-navy"><div class="container" style="padding-top:56px;padding-bottom:48px">
      <p class="eyebrow" style="color:var(--gold)">Money Tools</p>
      <h1 style="max-width:20ch">Run the numbers before you decide</h1>
      <p class="lead">Each calculator explains its results in plain language and shows the assumptions behind them.</p>
      <nav class="row" aria-label="Calculators" style="margin-top:14px">
        <a class="btn btn-primary btn-sm" href="#loan">${icon('bank', 16)} Student loan payment</a>
        <a class="btn btn-ghost btn-sm" href="#car">${icon('car', 16)} Car cost</a>
        <a class="btn btn-ghost btn-sm" href="#budget">${icon('chart', 16)} Budget planner</a>
        <a class="btn btn-ghost btn-sm" href="#savings">${icon('coins', 16)} Savings growth</a>
      </nav>
    </div></section>

    <div class="container section stack">
      <section id="loan" class="card" aria-labelledby="loan-h">
        <div class="row" style="gap:14px"><span class="medal medal-mint">${icon('bank', 24)}</span><div><h2 id="loan-h" style="margin:0">Student loan payment calculator</h2><p class="muted small" style="margin:0">What will a loan cost each month — and in total?</p></div></div>
        <div class="grid grid-3" style="margin-top:18px">
          ${numField('ln-amt', 'Amount borrowed', '27000', { prefix: '$', min: 100, max: 500000, hint: 'Dependent undergrads can borrow up to $27,000 in federal loans over 4 years.' })}
          ${numField('ln-rate', 'Interest rate (APR)', '6.39', { suffix: '%', min: 0, max: 30, hint: '2025–26 federal undergraduate rate: 6.39%' })}
          ${numField('ln-yrs', 'Years to repay', '10', { suffix: 'yrs', min: 1, max: 30, hint: 'Standard federal plan: 10 years' })}
        </div>
        <div id="ln-out" aria-live="polite" style="margin-top:16px"></div>
        <p class="how small">${icon('calc', 16)} <span><b>How this is calculated:</b> standard loan amortization — the same fixed-payment formula lenders use. Default rate is the 2025–26 federal undergraduate rate from studentaid.gov.</span></p>
        <details class="more" style="margin-top:14px"><summary>Assumptions</summary><ul class="small muted">
          <li>Fixed interest rate and equal monthly payments (standard amortization).</li>
          <li>Does not include loan fees (federal loans charge about 1%), interest that builds while you’re in school, or income-driven repayment plans.</li>
          <li>Paying extra each month always lowers total interest on these loans.</li></ul></details>
      </section>

      <section id="car" class="card" aria-labelledby="car-h">
        <div class="row" style="gap:14px"><span class="medal medal-coral">${icon('car', 24)}</span><div><h2 id="car-h" style="margin:0">Car loan &amp; real cost calculator</h2><p class="muted small" style="margin:0">What will a car really cost each month — not just the payment?</p></div></div>
        <div class="grid grid-4" style="margin-top:18px">
          ${numField('car-price', 'Car price', '12000', { prefix: '$', min: 500, max: 150000 })}
          ${numField('car-down', 'Down payment', '1000', { prefix: '$', min: 0, max: 150000 })}
          ${numField('car-rate', 'Loan APR', '11', { suffix: '%', min: 0, max: 30, hint: 'No credit history often means a higher rate' })}
          ${numField('car-yrs', 'Loan length', '5', { suffix: 'yrs', min: 1, max: 8 })}
          ${numField('car-ins', 'Insurance per month', '190', { prefix: '$', min: 0, max: 2000, hint: 'Get a real quote — young drivers pay more' })}
          ${numField('car-gas', 'Gas per month', '80', { prefix: '$', min: 0, max: 2000 })}
          ${numField('car-maint', 'Maintenance per month', '40', { prefix: '$', min: 0, max: 2000, hint: 'Oil, tires, repairs (set aside monthly)' })}
        </div>
        <div id="car-out" aria-live="polite" style="margin-top:16px"></div>
        <p class="how small">${icon('calc', 16)} <span><b>How this is calculated:</b> loan payment uses standard amortization on the price minus your down payment. Real monthly cost = payment + insurance + gas + maintenance. Taxes, registration, and fees aren’t included.</span></p>
      </section>

      <section id="budget" class="card" aria-labelledby="bud-h">
        <div class="row" style="gap:14px"><span class="medal medal-gold">${icon('chart', 24)}</span><div><h2 id="bud-h" style="margin:0">Monthly budget planner</h2><p class="muted small" style="margin:0">Does your plan add up? Compare it with the 50/30/20 guideline.</p></div></div>
        <div class="grid grid-2" style="margin-top:18px;align-items:start">
          <div>
            ${numField('bd-inc', 'Monthly take-home pay', '3000', { prefix: '$', min: 0, max: 100000, hint: 'Use net pay — what reaches your bank account.' })}
            <fieldset style="border:0;padding:0;margin:14px 0 0"><legend class="label" style="font-weight:700;margin-bottom:8px">Needs</legend><div class="grid" style="gap:12px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" id="bd-needs"></div></fieldset>
            <fieldset style="border:0;padding:0;margin:14px 0 0"><legend class="label" style="font-weight:700;margin-bottom:8px">Wants</legend><div class="grid" style="gap:12px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" id="bd-wants"></div></fieldset>
            <fieldset style="border:0;padding:0;margin:14px 0 0"><legend class="label" style="font-weight:700;margin-bottom:8px">Savings &amp; extra debt payments</legend><div class="grid" style="gap:12px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" id="bd-save"></div></fieldset>
          </div>
          <div id="bd-out" aria-live="polite" class="card card-cream" style="position:sticky;top:84px"></div>
        </div>
        <p class="how small">${icon('calc', 16)} <span><b>How this is calculated:</b> your numbers are added up and compared with the 50/30/20 guideline (50% needs, 30% wants, 20% savings) applied to your take-home pay.</span></p>
      </section>

      <section id="savings" class="card" aria-labelledby="sv-h">
        <div class="row" style="gap:14px"><span class="medal medal-navy">${icon('coins', 24)}</span><div><h2 id="sv-h" style="margin:0">Savings growth calculator</h2><p class="muted small" style="margin:0">How regular saving can grow over time with compound growth.</p></div></div>
        <div class="grid grid-4" style="margin-top:18px">
          ${numField('sv-start', 'Starting amount', '500', { prefix: '$', min: 0, max: 10000000 })}
          ${numField('sv-mo', 'Added each month', '100', { prefix: '$', min: 0, max: 100000 })}
          ${numField('sv-rate', 'Assumed yearly return', '6', { suffix: '%', min: 0, max: 15, hint: 'An assumption, not a promise' })}
          ${numField('sv-yrs', 'Years', '20', { suffix: 'yrs', min: 1, max: 70 })}
        </div>
        <div id="sv-out" aria-live="polite" style="margin-top:16px"></div>
        <p class="how small">${icon('calc', 16)} <span><b>How this is calculated:</b> monthly compounding at the yearly rate you enter, with deposits at the end of each month — the method used by the SEC’s Investor.gov compound interest calculator.</span></p>
        <div class="callout callout-gold" style="margin-top:14px">${icon('alert', 20)}<p><b>Assumed returns are not guaranteed.</b> Savings accounts pay a fairly stable rate. Stock investments have historically grown more over long periods, but their value goes up and down and can fall — sometimes sharply. This calculator compounds monthly at a steady rate, which real investments do not do.</p></div>
      </section>
    </div>`;

  // ---------- loan
  function loan() {
    const p = read('ln-amt', 'Amount borrowed'), r = read('ln-rate', 'Interest rate'), y = read('ln-yrs', 'Years to repay');
    const out = $('#ln-out');
    if (p == null || r == null || y == null) { out.innerHTML = '<p class="muted small">Fix the highlighted field to see results.</p>'; return; }
    const s = F.loanSummary(p, r / 100, y);
    const rows = F.amortizationByYear(p, r / 100, y);
    const alt = y !== 10 ? F.loanSummary(p, r / 100, 10) : F.loanSummary(p, r / 100, 20);
    const extra = F.payoff(p, r / 100, { fixed: s.payment + 50 });
    out.innerHTML = `<div class="grid grid-3">
        <div class="stat"><span class="k">Monthly payment</span><span class="v">${money(s.payment, { cents: true })}</span></div>
        <div class="stat"><span class="k">Total interest</span><span class="v">${money(s.totalInterest)}</span></div>
        <div class="stat"><span class="k">Total repaid</span><span class="v">${money(s.totalPaid)}</span></div></div>
      <p style="margin-top:14px">You’d pay <b>${money(s.payment, { cents: true })}</b> a month for <b>${y} years</b>. Over that time you’d repay <b>${money(s.totalPaid)}</b> — <b>${money(s.totalInterest)}</b> more than you borrowed.
      ${y !== 10 ? `On a 10-year plan the payment would be ${money(alt.payment)} and total interest ${money(alt.totalInterest)}.` : `Stretching it to 20 years would lower the payment to ${money(alt.payment)} but raise total interest to ${money(alt.totalInterest)}.`}
      ${!extra.neverPaysOff && r > 0 ? ` Paying just <b>$50 extra</b> a month would finish in ${F.duration(extra.months)} and save about <b>${money(s.totalInterest - extra.totalInterest)}</b>.` : ''}</p>
      ${r > 0 ? `<div style="margin-top:8px">${C.Widgets.areaChart(['Start', ...rows.map((x) => 'Yr ' + x.year)], [{ values: [p, ...rows.map((x) => x.balance)], cls: 'c-navy3' }])}</div><p class="small muted" style="margin:6px 0 0">Remaining balance over time</p>` : ''}`;
  }

  // ---------- car
  function car() {
    const price = read('car-price', 'Car price'), down = read('car-down', 'Down payment'), r = read('car-rate', 'Loan APR'), y = read('car-yrs', 'Loan length');
    const ins = read('car-ins', 'Insurance per month'), gas = read('car-gas', 'Gas per month'), maint = read('car-maint', 'Maintenance per month');
    const out = $('#car-out');
    if ([price, down, r, y, ins, gas, maint].some((v) => v == null)) { out.innerHTML = '<p class="muted small">Fix the highlighted field to see results.</p>'; return; }
    const amt = Math.max(0, price - down);
    const yrs = Math.round(y);
    const L = F.loanSummary(amt, r / 100, yrs);
    const run = ins + gas + maint, total = L.payment + run;
    const shorter = yrs > 2 ? F.loanSummary(amt, r / 100, yrs - 2) : null;
    out.innerHTML = `<div class="grid grid-4">
        <div class="stat"><span class="k">Loan payment</span><span class="v">${money(L.payment)}</span><span class="s">${money(amt)} financed</span></div>
        <div class="stat"><span class="k">Insurance, gas &amp; upkeep</span><span class="v">${money(run)}</span></div>
        <div class="stat"><span class="k">Real monthly cost</span><span class="v" style="color:var(--coral-ink)">${money(total)}</span></div>
        <div class="stat"><span class="k">Total interest</span><span class="v">${money(L.totalInterest)}</span></div></div>
      <p style="margin-top:14px">The car’s payment is <b>${money(L.payment)}</b>, but it really costs about <b>${money(total)} a month</b> — the payment is only ${F.pct(total ? L.payment / total : 0)} of it. Over ${yrs} years you’d pay <b>${money(L.totalInterest)}</b> in interest and about <b>${money(total * 12 * yrs)}</b> in total to own and run it.
      ${shorter ? ` A ${yrs - 2}-year loan would raise the payment to ${money(shorter.payment)} but save about <b>${money(L.totalInterest - shorter.totalInterest)}</b> in interest.` : ''}</p>
      ${down > price ? '<p class="small muted">Your down payment is more than the price, so there’s nothing to finance.</p>' : ''}`;
  }

  // ---------- budget
  const CATS = {
    needs: [['rent', 'Rent', 1000], ['util', 'Utilities', 120], ['food', 'Groceries', 350], ['trans', 'Transportation', 200], ['phone', 'Phone', 50], ['ins', 'Insurance', 100], ['debt', 'Minimum debt payments', 250]],
    wants: [['eat', 'Eating out', 150], ['subs', 'Subscriptions', 30], ['fun', 'Fun & hobbies', 150], ['shop', 'Shopping', 100]],
    save: [['emerg', 'Emergency fund', 200], ['long', 'Long-term savings', 150], ['extra', 'Extra debt payments', 0]],
  };
  Object.entries(CATS).forEach(([g, items]) => {
    $('#bd-' + g).innerHTML = items.map(([id, l, v]) => numField('bd-' + id, l, String(v), { prefix: '$', min: 0, max: 100000 })).join('');
  });
  function budget() {
    const inc = read('bd-inc', 'Monthly take-home pay');
    const sums = {}; let bad = inc == null;
    Object.entries(CATS).forEach(([g, items]) => {
      sums[g] = items.reduce((t, [id, l]) => { const v = read('bd-' + id, l); if (v == null) { bad = true; return t; } return t + v; }, 0);
    });
    const out = $('#bd-out');
    if (bad) { out.innerHTML = '<p class="muted small">Fix the highlighted field to see your results.</p>'; return; }
    const total = sums.needs + sums.wants + sums.save, left = inc - total;
    const share = (x) => (inc > 0 ? x / inc : 0);
    const rent = F.parseAmount($('#bd-rent').value);
    const tips = [];
    if (left < 0) tips.push(['coral', 'alert', `You’re planning to spend <b>${money(-left)}</b> more than you earn. Trim wants first so needs stay covered.`]);
    else if (left > 0) tips.push(['gold', 'bulb', `<b>${money(left)}</b> doesn’t have a job yet. Assign it — even to savings.`]);
    else tips.push(['mint', 'check', 'Every dollar has a job. That’s a balanced budget.']);
    if (inc > 0 && share(sums.save) < 0.1) tips.push(['gold', 'coins', 'You’re saving under 10%. Even a small automatic transfer builds the habit.']);
    if (inc > 0 && rent / inc > 0.35) tips.push(['gold', 'home', `Rent is ${F.pct(rent / inc)} of take-home pay — above the common 30–35% guideline.`]);
    const g = F.split503020(inc);
    out.innerHTML = `<h3 style="margin-top:0">Your plan</h3>
      <div class="stack-bar">${[['c-navy', sums.needs], ['c-gold', sums.wants], ['c-mint', sums.save]].map(([c, v]) => `<i class="${c}" style="width:${inc > 0 ? Math.min(100, (v / Math.max(inc, total)) * 100) : 0}%"></i>`).join('')}</div>
      <div class="table-wrap" style="margin-top:12px"><table class="data"><thead><tr><th>Category</th><th class="num">You</th><th class="num">50/30/20</th></tr></thead><tbody>
        <tr><td><span class="legend" style="margin:0"><span><i class="c-navy"></i>Needs</span></span></td><td class="num">${money(sums.needs)} (${F.pct(share(sums.needs))})</td><td class="num">${money(g.needs)}</td></tr>
        <tr><td><span class="legend" style="margin:0"><span><i class="c-gold"></i>Wants</span></span></td><td class="num">${money(sums.wants)} (${F.pct(share(sums.wants))})</td><td class="num">${money(g.wants)}</td></tr>
        <tr><td><span class="legend" style="margin:0"><span><i class="c-mint"></i>Savings & debt</span></span></td><td class="num">${money(sums.save)} (${F.pct(share(sums.save))})</td><td class="num">${money(g.savings)}</td></tr>
        <tr class="highlight"><td><b>Left over</b></td><td class="num"><b>${money(left)}</b></td><td></td></tr></tbody></table></div>
      <div class="stack" style="margin-top:12px">${tips.map(([c, ic, t]) => `<div class="callout callout-${c}">${icon(ic, 18)}<p class="small">${t}</p></div>`).join('')}</div>
      <p class="small muted" style="margin:12px 0 0">50/30/20 is a starting guideline, not a rule. With high rent or loan payments, needs often take more than half at first.</p>`;
  }

  // ---------- savings
  function savings() {
    const s = read('sv-start', 'Starting amount'), m = read('sv-mo', 'Added each month'), r = read('sv-rate', 'Assumed yearly return'), y = read('sv-yrs', 'Years');
    const out = $('#sv-out');
    if ([s, m, r, y].some((v) => v == null)) { out.innerHTML = '<p class="muted small">Fix the highlighted field to see results.</p>'; return; }
    const years = Math.round(y);
    const fv = F.futureValue(s, m, r / 100, years);
    const rows = F.growthByYear(s, m, r / 100, years);
    const low = F.futureValue(s, m, Math.max(0, r - 2) / 100, years), high = F.futureValue(s, m, (r + 2) / 100, years);
    out.innerHTML = `<div class="grid grid-3">
        <div class="stat"><span class="k">Estimated balance after ${years} years</span><span class="v">${money(fv.total)}</span></div>
        <div class="stat"><span class="k">You put in</span><span class="v">${money(fv.contributed)}</span></div>
        <div class="stat"><span class="k">Growth (assumed)</span><span class="v" style="color:var(--mint-ink)">${money(fv.growth)}</span></div></div>
      <div style="margin-top:14px">${C.Widgets.areaChart(rows.map((x) => 'Yr ' + x.year), [{ values: rows.map((x) => x.contributed), cls: 'c-navy' }, { values: rows.map((x) => x.total), cls: 'c-mint' }])}</div>
      <div class="legend"><span><i class="c-mint"></i>Growth</span><span><i class="c-navy"></i>Your contributions</span></div>
      <p style="margin-top:12px">If you start with <b>${money(s)}</b> and add <b>${money(m)}</b> a month for <b>${years} years</b> at an assumed <b>${r}%</b> a year, you’d have about <b>${money(fv.total)}</b>.
      ${fv.contributed > 0 ? `${F.pct(fv.growth / Math.max(1, fv.total))} of that would be growth rather than money you put in.` : ''}
      ${r > 0 ? `At this rate, money roughly doubles every ${(72 / r).toFixed(1)} years (Rule of 72).` : 'At 0%, your money only grows by what you add.'}</p>
      <p class="small muted" style="margin:0">Range if returns were 2 points lower or higher: ${money(low.total)} – ${money(high.total)}. Real results can fall outside this range.</p>`;
  }

  const wire = (prefix, fn) => document.querySelectorAll(`[id^="${prefix}"]`).forEach((el) => { if (el.tagName === 'INPUT') el.addEventListener('input', fn); });
  wire('ln-', loan); wire('car-', car); wire('bd-', budget); wire('sv-', savings);
  loan(); car(); budget(); savings();
})();
