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

    const localVotes = readLocalBallot(storageKey);

    void supabase.from('votes').select('category_id, nominee_id').eq('year', year).eq('user_id', user.id)
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          setSyncing(false);
          setSyncError('Não foi possível carregar seus palpites salvos.');
          setVotes(localVotes);
          return;
        }

        const cloudVotes: UserVotes = Object.fromEntries(
          (data ?? []).map((vote) => [vote.category_id, vote.nominee_id])
        );

        // Merge: local votes that are missing in cloud get preserved and uploaded
        const merged: UserVotes = { ...cloudVotes };
        const pendingUpload: { user_id: string; year: number; category_id: string; nominee_id: string }[] = [];

        for (const [catId, nomId] of Object.entries(localVotes)) {
          if (!merged[catId]) {
            merged[catId] = nomId;
            if (edition?.status === 'open' || edition?.status === 'concluded') {
              pendingUpload.push({
                user_id: user.id,
                year,
                category_id: catId,
                nominee_id: nomId
              });
            }
          }
        }

        if (pendingUpload.length > 0 && supabase) {
          const { error: upsertError } = await supabase.from('votes').upsert(
            pendingUpload,
            { onConflict: 'user_id,year,category_id' }
          );
          if (upsertError) {
            console.warn('Could not sync pending local votes to cloud:', upsertError.message);
          }
        }

        if (!active) return;
        setSyncing(false);
        setVotes(merged);

        // Keep local cache in sync with merged votes
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch (e) {
            console.warn('Could not update localStorage cache:', e);
          }
        }
      });

    return () => { active = false; };
  }, [year, storageKey, user, edition?.status]);

  const setVote = async (categoryId: string, nomineeId: string) => {
    if (!year || !storageKey) return;
    if (edition?.status === 'locked') {
      setSyncError('A votação desta edição está congelada durante a transmissão da cerimônia.');
      return;
    }
    const previous = votes;
    const updated = { ...previous, [categoryId]: nomineeId };
    setVotes(updated);

    try { localStorage.setItem(storageKey, JSON.stringify(updated)); }
    catch (error) { console.warn('Could not save votes to localStorage:', error); }

    if (!user || !supabase) {
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
      try { localStorage.setItem(storageKey, JSON.stringify(previous)); }
      catch {}
      setSyncError(error.message.includes('row-level security') ? 'Este bolão não está aceitando palpites no momento.' : 'Não foi possível salvar seu palpite.');
    }
  };

  const clearVotes = async () => {
    if (!year || !storageKey) return;
    if (edition?.status === 'locked') {
      setSyncError('A votação desta edição está congelada durante a transmissão da cerimônia.');
      return;
    }
    const previous = votes;
    setVotes({});
    try { localStorage.removeItem(storageKey); }
    catch (error) { console.warn('Could not clear votes from localStorage:', error); }

    if (!user || !supabase) {
      return;
    }

    setSyncing(true);
    setSyncError(null);
    const { error } = await supabase.from('votes').delete().eq('year', year).eq('user_id', user.id);
    setSyncing(false);
    if (error) {
      setVotes(previous);
      try { localStorage.setItem(storageKey, JSON.stringify(previous)); }
      catch {}
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
