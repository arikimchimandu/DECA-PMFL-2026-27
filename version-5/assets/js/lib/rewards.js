/* Centspire V5 — Challenge Score, answer accuracy, and reward claims (no DOM).
 *
 * Challenge Score: each simulator decision earns 0–1,000 points (see `points` on each decision in
 * engine.js). Paths have 13–18 decisions, so the total is scaled to 13 decisions — out of 13,000 —
 * which keeps the reward threshold fair for every path.
 *
 * Accuracy: first-try answers to the in-game quick checks plus the final knowledge check.
 *
 * Reward wording and thresholds live in config.js (`rewards`) so the team can change them once the
 * prizes are approved. A claim code lets the team verify a reward at the Centspire table.
 */
(function (root, factory) {
  const mod = factory(root, root.Centsible || {});
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Rewards = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, C) {
  const DEFAULTS = {
    enabled: true,
    decisionsBase: 13,
    accuracyThreshold: 0.95,     // must be MORE than this share of answers correct
    accuracyMinAnswers: 8,       // so answering one question can't earn a reward
    accuracyReward: '100 Centspire credit points',
    accuracyCredits: 100,
    scoreThreshold: 10000,       // Challenge Score must be MORE than this
    scoreReward: '',             // '' = no prize for the Challenge Score
    claimNote: 'Show this code at the Centspire table to claim your reward. One reward of each kind per student, while supplies last.',
  };
  const config = () => ({ ...DEFAULTS, ...(((root.CENTSIBLE_CONFIG || {}).rewards) || {}) });

  /** Points for every decision made in this run, scaled to `decisionsBase` decisions. */
  function challenge(state, base = config().decisionsBase) {
    const S = C.Sim;
    const per = (state.order || []).map((id) => {
      const pts = S.decisionPoints(state, id);
      return pts == null ? null : { node: id, title: S.nodeById(id).title, chapter: S.nodeById(id).chapter, points: pts };
    }).filter(Boolean);
    const raw = per.reduce((t, p) => t + p.points, 0);
    const n = per.length;
    return { per, raw, n, total: n ? Math.round((raw / n) * base) : 0, max: base * 1000 };
  }

  /** First-try accuracy across in-game checks and final knowledge-check items. */
  function accuracy(checks = [], postItems = []) {
    const all = [...checks, ...postItems];
    const correct = all.filter((x) => x.correct).length;
    return { correct, total: all.length, pct: all.length ? correct / all.length : 0 };
  }

  // FNV-1a hash → short, unambiguous code. Deterministic, so the same run always gets the same code.
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function hash(str, seed) {
    let h = seed >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function claimCode(runId, participant, score) {
    const s = `${runId}|${participant}|${score}`;
    let out = '';
    [2166136261, 2246822519].forEach((seed) => {
      let h = hash(s, seed);
      for (let i = 0; i < 4; i++) { out += ALPHABET[h % 32]; h = Math.floor(h / 32); }
    });
    return `CS-${out.slice(0, 4)}-${out.slice(4)}`;
  }

  /** Everything the report needs: score, accuracy, which rewards were earned, and a claim code. */
  function evaluate(state, { post = null, participant = '', cfg = config() } = {}) {
    const ch = challenge(state, cfg.decisionsBase);
    const acc = accuracy(state.checks, post ? post.items : []);
    const rewards = cfg.enabled ? [
      { id: 'accuracy', label: cfg.accuracyReward, credits: cfg.accuracyCredits,
        rule: `More than ${Math.round(cfg.accuracyThreshold * 100)}% of your answers correct (at least ${cfg.accuracyMinAnswers} answers)`,
        earned: acc.total >= cfg.accuracyMinAnswers && acc.pct > cfg.accuracyThreshold },
      ...(cfg.scoreReward ? [{ id: 'score', label: cfg.scoreReward, credits: 0,
        rule: `Challenge Score over ${cfg.scoreThreshold.toLocaleString('en-US')} (out of ${ch.max.toLocaleString('en-US')})`,
        earned: ch.total > cfg.scoreThreshold }] : []),
    ] : [];
    const earned = rewards.filter((r) => r.earned);
    return {
      challenge: ch,
      accuracy: acc,
      rewards,
      earned: earned.map((r) => r.id),
      claim: earned.length ? claimCode(state.runId, participant, ch.total) : null,
      claimNote: cfg.claimNote,
    };
  }

  return { DEFAULTS, config, challenge, accuracy, claimCode, evaluate };
});
