/* Simulator: branching, persistence, and a coherent money model. */
(function () {
  const { test, assert } = globalThis.CentsibleTest;
  const S = globalThis.Centsible.Sim;
  const F = globalThis.Centsible.Finance;
  const A = globalThis.Centsible.Assumptions;

  // Play to the end, choosing from `plan` when given, otherwise the first enabled option / default budget.
  function play(plan = {}) {
    let st = S.newState(0);
    let guard = 0;
    for (let n = S.next(st); n && guard < 40; n = S.next(st), guard++) {
      const m = S.derive(st.choices);
      let v;
      if (n.blocked && n.blocked(m)) { // essentials don't fit: pick cheaper housing and transport, like a player would
        plan = { ...plan, c4_housing: 'roommate', c4_transport: m.job.job.transit ? 'transit' : 'rides' };
        st = S.rewind(st, 'c4_housing');
        continue;
      }
      if (n.kind === 'allocate') v = n.id in plan ? plan[n.id] : n.range(m).default;
      else v = n.id in plan ? plan[n.id] : n.options(m).find((o) => !o.disabled).id;
      st = S.choose(st, n.id, v).state;
    }
    return st;
  }

  test('game starts with the college offers', () => {
    assert.equal(S.next(S.newState(0)).id, 'c1_offers');
  });
  test('living at home is only offered for the local college', () => {
    let st = S.choose(S.newState(0), 'c1_offers', 'lakeside').state;
    assert.ok(S.next(st).options(S.derive(st.choices)).some((o) => o.id === 'home'));
    st = S.choose(S.newState(0), 'c1_offers', 'coastline').state;
    assert.ok(!S.next(st).options(S.derive(st.choices)).some((o) => o.id === 'home'));
  });
  test('net price and gap follow the formula', () => {
    const m = S.derive({ c1_offers: 'whitmore', c1_housing: 'campus' });
    const c = S.COLLEGES.whitmore;
    assert.equal(m.college.netPrice, c.tuition + c.housingFood + c.other - c.aid);
    assert.equal(m.college.gap, m.college.netPrice - 8000 - 3000);
  });
  test('federal borrowing never exceeds dependent annual limits', () => {
    const m = S.derive({ c1_offers: 'coastline', c1_housing: 'campus', c1_borrow: 'federal-first' });
    const limit = A.loans.dependentAnnualLimit.reduce((a, b) => a + b, 0);
    assert.equal(m.loans.sub + m.loans.unsub, limit);
    assert.ok(m.loans.priv > 0);
    assert.approx(m.loans.sub + m.loans.unsub + m.loans.priv, m.college.gap * 4, 0.01, 'every gap dollar is covered');
  });
  test('subsidized loans build no interest; unsubsidized and private do', () => {
    const m = S.derive({ c1_offers: 'coastline', c1_housing: 'campus', c1_borrow: 'federal-first' });
    assert.approx(m.loans.fedBalance, m.loans.sub + m.loans.unsub + m.loans.accruedUnsub, 1e-6);
    assert.ok(m.loans.accruedUnsub > 0 && m.loans.accruedPriv > 0);
  });
  test('work-more plan is unavailable when the gap is too big, and skips the job question', () => {
    let st = S.choose(S.newState(0), 'c1_offers', 'coastline').state;
    st = S.choose(st, 'c1_housing', 'campus').state;
    const opts = S.next(st).options(S.derive(st.choices));
    assert.ok(opts.find((o) => o.id === 'work-more').disabled);
    assert.throws(() => S.choose(st, 'c1_borrow', 'work-more'));
    let st2 = S.choose(S.newState(0), 'c1_offers', 'lakeside').state;
    st2 = S.choose(st2, 'c1_housing', 'campus').state;
    st2 = S.choose(st2, 'c1_borrow', 'work-more').state;
    assert.equal(S.next(st2).id, 'c2_budget', 'job decision skipped');
    assert.equal(S.derive(st2.choices).school.hours, 20);
  });
  test('Parent PLUS moves the extra borrowing off the student', () => {
    const a = S.derive({ c1_offers: 'whitmore', c1_housing: 'campus', c1_borrow: 'federal-first' });
    const b = S.derive({ c1_offers: 'whitmore', c1_housing: 'campus', c1_borrow: 'parent-plus' });
    assert.ok(b.loans.studentTotal < a.loans.studentTotal);
    assert.approx(b.loans.plus, a.loans.priv, 1e-6);
  });
  test('earlier choices carry forward: college debt changes the first-job budget', () => {
    const cheap = play({ c1_offers: 'lakeside', c1_housing: 'home' });
    const pricey = play({ c1_offers: 'coastline', c1_housing: 'campus', c1_borrow: 'federal-first', c4_offer: 'metro', c4_housing: 'roommate', c4_transport: 'transit' });
    const mc = S.derive(cheap.choices), mp = S.derive(pricey.choices);
    assert.ok(mp.job.loanPayment > mc.job.loanPayment * 3);
  });
  test('the laptop plan depends on savings built in the college budget', () => {
    let st = play({ c1_offers: 'lakeside', c1_housing: 'campus', c1_borrow: 'federal-first', c2_job: 0, c2_budget: 9999 });
    const m = S.derive(st.choices);
    assert.equal(m.school.save, 0, 'spent everything on wants');
    assert.equal(st.choices.c2_laptop, 'bnpl', 'only buy-now-pay-later was available');
    assert.ok(m.school.bnplShort && m.school.fees > 0);
  });
  test('card balance only appears for the trip choice, and payoff choices change interest', () => {
    const base = { c1_offers: 'lakeside', c1_housing: 'home', c3_card: 'student', c3_card_use: 'trip' };
    const min = S.derive({ ...base, c3_balance: 'minimum' }).credit;
    const fixed = S.derive({ ...base, c3_balance: 'fixed' }).credit;
    assert.ok(min.cardInterest > fixed.cardInterest);
    assert.equal(S.derive({ ...base, c3_card_use: 'bills' }).credit.balance, 0);
  });
  test('budget node is blocked when essentials exceed take-home pay', () => {
    const m = S.derive({ c1_offers: 'coastline', c1_housing: 'campus', c1_borrow: 'federal-first', c2_job: 0, c2_budget: 0,
      c3_card: 'none', c3_cosign: 'decline', c4_offer: 'metro', c4_housing: 'alone', c4_transport: 'newer', c4_repay: 'standard', c4_retire: 0.06 });
    const node = S.nodeById('c4_budget');
    assert.ok(m.job.flexibility < 0, 'flexibility ' + m.job.flexibility);
    assert.ok(node.blocked(m));
  });
  test('a full playthrough finishes with every applicable decision made', () => {
    const st = play();
    assert.ok(st.done);
    assert.equal(S.next(st), null);
    const p = S.progress(st);
    assert.equal(p.done, p.total);
    assert.ok(p.total >= 12 && p.total <= 16, 'decisions: ' + p.total);
  });
  test('budget values are clamped to what is available', () => {
    let st = play({ c4_budget: 999999 });
    const m = S.derive(st.choices);
    assert.ok(m.job.wants <= Math.max(0, m.job.flexibility) + 1e-9);
    assert.ok(m.job.saveMonthly >= 0);
  });
  test('invalid choices are rejected', () => {
    assert.throws(() => S.choose(S.newState(0), 'c1_offers', 'harvard'));
    assert.throws(() => S.choose(S.newState(0), 'nope', 'x'));
    assert.throws(() => S.choose(S.newState(0), 'c2_budget', 'lots'));
  });
  test('rewind forgets the chosen decision and everything after it', () => {
    const st = play();
    const r = S.rewind(st, 'c1_housing');
    assert.deepEqual(Object.keys(r.choices), ['c1_offers']);
    assert.equal(S.next(r).id, 'c1_housing');
    assert.ok(!r.done);
  });
  test('saved games survive a JSON round trip with identical results', () => {
    const st = play({ c1_offers: 'whitmore', c4_offer: 'metro' });
    const copy = JSON.parse(JSON.stringify(st));
    assert.deepEqual(S.derive(copy.choices).job.essentials, S.derive(st.choices).job.essentials);
    assert.equal(S.next(copy), null);
  });
  test('summary ranks decisions by dollar impact', () => {
    const s = S.summary(play({ c1_offers: 'coastline', c1_housing: 'campus', c1_borrow: 'federal-first' }));
    assert.ok(s.impacts.length >= 2);
    for (let i = 1; i < s.impacts.length; i++) assert.ok(Math.abs(s.impacts[i - 1].amount) >= Math.abs(s.impacts[i].amount));
    assert.ok(s.flags.includes('fed-vs-private'));
  });
  test('loan payment in the first job matches the finance module', () => {
    const m = S.derive(play().choices);
    assert.approx(m.job.fedPay, F.monthlyPayment(m.loans.fedBalance, A.loans.federalUndergradRate, m.job.fedYears), 1e-9);
  });
  test('game health index stays within 0–100', () => {
    ['lakeside', 'coastline', 'whitmore'].forEach((c) => {
      const h = S.derive(play({ c1_offers: c }).choices).health.score;
      assert.ok(h >= 0 && h <= 100, c + ': ' + h);
    });
  });
  test('recorded concept checks are replaced, not duplicated', () => {
    let st = S.newState(0);
    st = S.recordCheck(st, 'c1_offers', false);
    st = S.recordCheck(st, 'c1_offers', true);
    assert.equal(st.checks.length, 1);
    assert.ok(st.checks[0].correct);
  });
})();
