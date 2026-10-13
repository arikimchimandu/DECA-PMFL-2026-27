# What changed from V3 to V4

## Kept from V3

- The navy, mint, cream and gold identity and the custom line-icon set (extended with 10 new icons).
- Short lessons built into decisions, "quick math", and the Money Notebook idea. It grew into a 21-term concept map and the full Academy.
- `?src=` channel tracking, the local-first data with optional Supabase, and the friend-friendly, no-account approach.
- V1–V3 are untouched in their own folders.

## Rebuilt or new in V4

| Area | V3 | V4 |
|---|---|---|
| Money model | Arbitrary 0–100 meters | One coherent financial model. Debt, savings, paychecks and budgets are calculated from your choices and carried across all 4 chapters. |
| Branching | Random card deck | 12–16 decisions depending on your path. Options appear or lock based on earlier choices: living at home only for the local college, "work more" only if the job can cover the gap, a secured card only if you have savings, the card-payoff chapter only if you carry a balance, and a budget that blocks until essentials fit. |
| Tradeoffs | Each card had a "best" side | Many decisions have no single right answer (housing, Parent PLUS, card use, co-signing, job offers). Lower cost is shown, but not called "correct". |
| Assessment | Same 5 questions before and after | Two equivalent 10-item forms (A/B), randomly counterbalanced, aligned to 10 learning objectives across 5 topics, plus an optional 1-week retention check-in. |
| Report | Personality card | A Financial Future Report with borrowing, payments, budget, emergency savings, flexibility, topic learning scores (from answers only), the most consequential decisions in dollars, and recommended lessons and a mission. It's saved and printable. |
| Learning | Lesson pop-ups | Centsible Academy: 15 lessons in 5 pathways, each with an explanation, example, interactive activity and 2–3 questions with feedback. 5 Money Missions with a weekly rotation. |
| Tools | — | Student loan, budget planner and savings growth calculators with validation, explanations and stated assumptions. |
| Progress | — | My Progress: learning scores by topic, pathways, quiz history, areas to review, recommendations, missions, saved reports and reset. |
| Personalization | — | Missed concepts and decision flags drive lesson recommendations. Passing requires correct first-try answers. |
| Analytics | Public read access to all events | Insert-only Supabase table with no public reads. An aggregate-only summary function. Paired pre/post by topic, retention, lessons, feedback. Demo data is always labeled. |
| Demo | — | A presenter walkthrough with demo mode (no saving or recording) and presets that jump to Chapters 3 and 4. |
| Code | One `game.js` | Separate modules for assumptions, finance math, engine, report builder, mastery, content, UI and pages. 80 automated tests, a link checker and a contrast-checked palette. |
| Accessibility | Partial | Semantic landmarks, a skip link, labeled inputs, keyboard-operable everything, visible focus, screen-reader announcements, reduced motion, WCAG AA contrast and no sideways scrolling on phones. |

## Accuracy fixes

- The bank-loan interest example now uses the correct amortization result.
- Lesson examples were re-checked by tests, and four numbers were corrected before release.
- Hypothetical colleges, jobs and prices are clearly labeled throughout.

---

# Remaining improvements (not done yet)

**Needs your team:**
- [ ] **Supabase:** create the project, run `supabase/schema.sql`, add the URL and anon key to `config.js`, then verify the dashboard shows "Actual data." The SQL has not been run against a live project yet.
- [ ] **Financial reviewer:** check `assumptions.js` (especially the 2026 tax brackets and standard deduction), every lesson, the quiz answers, and the hypothetical game numbers.
- [ ] **Play-testing:** 5+ students on real phones (iPhone Safari and Android Chrome), with notes on confusing screens and timing.
- [ ] **Screen reader pass** with VoiceOver or TalkBack. The automated checks found no issues, but a human test is still needed.
- [ ] **Node tests:** run `node version-4/tests/run-node.js` once Node is installed. The tests were run in the browser test page.

**Possible next features:**
- [ ] More lessons per pathway (the structure supports it), for example credit reports in depth, renting your first apartment, and Roth vs. traditional accounts.
- [ ] More plot-twist events and alternate scenarios in each chapter, for more replay variety.
- [ ] Teacher/class codes so a whole class's results can be grouped, still with no names.
- [ ] Spanish translation.
- [ ] An offline install (service worker) for school devices with spotty Wi-Fi.
- [ ] Small-group suppression on the dashboard (hide topic averages when fewer than ~5 students).
