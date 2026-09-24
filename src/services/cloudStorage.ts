import { Vehicle, Booking, AgencySettings } from '../types';
import { initialVehicles, initialBookings, initialAgencySettings } from '../data/defaultData';
import { supabase, isSupabaseConfigured } from './supabase';

const CLOUD_SYNC_URL = 'https://api.jsonbin.io/v3/b';
const MASTER_KEY = '$2a$10$w8.B9YmHn08B1nB5X4sL/O40M8vV8MvM7L.x.e7f8g9h0i1j2k3l4'; // Fallback sync key
const LOCAL_STORAGE_KEY = 'mohanty_travels_v6_data';

export interface AppDatabaseState {
  vehicles: Vehicle[];
  bookings: Booking[];
  settings: AgencySettings;
  last_updated: string;
}

const defaultState: AppDatabaseState = {
  vehicles: initialVehicles,
  bookings: initialBookings,
  settings: initialAgencySettings,
  last_updated: new Date().toISOString()
};

// Global in-memory broadcast channel for multi-tab/same-device instant sync
const broadcast = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mohanty_travels_sync_channel') : null;

// Free, fast public cloud sync endpoint powered by npoint / jsonbin / kv
const CLOUD_BIN_ID = 'mohanty_travels_odisha_v6';
const CLOUD_KV_ENDPOINT = `https://kv.val.run/mohanty_travels_app_state_v6`;

export const cloudStorage = {
  getLocalState(): AppDatabaseState {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      this.saveLocalState(defaultState);
      return defaultState;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        vehicles: Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0 ? parsed.vehicles : initialVehicles,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : initialBookings,
        settings: {
          ...initialAgencySettings,
          ...(parsed.settings || {}),
          helpline_number: parsed.settings?.helpline_number || initialAgencySettings.helpline_number
        },
        last_updated: parsed.last_updated || new Date().toISOString()
      };
    } catch {
      return defaultState;
    }
  },

  saveLocalState(state: AppDatabaseState): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    if (broadcast) {
      try {
        broadcast.postMessage({ type: 'DATA_UPDATED', state });
      } catch {}
    }
  },

  // Pull latest data from Cloud (Supabase or Cloud KV)
  async pullFromCloud(): Promise<AppDatabaseState> {
    // 1. If Supabase is configured
    if (isSupabaseConfigured && supabase) {
      try {
        const [vehRes, bookRes, setRes] = await Promise.all([
          supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('agency_settings').select('*').limit(1).maybeSingle()
        ]);

        if (vehRes.data && bookRes.data) {
          const state: AppDatabaseState = {
            vehicles: vehRes.data.length > 0 ? vehRes.data : initialVehicles,
            bookings: bookRes.data,
            settings: setRes.data ? { ...initialAgencySettings, ...setRes.data } : initialAgencySettings,
            last_updated: new Date().toISOString()
          };
          this.saveLocalState(state);
          return state;
        }
      } catch (err) {
        console.warn('Supabase pull warning:', err);
      }
    }

    // 2. High-speed Cloud KV Sync (Enables cross-phone syncing between Phone A and Phone B)
    try {
      const res = await fetch(CLOUD_KV_ENDPOINT, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }).catch(() => null);

      if (res && res.ok) {
        const cloudData: AppDatabaseState = await res.json();
        if (cloudData && Array.isArray(cloudData.bookings)) {
          const local = this.getLocalState();
          // Merge bookings so no booking is lost
          const bookingMap = new Map<string, Booking>();
          local.bookings.forEach(b => bookingMap.set(b.id, b));
          cloudData.bookings.forEach(b => bookingMap.set(b.id, b));

          const merged: AppDatabaseState = {
            vehicles: Array.isArray(cloudData.vehicles) && cloudData.vehicles.length > 0 ? cloudData.vehicles : local.vehicles,
            bookings: Array.from(bookingMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            settings: { ...local.settings, ...(cloudData.settings || {}) },
            last_updated: new Date().toISOString()
          };
          this.saveLocalState(merged);
          return merged;
        }
      }
    } catch (e) {
      console.warn('Cloud KV pull warning:', e);
    }

    return this.getLocalState();
  },

  // Push updated state to Cloud immediately
  async pushToCloud(state: AppDatabaseState): Promise<void> {
    this.saveLocalState(state);

    // 1. Supabase Push
    if (isSupabaseConfigured && supabase) {
      try {
        if (state.bookings.length > 0) {
          await supabase.from('bookings').upsert(state.bookings);
        }
        if (state.vehicles.length > 0) {
          await supabase.from('vehicles').upsert(state.vehicles);
        }
        await supabase.from('agency_settings').upsert({ id: 'primary', ...state.settings });
      } catch (err) {
        console.warn('Supabase push warning:', err);
      }
    }

    // 2. Cloud KV Push (Broadcasts instantly to all other phones)
    try {
      await fetch(CLOUD_KV_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      }).catch(() => null);
    } catch (e) {
      console.warn('Cloud KV push warning:', e);
    }
  },

  // Subscribe to multi-tab updates
  onUpdate(callback: (state: AppDatabaseState) => void): () => void {
    if (!broadcast) return () => {};
    const listener = (event: MessageEvent) => {
      if (event.data?.type === 'DATA_UPDATED' && event.data?.state) {
        callback(event.data.state);
      }
    };
    broadcast.addEventListener('message', listener);
    return () => broadcast.removeEventListener('message', listener);
  }
};
