import type { Verdict } from '@/lib/analyzer';

type VerdictBadgeProps = {
  verdict: Verdict;
};

const STYLE_BY_VERDICT: Record<Verdict, string> = {
  SAFE: 'bg-emerald-100 text-emerald-800',
  SUSPICIOUS: 'bg-amber-100 text-amber-800',
  DANGEROUS: 'bg-red-100 text-red-800',
};

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STYLE_BY_VERDICT[verdict]}`}>
      {verdict}
    </span>
  );
}
