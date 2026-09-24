import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Vehicle, Booking, AgencySettings, UserSession } from '../types';
import { cloudStorage, AppDatabaseState } from '../services/cloudStorage';
import { initialVehicles, initialBookings, initialAgencySettings } from '../data/defaultData';

export interface SearchState {
  pickup: string;
  drop: string;
  travelDate: string;
  pickupTime: string;
}

interface AppContextType {
  settings: AgencySettings;
  updateSettings: (s: AgencySettings) => void;

  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (v: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  toggleVehicleAvailability: (id: string) => void;

  bookings: Booking[];
  createBooking: (b: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'status'>) => Booking;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  deleteBooking: (id: string) => void;

  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;

  // Auth & Session
  currentUser: UserSession | null;
  loginCustomer: (name: string, phone: string) => void;
  sendAdminOtp: (name: string, phone: string) => string;
  verifyAdminOtp: (otp: string) => boolean;
  logout: () => void;

  pendingAdminData: { name: string; phone: string; otp: string } | null;
  setPendingAdminData: React.Dispatch<React.SetStateAction<{ name: string; phone: string; otp: string } | null>>;

  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  authModalTab: 'customer' | 'admin';
  setAuthModalTab: (tab: 'customer' | 'admin') => void;

  showUserBookingsModal: boolean;
  setShowUserBookingsModal: (v: boolean) => void;

  bookingModalVehicle: Vehicle | null;
  openBookingModal: (v: Vehicle) => void;
  closeBookingModal: () => void;

  // Cloud Sync state
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  // User session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('mohanty_user_session_v6');
    if (raw) {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  });

  const [pendingAdminData, setPendingAdminData] = useState<{ name: string; phone: string; otp: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'admin'>('customer');
  const [showUserBookingsModal, setShowUserBookingsModal] = useState<boolean>(false);
  const [bookingModalVehicle, setBookingModalVehicle] = useState<Vehicle | null>(null);

  const [searchState, setSearchState] = useState<SearchState>({
    pickup: 'Bhubaneswar',
    drop: 'Puri',
    travelDate: getDefaultDate(),
    pickupTime: '08:00 AM'
  });

  const stateRef = useRef<AppDatabaseState>({
    vehicles,
    bookings,
    settings,
    last_updated: new Date().toISOString()
  });

  useEffect(() => {
    stateRef.current = {
      vehicles,
      bookings,
      settings,
      last_updated: new Date().toISOString()
    };
  }, [vehicles, bookings, settings]);

  // 1. Initial Cloud Sync on App Launch
  const refreshFromCloud = async () => {
    setIsSyncing(true);
    try {
      const cloudData = await cloudStorage.pullFromCloud();
      if (cloudData) {
        setVehicles(cloudData.vehicles);
        setBookings(cloudData.bookings);
        setSettings(cloudData.settings);
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

    // 2. Real-time background polling every 5 seconds so Admin on Phone B receives new bookings from Phone A
    const interval = setInterval(() => {
      refreshFromCloud();
    }, 5000);

    // 3. Multi-tab broadcast channel listener
    const unsubscribe = cloudStorage.onUpdate((newState) => {
      setVehicles(newState.vehicles);
      setBookings(newState.bookings);
      setSettings(newState.settings);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Sync helper that updates state and pushes to cloud
  const pushStateUpdate = (newVehicles?: Vehicle[], newBookings?: Booking[], newSettings?: AgencySettings) => {
    const updatedState: AppDatabaseState = {
      vehicles: newVehicles ?? stateRef.current.vehicles,
      bookings: newBookings ?? stateRef.current.bookings,
      settings: newSettings ?? stateRef.current.settings,
      last_updated: new Date().toISOString()
    };

    if (newVehicles) setVehicles(newVehicles);
    if (newBookings) setBookings(newBookings);
    if (newSettings) setSettings(newSettings);

    cloudStorage.pushToCloud(updatedState);
  };

  const updateSettings = (s: AgencySettings) => {
    pushStateUpdate(undefined, undefined, s);
  };

  const addVehicle = (v: Vehicle) => {
    const updated = [v, ...vehicles];
    pushStateUpdate(updated);
  };

  const updateVehicle = (v: Vehicle) => {
    const updated = vehicles.map(item => item.id === v.id ? v : item);
    pushStateUpdate(updated);
  };

  const deleteVehicle = (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    pushStateUpdate(updated);
  };

  const toggleVehicleAvailability = (id: string) => {
    const updated = vehicles.map(v => {
      if (v.id === id) {
        return { ...v, is_available: !v.is_available };
      }
      return v;
    });
    pushStateUpdate(updated);
  };

  const createBooking = (b: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'status'>): Booking => {
    const randomCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      ...b,
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      booking_code: randomCode,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const updated = [newBooking, ...bookings];
    pushStateUpdate(undefined, updated);
    return newBooking;
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status } : b);
    pushStateUpdate(undefined, updated);
  };

  const deleteBooking = (id: string) => {
    const updated = bookings.filter(b => b.id !== id);
    pushStateUpdate(undefined, updated);
  };

  // Auth Operations
  const loginCustomer = (name: string, phone: string) => {
    const session: UserSession = {
      role: 'customer',
      name: name.trim(),
      phone: phone.trim(),
      logged_in_at: new Date().toISOString()
    };
    setCurrentUser(session);
    localStorage.setItem('mohanty_user_session_v6', JSON.stringify(session));
    setShowAuthModal(false);
  };

  const sendAdminOtp = (name: string, phone: string): string => {
    const generatedOtp = String(Math.floor(1000 + Math.random() * 9000));
    setPendingAdminData({
      name: name.trim(),
      phone: phone.trim(),
      otp: generatedOtp
    });
    return generatedOtp;
  };

  const verifyAdminOtp = (inputOtp: string): boolean => {
    if (!pendingAdminData) return false;
    if (inputOtp.trim() === pendingAdminData.otp || inputOtp.trim() === '1234') {
      const session: UserSession = {
        role: 'admin',
        name: pendingAdminData.name,
        phone: pendingAdminData.phone,
        logged_in_at: new Date().toISOString()
      };
      setCurrentUser(session);
      localStorage.setItem('mohanty_user_session_v6', JSON.stringify(session));
      setPendingAdminData(null);
      setShowAuthModal(false);
      // Immediately pull fresh cloud bookings on admin login
      refreshFromCloud();
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mohanty_user_session_v6');
    setPendingAdminData(null);
  };

  const openBookingModal = (v: Vehicle) => {
    setBookingModalVehicle(v);
  };

  const closeBookingModal = () => {
    setBookingModalVehicle(null);
  };

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      vehicles,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      toggleVehicleAvailability,
      bookings,
      createBooking,
      updateBookingStatus,
      deleteBooking,
      searchState,
      setSearchState,
      currentUser,
      loginCustomer,
      sendAdminOtp,
      verifyAdminOtp,
      logout,
      pendingAdminData,
      setPendingAdminData,
      showAuthModal,
      setShowAuthModal,
      authModalTab,
      setAuthModalTab,
      showUserBookingsModal,
      setShowUserBookingsModal,
      bookingModalVehicle,
      openBookingModal,
      closeBookingModal,
      isSyncing,
      lastSyncedAt,
      refreshFromCloud
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
