import React, { useState, useRef } from 'react';
import { 
  Car, 
  Plus, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Phone, 
  MessageCircle, 
  Save, 
  X, 
  LogOut, 
  Image as ImageIcon,
  ClipboardList,
  Settings,
  MapPin,
  Building2,
  ShieldCheck,
  Clock,
  Send,
  Check,
  Headphones,
  UserCheck,
  Sparkles,
  RefreshCw,
  Wifi
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vehicle, AgencySettings, Booking } from '../../types';
import { generateAdminBookingConfirmationWhatsAppUrl } from '../../services/whatsappService';

export const AdminView: React.FC = () => {
  const { 
    vehicles, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle, 
    toggleVehicleAvailability,
    bookings, 
    updateBookingStatus,
    deleteBooking, 
    settings, 
    updateSettings,
    currentUser,
    logout,
    isSyncing,
    refreshFromCloud
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cars' | 'bookings' | 'profile'>('cars');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Car Form State
  const [name, setName] = useState('');
  const [seating, setSeating] = useState(7);
  const [isAc, setIsAc] = useState(true);
  const [imagePreview, setImagePreview] = useState('https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<AgencySettings>(settings);
  const [profileSaved, setProfileSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'pending') return b.status === 'pending';
    if (bookingFilter === 'confirmed') return b.status === 'confirmed';
    return true;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setSeating(7);
    setIsAc(true);
    setImagePreview('https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80');
    setDescription('');
    setIsAvailable(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setName(v.name);
    setSeating(v.seating_capacity);
    setIsAc(v.is_ac);
    setImagePreview(v.primary_image_url);
    setDescription(v.description || '');
    setIsAvailable(v.is_available);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      updateVehicle({
        id: editingId,
        name: name.trim(),
        seating_capacity: Number(seating),
        is_ac: isAc,
        primary_image_url: imagePreview,
        is_available: isAvailable,
        description: description.trim() || undefined
      });
    } else {
      addVehicle({
        id: `veh-${Date.now()}`,
        name: name.trim(),
        seating_capacity: Number(seating),
        is_ac: isAc,
        primary_image_url: imagePreview,
        is_available: isAvailable,
        description: description.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleConfirmAndSendWhatsApp = (booking: Booking) => {
    updateBookingStatus(booking.id, 'confirmed');
    const url = generateAdminBookingConfirmationWhatsAppUrl(booking, settings);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 font-display">
                  Admin Control Panel
                </h1>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                {currentUser ? (
                  <span>
                    Active: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.phone})
                  </span>
                ) : (
                  <span>{settings.agency_name}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Cloud Sync Button */}
            <button
              onClick={() => refreshFromCloud()}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh and sync bookings across all customer phones"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>

            <button
              onClick={logout}
              className="btn-secondary py-2 px-3 sm:px-3.5 text-xs font-bold text-slate-700 hover:text-red-600 cursor-pointer flex items-center gap-1.5"
              title="Logout from Admin Dashboard"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Admin Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('cars')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'cars' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Manage Cars ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer relative whitespace-nowrap ${
              activeTab === 'bookings' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Customer Bookings ({bookings.length})</span>
            {pendingBookings.length > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.2 rounded-full animate-pulse">
                {pendingBookings.length} New
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'profile' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Contact & Helpline Settings</span>
          </button>
        </div>

        {/* 1. CARS & AVAILABILITY TAB */}
        {activeTab === 'cars' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  Fleet & Car Availability
                </h2>
                <p className="text-xs text-slate-500">
                  Upload car photos from device, add details, and click to mark Available / Not Available.
                </p>
              </div>

              <button
                onClick={handleOpenAdd}
                className="btn-primary py-2.5 px-4 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Car</span>
              </button>
            </div>

            {/* Cars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(v => (
                <div 
                  key={v.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Photo & Status */}
                    <div className="relative h-44 w-full bg-slate-100">
                      <img 
                        src={v.primary_image_url} 
                        alt={v.name} 
                        className="w-full h-full object-cover"
                      />

                      <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase shadow-sm flex items-center gap-1 ${
                        v.is_available ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {v.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {v.is_available ? 'Available' : 'Not Available'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-base font-bold text-slate-900 font-display">{v.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>👥 {v.seating_capacity} Seats</span>
                        <span>•</span>
                        <span>❄️ {v.is_ac ? 'AC' : 'Non-AC'}</span>
                      </div>
                      {v.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{v.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Toggle Availability & Edit/Delete */}
                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-2">
                    
                    {/* 1-Click Availability Switch */}
                    <button
                      onClick={() => toggleVehicleAvailability(v.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        v.is_available 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-700 border border-emerald-200 hover:border-red-300' 
                          : 'bg-red-50 text-red-700 hover:bg-emerald-50 hover:text-emerald-700 border border-red-200 hover:border-emerald-300'
                      }`}
                    >
                      {v.is_available ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Available (Click to Mark Busy)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Not Available (Click to Mark Free)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Edit Car Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${v.name}?`)) deleteVehicle(v.id);
                        }}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        title="Delete Car"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. CUSTOMER BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            
            {/* Header & Filter Tabs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    Incoming Customer Bookings ({bookings.length})
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Wifi className="w-3 h-3" /> Live Synced
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Bookings from all customer phones sync here automatically in real time.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setBookingFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    bookingFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({bookings.length})
                </button>

                <button
                  onClick={() => setBookingFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    bookingFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending ({pendingBookings.length})</span>
                </button>

                <button
                  onClick={() => setBookingFilter('confirmed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    bookingFilter === 'confirmed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmed ({confirmedBookings.length})</span>
                </button>
              </div>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(b => (
                  <div 
                    key={b.id}
                    className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                      b.status === 'pending' 
                        ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/10' 
                        : b.status === 'confirmed'
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Left: Booking Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
                          {b.booking_code}
                        </span>

                        <h4 className="text-base font-bold text-slate-900">{b.customer_name}</h4>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          📞 {b.customer_phone}
                        </span>

                        {/* Status Badge */}
                        {b.status === 'pending' ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Pending Approval
                          </span>
                        ) : b.status === 'confirmed' ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {b.status}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-700 font-medium">
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          🚐 {b.vehicle_name}
                        </span>
                        <span>📍 <strong>Pickup:</strong> {b.pickup_location}</span>
                        <span>🏁 <strong>Drop:</strong> {b.drop_location}</span>
                        <span>📅 <strong>Travel:</strong> {b.travel_date} {b.pickup_time ? `(${b.pickup_time})` : ''}</span>
                      </div>

                      {b.special_notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <strong>Note:</strong> "{b.special_notes}"
                        </p>
                      )}

                      <div className="text-[11px] text-slate-400">
                        Received on: {new Date(b.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      
                      {/* Big Confirm & WhatsApp Button */}
                      {b.status === 'pending' ? (
                        <button
                          onClick={() => handleConfirmAndSendWhatsApp(b)}
                          className="btn-whatsapp py-2.5 px-4 text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Confirm & Send WhatsApp</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const url = generateAdminBookingConfirmationWhatsAppUrl(b, settings);
                            window.open(url, '_blank');
                          }}
                          className="btn-whatsapp py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
                          title="Resend WhatsApp Confirmation Message"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Resend WhatsApp</span>
                        </button>
                      )}

                      {/* Call Customer */}
                      <a
                        href={`tel:${b.customer_phone.replace(/\s+/g, '')}`}
                        className="btn-secondary py-2 px-3 text-xs font-semibold"
                        title="Call Customer Directly"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call</span>
                      </a>

                      {/* Status Toggle / Cancel */}
                      {b.status === 'confirmed' ? (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'pending')}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
                          title="Revert to Pending"
                        >
                          Mark Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold cursor-pointer"
                          title="Mark Confirmed without sending message"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this booking record?')) deleteBooking(b.id);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs space-y-1">
                  <p className="font-bold text-slate-700">No {bookingFilter !== 'all' ? bookingFilter : ''} bookings found</p>
                  <p className="text-slate-400">All customer booking requests from all devices will appear here automatically.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PROFILE & CONTACT SETTINGS TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-5">
            
            {/* Logged in Admin Identity Banner */}
            {currentUser && (
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Logged In Admin</span>
                    <h3 className="text-base font-bold text-slate-900">{currentUser.name}</h3>
                    <p className="text-xs text-slate-600 font-mono">Mobile: {currentUser.phone}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileForm(prev => ({
                      ...prev,
                      phone_primary: currentUser.phone,
                      whatsapp_number: currentUser.phone
                    }));
                  }}
                  className="btn-secondary py-2 px-3 text-xs font-semibold text-blue-700 border-blue-300 hover:bg-blue-50 cursor-pointer flex items-center gap-1.5"
                  title="Click to quickly set agency calling and WhatsApp number to your active mobile number"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Set My Number as Contact</span>
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-display">
                    Agency Contact & 24/7 Helpline Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update your agency calling numbers, 24/7 helpline, and WhatsApp booking number.
                  </p>
                </div>

                {profileSaved && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    ✓ Saved Successfully!
                  </span>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                
                {/* Agency Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Agency / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.agency_name}
                    onChange={(e) => setProfileForm({ ...profileForm, agency_name: e.target.value })}
                    className="input-clean text-xs font-semibold"
                  />
                </div>

                {/* Contact Numbers Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Primary / Admin Direct Call */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      Admin / Calling Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 94370 12345"
                      value={profileForm.phone_primary}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_primary: e.target.value })}
                      className="input-clean text-xs font-semibold"
                    />
                    <p className="text-[10px] text-slate-400">Primary phone for customer calls</p>
                  </div>

                  {/* 24/7 Helpline */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5 text-purple-600" />
                      24/7 Helpline Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98610 99999"
                      value={profileForm.helpline_number || profileForm.phone_primary}
                      onChange={(e) => setProfileForm({ ...profileForm, helpline_number: e.target.value })}
                      className="input-clean text-xs font-semibold"
                    />
                    <p className="text-[10px] text-slate-400">Support & emergency helpline</p>
                  </div>

                  {/* WhatsApp Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp Booking Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+919437012345"
                      value={profileForm.whatsapp_number}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp_number: e.target.value })}
                      className="input-clean text-xs font-semibold"
                    />
                    <p className="text-[10px] text-slate-400">For booking alerts & leads</p>
                  </div>

                </div>

                {/* Address & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Office Address
                    </label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="input-clean text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      City & State
                    </label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="input-clean text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Contact & Helpline Settings</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>

      {/* 4. ADD / EDIT CAR MODAL (WITH IMAGE UPLOAD) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
            
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-white">
                {editingId ? 'Edit Car Details' : 'Add New Car to Fleet'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCarSubmit} className="p-6 space-y-4">
              
              {/* Car Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Car Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Innova Crysta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-clean text-xs font-semibold"
                />
              </div>

              {/* Image Upload Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Car Image (Upload File from Device OR Enter URL)
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Image Preview */}
                  <div className="w-24 h-18 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary w-full py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Photo from Device</span>
                    </button>

                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={imagePreview}
                      onChange={(e) => setImagePreview(e.target.value)}
                      className="input-clean text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Seats, AC, Initial Status */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={seating}
                    onChange={(e) => setSeating(parseInt(e.target.value) || 1)}
                    className="input-clean text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">AC / Non-AC</label>
                  <select
                    value={isAc ? 'true' : 'false'}
                    onChange={(e) => setIsAc(e.target.value === 'true')}
                    className="input-clean text-xs font-semibold"
                  >
                    <option value="true">AC</option>
                    <option value="false">Non-AC</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={isAvailable ? 'true' : 'false'}
                    onChange={(e) => setIsAvailable(e.target.value === 'true')}
                    className="input-clean text-xs font-semibold"
                  >
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Clean interiors, pushback captain seats"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-clean text-xs font-medium"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary py-2 px-3 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Save Changes' : 'Add Car'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
