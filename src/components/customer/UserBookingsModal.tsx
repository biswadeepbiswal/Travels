import React from 'react';
import { X, Calendar, MapPin, Car, Phone, MessageCircle, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateBookingWhatsAppUrl } from '../../services/whatsappService';

export const UserBookingsModal: React.FC = () => {
  const { 
    showUserBookingsModal, 
    setShowUserBookingsModal, 
    bookings, 
    currentUser, 
    settings 
  } = useApp();

  if (!showUserBookingsModal) return null;

  // Filter bookings for current user's phone or matching name
  const userBookings = bookings.filter(b => {
    if (!currentUser) return false;
    const userPhoneDigits = currentUser.phone.replace(/\D/g, '');
    const bookingPhoneDigits = b.customer_phone.replace(/\D/g, '');
    return (
      (userPhoneDigits && bookingPhoneDigits.includes(userPhoneDigits)) ||
      (bookingPhoneDigits && userPhoneDigits.includes(bookingPhoneDigits)) ||
      b.customer_name.toLowerCase() === currentUser.name.toLowerCase()
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-white">
                My Cab Bookings & Status
              </h3>
              <p className="text-xs text-slate-400">
                Registered Profile: <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.phone})
              </p>
            </div>
          </div>

          <button 
            onClick={() => setShowUserBookingsModal(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {userBookings.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No Bookings Found</p>
                <p className="text-xs text-slate-500 mt-1">
                  You haven't made any booking requests with {currentUser?.phone} yet.
                </p>
              </div>
              <button
                onClick={() => setShowUserBookingsModal(false)}
                className="btn-primary py-2 px-4 text-xs font-bold"
              >
                Browse Cars & Book
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {userBookings.length} Booking Request{userBookings.length > 1 ? 's' : ''}
              </p>

              {userBookings.map(b => (
                <div 
                  key={b.id}
                  className={`card-clean p-4 border transition-all space-y-3 ${
                    b.status === 'confirmed' 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : b.status === 'cancelled'
                      ? 'border-red-200 bg-red-50/20'
                      : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-white">
                        {b.booking_code}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {b.vehicle_name}
                      </span>
                    </div>

                    {/* Dynamic Status Badge */}
                    {b.status === 'confirmed' ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 self-start sm:self-auto">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ✅ Confirmed by Admin
                      </span>
                    ) : b.status === 'cancelled' ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 self-start sm:self-auto">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        ❌ Cancelled
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 self-start sm:self-auto animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        ⏳ Pending Admin Confirmation
                      </span>
                    )}
                  </div>

                  {/* Status Helper Message */}
                  {b.status === 'pending' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Admin is reviewing your trip. Once approved, you will receive a confirmation message on WhatsApp (<strong>{b.customer_phone}</strong>).</span>
                    </div>
                  )}

                  {b.status === 'confirmed' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cab is reserved! Driver details will be sent before pickup.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>Route:</strong> {b.pickup_location} → {b.drop_location}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span><strong>Date & Time:</strong> {b.travel_date} {b.pickup_time ? `at ${b.pickup_time}` : ''}</span>
                    </div>
                  </div>

                  {b.special_notes && (
                    <p className="text-[11px] bg-white p-2 rounded-lg text-slate-600 border border-slate-200">
                      <strong>Special Request:</strong> {b.special_notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Booked on: {new Date(b.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={generateBookingWhatsAppUrl(b, settings)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp py-1.5 px-2.5 text-[11px] font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`}
                        className="btn-secondary py-1.5 px-2.5 text-[11px] font-bold"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call Agency</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <p className="text-xs text-slate-500">
            For urgent assistance or modifications, call us at <a href={`tel:${settings.phone_primary}`} className="font-bold text-blue-600">{settings.phone_primary}</a>
          </p>
        </div>

      </div>
    </div>
  );
};
