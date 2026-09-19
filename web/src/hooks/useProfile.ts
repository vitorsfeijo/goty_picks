import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) {
      setProfile(null);
      return;
    }

    let active = true;
    setLoading(true);
    void supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        setLoading(false);
        if (fetchError) {
          console.warn('Could not fetch profile:', fetchError.message);
          return;
        }
        if (data) {
          setProfile({
            id: data.id,
            displayName: data.display_name,
            avatarUrl: data.avatar_url
          });
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const updateDisplayName = async (newDisplayName: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = newDisplayName.trim();
    if (!trimmed || trimmed.length > 80) {
      return { success: false, error: 'O nome deve ter entre 1 e 80 caracteres.' };
    }
    if (!user || !supabase) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return { success: false, error: updateError.message };
    }

    setProfile((prev) => (prev ? { ...prev, displayName: trimmed } : null));
    return { success: true };
  };

  return { profile, loading, saving, error, updateDisplayName };
}
