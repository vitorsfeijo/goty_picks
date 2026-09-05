import { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Edition, UserVotes } from '../types';

function readLocalBallot(storageKey: string | null): UserVotes {
  if (!storageKey) return {};
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn('Could not read votes from localStorage:', error);
    return {};
  }
}

export function useBallot(edition: Edition | null, user: User | null) {
  const year = edition?.year;
  const storageKey = year ? `goty_picks_ballot_${year}` : null;
  const [votes, setVotes] = useState<UserVotes>({});
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!year) {
      setVotes({});
      return;
    }
    if (!user || !supabase) {
      setVotes(readLocalBallot(storageKey));
      setSyncError(null);
      return;
    }

    let active = true;
    setSyncing(true);
    setSyncError(null);
    void supabase.from('votes').select('category_id, nominee_id').eq('year', year).eq('user_id', user.id)
      .then(({ data, error }) => {
        if (!active) return;
        setSyncing(false);
        if (error) {
          setSyncError('Não foi possível carregar seus palpites salvos.');
          setVotes(readLocalBallot(storageKey));
          return;
        }
        setVotes(Object.fromEntries((data ?? []).map((vote) => [vote.category_id, vote.nominee_id])));
      });

    return () => { active = false; };
  }, [year, storageKey, user]);

  const setVote = async (categoryId: string, nomineeId: string) => {
    if (!year || !storageKey) return;
    if (edition?.status !== 'open') {
      setSyncError('Este bolão está fechado para alterações.');
      return;
    }
    const previous = votes;
    const updated = { ...previous, [categoryId]: nomineeId };
    setVotes(updated);

    if (!user || !supabase) {
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); }
      catch (error) { console.warn('Could not save votes to localStorage:', error); }
      return;
    }

    setSyncing(true);
    setSyncError(null);
    const { error } = await supabase.from('votes').upsert(
      { user_id: user.id, year, category_id: categoryId, nominee_id: nomineeId },
      { onConflict: 'user_id,year,category_id' }
    );
    setSyncing(false);
    if (error) {
      setVotes(previous);
      setSyncError(error.message.includes('row-level security') ? 'Este bolão está fechado para alterações.' : 'Não foi possível salvar seu palpite.');
    }
  };

  const clearVotes = async () => {
    if (!year || !storageKey) return;
    if (edition?.status !== 'open') {
      setSyncError('Este bolão está fechado para alterações.');
      return;
    }
    const previous = votes;
    setVotes({});
    if (!user || !supabase) {
      try { localStorage.removeItem(storageKey); }
      catch (error) { console.warn('Could not clear votes from localStorage:', error); }
      return;
    }

    setSyncing(true);
    setSyncError(null);
    const { error } = await supabase.from('votes').delete().eq('year', year).eq('user_id', user.id);
    setSyncing(false);
    if (error) {
      setVotes(previous);
      setSyncError('Não foi possível limpar seus palpites.');
    }
  };

  const totalCategories = edition?.categories.length || 0;
  const totalVoted = Object.keys(votes).length;
  const progressPercentage = totalCategories > 0 ? Math.round((totalVoted / totalCategories) * 100) : 0;
  const score = useMemo(() => {
    if (!edition?.categories) return { correct: 0, evaluated: 0, total: 0, percentage: 0 };
    let correct = 0;
    let evaluated = 0;
    for (const category of edition.categories) {
      if (category.winner_id) {
        evaluated++;
        if (votes[category.id] === category.winner_id) correct++;
      }
    }
    return { correct, evaluated, total: totalCategories, percentage: evaluated > 0 ? Math.round((correct / evaluated) * 100) : 0 };
  }, [edition, votes, totalCategories]);

  return { votes, setVote, clearVotes, totalVoted, totalCategories, progressPercentage, score, syncing, syncError };
}
