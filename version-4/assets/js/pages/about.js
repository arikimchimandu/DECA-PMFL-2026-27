(function () {
  const C = window.Centsible, U = C.UI;
  U.mountShell('about');
  U.$('#sources').innerHTML = C.Assumptions.sources.map((s) => `<li><a href="${s.url}" rel="noopener" target="_blank">${U.esc(s.label)}</a></li>`).join('');
})();
