-- ==============================================================================
-- AESTHETIC DENTAL CLINIC - SUPABASE MIGRATION 3
-- 10-Minute Temporary Slot Holds & Realtime Synchronization
-- ==============================================================================

-- 01. Create Appointment Holds Table (Atomic 10-Minute Slot Reservation)
CREATE TABLE IF NOT EXISTS public.appointment_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_reference TEXT NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  hold_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'converted_to_appointment', 'expired', 'released')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 02. Create Indexes for Quick Hold Lookups & Expiration Checks
CREATE INDEX IF NOT EXISTS idx_appointment_holds_doc_date ON public.appointment_holds (doctor_id, hold_date, status);
CREATE INDEX IF NOT EXISTS idx_appointment_holds_expires_at ON public.appointment_holds (expires_at);
CREATE INDEX IF NOT EXISTS idx_appointment_holds_reference ON public.appointment_holds (appointment_reference);

-- 03. Enable Row Level Security (RLS) on Appointment Holds Table
ALTER TABLE public.appointment_holds ENABLE ROW LEVEL SECURITY;

-- Public can view active holds to calculate live slot availability
CREATE POLICY "Public view active holds" ON public.appointment_holds FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- Staff and Admins can view all holds
CREATE POLICY "Staff & Admin view all holds" ON public.appointment_holds FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin', 'service_role'));

-- Only backend service_role can insert or update holds
CREATE POLICY "Service role manage appointment holds" ON public.appointment_holds FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 04. Add appointment_holds to Supabase Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_holds;
