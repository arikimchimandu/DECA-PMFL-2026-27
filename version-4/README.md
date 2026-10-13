# Centsible V4

**Make smarter money decisions before they become real ones.**

Centsible is a free financial literacy web app for high school students, built for DECA Project Management – Financial Literacy (2026–27). It has two connected experiences:

1. **Financial Life Simulator** — a 10–15 minute, four-chapter branching journey (Senior Year → College Life → Independence → First Job) that ends in a personalized **Financial Future Report**.
2. **Centsible Academy** — 15 short lessons in 5 pathways, weekly Money Missions, three Money Tools calculators, and a My Progress dashboard.

No account, name, or email is ever required.

---

## Run it locally

No build step and no dependencies. From the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/version-4/>.

> Opening `index.html` directly from Finder also works for most pages, but browsers limit some features (like saving progress) on `file://` pages. Use the local server above when testing.

## Run the tests

**In a browser (no installs needed):** with the local server running, open <http://localhost:8000/version-4/tests/>. The page runs all tests and shows pass/fail.

**With Node.js 18+ (optional):**

```bash
node version-4/tests/run-node.js
```

**Check that every local link works:**

```bash
python3 version-4/tests/check_links.py
```

The 80 automated tests cover:
- Loan amortization, credit card payoff, savings growth, compound interest, taxes and paychecks, and budget math, checked against hand-calculated values.
- Every number quoted in a lesson, mission or quiz explanation, recomputed with the finance module.
- Branching game state: options that appear or disappear based on earlier choices, blocked budgets, going back to change a decision, and saved games restoring exactly.
- Assessment scoring, learning scores, the rule that clicking through a lesson is never a pass, and lesson recommendations.
- Saved progress, reset, corrupted-data recovery, and returning-visitor detection.
- Content integrity: valid answer keys, no repeated questions, and every concept linked to a lesson.
- The impact summary math and the rule that demo mode never records data.

## Deploy (GitHub Pages)

V4 is plain static files, so GitHub Pages serves it as-is from the `main` branch alongside V1–V3:

`https://arikimchimandu.github.io/DECA-PMFL-2026-27/version-4/`

After editing CSS or JS, bump the `?v=4.0.0` version in the HTML `<script>`/`<link>` tags so browsers load the new files.

## Connecting Supabase (optional, for combined impact data)

Without Supabase, everything works and data stays on each device. To combine results from every student:

1. Create a free project at supabase.com.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key into [`config.js`](config.js).
4. Push. Open `impact.html` — it should say "Actual data from the shared database."

**Privacy design:** the public key can only *insert* anonymous events. There is no read policy, so nobody can download individual records through the website. The impact dashboard calls `v4_impact_summary()`, which returns totals and averages only. **Never put the `service_role` key in this repository.**

> The SQL follows standard Supabase conventions but has not yet been run against a live project. Test it on a free project before relying on it.

## How it fits together

```
version-4/
  index.html  simulator.html  report.html  academy.html  lesson.html  mission.html
  tools.html  progress.html  about.html  impact.html (team)  demo.html (presenters)
  config.js                    Supabase settings (blank = local only)
  assets/css/app.css           Design system (navy · mint · cream · gold)
  assets/js/lib/
    assumptions.js             ← every rate, limit, and price, with sources
    finance.js                 Pure financial math (tested)
    mastery.js                 Learning scores + recommendations (tested)
    store.js                   Progress saved in this browser (tested)
    analytics.js               Anonymous impact events + summaries (tested)
    icons.js  ui.js  widgets.js  Shared UI, icon set, interactive calculators
  assets/js/content/           ← all student-facing text lives here
    assessments.js             Equivalent pre/post forms A and B
    lessons.js                 5 pathways, 15 lessons
    missions.js                Money Missions (weekly rotation)
    concepts.js                Concept map linking questions ↔ lessons ↔ missions
  assets/js/sim/
    engine.js                  Branching simulator model (no UI; tested)
    report-builder.js          Financial Future Report logic (tested)
  assets/js/pages/             One small controller per page
  supabase/schema.sql          Insert-only table + aggregate summary function
  tests/                       Browser/Node tests and link checker
```

### Adding content

- **A lesson:** copy an entry in `content/lessons.js`, give it a new `id`, tag its `concepts`, and pick a `widget` type from `widgets.js`. The content tests will tell you if anything is missing.
- **A Money Mission:** append an object to `content/missions.js`. The weekly mission rotates automatically.
- **A number:** change it in `assumptions.js`. If a lesson quotes it, update the test in `tests/content.test.js` too.

## Presenting at DECA

Open `demo.html?demo=1` (linked at the bottom of the About page). It walks through six steps:
1. A decision.
2. Choices carrying forward.
3. A sample report.
4. A recommended lesson.
5. A calculator.
6. How impact is measured.

Demo mode saves nothing and records nothing. Sample data is always labeled. Once loaded, the demo works without internet (only the web fonts need a connection; it falls back to system fonts).

## Accuracy

Real-world figures, with sources listed in `assumptions.js` and on the About page:
- federal Direct Loan rates for 2025–26
- dependent loan limits
- 2026 federal tax brackets and the standard deduction (IRS Rev. Proc. 2025-32)
- FICA rates

**Before ICDC, have the financial reviewer confirm these, especially the 2026 tax figures.** All colleges, jobs and offers are hypothetical and labeled as such. Centsible is educational, not financial advice.
