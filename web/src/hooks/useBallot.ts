import { useState, useEffect } from 'react';
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

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'local';

export function useBallot(edition: Edition | null, user: User | null) {
  const year = edition?.year;
  const storageKey = year ? `goty_picks_ballot_${year}` : null;
  const [votes, setVotes] = useState<UserVotes>({});
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(user ? 'idle' : 'local');

  useEffect(() => {
    if (!year) {
      setVotes({});
      setSaveStatus(user ? 'idle' : 'local');
      return;
    }
    if (!user || !supabase) {
      setVotes(readLocalBallot(storageKey));
      setSyncError(null);
      setSaveStatus('local');
      return;
    }

    let active = true;
    setSyncing(true);
    setSyncError(null);
    setSaveStatus('saving');

    const localVotes = readLocalBallot(storageKey);

    void supabase.from('votes').select('category_id, nominee_id').eq('year', year).eq('user_id', user.id)
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          setSyncing(false);
          setSyncError('Não foi possível carregar seus escolhas salvos.');
          setVotes(localVotes);
          setSaveStatus('error');
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
            if (edition?.status !== 'locked') {
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
        setSaveStatus('saved');

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
      setSaveStatus('local');
      return;
    }

    setSyncing(true);
    setSyncError(null);
    setSaveStatus('saving');
    const { error } = await supabase.from('votes').upsert(
      { user_id: user.id, year, category_id: categoryId, nominee_id: nomineeId },
      { onConflict: 'user_id,year,category_id' }
    );
    setSyncing(false);
    if (error) {
      setVotes(previous);
      try { localStorage.setItem(storageKey, JSON.stringify(previous)); }
      catch {}
      setSyncError(error.message.includes('row-level security') ? 'Esta edição não está aceitando escolhas no momento.' : 'Não foi possível salvar seu escolha.');
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
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
      setSaveStatus('local');
      return;
    }

    setSyncing(true);
    setSyncError(null);
    setSaveStatus('saving');
    const { error } = await supabase.from('votes').delete().eq('year', year).eq('user_id', user.id);
    setSyncing(false);
    if (error) {
      setVotes(previous);
      try { localStorage.setItem(storageKey, JSON.stringify(previous)); }
      catch {}
      setSyncError('Não foi possível limpar seus escolhas.');
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
    }
  };

  const totalCategories = edition?.categories.length || 0;
  const totalVoted = Object.keys(votes).length;
  const progressPercentage = totalCategories > 0 ? Math.round((totalVoted / totalCategories) * 100) : 0;

  return { votes, setVote, clearVotes, totalVoted, totalCategories, progressPercentage, syncing, syncError, saveStatus };
}
