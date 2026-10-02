-- ==============================================================================
-- AESTHETIC DENTAL CLINIC - SUPABASE PRODUCTION DATABASE SCHEMA
-- Multi-Role Access Control (Patients, Staff, Admins)
-- Full Doctor Schedules, Exceptions, Blocked Slots, Reviews, and Realtime Engine
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 01. CLINIC SETTINGS TABLE (Single Source of Truth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_name TEXT NOT NULL DEFAULT 'Aesthetic Dental Clinic',
  tagline TEXT DEFAULT 'A more considered approach to your smile',
  address_line TEXT NOT NULL DEFAULT 'MediSquare Towers, Level 4, 100 Feet Road, Indiranagar',
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  state TEXT NOT NULL DEFAULT 'Karnataka',
  postal_code TEXT NOT NULL DEFAULT '560038',
  phone TEXT NOT NULL DEFAULT '+91 80 4912 8800',
  email TEXT NOT NULL DEFAULT 'concierge@aestheticdental.com',
  opening_hours_weekdays TEXT NOT NULL DEFAULT '09:00 — 20:00',
  opening_hours_sunday TEXT NOT NULL DEFAULT '10:00 — 14:00 (Emergency & Priority)',
  appointment_fee NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  convenience_fee NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  slot_hold_minutes INTEGER NOT NULL DEFAULT 10,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 02. USER PROFILES & ROLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'patient')),
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 03. SPECIALTIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 04. SERVICES (TREATMENTS) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category TEXT NOT NULL DEFAULT 'Cosmetic Dentistry',
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  price NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  highlights TEXT[] DEFAULT '{}',
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 05. DOCTORS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  qualification TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
  specialization TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 5,
  bio TEXT NOT NULL,
  photo_url TEXT,
  consultation_days TEXT[] DEFAULT '{"Monday","Tuesday","Wednesday","Thursday","Friday"}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 06. DOCTOR SCHEDULES TABLE (Working Hours & Daily Breaks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  break_start TIME DEFAULT '13:00',
  break_end TIME DEFAULT '14:00',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week)
);

-- ==============================================================================
-- 07. DOCTOR EXCEPTIONS TABLE (Leaves, Holidays, Emergency closures)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.doctor_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  exception_type TEXT NOT NULL CHECK (exception_type IN ('leave', 'holiday', 'personal', 'emergency', 'training', 'other')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 08. BLOCKED SLOTS TABLE (Admin/Doctor Instant Manual Time Blocks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 09. PATIENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT DEFAULT 'Prefer not to say',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. APPOINTMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id TEXT UNIQUE NOT NULL, -- e.g. APT-202610-XXXX
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  gender TEXT,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  doctor_name TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,
  service_duration_minutes INTEGER NOT NULL DEFAULT 45,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  time_slot TEXT NOT NULL, -- e.g. "11:30 AM"
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'payment_failed', 'cancelled', 'completed', 'rescheduled')),
  appointment_fee NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  convenience_fee NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  patient_notes TEXT,
  staff_notes TEXT,
  check_in_status TEXT NOT NULL DEFAULT 'not_arrived' CHECK (check_in_status IN ('not_arrived', 'checked_in', 'in_chair', 'completed')),
  hold_expires_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 11. PAYMENTS TABLE (Razorpay Verified Records, Smallest Unit in Paise)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_reference TEXT UNIQUE NOT NULL, -- e.g. PAY-202610-XXXX
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  appointment_fee INTEGER NOT NULL DEFAULT 10000, -- 10000 paise = ₹100.00
  convenience_fee INTEGER NOT NULL DEFAULT 2000,  -- 2000 paise = ₹20.00
  total_amount INTEGER NOT NULL DEFAULT 12000,     -- 12000 paise = ₹120.00
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'refund_requested')),
  payment_method TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  error_code TEXT,
  error_description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. REVIEWS TABLE (Moderated Patient Testimonials)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  treatment_name TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('patient', 'admin', 'staff', 'razorpay_system', 'system_worker')),
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments (doctor_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_doc_date ON public.blocked_slots (doctor_id, blocked_date);
CREATE INDEX IF NOT EXISTS idx_exceptions_doc_date ON public.doctor_exceptions (doctor_id, exception_date);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews (approved, featured);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Clinic Settings: Public can read, only Admins can update
CREATE POLICY "Public read clinic settings" ON public.clinic_settings FOR SELECT USING (true);
CREATE POLICY "Admin update clinic settings" ON public.clinic_settings FOR ALL 
  USING (auth.jwt() ->> 'role' = 'admin');

-- 2. Specialties, Services, Doctors: Public can view active
CREATE POLICY "Public read active specialties" ON public.specialties FOR SELECT USING (active = true);
CREATE POLICY "Admin manage specialties" ON public.specialties FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (active = true);
CREATE POLICY "Admin manage services" ON public.services FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public read active doctors" ON public.doctors FOR SELECT USING (active = true);
CREATE POLICY "Admin manage doctors" ON public.doctors FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 3. Schedules, Exceptions, Blocked Slots: Public can view for slot calculation, Admins manage
CREATE POLICY "Public read schedules" ON public.doctor_schedules FOR SELECT USING (active = true);
CREATE POLICY "Admin manage schedules" ON public.doctor_schedules FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public read exceptions" ON public.doctor_exceptions FOR SELECT USING (true);
CREATE POLICY "Admin manage exceptions" ON public.doctor_exceptions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Public read blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Admin manage blocked slots" ON public.blocked_slots FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. Reviews: Public can view approved reviews, Anyone can submit pending review, Admins manage
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Public submit review" ON public.reviews FOR INSERT WITH CHECK (approved = false);
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 5. Appointments & Payments: Staff and Admins have operational access, patients only via verified endpoints
CREATE POLICY "Staff & Admin view appointments" ON public.appointments FOR SELECT 
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin', 'service_role'));
CREATE POLICY "Staff update checkin status" ON public.appointments FOR UPDATE 
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin', 'service_role'));
CREATE POLICY "Admin manage appointments" ON public.appointments FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

CREATE POLICY "Staff & Admin view payments" ON public.payments FOR SELECT 
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin', 'service_role'));
CREATE POLICY "Admin manage payments" ON public.payments FOR ALL 
  USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- ==============================================================================
-- SUPABASE REALTIME REPLICATION ENABLEMENT
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_exceptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
