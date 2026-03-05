import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Flag } from 'lucide-react';
import { useVMData } from '../context/VMDataContext';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../hooks/useCompliance';
import { useAudit } from '../hooks/useAudit';
import { useToast } from '../context/ToastContext';
import { VMGuidelineCard } from '../components/scanning/VMGuidelineCard';
import { useEffect } from 'react';

export function ProductScreen() {
  const { ean } = useParams<{ ean: string }>();
  const navigate = useNavigate();
  const { getProductByEAN } = useVMData();
  const { user, store } = useAuth();
  const { createRecord, loading } = useCompliance();
  const { log } = useAudit();
  const { showToast } = useToast();

  const product = ean ? getProductByEAN(ean) : undefined;

  useEffect(() => {
    if (!product) {
      showToast('Product not found in VM database.', 'error');
      navigate('/scan');
    }
  }, [product, navigate, showToast]);

  if (!product || !user || !store) return null;

  const handleConfirm = async () => {
    const record = await createRecord({
      ean: product.ean13,
      orin_or_km: product.identifier,
      identifier_type: product.identifier_type,
      product_description: product.description,
      department: product.department,
      campaign: product.campaign,
      status: 'compliant',
      guideline_image_url: product.vm_image,
      user_id: user.id,
      store_id: store.id,
    });
    if (record) {
      await log('compliance', record.id, 'confirmed', user.id);
      showToast('Compliance confirmed', 'success');
      navigate('/scan');
    } else {
      showToast('Something went wrong saving your check. Please try again.', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Back button */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => navigate('/scan')} className="flex items-center gap-1.5 text-primark-blue font-medium text-sm">
          <ArrowLeft size={16} />
          Back to Scanner
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        <VMGuidelineCard product={product} />

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-success text-white font-semibold text-[15px] active:opacity-90 transition-opacity disabled:opacity-60"
          >
            <CheckCircle size={18} />
            {loading ? 'Saving...' : 'Confirm Match'}
          </button>

          <button
            onClick={() => navigate(`/flag/${ean}`)}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-danger text-white font-semibold text-[15px] active:opacity-90 transition-opacity"
          >
            <Flag size={18} />
            Flag Issue
          </button>

          <button
            onClick={() => navigate('/scan')}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl bg-white border border-border-grey text-charcoal font-semibold text-[15px] active:bg-light-grey transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
