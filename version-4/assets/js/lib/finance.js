/* Centspire V4 — financial math. Pure functions only (no DOM), so they can be tested.
 * All rates are annual decimals (0.064 = 6.4%). Money is in dollars (not rounded unless noted).
 */
(function (root, factory) {
  const mod = factory(root.Centsible || {});
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Finance = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

  /** Fixed monthly payment that pays off `principal` over `years` (standard amortization). */
  function monthlyPayment(principal, apr, years) {
    if (!isNum(principal) || !isNum(apr) || !isNum(years) || principal <= 0 || years <= 0 || apr < 0) return 0;
    const n = Math.round(years * 12);
    const r = apr / 12;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
  }

  /** Summary of a fixed-payment loan. */
  function loanSummary(principal, apr, years) {
    const payment = monthlyPayment(principal, apr, years);
    const months = Math.round(years * 12);
    const totalPaid = payment * months;
    return { payment, months, totalPaid, totalInterest: Math.max(0, totalPaid - principal) };
  }

  /** Year-by-year remaining balance for a fixed-payment loan (for charts). */
  function amortizationByYear(principal, apr, years) {
    const payment = monthlyPayment(principal, apr, years);
    const r = apr / 12;
    let bal = principal, interestSoFar = 0;
    const rows = [];
    for (let m = 1; m <= Math.round(years * 12); m++) {
      const interest = bal * r;
      interestSoFar += interest;
      bal = Math.max(0, bal + interest - payment);
      if (m % 12 === 0) rows.push({ year: m / 12, balance: bal, interestPaid: interestSoFar });
    }
    return rows;
  }

  /**
   * Pay down a revolving balance month by month (credit cards).
   * opts.fixed: pay a fixed amount each month; or opts.minPct + opts.minFloor: minimum-payment rule
   * (pct of balance plus that month's interest, but at least the floor). Returns months, totals,
   * and `neverPaysOff` if the payment can't cover interest.
   */
  function payoff(balance, apr, opts = {}) {
    if (!isNum(balance) || balance <= 0) return { months: 0, totalPaid: 0, totalInterest: 0, neverPaysOff: false };
    const r = apr / 12;
    let b = balance, months = 0, paid = 0, interestTotal = 0;
    const cap = opts.maxMonths || 1200;
    while (b > 0.005 && months < cap) {
      const interest = b * r;
      interestTotal += interest;
      b += interest;
      let pay;
      if (isNum(opts.fixed)) pay = opts.fixed;
      else pay = Math.max(opts.minFloor || 25, b * (opts.minPct || 0.02) + 0);
      if (isNum(opts.fixed) && pay <= interest + 1e-9 && months === 0) {
        return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity, neverPaysOff: true };
      }
      pay = Math.min(pay, b);
      b -= pay; paid += pay; months++;
    }
    if (months >= cap && b > 0.005) return { months: Infinity, totalPaid: Infinity, totalInterest: Infinity, neverPaysOff: true };
    return { months, totalPaid: paid, totalInterest: interestTotal, neverPaysOff: false };
  }

  /** Simple interest that builds on a loan between disbursement and repayment (years may be fractional). */
  function accruedInterest(principal, apr, years) {
    if (!isNum(principal) || principal <= 0 || years <= 0) return 0;
    return principal * apr * years;
  }

  /**
   * Future value with monthly compounding: starting amount plus a monthly contribution
   * made at the end of each month. Returns totals split into contributions vs. growth.
   */
  function futureValue(start, monthly, apr, years) {
    start = Math.max(0, isNum(start) ? start : 0);
    monthly = Math.max(0, isNum(monthly) ? monthly : 0);
    const n = Math.max(0, Math.round((isNum(years) ? years : 0) * 12));
    const r = (isNum(apr) ? apr : 0) / 12;
    const growthFactor = Math.pow(1 + r, n);
    const fvStart = start * growthFactor;
    const fvMonthly = r === 0 ? monthly * n : monthly * ((growthFactor - 1) / r);
    const total = fvStart + fvMonthly;
    const contributed = start + monthly * n;
    return { total, contributed, growth: total - contributed };
  }

  /** Year-by-year balances for a savings plan (for charts). */
  function growthByYear(start, monthly, apr, years) {
    const out = [];
    for (let y = 0; y <= Math.round(years); y++) out.push({ year: y, ...futureValue(start, monthly, apr, y) });
    return out;
  }

  /** Annual compounding, e.g. $1,000 at 10% for 2 years = $1,210. */
  function compoundAnnual(principal, rate, years) {
    return principal * Math.pow(1 + rate, years);
  }

  /** Progressive federal income tax on taxable income using bracket list [{upTo, rate}]. */
  function bracketTax(taxable, brackets) {
    let tax = 0, lower = 0;
    for (const b of brackets) {
      if (taxable <= lower) break;
      const top = Math.min(taxable, b.upTo);
      tax += (top - lower) * b.rate;
      lower = b.upTo;
    }
    return Math.max(0, tax);
  }

  function marginalRate(taxable, brackets) {
    let lower = 0;
    for (const b of brackets) { if (taxable <= b.upTo) return b.rate; lower = b.upTo; }
    return brackets[brackets.length - 1].rate;
  }

  /**
   * Simplified annual paycheck for a single filer.
   * pretaxPct: share of salary put in a pre-tax retirement plan (reduces income tax, not FICA).
   */
  function paycheck(grossAnnual, opts = {}) {
    const A = C.Assumptions.income;
    const gross = Math.max(0, isNum(grossAnnual) ? grossAnnual : 0);
    const pretaxPct = Math.min(0.5, Math.max(0, opts.pretaxPct || 0));
    const pretax = gross * pretaxPct;
    const taxable = Math.max(0, gross - pretax - A.standardDeduction);
    const federal = bracketTax(taxable, A.brackets);
    const fica = gross * A.ficaRate;
    const state = Math.max(0, gross - pretax - A.standardDeduction) * (opts.stateRate ?? A.stateRate);
    const net = gross - pretax - federal - fica - state;
    const per = (x) => x / 12;
    return {
      gross, pretax, taxable, federal, fica, state, net,
      monthly: { gross: per(gross), pretax: per(pretax), federal: per(federal), fica: per(fica), state: per(state), net: per(net) },
      effectiveFederal: gross ? federal / gross : 0,
      marginal: marginalRate(taxable, A.brackets),
    };
  }

  /** 50/30/20 split of take-home pay. */
  function split503020(net) {
    const v = Math.max(0, isNum(net) ? net : 0);
    return { needs: v * 0.5, wants: v * 0.3, savings: v * 0.2 };
  }

  /** Sum budget lines; returns totals and what's left. lines: {name: amount} */
  function budget(income, lines) {
    const inc = Math.max(0, isNum(income) ? income : 0);
    const spent = Object.values(lines || {}).reduce((s, v) => s + (isNum(v) ? Math.max(0, v) : 0), 0);
    return { income: inc, spent, left: inc - spent, balanced: Math.abs(inc - spent) < 0.005 };
  }

  function utilization(balance, limit) {
    if (!isNum(limit) || limit <= 0) return 0;
    return Math.max(0, balance) / limit;
  }

  /** Parse a user-typed number ("$1,200" → 1200). Returns NaN when invalid. */
  function parseAmount(text) {
    if (typeof text === 'number') return text;
    const s = String(text ?? '').replace(/[$,%\s]/g, '');
    if (s === '' || !/^-?\d*\.?\d+$/.test(s)) return NaN;
    return Number(s);
  }

  function money(n, { cents = false } = {}) {
    if (!isNum(n)) return '—';
    const sign = n < 0 ? '−' : '';
    const v = Math.abs(n);
    return sign + '$' + v.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  }
  function pct(x, digits = 0) { return isNum(x) ? (x * 100).toFixed(digits) + '%' : '—'; }
  function duration(months) {
    if (!isNum(months)) return 'never (payment too small)';
    const y = Math.floor(months / 12), m = months % 12;
    return [y ? `${y} yr` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ') || '0 mo';
  }

  return {
    monthlyPayment, loanSummary, amortizationByYear, payoff, accruedInterest,
    futureValue, growthByYear, compoundAnnual, bracketTax, marginalRate, paycheck,
    split503020, budget, utilization, parseAmount, money, pct, duration,
  };
});
