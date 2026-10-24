-- Centspire V5 — Supabase setup. Run this whole file once in the Supabase SQL Editor.
-- It's safe to run again (it uses "if not exists" / "create or replace").
-- V4's tables (v4_events, v4_impact_summary) are left untouched.
--
-- What it creates
--   v5_events            anonymous learning events (insert-only for the public website)
--   v5_impact_summary()  aggregate numbers for the team dashboard — TEAM ONLY (signed-in team emails)
--   v5_saves + v5_code_save() / v5_code_load()   optional "save code" progress (no email or name)
--   v5_verify_claim() / v5_redeem_claim()        reward claim checking at the Centspire table — TEAM ONLY
--   v5_team_members      the emails allowed to use the team dashboard
--
-- Privacy model
--   * The public (anon key) can add events but never read them back.
--   * Save-code progress can only be read by someone who has the exact 12-character code.
--   * Students never sign in or give an email. Only the three team members sign in (Supabase Auth),
--     and only to use the impact dashboard.
--   * Never put the service_role key in the website. Only the anon (public) key belongs in config.js.
--
-- AFTER RUNNING THIS FILE (see README → "Connecting Supabase"):
--   0. Add the three team members' emails (they sign in on impact.html with these):
--        insert into public.v5_team_members (email) values ('first@example.com'), ('second@example.com'), ('third@example.com');
--   1. Set a team PIN for redeeming rewards (replace 0000 with your own PIN):
--        select public.v5_set_team_pin('0000');
--   2. Authentication → URL Configuration: add your site to Redirect URLs, e.g.
--        https://arikimchimandu.github.io/DECA-PMFL-2026-27/**
--   3. Team sign-in emails use Supabase's built-in email service (a few emails per hour — plenty for 3 people).

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

-- Team members: only these emails can read dashboard totals and check claims.
create table if not exists public.v5_team_members (
  email  text primary key check (email = lower(email))
);
alter table public.v5_team_members enable row level security;
revoke all on public.v5_team_members from anon, authenticated;

create or replace function public.v5_is_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from v5_team_members where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- Redeemed reward claims (created here because the summary below counts them)
create table if not exists public.v5_redemptions (
  claim        text primary key,
  redeemed_at  timestamptz not null default now()
);
alter table public.v5_redemptions enable row level security;
revoke all on public.v5_redemptions from anon, authenticated;

-- ===================================================================== impact summary
-- v5_impact_totals() does the math; v5_impact_summary() only returns it to signed-in team members.
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

create or replace function public.v5_impact_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not v5_is_team() then raise exception 'team only' using errcode = '42501'; end if;
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
create table if not exists public.v5_team (
  id        int primary key default 1 check (id = 1),
  pin_hash  text not null
);
alter table public.v5_team enable row level security;
revoke all on public.v5_team from anon, authenticated;

-- Run once from the SQL Editor: select public.v5_set_team_pin('your-pin');
create or replace function public.v5_set_team_pin(p_pin text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into v5_team (id, pin_hash) values (1, extensions.crypt(p_pin, extensions.gen_salt('bf')))
  on conflict (id) do update set pin_hash = excluded.pin_hash;
$$;
revoke all on function public.v5_set_team_pin(text) from public, anon, authenticated;

create or replace function public.v5_verify_claim(p_claim text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not v5_is_team() then raise exception 'team only' using errcode = '42501'; end if;
  return coalesce(
    (select jsonb_build_object('found', true, 'rewards', e.data->'rewards', 'score', e.data->'score', 'accuracy', e.data->'accuracy',
            'created_at', e.created_at, 'redeemed', exists (select 1 from v5_redemptions r where r.claim = e.data->>'claim'))
     from v5_events e where e.type = 'reward' and e.data->>'claim' = upper(trim(p_claim))
     order by e.created_at desc limit 1),
    jsonb_build_object('found', false));
end;
$$;

create or replace function public.v5_redeem_claim(p_claim text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
  c text := upper(trim(p_claim));
begin
  if not v5_is_team() then raise exception 'team only' using errcode = '42501'; end if;
  select (pin_hash = extensions.crypt(p_pin, pin_hash)) into ok from v5_team where id = 1;
  if ok is not true then return jsonb_build_object('ok', false, 'reason', 'wrong-pin'); end if;
  if not exists (select 1 from v5_events where type = 'reward' and data->>'claim' = c) then
    return jsonb_build_object('ok', false, 'reason', 'not-found');
  end if;
  insert into v5_redemptions (claim) values (c) on conflict (claim) do nothing;
  if not found then return jsonb_build_object('ok', false, 'reason', 'already-redeemed'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ===================================================================== who can call what
revoke all on function public.v5_impact_summary() from public;
revoke all on function public.v5_impact_totals() from public, anon, authenticated;
revoke all on function public.v5_is_team() from public;
revoke all on function public.v5_code_save(text, jsonb) from public;
revoke all on function public.v5_code_load(text) from public;
revoke all on function public.v5_verify_claim(text) from public;
revoke all on function public.v5_redeem_claim(text, text) from public;
grant execute on function public.v5_impact_summary() to authenticated;
grant execute on function public.v5_is_team() to authenticated;
grant execute on function public.v5_code_save(text, jsonb) to anon, authenticated;
grant execute on function public.v5_code_load(text) to anon, authenticated;
grant execute on function public.v5_verify_claim(text) to authenticated;
grant execute on function public.v5_redeem_claim(text, text) to authenticated;
