# `sync-edition-results`

Protected administrative endpoint for publishing an edition lifecycle state and,
once concluded, its winner IDs. It intentionally stores only winner IDs; the
complete nominee catalog remains owned by the scraper JSON.

Set the secret before deployment:

```powershell
supabase secrets set SYNC_EDITION_SECRET=<long-random-value>
supabase functions deploy sync-edition-results --no-verify-jwt
```

Invoke it only from protected CI or an administrator-controlled environment:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://<project-ref>.supabase.co/functions/v1/sync-edition-results" `
  -Headers @{ Authorization = "Bearer <SYNC_EDITION_SECRET>" } `
  -ContentType "application/json" `
  -Body '{"year":2025,"status":"concluded","votesCloseAt":"2025-12-12T00:00:00Z","results":[{"categoryId":"jogo-do-ano","winnerNomineeId":"clair-obscur-expedition-33"}]}'
```

The shared secret is required because this function uses a service-role client.
Do not expose it in the web application, repository variables, or browser.
