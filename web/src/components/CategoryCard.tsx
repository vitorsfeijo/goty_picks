import React, { useMemo } from 'react';
import { Award, Heart } from 'lucide-react';
import { Category } from '../types';
import { NomineeItem } from './NomineeItem';

interface CategoryCardProps {
  category: Category;
  selectedNomineeId?: string;
  onVote: (categoryId: string, nomineeId: string) => void;
  isConcluded: boolean;
  revealAll?: boolean;
  isVotingOpen?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, selectedNomineeId, onVote, isConcluded, revealAll = false, isVotingOpen = true }) => {
  const winnerId = category.winner_id || category.nominees.find(n => n.winner)?.id;
  const nominees = useMemo(() => [...category.nominees].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })), [category.nominees]);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="flex items-center gap-2 font-cinzel text-lg font-bold text-slate-100"><Award className="w-5 h-5 text-amber-400" />{category.title}</h3>
          <p className="text-sm text-slate-400 mt-1">Quem merecia ganhar esta categoria?</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${selectedNomineeId ? 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>
          {selectedNomineeId ? <><Heart className="w-3.5 h-3.5" />Favorito escolhido</> : isVotingOpen ? 'Escolha seu favorito' : 'Seleção pausada'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nominees.map(nominee => <NomineeItem key={nominee.id} nominee={nominee} isSelected={selectedNomineeId === nominee.id} onSelect={() => onVote(category.id, nominee.id)} isOfficialWinner={winnerId === nominee.id} showWinner={isConcluded && revealAll} isVotingOpen={isVotingOpen} />)}
      </div>
    </section>
  );
};
