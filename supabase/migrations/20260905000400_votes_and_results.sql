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
