import { describe, expect, it } from 'vitest';
import { computeGotyStats } from '../src/utils/gotyStats';
import { edition } from './fixtures';

describe('GOTY history', () => {
  it('isolates GOTY from other categories and aggregates the same game across years', () => {
    const category = edition.categories[0];
    const stats = computeGotyStats([
      { edition, distribution: [
        { category_id: 'goty', nominee_id: 'alpha', total_votes: 2 },
        { category_id: 'goty', nominee_id: 'zeta', total_votes: 8 },
        { category_id: 'art', nominee_id: 'gamma', total_votes: 999 },
        { category_id: 'goty', nominee_id: 'removed', total_votes: 999 },
      ] },
      { edition: { ...edition, year: 2024, categories: [{ ...category, id: 'jogo-do-ano', title: 'Jogo do Ano', nominees: category.nominees.map(n => ({ ...n, id: `${n.id}-2024` })) }] },
        distribution: [{ category_id: 'jogo-do-ano', nominee_id: 'zeta-2024', total_votes: 3 }] },
    ]);
    expect(stats.totalVotes).toBe(13);
    expect(stats.totalGames).toBe(2);
    expect(stats.favorites[0]).toEqual({ name: 'Zeta', count: 11, years: [2025, 2024] });
    expect(stats.years[0].nominees[0].percentage).toBe(80);
  });
  it('excludes empty future editions and distinguishes unavailable data from zero votes', () => {
    const stats = computeGotyStats([
      { edition: { ...edition, year: 2026, categories: [] }, },
      { edition, },
      { edition: { ...edition, year: 2024 }, distribution: [] },
    ]);
    expect(stats.years.map(y => y.year)).toEqual([2025, 2024]);
    expect(stats.years[0].available).toBe(false);
    expect(stats.years[1].available).toBe(true);
    expect(stats.favorites).toEqual([]);
    expect(stats.years[1].nominees.every(n => n.percentage === 0)).toBe(true);
  });
  it('resolves winner flags and supports an empty history', () => {
    const goty = { ...edition.categories[1], id: 'goty' };
    expect(computeGotyStats([{ edition: { ...edition, categories: [goty] }, }]).years[0].winner?.id).toBe('beta');
    expect(computeGotyStats([])).toMatchObject({ years: [], totalVotes: 0, totalGames: 0, favorites: [] });
  });
});
