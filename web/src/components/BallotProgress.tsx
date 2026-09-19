import React, { useState } from 'react';
import { Share2, Trash2, Sparkles, HardDrive, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Edition, UserVotes } from '../types';
import type { SaveStatus } from '../hooks/useBallot';
import { ShareModal } from './ShareModal';

interface BallotProgressProps {
  edition: Edition;
  votes: UserVotes;
  totalVoted: number;
  totalCategories: number;
  progressPercentage: number;
  onClear: () => void;
  saveStatus?: SaveStatus;
  displayName?: string;
  score?: {
    correct: number;
    evaluated: number;
    percentage: number;
  };
}

export const BallotProgress: React.FC<BallotProgressProps> = ({
  edition,
  votes,
  totalVoted,
  totalCategories,
  progressPercentage,
  onClear,
  saveStatus = 'local',
  displayName = 'Jogador',
  score
}) => {
  const [shareOpen, setShareOpen] = useState(false);

  const renderSaveBadge = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            Salvando na nuvem...
          </span>
        );
      case 'saved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Palpites sincronizados com seu login na nuvem">
            <CheckCircle2 className="w-3 h-3" />
            Salvo na nuvem
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20" title="Houve um erro ao sincronizar com a nuvem">
            <AlertCircle className="w-3 h-3" />
            Falha ao salvar
          </span>
        );
      case 'local':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700" title="Salvo no navegador. Entre para sincronizar entre dispositivos e figurar no ranking!">
            <HardDrive className="w-3 h-3" />
            Salvo no navegador
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Progress Text & Bar */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Progresso do seu Bolão
                </span>
                {renderSaveBadge()}
              </div>
              <span className="text-xs font-bold text-amber-400">
                {totalVoted} / {totalCategories} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 rounded-full shadow-lg shadow-amber-500/50"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              disabled={totalVoted === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-black" />
              Compartilhar
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todos os seus votos deste ano?')) {
                  onClear();
                }
              }}
              disabled={totalVoted === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border border-slate-700/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Limpar votos deste ano"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        edition={edition}
        votes={votes}
        displayName={displayName}
        totalVoted={totalVoted}
        totalCategories={totalCategories}
        score={score}
      />
    </>
  );
};
