import type { Severity } from '../../lib/types';
import { SEVERITY_LABELS } from '../../lib/types';

interface Props { severity: Severity }

const styles: Record<Severity, string> = {
  critical: 'bg-danger text-white font-bold',
  high: 'bg-warning text-white',
  medium: 'bg-primark-blue text-white',
  low: 'bg-border-grey text-charcoal',
};

export function SeverityBadge({ severity }: Props) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${styles[severity]}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
