/* Presenter demo: a guided path for DECA judges. Everything opens in demo mode (nothing saved or sent). */
(function () {
  const C = window.Centsible, U = C.UI;
  const { $, icon } = U;
  // Entering this page turns on demo mode for the rest of this browser tab.
  try { sessionStorage.setItem('centsible_demo', '1'); } catch {}
  C.Analytics.setDemo(true);
  U.mountShell('about');
  const sample = C.ReportBuilder.sample();

  const STEPS = [
    { icon: 'card', title: 'Open a financial decision', href: 'simulator.html?demo=1&preset=credit',
      say: 'Start in Chapter 3. The player already chose a college and managed money in school, so their savings and debt are real numbers from those choices. Pick a credit card and show the utilization math and the quick check.' },
    { icon: 'trend', title: 'Show how earlier choices carry forward', href: 'simulator.html?demo=1&preset=job',
      say: 'Jump to Chapter 4. This player chose a private college and carried a card balance. Point to “Your finances”: student loan payments and the card payment shrink what’s left after rent. If essentials don’t fit, the game makes them go back and change housing or transportation.' },
    { icon: 'chart', title: 'Show a Financial Future Report', href: 'report.html?demo=1&sample=1',
      say: `A sample report for a fictional student: ${C.Finance.money(sample.money.studentDebt)} in loans and ${C.Finance.money(sample.money.monthlyLoan)} a month in payments. Learning scores come from answers — not money — and the report names the most expensive decisions.` },
    { icon: 'notebook', title: 'Follow a recommendation into the Academy', href: 'lesson.html?demo=1&id=min-payments',
      say: 'The sample student paid only the minimum and missed the minimum-payment question, so the report recommends “Why Minimum Payments Cost More Than You Think.” Show the payoff slider, then answer the questions — they count only on the first try.' },
    { icon: 'calc', title: 'Demonstrate a calculator', href: 'tools.html?demo=1#loan',
      say: 'Change the loan amount or rate. Point out the plain-language explanation, the assumptions, and the error message if you type something invalid.' },
    { icon: 'shield', title: 'Show how impact is measured', href: 'impact.html?demo=1',
      say: 'Explain the method: two equivalent question sets in random order, paired before/after scores, and a one-week check-in. In demo mode this shows clearly labeled DEMO DATA; switch to “Actual data” to show what has really been collected.' },
  ];

  $('#demo').innerHTML = `
    <section class="hero on-navy"><div class="container" style="padding-top:48px;padding-bottom:40px">
      <p class="eyebrow" style="color:var(--gold)">${icon('presentation', 16)} Presenter demo</p>
      <h1 style="max-width:22ch">A 6-step walkthrough for judges</h1>
      <p class="lead">Each step opens in demo mode: nothing is saved to this device or recorded in analytics, and sample data is always labeled. Everything works offline once the site has loaded.</p>
    </div></section>
    <div class="container section stack" style="max-width:920px">
      ${STEPS.map((s, i) => `<section class="card">
        <div class="row" style="gap:16px;align-items:flex-start"><span class="medal medal-${i % 2 ? 'gold' : 'mint'}">${icon(s.icon, 24)}</span>
          <div style="flex:1;min-width:220px"><p class="eyebrow" style="margin:0">Step ${i + 1}</p><h2 style="font-size:1.3rem;margin:2px 0 8px">${s.title}</h2><p class="small" style="margin:0">${s.say}</p></div>
          <a class="btn btn-navy btn-sm" href="${s.href}">Open ${icon('external', 16)}</a></div></section>`).join('')}
      <div class="callout callout-gold">${icon('alert', 20)}<p>When you’re done presenting, <a href="index.html?demo=0">exit demo mode</a> so the site goes back to saving progress normally.</p></div>
    </div>`;
})();
