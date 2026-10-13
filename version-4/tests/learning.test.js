/* Assessment scoring, learning scores, recommendations, and saved progress. */
(function () {
  const { test, assert } = globalThis.CentsibleTest;
  const M = globalThis.Centsible.Mastery;
  const Asmt = globalThis.Centsible.Assessments;
  const Store = globalThis.Centsible.Store;

  const allCorrect = (form) => Asmt.forms[form].map((q) => q.a[q.correct]);

  test('assessment forms are parallel: same slots, topics, and objectives', () => {
    assert.equal(Asmt.forms.A.length, 10);
    assert.equal(Asmt.forms.B.length, 10);
    Asmt.forms.A.forEach((q, i) => {
      assert.equal(q.slot, Asmt.forms.B[i].slot);
      assert.ok(q.q !== Asmt.forms.B[i].q, 'questions differ on slot ' + q.slot);
      assert.ok(q.correct >= 0 && q.correct < q.a.length);
    });
  });
  test('scoring: all correct = 10/10 with 2 per topic', () => {
    const r = M.scoreAssessment('A', allCorrect('A'));
    assert.equal(r.score, 10);
    Object.values(r.byTopic).forEach((t) => { assert.equal(t.correct, 2); assert.equal(t.total, 2); });
  });
  test('scoring uses answer text, so shuffled answer order is graded correctly', () => {
    const answers = allCorrect('B');
    answers[4] = Asmt.forms.B[4].a[1]; // wrong on the credit item
    const r = M.scoreAssessment('B', answers);
    assert.equal(r.score, 9);
    assert.equal(r.byTopic.credit.correct, 1);
    assert.equal(r.items[4].concept, 'min-payment');
  });
  test('improvement compares topics fairly across forms', () => {
    const pre = M.scoreAssessment('A', Asmt.forms.A.map((q) => q.a[(q.correct + 1) % q.a.length]));
    const post = M.scoreAssessment('B', allCorrect('B'));
    const imp = M.improvement(pre, post);
    assert.equal(imp.credit.pre, 0);
    assert.equal(imp.credit.post, 1);
    assert.equal(imp.credit.change, 1);
  });
  test('a topic is never "strong" with fewer than 3 answers', () => {
    const tm = M.topicMastery({ credit: [{ c: 'apr', ok: true }, { c: 'apr', ok: true }] });
    assert.equal(tm.credit.level, 'not-enough');
    const tm2 = M.topicMastery({ credit: [{ ok: true }, { ok: true }, { ok: true }] });
    assert.equal(tm2.credit.level, 'strong');
  });
  test('mastery uses the most recent answers', () => {
    const ev = { saving: [...Array(8)].map(() => ({ ok: false })).concat([...Array(8)].map(() => ({ ok: true }))) };
    assert.equal(M.topicMastery(ev).saving.score, 1);
  });
  test('run scores combine post-test items and in-game checks', () => {
    const s = M.runScores([{ topic: 'credit', correct: true }, { topic: 'credit', correct: false }], [{ topic: 'credit', correct: true }]);
    assert.equal(s.credit.total, 3);
    assert.approx(s.credit.score, 2 / 3, 1e-9);
    assert.equal(s.income.score, null);
  });
  test('missed concepts: a later correct answer clears an earlier miss', () => {
    const missed = M.missedConcepts([{ concept: 'apr', correct: false }, { concept: 'utilization', correct: false }, { concept: 'apr', correct: true }]);
    assert.deepEqual(missed, ['utilization']);
  });
  const LESSONS = [
    { id: 'net-price', topic: 'college', concepts: ['net-price'], order: 1 },
    { id: 'min-payments', topic: 'credit', concepts: ['min-payment', 'apr'], order: 2 },
    { id: 'budget', topic: 'budgeting', concepts: ['50-30-20'], order: 3 },
  ];
  test('recommendations: a missed concept outranks a weak topic', () => {
    const r = M.recommend(LESSONS, { missed: ['min-payment'], weakTopics: ['budgeting'] });
    assert.equal(r[0].lesson.id, 'min-payments');
    assert.equal(r[0].reason.kind, 'missed');
    assert.equal(r[1].lesson.id, 'budget');
  });
  test('recommendations: decisions can suggest a lesson, passed lessons drop out', () => {
    const r = M.recommend(LESSONS, { flags: ['apr'] });
    assert.equal(r[0].lesson.id, 'min-payments');
    assert.equal(r[0].reason.kind, 'decision');
    const r2 = M.recommend(LESSONS, { flags: ['apr'] }, { 'min-payments': { passed: true } });
    assert.equal(r2.length, 0);
  });
  test('recommendation reasons are readable sentences', () => {
    const r = M.recommend(LESSONS, { missed: ['min-payment'] });
    assert.ok(/minimum payments/.test(M.reasonText(r[0])));
  });
  test('lesson pass rule requires correct first-try answers', () => {
    assert.ok(M.lessonPassed(2, 3));
    assert.ok(!M.lessonPassed(1, 3));
    assert.ok(!M.lessonPassed(0, 0), 'clicking through with no answers is not a pass');
  });
  test('summary sentence names strengths and suggests a concept', () => {
    const scores = { budgeting: { score: 1, total: 4 }, credit: { score: 0.25, total: 4 }, college: { score: null, total: 0 } };
    const s = M.summarySentence(scores, ['min-payment']);
    assert.ok(/budgeting/.test(s) && /minimum payments/.test(s), s);
  });

  function fakeStorage() {
    const m = {};
    return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
  }
  test('progress persists between page loads', () => {
    const storage = fakeStorage();
    const a = Store.create(storage);
    a.update((d) => { d.lessons['net-price'] = { done: true, passed: true }; });
    const b = Store.create(storage);
    assert.ok(b.get().lessons['net-price'].passed);
    assert.equal(b.get().participant, a.get().participant);
  });
  test('reset clears progress but keeps the anonymous ID', () => {
    const s = Store.create(fakeStorage());
    const id = s.get().participant;
    s.update((d) => { d.reports.push({ id: 'r1' }); });
    s.reset();
    assert.equal(s.get().reports.length, 0);
    assert.equal(s.get().participant, id);
  });
  test('evidence list is capped so old answers age out', () => {
    const s = Store.create(fakeStorage());
    for (let i = 0; i < 30; i++) s.addEvidence('credit', 'apr', i % 2 === 0, 'test');
    assert.equal(s.get().evidence.credit.length, 16);
  });
  test('corrupted saved data falls back to a fresh profile', () => {
    const storage = fakeStorage();
    storage.setItem(Store.KEY, '{not json');
    const s = Store.create(storage);
    assert.equal(s.get().version, 4);
  });
  test('returning visits are detected on a new day', () => {
    const s = Store.create(fakeStorage());
    const day1 = Date.UTC(2026, 9, 1, 12), day3 = Date.UTC(2026, 9, 3, 12);
    assert.ok(!s.touch(day1).returning);
    assert.ok(!s.touch(day1 + 1000).returning, 'same day is not a return');
    assert.ok(s.touch(day3).returning);
  });
})();
