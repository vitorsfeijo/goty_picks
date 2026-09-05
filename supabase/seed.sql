-- Development-only lifecycle fixture. Production edition state is changed through
-- a reviewed migration or a protected administrative process.
insert into public.editions (year, status, votes_close_at)
values (2025, 'concluded', '2025-12-12 00:00:00+00')
on conflict (year) do update
set status = excluded.status,
    votes_close_at = excluded.votes_close_at;
