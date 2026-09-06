import React from 'react';
import { Trophy, BarChart3, CheckSquare, Calendar } from 'lucide-react';
import { EditionSummary, EditionStatus } from '../types';

interface NavbarProps {
  editions: EditionSummary[];
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  activeTab: 'ballot' | 'stats' | 'leaderboard';
  onSelectTab: (tab: 'ballot' | 'stats' | 'leaderboard') => void;
  totalVoted: number;
  totalCategories: number;
  status?: EditionStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  editions,
  selectedYear,
  onSelectYear,
  activeTab,
  onSelectTab,
  totalVoted,
  totalCategories,
  status
}) => {
  const getStatusBadge = (s?: EditionStatus) => {
    switch (s) {
      case 'concluded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Concluído
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Encerrado
          </span>
        );
      case 'open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Votação Aberta
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-black font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-slate-100">
                  GOTY <span className="text-amber-400">PICKS</span>
                </span>
                {getStatusBadge(status)}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                O Bolão do The Game Awards
              </p>
            </div>
          </div>

          {/* Year Selector & Progress Pill */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Year Selector Dropdown */}
            <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm">
              <Calendar className="w-4 h-4 text-amber-400 mr-2" />
              <select
                value={selectedYear || ''}
                onChange={(e) => onSelectYear(Number(e.target.value))}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {editions.map((ed) => (
                  <option key={ed.year} value={ed.year} className="bg-slate-900 text-slate-200">
                    TGA {ed.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Voted Counter Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong className="text-amber-400">{totalVoted}</strong> / {totalCategories} votados
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-800/80 space-x-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSelectTab('ballot')}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ballot'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Meu Bolão (Palpites)
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Estatísticas & Vencedores
          </button>

          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Classificação (Leaderboard)
          </button>
        </div>
      </div>
    </header>
  );
};
