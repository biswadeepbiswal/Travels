import React from 'react';
import { Phone, MessageCircle, Calendar, User, Car } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { 
    settings, 
    currentUser, 
    setShowAuthModal, 
    setAuthModalTab, 
    setShowUserBookingsModal 
  } = useApp();

  const isCustomer = currentUser?.role === 'customer';

  const scrollToSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      
      {/* 1. Book / Fleet */}
      <button
        onClick={scrollToSearch}
        className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-blue-600 transition-colors"
      >
        <Car className="w-5 h-5 text-blue-600" />
        <span className="text-[10px] font-bold mt-0.5">Book Cab</span>
      </button>

      {/* 2. Direct Call */}
      <a
        href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`}
        className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-blue-600 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
          <Phone className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold mt-0.5 text-blue-700">Call Now</span>
      </a>

      {/* 3. Direct WhatsApp */}
      <a
        href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent("Hello " + settings.agency_name + ", I want to book a cab.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-emerald-600 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
          <MessageCircle className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold mt-0.5 text-emerald-700">WhatsApp</span>
      </a>

      {/* 4. My Bookings / Login */}
      {isCustomer ? (
        <button
          onClick={() => setShowUserBookingsModal(true)}
          className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-blue-600 transition-colors"
        >
          <Calendar className="w-5 h-5 text-slate-600" />
          <span className="text-[10px] font-bold mt-0.5">Bookings</span>
        </button>
      ) : (
        <button
          onClick={() => {
            setAuthModalTab('customer');
            setShowAuthModal(true);
          }}
          className="flex flex-col items-center justify-center p-1.5 text-slate-700 hover:text-blue-600 transition-colors"
        >
          <User className="w-5 h-5 text-slate-600" />
          <span className="text-[10px] font-bold mt-0.5">Sign In</span>
        </button>
      )}

    </div>
  );
};
