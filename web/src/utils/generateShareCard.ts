import type { Edition, UserVotes } from '../types';

interface GenerateCardOptions {
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

/**
 * Helper to wrap text into multiple lines if it exceeds maxWidth.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Draws a high-resolution 1080x1350 social share card onto a Canvas element.
 */
export async function generateBallotCanvas(
  options: GenerateCardOptions
): Promise<HTMLCanvasElement> {
  const { edition, votes, displayName, totalVoted, totalCategories, score } = options;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Background Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 1350);
  bgGradient.addColorStop(0, '#060910');
  bgGradient.addColorStop(0.4, '#090f1d');
  bgGradient.addColorStop(1, '#05070d');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Ambient Gold Glow at Top
  const glow = ctx.createRadialGradient(540, 200, 20, 540, 200, 600);
  glow.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
  glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.05)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 800);

  // 3. Card Outer Border
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 1080 - 72, 1350 - 72);

  // Inner subtle accent frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, 1080 - 96, 1350 - 96);

  // 4. Header: Logo & Title
  ctx.textAlign = 'center';

  // Trophy Emoji / Icon
  ctx.font = '54px "Cinzel", "Inter", sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('🏆  G O T Y   P I C K S', 540, 120);

  // Edition Title
  ctx.font = 'bold 44px "Cinzel", "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(edition.title.toUpperCase(), 540, 185);

  // Player Name & Progress Badge
  ctx.font = '500 24px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Palpites oficiais de ${displayName}`, 540, 230);

  // Progress Pill
  const isConcluded = edition.status === 'concluded' && (score?.evaluated ?? 0) > 0;
  const pillText = isConcluded
    ? `⭐ Aproveitamento: ${score?.percentage}% (${score?.correct}/${score?.evaluated} acertos)`
    : `Progresso: ${totalVoted} de ${totalCategories} categorias (${totalCategories > 0 ? Math.round((totalVoted / totalCategories) * 100) : 0}%)`;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 2;
  const pillWidth = 560;
  const pillHeight = 44;
  const pillX = 540 - pillWidth / 2;
  const pillY = 255;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 22);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 20px "Inter", sans-serif';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(pillText, 540, pillY + 29);

  // 5. Featured Highlight: Jogo do Ano (GOTY)
  const gotyCategory = edition.categories.find(
    (c) => c.title.toLowerCase().includes('jogo do ano') || c.id === 'goty'
  );
  const gotyVoteId = gotyCategory ? votes[gotyCategory.id] : undefined;
  const gotyNominee = gotyCategory?.nominees.find((n) => n.id === gotyVoteId);

  const gotyBoxY = 325;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = gotyNominee ? 'rgba(245, 158, 11, 0.6)' : 'rgba(100, 116, 139, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(90, gotyBoxY, 900, 155, 20);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 18px "Inter", sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('★  MEU PALPITE PARA JOGO DO ANO (GOTY)  ★', 540, gotyBoxY + 38);

  ctx.font = 'bold 36px "Cinzel", "Inter", sans-serif';
  ctx.fillStyle = gotyNominee ? '#ffffff' : '#64748b';
  const gotyName = gotyNominee ? gotyNominee.name : '(Nenhum voto registrado)';
  ctx.fillText(gotyName, 540, gotyBoxY + 88);

  if (gotyNominee?.details) {
    ctx.font = '500 20px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(gotyNominee.details, 540, gotyBoxY + 125);
  }

  // 6. Grid of Other Categories (Top Picks)
  // Take up to 6 prominent categories excluding GOTY
  const otherCategories = edition.categories
    .filter((c) => c.id !== gotyCategory?.id)
    .slice(0, 6);

  const gridStartY = 515;
  const colWidth = 435;
  const rowHeight = 105;
  const gapX = 30;
  const startX = 90;

  otherCategories.forEach((cat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = startX + col * (colWidth + gapX);
    const y = gridStartY + row * (rowHeight + 16);

    const voteId = votes[cat.id];
    const nominee = cat.nominees.find((n) => n.id === voteId);
    const winnerId = cat.winner_id || cat.nominees.find((n) => n.winner)?.id;
    const isWinner = Boolean(winnerId && winnerId === voteId);

    // Card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = isWinner
      ? 'rgba(52, 211, 153, 0.5)'
      : nominee
      ? 'rgba(51, 65, 85, 0.8)'
      : 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, colWidth, rowHeight, 14);
    ctx.fill();
    ctx.stroke();

    // Category Title
    ctx.textAlign = 'left';
    ctx.font = '600 16px "Inter", sans-serif';
    ctx.fillStyle = isWinner ? '#34d399' : '#f59e0b';
    const cleanTitle = cat.title.length > 34 ? `${cat.title.slice(0, 32)}...` : cat.title;
    ctx.fillText(cleanTitle, x + 20, y + 32);

    // Nominee Choice
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillStyle = nominee ? '#ffffff' : '#64748b';
    const nomineeText = nominee ? nominee.name : '—';
    const lines = wrapText(ctx, nomineeText, colWidth - 40);
    ctx.fillText(lines[0] || '—', x + 20, y + 66);
    if (lines[1]) {
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(lines[1], x + 20, y + 90);
    }
  });

  // 7. Footer & Branding
  const footerY = 1200;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(90, footerY);
  ctx.lineTo(990, footerY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '600 20px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Faça seus palpites e compare com seus amigos:', 540, footerY + 45);

  ctx.font = 'bold 26px "Cinzel", "Inter", sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('vitorsfeijo.github.io/goty_picks', 540, footerY + 85);

  return canvas;
}

/**
 * Triggers a download of the ballot canvas as a PNG file.
 */
export async function downloadBallotCard(
  options: GenerateCardOptions
): Promise<void> {
  const canvas = await generateBallotCanvas(options);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `goty-picks-${options.edition.year}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Shares the ballot card via native Web Share API (mobile) or falls back to download.
 */
export async function shareBallotCard(
  options: GenerateCardOptions
): Promise<boolean> {
  const canvas = await generateBallotCanvas(options);

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      const file = new File([blob], `goty-picks-${options.edition.year}.png`, {
        type: 'image/png'
      });

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        navigator.share
      ) {
        try {
          await navigator.share({
            title: `Meus Palpites - ${options.edition.title}`,
            text: `Confira meus palpites para o ${options.edition.title} no GOTY Picks!`,
            files: [file]
          });
          resolve(true);
          return;
        } catch {
          // User cancelled or share failed, fallback below
        }
      }

      // Fallback: download the file
      await downloadBallotCard(options);
      resolve(true);
    }, 'image/png');
  });
}
