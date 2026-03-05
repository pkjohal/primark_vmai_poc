import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useVMData } from '../context/VMDataContext';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../hooks/useCompliance';
import { useTasks } from '../hooks/useTasks';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { useAudit } from '../hooks/useAudit';
import { useToast } from '../context/ToastContext';
import { PhotoCapture } from '../components/ui/PhotoCapture';
import type { NonComplianceType, Severity } from '../lib/types';
import { NON_COMPLIANCE_LABELS, SEVERITY_LABELS } from '../lib/types';

export function FlagScreen() {
  const { ean } = useParams<{ ean: string }>();
  const navigate = useNavigate();
  const { getProductByEAN } = useVMData();
  const { user, store } = useAuth();
  const { createRecord, loading: recordLoading } = useCompliance();
  const { createTask } = useTasks(store?.id);
  const { uploadPhoto, uploading } = usePhotoUpload();
  const { log } = useAudit();
  const { showToast } = useToast();

  const [ncType, setNcType] = useState<NonComplianceType>('missing_pos');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const product = ean ? getProductByEAN(ean) : undefined;

  if (!product || !user || !store) {
    navigate('/scan');
    return null;
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photo) e.photo = 'A photo is required';
    if (ncType === 'other' && !description.trim()) e.description = 'Description is required for "Other"';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Create compliance record first to get the real ID
    const record = await createRecord({
      ean: product.ean13,
      orin_or_km: product.identifier,
      identifier_type: product.identifier_type,
      product_description: product.description,
      department: product.department,
      campaign: product.campaign,
      status: 'non_compliant',
      photo_url: null,
      guideline_image_url: product.vm_image,
      user_id: user.id,
      store_id: store.id,
    });

    if (!record) {
      showToast('Something went wrong. Please try again.', 'error');
      return;
    }

    // Upload photo once using the real record ID
    const photoUrl = photo ? await uploadPhoto(photo, `compliance/${record.id}.jpg`) : null;
    if (photo && !photoUrl) {
      showToast('Failed to upload photo. Please try again.', 'error');
      return;
    }

    await log('compliance', record.id, 'flagged', user.id);

    // Create task
    const task = await createTask({
      compliance_record_id: record.id,
      store_id: store.id,
      reported_by: user.id,
      non_compliance_type: ncType,
      severity,
      description: description.trim() || undefined,
      flagged_photo_url: photoUrl,
      guideline_image_url: product.vm_image,
    });

    if (task) {
      await log('task', task.id, 'created', user.id);
    }

    showToast('Issue flagged successfully', 'success');
    navigate('/scan');
  };

  const isBusy = recordLoading || uploading;

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => navigate(`/product/${ean}`)} className="flex items-center gap-1.5 text-primark-blue font-medium text-sm">
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {/* Product summary */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-navy">{product.description}</h2>
              <p className="text-sm text-mid-grey">{product.identifier_type}: {product.identifier}</p>
            </div>
            <span className="bg-primark-blue-light text-primark-blue text-xs font-medium px-2 py-1 rounded-md flex-shrink-0">
              {product.department}
            </span>
          </div>
          <p className="text-xs text-mid-grey mt-2">{product.campaign}</p>
        </div>

        {/* Flag Issue header */}
        <h1 className="text-2xl font-bold text-navy">Flag Issue</h1>

        {/* Non-compliance type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">Issue Type</label>
          <select
            value={ncType}
            onChange={e => setNcType(e.target.value as NonComplianceType)}
            className="w-full min-h-[44px] rounded-xl border border-border-grey bg-white px-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue"
          >
            {(Object.entries(NON_COMPLIANCE_LABELS) as [NonComplianceType, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">Severity</label>
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value as Severity)}
            className="w-full min-h-[44px] rounded-xl border border-border-grey bg-white px-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue"
          >
            {(Object.entries(SEVERITY_LABELS) as [Severity, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">
            Description {ncType === 'other' && <span className="text-danger">*</span>}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            rows={3}
            className="w-full rounded-xl border border-border-grey bg-white px-3 py-2.5 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue resize-none"
          />
          {errors.description && <p className="text-danger text-xs">{errors.description}</p>}
        </div>

        {/* Photo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">
            Photo <span className="text-danger">*</span>
          </label>
          <PhotoCapture
            onCapture={f => { setPhoto(f); setErrors(prev => ({ ...prev, photo: '' })); }}
            required
          />
          {errors.photo && <p className="text-danger text-xs">{errors.photo}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="w-full min-h-[48px] rounded-xl bg-primark-blue text-white font-semibold text-[15px] active:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isBusy ? 'Submitting...' : 'Submit'}
          </button>
          <button
            onClick={() => navigate(`/product/${ean}`)}
            className="w-full min-h-[48px] rounded-xl bg-white border border-border-grey text-charcoal font-semibold text-[15px] active:bg-light-grey transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
