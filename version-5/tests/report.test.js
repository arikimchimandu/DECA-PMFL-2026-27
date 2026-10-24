/* Financial Future Report and impact analytics. */
(function () {
  const { test, assert } = globalThis.CentsibleTest;
  const C = globalThis.Centsible;

  test('sample report recommends the minimum-payments lesson for a student who struggled with it', () => {
    const r = C.ReportBuilder.sample();
    assert.ok(r.sample);
    assert.ok(r.recommendations.some((x) => x.lesson === 'min-payments'), JSON.stringify(r.recommendations));
    assert.ok(r.recommendations.length <= 3);
    assert.ok(r.impacts.length >= 1 && r.impacts.length <= 3);
  });
  test('report learning scores come only from answers, not from money', () => {
    const r = C.ReportBuilder.sample();
    const answers = Object.values(r.scores).reduce((t, v) => t + v.total, 0);
    assert.ok(r.checksAnswered >= 8);
    assert.equal(answers, 12 + r.checksAnswered, '12 post-test items + in-game quick checks, nothing else');
  });
  test('report shows improvement only when both checks exist', () => {
    let st = C.Sim.newState(0);
    for (let n = C.Sim.next(st); n; n = C.Sim.next(st)) {
      const m = C.Sim.derive(st.choices);
      const v = n.kind === 'allocate' ? n.range(m).default : n.options(m).find((o) => !o.disabled).id;
      if (n.blocked && n.blocked(m)) break;
      st = C.Sim.choose(st, n.id, v).state;
    }
    const r = C.ReportBuilder.build(st, {});
    assert.equal(r.improvement, null);
    assert.equal(r.assessment.pre, null);
    assert.ok(r.money.netMonthly > 0 && Number.isFinite(r.money.flexibility));
  });
  test('report money matches the simulator model', () => {
    const r = C.ReportBuilder.sample();
    const m = C.Sim.derive({ c1_offers: 'whitmore', c1_housing: 'campus', c1_car: 'used-cash', c1_borrow: 'federal-first' });
    assert.approx(r.money.studentDebt, m.loans.studentTotal, 1e-6);
    assert.approx(r.money.netMonthly - r.money.essentialTotal, r.money.flexibility, 1e-6);
  });

  const ev = (participant, type, data = {}, day = '2026-10-01') => ({ participant, type, data, created_at: day + 'T12:00:00Z' });
  test('impact summary pairs each student’s latest pre and post checks', () => {
    const s = C.Analytics.summarize([
      ev('a', 'visit'), ev('a', 'visit', {}, '2026-10-03'), ev('b', 'visit'),
      ev('a', 'sim_start'), ev('b', 'sim_start'), ev('a', 'sim_complete'),
      ev('a', 'assessment', { phase: 'pre', score: 4, total: 10, byTopic: { credit: { correct: 0, total: 2 } } }),
      ev('a', 'assessment', { phase: 'post', score: 8, total: 10, byTopic: { credit: { correct: 2, total: 2 } } }),
      ev('b', 'assessment', { phase: 'pre', score: 6, total: 10, byTopic: {} }), // no post → not paired
      ev('a', 'lesson_complete', { passed: true }), ev('a', 'lesson_complete', { passed: false }),
      ev('a', 'feedback', { rating: 5 }), ev('b', 'feedback', { rating: 9 }),
    ]);
    assert.equal(s.participants, 2);
    assert.equal(s.returning, 1);
    assert.equal(s.completionRate, 0.5);
    assert.equal(s.paired.n, 1);
    assert.approx(s.paired.pre, 0.4, 1e-9);
    assert.approx(s.paired.post, 0.8, 1e-9);
    assert.equal(s.paired.improved, 1);
    assert.equal(s.paired.byTopic.credit.pre, 0);
    assert.equal(s.paired.byTopic.credit.post, 1);
    assert.equal(s.lessonPassRate, 0.5);
    assert.equal(s.feedback.n, 1, 'out-of-range ratings are ignored');
  });
  test('impact summary credits each student to the first link that brought them', () => {
    const s = C.Analytics.summarize([
      ev('a', 'visit', { src: 'popup', firstSrc: 'popup' }), ev('a', 'sim_start', { src: 'direct', firstSrc: 'popup' }), ev('a', 'sim_complete', { firstSrc: 'popup' }),
      ev('b', 'visit', { src: 'instagram', firstSrc: 'instagram' }), ev('b', 'sim_start', { firstSrc: 'instagram' }),
      ev('c', 'visit', {}),
    ]);
    assert.deepEqual(s.byChannel.popup, { participants: 1, simStarts: 1, simCompletes: 1 });
    assert.deepEqual(s.byChannel.instagram, { participants: 1, simStarts: 1, simCompletes: 0 });
    assert.equal(s.byChannel.direct.participants, 1);
  });
  test('impact summary averages 1–5 preparedness before and after, ignoring invalid values', () => {
    const s = C.Analytics.summarize([
      ev('a', 'assessment', { phase: 'pre', score: 5, total: 12, confidence: 2 }), ev('a', 'assessment', { phase: 'post', score: 9, total: 12, confidence: 4 }),
      ev('b', 'assessment', { phase: 'pre', score: 5, total: 12, confidence: 3 }), ev('b', 'assessment', { phase: 'post', score: 7, total: 12, confidence: 9 }),
      ev('c', 'assessment', { phase: 'pre', score: 5, total: 12, confidence: 1 }),
    ]);
    assert.approx(s.confidence.preAll, 2, 1e-9);
    assert.approx(s.confidence.pre, 2.5, 1e-9);
    assert.approx(s.confidence.post, 4, 1e-9, 'the out-of-range 9 is ignored');
  });
  test('impact summary with no data returns empty values, not errors', () => {
    const s = C.Analytics.summarize([]);
    assert.equal(s.participants, 0);
    assert.equal(s.completionRate, null);
    assert.equal(s.paired.n, 0);
    assert.equal(s.paired.pre, null);
  });
  test('analytics never records in demo mode', () => {
    C.Analytics.setDemo(true);
    assert.equal(C.Analytics.log('visit', 'x', 'test'), false);
    C.Analytics.setDemo(false);
  });
})();
