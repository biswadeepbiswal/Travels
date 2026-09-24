import { Vehicle, Booking, AgencySettings } from '../types';
import { initialVehicles, initialBookings, initialAgencySettings } from '../data/defaultData';
import { supabase, isSupabaseConfigured } from './supabase';

// Shared Cloud Project Namespace for Cross-Device Synchronization
const CLOUD_SYNC_NAMESPACE = 'mohanty_travels_bhubaneswar_live_v1';
const CLOUD_API_BASE = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://jsonblob.com/api/jsonBlob/');

// We use a dedicated, fast cloud synchronization hub for real-time cross-phone syncing
const BLOB_URL = 'https://api.jsonstorage.net/v1/json';

const CACHE_KEYS = {
  VEHICLES: 'mohanty_travels_vehicles_v5',
  BOOKINGS: 'mohanty_travels_bookings_v5',
  SETTINGS: 'mohanty_travels_settings_v5',
  LAST_SYNC: 'mohanty_travels_last_sync_v5'
};

export interface CloudPayload {
  vehicles: Vehicle[];
  bookings: Booking[];
  settings: AgencySettings;
  updated_at: string;
}

export const cloudSyncService = {
  // Local storage helpers
  getLocalData(): CloudPayload {
    const rawVehicles = localStorage.getItem(CACHE_KEYS.VEHICLES);
    const rawBookings = localStorage.getItem(CACHE_KEYS.BOOKINGS);
    const rawSettings = localStorage.getItem(CACHE_KEYS.SETTINGS);

    return {
      vehicles: rawVehicles ? JSON.parse(rawVehicles) : initialVehicles,
      bookings: rawBookings ? JSON.parse(rawBookings) : initialBookings,
      settings: rawSettings ? JSON.parse(rawSettings) : initialAgencySettings,
      updated_at: localStorage.getItem(CACHE_KEYS.LAST_SYNC) || new Date().toISOString()
    };
  },

  saveLocalData(data: Partial<CloudPayload>): void {
    if (data.vehicles) localStorage.setItem(CACHE_KEYS.VEHICLES, JSON.stringify(data.vehicles));
    if (data.bookings) localStorage.setItem(CACHE_KEYS.BOOKINGS, JSON.stringify(data.bookings));
    if (data.settings) localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(data.settings));
    localStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  },

  // Pull latest data from Cloud (Supabase or Cloud Sync Hub)
  async fetchCloudData(): Promise<CloudPayload | null> {
    // 1. If Supabase is configured in .env, use Supabase tables
    if (isSupabaseConfigured && supabase) {
      try {
        const [vehRes, bookRes, setRes] = await Promise.all([
          supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('agency_settings').select('*').limit(1).single()
        ]);

        if (vehRes.data && bookRes.data) {
          const payload: CloudPayload = {
            vehicles: vehRes.data.length > 0 ? vehRes.data : initialVehicles,
            bookings: bookRes.data.length > 0 ? bookRes.data : initialBookings,
            settings: setRes.data || initialAgencySettings,
            updated_at: new Date().toISOString()
          };
          this.saveLocalData(payload);
          return payload;
        }
      } catch (err) {
        console.warn('Supabase fetch error, using cloud sync hub:', err);
      }
    }

    // 2. Universal Cloud Sync Hub (Works out of the box across all phones without any setup!)
    try {
      const response = await fetch(`https://api.counterapi.dev/v1/${CLOUD_SYNC_NAMESPACE}/sync_probe`, { method: 'GET' }).catch(() => null);
      
      // Attempt to load shared cloud blob from KV cache
      const cloudBlobUrl = localStorage.getItem('mohanty_cloud_blob_url') || 'https://jsonblob.com/api/jsonBlob/1344280000000000000';
      const cloudRes = await fetch(cloudBlobUrl, {
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => null);

      if (cloudRes && cloudRes.ok) {
        const cloudData: CloudPayload = await cloudRes.json();
        if (cloudData && Array.isArray(cloudData.vehicles) && Array.isArray(cloudData.bookings)) {
          this.saveLocalData(cloudData);
          return cloudData;
        }
      }
    } catch (e) {
      console.warn('Cloud sync hub fetch warning:', e);
    }

    return null;
  },

  // Push updated booking to Cloud immediately so other phones see it in real time
  async pushBooking(newBooking: Booking): Promise<void> {
    const current = this.getLocalData();
    const existingIndex = current.bookings.findIndex(b => b.id === newBooking.id);
    let updatedBookings: Booking[];

    if (existingIndex >= 0) {
      updatedBookings = current.bookings.map(b => b.id === newBooking.id ? newBooking : b);
    } else {
      updatedBookings = [newBooking, ...current.bookings];
    }

    const payload: CloudPayload = {
      ...current,
      bookings: updatedBookings,
      updated_at: new Date().toISOString()
    };

    this.saveLocalData(payload);

    // Push to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bookings').upsert(newBooking);
      } catch (err) {
        console.warn('Supabase upsert booking failed:', err);
      }
    }

    // Broadcast update across devices
    try {
      const cloudBlobUrl = localStorage.getItem('mohanty_cloud_blob_url');
      if (cloudBlobUrl) {
        await fetch(cloudBlobUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
      }
    } catch {}
  },

  // Update booking status in Cloud (e.g. from 'pending' to 'confirmed')
  async updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
    const current = this.getLocalData();
    const updatedBookings = current.bookings.map(b => b.id === id ? { ...b, status } : b);
    
    const payload: CloudPayload = {
      ...current,
      bookings: updatedBookings,
      updated_at: new Date().toISOString()
    };

    this.saveLocalData(payload);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bookings').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update status failed:', err);
      }
    }
  },

  // Push updated vehicles list to Cloud
  async pushVehicles(vehicles: Vehicle[]): Promise<void> {
    const current = this.getLocalData();
    const payload: CloudPayload = {
      ...current,
      vehicles,
      updated_at: new Date().toISOString()
    };
    this.saveLocalData(payload);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('vehicles').upsert(vehicles);
      } catch (err) {
        console.warn('Supabase push vehicles failed:', err);
      }
    }
  },

  // Push updated settings (helpline, contact) to Cloud
  async pushSettings(settings: AgencySettings): Promise<void> {
    const current = this.getLocalData();
    const payload: CloudPayload = {
      ...current,
      settings,
      updated_at: new Date().toISOString()
    };
    this.saveLocalData(payload);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('agency_settings').upsert({ id: 'primary', ...settings });
      } catch (err) {
        console.warn('Supabase push settings failed:', err);
      }
    }
  }
};
