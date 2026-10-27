-- Centspire V5 — Supabase setup. Run this whole file once in the Supabase SQL Editor.
-- It's safe to run again (it uses "if not exists" / "create or replace").
-- V4's tables (v4_events, v4_impact_summary) are left untouched.
--
-- What it creates
--   v5_events            anonymous learning events (insert-only for the public website)
--   v5_impact_summary(code)  aggregate numbers for the team dashboard — needs the TEAM CODE
--   v5_saves + v5_code_save() / v5_code_load()   optional "save code" progress (no email or name)
--   v5_verify_claim() / v5_redeem_claim()        reward claim checking at the Centspire table — needs the TEAM CODE
--   v5_team              one row holding a scrambled (bcrypt) copy of the team code — never the code itself
--
-- Privacy model
--   * The public (anon key) can add events but never read them back.
--   * Save-code progress can only be read by someone who has the exact 12-character code.
--   * Nobody signs in. The team dashboard and claim checks need a shared TEAM CODE, checked inside the
--     database against a bcrypt hash. After 20 wrong tries in 10 minutes, all code checks pause for 10 minutes.
--   * Never put the service_role key in the website. Only the anon (public) key belongs in config.js.
--
-- AFTER RUNNING THIS FILE (see README → "Connecting Supabase"), set the team code (at least 8 characters;
-- a short phrase is best). Run this in a NEW query so the code isn't saved with this file:
--        select public.v5_set_team_code('your team code here');
-- Run the same line again any time to change it. The old code stops working immediately.

create extension if not exists pgcrypto with schema extensions;

-- ===================================================================== events
create table if not exists public.v5_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  participant uuid not null,
  type        text not null check (type in ('visit','sim_start','sim_complete','assessment','lesson_complete','mission_complete','feedback','reward','sync')),
  page        text check (char_length(page) <= 40),
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) < 4000)
);
create index if not exists v5_events_type_idx on public.v5_events (type);
create index if not exists v5_events_participant_idx on public.v5_events (participant);
create index if not exists v5_events_claim_idx on public.v5_events ((data->>'claim')) where type = 'reward';

alter table public.v5_events enable row level security;
drop policy if exists "public can add events" on public.v5_events;
create policy "public can add events" on public.v5_events for insert to anon, authenticated with check (true);
revoke select, update, delete on public.v5_events from anon, authenticated;

-- Old email sign-in pieces (from earlier drafts) — removed if they exist.
drop function if exists public.v5_impact_summary();
drop function if exists public.v5_verify_claim(text);
drop function if exists public.v5_redeem_claim(text, text);
drop function if exists public.v5_set_team_pin(text);
drop function if exists public.v5_is_team();

-- Team code: a single row with a bcrypt hash of the shared team code.
create table if not exists public.v5_team (
  id         int primary key default 1 check (id = 1),
  code_hash  text
);
alter table public.v5_team add column if not exists code_hash text;
alter table public.v5_team enable row level security;
revoke all on public.v5_team from anon, authenticated;

-- Failed code attempts (timestamps only) for the lockout.
create table if not exists public.v5_code_attempts (at timestamptz not null default now());
alter table public.v5_code_attempts enable row level security;
revoke all on public.v5_code_attempts from anon, authenticated;

-- Run once from the SQL Editor: select public.v5_set_team_code('your team code');
create or replace function public.v5_set_team_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if char_length(coalesce(p_code, '')) < 8 then raise exception 'Use a team code with at least 8 characters.'; end if;
  insert into v5_team (id, code_hash) values (1, extensions.crypt(p_code, extensions.gen_salt('bf', 10)))
  on conflict (id) do update set code_hash = excluded.code_hash;
  delete from v5_code_attempts;
end;
$$;

-- 'ok' | 'wrong' | 'locked' | 'unset'. Internal: only called by the functions below.
create or replace function public.v5_team_check(p_code text)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  h text;
begin
  delete from v5_code_attempts where at < now() - interval '1 day';
  if (select count(*) from v5_code_attempts where at > now() - interval '10 minutes') >= 20 then return 'locked'; end if;
  select code_hash into h from v5_team where id = 1;
  if h is null then return 'unset'; end if;
  if h = extensions.crypt(coalesce(p_code, ''), h) then return 'ok'; end if;
  insert into v5_code_attempts default values;
  return 'wrong';
end;
$$;

-- Redeemed reward claims (created here because the summary below counts them)
create table if not exists public.v5_redemptions (
  claim        text primary key,
  redeemed_at  timestamptz not null default now()
);
alter table public.v5_redemptions enable row level security;
revoke all on public.v5_redemptions from anon, authenticated;

