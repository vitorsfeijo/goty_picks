import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { EditionStatus } from '../types';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  correctPicks: number;
  totalPicks: number;
  accuracy: number;
}

export function useLeaderboard(
  year: number | undefined,
  status: EditionStatus | undefined,
  currentUserId?: string | null
) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!year || status !== 'concluded' || !supabase) {
      setLeaderboard([]);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void supabase
      .rpc('get_leaderboard', { p_year: year })
      .then(({ data, error: rpcError }) => {
        if (!active) return;
        setLoading(false);

        if (rpcError) {
          // If RPC fails (e.g. not concluded in database yet or no permissions)
          console.warn('Could not fetch leaderboard:', rpcError.message);
          setError('A classificação geral ainda não está disponível para esta edição.');
          setLeaderboard([]);
          return;
        }

        const formatted: LeaderboardEntry[] = (data ?? []).map((row) => ({
          rank: Number(row.rank),
          userId: row.user_id,
          displayName: row.display_name || 'Jogador Anônimo',
          avatarUrl: row.avatar_url,
          correctPicks: Number(row.correct_picks),
          totalPicks: Number(row.total_picks),
          accuracy: Number(row.accuracy)
        }));

        setLeaderboard(formatted);
      });

    return () => {
      active = false;
    };
  }, [year, status]);

  const userEntry = currentUserId
    ? leaderboard.find((entry) => entry.userId === currentUserId) ?? null
    : null;

  return {
    leaderboard,
    loading,
    error,
    userEntry
  };
}
