import React, { useMemo, useState } from 'react';
import { Heart, ChevronDown, Search } from 'lucide-react';
import { Edition, UserVotes } from '../types';
import { computeCommunityStats, RawVoteDistribution } from '../utils/communityStats';

interface CategoryStatsTableProps { edition: Edition; userVotes: UserVotes; realDistribution?: RawVoteDistribution[] }

export const CategoryStatsTable: React.FC<CategoryStatsTableProps> = ({ edition, userVotes, realDistribution }) => {
  const [search, setSearch] = useState('');
  const stats = useMemo(() => computeCommunityStats(edition, realDistribution), [edition, realDistribution]);
  const categories = stats.categories.filter(c => `${c.categoryTitle} ${c.distribution.map(d => d.nomineeName).join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const consensus = [...stats.categories].filter(c => c.totalVotes > 0).sort((a, b) => b.topVotedNominee.percentage - a.topVotedNominee.percentage)[0];
  return <div className="space-y-4">
    {consensus ? <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
      <p className="text-xs uppercase tracking-wider text-violet-300">Maior consenso</p>
      <h4 className="text-lg font-bold mt-1">{consensus.topVotedNominee.nomineeName}</h4>
      <p className="text-sm text-slate-400 mt-1">{consensus.topVotedNominee.percentage}% das escolhas em {consensus.categoryTitle}</p>
    </div> : <p className="rounded-xl border border-slate-800 p-5 text-sm text-slate-400">Ainda não há escolhas da comunidade disponíveis para esta edição.</p>}
    <div className="relative max-w-md"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input aria-label="Buscar nas escolhas da comunidade" placeholder="Buscar categoria ou jogo..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-violet-400" /></div>
    {categories.map(cat => {
      const pick = cat.distribution.find(d => d.nomineeId === userVotes[cat.categoryId]);
      return <details key={cat.categoryId} className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div><h4 className="font-semibold">{cat.categoryTitle}</h4><p className="text-xs text-slate-400 mt-1">{cat.totalVotes > 0 ? `${cat.topVotedNominee.nomineeName} lidera com ${cat.topVotedNominee.percentage}% · ${cat.totalVotes} escolhas` : 'Sem escolhas públicas ainda'}</p></div>
          <ChevronDown className="w-4 h-4 shrink-0 text-slate-400 group-open:rotate-180" />
        </summary>
        <p className="flex items-center gap-2 text-sm text-violet-300 mt-4"><Heart className="w-4 h-4" />Minha escolha: {pick?.nomineeName ?? 'Ainda não escolhi'}</p>
        <div className="space-y-4 mt-5">{cat.distribution.map(d => <div key={d.nomineeId}>
          <div className="flex justify-between gap-3 text-sm mb-2"><span className="text-slate-200">{d.nomineeName}</span><span className="text-slate-400">{d.count} votos · {d.percentage}%</span></div>
          <div className="h-2 rounded-full bg-slate-800"><div className="h-full rounded-full bg-violet-400" style={{ width: `${d.percentage}%` }} /></div>
        </div>)}</div>
      </details>;
    })}
    {!categories.length && <p className="py-8 text-center text-sm text-slate-400">Nenhuma categoria encontrada.</p>}
  </div>;
};
