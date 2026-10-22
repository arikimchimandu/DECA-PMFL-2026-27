/* Centspire — Money Missions: short (3–5 minute) challenges.
 *
 * Mission shape:
 *   id, title, topic, concepts[], minutes, icon, intro
 *   steps: [{ prompt, options: [{ label, result, tag }] }]   — tag: 'strong' | 'ok' | 'risky' (shown as feedback tone)
 *   check: { q, a[], correct, why, concept }                 — counts toward learning scores
 *   takeaway: one sentence
 *
 * The "mission of the week" rotates through this list by calendar week. To add one, append an object.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Missions = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MISSIONS = [
    { id: 'first-paycheck', title: 'Your First $500 Paycheck', topic: 'budgeting', concepts: ['50-30-20', 'emergency-fund'], minutes: 3, icon: 'wallet',
      intro: 'Your first paycheck from a summer job just hit: $500. Your phone bill ($45) is due next week.',
      steps: [
        { prompt: 'What do you do first?', options: [
          { label: 'Set aside the $45 phone bill', tag: 'strong', result: 'Needs first. Your bill is covered and won’t be late.' },
          { label: 'Celebrate — dinner and new headphones ($180)', tag: 'risky', result: 'Fun, but you spent before covering your bill. Make sure $45 is still there next week.' },
          { label: 'Put all $500 in savings', tag: 'ok', result: 'Great saving instinct — just remember the phone bill still needs paying from somewhere.' } ] },
        { prompt: 'You have $455 left. How do you split it?', options: [
          { label: '$100 wants, $355 savings', tag: 'strong', result: 'That builds a cushion fast while still leaving room for fun.' },
          { label: '$200 wants, $255 savings', tag: 'ok', result: 'A balanced split. You’re saving more than half.' },
          { label: '$455 wants', tag: 'risky', result: 'Nothing saved. The next surprise expense will have to come from somewhere else.' } ] },
      ],
      check: { q: 'Following 50/30/20, how much of a $500 paycheck goes to savings?', a: ['$100', '$150', '$250', '$50'], correct: 0, concept: '50-30-20',
        why: '20% of $500 = $100. Saving more is great when your needs are covered.' },
      takeaway: 'Pay needs first, save on purpose, then enjoy what’s left without guilt.' },

    { id: 'car-repair', title: 'The $400 Surprise', topic: 'saving', concepts: ['emergency-fund', 'unexpected-expense', 'apr'], minutes: 3, icon: 'car',
      intro: 'Your car needs a $400 repair before you can drive to work. You have $250 in savings and a credit card at 24% APR.',
      steps: [
        { prompt: 'How do you pay for it?', options: [
          { label: 'Use $250 savings + $150 on the card, pay the card off next paycheck', tag: 'strong', result: 'Smart mix. Using savings first keeps the card balance small, and paying it quickly avoids most interest.' },
          { label: 'Put all $400 on the card and pay the minimum', tag: 'risky', result: 'At 24% APR with small payments, $400 could take well over a year to pay off.' },
          { label: 'Skip the repair and miss work until you can afford it', tag: 'risky', result: 'Lost wages can cost more than the repair. Transportation to work is a need.' } ] },
        { prompt: 'Next month, how do you rebuild?', options: [
          { label: 'Auto-transfer $50 a paycheck to savings', tag: 'strong', result: 'Automatic saving rebuilds your cushion without relying on willpower.' },
          { label: 'Save whatever is left at the end of the month', tag: 'ok', result: 'It can work, but “whatever is left” is often nothing. Try picking an amount.' } ] },
      ],
      check: { q: 'Why is it best to use savings before a credit card for a surprise bill?', a: ['Savings don’t charge interest', 'Cards can’t be used for repairs', 'Savings earn 24%', 'It improves your FAFSA'], correct: 0, concept: 'emergency-fund',
        why: 'Using savings avoids interest. That’s exactly what an emergency fund is for.' },
      takeaway: 'An emergency fund turns a crisis into an inconvenience.' },

    { id: 'summer-jobs', title: 'Two Summer Jobs', topic: 'income', concepts: ['gross-net', 'opportunity-cost', 'income-planning'], minutes: 4, icon: 'briefcase',
      intro: 'Job A: lifeguard, $14/hour, 30 hours a week, 5-minute bike ride. Job B: warehouse, $18/hour, 25 hours a week, 40-minute drive ($40 a week in gas).',
      steps: [
        { prompt: 'Which pays more per week before costs?', options: [
          { label: 'Job B ($450 vs. $420)', tag: 'strong', result: 'Right: 25 × $18 = $450 and 30 × $14 = $420.' },
          { label: 'Job A', tag: 'risky', result: 'Check the math: 30 × $14 = $420, but 25 × $18 = $450.' } ] },
        { prompt: 'Now subtract Job B’s $40 a week in gas. Which leaves you more?', options: [
          { label: 'Job A ($420 vs. $410)', tag: 'strong', result: 'Exactly. After gas, Job B leaves $410 — and takes about 6 more hours of driving a week.' },
          { label: 'Job B, still', tag: 'risky', result: '$450 − $40 = $410, which is less than Job A’s $420.' } ] },
        { prompt: 'Job B is in the field you want to study. Which do you pick?', options: [
          { label: 'Job B — the experience is worth $10 a week', tag: 'ok', result: 'A reasonable tradeoff. Experience can pay off later — that’s the opportunity cost of Job A.' },
          { label: 'Job A — more money and free time', tag: 'ok', result: 'Also reasonable. More take-home pay and a shorter commute have real value.' } ] },
      ],
      check: { q: 'You earn $450 gross in a week and $34 is withheld for FICA. What is your net pay before income tax?', a: ['$416', '$484', '$450', '$34'], correct: 0, concept: 'gross-net',
        why: 'Net = gross − deductions: $450 − $34 = $416.' },
      takeaway: 'Compare jobs on what you keep — after taxes, commuting costs, and time.' },

    { id: 'scholarship-strings', title: 'A Scholarship with Strings', topic: 'college', concepts: ['aid-offer', 'aid-types'], minutes: 3, icon: 'award',
      intro: 'You’re offered a $6,000-a-year scholarship. Fine print: renewable each year with a 3.2 GPA and full-time enrollment (12+ credits).',
      steps: [
        { prompt: 'Freshman year, you’re thinking about working 25 hours a week. What’s the risk?', options: [
          { label: 'Grades could slip below 3.2 and you’d lose $6,000 a year', tag: 'strong', result: 'Exactly. Long work hours can cost more than they earn if they cost you a renewable scholarship.' },
          { label: 'No risk — scholarships are guaranteed for 4 years', tag: 'risky', result: 'Not this one. Renewal depends on GPA and credits.' } ] },
        { prompt: 'Spring semester is hard. Should you drop to 9 credits?', options: [
          { label: 'Talk to financial aid first — 9 credits breaks the full-time rule', tag: 'strong', result: 'Good call. Dropping below 12 credits could cancel the scholarship.' },
          { label: 'Drop the class — it won’t affect aid', tag: 'risky', result: 'It might. Many scholarships and grants require full-time enrollment.' } ] },
      ],
      check: { q: 'Which part of an aid offer should you read most carefully for scholarships?', a: ['Renewal requirements like GPA and credits', 'The font size', 'The college’s mascot', 'The loan interest rate'], correct: 0, concept: 'aid-offer',
        why: 'Renewal conditions decide whether gift aid lasts all four years.' },
      takeaway: 'Free money often has rules. Know them before you plan your schedule.' },

    { id: 'growing-balance', title: 'The Balance That Keeps Growing', topic: 'credit', concepts: ['min-payment', 'utilization', 'apr'], minutes: 4, icon: 'card',
      intro: 'You owe $1,200 on a card with a $1,500 limit at 24% APR. You’ve been paying the $35 minimum.',
      steps: [
        { prompt: 'First: what’s your utilization?', options: [
          { label: '80%', tag: 'strong', result: 'Right: $1,200 ÷ $1,500 = 80%. That’s well above the common 30% guideline.' },
          { label: '24%', tag: 'risky', result: '24% is the APR. Utilization is balance ÷ limit = $1,200 ÷ $1,500 = 80%.' } ] },
        { prompt: 'You can find $65 more a month by cutting takeout. What do you do?', options: [
          { label: 'Pay $100 a month and stop using the card until it’s paid', tag: 'strong', result: 'About 14 months instead of nearly 5 years at $35 — and hundreds less in interest.' },
          { label: 'Keep paying $35 — it’s manageable', tag: 'risky', result: 'At $35, about $24 of each early payment is interest. Payoff takes nearly 5 years.' },
          { label: 'Open a new card to spread the balance', tag: 'risky', result: 'That doesn’t reduce what you owe and can lead to more debt. A real balance-transfer offer needs careful fine-print reading.' } ] },
      ],
      check: { q: 'At 24% APR, about how much interest is charged in a month on a $1,200 balance?', a: ['$24', '$288', '$2.40', '$120'], correct: 0, concept: 'apr',
        why: '24% ÷ 12 = 2% a month. 2% of $1,200 = $24.' },
      takeaway: 'Stop adding to the balance, then pay a fixed amount well above the minimum.' },

    { id: 'dream-job-dm', title: 'The Dream Job DM', topic: 'safety', concepts: ['fake-jobs', 'payment-scams', 'phishing'], minutes: 3, icon: 'chat',
      intro: 'A DM pops up: “Hi! We love your profile. Become a brand ambassador — $400/week, 2 hrs a day, no experience. Interested?”',
      steps: [
        { prompt: 'What do you do?', options: [
          { label: 'Look up the brand yourself and check its official careers page', tag: 'strong', result: 'The real brand has no ambassador program posted, and its site warns about fake recruiters. Good instinct.' },
          { label: 'Reply “Yes!” and send your phone number and email', tag: 'risky', result: 'Now scammers know you’re interested — and have more of your information.' },
          { label: 'Ignore it and block the account', tag: 'ok', result: 'Safe. Reporting the account helps protect others too.' } ] },
        { prompt: 'A week later, a different “company” mails you a $1,800 check: deposit it, keep $300, and send $1,500 to their supplier on a payment app. The money shows up in your account. Now what?', options: [
          { label: 'Don’t send anything. Call your bank using the number on your card', tag: 'strong', result: 'The bank confirms the check is fake. It bounces two days later — and you lost nothing.' },
          { label: 'Send the $1,500 since the money is already in your account', tag: 'risky', result: 'The check bounces. The bank takes back $1,800, and the $1,500 you sent is gone. It was your own money.' },
          { label: 'Ask them to pay you in gift cards instead', tag: 'risky', result: 'Gift cards are just as untraceable. Any job that sends money and asks for some back is a scam.' } ] },
      ],
      check: { q: 'Why can money from a fake check show up in your account before the scam is discovered?', a: ['Banks make deposits available quickly, but the check can still bounce days later', 'Fake checks are always caught instantly', 'The money is real once it appears', 'Payment apps guarantee every check'], correct: 0, concept: 'fake-jobs',
        why: 'By law, banks often make deposited funds available within a day or two — before they know whether a check is good. If it bounces, you owe it all back.' },
      takeaway: 'Real jobs pay you. They never send money and ask for some of it back.' },

    { id: 'first-car-deal', title: 'The First-Car Deal', topic: 'credit', concepts: ['car-loan', 'loan-term', 'apr'], minutes: 4, icon: 'car',
      intro: 'You found a $12,000 used car. The dealer asks, “What monthly payment works for you?” Your part-time job leaves about $350 a month for a car.',
      steps: [
        { prompt: 'How do you answer?', options: [
          { label: '“Let’s talk about the out-the-door price first. I’m preapproved at my credit union.”', tag: 'strong', result: 'Now the dealer has to compete with a real rate, and you’re negotiating the price — not just the payment.' },
          { label: '“Anything under $250 a month.”', tag: 'risky', result: 'The dealer can hit any payment by stretching the loan to 7 years — and you’ll pay much more in total.' },
          { label: '“I’ll take whatever financing you have.”', tag: 'risky', result: 'Dealer financing can be fine, but without a comparison you can’t tell a good rate from a bad one.' } ] },
        { prompt: 'The offers: 4 years at about $310/mo, or 6 years at about $228/mo (11% APR). Insurance will be $190/mo. Which do you choose?', options: [
          { label: 'Look for a cheaper car that fits a 4-year loan', tag: 'strong', result: 'A lower price means less interest and lower insurance — your budget stays healthy.' },
          { label: '6 years at $228 — it fits my budget', tag: 'ok', result: 'With insurance, that’s $418 a month before gas — more than your $350. And you’ll pay about $4,450 in interest.' },
          { label: '4 years at $310', tag: 'ok', result: 'Less interest (about $2,890), but $310 + $190 insurance is $500 a month — well over your $350.' } ] },
      ],
      check: { q: 'A car payment is $228, insurance is $190, and gas is $60. What does the car cost each month before maintenance?', a: ['$478', '$228', '$418', '$288'], correct: 0, concept: 'car-loan',
        why: '$228 + $190 + $60 = $478. The payment is less than half the real monthly cost.' },
      takeaway: 'Negotiate the price, compare loan offers, and budget for the whole cost of owning the car — not just the payment.' },
  ];

  /** Rotates by calendar week so every student sees the same featured mission. */
  function missionOfWeek(date = new Date()) {
    const start = Date.UTC(2026, 0, 5); // a Monday
    const week = Math.floor((date.getTime() - start) / (7 * 86400000));
    return MISSIONS[((week % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
  }

  return { MISSIONS, missionOfWeek, byId: (id) => MISSIONS.find((m) => m.id === id) || null };
});
