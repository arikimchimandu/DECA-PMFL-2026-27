/* Centsible V4 — learning scores and lesson recommendations.
 *
 * Scores come only from answers to questions (assessments, in-game concept checks, lesson and
 * mission questions) — never from how much money a player ends with, and never from simply
 * opening a lesson. A topic needs at least MIN_EVIDENCE answers before we call it strong.
 */
(function (root, factory) {
  const mod = factory(root.Centsible || {});
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Mastery = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  const MIN_EVIDENCE = 3;
  const RECENT = 8;
  const STRONG = 0.8;
  const DEVELOPING = 0.6;
  const LESSON_PASS = 2 / 3;

  const topics = () => C.Assessments.TOPICS.map((t) => t.id);
  const objective = (slot) => C.Assessments.OBJECTIVES.find((o) => o.slot === slot);

  /** Score one assessment. answers[i] is the chosen answer TEXT for item i of the form. */
  function scoreAssessment(formId, answers) {
    const form = C.Assessments.forms[formId];
    const byTopic = {};
    topics().forEach((t) => { byTopic[t] = { correct: 0, total: 0 }; });
    const items = form.map((item, i) => {
      const o = objective(item.slot);
      const correct = answers[i] === item.a[item.correct];
      byTopic[o.topic].total++;
      if (correct) byTopic[o.topic].correct++;
      return { slot: item.slot, topic: o.topic, concept: o.concept, correct };
    });
    const score = items.filter((x) => x.correct).length;
    return { form: formId, score, total: items.length, byTopic, items };
  }

  function level(score, n) {
    if (n < MIN_EVIDENCE) return 'not-enough';
    if (score >= STRONG) return 'strong';
    if (score >= DEVELOPING) return 'developing';
    return 'review';
  }
  const LEVEL_LABEL = { strong: 'Strong', developing: 'Developing', review: 'Worth reviewing', 'not-enough': 'Not enough answers yet' };

  /** Rolling mastery per topic from stored evidence (most recent answers count). */
  function topicMastery(evidence) {
    const out = {};
    topics().forEach((t) => {
      const list = (evidence && evidence[t]) || [];
      const recent = list.slice(-RECENT);
      const n = recent.length;
      const score = n ? recent.filter((e) => e.ok).length / n : null;
      out[t] = { score, n, level: level(score ?? 0, n), label: LEVEL_LABEL[level(score ?? 0, n)] };
    });
    return out;
  }

  /** Learning scores for one playthrough: post-assessment items + the run's in-game checks. */
  function runScores(postItems, simChecks) {
    const out = {};
    topics().forEach((t) => { out[t] = { correct: 0, total: 0 }; });
    (postItems || []).forEach((i) => { out[i.topic].total++; if (i.correct) out[i.topic].correct++; });
    (simChecks || []).forEach((i) => { out[i.topic].total++; if (i.correct) out[i.topic].correct++; });
    Object.values(out).forEach((v) => {
      v.score = v.total ? v.correct / v.total : null;
      v.level = level(v.score ?? 0, v.total);
      v.label = LEVEL_LABEL[v.level];
    });
    return out;
  }

  /** Pre → post change per topic (percentage points). Only meaningful when both exist. */
  function improvement(pre, post) {
    const out = {};
    topics().forEach((t) => {
      const a = pre && pre.byTopic[t], b = post && post.byTopic[t];
      const pa = a && a.total ? a.correct / a.total : null;
      const pb = b && b.total ? b.correct / b.total : null;
      out[t] = { pre: pa, post: pb, change: pa != null && pb != null ? pb - pa : null };
    });
    return out;
  }

  /** Strongest and weakest topics among those with enough evidence. */
  function extremes(scores) {
    const ranked = Object.entries(scores)
      .filter(([, v]) => v.score != null && (v.total ?? v.n) >= 2)
      .sort((a, b) => b[1].score - a[1].score);
    if (!ranked.length) return { strongest: null, weakest: null };
    const strongest = ranked[0];
    const weakest = ranked[ranked.length - 1];
    return {
      strongest: strongest[0],
      weakest: weakest[1].score < STRONG && weakest[0] !== strongest[0] ? weakest[0] : null,
    };
  }

  /** Concepts missed and not since answered correctly (latest answer per concept is wrong). */
  function missedConcepts(answerList) {
    const latest = {};
    (answerList || []).forEach((a) => { latest[a.concept || a.c] = a.correct ?? a.ok; });
    return Object.entries(latest).filter(([, ok]) => !ok).map(([c]) => c);
  }

  /**
   * Recommend up to `limit` lessons.
   * signals: { missed: [concept], flags: [concept], weakTopics: [topic] }
   * lessonsState: progress.lessons (passed lessons are skipped unless nothing else fits)
   */
  function recommend(lessons, signals, lessonsState = {}, limit = 3) {
    const missed = new Set(signals.missed || []);
    const flags = new Set(signals.flags || []);
    const weak = new Set(signals.weakTopics || []);
    const scored = lessons.map((L) => {
      let score = 0, reason = null;
      const m = L.concepts.find((c) => missed.has(c));
      const f = L.concepts.find((c) => flags.has(c));
      if (m) { score += 3; reason = { kind: 'missed', concept: m }; }
      if (f) { score += 2; reason = reason || { kind: 'decision', concept: f }; }
      if (weak.has(L.topic)) { score += 1; reason = reason || { kind: 'topic', topic: L.topic }; }
      const st = lessonsState[L.id];
      if (st && st.passed) score -= 4;
      return { lesson: L, score, reason };
    }).filter((x) => x.score > 0 && x.reason);
    scored.sort((a, b) => b.score - a.score || a.lesson.order - b.lesson.order);
    return scored.slice(0, limit);
  }

  /** Plain-language reason for a recommendation. */
  function reasonText(rec) {
    const r = rec.reason;
    const label = r.concept ? C.Concepts[r.concept].label : null;
    if (r.kind === 'missed') return `You missed a question about ${label}. This lesson walks through it step by step.`;
    if (r.kind === 'decision') return `One of your game decisions involved ${label}. This lesson shows what that choice really costs.`;
    const t = C.Assessments.TOPICS.find((x) => x.id === r.topic);
    return `${t.label} was one of your lower-scoring topics. This lesson builds the basics.`;
  }

  /** Lesson pass rule: first-try answers, not just finishing the lesson. */
  function lessonPassed(correct, total) { return total > 0 && correct / total >= LESSON_PASS - 1e-9; }

  /** Encouraging summary sentence for the report. */
  function summarySentence(scores, flags) {
    const { strongest, weakest } = extremes(scores);
    const T = (id) => C.Assessments.TOPICS.find((t) => t.id === id).label.toLowerCase();
    if (!strongest) return 'Answer a few more questions to see your strengths.';
    const top = scores[strongest].score;
    if (top < DEVELOPING) {
      return `Every topic here is still new territory — that’s exactly what Centsible is for. A great place to start is ${T(weakest || strongest)}.`;
    }
    let s = top >= STRONG ? `You showed a strong understanding of ${T(strongest)}` : `Your strongest area so far is ${T(strongest)}`;
    if (weakest) {
      const flag = (flags || []).find((f) => C.Concepts[f] && C.Concepts[f].topic === weakest);
      s += flag
        ? `, and your decisions suggest that learning more about ${C.Concepts[flag].label} could help.`
        : `. Spending a few minutes on ${T(weakest)} is the best next step.`;
    } else s += ' across the board. Nice work.';
    return s;
  }

  return {
    MIN_EVIDENCE, STRONG, DEVELOPING, LEVEL_LABEL,
    scoreAssessment, topicMastery, runScores, improvement, extremes, missedConcepts,
    recommend, reasonText, lessonPassed, summarySentence, level,
  };
});
