/**
 * VectorOps Live Supabase Schema Definitions
 * EXACT, 1-to-1 character-for-character representation of the live PostgreSQL database.
 */

// ---------------- ENUMS (exact string values) ----------------
export type UserRole = 'ADMIN' | 'CLIENT';

export type ClientServiceStatus = 
  | 'PROSPECT' 
  | 'ONBOARDING' 
  | 'ACTIVE' 
  | 'PAYMENT_DUE' 
  | 'SUSPENDED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'ARCHIVED';

// Convenience alias matching exact enum
export type ServiceStatus = ClientServiceStatus;
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type OnboardingStepStatus = OnboardingStatus;

export interface AgencySettings {
  agency_name: string;
  admin_name: string;
  admin_email: string;
  admin_timezone: string;
  business_hours_start: string;
  business_hours_end: string;
  default_meeting_duration_minutes: number;
  meeting_buffer_minutes: number;
  pending_hold_duration_hours: number;
}

export type BillingStatus = 
  | 'CURRENT' 
  | 'DUE_SOON' 
  | 'OVERDUE' 
  | 'PAID' 
  | 'PARTIALLY_PAID';

export type SubscriptionStatus = 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'ISSUED' 
  | 'PARTIALLY_PAID' 
  | 'PAID' 
  | 'OVERDUE' 
  | 'VOID';

export type InvoiceType = 
  | 'SETUP' 
  | 'RECURRING' 
  | 'ADJUSTMENT';

export type PaymentMethod = 
  | 'BANK_TRANSFER' 
  | 'WISE' 
  | 'PAYPAL' 
  | 'STRIPE'
  | 'OTHER';

export type AppointmentStatus = 
  | 'REQUESTED' 
  | 'PROPOSED' 
  | 'CONFIRMED' 
  | 'DECLINED' 
  | 'CANCELLED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'EXPIRED';

export type MeetingProvider = 
  | 'GOOGLE_MEET' 
  | 'ZOOM' 
  | 'TEAMS' 
  | 'CUSTOM';

export type TaskStatus = 
  | 'TODO' 
  | 'IN_PROGRESS' 
  | 'BLOCKED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type TaskSource = 
  | 'ADMIN' 
  | 'AI' 
  | 'CLIENT_MESSAGE' 
  | 'APPOINTMENT' 
  | 'ONBOARDING' 
  | 'BILLING';

export type OnboardingStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'BLOCKED' 
  | 'COMPLETE';

export type NotificationType = 
  | 'MESSAGE' 
  | 'APPOINTMENT' 
  | 'BILLING' 
  | 'TASK' 
  | 'ONBOARDING' 
  | 'SYSTEM';

export type NoteType = 
  | 'GENERAL' 
  | 'BILLING' 
  | 'ONBOARDING' 
  | 'SERVICE';

export type ThreadStatus = 
  | 'OPEN' 
  | 'NEEDS_REPLY' 
  | 'RESOLVED';

export type SenderType = 
  | 'ADMIN' 
  | 'CLIENT';

// ---------------- TABLES ----------------

export interface Profile {
  id: string; // uuid (PK, = auth.users.id)
  role: UserRole;
  full_name: string;
  email?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  agency_name?: string;
  timezone: string;
  client_id?: string;
  company_name?: string;
  created_at: string;
}

export type PaymentPlatform = 
  | 'WHATSAPP' 
  | 'INSTAGRAM' 
  | 'X' 
  | 'PAYPAL' 
  | 'TELEGRAM' 
  | 'EMAIL' 
  | 'CUSTOM';

export interface AgencyPaymentLink {
  id: string; // uuid (PK)
  platform: PaymentPlatform;
  label: string;
  url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string; // uuid (PK)
  slug: string; // unique
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  timezone: string;
  address: string | null;
  internal_notes: string | null;
  service_status: ClientServiceStatus;
  portal_status: 'ENABLED' | 'DISABLED';
  preferred_payment_link_id?: string | null; // FK to agency_payment_links.id
  retell_workspace_url: string | null;
  retell_workspace_id: string | null;
  last_activity_at: string;
  created_at: string;
  archived_at: string | null;
}

export interface ClientUser {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id
  profile_id: string; // FK -> profiles.id, unique
  created_at: string;
}

export interface SubscriptionPlan {
  id: string; // uuid (PK)
  name: string;
  description: string;
  is_active: boolean;
  setup_fee_cents: number;
  recurring_fee_cents: number;
  billing_interval: 'MONTHLY'; // always 'MONTHLY'
  grace_period_days: number;
  included_service_description: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id
  plan_id: string | null; // FK -> subscription_plans.id, nullable
  service_name: string;
  setup_fee_cents: number;
  recurring_fee_cents: number;
  currency: 'USD'; // always 'USD'
  billing_interval: 'MONTHLY'; // always 'MONTHLY'
  start_date: string; // date 'YYYY-MM-DD'
  next_billing_date: string; // date 'YYYY-MM-DD'
  end_date: string | null; // date (nullable)
  status: SubscriptionStatus;
  grace_period_days: number;
  notes: string | null;
  created_at: string;
}

