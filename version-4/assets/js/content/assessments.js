/* Centspire V4 — pre/post assessment.
 *
 * Two equivalent forms (A and B). Item N on each form tests the same learning objective
 * at similar difficulty with different numbers or context, so improvement can be compared fairly.
 * Each participant is randomly assigned A→B or B→A (counterbalancing). The delayed retention
 * check (7+ days later) reuses the student's first form.
 *
 * Topics: college, budgeting, credit, saving, income (2 items each).
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Assessments = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TOPICS = [
    { id: 'college', label: 'College financing', icon: 'gradcap' },
    { id: 'budgeting', label: 'Budgeting', icon: 'chart' },
    { id: 'credit', label: 'Credit & debt', icon: 'card' },
    { id: 'saving', label: 'Saving & investing', icon: 'coins' },
    { id: 'income', label: 'Income & taxes', icon: 'receipt' },
  ];

  // objective → what the item measures (shown in reports and the team dashboard)
  const OBJECTIVES = [
    { slot: 1, topic: 'college', concept: 'net-price', objective: 'Calculate net price from cost of attendance and gift aid' },
    { slot: 2, topic: 'college', concept: 'aid-types', objective: 'Tell gift aid apart from loans and loan types' },
    { slot: 3, topic: 'budgeting', concept: '50-30-20', objective: 'Apply the 50/30/20 guideline to take-home pay' },
    { slot: 4, topic: 'budgeting', concept: 'needs-wants', objective: 'Prioritize needs over wants when a budget is tight' },
    { slot: 5, topic: 'credit', concept: 'min-payment', objective: 'Explain the cost of paying only the minimum' },
    { slot: 6, topic: 'credit', concept: 'utilization', objective: 'Calculate credit utilization' },
    { slot: 7, topic: 'saving', concept: 'emergency-fund', objective: 'Size an emergency fund from monthly essentials' },
    { slot: 8, topic: 'saving', concept: 'compound-growth', objective: 'Calculate compound growth' },
    { slot: 9, topic: 'income', concept: 'gross-net', objective: 'Calculate net pay from gross pay and deductions' },
    { slot: 10, topic: 'income', concept: 'payroll', objective: 'Identify payroll taxes and withholding forms' },
  ];

  const A = [
    { slot: 1, q: 'A college costs $40,000 a year. You’re offered $15,000 in grants and scholarships. What is your net price?',
      a: ['$25,000', '$40,000', '$55,000', '$15,000'], correct: 0,
      why: 'Net price = cost of attendance − grants and scholarships: $40,000 − $15,000 = $25,000.' },
    { slot: 2, q: 'Which type of financial aid usually does NOT have to be paid back?',
      a: ['A federal grant', 'An unsubsidized federal loan', 'A private student loan', 'A Parent PLUS loan'], correct: 0,
      why: 'Grants (and scholarships) are gift aid. Every kind of loan must be repaid, usually with interest.' },
    { slot: 3, q: 'You take home $2,000 a month. Using the 50/30/20 guideline, how much goes to savings and extra debt payments?',
      a: ['$400', '$600', '$1,000', '$200'], correct: 0,
      why: '20% of $2,000 = $400. (50% = $1,000 for needs, 30% = $600 for wants.)' },
    { slot: 4, q: 'Which of these is a need?',
      a: ['Rent', 'A streaming subscription', 'Concert tickets', 'New sneakers when your old ones still fit'], correct: 0,
      why: 'Needs are things you must pay to live and work, like housing, food, and basic transportation.' },
    { slot: 5, q: 'You owe $1,000 on a card with a 24% APR and pay only $25 a month. About how long until it’s paid off?',
      a: ['About 7 years, with over $1,000 in interest', 'About 4 months, with no extra cost', 'About 1 year, with $50 in interest', 'Exactly 40 months, with no interest'], correct: 0,
      why: 'At 24% APR, about $20 of each early $25 payment is interest. It takes roughly 81 months and costs about $1,030 in interest.' },
    { slot: 6, q: 'Your credit limit is $2,000 and your balance is $1,000. What is your credit utilization?',
      a: ['50%', '20%', '200%', '100%'], correct: 0,
      why: 'Utilization = balance ÷ limit = $1,000 ÷ $2,000 = 50%. Common guidance is to stay under 30%.' },
    { slot: 7, q: 'Your essential expenses are $1,500 a month. What’s a 3-month emergency fund?',
      a: ['$4,500', '$1,500', '$3,000', '$500'], correct: 0,
      why: '3 × $1,500 = $4,500. Many experts suggest 3–6 months of essential expenses.' },
    { slot: 8, q: 'You invest $1,000 that earns 10% per year, compounded yearly. How much do you have after 2 years?',
      a: ['$1,210', '$1,200', '$1,100', '$2,000'], correct: 0,
      why: 'Year 1: $1,000 × 1.10 = $1,100. Year 2: $1,100 × 1.10 = $1,210. You earn interest on your interest.' },
    { slot: 9, q: 'Your gross pay is $3,000 for the month. Taxes and deductions total $600. What is your net pay?',
      a: ['$2,400', '$3,600', '$3,000', '$600'], correct: 0,
      why: 'Net pay = gross pay − taxes and deductions: $3,000 − $600 = $2,400. That’s what reaches your bank account.' },
    { slot: 10, q: 'The FICA taxes taken from your paycheck pay for…',
      a: ['Social Security and Medicare', 'Your state’s schools', 'Your health insurance plan', 'Federal student aid'], correct: 0,
      why: 'FICA is 7.65% of pay: 6.2% for Social Security and 1.45% for Medicare.' },
  ];

  const B = [
    { slot: 1, q: 'A school’s total cost is $32,000 a year. You get a $9,000 grant and a $3,000 scholarship. What is your net price?',
      a: ['$20,000', '$32,000', '$23,000', '$12,000'], correct: 0,
      why: 'Net price = $32,000 − $9,000 − $3,000 = $20,000. Loans are not subtracted — you still have to pay them back.' },
    { slot: 2, q: 'What makes a subsidized federal student loan different from an unsubsidized one?',
      a: ['The government pays the interest while you’re in school at least half-time', 'It never has to be repaid', 'It has a higher interest rate', 'Only parents can take it out'], correct: 0,
      why: 'Subsidized loans don’t build interest while you’re enrolled at least half-time. Unsubsidized loans do.' },
    { slot: 3, q: 'You take home $2,500 a month. Using the 50/30/20 guideline, how much is for needs?',
      a: ['$1,250', '$750', '$500', '$2,000'], correct: 0,
      why: '50% of $2,500 = $1,250 for needs. Wants get $750 (30%) and savings/debt gets $500 (20%).' },
    { slot: 4, q: 'Your budget is $150 short this month. What’s the best first step?',
      a: ['Cut back on wants, like eating out', 'Skip this month’s rent', 'Stop paying your phone bill', 'Put it on a card and ignore it'], correct: 0,
      why: 'Trim wants first so needs — housing, food, transportation, bills — stay covered.' },
    { slot: 5, q: 'You owe $600 on a card with a 22% APR and pay $20 a month. About how long until it’s paid off?',
      a: ['About 3½ years, with roughly $280 in interest', 'About 2½ months, with no interest', 'About 1 year, with $20 in interest', 'It can never be paid off'], correct: 0,
      why: 'At 22% APR, about $11 of the first $20 payment is interest. It takes about 44 months and costs about $280 in interest.' },
    { slot: 6, q: 'Your card limit is $1,500 and your balance is $300. What is your credit utilization?',
      a: ['20%', '30%', '5%', '50%'], correct: 0,
      why: 'Utilization = $300 ÷ $1,500 = 20%. Lower utilization generally helps credit scores.' },
    { slot: 7, q: 'Your essential expenses are $1,800 a month. What’s a 3-month emergency fund?',
      a: ['$5,400', '$1,800', '$3,600', '$600'], correct: 0,
      why: '3 × $1,800 = $5,400. Start small — even one month of expenses is a strong first goal.' },
    { slot: 8, q: 'You invest $2,000 that earns 5% per year, compounded yearly. How much do you have after 2 years?',
      a: ['$2,205', '$2,200', '$2,100', '$4,000'], correct: 0,
      why: 'Year 1: $2,000 × 1.05 = $2,100. Year 2: $2,100 × 1.05 = $2,205.' },
    { slot: 9, q: 'Your gross pay is $2,500 and 18% is withheld for taxes. What is your net pay?',
      a: ['$2,050', '$2,950', '$450', '$2,500'], correct: 0,
      why: '18% of $2,500 = $450 withheld, so net pay = $2,500 − $450 = $2,050.' },
    { slot: 10, q: 'Which form tells your employer how much federal income tax to withhold from your pay?',
      a: ['Form W-4', 'Form W-2', 'Form 1040', 'The FAFSA'], correct: 0,
      why: 'You fill out a W-4 when you start a job. The W-2 is the yearly summary your employer sends you.' },
  ];

  // Answer order is shuffled per student; correct index is tracked by text, not position.
  return { TOPICS, OBJECTIVES, forms: { A, B } };
});
