-- =========================================================
-- COMPLETE DATABASE SCHEMA FOR ODISHA TRAVELS PLATFORM
-- Execute this script in Supabase SQL Editor
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'driver');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'hatchback', 'tempo_traveller', 'luxury', 'bus');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trip_type AS ENUM ('one_way', 'round_trip', 'multicity', 'local_hourly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_category AS ENUM ('wedding', 'birthday', 'corporate', 'picnic', 'tour_package', 'airport_transfer', 'religious', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. AGENCY SETTINGS (Singleton)
CREATE TABLE IF NOT EXISTS agency_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_name TEXT NOT NULL DEFAULT 'Odisha Travels & Fleet',
    tagline TEXT DEFAULT 'Your Trusted Travel Partner for Safe, Comfortable & Affordable Rides',
    logo_url TEXT,
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    whatsapp_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT DEFAULT 'Bhubaneswar',
    state TEXT DEFAULT 'Odisha',
    working_hours TEXT DEFAULT '24/7 Available for Bookings & Support',
    upi_id TEXT,
    about_us TEXT,
    terms_and_conditions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vehicle_type vehicle_type NOT NULL,
    registration_number TEXT,
    seating_capacity INT NOT NULL,
    is_ac BOOLEAN DEFAULT true,
    luggage_capacity INT DEFAULT 3,
    description TEXT,
    facilities TEXT[] DEFAULT '{}',
    primary_image_url TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT '{}',
    price_per_km NUMERIC(10,2) DEFAULT 0.00,
    price_per_day NUMERIC(10,2) DEFAULT 0.00,
    driver_allowance_per_day NUMERIC(10,2) DEFAULT 350.00,
    minimum_km_per_day INT DEFAULT 250,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DESTINATIONS TABLE
CREATE TABLE IF NOT EXISTS destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    state TEXT DEFAULT 'Odisha',
    image_url TEXT NOT NULL,
    description TEXT,
    distance_km INT,
    estimated_travel_time TEXT,
    is_popular BOOLEAN DEFAULT true,
    starting_price NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ROUTE PRICING MATRIX
CREATE TABLE IF NOT EXISTS route_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_city TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_type trip_type DEFAULT 'one_way',
    fixed_price NUMERIC(10,2) NOT NULL,
    estimated_distance_km INT,
    toll_included BOOLEAN DEFAULT false,
    parking_included BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EVENT PACKAGES
CREATE TABLE IF NOT EXISTS event_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    category event_category NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_name TEXT,
    duration_hours INT DEFAULT 8,
    included_km INT DEFAULT 80,
    base_price NUMERIC(10,2) NOT NULL,
    extra_hour_rate NUMERIC(10,2) DEFAULT 300.00,
    extra_km_rate NUMERIC(10,2) DEFAULT 20.00,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BOOKINGS MASTER TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    service_type TEXT NOT NULL DEFAULT 'route',
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_name TEXT,
    pickup_location TEXT NOT NULL,
    drop_location TEXT NOT NULL,
    travel_date DATE NOT NULL,
    pickup_time TIME,
    return_date DATE,
    passengers_count INT DEFAULT 1,
    trip_type trip_type DEFAULT 'round_trip',
    estimated_price NUMERIC(10,2) NOT NULL,
    final_price NUMERIC(10,2),
    advance_paid NUMERIC(10,2) DEFAULT 0.00,
    special_notes TEXT,
    status booking_status DEFAULT 'pending',
    admin_notes TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public Access Policies
CREATE POLICY "Allow public read on settings" ON agency_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read on vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public read on destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "Allow public read on route_pricing" ON route_pricing FOR SELECT USING (true);
CREATE POLICY "Allow public read on event_packages" ON event_packages FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public update on bookings" ON bookings FOR UPDATE USING (true);
