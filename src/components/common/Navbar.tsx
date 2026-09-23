import React from 'react';
import { Car, Phone, MessageCircle, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { 
    settings, 
    isAdminView, 
    setShowAdminLoginModal, 
    logoutAdmin 
  } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={logoutAdmin}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  {settings.agency_name}
                </span>
                {isAdminView && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {settings.city}, Odisha • 24/7 Cab Service
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {!isAdminView ? (
              <>
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent("Hello " + settings.agency_name + ", I want to book a cab.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp py-2 px-3 text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>

                <a
                  href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`}
                  className="btn-primary py-2 px-3 text-xs font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call Us</span>
                </a>

                {/* Clear Admin Login Trigger Button */}
                <button
                  onClick={() => setShowAdminLoginModal(true)}
                  className="btn-secondary py-2 px-3 text-xs font-semibold cursor-pointer"
                  title="Agency Admin Login"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Admin Login</span>
                </button>
              </>
            ) : (
              <button
                onClick={logoutAdmin}
                className="btn-secondary py-2 px-3.5 text-xs font-bold text-slate-700 hover:text-red-600 cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout (Customer View)</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
