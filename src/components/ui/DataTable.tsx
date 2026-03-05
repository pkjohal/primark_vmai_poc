import { ClipboardList } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  keyFn: (row: T) => string;
}

export function DataTable<T>({ columns, data, emptyMessage = 'No data found.', keyFn }: Props<T>) {
  if (data.length === 0) {
    return <EmptyState icon={ClipboardList} message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-grey">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-light-grey border-b border-border-grey">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-mid-grey whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={keyFn(row)} className="border-b border-border-grey last:border-0 hover:bg-light-grey/50">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-charcoal">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
