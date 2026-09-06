import React, { useState, useMemo } from 'react';
import { Trophy, Search, Users, Sparkles, Loader2, Clock } from 'lucide-react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { EditionStatus } from '../types';

interface LeaderboardViewProps {
  year: number;
  status?: EditionStatus;
  currentUserId?: string | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  year,
  status,
  currentUserId
}) => {
  const { leaderboard, loading, error, userEntry } = useLeaderboard(
    year,
    status,
    currentUserId
  );
  const [search, setSearch] = useState('');

  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter((entry) =>
      entry.displayName.toLowerCase().includes(q)
    );
  }, [leaderboard, search]);

  const topThree = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

  if (status !== 'concluded') {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
        <Clock className="w-12 h-12 text-amber-400/60 mx-auto mb-4 animate-pulse" />
        <h3 className="font-cinzel text-xl font-bold text-slate-200">
          Classificação Geral Indisponível
        </h3>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          O ranking da comunidade para a edição de <strong>{year}</strong> será liberado
          assim que a cerimônia for concluída e todos os vencedores oficiais forem anunciados.
        </p>
        <p className="text-slate-500 text-xs mt-4">
          Enquanto isso, certifique-se de salvar seus palpites na aba "Meu Bolão"!
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 text-sm">Calculando classificação de {year}...</p>
      </div>
    );
  }

  if (error || leaderboard.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="font-cinzel text-xl font-bold text-slate-300">
          Ainda não há palpites sincronizados
        </h3>
        <p className="text-slate-400 text-sm mt-2">
          {error || `Nenhum jogador pontuou no banco de dados para a edição de ${year}.`}
        </p>
        <p className="text-slate-500 text-xs mt-3">
          Participe do próximo bolão autenticando-se com seu e-mail para figurar no ranking!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de Posição do Usuário Logado */}
      {userEntry && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 p-5 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30">
              #{userEntry.rank}
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                Sua Posição no Ranking
              </span>
              <h4 className="text-lg font-bold text-white">
                {userEntry.displayName}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-xs text-slate-400 block">Acertos</span>
              <span className="text-lg font-black text-emerald-400">
                {userEntry.correctPicks} / {userEntry.totalPicks}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div>
              <span className="text-xs text-slate-400 block">Aproveitamento</span>
              <span className="text-lg font-black text-amber-400">
                {userEntry.accuracy}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Podium Top 3 */}
      {topThree.length > 0 && (
        <div>
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pódio dos Melhores Palpiteiros
            </span>
            <h3 className="text-2xl font-extrabold text-white font-cinzel">
              Líderes de {year}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {topThree.map((player, idx) => {
              const medalStyles = [
                {
                  border: 'border-amber-400/60 bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950',
                  badge: 'bg-amber-500 text-black shadow-amber-500/40',
                  label: '🥇 1º Lugar (Campeão)',
                  text: 'text-amber-300'
                },
                {
                  border: 'border-slate-400/50 bg-gradient-to-b from-slate-400/10 via-slate-900 to-slate-950',
                  badge: 'bg-slate-300 text-black',
                  label: '🥈 2º Lugar',
                  text: 'text-slate-300'
                },
                {
                  border: 'border-amber-700/50 bg-gradient-to-b from-amber-700/10 via-slate-900 to-slate-950',
                  badge: 'bg-amber-700 text-white',
                  label: '🥉 3º Lugar',
                  text: 'text-amber-500'
                }
              ][idx] || {
                border: 'border-slate-800 bg-slate-900',
                badge: 'bg-slate-800 text-slate-300',
                label: `#${player.rank}`,
                text: 'text-slate-300'
              };

              return (
                <div
                  key={player.userId}
                  className={`rounded-2xl border p-5 flex flex-col items-center text-center shadow-lg relative ${medalStyles.border}`}
                >
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 mb-3">
                    {medalStyles.label}
                  </span>

                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl mb-3 shadow-md ${medalStyles.badge}`}>
                    #{player.rank}
                  </div>

                  <h4 className="font-bold text-base text-white truncate max-w-[180px]">
                    {player.displayName}
                  </h4>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 w-full flex items-center justify-around text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Acertos</span>
                      <strong className="text-emerald-400 font-bold">
                        {player.correctPicks} / {player.totalPicks}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Acurácia</span>
                      <strong className={`${medalStyles.text} font-bold font-mono`}>
                        {player.accuracy}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela Completa */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-7 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Tabela de Classificação ({leaderboard.length} participantes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ordenado pelo número total de acertos e aproveitamento percentual
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar participante..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-16">Posição</th>
                <th className="py-3 px-3">Jogador</th>
                <th className="py-3 px-3 text-center">Acertos</th>
                <th className="py-3 px-3 text-center">Total Palpites</th>
                <th className="py-3 px-3 text-right">Aproveitamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLeaderboard.map((entry) => {
                const isCurrentUser = currentUserId && entry.userId === currentUserId;

                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-amber-500/10 font-bold border-l-2 border-amber-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                        entry.rank === 1
                          ? 'bg-amber-500 text-black font-black'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-black'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'text-slate-400 bg-slate-800/80'
                      }`}>
                        #{entry.rank}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-semibold">
                          {entry.displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Você
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-emerald-400">
                      {entry.correctPicks}
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-400">
                      {entry.totalPicks}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {entry.accuracy}%
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nenhum participante encontrado para "{search}".
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
