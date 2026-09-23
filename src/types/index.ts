export interface Vehicle {
  id: string;
  name: string;
  seating_capacity: number;
  is_ac: boolean;
  primary_image_url: string;
  is_available: boolean; // Available / Not Available toggle
  description?: string;
}

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  special_notes?: string;
  created_at: string;
}

export interface AgencySettings {
  agency_name: string;
  phone_primary: string;       // Admin / Manager Contact Number
  helpline_number: string;     // 24/7 Agency Helpline Number
  whatsapp_number: string;     // WhatsApp Booking Number
  address: string;
  city: string;
  email?: string;
}

export interface UserSession {
  role: 'customer' | 'admin';
  name: string;
  phone: string;
  logged_in_at: string;
}
