/* Content integrity: every tag points somewhere real, every answer key is valid, and the numbers
 * quoted in lessons and missions match the finance module. */
(function () {
  const { test, assert } = globalThis.CentsibleTest;
  const C = globalThis.Centsible;
  const F = C.Finance;

  const checkQuestion = (q, where) => {
    assert.ok(q.q && Array.isArray(q.a) && q.a.length >= 2, where + ': question shape');
    assert.ok(q.correct >= 0 && q.correct < q.a.length, where + ': answer key in range');
    assert.ok(q.why && q.why.length > 10, where + ': has an explanation');
    assert.equal(new Set(q.a).size, q.a.length, where + ': answers are unique');
    if (q.concept) assert.ok(C.Concepts[q.concept], where + ': unknown concept ' + q.concept);
  };

  test('every lesson is complete: explanation, example, widget, 2–3 questions', () => {
    assert.ok(C.Lessons.LESSONS.length >= 15);
    C.Lessons.LESSONS.forEach((L) => {
      assert.ok(L.explain && L.example && L.widget && L.widget.type, L.id + ' sections');
      assert.ok(L.questions.length >= 2 && L.questions.length <= 3, L.id + ' question count');
      assert.ok(L.minutes >= 2 && L.minutes <= 4, L.id + ' length');
      assert.ok(C.Lessons.PATHWAYS.some((p) => p.id === L.pathway), L.id + ' pathway');
      L.concepts.forEach((c) => assert.ok(C.Concepts[c], L.id + ' concept ' + c));
      L.questions.forEach((q, i) => checkQuestion(q, `${L.id} q${i + 1}`));
    });
  });
  test('lesson IDs and questions are not repeated', () => {
    const ids = C.Lessons.LESSONS.map((l) => l.id);
    assert.equal(new Set(ids).size, ids.length);
    const qs = C.Lessons.LESSONS.flatMap((l) => l.questions.map((q) => q.q));
    assert.equal(new Set(qs).size, qs.length);
  });
  test('every pathway has at least 3 lessons', () => {
    C.Lessons.PATHWAYS.forEach((p) => assert.ok(C.Lessons.LESSONS.filter((l) => l.pathway === p.id).length >= 3, p.id));
  });
  test('every assessment concept has at least one lesson to recommend', () => {
    C.Assessments.OBJECTIVES.forEach((o) => assert.ok(C.Lessons.LESSONS.some((l) => l.concepts.includes(o.concept)), o.concept));
  });
  test('every simulator check and flag maps to a lesson', () => {
    C.Sim.NODES.forEach((n) => {
      if (n.check) { checkQuestion(n.check, n.id); assert.ok(C.Lessons.LESSONS.some((l) => l.concepts.includes(n.check.concept)), n.id + ' check concept'); }
    });
  });
  test('missions are complete and rotate weekly', () => {
    assert.ok(C.Missions.MISSIONS.length >= 5);
    C.Missions.MISSIONS.forEach((m) => {
      assert.ok(m.steps.length >= 2, m.id + ' steps');
      m.steps.forEach((s) => assert.ok(s.options.length >= 2 && s.options.every((o) => o.result && ['strong', 'ok', 'risky'].includes(o.tag)), m.id + ' options'));
      checkQuestion(m.check, m.id);
      m.concepts.forEach((c) => assert.ok(C.Concepts[c], m.id + ' concept ' + c));
    });
    const a = C.Missions.missionOfWeek(new Date(Date.UTC(2026, 9, 5)));
    const b = C.Missions.missionOfWeek(new Date(Date.UTC(2026, 9, 12)));
    assert.ok(a.id !== b.id, 'changes week to week');
  });

  // ---- numbers quoted in content
  test('lesson claim: $1,500 at 24% → $40/mo ≈ 6 yrs & ~$1,300; $100/mo ≈ 18 mo & ~$300', () => {
    const slow = F.payoff(1500, 0.24, { fixed: 40 }), fast = F.payoff(1500, 0.24, { fixed: 100 });
    assert.ok(slow.months >= 66 && slow.months <= 74, 'slow months ' + slow.months);
    assert.approx(slow.totalInterest, 1300, 60);
    assert.ok(fast.months >= 17 && fast.months <= 19, 'fast months ' + fast.months);
    assert.approx(fast.totalInterest, 300, 30);
  });
  test('lesson claim: $600 on a 24% card at $30/mo ≈ 2 years and ~$170 extra', () => {
    const p = F.payoff(600, 0.24, { fixed: 30 });
    assert.ok(p.months >= 24 && p.months <= 27, 'months ' + p.months);
    assert.approx(p.totalInterest, 170, 15);
  });
  test('lesson claim: starting at 22 vs 32 ($200/mo, 6%) ≈ twice as much', () => {
    const early = F.futureValue(0, 200, 0.06, 43).total, late = F.futureValue(0, 200, 0.06, 33).total;
    assert.ok(early / late > 1.85 && early / late < 2.05, 'ratio ' + early / late);
  });
  test('lesson claim: $10,000 for 30 years, 0.05% vs 1% fee ≈ $56,600 vs $43,200', () => {
    assert.approx(F.compoundAnnual(10000, 0.0595, 30), 56630, 150);
    assert.approx(F.compoundAnnual(10000, 0.05, 30), 43219, 50);
  });
  test('lesson claim: $50,000 salary → $3,820 federal tax', () => {
    assert.approx(F.paycheck(50000).federal, 3820, 0.5);
  });
  test('mission claim: $1,200 at 24% — $35/mo ≈ 5 years, $100/mo ≈ 14 months', () => {
    const slow = F.payoff(1200, 0.24, { fixed: 35 }), fast = F.payoff(1200, 0.24, { fixed: 100 });
    assert.ok(slow.months >= 56 && slow.months <= 60, 'slow ' + slow.months);
    assert.ok(fast.months >= 13 && fast.months <= 15, 'fast ' + fast.months);
  });
})();
