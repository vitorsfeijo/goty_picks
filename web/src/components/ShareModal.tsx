import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import type { Edition, UserVotes } from '../types';
import {
  generateBallotCanvas,
  downloadBallotCard,
  shareBallotCard
} from '../utils/generateShareCard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  edition: Edition;
  votes: UserVotes;
  displayName: string;
  totalVoted: number;
  totalCategories: number;
  score?: {
    correct: number;
    evaluated: number;
    percentage: number;
  };
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  edition,
  votes,
  displayName,
  totalVoted,
  totalCategories,
  score
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      return;
    }

    let active = true;
    setGenerating(true);

    void generateBallotCanvas({
      edition,
      votes,
      displayName,
      totalVoted,
      totalCategories,
      score
    }).then((canvas) => {
      if (!active) return;
      setPreviewUrl(canvas.toDataURL('image/png'));
      setGenerating(false);
    });

    return () => {
      active = false;
    };
  }, [isOpen, edition, votes, displayName, totalVoted, totalCategories, score]);

  if (!isOpen) return null;

  const handleCopyText = () => {
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

    text += `\nFaça seus palpites também em: https://vitorsfeijo.github.io/goty_picks/`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    });
  };

  const handleDownload = async () => {
    setDownloading(true);
    await downloadBallotCard({
      edition,
      votes,
      displayName,
      totalVoted,
      totalCategories,
      score
    });
    setDownloading(false);
  };

  const handleShareNative = async () => {
    await shareBallotCard({
      edition,
      votes,
      displayName,
      totalVoted,
      totalCategories,
      score
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
              Compartilhar Bolão
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Image Preview */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center">
          {generating || !previewUrl ? (
            <div className="w-full aspect-[4/5] max-w-[280px] bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="text-xs text-slate-400">Gerando seu card personalizado...</span>
            </div>
          ) : (
            <div className="relative group max-w-[280px] rounded-xl overflow-hidden border border-amber-500/30 shadow-xl shadow-black/60">
              <img
                src={previewUrl}
                alt="Card de Compartilhamento do Bolão"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-2.5 text-center">
            Imagem em alta resolução (1080×1350) perfeita para Stories, WhatsApp e Twitter/X.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={generating || downloading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Baixando...' : 'Baixar Imagem'}
          </button>

          <button
            type="button"
            onClick={handleShareNative}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
            title="Compartilhar diretamente"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Copiar lista de votos em texto"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
