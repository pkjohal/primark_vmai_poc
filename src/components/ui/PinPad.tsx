import { useState } from 'react';
import { Delete } from 'lucide-react';

interface Props {
  onComplete: (pin: string) => void;
  hasError?: boolean;
  onErrorClear?: () => void;
}

export function PinPad({ onComplete, hasError, onErrorClear }: Props) {
  const [digits, setDigits] = useState<string[]>([]);

  const press = (d: string) => {
    if (hasError && onErrorClear) onErrorClear();
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === 4) {
      onComplete(next.join(''));
      setTimeout(() => setDigits([]), 400);
    }
  };

  const backspace = () => {
    if (hasError && onErrorClear) onErrorClear();
    setDigits(prev => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className={`flex flex-col items-center gap-4 ${hasError ? 'animate-shake' : ''}`}>
      {/* Dots */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < digits.length ? 'bg-primark-blue border-primark-blue' : 'border-mid-grey bg-transparent'
            }`}
          />
        ))}
      </div>
      {hasError && (
        <p className="text-danger text-sm font-medium">Incorrect PIN</p>
      )}
      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, idx) => {
          if (k === '') return <div key={idx} />;
          if (k === 'back') {
            return (
              <button
                key={idx}
                onClick={backspace}
                className="w-16 h-16 flex items-center justify-center rounded-xl bg-light-grey text-charcoal font-semibold text-lg active:bg-border-grey transition-colors"
              >
                <Delete size={20} />
              </button>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => press(k)}
              className="w-16 h-16 flex items-center justify-center rounded-xl bg-white border border-border-grey text-navy font-semibold text-2xl shadow-sm active:bg-light-grey transition-colors"
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
