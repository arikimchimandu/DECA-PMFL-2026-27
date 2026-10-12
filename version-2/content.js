/* centsible. — Swipe Through College: game content.
 *
 * Everything students read lives in this file so reviewers can check it without touching game code.
 *
 * Cards
 *   id       unique key (used in the dashboard's choice breakdown — don't change once data is collected)
 *   ch       chapter label; cards are always played in CHAPTERS order
 *   core     true = appears in every game; other cards are drawn at random to fill the deck
 *   best     'L' or 'R': the financially smarter choice (✅ in the recap). Leave out if both are fine.
 *   L / R    the two choices
 *     fx     changes to the 0–100 meters: cash, grades, vibes
 *     debt   dollars added to (or, if negative, removed from) student debt
 *     head   headline shown after choosing
 *     lesson the teaching moment (simple HTML: <b> for emphasis)
 *
 * Figures: College Board "Trends in College Pricing 2024"; federal Direct Loan rate 2025–26 (6.39%).
 */
window.CENTSIBLE_CONTENT = {
  deckSize: 10,

  chapters: ['Senior year', 'Freshman year', 'Sophomore year', 'Junior year', 'After graduation', 'Plot twist'],

  start: { cash: 50, grades: 70, vibes: 60, debt: 0 },

  cards: [
    // ---------- Senior year ----------
    { id: 'fafsa', ch: 'Senior year', best: 'R', core: true, who: 'School counselor', av: '🧑‍🏫', art: '📬',
      text: 'The FAFSA just opened. It’s about 30 minutes of forms. Do it now?',
      L: { label: 'Ugh, later 😴', fx: { vibes: +5 }, debt: 16000, head: 'You never got to it…',
           lesson: 'Skipping the <b>FAFSA</b> means skipping free money. It unlocks <b>grants</b>, work-study, and most school aid. You’ll borrow ~$16k more to make up for it.' },
      R: { label: 'Do it now ✍️', fx: { vibes: -5, cash: +10 }, debt: 0, head: '$16,000 in grants unlocked! 🎉',
           lesson: 'Grants are <b>free money</b> you never pay back. File the FAFSA <b>every year</b> you’re in school.' } },

    { id: 'school', ch: 'Senior year', best: 'R', core: true, who: 'Your mailbox', av: '✉️', art: '🏫',
      text: 'You got in! Dream school out-of-state ($43k/yr) or in-state ($24k/yr)?',
      stake: 'Prices include tuition, housing, and food',
      L: { label: 'Dream school ✨', fx: { vibes: +15 }, debt: 45000, head: 'Living the dream… on loans',
           lesson: 'Out-of-state tuition averages <b>about 2.5×</b> in-state. Use each college’s <b>net price calculator</b> before you commit.' },
      R: { label: 'In-state 🏠', fx: { vibes: -5, cash: +5 }, debt: 12000, head: 'Smart money move 🧠',
           lesson: 'In-state public tuition averages about <b>$11,600/yr</b>. Same degree, way less debt.' } },

    { id: 'community', ch: 'Senior year', best: 'R', who: 'Your cousin', av: '🧢', art: '🚌',
      text: 'Do 2 years at community college first, then transfer? Saves a ton.',
      L: { label: 'Nah, 4 years at uni', fx: { vibes: +5 }, debt: 6000, head: 'The full campus experience',
           lesson: 'Totally valid! Just know community college averages only <b>~$4,050/yr</b> in tuition.' },
      R: { label: 'Smart. I’m in 🚌', fx: { cash: +10, vibes: -5 }, debt: -8000, head: 'Saved ~$15,000 💸',
           lesson: 'Starting at community college can cut costs massively. Check that your <b>credits transfer</b> first.' } },

    { id: 'scholarship', ch: 'Senior year', best: 'R', who: 'Scholarship website', av: '🏆', art: '📝',
      text: 'A local scholarship wants a 500-word essay. Prize: $2,000.',
      L: { label: 'Too much work', fx: { vibes: +5 }, debt: 0, head: 'Left $2,000 on the table',
           lesson: 'Local scholarships get <b>far fewer applicants</b> than national ones. Your odds are better than you think.' },
      R: { label: 'Write it ✍️', fx: { grades: +5, vibes: -5 }, debt: -2000, head: 'You won! 🏆',
           lesson: 'Scholarships are <b>free money</b>. You can often reuse one essay for several applications.' } },

    // ---------- Freshman year ----------
    { id: 'loan', ch: 'Freshman year', best: 'R', core: true, who: 'Financial aid office', av: '🏛️', art: '🏦',
      text: 'You still need $10k this year. Federal loan at 6.39% or a bank loan at 9.5%?',
      L: { label: 'Bank loan 🏦', fx: { cash: -5 }, debt: 4200, head: 'That rate stings 😬',
           lesson: 'A higher rate costs <b>~$4,200 extra</b> in interest on $10k over 10 years. Use <b>federal loans first</b>.' },
      R: { label: 'Federal 🏛️', fx: { cash: +5 }, debt: 0, head: 'Federal first. Correct! ✅',
           lesson: 'Federal loans have fixed rates and safer repayment plans. <b>Subsidized</b> ones don’t grow interest while you’re in school.' } },

    { id: 'job', ch: 'Freshman year', best: 'R', who: 'Campus café', av: '☕', art: '💼',
      text: 'We’re hiring! 10 hours a week, $15/hour.',
      L: { label: 'Nah, I’m busy', fx: { grades: +5, cash: -10 }, debt: 2000, head: 'More study time, less cash',
           lesson: 'Fair choice — but even a small job covers books and food so you <b>borrow less</b>.' },
      R: { label: 'I’ll take it 💪', fx: { cash: +20, grades: -5, vibes: -5 }, debt: -6000, head: '+$6,000 over 4 years 💸',
           lesson: 'Working <b>10–15 hrs/week</b> usually doesn’t hurt grades. Past about 20 hours, they tend to slip.' } },

    { id: 'mealplan', ch: 'Freshman year', best: 'R', who: 'Housing office', av: '🍽️', art: '🥡',
      text: 'Unlimited meal plan ($3,200) or basic plan + cook sometimes ($2,100)?',
      L: { label: 'Unlimited 🍔', fx: { vibes: +10, cash: -10 }, debt: 1100, head: 'Eating like royalty',
           lesson: 'Compare what you’d <b>actually use</b>. Many students pay for meals they never eat.' },
      R: { label: 'Basic plan 🍳', fx: { cash: +10, vibes: -5 }, debt: 0, head: 'Saved $1,100',
           lesson: 'Cooking even a few meals a week is one of the easiest ways to <b>stretch a budget</b>.' } },

    // ---------- Sophomore year ----------
    { id: 'textbooks', ch: 'Sophomore year', best: 'R', who: 'Bookstore', av: '📚', art: '📖',
      text: 'Your textbooks cost $480 new. Or rent used ones for $120.',
      L: { label: 'Buy new 🛍️', fx: { cash: -15 }, debt: 0, head: 'Shiny… and expensive',
           lesson: 'Renting, buying used, or checking the library can save <b>hundreds per semester</b>.' },
      R: { label: 'Rent used ♻️', fx: { cash: +10 }, debt: 0, head: 'Saved $360 🎯',
           lesson: 'At this rate that’s <b>$2,800+</b> saved over 4 years.' } },

    { id: 'creditcard', ch: 'Sophomore year', best: 'L', core: true, who: 'Table on campus', av: '🎁', art: '💳',
      text: 'Sign up for a credit card and get a FREE t-shirt and pizza!',
      L: { label: 'No thanks 🙅', fx: { vibes: -5 }, debt: 0, head: 'Dodged it',
           lesson: 'Credit cards aren’t evil — but interest averages <b>about 22–24%</b>. Only charge what you can pay off in full each month.' },
      R: { label: 'Free pizza! 🍕', fx: { vibes: +10, cash: -10 }, debt: 1800, head: 'That pizza cost $1,800 😭',
           lesson: 'You carried a balance at <b>24% interest</b>. Small swipes add up fast when you only pay the minimum.' } },

    // ---------- Junior year ----------
    { id: 'springbreak', ch: 'Junior year', best: 'L', who: 'Group chat 🌴', av: '💬', art: '🏖️',
      text: 'Spring break in Cancún?? It’s $1,200 each 🙏',
      L: { label: 'Can’t this year', fx: { vibes: -15, cash: +10 }, debt: 0, head: 'FOMO is real',
           lesson: 'Saying no is hard. A <b>“fun fund”</b> in your budget lets you plan trips without debt.' },
      R: { label: 'I’m in!! ✈️', fx: { vibes: +20, cash: -20 }, debt: 1200, head: 'Best week ever… on a card',
           lesson: 'Memories matter! But <b>$1,200 on a card</b> can take over a year to pay off with minimum payments.' } },

    { id: 'internship', ch: 'Junior year', who: 'Career center', av: '🧑‍💼', art: '🏢',
      text: 'Two summer offers: an unpaid internship in your field, or a paid retail job ($4,000).',
      L: { label: 'Unpaid internship', fx: { grades: +10, cash: -10 }, debt: 1500, head: 'Great résumé, empty wallet',
           lesson: 'Experience matters. Ask about <b>stipends</b> or school funding for unpaid internships.' },
      R: { label: 'Paid job 💵', fx: { cash: +15 }, debt: -4000, head: '+$4,000 toward tuition',
           lesson: 'Summer earnings can <b>replace loans</b> dollar for dollar. Paid internships exist too — search early!' } },

    // ---------- After graduation ----------
    { id: 'apartment', ch: 'After graduation', best: 'R', core: true, who: 'Your first paycheck', av: '🧾', art: '🏙️',
      text: 'You make $3,600/month. Live alone ($1,500) or with a roommate ($900)?',
      L: { label: 'Solo life 👑', fx: { vibes: +10, cash: -20 }, debt: 0, head: 'Your own space!',
           lesson: 'Rent at <b>42%</b> of your pay is tight. Try to keep housing under <b>about 35%</b>.' },
      R: { label: 'Roommate 🤝', fx: { cash: +20, vibes: -5 }, debt: 0, head: '$600/month freed up 💰',
           lesson: 'That’s <b>$7,200 a year</b> you can save or put toward loans.' } },

    { id: 'autosave', ch: 'After graduation', best: 'R', core: true, who: 'Your bank app', av: '📱', art: '🐷',
      text: 'Auto-save 20% of every paycheck?',
      L: { label: 'Spend it 💅', fx: { vibes: +10, cash: -20 }, debt: 0, head: 'Living for today',
           lesson: 'The <b>50/30/20 rule</b>: 50% needs, 30% wants, <b>20% savings</b>. Even 10% is a great start.' },
      R: { label: 'Auto-save ✅', fx: { cash: +25 }, debt: -3000, head: 'Future you says thanks 🙏',
           lesson: 'Automatic saving works because you <b>never see the money</b>. Some goes toward your loans too.' } },

    { id: 'repayment', ch: 'After graduation', best: 'R', who: 'Loan servicer', av: '📨', art: '📆',
      text: 'Your loan bill is here. Pay the minimum, or add an extra $50/month?',
      L: { label: 'Just the minimum', fx: { cash: +5 }, debt: 0, head: 'Paid on time ✔️',
           lesson: 'Paying on time protects your <b>credit score</b>. That’s the most important part!' },
      R: { label: 'Extra $50 💪', fx: { cash: -5 }, debt: -2500, head: 'Paying it down faster',
           lesson: 'Extra payments go straight to the <b>principal</b>, so you pay less interest overall.' } },

    // ---------- Plot twist (exactly one is drawn) ----------
    { id: 'car', ch: 'Plot twist', twist: true, who: 'Your car', av: '🚗', art: '💥',
      text: 'Surprise! Your car needs a $1,200 repair.', cost: 1200 },
    { id: 'phone', ch: 'Plot twist', twist: true, who: 'Your phone', av: '📱', art: '🫠',
      text: 'You dropped your phone. Screen’s shattered. Fix costs $900.', cost: 900 },
  ],

  // Twist cards are resolved by how much cash the player has built up.
  twist: {
    threshold: 45,
    L: { label: 'Credit card 💳', fx: { vibes: -5 }, debtMult: 1.25, head: 'On the card at 24%… 😬',
         lesson: 'With interest, it’ll cost you way more than the sticker price. An <b>emergency fund</b> (3–6 months of expenses) turns a crisis into a shrug.' },
    R_ok: { label: 'Emergency fund 🛟', fx: { cash: -20 }, debtMult: 0, good: true, head: 'Handled it. No stress. 😎',
            lesson: 'This is exactly what an <b>emergency fund</b> is for. Your saving habits paid off!' },
    R_short: { label: 'Emergency fund 🛟', fx: { vibes: -10 }, debtMult: 1.25, head: 'Not enough saved… 💀',
               lesson: 'Your savings were too low, so it went on a card anyway. Save <b>a little every paycheck</b> for surprises like this.' },
  },

  // Same questions before and after the game — used to measure learning.
  quiz: [
    { q: 'What should you fill out to get college grants?', a: ['A credit card application', 'The FAFSA', 'A W-2', 'Nothing — they’re automatic'], correct: 1 },
    { q: 'Which usually has the lowest yearly tuition?', a: ['Private college', 'Out-of-state public', 'Community college', 'In-state public'], correct: 2 },
    { q: 'Which loan should you usually take first?', a: ['Private bank loan', 'Federal student loan', 'Credit card', 'Payday loan'], correct: 1 },
    { q: 'In the 50/30/20 rule, the 20% is for…', a: ['Rent', 'Fun', 'Savings & debt', 'Food'], correct: 2 },
  ],

  personalities: [
    { id: 'squirrel', e: '🐿️', t: 'The Squirrel', d: 'You stash for winter. Low debt, big savings — future you is thriving.', c1: '#1f9d55', c2: '#0f5c8c',
      when: (s) => s.debt <= 15000 && s.cash >= 70 },
    { id: 'hunter', e: '🏆', t: 'The Aid Hunter', d: 'You find every free dollar out there. Grants? Scholarships? You got ’em.', c1: '#7b2ff7', c2: '#2f6fe0',
      when: (s, picks) => picks.fafsa === 'R' && s.debt <= 25000 },
    { id: 'yolo', e: '🎰', t: 'The YOLO', d: 'You lived your best life… and your loan servicer will be in touch. 📬', c1: '#ff3d6e', c2: '#ff7a18',
      when: (s) => s.vibes >= 65 && s.debt > 30000 },
    { id: 'scholar', e: '📚', t: 'The Scholar', d: 'Grades first, always. Now make the money side as strong as your GPA.', c1: '#2f6fe0', c2: '#14b8a6',
      when: (s) => s.grades >= 75 },
    { id: 'balancer', e: '🧮', t: 'The Balancer', d: 'A little fun, a little saving. Some wins, some lessons — that’s real life.', c1: '#e3a008', c2: '#e8304f',
      when: () => true },
  ],
};
