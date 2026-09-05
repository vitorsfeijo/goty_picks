import React from 'react';
import { Award, Target, CheckCircle2, XCircle } from 'lucide-react';

interface ScoreSummaryProps {
  score: {
    correct: number;
    evaluated: number;
    total: number;
    percentage: number;
  };
  totalVoted: number;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ score, totalVoted }) => {
  if (score.evaluated === 0) return null;

  const getRankTitle = (pct: number) => {
    if (pct >= 80) return { title: 'Oráculo dos Games 🌟', desc: 'Sua visão foi quase perfeita!' };
    if (pct >= 60) return { title: 'Mestre dos Palpites 🎯', desc: 'Excelente intuição e conhecimento da indústria.' };
    if (pct >= 40) return { title: 'Apostador Corajoso 🎲', desc: 'Mandou bem em várias categorias!' };
    return { title: 'Gosto Peculiar 👾', desc: 'O júri do TGA não entendeu a sua visão artística.' };
  };

  const rank = getRankTitle(score.percentage);
  const missed = totalVoted - score.correct;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 p-6 sm:p-8 mb-8 shadow-2xl">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Rank & Title */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            <Award className="w-3.5 h-3.5" />
            Resultado Final do seu Bolão
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-cinzel">
            {rank.title}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {rank.desc}
          </p>
        </div>

        {/* Right: Metrics Grid */}
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
          {/* Hits */}
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Acertos
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {score.correct}
            </span>
            <span className="text-xs text-slate-500 block">/ {score.evaluated}</span>
          </div>

          <div className="h-10 w-px bg-slate-800"></div>

          {/* Misses */}
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1 text-rose-400 text-xs font-semibold mb-1">
              <XCircle className="w-3.5 h-3.5" />
              Erros
            </div>
            <span className="text-2xl sm:text-3xl font-black text-rose-400">
              {missed > 0 ? missed : 0}
            </span>
            <span className="text-xs text-slate-500 block">palpites</span>
          </div>

          <div className="h-10 w-px bg-slate-800"></div>

          {/* Accuracy % */}
          <div className="text-center px-2">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-semibold mb-1">
              <Target className="w-3.5 h-3.5" />
              Acurácia
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {score.percentage}%
            </span>
            <span className="text-xs text-slate-500 block">aproveitamento</span>
          </div>
        </div>
      </div>
    </div>
  );
};
