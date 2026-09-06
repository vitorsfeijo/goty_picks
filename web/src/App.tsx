import React, { useState, useMemo } from 'react';
import { useEditions } from './hooks/useEditions';
import { useBallot } from './hooks/useBallot';
import { useAuth } from './hooks/useAuth';
import { useEditionLifecycle } from './hooks/useEditionLifecycle';
import { Navbar } from './components/Navbar';
import { AuthButton } from './components/AuthButton';
import { CategoryCard } from './components/CategoryCard';
import { BallotProgress } from './components/BallotProgress';
import { StatsView } from './components/StatsView';
import { LeaderboardView } from './components/LeaderboardView';
import { Search, Loader2, Trophy, Flame, Eye, EyeOff } from 'lucide-react';

function getInitialTab(): 'ballot' | 'stats' | 'leaderboard' {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab === 'stats' || tab === 'leaderboard' || tab === 'ballot') {
    return tab;
  }
  return 'ballot';
}

export const App: React.FC = () => {
  const {
    editions,
    selectedYear,
    setSelectedYear,
    currentEdition,
    loading,
    error
  } = useEditions();

  const { configured, loading: authLoading, user, sendMagicLink, signOut } = useAuth();
  const databaseStatus = useEditionLifecycle(currentEdition?.year, currentEdition?.status);
  const activeEdition = currentEdition && databaseStatus
    ? { ...currentEdition, status: databaseStatus }
    : currentEdition;

  const {
    votes,
    setVote,
    clearVotes,
    totalVoted,
    totalCategories,
    progressPercentage,
    score,
    syncing,
    syncError
  } = useBallot(activeEdition, user);

  const [activeTab, setActiveTab] = useState<'ballot' | 'stats' | 'leaderboard'>(getInitialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealAllSpoilers, setRevealAllSpoilers] = useState(false);

  // Sync year and tab in URL
  React.useEffect(() => {
    if (!selectedYear) return;
    const params = new URLSearchParams(window.location.search);
    params.set('year', String(selectedYear));
    params.set('tab', activeTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedYear, activeTab]);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!currentEdition?.categories) return [];
    if (!searchQuery.trim()) return currentEdition.categories;
    const q = searchQuery.toLowerCase();
    return currentEdition.categories.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.nominees.some((nom) => nom.name.toLowerCase().includes(q))
    );
  }, [currentEdition, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        editions={editions}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalVoted={totalVoted}
        totalCategories={totalCategories}
        status={activeEdition?.status}
        currentYear={editions[0]?.year}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-sm font-medium">
              Carregando dados da edição {selectedYear}...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/30 border border-rose-500/40 rounded-3xl p-8 text-center max-w-md mx-auto my-16">
            <p className="text-rose-300 font-semibold mb-2">Erro ao carregar dados</p>
            <p className="text-slate-400 text-xs mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        ) : currentEdition ? (
          <div>
            {/* Hero Header */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                The Game Awards {currentEdition.year}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-cinzel tracking-tight">
                {currentEdition.title}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-2">
                {activeEdition?.status === 'locked'
                  ? 'A cerimônia está acontecendo agora! Votação congelada.'
                  : activeEdition?.status === 'concluded' && activeEdition.year < 2026
                  ? `Bolão Retrospectivo: escolha seus favoritos de ${activeEdition.year}!`
                  : activeEdition?.status === 'concluded'
                  ? 'A cerimônia já aconteceu! Confira seus acertos comparados aos vencedores oficiais.'
                  : 'Faça suas escolhas para cada uma das categorias e salve seus palpites.'}
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                <AuthButton
                  configured={configured}
                  loading={authLoading}
                  email={user?.email}
                  onSendMagicLink={sendMagicLink}
                  onSignOut={signOut}
                />
                {configured && !user && (
                  <p className="text-xs text-slate-500">Entre para sincronizar seus palpites entre dispositivos.</p>
                )}
                {user && syncing && <p className="text-xs text-slate-500">Sincronizando palpites...</p>}
                {syncError && <p className="text-xs text-rose-300">{syncError}</p>}
              </div>
            </div>

            {/* TAB: Meu Bolão */}
            {activeTab === 'ballot' && (
              <div className="space-y-6">
                {/* Progress Bar & Actions */}
                <BallotProgress
                  edition={activeEdition!}
                  votes={votes}
                  totalVoted={totalVoted}
                  totalCategories={totalCategories}
                  progressPercentage={progressPercentage}
                  onClear={clearVotes}
                />

                {/* Search Bar & Spoiler Toggle */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto mb-6">
                  <div className="relative w-full sm:flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar por categoria ou jogo..."
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-all"
                    />
                  </div>

                  {activeEdition?.status === 'concluded' && (
                    <button
                      type="button"
                      onClick={() => setRevealAllSpoilers(!revealAllSpoilers)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm"
                    >
                      {revealAllSpoilers ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                          Modo Anti-Spoiler (Ocultar Vencedores)
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          Revelar Todos os Vencedores
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Categories List */}
                <div className="space-y-6">
                  {filteredCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      selectedNomineeId={votes[category.id]}
                      onVote={setVote}
                      isConcluded={activeEdition?.status === 'concluded'}
                      revealAll={revealAllSpoilers}
                      isVotingOpen={activeEdition?.status !== 'locked'}
                    />
                  ))}

                  {filteredCategories.length === 0 && (
                    <div className="text-center py-16 text-slate-500 text-sm">
                      Nenhuma categoria encontrada com "{searchQuery}".
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Estatísticas & Vencedores */}
            {activeTab === 'stats' && (
              <StatsView
                edition={activeEdition!}
                votes={votes}
                totalVoted={totalVoted}
                score={score}
              />
            )}

            {/* TAB: Classificação (Leaderboard) */}
            {activeTab === 'leaderboard' && (
              <LeaderboardView
                year={activeEdition!.year}
                status={activeEdition?.status}
                currentUserId={user?.id}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#060910] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-slate-400">GOTY Picks</span>
            <span>— Bolão comunitário do The Game Awards</span>
          </div>
          <div>
            Dados extraídos via Wikipedia • Desenvolvido com Vite & React
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
