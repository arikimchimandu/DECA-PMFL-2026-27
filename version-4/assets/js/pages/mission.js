/* Money Mission player: short branching scenario + concept check. */
(function () {
  const C = window.Centsible, U = C.UI;
  const { $, icon, esc, store } = U;
  U.mountShell('academy');
  const root = $('#mission');
  const m = C.Missions.byId(U.params.get('id'));
  if (!m) {
    root.innerHTML = `<div class="container section"><div class="card empty"><h2>Mission not found</h2><a class="btn btn-primary" href="academy.html#missions">See all missions</a></div></div>`;
    return;
  }
  document.title = `${m.title} — Money Mission`;
  const tones = { strong: ['tag-mint', 'Strong move', 'check'], ok: ['tag-gold', 'Reasonable', 'bulb'], risky: ['tag-coral', 'Risky', 'alert'] };
  const picks = [];
  let step = 0;

  root.innerHTML = `<div class="container section" style="max-width:780px">
    <nav aria-label="Breadcrumb" class="small" style="margin-bottom:12px"><a href="academy.html#missions">Money Missions</a></nav>
    <div class="row" style="gap:16px"><span class="medal medal-gold medal-lg">${icon(m.icon, 32)}</span>
      <div><p class="eyebrow" style="margin:0">Money Mission · about ${m.minutes} minutes</p><h1 style="font-size:clamp(1.8rem,4.5vw,2.6rem);margin:0">${esc(m.title)}</h1></div></div>
    <div class="callout callout-navy" style="margin-top:20px">${icon('target', 20)}<p>${esc(m.intro)}</p></div>
    <div class="progress" style="margin:20px 0 6px"><i id="bar"></i></div>
    <div id="steps" class="stack" style="margin-top:16px"></div>
  </div>`;

  function renderStep() {
    $('#bar').style.width = (step / (m.steps.length + 1)) * 100 + '%';
    const s = m.steps[step];
    const box = document.createElement('section');
    box.className = 'card';
    box.innerHTML = `<p class="eyebrow">Step ${step + 1} of ${m.steps.length}</p><h2 style="font-size:1.3rem" tabindex="-1">${esc(s.prompt)}</h2>
      <div class="options">${s.options.map((o, i) => `<button type="button" class="option" data-i="${i}"><span><span class="t">${esc(o.label)}</span></span></button>`).join('')}</div>
      <div class="fb" aria-live="polite"></div>`;
    $('#steps').appendChild(box);
    box.querySelector('h2').focus({ preventScroll: true });
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    box.querySelectorAll('.option').forEach((b) => b.addEventListener('click', () => {
      const o = s.options[+b.dataset.i];
      picks.push(o.tag);
      box.querySelectorAll('.option').forEach((x) => { x.setAttribute('aria-disabled', 'true'); x.disabled = true; if (x !== b) x.style.opacity = '.55'; });
      b.style.borderColor = 'var(--navy)';
      const [cls, label, ic] = tones[o.tag];
      box.querySelector('.fb').innerHTML = `<div class="feedback ${o.tag === 'risky' ? 'bad' : 'good'}" style="margin-top:12px">${icon(ic, 20)}<p><span class="tag ${cls}" style="margin-right:6px">${label}</span>${esc(o.result)}</p></div>
        <button class="btn btn-navy btn-sm" style="margin-top:12px">${step + 1 < m.steps.length ? 'Next step' : 'Final check'} ${icon('arrowR', 16)}</button>`;
      box.querySelector('.fb .btn').addEventListener('click', (e) => { e.target.closest('.btn').remove(); step++; step < m.steps.length ? renderStep() : finalCheck(); });
    }));
  }

  function finalCheck() {
    $('#bar').style.width = (m.steps.length / (m.steps.length + 1)) * 100 + '%';
    const box = document.createElement('section');
    box.className = 'card';
    $('#steps').appendChild(box);
    U.question(box, m.check, {
      label: 'Final check',
      onAnswer: (ok) => {
        U.recordAnswer(m.topic, m.check.concept, ok, 'mission');
        const strong = picks.filter((t) => t === 'strong').length;
        store.update((d) => { d.missions[m.id] = { done: true, correct: ok, strong, steps: picks.length, at: Date.now(), plays: ((d.missions[m.id] || {}).plays || 0) + 1 }; });
        C.Analytics.log('mission_complete', store.get().participant, 'mission', { mission: m.id, correct: ok, strong, steps: picks.length });
        $('#bar').style.width = '100%';
        const done = document.createElement('section');
        done.className = 'card card-navy on-navy';
        const lesson = C.Lessons.LESSONS.find((l) => l.concepts.includes(m.check.concept));
        done.innerHTML = `<div class="row" style="gap:16px"><span class="medal medal-mint medal-lg">${icon('award', 30)}</span>
          <div style="flex:1;min-width:200px"><h2 style="margin:0">Mission complete</h2><p class="muted" style="margin:4px 0 0">${strong} of ${picks.length} decisions were strong moves. ${esc(m.takeaway)}</p></div></div>
          <div class="row" style="margin-top:18px">
            ${lesson ? `<a class="btn btn-primary" href="lesson.html?id=${lesson.id}">${icon('notebook', 18)} Related lesson: ${esc(lesson.title)}</a>` : ''}
            <a class="btn btn-ghost" href="mission.html?id=${m.id}">${icon('replay', 18)} Try different choices</a>
            <a class="btn btn-ghost" href="academy.html#missions">More missions</a>
          </div>`;
        setTimeout(() => { $('#steps').appendChild(done); done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
      },
    });
    box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  renderStep();
})();
