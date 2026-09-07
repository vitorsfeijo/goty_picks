-- Extensions used by application tables and default values.
create extension if not exists pgcrypto;
-- Public application profile associated one-to-one with Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- This trigger runs from auth.users, so it is deliberately security definer.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_name text;
begin
  resolved_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Player'
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(resolved_name, 80),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
-- Server-side source of truth for the voting lifecycle.
create type public.edition_status as enum ('open', 'locked', 'concluded');

create table public.editions (
  year integer primary key check (year between 2014 and 2100),
  status public.edition_status not null default 'open',
  votes_close_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger editions_set_updated_at
before update on public.editions
for each row execute function public.set_updated_at();
-- The winner ID is the minimal result data needed for database scorecards.
-- Categories and nominees themselves remain in the scraper's static JSON contract.
create table public.edition_results (
  year integer not null references public.editions(year) on delete restrict,
  category_id text not null check (char_length(trim(category_id)) > 0),
  winner_nominee_id text not null check (char_length(trim(winner_nominee_id)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (year, category_id)
);

create trigger edition_results_set_updated_at
before update on public.edition_results
for each row execute function public.set_updated_at();

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  year integer not null references public.editions(year) on delete restrict,
  category_id text not null check (char_length(trim(category_id)) > 0),
  nominee_id text not null check (char_length(trim(nominee_id)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint votes_one_pick_per_category unique (user_id, year, category_id)
);

create trigger votes_set_updated_at
before update on public.votes
for each row execute function public.set_updated_at();

create index votes_user_year_idx on public.votes (user_id, year);
create index votes_year_category_idx on public.votes (year, category_id);
create index edition_results_year_idx on public.edition_results (year);
alter table public.profiles enable row level security;
alter table public.editions enable row level security;
alter table public.edition_results enable row level security;
alter table public.votes enable row level security;

-- These helpers read lifecycle data inside RLS policies. SECURITY DEFINER avoids
-- coupling vote policies to a client-facing policy on the editions table.
create or replace function public.is_edition_open(p_year integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.editions
    where year = p_year
      and status = 'open'
      and now() < votes_close_at
  );
$$;

create or replace function public.are_ballots_public(p_year integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.editions
    where year = p_year
      and status in ('locked', 'concluded')
  );
$$;

create policy "public profiles are readable"
on public.profiles for select
using (true);

create policy "users update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- The public app needs the lifecycle state to render an appropriate interface.
create policy "editions are readable"
on public.editions for select
using (true);

create policy "users read their own ballot or public ballots"
on public.votes for select to authenticated
using (user_id = auth.uid() or public.are_ballots_public(year));

create policy "users insert votes while the edition is open"
on public.votes for insert to authenticated
with check (user_id = auth.uid() and public.is_edition_open(year));

create policy "users update votes while the edition is open"
on public.votes for update to authenticated
using (user_id = auth.uid() and public.is_edition_open(year))
with check (user_id = auth.uid() and public.is_edition_open(year));

create policy "users delete votes while the edition is open"
on public.votes for delete to authenticated
using (user_id = auth.uid() and public.is_edition_open(year));

revoke all on function public.is_edition_open(integer) from public;
revoke all on function public.are_ballots_public(integer) from public;
grant execute on function public.is_edition_open(integer) to authenticated;
grant execute on function public.are_ballots_public(integer) to authenticated;
-- Returns a public aggregate only after the ballot phase has locked.
create or replace function public.get_community_votes_distribution(p_year integer)
returns table (
  category_id text,
  nominee_id text,
  total_votes bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.are_ballots_public(p_year) then
    raise exception 'Community ballot data is unavailable until this edition is locked';
  end if;

  return query
  select v.category_id, v.nominee_id, count(*)::bigint
  from public.votes v
  where v.year = p_year
  group by v.category_id, v.nominee_id
  order by v.category_id, count(*) desc, v.nominee_id;
end;
$$;

-- A final leaderboard is available only when winners have been confirmed.
create or replace function public.get_leaderboard(p_year integer)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  correct_picks bigint,
  total_picks bigint,
  accuracy numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.editions where year = p_year and status = 'concluded'
  ) then
    raise exception 'Leaderboard is unavailable until this edition is concluded';
  end if;

  return query
  with scores as (
    select
      p.id as player_id,
      p.display_name,
      p.avatar_url,
      count(v.id) filter (where v.nominee_id = r.winner_nominee_id)::bigint as hits,
      count(v.id)::bigint as picks
    from public.profiles p
    join public.votes v on v.user_id = p.id and v.year = p_year
    left join public.edition_results r
      on r.year = v.year and r.category_id = v.category_id
    group by p.id, p.display_name, p.avatar_url
  )
  select
    rank() over (order by s.hits desc, s.picks desc, s.player_id)::bigint,
    s.player_id,
    s.display_name,
    s.avatar_url,
    s.hits,
    s.picks,
    round((s.hits::numeric / nullif(s.picks, 0)) * 100, 1)
  from scores s
  order by s.hits desc, s.picks desc, s.player_id;
end;
$$;

revoke all on function public.get_community_votes_distribution(integer) from public;
revoke all on function public.get_leaderboard(integer) from public;
grant execute on function public.get_community_votes_distribution(integer) to anon, authenticated;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;
-- Allow everyone (authenticated and anon) to read edition results
create policy "edition results are readable by everyone"
on public.edition_results for select
using (true);

-- Allow anonymous visitors to view public ballots once an edition is locked or concluded
create policy "public ballots are readable by anon"
on public.votes for select to anon
using (public.are_ballots_public(year));

-- Ensure anon role can execute are_ballots_public
grant execute on function public.are_ballots_public(integer) to anon;
-- 1. Insert all historical TGA editions (2014-2025 as concluded) and 2026 as open
insert into public.editions (year, status, votes_close_at)
values
  (2014, 'concluded', '2014-12-05 00:00:00+00'),
  (2015, 'concluded', '2015-12-03 00:00:00+00'),
  (2016, 'concluded', '2016-12-01 00:00:00+00'),
  (2017, 'concluded', '2017-12-07 00:00:00+00'),
  (2018, 'concluded', '2018-12-06 00:00:00+00'),
  (2019, 'concluded', '2019-12-12 00:00:00+00'),
  (2020, 'concluded', '2020-12-10 00:00:00+00'),
  (2021, 'concluded', '2021-12-09 00:00:00+00'),
  (2022, 'concluded', '2022-12-08 00:00:00+00'),
  (2023, 'concluded', '2023-12-07 00:00:00+00'),
  (2024, 'concluded', '2024-12-12 00:00:00+00'),
  (2025, 'concluded', '2025-12-11 00:00:00+00'),
  (2026, 'open', '2026-12-10 23:59:59+00')
on conflict (year) do update
set status = excluded.status,
    votes_close_at = excluded.votes_close_at;

-- 2. Update is_edition_open to allow retrospective voting on concluded editions
-- while keeping active editions strictly locked during ceremony / past deadline.
create or replace function public.is_edition_open(p_year integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.editions
    where year = p_year
      and (
        (status = 'open' and now() < votes_close_at)
        or status = 'concluded'
      )
  );
$$;

grant execute on function public.is_edition_open(integer) to anon, authenticated;
