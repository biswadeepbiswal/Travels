import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { CustomerView } from './components/customer/CustomerView';
import { AdminView } from './components/admin/AdminView';

export const App: React.FC = () => {
  const { isAdminView, settings } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content: Admin View OR Customer Booking View */}
      <main className="flex-1">
        {isAdminView ? <AdminView /> : <CustomerView />}
      </main>

      {/* Simple Clean Footer */}
      {!isAdminView && (
        <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} {settings.agency_name}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Hotline: <strong className="text-slate-700">{settings.phone_primary}</strong></span>
              <span>•</span>
              <span>WhatsApp: <strong className="text-emerald-700">{settings.whatsapp_number}</strong></span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
