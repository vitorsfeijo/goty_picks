import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { RawVoteDistribution } from '../utils/communityStats';
import type { EditionStatus } from '../types';

export function useCommunityVotes(year: number | undefined, status: EditionStatus | undefined) {
  const [distribution, setDistribution] = useState<RawVoteDistribution[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Community distribution is available in DB when the edition is locked or concluded
    if (!year || !supabase || (status !== 'locked' && status !== 'concluded')) {
      setDistribution(undefined);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void supabase
      .rpc('get_community_votes_distribution', { p_year: year })
      .then(({ data, error }) => {
        if (!active) return;
        setLoading(false);
        if (error) {
          console.warn('Could not fetch community votes distribution:', error.message);
          setDistribution(undefined);
          return;
        }
        if (data && data.length > 0) {
          setDistribution(
            data.map((row) => ({
              category_id: row.category_id,
              nominee_id: row.nominee_id,
              total_votes: Number(row.total_votes)
            }))
          );
        } else {
          setDistribution(undefined);
        }
      });

    return () => {
      active = false;
    };
  }, [year, status]);

  return { distribution, loading };
}
