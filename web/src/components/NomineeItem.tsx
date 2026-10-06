import React from 'react';
import { Heart, Trophy } from 'lucide-react';
import { Nominee } from '../types';

interface NomineeItemProps {
  nominee: Nominee;
  isSelected: boolean;
  onSelect: () => void;
  isOfficialWinner: boolean;
  showWinner: boolean;
  isVotingOpen?: boolean;
}

export const NomineeItem: React.FC<NomineeItemProps> = ({ nominee, isSelected, onSelect, isOfficialWinner, showWinner, isVotingOpen = true }) => (
  <button type="button" aria-pressed={isSelected} disabled={!isVotingOpen} onClick={onSelect}
    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 disabled:cursor-default ${isSelected ? 'border-violet-400 bg-violet-500/10 shadow-lg shadow-violet-950/20' : 'border-slate-800 bg-slate-950/30 hover:border-slate-600 hover:bg-slate-800/50'}`}>
    <span className="flex items-center gap-3 min-w-0">
      <Heart className={`w-5 h-5 shrink-0 ${isSelected ? 'fill-violet-400 text-violet-400' : 'text-slate-600'}`} />
      <span><span className="block font-semibold text-sm text-slate-100">{nominee.name}</span>{nominee.details && <span className="block text-xs text-slate-400 mt-1">{nominee.details}</span>}</span>
    </span>
    <span className="flex flex-wrap gap-2 text-xs">
      {isSelected && <span className="rounded-md bg-violet-500/15 px-2 py-1 text-violet-300">Minha escolha</span>}
      {showWinner && isOfficialWinner && <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-amber-300"><Trophy className="w-3 h-3" />Vencedor oficial</span>}
    </span>
  </button>
);
