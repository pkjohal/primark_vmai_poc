import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ComplianceRecord, ComplianceStatus, IdentifierType } from '../lib/types';

interface CreateComplianceData {
  ean: string;
  orin_or_km: string;
  identifier_type: IdentifierType;
  product_description: string;
  department: string;
  campaign: string | null;
  status: ComplianceStatus;
  photo_url?: string | null;
  guideline_image_url?: string | null;
  user_id: string;
  store_id: string;
}

export function useCompliance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecord = useCallback(async (data: CreateComplianceData): Promise<ComplianceRecord | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data: record, error: err } = await supabase
        .from('compliance_records')
        .insert(data)
        .select()
        .single();
      if (err) throw err;
      return record as ComplianceRecord;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save compliance record';
      setError(msg);
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecentChecks = useCallback(async (storeId: string, limit = 20): Promise<ComplianceRecord[]> => {
    const { data, error: err } = await supabase
      .from('compliance_records')
      .select('*, user:users(id,name,role)')
      .eq('store_id', storeId)
      .order('checked_at', { ascending: false })
      .limit(limit);
    if (err) { console.error(err); return []; }
    return (data ?? []) as ComplianceRecord[];
  }, []);

  return { createRecord, getRecentChecks, loading, error };
}
