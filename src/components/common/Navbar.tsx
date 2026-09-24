import React from 'react';
import { 
  Car, 
  Phone, 
  MessageCircle, 
  Lock, 
  LogOut, 
  User, 
  Calendar,
  ShieldCheck,
  Headphones,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

import { matchPhones } from '../../data/defaultData';

export const Navbar: React.FC = () => {
  const { 
    settings, 
    currentUser,
    admins,
    loginAdminDirectly,
    logout,
    setShowAuthModal,
    setAuthModalTab,
    setShowUserBookingsModal
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const isCustomer = currentUser?.role === 'customer';
  const matchedAdmin = isCustomer && currentUser?.phone
    ? admins.find(a => matchPhones(a.phone, currentUser.phone) && a.is_active)
    : null;

  const handleOpenAdminLogin = () => {
    setAuthModalTab('admin');
    setShowAuthModal(true);
  };

  const handleOpenCustomerLogin = () => {
    setAuthModalTab('customer');
    setShowAuthModal(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 select-none min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate">
                  {settings.agency_name}
                </span>
                {isAdmin && (
                  <span className="text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-200 flex items-center shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                {settings.city}, Odisha • 24/7 Cab Service
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* 1. If Admin is Logged In */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-slate-600 font-medium">Admin:</span>
                  <span className="font-bold text-slate-900">{currentUser.name}</span>
                </div>

                <button
                  onClick={logout}
                  className="btn-secondary py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs font-bold text-slate-700 hover:text-red-600 cursor-pointer flex items-center gap-1"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Logout</span>
                </button>
              </div>
            ) : (
              /* 2. Customer or Guest Actions */
              <div className="flex items-center gap-1.5 sm:gap-2">
                
                {/* 24/7 Helpline Link (Desktop & Tablet) */}
                {settings.helpline_number && (
                  <a
                    href={`tel:${settings.helpline_number.replace(/\s+/g, '')}`}
                    className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200 transition-colors"
                    title="24/7 Helpline"
                  >
                    <Headphones className="w-3.5 h-3.5 text-purple-600" />
                    <span>Helpline</span>
                  </a>
                )}

                {/* WhatsApp Button */}
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent("Hello " + settings.agency_name + ", I want to book a cab.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>

                {/* Call Dispatch Button */}
                <a
                  href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`}
                  className="btn-primary py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Call Us</span>
                </a>

                {/* Customer Logged In Controls */}
                {isCustomer ? (
                  <div className="flex items-center gap-1.5">
                    {/* If this customer is also an admin, show 1-click switch button! */}
                    {matchedAdmin && (
                      <button
                        onClick={() => loginAdminDirectly(matchedAdmin)}
                        className="btn-primary py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Registered Admin! Click to open Admin Panel"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden xs:inline">Admin Panel</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowUserBookingsModal(true)}
                      className="hidden xs:flex btn-secondary py-1.5 px-2 sm:py-2 sm:px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 border-blue-200 cursor-pointer items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>My Trips</span>
                    </button>

                    <button
                      onClick={handleOpenAdminLogin}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Admin Login"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={logout}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Guest User Controls */
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleOpenCustomerLogin}
                      className="btn-secondary py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>Login</span>
                    </button>

                    <button
                      onClick={handleOpenAdminLogin}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                      title="Admin Login"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
