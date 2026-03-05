import { useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface Props {
  onCapture: (file: File) => void;
  required?: boolean;
  label?: string;
}

export function PhotoCapture({ onCapture, required, label = 'Take Photo' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    onCapture(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview} alt="Captured" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-charcoal shadow flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            Retake
          </button>
          {fileName && <p className="text-xs text-mid-grey mt-1 px-1">{fileName}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl border-2 border-dashed border-border-grey bg-light-grey text-mid-grey font-medium text-[15px] active:bg-border-grey transition-colors"
        >
          <Camera size={20} />
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
