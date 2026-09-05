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
