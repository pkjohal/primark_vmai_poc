interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export function ZoomSlider({ min, max, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-white text-xs font-medium w-8 text-center">{min}×</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-primark-blue"
      />
      <span className="text-white text-xs font-medium w-10 text-center">{value.toFixed(1)}×</span>
    </div>
  );
}
