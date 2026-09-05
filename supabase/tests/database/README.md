# Database test plan

Run the migration suite against a local Supabase instance before adding automated
SQL tests. The minimum security cases are documented in `../README.md` and are:

- a new `auth.users` record creates one `profiles` record;
- a user can only change their own profile and votes;
- votes cannot be written after `votes_close_at` or after an edition locks;
- a user can read their own ballot while open, but not someone else's;
- community data is unavailable until lock and the leaderboard until conclusion.

The exact test runner can be pgTAP through `supabase test db` or an integration
test suite using two authenticated test users. Do not execute these checks
against production user data.
