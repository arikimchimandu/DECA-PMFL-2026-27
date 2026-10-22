/* Centspire Academy hub: recommended lessons, pathways, and missions. */
(function () {
  const C = window.Centsible, U = C.UI, M = C.Mastery;
  const { $, icon, esc, store } = U;
  U.mountShell('academy');
  const d = store.get();
  const L = C.Lessons;

  const status = (id) => {
    const s = d.lessons[id];
    if (!s || !s.done) return { tag: '', label: 'Not started' };
    return s.passed ? { tag: 'tag-mint', label: 'Completed' } : { tag: 'tag-gold', label: 'Completed · review suggested' };
  };

  // Recommendations from everything we know so far
  const allAnswers = Object.values(d.evidence).flat().map((e) => ({ concept: e.c, correct: e.ok }));
  const mastery = M.topicMastery(d.evidence);
  const weakTopics = Object.entries(mastery).filter(([, v]) => v.n >= 2 && v.score < 0.7).map(([t]) => t);
  const recs = M.recommend(L.LESSONS, { missed: M.missedConcepts(allAnswers), flags: Object.keys(d.flags), weakTopics }, d.lessons, 3);
  const nextUp = L.LESSONS.find((x) => !(d.lessons[x.id] && d.lessons[x.id].done));
  const doneCount = L.LESSONS.filter((x) => d.lessons[x.id] && d.lessons[x.id].done).length;
  const week = C.Missions.missionOfWeek();

  $('#academy').innerHTML = `
    <section class="hero on-navy"><div class="container" style="padding-top:56px;padding-bottom:56px">
      <p class="eyebrow" style="color:var(--gold)">Centspire Academy</p>
      <h1 style="max-width:20ch">Money skills, a few minutes at a time</h1>
      <p class="lead">${L.LESSONS.length} lessons in ${L.PATHWAYS.length} pathways. Each takes 2–4 minutes and ends with questions that show what you’ve really learned.</p>
      <div class="row" style="margin-top:18px">
        ${nextUp ? `<a class="btn btn-primary" href="lesson.html?id=${nextUp.id}">${icon('play', 18)} ${doneCount ? 'Continue' : 'Start'}: ${esc(nextUp.title)}</a>` : `<span class="tag tag-mint">${icon('check', 14)} All lessons complete</span>`}
        <span class="small" style="color:var(--muted-on-navy)">${doneCount} of ${L.LESSONS.length} lessons completed</span>
      </div>
    </div></section>

    <div class="container section stack">
      ${recs.length ? `<section aria-labelledby="rec-h"><p class="eyebrow">${icon('target', 14)} Picked for you</p><h2 id="rec-h">Recommended next</h2>
        <div class="grid grid-3" style="margin-top:12px">${recs.map((x) => `<div class="rec"><span class="tag tag-mint">${icon('clock', 14)} ${x.lesson.minutes} min</span><h3>${esc(x.lesson.title)}</h3><p class="small" style="margin:0">${esc(M.reasonText(x))}</p><a class="btn btn-navy btn-sm" style="justify-self:start" href="lesson.html?id=${x.lesson.id}">Start ${icon('arrowR', 16)}</a></div>`).join('')}</div></section>` : ''}

      <section class="card card-navy on-navy" aria-labelledby="week-h">
        <div class="row" style="align-items:flex-start;gap:20px">
          <span class="medal medal-gold medal-lg">${icon(week.icon, 32)}</span>
          <div style="flex:1;min-width:220px"><p class="eyebrow" style="color:var(--gold)">Money Mission of the week</p><h2 id="week-h" style="margin-bottom:6px">${esc(week.title)}</h2><p class="muted" style="margin:0">${esc(week.intro)}</p></div>
          <a class="btn btn-primary" href="mission.html?id=${week.id}">${d.missions[week.id] && d.missions[week.id].done ? 'Play again' : 'Start mission'} ${icon('arrowR', 18)}</a>
        </div>
      </section>

      <nav class="pill-nav" aria-label="Pathways">${L.PATHWAYS.map((p) => `<a href="#${p.id}">${p.title}</a>`).join('')}<a href="#missions">All missions</a></nav>

      ${L.PATHWAYS.map((p) => {
        const lessons = L.LESSONS.filter((x) => x.pathway === p.id);
        const n = lessons.filter((x) => d.lessons[x.id] && d.lessons[x.id].done).length;
        return `<section id="${p.id}" class="card" aria-labelledby="${p.id}-h">
          <div class="row" style="gap:16px"><span class="medal medal-mint">${icon(p.icon, 24)}</span>
            <div style="flex:1;min-width:200px"><h2 id="${p.id}-h" style="margin:0;font-size:1.4rem">${p.title}</h2><p class="muted small" style="margin:2px 0 0">${p.blurb}</p></div>
            <span class="small muted">${n}/${lessons.length} done</span></div>
          <div class="progress" style="margin:14px 0 6px"><i style="width:${(n / lessons.length) * 100}%"></i></div>
          <div class="grid grid-3" style="margin-top:14px">${lessons.map((x, i) => { const st = status(x.id); return `<a class="card card-cream" href="lesson.html?id=${x.id}">
            <span class="small muted">Lesson ${i + 1} · ${x.minutes} min</span><h3 style="margin:6px 0 6px;font-size:1.08rem">${esc(x.title)}</h3>
            <p class="small muted" style="margin:0 0 10px">${esc(x.hook)}</p>${st.tag ? `<span class="tag ${st.tag}">${icon('check', 14)} ${st.label}</span>` : `<span class="tag">${st.label}</span>`}</a>`; }).join('')}</div>
        </section>`;
      }).join('')}

      <section id="missions" aria-labelledby="m-h"><p class="eyebrow">Practice</p><h2 id="m-h">Money Missions</h2><p class="muted">3–5 minute scenarios. Make the calls, see the consequences, and check your thinking.</p>
        <div class="grid grid-3" style="margin-top:12px">${C.Missions.MISSIONS.map((m) => { const st = d.missions[m.id]; return `<a class="card" href="mission.html?id=${m.id}">
          <span class="medal medal-gold">${icon(m.icon, 22)}</span><h3 style="margin:12px 0 6px;font-size:1.08rem">${esc(m.title)}</h3>
          <p class="small muted" style="margin:0 0 10px">${esc(m.intro)}</p>
          <span class="tag ${st && st.done ? 'tag-mint' : ''}">${st && st.done ? `${icon('check', 14)} Completed` : `${icon('clock', 14)} ${m.minutes} min`}</span></a>`; }).join('')}</div></section>
    </div>`;
})();
