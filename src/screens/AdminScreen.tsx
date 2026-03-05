import { useState } from 'react';
import { useStores } from '../hooks/useStores';
import { useUsers } from '../hooks/useUsers';
import { DataTable } from '../components/ui/DataTable';
import { PageHeader } from '../components/layout/PageHeader';
import { useToast } from '../context/ToastContext';
import type { User, Store, UserRole } from '../lib/types';
import { ROLE_LABELS } from '../lib/types';

type Tab = 'users' | 'stores';

export function AdminScreen() {
  const [tab, setTab] = useState<Tab>('users');
  const { stores, loading: storesLoading, toggleActive: toggleStore, createStore } = useStores(false);
  const { users, loading: usersLoading, toggleActive: toggleUser, createUser } = useUsers();
  const { showToast } = useToast();

  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', pin: '', store_id: '', role: 'store_colleague' as UserRole });
  const [newStore, setNewStore] = useState({ name: '', store_code: '', region: '' });

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || newUser.pin.length !== 4 || !newUser.store_id) {
      showToast('Please fill all required fields. PIN must be 4 digits.', 'error');
      return;
    }
    try {
      await createUser(newUser);
      showToast('User created', 'success');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', pin: '', store_id: '', role: 'store_colleague' });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create user', 'error');
    }
  };

  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.store_code) {
      showToast('Name and store code are required.', 'error');
      return;
    }
    await createStore({ ...newStore, is_active: true });
    showToast('Store created', 'success');
    setShowAddStore(false);
    setNewStore({ name: '', store_code: '', region: '' });
  };

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (u: User) => ROLE_LABELS[u.role] },
    { key: 'store', label: 'Store', render: (u: User & { store?: Store }) => u.store?.name ?? '—' },
    {
      key: 'is_active', label: 'Status',
      render: (u: User) => (
        <button
          onClick={() => toggleUser(u.id, !u.is_active)}
          className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? 'bg-success-bg text-success' : 'bg-light-grey text-mid-grey'}`}
        >
          {u.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ];

  const storeColumns = [
    { key: 'name', label: 'Name' },
    { key: 'store_code', label: 'Code' },
    { key: 'region', label: 'Region', render: (s: Store) => s.region ?? '—' },
    {
      key: 'is_active', label: 'Status',
      render: (s: Store) => (
        <button
          onClick={() => toggleStore(s.id, !s.is_active)}
          className={`text-xs px-2 py-1 rounded-full font-medium ${s.is_active ? 'bg-success-bg text-success' : 'bg-light-grey text-mid-grey'}`}
        >
          {s.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-4 gap-4">
      <PageHeader title="Admin" />

      {/* Tab bar */}
      <div className="flex border-b border-border-grey">
        {(['users', 'stores'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors relative capitalize ${
              tab === t ? 'text-primark-blue' : 'text-mid-grey hover:text-charcoal'
            }`}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primark-blue rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddUser(v => !v)}
              className="min-h-[40px] px-4 rounded-xl bg-primark-blue text-white font-semibold text-sm"
            >
              {showAddUser ? 'Cancel' : '+ Add User'}
            </button>
          </div>
          {showAddUser && (
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
              <h3 className="text-base font-semibold text-navy">New User</h3>
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'email@primark.com' },
                { label: 'PIN (4 digits)', key: 'pin', type: 'text', placeholder: '0000', maxLength: 4 },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-mid-grey uppercase tracking-wide">{f.label}</label>
                  <input
                    type={f.type}
                    value={(newUser as Record<string, string>)[f.key]}
                    onChange={e => setNewUser(u => ({ ...u, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    className="min-h-[44px] rounded-xl border border-border-grey px-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-mid-grey uppercase tracking-wide">Store</label>
                <select
                  value={newUser.store_id}
                  onChange={e => setNewUser(u => ({ ...u, store_id: e.target.value }))}
                  className="min-h-[44px] rounded-xl border border-border-grey px-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue"
                >
                  <option value="">Select store...</option>
                  {stores.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-mid-grey uppercase tracking-wide">Role</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value as UserRole }))}
                  className="min-h-[44px] rounded-xl border border-border-grey px-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue"
                >
                  {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreateUser}
                className="w-full min-h-[48px] rounded-xl bg-primark-blue text-white font-semibold text-[15px]"
              >
                Create User
              </button>
            </div>
          )}
          {usersLoading ? (
            <div className="h-48 animate-pulse bg-white rounded-xl" />
          ) : (
            <DataTable columns={userColumns} data={users as (User & { store?: Store })[]} keyFn={u => u.id} emptyMessage="No users found." />
          )}
        </div>
      )}

      {/* Stores tab */}
      {tab === 'stores' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddStore(v => !v)}
              className="min-h-[40px] px-4 rounded-xl bg-primark-blue text-white font-semibold text-sm"
            >
              {showAddStore ? 'Cancel' : '+ Add Store'}
            </button>
          </div>
          {showAddStore && (
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
              <h3 className="text-base font-semibold text-navy">New Store</h3>
              {[
                { label: 'Name', key: 'name', placeholder: 'Store name' },
                { label: 'Store Code', key: 'store_code', placeholder: 'e.g. MAN01' },
                { label: 'Region', key: 'region', placeholder: 'e.g. North West' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-mid-grey uppercase tracking-wide">{f.label}</label>
                  <input
                    type="text"
                    value={(newStore as Record<string, string>)[f.key]}
                    onChange={e => setNewStore(s => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="min-h-[44px] rounded-xl border border-border-grey px-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue"
                  />
                </div>
              ))}
              <button
                onClick={handleCreateStore}
                className="w-full min-h-[48px] rounded-xl bg-primark-blue text-white font-semibold text-[15px]"
              >
                Create Store
              </button>
            </div>
          )}
          {storesLoading ? (
            <div className="h-48 animate-pulse bg-white rounded-xl" />
          ) : (
            <DataTable columns={storeColumns} data={stores} keyFn={s => s.id} emptyMessage="No stores found." />
          )}
        </div>
      )}
    </div>
  );
}
