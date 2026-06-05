-- ============================================================
-- WC2026 App — Supabase Schema
-- Run this in the Supabase SQL editor in one shot.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- GROUPS (A–L, 12 groups)
-- ─────────────────────────────────────────
create table groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,   -- 'A', 'B', ... 'L'
  stage       text not null default 'group'
);

-- ─────────────────────────────────────────
-- TEAMS (48 teams)
-- ─────────────────────────────────────────
create table teams (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  country_code   text not null unique,   -- ISO alpha-2 or custom
  flag_emoji     text not null,
  primary_color  text not null default '#6b7280',  -- hex for glass tint
  group_id       uuid references groups(id)
);

-- ─────────────────────────────────────────
-- FIXTURES (104 games)
-- ─────────────────────────────────────────
create type fixture_status as enum ('scheduled', 'live', 'finished', 'postponed');
create type fixture_stage  as enum ('group', 'r32', 'r16', 'qf', 'sf', 'third_place', 'final');

create table fixtures (
  id               uuid primary key default uuid_generate_v4(),
  home_team_id     uuid not null references teams(id),
  away_team_id     uuid not null references teams(id),
  kickoff_et       timestamptz not null,    -- stored in UTC, displayed ET
  stage            fixture_stage not null,
  group_id         uuid references groups(id),
  home_score       int,                     -- null until finished
  away_score       int,                     -- null until finished
  status           fixture_status not null default 'scheduled',
  broadcasters_us  text[] not null default '{}',
  venue            text not null default '',
  api_football_id  int unique               -- external ID for sync
);

create index idx_fixtures_status    on fixtures(status);
create index idx_fixtures_kickoff   on fixtures(kickoff_et);
create index idx_fixtures_stage     on fixtures(stage);

-- ─────────────────────────────────────────
-- USERS (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table users (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  display_name     text not null,
  avatar_url       text,
  favorite_team_id uuid references teams(id),
  total_points     int not null default 0,
  created_at       timestamptz not null default now()
);

-- Auto-create user row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────
-- PICKS
-- ─────────────────────────────────────────
create table picks (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references users(id) on delete cascade,
  fixture_id        uuid not null references fixtures(id) on delete cascade,
  pred_home_score   int not null check (pred_home_score >= 0),
  pred_away_score   int not null check (pred_away_score >= 0),
  points_earned     int,                   -- null until graded
  locked            boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(user_id, fixture_id)              -- one pick per user per game
);

create index idx_picks_user    on picks(user_id);
create index idx_picks_fixture on picks(fixture_id);

-- ─────────────────────────────────────────
-- AWARD PICKS
-- ─────────────────────────────────────────
create type award_type as enum (
  'golden_boot',
  'golden_ball',
  'golden_glove',
  'tournament_winner'
);

create table award_picks (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references users(id) on delete cascade,
  award_type          award_type not null,
  predicted_team_id   uuid references teams(id),
  predicted_player    text,
  points_earned       int,
  created_at          timestamptz not null default now(),
  unique(user_id, award_type)
);

-- ─────────────────────────────────────────
-- FOLLOWED TEAMS
-- ─────────────────────────────────────────
create table followed_teams (
  user_id    uuid not null references users(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  primary key (user_id, team_id)
);

-- ─────────────────────────────────────────
-- LEADERBOARD VIEW
-- ─────────────────────────────────────────
create or replace view leaderboard as
select
  u.id                                                      as user_id,
  u.display_name,
  u.avatar_url,
  coalesce(sum(p.points_earned), 0)                         as total_points,
  count(*) filter (where p.points_earned = 3)               as exact_scores,
  count(*) filter (where p.points_earned = 1)               as correct_results,
  rank() over (order by coalesce(sum(p.points_earned), 0) desc) as rank
from users u
left join picks p on p.user_id = u.id
group by u.id, u.display_name, u.avatar_url;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table users          enable row level security;
alter table picks          enable row level security;
alter table award_picks    enable row level security;
alter table followed_teams enable row level security;

-- Users can read all users (for leaderboard), edit only themselves
create policy "Users are readable by all"    on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Fixtures and teams are public read
alter table fixtures enable row level security;
alter table teams    enable row level security;
alter table groups   enable row level security;
create policy "Fixtures public read" on fixtures for select using (true);
create policy "Teams public read"    on teams    for select using (true);
create policy "Groups public read"   on groups   for select using (true);

-- Picks: users manage their own, can read all (for comparison)
create policy "Picks readable by all"   on picks for select using (true);
create policy "Picks insert own"        on picks for insert with check (auth.uid() = user_id);
create policy "Picks update own"        on picks for update using (auth.uid() = user_id);

-- Award picks: same pattern
create policy "Award picks readable by all" on award_picks for select using (true);
create policy "Award picks insert own"      on award_picks for insert with check (auth.uid() = user_id);
create policy "Award picks update own"      on award_picks for update using (auth.uid() = user_id);

-- Followed teams: users manage their own
create policy "Followed teams readable by all" on followed_teams for select using (true);
create policy "Followed teams insert own"      on followed_teams for insert with check (auth.uid() = user_id);
create policy "Followed teams delete own"      on followed_teams for delete using (auth.uid() = user_id);
