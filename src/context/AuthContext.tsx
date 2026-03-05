import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Store, User, UserRole } from '../lib/types';

interface AuthContextValue {
  store: Store | null;
  user: User | null;
  isStoreColleague: boolean;
  isVMManager: boolean;
  isStoreManager: boolean;
  isAdmin: boolean;
  canViewTasks: boolean;
  canManageTasks: boolean;
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageStores: boolean;
  canViewAllStores: boolean;
  login: (storeId: string, userId: string, pin: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TASK_ROLES: UserRole[] = ['vm_manager', 'store_manager', 'admin'];
const DASHBOARD_ROLES: UserRole[] = ['store_manager', 'admin'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);

  const login = useCallback(async (storeId: string, userId: string, pin: string): Promise<boolean> => {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single();

    if (!userData || userData.pin !== pin) return false;

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (!storeData) return false;

    setUser(userData as User);
    setStore(storeData as Store);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setStore(null);
  }, []);

  const role = user?.role ?? 'store_colleague';

  const value: AuthContextValue = {
    store,
    user,
    isStoreColleague: role === 'store_colleague',
    isVMManager: role === 'vm_manager',
    isStoreManager: role === 'store_manager',
    isAdmin: role === 'admin',
    canViewTasks: TASK_ROLES.includes(role),
    canManageTasks: TASK_ROLES.includes(role),
    canViewDashboard: DASHBOARD_ROLES.includes(role),
    canManageUsers: role === 'admin',
    canManageStores: role === 'admin',
    canViewAllStores: role === 'admin',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
