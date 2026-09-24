import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, Clock, Users, Wind, Phone, MessageCircle, CheckCircle2, XCircle,
  ArrowRight, Car, X, AlertCircle, ShieldCheck, User, Sparkles, Eye, Ban, Play, CircleCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vehicle, Booking, BookingStatus } from '../../types';
import { generateBookingWhatsAppUrl, generateVehicleInquiryWhatsAppUrl } from '../../services/whatsappService';

const STATUS_LABELS: Record<BookingStatus, { label: string; color: string; bg: string; desc: string; icon: React.ReactNode }> = {
  pending:      { label: 'Pending',      color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   desc: 'Your booking is waiting for admin review.', icon: <Clock className="w-4 h-4 text-amber-500" /> },
  under_review: { label: 'Under Review', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',     desc: 'Admin is reviewing your booking request.', icon: <Eye className="w-4 h-4 text-blue-500" /> },
  accepted:     { label: 'Accepted',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', desc: 'Booking accepted! Driver details coming soon.', icon: <CircleCheck className="w-4 h-4 text-emerald-500" /> },
  rejected:     { label: 'Rejected',     color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       desc: 'Sorry, this booking was rejected. Please book again.', icon: <XCircle className="w-4 h-4 text-red-500" /> },
  cancelled:    { label: 'Cancelled',    color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200',   desc: 'This booking was cancelled.', icon: <Ban className="w-4 h-4 text-slate-400" /> },
  completed:    { label: 'Completed',    color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200', desc: 'Trip completed! Thank you for travelling with us.', icon: <Play className="w-4 h-4 text-indigo-500" /> },
};

export const CustomerView: React.FC = () => {
  const {
    vehicles, settings, searchState, setSearchState,
    bookingModalVehicle, openBookingModal, closeBookingModal,
    createBooking, currentUser, loginCustomer, getAdminsForUser
  } = useApp();

  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingPassengers, setBookingPassengers] = useState(1);
  const [bookingDuration, setBookingDuration] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [formError, setFormError] = useState('');

  const quickCities = ["Puri", "Konark", "Chilika", "Daringbadi", "Gopalpur", "Kolkata", "Cuttack", "Sambalpur"];

  useEffect(() => {
    if (currentUser?.role === 'customer') {
      setBookingName(currentUser.name);
      setBookingPhone(currentUser.phone);
    }
  }, [currentUser, bookingModalVehicle]);

  const handleOpenBooking = (vehicle: Vehicle) => {
    setConfirmedBooking(null); setFormError('');
    if (currentUser?.role === 'customer') { setBookingName(currentUser.name); setBookingPhone(currentUser.phone); }
    openBookingModal(vehicle);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!bookingName.trim()) { setFormError('Please enter your full name.'); return; }
    if (!bookingPhone.trim() || bookingPhone.replace(/\D/g, '').length < 10) { setFormError('Please enter a valid 10-digit mobile number.'); return; }
    if (!bookingModalVehicle) return;

    const newBooking = createBooking({
      customer_name: bookingName.trim(),
      customer_phone: bookingPhone.trim(),
      pickup_location: searchState.pickup,
      drop_location: searchState.drop,
      travel_date: searchState.travelDate,
      pickup_time: searchState.pickupTime,
      vehicle_id: bookingModalVehicle.id,
      vehicle_name: bookingModalVehicle.name,
      num_passengers: bookingPassengers,
      booking_duration: bookingDuration.trim() || undefined,
      special_notes: bookingNotes.trim() || undefined
    });
    loginCustomer(bookingName.trim(), bookingPhone.trim());
    setConfirmedBooking(newBooking);
  };

  // Get admins for the current user to show their contact info
  const myAdmins = currentUser?.phone ? getAdminsForUser(currentUser.phone) : [];
  const contactAdmin = myAdmins.find(a => a.contact_phone) || myAdmins[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 sm:pb-8">
      {/* Hero Search */}
      <section className="bg-white border-b border-slate-200 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 mb-1">
              <Sparkles className="w-3 h-3" /><span>Odisha's Most Reliable 24/7 Cab Service</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Book Your Cab in Odisha</h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">Select pickup & destination, choose a verified car, and book with zero advance payment.</p>
          </div>
          <div className="bg-slate-50 p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-emerald-600" />Pickup Location</label>
                <input type="text" placeholder="e.g. Bhubaneswar" value={searchState.pickup} onChange={e => setSearchState(p => ({...p, pickup: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-600" />Destination</label>
                <input type="text" placeholder="e.g. Puri" value={searchState.drop} onChange={e => setSearchState(p => ({...p, drop: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-600" />Travel Date</label>
                <input type="date" value={searchState.travelDate} onChange={e => setSearchState(p => ({...p, travelDate: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" />Pickup Time</label>
                <input type="text" placeholder="08:00 AM" value={searchState.pickupTime} onChange={e => setSearchState(p => ({...p, pickupTime: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-slate-200 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Popular:</span>
              {quickCities.map(city => (
                <button key={city} type="button" onClick={() => setSearchState(p => ({...p, drop: city}))}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-medium border border-slate-200 whitespace-nowrap cursor-pointer active:scale-95">
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Car Fleet */}
      <section className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Available Fleet for {searchState.pickup} â†’ {searchState.drop}</h2>
            <p className="text-xs text-slate-500">Select your preferred car to book or contact us directly.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">{vehicles.filter(v => v.is_available).length} Cars Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between ${!vehicle.is_available ? 'opacity-80 bg-slate-50/80' : ''}`}>
              <div>
                <div className="relative h-44 sm:h-48 w-full bg-slate-100 overflow-hidden">
                  <img src={vehicle.primary_image_url} alt={vehicle.name} className="w-full h-full object-cover" />
                  {vehicle.is_available ? (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase shadow-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Available</span>
                  ) : (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold uppercase shadow-md flex items-center gap-1"><XCircle className="w-3 h-3" />Not Available</span>
                  )}
                </div>
                <div className="p-4 sm:p-5 space-y-2.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{vehicle.name}</h3>
                    {vehicle.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{vehicle.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold"><Users className="w-3.5 h-3.5 text-blue-600" />{vehicle.seating_capacity} Seats</span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100"><Wind className="w-3.5 h-3.5 text-emerald-600" />{vehicle.is_ac ? 'AC' : 'Non-AC'}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 pt-0 space-y-2 border-t border-slate-100 mt-2">
                {vehicle.is_available ? (
                  <button onClick={() => handleOpenBooking(vehicle)} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-blue-700 active:scale-98">
                    <span>Book This Car</span><ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button disabled className="w-full bg-slate-200 text-slate-500 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed">Currently Not Available</button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <a href={generateVehicleInquiryWhatsAppUrl(vehicle, searchState.pickup, searchState.drop, searchState.travelDate, settings)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                    <MessageCircle className="w-3.5 h-3.5" /><span>WhatsApp</span>
                  </a>
                  <a href={`tel:${settings.phone_primary.replace(/\s+/g, '')}`} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /><span>Call Now</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {bookingModalVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold">{confirmedBooking ? 'Booking Submitted!' : `Book ${bookingModalVehicle.name}`}</h3>
                <p className="text-xs text-slate-300">{searchState.pickup} â†’ {searchState.drop} â€¢ {searchState.travelDate}</p>
              </div>
              <button onClick={closeBookingModal} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              {confirmedBooking ? (
                <div className="text-center space-y-4 py-2">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto"><Clock className="w-8 h-8" /></div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-xs font-bold font-mono bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-300">ID: {confirmedBooking.booking_code}</span>
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">â³ Pending Admin Confirmation</span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 pt-1">Booking Request Submitted!</h4>
                    <p className="text-xs text-slate-600">Your request is sent to the admin team. They will confirm and send driver details to <strong>{confirmedBooking.customer_phone}</strong> via WhatsApp.</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <a href={generateBookingWhatsAppUrl(confirmedBooking, settings)} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                      <MessageCircle className="w-4 h-4" /><span>Also Notify Agency on WhatsApp</span>
                    </a>
                    <button onClick={closeBookingModal} className="w-full py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-200">Close</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookSubmit} className="space-y-3.5">
                  {currentUser?.role === 'customer' && (
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 text-xs flex items-center gap-2 border border-blue-200">
                      <User className="w-4 h-4 text-blue-600 shrink-0" /><span>Logged in: <strong>{currentUser.name}</strong> ({currentUser.phone})</span>
                    </div>
                  )}
                  {formError && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                      <input type="text" required placeholder="e.g. Rahul Mohapatra" value={bookingName} onChange={e => setBookingName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Mobile / WhatsApp *</label>
                      <input type="tel" required placeholder="10-digit number" value={bookingPhone} onChange={e => setBookingPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Pickup Location</label>
                      <input type="text" value={searchState.pickup} onChange={e => setSearchState(p => ({...p, pickup: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Destination</label>
                      <input type="text" value={searchState.drop} onChange={e => setSearchState(p => ({...p, drop: e.target.value}))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Users className="w-3 h-3" />No. of Passengers</label>
                      <input type="number" min={1} max={50} value={bookingPassengers} onChange={e => setBookingPassengers(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Clock className="w-3 h-3" />Trip Duration</label>
                      <input type="text" placeholder="e.g. 1 day / 3 hours" value={bookingDuration} onChange={e => setBookingDuration(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Special Notes / Landmark (Optional)</label>
                    <input type="text" placeholder="e.g. Near Railway Station gate 1" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /><span>Pay after trip</span></div>
                    <div className="flex gap-2">
                      <button type="button" onClick={closeBookingModal} className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs cursor-pointer hover:bg-slate-200">Cancel</button>
                      <button type="submit" className="py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700">Confirm Booking</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};