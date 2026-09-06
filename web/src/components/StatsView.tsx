import React, { useMemo } from 'react';
import { Trophy, Award, Gamepad2 } from 'lucide-react';
import { Edition, UserVotes } from '../types';
import { ScoreSummary } from './ScoreSummary';
import { CategoryStatsTable } from './CategoryStatsTable';
import { useCommunityVotes } from '../hooks/useCommunityVotes';

interface StatsViewProps {
  edition: Edition;
  votes: UserVotes;
  totalVoted: number;
  score: {
    correct: number;
    evaluated: number;
    total: number;
    percentage: number;
  };
}

export const StatsView: React.FC<StatsViewProps> = ({
  edition,
  votes,
  totalVoted,
  score
}) => {
  const { distribution } = useCommunityVotes(edition.year, edition.status);

  // Aggregate wins per game
  const gamesLeaderboard = useMemo(() => {
    const tally: Record<string, { name: string; details?: string | null; wins: number; categories: string[] }> = {};

    edition.categories.forEach((cat) => {
      const winner = cat.nominees.find((n) => n.winner || cat.winner_id === n.id);
      if (winner) {
        if (!tally[winner.id]) {
          tally[winner.id] = {
            name: winner.name,
            details: winner.details,
            wins: 0,
            categories: []
          };
        }
        tally[winner.id].wins += 1;
        tally[winner.id].categories.push(cat.title);
      }
    });

    return Object.values(tally).sort((a, b) => b.wins - a.wins);
  }, [edition]);

  const hasWinners = edition.categories.some((c) => c.winner_id);

  return (
    <div className="space-y-8">
      {/* 1. Score Summary Banner */}
      <ScoreSummary score={score} totalVoted={totalVoted} />

      {!hasWinners ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
          <Trophy className="w-12 h-12 text-amber-500/50 mx-auto mb-4" />
          <h3 className="font-cinzel text-xl font-bold text-slate-200">
            A premiação de {edition.year} ainda não ocorreu!
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">
            Os vencedores oficiais e as estatísticas da cerimônia serão liberados assim que o evento for ao ar.
            Aproveite para preencher seus palpites na aba "Meu Bolão"!
          </p>
        </div>
      ) : (
        <>
          {/* 2. Estatísticas Comunitárias & Tabela de Chutes por Categoria */}
          <CategoryStatsTable edition={edition} userVotes={votes} realDistribution={distribution} />

          {/* 3. Top Winning Games Leaderboard */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                  Jogos Mais Premiados de {edition.year}
                </h3>
                <p className="text-xs text-slate-400">
                  Ranking dos títulos que mais levaram estatuetas para casa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamesLeaderboard.slice(0, 9).map((game, idx) => (
                <div
                  key={game.name}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0 ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30' :
                      idx === 1 ? 'bg-slate-300 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 line-clamp-1">
                        {game.name}
                      </h4>
                      {game.details && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {game.details}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1">
                        {game.categories.slice(0, 2).join(', ')}
                        {game.categories.length > 2 && ` +${game.categories.length - 2}`}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 shrink-0">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    {game.wins} {game.wins === 1 ? 'prêmio' : 'prêmios'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. List of Official Winners per Category */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-white">
                  Lista Completa de Vencedores ({edition.categories.length} Categorias)
                </h3>
                <p className="text-xs text-slate-400">
                  Veja quem levou o troféu e se você acertou cada categoria
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {edition.categories.map((cat) => {
                const winner = cat.nominees.find((n) => n.winner || cat.winner_id === n.id);
                const userPickId = votes[cat.id];
                const userPick = cat.nominees.find((n) => n.id === userPickId);
                const isCorrect = userPickId && winner && userPickId === winner.id;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                        {cat.title}
                      </span>
                      <span className="text-sm font-bold text-amber-300">
                        🏆 {winner ? winner.name : 'A anunciar'}
                      </span>
                      {winner?.details && (
                        <span className="text-xs text-slate-500 block">
                          {winner.details}
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      {userPick ? (
                        isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            ✓ Você acertou
                          </span>
                        ) : (
                          <div>
                            <span className="text-xs font-medium text-rose-400 block">
                              ✗ Você votou:
                            </span>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[140px] block">
                              {userPick.name}
                            </span>
                          </div>
                        )
                      ) : (
                        <span className="text-xs text-slate-600">
                          Não votou
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
