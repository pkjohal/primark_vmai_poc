import type { ComplianceStatus } from '../../lib/types';

interface Props { status: ComplianceStatus }

export function ComplianceBadge({ status }: Props) {
  const styles =
    status === 'compliant'
      ? 'bg-success-bg text-success'
      : 'bg-danger-bg text-danger';
  const label = status === 'compliant' ? '✓ Compliant' : '✗ Non-Compliant';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
