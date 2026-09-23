import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { CustomerView } from './components/customer/CustomerView';
import { AdminView } from './components/admin/AdminView';
import { AuthModal } from './components/common/AuthModal';
import { UserBookingsModal } from './components/customer/UserBookingsModal';
import { Lock, Phone, MessageCircle, Headphones } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    currentUser, 
    settings, 
    setShowAuthModal, 
    setAuthModalTab 
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdmin ? <AdminView /> : <CustomerView />}
      </main>

      {/* Customer Footer */}
      {!isAdmin && (
        <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="font-bold text-slate-700">© {new Date().getFullYear()} {settings.agency_name}. All rights reserved.</p>
              <p className="text-[11px] text-slate-400">{settings.address}, {settings.city}, Odisha</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              {settings.helpline_number && (
                <>
                  <a href={`tel:${settings.helpline_number.replace(/\s+/g, '')}`} className="text-purple-600 font-bold hover:underline flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>24/7 Helpline: {settings.helpline_number}</span>
                  </a>
                  <span>•</span>
                </>
              )}

              <a href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`} className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Call: {settings.phone_primary}</span>
              </a>
              <span>•</span>
              <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Us</span>
              </a>
              <span>•</span>
              <button
                onClick={() => {
                  setAuthModalTab('admin');
                  setShowAuthModal(true);
                }}
                className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Modals */}
      <AuthModal />
      <UserBookingsModal />

    </div>
  );
};

export default App;
