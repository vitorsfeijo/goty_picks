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
