import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  Globe, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Database,
  Building2,
  Mail,
  Trash2,
  Sparkles,
  Server,
  Cloud,
  Check,
  AlertCircle,
  ExternalLink,
  Plus,
  Edit2,
  Link as LinkIcon,
  Layers,
  Pencil
} from 'lucide-react';
import { db } from '../../lib/database';
import { POPULAR_TIMEZONES, formatUSD, parseDollarsToCents } from '../../lib/timezone';
import { AgencySettings, AgencyPaymentLink, PaymentPlatform, SubscriptionPlan } from '../../types';
import { PlatformIcon } from '../common/PlatformIcon';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { SUPABASE_CONFIG } from '../../config/supabaseConfig';

interface SettingsViewProps {
  onOpenSupabaseModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSupabaseModal,
}) => {
  const currentSettings = db.getSettings();

  const [agencyName, setAgencyName] = useState(currentSettings.agency_name);
  const [adminName, setAdminName] = useState(currentSettings.admin_name);
  const [adminEmail, setAdminEmail] = useState(currentSettings.admin_email);
  const [adminTimezone, setAdminTimezone] = useState(currentSettings.admin_timezone);
  const [hoursStart, setHoursStart] = useState(currentSettings.business_hours_start);
  const [hoursEnd, setHoursEnd] = useState(currentSettings.business_hours_end);
  const [duration, setDuration] = useState(currentSettings.default_meeting_duration_minutes.toString());
  const [buffer, setBuffer] = useState(currentSettings.meeting_buffer_minutes.toString());
  const [holdHours, setHoldHours] = useState(currentSettings.pending_hold_duration_hours.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cloudflare & Supabase Configuration state
  const initialConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(initialConfig.anonKey);
  const [isVerifyingDb, setIsVerifyingDb] = useState(false);
  const [dbNotice, setDbNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const clientsCount = db.getClients().length;
  const invoicesCount = db.getInvoices().length;
  const appointmentsCount = db.getAppointments().length;
  const isConnected = !!initialConfig.url && !!initialConfig.anonKey;

  // Payment links state
  const paymentLinks = db.getPaymentLinks();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkPlatform, setLinkPlatform] = useState<PaymentPlatform>('WHATSAPP');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkIsActive, setLinkIsActive] = useState(true);
  const [linkError, setLinkError] = useState('');

  const getPlaceholderForPlatform = (platform: PaymentPlatform) => {
    switch (platform) {
      case 'WHATSAPP': return 'https://wa.me/91XXXXXXXXXX';
      case 'INSTAGRAM': return 'https://instagram.com/youragency';
      case 'X': return 'https://x.com/youragency';
      case 'PAYPAL': return 'https://paypal.me/youragency';
      case 'TELEGRAM': return 'https://t.me/youragency';
      case 'EMAIL': return 'mailto:billing@yourdomain.com';
      case 'CUSTOM': default: return 'https://yourgateway.com/pay';
    }
  };

  const handleOpenAddLink = () => {
    setEditingLinkId(null);
    setLinkPlatform('WHATSAPP');
    setLinkLabel('WhatsApp — Primary');
    setLinkUrl('https://wa.me/');
    setLinkIsActive(true);
    setLinkError('');
    setIsLinkModalOpen(true);
  };

  const handleEditLink = (link: AgencyPaymentLink) => {
    setEditingLinkId(link.id);
    setLinkPlatform(link.platform);
    setLinkLabel(link.label);
    setLinkUrl(link.url);
    setLinkIsActive(link.is_active);
    setLinkError('');
    setIsLinkModalOpen(true);
  };

  const handleSavePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');

    if (!linkLabel.trim()) {
      setLinkError('Please provide a descriptive label for this payment link.');
      return;
    }
    if (!linkUrl.trim()) {
      setLinkError('Please provide a destination URL or handle.');
      return;
    }

    if (editingLinkId) {
      await db.updatePaymentLink(editingLinkId, {
        platform: linkPlatform,
        label: linkLabel.trim(),
        url: linkUrl.trim(),
        is_active: linkIsActive,
      });
    } else {
      await db.addPaymentLink({
        platform: linkPlatform,
        label: linkLabel.trim(),
        url: linkUrl.trim(),
        is_active: linkIsActive,
      });
    }

    setIsLinkModalOpen(false);
  };

  const handleToggleLinkActive = async (link: AgencyPaymentLink) => {
    await db.updatePaymentLink(link.id, { is_active: !link.is_active });
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm('Delete this payment link? Any client assigned to it will no longer display a Pay now redirect button until reassigned.')) {
      await db.deletePaymentLink(id);
    }
  };

  // Subscription Plans / Packages pattern state
  const plans = db.getPlans();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planRecurringDollars, setPlanRecurringDollars] = useState('499.00');
  const [planSetupDollars, setPlanSetupDollars] = useState('499.00');
  const [planDuration, setPlanDuration] = useState('Monthly');
  const [planType, setPlanType] = useState('Inbound AI Voice Receptionist');
  const [planGraceDays, setPlanGraceDays] = useState('7');
  const [planError, setPlanError] = useState('');

  const handleOpenNewPlan = () => {
    setEditingPlanId(null);
    setPlanName('');
    setPlanRecurringDollars('499.00');
    setPlanSetupDollars('499.00');
    setPlanDuration('Monthly');
    setPlanType('Inbound AI Voice Receptionist');
    setPlanGraceDays('7');
    setPlanError('');
    setIsPlanModalOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanRecurringDollars((plan.recurring_fee_cents / 100).toFixed(2));
    setPlanSetupDollars((plan.setup_fee_cents / 100).toFixed(2));
    setPlanDuration(plan.billing_interval === 'MONTHLY' ? 'Monthly' : plan.billing_interval);
    setPlanType(plan.included_service_description || plan.description || 'Voice Agent Retainer');
    setPlanGraceDays(plan.grace_period_days.toString());
    setPlanError('');
    setIsPlanModalOpen(true);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Delete this subscription plan template? Active client subscriptions will retain their snapshotted contractual terms.')) {
      db.deletePlan(id);
    }
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    setPlanError('');
    if (!planName.trim()) {
      setPlanError('Please provide a plan name.');
      return;
    }

    const recurringCents = parseDollarsToCents(planRecurringDollars);
    const setupCents = parseDollarsToCents(planSetupDollars);
    const grace = parseInt(planGraceDays, 10) || 7;

    if (editingPlanId) {
      db.updatePlan(editingPlanId, {
        name: planName.trim(),
        description: planType.trim(),
        setup_fee_cents: setupCents,
        recurring_fee_cents: recurringCents,
        grace_period_days: grace,
        included_service_description: planType.trim(),
      });
    } else {
      db.createPlan({
        name: planName.trim(),
        description: planType.trim(),
        setup_fee_cents: setupCents,
        recurring_fee_cents: recurringCents,
        billing_interval: 'MONTHLY',
        grace_period_days: grace,
        included_service_description: planType.trim(),
        notes: null,
        is_active: true,
      });
    }

    setIsPlanModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    db.updateSettings({
      agency_name: agencyName.trim(),
      admin_name: adminName.trim(),
      admin_email: adminEmail.trim(),
      admin_timezone: adminTimezone,
      business_hours_start: hoursStart,
      business_hours_end: hoursEnd,
      default_meeting_duration_minutes: parseInt(duration, 10) || 45,
      meeting_buffer_minutes: parseInt(buffer, 10) || 15,
      pending_hold_duration_hours: parseInt(holdHours, 10) || 48,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearToEmptyProduction = () => {
    if (confirm('Purge all mock and sample data? This will switch to a 100% clean production database with 0 records or pull only live records from Supabase.')) {
      db.purgeAllMockData();
      window.location.reload();
    }
  };

  const handleSyncFromSupabase = async () => {
    setIsVerifyingDb(true);
    setDbNotice(null);
    const res = await db.syncWithSupabase();
    setIsVerifyingDb(false);
    if (res.success) {
      setDbNotice({ type: 'success', message: `Successfully synced with live Supabase! Loaded ${res.count ?? 0} client records.` });
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setDbNotice({ type: 'error', message: res.error || 'Failed to sync with Supabase tables.' });
    }
  };

  const handleVerifyAndSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setDbNotice({ type: 'error', message: 'Both Supabase URL and Anon Public Key are required.' });
      return;
    }

    setIsVerifyingDb(true);
    setDbNotice(null);

    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setIsVerifyingDb(false);

    if (res.success) {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      setDbNotice({ type: 'success', message: 'Successfully connected and verified Supabase backend!' });
    } else {
      setDbNotice({ type: 'error', message: res.message || 'Failed to connect to Supabase.' });
    }
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    setDbNotice({ type: 'success', message: 'Database reset to local enterprise storage ledger.' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">System configuration</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Operational rules, default timezones, calendar parameters, and database lifecycle
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleClearToEmptyProduction}
            className="btn-secondary text-xs px-3.5 py-1.5 text-[#E2604F] hover:text-[#E2604F] flex items-center gap-1.5"
            title="Wipe sample data and switch to clean production slate"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge mock data</span>
          </button>

          <button
            type="button"
            onClick={handleSyncFromSupabase}
            className="btn-secondary text-xs px-3.5 py-1.5 text-[#8B8D93] hover:text-[#EDEAE2] flex items-center gap-1.5"
            title="Pull all live records directly from Supabase tables"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync live Supabase</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl neo-inset text-xs text-[#4CAF7D] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Agency settings successfully saved to database.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Agency Identity */}
        <div className="neo-raised p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-[#EDEAE2]">
            Agency identity & operator
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Agency name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Lead operator name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Operator email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Timezone & Business Hours */}
        <div className="neo-raised p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-[#EDEAE2]">
            Timezone governance & availability
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00C6FF]" />
                <span>Admin timezone (default: Asia/Kolkata)</span>
              </label>
              <select
                value={adminTimezone}
                onChange={(e) => setAdminTimezone(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
              >
                {POPULAR_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Daily business start time</label>
              <input
                type="time"
                value={hoursStart}
                onChange={(e) => setHoursStart(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Daily business end time</label>
              <input
                type="time"
                value={hoursEnd}
                onChange={(e) => setHoursEnd(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
              />
            </div>
          </div>
        </div>

        {/* Appointment Engine Parameters */}
        <div className="neo-raised p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-[#EDEAE2]">
            Appointment slot rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Meeting duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Buffer between meetings (minutes)</label>
              <input
                type="number"
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#EDEAE2]">Pending request hold (hours)</label>
              <input
                type="number"
                value={holdHours}
                onChange={(e) => setHoldHours(e.target.value)}
                className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save configuration</span>
          </button>
        </div>
      </form>

      {/* PART 1: Agency Payment Links (Admin-Only) */}
      <div className="neo-raised p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LinkIcon className="w-5 h-5 text-[#00C6FF]" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Agency payment links
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Manage direct payment destinations (WhatsApp, PayPal, Telegram, etc.) assignable per client
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddLink}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add payment link</span>
          </button>
        </div>

        {paymentLinks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl neo-flat bg-[var(--card-bg)] text-xs text-[var(--text-muted)] space-y-3">
            <p>No payment links configured. Click "Add payment link" to register your agency's WhatsApp, PayPal, or custom link.</p>
            <button
              type="button"
              onClick={handleOpenAddLink}
              className="text-xs text-[#00C6FF] hover:underline font-medium cursor-pointer"
            >
              + Create your first payment link
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {paymentLinks.map((link) => (
              <div
                key={link.id}
                className="p-4 rounded-2xl neo-flat bg-[var(--card-bg)] flex items-start justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl neo-raised flex items-center justify-center shrink-0">
                    <PlatformIcon platform={link.platform} size={18} />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {link.label}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)]">
                        {link.platform}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${link.is_active ? 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] truncate">
                      <span className="truncate font-mono">{link.url}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00C6FF] hover:brightness-125 shrink-0 p-0.5"
                        title="Test link in new tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  {/* Toggle Active Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleLinkActive(link)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      link.is_active
                        ? 'neo-inset text-[#4CAF7D]'
                        : 'neo-raised text-[#8B8D93] hover:text-[#EDEAE2]'
                    }`}
                    title={link.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {link.is_active ? 'Enabled' : 'Disabled'}
                  </button>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleEditLink(link)}
                    className="p-1.5 rounded-lg neo-raised text-[#8B8D93] hover:text-[#EDEAE2] transition-colors"
                    title="Edit link"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(link.id)}
                    className="p-1.5 rounded-lg neo-raised text-[#8B8D93] hover:text-[#E2604F] transition-colors"
                    title="Remove link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SETTINGS / PACKAGES PATTERN — Subscription Plans */}
      <div className="neo-raised p-6 rounded-2xl space-y-5 bg-[var(--surface-2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[var(--accent-blue)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Subscription Plans
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Package tiers for recurring AI phone agent retainers and setup fees
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNewPlan}
            className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Group plans under category headers (e.g. "Voice Agent Plans") */}
        <div className="space-y-4 pt-1">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono pb-2">
              Voice Agent Plans
            </div>

            <div className="space-y-2">
              {plans.map((plan) => {
                const duration = plan.billing_interval ? plan.billing_interval.toLowerCase() : 'monthly';
                const typeText = plan.included_service_description || plan.description || 'Voice Agent Retainer';

                return (
                  <div
                    key={plan.id}
                    className="p-3.5 rounded-xl neo-flat bg-[var(--surface-3)] flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {plan.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        <span className="font-semibold text-[var(--accent-green)] font-mono-numbers">{formatUSD(plan.recurring_fee_cents)}/mo</span> · <span className="capitalize">{duration}</span> · {typeText}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditPlan(plan)}
                        title="Edit plan"
                        className="p-1.5 rounded-lg neo-raised text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id)}
                        title="Delete plan"
                        className="p-1.5 rounded-lg neo-raised text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Add / Edit Modal */}
      {isPlanModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsPlanModalOpen(false)}
        >
          <div 
            className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-md p-6 space-y-5 text-left modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--accent-blue)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {editingPlanId ? 'Edit subscription package' : 'New subscription package'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs p-1"
              >
                Cancel
              </button>
            </div>

            {planError && (
              <div className="p-3 rounded-xl neo-inset text-xs text-[var(--accent-red)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{planError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--text-primary)]">Package Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Growth AI Voice Agent"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3.5 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--text-primary)]">Monthly Retainer ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="499.00"
                    value={planRecurringDollars}
                    onChange={(e) => setPlanRecurringDollars(e.target.value)}
                    className="w-full px-3.5 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[var(--text-primary)]">Setup Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="499.00"
                    value={planSetupDollars}
                    onChange={(e) => setPlanSetupDollars(e.target.value)}
                    className="w-full px-3.5 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[var(--text-primary)]">Service Type / Inclusions</label>
                <input
                  type="text"
                  placeholder="e.g. Inbound Receptionist · Calendar Bookings"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                  className="w-full px-3.5 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)] neo-raised rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 rounded-xl font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingPlanId ? 'Save changes' : 'Create package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Link Add / Edit Modal */}
      {isLinkModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsLinkModalOpen(false)}
        >
          <div 
            className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-md p-6 space-y-5 modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={linkPlatform} size={20} />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {editingLinkId ? 'Edit payment link' : 'Add new payment link'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs p-1"
              >
                Cancel
              </button>
            </div>

            {linkError && (
              <div className="p-3 rounded-xl neo-inset text-xs text-[#E2604F] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            <form onSubmit={handleSavePaymentLink} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#EDEAE2]">Platform *</label>
                <div className="relative">
                  <select
                    value={linkPlatform}
                    onChange={(e) => {
                      const newPlat = e.target.value as PaymentPlatform;
                      setLinkPlatform(newPlat);
                      if (!editingLinkId) {
                        setLinkUrl(getPlaceholderForPlatform(newPlat));
                        setLinkLabel(`${newPlat.charAt(0) + newPlat.slice(1).toLowerCase()} — Primary`);
                      }
                    }}
                    className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  >
                    <option value="WHATSAPP">WhatsApp (Click-to-chat with automated invoice pre-fill)</option>
                    <option value="PAYPAL">PayPal (Direct paypal.me link)</option>
                    <option value="INSTAGRAM">Instagram (Profile / DM redirect)</option>
                    <option value="X">X / Twitter (Profile / DM redirect)</option>
                    <option value="TELEGRAM">Telegram (t.me redirect)</option>
                    <option value="EMAIL">Email (mailto: with invoice details)</option>
                    <option value="CUSTOM">Custom URL / Payment Gateway</option>
                  </select>
                </div>
                {linkPlatform === 'WHATSAPP' && (
                  <p className="text-[11px] text-[#4CAF7D] leading-relaxed">
                    ✨ When client clicks "Pay now" in their portal, WhatsApp opens with their exact invoice number and balance pre-filled!
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#EDEAE2]">Label *</label>
                <input
                  type="text"
                  placeholder="e.g. WhatsApp — Ash, PayPal Agency Main"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#EDEAE2]">Destination URL or handle *</label>
                <input
                  type="text"
                  placeholder={getPlaceholderForPlatform(linkPlatform)}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono text-[11px]"
                  required
                />
                <span className="text-[10px] text-[#8B8D93]">
                  Format example: {getPlaceholderForPlatform(linkPlatform)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="link-is-active"
                  checked={linkIsActive}
                  onChange={(e) => setLinkIsActive(e.target.checked)}
                  className="rounded accent-[#7662FA]"
                />
                <label htmlFor="link-is-active" className="text-xs text-white cursor-pointer">
                  Link is active (visible in onboarding & client assignment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingLinkId ? 'Save changes' : 'Create link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloudflare Hosting & Supabase Database Architecture */}
      <div className="neo-raised p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-[#00C6FF]" />
            <div>
              <h2 className="text-sm font-semibold text-white">
                Cloudflare Hosting & Supabase Backend Connection
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Zero-friction backend connectivity for Cloudflare Pages deployment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full neo-inset text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--success)] animate-pulse' : 'bg-[#00C6FF]'}`} />
            <span className="font-medium text-white">
              {isConnected ? 'Supabase Remote Cluster Active' : 'Local Enterprise Ledger'}
            </span>
          </div>
        </div>

        {/* Cloudflare Integration Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl neo-inset space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <div className="w-5 h-5 rounded-md bg-[#00C6FF]/20 text-[#00C6FF] flex items-center justify-center text-[10px] font-bold">1</div>
              <span>Cloudflare Pages Environment Variables</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              When hosting on Cloudflare Pages, go to <strong>Pages Dashboard &rarr; Settings &rarr; Environment Variables</strong>, then add:
            </p>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-2.5 rounded-lg font-mono text-[11px] text-white space-y-1">
              <div><span className="text-[#00C6FF]">VITE_SUPABASE_URL</span>=https://your-id.supabase.co</div>
              <div><span className="text-[#00C6FF]">VITE_SUPABASE_ANON_KEY</span>=your-anon-public-key</div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Cloudflare Pages automatically injects these during build. Frontend connects with zero setup.
            </p>
          </div>

          <div className="p-4 rounded-xl neo-inset space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <div className="w-5 h-5 rounded-md bg-[var(--success)]/20 text-[var(--success)] flex items-center justify-center text-[10px] font-bold">2</div>
              <span>Frontend Code Config (<code className="text-white">src/config/supabaseConfig.ts</code>)</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Alternatively, open <code className="text-white">src/config/supabaseConfig.ts</code> in your project codebase and write your Supabase URL & Anon Key directly:
            </p>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-2.5 rounded-lg font-mono text-[11px] text-white space-y-1">
              <div><span className="text-[var(--text-muted)]">export const</span> SUPABASE_CONFIG = &#123;</div>
              <div className="pl-4">url: <span className="text-[var(--success)]">'https://your-id.supabase.co'</span>,</div>
              <div className="pl-4">anonKey: <span className="text-[var(--success)]">'your-anon-key'</span></div>
              <div>&#125;;</div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              When you push code to GitHub/Git and deploy to Cloudflare, it connects immediately.
            </p>
          </div>
        </div>

        {/* Live Browser Override & Health Verification Form */}
        <form onSubmit={handleVerifyAndSaveSupabase} className="p-4 rounded-xl neo-flat space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00C6FF]" />
              Active Supabase Credentials (Current Environment)
            </span>
            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnectSupabase}
                className="text-[11px] text-[#E2604F] hover:underline"
              >
                Reset to local ledger
              </button>
            )}
          </div>

          {dbNotice && (
            <div className={`p-3 rounded-xl neo-inset text-xs flex items-center gap-2 ${
              dbNotice.type === 'success' ? 'text-[#4CAF7D]' : 'text-[#E2604F]'
            }`}>
              {dbNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{dbNotice.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-[#8B8D93]">Supabase Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-[#8B8D93]">Supabase Anon Public Key</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isVerifyingDb}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
            >
              {isVerifyingDb ? (
                <span>Verifying connection...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Test & Save Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Production Database Lifecycle & Clean Slate Control */}
      <div className="neo-raised p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-[#00C6FF]" />
            <h2 className="text-sm font-semibold text-white">
              Production Database Lifecycle & Data State
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Active records: <strong className="text-white font-mono-numbers">{clientsCount}</strong> clients · <strong className="text-white font-mono-numbers">{invoicesCount}</strong> invoices · <strong className="text-white font-mono-numbers">{appointmentsCount}</strong> bookings
          </span>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          VectorOps operates with real database schemas and zero mock reliance. You can wipe all initial sample datasets and operate with a 100% clean production store to onboard your actual clients, or restore the baseline verification dataset anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl neo-inset space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="w-4 h-4 text-[#00C6FF]" />
              <span>Clean Slate Production Mode</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Resets client list, invoices, appointments, payments, and messages to empty (0 records). Gives a completely fresh slate to enter your real enterprise accounts.
            </p>
            <button
              type="button"
              onClick={handleClearToEmptyProduction}
              className="btn-secondary text-xs px-4 py-2 text-[var(--danger)] hover:text-[var(--danger)] flex items-center gap-2 w-full justify-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe sample records & start clean</span>
            </button>
          </div>

          <div className="p-4 rounded-xl neo-inset space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EDEAE2]">
              <RotateCcw className="w-4 h-4 text-[#4CAF7D]" />
              <span>Live Supabase Synchronization</span>
            </div>
            <p className="text-[11px] text-[#8B8D93]">
              Pulls live tables directly from your Supabase PostgreSQL cluster (clients, subscriptions, invoices, appointments).
            </p>
            <button
              type="button"
              onClick={handleSyncFromSupabase}
              className="btn-secondary text-xs px-4 py-2 flex items-center gap-2 w-full justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sync from live Supabase</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
