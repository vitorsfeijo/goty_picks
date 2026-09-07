import React, { useState, useMemo } from 'react';
import { Target, Zap, Users, Search, Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Edition, UserVotes } from '../types';
import { computeCommunityStats, type RawVoteDistribution } from '../utils/communityStats';

interface CategoryStatsTableProps {
  edition: Edition;
  userVotes: UserVotes;
  realDistribution?: RawVoteDistribution[];
}

export const CategoryStatsTable: React.FC<CategoryStatsTableProps> = ({
  edition,
  userVotes,
  realDistribution
}) => {
  const [search, setSearch] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const stats = useMemo(
    () => computeCommunityStats(edition, realDistribution),
    [edition, realDistribution]
  );

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return stats.categories;
    const q = search.toLowerCase();
    return stats.categories.filter(
      (c) =>
        c.categoryTitle.toLowerCase().includes(q) ||
        (c.winnerName && c.winnerName.toLowerCase().includes(q)) ||
        c.distribution.some((d) => d.nomineeName.toLowerCase().includes(q))
    );
  }, [stats.categories, search]);

  const toggleExpand = (catId: string) => {
    setExpandedCat((prev) => (prev === catId ? null : catId));
  };

  return (
    <div className="space-y-8">
      {/* Highlight Cards: Consenso vs Zebra */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.totalParticipants > 0 ? (
          <>
            {/* 1. Maior Consenso */}
            {stats.mostAccurateCategory && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Target className="w-3.5 h-3.5" />
                    Mais Acertada
                  </span>
                  <span className="text-xl font-black text-emerald-400">
                    {stats.mostAccurateCategory.correctPercentage}%
                  </span>
                </div>
                <h4 className="font-cinzel font-bold text-slate-100 text-base line-clamp-1">
                  {stats.mostAccurateCategory.categoryTitle}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  🏆 <strong className="text-emerald-300">{stats.mostAccurateCategory.winnerName}</strong> foi o grande favorito da comunidade.
                </p>
              </div>
            )}

            {/* 2. Maior Zebra */}
            {stats.leastAccurateCategory && (
              <div className="rounded-2xl bg-gradient-to-br from-rose-500/15 via-slate-900 to-slate-950 border border-rose-500/30 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Zap className="w-3.5 h-3.5" />
                    Maior Zebra
                  </span>
                  <span className="text-xl font-black text-rose-400">
                    Apenas {stats.leastAccurateCategory.correctPercentage}%
                  </span>
                </div>
                <h4 className="font-cinzel font-bold text-slate-100 text-base line-clamp-1">
                  {stats.leastAccurateCategory.categoryTitle}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  🏆 <strong className="text-rose-300">{stats.leastAccurateCategory.winnerName}</strong> surpreendeu a maioria dos participantes!
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="md:col-span-2 rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-slate-200 text-sm">
                Aguardando votos da comunidade
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Conforme você e outros participantes autenticados salvarem seus palpites, as estatísticas de consenso e zebras aparecerão aqui em tempo real.
              </p>
            </div>
          </div>
        )}

        {/* 3. Participantes & Engajamento */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/30 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users className="w-3.5 h-3.5" />
              Supabase Live
            </span>
            <span className="text-xl font-black text-amber-400">
              {stats.totalParticipants.toLocaleString()}
            </span>
          </div>
          <h4 className="font-cinzel font-bold text-slate-100 text-base">
            Total de Palpites
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Votos sincronizados e computados no banco de dados.
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-sm">
        {/* Table Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Tabela de Chutes e Acertos por Categoria
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare a distribuição dos palpites da comunidade com o seu bolão pessoal
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoria ou jogo..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-all"
            />
          </div>
        </div>

        {/* Table / List View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Vencedor Oficial</th>
                <th className="py-3 px-3">Seu Chute</th>
                <th className="py-3 px-3 min-w-[200px]">Chutes Mais Votados (% Comunidade)</th>
                <th className="py-3 px-3 text-right">Taxa de Acertos</th>
                <th className="py-3 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredCategories.map((cat) => {
                const userPickId = userVotes[cat.categoryId];
                const userPickDist = cat.distribution.find((d) => d.nomineeId === userPickId);
                const isUserCorrect = userPickId && cat.winnerId && userPickId === cat.winnerId;
                const isExpanded = expandedCat === cat.categoryId;

                return (
                  <React.Fragment key={cat.categoryId}>
                    <tr
                      onClick={() => toggleExpand(cat.categoryId)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Categoria */}
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{cat.categoryTitle}</span>
                          {cat.isUpset && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Zebra
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Vencedor Oficial */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          {cat.winnerName || 'A anunciar'}
                        </span>
                      </td>

                      {/* Seu Chute */}
                      <td className="py-3.5 px-3">
                        {userPickDist ? (
                          isUserCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {userPickDist.nomineeName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                              <XCircle className="w-3.5 h-3.5" />
                              {userPickDist.nomineeName}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">Não votou</span>
                        )}
                      </td>

                      {/* Distribuição dos Chutes */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1.5">
                          {cat.distribution.slice(0, 2).map((dist) => (
                            <div key={dist.nomineeId} className="flex items-center gap-2">
                              <div className="w-24 sm:w-32 truncate text-[11px] text-slate-300">
                                {dist.isWinner && '🏆 '}
                                {dist.nomineeName}
                              </div>
                              <div className="flex-1 max-w-[120px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    dist.isWinner
                                      ? 'bg-amber-400'
                                      : 'bg-slate-500'
                                  }`}
                                  style={{ width: `${dist.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 w-8 text-right">
                                {dist.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Taxa de Acertos Global */}
                      <td className="py-3.5 px-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                          cat.correctPercentage >= 60
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : cat.correctPercentage >= 35
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {cat.correctPercentage}%
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {cat.correctCount.toLocaleString()} acertos
                        </span>
                      </td>

                      {/* Expand Chevron */}
                      <td className="py-3.5 px-2 text-center text-slate-500 group-hover:text-slate-300">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </td>
                    </tr>

                    {/* Detalhe expandido de todos os indicados da categoria */}
                    {isExpanded && (
                      <tr className="bg-slate-950/70 border-b border-slate-800/80">
                        <td colSpan={6} className="p-4 sm:p-5">
                          <h5 className="font-bold text-xs text-slate-300 mb-3 uppercase tracking-wider">
                            Todos os Chutes em "{cat.categoryTitle}":
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cat.distribution.map((d) => (
                              <div
                                key={d.nomineeId}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                                  d.isWinner
                                    ? 'border-amber-500/40 bg-amber-950/20'
                                    : 'border-slate-800 bg-slate-900/50'
                                }`}
                              >
                                <div className="truncate">
                                  <span className={`font-semibold text-xs block truncate ${
                                    d.isWinner ? 'text-amber-300 font-bold' : 'text-slate-200'
                                  }`}>
                                    {d.isWinner && '🏆 '}
                                    {d.nomineeName}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {d.count.toLocaleString()} votos
                                  </span>
                                </div>
                                <span className={`text-xs font-mono font-bold ${
                                  d.isWinner ? 'text-amber-400' : 'text-slate-400'
                                }`}>
                                  {d.percentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nenhuma categoria encontrada para "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
