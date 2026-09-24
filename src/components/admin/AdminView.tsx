import React, { useState, useRef, useMemo } from 'react';
import {
  Car, Plus, Upload, CheckCircle2, XCircle, Edit3, Trash2, Phone, MessageCircle,
  Save, X, LogOut, ClipboardList, Settings, MapPin, Building2,
  ShieldCheck, Clock, Send, Headphones, UserCheck, Sparkles, RefreshCw, Wifi,
  LayoutDashboard, Users, UserPlus, Shield, Eye, ChevronDown, ChevronUp,
  History, StickyNote, Smartphone, Ban, Play, CircleCheck, BarChart3,
  Edit2, UserX, Search, User, Filter, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vehicle, AgencySettings, Booking, BookingStatus, Admin, AdminPermissions } from '../../types';
import { generateAdminBookingConfirmationWhatsAppUrl } from '../../services/whatsappService';
import { DEFAULT_SUB_ADMIN_PERMISSIONS, matchPhones } from '../../data/defaultData';

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

type AdminTab = 'dashboard' | 'bookings' | 'users' | 'cars' | 'admins' | 'settings';

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
  // Safe detection: Main admin if explicit role, or if fallback
  const isMainAdmin = !currentAdmin || currentAdmin.role === 'main_admin' || currentUser?.admin_role === 'main_admin';
  const perms = currentAdmin?.permissions;

  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    bookings.filter(b => b.status === 'pending').length > 0 ? 'bookings' : 'dashboard'
  );
  const [bookingFilter, setBookingFilter] = useState<BookingStatus | 'all'>('all');
  const [bookingScope, setBookingScope] = useState<'all' | 'assigned'>('all');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
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

  // Helper to find which sub-admins are assigned to a customer
  const getAssignedAdminsForPhone = (phone: string): Admin[] => {
    return admins.filter(a =>
      a.role === 'sub_admin' && (a.assigned_user_phones || []).some(p => matchPhones(p, phone))
    );
  };

  // Unique users with full details
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      totalBookings: number;
      pendingBookings: number;
      completedBookings: number;
      latestBooking?: Booking;
      assignedAdmins: Admin[];
    }>();

    bookings.forEach(b => {
      const clean = b.customer_phone.replace(/\D/g, '').slice(-10) || b.customer_phone;
      const existing = map.get(clean);
      const isPending = b.status === 'pending';
      const isCompleted = b.status === 'completed';

      if (!existing) {
        const assigned = getAssignedAdminsForPhone(b.customer_phone);
        map.set(clean, {
          name: b.customer_name,
          phone: b.customer_phone,
          totalBookings: 1,
          pendingBookings: isPending ? 1 : 0,
          completedBookings: isCompleted ? 1 : 0,
          latestBooking: b,
          assignedAdmins: assigned
        });
      } else {
        existing.totalBookings += 1;
        if (isPending) existing.pendingBookings += 1;
        if (isCompleted) existing.completedBookings += 1;
        if (new Date(b.created_at) > new Date(existing.latestBooking?.created_at || 0)) {
          existing.latestBooking = b;
          existing.name = b.customer_name;
        }
      }
    });

    return Array.from(map.values());
  }, [bookings, admins]);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return uniqueUsers;
    const q = userSearchQuery.toLowerCase().trim();
    return uniqueUsers.filter(u =>
      u.name.toLowerCase().includes(q) || u.phone.includes(q)
    );
  }, [uniqueUsers, userSearchQuery]);

  // Bookings list: Never hide bookings by default
  const myBookings = useMemo(() => {
    let list = bookings;
    // If sub-admin switched scope to "assigned"
    if (!isMainAdmin && bookingScope === 'assigned' && currentAdmin) {
      const myPhones = currentAdmin.assigned_user_phones || [];
      if (myPhones.length > 0) {
        list = list.filter(b => myPhones.some(p => matchPhones(p, b.customer_phone)));
      }
    }
    // Filter by specific user if clicked
    if (selectedUserFilter) {
      list = list.filter(b => matchPhones(b.customer_phone, selectedUserFilter));
    }
    return list;
  }, [bookings, isMainAdmin, bookingScope, currentAdmin, selectedUserFilter]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === 'all') return myBookings;
    return myBookings.filter(b => b.status === bookingFilter);
  }, [myBookings, bookingFilter]);

  const stats = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    under_review: bookings.filter(b => b.status === 'under_review').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    available_cars: vehicles.filter(v => v.is_available).length,
    total_cars: vehicles.length,
    sub_admins: admins.filter(a => a.role === 'sub_admin' && a.is_active).length,
  }), [bookings, vehicles, admins]);

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
    const allowed = perms?.allowed_statuses || ['pending','under_review','accepted','rejected','cancelled','completed'];
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
    { id: 'bookings', icon: <ClipboardList className="w-4 h-4" />, label: `Bookings (${bookings.length})`, badge: stats.pending > 0 ? stats.pending : undefined },
    { id: 'users', icon: <Users className="w-4 h-4" />, label: `Users (${uniqueUsers.length})` },
    ...(perms?.can_manage_cars !== false ? [{ id: 'cars', icon: <Car className="w-4 h-4" />, label: `Cars (${vehicles.length})` }] : []),
    ...(isMainAdmin ? [{ id: 'admins', icon: <ShieldCheck className="w-4 h-4" />, label: `Admins (${admins.length})` }] : []),
    ...(perms?.can_manage_settings !== false ? [{ id: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Settings' }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {stats.pending > 0 && (
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-3 flex items-center justify-between gap-3 cursor-pointer" onClick={() => { setActiveTab('bookings'); setBookingFilter('pending'); setSelectedUserFilter(null); }}>
          <div className="flex items-center gap-2">
            <span className="text-lg animate-bounce">ðŸ””</span>
            <div>
              <p className="text-sm font-extrabold">{stats.pending} New Booking Request{stats.pending > 1 ? 's' : ''}!</p>
              <p className="text-[11px] text-red-100">Tap to review & respond immediately</p>
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
                <h1 className="text-base font-extrabold text-slate-900">{isMainAdmin ? 'Main Admin Panel' : 'Sub-Admin Panel'}</h1>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); setSelectedUserFilter(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Bookings', value: stats.total, cls: 'bg-slate-900 text-white', icon: <ClipboardList className="w-4 h-4 opacity-70" /> },
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

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 transition-colors" onClick={() => setActiveTab('users')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /><h3 className="font-bold text-slate-900">Customers / Users</h3></div>
                  <span className="text-[11px] text-blue-600 font-bold">Manage â†’</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Total Registered Users</span><span className="font-bold">{uniqueUsers.length}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-600">With Active Bookings</span><span className="font-bold text-emerald-700">{uniqueUsers.filter(u => u.pendingBookings > 0).length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Total Trips Made</span><span className="font-bold">{bookings.length}</span></div>
                </div>
              </div>

              {isMainAdmin ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm cursor-pointer hover:border-purple-400 transition-colors" onClick={() => setActiveTab('admins')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-purple-600" /><h3 className="font-bold text-slate-900">Admin Team</h3></div>
                    <span className="text-[11px] text-purple-600 font-bold">Manage â†’</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">All Admins</span><span className="font-bold">{admins.length}</span></div>
                    <div className="flex justify-between"><span className="text-amber-600">Main Admin</span><span className="font-bold">1</span></div>
                    <div className="flex justify-between"><span className="text-blue-600">Sub Admins</span><span className="font-bold text-blue-700">{stats.sub_admins}</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-slate-900">My Sub-Admin Info</h3></div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">My Name</span><span className="font-bold">{currentAdmin?.name || currentUser?.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Users Assigned to Me</span><span className="font-bold text-blue-700">{(currentAdmin?.assigned_user_phones || []).length}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Bookings in Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Recent Customer Bookings</h3>
                  <p className="text-xs text-slate-500">Latest incoming requests from customers</p>
                </div>
                <button onClick={() => { setActiveTab('bookings'); setSelectedUserFilter(null); }} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                  View All ({bookings.length}) â†’
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {bookings.slice(0, 5).map(b => (
                  <div key={b.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{b.customer_name}</span>
                        <span className="text-xs font-mono text-slate-500">({b.customer_phone})</span>
                      </div>
                      <p className="text-xs text-slate-500">{b.vehicle_name} â€¢ {b.pickup_location} â†’ {b.drop_location} â€¢ {b.travel_date}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <StatusBadge status={b.status} />
                      <button onClick={() => { setActiveTab('bookings'); setSelectedUserFilter(b.customer_phone); }} className="text-xs font-semibold text-blue-600 hover:underline">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && <p className="p-8 text-xs text-slate-400 text-center">No bookings yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Customer Bookings</h2>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                </div>

                {/* Sub-Admin Scope Toggle */}
                {!isMainAdmin && currentAdmin && (
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1 self-start sm:self-auto">
                    <button
                      onClick={() => setBookingScope('all')}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${bookingScope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                      All Agency ({bookings.length})
                    </button>
                    <button
                      onClick={() => setBookingScope('assigned')}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${bookingScope === 'assigned' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                    >
                      My Assigned ({(currentAdmin.assigned_user_phones || []).length})
                    </button>
                  </div>
                )}
              </div>

              {/* User-Specific Filter Banner */}
              {selectedUserFilter && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Filtering by customer: <strong>{selectedUserFilter}</strong> ({myBookings.length} booking{myBookings.length > 1 ? 's' : ''})</span>
                  </div>
                  <button onClick={() => setSelectedUserFilter(null)} className="font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer">
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Status Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                {(['all', 'pending', 'under_review', 'accepted', 'rejected', 'cancelled', 'completed'] as const).map(f => {
                  const count = f === 'all' ? myBookings.length : myBookings.filter(b => b.status === f).length;
                  const cfg = f !== 'all' ? STATUS_CONFIG[f] : null;
                  return (
                    <button
                      key={f}
                      onClick={() => setBookingFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${bookingFilter === f ? (cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-slate-900 text-white border-slate-900') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {f === 'all' ? `All (${count})` : `${STATUS_CONFIG[f].label} (${count})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bookings List */}
            {filteredBookings.length > 0 ? filteredBookings.map(b => {
              const exp = expandedBooking === b.id;
              const next = getNextStatuses(b.status);
              const assignedAdmins = getAssignedAdminsForPhone(b.customer_phone);

              return (
                <div key={b.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${b.status === 'pending' ? 'border-amber-300 ring-2 ring-amber-100' : b.status === 'accepted' ? 'border-emerald-200' : 'border-slate-200'}`}>
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1">
                        {/* Header: Customer Name, Phone, Code, Status & Assigned Admin */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-300">{b.booking_code}</span>

                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center">
                              {b.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="text-base font-bold text-slate-900">{b.customer_name}</h4>
                          </div>

                          <a href={`tel:${b.customer_phone.replace(/\s+/g, '')}`} className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{b.customer_phone}
                          </a>

                          <StatusBadge status={b.status} />

                          {/* Assigned Admin Tag */}
                          {assignedAdmins.length > 0 ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              Assigned to: {assignedAdmins.map(a => a.name).join(', ')}
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              Unassigned
                            </span>
                          )}
                        </div>

                        {/* Trip Details */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">ðŸš— {b.vehicle_name}</span>
                          <span>ðŸ“ Pickup: <strong>{b.pickup_location}</strong></span>
                          <span>ðŸ Drop: <strong>{b.drop_location}</strong></span>
                          <span>ðŸ“… {b.travel_date}{b.pickup_time ? ` (${b.pickup_time})` : ''}</span>
                          {b.num_passengers && <span>ðŸ‘¥ {b.num_passengers} pax</span>}
                          {b.booking_duration && <span>â±ï¸ {b.booking_duration}</span>}
                        </div>

                        {b.special_notes && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200"><strong>Customer Note:</strong> {b.special_notes}</p>}
                        {b.admin_notes && <p className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-200"><strong>Admin Note:</strong> {b.admin_notes}</p>}

                        {/* Customer History Quick Link */}
                        <div className="pt-1">
                          <button
                            onClick={() => { setSelectedUserFilter(b.customer_phone); }}
                            className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>Filter all trips by {b.customer_name}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2 shrink-0">
                        <div className="flex gap-2 flex-wrap">
                          <a href={`tel:${b.customer_phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100"><Phone className="w-3.5 h-3.5" />Call</a>
                          <a href={`sms:${b.customer_phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold hover:bg-slate-200"><Smartphone className="w-3.5 h-3.5" />SMS</a>
                          <a href={`https://wa.me/${b.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100"><MessageCircle className="w-3.5 h-3.5" />WhatsApp</a>
                        </div>

                        {b.status === 'pending' && perms?.can_accept_reject !== false && (
                          <button onClick={() => handleStatusUpdate(b.id, 'accepted')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-md">
                            <Send className="w-3.5 h-3.5" />Accept Booking
                          </button>
                        )}

                        <button onClick={() => setExpandedBooking(exp ? null : b.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer">
                          {exp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}{exp ? 'Collapse' : 'Details & Status'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Booking Details & Status Controls */}
                  {exp && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5 space-y-4">
                      {/* Sub-Admin Assignment for this Customer */}
                      {isMainAdmin && admins.filter(a => a.role === 'sub_admin').length > 0 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-purple-600" />Assign this Customer to Sub-Admin:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {admins.filter(a => a.role === 'sub_admin').map(sub => {
                              const isAssigned = (sub.assigned_user_phones || []).some(p => matchPhones(p, b.customer_phone));
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => isAssigned ? unassignUserFromAdmin(sub.id, b.customer_phone) : assignUserToAdmin(sub.id, b.customer_phone)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${isAssigned ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'}`}
                                >
                                  {isAssigned ? 'âœ“ Assigned to ' : '+ Assign to '}{sub.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Status Update */}
                      {next.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Update Booking Status</p>
                          <div className="flex flex-wrap gap-2">
                            {next.map(ns => {
                              const c2 = STATUS_CONFIG[ns];
                              return (
                                <button key={ns} onClick={() => handleStatusUpdate(b.id, ns)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${c2.bg} ${c2.color} ${c2.border} hover:opacity-90`}>
                                  {c2.icon}Mark {c2.label}
                                </button>
                              );
                            })}
                          </div>
                          <input type="text" placeholder="Optional note for customer / log" value={statusNoteInputs[b.id] || ''} onChange={e => setStatusNoteInputs(prev => ({...prev,[b.id]:e.target.value}))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                        </div>
                      )}

                      {/* Admin Internal Note */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" />Internal Admin Note</p>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Internal trip notes (visible only to admins)" value={noteInputs[b.id] !== undefined ? noteInputs[b.id] : (b.admin_notes || '')} onChange={e => setNoteInputs(p => ({...p,[b.id]:e.target.value}))}
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                          <button onClick={() => addAdminNote(b.id, noteInputs[b.id] || '')} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 flex items-center gap-1">
                            <Save className="w-3.5 h-3.5" />Save
                          </button>
                        </div>
                      </div>

                      {/* Status History */}
                      {b.status_history && b.status_history.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"><History className="w-3.5 h-3.5" />Audit History</p>
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
                            <Trash2 className="w-3.5 h-3.5" />Delete Booking
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
                {selectedUserFilter && (
                  <button onClick={() => setSelectedUserFilter(null)} className="mt-2 text-xs text-blue-600 font-bold underline cursor-pointer">
                    Clear customer filter to see all bookings
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* USERS / CUSTOMERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registered Customers & Travelers</h2>
                <p className="text-xs text-slate-500">View customer profile, booking history, and assign users to Sub-Admins.</p>
              </div>
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by customer name or phone..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
                />
              </div>
            </div>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(u => {
                const subAdmins = admins.filter(a => a.role === 'sub_admin');

                return (
                  <div key={u.phone} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                    <div>
                      {/* Customer Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{u.name}</h3>
                            <a href={`tel:${u.phone.replace(/\s+/g,'')}`} className="text-xs font-mono text-slate-500 hover:text-blue-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" />{u.phone}
                            </a>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                          {u.totalBookings} Trip{u.totalBookings > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Customer Trip Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                          <p className="text-sm font-black text-slate-800">{u.totalBookings}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-600 font-bold uppercase">Pending</p>
                          <p className="text-sm font-black text-amber-600">{u.pendingBookings}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Completed</p>
                          <p className="text-sm font-black text-emerald-600">{u.completedBookings}</p>
                        </div>
                      </div>

                      {/* Latest Route */}
                      {u.latestBooking && (
                        <div className="mt-3 text-xs text-slate-600 space-y-1">
                          <p className="text-[11px] font-semibold text-slate-400">Latest Trip:</p>
                          <p className="font-bold text-slate-800">
                            {u.latestBooking.pickup_location} â†’ {u.latestBooking.drop_location}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {u.latestBooking.vehicle_name} â€¢ {u.latestBooking.travel_date}
                          </p>
                        </div>
                      )}

                      {/* Assigned Sub-Admin Management (Main Admin only) */}
                      {isMainAdmin && subAdmins.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />Assigned Sub-Admin:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {subAdmins.map(sub => {
                              const isAssigned = (sub.assigned_user_phones || []).some(p => matchPhones(p, u.phone));
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => isAssigned ? unassignUserFromAdmin(sub.id, u.phone) : assignUserToAdmin(sub.id, u.phone)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-all ${isAssigned ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}
                                >
                                  {isAssigned ? 'âœ“ ' : '+ '}{sub.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <a href={`tel:${u.phone.replace(/\s+/g,'')}`} className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" title="Call Customer">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a href={`https://wa.me/${u.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" title="WhatsApp Customer">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedUserFilter(u.phone);
                          setActiveTab('bookings');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>View Trips ({u.totalBookings})</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700">No customers found</p>
                  <p className="text-xs text-slate-400 mt-1">When users book a car, they will automatically appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CARS TAB */}
        {activeTab === 'cars' && perms?.can_manage_cars !== false && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div><h2 className="text-lg font-bold text-slate-900">Fleet Management</h2><p className="text-xs text-slate-500">{stats.available_cars} available â€¢ {stats.total_cars} total</p></div>
              <button onClick={handleOpenAddCar} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-md">
                <Plus className="w-4 h-4" />Add Car
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img src={vehicle.primary_image_url} alt={vehicle.name} className="w-full h-full object-cover" />
                      <button onClick={() => toggleVehicleAvailability(vehicle.id)} className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-[10px] font-extrabold uppercase shadow-md cursor-pointer flex items-center gap-1 ${vehicle.is_available ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {vehicle.is_available ? <><CheckCircle2 className="w-3 h-3" />Available</> : <><XCircle className="w-3 h-3" />Busy</>}
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-slate-900 text-base">{vehicle.name}</h4>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{vehicle.seating_capacity} Seats</span>
                        <span className={`px-2 py-0.5 rounded font-medium ${vehicle.is_ac ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{vehicle.is_ac ? 'AC' : 'Non-AC'}</span>
                      </div>
                      {vehicle.description && <p className="text-xs text-slate-500 line-clamp-2">{vehicle.description}</p>}
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <button onClick={() => handleOpenEditCar(vehicle)} className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"><Edit3 className="w-3.5 h-3.5" />Edit</button>
                    <button onClick={() => { if (window.confirm('Delete car?')) deleteVehicle(vehicle.id); }} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADMINS TAB (Main Admin only) */}
        {activeTab === 'admins' && isMainAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Admin Team & Sub-Admin Access</h2>
                <p className="text-xs text-slate-500">Manage permissions, sub-admin accounts, and assigned customers.</p>
              </div>
              <button onClick={handleOpenAddAdmin} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-md">
                <UserPlus className="w-4 h-4" />Add Sub-Admin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-5 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base ${a.role === 'main_admin' ? 'bg-amber-500' : 'bg-slate-800'}`}>
                          {a.role === 'main_admin' ? 'ðŸ‘‘' : a.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{a.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${a.role === 'main_admin' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                              {a.role === 'main_admin' ? 'Main Admin' : 'Sub Admin'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500">{a.phone}</p>
                          {a.contact_phone && <p className="text-[11px] text-slate-400">Customer contact: {a.contact_phone}</p>}
                        </div>
                      </div>

                      {a.role !== 'main_admin' && (
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => handleOpenEditAdmin(a)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                          <button onClick={() => toggleAdminActive(a.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${a.is_active ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                            {a.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => { if (window.confirm(`Remove ${a.name}?`)) removeAdmin(a.id); }} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-3 flex flex-wrap gap-1">
                      {(Object.entries(a.permissions).filter(([k]) => k !== 'allowed_statuses') as [string,boolean][]).map(([k,v]) => (
                        <span key={k} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${v ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200 line-through'}`}>{k.replace('can_','').replace(/_/g,' ')}</span>
                      ))}
                    </div>
                  </div>

                  {a.role !== 'main_admin' && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                      <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Assigned Customers ({(a.assigned_user_phones||[]).length})</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {uniqueUsers.map(u => {
                          const isAss = (a.assigned_user_phones||[]).some(p => matchPhones(p, u.phone));
                          return (
                            <button key={u.phone} onClick={() => isAss ? unassignUserFromAdmin(a.id, u.phone) : assignUserToAdmin(a.id, u.phone)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold cursor-pointer transition-all ${isAss ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300'}`}>
                              {isAss ? 'âœ“ ' : '+ '}{u.name}
                            </button>
                          );
                        })}
                        {uniqueUsers.length === 0 && <p className="text-xs text-slate-400">No customers yet</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && perms?.can_manage_settings !== false && (
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
                <div><h2 className="text-lg font-bold text-slate-900">Agency Contact & Helpline</h2><p className="text-xs text-slate-500">Contact details shown to customers on WhatsApp & call</p></div>
                {profileSaved && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">âœ“ Saved!</span>}
              </div>

              <form onSubmit={e => { e.preventDefault(); updateSettings(profileForm); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); }} className="space-y-4">
                <div className="space-y-1"><label className="block text-xs font-bold text-slate-700">Agency Name *</label><input required type="text" value={profileForm.agency_name} onChange={e => setProfileForm({...profileForm, agency_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-blue-600" />Primary Call *</label><input required type="text" value={profileForm.phone_primary} onChange={e => setProfileForm({...profileForm, phone_primary: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" />WhatsApp *</label><input required type="text" value={profileForm.whatsapp_number} onChange={e => setProfileForm({...profileForm, whatsapp_number: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Headphones className="w-3.5 h-3.5 text-purple-600" />24/7 Helpline</label><input type="text" value={profileForm.helpline_number || ''} onChange={e => setProfileForm({...profileForm, helpline_number: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-500" />City *</label><input required type="text" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                  <div className="space-y-1"><label className="block text-xs font-bold text-slate-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />Address</label><input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                </div>
                <button type="submit" className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"><Save className="w-4 h-4" />Save Settings</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Car Modal */}
      {isCarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3"><h3 className="font-bold text-slate-900">{editingCarId ? 'Edit Car' : 'Add New Car'}</h3><button onClick={() => setIsCarModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleCarSubmit} className="space-y-3">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Car Name *</label><input required placeholder="e.g. Toyota Innova Crysta (AC)" value={carName} onChange={e => setCarName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Seating Capacity</label><input type="number" min={2} max={50} value={carSeating} onChange={e => setCarSeating(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
                <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="carAc" checked={carAc} onChange={e => setCarAc(e.target.checked)} className="w-4 h-4 rounded text-blue-600 cursor-pointer" /><label htmlFor="carAc" className="text-xs font-bold text-slate-700 cursor-pointer">Air Conditioned (AC)</label></div>
              </div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Car Image URL</label><input type="url" value={carImagePreview} onChange={e => setCarImagePreview(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Or Upload Image</label><input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Description</label><input placeholder="Best for outstation family trips" value={carDescription} onChange={e => setCarDescription(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="carAvail" checked={carAvailable} onChange={e => setCarAvailable(e.target.checked)} className="w-4 h-4 rounded text-emerald-600 cursor-pointer" /><label htmlFor="carAvail" className="text-xs font-bold text-slate-700 cursor-pointer">Available for Booking</label></div>
              <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setIsCarModalOpen(false)} className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer">Cancel</button><button type="submit" className="py-2 px-5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-md">{editingCarId ? 'Save Changes' : 'Add to Fleet'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {isAdminModalOpen && isMainAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3"><h3 className="font-bold text-slate-900">{editingAdmin ? 'Edit Sub-Admin' : 'Add Sub-Admin'}</h3><button onClick={() => setIsAdminModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleAdminSubmit} className="space-y-3.5">
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Sub-Admin Name *</label><input required placeholder="e.g. Ramesh Mohanty" value={adminFormName} onChange={e => setAdminFormName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Login Phone Number *</label><input required placeholder="10-digit mobile number for login" value={adminFormPhone} onChange={e => setAdminFormPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Customer Contact Phone (Optional)</label><input placeholder="Number shown to assigned customers" value={adminFormContactPhone} onChange={e => setAdminFormContactPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-700">Customer WhatsApp (Optional)</label><input placeholder="+919861012345" value={adminFormContactWA} onChange={e => setAdminFormContactWA(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" /></div>
              <div className="space-y-2 pt-2 border-t"><p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Granular Permissions</p>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={adminFormPerms.can_view_bookings} onChange={e => setAdminFormPerms(p => ({...p, can_view_bookings: e.target.checked}))} className="w-4 h-4 rounded text-blue-600" />Can view customer bookings</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={adminFormPerms.can_accept_reject} onChange={e => setAdminFormPerms(p => ({...p, can_accept_reject: e.target.checked}))} className="w-4 h-4 rounded text-blue-600" />Can accept & reject bookings</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={adminFormPerms.can_update_booking_status} onChange={e => setAdminFormPerms(p => ({...p, can_update_booking_status: e.target.checked}))} className="w-4 h-4 rounded text-blue-600" />Can update booking progress</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={adminFormPerms.can_manage_cars} onChange={e => setAdminFormPerms(p => ({...p, can_manage_cars: e.target.checked}))} className="w-4 h-4 rounded text-blue-600" />Can add & edit cars</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={adminFormPerms.can_manage_settings} onChange={e => setAdminFormPerms(p => ({...p, can_manage_settings: e.target.checked}))} className="w-4 h-4 rounded text-blue-600" />Can edit agency contact settings</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={adminFormPerms.can_delete_bookings} onChange={e => setAdminFormPerms(p => ({...p, can_delete_bookings: e.target.checked}))} className="w-4 h-4 rounded text-red-600" />Can delete bookings</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setIsAdminModalOpen(false)} className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer">Cancel</button><button type="submit" className="py-2 px-5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-md">{editingAdmin ? 'Save Sub-Admin' : 'Create Sub-Admin'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};