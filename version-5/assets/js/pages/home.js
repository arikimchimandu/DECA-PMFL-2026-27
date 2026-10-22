(function () {
  const C = window.Centsible, U = C.UI;
  U.mountShell('home');
  U.$$('[data-icon]').forEach((el) => { el.innerHTML = U.icon(el.dataset.icon, el.classList.contains('medal') ? 24 : 18); });

  const d = U.store.get();
  const done = Object.values(d.lessons).filter((l) => l.done).length;
  const cont = [];
  if (d.sim && d.sim.state && !d.sim.state.done) cont.push(`<a class="btn btn-gold" href="simulator.html">${U.icon('play', 18)} Continue your simulation</a>`);
  if (d.reports.length) cont.push(`<a class="btn btn-ghost" href="report.html?id=${encodeURIComponent(d.reports[0].id)}">${U.icon('chart', 18)} View your latest report</a>`);
  if (done) cont.push(`<a class="btn btn-ghost" href="progress.html">${U.icon('check', 18)} ${done} lesson${done === 1 ? '' : 's'} completed — see progress</a>`);
  U.$('#continue').innerHTML = cont.length ? `<div class="row">${cont.join('')}</div>` : '';

  U.$('#pathways').innerHTML = C.Lessons.PATHWAYS.map((p) => {
    const lessons = C.Lessons.LESSONS.filter((l) => l.pathway === p.id);
    const n = lessons.filter((l) => d.lessons[l.id] && d.lessons[l.id].done).length;
    return `<a class="card" href="academy.html#${p.id}">
      <span class="medal medal-mint">${U.icon(p.icon, 24)}</span>
      <h3 style="margin-top:14px">${p.title}</h3>
      <p class="muted small">${p.blurb}</p>
      <div class="progress" aria-label="${n} of ${lessons.length} lessons complete"><i style="width:${(n / lessons.length) * 100}%"></i></div>
      <p class="small muted" style="margin:6px 0 0">${n} of ${lessons.length} lessons</p></a>`;
  }).join('');

  const m = C.Missions.missionOfWeek();
  const mDone = d.missions[m.id] && d.missions[m.id].done;
  U.$('#mission').innerHTML = `
    <p class="eyebrow" style="color:var(--gold)">${U.icon('target', 16)} Money Mission of the week</p>
    <h3 style="font-size:1.5rem">${m.title}</h3>
    <p class="muted">${m.intro}</p>
    <p class="small muted">${U.icon('clock', 16)} About ${m.minutes} minutes${mDone ? ' · Completed' : ''}</p>
    <a class="btn btn-primary" href="mission.html?id=${m.id}">${mDone ? 'Play again' : 'Start mission'} ${U.icon('arrowR', 18)}</a>`;
})();