-- ===================================================================== impact summary
-- v5_impact_totals() does the math; v5_impact_summary(code) only returns it with the right team code.
create or replace function public.v5_impact_totals()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with
  topics(t) as (values ('college'), ('budgeting'), ('credit'), ('saving'), ('income'), ('safety')),
  visit_days as (
    select participant, count(distinct (created_at at time zone 'UTC')::date) as days
    from v5_events where type = 'visit' group by participant
  ),
  latest as (
    select distinct on (participant, data->>'phase') participant, data->>'phase' as phase, data
    from v5_events where type = 'assessment'
    order by participant, data->>'phase', created_at desc
  ),
  paired as (
    select p.participant, p.data as pre, q.data as post
    from latest p join latest q on q.participant = p.participant
    where p.phase = 'pre' and q.phase = 'post'
  ),
  frac as (
    select participant,
      (pre->>'score')::numeric / nullif((pre->>'total')::numeric, 0) as pre_f,
      (post->>'score')::numeric / nullif((post->>'total')::numeric, 0) as post_f
    from paired
  ),
  by_topic as (
    select t,
      avg((pre->'byTopic'->t->>'correct')::numeric / nullif((pre->'byTopic'->t->>'total')::numeric, 0)) as pre,
      avg((post->'byTopic'->t->>'correct')::numeric / nullif((post->'byTopic'->t->>'total')::numeric, 0)) as post
    from paired cross join topics group by t
  ),
  retention as (
    select r.participant,
      (r.data->>'score')::numeric / nullif((r.data->>'total')::numeric, 0) as ret_f,
      (p.data->>'score')::numeric / nullif((p.data->>'total')::numeric, 0) as pre_f
    from latest r left join latest p on p.participant = r.participant and p.phase = 'pre'
    where r.phase = 'retention'
  ),
  chan as (
    select distinct on (participant) participant,
      coalesce(nullif(data->>'firstSrc', ''), nullif(data->>'src', ''), 'direct') as ch
    from v5_events order by participant, created_at asc
  ),
  by_channel as (
    select c.ch,
      count(distinct c.participant) as participants,
      count(e.id) filter (where e.type = 'sim_start') as sim_starts,
      count(e.id) filter (where e.type = 'sim_complete') as sim_completes
    from chan c left join v5_events e on e.participant = c.participant
    group by c.ch
  ),
  lessons as (select * from v5_events where type = 'lesson_complete'),
  fb as (select data from v5_events where type = 'feedback'),
  ratings as (select (data->>'rating')::numeric as rating from fb where (data->>'rating') ~ '^[1-5]$'),
  nps as (select (data->>'nps')::int as v from fb where (data->>'nps') ~ '^([0-9]|10)$'),
  school as (select data->>'school' as v from fb where data->>'school' in ('yes','maybe','no')),
  sims as (select (data->>'challenge')::numeric as c from v5_events where type = 'sim_complete' and (data->>'challenge') ~ '^[0-9]+(\.[0-9]+)?$'),
  rewards as (select data from v5_events where type = 'reward')
select jsonb_build_object(
  'participants',      (select count(distinct participant) from v5_events),
  'returning',         (select count(*) from visit_days where days > 1),
  'simStarts',         (select count(*) from v5_events where type = 'sim_start'),
  'simCompletes',      (select count(*) from v5_events where type = 'sim_complete'),
  'completionRate',    (select case when s = 0 then null else c::numeric / s end
                        from (select count(*) filter (where type = 'sim_start') s,
                                     count(*) filter (where type = 'sim_complete') c from v5_events) x),
  'preCount',          (select count(*) from latest where phase = 'pre'),
  'postCount',         (select count(*) from latest where phase = 'post'),
  'paired', jsonb_build_object(
      'n',        (select count(*) from frac),
      'pre',      (select avg(pre_f) from frac),
      'post',     (select avg(post_f) from frac),
      'improved', (select count(*) from frac where post_f > pre_f),
      'byTopic',  (select coalesce(jsonb_object_agg(t, jsonb_build_object('pre', pre, 'post', post)), '{}'::jsonb) from by_topic)),
  'lessonsCompleted',   (select count(*) from lessons),
  'lessonParticipants', (select count(distinct participant) from lessons),
  'lessonPassRate',     (select avg(case when (data->>'passed')::boolean then 1 else 0 end) from lessons),
  'missionsCompleted',  (select count(*) from v5_events where type = 'mission_complete'),
  'feedback', jsonb_build_object(
      'n',       (select count(*) from ratings),
      'avg',     (select avg(rating) from ratings),
      'npsN',    (select count(*) from nps),
      'nps',     (select case when count(*) = 0 then null else round(100.0 * (count(*) filter (where v >= 9) - count(*) filter (where v <= 6)) / count(*)) end from nps),
      'schoolN', (select count(*) from school),
      'schoolYes', (select case when count(*) = 0 then null else (count(*) filter (where v = 'yes'))::numeric / count(*) end from school)),
  'challenge', jsonb_build_object('n', (select count(*) from sims), 'avg', (select avg(c) from sims), 'over10k', (select count(*) from sims where c > 10000)),
  'rewards', jsonb_build_object(
      'claims',   (select count(*) from rewards),
      'accuracy', (select count(*) from rewards where data->'rewards' ? 'accuracy'),
      'score',    (select count(*) from rewards where data->'rewards' ? 'score'),
      'redeemed', (select count(*) from public.v5_redemptions)),
  'syncs', jsonb_build_object(
      'code',  (select count(*) from v5_events where type = 'sync' and data->>'method' = 'code')),
  'confidence', jsonb_build_object(
      'preAll', (select avg((data->>'confidence')::numeric) from latest where phase = 'pre' and (data->>'confidence') ~ '^[1-5]$'),
      'pre',    (select avg((pre->>'confidence')::numeric) from paired where (pre->>'confidence') ~ '^[1-5]$'),
      'post',   (select avg((post->>'confidence')::numeric) from paired where (post->>'confidence') ~ '^[1-5]$')),
  'byChannel', (select coalesce(jsonb_object_agg(ch, jsonb_build_object('participants', participants, 'simStarts', sim_starts, 'simCompletes', sim_completes)), '{}'::jsonb) from by_channel),
  'retention', jsonb_build_object('n', (select count(*) from retention), 'avg', (select avg(ret_f) from retention), 'preAvg', (select avg(pre_f) from retention))
);
$$;

