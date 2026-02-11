import type { Verdict } from '@/lib/analyzer';

type ShareCardInput = {
  verdict: Verdict;
  score: number;
  reasons: string[];
  urls: string[];
};

const CARD_SIZE = 1080;
const DISCLAIMER = 'Risk assessment, not certainty. Verify via official channels.';

const VERDICT_STYLES: Record<Verdict, { bg: string; fg: string; bar: string }> = {
  SAFE: { bg: '#dcfce7', fg: '#166534', bar: '#22c55e' },
  SUSPICIOUS: { bg: '#fef3c7', fg: '#92400e', bar: '#f59e0b' },
  DANGEROUS: { bg: '#fee2e2', fg: '#991b1b', bar: '#ef4444' },
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function extractHostnames(urls: string[]): string[] {
  const unique = new Set<string>();

  for (const url of urls) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname) {
        unique.add(hostname);
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  return Array.from(unique);
}

export function buildShareCardText(input: ShareCardInput): {
  title: string;
  verdict: Verdict;
  score: number;
  reasons: string[];
  hostnames: string[];
  disclaimer: string;
} {
  const reasons = input.reasons.slice(0, 4);

  return {
    title: 'Scam Shield',
    verdict: input.verdict,
    score: clampScore(input.score),
    reasons,
    hostnames: extractHostnames(input.urls),
    disclaimer: DISCLAIMER,
  };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to generate image.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;

    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = candidate;
    }
  }

  if (line) {
    context.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }

  return cursorY;
}

export async function generateShareCardPng(input: ShareCardInput): Promise<Blob> {
  const card = buildShareCardText(input);
  const style = VERDICT_STYLES[card.verdict];

  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is unavailable.');
  }

  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  context.fillStyle = '#ffffff';
  context.fillRect(60, 60, CARD_SIZE - 120, CARD_SIZE - 120);

  context.fillStyle = '#0f172a';
  context.font = '700 64px Inter, system-ui, sans-serif';
  context.fillText(card.title, 110, 170);

  context.fillStyle = style.bg;
  context.fillRect(110, 210, 360, 90);
  context.fillStyle = style.fg;
  context.font = '700 44px Inter, system-ui, sans-serif';
  context.fillText(card.verdict, 140, 272);

  context.fillStyle = '#334155';
  context.font = '500 34px Inter, system-ui, sans-serif';
  context.fillText(`Score: ${card.score}/100`, 110, 360);

  context.fillStyle = '#e2e8f0';
  context.fillRect(110, 390, 860, 28);
  context.fillStyle = style.bar;
  context.fillRect(110, 390, (860 * card.score) / 100, 28);

  context.fillStyle = '#475569';
  context.font = '600 28px Inter, system-ui, sans-serif';
  context.fillText('Reasons', 110, 475);
  context.font = '400 25px Inter, system-ui, sans-serif';

  let y = 520;
  const reasons = card.reasons.length > 0 ? card.reasons : ['No major indicators detected.'];
  for (const reason of reasons) {
    y = drawWrappedText(context, `• ${reason}`, 120, y, 840, 36);
    y += 6;
  }

  context.fillStyle = '#475569';
  context.font = '600 28px Inter, system-ui, sans-serif';
  context.fillText('Detected domains', 110, 790);

  context.fillStyle = '#0f172a';
  context.font = '400 24px Inter, system-ui, sans-serif';
  const domainsText = card.hostnames.length > 0 ? card.hostnames.join(', ') : 'None detected';
  drawWrappedText(context, domainsText, 110, 830, 860, 34);

  context.fillStyle = '#64748b';
  context.font = '400 22px Inter, system-ui, sans-serif';
  drawWrappedText(context, card.disclaimer, 110, 955, 860, 30);

  return toBlob(canvas);
}
