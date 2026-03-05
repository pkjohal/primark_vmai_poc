interface Props {
  value: string | number;
  label: string;
  colour?: 'blue' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const colourMap: Record<string, string> = {
  blue: 'text-primark-blue',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function StatCard({ value, label, colour = 'blue', subtitle }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex-shrink-0 min-w-[140px]">
      <p className={`text-4xl font-bold ${colourMap[colour]}`}>{value}</p>
      <p className="text-[13px] font-medium uppercase tracking-wide text-mid-grey mt-1">{label}</p>
      {subtitle && <p className="text-xs text-mid-grey mt-0.5">{subtitle}</p>}
    </div>
  );
}
