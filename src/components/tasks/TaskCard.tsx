import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import type { VMTask } from '../../lib/types';
import { NON_COMPLIANCE_LABELS } from '../../lib/types';
import { SeverityBadge } from '../ui/SeverityBadge';
import { formatRelativeTime, isOverdue, resolveImagePath } from '../../lib/utils';

interface Props { task: VMTask }

export function TaskCard({ task }: Props) {
  const navigate = useNavigate();
  const overdue = isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'closed';
  const product = task.compliance_record;

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer active:opacity-90 ${
        overdue ? 'border-l-4 border-danger' : 'border border-border-grey'
      }`}
    >
      <div className="p-4 flex gap-3">
        {/* Thumbnail */}
        {(task.flagged_photo_url || task.guideline_image_url) && (
          <img
            src={task.flagged_photo_url ?? resolveImagePath(task.guideline_image_url ?? '')}
            alt=""
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-light-grey"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <SeverityBadge severity={task.severity} />
            <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-danger font-medium' : 'text-mid-grey'}`}>
              {overdue && <AlertCircle size={12} />}
              <Clock size={12} />
              {task.due_date ? formatRelativeTime(task.due_date) : 'No due date'}
            </div>
          </div>
          <p className="text-[15px] font-semibold text-navy truncate">
            {product?.product_description ?? 'Unknown product'}
          </p>
          <p className="text-sm text-mid-grey truncate">{product?.orin_or_km}</p>
          <p className="text-xs text-charcoal mt-1">{NON_COMPLIANCE_LABELS[task.non_compliance_type]}</p>
          <p className="text-xs text-mid-grey mt-1">
            Reported by {task.reporter?.name ?? '—'} · {formatRelativeTime(task.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
