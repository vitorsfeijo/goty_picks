import { useMemo, useState } from 'react';
import { Heart, Trophy, Loader2, Eye, Search } from 'lucide-react';
import type { EditionSummary } from '../types';
import { useGotyHistory } from '../hooks/useGotyHistory';
import { computeGotyStats } from '../utils/gotyStats';

export function GotyStatsView({ editions, onChooseYear }: { editions: EditionSummary[]; onChooseYear: (year: number) => void }) {
  const { data, loading, failedYears, retry } = useGotyHistory(editions);
  const stats = useMemo(() => computeGotyStats(data), [data]);
  const [showOfficial, setShowOfficial] = useState(false);
  const [search, setSearch] = useState('');
  if (loading) return <div role="status" className="flex items-center justify-center gap-3 py-24 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" />Reunindo todas as edições...</div>;
  const years = stats.years.filter(y => `${y.year} ${y.nominees.map(n => n.name).join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const availableYears = stats.years.filter(y => y.available).length;
  return <div className="space-y-8">
    <div>
      <p className="text-xs uppercase tracking-widest text-violet-300 mb-2">Todas as edições · {stats.years.length ? `${stats.years[stats.years.length - 1].year}–${stats.years[0].year}` : 'Histórico'}</p>
      <h1 className="font-cinzel text-3xl sm:text-4xl font-bold">Jogo do Ano</h1>
      <p className="text-sm text-slate-400 mt-3">As escolhas de todos os jogadores, reunidas ao longo dos anos.</p>
    </div>
    {failedYears.length > 0 && <div role="alert" className="rounded-xl border border-amber-500/20 p-4 text-sm text-amber-200">
      {failedYears.length > 0 && <p>Não foi possível carregar as edições: {failedYears.join(', ')}. O resumo inclui apenas as edições carregadas.</p>}
      <button onClick={retry} className="mt-2 underline">Tentar novamente</button>
    </div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[[stats.totalVotes, 'votos da comunidade'], [availableYears, 'edições com dados da comunidade']].map(([value, label]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><p className="text-2xl font-bold text-violet-300">{value}</p><p className="text-xs text-slate-400 mt-1">{label}</p></div>)}
    </div>
    <section className="rounded-2xl border border-slate-800 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Heart className="w-5 h-5 text-violet-400" />Mais escolhidos de todos os anos</h2>
      <p className="text-xs text-slate-400 mt-2">Soma dos votos por jogo em {availableYears} de {stats.years.length} edições. São votos por edição, não pessoas únicas.</p>
      {stats.favorites.length ? <div className="mt-6 space-y-5">{stats.favorites.slice(0, 10).map(game => <div key={game.name}>
        <div className="flex justify-between gap-3 text-sm"><span>{game.name} <span className="text-xs text-slate-500">· {game.years.join(', ')}</span></span><span className="text-violet-300 shrink-0">{game.count} votos</span></div>
        <div className="h-2 bg-slate-800 rounded-full mt-2"><div className="h-full rounded-full bg-violet-400" style={{ width: `${game.count / stats.favorites[0].count * 100}%` }} /></div>
      </div>)}</div> : <p className="text-sm text-slate-400 mt-5">Ainda não há votos da comunidade disponíveis. As estatísticas usam as escolhas sincronizadas de todos os jogadores.</p>}
      {availableYears < stats.years.length && <button onClick={retry} className="mt-4 text-xs text-violet-300 underline">Atualizar dados da comunidade</button>}
    </section>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h2 className="text-xl font-semibold">Ano a ano</h2>
      <div className="flex flex-wrap gap-3">
        <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" /><input aria-label="Buscar ano ou jogo" placeholder="Buscar ano ou jogo..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-56 rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2.5 text-sm" /></div>
        <button aria-pressed={showOfficial} onClick={() => setShowOfficial(v => !v)} className="flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs text-amber-300"><Eye className="w-4 h-4" />{showOfficial ? 'Ocultar vencedores oficiais' : 'Mostrar vencedores oficiais'}</button>
      </div>
    </div>
    <div className="grid lg:grid-cols-2 gap-4">{years.map(year => <section key={year.year} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex justify-between gap-3 items-center"><h3 className="font-cinzel text-xl font-bold">{year.year}</h3><button onClick={() => onChooseYear(year.year)} className="text-xs text-violet-300 hover:underline">Ver edição →</button></div>
      <p className="text-xs text-slate-400 mt-2">{year.available ? `${year.totalVotes} votos nesta edição` : 'Dados da comunidade indisponíveis'}</p>
      {showOfficial && <p className="flex items-center gap-2 text-xs text-amber-300 mt-2"><Trophy className="w-4 h-4 shrink-0" />Vencedor oficial: {year.winner?.name ?? 'Não anunciado'}</p>}
      <div className="mt-5 space-y-3">{year.nominees.map(n => <div key={n.id}>
        <div className="flex justify-between gap-3 text-xs"><span className="text-slate-300">{n.name}</span><span className="text-slate-500 shrink-0">{year.available ? `${n.count} · ${n.percentage}%` : '—'}</span></div>
        {year.available && <div className="h-1.5 bg-slate-800 rounded-full mt-1.5"><div className="h-full bg-violet-400 rounded-full" style={{ width: `${n.percentage}%` }} /></div>}
      </div>)}</div>
    </section>)}</div>
    {!years.length && <p className="text-center text-slate-400 py-8">Nenhuma edição encontrada.</p>}
  </div>;
}
