import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle, Booking, AgencySettings, UserSession } from '../types';
import { storageService } from '../services/storageService';

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
  deleteBooking: (id: string) => void;

  searchState: SearchState;
  setSearchState: React.Dispatch<React.SetStateAction<SearchState>>;

  // Auth & Session
  currentUser: UserSession | null;
  loginCustomer: (name: string, phone: string) => void;
  sendAdminOtp: (name: string, phone: string) => string; // returns generated OTP
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

  resetToDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getDefaultDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AgencySettings>(storageService.getSettings);
  const [vehicles, setVehicles] = useState<Vehicle[]>(storageService.getVehicles);
  const [bookings, setBookings] = useState<Booking[]>(storageService.getBookings);

  // User session state
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('mohanty_user_session_v5');
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

  useEffect(() => {
    storageService.saveVehicles(vehicles);
  }, [vehicles]);

  const updateSettings = (s: AgencySettings) => {
    setSettings(s);
    storageService.saveSettings(s);
  };

  const addVehicle = (v: Vehicle) => {
    const updated = [v, ...vehicles];
    setVehicles(updated);
    storageService.saveVehicles(updated);
  };

  const updateVehicle = (v: Vehicle) => {
    const updated = vehicles.map(item => item.id === v.id ? v : item);
    setVehicles(updated);
    storageService.saveVehicles(updated);
  };

  const deleteVehicle = (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    storageService.saveVehicles(updated);
  };

  const toggleVehicleAvailability = (id: string) => {
    const updated = vehicles.map(v => {
      if (v.id === id) {
        return { ...v, is_available: !v.is_available };
      }
      return v;
    });
    setVehicles(updated);
    storageService.saveVehicles(updated);
  };

  const createBooking = (b: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'status'>) => {
    const created = storageService.addBooking(b);
    setBookings(storageService.getBookings());
    return created;
  };

  const deleteBooking = (id: string) => {
    const updated = storageService.deleteBooking(id);
    setBookings(updated);
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
    localStorage.setItem('mohanty_user_session_v5', JSON.stringify(session));
    setShowAuthModal(false);
  };

  const sendAdminOtp = (name: string, phone: string): string => {
    // Generate random 4-digit OTP
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
    // Accepts generated OTP or universal master OTP '1234'
    if (inputOtp.trim() === pendingAdminData.otp || inputOtp.trim() === '1234') {
      const session: UserSession = {
        role: 'admin',
        name: pendingAdminData.name,
        phone: pendingAdminData.phone,
        logged_in_at: new Date().toISOString()
      };
      setCurrentUser(session);
      localStorage.setItem('mohanty_user_session_v5', JSON.stringify(session));
      setPendingAdminData(null);
      setShowAuthModal(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mohanty_user_session_v5');
    setPendingAdminData(null);
  };

  const openBookingModal = (v: Vehicle) => {
    setBookingModalVehicle(v);
  };

  const closeBookingModal = () => {
    setBookingModalVehicle(null);
  };

  const resetToDemo = () => {
    storageService.resetDefaults();
    setVehicles(storageService.getVehicles());
    setBookings(storageService.getBookings());
    setSettings(storageService.getSettings());
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
      resetToDemo
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
