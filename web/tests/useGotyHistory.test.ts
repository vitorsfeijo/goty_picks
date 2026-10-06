import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useGotyHistory } from '../src/hooks/useGotyHistory';
import { edition } from './fixtures';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: mocks }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('loads all-player aggregates without reading personal votes, retaining successful years', async () => {
  localStorage.setItem('goty_picks_ballot_2025', JSON.stringify({ goty: 'zeta' }));
  const fetch = vi.fn().mockImplementation((url: string) => url.includes('/2024/')
    ? Promise.resolve({ ok: false }) : Promise.resolve({ ok: true, json: async () => edition }));
  vi.stubGlobal('fetch', fetch);
  mocks.rpc.mockResolvedValue({ data: [
    { category_id: 'goty', nominee_id: 'alpha', total_votes: 12 },
    { category_id: 'goty', nominee_id: 'zeta', total_votes: 8 },
  ], error: null });
  const summaries = [2025, 2024, 2026].map(year => ({ year, title: 'TGA', status: 'concluded' as const, categories_count: year === 2026 ? 0 : 2, has_winners: true }));
  const { result } = renderHook(() => useGotyHistory(summaries));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.failedYears).toEqual([2024]);
  expect(result.current.data).toHaveLength(1);
  expect(result.current.data[0].distribution).toEqual([
    { category_id: 'goty', nominee_id: 'alpha', total_votes: 12 },
    { category_id: 'goty', nominee_id: 'zeta', total_votes: 8 },
  ]);
  expect(mocks.from).not.toHaveBeenCalled();
  expect(mocks.rpc).toHaveBeenCalledWith('get_community_votes_distribution', { p_year: 2025 });
  expect(fetch).toHaveBeenCalledTimes(2);
});
