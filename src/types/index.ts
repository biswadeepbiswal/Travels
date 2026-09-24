// ─── VEHICLE ────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  name: string;
  seating_capacity: number;
  is_ac: boolean;
  primary_image_url: string;
  is_available: boolean;
  description?: string;
  vehicle_type?: 'sedan' | 'suv' | 'minibus' | 'bus' | 'hatchback';
  created_at?: string;
}

// ─── BOOKING STATUS ──────────────────────────────────────────────────────────
export type BookingStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

// ─── BOOKING STATUS HISTORY ──────────────────────────────────────────────────
export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  status: BookingStatus;
  changed_by_admin_id?: string;
  changed_by_name: string;
  notes?: string;
  timestamp: string;
}

// ─── BOOKING ─────────────────────────────────────────────────────────────────
export interface Booking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  pickup_location: string;
  drop_location: string;
  travel_date: string;
  pickup_time?: string;
  vehicle_id: string;
  vehicle_name: string;
  num_passengers?: number;
  booking_duration?: string;
  status: BookingStatus;
  special_notes?: string;
  admin_notes?: string;
  assigned_admin_id?: string;
  created_at: string;
  status_history?: BookingStatusHistory[];
}

// ─── ADMIN ROLE ───────────────────────────────────────────────────────────────
export type AdminRole = 'main_admin' | 'sub_admin';

// ─── ADMIN PERMISSIONS ────────────────────────────────────────────────────────
export interface AdminPermissions {
  can_view_bookings: boolean;
  can_update_booking_status: boolean;
  can_accept_reject: boolean;
  can_manage_cars: boolean;
  can_manage_settings: boolean;
  can_manage_admins: boolean;
  can_delete_bookings: boolean;
  allowed_statuses: BookingStatus[];
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export interface Admin {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: AdminRole;
  permissions: AdminPermissions;
  contact_phone?: string;
  contact_whatsapp?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  assigned_user_phones?: string[];
}

// ─── AGENCY SETTINGS ─────────────────────────────────────────────────────────
export interface AgencySettings {
  agency_name: string;
  phone_primary: string;
  helpline_number: string;
  whatsapp_number: string;
  address: string;
  city: string;
  email?: string;
}

// ─── USER SESSION ─────────────────────────────────────────────────────────────
export interface UserSession {
  role: 'customer' | 'admin';
  name: string;
  phone: string;
  logged_in_at: string;
  admin_id?: string;
  admin_role?: AdminRole;
}
