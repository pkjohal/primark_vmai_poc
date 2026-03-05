import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../lib/types';

export function useUsers(storeId?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('users')
      .select('*, store:stores(id,name)')
      .order('name');
    if (storeId) q = q.eq('store_id', storeId);
    const { data } = await q;
    setUsers((data ?? []) as User[]);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('users').update({ is_active: isActive }).eq('id', id);
    await fetchUsers();
  };

  const createUser = async (data: {
    name: string; email: string; pin: string;
    store_id: string; role: UserRole;
  }) => {
    const { error } = await supabase.from('users').insert({ ...data, is_active: true });
    if (error) throw error;
    await fetchUsers();
  };

  return { users, loading, refetch: fetchUsers, toggleActive, createUser };
}
