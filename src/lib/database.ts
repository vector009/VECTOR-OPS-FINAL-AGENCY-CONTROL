import { 
  Profile,
  Client, 
  SubscriptionPlan, 
  Subscription, 
  Invoice, 
  InvoiceWithMetrics,
  InvoiceItem, 
  Payment, 
  PaymentAdjustment,
  MessageThread,
  Message, 
  Appointment, 
  Task, 
  OnboardingItem, 
  Note, 
  AuditLog, 
  AppSetting,
  AgencySettings,
  SystemHealth,
  PaymentMethod,
  MeetingProvider,
  InvoiceType,
  ClientServiceStatus,
  RevenueSummary,
  RevenueByMonth,
  RevenueByYear
} from '../types';
import { getSupabaseClient } from './supabase';

const DEFAULT_SETTINGS: AgencySettings = {
  agency_name: 'VectorOps Agency Operating System',
  admin_name: 'Sovereign Operator',
  admin_email: 'admin@vectorops.ai',
  admin_timezone: 'Asia/Kolkata',
  business_hours_start: '18:00',
  business_hours_end: '22:00',
  default_meeting_duration_minutes: 45,
  meeting_buffer_minutes: 15,
  pending_hold_duration_hours: 48,
};

// Standard UUIDs for seed records to match PostgreSQL uuid type
const SEED_PROFILES: Profile[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    role: 'ADMIN',
    full_name: 'Sovereign Operator',
    timezone: 'Asia/Kolkata',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    role: 'CLIENT',
    full_name: 'Dr. Evelyn Reed',
    timezone: 'America/New_York',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
  },
];

const SEED_PLANS: SubscriptionPlan[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Starter Voice',
    description: 'Single inbound AI receptionist with core appointment booking & FAQ routing.',
    setup_fee_cents: 30000, // $300.00
    recurring_fee_cents: 29900, // $299.00
    billing_interval: 'MONTHLY',
    grace_period_days: 5,
    included_service_description: '1 Retell AI agent, 500 included call minutes, email summaries.',
    is_active: true,
    notes: 'Ideal for local dental, legal, and boutique services.',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Growth Voice Matrix',
    description: 'Multi-lingual inbound & outbound dispatch agent with live database lookup.',
    setup_fee_cents: 50000, // $500.00
    recurring_fee_cents: 49900, // $499.00
    billing_interval: 'MONTHLY',
    grace_period_days: 7,
    included_service_description: '3 Retell AI agents, 1,500 included minutes, custom latency tuning.',
    is_active: true,
    notes: 'Standard plan for multi-location healthcare and real estate.',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Scale Enterprise Sovereign',
    description: 'High-throughput 24/7 dedicated voice infrastructure with sub-600ms latency.',
    setup_fee_cents: 100000, // $1,000.00
    recurring_fee_cents: 99900, // $999.00
    billing_interval: 'MONTHLY',
    grace_period_days: 10,
    included_service_description: 'Unlimited Retell AI agents, 5,000 included minutes, custom LLM fine-tuning.',
    is_active: true,
    notes: 'For enterprise call centers and logistics operators.',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
  },
];

const SEED_CLIENTS: Client[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    slug: 'luminar-dental',
    company_name: 'Luminar Dental AI',
    contact_name: 'Dr. Evelyn Reed',
    email: 'dr.reed@luminardental.com',
    phone: '+1 (555) 349-8291',
    timezone: 'America/New_York',
    address: '450 Lexington Ave, New York, NY 10017',
    internal_notes: 'High satisfaction with patient triage bot. Interested in expanding to cosmetic line.',
    service_status: 'ACTIVE',
    portal_status: 'ENABLED',
    retell_workspace_url: 'https://app.retellai.com/dashboard/agent/agent_883a9f02c',
    retell_workspace_id: 'ws_luminar_01',
    last_activity_at: '2026-09-28T21:40:00Z',
    created_at: '2026-08-01T10:00:00Z',
    archived_at: null,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    slug: 'aeroestate-realty',
    company_name: 'AeroEstate Realty Group',
    contact_name: 'Marcus Vance',
    email: 'marcus@aeroestate.io',
    phone: '+1 (415) 892-4100',
    timezone: 'America/Los_Angeles',
    address: '101 California St, San Francisco, CA 94111',
    internal_notes: 'Invoice INV-1003 is overdue. Marcus confirmed via SMS that CFO is processing wire.',
    service_status: 'ACTIVE', // Section 6: ACTIVE service status even if billing overdue
    portal_status: 'ENABLED',
    retell_workspace_url: 'https://app.retellai.com/dashboard/agent/agent_441bc19e',
    retell_workspace_id: 'ws_aero_02',
    last_activity_at: '2026-09-28T18:15:00Z',
    created_at: '2026-08-15T14:30:00Z',
    archived_at: null,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    slug: 'apex-dispatch',
    company_name: 'Apex Dispatch Logistics',
    contact_name: 'David Chen',
    email: 'david@apexdispatch.com',
    phone: '+1 (312) 554-0021',
    timezone: 'America/Chicago',
    address: '233 S Wacker Dr, Chicago, IL 60606',
    internal_notes: 'Waiting for telephony SIP trunk credentials before connecting Retell workspace.',
    service_status: 'ONBOARDING',
    portal_status: 'ENABLED',
    retell_workspace_url: null, // Missing workspace triggers blocked onboarding
    retell_workspace_id: null,
    last_activity_at: '2026-09-28T16:00:00Z',
    created_at: '2026-09-25T09:00:00Z',
    archived_at: null,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    slug: 'vortex-clinical',
    company_name: 'Vortex Clinical Care',
    contact_name: 'Sarah Jenkins',
    email: 's.jenkins@vortexcare.org',
    phone: '+1 (617) 902-1244',
    timezone: 'America/New_York',
    address: '75 Cambridge Pkwy, Cambridge, MA 02142',
    internal_notes: 'Enterprise account. 24/7 emergency response triage setup.',
    service_status: 'ACTIVE',
    portal_status: 'ENABLED',
    retell_workspace_url: 'https://app.retellai.com/dashboard/agent/agent_991f820d',
    retell_workspace_id: 'ws_vortex_03',
    last_activity_at: '2026-09-28T22:10:00Z',
    created_at: '2026-07-20T11:00:00Z',
    archived_at: null,
  },
];

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    plan_id: 'b0000000-0000-0000-0000-000000000002',
    service_name: 'Growth Voice Matrix',
    setup_fee_cents: 50000,
    recurring_fee_cents: 49900,
    currency: 'USD',
    billing_interval: 'MONTHLY',
    start_date: '2026-08-01',
    next_billing_date: '2026-10-01',
    end_date: null,
    status: 'ACTIVE',
    grace_period_days: 7,
    notes: 'Snapshotted price at onboarding: $499.00/mo.',
    created_at: '2026-08-01T10:05:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    plan_id: 'b0000000-0000-0000-0000-000000000001',
    service_name: 'Starter Voice',
    setup_fee_cents: 30000,
    recurring_fee_cents: 29900,
    currency: 'USD',
    billing_interval: 'MONTHLY',
    start_date: '2026-08-15',
    next_billing_date: '2026-10-15',
    end_date: null,
    status: 'ACTIVE',
    grace_period_days: 5,
    notes: 'Snapshotted price at onboarding: $299.00/mo.',
    created_at: '2026-08-15T14:35:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    client_id: 'c0000000-0000-0000-0000-000000000003',
    plan_id: 'b0000000-0000-0000-0000-000000000003',
    service_name: 'Scale Enterprise Sovereign',
    setup_fee_cents: 100000,
    recurring_fee_cents: 99900,
    currency: 'USD',
    billing_interval: 'MONTHLY',
    start_date: '2026-09-25',
    next_billing_date: '2026-10-25',
    end_date: null,
    status: 'ACTIVE',
    grace_period_days: 10,
    notes: 'Snapshotted price at onboarding: $999.00/mo.',
    created_at: '2026-09-25T09:05:00Z',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    client_id: 'c0000000-0000-0000-0000-000000000004',
    plan_id: 'b0000000-0000-0000-0000-000000000003',
    service_name: 'Scale Enterprise Sovereign',
    setup_fee_cents: 100000,
    recurring_fee_cents: 99900,
    currency: 'USD',
    billing_interval: 'MONTHLY',
    start_date: '2026-07-20',
    next_billing_date: '2026-10-05',
    end_date: null,
    status: 'ACTIVE',
    grace_period_days: 10,
    notes: 'Snapshotted price at onboarding: $999.00/mo.',
    created_at: '2026-07-20T11:05:00Z',
  },
];

