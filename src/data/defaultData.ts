import { Vehicle, Booking, AgencySettings } from '../types';

export const initialAgencySettings: AgencySettings = {
  agency_name: "Mohanty Travels",
  phone_primary: "+91 94370 12345",
  helpline_number: "+91 98610 99999",
  whatsapp_number: "+919437012345",
  address: "Master Canteen Square, Railway Station Road",
  city: "Bhubaneswar",
  email: "contact@mohantytravels.com"
};

export const initialVehicles: Vehicle[] = [
  {
    id: "veh-1",
    name: "Toyota Innova Crysta (AC)",
    seating_capacity: 7,
    is_ac: true,
    primary_image_url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    description: "Best for family tours & outstation travel with captain push-back seats."
  },
  {
    id: "veh-2",
    name: "Maruti Swift Dzire (AC)",
    seating_capacity: 4,
    is_ac: true,
    primary_image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    description: "Comfortable economical sedan for local and outstation trips."
  },
  {
    id: "veh-3",
    name: "Maruti Suzuki Ertiga (AC)",
    seating_capacity: 6,
    is_ac: true,
    primary_image_url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    is_available: true,
    description: "Spacious 6-seater family car with high mileage and chilled AC."
  },
  {
    id: "veh-4",
    name: "Force Tempo Traveller (17 Seater AC)",
    seating_capacity: 17,
    is_ac: true,
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
    status: "pending",
    created_at: new Date().toISOString()
  }
];
