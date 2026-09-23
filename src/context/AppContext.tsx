import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle, Booking, AgencySettings } from '../types';
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

  isAdminView: boolean;
  setIsAdminView: (v: boolean) => void;
  loginAdmin: (pin: string) => boolean;
  logoutAdmin: () => void;

  showAdminLoginModal: boolean;
  setShowAdminLoginModal: (v: boolean) => void;

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

  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    return localStorage.getItem('mohanty_admin_auth') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
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

  const loginAdmin = (pin: string): boolean => {
    if (pin.trim() === '1234' || pin.trim().toLowerCase() === 'admin') {
      setIsAdminView(true);
      localStorage.setItem('mohanty_admin_auth', 'true');
      setShowAdminLoginModal(false);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminView(false);
    localStorage.removeItem('mohanty_admin_auth');
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
      isAdminView,
      setIsAdminView,
      loginAdmin,
      logoutAdmin,
      showAdminLoginModal,
      setShowAdminLoginModal,
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
