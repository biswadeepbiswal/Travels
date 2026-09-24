import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Vehicle, Booking, BookingStatus, BookingStatusHistory, AgencySettings, UserSession, Admin, AdminRole, AdminPermissions } from '../types';
import { cloudStorage, AppDatabaseState } from '../services/cloudStorage';
import { initialVehicles, initialBookings, initialAgencySettings, initialAdmins, MAIN_ADMIN_PHONE, DEFAULT_MAIN_ADMIN_PERMISSIONS, DEFAULT_SUB_ADMIN_PERMISSIONS, matchPhones } from '../data/defaultData';

export interface SearchState {
  pickup: string;
  drop: string;
  travelDate: string;
  pickupTime: string;
}

interface AppContextType {
  // Settings
  settings: AgencySettings;
  updateSettings: (s: AgencySettings) => void;

  // Vehicles
  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (v: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  toggleVehicleAvailability: (id: string) => void;

  // Bookings
  bookings: Booking[];
  createBooking: (b: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'status' | 'status_history'>) => Booking;
  updateBookingStatus: (id: string, status: BookingStatus, notes?: string) => void;
  deleteBooking: (id: string) => void;
  addAdminNote: (id: string, note: string) => void;

  // Admins (RBAC)
  admins: Admin[];
  addAdmin: (a: Omit<Admin, 'id' | 'created_at'>) => void;
  updateAdmin: (a: Admin) => void;
  removeAdmin: (id: string) => void;
  toggleAdminActive: (id: string) => void;
  updateAdminPermissions: (id: string, permissions: AdminPermissions) => void;
  assignUserToAdmin: (adminId: string, userPhone: string) => void;
  unassignUserFromAdmin: (adminId: string, userPhone: string) => void;
  getAdminsForUser: (userPhone: string) => Admin[];
  getCurrentAdmin: () => Admin | null;
  registerMainAdmin: (name: string, phone: string) => string;

  // Search
  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;

  // Auth
  currentUser: UserSession | null;
  loginCustomer: (name: string, phone: string) => void;
  loginAdminDirectly: (admin: Admin) => void;
  sendAdminOtp: (name: string, phone: string) => string;
  verifyAdminOtp: (otp: string) => boolean;
  logout: () => void;

  pendingAdminData: { name: string; phone: string; otp: string } | null;
  setPendingAdminData: React.Dispatch<React.SetStateAction<{ name: string; phone: string; otp: string } | null>>;

  // UI state
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  authModalTab: 'customer' | 'admin';
  setAuthModalTab: (tab: 'customer' | 'admin') => void;
  showUserBookingsModal: boolean;
  setShowUserBookingsModal: (v: boolean) => void;
  bookingModalVehicle: Vehicle | null;
  openBookingModal: (v: Vehicle) => void;
  closeBookingModal: () => void;

  // Sync
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  refreshFromCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLocal = cloudStorage.getLocalState();

  const [settings, setSettings] = useState<AgencySettings>(initialLocal.settings);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialLocal.vehicles);
  const [bookings, setBookings] = useState<Booking[]>(initialLocal.bookings);
  const [admins, setAdmins] = useState<Admin[]>(initialLocal.admins);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('mohanty_user_session_v7');
    if (raw) { try { return JSON.parse(raw); } catch { return null; } }
    return null;
  });

  const [pendingAdminData, setPendingAdminData] = useState<{ name: string; phone: string; otp: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'admin'>('customer');
  const [showUserBookingsModal, setShowUserBookingsModal] = useState(false);
  const [bookingModalVehicle, setBookingModalVehicle] = useState<Vehicle | null>(null);

  const [searchState, setSearchState] = useState<SearchState>({
    pickup: 'Bhubaneswar',
    drop: 'Puri',
    travelDate: getDefaultDate(),
    pickupTime: '08:00 AM'
  });

  const stateRef = useRef<AppDatabaseState>({ vehicles, bookings, settings, admins, last_updated: new Date().toISOString() });

  useEffect(() => {
    stateRef.current = { vehicles, bookings, settings, admins, last_updated: new Date().toISOString() };
  }, [vehicles, bookings, settings, admins]);

  const refreshFromCloud = async () => {
    setIsSyncing(true);
    try {
      const cloudData = await cloudStorage.pullFromCloud();
      if (cloudData) {
        setVehicles(cloudData.vehicles);
        setBookings(cloudData.bookings);
        setSettings(cloudData.settings);
        setAdmins(cloudData.admins);
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.warn('Cloud sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshFromCloud();
    const interval = setInterval(() => { refreshFromCloud(); }, 5000);
    const unsubscribe = cloudStorage.onUpdate((newState) => {
      setVehicles(newState.vehicles);
      setBookings(newState.bookings);
      setSettings(newState.settings);
      setAdmins(newState.admins);
    });
    return () => { clearInterval(interval); unsubscribe(); };
  }, []);

  const pushStateUpdate = (
    newVehicles?: Vehicle[],
    newBookings?: Booking[],
    newSettings?: AgencySettings,
    newAdmins?: Admin[]
  ) => {
    const updatedState: AppDatabaseState = {
      vehicles: newVehicles ?? stateRef.current.vehicles,
      bookings: newBookings ?? stateRef.current.bookings,
      settings: newSettings ?? stateRef.current.settings,
      admins: newAdmins ?? stateRef.current.admins,
      last_updated: new Date().toISOString()
    };
    if (newVehicles) setVehicles(newVehicles);
    if (newBookings) setBookings(newBookings);
    if (newSettings) setSettings(newSettings);
    if (newAdmins) setAdmins(newAdmins);
    cloudStorage.pushToCloud(updatedState);
  };

  // ─── SETTINGS ────────────────────────────────────────────────────────────
  const updateSettings = (s: AgencySettings) => pushStateUpdate(undefined, undefined, s);

  // ─── VEHICLES ────────────────────────────────────────────────────────────
  const addVehicle = (v: Vehicle) => pushStateUpdate([v, ...stateRef.current.vehicles]);
  const updateVehicle = (v: Vehicle) => pushStateUpdate(stateRef.current.vehicles.map(item => item.id === v.id ? v : item));
  const deleteVehicle = (id: string) => pushStateUpdate(stateRef.current.vehicles.filter(v => v.id !== id));
  const toggleVehicleAvailability = (id: string) =>
    pushStateUpdate(stateRef.current.vehicles.map(v => v.id === id ? { ...v, is_available: !v.is_available } : v));

  // ─── BOOKINGS ────────────────────────────────────────────────────────────
  const createBooking = (b: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'status' | 'status_history'>): Booking => {
    const newBooking: Booking = {
      ...b,
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      booking_code: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      status_history: [{
        id: `sh-${Date.now()}`,
        booking_id: `bk-${Date.now()}`,
        status: 'pending',
        changed_by_name: b.customer_name,
        notes: 'Booking request submitted by customer',
        timestamp: new Date().toISOString()
      }]
    };
    const updated = [newBooking, ...stateRef.current.bookings];
    pushStateUpdate(undefined, updated);
    return newBooking;
  };

  const updateBookingStatus = (id: string, status: BookingStatus, notes?: string) => {
    const adminName = currentUser?.name || 'Admin';
    const adminId = currentUser?.admin_id;
    const historyEntry: BookingStatusHistory = {
      id: `sh-${Date.now()}`,
      booking_id: id,
      status,
      changed_by_admin_id: adminId,
      changed_by_name: adminName,
      notes,
      timestamp: new Date().toISOString()
    };
    const updated = stateRef.current.bookings.map(b => {
      if (b.id !== id) return b;
      return {
        ...b,
        status,
        status_history: [...(b.status_history || []), historyEntry]
      };
    });
    pushStateUpdate(undefined, updated);
  };

  const deleteBooking = (id: string) => pushStateUpdate(undefined, stateRef.current.bookings.filter(b => b.id !== id));

  const addAdminNote = (id: string, note: string) => {
    const updated = stateRef.current.bookings.map(b => b.id === id ? { ...b, admin_notes: note } : b);
    pushStateUpdate(undefined, updated);
  };

  // ─── ADMINS ──────────────────────────────────────────────────────────────
  const getCurrentAdmin = (): Admin | null => {
    if (!currentUser || currentUser.role !== 'admin') return null;
    if (currentUser.admin_id) {
      return stateRef.current.admins.find(a => a.id === currentUser.admin_id) || null;
    }
    // Fallback: find by phone
    return stateRef.current.admins.find(a => matchPhones(a.phone, currentUser.phone)) || null;
  };

  const addAdmin = (a: Omit<Admin, 'id' | 'created_at'>) => {
    const newAdmin: Admin = {
      ...a,
      id: `admin-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    pushStateUpdate(undefined, undefined, undefined, [...stateRef.current.admins, newAdmin]);
  };

  const updateAdmin = (a: Admin) => {
    pushStateUpdate(undefined, undefined, undefined, stateRef.current.admins.map(item => item.id === a.id ? a : item));
  };

  const removeAdmin = (id: string) => {
    pushStateUpdate(undefined, undefined, undefined, stateRef.current.admins.filter(a => a.id !== id));
  };

  const toggleAdminActive = (id: string) => {
    pushStateUpdate(undefined, undefined, undefined, stateRef.current.admins.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
  };

  const updateAdminPermissions = (id: string, permissions: AdminPermissions) => {
    pushStateUpdate(undefined, undefined, undefined, stateRef.current.admins.map(a => a.id === id ? { ...a, permissions } : a));
  };

  const assignUserToAdmin = (adminId: string, userPhone: string) => {
    const clean = userPhone.replace(/\D/g, '');
    pushStateUpdate(undefined, undefined, undefined, stateRef.current.admins.map(a => {
      if (a.id !== adminId) return a;
      const existing = a.assigned_user_phones || [];
      if (existing.some(p => matchPhones(p, clean))) return a;
      return { ...a, assigned_user_phones: [...existing, clean] };
    }));
  };

  const unassignUserFromAdmin = (adminId: string, userPhone: string) => {
    pushStateUpdate(undefined, undefined, undefined, stateRef.current.admins.map(a => {
      if (a.id !== adminId) return a;
      return { ...a, assigned_user_phones: (a.assigned_user_phones || []).filter(p => !matchPhones(p, userPhone)) };
    }));
  };

  const getAdminsForUser = (userPhone: string): Admin[] => {
    return stateRef.current.admins.filter(a =>
      a.is_active && (
        a.role === 'main_admin' ||
        (a.assigned_user_phones || []).some(p => matchPhones(p, userPhone))
      )
    );
  };

  const registerMainAdmin = (name: string, phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    const standardPhone = clean.length >= 10 ? clean.slice(-10) : clean;
    // Check if already registered
    const existing = stateRef.current.admins.find(a => matchPhones(a.phone, standardPhone));
    if (existing) {
      const updated = stateRef.current.admins.map(a =>
        a.id === existing.id ? { ...a, role: 'main_admin' as const, is_active: true, permissions: DEFAULT_MAIN_ADMIN_PERMISSIONS } : a
      );
      pushStateUpdate(undefined, undefined, undefined, updated);
      const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
      setPendingAdminData({ name: existing.name, phone: existing.phone, otp: generatedOtp });
      return generatedOtp;
    }
    const newAdmin: Admin = {
      id: `admin-main-${Date.now()}`,
      name: name.trim() || 'Main Admin',
      phone: standardPhone,
      role: 'main_admin',
      permissions: DEFAULT_MAIN_ADMIN_PERMISSIONS,
      contact_phone: phone.trim(),
      contact_whatsapp: phone.trim().replace(/\D/g, ''),
      is_active: true,
      created_at: new Date().toISOString(),
      assigned_user_phones: []
    };
    const updated = [...stateRef.current.admins, newAdmin];
    pushStateUpdate(undefined, undefined, undefined, updated);
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    setPendingAdminData({ name: newAdmin.name, phone: newAdmin.phone, otp: generatedOtp });
    return generatedOtp;
  };

  // ─── AUTH ────────────────────────────────────────────────────────────────
  const loginCustomer = (name: string, phone: string) => {
    const session: UserSession = { role: 'customer', name: name.trim(), phone: phone.trim(), logged_in_at: new Date().toISOString() };
    setCurrentUser(session);
    localStorage.setItem('mohanty_user_session_v7', JSON.stringify(session));
    setShowAuthModal(false);
  };

  const loginAdminDirectly = (admin: Admin) => {
    const session: UserSession = {
      role: 'admin',
      name: admin.name,
      phone: admin.phone,
      logged_in_at: new Date().toISOString(),
      admin_id: admin.id,
      admin_role: admin.role
    };
    setCurrentUser(session);
    localStorage.setItem('mohanty_user_session_v7', JSON.stringify(session));
    setShowAuthModal(false);
  };

  const sendAdminOtp = (name: string, phone: string): string => {
    // Check if this phone matches any active admin (handles full or 10-digit formats)
    const matchedAdmin = stateRef.current.admins.find(a => matchPhones(a.phone, phone) && a.is_active);
    if (!matchedAdmin) return 'UNAUTHORIZED';
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    setPendingAdminData({ name: name.trim() || matchedAdmin.name, phone: phone.trim(), otp: generatedOtp });
    return generatedOtp;
  };

  const verifyAdminOtp = (inputOtp: string): boolean => {
    if (!pendingAdminData) return false;
    if (inputOtp.trim() === pendingAdminData.otp) {
      const matchedAdmin = stateRef.current.admins.find(a => matchPhones(a.phone, pendingAdminData.phone) && a.is_active);
      const session: UserSession = {
        role: 'admin',
        name: matchedAdmin?.name || pendingAdminData.name,
        phone: pendingAdminData.phone,
        logged_in_at: new Date().toISOString(),
        admin_id: matchedAdmin?.id,
        admin_role: matchedAdmin?.role || 'main_admin'
      };
      setCurrentUser(session);
      localStorage.setItem('mohanty_user_session_v7', JSON.stringify(session));
      setPendingAdminData(null);
      setShowAuthModal(false);
      refreshFromCloud();
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mohanty_user_session_v7');
    setPendingAdminData(null);
  };

  const openBookingModal = (v: Vehicle) => setBookingModalVehicle(v);
  const closeBookingModal = () => setBookingModalVehicle(null);

  return (
    <AppContext.Provider value={{
      settings, updateSettings,
      vehicles, addVehicle, updateVehicle, deleteVehicle, toggleVehicleAvailability,
      bookings, createBooking, updateBookingStatus, deleteBooking, addAdminNote,
      admins, addAdmin, updateAdmin, removeAdmin, toggleAdminActive, updateAdminPermissions,
      assignUserToAdmin, unassignUserFromAdmin, getAdminsForUser, getCurrentAdmin, registerMainAdmin,
      searchState, setSearchState,
      currentUser, loginCustomer, loginAdminDirectly, sendAdminOtp, verifyAdminOtp, logout,
      pendingAdminData, setPendingAdminData,
      showAuthModal, setShowAuthModal,
      authModalTab, setAuthModalTab,
      showUserBookingsModal, setShowUserBookingsModal,
      bookingModalVehicle, openBookingModal, closeBookingModal,
      isSyncing, lastSyncedAt, refreshFromCloud
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used in AppProvider');
  return ctx;
};