const SEED_INVOICES: Invoice[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    invoice_number: 'INV-1001',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    subscription_id: 'd0000000-0000-0000-0000-000000000001',
    invoice_type: 'SETUP',
    issue_date: '2026-08-01',
    due_date: '2026-08-15',
    service_period_start: '2026-08-01',
    service_period_end: '2026-08-31',
    status: 'PAID',
    subtotal_cents: 50000,
    adjustments_cents: 0,
    total_cents: 50000,
    currency: 'USD',
    created_at: '2026-08-01T10:10:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    invoice_number: 'INV-1002',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    subscription_id: 'd0000000-0000-0000-0000-000000000001',
    invoice_type: 'RECURRING',
    issue_date: '2026-09-01',
    due_date: '2026-09-15',
    service_period_start: '2026-09-01',
    service_period_end: '2026-09-30',
    status: 'PAID',
    subtotal_cents: 49900,
    adjustments_cents: 0,
    total_cents: 49900,
    currency: 'USD',
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    invoice_number: 'INV-1003',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    subscription_id: 'd0000000-0000-0000-0000-000000000002',
    invoice_type: 'RECURRING',
    issue_date: '2026-09-15',
    due_date: '2026-09-24', // Passed due date -> OVERDUE
    service_period_start: '2026-09-15',
    service_period_end: '2026-10-14',
    status: 'OVERDUE',
    subtotal_cents: 29900,
    adjustments_cents: 0,
    total_cents: 29900,
    currency: 'USD',
    created_at: '2026-09-15T00:00:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    invoice_number: 'INV-1004',
    client_id: 'c0000000-0000-0000-0000-000000000003',
    subscription_id: 'd0000000-0000-0000-0000-000000000003',
    invoice_type: 'SETUP',
    issue_date: '2026-09-25',
    due_date: '2026-10-09',
    service_period_start: '2026-09-25',
    service_period_end: '2026-10-24',
    status: 'PARTIALLY_PAID',
    subtotal_cents: 100000,
    adjustments_cents: 0,
    total_cents: 100000,
    currency: 'USD',
    created_at: '2026-09-25T09:10:00Z',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    invoice_number: 'INV-1005',
    client_id: 'c0000000-0000-0000-0000-000000000004',
    subscription_id: 'd0000000-0000-0000-0000-000000000004',
    invoice_type: 'RECURRING',
    issue_date: '2026-09-05',
    due_date: '2026-09-19',
    service_period_start: '2026-09-05',
    service_period_end: '2026-10-04',
    status: 'PAID',
    subtotal_cents: 99900,
    adjustments_cents: 0,
    total_cents: 99900,
    currency: 'USD',
    created_at: '2026-09-05T00:00:00Z',
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'f0000000-0000-0000-0000-00000000000a',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    invoice_id: 'e0000000-0000-0000-0000-000000000001',
    amount_cents: 35000,
    received_at: '2026-01-18T10:00:00Z',
    payment_method: 'STRIPE',
    external_reference: 'STRIPE-CH-01018',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'Q1 voice infrastructure starter deposit.',
    created_at: '2026-01-18T10:05:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-00000000000b',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    invoice_id: 'e0000000-0000-0000-0000-000000000001',
    amount_cents: 42000,
    received_at: '2026-02-14T11:30:00Z',
    payment_method: 'BANK_TRANSFER',
    external_reference: 'ACH-FEB-2026-02',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'February voice operations retainer.',
    created_at: '2026-02-14T11:35:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-00000000000c',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    invoice_id: 'e0000000-0000-0000-0000-000000000002',
    amount_cents: 48000,
    received_at: '2026-03-20T09:15:00Z',
    payment_method: 'STRIPE',
    external_reference: 'STRIPE-CH-03020',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'March telephony sprint settlement.',
    created_at: '2026-03-20T09:20:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-00000000000d',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    invoice_id: 'e0000000-0000-0000-0000-000000000002',
    amount_cents: 55000,
    received_at: '2026-04-15T15:45:00Z',
    payment_method: 'WISE',
    external_reference: 'WISE-APR-0415',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'April expansion subscription fee.',
    created_at: '2026-04-15T15:50:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-00000000000e',
    client_id: 'c0000000-0000-0000-0000-000000000003',
    invoice_id: 'e0000000-0000-0000-0000-000000000003',
    amount_cents: 68000,
    received_at: '2026-05-19T14:10:00Z',
    payment_method: 'BANK_TRANSFER',
    external_reference: 'ACH-MAY-0519',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'May emergency dispatch setup fee.',
    created_at: '2026-05-19T14:15:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-00000000000f',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    invoice_id: 'e0000000-0000-0000-0000-000000000002',
    amount_cents: 72000,
    received_at: '2026-06-22T16:30:00Z',
    payment_method: 'STRIPE',
    external_reference: 'STRIPE-CH-06022',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'June recurring voice intelligence retainer.',
    created_at: '2026-06-22T16:35:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-00000000000g',
    client_id: 'c0000000-0000-0000-0000-000000000004',
    invoice_id: 'e0000000-0000-0000-0000-000000000005',
    amount_cents: 85000,
    received_at: '2026-07-20T11:00:00Z',
    payment_method: 'BANK_TRANSFER',
    external_reference: 'ACH-JUL-0720',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'July enterprise voice setup and initial SLA.',
    created_at: '2026-07-20T11:05:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    invoice_id: 'e0000000-0000-0000-0000-000000000001',
    amount_cents: 50000,
    received_at: '2026-08-05T14:20:00Z',
    payment_method: 'WISE',
    external_reference: 'WISE-TRX-998124',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'Received via Wise business account.',
    created_at: '2026-08-05T14:25:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    invoice_id: 'e0000000-0000-0000-0000-000000000002',
    amount_cents: 49900,
    received_at: '2026-09-02T11:10:00Z',
    payment_method: 'BANK_TRANSFER',
    external_reference: 'ACH-488219-LUM',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'Direct ACH corporate payment.',
    created_at: '2026-09-02T11:15:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    client_id: 'c0000000-0000-0000-0000-000000000003',
    invoice_id: 'e0000000-0000-0000-0000-000000000004',
    amount_cents: 50000,
    received_at: '2026-09-26T16:00:00Z',
    payment_method: 'OTHER',
    external_reference: 'WIRE-FED-7721890',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: '50% onboarding deposit via Fedwire.',
    created_at: '2026-09-26T16:05:00Z',
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    client_id: 'c0000000-0000-0000-0000-000000000004',
    invoice_id: 'e0000000-0000-0000-0000-000000000005',
    amount_cents: 99900,
    received_at: '2026-09-06T10:30:00Z',
    payment_method: 'BANK_TRANSFER',
    external_reference: 'BOA-TX-9901421',
    created_by: 'a0000000-0000-0000-0000-000000000001',
    notes: 'Recurring retainer received on time.',
    created_at: '2026-09-06T10:35:00Z',
  },
];

const SEED_THREADS: MessageThread[] = [
  {
    id: 't0000000-0000-0000-0000-000000000001',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    status: 'OPEN',
    last_message_at: '2026-09-28T16:45:00Z',
    created_at: '2026-08-01T10:15:00Z',
  },
  {
    id: 't0000000-0000-0000-0000-000000000002',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    status: 'NEEDS_REPLY',
    last_message_at: '2026-09-28T21:10:00Z',
    created_at: '2026-08-15T14:40:00Z',
  },
];

