import type { Edition } from '../types';
import type { RawVoteDistribution } from './communityStats';

export interface GotyYearInput {
  edition: Edition;
  distribution?: RawVoteDistribution[];
}

export function computeGotyStats(inputs: GotyYearInput[]) {
  const years = inputs.flatMap(({ edition, distribution }) => {
    const category = edition.categories.find(c => c.id === 'jogo-do-ano' || c.id === 'goty' || /^(jogo do ano|game of the year)$/i.test(c.title.trim()));
    if (!category?.nominees.length) return [];
    const winnerId = category.winner_id || category.nominees.find(n => n.winner)?.id;
    const nominees = category.nominees.map(n => ({
      ...n,
      count: (distribution ?? []).filter(d => d.category_id === category.id && d.nominee_id === n.id).reduce((sum, d) => sum + Number(d.total_votes), 0),
    }));
    const totalVotes = nominees.reduce((sum, n) => sum + n.count, 0);
    return [{ year: edition.year, categoryId: category.id, winner: category.nominees.find(n => n.id === winnerId),
      available: distribution !== undefined, totalVotes,
      nominees: nominees.map(n => ({ ...n, percentage: totalVotes ? Math.round(n.count / totalVotes * 100) : 0 })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR')) }];
  }).sort((a, b) => b.year - a.year);
  const games = new Map<string, { name: string; count: number; years: number[] }>();
  for (const year of years) for (const nominee of year.nominees) {
    const key = nominee.name.trim().toLocaleLowerCase();
    const game = games.get(key) ?? { name: nominee.name, count: 0, years: [] };
    game.count += nominee.count;
    if (!game.years.includes(year.year)) game.years.push(year.year);
    games.set(key, game);
  }
  return { years, totalVotes: years.reduce((sum, y) => sum + y.totalVotes, 0),
    totalGames: games.size,
    favorites: [...games.values()].filter(g => g.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR')) };
}
