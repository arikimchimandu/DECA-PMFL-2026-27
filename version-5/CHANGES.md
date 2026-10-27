# What changed from V4 to V5

V5 responds to two rounds of feedback: a UX review, and suggestions from a reviewer and the team. V1–V4 are untouched in their own folders.

## From the UX review

| Recommendation | What V5 does |
|---|---|
| Sticky logo + navigation, helpful footer | Already in V4 (sticky header, logo home link, menu). The V5 footer adds who made Centspire, an optional contact email (`config.js` → `team`), a "Meet the team" link, and a quick rating survey. |
| Progress indicator in the simulator | Every decision shows **"Decision 3 of 16 · Chapter 1 of 4"**, a progress bar, and about how many minutes are left. |
| Hover states and transitions | Buttons lift on hover, the "Start playing" / "Start learning" arrows slide, and focus outlines are clear for keyboard users. |
| Whole tool card clickable | The home page's Money Tools are now full-size cards (bigger tap targets), each with a hover effect. |
| Mobile-first check | Checked at phone width (375px): entry cards stack, no sideways scrolling, text stays readable. |
| Explain the "why" | Each home tool card names its basis (e.g. "Uses the 2025–26 federal loan rate"), every calculator has a visible "How this is calculated" note, and "How it works" links to sources. |

## From reviewer and team feedback

| Request | What V5 does |
|---|---|
| Save progress with email (plus anonymous) | The team chose a **save code** instead of email: a 12-character code (no email or name) that loads your progress on any device and syncs automatically. Anonymous use still works exactly as before. V4 progress is imported automatically. |
| Feedback loop on rating and sellability | Site-wide **Rate Centspire** survey: star rating, likelihood to recommend (0–10, for Net Promoter Score), and "Would you want your school to use it?" The impact dashboard shows average rating, NPS, and school demand. |
| Car loans | A senior-year **"Your first car?"** decision (no car, $4,000 cash car, or a financed $12,000 car at 11% for 6 years) that changes freshman borrowing, requires a college job, and carries into the first job (keep or sell). Plus a **car loans lesson**, a **First-Car Deal** mission, and a **car loan & real cost calculator**. |
| Rewards: >95% correct → 100 credit points | **Challenge Score**: every decision earns 0–1,000 points, scaled to 13 decisions (out of 13,000). More than 95% of answers correct earns 100 credit points. (The score prize was removed on Oct 26; to bring one back, set `scoreReward` in `config.js`.) Rewards come with a **claim code** the team checks (and marks as given out) on the impact dashboard. Wording and thresholds are editable in `config.js`. |
| Scams and digital money | New **Scams & Digital Money** pathway: phishing and fake links, fake jobs/payment apps/identity theft, and buy-now-pay-later and "guaranteed" money promotions. A **phishing text** decision in Chapter 2, a **Dream Job DM** mission, and 2 new knowledge-check questions per form (12 total). |

## Numbers

- Lessons: 15 → 19 · Pathways: 5 → 6 · Missions: 5 → 7 · Calculators: 3 → 4
- Simulator decisions per path: 12–16 → 13–18
- Knowledge check: 10 → 12 questions (6 topics × 2)
- Automated tests: 80 → 99

## Data and setup

V5 uses its own Supabase tables (`v5_events`, `v5_saves`, claims, team members), so V4's data is untouched. Run `supabase/schema.sql` once — see README → "Connecting Supabase".
