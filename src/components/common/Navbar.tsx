import React from 'react';
import { Car, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { settings, isAdminView, setIsAdminView } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Agency Name */}
          <div 
            onClick={() => setIsAdminView(false)}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                {settings.agency_name}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                {settings.city}, Odisha • 24/7 Cab Service
              </p>
            </div>
          </div>

          {/* Quick Contact & Admin Switcher */}
          <div className="flex items-center gap-2.5">
            {!isAdminView ? (
              <>
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent("Hello " + settings.agency_name + ", I want to book a cab.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp py-2 px-3.5 text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>

                <a
                  href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`}
                  className="btn-primary py-2 px-3.5 text-xs font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call Now</span>
                </a>

                <button
                  onClick={() => setIsAdminView(true)}
                  className="btn-secondary py-2 px-3 text-xs font-semibold cursor-pointer"
                  title="Admin Panel"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Admin</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAdminView(false)}
                className="btn-primary py-2 px-4 text-xs font-semibold cursor-pointer"
              >
                <Car className="w-4 h-4" />
                <span>Customer View</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
