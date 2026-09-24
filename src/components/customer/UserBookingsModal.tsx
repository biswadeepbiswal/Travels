import React from 'react';
import { X, Calendar, MapPin, Car, Phone, MessageCircle, CheckCircle2, Clock, XCircle, Eye, Ban, Play, CircleCheck, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookingStatus } from '../../types';
import { generateBookingWhatsAppUrl } from '../../services/whatsappService';

const STATUS_CFG: Record<BookingStatus, { label: string; color: string; bg: string; border: string; desc: string; icon: React.ReactNode }> = {
  pending:      { label: 'Pending Confirmation', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300', desc: 'Admin is reviewing your request. You will receive WhatsApp confirmation.', icon: <Clock className="w-4 h-4 text-amber-500 animate-pulse" /> },
  under_review: { label: 'Under Review',          color: 'text-blue-800',  bg: 'bg-blue-50',  border: 'border-blue-300',  desc: 'Admin is actively reviewing your booking.', icon: <Eye className="w-4 h-4 text-blue-500" /> },
  accepted:     { label: 'Accepted âœ“',            color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-300', desc: 'Booking confirmed! Driver details will be sent before pickup.', icon: <CircleCheck className="w-4 h-4 text-emerald-600" /> },
  rejected:     { label: 'Rejected',              color: 'text-red-800',   bg: 'bg-red-50',   border: 'border-red-300',   desc: 'This booking was rejected. Please book again or contact us.', icon: <XCircle className="w-4 h-4 text-red-500" /> },
  cancelled:    { label: 'Cancelled',             color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-300', desc: 'This booking was cancelled.', icon: <Ban className="w-4 h-4 text-slate-400" /> },
  completed:    { label: 'Completed ðŸŽ‰',          color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-300', desc: 'Trip completed! Thank you for travelling with us.', icon: <Play className="w-4 h-4 text-indigo-500" /> },
};

export const UserBookingsModal: React.FC = () => {
  const { showUserBookingsModal, setShowUserBookingsModal, bookings, currentUser, settings, getAdminsForUser } = useApp();
  if (!showUserBookingsModal) return null;

  const userBookings = bookings.filter(b => {
    if (!currentUser) return false;
    const userDigits = currentUser.phone.replace(/\D/g, '');
    const bookingDigits = b.customer_phone.replace(/\D/g, '');
    return (userDigits && bookingDigits.includes(userDigits)) || (bookingDigits && userDigits.includes(bookingDigits)) || b.customer_name.toLowerCase() === currentUser.name.toLowerCase();
  });

  // Get the relevant admins for this user
  const myAdmins = currentUser?.phone ? getAdminsForUser(currentUser.phone) : [];
  const primaryAdmin = myAdmins.find(a => a.contact_phone) || myAdmins[0];
  const callNumber = primaryAdmin?.contact_phone || settings.phone_primary;
  const waNumber = primaryAdmin?.contact_whatsapp || settings.whatsapp_number;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Car className="w-5 h-5" /></div>
            <div>
              <h3 className="text-base font-bold">My Cab Bookings & Status</h3>
              <p className="text-xs text-slate-400">{currentUser?.name} â€¢ {currentUser?.phone}</p>
            </div>
          </div>
          <button onClick={() => setShowUserBookingsModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* Contact Admin Bar */}
        <div className="bg-blue-900 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-blue-200 font-medium">Contact your assigned admin:</p>
          <div className="flex gap-2">
            <a href={`tel:${callNumber.replace(/\s+/g,'')}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-600"><Phone className="w-3.5 h-3.5" />Call</a>
            <a href={`sms:${callNumber.replace(/\s+/g,'')}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-600"><Smartphone className="w-3.5 h-3.5" />SMS</a>
            <a href={`https://wa.me/${waNumber.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {userBookings.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto"><Calendar className="w-6 h-6" /></div>
              <div><p className="text-sm font-bold text-slate-700">No Bookings Found</p><p className="text-xs text-slate-500 mt-1">You haven't made any bookings with {currentUser?.phone} yet.</p></div>
              <button onClick={() => setShowUserBookingsModal(false)} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">Browse Cars & Book</button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{userBookings.length} Booking Request{userBookings.length > 1 ? 's' : ''}</p>
              {userBookings.map(b => {
                const cfg = STATUS_CFG[b.status];
                return (
                  <div key={b.id} className={`rounded-2xl border p-4 space-y-3 ${cfg.border} ${cfg.bg}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-900 text-white">{b.booking_code}</span>
                        <span className="font-bold text-sm text-slate-900">{b.vehicle_name}</span>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color} ${cfg.border} bg-white self-start sm:self-auto`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>

                    {/* Status message */}
                    <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${cfg.bg} ${cfg.border}`}>
                      {cfg.icon}<span className={cfg.color}>{cfg.desc}</span>
                    </div>

                    {/* Admin notes visible to user */}
                    {b.admin_notes && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <strong>Admin Message:</strong> {b.admin_notes}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" /><span><strong>Route:</strong> {b.pickup_location} â†’ {b.drop_location}</span></div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span><strong>Date:</strong> {b.travel_date}{b.pickup_time ? ` at ${b.pickup_time}` : ''}</span></div>
                      {b.num_passengers && <div className="flex items-center gap-1.5"><span>ðŸ‘¥ {b.num_passengers} passengers</span></div>}
                    </div>

                    {/* Status history */}
                    {b.status_history && b.status_history.length > 1 && (
                      <details className="group">
                        <summary className="text-[11px] text-slate-500 cursor-pointer font-semibold hover:text-slate-700">ðŸ“‹ View status history ({b.status_history.length} updates)</summary>
                        <div className="mt-2 space-y-1.5 pl-2">
                          {b.status_history.map(h => (
                            <div key={h.id} className="text-[11px] text-slate-600">
                              <span className="font-bold text-slate-800">{STATUS_CFG[h.status]?.label}</span>
                              {h.notes && <span className="text-slate-500"> â€” {h.notes}</span>}
                              <span className="text-slate-400 ml-1">{new Date(h.timestamp).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-[11px] text-slate-400">Booked: {new Date(b.created_at).toLocaleDateString()}</span>
                      <div className="flex gap-2">
                        <a href={generateBookingWhatsAppUrl(b, settings)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700">
                          <MessageCircle className="w-3.5 h-3.5" /><span>Chat</span>
                        </a>
                        <a href={`tel:${callNumber.replace(/\s+/g,'')}`} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-50">
                          <Phone className="w-3.5 h-3.5 text-blue-600" /><span>Call Admin</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center shrink-0">
          <p className="text-xs text-slate-500">Need help? Call <a href={`tel:${callNumber}`} className="font-bold text-blue-600">{callNumber}</a></p>
        </div>
      </div>
    </div>
  );
};