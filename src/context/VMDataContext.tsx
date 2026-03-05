import React, { createContext, useContext, useEffect, useState } from 'react';
import type { VMProduct } from '../lib/types';

interface VMDataContextValue {
  products: VMProduct[];
  isLoading: boolean;
  error: string | null;
  getProductByEAN: (ean: string) => VMProduct | undefined;
}

const VMDataContext = createContext<VMDataContextValue | null>(null);

export function VMDataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<VMProduct[]>([]);
  const [eanMap, setEanMap] = useState<Map<string, VMProduct>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/vm_product_data.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load VM product data');
        return r.json();
      })
      .then((data: { products: VMProduct[] }) => {
        const list = data.products ?? [];
        setProducts(list);
        const map = new Map<string, VMProduct>();
        list.forEach(p => map.set(p.ean13, p));
        setEanMap(map);
      })
      .catch(e => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const getProductByEAN = (ean: string) => eanMap.get(ean);

  return (
    <VMDataContext.Provider value={{ products, isLoading, error, getProductByEAN }}>
      {children}
    </VMDataContext.Provider>
  );
}

export function useVMData() {
  const ctx = useContext(VMDataContext);
  if (!ctx) throw new Error('useVMData must be used within VMDataProvider');
  return ctx;
}
