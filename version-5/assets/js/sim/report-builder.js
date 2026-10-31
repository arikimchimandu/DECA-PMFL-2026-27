/* Centspire V5 — builds the Financial Future Report from a finished game (no DOM).
 * Learning scores come only from question responses (post-assessment + in-game checks).
 * Money results come from the simulator model and are illustrations, not predictions.
 */
(function (root, factory) {
  const mod = factory(root.Centsible || {});
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.ReportBuilder = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  function choiceLabel(node, value, m) {
    if (node.kind === 'allocate') return null;
    const o = node.options(m).find((x) => x.id === value);
    return o ? o.label : String(value);
  }

  /**
   * game: engine state (finished)
   * pre/post: results of Mastery.scoreAssessment (either may be null on replays)
   * passedLessons: progress.lessons (to avoid recommending lessons already passed)
   */
  function build(game, { pre = null, post = null, lessonsState = {}, now = Date.now(), sample = false, participant = '' } = {}) {
    const S = C.Sim, M = C.Mastery;
    const sum = S.summary(game);
    const m = sum.model;
    const scores = M.runScores(post ? post.items : [], game.checks);
    const allAnswers = [...(post ? post.items : []), ...game.checks];
    const missed = M.missedConcepts(allAnswers);
    const weakTopics = Object.entries(scores).filter(([, v]) => v.score != null && v.total >= 2 && v.score < 0.7).map(([t]) => t);
    const recs = M.recommend(C.Lessons.LESSONS, { missed, flags: sum.flags, weakTopics }, lessonsState, 3)
      .map((r) => ({ lesson: r.lesson.id, reason: M.reasonText(r), kind: r.reason.kind }));
    const ext = M.extremes(scores);
    const focusTopic = ext.weakest || weakTopics[0] || null;
    const mission = C.Missions.MISSIONS.find((x) => x.topic === focusTopic)
      || C.Missions.MISSIONS.find((x) => x.concepts.some((c) => missed.includes(c) || sum.flags.includes(c)))
      || C.Missions.missionOfWeek(new Date(now));

    const j = m.job;
    const path = game.order.map((id) => {
      const n = S.nodeById(id);
      return { node: id, chapter: n.chapter, title: n.title, choice: choiceLabel(n, game.choices[id], m) };
    }).filter((p) => p.choice);

    return {
      id: (sample ? 'sample-' : 'r-') + now.toString(36),
      createdAt: now,
      sample,
      runId: game.runId,
      college: m.college.col.name,
      job: `${j.job.title}, ${j.job.city}`,
      money: {
        studentDebt: m.loans.studentTotal,
        principal: m.loans.principalTotal,
        parentPlus: m.loans.plus,
        monthlyLoan: j.loanPayment,
        loanYears: j.fedYears,
        totalLoanInterest: j.fedSummary.totalInterest + j.privSummary.totalInterest,
        cardBalance: m.credit.balanceAtJob,
        cardInterest: m.credit.cardInterest,
        cosigned: m.credit.cosign,
        grossMonthly: j.pay.monthly.gross,
        netMonthly: j.pay.monthly.net,
        essentials: j.essentials,
        essentialTotal: j.essentialTotal,
        wants: j.wants,
        savings: j.saveMonthly,
        flexibility: j.flexibility,
        emergencyFund: j.fund,
        emergencyMonths: m.health.emergencyMonths,
        retirement: { contribution: j.contribution, match: j.match, projected: j.retireFV.total, years: j.yearsTo65 },
        health: m.health,
        car: m.teenCar ? { label: m.teenCar.label, financed: !!m.teenCar.apr, interest: m.teenCar.totalInterest, monthlyInCollege: m.teenCar.monthly } : null,
        scamLoss: m.school.scamLoss,
      },
      challenge: (() => { const r = C.Rewards ? C.Rewards.evaluate(game, { post, participant: sample ? 'sample' : participant }) : null; return r; })(),
      scores,
      checksAnswered: game.checks.length,
      improvement: pre && post ? M.improvement(pre, post) : null,
      review: ['pre', 'post'].map((k) => [k, k === 'pre' ? pre : post]).filter(([, x]) => x).map(([k, x]) => ({ phase: k, form: x.form, items: x.items.map((i) => ({ slot: i.slot, topic: i.topic, correct: i.correct, chosen: i.chosen ?? null })) })),
      assessment: { pre: pre ? { form: pre.form, score: pre.score, total: pre.total, confidence: pre.confidence ?? null } : null, post: post ? { form: post.form, score: post.score, total: post.total, confidence: post.confidence ?? null } : null },
      strongest: ext.strongest,
      weakest: ext.weakest,
      summary: M.summarySentence(scores, sum.flags),
      impacts: sum.impacts.slice(0, 3),
      flags: sum.flags,
      recommendations: recs,
      mission: mission ? mission.id : null,
      path,
    };
  }

  /** Fictional sample for the presenter demo: a fixed set of choices and answers. */
  function sample(now = Date.UTC(2026, 9, 1)) {
    const S = C.Sim;
    const plan = { c1_offers: 'whitmore', c1_housing: 'campus', c1_car: 'used-cash', c1_borrow: 'federal-first', c2_job: 10, c2_budget: 300, c2_laptop: 'refurb', c2_scam: 'portal',
      c3_card: 'student', c3_card_use: 'trip', c3_balance: 'minimum', c3_cosign: 'decline', c4_offer: 'riverton', c4_housing: 'roommate',
      c4_transport: 'keep', c4_repay: 'standard', c4_retire: 0.03, c4_budget: 400 };
    let st = S.newState(now);
    for (let n = S.next(st), guard = 0; n && guard < 30; n = S.next(st), guard++) st = S.choose(st, n.id, plan[n.id]).state;
    const wrongChecks = new Set(['c3_balance', 'c4_retire']);
    S.NODES.forEach((n) => { if (n.check && n.id in st.choices) st = S.recordCheck(st, n.id, !wrongChecks.has(n.id)); });
    const A = C.Assessments.forms;
    const preAnswers = A.A.map((q, i) => ([0, 2, 4, 5, 7, 8, 10].includes(i) ? q.a[(q.correct + 1) % q.a.length] : q.a[q.correct]));
    const postAnswers = A.B.map((q, i) => (i === 4 ? q.a[(q.correct + 1) % q.a.length] : q.a[q.correct]));
    const pre = C.Mastery.scoreAssessment('A', preAnswers), post = C.Mastery.scoreAssessment('B', postAnswers);
    return build(st, { pre, post, now, sample: true });
  }

  return { build, sample };
});
