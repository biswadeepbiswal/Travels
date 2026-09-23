export interface Vehicle {
  id: string;
  name: string;
  seating_capacity: number;
  is_ac: boolean;
  price: number; // base price or per-day / per-km rate
  price_unit: string; // e.g. "per km" or "per day" or "fixed"
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
  estimated_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  special_notes?: string;
  created_at: string;
}

export interface AgencySettings {
  agency_name: string;
  phone_primary: string;
  whatsapp_number: string;
  city: string;
}
