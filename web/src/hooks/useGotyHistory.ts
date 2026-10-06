import { useEffect, useState } from 'react';
import type { Edition, EditionSummary } from '../types';
import { supabase } from '../lib/supabase';
import type { GotyYearInput } from '../utils/gotyStats';

export function useGotyHistory(editions: EditionSummary[]) {
  const [data, setData] = useState<GotyYearInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedYears, setFailedYears] = useState<number[]>([]);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    const summaries = editions.filter(e => e.categories_count > 0);
    if (!editions.length) {
      setLoading(false);
      return () => { active = false; controller.abort(); };
    }
    async function load() {
      const results = await Promise.allSettled(summaries.map(async summary => {
        const response = await fetch(`${import.meta.env.BASE_URL}data/${summary.year}/nominees.json`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(summary.year));
        const edition: Edition = await response.json();
        let distribution: GotyYearInput['distribution'];
        if (supabase && summary.status !== 'open') {
          try {
            const result = await supabase.rpc('get_community_votes_distribution', { p_year: summary.year });
            if (!result.error) distribution = result.data ?? [];
          } catch { /* Unavailable community data is not reported as zero votes. */ }
        }
        return { edition, distribution };
      }));
      if (!active) return;
      setData(results.flatMap(r => r.status === 'fulfilled' ? [r.value] : []));
      setFailedYears(results.flatMap((r, i) => r.status === 'rejected' ? [summaries[i].year] : []));
      setLoading(false);
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [editions, attempt]);
  return { data, loading, failedYears, retry: () => setAttempt(n => n + 1) };
}
