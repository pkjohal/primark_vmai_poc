interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  children?: React.ReactNode;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, variant = 'default', children }: Props) {
  const confirmStyle =
    variant === 'danger'
      ? 'bg-danger text-white hover:bg-red-600'
      : 'bg-primark-blue text-white hover:bg-primark-blue-dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-navy">{title}</h2>
          <p className="text-[15px] text-mid-grey mt-1">{message}</p>
        </div>
        {children}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[44px] rounded-lg border border-border-grey text-charcoal font-semibold text-sm hover:bg-light-grey transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 min-h-[44px] rounded-lg font-semibold text-sm transition-colors ${confirmStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
