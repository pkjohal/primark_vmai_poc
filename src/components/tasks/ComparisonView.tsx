import { resolveImagePath } from '../../lib/utils';

interface Props {
  guidelineImage: string | null;
  actualPhoto: string | null;
  guidelineLabel?: string;
  actualLabel?: string;
}

function ImageBox({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1">
      <p className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">{label}</p>
      {src ? (
        <img
          src={src}
          alt={label}
          className="w-full object-contain rounded-xl bg-light-grey"
        />
      ) : (
        <div className="w-full aspect-video rounded-xl bg-light-grey flex items-center justify-center text-mid-grey text-sm">
          No image
        </div>
      )}
    </div>
  );
}

export function ComparisonView({ guidelineImage, actualPhoto, guidelineLabel = 'VM Guideline', actualLabel = 'Actual Display' }: Props) {
  const guidelineSrc = guidelineImage ? resolveImagePath(guidelineImage) : null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <ImageBox src={guidelineSrc} label={guidelineLabel} />
      <ImageBox src={actualPhoto} label={actualLabel} />
    </div>
  );
}
