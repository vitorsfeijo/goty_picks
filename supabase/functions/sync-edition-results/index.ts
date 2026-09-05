import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type EditionStatus = 'open' | 'locked' | 'concluded';

interface ResultInput {
  categoryId: string;
  winnerNomineeId: string;
}

interface SyncPayload {
  year: number;
  status: EditionStatus;
  votesCloseAt: string;
  results?: ResultInput[];
}

const corsHeaders = {
  'content-type': 'application/json; charset=utf-8'
};

function response(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function isPayload(value: unknown): value is SyncPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<SyncPayload>;
  return Number.isInteger(payload.year)
    && (payload.status === 'open' || payload.status === 'locked' || payload.status === 'concluded')
    && typeof payload.votesCloseAt === 'string'
    && !Number.isNaN(Date.parse(payload.votesCloseAt))
    && (payload.results === undefined || Array.isArray(payload.results));
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  const syncSecret = Deno.env.get('SYNC_EDITION_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!syncSecret || !supabaseUrl || !serviceRoleKey) {
    return response({ error: 'Function is not configured' }, 500);
  }
  if (request.headers.get('authorization') !== `Bearer ${syncSecret}`) {
    return response({ error: 'Unauthorized' }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return response({ error: 'Invalid JSON body' }, 400);
  }
  if (!isPayload(payload) || payload.year < 2014 || payload.year > 2100) {
    return response({ error: 'Invalid edition payload' }, 400);
  }
  if (payload.status !== 'concluded' && (payload.results?.length ?? 0) > 0) {
    return response({ error: 'Winner results can only be published for a concluded edition' }, 400);
  }

  const results = payload.results ?? [];
  const uniqueCategories = new Set<string>();
  for (const result of results) {
    if (!result || typeof result.categoryId !== 'string' || typeof result.winnerNomineeId !== 'string'
      || !result.categoryId.trim() || !result.winnerNomineeId.trim() || uniqueCategories.has(result.categoryId)) {
      return response({ error: 'Results must have unique non-empty categoryId and winnerNomineeId values' }, 400);
    }
    uniqueCategories.add(result.categoryId);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { error: editionError } = await admin.from('editions').upsert({
    year: payload.year,
    status: payload.status,
    votes_close_at: payload.votesCloseAt
  });
  if (editionError) return response({ error: editionError.message }, 500);

  if (results.length > 0) {
    const { error: resultsError } = await admin.from('edition_results').upsert(
      results.map((result) => ({
        year: payload.year,
        category_id: result.categoryId.trim(),
        winner_nominee_id: result.winnerNomineeId.trim()
      })),
      { onConflict: 'year,category_id' }
    );
    if (resultsError) return response({ error: resultsError.message }, 500);
  }

  return response({ year: payload.year, status: payload.status, syncedResults: results.length });
});
