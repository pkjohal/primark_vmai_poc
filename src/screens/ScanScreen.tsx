import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanBarcode } from 'lucide-react';
import { BarcodeScanner } from '../components/scanning/BarcodeScanner';
import { ComplianceBadge } from '../components/ui/ComplianceBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useVMData } from '../context/VMDataContext';
import { useAuth } from '../context/AuthContext';
import { useCompliance } from '../hooks/useCompliance';
import { useToast } from '../context/ToastContext';
import type { ComplianceRecord } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';

export function ScanScreen() {
  const navigate = useNavigate();
  const { getProductByEAN } = useVMData();
  const { store } = useAuth();
  const { getRecentChecks } = useCompliance();
  const { showToast } = useToast();
  const [recentChecks, setRecentChecks] = useState<ComplianceRecord[]>([]);

  useEffect(() => {
    if (store?.id) {
      getRecentChecks(store.id, 10).then(setRecentChecks);
    }
  }, [store?.id, getRecentChecks]);

  const handleScan = useCallback((ean: string) => {
    const product = getProductByEAN(ean);
    if (!product) {
      showToast('Product not found in VM database.', 'error');
      return;
    }
    navigate(`/product/${ean}`);
  }, [getProductByEAN, navigate, showToast]);

  const handleError = useCallback((msg: string) => {
    showToast(msg, 'error');
  }, [showToast]);

  // Count today's checks
  const today = new Date().toDateString();
  const todayCount = recentChecks.filter(r => new Date(r.checked_at).toDateString() === today).length;

  return (
    <div className="flex flex-col h-full">
      {/* Scanner — 65% */}
      <div className="flex-[1.86] relative min-h-0">
        <BarcodeScanner onScan={handleScan} onError={handleError} />
      </div>

      {/* Recent checks panel — 35% */}
      <div className="bg-white rounded-t-2xl shadow-lg relative z-10 flex flex-col" style={{ minHeight: '35%', maxHeight: '40%' }}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-navy">Recent Checks</h2>
          <span className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">
            Today: {todayCount}
          </span>
        </div>
        <div className="overflow-y-auto flex-1 pb-2">
          {recentChecks.length === 0 ? (
            <EmptyState icon={ScanBarcode} message="Scan a product to check its VM display" />
          ) : (
            <div className="flex flex-col gap-px">
              {recentChecks.map(record => (
                <div
                  key={record.id}
                  onClick={() => navigate(`/product/${record.ean}`, { state: { readonly: true } })}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-light-grey/50 cursor-pointer"
                >
                  <div>
                    <p className="text-[15px] font-medium text-navy leading-tight">{record.product_description}</p>
                    <p className="text-xs text-mid-grey">{formatRelativeTime(record.checked_at)}</p>
                  </div>
                  <ComplianceBadge status={record.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
