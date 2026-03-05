import { useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useStores } from '../hooks/useStores';
import { StatCard } from '../components/ui/StatCard';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { ComplianceBadge } from '../components/ui/ComplianceBadge';
import { DataTable } from '../components/ui/DataTable';
import { PageHeader } from '../components/layout/PageHeader';
import { formatRelativeTime } from '../lib/utils';
import type { ComplianceRecord } from '../lib/types';

const COMPLIANT_COLOR = '#10B981';
const NON_COMPLIANT_COLOR = '#EF4444';

export function DashboardScreen() {
  const { store, canViewAllStores } = useAuth();
  const { stores } = useStores(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [from, setFrom] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [to, setTo] = useState(today);
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(
    canViewAllStores ? undefined : store?.id,
  );

  const { stats, checksPerDay, checksByDept, recentChecks, loading } =
    useDashboardData(selectedStoreId, canViewAllStores, from, to);

  const rateColour = stats.complianceRate >= 80 ? 'success' : 'danger';
  const tasksColour = stats.openTasks > 0 ? 'warning' : 'success';

  const columns = [
    { key: 'product_description', label: 'Product' },
    { key: 'user', label: 'Colleague', render: (r: ComplianceRecord) => r.user?.name ?? '—' },
    { key: 'status', label: 'Result', render: (r: ComplianceRecord) => <ComplianceBadge status={r.status} /> },
    { key: 'department', label: 'Dept' },
    { key: 'checked_at', label: 'Time', render: (r: ComplianceRecord) => formatRelativeTime(r.checked_at) },
  ];

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-4 gap-4">
      <PageHeader title="Dashboard" subtitle={canViewAllStores ? 'All stores' : store?.name} />

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        {canViewAllStores && (
          <select
            value={selectedStoreId ?? ''}
            onChange={e => setSelectedStoreId(e.target.value || undefined)}
            className="min-h-[40px] rounded-xl border border-border-grey bg-white px-3 text-sm text-charcoal focus:outline-none focus:border-primark-blue"
          >
            <option value="">All stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-24 w-36 animate-pulse flex-shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          <StatCard value={stats.totalChecks} label="Total Checks" colour="blue" />
          <StatCard value={`${stats.complianceRate}%`} label="Compliance Rate" colour={rateColour} />
          <StatCard value={stats.openTasks} label="Open Tasks" colour={tasksColour} />
        </div>
      )}

      {/* Checks per day chart */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-base font-semibold text-navy mb-3">Checks per Day</h3>
        {loading ? (
          <div className="h-40 animate-pulse bg-light-grey rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={checksPerDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="compliant" stackId="a" fill={COMPLIANT_COLOR} name="Compliant" radius={[0, 0, 0, 0]} />
              <Bar dataKey="non_compliant" stackId="a" fill={NON_COMPLIANT_COLOR} name="Non-Compliant" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Compliance rate doughnut + dept bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-white rounded-xl shadow-sm p-4 flex-1 min-w-[140px]">
          <h3 className="text-base font-semibold text-navy mb-2">Compliance Rate</h3>
          {loading ? (
            <div className="h-32 animate-pulse bg-light-grey rounded-lg" />
          ) : (
            <div className="relative flex items-center justify-center">
              <PieChart width={130} height={130}>
                <Pie
                  data={[
                    { name: 'Compliant', value: stats.compliantChecks },
                    { name: 'Non-Compliant', value: stats.totalChecks - stats.compliantChecks },
                  ]}
                  cx={60}
                  cy={60}
                  innerRadius={40}
                  outerRadius={55}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill={COMPLIANT_COLOR} />
                  <Cell fill={NON_COMPLIANT_COLOR} />
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${rateColour === 'success' ? 'text-success' : 'text-danger'}`}>
                  {stats.complianceRate}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 flex-1 min-w-[160px]">
          <h3 className="text-base font-semibold text-navy mb-2">By Department</h3>
          {loading ? (
            <div className="h-32 animate-pulse bg-light-grey rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={checksByDept.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={32} />
                <Tooltip />
                <Bar dataKey="count" fill="#0DAADB" radius={[0, 3, 3, 0]} name="Checks" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent checks table */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-base font-semibold text-navy mb-3">Recent Checks</h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse bg-light-grey rounded" />)}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={recentChecks}
            keyFn={r => r.id}
            emptyMessage="No compliance checks found for this period."
          />
        )}
      </div>
    </div>
  );
}
