/* V5 features: senior-year car, phishing decision, Challenge Score and rewards, merging progress,
 * V4 import, feedback metrics, and the numbers quoted in the new content. */
(function () {
  const { test, assert } = globalThis.CentsibleTest;
  const C = globalThis.Centsible;
  const S = C.Sim, F = C.Finance, A = C.Assumptions, R = C.Rewards, Store = C.Store;

  function play(plan = {}) {
    let st = S.newState(0);
    for (let n = S.next(st), guard = 0; n && guard < 40; n = S.next(st), guard++) {
      const m = S.derive(st.choices);
      if (n.blocked && n.blocked(m)) {
        plan = { ...plan, c4_housing: 'roommate', c4_transport: m.job.job.transit ? 'transit' : 'rides' };
        st = S.rewind(st, 'c4_housing');
        continue;
      }
      let v;
      if (n.kind === 'allocate') v = n.id in plan ? plan[n.id] : n.range(m).default;
      else v = n.id in plan ? plan[n.id] : n.options(m).find((o) => !o.disabled).id;
      st = S.choose(st, n.id, v).state;
    }
    return st;
  }
  const fakeStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

  // ---- car
  test('car decision comes right after housing in Chapter 1', () => {
    let st = S.choose(S.newState(0), 'c1_offers', 'lakeside').state;
    st = S.choose(st, 'c1_housing', 'campus').state;
    assert.equal(S.next(st).id, 'c1_car');
  });
  test('paying cash for a car adds its price to freshman-year borrowing', () => {
    const base = { c1_offers: 'lakeside', c1_housing: 'campus', c1_borrow: 'federal-first' };
    const none = S.derive({ ...base, c1_car: 'none' }), cash = S.derive({ ...base, c1_car: 'used-cash' });
    assert.approx(cash.loans.principalTotal - none.loans.principalTotal, A.car.usedPrice, 0.01);
  });
  test('financed car: payment, 24 payments left at the first job, and remaining balance', () => {
    const m = S.derive({ c1_offers: 'lakeside', c1_housing: 'campus', c1_car: 'financed', c2_job: 10, c4_transport: 'keep' });
    assert.approx(m.teenCar.payment, F.monthlyPayment(12000, 0.11, 6), 1e-6);
    assert.equal(m.teenCar.monthsLeft, 24);
    assert.approx(m.teenCar.balanceAtJob, 4901, 1);
    assert.approx(m.job.carPayment, m.teenCar.payment, 1e-6);
  });
  test('owning a car in college requires a job: "no job" is disabled', () => {
    let st = play({ c1_offers: 'lakeside', c1_housing: 'campus', c1_car: 'used-cash', c1_borrow: 'federal-first' });
    const ch = { c1_offers: 'lakeside', c1_housing: 'campus', c1_car: 'used-cash', c1_borrow: 'federal-first' };
    const node = S.nodeById('c2_job');
    const opts = node.options(S.derive(ch));
    assert.ok(opts.find((o) => o.id === 0).disabled);
    assert.ok(!opts.find((o) => o.id === 10).disabled);
    assert.ok(st.done);
  });
  test('selling the used car at the first job adds its value to savings', () => {
    const base = { c1_offers: 'lakeside', c1_housing: 'campus', c1_car: 'used-cash', c1_borrow: 'federal-first', c2_job: 10, c2_budget: 100, c2_laptop: 'refurb', c2_scam: 'portal', c3_card: 'none', c3_cosign: 'decline', c4_offer: 'metro', c4_housing: 'roommate' };
    const keep = S.derive({ ...base, c4_transport: 'keep' }), sell = S.derive({ ...base, c4_transport: 'transit' });
    assert.approx(sell.job.fund - keep.job.fund, 1500, 0.01);
    assert.ok(!S.nodeById('c4_transport').options(keep).some((o) => o.id === 'used'), 'no second car purchase');
  });

  // ---- phishing
  test('falling for the phishing text costs $600 of savings', () => {
    const base = { c1_offers: 'lakeside', c1_housing: 'home', c1_car: 'none', c1_borrow: 'federal-first', c2_job: 10, c2_budget: 50, c2_laptop: 'refurb' };
    const safe = S.derive({ ...base, c2_scam: 'portal' }), hit = S.derive({ ...base, c2_scam: 'click' });
    assert.ok(safe.school.fundAtGrad >= S.SCAM_LOSS);
    assert.approx(safe.school.fundAtGrad - hit.school.fundAtGrad, S.SCAM_LOSS, 0.01);
  });

  // ---- points and rewards
  test('every decision on several paths scores 0–1,000 points', () => {
    [{}, { c1_offers: 'coastline', c1_car: 'financed', c3_card: 'student', c3_card_use: 'trip', c3_balance: 'minimum' },
      { c1_offers: 'whitmore', c1_car: 'used-cash', c2_laptop: 'bnpl', c2_scam: 'click', c4_retire: 0.06 }].forEach((plan) => {
      const st = play(plan);
      st.order.forEach((id) => { const p = S.decisionPoints(st, id); assert.ok(p >= 0 && p <= 1000, id + ' ' + p); });
    });
  });
  test('Challenge Score is scaled to 13 decisions (out of 13,000)', () => {
    const st = play({});
    const c = R.challenge(st, 13);
    assert.equal(c.n, st.order.length);
    assert.equal(c.total, Math.round((c.raw / c.n) * 13));
    assert.equal(c.max, 13000);
  });
  test('accuracy reward needs MORE than 95% and at least 8 answers', () => {
    const cfg = { ...R.DEFAULTS };
    const st = { ...play({}), runId: 'run-x' };
    const checks = (right, wrong) => [...Array(right).fill({ correct: true }), ...Array(wrong).fill({ correct: false })];
    const earned = (r, w, post = []) => R.evaluate({ ...st, checks: checks(r, w) }, { post: { items: post }, cfg }).rewards.find((x) => x.id === 'accuracy').earned;
    assert.ok(earned(12, 0), '12/12');
    assert.ok(!earned(12, 1), '12/13 = 92%');
    assert.ok(earned(12, 0, [...checks(11, 1)]), '23/24 = 95.8%');
    assert.ok(!earned(5, 0), 'too few answers');
  });
  test('score reward needs a Challenge Score over the threshold', () => {
    const st = play({});
    const total = R.challenge(st).total;
    const at = R.evaluate(st, { cfg: { ...R.DEFAULTS, scoreReward: 'Test prize', scoreThreshold: total } });
    const below = R.evaluate(st, { cfg: { ...R.DEFAULTS, scoreReward: 'Test prize', scoreThreshold: total - 1 } });
    assert.ok(!at.rewards.find((x) => x.id === 'score').earned, 'equal is not over');
    assert.ok(below.rewards.find((x) => x.id === 'score').earned);
    assert.ok(below.claim, 'earning a reward gives a claim code');
  });
  test('no score prize is offered when scoreReward is blank', () => {
    const st = play({});
    const r = R.evaluate(st, { cfg: { ...R.DEFAULTS, scoreReward: '', scoreThreshold: 0 } });
    assert.ok(!r.rewards.some((x) => x.id === 'score'));
    assert.ok(!r.earned.includes('score'));
  });
  test('claim codes are deterministic, well-formed, and differ between runs', () => {
    const a = R.claimCode('run-1', 'p', 10500), b = R.claimCode('run-1', 'p', 10500), c = R.claimCode('run-2', 'p', 10500);
    assert.equal(a, b);
    assert.ok(a !== c);
    assert.ok(/^CS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(a), a);
  });
  test('no rewards when rewards are turned off', () => {
    const r = R.evaluate(play({}), { cfg: { ...R.DEFAULTS, enabled: false } });
    assert.equal(r.rewards.length, 0);
    assert.equal(r.claim, null);
  });

  // ---- saved progress
  test('merging progress keeps the best of both devices', () => {
    const a = Store.blank(1), b = Store.blank(2);
    a.lessons = { 'net-price': { done: true, passed: false, at: 5 } };
    b.lessons = { 'net-price': { done: true, passed: true, at: 1 }, risk: { done: true, passed: true, at: 3 } };
    a.reports = [{ id: 'r1', createdAt: 1 }]; b.reports = [{ id: 'r2', createdAt: 2 }, { id: 'r1', createdAt: 1 }];
    a.evidence = { credit: Array.from({ length: 12 }, (_, i) => ({ c: 'apr', ok: true, t: i })) };
    b.evidence = { credit: Array.from({ length: 12 }, (_, i) => ({ c: 'apr', ok: false, t: 100 + i })) };
    a.credits = [{ id: 'x', amount: 100 }]; b.credits = [{ id: 'x', amount: 100 }, { id: 'y', amount: 100 }];
    const m = Store.merge(a, b);
    assert.ok(m.lessons['net-price'].passed);
    assert.ok(m.lessons.risk);
    assert.deepEqual(m.reports.map((r) => r.id), ['r2', 'r1']);
    assert.equal(m.evidence.credit.length, 16);
    assert.equal(m.evidence.credit[15].t, 111);
    assert.equal(m.credits.length, 2);
    assert.equal(m.participant, b.participant);
  });
  test('V4 progress is imported the first time V5 opens', () => {
    const storage = fakeStorage();
    const v4 = { ...Store.blank(1), version: 4, lessons: { risk: { done: true, passed: true } }, sim: { state: {} } };
    storage.setItem(Store.OLD_KEY, JSON.stringify(v4));
    const s = Store.create(storage);
    assert.equal(s.get().version, 5);
    assert.ok(s.get().lessons.risk.passed);
    assert.equal(s.get().sim, null, 'an unfinished V4 game is not resumed');
    assert.ok(s.get().importedFromV4);
  });
  test('credit points add up', () => {
    const s = Store.create(fakeStorage());
    s.update((d) => { d.credits = [{ id: 'a', amount: 100 }, { id: 'b', amount: 100 }]; });
    assert.equal(s.credits(), 200);
  });

  // ---- feedback metrics
  test('Net Promoter Score and school interest are summarized correctly', () => {
    const ev = (nps, school) => ({ type: 'feedback', participant: 'p' + nps, data: { rating: 4, nps, school }, created_at: '2026-10-21' });
    const s = C.Analytics.summarize([ev(10, 'yes'), ev(9, 'yes'), ev(8, 'maybe'), ev(6, 'no'), ev(0, 'yes')]);
    assert.equal(s.feedback.nps, 0);           // 2 promoters − 2 detractors out of 5
    assert.approx(s.feedback.schoolYes, 0.6, 1e-9);
    assert.equal(s.feedback.n, 5);
  });

  // ---- content
  test('Scams & Digital Money pathway: 3+ lessons, every safety concept taught', () => {
    assert.ok(C.Lessons.LESSONS.filter((l) => l.pathway === 'safety').length >= 3);
    Object.entries(C.Concepts).filter(([, v]) => v.topic === 'safety').forEach(([id]) => assert.ok(C.Lessons.LESSONS.some((l) => l.concepts.includes(id)), id));
    assert.ok(C.Assessments.TOPICS.some((t) => t.id === 'safety'));
  });
  test('numbers quoted in the car lesson and mission', () => {
    const four = F.loanSummary(12000, 0.11, 4), six = F.loanSummary(12000, 0.11, 6);
    assert.approx(four.payment, 310, 1); assert.approx(four.totalInterest, 2890, 5);
    assert.approx(six.payment, 228, 1); assert.approx(six.totalInterest, 4450, 10);
    assert.approx(Math.round(six.payment) + 190 + 60 + 20, 498, 1);
    assert.approx(Math.round(six.payment) + 190 + 60, 478, 1);
  });
  test('numbers quoted in the buy-now-pay-later lesson', () => {
    assert.equal(3 * 40 * 26 / 12, 260);
    assert.approx(((160 + 120 + 200 + 80) / 4) * 26 / 12, 300, 5);
  });
})();
