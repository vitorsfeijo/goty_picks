// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSyncHandler } from '../../supabase/functions/sync-edition-results/handler';

const payload = { year: 2025, status: 'concluded', votesCloseAt: '2025-12-11T00:00:00Z', results: [{ categoryId: 'goty', winnerNomineeId: 'alpha' }] };
const upsert = vi.fn();
const from = vi.fn((_table: string) => ({ upsert }));
const createClient = vi.fn(() => ({ from }));
const handler = createSyncHandler({ env: name => ({ SYNC_EDITION_SECRET: 'test-secret', SUPABASE_URL: 'http://localhost', SUPABASE_SERVICE_ROLE_KEY: 'test-key' })[name], createClient });
const request = (body: unknown = payload, token = 'Bearer test-secret', method = 'POST') => new Request('http://localhost/sync', {
  method, headers: { authorization: token }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
});
beforeEach(() => { vi.clearAllMocks(); upsert.mockResolvedValue({ error: null }); });

describe('sync edition endpoint', () => {
  it.each(['', 'Bearer wrong'])('rejects unauthorized requests (%s) before any writes', async token => {
    expect((await handler(request(payload, token))).status).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });
  it.each(['GET', 'PUT', 'DELETE'])('rejects %s', async method => {
    expect((await handler(request(payload, '', method))).status).toBe(405);
  });
  it('rejects missing runtime configuration', async () => {
    expect((await createSyncHandler({ env: () => undefined, createClient })(request())).status).toBe(500);
  });
  it('rejects malformed JSON', async () => {
    expect((await handler(new Request('http://localhost', { method: 'POST', headers: { authorization: 'Bearer test-secret' }, body: '{' }))).status).toBe(400);
  });
  it.each([null, {}, { ...payload, year: 2013 }, { ...payload, year: 2101 }, { ...payload, year: 2025.5 }, { ...payload, status: 'unknown' }, { ...payload, votesCloseAt: 'invalid' }, { ...payload, results: {} }, { ...payload, status: 'open' }, { ...payload, status: 'locked' }, { ...payload, results: [null] }, { ...payload, results: [{ categoryId: ' ', winnerNomineeId: 'alpha' }] }, { ...payload, results: [...payload.results, ...payload.results] }])('rejects invalid payload %# without writes', async body => {
    expect((await handler(request(body))).status).toBe(400);
    expect(createClient).not.toHaveBeenCalled();
  });
  it('writes edition and normalized winners with the correct conflict key', async () => {
    const response = await handler(request({ ...payload, results: [{ categoryId: ' goty ', winnerNomineeId: ' alpha ' }] }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ year: 2025, status: 'concluded', syncedResults: 1 });
    expect(from.mock.calls.map(call => call[0])).toEqual(['editions', 'edition_results']);
    expect(upsert).toHaveBeenNthCalledWith(2, [{ year: 2025, category_id: 'goty', winner_nominee_id: 'alpha' }], { onConflict: 'year,category_id' });
  });
  it('allows lifecycle changes without publishing winners', async () => {
    expect((await handler(request({ ...payload, status: 'locked', results: [] }))).status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
  it.each([1, 2])('returns a database failure at write %i', async write => {
    if (write === 2) upsert.mockResolvedValueOnce({ error: null });
    upsert.mockResolvedValueOnce({ error: { message: 'database failure' } });
    expect((await handler(request())).status).toBe(500);
    expect(upsert).toHaveBeenCalledTimes(write);
  });
});
