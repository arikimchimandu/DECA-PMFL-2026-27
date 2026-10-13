/* Financial Future Report page. */
(function () {
  const C = window.Centsible, U = C.UI, F = C.Finance, M = C.Mastery;
  const { $, icon, esc, store } = U;
  const money = F.money;
  U.mountShell('progress');
  const root = $('#report');
  const TOPICS = C.Assessments.TOPICS;
  const topicLabel = (id) => (TOPICS.find((t) => t.id === id) || {}).label || id;

  // Which report?
  let r = null;
  const id = U.params.get('id');
  if (U.params.get('sample') === '1') r = C.ReportBuilder.sample();
  else if (U.demo) { try { r = JSON.parse(sessionStorage.getItem('centsible_demo_report')); } catch {} if (!r || (id && r.id !== id)) r = C.ReportBuilder.sample(); }
  else r = id ? store.report(id) : store.get().reports[0];

  if (!r) {
    root.innerHTML = `<div class="container section"><div class="card empty"><span class="medal medal-cream medal-lg">${icon('chart', 30)}</span>
      <h2>No report yet</h2><p>Finish the Financial Life Simulator to get your personalized Financial Future Report.</p>
      <a class="btn btn-primary" href="simulator.html">${icon('play', 18)} Play the simulator</a></div></div>`;
    return;
  }
  const mny = r.money;
  const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const lvlTag = (v) => (v.level === 'strong' ? 'tag-mint' : v.level === 'developing' ? 'tag-gold' : v.level === 'review' ? 'tag-coral' : '');

  const budgetParts = [
    ['Rent + utilities', mny.essentials.rent + mny.essentials.utilities, 'c-navy'],
    ['Student loans', mny.essentials.studentLoans, 'c-navy3'],
    ['Transportation', mny.essentials.transport, 'c-coral'],
    ['Food + phone' + (mny.essentials.creditCard ? ' + card' : ''), mny.essentials.groceries + mny.essentials.phone + mny.essentials.creditCard, 'c-cream'],
    ['Wants', mny.wants, 'c-gold'],
    ['Savings', mny.savings, 'c-mint'],
  ];
  const net = Math.max(1, mny.netMonthly);
  const answersN = Object.values(r.scores).reduce((t, v) => t + v.total, 0);

  root.innerHTML = `
  <section class="report-hero on-navy">
    <div class="container">
      ${r.sample ? `<div class="callout callout-gold" style="margin-bottom:18px;color:var(--navy)">${icon('presentation', 20)}<p><b>Sample report — fictional student.</b> This example shows what students receive. It is not real participant data.</p></div>` : ''}
      <p class="eyebrow" style="color:var(--gold)">Financial Future Report · ${date}</p>
      <h1 style="max-width:18ch">${r.sample ? 'Sample' : 'Your'} financial future at 22</h1>
      <p class="lead">${esc(r.college)} → ${esc(r.job)}</p>
      <div class="callout callout-navy" style="background:var(--navy-2);max-width:760px;margin-top:16px">${icon('bulb', 20)}<p>${esc(r.summary)}</p></div>
      <div class="row no-print" style="margin-top:22px">
        <a class="btn btn-primary" href="#recs">${icon('notebook', 18)} See recommended lessons</a>
        <button class="btn btn-ghost" id="print">${icon('print', 18)} Print or save as PDF</button>
        <a class="btn btn-ghost" href="simulator.html">${icon('replay', 18)} Play a different path</a>
      </div>
      ${!r.sample && !U.demo ? '<p class="small muted" style="margin-top:12px">Saved on this device. You can come back to it anytime from My Progress.</p>' : ''}
    </div>
  </section>

  <div class="container section stack">
    <section aria-labelledby="money-h">
      <p class="eyebrow">Your money picture</p>
      <h2 id="money-h">Where your choices led</h2>
      <p class="muted small">Illustrative results from the simulation’s hypothetical prices — not a prediction of your real future.</p>
      <div class="grid grid-3" style="margin-top:14px">
        <div class="stat card"><span class="k">Student loans at graduation</span><span class="v">${money(mny.studentDebt)}</span><span class="s">${money(mny.principal)} borrowed + interest that built up in school${mny.parentPlus ? ` · plus ${money(mny.parentPlus)} Parent PLUS owed by your parent` : ''}</span></div>
        <div class="stat card"><span class="k">Monthly student loan payment</span><span class="v">${money(mny.monthlyLoan)}</span><span class="s">About ${money(mny.totalLoanInterest)} in interest over the life of the loans</span></div>
        <div class="stat card"><span class="k">Take-home pay</span><span class="v">${money(mny.netMonthly)}<span class="small">/mo</span></span><span class="s">From ${money(mny.grossMonthly)} gross after estimated taxes</span></div>
        <div class="stat card"><span class="k">Financial flexibility</span><span class="v" style="color:${mny.flexibility >= 500 ? 'var(--mint-ink)' : mny.flexibility >= 0 ? 'var(--gold-ink)' : 'var(--coral-ink)'}">${money(mny.flexibility)}<span class="small">/mo</span></span><span class="s">Left after rent, loans, transportation, food, and bills</span></div>
        <div class="stat card"><span class="k">Emergency savings</span><span class="v">${money(mny.emergencyFund)}</span><span class="s">${mny.emergencyMonths.toFixed(1)} months of essential expenses (goal: 3–6)</span></div>
        <div class="stat card"><span class="k">Game Financial Health</span><span class="v">${mny.health.score}<span class="small">/100</span></span><span class="s">A teaching score for this game — not a credit score</span></div>
      </div>
    </section>

    <section class="card" aria-labelledby="budget-h">
      <h3 id="budget-h">${icon('chart', 20)} Projected monthly budget</h3>
      <div class="stack-bar" style="margin-top:10px">${budgetParts.map(([, v, c]) => `<i class="${c}" style="width:${(Math.max(0, v) / net) * 100}%"></i>`).join('')}</div>
      <div class="legend">${budgetParts.map(([l, v, c]) => `<span><i class="${c}"></i>${l}: ${money(v)}</span>`).join('')}</div>
      ${mny.cardBalance > 0 ? `<p class="small" style="margin:12px 0 0">${icon('card', 16)} You start your job still owing ${money(mny.cardBalance)} on a credit card.</p>` : ''}
      ${mny.cosigned ? `<p class="small" style="margin:6px 0 0">${icon('user', 16)} You co-signed a $6,000 loan — it appears on your credit report too.</p>` : ''}
      ${mny.retirement.contribution ? `<p class="small" style="margin:6px 0 0">${icon('coins', 16)} Retirement: ${money(mny.retirement.contribution)}/mo from you + ${money(mny.retirement.match)}/mo employer match. At an illustrative 6% return that could grow to about ${money(mny.retirement.projected)} by 65 (not guaranteed).</p>` : ''}
    </section>

    <section class="grid grid-2" style="align-items:start">
      <div class="card" aria-labelledby="scores-h">
        <h3 id="scores-h">${icon('target', 20)} Learning scores by topic</h3>
        <p class="small muted">Based on ${answersN} answers from your ${r.assessment.post ? 'final knowledge check and ' : ''}in-game quick checks — not on how much money you ended with.</p>
        ${TOPICS.map((t) => {
          const v = r.scores[t.id], imp = r.improvement && r.improvement[t.id];
          return `<div class="topic-score"><span class="name"><span class="medal medal-cream" style="width:34px;height:34px">${icon(t.icon, 18)}</span>${t.label}</span>
            <span>${v.total ? `<b>${v.correct}/${v.total}</b> <span class="tag ${lvlTag(v)}">${v.label}</span>` : '<span class="small muted">No questions yet</span>'}</span>
            <div class="progress"><i style="width:${(v.score || 0) * 100}%;background:${v.level === 'review' ? 'var(--coral)' : v.level === 'developing' ? 'var(--gold)' : 'var(--mint)'}"></i></div>
            ${imp && imp.pre != null ? `<span class="small muted" style="grid-column:1/-1">Before: ${U.pct(imp.pre)} → After: ${U.pct(imp.post)}</span>` : ''}</div>`;
        }).join('')}
        ${r.assessment.pre && r.assessment.post ? `<div class="callout callout-mint" style="margin-top:14px">${icon('trend', 20)}<p>Knowledge check: <b>${r.assessment.pre.score}/${r.assessment.pre.total}</b> before → <b>${r.assessment.post.score}/${r.assessment.post.total}</b> after (two different but equivalent question sets).</p></div>` : ''}
      </div>
      <div class="card" aria-labelledby="impact-h">
        <h3 id="impact-h">${icon('trend', 20)} Your most consequential decisions</h3>
        ${r.impacts.length ? r.impacts.map((i) => `<div class="decision-impact"><span class="medal medal-gold" style="width:40px;height:40px">${icon('alert', 18)}</span>
          <div><b>${esc(i.title)}</b><p class="small" style="margin:4px 0 0">${esc(i.text)}</p></div><span class="spacer"></span><span class="amt">${money(Math.abs(i.amount))}</span></div>`).join('')
          : '<p class="muted">None of your choices created a large extra cost. Nice planning.</p>'}
        <p class="small muted" style="margin-top:10px">Dollar amounts compare your choice with a lower-cost option in the game. Lower cost isn’t always better — many choices had real tradeoffs.</p>
      </div>
    </section>

    <section id="recs" aria-labelledby="recs-h">
      <p class="eyebrow">Keep learning</p>
      <h2 id="recs-h">Recommended for you</h2>
      <div class="grid grid-3" style="margin-top:12px">
        ${r.recommendations.map((x) => { const L = C.Lessons.byId(x.lesson); return L ? `<div class="rec"><span class="tag tag-mint">${icon('clock', 14)} ${L.minutes} min lesson</span><h3>${esc(L.title)}</h3><p class="small" style="margin:0">${esc(x.reason)}</p><a class="btn btn-navy btn-sm" href="lesson.html?id=${L.id}" style="justify-self:start">Start lesson ${icon('arrowR', 16)}</a></div>` : ''; }).join('')
          || `<div class="rec"><h3>You’re in great shape</h3><p class="small" style="margin:0">Explore any Academy pathway to go deeper.</p><a class="btn btn-navy btn-sm" href="academy.html" style="justify-self:start">Browse the Academy</a></div>`}
        ${(() => { const mi = C.Missions.byId(r.mission); return mi ? `<div class="rec" style="background:var(--navy);color:var(--cream);border-color:var(--navy)"><span class="tag tag-gold">${icon('target', 14)} Practice scenario</span><h3>${esc(mi.title)}</h3><p class="small" style="margin:0;color:var(--muted-on-navy)">Try a new ${esc(topicLabel(mi.topic).toLowerCase())} scenario and see how your thinking has changed.</p><a class="btn btn-primary btn-sm" href="mission.html?id=${mi.id}" style="justify-self:start">Start mission ${icon('arrowR', 16)}</a></div>` : ''; })()}
      </div>
    </section>

    <section class="card" aria-labelledby="path-h">
      <details class="more"><summary id="path-h">${icon('calendar', 18)} Your full path (${r.path.length} decisions)</summary>
      <ol style="margin-top:12px">${r.path.map((p) => `<li><b>${esc(p.title)}:</b> ${esc(p.choice)}</li>`).join('')}</ol></details>
    </section>

    ${!r.sample && !U.demo ? `<section class="card card-cream no-print" aria-labelledby="fb-h" id="feedback">
      <h3 id="fb-h">Optional: how helpful was this?</h3>
      <p class="small muted">Anonymous. Helps our team improve Centspire. No written comments are collected.</p>
      <div class="chips" role="group" aria-label="Rating from 1 to 5">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="chip" data-r="${n}" aria-pressed="false">${n}${n === 1 ? ' · Not helpful' : n === 5 ? ' · Very helpful' : ''}</button>`).join('')}</div>
      <div class="field" style="margin-top:14px;max-width:360px"><label for="fb-topic">What did you learn the most about?</label>
        <select id="fb-topic" class="input"><option value="">Choose one (optional)</option>${TOPICS.map((t) => `<option value="${t.id}">${t.label}</option>`).join('')}</select></div>
      <button class="btn btn-navy btn-sm" id="fb-send" style="margin-top:14px" disabled>Send feedback</button>
    </section>` : ''}

    <p class="disclaimer">Centspire is an educational simulation. All colleges, jobs, prices, and offers are hypothetical, and results are illustrations — not financial advice or guaranteed predictions. Taxes are simplified estimates. Talk to a school counselor or financial aid office about real decisions.</p>
  </div>`;

  $('#print').onclick = () => window.print();
  const fb = $('#feedback');
  if (fb) {
    const sent = store.get().feedbackReports || [];
    if (sent.includes(r.id)) fb.innerHTML = `<p style="margin:0">${icon('check', 18)} Thanks — your feedback was recorded.</p>`;
    else {
      let rating = null;
      fb.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        rating = +b.dataset.r;
        fb.querySelectorAll('[data-r]').forEach((x) => x.setAttribute('aria-pressed', x === b));
        $('#fb-send').disabled = false;
      }));
      $('#fb-send').onclick = () => {
        C.Analytics.log('feedback', store.get().participant, 'report', { rating, topic: $('#fb-topic').value || null });
        store.update((d) => { d.feedbackReports = [...(d.feedbackReports || []), r.id]; });
        fb.innerHTML = `<p style="margin:0">${icon('check', 18)} Thanks — your feedback was recorded.</p>`;
      };
    }
  }
  if (U.params.get('new') === '1') { U.toast('Report saved'); history.replaceState(null, '', location.pathname + '?id=' + encodeURIComponent(r.id)); }
})();
