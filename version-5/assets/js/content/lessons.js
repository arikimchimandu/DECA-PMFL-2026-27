/* Centspire Academy — pathways and lessons.
 *
 * Lesson shape:
 *   id, pathway, order, topic, title, minutes, concepts[]  (concept IDs from concepts.js)
 *   hook        one-line reason to care
 *   explain     short explanation (simple HTML)
 *   example     relatable real-world example (simple HTML)
 *   widget      interactive exercise: { type, ...settings } (see widgets.js)
 *   questions   2–3 concept checks: { q, a[], correct, why, concept }
 *
 * To add a lesson: copy one, give it a new id, and add it to the right pathway. Keep figures in sync
 * with assumptions.js, and have a reviewer check new content.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  root.Centsible = root.Centsible || {};
  root.Centsible.Lessons = mod;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PATHWAYS = [
    { id: 'college', title: 'College Costs & Financial Aid', icon: 'gradcap', topic: 'college',
      blurb: 'Figure out what college will really cost and how to pay for it without regret.' },
    { id: 'budgeting', title: 'Budgeting & Saving', icon: 'chart', topic: 'budgeting',
      blurb: 'Give every dollar a job, build a cushion, and handle surprises.' },
    { id: 'credit', title: 'Credit & Debt', icon: 'card', topic: 'credit',
      blurb: 'Use credit to build your future instead of paying for your past.' },
    { id: 'income', title: 'Income & Taxes', icon: 'receipt', topic: 'income',
      blurb: 'Understand your paycheck before your first one arrives.' },
    { id: 'investing', title: 'Investing Basics', icon: 'coins', topic: 'saving',
      blurb: 'How money grows over time — and the risks that come with it.' },
    { id: 'safety', title: 'Scams & Digital Money', icon: 'shield', topic: 'safety',
      blurb: 'Spot phishing, fake jobs, payment scams, identity theft, and buy-now-pay-later traps.' },
  ];

  const LESSONS = [
    // ===================================================== College Costs & Financial Aid
    { id: 'net-price', pathway: 'college', order: 1, topic: 'college', minutes: 3, concepts: ['net-price'],
      title: 'Sticker Price vs. Net Price',
      hook: 'The most expensive-looking college isn’t always the most expensive one for you.',
      explain: `<p>A college’s <b>sticker price</b> (also called <b>cost of attendance</b>) includes tuition, fees, housing, food, books, and travel. It’s the price before any help.</p>
        <p>Your <b>net price</b> is what’s left after <b>grants and scholarships</b> — money you never pay back. Net price is the number to compare, because it’s what you and your family actually have to cover by paying, saving, working, or borrowing.</p>
        <p>Every college must post a <b>Net Price Calculator</b> on its website that estimates your net price from your family’s finances.</p>`,
      example: `<p>Maya compares two schools. A state university lists $28,000 a year and offers $4,000 in grants: net price <b>$24,000</b>. A private college lists $60,000 but offers a $40,000 grant: net price <b>$20,000</b>. The “expensive” school is cheaper for her.</p>`,
      widget: { type: 'netprice', sticker: 60000, aid: [['Federal Pell Grant', 4500], ['College grant', 30000], ['Outside scholarship', 2000]] },
      questions: [
        { q: 'A college costs $35,000. You receive a $10,000 grant and a $5,500 federal loan. What is your net price?', a: ['$25,000', '$19,500', '$35,000', '$29,500'], correct: 0, concept: 'net-price',
          why: 'Only grants and scholarships are subtracted: $35,000 − $10,000 = $25,000. The loan helps you pay the net price, but it must be repaid.' },
        { q: 'What is the best number to compare between two colleges?', a: ['Net price', 'Sticker price', 'Tuition only', 'Total loans offered'], correct: 0, concept: 'net-price',
          why: 'Net price accounts for free money each school offers you, so it shows the real difference.' },
        { q: 'Where can you get an estimate of a college’s net price before applying?', a: ['The college’s Net Price Calculator', 'Your credit report', 'A W-4 form', 'Only after you enroll'], correct: 0, concept: 'net-price',
          why: 'Colleges are required to provide a Net Price Calculator on their websites.' },
      ] },

    { id: 'aid-types', pathway: 'college', order: 2, topic: 'college', minutes: 4, concepts: ['aid-types', 'fed-vs-private', 'loan-interest', 'loan-term'],
      title: 'Grants, Scholarships, and Student Loans',
      hook: 'Some aid is free. Some aid is a loan with your name on it. Know which is which.',
      explain: `<p><b>Gift aid</b> doesn’t have to be repaid: <b>grants</b> (usually based on need — like the federal Pell Grant) and <b>scholarships</b> (often for grades, talents, or community).</p>
        <p><b>Federal student loans</b> come from the government. Undergraduates all get the same fixed rate (${'6.39%'} for 2025–26). <b>Subsidized</b> loans don’t build interest while you’re in school at least half-time; <b>unsubsidized</b> loans do. Federal loans offer income-driven repayment and pauses if you lose a job.</p>
        <p><b>Private student loans</b> come from banks and lenders. Rates depend on credit (often a parent co-signs), can be variable, and usually have fewer protections. Use them last.</p>
        <p>Standard federal repayment is <b>10 years</b>. Longer plans lower each payment but add years of interest, so the total cost goes up.</p>
        <p>The <b>FAFSA</b> is the free form that unlocks federal grants, work-study, federal loans, and most college aid. It usually opens around October 1 each year.</p>`,
      example: `<p>Jordan’s aid letter lists a $5,000 Pell Grant, a $2,000 scholarship, a $3,500 subsidized loan, and a $2,000 unsubsidized loan. Only $7,000 of that $12,500 is free money — the other $5,500 is debt.</p>`,
      widget: { type: 'loanCompare', principal: 10000, years: 10, rates: [['Federal', 0.0639], ['Private (example)', 0.095]] },
      questions: [
        { q: 'Which type of aid must be repaid?', a: ['An unsubsidized federal loan', 'A Pell Grant', 'A merit scholarship', 'A state grant'], correct: 0, concept: 'aid-types',
          why: 'All loans must be repaid. Grants and scholarships are gift aid.' },
        { q: 'Why do experts suggest using federal student loans before private ones?', a: ['Fixed rates and more repayment protections', 'They never need to be repaid', 'They don’t count as debt', 'They have no borrowing limits'], correct: 0, concept: 'fed-vs-private',
          why: 'Federal loans have fixed rates, income-driven repayment options, and deferment — protections private loans often lack.' },
        { q: 'You borrow $4,000 in unsubsidized loans as a freshman. What happens to the interest while you’re in school?', a: ['It builds up and is added to what you owe', 'The government pays it', 'There is no interest until you graduate', 'The school pays it'], correct: 0, concept: 'loan-interest',
          why: 'Unsubsidized loans start building interest right away; unpaid interest is added to your balance when repayment begins.' },
      ] },

    { id: 'aid-offer', pathway: 'college', order: 3, topic: 'college', minutes: 4, concepts: ['aid-offer', 'net-price', 'opportunity-cost'],
      title: 'Reading a Financial Aid Offer',
      hook: 'Aid offers aren’t standardized. Some make loans look like discounts.',
      explain: `<p>When you’re admitted, colleges send a <b>financial aid offer</b>. To read one, sort every line into three groups:</p>
        <ol><li><b>Gift aid</b> — grants and scholarships (free).</li><li><b>Self-help</b> — work-study (money you earn at a job) and loans (money you repay).</li><li><b>What’s left</b> — the gap you still need to cover.</li></ol>
        <p>Watch for offers that list loans (including Parent PLUS loans) under “aid” and show a small “amount due.” That number hides borrowing. Also check whether scholarships renew every year and what GPA they require.</p>
        <p>A useful affordability check: try to keep your <b>total student debt below your expected first-year salary</b>.</p>`,
      example: `<p>An offer says “Total aid: $38,000 — you owe only $4,000!” But $14,500 of that “aid” is a Parent PLUS loan and $5,500 is a student loan. The real gift aid is $18,000.</p>`,
      widget: { type: 'aidOffer', coa: 42000, lines: [['College grant', 15000, 'gift'], ['Federal Pell Grant', 3000, 'gift'], ['Federal Work-Study', 2500, 'work'], ['Subsidized loan', 3500, 'loan'], ['Unsubsidized loan', 2000, 'loan'], ['Parent PLUS loan', 12000, 'loan']] },
      questions: [
        { q: 'Cost: $30,000. Offer: $8,000 grant, $2,000 scholarship, $5,500 loan, $2,000 work-study. How much is free money?', a: ['$10,000', '$17,500', '$15,500', '$12,000'], correct: 0, concept: 'aid-offer',
          why: 'Only the grant and scholarship are gift aid: $8,000 + $2,000 = $10,000.' },
        { q: 'A scholarship says “renewable with a 3.0 GPA.” What should you plan for?', a: ['Losing it if your GPA drops below 3.0', 'Getting it no matter what', 'Having to repay it after graduation', 'It increasing each year'], correct: 0, concept: 'aid-offer',
          why: 'Renewal conditions matter. Losing a scholarship can raise your cost for the remaining years.' },
        { q: 'You choose to live at home to save $9,000 a year but miss most campus activities. What is that missed experience called?', a: ['An opportunity cost', 'A sunk cost', 'An interest charge', 'A net price'], correct: 0, concept: 'opportunity-cost',
          why: 'Opportunity cost is what you give up when you choose one option over another.' },
      ] },

    // ===================================================== Budgeting & Saving
    { id: 'needs-wants', pathway: 'budgeting', order: 4, topic: 'budgeting', minutes: 2, concepts: ['needs-wants'],
      title: 'Needs vs. Wants',
      hook: 'Every budget starts with one question: what do I actually need?',
      explain: `<p><b>Needs</b> are what you must pay to live and work: housing, basic food, utilities, transportation to school or work, required insurance, and minimum debt payments.</p>
        <p><b>Wants</b> make life better but aren’t required: eating out, streaming, new clothes you don’t need yet, concerts, upgrades.</p>
        <p>The same thing can be both: groceries are a need, but premium snacks are a want. A phone plan is a need for most jobs, but the newest phone is a want. Wants aren’t bad — they just come <i>after</i> needs and savings.</p>`,
      example: `<p>Sam’s budget is $120 short. Cutting streaming ($18), two takeout meals ($40), and a game purchase ($70) fixes it without touching rent or the bus pass.</p>`,
      widget: { type: 'needsWants', items: [['Rent', 'need'], ['Bus pass to work', 'need'], ['Concert tickets', 'want'], ['Groceries', 'need'], ['Third streaming service', 'want'], ['Phone bill', 'need'], ['New shoes (old ones still fit)', 'want'], ['Takeout lunch', 'want']] },
      questions: [
        { q: 'Which is a want?', a: ['Upgrading to the newest phone', 'Electricity bill', 'Minimum payment on a loan', 'Car insurance required by law'], correct: 0, concept: 'needs-wants',
          why: 'A working phone can be a need; upgrading when your current phone works is a want.' },
        { q: 'Your budget is short this month. What should you cut first?', a: ['Wants, like eating out', 'Rent', 'Your loan payment', 'Groceries'], correct: 0, concept: 'needs-wants',
          why: 'Protect needs. Skipping rent or loan payments leads to late fees and bigger problems.' },
      ] },

    { id: 'build-budget', pathway: 'budgeting', order: 5, topic: 'budgeting', minutes: 3, concepts: ['50-30-20', 'budget-balance'],
      title: 'Build a Budget with 50/30/20',
      hook: 'A budget isn’t a punishment. It’s deciding where your money goes before it disappears.',
      explain: `<p>A <b>budget</b> is a plan for your <b>take-home pay</b> (what reaches your bank account). The <b>50/30/20 guideline</b> is a simple starting point:</p>
        <ul><li><b>50% needs</b> — rent, groceries, transportation, bills, minimum debt payments</li><li><b>30% wants</b> — fun, eating out, subscriptions</li><li><b>20% savings & extra debt payments</b></li></ul>
        <p>It’s a guideline, not a law. In expensive cities or with big loan payments, needs may take more than half at first. The goal is to know your numbers and make every dollar count.</p>`,
      example: `<p>Leo takes home $2,800 a month. 50/30/20 suggests $1,400 for needs, $840 for wants, and $560 for savings. His rent and bills are $1,600, so he trims wants to $640 to keep saving $560.</p>`,
      widget: { type: 'split', net: 2800 },
      questions: [
        { q: 'You take home $3,200 a month. Under 50/30/20, how much goes to wants?', a: ['$960', '$640', '$1,600', '$320'], correct: 0, concept: '50-30-20',
          why: '30% of $3,200 = $960.' },
        { q: 'Which income should a budget be based on?', a: ['Take-home (net) pay', 'Your salary before taxes', 'Your hourly wage', 'What you hope to earn next year'], correct: 0, concept: 'budget-balance',
          why: 'You can only spend what actually reaches your account, so budget from net pay.' },
        { q: 'Your needs cost 60% of your pay. What’s a reasonable response?', a: ['Trim wants and keep saving something', 'Stop saving entirely forever', 'Ignore it — guidelines don’t matter', 'Put the difference on a credit card'], correct: 0, concept: 'budget-balance',
          why: 'Adjust the other categories. Even a small amount of saving keeps the habit going.' },
      ] },

    { id: 'emergency-fund', pathway: 'budgeting', order: 6, topic: 'saving', minutes: 3, concepts: ['emergency-fund', 'unexpected-expense', 'saving-goals'],
      title: 'Emergency Funds: Your Financial Airbag',
      hook: 'Surprises are guaranteed. Debt from surprises doesn’t have to be.',
      explain: `<p>An <b>emergency fund</b> is savings set aside <i>only</i> for the unexpected: a car repair, a medical bill, a lost job. A common goal is <b>3 to 6 months of essential expenses</b>.</p>
        <p>That can sound huge, so start small: a first goal of $500–$1,000 covers many common surprises. Keep it in a savings account that’s easy to reach but separate from your spending money.</p>
        <p>Emergency funds are a <b>short-term</b> goal. Long-term goals — like retirement — belong in investments, which can grow more but can also drop in value.</p>`,
      example: `<p>Ana’s car needs a $600 repair. Because she had $900 saved, she paid in cash. Without it, putting $600 on a 24% card and paying $30 a month would take about two years and cost roughly $170 extra.</p>`,
      widget: { type: 'emergency', essentials: 1500, monthlySave: 150 },
      questions: [
        { q: 'Your essential expenses are $2,000 a month. What’s a 3-month emergency fund?', a: ['$6,000', '$2,000', '$3,000', '$600'], correct: 0, concept: 'emergency-fund',
          why: '3 × $2,000 = $6,000.' },
        { q: 'Where should an emergency fund usually be kept?', a: ['In a savings account you can reach quickly', 'In individual stocks', 'In cash under your mattress', 'Lent to a friend'], correct: 0, concept: 'emergency-fund',
          why: 'It needs to be safe and available right away, not exposed to market drops.' },
        { q: 'Which is a long-term saving goal?', a: ['Retirement', 'A car repair fund', 'Next month’s phone bill', 'Concert tickets in two weeks'], correct: 0, concept: 'saving-goals',
          why: 'Long-term goals are years away, which gives investments time to grow.' },
      ] },

    // ===================================================== Credit & Debt
    { id: 'how-cards-work', pathway: 'credit', order: 7, topic: 'credit', minutes: 3, concepts: ['apr', 'utilization'],
      title: 'How Credit Cards Work',
      hook: 'A credit card is a loan you take out every time you swipe.',
      explain: `<p>When you use a credit card, the bank pays the store and you owe the bank. Each month you get a statement with your <b>balance</b>, a <b>due date</b>, and a <b>minimum payment</b>.</p>
        <p>Pay the <b>full statement balance</b> by the due date and most cards charge no interest on purchases. Carry a balance and you pay interest at the card’s <b>APR</b> (annual percentage rate) — often over 20%.</p>
        <p>Your <b>credit limit</b> is the most you can owe. <b>Credit utilization</b> = balance ÷ limit. Common guidance is to keep it under 30%, and lower is better.</p>`,
      example: `<p>Priya has a $1,000 limit and charges $200 a month for gas and her phone, then pays it in full. Her utilization is 20%, she pays $0 in interest, and she builds a record of on-time payments.</p>`,
      widget: { type: 'utilization', limit: 1000, balance: 200 },
      questions: [
        { q: 'If you pay your full statement balance by the due date, how much interest do you usually pay on purchases?', a: ['None', 'The APR on the whole limit', 'Half the APR', 'A fixed $25'], correct: 0, concept: 'apr',
          why: 'Most cards give a grace period: pay in full and purchases cost no interest.' },
        { q: 'Your limit is $2,500 and your balance is $1,000. What is your utilization?', a: ['40%', '25%', '10%', '60%'], correct: 0, concept: 'utilization',
          why: '$1,000 ÷ $2,500 = 40%.' },
        { q: 'What does APR stand for?', a: ['Annual percentage rate', 'Average payment required', 'Account payment record', 'Annual purchase reward'], correct: 0, concept: 'apr',
          why: 'APR is the yearly interest rate charged when you carry a balance.' },
      ] },

    { id: 'min-payments', pathway: 'credit', order: 8, topic: 'credit', minutes: 3, concepts: ['min-payment', 'apr', 'high-cost-debt'],
      title: 'Why Minimum Payments Cost More Than You Think',
      hook: 'The minimum payment is the bank’s favorite number. Here’s why.',
      explain: `<p>Each month, interest is added to whatever you still owe. At 24% APR that’s about <b>2% a month</b>. If your payment is small, most of it goes to interest and barely touches the balance.</p>
        <p>Card statements are required to show how long it would take to pay off the balance making only minimum payments. It’s often years.</p>
        <p>Paying a fixed amount well above the minimum — even $25 or $50 more — cuts both the time and the total interest dramatically. And if you have high-interest card debt, paying it down is usually one of the best “returns” you can get.</p>`,
      example: `<p>Chris owes $1,500 at 24% APR. Paying $40 a month takes almost 6 years and costs roughly $1,300 in interest. Paying $100 a month takes about a year and a half and costs about $300.</p>`,
      widget: { type: 'cardPayoff', balance: 1500, apr: 0.24, payment: 40 },
      questions: [
        { q: 'You owe $1,000 at 24% APR. About how much interest is added the first month?', a: ['$20', '$240', '$2', '$100'], correct: 0, concept: 'apr',
          why: '24% ÷ 12 = 2% per month. 2% of $1,000 = $20.' },
        { q: 'What’s the best way to cut the cost of card debt you already have?', a: ['Pay a fixed amount well above the minimum', 'Pay exactly the minimum', 'Skip a month to save up', 'Open a second card to pay the first'], correct: 0, concept: 'min-payment',
          why: 'Bigger payments shrink the balance faster, so less interest builds each month.' },
        { q: 'Your payment is smaller than the monthly interest. What happens?', a: ['The balance never goes down', 'It’s paid off in a year', 'The bank forgives the rest', 'Your APR drops'], correct: 0, concept: 'high-cost-debt',
          why: 'If interest is larger than the payment, the balance stays the same or grows.' },
      ] },

    { id: 'credit-scores', pathway: 'credit', order: 9, topic: 'credit', minutes: 3, concepts: ['credit-score', 'utilization'],
      title: 'Credit Reports and Scores',
      hook: 'Landlords, lenders, and sometimes employers check your credit. Here’s what they see.',
      explain: `<p>A <b>credit report</b> is a record of your borrowing: accounts, balances, and whether you paid on time. You can get your reports from all three bureaus for free at <b>AnnualCreditReport.com</b>.</p>
        <p>A <b>credit score</b> (commonly 300–850) summarizes that report. In the most widely used models, the biggest factors are <b>payment history</b> and <b>amounts owed</b> (including utilization), followed by length of history, new credit, and types of credit.</p>
        <p>Your score isn’t a grade you get once — it changes as your report changes. Late payments can stay on your report for up to seven years. No game or app can tell you exactly how many points one action changes a real score.</p>`,
      example: `<p>Two friends both have $1,000 limits. One pays on time and keeps balances low. The other misses two payments. After a year, lenders see two very different reports — even though they spend about the same amount.</p>`,
      widget: { type: 'scoreFactors' },
      questions: [
        { q: 'Which is typically the largest factor in a credit score?', a: ['Payment history', 'Number of cards', 'Income', 'Age'], correct: 0, concept: 'credit-score',
          why: 'Paying on time matters most in common scoring models.' },
        { q: 'Where can you check your credit reports for free?', a: ['AnnualCreditReport.com', 'Any social media app', 'Only by paying a bureau', 'Your school counselor'], correct: 0, concept: 'credit-score',
          why: 'AnnualCreditReport.com is the official site for free reports from the three bureaus.' },
        { q: 'Which habit is most likely to help a credit score over time?', a: ['On-time payments and low utilization', 'Maxing out cards and paying later', 'Opening many new cards at once', 'Closing your oldest account'], correct: 0, concept: 'utilization',
          why: 'Reliable payments and low balances relative to limits are the strongest positive signals.' },
      ] },


    { id: 'car-loans', pathway: 'credit', order: 9.5, topic: 'credit', minutes: 4, concepts: ['car-loan', 'loan-term', 'apr'],
      title: 'Your First Car: Loans and the Real Cost',
      hook: 'The monthly payment is the number dealers want you to look at. It’s the wrong number.',
      explain: `<p>A car’s <b>total cost of ownership</b> is much more than its price: the loan payment and interest, plus <b>insurance, gas, and maintenance</b>. For young drivers, insurance alone can cost more than the payment.</p>
        <p>With a car loan, the <b>amount financed</b> is the price minus your down payment. Your <b>APR</b> depends on your credit. With no credit history, many teens need a parent to <b>co-sign</b> and still get higher rates. Lenders also require full-coverage insurance until the loan is paid off.</p>
        <p>Dealers often offer a lower payment by stretching the loan to 6 or 7 years. That means <b>more total interest</b>, and you can end up owing more than the car is worth.</p>
        <p>Smart moves: get <b>preapproved</b> by a bank or credit union first, negotiate the <b>out-the-door price</b> (not the monthly payment), and get insurance quotes before you buy.</p>`,
      example: `<p>Ava finances a $12,000 car at 11% APR. Over 4 years the payment is about <b>$310</b> a month and interest totals about <b>$2,890</b>. Over 6 years the payment drops to about <b>$228</b> — but interest grows to about <b>$4,450</b>. Add $190 for full-coverage insurance, $60 for gas, and $20 for upkeep, and her “$228 car” really costs about <b>$498 a month</b>.</p>`,
      widget: { type: 'carCost', price: 12000, apr: 0.11, years: 6, down: 0, insurance: 190, gas: 60, upkeep: 20 },
      questions: [
        { q: 'A dealer lowers your monthly payment by stretching the loan from 4 years to 6. What happens to the total interest you pay?', a: ['It goes up', 'It goes down', 'It stays exactly the same', 'Interest disappears after 4 years'], correct: 0, concept: 'car-loan',
          why: 'More months of borrowing means more months of interest, even though each payment is smaller.' },
        { q: 'Before you shop at a dealership, what’s a smart first step?', a: ['Get preapproved for a loan from a bank or credit union', 'Decide only on the monthly payment you want', 'Wait to get insurance quotes until after you buy', 'Ask for the longest loan available'], correct: 0, concept: 'car-loan',
          why: 'A preapproval shows you a real rate to compare, so you can tell whether the dealer’s financing is a good deal.' },
        { q: 'Your car payment is $250, insurance is $150, gas is $80, and maintenance is $40. What does the car really cost each month?', a: ['$520', '$250', '$400', '$330'], correct: 0, concept: 'car-loan',
          why: '$250 + $150 + $80 + $40 = $520. The payment is less than half of the real cost.' },
      ] },

    // ===================================================== Income & Taxes
    { id: 'gross-net', pathway: 'income', order: 10, topic: 'income', minutes: 3, concepts: ['gross-net', 'income-planning'],
      title: 'Gross Pay vs. Net Pay',
      hook: 'A $20-an-hour job doesn’t put $20 an hour in your bank account.',
      explain: `<p><b>Gross pay</b> is what you earn before anything is taken out: hours × hourly wage, or your salary divided by pay periods.</p>
        <p><b>Net pay</b> (take-home pay) is what’s deposited after <b>deductions</b>: federal income tax, Social Security and Medicare (together called <b>FICA</b>, 7.65%), state and local taxes in many states, and benefits like health insurance or retirement contributions.</p>
        <p>When comparing jobs, compare take-home pay <i>and</i> costs like rent and commuting — a higher salary in an expensive city may leave you with less.</p>`,
      example: `<p>Aiden works 15 hours a week at $16/hour: $240 gross per week. About $18 goes to FICA, and some may go to federal and state income tax depending on his total yearly earnings. His paycheck is less than $240.</p>`,
      widget: { type: 'paycheck', salary: 48000 },
      questions: [
        { q: 'You work 20 hours at $15/hour. What is your gross pay?', a: ['$300', '$277', '$35', '$3,000'], correct: 0, concept: 'gross-net',
          why: 'Gross pay = 20 × $15 = $300, before any deductions.' },
        { q: 'Job A pays $60,000 where rent is $1,800. Job B pays $52,000 where rent is $1,000. What should you compare?', a: ['Take-home pay minus major costs like rent', 'Only the salaries', 'Only the job titles', 'Only the rent'], correct: 0, concept: 'income-planning',
          why: 'What matters is how much is left after taxes and essential costs.' },
      ] },

    { id: 'paycheck', pathway: 'income', order: 11, topic: 'income', minutes: 3, concepts: ['payroll', 'gross-net'],
      title: 'Reading Your First Pay Stub',
      hook: 'Your pay stub is a receipt for your work. Learn to check it.',
      explain: `<p>A <b>pay stub</b> shows the pay period, hours, gross pay, each deduction, net pay, and <b>year-to-date (YTD)</b> totals.</p>
        <ul><li><b>Federal income tax</b> — based on the <b>Form W-4</b> you fill out when you’re hired.</li><li><b>Social Security (6.2%)</b> and <b>Medicare (1.45%)</b> — FICA taxes that fund those programs.</li><li><b>State/local tax</b> — varies by where you live and work.</li><li><b>Pre-tax deductions</b> — like 401(k) contributions or health insurance.</li></ul>
        <p>Early each year, your employer sends a <b>Form W-2</b> summarizing your pay and withholding so you can file your tax return.</p>`,
      example: `<p>On her first stub, Zoe noticed her hours said 18 instead of 22. Because she checked, her manager corrected it and she got the missing $64 on the next check.</p>`,
      widget: { type: 'payStub', gross: 1200 },
      questions: [
        { q: 'What does “YTD” on a pay stub mean?', a: ['Year to date — totals so far this year', 'Yearly tax deduction', 'Your total debt', 'Yesterday’s take-home'], correct: 0, concept: 'payroll',
          why: 'YTD shows running totals since January 1.' },
        { q: 'You earn $1,000 gross. How much goes to Social Security and Medicare combined?', a: ['$76.50', '$62', '$14.50', '$100'], correct: 0, concept: 'payroll',
          why: 'FICA is 7.65% of gross pay: 6.2% Social Security + 1.45% Medicare = $76.50.' },
        { q: 'Which form summarizes your pay and taxes withheld for the year?', a: ['W-2', 'W-4', 'FAFSA', 'A pay stub from January'], correct: 0, concept: 'payroll',
          why: 'Employers send a W-2 each year; you use it to file your tax return.' },
      ] },

    { id: 'tax-brackets', pathway: 'income', order: 12, topic: 'income', minutes: 4, concepts: ['withholding'],
      title: 'Tax Brackets and Withholding',
      hook: 'A raise can never shrink your paycheck because of brackets. Here’s why.',
      explain: `<p>Federal income tax is <b>progressive</b>. Income is split into slices, and each slice is taxed at its own rate. For a single filer in 2026, the first $12,400 of taxable income is taxed at 10%, the next slice up to $50,400 at 12%, then 22%, and so on.</p>
        <p><b>Taxable income</b> is your income minus deductions — most people take the <b>standard deduction</b> ($16,100 for single filers in 2026).</p>
        <p>Your <b>marginal rate</b> is the rate on your last dollar. Your <b>effective rate</b> — total tax ÷ income — is always lower. <b>Withholding</b> is tax taken from each paycheck based on your W-4; when you file, you either get a refund (too much was withheld) or owe the difference.</p>`,
      example: `<p>Nia earns $50,000. After the $16,100 standard deduction, $33,900 is taxable. She pays 10% on the first $12,400 ($1,240) and 12% on the remaining $21,500 ($2,580): about $3,820 total — an effective federal rate under 8%, even though she’s “in the 12% bracket.”</p>`,
      widget: { type: 'brackets', salary: 50000 },
      questions: [
        { q: 'A raise pushes $1,000 of your income into the 22% bracket. What happens?', a: ['Only that $1,000 is taxed at 22%', 'All of your income is taxed at 22%', 'You take home less than before', 'Nothing is taxed'], correct: 0, concept: 'withholding',
          why: 'Brackets are marginal — only the income inside each bracket is taxed at that rate.' },
        { q: 'You get a tax refund. What does that usually mean?', a: ['Too much tax was withheld during the year', 'You earned extra income', 'The government made a mistake', 'You don’t have to file next year'], correct: 0, concept: 'withholding',
          why: 'A refund returns over-withheld tax. It isn’t free money — it was yours all along.' },
        { q: 'Which form do you use to tell your employer how much to withhold?', a: ['Form W-4', 'Form W-2', 'Form 1099', 'The FAFSA'], correct: 0, concept: 'withholding',
          why: 'You complete a W-4 when you’re hired and can update it anytime.' },
      ] },

    // ===================================================== Investing Basics
    { id: 'compound', pathway: 'investing', order: 13, topic: 'saving', minutes: 3, concepts: ['compound-growth', 'employer-match'],
      title: 'Compound Growth: Time Is Your Superpower',
      hook: 'Starting at 22 instead of 32 can matter more than how much you save.',
      explain: `<p><b>Compound growth</b> means earnings on your money start earning too. Over long periods, growth on growth becomes most of the total.</p>
        <p>The <b>Rule of 72</b> is a shortcut: divide 72 by the yearly growth rate to estimate how many years it takes to double. At 6%, about 12 years.</p>
        <p>Many employers offer a <b>401(k)</b> with a <b>match</b> — for example, adding 50¢ or $1 for every dollar you contribute up to a limit. A match is part of your pay; skipping it leaves money on the table.</p>
        <p>Returns are never guaranteed. The numbers in calculators are <b>illustrations</b> using an assumed rate, not predictions.</p>`,
      example: `<p>Two friends each invest $200 a month in the same fund. Alex starts at 22, Blake at 32. At an illustrative 6% return, by 65 Alex could have about twice as much — even though Blake’s total contributions are only 23% less.</p>`,
      widget: { type: 'compound', monthly: 200, rate: 0.06, years: 43 },
      questions: [
        { q: 'Using the Rule of 72, about how long does money take to double at 8% a year?', a: ['9 years', '8 years', '72 years', '18 years'], correct: 0, concept: 'compound-growth',
          why: '72 ÷ 8 = 9 years.' },
        { q: 'Your employer matches 100% of contributions up to 4% of salary. You earn $50,000. How much match can you get each year?', a: ['$2,000', '$4,000', '$500', '$0'], correct: 0, concept: 'employer-match',
          why: '4% of $50,000 = $2,000 — if you contribute at least that much yourself.' },
        { q: 'A calculator shows your savings growing at 6% a year. What should you assume?', a: ['It’s an illustration; real returns vary and can be negative', 'You’re guaranteed 6% every year', 'You’ll earn at least 6%', 'Returns never go down'], correct: 0, concept: 'compound-growth',
          why: 'Assumed rates help you plan. Real markets rise and fall.' },
      ] },

    { id: 'risk', pathway: 'investing', order: 14, topic: 'saving', minutes: 3, concepts: ['risk-diversification'],
      title: 'Risk and Diversification',
      hook: 'Don’t put all your eggs in one basket — here’s what that really means.',
      explain: `<p>Investments that can grow more usually come with more <b>risk</b>: bigger swings up and down. Cash in savings is very stable but grows slowly. Stocks have historically grown more over long periods but can fall sharply in a single year.</p>
        <p><b>Diversification</b> means spreading money across many investments so one company’s bad year doesn’t sink you. Owning one stock is risky; owning a fund that holds hundreds of stocks is far less risky.</p>
        <p>Your <b>time horizon</b> matters: money you need soon (like an emergency fund) shouldn’t be in stocks. Money for goals decades away can ride out the ups and downs.</p>`,
      example: `<p>Kai put $1,000 into one company he liked. It dropped 60% after a bad product launch. His friend put $1,000 into a broad index fund that holds hundreds of companies; it moved with the overall market instead.</p>`,
      widget: { type: 'diversify' },
      questions: [
        { q: 'Which is generally the most diversified?', a: ['A fund holding hundreds of companies', 'Shares of one tech company', 'Two stocks in the same industry', 'A single cryptocurrency'], correct: 0, concept: 'risk-diversification',
          why: 'Spreading across many companies reduces the impact of any one failing.' },
        { q: 'You need money for a car repair next month. Where should it be?', a: ['A savings account', 'A single stock', 'A stock index fund', 'A 30-year bond'], correct: 0, concept: 'risk-diversification',
          why: 'Short-term money shouldn’t be exposed to market drops.' },
      ] },

    { id: 'index-funds', pathway: 'investing', order: 15, topic: 'saving', minutes: 3, concepts: ['index-funds', 'compound-growth'],
      title: 'Index Funds and Fees',
      hook: 'A fee that looks tiny can quietly eat tens of thousands of dollars.',
      explain: `<p>An <b>index fund</b> buys all (or a sample) of the investments in a market index, like the S&amp;P 500. Instead of trying to pick winners, it aims to match the market. That makes index funds diversified and usually low-cost.</p>
        <p>Funds charge an <b>expense ratio</b> — a yearly fee as a percentage of your money. Many broad index funds charge under 0.10%; some actively managed funds charge 1% or more.</p>
        <p>Because fees are taken every year, they compound too. Over decades, a 1% fee can take a large share of your growth.</p>`,
      example: `<p>Two people each invest $10,000 for 30 years at an illustrative 6% before fees. With a 0.05% fee it grows to about $56,600; with a 1% fee, about $43,200 — a difference of around $13,400.</p>`,
      widget: { type: 'fees', amount: 10000, years: 30, rate: 0.06 },
      questions: [
        { q: 'What does an index fund try to do?', a: ['Match a market index', 'Beat the market by picking winners', 'Guarantee a fixed return', 'Invest in one company'], correct: 0, concept: 'index-funds',
          why: 'Index funds track a benchmark rather than trying to outguess it.' },
        { q: 'A fund has a 1% expense ratio and you have $5,000 in it. About how much is the yearly fee?', a: ['$50', '$500', '$5', '$1'], correct: 0, concept: 'index-funds',
          why: '1% of $5,000 = $50 a year — and it grows as your balance grows.' },
        { q: 'Why do small fee differences matter over 30 years?', a: ['Fees compound, reducing growth every year', 'They don’t matter at all', 'Fees are only charged once', 'Higher fees guarantee higher returns'], correct: 0, concept: 'compound-growth',
          why: 'Money lost to fees also loses all the growth it would have earned.' },
      ] },

    // ===================================================== Scams & Digital Money
    { id: 'spot-phishing', pathway: 'safety', order: 16, topic: 'safety', minutes: 3, concepts: ['phishing', 'identity-theft'],
      title: 'Phishing, Fake Texts, and Fake Links',
      hook: 'Scammers rarely hack your phone. They trick you into handing over the keys.',
      explain: `<p><b>Phishing</b> is a message — email, text (“smishing”), DM, or call — that pretends to be someone you trust so you’ll click a link, share a password or code, or send money.</p>
        <p><b>Red flags:</b></p><ul><li><b>Urgency or threats:</b> “Your account will be closed in 1 hour.”</li><li><b>A prize or refund you didn’t expect.</b></li><li><b>A look-alike web address</b>, like <i>appleid-verify.support</i> or <i>usps-redeliver.info</i>.</li><li><b>Requests for passwords, login codes, or your Social Security number.</b> Real companies don’t ask for these by text.</li><li><b>Unusual payment:</b> gift cards, crypto, or wire transfers.</li></ul>
        <p><b>What to do:</b> don’t tap the link. Open the official app or type the website yourself. Report scam texts by forwarding them to <b>7726</b> (SPAM), then delete them. Never share a login code — it’s the key to your account.</p>
        <p><b>If you already clicked:</b> change that password, turn on two-step verification, and watch your accounts. If your identity was stolen, report it at <b>IdentityTheft.gov</b> for a recovery plan.</p>`,
      example: `<p>Jalen gets a text: “USPS: Your package is on hold. Pay a $1.99 redelivery fee: usps-redeliver.info.” He isn’t expecting a package, and the address isn’t usps.com. He forwards it to 7726 and deletes it. His friend paid the $1.99 — and a week later found $480 in charges on his debit card.</p>`,
      widget: { type: 'scamSpotter', labels: ['Scam', 'Safe'], items: [
        ['“Your Apple ID is locked. Verify now or lose access: appleid-verify.support/login”', 'scam', 'Urgency plus a look-alike address. Apple’s real site is apple.com — check your account in Settings instead.'],
        ['“Hey it’s Coach! Lost my phone, new number. Can you buy two $100 gift cards for the team and text me the codes?”', 'scam', 'An “I have a new number” message asking for gift cards is a classic impersonation scam. Call the coach’s real number.'],
        ['“Reminder from Lakeside High: Parent-teacher conferences are Thursday. Details are on the school website.”', 'legit', 'No link, no pressure, and nothing asked of you. You can check the real school site yourself.'],
        ['“Congrats! You won a $1,000 gift card. Claim in 10 minutes: prize-winner-now.co”', 'scam', 'You can’t win a contest you never entered, and the timer is there to rush you.'],
        ['“Your verification code is 482913. We will never call or text you to ask for this code.”', 'legit', 'A code you just requested is normal. The danger is anyone who asks you to read it back to them.'],
        ['“IRS: You owe back taxes. Pay today with gift cards or a warrant will be issued.”', 'scam', 'The IRS contacts people by mail and never demands gift cards or threatens arrest by text.'],
      ] },
      questions: [
        { q: 'Which is the strongest sign that a message is phishing?', a: ['It pressures you to act fast through a link', 'It uses your first name', 'It arrives during the day', 'It has no spelling mistakes'], correct: 0, concept: 'phishing',
          why: 'Urgency plus a link is the core of most phishing. Scammers can easily get your name and write without typos.' },
        { q: 'Someone texts: “I sent my login code to your number by mistake — can you read it back to me?” What should you do?', a: ['Don’t share it — that code lets them into an account', 'Share it, since it was their mistake', 'Share only the first three digits', 'Ask who they are, then share it'], correct: 0, concept: 'identity-theft',
          why: 'Scammers trigger a real code to your phone and trick you into giving it to them, which lets them take over your account.' },
        { q: 'You tapped a phishing link and typed your password. What should you do first?', a: ['Change that password and turn on two-step verification', 'Wait and see if anything happens', 'Delete the text so nobody knows', 'Text the scammer and ask them to stop'], correct: 0, concept: 'identity-theft',
          why: 'Changing the password right away locks the scammer out. Two-step verification adds a second lock.' },
      ] },

    { id: 'payment-scams', pathway: 'safety', order: 17, topic: 'safety', minutes: 4, concepts: ['fake-jobs', 'payment-scams', 'identity-theft'],
      title: 'Fake Jobs, Payment Apps, and Identity Theft',
      hook: 'If a stranger wants gift cards, crypto, or a payment-app transfer, it’s almost always a scam.',
      explain: `<p><b>Fake job offers</b> target students: “remote assistant,” “brand ambassador,” or “mystery shopper” jobs with high pay for little work. A common trick is the <b>fake check</b>: they send a check, ask you to deposit it and send part back. The money can show up in your account, then the check bounces days later — and you owe the bank all of it.</p>
        <p><b>Payment apps</b> like Zelle, Venmo, and Cash App work like cash. If you send money to a scammer, you usually can’t get it back. Only send money to people you know in real life. For purchases from strangers, use a credit card or a checkout with purchase protection.</p>
        <p>Scammers ask for <b>gift cards, crypto, or wire transfers</b> because they’re fast and hard to trace. No real employer, government agency, or business demands them.</p>
        <p><b>Identity theft</b> is when someone uses your personal information — like your Social Security number — to open accounts. Protect it, check your credit reports for free at AnnualCreditReport.com, and know that a <b>credit freeze</b> is free and stops new accounts being opened in your name.</p>`,
      example: `<p>Priya gets a DM: “Earn $400 a week as a brand ambassador!” They mail her an $1,800 check, ask her to deposit it, and send $1,500 to their “supplier” through a payment app. The money shows up, so she sends it. A week later the check bounces, the bank takes back the $1,800, and the $1,500 she sent is gone — it was her own money.</p>`,
      widget: { type: 'scamSpotter', labels: ['Red flag', 'Normal'], items: [
        ['They send a check and ask you to send part of it back', 'scam', 'This is the fake-check scam. Real employers never ask you to return money.'],
        ['You applied on the company’s official careers page and interviewed by video', 'legit', 'Applying through the real company’s site and meeting the interviewer are normal steps.'],
        ['$400 a week for two hours of work, no experience needed', 'scam', 'Pay that’s far above normal for very little work is a lure.'],
        ['They ask you to pay for “training materials” before you start', 'scam', 'Legitimate jobs pay you — they don’t charge you to start.'],
        ['After the offer, they send a W-4 tax form to fill out', 'legit', 'New employees fill out a W-4 so taxes can be withheld from pay.'],
        ['They want to be paid back in gift cards', 'scam', 'Gift card payments are a scammer’s favorite because they can’t be reversed.'],
      ] },
      questions: [
        { q: 'A new “employer” sends you a check for more than you’re owed and asks you to send back the difference. Why is this a scam?', a: ['The check will bounce later, and you’ll owe the bank the full amount', 'Employers always overpay new hires', 'It’s safe once the money shows up in your account', 'Sending money back is a normal tax step'], correct: 0, concept: 'fake-jobs',
          why: 'Deposited funds can appear before a check actually clears. When it bounces, the bank takes the money back from you.' },
        { q: 'Which payment method is safest when you buy something from a stranger online?', a: ['A credit card or checkout with purchase protection', 'A gift card', 'A payment-app transfer marked “friends and family”', 'A wire transfer'], correct: 0, concept: 'payment-scams',
          why: 'Credit cards and protected checkouts let you dispute a charge if the item never arrives. The others work like cash.' },
        { q: 'What does freezing your credit do?', a: ['Stops lenders from opening new accounts in your name until you lift it', 'Lowers your credit score', 'Closes all your existing cards', 'Costs $100 a year'], correct: 0, concept: 'identity-theft',
          why: 'A freeze is free and blocks new credit in your name. It doesn’t affect your score or your existing accounts.' },
      ] },

    { id: 'bnpl-promos', pathway: 'safety', order: 18, topic: 'safety', minutes: 4, concepts: ['bnpl', 'risky-promotions'],
      title: 'Buy Now, Pay Later and “Guaranteed” Money',
      hook: 'Splitting one purchase into four payments feels free. Stacking five of them is how budgets break.',
      explain: `<p><b>Buy now, pay later (BNPL)</b> splits a purchase into payments — often 4 payments, every two weeks. There’s usually no interest if you pay on time, but there can be <b>late fees</b>, missed payments can be reported to credit bureaus, and longer BNPL loans may charge interest.</p>
        <p>The real trap is <b>stacking</b>: a few small plans at once can add up to more than your paycheck. Before you split a purchase, add up <i>every</i> payment due in the next six weeks.</p>
        <p><b>Risky financial promotions</b> are everywhere online. Influencers may be paid to promote apps, coins, or “courses.” Red flags: <b>“guaranteed” or “risk-free” high returns</b>, pressure to act now, “double your money,” or programs where you must buy products or recruit friends to earn.</p>
        <p>Remember: <b>higher possible returns always come with higher risk</b>. No legitimate investment guarantees big profits. You can look up investment professionals on FINRA BrokerCheck and learn the basics at Investor.gov.</p>`,
      example: `<p>Marcus splits sneakers ($160), headphones ($120), a concert ticket ($200), and a jacket ($80) into 4 payments each. That’s $140 due every two weeks — about $300 a month, more than he has left from his part-time job after gas. When one autopay fails, he gets a late fee and the app pauses his account.</p>`,
      widget: { type: 'bnplStack', income: 400, items: [['Sneakers', 160], ['Headphones', 120], ['Concert ticket', 200], ['Jacket', 80], ['Video game', 70]] },
      questions: [
        { q: 'You have 3 buy-now-pay-later plans, each $40 every two weeks. About how much do they cost you per month?', a: ['About $260', '$40', '$120', '$480'], correct: 0, concept: 'bnpl',
          why: '3 × $40 = $120 every two weeks. With 26 due dates a year, that’s about $260 a month.' },
        { q: 'An influencer says a new crypto coin will “guarantee 20% returns every month.” What’s the best response?', a: ['Treat it as a red flag — no real investment guarantees high returns', 'Invest a little to test it', 'Trust it if the influencer has lots of followers', 'Borrow money to invest more'], correct: 0, concept: 'risky-promotions',
          why: 'Guaranteed high returns are a hallmark of scams. Real investments that can grow more can also lose money.' },
        { q: 'What can happen if you miss a buy-now-pay-later payment?', a: ['Late fees, and it may be reported to credit bureaus', 'Nothing — BNPL has no rules', 'The item becomes free', 'Your bank pays it automatically'], correct: 0, concept: 'bnpl',
          why: 'BNPL is still a loan. Missed payments can bring fees, a paused account, and credit damage.' },
      ] },
  ];

  return { PATHWAYS, LESSONS, byId: (id) => LESSONS.find((l) => l.id === id) || null };
});
