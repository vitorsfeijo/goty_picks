import React, { useMemo } from 'react';
import { Award, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Category } from '../types';
import { NomineeItem } from './NomineeItem';

interface CategoryCardProps {
  category: Category;
  selectedNomineeId?: string;
  onVote: (categoryId: string, nomineeId: string) => void;
  isConcluded: boolean;
  revealAll?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  selectedNomineeId,
  onVote,
  isConcluded,
  revealAll = false
}) => {
  const hasVote = Boolean(selectedNomineeId);

  // The official winner is only shown if the user voted in this category OR if revealAll is true
  const showWinner = isConcluded && (hasVote || revealAll);

  const userGuessedCorrectly = showWinner && hasVote && selectedNomineeId === category.winner_id;
  const userGuessedWrong = showWinner && hasVote && selectedNomineeId !== category.winner_id;

  // Sort nominees alphabetically by name (A-Z)
  const sortedNominees = useMemo(() => {
    return [...category.nominees].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [category.nominees]);

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 sm:p-6 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      {/* Category Header */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-slate-100 tracking-wide">
              {category.title}
            </h3>
            <p className="text-xs text-slate-400">
              {category.nominees.length} indicados • Ordem alfabética
            </p>
          </div>
        </div>

        {/* Category Vote Status Indicator */}
        <div className="shrink-0">
          {showWinner ? (
            userGuessedCorrectly ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5" />
                Acertou!
              </span>
            ) : userGuessedWrong ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                Errou
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                Sem palpite
              </span>
            )
          ) : isConcluded && !hasVote ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
              Escolha para ver o vencedor
            </span>
          ) : hasVote ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <CheckCircle className="w-3.5 h-3.5" />
              Preenchido
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
              Pendente
            </span>
          )}
        </div>
      </div>

      {/* Nominees Grid (Alphabetical Order A-Z) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {sortedNominees.map((nominee) => (
          <NomineeItem
            key={nominee.id}
            nominee={nominee}
            isSelected={selectedNomineeId === nominee.id}
            onSelect={() => onVote(category.id, nominee.id)}
            isConcluded={isConcluded}
            isOfficialWinner={nominee.winner || category.winner_id === nominee.id}
            userVotedThis={selectedNomineeId === nominee.id}
            showWinner={showWinner}
          />
        ))}
      </div>
    </div>
  );
};
