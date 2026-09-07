import { Edition } from '../types';

export interface NomineeVoteDist {
  nomineeId: string;
  nomineeName: string;
  details?: string | null;
  count: number;
  percentage: number;
  isWinner: boolean;
}

export interface CategoryStat {
  categoryId: string;
  categoryTitle: string;
  totalVotes: number;
  winnerId?: string | null;
  winnerName?: string;
  distribution: NomineeVoteDist[];
  correctCount: number;
  correctPercentage: number;
  topVotedNominee: NomineeVoteDist;
  isUpset: boolean; // True if the community's #1 pick was NOT the actual winner
}

export interface CommunityYearStats {
  totalParticipants: number;
  categories: CategoryStat[];
  mostAccurateCategory: CategoryStat;
  leastAccurateCategory: CategoryStat; // "A Maior Zebra"
  highestConsensusPick: { categoryTitle: string; nomineeName: string; percentage: number };
  biggestUpset: { categoryTitle: string; predictedName: string; predictedPct: number; winnerName: string; winnerPct: number } | null;
}

export interface RawVoteDistribution {
  category_id: string;
  nominee_id: string;
  total_votes: number;
}

export function computeCommunityStats(
  edition: Edition,
  realDistribution?: RawVoteDistribution[]
): CommunityYearStats {
  // If real distribution data is provided from Supabase and has records:
  if (realDistribution && realDistribution.length > 0) {
    const votesByCategory: Record<string, Record<string, number>> = {};
    let maxCategoryVotes = 0;

    for (const row of realDistribution) {
      if (!votesByCategory[row.category_id]) {
        votesByCategory[row.category_id] = {};
      }
      const count = Number(row.total_votes);
      votesByCategory[row.category_id][row.nominee_id] = count;
    }

    const categoryStats: CategoryStat[] = [];

    edition.categories.forEach((cat) => {
      const winner = cat.nominees.find((n) => n.winner || cat.winner_id === n.id);
      const catVotesMap = votesByCategory[cat.id] || {};

      let assignedVotes = 0;
      const distribution: NomineeVoteDist[] = cat.nominees.map((nom) => {
        const isWinner = winner?.id === nom.id;
        const count = catVotesMap[nom.id] ?? 0;
        assignedVotes += count;
        return {
          nomineeId: nom.id,
          nomineeName: nom.name,
          details: nom.details,
          count,
          percentage: 0,
          isWinner
        };
      });

      if (assignedVotes > maxCategoryVotes) {
        maxCategoryVotes = assignedVotes;
      }

      distribution.forEach((d) => {
        d.percentage = assignedVotes > 0 ? Math.round((d.count / assignedVotes) * 100) : 0;
      });

      distribution.sort((a, b) => b.count - a.count);

      const topVoted = distribution[0] || {
        nomineeId: '',
        nomineeName: 'Nenhum',
        count: 0,
        percentage: 0,
        isWinner: false
      };
      const winningDist = distribution.find((d) => d.isWinner);
      const correctCount = winningDist ? winningDist.count : 0;
      const correctPercentage = winningDist ? winningDist.percentage : 0;
      const isUpset = winningDist ? topVoted.nomineeId !== winningDist.nomineeId : false;

      categoryStats.push({
        categoryId: cat.id,
        categoryTitle: cat.title,
        totalVotes: assignedVotes,
        winnerId: winner?.id,
        winnerName: winner?.name,
        distribution,
        correctCount,
        correctPercentage,
        topVotedNominee: topVoted,
        isUpset
      });
    });

    const sortedByAccuracy = [...categoryStats].sort((a, b) => b.correctPercentage - a.correctPercentage);
    const mostAccurateCategory = sortedByAccuracy[0];
    const leastAccurateCategory = sortedByAccuracy[sortedByAccuracy.length - 1];

    const highestConsensusPick = {
      categoryTitle: mostAccurateCategory?.categoryTitle ?? '',
      nomineeName: mostAccurateCategory?.topVotedNominee.nomineeName ?? '',
      percentage: mostAccurateCategory?.topVotedNominee.percentage ?? 0
    };

    const upsetCategories = categoryStats.filter((c) => c.isUpset);
    let biggestUpset = null;
    if (upsetCategories.length > 0) {
      upsetCategories.sort((a, b) => a.correctPercentage - b.correctPercentage);
      const u = upsetCategories[0];
      const winDist = u.distribution.find((d) => d.isWinner);
      biggestUpset = {
        categoryTitle: u.categoryTitle,
        predictedName: u.topVotedNominee.nomineeName,
        predictedPct: u.topVotedNominee.percentage,
        winnerName: u.winnerName || '',
        winnerPct: winDist ? winDist.percentage : 0
      };
    }

    return {
      totalParticipants: maxCategoryVotes,
      categories: categoryStats,
      mostAccurateCategory,
      leastAccurateCategory,
      highestConsensusPick,
      biggestUpset
    };
  }

  // When there are no real votes recorded yet in the database:
  const categoryStats: CategoryStat[] = edition.categories.map((cat) => {
    const winner = cat.nominees.find((n) => n.winner || cat.winner_id === n.id);
    const distribution: NomineeVoteDist[] = cat.nominees.map((nom) => ({
      nomineeId: nom.id,
      nomineeName: nom.name,
      details: nom.details,
      count: 0,
      percentage: 0,
      isWinner: winner?.id === nom.id
    }));

    return {
      categoryId: cat.id,
      categoryTitle: cat.title,
      totalVotes: 0,
      winnerId: winner?.id,
      winnerName: winner?.name,
      distribution,
      correctCount: 0,
      correctPercentage: 0,
      topVotedNominee: distribution[0] || {
        nomineeId: '',
        nomineeName: 'Nenhum',
        count: 0,
        percentage: 0,
        isWinner: false
      },
      isUpset: false
    };
  });

  return {
    totalParticipants: 0,
    categories: categoryStats,
    mostAccurateCategory: categoryStats[0] || null,
    leastAccurateCategory: categoryStats[0] || null,
    highestConsensusPick: {
      categoryTitle: '',
      nomineeName: '',
      percentage: 0
    },
    biggestUpset: null
  };
}
