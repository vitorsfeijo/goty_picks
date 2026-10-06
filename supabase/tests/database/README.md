# Database tests

`ballots.test.sql` exercises profile triggers, vote RLS, deadlines,
retrospective voting, public access, distribution and leaderboard RPCs.
Fixtures run inside a transaction and are rolled back.

With Docker running, use `npx supabase start`, `npx supabase db reset`,
and `npx supabase test db` from the repository root.
Use a disposable local database. See [TESTING.md](../../../TESTING.md).
