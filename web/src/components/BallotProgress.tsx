import React, { useState } from 'react';
import { Share2, Trash2, Check, Sparkles } from 'lucide-react';
import { Edition, UserVotes } from '../types';

interface BallotProgressProps {
  edition: Edition;
  votes: UserVotes;
  totalVoted: number;
  totalCategories: number;
  progressPercentage: number;
  onClear: () => void;
}

export const BallotProgress: React.FC<BallotProgressProps> = ({
  edition,
  votes,
  totalVoted,
  totalCategories,
  progressPercentage,
  onClear
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    let text = `🏆 Meus Palpites do The Game Awards ${edition.year} no GOTY Picks!\n`;
    text += `Progresso: ${totalVoted}/${totalCategories} categorias preenchidas\n\n`;

    edition.categories.forEach((cat) => {
      const nomineeId = votes[cat.id];
      if (nomineeId) {
        const nom = cat.nominees.find((n) => n.id === nomineeId);
        if (nom) {
          text += `🎮 ${cat.title}: ${nom.name}\n`;
        }
      }
    });

    text += `\nFaça seus palpites também no GOTY Picks!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Progress Text & Bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Progresso do seu Bolão
            </span>
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
            onClick={handleShare}
            disabled={totalVoted === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-all shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-black" />
                Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-black" />
                Compartilhar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Tem certeza que deseja limpar todos os seus votos deste ano?')) {
                onClear();
              }
            }}
            disabled={totalVoted === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border border-slate-700/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Limpar votos deste ano"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