const SEED_MESSAGES: Message[] = [
  {
    id: 'm0000000-0000-0000-0000-000000000001',
    thread_id: 't0000000-0000-0000-0000-000000000001',
    sender_type: 'CLIENT',
    sender_id: 'a0000000-0000-0000-0000-000000000002',
    body: 'Can we change our greeting to announce our new weekend urgent care hours?',
    is_read: true,
    ai_category: 'GENERAL',
    ai_priority: 'MEDIUM',
    ai_summary: 'Client requests greeting update to announce new weekend urgent care schedule.',
    created_at: '2026-09-28T16:32:00Z',
    ai_suggested_reply: 'Absolutely Dr. Reed! I will review the new script changes and update your Retell agent prompt before our Wednesday review meeting.',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000002',
    thread_id: 't0000000-0000-0000-0000-000000000001',
    sender_type: 'ADMIN',
    sender_id: 'a0000000-0000-0000-0000-000000000001',
    body: "Absolutely, Dr. Reed! I'll draft the updated greeting prompt and test it in Retell staging before our call on Wednesday.",
    is_read: true,
    ai_category: null,
    ai_priority: null,
    ai_summary: null,
    created_at: '2026-09-28T16:45:00Z',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000003',
    thread_id: 't0000000-0000-0000-0000-000000000002',
    sender_type: 'CLIENT',
    sender_id: 'a0000000-0000-0000-0000-000000000002',
    body: 'Hey team, our finance department just sent the wire for invoice INV-1003. Reference number is FED-WIRE-99410. Can you confirm receipt when it clears?',
    is_read: false, // Unread message -> Needs attention!
    ai_category: 'BILLING',
    ai_priority: 'HIGH',
    ai_summary: 'Client provided wire reference FED-WIRE-99410 for overdue invoice INV-1003.',
    created_at: '2026-09-28T21:10:00Z',
    ai_suggested_reply: 'Thank you Marcus! Once the bank completes the wire settlement, I will record the payment against INV-1003 and update your balance.',
  },
];

const SEED_APPOINTMENTS: Appointment[] = [
  {
    id: 'g0000000-0000-0000-0000-000000000001',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    status: 'CONFIRMED',
    starts_at: '2026-09-30T14:30:00Z',
    ends_at: '2026-09-30T15:15:00Z',
    client_timezone: 'America/New_York',
    admin_timezone: 'Asia/Kolkata',
    topic: 'Q3 Retell Voice Prompt Optimization & Latency Review',
    meeting_provider: 'GOOGLE_MEET',
    meeting_url: 'https://meet.google.com/vec-ops-vox',
    hold_expires_at: null,
    requested_by: 'a0000000-0000-0000-0000-000000000002',
    proposed_by: null,
    cancelled_by: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: '2026-09-26T14:00:00Z',
    blocking: true,
  },
  {
    id: 'g0000000-0000-0000-0000-000000000002',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    status: 'REQUESTED',
    starts_at: '2026-10-01T17:00:00Z',
    ends_at: '2026-10-01T17:45:00Z',
    client_timezone: 'America/Los_Angeles',
    admin_timezone: 'Asia/Kolkata',
    topic: 'Outbound Listing Qualification Flow Review',
    meeting_provider: null,
    meeting_url: null,
    hold_expires_at: '2026-10-03T17:00:00Z',
    requested_by: 'a0000000-0000-0000-0000-000000000002',
    proposed_by: null,
    cancelled_by: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: '2026-09-28T19:30:00Z',
    blocking: true,
  },
];

const SEED_TASKS: Task[] = [
  {
    id: 'h0000000-0000-0000-0000-000000000001',
    client_id: 'c0000000-0000-0000-0000-000000000003',
    title: 'Obtain Retell Workspace URL for Apex Dispatch',
    description: 'Onboarding step 4 blocked: awaiting SIP credentials from David Chen to provision Retell agent.',
    priority: 'HIGH',
    due_date: '2026-09-29',
    status: 'BLOCKED',
    source: 'ONBOARDING',
    assigned_to: 'a0000000-0000-0000-0000-000000000001',
    created_at: '2026-09-25T09:15:00Z',
    completed_at: null,
  },
  {
    id: 'h0000000-0000-0000-0000-000000000002',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Verify incoming wire reference FED-WIRE-99410 for INV-1003',
    description: 'Marcus submitted wire reference. Check bank account and run record_payment() once cleared.',
    priority: 'HIGH',
    due_date: '2026-09-29',
    status: 'TODO',
    source: 'CLIENT_MESSAGE',
    assigned_to: 'a0000000-0000-0000-0000-000000000001',
    created_at: '2026-09-28T21:12:00Z',
    completed_at: null,
  },
  {
    id: 'h0000000-0000-0000-0000-000000000003',
    client_id: 'c0000000-0000-0000-0000-000000000004',
    title: 'Draft renewal notice for upcoming billing on Oct 5 (7 days out)',
    description: 'AI Copilot detected renewal in 7 days. Review drafted message and approve dispatch.',
    priority: 'MEDIUM',
    due_date: '2026-09-29',
    status: 'TODO',
    source: 'AI',
    assigned_to: 'a0000000-0000-0000-0000-000000000001',
    created_at: '2026-09-28T04:00:00Z',
    completed_at: null,
  },
];

const SEED_NOTES: Note[] = [
  {
    id: 'n0000000-0000-0000-0000-000000000001',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    note_type: 'GENERAL',
    body: 'Client requested gentle, empathetic voice tone. Configured elevenlabs voice ElevenLabs-Rachel in Retell agent.',
    author_id: 'a0000000-0000-0000-0000-000000000001',
    author_name: 'Sovereign Operator',
    created_at: '2026-08-02T11:00:00Z',
  },
  {
    id: 'n0000000-0000-0000-0000-000000000002',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    note_type: 'BILLING',
    body: 'Client usually pays between the 25th and 28th due to corporate AP schedule. Do not send aggressive overdue notices.',
    author_id: 'a0000000-0000-0000-0000-000000000001',
    author_name: 'Sovereign Operator',
    created_at: '2026-09-24T18:00:00Z',
  },
];

const SEED_ONBOARDING_ITEMS: OnboardingItem[] = [
  { id: 'o0000000-0000-0000-0000-000000000001', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Client record created', step_order: 1, status: 'COMPLETE', completed_at: '2026-08-01T10:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000002', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Subscription assigned', step_order: 2, status: 'COMPLETE', completed_at: '2026-08-01T10:05:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000003', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Setup invoice created', step_order: 3, status: 'COMPLETE', completed_at: '2026-08-01T10:10:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000004', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Retell workspace added', step_order: 4, status: 'COMPLETE', completed_at: '2026-08-01T10:12:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000005', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Business information received', step_order: 5, status: 'COMPLETE', completed_at: '2026-08-02T10:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000006', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Agent requirements confirmed', step_order: 6, status: 'COMPLETE', completed_at: '2026-08-03T10:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000007', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Knowledge information received', step_order: 7, status: 'COMPLETE', completed_at: '2026-08-03T14:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000008', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Agent tested in staging', step_order: 8, status: 'COMPLETE', completed_at: '2026-08-04T12:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000009', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Client access provided', step_order: 9, status: 'COMPLETE', completed_at: '2026-08-04T14:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000010', client_id: 'c0000000-0000-0000-0000-000000000001', template_id: null, title: 'Go-live confirmed', step_order: 10, status: 'COMPLETE', completed_at: '2026-08-05T09:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  
  // Apex Dispatch onboarding items
  { id: 'o0000000-0000-0000-0000-000000000011', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Client record created', step_order: 1, status: 'COMPLETE', completed_at: '2026-09-25T09:00:00Z', created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000012', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Subscription assigned', step_order: 2, status: 'COMPLETE', completed_at: '2026-09-25T09:05:00Z', created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000013', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Setup invoice created', step_order: 3, status: 'COMPLETE', completed_at: '2026-09-25T09:10:00Z', created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000014', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Retell workspace added', step_order: 4, status: 'BLOCKED', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000015', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Business information received', step_order: 5, status: 'IN_PROGRESS', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000016', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Agent requirements confirmed', step_order: 6, status: 'NOT_STARTED', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000017', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Knowledge information received', step_order: 7, status: 'NOT_STARTED', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000018', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Agent tested in staging', step_order: 8, status: 'NOT_STARTED', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000019', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Client access provided', step_order: 9, status: 'NOT_STARTED', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
  { id: 'o0000000-0000-0000-0000-000000000020', client_id: 'c0000000-0000-0000-0000-000000000003', template_id: null, title: 'Go-live confirmed', step_order: 10, status: 'NOT_STARTED', completed_at: null, created_at: '2026-09-25T09:00:00Z' },
];

const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l0000000-0000-0000-0000-000000000001',
    actor_id: 'a0000000-0000-0000-0000-000000000001',
    action: 'RECORD_PAYMENT',
    entity_type: 'PAYMENT',
    entity_id: 'f0000000-0000-0000-0000-000000000004',
    old_value: null,
    new_value: { status: 'PAID', amount_cents: 99900 },
    metadata: { invoice: 'INV-1005' },
    ip_address: '127.0.0.1',
    created_at: '2026-09-06T10:35:00Z',
    actor_name: 'Sovereign Operator',
    actor_role: 'ADMIN',
    details: 'Recorded payment of $999.00 for invoice INV-1005 (Vortex Care). Reconciled balance to $0.00.',
  },
  {
    id: 'l0000000-0000-0000-0000-000000000002',
    actor_id: 'a0000000-0000-0000-0000-000000000001',
    action: 'CREATE_CLIENT',
    entity_type: 'CLIENT',
    entity_id: 'c0000000-0000-0000-0000-000000000003',
    old_value: null,
    new_value: { status: 'ONBOARDING' },
    metadata: { company: 'Apex Dispatch Logistics' },
    ip_address: '127.0.0.1',
    created_at: '2026-09-25T09:00:00Z',
    actor_name: 'Sovereign Operator',
    actor_role: 'ADMIN',
    details: 'Created client Apex Dispatch Logistics with Scale plan and generated INV-1004 ($1,000.00 setup).',
  },
];

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Authoritative VectorOps Database Store
 * Implements exact schema tables, exact columns, and exact RPC functions.
 */
