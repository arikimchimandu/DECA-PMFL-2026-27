# Swipe Through College — v3

A swipe-card money game for high schoolers, by the centsible. team.

| File | What it is |
|---|---|
| `index.html` | The game |
| `dashboard.html` | Team dashboard: visits, completion, quiz before/after, channels, choices, CSV export |
| `content.js` | **All cards, lessons, quiz questions, glossary, and personalities.** Reviewers edit this file. |
| `icons.js` | The custom icon set (no emojis) — also used to draw the share image |
| `config.js` | Optional shared-database settings |
| `game.js`, `data.js`, `styles.css` | Game code, data saving, styling |

## How a game works

1. Nickname → 5-question warm-up quiz
2. Four chapters — **Paying for college**, **Borrowing smart**, **Spending in college**, **Life after graduation**. Each opens with a 30-second interactive lesson (net-price aid toggles, a loan interest-rate slider, a credit-card payoff slider, a 50/30/20 budget slider).
3. 10 swipe cards (6 core + 3 random + 1 random plot twist). After each choice: what happened, *Why it matters*, *Quick math*, and new terms added to the **Money Notebook**.
4. The same 5 questions again, now with explanations.
5. Results: money personality, score, before/after quiz, Money Notebook (21 terms to collect), choice recap, share image, friend-challenge link.

Replays skip the lessons and quizzes.

## Colors

Navy `#162B49` · Mint `#6ED9B3` · Cream `#F7F5EC` · Gold `#EFCB75`. A muted coral (`#E9806E`) is used only to flag bad outcomes.

## Tracking links

Add `?src=` to every link you hand out so the dashboard can compare channels:

- QR code at the pop-up: `index.html?src=popup`
- Instagram/TikTok: `index.html?src=social`
- Counseling newsletter: `index.html?src=newsletter`
- School announcements: `index.html?src=announce`

Friend-challenge links add `?beat=<score>&by=<nickname>&src=friend` automatically.

## Sharing data across devices (Supabase, free)

Without this, each phone keeps its own data and the dashboard only shows the device it's opened on.

1. Create a project at supabase.com.
2. In **SQL Editor**, run:

```sql
create table events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('visit', 'start', 'finish')),
  src text,
  data jsonb
);
alter table events enable row level security;
create policy "anyone can add events" on events for insert to anon with check (true);
create policy "anyone can read events" on events for select to anon using (true);
```

3. In **Project Settings → API**, copy the Project URL and the `anon` `public` key into `config.js`.

v2 and v3 can share the same table — every v3 event includes `"v": 3`, and the v3 dashboard only counts those.

Note: the read policy means anyone with the site's key can read the events (nicknames, scores, choices). No real names or contact info are collected — keep it that way.

## Putting it online

It's a static site — no build step. Drag the `version-3` folder onto Netlify Drop (app.netlify.com/drop), or use GitHub Pages or Vercel.

## Before launch: review checklist

- [ ] Financial reviewer checks every dollar figure, lesson, quick-math line, and glossary definition in `content.js`
- [ ] Technical reviewer tests on iPhone + Android, with sound on/off, and with a screen reader
- [ ] 5+ students play-test; note confusing cards and wording
- [ ] Supabase connected; dashboard shows data from two different phones
- [ ] QR code generated from the `?src=popup` link
