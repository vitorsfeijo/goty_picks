import React from 'react';
import { Trophy, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Nominee } from '../types';

interface NomineeItemProps {
  nominee: Nominee;
  isSelected: boolean;
  onSelect: () => void;
  isConcluded: boolean;
  isOfficialWinner: boolean;
  userVotedThis: boolean;
  showWinner: boolean;
  isVotingOpen?: boolean;
}

export const NomineeItem: React.FC<NomineeItemProps> = ({
  nominee,
  isSelected,
  onSelect,
  isConcluded,
  isOfficialWinner,
  userVotedThis,
  showWinner,
  isVotingOpen = true,
}) => {
  // Determine visual style based on evaluation
  let borderClass = isVotingOpen
    ? "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700"
    : "border-slate-800/60 bg-slate-900/30";

  if (isConcluded && showWinner) {
    if (isOfficialWinner && userVotedThis) {
      // User predicted correctly!
      borderClass = "border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-950/50";
    } else if (isOfficialWinner) {
      // Official winner, but user did not vote or voted something else
      borderClass = "border-amber-500/70 bg-amber-950/20";
    } else if (userVotedThis) {
      // User voted this, but it didn't win
      borderClass = "border-rose-500/60 bg-rose-950/20";
    }
  } else if (isSelected) {
    // Active pick in open voting or before winner reveal
    borderClass = "border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10";
  }

  return (
    <button
      type="button"
      disabled={!isVotingOpen}
      onClick={isVotingOpen ? onSelect : undefined}
      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 group relative ${
        isVotingOpen ? 'cursor-pointer' : 'cursor-default'
      } ${borderClass}`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Selection Indicator Icon */}
        <div className="shrink-0">
          {isConcluded && showWinner ? (
            userVotedThis && isOfficialWinner ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : userVotedThis ? (
              <XCircle className="w-5 h-5 text-rose-400" />
            ) : isOfficialWinner ? (
              <Trophy className="w-5 h-5 text-amber-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-700" />
            )
          ) : isSelected ? (
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
          ) : (
            <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          )}
        </div>

        {/* Title and Details */}
        <div className="truncate">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm sm:text-base tracking-wide truncate ${
              showWinner && isOfficialWinner
                ? 'text-amber-300 font-bold'
                : isSelected
                ? 'text-amber-300 font-bold'
                : 'text-slate-200'
            }`}>
              {nominee.name}
            </span>
          </div>

          {nominee.details && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {nominee.details}
            </p>
          )}
        </div>
      </div>

      {/* Badges / Feedback */}
      <div className="shrink-0 flex items-center gap-2">
        {showWinner && isOfficialWinner && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Vencedor
          </span>
        )}

        {showWinner && userVotedThis && !isOfficialWinner && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Seu Palpite
          </span>
        )}

        {showWinner && userVotedThis && isOfficialWinner && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            +1 Ponto!
          </span>
        )}

        {!showWinner && isSelected && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Escolhido
          </span>
        )}
      </div>
    </button>
  );
};
