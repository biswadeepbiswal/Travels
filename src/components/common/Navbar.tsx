import React, { useState, useEffect } from 'react';
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

export const Navbar: React.FC = () => {
  const { 
    settings, 
    currentUser,
    logout,
    setShowAuthModal,
    setAuthModalTab,
    setShowUserBookingsModal
  } = useApp();

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert("To install on your phone:\n1. Open Chrome/Safari menu (three dots or share button)\n2. Tap 'Add to Home screen' or 'Install App'.");
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isCustomer = currentUser?.role === 'customer';

  const handleOpenAdminLogin = () => {
    setAuthModalTab('admin');
    setShowAuthModal(true);
  };

  const handleOpenCustomerLogin = () => {
    setAuthModalTab('customer');
    setShowAuthModal(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  {settings.agency_name}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {settings.city}, Odisha • 24/7 Helpline: <strong className="text-slate-700">{settings.helpline_number || settings.phone_primary}</strong>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            
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
                  className="btn-secondary py-2 px-3 text-xs font-bold text-slate-700 hover:text-red-600 cursor-pointer flex items-center gap-1.5"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              /* 2. If Customer or Guest */
              <div className="flex items-center gap-2">
                
                {/* 100% Free Install App Button */}
                <button
                  onClick={handleInstallApp}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                  title="Install Mohanty Travels Free on your Phone"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Install App Free</span>
                </button>

                {/* 24/7 Helpline Button (Desktop) */}
                {settings.helpline_number && (
                  <a
                    href={`tel:${settings.helpline_number.replace(/\s+/g, '')}`}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200 transition-colors"
                    title="24/7 Agency Emergency Helpline"
                  >
                    <Headphones className="w-3.5 h-3.5 text-purple-600" />
                    <span>Helpline</span>
                  </a>
                )}

                {/* WhatsApp button */}
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent("Hello " + settings.agency_name + ", I want to book a cab.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp py-2 px-3 text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden md:inline">WhatsApp</span>
                </a>

                {/* Call Us button */}
                <a
                  href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`}
                  className="btn-primary py-2 px-3 text-xs font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden md:inline">Call Dispatch</span>
                </a>

                {/* Logged in Customer Actions */}
                {isCustomer ? (
                  <>
                    <button
                      onClick={() => setShowUserBookingsModal(true)}
                      className="btn-secondary py-2 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 border-blue-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">My Bookings</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200 text-xs font-bold">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{currentUser.name}</span>
                    </div>

                    <button
                      onClick={logout}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  /* Guest User - Show Customer Login & Admin Login */
                  <>
                    <button
                      onClick={handleOpenCustomerLogin}
                      className="btn-secondary py-2 px-3 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>Login</span>
                    </button>

                    <button
                      onClick={handleOpenAdminLogin}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                      title="Agency Multi-Admin Login"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  </>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
