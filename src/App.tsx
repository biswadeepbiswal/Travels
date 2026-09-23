import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { CustomerView } from './components/customer/CustomerView';
import { AdminView } from './components/admin/AdminView';
import { Lock, ShieldCheck, X, KeyRound } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    isAdminView, 
    settings, 
    showAdminLoginModal, 
    setShowAdminLoginModal, 
    loginAdmin 
  } = useApp();

  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(pin);
    if (success) {
      setPin('');
      setLoginError('');
    } else {
      setLoginError('Incorrect PIN! (Default PIN is 1234)');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdminView ? <AdminView /> : <CustomerView />}
      </main>

      {/* Customer Footer */}
      {!isAdminView && (
        <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="font-bold text-slate-700">© {new Date().getFullYear()} {settings.agency_name}. All rights reserved.</p>
              <p className="text-[11px] text-slate-400">{settings.address}, {settings.city}</p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <a href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`} className="text-blue-600 font-semibold hover:underline">
                Call: {settings.phone_primary}
              </a>
              <span>•</span>
              <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline">
                WhatsApp Us
              </a>
              <span>•</span>
              <button
                onClick={() => setShowAdminLoginModal(true)}
                className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Agency Admin Login</span>
              </div>
              <button 
                onClick={() => { setShowAdminLoginModal(false); setLoginError(''); setPin(''); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">
                Enter your 4-digit PIN to access fleet & bookings.
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-3">
              <div className="space-y-1">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter PIN (Default: 1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input-clean text-center font-bold tracking-widest text-base"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-600 font-semibold text-center">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full btn-primary py-2.5 text-xs font-bold shadow-md cursor-pointer"
              >
                Login to Admin Dashboard
              </button>
            </form>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-[11px] text-slate-500">
              Default Admin PIN: <strong className="text-slate-800 font-mono">1234</strong>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;
