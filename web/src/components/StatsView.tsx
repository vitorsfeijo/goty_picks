import React from 'react';
import { Users } from 'lucide-react';
import { Edition, UserVotes } from '../types';
import { CategoryStatsTable } from './CategoryStatsTable';
import { useCommunityVotes } from '../hooks/useCommunityVotes';

interface StatsViewProps { edition: Edition; votes: UserVotes }

export const StatsView: React.FC<StatsViewProps> = ({ edition, votes }) => {
  const { distribution, loading } = useCommunityVotes(edition.year, edition.status);
  return <div className="space-y-6">
    <div className="flex items-center gap-2 text-slate-300"><Users className="w-5 h-5 text-violet-400" /><h3 className="text-lg font-semibold">O olhar da comunidade</h3></div>
    {loading && <p role="status" className="text-sm text-slate-400">Carregando escolhas da comunidade...</p>}
    {edition.status === 'open' && <p className="rounded-xl bg-slate-900 p-4 text-sm text-slate-400">As escolhas da comunidade ficam disponíveis quando a votação desta edição for encerrada. Até lá, monte a sua seleção.</p>}
    <CategoryStatsTable edition={edition} userVotes={votes} realDistribution={distribution} />
  </div>;
};
