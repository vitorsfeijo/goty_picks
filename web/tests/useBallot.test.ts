import { act, renderHook, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBallot } from '../src/hooks/useBallot';
import { edition } from './fixtures';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../src/lib/supabase', () => ({ supabase: { from: mocks.from } }));
const user = { id: 'player' } as User;
const key = 'goty_picks_ballot_2025';

beforeEach(() => { vi.clearAllMocks(); });

describe('ballot persistence', () => {
  it('persists votes, restores on remount and clears them', async () => {
    const first = renderHook(() => useBallot(edition, null));
    await act(() => first.result.current.setVote('goty', 'alpha'));
    expect(first.result.current.progressPercentage).toBe(50);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ goty: 'alpha' });
    first.unmount();
    const second = renderHook(() => useBallot(edition, null));
    expect(second.result.current.votes).toEqual({ goty: 'alpha' });
    await act(() => second.result.current.clearVotes());
    expect(second.result.current.totalVoted).toBe(0);
    expect(localStorage.getItem(key)).toBeNull();
  });
  it('handles malformed storage and an empty edition', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem(key, '{broken');
    const { result } = renderHook(() => useBallot({ ...edition, categories: [] }, null));
    expect(result.current.votes).toEqual({});
    expect(result.current.progressPercentage).toBe(0);
    vi.restoreAllMocks();
  });
  it('blocks changes and clearing while locked', async () => {
    localStorage.setItem(key, JSON.stringify({ goty: 'alpha' }));
    const { result } = renderHook(() => useBallot({ ...edition, status: 'locked' }, null));
    await act(() => result.current.setVote('goty', 'zeta'));
    await act(() => result.current.clearVotes());
    expect(result.current.votes).toEqual({ goty: 'alpha' });
    expect(result.current.syncError).toContain('congelada');
  });
  it('isolates votes when switching editions', () => {
    localStorage.setItem(key, JSON.stringify({ goty: 'alpha' }));
    const { result, rerender } = renderHook(({ year }) => useBallot({ ...edition, year }, null), { initialProps: { year: 2025 } });
    rerender({ year: 2024 });
    expect(result.current.votes).toEqual({});
    rerender({ year: 2025 });
    expect(result.current.votes).toEqual({ goty: 'alpha' });
  });
});

function mockCloud(data: { category_id: string; nominee_id: string }[], error: { message: string } | null = null) {
  const query = { select: vi.fn(), eq: vi.fn(), then: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.then.mockImplementation((callback) => Promise.resolve({ data, error }).then(callback));
  const upsert = vi.fn().mockResolvedValue({ error: null });
  mocks.from.mockReturnValue({ ...query, upsert });
  return { upsert };
}

describe('cloud synchronization', () => {
  it('prefers cloud conflicts and uploads missing local picks', async () => {
    localStorage.setItem(key, JSON.stringify({ goty: 'zeta', art: 'beta' }));
    const { upsert } = mockCloud([{ category_id: 'goty', nominee_id: 'alpha' }]);
    const { result } = renderHook(() => useBallot(edition, user));
    await waitFor(() => expect(result.current.saveStatus).toBe('saved'));
    expect(result.current.votes).toEqual({ goty: 'alpha', art: 'beta' });
    expect(upsert).toHaveBeenCalledWith([{ user_id: 'player', year: 2025, category_id: 'art', nominee_id: 'beta' }], { onConflict: 'user_id,year,category_id' });
  });
  it('does not upload pending votes to a locked edition', async () => {
    localStorage.setItem(key, JSON.stringify({ goty: 'alpha' }));
    const { upsert } = mockCloud([]);
    const { result } = renderHook(() => useBallot({ ...edition, status: 'locked' }, user));
    await waitFor(() => expect(result.current.syncing).toBe(false));
    expect(upsert).not.toHaveBeenCalled();
  });
  it('retains local picks when the cloud read fails', async () => {
    localStorage.setItem(key, JSON.stringify({ goty: 'alpha' }));
    mockCloud([], { message: 'offline' });
    const { result } = renderHook(() => useBallot(edition, user));
    await waitFor(() => expect(result.current.saveStatus).toBe('error'));
    expect(result.current.votes).toEqual({ goty: 'alpha' });
  });
  it('rolls back a rejected save in state and storage', async () => {
    const { upsert } = mockCloud([{ category_id: 'goty', nominee_id: 'alpha' }]);
    const { result } = renderHook(() => useBallot(edition, user));
    await waitFor(() => expect(result.current.saveStatus).toBe('saved'));
    upsert.mockResolvedValueOnce({ error: { message: 'row-level security' } });
    await act(() => result.current.setVote('goty', 'zeta'));
    expect(result.current.votes).toEqual({ goty: 'alpha' });
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ goty: 'alpha' });
    expect(result.current.saveStatus).toBe('error');
  });
});
