# Supabase Backend

This directory is the versioned backend for GOTY Picks. It follows the project architecture: the React application is a static GitHub Pages site, the scraper publishes editorial data as JSON, and Supabase provides authentication, user profiles, ballots, secure access rules, and server-side statistics.

## Scope and ownership

| Concern | Owner | Source of truth |
| --- | --- | --- |
| Categories, nominees, winners, and public edition content | Scraper | `scraper/data/`, synced to `web/public/data/` |
| Authentication, profiles, ballots, locks, and rankings | Supabase | `supabase/migrations/` and the deployed PostgreSQL database |
| User interface and anonymous public content | Web | `web/` |

Do not copy the entire nominees catalog into Supabase just to render the site. The static JSON contract is intentionally the content source. Supabase stores only information that needs identity, concurrency, authorization, or aggregate queries.

## Intended layout

```text
supabase/
├── config.toml                  # Created by `supabase init`; contains no secrets
├── migrations/                  # Timestamp-prefixed, append-only SQL changes
├── functions/                   # Optional Supabase Edge Functions
├── tests/                       # Database/RLS tests and SQL fixtures
├── seed.sql                     # Safe local development data only
└── README.md                    # This guide
```

`supabase_schema.sql` is a legacy bootstrap reference kept in this directory for historical context. Do not execute it in a new environment: the versioned implementation is now in `migrations/`. All future changes are made through new migrations.

## Local setup

Prerequisites: Docker and the Supabase CLI.

```powershell
supabase init
supabase start
supabase db reset
```

Run those commands from the repository root. `supabase init` creates `supabase/config.toml`; `supabase start` starts the local stack; and `supabase db reset` rebuilds the local database from every migration followed by `seed.sql`.

Create a migration for each intentional schema change:

```powershell
supabase migration new create_editions
```

Use the timestamped SQL file produced under `supabase/migrations/`. Never edit a migration that has already been applied to a shared environment. Instead, create a forward-only migration that changes it.

Typical release validation:

```powershell
supabase db reset
supabase test db
supabase db push
```

`db push` targets the linked remote project, so it should run only after a review of the migration and in the intended environment.

## Database model

### `profiles`

`profiles.id` is both the primary key and a foreign key to `auth.users(id)`. It stores public participant data used in scorecards and leaderboards: `id`, optional `email`, `display_name`, optional `avatar_url`, and audit timestamps.

A trigger creates the row after a user is created in Supabase Auth. The trigger function must use a safe `search_path` and use `SECURITY DEFINER` only because it writes to `public.profiles` from the `auth` trigger context.

### `editions`

`editions` is the server-authoritative lifecycle record for each award year:

- `year` integer primary key
- `status` constrained to `open`, `locked`, or `concluded`
- `votes_close_at` timestamptz
- `created_at` and `updated_at` timestamptz

The static `editions.json` controls which edition the interface presents. This table controls permissions. The client must have no policy that permits it to create or alter edition lifecycle data.

### `votes`

Each row is one chosen nominee for one category: UUID `id`, `user_id` referencing `profiles(id)`, `year`, `category_id`, `nominee_id`, and audit timestamps. `category_id` and `nominee_id` must match the static JSON identifiers.

There must be a unique constraint on `(user_id, year, category_id)`. This lets the frontend use an upsert and prevents duplicate picks under concurrent requests. Keep indexes on `(user_id, year)` and `(year, category_id)`.

## Row Level Security

RLS is mandatory on every application table. The browser uses the anonymous key, so policies—not the UI—are the security boundary.

| Resource | Required rule |
| --- | --- |
| `profiles` read | Permit only public fields needed for a leaderboard. |
| `profiles` update | `auth.uid() = id`; no user can alter another profile. |
| `votes` insert/update/delete | `auth.uid() = user_id` and the matching edition is `open` with `now() < votes_close_at`. |
| `votes` read during `open` | Do not expose individual rows; expose an approved aggregate only if desired. |
| `votes` read after `locked` | Public ballots may be readable for transparency. |
| `editions` writes | Administrative/service path only; never a normal browser session. |

The initial root schema allows public reads and unrestricted-in-time writes to votes. That is insufficient for the lifecycle described in `ARCHITECTURE.md`. When migrating it, replace those policies with policies that consult `public.editions` on every write.

Avoid letting a policy trust a year, phase, deadline, or user ID supplied by the client. It must derive the user from `auth.uid()` and phase/deadline from the database.

## Statistics and RPCs

Ranking, scorecards, vote distribution, and post-ceremony insights should be implemented as SQL views or RPC functions. The client should request an aggregate such as a leaderboard instead of selecting every vote and calculating it in JavaScript.

Any `SECURITY DEFINER` function must explicitly set a safe `search_path`, validate inputs, return only intended fields, and grant execute only to the intended roles. Use a privileged Edge Function only when RLS cannot safely serve the use case: administrative synchronization of lifecycle records, a trusted integration, or a task needing server-only credentials. Never put `service_role` in the web application.

## Frontend integration

The project uses `@supabase/supabase-js` through `web/src/lib/supabase.ts`. Keep environment values in `web/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
```

Both names may appear in the frontend bundle; they are designed to be public. Their safety depends on RLS. The `service_role` key bypasses RLS and must stay only in a protected server/CI secret or Edge Function secret.

Commit `web/.env.example` with variable names and placeholders, but do not commit `.env.local` or real credentials.

The current interface supports passwordless e-mail login (magic link). In the
Supabase Dashboard, configure **Authentication → URL Configuration** with the
local development URL (`http://localhost:3000`) and the exact deployed GitHub
Pages URL as allowed redirect URLs. The application returns the user to the
current path after authentication. Enable the e-mail provider and configure a
production SMTP provider before public launch; the default development mail
limits are not appropriate for a real pool.

Visitors without a configured Supabase client continue in local-only mode.
Authenticated users load and upsert their ballot through the `votes` table.
The server remains authoritative: an RLS rejection caused by a deadline or
locked edition is shown to the user and the optimistic UI change is reverted.

After schema changes, regenerate client types:

```powershell
supabase gen types typescript --local --schema public | Out-File -Encoding utf8 web/src/types/database.types.ts
```

Generated files should not be edited by hand.

## Tests and review checklist

Before deploying a migration, reset a local database and test at least these cases:

- A new Auth user receives exactly one profile.
- A user cannot create, update, or delete another user's vote.
- A user cannot write votes after the selected edition is locked or the deadline has passed.
- Individual ballots are not readable while an edition is open.
- The unique ballot constraint rejects a second category pick for the same user and year.
- Leaderboard and scorecard RPCs return correct results without leaking private data.

Also verify indexes with realistic query patterns and ensure every new table has RLS enabled before it is exposed to the client.

## CI/CD

`supabase-validate.yml` rebuilds the local Supabase stack from migrations and
the seed file for every backend pull request. `supabase-deploy.yml` is manual
and targets the protected GitHub `production` environment. Before its first
run, add these GitHub environment secrets:

- `SUPABASE_ACCESS_TOKEN`: a Supabase personal access token with access to the project.
- `SUPABASE_PROJECT_REF`: the hosted project reference.

Set `SYNC_EDITION_SECRET` separately through `supabase secrets set`; it must
not be stored as a GitHub repository variable because the Edge Function needs
it only at runtime.
