/* Financial math: loans, card payoff, savings growth, taxes, budgets. Expected values were checked
 * by hand and against standard amortization formulas. */
(function () {
  const { test, assert } = globalThis.CentsibleTest;
  const F = globalThis.Centsible.Finance;
  const A = globalThis.Centsible.Assumptions;

  test('loan payment: $10,000 at 6% for 10 years = $111.02/mo', () => {
    assert.approx(F.monthlyPayment(10000, 0.06, 10), 111.02, 0.01);
  });
  test('loan payment: $10,000 at 9% for 10 years = $126.68/mo', () => {
    assert.approx(F.monthlyPayment(10000, 0.09, 10), 126.68, 0.01);
  });
  test('loan summary: total interest = payments − principal', () => {
    const s = F.loanSummary(10000, 0.06, 10);
    assert.equal(s.months, 120);
    assert.approx(s.totalPaid, 13322.46, 0.5);
    assert.approx(s.totalInterest, 3322.46, 0.5);
  });
  test('loan payment: 0% interest divides evenly', () => {
    assert.approx(F.monthlyPayment(1200, 0, 1), 100, 1e-9);
  });
  test('loan payment: invalid inputs return 0', () => {
    assert.equal(F.monthlyPayment(-5, 0.06, 10), 0);
    assert.equal(F.monthlyPayment(1000, 0.06, 0), 0);
    assert.equal(F.monthlyPayment(NaN, 0.06, 10), 0);
  });
  test('amortization ends at zero balance', () => {
    const rows = F.amortizationByYear(25000, 0.0639, 10);
    assert.equal(rows.length, 10);
    assert.approx(rows[9].balance, 0, 0.05);
  });
  test('quiz claim A5: $1,000 at 24%, $25/mo → ~81 months, ~$1,030 interest', () => {
    const p = F.payoff(1000, 0.24, { fixed: 25 });
    assert.ok(p.months >= 80 && p.months <= 82, 'months ' + p.months);
    assert.approx(p.totalInterest, 1030, 15);
  });
  test('quiz claim B5: $600 at 22%, $20/mo → ~44 months, ~$280 interest', () => {
    const p = F.payoff(600, 0.22, { fixed: 20 });
    assert.ok(p.months >= 43 && p.months <= 45, 'months ' + p.months);
    assert.approx(p.totalInterest, 280, 10);
  });
  test('card payoff: payment below monthly interest never pays off', () => {
    const p = F.payoff(5000, 0.24, { fixed: 90 }); // interest is $100/mo
    assert.ok(p.neverPaysOff);
  });
  test('card payoff: minimum-payment rule takes longer than a fixed $100', () => {
    const min = F.payoff(900, 0.24, { minPct: 0.02, minFloor: 25 });
    const fixed = F.payoff(900, 0.24, { fixed: 100 });
    assert.ok(min.months > fixed.months && min.totalInterest > fixed.totalInterest);
  });
  test('savings: no interest = sum of contributions', () => {
    const fv = F.futureValue(0, 100, 0, 10);
    assert.approx(fv.total, 12000, 1e-6);
    assert.approx(fv.growth, 0, 1e-6);
  });
  test('savings: $1,000 at 6% compounded monthly for 1 year = $1,061.68', () => {
    assert.approx(F.futureValue(1000, 0, 0.06, 1).total, 1061.68, 0.01);
  });
  test('savings: $100/mo at 6% for 30 years ≈ $100,451', () => {
    assert.approx(F.futureValue(0, 100, 0.06, 30).total, 100451.50, 1);
  });
  test('savings: negative inputs are treated as zero', () => {
    assert.approx(F.futureValue(-500, -10, 0.05, 5).total, 0, 1e-9);
  });
  test('quiz claim A8/B8: compound growth', () => {
    assert.approx(F.compoundAnnual(1000, 0.10, 2), 1210, 1e-9);
    assert.approx(F.compoundAnnual(2000, 0.05, 2), 2205, 1e-9);
  });
  test('tax: 2026 brackets on $45,900 taxable = $5,260', () => {
    assert.approx(F.bracketTax(45900, A.income.brackets), 5260, 0.01);
  });
  test('tax: marginal rate is the bracket of the last dollar', () => {
    assert.equal(F.marginalRate(45900, A.income.brackets), 0.12);
    assert.equal(F.marginalRate(60000, A.income.brackets), 0.22);
  });
  test('paycheck: $62,000 salary → about $4,180/mo take-home', () => {
    const p = F.paycheck(62000);
    assert.approx(p.taxable, 45900, 0.01);
    assert.approx(p.fica, 62000 * 0.0765, 0.01);
    assert.approx(p.monthly.net, 4180.08, 0.5);
    assert.approx(p.gross, p.pretax + p.federal + p.fica + p.state + p.net, 1e-6, 'parts add up');
  });
  test('paycheck: pre-tax retirement lowers income tax but not FICA', () => {
    const a = F.paycheck(50000), b = F.paycheck(50000, { pretaxPct: 0.03 });
    assert.approx(a.fica, b.fica, 1e-9);
    assert.ok(b.federal < a.federal);
    assert.ok(a.net - b.net < 1500, 'take-home drops by less than the contribution');
  });
  test('paycheck: income below the standard deduction owes no income tax', () => {
    const p = F.paycheck(15000);
    assert.equal(p.federal, 0);
    assert.equal(p.state, 0);
  });
  test('budget: 50/30/20 split adds up', () => {
    const s = F.split503020(3000);
    assert.deepEqual(s, { needs: 1500, wants: 900, savings: 600 });
  });
  test('budget arithmetic: left = income − spending; ignores negatives/NaN', () => {
    const b = F.budget(2000, { rent: 900, food: 300, bad: NaN, neg: -50, fun: 200 });
    assert.equal(b.spent, 1400);
    assert.equal(b.left, 600);
    assert.ok(F.budget(500, { a: 500 }).balanced);
  });
  test('utilization and parsing', () => {
    assert.equal(F.utilization(300, 1500), 0.2);
    assert.equal(F.utilization(100, 0), 0);
    assert.equal(F.parseAmount('$1,250'), 1250);
    assert.ok(Number.isNaN(F.parseAmount('abc')));
    assert.ok(Number.isNaN(F.parseAmount('')));
  });
})();
