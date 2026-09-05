import { useEffect, useState } from 'react';
import type { EditionStatus } from '../types';
import { supabase } from '../lib/supabase';

function isEditionStatus(value: unknown): value is EditionStatus {
  return value === 'open' || value === 'locked' || value === 'concluded';
}

export function useEditionLifecycle(year: number | undefined, fallback: EditionStatus | undefined) {
  const [status, setStatus] = useState<EditionStatus | undefined>(fallback);

  useEffect(() => {
    setStatus(fallback);
    if (!year || !supabase) return;
    let active = true;
    void supabase.from('editions').select('status').eq('year', year).maybeSingle()
      .then(({ data, error }) => {
        if (!active || error || !isEditionStatus(data?.status)) return;
        setStatus(data.status);
      });
    return () => { active = false; };
  }, [year, fallback]);

  return status ?? fallback;
}