create or replace function public.v5_impact_summary(p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r text := v5_team_check(p_code);
begin
  if r <> 'ok' then return jsonb_build_object('denied', r); end if;
  return v5_impact_totals();
end;
$$;

-- ===================================================================== save codes (no email)
create table if not exists public.v5_saves (
  code        text primary key check (code ~ '^[A-Z0-9]{12}$'),
  data        jsonb not null check (pg_column_size(data) < 400000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.v5_saves enable row level security;
-- No policies: the website can only reach this table through the two functions below.
revoke all on public.v5_saves from anon, authenticated;

create or replace function public.v5_code_save(p_code text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_code !~ '^[A-Z0-9]{12}$' then raise exception 'invalid code'; end if;
  insert into v5_saves (code, data) values (p_code, p_data)
  on conflict (code) do update set data = excluded.data, updated_at = now();
  return true;
end;
$$;

create or replace function public.v5_code_load(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select data from v5_saves where code = upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));
$$;

-- ===================================================================== reward claims
create or replace function public.v5_verify_claim(p_claim text, p_code text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r text := v5_team_check(p_code);
begin
  if r <> 'ok' then return jsonb_build_object('denied', r); end if;
  return coalesce(
    (select jsonb_build_object('found', true, 'rewards', e.data->'rewards', 'score', e.data->'score', 'accuracy', e.data->'accuracy',
            'created_at', e.created_at, 'redeemed', exists (select 1 from v5_redemptions r where r.claim = e.data->>'claim'))
     from v5_events e where e.type = 'reward' and e.data->>'claim' = upper(trim(p_claim))
     order by e.created_at desc limit 1),
    jsonb_build_object('found', false));
end;
$$;

create or replace function public.v5_redeem_claim(p_claim text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r text := v5_team_check(p_code);
  c text := upper(trim(p_claim));
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'reason', 'denied', 'denied', r); end if;
  if not exists (select 1 from v5_events where type = 'reward' and data->>'claim' = c) then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;
  insert into v5_redemptions (claim) values (c) on conflict (claim) do nothing;
  if not found then return jsonb_build_object('ok', false, 'reason', 'already-redeemed'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ===================================================================== who can call what
revoke all on function public.v5_impact_totals() from public, anon, authenticated;
revoke all on function public.v5_team_check(text) from public, anon, authenticated;
revoke all on function public.v5_set_team_code(text) from public, anon, authenticated;
revoke all on function public.v5_impact_summary(text) from public;
revoke all on function public.v5_code_save(text, jsonb) from public;
revoke all on function public.v5_code_load(text) from public;
revoke all on function public.v5_verify_claim(text, text) from public;
revoke all on function public.v5_redeem_claim(text, text) from public;
-- The website (anon key) may call these; each one checks the team code itself.
grant execute on function public.v5_impact_summary(text) to anon, authenticated;
grant execute on function public.v5_verify_claim(text, text) to anon, authenticated;
grant execute on function public.v5_redeem_claim(text, text) to anon, authenticated;
grant execute on function public.v5_code_save(text, jsonb) to anon, authenticated;
grant execute on function public.v5_code_load(text) to anon, authenticated;
