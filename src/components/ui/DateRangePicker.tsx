import { format, subDays } from 'date-fns';

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const presets = [
    { label: '7d', days: 7 },
    { label: '14d', days: 14 },
    { label: '30d', days: 30 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-2">
        {presets.map(p => (
          <button
            key={p.days}
            onClick={() => onChange(format(subDays(new Date(), p.days - 1), 'yyyy-MM-dd'), today)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-grey bg-white text-charcoal hover:bg-light-grey transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <input
        type="date"
        value={from}
        max={to}
        onChange={e => onChange(e.target.value, to)}
        className="text-sm border border-border-grey rounded-lg px-2 py-1.5 text-charcoal min-h-[36px]"
      />
      <span className="text-mid-grey text-sm">–</span>
      <input
        type="date"
        value={to}
        min={from}
        max={today}
        onChange={e => onChange(from, e.target.value)}
        className="text-sm border border-border-grey rounded-lg px-2 py-1.5 text-charcoal min-h-[36px]"
      />
    </div>
  );
}
