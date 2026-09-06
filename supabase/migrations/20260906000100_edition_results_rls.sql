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
