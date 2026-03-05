import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Store } from '../lib/types';

export function useStores(activeOnly = true) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    setLoading(true);
    let q = supabase.from('stores').select('*').order('name');
    if (activeOnly) q = q.eq('is_active', true);
    const { data } = await q;
    setStores((data ?? []) as Store[]);
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, [activeOnly]);

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('stores').update({ is_active: isActive }).eq('id', id);
    await fetchStores();
  };

  const createStore = async (data: Partial<Store>) => {
    await supabase.from('stores').insert(data);
    await fetchStores();
  };

  return { stores, loading, refetch: fetchStores, toggleActive, createStore };
}