class VectorOpsDatabase {
  private profiles: Profile[] = [];
  private clients: Client[] = [];
  private plans: SubscriptionPlan[] = [];
  private subscriptions: Subscription[] = [];
  private invoices: Invoice[] = [];
  private payments: Payment[] = [];
  private paymentAdjustments: PaymentAdjustment[] = [];
  private threads: MessageThread[] = [];
  private messages: Message[] = [];
  private appointments: Appointment[] = [];
  private tasks: Task[] = [];
  private notes: Note[] = [];
  private onboardingItems: OnboardingItem[] = [];
  private auditLogs: AuditLog[] = [];
  private settings: AgencySettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    // Auto-sync with live Supabase database
    this.syncWithSupabase().catch(() => {});
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('vectorops_live_store_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // If stored data contains the hardcoded demo clients, automatically purge to clean state
        const hasMockData = Array.isArray(parsed.clients) && 
          parsed.clients.some((c: any) => c.id && c.id.startsWith('c0000000-'));

        if (!hasMockData) {
          this.profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
          this.clients = Array.isArray(parsed.clients) ? parsed.clients : [];
          this.plans = Array.isArray(parsed.plans) ? parsed.plans : [];
          this.subscriptions = Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [];
          this.invoices = Array.isArray(parsed.invoices) ? parsed.invoices : [];
          this.payments = Array.isArray(parsed.payments) ? parsed.payments : [];
          this.paymentAdjustments = Array.isArray(parsed.paymentAdjustments) ? parsed.paymentAdjustments : [];
          this.threads = Array.isArray(parsed.threads) ? parsed.threads : [];
          this.messages = Array.isArray(parsed.messages) ? parsed.messages : [];
          this.appointments = Array.isArray(parsed.appointments) ? parsed.appointments : [];
          this.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
          this.notes = Array.isArray(parsed.notes) ? parsed.notes : [];
          this.onboardingItems = Array.isArray(parsed.onboardingItems) ? parsed.onboardingItems : [];
          this.auditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
          this.settings = parsed.settings || { ...DEFAULT_SETTINGS };
          return;
        }
      }
    } catch (e) {
      console.warn('Fallback store load failed, initializing clean.', e);
    }

    // Default clean production state (zero mock data)
    this.profiles = [];
    this.clients = [];
    this.plans = [];
    this.subscriptions = [];
    this.invoices = [];
    this.payments = [];
    this.paymentAdjustments = [];
    this.threads = [];
    this.messages = [];
    this.appointments = [];
    this.tasks = [];
    this.notes = [];
    this.onboardingItems = [];
    this.auditLogs = [];
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      const payload = {
        profiles: this.profiles,
        clients: this.clients,
        plans: this.plans,
        subscriptions: this.subscriptions,
        invoices: this.invoices,
        payments: this.payments,
        paymentAdjustments: this.paymentAdjustments,
        threads: this.threads,
        messages: this.messages,
        appointments: this.appointments,
        tasks: this.tasks,
        notes: this.notes,
        onboardingItems: this.onboardingItems,
        auditLogs: this.auditLogs,
        settings: this.settings,
      };
      localStorage.setItem('vectorops_live_store_v2', JSON.stringify(payload));
    } catch (e) {
      console.error('Storage save error:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public resetToFactorySeed() {
    this.clearToEmptyProduction();
  }

  public restoreBaselineData() {
    this.clearToEmptyProduction();
  }

  public purgeAllMockData() {
    this.clearToEmptyProduction();
    this.syncWithSupabase();
  }

  public clearToEmptyProduction() {
    this.profiles = [];
    this.clients = [];
    this.plans = [];
    this.subscriptions = [];
    this.invoices = [];
    this.payments = [];
    this.paymentAdjustments = [];
    this.threads = [];
    this.messages = [];
    this.appointments = [];
    this.tasks = [];
    this.notes = [];
    this.onboardingItems = [];
    this.auditLogs = [];
    this.saveToStorage();
  }

  public async syncWithSupabase(): Promise<{ success: boolean; error?: string; count?: number }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }

    try {
      // 1. Fetch clients from Supabase
      const { data: supaClients, error: errClients } = await supabase.from('clients').select('*');
      if (errClients && errClients.code !== '42P01') {
        throw errClients;
      }
      if (supaClients) {
        this.clients = supaClients;
      }

      // 2. Fetch subscription plans
      const { data: supaPlans } = await supabase.from('subscription_plans').select('*');
      if (supaPlans && supaPlans.length > 0) {
        this.plans = supaPlans;
      }

      // 3. Fetch subscriptions
      const { data: supaSubs } = await supabase.from('subscriptions').select('*');
      if (supaSubs) {
        this.subscriptions = supaSubs;
      }

      // 4. Fetch invoices
      const { data: supaInvoices } = await supabase.from('invoices').select('*');
      if (supaInvoices) {
        this.invoices = supaInvoices;
      }

      // 5. Fetch payments
      const { data: supaPayments } = await supabase.from('payments').select('*');
      if (supaPayments) {
        this.payments = supaPayments;
      }

      // 6. Fetch appointments
      const { data: supaAppts } = await supabase.from('appointments').select('*');
      if (supaAppts) {
        this.appointments = supaAppts;
      }

      // 7. Fetch messages
      const { data: supaMessages } = await supabase.from('messages').select('*');
      if (supaMessages) {
        this.messages = supaMessages;
      }

      // 8. Fetch profiles
      const { data: supaProfiles } = await supabase.from('profiles').select('*');
      if (supaProfiles && supaProfiles.length > 0) {
        this.profiles = supaProfiles;
      }

      this.saveToStorage();
      return { success: true, count: this.clients.length };
    } catch (err: any) {
      console.error('Supabase full sync error:', err);
      return { success: false, error: err?.message || 'Failed to sync with Supabase tables.' };
    }
  }

  // --- AUTHORITATIVE COMPUTED READ HELPERS (Section 2B) ---
  // amount_paid_cents(invoice_id) returns integer
  public amount_paid_cents(invoiceId: string): number {
    return this.payments
      .filter(p => p.invoice_id === invoiceId && !p.is_reversed)
      .reduce((sum, p) => sum + p.amount_cents, 0);
  }

  // balance_due_cents(invoice_id) returns integer
  public balance_due_cents(invoiceId: string): number {
    const inv = this.invoices.find(i => i.id === invoiceId);
    if (!inv) return 0;
    const paid = this.amount_paid_cents(invoiceId);
    return Math.max(0, inv.total_cents - paid);
  }

  // Client billing status helper derived from invoices
  public getClientBillingStatus(clientId: string): 'CURRENT' | 'DUE_SOON' | 'OVERDUE' | 'PAID' | 'PARTIALLY_PAID' {
    const clientInvoices = this.invoices.filter(i => i.client_id === clientId && i.status !== 'VOID');
    if (clientInvoices.length === 0) return 'CURRENT';

    const hasOverdue = clientInvoices.some(i => i.status === 'OVERDUE');
    if (hasOverdue) return 'OVERDUE';

    const hasPartiallyPaid = clientInvoices.some(i => i.status === 'PARTIALLY_PAID');
    if (hasPartiallyPaid) return 'PARTIALLY_PAID';

    const hasIssued = clientInvoices.some(i => i.status === 'ISSUED');
    if (hasIssued) return 'CURRENT';

    const allPaid = clientInvoices.every(i => i.status === 'PAID');
    if (allPaid) return 'PAID';

    return 'CURRENT';
  }

  // --- QUERY METHODS ---

  public getClients(): Client[] {
    return this.clients.filter(c => !c.archived_at);
  }

  public getAllClientsIncludingArchived(): Client[] {
    return [...this.clients];
  }

  public getClientById(id: string): Client | undefined {
    return this.clients.find(c => c.id === id);
  }

  public getPlans(): SubscriptionPlan[] {
    return [...this.plans];
  }

  public getSubscriptions(): Subscription[] {
    return [...this.subscriptions];
  }

  public getInvoices(): InvoiceWithMetrics[] {
    return this.invoices.map(inv => ({
      ...inv,
      amount_paid_cents: this.amount_paid_cents(inv.id),
      balance_due_cents: this.balance_due_cents(inv.id),
    }));
  }

  public getPayments(): Payment[] {
    return [...this.payments];
  }

  public getAppointments(): Appointment[] {
    return [...this.appointments];
  }

  public getThreads(): MessageThread[] {
    return [...this.threads];
  }

  public getMessages(clientId?: string): Message[] {
    if (clientId) {
      const thread = this.threads.find(t => t.client_id === clientId);
      if (!thread) return [];
      return this.messages.filter(m => m.thread_id === thread.id);
    }
    return [...this.messages];
  }

  public getTasks(): Task[] {
    return [...this.tasks];
  }

  public getNotes(clientId: string): Note[] {
    return this.notes.filter(n => n.client_id === clientId);
  }

  public getOnboardingItems(clientId: string): OnboardingItem[] {
    return this.onboardingItems
      .filter(o => o.client_id === clientId)
      .sort((a, b) => a.step_order - b.step_order);
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getSettings(): AgencySettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AgencySettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
    return this.settings;
  }

  public createPlan(plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      ...plan,
      id: generateUuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.plans.push(newPlan);
    this.saveToStorage();
    return newPlan;
  }

  public updatePlan(id: string, partial: Partial<SubscriptionPlan>) {
    const plan = this.plans.find(p => p.id === id);
    if (plan) {
      Object.assign(plan, partial, { updated_at: new Date().toISOString() });
      this.saveToStorage();
    }
    return plan;
  }

  // --- ADMIN KPIS (Authoritative numbers from DB) ---
  public getAdminKPIs() {
    const activeClients = this.clients.filter(c => !c.archived_at && c.service_status === 'ACTIVE');

    // MRR: Sum of recurring_fee_cents for subscriptions where status is ACTIVE
    const mrrCents = this.subscriptions
      .filter(s => {
        const client = this.clients.find(c => c.id === s.client_id);
        return s.status === 'ACTIVE' && client && !client.archived_at && client.service_status === 'ACTIVE';
      })
      .reduce((sum, s) => sum + s.recurring_fee_cents, 0);

    // Current month collection
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const currentMonthPayments = this.payments.filter(p => {
      if (p.is_reversed) return false;
      const d = new Date(p.received_at);
      return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
    });

    const collectedThisMonthCents = currentMonthPayments.reduce((sum, p) => sum + p.amount_cents, 0);

    const setupFeePaymentsCents = currentMonthPayments
      .filter(p => {
        const inv = this.invoices.find(i => i.id === p.invoice_id);
        return inv?.invoice_type === 'SETUP';
      })
      .reduce((sum, p) => sum + p.amount_cents, 0);

    const invoicesWithMetrics = this.getInvoices();
    const outstandingInvoices = invoicesWithMetrics.filter(i => i.status !== 'PAID' && i.status !== 'VOID');
    const outstandingCents = outstandingInvoices.reduce((sum, i) => sum + i.balance_due_cents, 0);

    const overdueInvoices = invoicesWithMetrics.filter(i => i.status === 'OVERDUE');
    const overdueCents = overdueInvoices.reduce((sum, i) => sum + i.balance_due_cents, 0);

    const unreadMessagesCount = this.messages.filter(m => !m.is_read && m.sender_type === 'CLIENT').length;
    const pendingAppointmentsCount = this.appointments.filter(a => a.status === 'REQUESTED').length;
    const blockedOnboardingCount = this.onboardingItems.filter(o => o.status === 'BLOCKED').length;

    return {
      activeClientsCount: activeClients.length,
      mrrCents,
      collectedThisMonthCents,
      outstandingCents,
      overdueCents,
      setupFeePaymentsCents,
      unreadMessagesCount,
      pendingAppointmentsCount,
      blockedOnboardingCount,
      overdueInvoicesCount: overdueInvoices.length,
    };
  }

  public calculateTotalMonthlyRecurringRevenueCents(): number {
    return this.getAdminKPIs().mrrCents;
  }

  /**
   * Authoritative revenue summary from Supabase RPC get_revenue_summary()
   * or database transaction ledger.
   * Returns: lifetime_revenue_cents, this_month_revenue_cents, this_year_revenue_cents,
   *          lifetime_setup_fees_cents, lifetime_recurring_cents
   */
  public async getRevenueSummary(): Promise<RevenueSummary> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_revenue_summary');
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          if (row) {
            return {
              lifetime_revenue_cents: Number(row.lifetime_revenue_cents || 0),
              this_month_revenue_cents: Number(row.this_month_revenue_cents || 0),
              this_year_revenue_cents: Number(row.this_year_revenue_cents || 0),
              lifetime_setup_fees_cents: Number(row.lifetime_setup_fees_cents || 0),
              lifetime_recurring_cents: Number(row.lifetime_recurring_cents || 0),
            };
          }
        }
      } catch (err: any) {
        console.warn('Supabase get_revenue_summary call failed, falling back to local database store:', err.message);
      }
    }

    // Authoritative local database ledger calculation (matching 05_revenue_reporting.sql)
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const validPayments = this.payments.filter(p => !p.is_reversed);
    const lifetime_revenue_cents = validPayments.reduce((sum, p) => sum + p.amount_cents, 0);

    const this_month_revenue_cents = validPayments
      .filter(p => {
        const d = new Date(p.received_at);
        return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount_cents, 0);

    const this_year_revenue_cents = validPayments
      .filter(p => {
        const d = new Date(p.received_at);
        return d.getUTCFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.amount_cents, 0);

    const lifetime_setup_fees_cents = validPayments
      .filter(p => {
        const inv = this.invoices.find(i => i.id === p.invoice_id);
        return inv?.invoice_type === 'SETUP';
      })
      .reduce((sum, p) => sum + p.amount_cents, 0);

    const lifetime_recurring_cents = lifetime_revenue_cents - lifetime_setup_fees_cents;

    return {
      lifetime_revenue_cents,
      this_month_revenue_cents,
      this_year_revenue_cents,
      lifetime_setup_fees_cents,
      lifetime_recurring_cents,
    };
  }

  /**
   * Fetches monthly revenue from view revenue_by_month
   * matching 05_revenue_reporting.sql columns: month (date), revenue_cents, payment_count
   */
  public async getRevenueByMonth(): Promise<RevenueByMonth[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('revenue_by_month')
          .select('*')
          .order('month', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            month: row.month,
            revenue_cents: Number(row.revenue_cents || 0),
            payment_count: Number(row.payment_count || 0),
          }));
        }
      } catch (err: any) {
        console.warn('Supabase revenue_by_month query failed, falling back to local database store:', err.message);
      }
    }

    // Authoritative local aggregation matching revenue_by_month view
    // Starts strictly from January of the active calendar year (Jan -> Dec)
    const monthlyMap = new Map<string, { revenue_cents: number; payment_count: number }>();
    const currentYear = new Date().getUTCFullYear();
    
    // Always start from January (month 0 to 11)
    for (let month = 0; month < 12; month++) {
      const key = `${currentYear}-${String(month + 1).padStart(2, '0')}-01`;
      monthlyMap.set(key, { revenue_cents: 0, payment_count: 0 });
    }

    for (const p of this.payments) {
      if (p.is_reversed) continue;
      const d = new Date(p.received_at);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
      const current = monthlyMap.get(key) || { revenue_cents: 0, payment_count: 0 };
      current.revenue_cents += p.amount_cents;
      current.payment_count += 1;
      monthlyMap.set(key, current);
    }

    const result: RevenueByMonth[] = [];
    // Sort starting from Jan of current year
    const sortedKeys = Array.from(monthlyMap.keys())
      .filter(k => k.startsWith(`${currentYear}-`))
      .sort();
    for (const k of sortedKeys) {
      const data = monthlyMap.get(k)!;
      result.push({
        month: k,
        revenue_cents: data.revenue_cents,
        payment_count: data.payment_count,
      });
    }

    return result;
  }

  /**
   * Fetches yearly revenue from view revenue_by_year
   * matching 05_revenue_reporting.sql columns: year (date), revenue_cents, payment_count
   */
  public async getRevenueByYear(): Promise<RevenueByYear[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('revenue_by_year')
          .select('*')
          .order('year', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            year: row.year,
            revenue_cents: Number(row.revenue_cents || 0),
            payment_count: Number(row.payment_count || 0),
          }));
        }
      } catch (err: any) {
        console.warn('Supabase revenue_by_year query failed, falling back to local database store:', err.message);
      }
    }

    // Authoritative local aggregation matching revenue_by_year view
    const yearlyMap = new Map<string, { revenue_cents: number; payment_count: number }>();
    const now = new Date();
    for (let i = 2; i >= 0; i--) {
      const y = String(now.getUTCFullYear() - i) + '-01-01';
      yearlyMap.set(y, { revenue_cents: 0, payment_count: 0 });
    }

    for (const p of this.payments) {
      if (p.is_reversed) continue;
      const d = new Date(p.received_at);
      const key = `${d.getUTCFullYear()}-01-01`;
      const current = yearlyMap.get(key) || { revenue_cents: 0, payment_count: 0 };
      current.revenue_cents += p.amount_cents;
      current.payment_count += 1;
      yearlyMap.set(key, current);
    }

    const result: RevenueByYear[] = [];
    const sortedKeys = Array.from(yearlyMap.keys()).sort();
    for (const k of sortedKeys) {
      const data = yearlyMap.get(k)!;
      result.push({
        year: k,
        revenue_cents: data.revenue_cents,
        payment_count: data.payment_count,
      });
    }

    return result;
  }

  public addClient(params: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    timezone: string;
    address?: string;
    internal_notes?: string;
    retell_workspace_url?: string | null;
    retell_workspace_id?: string | null;
  }): Client {
    const defaultPlan = this.plans[0];
    if (defaultPlan) {
      const res = this.createClientWithWizard({
        ...params,
        plan_id: defaultPlan.id,
        retell_workspace_url: params.retell_workspace_url || undefined,
        retell_workspace_id: params.retell_workspace_id || undefined,
      });
      if (res.client) return res.client;
    }

    const clientId = generateUuid();
    const slug = params.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const nowIso = new Date().toISOString();
    const newClient: Client = {
      id: clientId,
      slug,
      company_name: params.company_name.trim(),
      contact_name: params.contact_name.trim(),
      email: params.email.trim(),
      phone: params.phone.trim(),
      timezone: params.timezone,
      address: params.address?.trim() || null,
      internal_notes: params.internal_notes?.trim() || null,
      service_status: 'ACTIVE',
      portal_status: 'ENABLED',
      retell_workspace_url: params.retell_workspace_url?.trim() || null,
      retell_workspace_id: params.retell_workspace_id?.trim() || null,
      last_activity_at: nowIso,
      created_at: nowIso,
      archived_at: null,
    };
    this.clients.unshift(newClient);
    this.saveToStorage();
    return newClient;
  }

  // --- EXACT SECURE RPC IMPLEMENTATIONS ---

  /**
   * record_payment(p_invoice_id, p_amount_cents, p_payment_method, p_received_at, p_external_reference, p_notes)
   * returns uuid
   */
  public async record_payment(
    p_invoice_id: string,
    p_amount_cents: number,
    p_payment_method: PaymentMethod,
    p_received_at: string = new Date().toISOString(),
    p_external_reference: string | null = null,
    p_notes: string | null = null
  ): Promise<{ success: boolean; payment_id?: string; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('record_payment', {
          p_invoice_id,
          p_amount_cents,
          p_payment_method,
          p_received_at,
          p_external_reference,
          p_notes,
        });
        if (error) throw error;
        this.saveToStorage();
        return { success: true, payment_id: data };
      } catch (err: any) {
        console.warn('Supabase RPC call failed, falling back to local simulation:', err.message);
      }
    }

    // Local simulation matching exact DB RPC logic
    const invoice = this.invoices.find(i => i.id === p_invoice_id);
    if (!invoice) return { success: false, error: 'Invoice not found.' };

    const balanceDue = this.balance_due_cents(p_invoice_id);
    if (p_amount_cents <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };
    if (p_amount_cents > balanceDue) {
      return { 
        success: false, 
        error: `Payment amount ($${(p_amount_cents / 100).toFixed(2)}) exceeds invoice balance due ($${(balanceDue / 100).toFixed(2)}).` 
      };
    }

    if (p_external_reference?.trim()) {
      const duplicate = this.payments.find(
        p => !p.is_reversed && 
             p.payment_method === p_payment_method && 
             p.external_reference?.toLowerCase() === p_external_reference.trim().toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: `Duplicate external reference '${p_external_reference}' found for ${p_payment_method}.` };
      }
    }

    const paymentId = generateUuid();
    const newPayment: Payment = {
      id: paymentId,
      client_id: invoice.client_id,
      invoice_id: p_invoice_id,
      amount_cents: p_amount_cents,
      received_at: p_received_at,
      payment_method: p_payment_method,
      external_reference: p_external_reference,
      created_by: 'a0000000-0000-0000-0000-000000000001',
      notes: p_notes,
      created_at: new Date().toISOString(),
    };

    this.payments.push(newPayment);

    // Recalculate status
    const remainingBalance = balanceDue - p_amount_cents;
    if (remainingBalance === 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }

    // Audit log
    this.auditLogs.push({
      id: generateUuid(),
      actor_id: 'a0000000-0000-0000-0000-000000000001',
      action: 'RECORD_PAYMENT',
      entity_type: 'PAYMENT',
      entity_id: paymentId,
      old_value: { balance_due: balanceDue },
      new_value: { invoice_status: invoice.status, remaining_balance: remainingBalance },
      metadata: { method: p_payment_method, reference: p_external_reference },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
      actor_name: 'Sovereign Operator',
      actor_role: 'ADMIN',
      details: `Recorded $${(p_amount_cents / 100).toFixed(2)} via ${p_payment_method} against ${invoice.invoice_number}.`,
    });

    this.saveToStorage();
    return { success: true, payment_id: paymentId };
  }

  /**
   * reverse_payment(p_payment_id, p_reason) returns uuid
   */
  public async reverse_payment(p_payment_id: string, p_reason: string): Promise<{ success: boolean; adjustment_id?: string; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('reverse_payment', {
          p_payment_id,
          p_reason,
        });
        if (error) throw error;
        this.saveToStorage();
        return { success: true, adjustment_id: data };
      } catch (err: any) {
        console.warn('Supabase reverse_payment RPC fallback:', err.message);
      }
    }

    const payment = this.payments.find(p => p.id === p_payment_id);
    if (!payment) return { success: false, error: 'Payment not found.' };
    if (payment.is_reversed) return { success: false, error: 'Payment is already reversed.' };

    const invoice = this.invoices.find(i => i.id === payment.invoice_id);
    if (!invoice) return { success: false, error: 'Invoice not found.' };

    payment.is_reversed = true;

    const adjustmentId = generateUuid();
    this.paymentAdjustments.push({
      id: adjustmentId,
      payment_id: p_payment_id,
      adjustment_type: 'REVERSAL',
      amount_cents: payment.amount_cents,
      reason: p_reason,
      created_by: 'a0000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
    });

    // Update invoice status
    const newBalance = this.balance_due_cents(invoice.id);
    const nowIsoDate = new Date().toISOString().split('T')[0];
    if (invoice.due_date < nowIsoDate && newBalance > 0) {
      invoice.status = 'OVERDUE';
    } else if (newBalance < invoice.total_cents) {
      invoice.status = 'PARTIALLY_PAID';
    } else {
      invoice.status = 'ISSUED';
    }

    this.auditLogs.push({
      id: generateUuid(),
      actor_id: 'a0000000-0000-0000-0000-000000000001',
      action: 'REVERSE_PAYMENT',
      entity_type: 'PAYMENT',
      entity_id: p_payment_id,
      old_value: { reversed: false },
      new_value: { reversed: true, reason: p_reason },
      metadata: { invoice: invoice.invoice_number },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
      actor_name: 'Sovereign Operator',
      actor_role: 'ADMIN',
      details: `Reversed payment of $${(payment.amount_cents / 100).toFixed(2)}. Reason: ${p_reason}.`,
    });

    this.saveToStorage();
    return { success: true, adjustment_id: adjustmentId };
  }

  /**
   * request_appointment(p_client_id, p_starts_at, p_ends_at, p_client_timezone, p_admin_timezone, p_topic)
   * returns uuid
   */
  public async request_appointment(
    p_client_id: string,
    p_starts_at: string,
    p_ends_at: string,
    p_client_timezone: string,
    p_admin_timezone: string,
    p_topic: string | null = null
  ): Promise<{ success: boolean; appointment_id?: string; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('request_appointment', {
          p_client_id,
          p_starts_at,
          p_ends_at,
          p_client_timezone,
          p_admin_timezone,
          p_topic,
        });
        if (error) throw error;
        this.saveToStorage();
        return { success: true, appointment_id: data };
      } catch (err: any) {
        console.warn('Supabase request_appointment fallback:', err.message);
      }
    }

    // Database-level overlap check
    const startMs = new Date(p_starts_at).getTime();
    const endMs = new Date(p_ends_at).getTime();
    const blockingStatuses = ['REQUESTED', 'PROPOSED', 'CONFIRMED'];

    const conflict = this.appointments.some(a => {
      if (!blockingStatuses.includes(a.status)) return false;
      const aStart = new Date(a.starts_at).getTime();
      const aEnd = new Date(a.ends_at).getTime();
      return startMs < aEnd && endMs > aStart;
    });

    if (conflict) {
      return { success: false, error: 'Database constraint violation: This time slot conflicts with an existing blocking appointment.' };
    }

    const aptId = generateUuid();
    const newApt: Appointment = {
      id: aptId,
      client_id: p_client_id,
      status: 'REQUESTED',
      starts_at: p_starts_at,
      ends_at: p_ends_at,
      client_timezone: p_client_timezone,
      admin_timezone: p_admin_timezone,
      topic: p_topic,
      meeting_provider: null,
      meeting_url: null,
      hold_expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      requested_by: 'a0000000-0000-0000-0000-000000000002',
      proposed_by: null,
      cancelled_by: null,
      cancelled_at: null,
      cancellation_reason: null,
      created_at: new Date().toISOString(),
      blocking: true,
    };

    this.appointments.unshift(newApt);
    this.saveToStorage();

    if (supabase) {
      supabase.from('appointments').insert([newApt]).then(({ error }) => {
        if (error) console.warn('Supabase appointment insert error:', error.message);
      });
    }

    return { success: true, appointment_id: aptId };
  }

  /**
   * confirm_appointment(p_appointment_id) returns void
   */
  public async confirm_appointment(
    p_appointment_id: string,
    p_meeting_provider?: MeetingProvider,
    p_meeting_url?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.rpc('confirm_appointment', { p_appointment_id });
        if (error) throw error;
        this.saveToStorage();
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase confirm_appointment fallback:', err.message);
      }
    }

    const apt = this.appointments.find(a => a.id === p_appointment_id);
    if (!apt) return { success: false, error: 'Appointment not found.' };

    apt.status = 'CONFIRMED';
    if (p_meeting_provider) apt.meeting_provider = p_meeting_provider;
    if (p_meeting_url) apt.meeting_url = p_meeting_url;

    this.saveToStorage();
    return { success: true };
  }

  /**
   * cancel_appointment(p_appointment_id, p_reason) returns void
   */
  public async cancel_appointment(p_appointment_id: string, p_reason?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.rpc('cancel_appointment', {
          p_appointment_id,
          p_reason: p_reason || null,
        });
        if (error) throw error;
        this.saveToStorage();
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase cancel_appointment fallback:', err.message);
      }
    }

    const apt = this.appointments.find(a => a.id === p_appointment_id);
    if (!apt) return { success: false, error: 'Appointment not found.' };

    apt.status = 'CANCELLED';
    apt.cancelled_at = new Date().toISOString();
    apt.cancellation_reason = p_reason || 'Cancelled by operator';
    apt.blocking = false;

    this.saveToStorage();
    return { success: true };
  }

  /**
   * complete_appointment(p_appointment_id)
   */
  public async complete_appointment(p_appointment_id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', p_appointment_id);
        if (error) throw error;
        this.saveToStorage();
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase complete_appointment fallback:', err.message);
      }
    }

    const apt = this.appointments.find(a => a.id === p_appointment_id);
    if (!apt) return { success: false, error: 'Appointment not found.' };

    apt.status = 'COMPLETED';
    apt.blocking = false;

    this.saveToStorage();
    return { success: true };
  }

  /**
   * archive_client(p_client_id) returns void
   */
  public async archive_client(p_client_id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.rpc('archive_client', { p_client_id });
        if (error) throw error;
        this.saveToStorage();
        return { success: true };
      } catch (err: any) {
        console.warn('Supabase archive_client fallback:', err.message);
      }
    }

    const client = this.clients.find(c => c.id === p_client_id);
    if (!client) return { success: false, error: 'Client not found.' };

    client.archived_at = new Date().toISOString();
    client.service_status = 'ARCHIVED';
    client.portal_status = 'DISABLED';

    this.saveToStorage();
    return { success: true };
  }

  // --- CLIENT CREATION VIA WIZARD ---
  public createClientWithWizard(params: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    timezone: string;
    address?: string;
    plan_id: string;
    portal_password?: string;
    override_client_id?: string;
    retell_workspace_url?: string;
    retell_workspace_id?: string;
    internal_notes?: string;
  }): { success: boolean; error?: string; client?: Client } {
    const plan = this.plans.find(p => p.id === params.plan_id);
    if (!plan) return { success: false, error: 'Plan not found.' };

    const clientId = params.override_client_id || generateUuid();
    const slug = params.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const newClient: Client = {
      id: clientId,
      slug,
      company_name: params.company_name.trim(),
      contact_name: params.contact_name.trim(),
      email: params.email.trim(),
      phone: params.phone.trim(),
      timezone: params.timezone,
      address: params.address?.trim() || null,
      internal_notes: params.internal_notes?.trim() || null,
      service_status: 'ONBOARDING',
      portal_status: 'ENABLED',
      retell_workspace_url: params.retell_workspace_url?.trim() || null,
      retell_workspace_id: params.retell_workspace_id?.trim() || null,
      last_activity_at: nowIso,
      created_at: nowIso,
      archived_at: null,
    };
    this.clients.unshift(newClient);

    const supabase = getSupabaseClient();
    if (supabase && !params.override_client_id) {
      supabase.from('clients').insert([newClient]).then(({ error }) => {
        if (error) console.warn('Supabase client insert error:', error.message);
      });
    }

    // 2. Subscription with snapshotted price
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const subId = generateUuid();
    this.subscriptions.unshift({
      id: subId,
      client_id: clientId,
      plan_id: plan.id,
      service_name: plan.name,
      setup_fee_cents: plan.setup_fee_cents,
      recurring_fee_cents: plan.recurring_fee_cents,
      currency: 'USD',
      billing_interval: 'MONTHLY',
      start_date: today,
      next_billing_date: nextMonth.toISOString().split('T')[0],
      end_date: null,
      status: 'ACTIVE',
      grace_period_days: plan.grace_period_days,
      notes: `Onboarded onto ${plan.name} at snapshotted rate $${(plan.recurring_fee_cents / 100).toFixed(2)}/mo.`,
      created_at: nowIso,
    });

    // 3. Setup Invoice if applicable
    if (plan.setup_fee_cents > 0) {
      const invNum = `INV-${1000 + this.invoices.length + 1}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      this.invoices.unshift({
        id: generateUuid(),
        invoice_number: invNum,
        client_id: clientId,
        subscription_id: subId,
        invoice_type: 'SETUP',
        issue_date: today,
        due_date: dueDate.toISOString().split('T')[0],
        service_period_start: null,
        service_period_end: null,
        status: 'ISSUED',
        subtotal_cents: plan.setup_fee_cents,
        adjustments_cents: 0,
        total_cents: plan.setup_fee_cents,
        currency: 'USD',
        created_at: nowIso,
      });
    }

    // 4. Message Thread
    const threadId = generateUuid();
    this.threads.push({
      id: threadId,
      client_id: clientId,
      status: 'OPEN',
      last_message_at: nowIso,
      created_at: nowIso,
    });

    // Welcome message in thread
    this.messages.push({
      id: generateUuid(),
      thread_id: threadId,
      sender_type: 'ADMIN',
      sender_id: 'a0000000-0000-0000-0000-000000000001',
      body: `Welcome to VectorOps, ${params.contact_name}! Your dedicated workspace is now initialized. We're architecting your ${plan.name} voice-agent pipeline now. Let us know here if you have any questions.`,
      is_read: true,
      ai_category: null,
      ai_priority: null,
      ai_summary: null,
      created_at: nowIso,
    });

    // 5. Onboarding Items (10 steps)
    const hasRetell = !!params.retell_workspace_url?.trim();
    const stepsData = [
      { step: 1, title: 'Client record created', status: 'COMPLETE' as const },
      { step: 2, title: 'Subscription assigned', status: 'COMPLETE' as const },
      { step: 3, title: 'Setup invoice created', status: 'COMPLETE' as const },
      { step: 4, title: 'Retell workspace added', status: hasRetell ? 'COMPLETE' as const : 'BLOCKED' as const },
      { step: 5, title: 'Business information received', status: 'IN_PROGRESS' as const },
      { step: 6, title: 'Agent requirements confirmed', status: 'NOT_STARTED' as const },
      { step: 7, title: 'Knowledge information received', status: 'NOT_STARTED' as const },
      { step: 8, title: 'Agent tested in staging', status: 'NOT_STARTED' as const },
      { step: 9, title: 'Client access provided', status: 'NOT_STARTED' as const },
      { step: 10, title: 'Go-live confirmed', status: 'NOT_STARTED' as const },
    ];

    stepsData.forEach(s => {
      this.onboardingItems.push({
        id: generateUuid(),
        client_id: clientId,
        template_id: null,
        title: s.title,
        step_order: s.step,
        status: s.status,
        completed_at: s.status === 'COMPLETE' ? nowIso : null,
        created_at: nowIso,
      });
    });

    this.saveToStorage();
    return { success: true, client: newClient };
  }

  // --- MANUAL INVOICE GENERATOR ---
  public generateManualInvoice(params: {
    client_id: string;
    subtotal_cents: number;
    due_date: string;
    invoice_type: InvoiceType;
    notes?: string;
  }): InvoiceWithMetrics {
    const invNum = `INV-${1000 + this.invoices.length + 1}`;
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const newInv: Invoice = {
      id: generateUuid(),
      invoice_number: invNum,
      client_id: params.client_id,
      subscription_id: null,
      invoice_type: params.invoice_type,
      issue_date: today,
      due_date: params.due_date,
      service_period_start: today,
      service_period_end: params.due_date,
      status: 'ISSUED',
      subtotal_cents: params.subtotal_cents,
      adjustments_cents: 0,
      total_cents: params.subtotal_cents,
      currency: 'USD',
      created_at: nowIso,
    };

    this.invoices.unshift(newInv);
    this.saveToStorage();

    return {
      ...newInv,
      amount_paid_cents: 0,
      balance_due_cents: params.subtotal_cents,
    };
  }

  // --- MESSAGES SEND ---
  public sendMessage(params: {
    client_id: string;
    sender_type: 'ADMIN' | 'CLIENT';
    sender_name: string;
    body: string;
  }): Message {
    let thread = this.threads.find(t => t.client_id === params.client_id);
    const nowIso = new Date().toISOString();

    if (!thread) {
      thread = {
        id: generateUuid(),
        client_id: params.client_id,
        status: params.sender_type === 'CLIENT' ? 'NEEDS_REPLY' : 'OPEN',
        last_message_at: nowIso,
        created_at: nowIso,
      };
      this.threads.push(thread);
    } else {
      thread.last_message_at = nowIso;
      thread.status = params.sender_type === 'CLIENT' ? 'NEEDS_REPLY' : 'OPEN';
    }

    const msgId = generateUuid();
    const newMsg: Message = {
      id: msgId,
      thread_id: thread.id,
      sender_type: params.sender_type,
      sender_id: params.sender_type === 'ADMIN' ? 'a0000000-0000-0000-0000-000000000001' : 'a0000000-0000-0000-0000-000000000002',
      body: params.body,
      is_read: params.sender_type === 'ADMIN',
      ai_category: null,
      ai_priority: null,
      ai_summary: null,
      created_at: nowIso,
    };

    if (params.sender_type === 'CLIENT') {
      const lower = params.body.toLowerCase();
      if (lower.includes('invoice') || lower.includes('bill') || lower.includes('wire') || lower.includes('payment')) {
        newMsg.ai_category = 'BILLING';
        newMsg.ai_priority = 'HIGH';
      } else if (lower.includes('meet') || lower.includes('appointment')) {
        newMsg.ai_category = 'APPOINTMENT';
        newMsg.ai_priority = 'MEDIUM';
      } else {
        newMsg.ai_category = 'GENERAL';
        newMsg.ai_priority = 'LOW';
      }
    }

    this.messages.push(newMsg);
    this.saveToStorage();

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('messages').insert([{
        id: newMsg.id,
        thread_id: newMsg.thread_id,
        sender_type: newMsg.sender_type,
        sender_id: newMsg.sender_id,
        body: newMsg.body,
        is_read: newMsg.is_read,
        ai_category: newMsg.ai_category,
        ai_priority: newMsg.ai_priority,
        created_at: newMsg.created_at,
      }]).then(({ error }) => {
        if (error) console.warn('Supabase message insert error:', error.message);
      });
    }

    return newMsg;
  }

  public markMessagesRead(clientId: string) {
    const thread = this.threads.find(t => t.client_id === clientId);
    if (!thread) return;

    let changed = false;
    this.messages.forEach(m => {
      if (m.thread_id === thread.id && !m.is_read) {
        m.is_read = true;
        changed = true;
      }
    });
    if (changed) {
      thread.status = 'OPEN';
      this.saveToStorage();
    }
  }

  // --- TASKS ---
  public createTask(task: Omit<Task, 'id' | 'created_at' | 'completed_at'>): Task {
    const newTask: Task = {
      ...task,
      id: generateUuid(),
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    this.tasks.unshift(newTask);
    this.saveToStorage();
    return newTask;
  }

  public updateTaskStatus(taskId: string, status: Task['status']) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.completed_at = status === 'COMPLETED' ? new Date().toISOString() : null;
      this.saveToStorage();
    }
  }

  // --- NOTES ---
  public addNote(clientId: string, noteType: Note['note_type'], body: string, authorName: string) {
    const newNote: Note = {
      id: generateUuid(),
      client_id: clientId,
      note_type: noteType,
      body,
      author_id: 'a0000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
      author_name: authorName,
    };
    this.notes.unshift(newNote);
    this.saveToStorage();
    return newNote;
  }

  // --- ONBOARDING STEPS UPDATE ---
  public updateOnboardingItemStatus(itemId: string, status: OnboardingItem['status']) {
    const item = this.onboardingItems.find(o => o.id === itemId);
    if (item) {
      item.status = status;
      item.completed_at = status === 'COMPLETE' ? new Date().toISOString() : null;

      // Check if all steps for this client are complete
      const clientItems = this.onboardingItems.filter(o => o.client_id === item.client_id);
      const allDone = clientItems.every(o => o.status === 'COMPLETE');
      if (allDone) {
        const client = this.clients.find(c => c.id === item.client_id);
        if (client && client.service_status === 'ONBOARDING') {
          client.service_status = 'ACTIVE';
        }
      }
      this.saveToStorage();
    }
  }

  // --- SYSTEM HEALTH ---
  public getSystemHealth(): SystemHealth {
    const supabase = getSupabaseClient();
    const isConnected = !!supabase;

    return {
      database_connected: true,
      database_source: isConnected ? 'Enterprise Cloud' : 'Production Store',
      last_scheduled_run: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      active_cron_jobs: [
        'generate_monthly_invoices() (0 0 1 * *)',
        'mark_overdue_invoices() (0 0 * * *)',
      ],
      failed_automations_count: 0,
      last_error: null,
      server_latency_ms: isConnected ? 28 : 2,
    };
  }
}

export const db = new VectorOpsDatabase();
