import type { AnalysisResult } from '@/lib/analyzer';

const DEFAULT_TIP = 'Verify via official channels.';

export function formatVerdictSummary(result: AnalysisResult): string {
  const reasonsText = result.reasons.length > 0 ? result.reasons.join('; ') : 'No specific indicators found.';

  return [
    `Scam Shield verdict: ${result.verdict} (score ${result.score}/100)`,
    `Reasons: ${reasonsText}`,
    `Tip: ${DEFAULT_TIP}`,
  ].join('\n');
}
