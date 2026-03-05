import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, X } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useAudit } from '../hooks/useAudit';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ComparisonView } from '../components/tasks/ComparisonView';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PhotoCapture } from '../components/ui/PhotoCapture';
import type { VMTask, CloseReason } from '../lib/types';
import { NON_COMPLIANCE_LABELS, CLOSE_REASON_LABELS } from '../lib/types';
import { formatDate, isOverdue } from '../lib/utils';

export function TaskDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { store, user } = useAuth();
  const { getTask, updateStatus, closeTask } = useTasks(store?.id);
  const { uploadPhoto, uploading } = usePhotoUpload();
  const { log } = useAudit();
  const { showToast } = useToast();

  const [task, setTask] = useState<VMTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeReason, setCloseReason] = useState<CloseReason>('not_applicable');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTask(id).then(t => { setTask(t); setLoading(false); });
  }, [id, getTask]);

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="h-48 bg-white rounded-xl animate-pulse mb-3" />
        <div className="h-32 bg-white rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'closed';
  const product = task.compliance_record;

  const handleStartWork = async () => {
    await updateStatus(task.id, 'in_progress');
    await log('task', task.id, 'status_change', user!.id, { status: 'in_progress' });
    showToast('Task started', 'success');
    setTask(t => t ? { ...t, status: 'in_progress' } : t);
  };

  const handleMarkComplete = async () => {
    if (!evidenceFile) {
      setShowEvidenceCapture(true);
      return;
    }
    const url = await uploadPhoto(evidenceFile, `tasks/${task.id}_evidence.jpg`);
    if (!url) { showToast('Failed to upload evidence photo.', 'error'); return; }
    await updateStatus(task.id, 'completed', url);
    await log('task', task.id, 'completed', user!.id);
    showToast('Task marked complete', 'success');
    navigate('/tasks');
  };

  const handleClose = async () => {
    await closeTask(task.id, closeReason);
    await log('task', task.id, 'closed', user!.id, { reason: closeReason });
    showToast('Task closed', 'success');
    setShowCloseDialog(false);
    navigate('/tasks');
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => navigate('/tasks')} className="flex items-center gap-1.5 text-primark-blue font-medium text-sm">
          <ArrowLeft size={16} />
          Tasks
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {/* Image comparison */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <ComparisonView
            guidelineImage={task.guideline_image_url}
            actualPhoto={task.flagged_photo_url}
          />
          {task.status === 'completed' && task.evidence_photo_url && (
            <div className="mt-3">
              <ComparisonView
                guidelineImage={task.flagged_photo_url}
                actualPhoto={task.evidence_photo_url}
                guidelineLabel="Before (Flagged)"
                actualLabel="After (Fixed)"
              />
            </div>
          )}
        </div>

        {/* Task details */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-navy">{product?.product_description ?? 'Unknown product'}</h2>
              <p className="text-sm text-mid-grey">{product?.orin_or_km}</p>
            </div>
            <SeverityBadge severity={task.severity} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-[13px] uppercase tracking-wide text-mid-grey font-medium">Type</p>
              <p className="text-charcoal">{NON_COMPLIANCE_LABELS[task.non_compliance_type]}</p>
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-wide text-mid-grey font-medium">Status</p>
              <p className={`font-medium ${overdue ? 'text-danger' : 'text-charcoal'}`}>
                {task.status.replace('_', ' ')}
                {overdue && ' · OVERDUE'}
              </p>
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-wide text-mid-grey font-medium">Reporter</p>
              <p className="text-charcoal">{task.reporter?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-wide text-mid-grey font-medium">Due</p>
              <p className={overdue ? 'text-danger font-medium' : 'text-charcoal'}>
                {task.due_date ? formatDate(task.due_date) : '—'}
              </p>
            </div>
          </div>

          {task.description && (
            <div>
              <p className="text-[13px] uppercase tracking-wide text-mid-grey font-medium">Description</p>
              <p className="text-charcoal text-sm mt-0.5">{task.description}</p>
            </div>
          )}

          <p className="text-xs text-mid-grey">Flagged {formatDate(task.created_at)}</p>
        </div>

        {/* Evidence capture (shown when completing) */}
        {showEvidenceCapture && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
            <h3 className="text-base font-semibold text-navy">Evidence Photo Required</h3>
            <p className="text-sm text-mid-grey">Take a photo showing the resolved display.</p>
            <PhotoCapture
              onCapture={f => setEvidenceFile(f)}
              required
              label="Take Evidence Photo"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {task.status === 'open' && (
            <button
              onClick={handleStartWork}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-primark-blue text-white font-semibold text-[15px] active:opacity-90"
            >
              <Play size={16} />
              Start Work
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={handleMarkComplete}
              disabled={uploading}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-success text-white font-semibold text-[15px] active:opacity-90 disabled:opacity-60"
            >
              <CheckCircle size={16} />
              {uploading ? 'Uploading...' : evidenceFile ? 'Confirm Complete' : 'Mark Complete'}
            </button>
          )}

          {task.status !== 'closed' && task.status !== 'completed' && (
            <button
              onClick={() => setShowCloseDialog(true)}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-white border border-border-grey text-charcoal font-semibold text-[15px] active:bg-light-grey"
            >
              <X size={16} />
              Close Task
            </button>
          )}
        </div>
      </div>

      {/* Close dialog */}
      {showCloseDialog && (
        <ConfirmDialog
          title="Close Task"
          message="Select a reason for closing this task."
          confirmLabel="Close Task"
          variant="danger"
          onConfirm={handleClose}
          onCancel={() => setShowCloseDialog(false)}
        >
          <select
            value={closeReason}
            onChange={e => setCloseReason(e.target.value as CloseReason)}
            className="w-full min-h-[44px] rounded-xl border border-border-grey bg-white px-3 text-[15px] text-charcoal"
          >
            {(Object.entries(CLOSE_REASON_LABELS) as [CloseReason, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </ConfirmDialog>
      )}
    </div>
  );
}
