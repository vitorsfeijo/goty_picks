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
