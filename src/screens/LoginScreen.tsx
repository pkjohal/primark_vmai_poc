import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStores } from '../hooks/useStores';
import { PinPad } from '../components/ui/PinPad';
import { supabase } from '../lib/supabase';
import type { Store, User } from '../lib/types';

type Step = 'store' | 'user' | 'pin';

export function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { stores, loading: storesLoading } = useStores(true);

  const [step, setStep] = useState<Step>('store');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [storeUsers, setStoreUsers] = useState<User[]>([]);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!selectedStore) return;
    supabase
      .from('users')
      .select('*')
      .eq('store_id', selectedStore.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setStoreUsers((data ?? []) as User[]));
  }, [selectedStore]);

  const handleStoreSelect = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) return;
    setSelectedStore(store);
    setSelectedUser(null);
    setError('');
    setStep('user');
  };

  const handleUserSelect = (userId: string) => {
    const u = storeUsers.find(u => u.id === userId);
    if (!u) return;
    setSelectedUser(u);
    setError('');
    setStep('pin');
  };

  const handlePin = async (pin: string) => {
    if (!selectedStore || !selectedUser) return;
    setIsLoggingIn(true);
    setError('');
    const ok = await login(selectedStore.id, selectedUser.id, pin);
    setIsLoggingIn(false);
    if (ok) {
      navigate('/scan');
    } else {
      setError('Incorrect PIN. Please try again.');
      setHasError(true);
      setTimeout(() => setHasError(false), 600);
    }
  };

  const handleBack = () => {
    if (step === 'pin') {
      setStep('user');
      setSelectedUser(null);
      setError('');
    } else if (step === 'user') {
      setStep('store');
      setSelectedStore(null);
      setStoreUsers([]);
      setError('');
    }
  };

  if (storesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy to-primark-blue">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-primark-blue flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <p className="font-primark text-primark-blue uppercase leading-none" style={{ fontSize: '42px', letterSpacing: '0.15em' }}>PRIMARK</p>
          <p className="text-white/70 text-sm mt-1">VM.ai — Visual Merchandising Compliance</p>
        </div>

        {/* Step 1: Store */}
        {step === 'store' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-navy mb-5 text-center">Select Your Store</h2>
            <select
              defaultValue=""
              onChange={e => e.target.value && handleStoreSelect(e.target.value)}
              className="w-full border-2 border-border-grey rounded-xl px-4 py-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20 bg-white"
            >
              <option value="" disabled>Select a store...</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Step 2: User */}
        {step === 'user' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-mid-grey hover:text-charcoal mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy leading-none">Select Colleague</h2>
                <p className="text-xs text-mid-grey mt-0.5">{selectedStore?.name}</p>
              </div>
            </div>
            <select
              defaultValue=""
              onChange={e => e.target.value && handleUserSelect(e.target.value)}
              className="w-full border-2 border-border-grey rounded-xl px-4 py-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20 bg-white"
            >
              <option value="" disabled>Select your name...</option>
              {storeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        )}

        {/* Step 3: PIN */}
        {step === 'pin' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-sm text-mid-grey hover:text-charcoal mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy leading-none">Enter Your PIN</h2>
                <p className="text-xs text-mid-grey mt-0.5">{selectedUser?.name} · {selectedStore?.name}</p>
              </div>
            </div>
            <div className="flex justify-center mb-4">
              {isLoggingIn ? (
                <p className="text-mid-grey text-sm py-8">Verifying...</p>
              ) : (
                <PinPad
                  onComplete={handlePin}
                  hasError={hasError}
                  onErrorClear={() => { setHasError(false); setError(''); }}
                />
              )}
            </div>
            {error && <p className="text-danger text-sm text-center font-medium">{error}</p>}
          </div>
        )}

        <p className="text-center text-white/50 text-xs mt-6">
          Internal use only · Authorised personnel only
        </p>
      </div>
    </div>
  );
}
