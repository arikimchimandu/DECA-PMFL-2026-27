/* centsible. — Swipe Through College v3: all learning content.
 *
 * Reviewers: everything students read is in this file.
 *
 * units      The 4 chapters, in order. Each opens with a short interactive lesson ("concept").
 * cards      Swipe decisions.
 *   id       unique key used by the dashboard (don't rename once data is collected)
 *   unit     which chapter it belongs to
 *   core     true = in every game; the rest are drawn at random so replays differ
 *   best     'L' or 'R' = the financially smarter choice (leave out if both are reasonable)
 *   icon     picture on the card (see icons.js)
 *   terms    money terms unlocked into the player's Money Notebook
 *   L / R    the two choices: fx (meter changes, 0–100 scale), debt ($), head, lesson, math (optional)
 * glossary   definitions for every term
 * quiz       asked before AND after the game to measure learning
 *
 * Sources: College Board, Trends in College Pricing 2024 (2024–25 averages);
 * Federal Student Aid, Direct Loan rate for 2025–26 undergraduates (6.39%);
 * Federal Reserve, average credit card APR (~21–24%).
 * Loan and card math uses standard monthly amortization.
 */
window.CENTSIBLE_CONTENT = {
  deckSize: 10,

  start: { cash: 50, grades: 70, wellbeing: 60, debt: 0 },

  units: [
    { id: 'pay', n: 1, title: 'Paying for college', topic: 'Tuition & aid', concept: 'netprice',
      terms: ['stickerPrice', 'netPrice', 'grant'] },
    { id: 'borrow', n: 2, title: 'Borrowing smart', topic: 'Student loans', concept: 'interest',
      terms: ['principal', 'interestRate'] },
    { id: 'spend', n: 3, title: 'Spending in college', topic: 'Credit & choices', concept: 'credit',
      terms: ['apr', 'minimumPayment'] },
    { id: 'life', n: 4, title: 'Life after graduation', topic: 'Budgeting', concept: 'budget',
      terms: ['budget', 'rule503020'] },
  ],

  cards: [
    // ---------- 1. Paying for college ----------
    { id: 'fafsa', unit: 'pay', core: true, best: 'R', who: 'School counselor', whoIcon: 'user', icon: 'form', terms: ['fafsa'],
      text: 'The FAFSA just opened. It takes about 30 minutes. Fill it out now?',
      L: { label: 'Later', fx: { wellbeing: +5 }, debt: 16000, head: 'You never got around to it',
           lesson: 'Skipping the <b>FAFSA</b> means skipping free money. Without it you can’t get federal grants, work-study, or most school aid.' },
      R: { label: 'Do it now', fx: { wellbeing: -5, cash: +10 }, debt: 0, head: 'Grants unlocked',
           lesson: 'The FAFSA made you eligible for <b>grants</b> — money you never pay back. File it <b>every year</b> you’re in school.',
           math: 'Average Pell Grant ≈ $4,000/yr × 4 years ≈ <b>$16,000</b> you don’t have to borrow.' } },

    { id: 'school', unit: 'pay', core: true, best: 'R', who: 'Admissions mail', whoIcon: 'mail', icon: 'gradcap', terms: ['stickerPrice'],
      text: 'You got in! Dream school out of state ($43,550/yr) or in-state ($24,380/yr)?',
      stake: 'Prices include tuition, housing, and food',
      L: { label: 'Dream school', fx: { wellbeing: +15 }, debt: 45000, head: 'Living the dream — on loans',
           lesson: 'Out-of-state tuition averages about <b>2.5×</b> in-state. Before choosing, run each school’s <b>net price calculator</b> to see what you’d really pay.',
           math: '$43,550 × 4 = <b>$174,200</b> vs. $24,380 × 4 = <b>$97,520</b>. A $76,680 difference.' },
      R: { label: 'In-state', fx: { wellbeing: -5, cash: +5 }, debt: 12000, head: 'Same degree, far less debt',
           lesson: 'Public in-state schools average about <b>$11,610/yr</b> in tuition. Many have honors programs that rival private schools.',
           math: '$43,550 × 4 = $174,200 vs. $24,380 × 4 = $97,520. You saved <b>$76,680</b> in sticker price.' } },

    { id: 'community', unit: 'pay', best: 'R', who: 'Your cousin', whoIcon: 'chat', icon: 'bus', terms: ['transferCredits'],
      text: 'Start at community college for 2 years, then transfer? It saves a lot.',
      L: { label: '4 years at a university', fx: { wellbeing: +5 }, debt: 6000, head: 'The full campus experience',
           lesson: 'A valid choice! Just know community college is often the cheapest path to the same bachelor’s degree.' },
      R: { label: 'Start at community college', fx: { cash: +10, wellbeing: -5 }, debt: -8000, head: 'About $15,000 saved',
           lesson: 'Check that your <b>credits transfer</b> before you enroll — many states have guaranteed transfer agreements.',
           math: '($11,610 − $4,050) × 2 years ≈ <b>$15,120</b> saved on tuition.' } },

    { id: 'scholarship', unit: 'pay', best: 'R', who: 'Local credit union', whoIcon: 'bank', icon: 'award', terms: ['scholarship'],
      text: 'A local scholarship wants a 500-word essay. The prize is $2,000.',
      L: { label: 'Too much work', fx: { wellbeing: +5 }, debt: 0, head: 'You left $2,000 on the table',
           lesson: 'Local scholarships get <b>far fewer applicants</b> than national ones, so your odds are better than you think.' },
      R: { label: 'Write the essay', fx: { grades: +5, wellbeing: -5 }, debt: -2000, head: 'You won $2,000',
           lesson: '<b>Scholarships</b> are free money. You can often reuse one essay for several applications.',
           math: '2 hours of writing for $2,000 = <b>$1,000 an hour</b>.' } },

    // ---------- 2. Borrowing smart ----------
    { id: 'loan', unit: 'borrow', core: true, best: 'R', who: 'Financial aid office', whoIcon: 'building', icon: 'bank', terms: ['federalLoan', 'subsidized'],
      text: 'You still need $10,000 this year. Federal loan at 6.39% or a bank loan at 9.5%?',
      L: { label: 'Bank loan (9.5%)', fx: { cash: -5 }, debt: 2000, head: 'That rate costs you',
           lesson: 'Private loans usually have higher rates and fewer protections. Use <b>federal loans first</b>.',
           math: '$10,000 over 10 years: 9.5% → $129/mo, <b>$15,530</b> total. 6.39% → $113/mo, $13,560 total. You pay <b>~$1,970 more</b>.' },
      R: { label: 'Federal (6.39%)', fx: { cash: +5 }, debt: 0, head: 'Federal first — correct',
           lesson: 'Federal loans have fixed rates, income-driven repayment, and pauses if you lose a job. <b>Subsidized</b> ones don’t grow while you’re in school.',
           math: '$10,000 over 10 years at 6.39% → $113/mo, $13,560 total — <b>~$1,970 less</b> than the bank loan.' } },

    { id: 'job', unit: 'borrow', best: 'R', who: 'Campus café', whoIcon: 'store', icon: 'coffee', terms: ['workStudy'],
      text: 'We’re hiring! 10 hours a week at $15/hour.',
      L: { label: 'No, I’m busy', fx: { grades: +5, cash: -10 }, debt: 4000, head: 'More study time, more borrowing',
           lesson: 'Fair choice — but every dollar you earn is a dollar you <b>don’t borrow</b> (and don’t pay interest on).' },
      R: { label: 'Take the job', fx: { cash: +20, grades: -5, wellbeing: -5 }, debt: -8000, head: 'Earning instead of borrowing',
           lesson: 'Working about <b>10–15 hours a week</b> usually doesn’t hurt grades. Ask about <b>work-study</b> jobs funded by your aid.',
           math: '10 hrs × $15 × ~30 school weeks ≈ <b>$4,500 a year</b>.' } },

    { id: 'internship', unit: 'borrow', who: 'Career center', whoIcon: 'building', icon: 'briefcase', terms: ['opportunityCost'],
      text: 'Summer offers: an unpaid internship in your field, or a retail job paying $4,000.',
      L: { label: 'Unpaid internship', fx: { grades: +10, cash: -10 }, debt: 1500, head: 'Great résumé, empty wallet',
           lesson: 'Experience matters for your first job. Ask your school about <b>stipends</b> for unpaid internships. The $4,000 you gave up is the <b>opportunity cost</b>.' },
      R: { label: 'Paid job', fx: { cash: +15 }, debt: -4000, head: '$4,000 toward next year',
           lesson: 'Summer earnings replace loans dollar for dollar. Paid internships exist too — start searching in the fall. The experience you skipped is the <b>opportunity cost</b>.' } },

    // ---------- 3. Spending in college ----------
    { id: 'creditcard', unit: 'spend', core: true, best: 'L', who: 'Table on campus', whoIcon: 'store', icon: 'card', terms: ['creditScore'],
      text: 'Sign up for a credit card today and get a free T-shirt and pizza!',
      L: { label: 'No thanks', fx: { wellbeing: -5 }, debt: 0, head: 'You skipped the impulse sign-up',
           lesson: 'Credit cards aren’t bad — used carefully, one builds your <b>credit score</b>. Get one on purpose, not for free pizza, and pay it in full every month.' },
      R: { label: 'Free pizza!', fx: { wellbeing: +10, cash: -10 }, debt: 1800, head: 'You ran up an $1,800 balance',
           lesson: 'Easy credit led to a balance you can’t pay off right away. Missed or late payments also hurt your <b>credit score</b>.',
           math: '$1,800 at 24% APR, paying $50/month: about <b>5½ years</b> and <b>~$3,200</b> total.' } },

    { id: 'textbooks', unit: 'spend', best: 'R', who: 'Campus bookstore', whoIcon: 'store', icon: 'book', terms: ['needsWants'],
      text: 'Your textbooks cost $480 new — or $120 to rent used copies.',
      L: { label: 'Buy new', fx: { cash: -15 }, debt: 0, head: 'Shiny — and expensive',
           lesson: 'You <b>need</b> the books; you just don’t need them new. Separating needs from wants is the core of budgeting.' },
      R: { label: 'Rent used', fx: { cash: +10 }, debt: 0, head: '$360 saved',
           lesson: 'Renting, buying used, or using the library meets the <b>need</b> for a fraction of the cost.',
           math: '$480 − $120 = $360 per semester × 8 semesters ≈ <b>$2,900</b>.' } },

    { id: 'mealplan', unit: 'spend', best: 'R', who: 'Housing office', whoIcon: 'building', icon: 'utensils', terms: ['needsWants'],
      text: 'Unlimited meal plan ($3,200) or a basic plan and cook sometimes ($2,100)?',
      L: { label: 'Unlimited', fx: { wellbeing: +10, cash: -10 }, debt: 1100, head: 'Eating well — at a price',
           lesson: 'Check how many meals you’d <b>actually use</b>. Many students pay for meals they never eat.' },
      R: { label: 'Basic plan', fx: { cash: +10, wellbeing: -5 }, debt: 0, head: '$1,100 saved',
           lesson: 'Cooking a few meals a week is one of the easiest ways to stretch a budget.',
           math: '$3,200 − $2,100 = <b>$1,100</b> a year.' } },

    { id: 'springbreak', unit: 'spend', best: 'L', who: 'Group chat', whoIcon: 'chat', icon: 'plane', terms: ['minimumPayment'],
      text: 'Spring break trip with friends — $1,200 each. You’d have to put it on a card.',
      L: { label: 'Skip it this year', fx: { wellbeing: -15, cash: +10 }, debt: 0, head: 'Hard choice, no debt',
           lesson: 'Saying no is tough. A small <b>“fun fund”</b> in your budget lets you plan the next trip without a card.' },
      R: { label: 'I’m in', fx: { wellbeing: +20, cash: -20 }, debt: 1200, head: 'Great week — on credit',
           lesson: 'Paying only the <b>minimum payment</b> makes a short trip a long debt.',
           math: '$1,200 at 24% APR, paying $40/month: almost <b>4 years</b> and <b>~$1,850</b> total.' } },

    // ---------- 4. Life after graduation ----------
    { id: 'apartment', unit: 'life', core: true, best: 'R', who: 'First paycheck', whoIcon: 'receipt', icon: 'building', terms: ['housingRule'],
      text: 'You take home $3,600/month. Live alone ($1,500) or with a roommate ($900)?',
      L: { label: 'Live alone', fx: { wellbeing: +10, cash: -20 }, debt: 0, head: 'Your own place — and a tight budget',
           lesson: 'A common guideline is to keep rent under about <b>30–35%</b> of take-home pay.',
           math: '$1,500 ÷ $3,600 = <b>42%</b> of your pay goes to rent.' },
      R: { label: 'Get a roommate', fx: { cash: +20, wellbeing: -5 }, debt: 0, head: '$600 a month freed up',
           lesson: 'Lower rent leaves room to save and pay down loans faster.',
           math: '$900 ÷ $3,600 = <b>25%</b> of pay. Savings: $600 × 12 = <b>$7,200 a year</b>.' } },

    { id: 'autosave', unit: 'life', core: true, best: 'R', who: 'Your bank app', whoIcon: 'phone', icon: 'coins', terms: ['payYourselfFirst', 'emergencyFund'],
      text: 'Automatically move 20% of every paycheck into savings?',
      L: { label: 'Spend it', fx: { wellbeing: +10, cash: -20 }, debt: 0, head: 'Nothing saved this year',
           lesson: 'Without savings, any surprise expense becomes debt. Even 10% builds an <b>emergency fund</b> fast.' },
      R: { label: 'Auto-save 20%', fx: { cash: +25 }, debt: -3000, head: 'You paid yourself first',
           lesson: 'Saving automatically works because you never see the money. Build an <b>emergency fund</b> first, then put extra toward loans.',
           math: '20% × $3,600 = $720/month → <b>$8,640 a year</b>.' } },

    { id: 'repayment', unit: 'life', best: 'R', who: 'Loan servicer', whoIcon: 'mail', icon: 'calendar', terms: ['principal'],
      text: 'Your first loan bill arrived. Pay the minimum, or add $50 a month?',
      L: { label: 'Pay the minimum', fx: { cash: +5 }, debt: 0, head: 'Paid on time',
           lesson: 'Paying on time, every time, is what matters most for your <b>credit score</b>.' },
      R: { label: 'Add $50/month', fx: { cash: -5 }, debt: -2000, head: 'Paying it down faster',
           lesson: 'Extra payments go straight to the <b>principal</b>, so less interest builds up.',
           math: 'On $30,000 at 6.39%, an extra $50/month saves <b>~$1,900</b> and finishes <b>~20 months early</b>.' } },

    // ---------- Plot twists (one is always the last card) ----------
    { id: 'car', unit: 'life', twist: true, who: 'Your car', whoIcon: 'alert', icon: 'car', cost: 1200, terms: ['emergencyFund'],
      text: 'Surprise! Your car needs a $1,200 repair to pass inspection.' },
    { id: 'phone', unit: 'life', twist: true, who: 'Your phone', whoIcon: 'alert', icon: 'phone', cost: 900, terms: ['emergencyFund'],
      text: 'You dropped your phone and need it for work. The repair is $900.' },
  ],

  // Plot twists are decided by how much cash the player has built up.
  twist: {
    threshold: 45,
    L: { label: 'Put it on a card', fx: { wellbeing: -5 }, debtMult: 1.25, head: 'Now it’s credit card debt',
         lesson: 'At ~24% APR, a surprise bill grows if you can’t pay it off right away. An <b>emergency fund</b> of 3–6 months of expenses prevents this.' },
    R_ok: { label: 'Use emergency fund', fx: { cash: -20 }, debtMult: 0, good: true, head: 'Handled — no debt, no stress',
            lesson: 'This is exactly what an <b>emergency fund</b> is for. Now rebuild it a little each paycheck.' },
    R_short: { label: 'Use emergency fund', fx: { wellbeing: -10 }, debtMult: 1.25, head: 'Not enough saved',
               lesson: 'Your savings were too low, so it went on a card anyway. Saving even <b>$25 a paycheck</b> adds up.' },
  },

  glossary: {
    stickerPrice: { t: 'Sticker price', d: 'The full published cost of a college — tuition, fees, housing, and food — before any aid.' },
    netPrice: { t: 'Net price', d: 'What you actually pay: the sticker price minus grants and scholarships.' },
    grant: { t: 'Grant', d: 'Money for school you never pay back, usually based on financial need.' },
    fafsa: { t: 'FAFSA', d: 'Free Application for Federal Student Aid. The form that unlocks federal grants, work-study, federal loans, and most college aid.' },
    scholarship: { t: 'Scholarship', d: 'Free money for school, often based on grades, talent, community, or background.' },
    transferCredits: { t: 'Transfer credits', d: 'College credits that count toward your degree at another school.' },
    principal: { t: 'Principal', d: 'The amount you originally borrow. Interest is charged on what’s left of it.' },
    interestRate: { t: 'Interest rate', d: 'The yearly cost of borrowing, as a percentage of what you owe.' },
    federalLoan: { t: 'Federal student loan', d: 'A loan from the government with a fixed rate and flexible repayment options.' },
    subsidized: { t: 'Subsidized loan', d: 'A federal loan where the government pays the interest while you’re in school at least half-time.' },
    workStudy: { t: 'Work-study', d: 'Federal aid that pays for part-time jobs for students with financial need.' },
    opportunityCost: { t: 'Opportunity cost', d: 'What you give up when you choose one option over another.' },
    apr: { t: 'APR', d: 'Annual percentage rate — the yearly interest rate on a credit card or loan.' },
    minimumPayment: { t: 'Minimum payment', d: 'The smallest amount a card lets you pay each month. Paying only this keeps you in debt much longer.' },
    creditScore: { t: 'Credit score', d: 'A number (300–850) showing how reliably you repay debt. It affects loans, apartments, and sometimes jobs.' },
    needsWants: { t: 'Needs vs. wants', d: 'Needs are things you must have (housing, food, books). Wants are nice to have. Budgets cover needs first.' },
    budget: { t: 'Budget', d: 'A plan for how you’ll spend and save your money each month.' },
    rule503020: { t: '50/30/20 rule', d: 'A simple budget: 50% of take-home pay for needs, 30% for wants, 20% for savings and extra debt payments.' },
    housingRule: { t: 'Rent rule of thumb', d: 'Try to keep rent under about 30–35% of your take-home pay.' },
    payYourselfFirst: { t: 'Pay yourself first', d: 'Move money to savings automatically on payday, before you spend anything.' },
    emergencyFund: { t: 'Emergency fund', d: 'Savings set aside only for surprises — ideally 3 to 6 months of expenses.' },
  },

  // Same questions before and after. "why" is shown after the post-game answers.
  quiz: [
    { q: 'What do you fill out to apply for college grants?', a: ['A credit card application', 'The FAFSA', 'A W-2 form', 'Nothing — grants are automatic'], correct: 1,
      why: 'The FAFSA unlocks federal grants, work-study, federal loans, and most school aid. File it every year.' },
    { q: 'A college’s “net price” is…', a: ['The price listed on its website', 'The price after grants and scholarships', 'The cost of housing only', 'The out-of-state price'], correct: 1,
      why: 'Net price = sticker price − grants and scholarships. It’s what you actually pay.' },
    { q: 'You borrow $10,000 for 10 years. About how much more do you repay at 9% than at 6%?', a: ['About $30', 'About $1,900', 'About $9,000', 'The same amount'], correct: 1,
      why: 'At 6% you repay about $13,300; at 9% about $15,200. Three percentage points cost about $1,900.' },
    { q: 'Which kind of student loan should you usually use first?', a: ['Private bank loan', 'Federal student loan', 'Credit card', 'Payday loan'], correct: 1,
      why: 'Federal loans have fixed rates and protections like income-driven repayment that private loans usually don’t.' },
    { q: 'In the 50/30/20 rule, what is the 20% for?', a: ['Rent', 'Fun and wants', 'Savings and debt payments', 'Food'], correct: 2,
      why: '50% needs, 30% wants, 20% savings and extra debt payments.' },
  ],

  personalities: [
    { id: 'saver', icon: 'acorn', t: 'The Saver', d: 'You plan ahead and stash money away. Low debt and solid savings — future you is in great shape.',
      when: (s) => s.debt <= 15000 && s.cash >= 70 },
    { id: 'hunter', icon: 'search', t: 'The Aid Hunter', d: 'You track down every dollar of free money — grants, scholarships, and smart deals.',
      when: (s, picks) => picks.fafsa === 'R' && s.debt <= 25000 },
    { id: 'spender', icon: 'rocket', t: 'The Big Spender', d: 'You went all in on experiences. Fun now — but a lot of debt to pay off later.',
      when: (s) => s.wellbeing >= 65 && s.debt > 30000 },
    { id: 'scholar', icon: 'gradcap', t: 'The Scholar', d: 'Grades come first. Now make your money skills as strong as your GPA.',
      when: (s) => s.grades >= 75 },
    { id: 'balancer', icon: 'scale', t: 'The Balancer', d: 'A little fun, a little saving. Some wins, some lessons — that’s real life.',
      when: () => true },
  ],
};
