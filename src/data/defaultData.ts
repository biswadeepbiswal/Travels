import { Vehicle, Booking, AgencySettings, Admin, BookingStatus } from '../types';

export const initialAgencySettings: AgencySettings = {
  agency_name: "Mohanty Travels",
  phone_primary: "+91 94370 12345",
  helpline_number: "+91 98610 99999",
  whatsapp_number: "+919437012345",
  address: "Master Canteen Square, Railway Station Road",
  city: "Bhubaneswar",
  email: "contact@mohantytravels.com"
};

export const MAIN_ADMIN_PHONE = (import.meta.env.VITE_ADMIN_PHONE as string || '9437012345').replace(/\D/g, '');

export const DEFAULT_MAIN_ADMIN_PERMISSIONS = {
  can_view_bookings: true,
  can_update_booking_status: true,
  can_accept_reject: true,
  can_manage_cars: true,
  can_manage_settings: true,
  can_manage_admins: true,
  can_delete_bookings: true,
  allowed_statuses: ['pending','under_review','accepted','rejected','cancelled','completed'] as BookingStatus[]
};

export const DEFAULT_SUB_ADMIN_PERMISSIONS = {
  can_view_bookings: true,
  can_update_booking_status: true,
  can_accept_reject: true,
  can_manage_cars: false,
  can_manage_settings: false,
  can_manage_admins: false,
  can_delete_bookings: false,
  allowed_statuses: ['under_review','accepted','rejected','cancelled','completed'] as BookingStatus[]
};

export const initialAdmins: Admin[] = [
  {
    id: 'admin-main-001',
    name: 'Main Admin',
    phone: MAIN_ADMIN_PHONE,
    role: 'main_admin',
    permissions: DEFAULT_MAIN_ADMIN_PERMISSIONS,
    contact_phone: '+91 94370 12345',
    contact_whatsapp: '+919437012345',
    is_active: true,
    created_at: new Date().toISOString(),
    assigned_user_phones: []
  }
];

export const initialVehicles: Vehicle[] = [
  {
    id: "veh-1",
    name: "Toyota Innova Crysta (AC)",
    seating_capacity: 7,
    is_ac: true,
    vehicle_type: 'suv',
    primary_image_url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    description: "Best for family tours & outstation travel with captain push-back seats."
  },
  {
    id: "veh-2",
    name: "Maruti Swift Dzire (AC)",
    seating_capacity: 4,
    is_ac: true,
    vehicle_type: 'sedan',
    primary_image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    description: "Comfortable economical sedan for local and outstation trips."
  },
  {
    id: "veh-3",
    name: "Maruti Suzuki Ertiga (AC)",
    seating_capacity: 6,
    is_ac: true,
    vehicle_type: 'suv',
    primary_image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    description: "Spacious 6-seater family car with high mileage and chilled AC."
  },
  {
    id: "veh-4",
    name: "Force Tempo Traveller (17 Seater AC)",
    seating_capacity: 17,
    is_ac: true,
    vehicle_type: 'minibus',
    primary_image_url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
    is_available: false,
    description: "Luxury mini bus for wedding guests, picnics, and group pilgrimages."
  }
];

export const initialBookings: Booking[] = [
  {
    id: "b-101",
    booking_code: "BK-1024",
    customer_name: "Rahul Mohapatra",
    customer_phone: "+91 98610 23456",
    pickup_location: "Bhubaneswar Railway Station",
    drop_location: "Puri Sea Beach",
    travel_date: "2026-10-25",
    pickup_time: "08:00 AM",
    vehicle_id: "veh-1",
    vehicle_name: "Toyota Innova Crysta (AC)",
    num_passengers: 4,
    status: "pending",
    created_at: new Date().toISOString(),
    status_history: []
  }
];
