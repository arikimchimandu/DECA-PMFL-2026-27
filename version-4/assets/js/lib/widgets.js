/* Centsible V4 — interactive mini-calculators used in lessons, the simulator, and Money Tools.
 * Widgets.mount(element, spec) renders one; spec.type picks which. All math comes from finance.js.
 */
(function (root) {
  const C = root.Centsible, F = C.Finance, A = C.Assumptions;
  const icon = (n, s = 18) => C.Icons.svg(n, { size: s });
  const $ = (s, el) => el.querySelector(s);
  const uid = () => 'w' + Math.random().toString(36).slice(2, 8);
  const money = (n) => F.money(n);
  const pct = (x, d = 0) => F.pct(x, d);

  function slider(id, label, min, max, step, value, unit = '') {
    return `<div class="field">
      <label for="${id}" style="display:flex;justify-content:space-between;gap:8px"><span>${label}</span><output for="${id}" id="${id}-o" style="font-variant-numeric:tabular-nums"></output></label>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}">
    </div>`;
  }
  const fmtVal = (v, unit) => (unit === '$' ? money(v) : unit === '%' ? `${(+v).toFixed(v % 1 ? 2 : 0).replace(/\.?0+$/, '')}%` : unit === 'yr' ? `${v} yr` : `${v}${unit}`);
  function bindSliders(el, onChange) {
    const inputs = [...el.querySelectorAll('input[type=range]')];
    const update = () => {
      inputs.forEach((i) => { const o = el.querySelector('#' + i.id + '-o'); if (o) o.textContent = fmtVal(+i.value, i.dataset.unit); });
      onChange(Object.fromEntries(inputs.map((i) => [i.id.split('-').pop(), +i.value])));
    };
    inputs.forEach((i) => i.addEventListener('input', update));
    update();
  }
  const stack = (parts) => `<div class="stack-bar" aria-hidden="true">${parts.map(([w, c]) => `<i class="${c}" style="width:${Math.max(0, w) * 100}%"></i>`).join('')}</div>`;
  const legend = (items) => `<div class="legend">${items.map(([c, t]) => `<span><i class="${c}"></i>${t}</span>`).join('')}</div>`;

  /** Simple SVG area chart: series = [{ values, cls }], drawn stacked from the bottom. */
  function areaChart(labels, series, { height = 180, fmt = money } = {}) {
    const W = 600, H = height, pad = { l: 8, r: 8, t: 12, b: 22 };
    const n = labels.length;
    const max = Math.max(1, ...series[series.length - 1].values);
    const x = (i) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
    const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
    const colors = { 'c-mint': '#6ED9B3', 'c-navy': '#162B49', 'c-gold': '#EFCB75', 'c-navy3': '#3A5D8C' };
    const paths = series.slice().reverse().map((s) => {
      const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' L');
      return `<path d="M${x(0)},${y(0)} L${pts} L${x(n - 1)},${y(0)} Z" fill="${colors[s.cls]}" />`;
    }).join('');
    const ticks = [0, Math.floor((n - 1) / 2), n - 1].map((i) => `<text x="${x(i)}" y="${H - 4}" font-size="12" fill="#5A6B82" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${labels[i]}</text>`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Chart: ending value ${fmt(series[series.length - 1].values[n - 1])}" preserveAspectRatio="none" style="display:block">${paths}<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(0)}" y2="${y(0)}" stroke="#C9C2AA"/>${ticks}</svg>`;
  }

  const W = {};

  W.netprice = (el, s) => {
    const id = uid();
    el.innerHTML = `
      <div class="split"><div><div class="lbl">Sticker price</div><div class="big">${money(s.sticker)}</div></div>
      <div style="text-align:right"><div class="lbl">Your net price</div><div class="big" style="color:var(--mint-ink)" id="${id}-net">${money(s.sticker)}</div></div></div>
      <div id="${id}-bar" style="margin:14px 0 4px"></div>
      ${legend([['c-mint', 'You pay'], ['c-gold', 'Grants & scholarships']])}
      <p class="small muted" style="margin:14px 0 8px">Tap each award to apply it:</p>
      <div class="chips">${s.aid.map(([l, a], i) => `<button type="button" class="chip" aria-pressed="false" data-a="${a}">${icon('award', 16)} ${l} −${money(a)}</button>`).join('')}</div>`;
    const update = () => {
      const aid = [...el.querySelectorAll('.chip[aria-pressed=true]')].reduce((t, b) => t + +b.dataset.a, 0);
      $('#' + id + '-net', el).textContent = money(s.sticker - aid);
      $('#' + id + '-bar', el).innerHTML = stack([[(s.sticker - aid) / s.sticker, 'c-mint'], [aid / s.sticker, 'c-gold']]);
    };
    el.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); update(); }));
    update();
  };

  W.aidOffer = (el, s) => {
    const id = uid();
    const sum = (k) => s.lines.filter((l) => l[2] === k).reduce((t, l) => t + l[1], 0);
    const gift = sum('gift'), work = sum('work'), loan = sum('loan');
    el.innerHTML = `
      <p class="small muted" style="margin-top:0">Example offer — cost of attendance <b>${money(s.coa)}</b></p>
      <div class="kv">${s.lines.map(([l, a, k]) => `<div><span>${l}</span><span><span class="tag ${k === 'gift' ? 'tag-mint' : k === 'loan' ? 'tag-coral' : 'tag-gold'}" style="margin-right:8px">${k === 'gift' ? 'Free' : k === 'loan' ? 'Loan' : 'Earned'}</span>${money(a)}</span></div>`).join('')}</div>
      <div class="field" style="margin-top:14px"><label style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" id="${id}-loans" checked> Count loans as “aid” (how many letters show it)</label></div>
      <div class="widget-grid" style="margin-top:12px">
        <div class="stat"><span class="k">“Total aid”</span><span class="v" id="${id}-aid"></span></div>
        <div class="stat"><span class="k">“Amount due”</span><span class="v" id="${id}-due"></span></div>
      </div>
      <div class="callout callout-gold" style="margin-top:12px">${icon('bulb')}<p id="${id}-msg"></p></div>`;
    const update = () => {
      const withLoans = $('#' + id + '-loans', el).checked;
      const aid = gift + work + (withLoans ? loan : 0);
      $('#' + id + '-aid', el).textContent = money(aid);
      $('#' + id + '-due', el).textContent = money(Math.max(0, s.coa - aid));
      $('#' + id + '-msg', el).innerHTML = withLoans
        ? `Looks affordable — but <b>${money(loan)}</b> of that “aid” is borrowed and must be repaid with interest.`
        : `Honest view: only <b>${money(gift)}</b> is free money. You’d need to cover <b>${money(s.coa - gift)}</b> through work, savings, or loans.`;
    };
    $('#' + id + '-loans', el).addEventListener('change', update);
    update();
  };

  W.loanCompare = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-p', 'Amount borrowed', 1000, 40000, 500, s.principal, '$')}
      ${slider(id + '-y', 'Years to repay', 5, 20, 1, s.years, 'yr')}
      <div class="widget-grid" id="${id}-out" style="margin-top:10px"></div><p class="small" id="${id}-diff" style="margin:12px 0 0"></p>`;
    bindSliders(el, (v) => {
      const res = s.rates.map(([n, r]) => [n, r, F.loanSummary(v.p, r, v.y)]);
      $('#' + id + '-out', el).innerHTML = res.map(([n, r, x]) => `<div class="stat"><span class="k">${n} · ${pct(r, 2)}</span><span class="v">${money(x.payment)}/mo</span><span class="s">Total interest ${money(x.totalInterest)}</span></div>`).join('');
      const d = res[res.length - 1][2].totalInterest - res[0][2].totalInterest;
      $('#' + id + '-diff', el).innerHTML = `The higher rate costs <b>${money(d)}</b> more over ${v.y} years.`;
    });
  };

  W.loan = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-p', 'Loan amount', 1000, Math.max(60000, Math.ceil((s.principal || 0) / 5000) * 5000), 500, s.principal || 20000, '$')}
      ${slider(id + '-r', 'Interest rate', 0, 15, 0.05, +((s.apr || 0.0639) * 100).toFixed(2), '%')}
      ${slider(id + '-y', 'Years', 5, 25, 1, s.years || 10, 'yr')}
      <div class="widget-grid" id="${id}-out" style="margin-top:10px"></div>`;
    bindSliders(el, (v) => {
      const x = F.loanSummary(v.p, v.r / 100, v.y);
      $('#' + id + '-out', el).innerHTML = `<div class="stat"><span class="k">Monthly payment</span><span class="v">${money(x.payment)}</span></div>
        <div class="stat"><span class="k">Total interest</span><span class="v">${money(x.totalInterest)}</span></div>`;
    });
  };

  W.needsWants = (el, s) => {
    el.innerHTML = `<p class="small muted" style="margin-top:0">Sort each item. You’ll see right away if you agree with most budgeters.</p>
      <div class="sort-items">${s.items.map(([n, k], i) => `<span class="sort-item" data-k="${k}"><span>${n}</span><span class="btns"><button type="button" data-v="need" aria-label="${n}: need">Need</button><button type="button" data-v="want" aria-label="${n}: want">Want</button></span></span>`).join('')}</div>
      <p class="small" aria-live="polite" style="margin:12px 0 0" data-score></p>`;
    let done = 0, right = 0;
    el.querySelectorAll('.sort-item').forEach((it) => it.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      if (it.classList.contains('ok') || it.classList.contains('no')) return;
      const ok = b.dataset.v === it.dataset.k;
      it.classList.add(ok ? 'ok' : 'no');
      it.querySelector('.btns').innerHTML = `<b style="font-size:.8rem">${it.dataset.k === 'need' ? 'Need' : 'Want'}</b>`;
      done++; if (ok) right++;
      el.querySelector('[data-score]').textContent = `${right} of ${done} matched.` + (done === s.items.length ? ' Remember: context matters — a phone is a need for most jobs, but the newest phone is a want.' : '');
    })));
  };

  W.split = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-n', 'Monthly take-home pay', 1000, 8000, 50, s.net || 3000, '$')}
      <div style="margin:12px 0 4px">${stack([[0.5, 'c-navy'], [0.3, 'c-gold'], [0.2, 'c-mint']])}</div>
      <div class="widget-grid" id="${id}-out" style="margin-top:12px"></div>`;
    bindSliders(el, (v) => {
      const x = F.split503020(v.n);
      $('#' + id + '-out', el).innerHTML = [['Needs · 50%', x.needs, 'c-navy'], ['Wants · 30%', x.wants, 'c-gold'], ['Savings & debt · 20%', x.savings, 'c-mint']]
        .map(([k, val, c]) => `<div class="stat"><span class="k"><i class="${c}" style="display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px"></i>${k}</span><span class="v">${money(val)}</span></div>`).join('');
    });
  };

  W.emergency = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-e', 'Essential expenses per month', 500, 4000, 50, s.essentials, '$')}
      ${slider(id + '-s', 'You save per month', 25, 1000, 25, s.monthlySave, '$')}
      <div class="widget-grid" id="${id}-out" style="margin-top:10px"></div>`;
    bindSliders(el, (v) => {
      const goal = v.e * 3, starter = 1000;
      const m1 = Math.ceil(starter / v.s), m3 = Math.ceil(goal / v.s);
      $('#' + id + '-out', el).innerHTML = `<div class="stat"><span class="k">3-month goal</span><span class="v">${money(goal)}</span></div>
        <div class="stat"><span class="k">Time to a $1,000 starter fund</span><span class="v">${F.duration(m1)}</span></div>
        <div class="stat"><span class="k">Time to 3 months</span><span class="v">${F.duration(m3)}</span></div>`;
    });
  };

  W.utilization = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-l', 'Credit limit', 300, 10000, 100, s.limit, '$')}
      ${slider(id + '-b', 'Balance when reported', 0, 10000, 25, s.balance, '$')}
      <div style="margin-top:12px"><div class="split"><span class="lbl">Utilization</span><span class="big" id="${id}-u"></span></div>
      <div class="progress" style="height:14px;margin-top:8px"><i id="${id}-bar"></i></div>
      <p class="small" id="${id}-msg" style="margin:10px 0 0"></p></div>`;
    bindSliders(el, (v) => {
      const u = F.utilization(Math.min(v.b, v.l), v.l);
      $('#' + id + '-u', el).textContent = pct(u);
      const bar = $('#' + id + '-bar', el);
      bar.style.width = Math.min(100, u * 100) + '%';
      bar.style.background = u <= 0.1 ? 'var(--mint)' : u <= 0.3 ? 'var(--gold)' : 'var(--coral)';
      $('#' + id + '-msg', el).textContent = u <= 0.1 ? 'Very low — a strong sign to lenders.' : u <= 0.3 ? 'Under the common 30% guideline.' : 'Above 30% — paying it down before the statement date usually helps.';
    });
  };

  W.cardPayoff = (el, s) => {
    const id = uid();
    const maxB = Math.max(5000, Math.ceil(s.balance / 1000) * 1000);
    el.innerHTML = `${slider(id + '-b', 'Balance', 100, maxB, 50, s.balance, '$')}
      ${slider(id + '-r', 'APR', 5, 35, 0.5, Math.round(s.apr * 1000) / 10, '%')}
      ${slider(id + '-p', 'Monthly payment', 10, 600, 5, s.payment, '$')}
      <div class="widget-grid" id="${id}-out" style="margin-top:10px"></div>
      <p class="small" id="${id}-cmp" style="margin:12px 0 0"></p>`;
    bindSliders(el, (v) => {
      const r = F.payoff(v.b, v.r / 100, { fixed: v.p });
      const monthlyInterest = v.b * v.r / 100 / 12;
      $('#' + id + '-out', el).innerHTML = r.neverPaysOff
        ? `<div class="callout callout-coral" style="grid-column:1/-1">${icon('alert')}<p>This payment is less than the ${money(monthlyInterest)} of interest added each month. <b>The balance would never be paid off.</b></p></div>`
        : `<div class="stat"><span class="k">Time to pay off</span><span class="v">${F.duration(r.months)}</span></div>
           <div class="stat"><span class="k">Interest paid</span><span class="v">${money(r.totalInterest)}</span></div>
           <div class="stat"><span class="k">Total paid</span><span class="v">${money(r.totalPaid)}</span></div>`;
      const dbl = F.payoff(v.b, v.r / 100, { fixed: v.p * 2 });
      $('#' + id + '-cmp', el).innerHTML = !r.neverPaysOff && !dbl.neverPaysOff ? `Paying <b>${money(v.p * 2)}</b> instead would take ${F.duration(dbl.months)} and save <b>${money(r.totalInterest - dbl.totalInterest)}</b> in interest.` : '';
    });
  };

  W.card = (el, s) => W.cardPayoff(el, { balance: s.balance, apr: s.apr, payment: s.payment });

  W.scoreFactors = (el) => {
    const f = [['Payment history', 35], ['Amounts owed (incl. utilization)', 30], ['Length of credit history', 15], ['New credit', 10], ['Credit mix', 10]];
    el.innerHTML = `<p class="small muted" style="margin-top:0">General weights published by FICO for its widely used scores. Every person’s exact impact differs.</p>
      <div class="bars">${f.map(([n, w]) => `<div class="hbar" style="grid-template-columns:minmax(120px,42%) 1fr 44px"><span>${n}</span><span class="track"><i class="c-mint" style="width:${w / 35 * 100}%"></i></span><span class="n">${w}%</span></div>`).join('')}</div>`;
  };

  W.paycheck = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-s', 'Yearly salary', 20000, 120000, 1000, s.salary, '$')}
      ${slider(id + '-k', 'Pre-tax 401(k) contribution', 0, 10, 1, s.pretax || 0, '%')}
      <div style="margin:12px 0 4px" id="${id}-bar"></div>
      ${legend([['c-mint', 'Take-home'], ['c-navy', 'Federal tax'], ['c-gold', 'Social Security + Medicare'], ['c-navy3', 'State tax (4% example)'], ['c-cream', '401(k)']])}
      <div class="kv" id="${id}-kv" style="margin-top:12px"></div>
      <p class="small muted" style="margin:10px 0 0">Simplified estimate for a single filer using 2026 federal brackets and the standard deduction. Real paychecks also depend on your W-4, state, and benefits.</p>`;
    bindSliders(el, (v) => {
      const p = F.paycheck(v.s, { pretaxPct: v.k / 100 }), g = p.gross || 1;
      $('#' + id + '-bar', el).innerHTML = stack([[p.net / g, 'c-mint'], [p.federal / g, 'c-navy'], [p.fica / g, 'c-gold'], [p.state / g, 'c-navy3'], [p.pretax / g, 'c-cream']]);
      $('#' + id + '-kv', el).innerHTML = `<div><span>Gross pay per month</span><span>${money(p.monthly.gross)}</span></div>
        <div><span>Federal income tax</span><span>−${money(p.monthly.federal)}</span></div>
        <div><span>Social Security + Medicare (7.65%)</span><span>−${money(p.monthly.fica)}</span></div>
        <div><span>State income tax</span><span>−${money(p.monthly.state)}</span></div>
        ${p.pretax ? `<div><span>401(k) (pre-tax)</span><span>−${money(p.monthly.pretax)}</span></div>` : ''}
        <div class="strong"><span>Take-home pay per month</span><span>${money(p.monthly.net)}</span></div>`;
    });
  };

  W.payStub = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-g', 'Gross pay this period (every two weeks)', 400, 4000, 50, s.gross, '$')}
      ${slider(id + '-n', 'Pay period number this year', 1, 26, 1, 6, '')}
      <div class="table-wrap" style="margin-top:10px"><table class="data" id="${id}-t"></table></div>`;
    bindSliders(el, (v) => {
      const annual = v.g * 26, p = F.paycheck(annual);
      const row = (k, cur) => `<tr><td>${k}</td><td class="num">${money(cur)}</td><td class="num">${money(cur * v.n)}</td></tr>`;
      const per = (x) => x / 26;
      $('#' + id + '-t', el).innerHTML = `<thead><tr><th>Line</th><th class="num">This period</th><th class="num">Year to date</th></tr></thead><tbody>
        ${row('Gross pay', v.g)}${row('Federal income tax (est.)', -per(p.federal))}${row('Social Security (6.2%)', -v.g * 0.062)}${row('Medicare (1.45%)', -v.g * 0.0145)}${row('State tax (4% example)', -per(p.state))}
        <tr class="highlight"><td><b>Net pay</b></td><td class="num"><b>${money(per(p.net))}</b></td><td class="num"><b>${money(per(p.net) * v.n)}</b></td></tr></tbody>`;
    });
  };

  W.brackets = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-s', 'Yearly income', 15000, 150000, 1000, s.salary, '$')}
      <div class="kv" id="${id}-kv" style="margin-top:12px"></div>
      <div class="widget-grid" id="${id}-out" style="margin-top:12px"></div>`;
    bindSliders(el, (v) => {
      const taxable = Math.max(0, v.s - A.income.standardDeduction);
      let lower = 0; const rows = [];
      for (const b of A.income.brackets) {
        if (taxable <= lower) break;
        const top = Math.min(taxable, b.upTo), slice = top - lower;
        rows.push(`<div><span>${pct(b.rate)} on ${money(lower)}–${money(top)}</span><span>${money(slice * b.rate)}</span></div>`);
        lower = b.upTo;
      }
      const tax = F.bracketTax(taxable, A.income.brackets);
      $('#' + id + '-kv', el).innerHTML = `<div><span>Standard deduction (2026, single)</span><span>−${money(A.income.standardDeduction)}</span></div><div><span>Taxable income</span><span>${money(taxable)}</span></div>${rows.join('')}<div class="strong"><span>Federal income tax</span><span>${money(tax)}</span></div>`;
      $('#' + id + '-out', el).innerHTML = `<div class="stat"><span class="k">Marginal rate</span><span class="v">${pct(F.marginalRate(taxable, A.income.brackets))}</span><span class="s">Rate on your last dollar</span></div>
        <div class="stat"><span class="k">Effective rate</span><span class="v">${pct(v.s ? tax / v.s : 0, 1)}</span><span class="s">Tax ÷ total income</span></div>`;
    });
  };

  W.compound = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-m', 'Monthly contribution', 0, 1500, 10, s.monthly, '$')}
      ${slider(id + '-r', 'Assumed yearly return (illustration)', 0, 10, 0.5, (s.rate ?? A.saving.illustrativeReturn) * 100, '%')}
      ${slider(id + '-y', 'Years', 1, 50, 1, s.years, 'yr')}
      <div class="widget-grid" id="${id}-out" style="margin-top:10px"></div>
      <div id="${id}-chart" style="margin-top:12px"></div>
      ${legend([['c-mint', 'Growth'], ['c-navy', 'Your contributions']])}
      <p class="small muted" style="margin:10px 0 0">Illustration only — not a prediction or guarantee. Real investments go up and down, and can lose money.</p>`;
    bindSliders(el, (v) => {
      const fv = F.futureValue(s.start || 0, v.m, v.r / 100, v.y);
      $('#' + id + '-out', el).innerHTML = `<div class="stat"><span class="k">Ending balance</span><span class="v">${money(fv.total)}</span></div>
        <div class="stat"><span class="k">You put in</span><span class="v">${money(fv.contributed)}</span></div>
        <div class="stat"><span class="k">Growth</span><span class="v">${money(fv.growth)}</span></div>`;
      const rows = F.growthByYear(s.start || 0, v.m, v.r / 100, v.y);
      $('#' + id + '-chart', el).innerHTML = areaChart(rows.map((r) => 'Yr ' + r.year), [{ values: rows.map((r) => r.contributed), cls: 'c-navy' }, { values: rows.map((r) => r.total), cls: 'c-mint' }]);
    });
  };
  W.growth = (el, s) => W.compound(el, { monthly: s.monthly, years: s.years, rate: A.saving.illustrativeReturn });

  W.diversify = (el) => {
    const id = uid();
    el.innerHTML = `<p class="small muted" style="margin-top:0">You invest $1,000 split evenly across several companies. Then one company’s stock falls 60%.</p>
      <div class="chips" role="group" aria-label="Number of companies">${[1, 5, 20, 100, 500].map((n) => `<button type="button" class="chip" aria-pressed="${n === 1}" data-n="${n}">${n} ${n === 1 ? 'company' : 'companies'}</button>`).join('')}</div>
      <div class="widget-grid" id="${id}-out" style="margin-top:14px"></div>`;
    const update = (n) => {
      const loss = 1000 * 0.6 / n;
      $('#' + id + '-out', el).innerHTML = `<div class="stat"><span class="k">Money in that company</span><span class="v">${money(1000 / n)}</span></div>
        <div class="stat"><span class="k">Your loss from its drop</span><span class="v">${money(loss)}</span><span class="s">${pct(loss / 1000, 1)} of your total</span></div>`;
    };
    el.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
      el.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x === b));
      update(+b.dataset.n);
    }));
    update(1);
  };

  W.fees = (el, s) => {
    const id = uid();
    el.innerHTML = `${slider(id + '-a', 'Amount invested once', 1000, 50000, 500, s.amount, '$')}
      ${slider(id + '-y', 'Years', 5, 45, 1, s.years, 'yr')}
      ${slider(id + '-f', 'Higher-cost fund’s fee', 0.25, 2, 0.05, 1, '%')}
      <div class="widget-grid" id="${id}-out" style="margin-top:10px"></div>
      <p class="small muted" style="margin:10px 0 0">Assumes an illustrative ${pct(s.rate)} yearly return before fees, compared with a 0.05% index fund. Not a prediction.</p>`;
    bindSliders(el, (v) => {
      const low = F.compoundAnnual(v.a, s.rate - 0.0005, v.y), high = F.compoundAnnual(v.a, s.rate - v.f / 100, v.y);
      $('#' + id + '-out', el).innerHTML = `<div class="stat"><span class="k">0.05% fee</span><span class="v">${money(low)}</span></div>
        <div class="stat"><span class="k">${v.f}% fee</span><span class="v">${money(high)}</span></div>
        <div class="stat"><span class="k">Lost to fees</span><span class="v" style="color:var(--coral-ink)">${money(low - high)}</span></div>`;
    });
  };

  function mount(el, spec) {
    const fn = W[spec.type];
    if (!fn) { el.innerHTML = '<p class="muted">This activity is unavailable.</p>'; return; }
    try { fn(el, spec); } catch (e) { el.innerHTML = '<p class="muted">Something went wrong loading this activity. Try refreshing the page.</p>'; if (root.console) console.error(e); }
  }

  root.Centsible.Widgets = { mount, areaChart, types: Object.keys(W) };
})(window);
