/* Centspire V4 — Financial Life Simulator engine (no DOM).
 *
 * The game state is just the player's choices. `derive(choices)` rebuilds the whole financial
 * picture from those choices every time, so every later number follows from earlier decisions,
 * saved games are tiny, and the model can be tested directly.
 *
 * All colleges, jobs, prices, and offers here are HYPOTHETICAL examples for learning.
 */
(function (root, factory) {
  const mod = factory(root.Centsible || {});
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Sim = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  const F = C.Finance, A = C.Assumptions;
  const $ = (n) => F.money(n);
  const round = (n) => Math.round(n);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  // ---------------------------------------------------------------- example data (HYPOTHETICAL)
  const COLLEGES = {
    lakeside: { id: 'lakeside', name: 'Lakeside State University', kind: 'In-state public', icon: 'building',
      tuition: 11600, housingFood: 12800, other: 3200, aid: 8000, aidNote: 'Federal Pell + state grant + small merit award',
      local: true, vibe: 'Big campus 25 minutes from home. Strong business and nursing programs.' },
    coastline: { id: 'coastline', name: 'Coastline University', kind: 'Out-of-state public', icon: 'plane',
      tuition: 30800, housingFood: 13200, other: 3200, aid: 7000, aidNote: 'Merit scholarship',
      local: false, vibe: 'Beach town 600 miles away. The program you’re most excited about.' },
    whitmore: { id: 'whitmore', name: 'Whitmore College', kind: 'Private nonprofit', icon: 'gradcap',
      tuition: 43400, housingFood: 14600, other: 3000, aid: 36000, aidNote: 'Need-based college grant + Pell',
      local: false, vibe: 'Small classes and close professors. Big sticker price, big aid.' },
  };
  const FAMILY_PER_YEAR = 8000;   // HYPOTHETICAL family contribution
  const SUMMER_PER_YEAR = 3000;   // HYPOTHETICAL summer-job savings put toward school
  const OFF_CAMPUS_HF = 11000;    // HYPOTHETICAL: shared apartment + cooking, 12-month lease
  const HOME_HF = 3000;           // HYPOTHETICAL: living with family, chipping in for food
  const SCHOOL_NEEDS = { phone: 45, personal: 40 };
  const SCHOOL_FOOD = { campus: 60, off: 60, home: 0 }; // HYPOTHETICAL food beyond the meal plan / groceries
  const SCHOOL_TRANSPORT = { campus: 25, home: 120, off: 60 };

  const JOBS = {
    metro: { id: 'metro', city: 'Metro City', title: 'Junior Marketing Analyst', salary: 62000,
      rent: { alone: 1750, roommate: 1100 }, util: { alone: 150, roommate: 90 }, transit: true },
    riverton: { id: 'riverton', city: 'Riverton (your hometown)', title: 'Operations Coordinator', salary: 50000,
      rent: { alone: 1150, roommate: 750, family: 300 }, util: { alone: 130, roommate: 80, family: 0 }, transit: false },
  };
  const CARS = {
    used: { label: 'Reliable used car — $9,000', price: 9000, apr: 0.085, years: 4, insurance: 150, gas: 120 },
    newer: { label: 'Newer car — $18,000', price: 18000, apr: 0.075, years: 5, insurance: 170, gas: 120 },
  };
  const GROCERIES = 350, JOB_PHONE = 50;
  const MATCH_CAP = 0.03; // HYPOTHETICAL employer match: 100% of the first 3% of salary

  const CHAPTERS = [
    { id: 1, title: 'Senior Year', subtitle: 'The college decision', icon: 'gradcap',
      intro: 'Three acceptance letters just arrived. Each one comes with a different price — and a different financial aid offer.' },
    { id: 2, title: 'College Life', subtitle: 'Managing your money', icon: 'book',
      intro: 'You’re on campus. Now the day-to-day money decisions are yours: work, spending, saving, and surprises.' },
    { id: 3, title: 'Independence', subtitle: 'Credit and debt', icon: 'card',
      intro: 'You’re 21 and credit card offers are everywhere. Credit can build your future — or follow you for years.' },
    { id: 4, title: 'First Job', subtitle: 'Planning your future', icon: 'briefcase',
      intro: 'You graduated! Now your paycheck has to cover rent, loans, and everything else. Everything you chose earlier shows up here.' },
  ];

  // ---------------------------------------------------------------- the model
  function derive(choices) {
    const ch = choices || {};
    const m = { ch };

    // Chapter 1 — college costs and borrowing
    const col = COLLEGES[ch.c1_offers || 'lakeside'];
    const housing = ch.c1_housing || 'campus';
    const hf = housing === 'home' ? HOME_HF : housing === 'off' ? OFF_CAMPUS_HF : col.housingFood;
    const coa = col.tuition + hf + col.other;
    const netPrice = coa - col.aid;
    const gap = Math.max(0, netPrice - FAMILY_PER_YEAR - SUMMER_PER_YEAR);
    const plan = ch.c1_borrow || 'federal-first';
    const L = A.loans;
    const workIncomeYear = 20 * A.income.collegeHourlyWage * A.income.weeksPerMonth * A.game.schoolMonthsPerYear * A.income.collegeNetFactor;
    let sub = 0, unsub = 0, priv = 0, plus = 0, workToTuition = 0, accruedUnsub = 0, accruedPriv = 0, fedMaxRest = 0;
    for (let y = 0; y < 4; y++) {
      const s = Math.min(L.subsidizedAnnualLimit[y], gap);
      const u = Math.min(L.dependentAnnualLimit[y] - s, gap - s);
      const rest = gap - s - u;
      fedMaxRest = Math.max(fedMaxRest, rest);
      const yearsToRepay = 4 - y + L.graceMonths / 12;
      sub += s; unsub += u;
      accruedUnsub += F.accruedInterest(u, L.federalUndergradRate, yearsToRepay);
      if (plan === 'federal-first') { priv += rest; accruedPriv += F.accruedInterest(rest, L.privateRate, yearsToRepay); }
      else if (plan === 'parent-plus') plus += rest;
      else if (plan === 'work-more') workToTuition += rest;
    }
    const canWorkMore = fedMaxRest <= workIncomeYear;
    const fedBalance = sub + unsub + accruedUnsub;
    const privBalance = priv + accruedPriv;
    m.college = { col, housing, hf, coa, netPrice, net4: netPrice * 4, gap, gap4: gap * 4 };
    m.loans = { plan, sub, unsub, priv, plus, accruedUnsub, accruedPriv, fedBalance, privBalance,
      studentTotal: fedBalance + privBalance, principalTotal: sub + unsub + priv, workToTuition, canWorkMore, workIncomeYear };

    // Chapter 2 — monthly budget in college
    const hours = plan === 'work-more' ? 20 : (ch.c2_job ?? 0);
    const jobMonthly = hours * A.income.collegeHourlyWage * A.income.weeksPerMonth * A.income.collegeNetFactor;
    const tuitionShare = workToTuition / 4 / A.game.schoolMonthsPerYear;
    const income = A.game.collegeAllowancePerMonth + jobMonthly - tuitionShare;
    const schoolNeeds = SCHOOL_NEEDS.phone + SCHOOL_NEEDS.personal + SCHOOL_FOOD[housing] + SCHOOL_TRANSPORT[housing];
    const discretionary = Math.max(0, income - schoolNeeds);
    const fun = clamp(ch.c2_budget ?? Math.round(discretionary / 2), 0, discretionary);
    const save = discretionary - fun;
    const months = A.game.schoolMonthsPerYear;
    const fundAtLaptop = save * months;
    const laptop = ch.c2_laptop || null;
    let laptopCost = 0, fees = 0, bnplShort = false;
    if (laptop === 'savings') laptopCost = 700;
    if (laptop === 'refurb') laptopCost = 350;
    if (laptop === 'bnpl') { laptopCost = 700; if (save < 350) { bnplShort = true; fees = 2 * 8; } }
    let fund = save * months * 4 - laptopCost - fees;
    let familyCovered = 0; // if savings can't cover the laptop plan, family steps in (HYPOTHETICAL)
    if (fund < 0) { familyCovered = -fund; fund = 0; }
    m.school = { hours, jobMonthly, tuitionShare, income, schoolNeeds, transport: SCHOOL_TRANSPORT[housing], discretionary, fun, save,
      fundAtLaptop, laptop, laptopCost, fees, bnplShort, familyCovered, fundAtGrad: fund };

    // Chapter 3 — credit
    const card = ch.c3_card || null;
    const hasCard = card === 'student' || card === 'secured';
    const limit = card === 'student' ? A.credit.cardLimit : card === 'secured' ? A.credit.securedLimit : 0;
    if (card === 'secured') fund -= 300; // refundable deposit, held by the bank
    const use = hasCard ? ch.c3_card_use || null : null;
    const monthlyCharges = use === 'bills' ? 60 : use === 'everything' ? 700 : use === 'trip' ? 60 : 0;
    const balance = use === 'trip' ? 900 : 0;
    const payoffChoice = ch.c3_balance || null;
    let cardPayment = 0, cardInterest = 0, cardMonthsLeft = 0, balanceAtJob = balance;
    if (balance > 0 && payoffChoice) {
      if (payoffChoice === 'payoff') { fund -= balance; balanceAtJob = 0; }
      else {
        const opts = payoffChoice === 'fixed' ? { fixed: 100 } : { minPct: A.credit.minPaymentPct, minFloor: A.credit.minPaymentFloor };
        const p = F.payoff(balance, A.credit.cardApr, opts);
        cardInterest = p.totalInterest; cardMonthsLeft = p.months;
        // a year passes before the first job: simulate 12 payments
        let b = balance;
        for (let i = 0; i < 12 && b > 0; i++) {
          b += b * A.credit.cardApr / 12;
          const pay = payoffChoice === 'fixed' ? 100 : Math.max(A.credit.minPaymentFloor, b * A.credit.minPaymentPct);
          b -= Math.min(pay, b);
        }
        balanceAtJob = b;
        cardPayment = b > 0 ? (payoffChoice === 'fixed' ? Math.min(100, b) : Math.max(A.credit.minPaymentFloor, b * A.credit.minPaymentPct)) : 0;
      }
    }
    const reportedBalance = use === 'trip' ? balance : monthlyCharges;
    const util = hasCard ? F.utilization(Math.min(reportedBalance, limit), limit) : null;
    const cosign = ch.c3_cosign === 'cosign';
    m.credit = { card, hasCard, limit, use, monthlyCharges, balance, payoffChoice, cardPayment, cardInterest, cardMonthsLeft, balanceAtJob,
      util, cosign, rewards: use === 'everything' ? 700 * 0.015 : 0 };
    fund = Math.max(0, fund);

    // Chapter 4 — first job
    const job = JOBS[ch.c4_offer || 'riverton'];
    const retire = ch.c4_retire ?? 0;
    const pay = F.paycheck(job.salary, { pretaxPct: retire });
    const home = ch.c4_housing || 'roommate';
    const rent = job.rent[home] ?? job.rent.roommate;
    const util4 = job.util[home] ?? job.util.roommate;
    const tChoice = ch.c4_transport || (job.transit ? 'transit' : 'used');
    let transport = 0, carPayment = 0, carLoan = 0, down = 0;
    if (tChoice === 'transit') transport = 100;
    else if (tChoice === 'rides') transport = 140;
    else {
      const car = CARS[tChoice];
      down = fund >= 1000 ? 1000 : 0;
      carLoan = car.price - down;
      carPayment = F.monthlyPayment(carLoan, car.apr, car.years);
      transport = carPayment + car.insurance + car.gas;
    }
    fund -= down;
    const repay = m.loans.fedBalance > 0 ? (ch.c4_repay || 'standard') : 'standard';
    const fedYears = repay === 'extended' ? L.extendedTermYears : L.standardTermYears;
    const fedPay = F.monthlyPayment(m.loans.fedBalance, L.federalUndergradRate, fedYears);
    const privPay = F.monthlyPayment(m.loans.privBalance, L.privateRate, L.standardTermYears);
    const plusPay = F.monthlyPayment(m.loans.plus, L.parentPlusRate, L.standardTermYears);
    const loanPayment = fedPay + privPay;
    const essentials = { rent, utilities: util4, groceries: GROCERIES, phone: JOB_PHONE, transport, studentLoans: loanPayment, creditCard: cardPayment };
    const essentialTotal = Object.values(essentials).reduce((s, v) => s + v, 0);
    const flexibility = pay.monthly.net - essentialTotal;
    const wants = clamp(ch.c4_budget ?? Math.round(Math.max(0, flexibility) * 0.5), 0, Math.max(0, flexibility));
    const saveMonthly = Math.max(0, flexibility) - wants;
    const contribution = job.salary * retire / 12;
    const match = job.salary * Math.min(retire, MATCH_CAP) / 12;
    const yearsTo65 = A.saving.retirementAge - 22;
    const retireFV = F.futureValue(0, contribution + match, A.saving.illustrativeReturn, yearsTo65);
    const fedSummary = F.loanSummary(m.loans.fedBalance, L.federalUndergradRate, fedYears);
    const fedStd = F.loanSummary(m.loans.fedBalance, L.federalUndergradRate, L.standardTermYears);
    const fedExt = F.loanSummary(m.loans.fedBalance, L.federalUndergradRate, L.extendedTermYears);
    const privSummary = F.loanSummary(m.loans.privBalance, L.privateRate, L.standardTermYears);
    m.job = { job, retire, pay, home, rent, util: util4, tChoice, transport, carPayment, carLoan, down, repay, fedYears, fedPay, privPay, plusPay,
      loanPayment, essentials, essentialTotal, flexibility, wants, saveMonthly, contribution, match, retireFV, yearsTo65,
      fedSummary, fedStd, fedExt, privSummary, fund: Math.max(0, fund) };

    // Game Financial Health index (0–100). NOT a credit score — a teaching summary of this game only.
    const emergencyMonths = essentialTotal > 0 ? m.job.fund / essentialTotal : 0;
    const debtPayments = loanPayment + cardPayment + carPayment;
    const dti = pay.monthly.gross ? debtPayments / pay.monthly.gross : 0;
    const parts = {
      cushion: Math.round(clamp(emergencyMonths / 3, 0, 1) * 25),
      debtLoad: Math.round(clamp(1 - (dti - 0.10) / 0.30, 0, 1) * 25),
      highCost: balanceAtJob > 0 ? Math.round(clamp(1 - balanceAtJob / 2000, 0, 1) * 10) : 20,
      flexibility: Math.round(clamp(flexibility / 800, 0, 1) * 20),
      future: retire >= MATCH_CAP ? 10 : retire > 0 ? 5 : 0,
    };
    m.health = { score: Object.values(parts).reduce((s, v) => s + v, 0), parts, emergencyMonths, dti, debtPayments };
    return m;
  }

  // ---------------------------------------------------------------- decision nodes
  // Each node: id, chapter, when(m), title, scene(m), options(m) or kind 'allocate' with range(m),
  // outcome(m, choice) → { headline, body, facts, lesson, tone }, check (concept question), flags(choice).
  const pctRent = (rent, net) => F.pct(rent / net);

  const NODES = [
    // ======================= Chapter 1
    { id: 'c1_offers', chapter: 1, icon: 'mail', title: 'Compare your college offers',
      scene: () => 'You were accepted to three schools. Each sent a financial aid offer. Compare the sticker price to what you’d actually pay.',
      table: () => Object.values(COLLEGES).map((c) => {
        const coa = c.tuition + c.housingFood + c.other;
        return { id: c.id, name: c.name, kind: c.kind, coa, aid: c.aid, net: coa - c.aid, vibe: c.vibe, aidNote: c.aidNote };
      }),
      options: () => Object.values(COLLEGES).map((c) => ({ id: c.id, label: c.name, detail: `${c.kind} · ${c.vibe}`, icon: c.icon })),
      outcome: (m) => {
        const c = m.college.col;
        const cheapest = Math.min(...Object.values(COLLEGES).map((x) => x.tuition + x.housingFood + x.other - x.aid));
        return {
          headline: `You chose ${c.name}`,
          body: c.id === 'whitmore'
            ? 'Its sticker price is the highest of the three, but its grant is so large that its net price beats the out-of-state school.'
            : c.id === 'coastline' ? 'You’re going for the program you love. It also has the highest net price of your three offers — next, you’ll decide how to pay for it.'
              : 'You picked the school with the lowest net price. You can still lower costs further depending on where you live.',
          facts: [
            { label: 'Sticker price (cost of attendance)', value: `${$(m.college.col.tuition + c.housingFood + c.other)}/yr` },
            { label: 'Grants & scholarships', value: `−${$(c.aid)}/yr` },
            { label: 'Net price', value: `${$(c.tuition + c.housingFood + c.other - c.aid)}/yr`, strong: true },
            { label: 'Compared with your cheapest offer', value: `${$((c.tuition + c.housingFood + c.other - c.aid - cheapest) * 4)} more over 4 years` },
          ],
          lesson: '<b>Sticker price</b> is the full cost before aid. <b>Net price</b> = sticker price − grants and scholarships. Loans are not subtracted — you still pay them back. Always compare net prices, not sticker prices.',
          tone: 'neutral',
        };
      },
      check: { topic: 'college', concept: 'net-price', q: 'Which number tells you what a college will really cost before borrowing?',
        a: ['Net price (cost minus grants and scholarships)', 'Sticker price', 'The loan amount offered', 'Tuition only'], correct: 0,
        why: 'Net price shows what you and your family must cover — by paying, saving, working, or borrowing.' },
      impact: (m) => {
        const cheapest = Math.min(...Object.values(COLLEGES).map((x) => x.tuition + x.housingFood + x.other - x.aid));
        const c = m.college.col; const diff = (c.tuition + c.housingFood + c.other - c.aid - cheapest) * 4;
        return diff > 0 ? { amount: diff, text: `Choosing ${c.name} costs about ${$(diff)} more over 4 years than your lowest net-price offer.` } : null;
      },
    },
    { id: 'c1_housing', chapter: 1, icon: 'home', title: 'Where will you live?',
      scene: (m) => `Housing and food are a big part of the cost at ${m.college.col.name}. Every option has tradeoffs beyond money.`,
      options: (m) => {
        const c = m.college.col;
        const o = [{ id: 'campus', label: 'Live on campus', detail: `${$(c.housingFood)}/yr with a meal plan. Easiest way to make friends and get involved.`, icon: 'building' },
          { id: 'off', label: 'Off-campus apartment with roommates', detail: `About ${$(OFF_CAMPUS_HF)}/yr including food. 12-month lease, a short commute, and more responsibility.`, icon: 'home' }];
        if (c.local) o.push({ id: 'home', label: 'Live at home and commute', detail: `About ${$(HOME_HF)}/yr for food. Saves the most, but a longer commute and less campus life.`, icon: 'car' });
        return o;
      },
      outcome: (m) => {
        const base = m.college.col.housingFood;
        const diff = base - m.college.hf;
        return {
          headline: m.college.housing === 'campus' ? 'Dorm life it is' : diff > 0 ? `You cut ${$(diff)} a year` : 'Off campus it is',
          body: m.college.housing === 'home' ? 'You’ll save a lot, but plan time for the commute and make an effort to join campus activities.'
            : m.college.housing === 'off' ? 'Cooking and sharing rent saves money, but you’re responsible for a lease, bills, and getting to class.'
              : 'You’ll pay more for housing, but it’s simple and keeps you close to classes and friends.',
          facts: [
            { label: 'Your net price now', value: `${$(m.college.netPrice)}/yr`, strong: true },
            { label: 'Family help + your summer-job savings (example)', value: `−${$(FAMILY_PER_YEAR + SUMMER_PER_YEAR)}/yr` },
            { label: 'Gap left to cover each year', value: $(m.college.gap), strong: true },
          ],
          lesson: 'Housing is often the second-biggest college cost after tuition. Opportunity cost matters too: the money you save living at home comes with less campus time — neither choice is automatically right.',
          tone: diff > 0 ? 'good' : 'neutral',
        };
      },
      impact: (m) => {
        const diff = (m.college.col.housingFood - m.college.hf) * 4;
        return diff > 0 ? { amount: diff, text: `Your housing choice saved about ${$(diff)} over 4 years compared with living on campus.` } : null;
      },
      flags: (c) => (c === 'campus' ? [] : ['opportunity-cost']),
    },
    { id: 'c1_borrow', chapter: 1, icon: 'bank', title: 'How will you cover the gap?',
      when: (m) => m.college.gap > 0,
      scene: (m) => `You need about ${$(m.college.gap)} a year beyond family help and summer savings. As a dependent student you can borrow up to ${$(5500)}–${$(7500)} a year in federal loans (part of it subsidized).`,
      options: (m) => [
        { id: 'federal-first', label: 'Federal loans first, private loan for the rest', icon: 'bank',
          detail: `Federal at ${F.pct(A.loans.federalUndergradRate, 2)}; any amount above the federal limit comes from a private lender at about ${F.pct(A.loans.privateRate, 1)} (example rate).` },
        { id: 'parent-plus', label: 'Federal loans, then ask a parent to take a Parent PLUS loan', icon: 'user',
          detail: `The extra borrowing becomes your parent’s debt at ${F.pct(A.loans.parentPlusRate, 2)}. Less debt in your name — but a real cost to your family.` },
        { id: 'work-more', label: 'Federal loans only — work 20 hours a week to cover the rest', icon: 'briefcase',
          disabled: !m.loans.canWorkMore,
          why: !m.loans.canWorkMore ? `A 20-hour job earns about ${$(m.loans.workIncomeYear)} a school year — not enough to cover this gap.` : null,
          detail: 'Less debt, but much less free time. Working more than about 15–20 hours a week can make classes harder.' },
      ],
      outcome: (m) => {
        const L = m.loans;
        const facts = [
          { label: 'Subsidized federal loans', value: $(L.sub) },
          { label: 'Unsubsidized federal loans', value: $(L.unsub) },
        ];
        if (L.priv) facts.push({ label: 'Private loans', value: $(L.priv) });
        if (L.plus) facts.push({ label: 'Parent PLUS (your parent’s debt)', value: $(L.plus) });
        if (L.workToTuition) facts.push({ label: 'Covered by your work over 4 years', value: $(L.workToTuition) });
        facts.push({ label: 'Interest that builds before repayment', value: $(L.accruedUnsub + L.accruedPriv) });
        facts.push({ label: 'Your student loan balance at graduation', value: $(L.studentTotal), strong: true });
        return {
          headline: `You’ll graduate owing about ${$(L.studentTotal)}`,
          body: L.plan === 'parent-plus' ? `Your parent will owe ${$(L.plus)} more, with payments of about ${$(F.monthlyPayment(L.plus, A.loans.parentPlusRate, 10))} a month for 10 years.`
            : L.plan === 'work-more' ? 'You kept your debt to federal loans only. Your job hours are now locked in for all four years.'
              : L.priv ? `About ${$(L.priv)} of that is private debt at a higher rate, with fewer protections than federal loans.` : 'Federal loans cover the whole gap.',
          facts,
          lesson: '<b>Subsidized</b> federal loans don’t build interest while you’re in school. <b>Unsubsidized</b> and private loans do — that interest is added to what you owe. Federal loans also offer income-driven repayment and deferment, which private loans usually don’t.',
          calc: { type: 'loan', principal: Math.round(L.studentTotal), apr: L.priv ? (L.fedBalance * A.loans.federalUndergradRate + L.privBalance * A.loans.privateRate) / L.studentTotal : A.loans.federalUndergradRate, years: 10 },
          tone: L.priv > 20000 ? 'bad' : 'neutral',
        };
      },
      check: { topic: 'college', concept: 'aid-types', q: 'Which loan does NOT build interest while you’re in school at least half-time?',
        a: ['A subsidized federal loan', 'An unsubsidized federal loan', 'A private student loan', 'All of them build interest'], correct: 0,
        why: 'The government pays the interest on subsidized loans while you’re enrolled at least half-time.' },
      impact: (m) => {
        const L = m.loans;
        if (L.plan === 'federal-first' && L.priv) {
          // same principal and timing, but at the federal rate
          const fedAccrued = L.accruedPriv * (A.loans.federalUndergradRate / A.loans.privateRate);
          const privTotal = L.accruedPriv + F.loanSummary(L.privBalance, A.loans.privateRate, 10).totalInterest;
          const fedTotal = fedAccrued + F.loanSummary(L.priv + fedAccrued, A.loans.federalUndergradRate, 10).totalInterest;
          const extra = privTotal - fedTotal;
          return { amount: extra, text: `Borrowing ${$(L.priv)} privately costs about ${$(extra)} more in interest than the same amount at the federal rate would.` };
        }
        if (L.plan === 'parent-plus') return { amount: F.loanSummary(L.plus, A.loans.parentPlusRate, 10).totalPaid, text: `Your parent will repay about ${$(F.loanSummary(L.plus, A.loans.parentPlusRate, 10).totalPaid)} on the Parent PLUS loan.` };
        if (L.plan === 'work-more') return { amount: L.workToTuition, text: `Working 20 hours a week kept about ${$(L.workToTuition)} of borrowing off your record.` };
        return null;
      },
      flags: (c) => (c === 'federal-first' ? ['fed-vs-private', 'loan-interest'] : ['loan-interest']),
    },

    // ======================= Chapter 2
    { id: 'c2_job', chapter: 2, icon: 'coffee', title: 'Will you work during the school year?',
      when: (m) => m.loans.plan !== 'work-more',
      scene: () => `The campus café pays ${$(A.income.collegeHourlyWage)} an hour. More hours means more money — and less time for classes, sleep, and friends.`,
      options: () => [
        { id: 0, label: 'No job — focus on classes', detail: 'You’ll live on $250 a month from family.', icon: 'book' },
        { id: 10, label: '10 hours a week', detail: `About ${$(10 * 15 * A.income.weeksPerMonth * A.income.collegeNetFactor)} a month after taxes.`, icon: 'coffee' },
        { id: 20, label: '20 hours a week', detail: `About ${$(20 * 15 * A.income.weeksPerMonth * A.income.collegeNetFactor)} a month after taxes. Busy weeks.`, icon: 'briefcase' },
      ],
      outcome: (m) => ({
        headline: m.school.hours ? `You’ll earn about ${$(m.school.jobMonthly)} a month` : 'You’re focusing on school',
        body: m.school.hours === 20 ? 'Good money, but plan your schedule carefully — students who work long hours often find it harder to keep up.'
          : m.school.hours === 10 ? 'A small job like this rarely hurts grades and gives you real spending money.' : 'More study time, but a tight monthly budget.',
        facts: [{ label: 'Hours × wage × weeks', value: `${m.school.hours} × $15 × 4.33` }, { label: 'Before payroll taxes', value: $(m.school.hours * 15 * A.income.weeksPerMonth) }, { label: 'Take-home (estimate)', value: $(m.school.jobMonthly), strong: true }],
        lesson: 'Your <b>gross pay</b> is hours × wage. Your <b>net pay</b> — what reaches your bank account — is smaller because taxes are withheld.',
        tone: 'neutral',
      }),
      check: { topic: 'income', concept: 'gross-net', q: 'Why is your paycheck smaller than hours × hourly wage?',
        a: ['Taxes and other deductions are withheld', 'Your employer keeps a tip', 'The bank charges a deposit fee', 'It isn’t — they’re always equal'], correct: 0,
        why: 'Hours × wage is gross pay. Withholding for taxes (and things like benefits) leaves your net pay.' },
    },
    { id: 'c2_budget', chapter: 2, icon: 'chart', kind: 'allocate', title: 'Build your monthly budget',
      scene: (m) => `After your needs, you have ${$(m.school.discretionary)} left each month. Decide how much goes to wants and how much to savings. Every dollar gets a job.`,
      range: (m) => ({ min: 0, max: Math.floor(m.school.discretionary), step: 5, label: 'Spending on wants each month', default: Math.round(m.school.discretionary / 2) }),
      outcome: (m) => ({
        headline: `You’ll save ${$(m.school.save)} a month`,
        body: m.school.save * 9 >= 700 ? `That’s ${$(m.school.save * 9)} by the end of freshman year — a real cushion.` : `That’s ${$(m.school.save * 9)} by the end of freshman year. A thin cushion if something goes wrong.`,
        facts: [
          { label: 'Monthly income', value: $(m.school.income) },
          { label: 'Needs (phone, personal care, food, transportation)', value: `−${$(m.school.schoolNeeds)}` },
          { label: 'Wants', value: `−${$(m.school.fun)}` },
          { label: 'Savings', value: $(m.school.save), strong: true },
        ],
        lesson: '<b>Needs</b> come first: things you must pay to live and study. <b>Wants</b> make life fun. A budget isn’t about cutting all fun — it’s about deciding ahead of time, so savings don’t get whatever is left over (which is usually nothing).',
        tone: m.school.save > 0 ? 'good' : 'bad',
      }),
      check: { topic: 'budgeting', concept: 'needs-wants', q: 'Which of these is a need for a college student?',
        a: ['A phone plan you use for classes and work', 'A second streaming service', 'Weekend concert tickets', 'Takeout three nights a week'], correct: 0,
        why: 'Needs are expenses you must have to live, study, and work. The rest are wants — fine in a budget, but they come second.' },
      flags: (v, m) => (m && m.school.save <= 0 ? ['budget-balance'] : []),
    },
    { id: 'c2_laptop', chapter: 2, icon: 'alert', title: 'Surprise: your laptop died',
      scene: (m) => `It’s finals season and your laptop won’t turn on. A replacement is $700. You have ${$(m.school.fundAtLaptop)} saved.`,
      options: (m) => [
        { id: 'savings', label: 'Buy a new one with savings', detail: '$700 from your emergency savings.', icon: 'coins',
          disabled: m.school.fundAtLaptop < 700, why: m.school.fundAtLaptop < 700 ? `You only have ${$(m.school.fundAtLaptop)} saved.` : null },
        { id: 'refurb', label: 'Buy a refurbished one for $350', detail: 'Older model with a warranty. Cheaper, but slower.', icon: 'phone',
          disabled: m.school.fundAtLaptop < 350, why: m.school.fundAtLaptop < 350 ? `You only have ${$(m.school.fundAtLaptop)} saved.` : null },
        { id: 'bnpl', label: 'Buy now, pay later: 4 payments of $175', detail: 'No interest if every payment is on time. Late payments bring fees.', icon: 'calendar' },
      ],
      outcome: (m) => ({
        headline: m.school.laptop === 'bnpl' ? (m.school.bnplShort ? 'Two payments came in late' : 'Paid off on schedule') : 'Handled with savings',
        body: m.school.laptop === 'bnpl'
          ? (m.school.bnplShort ? `Your budget only had ${$(m.school.save)} a month to spare, so two $175 payments were late and you paid fees. Late payments can also be reported to credit bureaus.` : 'Your savings rate could handle $350 a month, so every payment was on time.')
          : `Because you had savings, a surprise didn’t become debt. Now you’ll rebuild your cushion.`,
        facts: [
          { label: 'Laptop cost', value: $(m.school.laptopCost) },
          ...(m.school.fees ? [{ label: 'Late fees', value: $(m.school.fees) }] : []),
          { label: 'Emergency savings at graduation', value: $(m.school.fundAtGrad), strong: true },
          ...(m.school.familyCovered ? [{ label: 'Shortfall your family covered', value: $(m.school.familyCovered) }] : []),
        ],
        lesson: 'An <b>emergency fund</b> is money saved only for surprises — a broken laptop, a car repair, a medical bill. Without one, the surprise usually becomes debt.',
        tone: m.school.bnplShort ? 'bad' : 'good',
      }),
      check: { topic: 'saving', concept: 'emergency-fund', q: 'What is an emergency fund for?',
        a: ['Unexpected costs like repairs or medical bills', 'Vacations you plan months ahead', 'Investing in the stock market', 'Paying your normal monthly rent'], correct: 0,
        why: 'Emergency savings cover the unexpected so surprises don’t turn into high-cost debt.' },
      impact: (m) => (m.school.fees ? { amount: m.school.fees, text: `Buy-now-pay-later late fees cost ${$(m.school.fees)} and could show up on credit reports.` } : null),
      flags: (c, m) => (c === 'bnpl' ? ['unexpected-expense', 'emergency-fund'] : []),
    },

    // ======================= Chapter 3
    { id: 'c3_card', chapter: 3, icon: 'card', title: 'Your first credit card',
      scene: () => `You’re 21. A bank offers you a student card (${$(A.credit.cardLimit)} limit, ${F.pct(A.credit.cardApr)} APR — example terms). You could also start with a secured card or wait.`,
      options: (m) => [
        { id: 'student', label: `Student card — ${$(A.credit.cardLimit)} limit`, detail: 'Builds credit history if you pay on time. Easy to overspend.', icon: 'card' },
        { id: 'secured', label: 'Secured card — $300 deposit, $300 limit', detail: 'Your deposit is the limit (you get it back later). Hard to get into much debt.', icon: 'lock',
          disabled: m.school.fundAtGrad < 300, why: m.school.fundAtGrad < 300 ? `The deposit is $300 and you have ${$(m.school.fundAtGrad)} saved.` : null },
        { id: 'none', label: 'No card for now', detail: 'No risk of card debt — but no credit history yet, which can make renting an apartment harder.', icon: 'x' },
      ],
      outcome: (m) => ({
        headline: m.credit.hasCard ? 'Card approved' : 'You’re holding off on credit',
        body: m.credit.hasCard ? 'How you use it matters far more than having it.' : 'Waiting is a reasonable choice. You can build credit later — but landlords and lenders may ask for a co-signer or deposit until you have history.',
        facts: m.credit.hasCard ? [{ label: 'Credit limit', value: $(m.credit.limit) }, { label: 'APR (example)', value: F.pct(A.credit.cardApr) }] : [],
        lesson: 'A <b>credit score</b> summarizes how reliably you repay debt. The biggest factor is paying on time; the next is how much of your limit you use (<b>utilization</b>). Under the federal CARD Act, people under 21 need their own income or a co-signer to get a card.',
        tone: 'neutral',
      }),
      check: { topic: 'credit', concept: 'credit-score', q: 'What usually matters MOST for a credit score?',
        a: ['Paying every bill on time', 'How many cards you have', 'Your income', 'How old your bank account is'], correct: 0,
        why: 'Payment history is the single biggest factor in common scoring models. Missed payments can stay on a credit report for years.' },
    },
    { id: 'c3_card_use', chapter: 3, icon: 'card', title: 'How will you use your card?',
      when: (m) => m.credit.hasCard,
      scene: () => 'You have the card. There’s more than one reasonable way to use it — each with tradeoffs.',
      options: (m) => [
        { id: 'bills', label: 'Only your phone bill, autopay the full balance', detail: '$60 a month. Low utilization, no interest, slow and steady credit history.', icon: 'calendar' },
        { id: 'everything', label: 'Put everything on it for 1.5% cash back, pay in full', detail: '$700 a month. About $10 back each month — but high reported utilization and it’s easy to overspend.', icon: 'coins',
          disabled: m.credit.limit < 700, why: m.credit.limit < 700 ? 'Your limit is only $300.' : null },
        { id: 'trip', label: 'Book a $900 spring-break trip and pay it off over time', detail: 'A great week with friends now. A balance that builds interest at 24%.', icon: 'plane',
          disabled: m.credit.limit < 900, why: m.credit.limit < 900 ? 'Your limit is only $300.' : null },
      ],
      outcome: (m) => ({
        headline: `Your utilization: ${F.pct(m.credit.util)}`,
        body: m.credit.use === 'everything' ? 'Paying in full means no interest and some rewards. But a $700 balance on a $1,000 limit shows 70% utilization when it’s reported, which can lower a score until it’s paid.'
          : m.credit.use === 'trip' ? 'The trip was worth a lot to you. Now you’re carrying a balance — what you pay each month decides what it really costs.'
            : 'Low, steady use and on-time payments are one of the simplest ways to build credit.',
        facts: [{ label: 'Balance ÷ limit', value: `${$(m.credit.use === 'trip' ? 900 : m.credit.monthlyCharges)} ÷ ${$(m.credit.limit)}` }, { label: 'Utilization', value: F.pct(m.credit.util), strong: true }, ...(m.credit.rewards ? [{ label: 'Cash back', value: `${$(m.credit.rewards)}/mo` }] : [])],
        lesson: '<b>Credit utilization</b> = balance ÷ credit limit. Common guidance is to keep it under 30% — lower is better.',
        tone: m.credit.util > 0.3 ? 'bad' : 'good',
      }),
      check: { topic: 'credit', concept: 'utilization', q: 'Your limit is $1,000 and your balance is $250. What is your utilization?',
        a: ['25%', '4%', '75%', '250%'], correct: 0, why: '$250 ÷ $1,000 = 25%.' },
      flags: (c) => (c === 'everything' ? ['utilization'] : c === 'trip' ? ['apr'] : []),
    },
    { id: 'c3_balance', chapter: 3, icon: 'receipt', title: 'Paying down your balance',
      when: (m) => m.credit.balance > 0,
      scene: (m) => `Your card balance is ${$(m.credit.balance)} at ${F.pct(A.credit.cardApr)} APR. You have ${$(m.school.fundAtGrad)} in savings.`,
      options: (m) => {
        const minP = F.payoff(m.credit.balance, A.credit.cardApr, { minPct: A.credit.minPaymentPct, minFloor: A.credit.minPaymentFloor });
        const fixedP = F.payoff(m.credit.balance, A.credit.cardApr, { fixed: 100 });
        return [
          { id: 'minimum', label: `Pay the minimum (${$(Math.max(25, m.credit.balance * 0.02))} now)`, detail: `Paid off in ${F.duration(minP.months)}, about ${$(minP.totalInterest)} in interest.`, icon: 'calendar' },
          { id: 'fixed', label: 'Pay $100 a month', detail: `Paid off in ${F.duration(fixedP.months)}, about ${$(fixedP.totalInterest)} in interest.`, icon: 'calc' },
          { id: 'payoff', label: 'Pay it all off now from savings', detail: 'No more interest — but your emergency fund shrinks.', icon: 'coins',
            disabled: m.school.fundAtGrad < m.credit.balance, why: m.school.fundAtGrad < m.credit.balance ? `You only have ${$(m.school.fundAtGrad)} saved.` : null },
        ];
      },
      outcome: (m) => ({
        headline: m.credit.payoffChoice === 'payoff' ? 'Balance cleared' : `Projected interest: ${$(m.credit.cardInterest)}`,
        body: m.credit.payoffChoice === 'payoff' ? 'You stopped the interest immediately. Rebuilding your emergency fund is now the priority.'
          : m.credit.payoffChoice === 'minimum' ? 'Minimum payments keep your account in good standing, but most of each payment goes to interest at first.'
            : 'A fixed payment above the minimum cuts both the time and the interest.',
        facts: [{ label: 'Balance', value: $(m.credit.balance) }, { label: 'Months to pay off', value: m.credit.payoffChoice === 'payoff' ? '0' : String(m.credit.cardMonthsLeft) }, { label: 'Total interest', value: $(m.credit.cardInterest), strong: true }],
        lesson: '<b>APR</b> is the yearly interest rate. On a card, interest is charged on the balance each month (24% APR ≈ 2% a month). The <b>minimum payment</b> is designed to keep you paying for a long time.',
        calc: { type: 'card', balance: Math.round(m.credit.balance), apr: A.credit.cardApr, payment: m.credit.payoffChoice === 'fixed' ? 100 : Math.max(25, Math.round(m.credit.balance * 0.02)) },
        tone: m.credit.payoffChoice === 'minimum' ? 'bad' : 'good',
      }),
      check: { topic: 'credit', concept: 'min-payment', q: 'Why does paying only the minimum cost so much?',
        a: ['Interest keeps building on the balance you haven’t paid', 'Banks charge a fee for small payments', 'The APR doubles after a year', 'It doesn’t — minimums include all the interest'], correct: 0,
        why: 'Each month interest is added to the remaining balance. Small payments barely reduce it, so interest keeps piling up.' },
      impact: (m) => (m.credit.cardInterest > 0 ? { amount: m.credit.cardInterest, text: `Your payoff plan means about ${$(m.credit.cardInterest)} in credit card interest.` } : null),
      flags: (c) => (c === 'minimum' ? ['min-payment', 'apr'] : []),
    },
    { id: 'c3_cosign', chapter: 3, icon: 'user', title: 'A friend asks for a favor',
      scene: () => 'Your best friend needs a car for a new job, but the dealer wants a co-signer on a $6,000 loan. They promise they’ll never miss a payment.',
      options: () => [
        { id: 'cosign', label: 'Co-sign — they need this job', detail: 'You’re legally responsible for the whole loan if they don’t pay.', icon: 'user' },
        { id: 'decline', label: 'Decline, and help them look for a cheaper car', detail: 'Protects your credit. Might be an awkward conversation.', icon: 'search' },
      ],
      outcome: (m) => ({
        headline: m.credit.cosign ? 'You co-signed' : 'You said no — kindly',
        body: m.credit.cosign ? 'Most co-signed loans go fine. But the $6,000 loan now appears on your credit report too, and any late payment by your friend hurts your credit as well as theirs.'
          : 'Declining protected your credit and borrowing capacity. Helping in other ways can still make a real difference.',
        facts: m.credit.cosign ? [{ label: 'Debt you’re responsible for if they stop paying', value: $(6000), strong: true }] : [],
        lesson: 'Co-signing means promising to repay someone else’s loan if they don’t. Lenders treat it as your debt. Only co-sign an amount you could afford to pay yourself.',
        tone: 'neutral',
      }),
      check: { topic: 'credit', concept: 'high-cost-debt', q: 'If you co-sign a loan and the borrower stops paying, who owes the money?',
        a: ['You do', 'Nobody — the loan is canceled', 'Only the bank', 'The borrower’s parents'], correct: 0,
        why: 'A co-signer is fully responsible for the debt, and missed payments appear on the co-signer’s credit report.' },
      impact: (m) => (m.credit.cosign ? { amount: 6000, text: 'Co-signing put $6,000 of potential debt on your credit report.' } : null),
    },

    // ======================= Chapter 4
    { id: 'c4_offer', chapter: 4, icon: 'briefcase', title: 'Choose a job offer',
      scene: () => 'Two offers. The higher salary is in a more expensive city. Compare what you’d actually take home and what rent costs.',
      table: () => Object.values(JOBS).map((j) => {
        const p = F.paycheck(j.salary);
        return { id: j.id, city: j.city, title: j.title, salary: j.salary, net: p.monthly.net, rent: j.rent.roommate, rentAlone: j.rent.alone };
      }),
      options: () => Object.values(JOBS).map((j) => ({ id: j.id, label: `${j.title} — ${j.city}`, detail: `${$(j.salary)} salary. 1-bedroom about ${$(j.rent.alone)}; with a roommate about ${$(j.rent.roommate)}.`, icon: j.id === 'metro' ? 'building' : 'home' })),
      outcome: (m) => {
        const p = m.job.pay;
        return {
          headline: `${$(p.monthly.gross)} gross → ${$(p.monthly.net)} take-home`,
          body: 'Your salary is gross pay. Taxes come out before the money reaches your bank account.',
          facts: [
            { label: 'Gross monthly pay', value: $(p.monthly.gross) },
            { label: 'Federal income tax (estimate)', value: `−${$(p.monthly.federal)}` },
            { label: 'Social Security + Medicare (7.65%)', value: `−${$(p.monthly.fica)}` },
            { label: 'State income tax (example 4%)', value: `−${$(p.monthly.state)}` },
            { label: 'Net (take-home) pay', value: $(p.monthly.net), strong: true },
          ],
          lesson: `Federal income tax uses <b>brackets</b>: only the dollars above each threshold are taxed at the higher rate. Your top (marginal) rate here is ${F.pct(p.marginal)}, but your overall federal rate is only about ${F.pct(p.effectiveFederal, 1)}.`,
          calc: { type: 'paycheck', salary: m.job.job.salary },
          tone: 'neutral',
        };
      },
      check: { topic: 'income', concept: 'withholding', q: 'You move into the 22% tax bracket. What does that mean?',
        a: ['Only income above that bracket’s threshold is taxed at 22%', 'All of your income is now taxed at 22%', 'You take home 22% less than before the raise', 'Your state tax is 22%'], correct: 0,
        why: 'Brackets are marginal: each slice of income is taxed at its own rate, so a raise never lowers your take-home pay.' },
    },
    { id: 'c4_housing', chapter: 4, icon: 'home', title: 'Where will you live?',
      scene: (m) => `In ${m.job.job.city}, here’s what housing costs compared with your ${$(m.job.pay.monthly.net)} take-home pay.`,
      options: (m) => {
        const j = m.job.job, net = m.job.pay.monthly.net;
        const o = [
          { id: 'alone', label: `Your own 1-bedroom — ${$(j.rent.alone)}/mo`, detail: `${pctRent(j.rent.alone, net)} of take-home pay. Privacy and your own space.`, icon: 'building' },
          { id: 'roommate', label: `Share with a roommate — ${$(j.rent.roommate)}/mo`, detail: `${pctRent(j.rent.roommate, net)} of take-home pay. Cheaper, less privacy.`, icon: 'user' },
        ];
        if (j.rent.family) o.push({ id: 'family', label: `Live with family for a year — ${$(j.rent.family)}/mo`, detail: `${pctRent(j.rent.family, net)} of take-home pay. Saves the most; less independence.`, icon: 'home' });
        return o;
      },
      outcome: (m) => ({
        headline: `Rent is ${pctRent(m.job.rent, m.job.pay.monthly.net)} of your take-home pay`,
        body: m.job.rent / m.job.pay.monthly.net > 0.35 ? 'That’s above the common 30–35% guideline, so the rest of your budget will be tight.' : 'That leaves solid room for everything else.',
        facts: [{ label: 'Rent + utilities', value: `${$(m.job.rent + m.job.util)}/mo` }],
        lesson: 'A common rule of thumb: keep rent under about 30–35% of take-home pay. Housing is usually the biggest monthly cost, so this one choice shapes your whole budget.',
        tone: m.job.rent / m.job.pay.monthly.net > 0.35 ? 'bad' : 'good',
      }),
      impact: (m) => {
        const cheapest = Math.min(...Object.values(m.job.job.rent));
        const diff = (m.job.rent - cheapest) * 12;
        return diff > 0 ? { amount: diff, text: `Your housing costs ${$(diff)} more per year than the cheapest option in ${m.job.job.city}.` } : null;
      },
    },
    { id: 'c4_transport', chapter: 4, icon: 'car', title: 'Getting to work',
      scene: (m) => (m.job.job.transit ? 'Metro City has good public transit, but a car gives you more freedom.' : 'Riverton’s bus service is limited. Most people drive, but you could get by with a bike and rides.'),
      options: (m) => {
        const o = [];
        if (m.job.job.transit) o.push({ id: 'transit', label: 'Monthly transit pass — $100', detail: 'Cheapest by far. Trips take longer.', icon: 'bus' });
        else o.push({ id: 'rides', label: 'Bike + occasional rides — about $140/mo', detail: 'Cheap, but harder in bad weather.', icon: 'bus' });
        Object.entries(CARS).forEach(([id, c]) => {
          const p = F.monthlyPayment(c.price - 1000, c.apr, c.years);
          o.push({ id, label: c.label, detail: `With $1,000 down: about ${$(p)}/mo for ${c.years} years at ${F.pct(c.apr, 1)} (example), plus ~${$(c.insurance + c.gas)} insurance and gas.`, icon: 'car' });
        });
        return o;
      },
      outcome: (m) => ({
        headline: `Transportation: ${$(m.job.transport)} a month`,
        body: m.job.carLoan ? `Your car loan is ${$(m.job.carLoan)}${m.job.down ? ' after a $1,000 down payment from savings' : ' (no down payment — your savings were too low)'}.` : 'No car payment means more room for savings.',
        facts: m.job.carLoan ? [{ label: 'Car payment', value: $(m.job.carPayment) }, { label: 'Insurance + gas (estimate)', value: $(m.job.transport - m.job.carPayment) }] : [],
        lesson: 'A car costs much more than its payment: insurance, gas, maintenance, and parking add up. A longer loan lowers the payment but increases total interest.',
        tone: 'neutral',
      }),
      impact: (m) => (m.job.carLoan ? { amount: m.job.transport * 12, text: `Your car costs about ${$(m.job.transport * 12)} a year including insurance and gas.` } : null),
    },
    { id: 'c4_repay', chapter: 4, icon: 'calendar', title: 'Pick a student loan repayment plan',
      when: (m) => m.loans.fedBalance > 0,
      scene: (m) => `Your federal loans total ${$(m.loans.fedBalance)}. A longer plan lowers your monthly payment — but you pay more over time.${m.loans.privBalance ? ` (Your ${$(m.loans.privBalance)} private loan stays on a 10-year schedule.)` : ''}`,
      options: (m) => [
        { id: 'standard', label: `Standard: 10 years — ${$(m.job.fedStd.payment)}/mo`, detail: `Total interest about ${$(m.job.fedStd.totalInterest)}.`, icon: 'calendar' },
        { id: 'extended', label: `Longer: 20 years — ${$(m.job.fedExt.payment)}/mo`, detail: `Total interest about ${$(m.job.fedExt.totalInterest)}.`, icon: 'calendar' },
      ],
      outcome: (m) => ({
        headline: m.job.repay === 'extended' ? `${$(m.job.fedStd.payment - m.job.fedExt.payment)} more breathing room each month` : 'Debt-free in 10 years',
        body: m.job.repay === 'extended' ? `The tradeoff: about ${$(m.job.fedExt.totalInterest - m.job.fedStd.totalInterest)} more interest over the life of the loan. You can always pay extra to finish sooner.`
          : 'Higher payments now, but you save on interest and finish a decade sooner.',
        facts: [{ label: 'Federal loan payment', value: `${$(m.job.fedPay)}/mo` }, ...(m.job.privPay ? [{ label: 'Private loan payment', value: `${$(m.job.privPay)}/mo` }] : []), { label: 'Total student loan payments', value: `${$(m.job.loanPayment)}/mo`, strong: true }],
        lesson: 'Stretching a loan over more years lowers each payment but means more months of interest. Federal loans also offer income-driven plans that set payments based on income.',
        calc: { type: 'loan', principal: Math.round(m.loans.fedBalance), apr: A.loans.federalUndergradRate, years: m.job.fedYears },
        tone: 'neutral',
      }),
      check: { topic: 'credit', concept: 'loan-term', q: 'Compared with a 10-year plan, a 20-year plan on the same loan usually means…',
        a: ['Lower monthly payments but more total interest', 'Higher payments and less interest', 'The same total cost', 'No interest at all'], correct: 0,
        why: 'More months of borrowing means more months of interest, even though each payment is smaller.' },
      impact: (m) => (m.job.repay === 'extended' ? { amount: m.job.fedExt.totalInterest - m.job.fedStd.totalInterest, text: `The 20-year plan adds about ${$(m.job.fedExt.totalInterest - m.job.fedStd.totalInterest)} in interest.` } : null),
      flags: (c) => (c === 'extended' ? ['loan-term'] : []),
    },
    { id: 'c4_retire', chapter: 4, icon: 'coins', title: 'Your employer’s retirement plan',
      scene: (m) => `Your job offers a 401(k). The company matches 100% of what you put in, up to 3% of your salary (example terms). 3% of your salary is ${$(m.job.job.salary * 0.03 / 12)} a month.`,
      options: () => [
        { id: 0, label: 'Skip it for now', detail: 'More take-home pay today. You give up the match.', icon: 'x' },
        { id: 0.03, label: 'Put in 3% — get the full match', detail: 'Pre-tax: it lowers your income tax, too.', icon: 'coins' },
        { id: 0.06, label: 'Put in 6%', detail: 'Match stays at 3%, but you save twice as much.', icon: 'chart' },
      ],
      outcome: (m) => ({
        headline: m.job.retire ? `You and your employer save ${$(m.job.contribution + m.job.match)} a month` : 'No retirement savings yet',
        body: m.job.retire ? `Because it’s pre-tax, your take-home pay only drops about ${$(F.paycheck(m.job.job.salary).monthly.net - m.job.pay.monthly.net)} a month.`
          : `You’re passing up ${$(m.job.job.salary * 0.03 / 12)} a month of employer money. That can be a reasonable short-term choice if your budget is very tight.`,
        facts: [{ label: 'Your contribution', value: `${$(m.job.contribution)}/mo` }, { label: 'Employer match', value: `${$(m.job.match)}/mo` },
          { label: `Illustration at age 65 (${F.pct(A.saving.illustrativeReturn)} yearly return — not guaranteed)`, value: $(m.job.retireFV.total), strong: true }],
        lesson: '<b>Compound growth</b> means your earnings start earning too. Starting at 22 gives money over 40 years to grow. Returns are never guaranteed — investments can lose value, especially in the short run.',
        calc: { type: 'growth', monthly: Math.round(m.job.contribution + m.job.match), years: m.job.yearsTo65 },
        tone: m.job.retire ? 'good' : 'neutral',
      }),
      check: { topic: 'saving', concept: 'compound-growth', q: 'Why does starting to save early make such a big difference?',
        a: ['Earnings have more years to earn their own earnings', 'Banks pay young people higher rates', 'Early savings are tax-free forever', 'It doesn’t — only the amount matters'], correct: 0,
        why: 'Compound growth snowballs over time, so years matter as much as dollars.' },
      impact: (m) => (m.job.retire < MATCH_CAP ? { amount: (MATCH_CAP - m.job.retire) * m.job.job.salary, text: `Skipping part of the match leaves about ${$((MATCH_CAP - m.job.retire) * m.job.job.salary)} a year of employer money on the table.` } : null),
      flags: (c) => (c < MATCH_CAP ? ['employer-match'] : []),
    },
    { id: 'c4_budget', chapter: 4, icon: 'chart', kind: 'allocate', title: 'Your first real budget',
      scene: (m) => m.job.flexibility >= 0
        ? `After rent, loans, transportation, and other essentials, you have ${$(m.job.flexibility)} a month. Split it between wants and savings.`
        : `Your essentials cost ${$(-m.job.flexibility)} more than you take home. Go back and change your housing or transportation.`,
      range: (m) => ({ min: 0, max: Math.max(0, Math.floor(m.job.flexibility)), step: 10, label: 'Wants each month', default: Math.round(Math.max(0, m.job.flexibility) * 0.6) }),
      blocked: (m) => m.job.flexibility < 0,
      backTo: ['c4_housing', 'c4_transport'],
      outcome: (m) => ({
        headline: `${$(m.job.saveMonthly)} a month to savings`,
        body: m.job.saveMonthly >= m.job.pay.monthly.net * 0.2 ? 'You’re hitting the 20% savings guideline. Strong start.' : 'Every bit counts. Raising savings even a little each year adds up.',
        facts: [{ label: 'Take-home pay', value: $(m.job.pay.monthly.net) }, { label: 'Essentials', value: `−${$(m.job.essentialTotal)}` }, { label: 'Wants', value: `−${$(m.job.wants)}` }, { label: 'Savings', value: $(m.job.saveMonthly), strong: true }],
        lesson: 'The <b>50/30/20 guideline</b> suggests about 50% of take-home pay for needs, 30% for wants, and 20% for savings and extra debt payments. With student loans and rent, many new grads start with less — that’s normal.',
        calc: { type: 'split', net: Math.round(m.job.pay.monthly.net) },
        tone: m.job.saveMonthly > 0 ? 'good' : 'bad',
      }),
      check: { topic: 'budgeting', concept: '50-30-20', q: 'You take home $3,000 a month. Under 50/30/20, how much is for savings and extra debt payments?',
        a: ['$600', '$900', '$1,500', '$300'], correct: 0, why: '20% of $3,000 = $600.' },
      flags: (v, m) => (m && m.job.saveMonthly < 100 ? ['emergency-fund'] : []),
    },
  ];

  // ---------------------------------------------------------------- flow
  const nodeById = (id) => NODES.find((n) => n.id === id);
  const applies = (n, m) => !n.when || n.when(m);

  function newState(now = Date.now()) {
    return { v: 4, runId: 'run-' + now.toString(36) + Math.random().toString(36).slice(2, 6), startedAt: now, choices: {}, order: [], checks: [], seenChapters: [], done: false };
  }

  /** The next decision the player needs to make, or null when the game is over. */
  function next(state) {
    const m = derive(state.choices);
    return NODES.find((n) => applies(n, m) && !(n.id in state.choices)) || null;
  }

  /** Apply a choice. Returns { state, node, model, outcome }. Throws on invalid choices. */
  function choose(state, nodeId, value) {
    const node = nodeById(nodeId);
    if (!node) throw new Error('Unknown decision ' + nodeId);
    const before = derive(state.choices);
    if (!applies(node, before)) throw new Error('Decision not available: ' + nodeId);
    if (node.kind === 'allocate') {
      if (node.blocked && node.blocked(before)) throw new Error('Budget is blocked until essentials fit');
      const r = node.range(before);
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Budget value must be a number');
      value = clamp(Math.round(value), r.min, r.max);
    } else {
      const opt = node.options(before).find((o) => o.id === value);
      if (!opt) throw new Error(`Invalid option ${value} for ${nodeId}`);
      if (opt.disabled) throw new Error(`Option ${value} is not available`);
    }
    const s = { ...state, choices: { ...state.choices, [nodeId]: value }, order: [...state.order.filter((x) => x !== nodeId), nodeId] };
    const model = derive(s.choices);
    const outcome = node.outcome(model);
    s.done = !next(s);
    return { state: s, node, model, outcome, flags: node.flags ? node.flags(value, model) : [] };
  }

  /** Go back to an earlier decision: forget it and every decision made after it. */
  function rewind(state, nodeId) {
    const idx = state.order.indexOf(nodeId);
    if (idx < 0) return state;
    const keep = state.order.slice(0, idx);
    const choices = {};
    keep.forEach((k) => { choices[k] = state.choices[k]; });
    return { ...state, choices, order: keep, checks: state.checks.filter((c) => keep.includes(c.node)), done: false };
  }

  function recordCheck(state, nodeId, correct) {
    const node = nodeById(nodeId);
    if (!node || !node.check) return state;
    const checks = state.checks.filter((c) => c.node !== nodeId);
    checks.push({ node: nodeId, topic: node.check.topic, concept: node.check.concept, correct: !!correct });
    return { ...state, checks };
  }

  function progress(state) {
    const m = derive(state.choices);
    const total = NODES.filter((n) => applies(n, m)).length;
    const done = NODES.filter((n) => applies(n, m) && n.id in state.choices).length;
    return { done, total, pct: total ? done / total : 0 };
  }

  /** Final picture + the decisions with the biggest dollar effects. */
  function summary(state) {
    const m = derive(state.choices);
    const impacts = state.order.map((id) => {
      const n = nodeById(id);
      const imp = n && n.impact ? n.impact(m) : null;
      return imp ? { node: id, title: n.title, chapter: n.chapter, ...imp } : null;
    }).filter(Boolean).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const flags = [...new Set(state.order.flatMap((id) => {
      const n = nodeById(id);
      return n && n.flags ? n.flags(state.choices[id], m) : [];
    }))];
    return { model: m, impacts, flags };
  }

  return { COLLEGES, JOBS, CARS, CHAPTERS, NODES, derive, newState, next, choose, rewind, recordCheck, progress, summary, nodeById, MATCH_CAP };
});
