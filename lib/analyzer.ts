export type Verdict = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';

export type AnalysisResult = {
  verdict: Verdict;
  score: number;
  reasons: string[];
  urls: string[];
};

const URL_REGEX = /https?:\/\/[^\s/$.?#].[^\s)\]"']*/gi;

const PATTERNS: Array<{ regex: RegExp; points: number; reason: string }> = [
  {
    regex: /(urgent|immediately|act now|limited time|last warning)/i,
    points: 20,
    reason: 'Pressure language can indicate social engineering.',
  },
  {
    regex: /(password|otp|2fa|verification code|security code)/i,
    points: 25,
    reason: 'Requests for credentials or security codes are high risk.',
  },
  {
    regex: /(bank|irs|tax|paypal|crypto wallet|investment)/i,
    points: 15,
    reason: 'Financial references are common in scam campaigns.',
  },
  {
    regex: /(gift card|wire transfer|bitcoin|usdt)/i,
    points: 20,
    reason: 'Irreversible payment methods often appear in scams.',
  },
  {
    regex: /(click here|verify account|confirm identity)/i,
    points: 15,
    reason: 'Call-to-action language can be used in phishing attempts.',
  },
  {
    regex: /(free money|guaranteed return|risk[- ]?free)/i,
    points: 15,
    reason: 'Promises of unrealistic gains are suspicious.',
  },
];

export function extractUrls(text: string): string[] {
  return Array.from(new Set(text.match(URL_REGEX) ?? []));
}

export function scoreToVerdict(score: number): Verdict {
  if (score >= 70) {
    return 'DANGEROUS';
  }

  if (score >= 35) {
    return 'SUSPICIOUS';
  }

  return 'SAFE';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export function analyzeText(rawText: string): AnalysisResult {
  const text = rawText.trim();
  const urls = extractUrls(text);
  const reasons: string[] = [];
  let score = 0;

  for (const pattern of PATTERNS) {
    if (pattern.regex.test(text)) {
      score += pattern.points;
      reasons.push(pattern.reason);
    }
  }

  if (urls.length > 0) {
    score += 10;
    reasons.push('Contains one or more links that should be verified carefully.');
  }

  if (urls.some((url) => /\d+\.\d+\.\d+\.\d+/.test(url))) {
    score += 15;
    reasons.push('Direct IP-based URLs can be used to hide malicious destinations.');
  }

  const finalScore = clampScore(score);

  if (reasons.length === 0) {
    reasons.push('No high-risk scam indicators were detected by this basic heuristic scan.');
  }

  return {
    verdict: scoreToVerdict(finalScore),
    score: finalScore,
    reasons,
    urls,
  };
}
