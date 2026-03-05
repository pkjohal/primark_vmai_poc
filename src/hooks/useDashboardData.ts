import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import type { ComplianceRecord } from '../lib/types';

interface DashboardStats {
  totalChecks: number;
  compliantChecks: number;
  complianceRate: number;
  openTasks: number;
}

interface DailyCount {
  date: string;
  compliant: number;
  non_compliant: number;
}

interface DeptCount {
  department: string;
  count: number;
}

export function useDashboardData(
  storeId: string | undefined,
  canViewAllStores: boolean,
  from?: string,
  to?: string,
) {
  const defaultFrom = format(subDays(new Date(), 6), 'yyyy-MM-dd');
  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  const rangeFrom = from ?? defaultFrom;
  const rangeTo = to ?? defaultTo;

  const [stats, setStats] = useState<DashboardStats>({ totalChecks: 0, compliantChecks: 0, complianceRate: 0, openTasks: 0 });
  const [checksPerDay, setChecksPerDay] = useState<DailyCount[]>([]);
  const [checksByDept, setChecksByDept] = useState<DeptCount[]>([]);
  const [recentChecks, setRecentChecks] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fromTs = `${rangeFrom}T00:00:00`;
    const toTs = `${rangeTo}T23:59:59`;

    let q = supabase
      .from('compliance_records')
      .select('*, user:users(id,name)')
      .gte('checked_at', fromTs)
      .lte('checked_at', toTs)
      .order('checked_at', { ascending: false });

    if (!canViewAllStores && storeId) q = q.eq('store_id', storeId);

    const { data: records } = await q;
    const recs = (records ?? []) as ComplianceRecord[];

    const compliant = recs.filter(r => r.status === 'compliant').length;
    const rate = recs.length > 0 ? Math.round((compliant / recs.length) * 100) : 0;

    // Open tasks count
    let tq = supabase
      .from('vm_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);
    if (!canViewAllStores && storeId) tq = tq.eq('store_id', storeId);
    const { count: openCount } = await tq;

    setStats({ totalChecks: recs.length, compliantChecks: compliant, complianceRate: rate, openTasks: openCount ?? 0 });
    setRecentChecks(recs.slice(0, 20));

    // Group by day
    const dayMap = new Map<string, DailyCount>();
    recs.forEach(r => {
      const day = r.checked_at.slice(0, 10);
      if (!dayMap.has(day)) dayMap.set(day, { date: day, compliant: 0, non_compliant: 0 });
      const entry = dayMap.get(day)!;
      if (r.status === 'compliant') entry.compliant++;
      else entry.non_compliant++;
    });
    setChecksPerDay(Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)));

    // Group by department
    const deptMap = new Map<string, number>();
    recs.forEach(r => {
      deptMap.set(r.department, (deptMap.get(r.department) ?? 0) + 1);
    });
    setChecksByDept(
      Array.from(deptMap.entries())
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count),
    );

    setLoading(false);
  }, [storeId, canViewAllStores, rangeFrom, rangeTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime
  useEffect(() => {
    if (!storeId && !canViewAllStores) return;
    const channel = supabase
      .channel('compliance_dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'compliance_records' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId, canViewAllStores, fetchData]);

  return { stats, checksPerDay, checksByDept, recentChecks, loading, refetch: fetchData };
}
