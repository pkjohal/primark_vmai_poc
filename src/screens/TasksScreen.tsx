import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/tasks/TaskCard';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/layout/PageHeader';
import type { TaskStatus } from '../lib/types';

const TABS: { label: string; status: TaskStatus }[] = [
  { label: 'Open', status: 'open' },
  { label: 'In Progress', status: 'in_progress' },
  { label: 'Completed', status: 'completed' },
];

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function TasksScreen() {
  const { store } = useAuth();
  const { tasks, loading } = useTasks(store?.id);
  const [activeTab, setActiveTab] = useState<TaskStatus>('open');

  const filtered = tasks
    .filter(t => t.status === activeTab)
    .sort((a, b) => {
      const so = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (so !== 0) return so;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="flex flex-col min-h-full px-4 pt-4">
      <PageHeader title="Tasks" subtitle={store?.name} />

      {/* Tab bar */}
      <div className="flex border-b border-border-grey mb-4 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.status
                ? 'text-primark-blue'
                : 'text-mid-grey hover:text-charcoal'
            }`}
          >
            {tab.label}
            {activeTab === tab.status && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primark-blue rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            message={`No ${TABS.find(t => t.status === activeTab)?.label.toLowerCase()} tasks`}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
