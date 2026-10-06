import { describe, expect, it } from 'vitest';
import { computeCommunityStats } from '../src/utils/communityStats';
import { edition } from './fixtures';

describe('community statistics', () => {
  it('handles a future edition without categories', () => {
    expect(computeCommunityStats({ ...edition, categories: [] })).toMatchObject({
      totalParticipants: 0, categories: [], mostAccurateCategory: null,
      leastAccurateCategory: null, biggestUpset: null,
      highestConsensusPick: { percentage: 0 },
    });
  });
  it('keeps zero-vote categories finite and without upsets', () => {
    const stats = computeCommunityStats(edition, []);
    expect(stats.totalParticipants).toBe(0);
    expect(stats.categories.every(c => c.correctPercentage === 0 && !c.isUpset)).toBe(true);
  });
  it('calculates rounded percentages, accuracy and the biggest upset', () => {
    const stats = computeCommunityStats(edition, [
      { category_id: 'goty', nominee_id: 'alpha', total_votes: 8 },
      { category_id: 'goty', nominee_id: 'zeta', total_votes: 2 },
      { category_id: 'art', nominee_id: 'beta', total_votes: 1 },
      { category_id: 'art', nominee_id: 'gamma', total_votes: 2 },
    ]);
    expect(stats.totalParticipants).toBe(10);
    expect(stats.mostAccurateCategory?.categoryId).toBe('goty');
    expect(stats.leastAccurateCategory?.correctPercentage).toBe(33);
    expect(stats.biggestUpset).toMatchObject({ predictedName: 'Gamma', predictedPct: 67, winnerName: 'Beta', winnerPct: 33 });
  });
  it('ignores unknown nominees and handles categories without nominees or winners', () => {
    const stats = computeCommunityStats({ ...edition, categories: [
      { id: 'empty', title: 'Empty', nominees: [] },
      { ...edition.categories[0], winner_id: null },
    ] }, [{ category_id: 'goty', nominee_id: 'unknown', total_votes: 99 }]);
    expect(stats.totalParticipants).toBe(0);
    expect(stats.biggestUpset).toBeNull();
    expect(stats.categories[0].distribution).toEqual([]);
  });
});
