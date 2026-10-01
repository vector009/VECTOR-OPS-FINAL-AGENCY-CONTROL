-- ==============================================================================
-- VectorOps Sovereign Enterprise Database Schema (PostgreSQL for Supabase)
-- Strict Integer USD Cents Accounting, Zero-Drift Timestamps & Realtime Invariants
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CLIENT')),
  full_name TEXT NOT NULL,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  address TEXT,
  internal_notes TEXT,
  service_status TEXT NOT NULL DEFAULT 'ACTIVE' 
    CHECK (service_status IN ('PROSPECT', 'ONBOARDING', 'ACTIVE', 'PAYMENT_DUE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'ARCHIVED')),
  portal_status TEXT NOT NULL DEFAULT 'ENABLED' 
    CHECK (portal_status IN ('ENABLED', 'DISABLED')),
  retell_workspace_url TEXT,
  retell_workspace_id TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- 4. CLIENT USERS (Links profiles to client companies)
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  setup_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (setup_fee_cents >= 0),
  recurring_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (recurring_fee_cents >= 0),
  billing_interval TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (billing_interval = 'MONTHLY'),
  grace_period_days INTEGER NOT NULL DEFAULT 7 CHECK (grace_period_days >= 0),
  included_service_description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  setup_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (setup_fee_cents >= 0),
  recurring_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (recurring_fee_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  billing_interval TEXT NOT NULL DEFAULT 'MONTHLY',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_billing_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' 
    CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED')),
  grace_period_days INTEGER NOT NULL DEFAULT 7 CHECK (grace_period_days >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('SETUP', 'RECURRING', 'ADJUSTMENT')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  service_period_start DATE,
  service_period_end DATE,
  status TEXT NOT NULL DEFAULT 'ISSUED' 
    CHECK (status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID')),
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  adjustments_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT NOT NULL 
    CHECK (payment_method IN ('BANK_TRANSFER', 'WISE', 'PAYPAL', 'OTHER')),
  external_reference TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. PAYMENT ADJUSTMENTS / REVERSALS
CREATE TABLE IF NOT EXISTS public.payment_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('REVERSAL', 'CORRECTION')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REQUESTED' 
    CHECK (status IN ('REQUESTED', 'PROPOSED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'EXPIRED')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  client_timezone TEXT NOT NULL,
  admin_timezone TEXT NOT NULL,
  topic TEXT,
  meeting_provider TEXT CHECK (meeting_provider IN ('GOOGLE_MEET', 'ZOOM', 'TEAMS', 'CUSTOM')),
  meeting_url TEXT,
  hold_expires_at TIMESTAMPTZ,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  proposed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. MESSAGE THREADS & MESSAGES
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'NEEDS_REPLY', 'RESOLVED')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('ADMIN', 'CLIENT')),
  sender_id UUID,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  ai_category TEXT,
  ai_priority TEXT CHECK (ai_priority IN ('LOW', 'MEDIUM', 'HIGH')),
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'TODO' 
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED')),
  source TEXT NOT NULL DEFAULT 'ADMIN' 
    CHECK (source IN ('ADMIN', 'AI', 'CLIENT_MESSAGE', 'APPOINTMENT', 'ONBOARDING', 'BILLING')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. AUTHORITATIVE FUNCTIONS & RPCS
CREATE OR REPLACE FUNCTION public.amount_paid_cents(p_invoice_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(p.amount_cents)
    FROM public.payments p
    LEFT JOIN public.payment_adjustments pa ON pa.payment_id = p.id AND pa.adjustment_type = 'REVERSAL'
    WHERE p.invoice_id = p_invoice_id AND pa.id IS NULL
  ), 0);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.balance_due_cents(p_invoice_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
  v_paid INTEGER;
BEGIN
  SELECT total_cents INTO v_total FROM public.invoices WHERE id = p_invoice_id;
  IF v_total IS NULL THEN RETURN 0; END IF;
  v_paid := public.amount_paid_cents(p_invoice_id);
  RETURN GREATEST(0, v_total - v_paid);
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC: RECORD PAYMENT
CREATE OR REPLACE FUNCTION public.record_payment(
  p_invoice_id UUID,
  p_amount_cents INTEGER,
  p_payment_method TEXT,
  p_received_at TIMESTAMPTZ DEFAULT now(),
  p_external_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
  v_balance INTEGER;
  v_new_payment_id UUID;
  v_remaining_balance INTEGER;
BEGIN
  SELECT client_id INTO v_client_id FROM public.invoices WHERE id = p_invoice_id;
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found: %', p_invoice_id;
  END IF;

  v_balance := public.balance_due_cents(p_invoice_id);
  IF p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;
  IF p_amount_cents > v_balance THEN
    RAISE EXCEPTION 'Payment exceeds remaining balance due (% cents)', v_balance;
  END IF;

  INSERT INTO public.payments (
    client_id, invoice_id, amount_cents, received_at, payment_method, external_reference, notes
  ) VALUES (
    v_client_id, p_invoice_id, p_amount_cents, p_received_at, p_payment_method, p_external_reference, p_notes
  ) RETURNING id INTO v_new_payment_id;

  v_remaining_balance := public.balance_due_cents(p_invoice_id);
  IF v_remaining_balance = 0 THEN
    UPDATE public.invoices SET status = 'PAID' WHERE id = p_invoice_id;
  ELSE
    UPDATE public.invoices SET status = 'PARTIALLY_PAID' WHERE id = p_invoice_id;
  END IF;

  RETURN v_new_payment_id;
END;
$$ LANGUAGE plpgsql;

-- 15. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view profiles and clients
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Public read subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Public read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Public read messages" ON public.messages FOR SELECT USING (true);
