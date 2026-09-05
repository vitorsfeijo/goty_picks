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

// Simple seeded pseudo-random generator for consistent, realistic community distributions
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function computeCommunityStats(edition: Edition): CommunityYearStats {
  const totalParticipants = 1420 + (edition.year % 100) * 15;
  const categoryStats: CategoryStat[] = [];

  edition.categories.forEach((cat, catIdx) => {
    const winner = cat.nominees.find((n) => n.winner || cat.winner_id === n.id);
    const nomineeCount = cat.nominees.length;

    // Seed based on year and category title
    let seed = edition.year * 1000 + catIdx * 37;
    for (let i = 0; i < cat.title.length; i++) {
      seed += cat.title.charCodeAt(i);
    }

    // Determine if this category was an "upset" (e.g. 25% of categories are upsets where crowd picked wrong)
    const isUpsetCategory = (seed % 4 === 0) && nomineeCount > 2;

    // Generate weights for each nominee
    const weights: number[] = [];
    cat.nominees.forEach((nom, nIdx) => {
      const isWinner = winner?.id === nom.id;
      let weight = 10 + Math.floor(pseudoRandom(seed + nIdx * 13) * 40);

      if (isWinner) {
        // If not an upset, winner gets a significant community boost
        weight += isUpsetCategory ? 15 : 65;
      } else if (isUpsetCategory && nIdx === 1) {
        // In an upset, another favorite gets the highest boost
        weight += 85;
      }
      weights.push(weight);
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);

    // Calculate votes per nominee
    let assignedVotes = 0;
    const distribution: NomineeVoteDist[] = cat.nominees.map((nom, nIdx) => {
      const isWinner = winner?.id === nom.id;
      const count = Math.round((weights[nIdx] / totalWeight) * totalParticipants);
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

    // Recalculate exact percentages
    distribution.forEach((d) => {
      d.percentage = Math.round((d.count / assignedVotes) * 100);
    });

    // Sort distribution from highest votes to lowest
    distribution.sort((a, b) => b.count - a.count);

    const topVoted = distribution[0];
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

  // Sort to find most accurate and least accurate (Zebra)
  const sortedByAccuracy = [...categoryStats].sort((a, b) => b.correctPercentage - a.correctPercentage);
  const mostAccurateCategory = sortedByAccuracy[0];
  const leastAccurateCategory = sortedByAccuracy[sortedByAccuracy.length - 1];

  // Highest consensus pick
  const highestConsensusPick = {
    categoryTitle: mostAccurateCategory.categoryTitle,
    nomineeName: mostAccurateCategory.topVotedNominee.nomineeName,
    percentage: mostAccurateCategory.topVotedNominee.percentage
  };

  // Find biggest upset
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
    totalParticipants,
    categories: categoryStats,
    mostAccurateCategory,
    leastAccurateCategory,
    highestConsensusPick,
    biggestUpset
  };
}
