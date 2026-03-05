import type { VMProduct } from '../../lib/types';
import { resolveImagePath, formatPrice } from '../../lib/utils';

interface Props { product: VMProduct }

export function VMGuidelineCard({ product }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* VM reference image */}
      <div className="relative bg-light-grey">
        <img
          src={resolveImagePath(product.vm_image)}
          alt={`VM guideline for ${product.description}`}
          className="w-full object-contain max-h-72"
          style={{ touchAction: 'pinch-zoom' }}
          onError={e => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0YzRjRGNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNkI3MjgwIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
          }}
        />
      </div>
      {/* Product details */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-navy">{product.description}</h2>
            <p className="text-sm text-mid-grey">{product.identifier_type}: {product.identifier}</p>
          </div>
          <span className="bg-primark-blue-light text-primark-blue text-xs font-medium px-2 py-1 rounded-md flex-shrink-0">
            {product.department}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-semibold text-navy">{formatPrice(product.price_aed, product.price_gbp)}</p>
        </div>
        <div className="border-t border-border-grey pt-2">
          <p className="text-[13px] font-medium uppercase tracking-wide text-mid-grey">{product.campaign}</p>
          <p className="text-xs text-mid-grey mt-0.5">Ref: {product.source_ref} · Page {product.source_page}</p>
        </div>
      </div>
    </div>
  );
}
