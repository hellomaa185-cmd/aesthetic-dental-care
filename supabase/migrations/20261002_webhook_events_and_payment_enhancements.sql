-- ==============================================================================
-- AESTHETIC DENTAL CLINIC - SUPABASE MIGRATION 2
-- Webhook Events, Realtime Publication, and Payment Reconciliation
-- ==============================================================================

-- 01. Create Webhook Events Table (Idempotent Razorpay Webhook Recording)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  signature TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'duplicate_ignored', 'failed', 'rejected_signature')),
  error_message TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 02. Create Indexes for Quick Webhook Lookups & Idempotency
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events (event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON public.webhook_events (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events (created_at);

-- 03. Enable RLS on Webhook Events Table
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Staff and Admins can view webhook logs; only server service_role can insert/modify
CREATE POLICY "Admin & Staff view webhook events" ON public.webhook_events FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin', 'service_role'));

CREATE POLICY "Service role manage webhook events" ON public.webhook_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 04. Add payments and webhook_events to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_events;
