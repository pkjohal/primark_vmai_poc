import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  message: string;
  cta?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, cta }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
      <Icon size={48} className="text-border-grey" />
      <p className="text-mid-grey text-[15px]">{message}</p>
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
