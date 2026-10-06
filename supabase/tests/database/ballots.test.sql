begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(24);

-- Isolated years and users; every fixture is rolled back at the end.
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-000000000001', 'alice@test.invalid', '{"full_name":"Alice"}'),
 ('00000000-0000-0000-0000-000000000002', 'bob@test.invalid', '{}');
insert into public.editions (year, status, votes_close_at) values
 (2090, 'open', now() + interval '1 day'),
 (2091, 'open', now() - interval '1 day'),
 (2092, 'locked', now() + interval '1 day'),
 (2093, 'concluded', now() - interval '1 day');
insert into public.edition_results (year, category_id, winner_nominee_id) values
 (2093, 'goty', 'alpha'), (2093, 'art', 'beta');
insert into public.votes (user_id, year, category_id, nominee_id) values
 ('00000000-0000-0000-0000-000000000001', 2090, 'goty', 'alpha'),
 ('00000000-0000-0000-0000-000000000002', 2090, 'goty', 'zeta'),
 ('00000000-0000-0000-0000-000000000001', 2092, 'art', 'beta'),
 ('00000000-0000-0000-0000-000000000002', 2092, 'goty', 'zeta'),
 ('00000000-0000-0000-0000-000000000001', 2093, 'goty', 'alpha'),
 ('00000000-0000-0000-0000-000000000001', 2093, 'art', 'beta'),
 ('00000000-0000-0000-0000-000000000002', 2093, 'goty', 'alpha'),
 ('00000000-0000-0000-0000-000000000002', 2093, 'art', 'wrong');

select is((select display_name from profiles where id = '00000000-0000-0000-0000-000000000001'), 'Alice', 'Auth trigger creates named profile');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-000000000002'), 'bob', 'Auth trigger falls back to email');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is((select count(*) from votes where year = 2090), 1::bigint, 'Open ballots expose only own votes');
select lives_ok($$update profiles set display_name = 'Alice updated' where id = auth.uid()$$, 'Can update own profile');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-000000000002'), 'bob', 'Cannot update another profile');
select lives_ok($$insert into votes (user_id, year, category_id, nominee_id) values (auth.uid(), 2090, 'art', 'beta')$$, 'Can insert own open vote');
select throws_ok($$insert into votes (user_id, year, category_id, nominee_id) values ('00000000-0000-0000-0000-000000000002', 2090, 'art', 'beta')$$, '42501', null, 'Cannot insert another player vote');
set local role postgres;
select is((select nominee_id from votes where year = 2090 and user_id = '00000000-0000-0000-0000-000000000002' and category_id = 'goty'), 'zeta', 'Cannot update another ballot');
select is((select count(*) from votes where year = 2090 and user_id = '00000000-0000-0000-0000-000000000002' and category_id = 'goty'), 1::bigint, 'Cannot delete another ballot');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select throws_ok($$insert into votes (user_id, year, category_id, nominee_id) values (auth.uid(), 2091, 'goty', 'alpha')$$, '42501', null, 'Expired open edition rejects votes');
select throws_ok($$insert into votes (user_id, year, category_id, nominee_id) values (auth.uid(), 2092, 'goty', 'alpha')$$, '42501', null, 'Locked edition rejects votes');
select is((select count(*) from votes where year = 2092), 2::bigint, 'Locked ballots are public to authenticated users');
select is((select nominee_id from votes where year = 2092 and user_id = auth.uid() and category_id = 'art'), 'beta', 'Cannot update own locked ballot');
select is((select count(*) from votes where year = 2092 and user_id = auth.uid() and category_id = 'art'), 1::bigint, 'Cannot delete own locked ballot');
select lives_ok($$insert into votes (user_id, year, category_id, nominee_id) values (auth.uid(), 2093, 'retrospective', 'alpha')$$, 'Concluded edition permits retrospective votes');
select lives_ok($$delete from votes where year = 2093 and category_id = 'retrospective'$$, 'Can clear retrospective vote');
select throws_ok($$select * from get_community_votes_distribution(2090)$$, 'P0001', 'Community ballot data is unavailable until this edition is locked', 'Distribution hidden while open');
select throws_ok($$select * from get_leaderboard(2092)$$, 'P0001', 'Leaderboard is unavailable until this edition is concluded', 'Ranking hidden while locked');

set local role anon;
select is((select count(*) from votes where year = 2090), 0::bigint, 'Anonymous cannot read open ballots');
select is((select count(*) from votes where year = 2092), 2::bigint, 'Anonymous can read locked ballots');
select results_eq($$select nominee_id, total_votes from get_community_votes_distribution(2093) where category_id = 'goty'$$, $$values ('alpha'::text, 2::bigint)$$, 'Distribution aggregates participants');
select results_eq($$select rank, correct_picks, total_picks, accuracy from get_leaderboard(2093) order by rank$$, $$values (1::bigint, 2::bigint, 2::bigint, 100.0::numeric), (2::bigint, 1::bigint, 2::bigint, 50.0::numeric)$$, 'Ranking orders scores and computes accuracy');
select is(public.is_edition_open(2091), false, 'Deadline is enforced server-side');
select is(public.are_ballots_public(2090), false, 'Open edition stays private');

select * from finish();
rollback;
