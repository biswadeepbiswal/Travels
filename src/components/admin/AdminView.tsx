import React, { useState, useRef, useMemo } from 'react';
import {
  Car, Plus, Upload, CheckCircle2, XCircle, Edit3, Trash2, Phone, MessageCircle,
  Save, X, LogOut, ClipboardList, Settings, MapPin, Building2,
  ShieldCheck, Clock, Send, Headphones, UserCheck, Sparkles, RefreshCw, Wifi,
  LayoutDashboard, Users, UserPlus, Shield, Eye, ChevronDown, ChevronUp,
  History, StickyNote, Smartphone, Ban, Play, CircleCheck, BarChart3,
  Edit2, UserX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vehicle, AgencySettings, Booking, BookingStatus, Admin, AdminPermissions } from '../../types';
import { generateAdminBookingConfirmationWhatsAppUrl } from '../../services/whatsappService';
import { DEFAULT_SUB_ADMIN_PERMISSIONS } from '../../data/defaultData';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending:      { label: 'Pending',      color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300',  icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: 'Under Review', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300',   icon: <Eye className="w-3.5 h-3.5" /> },
  accepted:     { label: 'Accepted',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300',icon: <CircleCheck className="w-3.5 h-3.5" /> },
  rejected:     { label: 'Rejected',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-300',    icon: <XCircle className="w-3.5 h-3.5" /> },
  cancelled:    { label: 'Cancelled',    color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-300',  icon: <Ban className="w-3.5 h-3.5" /> },
  completed:    { label: 'Completed',    color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-300', icon: <Play className="w-3.5 h-3.5" /> },
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

type AdminTab = 'dashboard' | 'bookings' | 'cars' | 'admins' | 'settings';

export const AdminView: React.FC = () => {
  const {
    vehicles, addVehicle, updateVehicle, deleteVehicle, toggleVehicleAvailability,
    bookings, updateBookingStatus, deleteBooking, addAdminNote,
    settings, updateSettings,
    admins, addAdmin, updateAdmin, removeAdmin, toggleAdminActive,
    assignUserToAdmin, unassignUserFromAdmin,
    currentUser, logout, getCurrentAdmin,
    isSyncing, refreshFromCloud
  } = useApp();

  const currentAdmin = getCurrentAdmin();
  const isMainAdmin = currentAdmin?.role === 'main_admin';
  const perms = currentAdmin?.permissions;

  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    bookings.filter(b => b.status === 'pending').length > 0 ? 'bookings' : 'dashboard'
  );
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | 'all'>('all');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [statusNoteInputs, setStatusNoteInputs] = useState<Record<string, string>>({});

  // Car modal
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [carName, setCarName] = useState('');
  const [carSeating, setCarSeating] = useState(7);
  const [carAc, setCarAc] = useState(true);
  const [carImagePreview, setCarImagePreview] = useState('');
  const [carDescription, setCarDescription] = useState('');
  const [carAvailable, setCarAvailable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings form
  const [profileForm, setProfileForm] = useState<AgencySettings>(settings);
  const [profileSaved, setProfileSaved] = useState(false);

  // Admin management
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminFormName, setAdminFormName] = useState('');
  const [adminFormPhone, setAdminFormPhone] = useState('');
  const [adminFormEmail, setAdminFormEmail] = useState('');
  const [adminFormContactPhone, setAdminFormContactPhone] = useState('');
  const [adminFormContactWA, setAdminFormContactWA] = useState('');
  const [adminFormPerms, setAdminFormPerms] = useState<AdminPermissions>(DEFAULT_SUB_ADMIN_PERMISSIONS);

  const myBookings = useMemo(() => {
    if (isMainAdmin) return bookings;
    if (!currentAdmin) return [];
    const myPhones = currentAdmin.assigned_user_phones || [];
    return bookings.filter(b => {
      const bPhone = b.customer_phone.replace(/\D/g, '');
      return myPhones.some(p => p === bPhone || p.includes(bPhone) || bPhone.includes(p));
    });
  }, [bookings, isMainAdmin, currentAdmin]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'all') return myBookings;
    return myBookings.filter(b => b.status === bookingFilter);
  }, [myBookings, bookingFilter]);

  const stats = useMemo(() => ({
    total: myBookings.length,
    pending: myBookings.filter(b => b.status === 'pending').length,
    under_review: myBookings.filter(b => b.status === 'under_review').length,
    accepted: myBookings.filter(b => b.status === 'accepted').length,
    rejected: myBookings.filter(b => b.status === 'rejected').length,
    cancelled: myBookings.filter(b => b.status === 'cancelled').length,
    completed: myBookings.filter(b => b.status === 'completed').length,
    available_cars: vehicles.filter(v => v.is_available).length,
    total_cars: vehicles.length,
    sub_admins: admins.filter(a => a.role === 'sub_admin' && a.is_active).length,
  }), [myBookings, vehicles, admins]);

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string }>();
    bookings.forEach(b => {
      const phone = b.customer_phone.replace(/\D/g, '');
      if (!map.has(phone)) map.set(phone, { name: b.customer_name, phone: b.customer_phone });
    });
    return Array.from(map.values());
  }, [bookings]);

  const handleOpenAddCar = () => {
    setEditingCarId(null); setCarName(''); setCarSeating(7); setCarAc(true);
    setCarImagePreview('https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80');
    setCarDescription(''); setCarAvailable(true); setIsCarModalOpen(true);
  };
  const handleOpenEditCar = (v: Vehicle) => {
    setEditingCarId(v.id); setCarName(v.name); setCarSeating(v.seating_capacity);
    setCarAc(v.is_ac); setCarImagePreview(v.primary_image_url);
    setCarDescription(v.description || ''); setCarAvailable(v.is_available);
    setIsCarModalOpen(true);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { if (typeof reader.result === 'string') setCarImagePreview(reader.result); };
      reader.readAsDataURL(file);
    }
  };
  const handleCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carName.trim()) return;
    const d = { name: carName.trim(), seating_capacity: Number(carSeating), is_ac: carAc, primary_image_url: carImagePreview, is_available: carAvailable, description: carDescription.trim() || undefined };
    if (editingCarId) updateVehicle({ id: editingCarId, ...d });
    else addVehicle({ id: `veh-${Date.now()}`, ...d });
    setIsCarModalOpen(false);
  };

  const handleOpenAddAdmin = () => {
    setEditingAdmin(null); setAdminFormName(''); setAdminFormPhone(''); setAdminFormEmail('');
    setAdminFormContactPhone(''); setAdminFormContactWA('');
    setAdminFormPerms(DEFAULT_SUB_ADMIN_PERMISSIONS); setIsAdminModalOpen(true);
  };
  const handleOpenEditAdmin = (a: Admin) => {
    setEditingAdmin(a); setAdminFormName(a.name); setAdminFormPhone(a.phone);
    setAdminFormEmail(a.email || ''); setAdminFormContactPhone(a.contact_phone || '');
    setAdminFormContactWA(a.contact_whatsapp || ''); setAdminFormPerms(a.permissions);
    setIsAdminModalOpen(true);
  };
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = {
      name: adminFormName.trim(), phone: adminFormPhone.trim(),
      email: adminFormEmail.trim() || undefined, role: 'sub_admin' as const,
      permissions: adminFormPerms,
      contact_phone: adminFormContactPhone.trim() || undefined,
      contact_whatsapp: adminFormContactWA.trim() || undefined,
      is_active: true, created_by: currentAdmin?.id,
      assigned_user_phones: editingAdmin?.assigned_user_phones || []
    };
    if (editingAdmin) updateAdmin({ ...editingAdmin, ...d });
    else addAdmin(d);
    setIsAdminModalOpen(false);
  };

  const handleStatusUpdate = (bookingId: string, status: BookingStatus) => {
    updateBookingStatus(bookingId, status, statusNoteInputs[bookingId]);
    setStatusNoteInputs(prev => ({ ...prev, [bookingId]: '' }));
  };

  const getNextStatuses = (cur: BookingStatus): BookingStatus[] => {
    const allowed = perms?.allowed_statuses || [];
    const map: Record<BookingStatus, BookingStatus[]> = {
      pending: ['under_review', 'accepted', 'rejected', 'cancelled'],
      under_review: ['accepted', 'rejected', 'cancelled'],
      accepted: ['completed', 'cancelled'],
      rejected: ['pending'],
      cancelled: ['pending'],
      completed: []
    };
    return (map[cur] || []).filter(s => allowed.includes(s));
  };

  const tabs = [
    { id: 'dashboard', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
    { id: 'bookings', icon: <ClipboardList className="w-4 h-4" />, label: `Bookings (${myBookings.length})`, badge: stats.pending > 0 ? stats.pending : undefined },
    ...(perms?.can_manage_cars ? [{ id: 'cars', icon: <Car className="w-4 h-4" />, label: `Cars (${vehicles.length})` }] : []),
    ...(isMainAdmin ? [{ id: 'admins', icon: <Users className="w-4 h-4" />, label: `Admins (${admins.length})` }] : []),
    ...(perms?.can_manage_settings ? [{ id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {stats.pending > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-3 flex items-center justify-between gap-3 cursor-pointer" onClick={() => { setActiveTab('bookings'); setBookingFilter('pending'); }}>
          <div className="flex items-center gap-2">
            <span className="text-lg animate-bounce">ðŸ””</span>
            <div>
              <p className="text-sm font-extrabold">{stats.pending} New Booking Request{stats.pending > 1 ? 's' : ''}!</p>
              <p className="text-[11px] text-red-100">Tap to review â€” customers are waiting</p>
            </div>
          </div>
          <span className="text-xs font-black bg-white text-red-600 px-3 py-1 rounded-full animate-pulse shrink-0">VIEW â†’</span>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Car className="w-5 h-5" /></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900">{isMainAdmin ? 'Main Admin Panel' : 'Admin Panel'}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isMainAdmin ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                  <ShieldCheck className="w-3 h-3" />{isMainAdmin ? 'Main Admin' : 'Sub Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{currentUser?.name} â€¢ {currentUser?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshFromCloud} className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Sync</span>
            </button>
            <button onClick={logout} className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap relative transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              {tab.icon}<span>{tab.label}</span>
              {(tab as any).badge && <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">{(tab as any).badge}</span>}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: stats.total, cls: 'bg-slate-900 text-white', icon: <ClipboardList className="w-4 h-4 opacity-70" /> },
                { label: 'Pending', value: stats.pending, cls: 'bg-amber-500 text-white', icon: <Clock className="w-4 h-4 opacity-70" /> },
                { label: 'Under Review', value: stats.under_review, cls: 'bg-blue-600 text-white', icon: <Eye className="w-4 h-4 opacity-70" /> },
                { label: 'Accepted', value: stats.accepted, cls: 'bg-emerald-600 text-white', icon: <CircleCheck className="w-4 h-4 opacity-70" /> },
                { label: 'Completed', value: stats.completed, cls: 'bg-indigo-600 text-white', icon: <Play className="w-4 h-4 opacity-70" /> },
                { label: 'Rejected', value: stats.rejected, cls: 'bg-red-600 text-white', icon: <XCircle className="w-4 h-4 opacity-70" /> },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-4 ${s.cls} shadow-sm`}>
                  <div className="flex items-center justify-between mb-1">{s.icon}<span className="text-2xl font-black">{s.value}</span></div>
                  <p className="text-xs font-semibold opacity-80">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><Car className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-slate-900">Fleet</h3></div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Total Cars</span><span className="font-bold">{stats.total_cars}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-600">Available</span><span className="font-bold text-emerald-700">{stats.available_cars}</span></div>
                  <div className="flex justify-between"><span className="text-red-500">Busy</span><span className="font-bold text-red-600">{stats.total_cars - stats.available_cars}</span></div>
                </div>
              </div>
              {isMainAdmin && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-slate-900">Team</h3></div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">All Admins</span><span className="font-bold">{admins.length}</span></div>
                    <div className="flex justify-between"><span className="text-amber-600">Main Admin</span><span className="font-bold">1</span></div>
                    <div className="flex justify-between"><span className="text-blue-600">Sub Admins</span><span className="font-bold text-blue-700">{stats.sub_admins}</span></div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-slate-900">Users & Stats</h3></div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Total Users</span><span className="font-bold">{uniqueUsers.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cancelled</span><span className="font-bold">{stats.cancelled}</span></div>
                  <div className="flex justify-between"><span className="text-blue-600">Active</span><span className="font-bold text-blue-700">{stats.pending + stats.under_review + stats.accepted}</span></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Recent Bookings</h3>
                <button onClick={() => setActiveTab('bookings')} className="text-xs text-blue-600 font-semibold hover:underline">View All â†’</button>
              </div>
              <div className="divide-y divide-slate-100">
                {myBookings.slice(0, 5).map(b => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div><p className="text-sm font-bold text-slate-900">{b.customer_name}</p><p className="text-xs text-slate-500">{b.pickup_location} â†’ {b.drop_location} â€¢ {b.travel_date}</p></div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
                {myBookings.length === 0 && <p className="p-6 text-xs text-slate-400 text-center">No bookings yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-bold text-slate-900">Customer Bookings</h2>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><Wifi className="w-3 h-3" /> Live</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pending', 'under_review', 'accepted', 'rejected', 'cancelled', 'completed'] as const).map(f => {
                  const count = f === 'all' ? myBookings.length : myBookings.filter(b => b.status === f).length;
                  const cfg = f !== 'all' ? STATUS_CONFIG[f] : null;
                  return (
                    <button key={f} onClick={() => setBookingFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${bookingFilter === f ? (cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-slate-900 text-white border-slate-900') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                      {f === 'all' ? `All (${count})` : `${STATUS_CONFIG[f].label} (${count})`}
                    </button>
                  );
                })}
              </div>
            </div>
            {filteredBookings.length > 0 ? filteredBookings.map(b => {
              const exp = expandedBooking === b.id;
              const next = getNextStatuses(b.status);
              return (
                <div key={b.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${b.status === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : b.status === 'accepted' ? 'border-emerald-200' : 'border-slate-200'}`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-300">{b.booking_code}</span>
                          <h4 className="text-base font-bold text-slate-900">{b.customer_name}</h4>
                          <a href={`tel:${b.customer_phone.replace(/\s+/g, '')}`} className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{b.customer_phone}
                          </a>
                          <StatusBadge status={b.status} />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">ðŸš— {b.vehicle_name}</span>
                          <span>ðŸ“ {b.pickup_location}</span><span>ðŸ {b.drop_location}</span>
                          <span>ðŸ“… {b.travel_date}{b.pickup_time ? ` (${b.pickup_time})` : ''}</span>
                          {b.num_passengers && <span>ðŸ‘¥ {b.num_passengers} pax</span>}
                        </div>
                        {b.special_notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200"><strong>Note:</strong> {b.special_notes}</p>}
                        {b.admin_notes && <p className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-200"><strong>Admin Note:</strong> {b.admin_notes}</p>}
                      </div>
                      <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2">
                        <div className="flex gap-2 flex-wrap">
                          <a href={`tel:${b.customer_phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100"><Phone className="w-3.5 h-3.5" />Call</a>
                          <a href={`sms:${b.customer_phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200"><Smartphone className="w-3.5 h-3.5" />SMS</a>
                          <a href={`https://wa.me/${b.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>
                        </div>
                        {b.status === 'pending' && perms?.can_accept_reject && (
                          <button onClick={() => handleStatusUpdate(b.id, 'accepted')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-md">
                            <Send className="w-3.5 h-3.5" />Accept
                          </button>
                        )}
                        <button onClick={() => setExpandedBooking(exp ? null : b.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer">
                          {exp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}{exp ? 'Collapse' : 'Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                  {exp && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-4">
                      {next.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Update Status</p>
                          <div className="flex flex-wrap gap-2">
                            {next.map(ns => {
                              const c2 = STATUS_CONFIG[ns];
                              return <button key={ns} onClick={() => handleStatusUpdate(b.id, ns)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${c2.bg} ${c2.color} ${c2.border} hover:opacity-90`}>{c2.icon}Mark {c2.label}</button>;
                            })}
                          </div>
                          <input type="text" placeholder="Optional note for this status change" value={statusNoteInputs[b.id] || ''} onChange={e => setStatusNoteInputs(prev => ({...prev,[b.id]:e.target.value}))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" />Admin Note</p>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Internal note (admins only)" value={noteInputs[b.id] !== undefined ? noteInputs[b.id] : (b.admin_notes || '')} onChange={e => setNoteInputs(p => ({...p,[b.id]:e.target.value}))}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                          <button onClick={() => addAdminNote(b.id, noteInputs[b.id] || '')} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 flex items-center gap-1">
                            <Save className="w-3.5 h-3.5" />Save
                          </button>
                        </div>
                      </div>
                      {b.status_history && b.status_history.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"><History className="w-3.5 h-3.5" />Status History</p>
                          <div className="space-y-1.5">
                            {b.status_history.map(h => (
                              <div key={h.id} className="flex items-start gap-2 text-xs">
                                <span className={`mt-0.5 px-1.5 py-0.5 rounded font-bold text-[10px] shrink-0 border ${STATUS_CONFIG[h.status]?.bg} ${STATUS_CONFIG[h.status]?.color} ${STATUS_CONFIG[h.status]?.border}`}>{STATUS_CONFIG[h.status]?.label}</span>
                                <div><span className="font-semibold text-slate-800">{h.changed_by_name}</span>{h.notes && <span className="text-slate-500"> â€” {h.notes}</span>}<span className="text-slate-400 ml-2">{new Date(h.timestamp).toLocaleString()}</span></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <button onClick={() => { window.open(generateAdminBookingConfirmationWhatsAppUrl(b, settings), '_blank'); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer">
                          <MessageCircle className="w-4 h-4" />Send WhatsApp Confirmation
                        </button>
                        {(isMainAdmin || perms?.can_delete_bookings) && (
                          <button onClick={() => { if (window.confirm('Delete booking?')) deleteBooking(b.id); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No {bookingFilter !== 'all' ? STATUS_CONFIG[bookingFilter as BookingStatus]?.label : ''} bookings</p>
              </div>
            )}
          </div>
        )}

        {/* CARS */}
        {activeTab === 'cars' && perms?.can_manage_cars && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div><h2 className="text-lg font-bold text-slate-900">Fleet Management</h2><p className="text-xs text-slate-500">{stats.available_cars} available â€¢ {stats.total_cars} total</p></div>
              <button onClick={handleOpenAddCar} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-md">
                <Plus className="w-4 h-4" />Add Car
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map(v => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="relative h-44 bg-slate-100">
                    <img src={v.primary_image_url} alt={v.name} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase shadow-sm flex items-center gap-1 ${v.is_available ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                      {v.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}{v.is_available ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <div className="p-4 flex-1 space-y-2">
                    <h3 className="font-bold text-slate-900">{v.name}</h3>
                    <div className="flex gap-2 text-xs text-slate-600"><span>ðŸ‘¥ {v.seating_capacity} Seats</span><span>â€¢</span><span>â„ï¸ {v.is_ac ? 'AC' : 'Non-AC'}</span></div>
                    {v.description && <p className="text-xs text-slate-500 line-clamp-2">{v.description}</p>}
                  </div>
                  <div className="p-4 pt-0 border-t border-slate-100 space-y-2">
                    <button onClick={() => toggleVehicleAvailability(v.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${v.is_available ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300' : 'bg-red-50 text-red-700 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'}`}>
                      {v.is_available ? <><CheckCircle2 className="w-4 h-4" />Available (Click to Busy)</> : <><XCircle className="w-4 h-4" />Busy (Click to Free)</>}
                    </button>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleOpenEditCar(v)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"><Edit3 className="w-3.5 h-3.5" />Edit</button>
                      <button onClick={() => { if (window.confirm(`Delete ${v.name}?`)) deleteVehicle(v.id); }} className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMINS */}
        {activeTab === 'admins' && isMainAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div><h2 className="text-lg font-bold text-slate-900">Admin Management</h2><p className="text-xs text-slate-500">Manage sub-admins, permissions, and user assignments</p></div>
              <button onClick={handleOpenAddAdmin} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 cursor-pointer shadow-md">
                <UserPlus className="w-4 h-4" />Add Sub-Admin
              </button>
            </div>
            {admins.map(a => (
              <div key={a.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!a.is_active ? 'opacity-60' : a.role === 'main_admin' ? 'border-amber-200' : 'border-slate-200'}`}>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg ${a.role === 'main_admin' ? 'bg-amber-500' : 'bg-purple-600'}`}>{a.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900">{a.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${a.role === 'main_admin' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-purple-100 text-purple-800 border-purple-200'}`}>
                          {a.role === 'main_admin' ? 'â­ Main Admin' : 'Sub Admin'}
                        </span>
                        {!a.is_active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Inactive</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{a.phone}{a.email ? ` â€¢ ${a.email}` : ''}</p>
                      {a.contact_phone && <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />Contact: {a.contact_phone}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">Assigned users: {(a.assigned_user_phones || []).length}</p>
                    </div>
                  </div>
                  {a.role !== 'main_admin' && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleOpenEditAdmin(a)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                      <button onClick={() => toggleAdminActive(a.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${a.is_active ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                        {a.is_active ? <><UserX className="w-3.5 h-3.5" />Deactivate</> : <><UserCheck className="w-3.5 h-3.5" />Activate</>}
                      </button>
                      <button onClick={() => { if (window.confirm(`Remove ${a.name}?`)) removeAdmin(a.id); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 cursor-pointer"><Trash2 className="w-3.5 h-3.5" />Remove</button>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                  {(Object.entries(a.permissions).filter(([k]) => k !== 'allowed_statuses') as [string,boolean][]).map(([k,v]) => (
                    <span key={k} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'}`}>{k.replace('can_','').replace(/_/g,' ')}</span>
                  ))}
                </div>
                {a.role !== 'main_admin' && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Assigned Users ({(a.assigned_user_phones||[]).length})</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueUsers.map(u => {
                        const uPhone = u.phone.replace(/\D/g,'');
                        const isAss = (a.assigned_user_phones||[]).some(p => p === uPhone);
                        return (
                          <button key={u.phone} onClick={() => isAss ? unassignUserFromAdmin(a.id, u.phone) : assignUserToAdmin(a.id, u.phone)}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${isAss ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                            {isAss ? 'âœ“ ' : '+ '}{u.name}
                          </button>
                        );
                      })}
                      {uniqueUsers.length === 0 && <p className="text-xs text-slate-400">No users yet</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && perms?.can_manage_settings && (
          <div className="max-w-3xl mx-auto space-y-5">
            {currentUser && (
              <div className="bg-gradient-to-r from-blue-50 to-white p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center"><UserCheck className="w-5 h-5" /></div>
                  <div><span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Logged In Admin</span><h3 className="font-bold text-slate-900">{currentUser.name}</h3><p className="text-xs font-mono text-slate-600">{currentUser.phone}</p></div>
                </div>
                <button onClick={() => setProfileForm(p => ({...p, phone_primary: currentUser.phone, whatsapp_number: currentUser.phone}))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold cursor-pointer hover:bg-blue-100">
                  <Sparkles className="w-3.5 h-3.5" />Set My Number as Contact
                </button>
              </div>
            )}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div><h2 className="text-lg font-bold text-slate-900">Agency Contact & Helpline</h2><p className="text-xs text-slate-500">Contact details shown to customers</p></div>
                {profileSaved && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">âœ“ Saved!</span>}
              </div>
              <form onSubmit={e => { e.preventDefault(); updateSettings(profileForm); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }} className="space-y-4">
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Agency Name *</label><input required type="text" value={profileForm.agency_name} onChange={e => setProfileForm({...profileForm, agency_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-600" />Primary Call *</label><input required type="text" value={profileForm.phone_primary} onChange={e => setProfileForm({...profileForm, phone_primary: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Headphones className="w-3.5 h-3.5 text-purple-600" />24/7 Helpline *</label><input required type="text" value={profileForm.helpline_number} onChange={e => setProfileForm({...profileForm, helpline_number: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" />WhatsApp *</label><input required type="text" value={profileForm.whatsapp_number} onChange={e => setProfileForm({...profileForm, whatsapp_number: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Address</label><input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />City</label><input type="text" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button type="submit" className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-md"><Save className="w-3.5 h-3.5" />Save Settings</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* CAR MODAL */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base font-bold">{editingCarId ? 'Edit Car' : 'Add New Car'}</h3>
              <button onClick={() => setIsCarModalOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCarSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Car Name *</label><input required type="text" placeholder="e.g. Toyota Innova Crysta" value={carName} onChange={e => setCarName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Seats</label><input type="number" min={1} max={50} value={carSeating} onChange={e => setCarSeating(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">AC</label><select value={carAc ? 'ac' : 'nonac'} onChange={e => setCarAc(e.target.value === 'ac')} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"><option value="ac">AC</option><option value="nonac">Non-AC</option></select></div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Car Photo</label>
                <div className="h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"><img src={carImagePreview} alt="preview" className="w-full h-full object-cover" /></div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Paste image URL" value={carImagePreview} onChange={e => setCarImagePreview(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer hover:bg-slate-200"><Upload className="w-3.5 h-3.5" />Upload</button>
                  <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                </div>
              </div>
              <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Description</label><textarea rows={2} placeholder="Short description" value={carDescription} onChange={e => setCarDescription(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={carAvailable} onChange={e => setCarAvailable(e.target.checked)} className="w-4 h-4 rounded" /><span className="text-xs font-semibold text-slate-700">Mark as Available</span></label>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsCarModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer shadow-md">{editingCarId ? 'Save Changes' : 'Add Car'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between shrink-0">
              <div><h3 className="text-base font-bold">{editingAdmin ? 'Edit Sub-Admin' : 'Add Sub-Admin'}</h3><p className="text-xs text-purple-300 mt-0.5">Role-based access control</p></div>
              <button onClick={() => setIsAdminModalOpen(false)} className="p-1 text-purple-300 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdminSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Full Name *</label><input required type="text" placeholder="Admin Name" value={adminFormName} onChange={e => setAdminFormName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Login Phone *</label><input required type="text" placeholder="+91 99998 88877" value={adminFormPhone} onChange={e => setAdminFormPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
              </div>
              <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Email (Optional)</label><input type="email" placeholder="admin@example.com" value={adminFormEmail} onChange={e => setAdminFormEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Contact Phone (for users)</label><input type="text" placeholder="+91 9437..." value={adminFormContactPhone} onChange={e => setAdminFormContactPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">WhatsApp (for users)</label><input type="text" placeholder="+919437..." value={adminFormContactWA} onChange={e => setAdminFormContactWA(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" /></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-purple-600" />Permissions</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(adminFormPerms).filter(([k]) => k !== 'allowed_statuses') as [string, boolean][]).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={val} onChange={e => setAdminFormPerms(p => ({...p,[key]:e.target.checked}))} className="w-3.5 h-3.5 rounded" />
                      <span className="text-xs text-slate-700 capitalize">{key.replace('can_','').replace(/_/g,' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsAdminModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer shadow-md">{editingAdmin ? 'Save Changes' : 'Create Sub-Admin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};