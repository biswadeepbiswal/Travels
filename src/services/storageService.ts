import { Vehicle, Booking, AgencySettings } from '../types';
import { initialVehicles, initialBookings, initialAgencySettings } from '../data/defaultData';

const KEYS = {
  VEHICLES: 'mohanty_travels_vehicles_v3',
  BOOKINGS: 'mohanty_travels_bookings_v3',
  SETTINGS: 'mohanty_travels_settings_v3'
};

export const storageService = {
  getSettings(): AgencySettings {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(initialAgencySettings));
      return initialAgencySettings;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialAgencySettings;
    }
  },
  saveSettings(settings: AgencySettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getVehicles(): Vehicle[] {
    const raw = localStorage.getItem(KEYS.VEHICLES);
    if (!raw) {
      localStorage.setItem(KEYS.VEHICLES, JSON.stringify(initialVehicles));
      return initialVehicles;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialVehicles;
    }
  },
  saveVehicles(vehicles: Vehicle[]): void {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  getBookings(): Booking[] {
    const raw = localStorage.getItem(KEYS.BOOKINGS);
    if (!raw) {
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(initialBookings));
      return initialBookings;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialBookings;
    }
  },
  saveBookings(bookings: Booking[]): void {
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  addBooking(bookingData: Omit<Booking, 'id' | 'booking_code' | 'created_at' | 'status'>): Booking {
    const existing = this.getBookings();
    const randomCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      booking_code: randomCode,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    const updated = [newBooking, ...existing];
    this.saveBookings(updated);
    return newBooking;
  },

  deleteBooking(id: string): Booking[] {
    const existing = this.getBookings();
    const updated = existing.filter(b => b.id !== id);
    this.saveBookings(updated);
    return updated;
  },

  resetDefaults(): void {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(initialVehicles));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(initialBookings));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(initialAgencySettings));
  }
};
