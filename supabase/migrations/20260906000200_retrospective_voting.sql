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
