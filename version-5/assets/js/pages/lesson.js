/* Lesson player: explanation → example → interactive → questions → completion. */
(function () {
  const C = window.Centsible, U = C.UI, M = C.Mastery;
  const { $, icon, esc, store } = U;
  U.mountShell('academy');
  const root = $('#lesson');
  const L = C.Lessons.byId(U.params.get('id'));
  if (!L) {
    root.innerHTML = `<div class="container section"><div class="card empty"><h2>Lesson not found</h2><p>It may have moved.</p><a class="btn btn-primary" href="academy.html">Back to the Academy</a></div></div>`;
    return;
  }
  document.title = `${L.title} — Centspire Academy`;
  const P = C.Lessons.PATHWAYS.find((p) => p.id === L.pathway);
  const siblings = C.Lessons.LESSONS.filter((x) => x.pathway === L.pathway);
  const idx = siblings.indexOf(L);
  const nextLesson = siblings[idx + 1] || C.Lessons.LESSONS[C.Lessons.LESSONS.indexOf(L) + 1] || null;
  const prev = store.get().lessons[L.id];
  const mission = C.Missions.MISSIONS.find((m) => m.concepts.some((c) => L.concepts.includes(c)));

  root.innerHTML = `
    <div class="container section-tight">
      <nav aria-label="Breadcrumb" class="small"><a href="academy.html">Academy</a> › <a href="academy.html#${P.id}">${P.title}</a></nav>
    </div>
    <div class="container lesson-layout" style="padding-bottom:48px">
      <article class="lesson-body">
        <p class="eyebrow">${icon('clock', 14)} ${L.minutes} minute lesson · ${P.title}</p>
        <h1 style="font-size:clamp(1.9rem,4.5vw,2.8rem)">${esc(L.title)}</h1>
        <p class="lead">${esc(L.hook)}</p>
        ${prev && prev.done ? `<p><span class="tag ${prev.passed ? 'tag-mint' : 'tag-gold'}">${icon('check', 14)} You completed this lesson${prev.passed ? '' : ' — try the questions again to strengthen it'}</span></p>` : ''}

        <h2 id="idea">${icon('bulb', 22)} The idea</h2>
        <div class="prose">${L.explain}</div>

        <h2 id="example">${icon('user', 22)} Real-world example</h2>
        <div class="example prose">${L.example}</div>

        <h2 id="try">${icon('calc', 22)} Try it</h2>
        <div class="widget" id="widget"></div>

        <h2 id="check">${icon('target', 22)} Check your understanding</h2>
        <p class="muted small">Your first answer to each question counts toward your learning scores.</p>
        <div class="stack" id="questions"></div>
        <div id="done" aria-live="polite"></div>
      </article>
      <aside class="toc no-print" aria-label="In this lesson">
        <div class="card" style="padding:18px">
          <p class="eyebrow" style="margin-bottom:10px">In this lesson</p>
          <ol>
            <li><a href="#idea">${icon('bulb', 16)} The idea</a></li>
            <li><a href="#example">${icon('user', 16)} Example</a></li>
            <li><a href="#try">${icon('calc', 16)} Try it</a></li>
            <li><a href="#check">${icon('target', 16)} Questions</a></li>
          </ol>
          <hr class="rule" style="margin:14px 0">
          <p class="small muted" style="margin:0">Lesson ${idx + 1} of ${siblings.length} in ${P.title}</p>
          <div class="progress" style="margin-top:8px"><i style="width:${((idx + 1) / siblings.length) * 100}%"></i></div>
        </div>
      </aside>
    </div>`;

  C.Widgets.mount($('#widget'), L.widget);

  const results = new Array(L.questions.length).fill(null);
  L.questions.forEach((q, i) => {
    const box = document.createElement('div');
    box.className = 'card';
    $('#questions').appendChild(box);
    U.question(box, q, {
      label: `Question ${i + 1} of ${L.questions.length}`,
      onAnswer: (ok) => {
        results[i] = ok;
        U.recordAnswer(L.topic, q.concept, ok, 'lesson');
        if (results.every((r) => r !== null)) complete();
      },
    });
  });

  function complete() {
    const correct = results.filter(Boolean).length, total = results.length;
    const passed = M.lessonPassed(correct, total);
    const before = store.get().lessons[L.id];
    store.update((d) => {
      const old = d.lessons[L.id];
      d.lessons[L.id] = {
        done: true,
        passed: passed || !!(old && old.passed),
        firstTry: old && old.firstTry ? old.firstTry : { correct, total },
        last: { correct, total },
        attempts: (old && old.attempts ? old.attempts : 0) + 1,
        at: Date.now(),
      };
    });
    C.Analytics.log('lesson_complete', store.get().participant, 'lesson', { lesson: L.id, correct, total, passed, attempt: (before && before.attempts ? before.attempts : 0) + 1 });
    $('#done').innerHTML = `
      <div class="card ${passed ? 'card-navy on-navy' : ''}" style="margin-top:20px">
        <div class="row" style="gap:16px"><span class="medal ${passed ? 'medal-mint' : 'medal-gold'} medal-lg">${icon(passed ? 'check' : 'bulb', 30)}</span>
          <div style="flex:1;min-width:200px"><h2 style="margin:0">${passed ? 'Lesson complete' : 'Lesson complete — worth another look'}</h2>
          <p class="${passed ? 'muted' : ''}" style="margin:4px 0 0">You got ${correct} of ${total} right. ${passed ? 'Nice work — this counts toward your learning scores.' : 'Re-read the example, try the activity again, then retake the questions to lock it in.'}</p></div></div>
        <div class="row" style="margin-top:18px">
          ${!passed ? `<button class="btn btn-gold" id="retry">${icon('replay', 18)} Retake the questions</button>` : ''}
          ${nextLesson ? `<a class="btn ${passed ? 'btn-primary' : 'btn-navy'}" href="lesson.html?id=${nextLesson.id}">Next: ${esc(nextLesson.title)} ${icon('arrowR', 18)}</a>` : ''}
          ${mission ? `<a class="btn btn-ghost" href="mission.html?id=${mission.id}">${icon('target', 18)} Practice: ${esc(mission.title)}</a>` : ''}
          <a class="btn btn-ghost" href="academy.html">Back to the Academy</a>
        </div>
      </div>`;
    const retry = $('#retry');
    if (retry) retry.onclick = () => location.reload();
    $('#done').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }
})();
