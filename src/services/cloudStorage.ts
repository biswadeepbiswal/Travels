import { Vehicle, Booking, AgencySettings, Admin } from '../types';
import { initialVehicles, initialBookings, initialAgencySettings, initialAdmins, matchPhones } from '../data/defaultData';
import { supabase, isSupabaseConfigured } from './supabase';

const LOCAL_STORAGE_KEY = 'mohanty_travels_v7_data';
const CLOUD_KV_ENDPOINT = `https://kv.val.run/mohanty_travels_app_state_v7`;

export interface AppDatabaseState {
  vehicles: Vehicle[];
  bookings: Booking[];
  settings: AgencySettings;
  admins: Admin[];
  last_updated: string;
}

const defaultState: AppDatabaseState = {
  vehicles: initialVehicles,
  bookings: initialBookings,
  settings: initialAgencySettings,
  admins: initialAdmins,
  last_updated: new Date().toISOString()
};

const broadcast = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('mohanty_travels_sync_v7')
  : null;

export const cloudStorage = {
  getLocalState(): AppDatabaseState {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      this.saveLocalState(defaultState);
      return defaultState;
    }
    try {
      const parsed = JSON.parse(raw);
      const existingAdmins: Admin[] = Array.isArray(parsed.admins) ? parsed.admins : [];
      const mergedAdmins = [...existingAdmins];
      for (const init of initialAdmins) {
        if (!mergedAdmins.some(a => matchPhones(a.phone, init.phone))) {
          mergedAdmins.push(init);
        }
      }
      return {
        vehicles: Array.isArray(parsed.vehicles) && parsed.vehicles.length > 0 ? parsed.vehicles : initialVehicles,
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : initialBookings,
        settings: { ...initialAgencySettings, ...(parsed.settings || {}) },
        admins: mergedAdmins.length > 0 ? mergedAdmins : initialAdmins,
        last_updated: parsed.last_updated || new Date().toISOString()
      };
    } catch {
      return defaultState;
    }
  },

  saveLocalState(state: AppDatabaseState): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    if (broadcast) {
      try { broadcast.postMessage({ type: 'DATA_UPDATED', state }); } catch {}
    }
  },

  async pullFromCloud(): Promise<AppDatabaseState> {
    if (isSupabaseConfigured && supabase) {
      try {
        const [vehRes, bookRes, setRes] = await Promise.all([
          supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('agency_settings').select('*').limit(1).maybeSingle()
        ]);
        if (vehRes.data && bookRes.data) {
          const local = this.getLocalState();
          const state: AppDatabaseState = {
            vehicles: vehRes.data.length > 0 ? vehRes.data : initialVehicles,
            bookings: bookRes.data,
            settings: setRes.data ? { ...initialAgencySettings, ...setRes.data } : initialAgencySettings,
            admins: local.admins,
            last_updated: new Date().toISOString()
          };
          this.saveLocalState(state);
          return state;
        }
      } catch (err) {
        console.warn('Supabase pull warning:', err);
      }
    }

    try {
      const res = await fetch(CLOUD_KV_ENDPOINT, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      }).catch(() => null);

      if (res && res.ok) {
        const cloudData: AppDatabaseState = await res.json();
        if (cloudData && Array.isArray(cloudData.bookings)) {
          const local = this.getLocalState();
          const bookingMap = new Map<string, Booking>();
          local.bookings.forEach(b => bookingMap.set(b.id, b));
          cloudData.bookings.forEach(b => bookingMap.set(b.id, b));

          const merged: AppDatabaseState = {
            vehicles: Array.isArray(cloudData.vehicles) && cloudData.vehicles.length > 0 ? cloudData.vehicles : local.vehicles,
            bookings: Array.from(bookingMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            settings: { ...local.settings, ...(cloudData.settings || {}) },
            admins: Array.isArray(cloudData.admins) && cloudData.admins.length > 0 ? cloudData.admins : local.admins,
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

  async pushToCloud(state: AppDatabaseState): Promise<void> {
    this.saveLocalState(state);

    if (isSupabaseConfigured && supabase) {
      try {
        if (state.bookings.length > 0) await supabase.from('bookings').upsert(state.bookings);
        if (state.vehicles.length > 0) await supabase.from('vehicles').upsert(state.vehicles);
        await supabase.from('agency_settings').upsert({ id: 'primary', ...state.settings });
      } catch (err) {
        console.warn('Supabase push warning:', err);
      }
    }

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