export interface Invoice {
  id: string; // uuid (PK)
  invoice_number: string; // unique, format 'INV-1001'
  client_id: string; // FK -> clients.id
  subscription_id: string | null; // FK -> subscriptions.id, nullable
  invoice_type: InvoiceType;
  issue_date: string; // date
  due_date: string; // date
  service_period_start: string | null; // date
  service_period_end: string | null; // date
  status: InvoiceStatus;
  subtotal_cents: number;
  adjustments_cents: number;
  total_cents: number;
  currency: 'USD'; // always 'USD'
  created_at: string;
  // NOTE: amount_paid_cents and balance_due_cents are computed in DB via
  // amount_paid_cents(invoice_id) and balance_due_cents(invoice_id).
}

export interface InvoiceComputedMetrics {
  amount_paid_cents: number;
  balance_due_cents: number;
}

export interface InvoiceWithMetrics extends Invoice, InvoiceComputedMetrics {}

export interface InvoiceItem {
  id: string; // uuid (PK)
  invoice_id: string; // FK -> invoices.id
  description: string;
  amount_cents: number;
  created_at: string;
}

export interface Payment {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id
  invoice_id: string; // FK -> invoices.id
  amount_cents: number;
  received_at: string;
  payment_method: PaymentMethod;
  external_reference: string | null;
  created_by: string; // FK -> profiles.id
  notes: string | null;
  created_at: string;
  is_reversed?: boolean; // UI view helper for reversed status
}

export interface PaymentAdjustment {
  id: string; // uuid (PK)
  payment_id: string; // FK -> payments.id
  adjustment_type: 'REVERSAL' | 'CORRECTION';
  amount_cents: number;
  reason: string;
  created_by: string; // FK -> profiles.id
  created_at: string;
}

export interface MessageThread {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id, unique
  status: ThreadStatus;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string; // uuid (PK)
  thread_id: string; // FK -> message_threads.id
  sender_type: SenderType;
  sender_id: string; // FK -> profiles.id
  body: string;
  is_read: boolean;
  ai_category: string | null;
  ai_priority: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ai_summary: string | null;
  created_at: string;
  ai_suggested_reply?: string; // UI assistant draft helper
}

export interface Appointment {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id
  status: AppointmentStatus;
  starts_at: string; // timestamptz
  ends_at: string; // timestamptz
  client_timezone: string;
  admin_timezone: string;
  topic: string | null;
  meeting_provider: MeetingProvider | null;
  meeting_url: string | null;
  hold_expires_at: string | null;
  requested_by: string | null; // FK -> profiles.id
  proposed_by: string | null; // FK -> profiles.id
  cancelled_by: string | null; // FK -> profiles.id
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  blocking: boolean; // auto-computed read-only
}

export interface AvailabilityRule {
  id: string; // uuid (PK)
  day_of_week: number; // smallint (0=Sunday .. 6=Saturday)
  start_time: string; // time '18:00:00'
  end_time: string; // time '22:00:00'
  timezone: string;
  is_active: boolean;
}

export interface BlockedSlot {
  id: string; // uuid (PK)
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_by: string | null; // FK -> profiles.id
  created_at: string;
}

export interface Task {
  id: string; // uuid (PK)
  client_id: string | null; // FK -> clients.id
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string | null; // date
  status: TaskStatus;
  source: TaskSource;
  assigned_to: string | null; // FK -> profiles.id
  created_at: string;
  completed_at: string | null;
}

export interface Note {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id
  note_type: NoteType;
  body: string;
  author_id: string; // FK -> profiles.id
  created_at: string;
  author_name?: string; // UI display helper
}

export interface Notification {
  id: string; // uuid (PK)
  recipient_profile_id: string; // FK -> profiles.id
  type: NotificationType;
  title: string;
  description: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface OnboardingItemTemplate {
  id: string; // uuid (PK)
  step_order: number; // unique
  title: string;
  is_required: boolean;
}

export interface OnboardingItem {
  id: string; // uuid (PK)
  client_id: string; // FK -> clients.id
  template_id: string | null; // FK -> onboarding_item_templates.id
  title: string;
  step_order: number;
  status: OnboardingStatus;
  completed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string; // uuid (PK)
  actor_id: string | null; // FK -> profiles.id
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any | null; // jsonb
  new_value: any | null; // jsonb
  metadata: any | null; // jsonb
  ip_address: string | null;
  created_at: string;
  actor_name?: string; // UI display helper
  actor_role?: UserRole; // UI display helper
  details?: string; // UI display helper
}

export interface AppSetting {
  id: string; // uuid (PK)
  key: string; // unique
  value: any; // jsonb
  updated_at: string;
}

export interface SystemHealth {
  database_connected: boolean;
  database_source: 'Enterprise Cloud' | 'Production Store';
  last_scheduled_run: string;
  active_cron_jobs: string[];
  failed_automations_count: number;
  last_error: string | null;
  server_latency_ms: number;
}

export interface RevenueSummary {
  lifetime_revenue_cents: number;
  this_month_revenue_cents: number;
  this_year_revenue_cents: number;
  lifetime_setup_fees_cents: number;
  lifetime_recurring_cents: number;
}

export interface RevenueByMonth {
  month: string; // date/string e.g. "2026-09-01"
  revenue_cents: number;
  payment_count: number;
}

export interface RevenueByYear {
  year: string; // date/string e.g. "2026-01-01"
  revenue_cents: number;
  payment_count: number;
}

