(function () {
  const C = window.Centsible, U = C.UI;
  U.mountShell('about');
  U.$('#sources').innerHTML = C.Assumptions.sources.map((s) => `<li><a href="${s.url}" rel="noopener" target="_blank">${U.esc(s.label)}</a></li>`).join('');
  const rc = C.Rewards.config();
  const rw = U.$('#rewards');
  if (!rc.enabled) rw.remove();
  else {
    U.$('#rw-acc').textContent = `More than ${Math.round(rc.accuracyThreshold * 100)}% of your quick-check and final knowledge-check answers correct on the first try (at least ${rc.accuracyMinAnswers} answers): ${rc.accuracyReward}.`;
    U.$('#rw-score').textContent = `Challenge Score over ${rc.scoreThreshold.toLocaleString('en-US')}: ${rc.scoreReward}.`;
  }
})();
