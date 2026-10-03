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
  Calendar as CalendarIcon,
  Video,
  Unlink
} from 'lucide-react';
import { db } from '../../lib/database';
import { POPULAR_TIMEZONES } from '../../lib/timezone';
import { AgencySettings } from '../../types';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { SUPABASE_CONFIG } from '../../config/supabaseConfig';
import {
  isGoogleCalendarConnected,
  getGoogleCalendarUser,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  initCalendarAuth
} from '../../lib/googleCalendar';

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

  // Google Calendar Integration State (Admin-only)
  const [calendarConnected, setCalendarConnected] = useState(isGoogleCalendarConnected());
  const [calendarUser, setCalendarUser] = useState(getGoogleCalendarUser());
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [calendarNotice, setCalendarNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    const unsubscribe = initCalendarAuth((connected, email) => {
      setCalendarConnected(connected);
      if (email) {
        setCalendarUser({ email, displayName: email });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleConnectCalendar = async () => {
    setIsConnectingCalendar(true);
    setCalendarNotice(null);
    const result = await connectGoogleCalendar();
    setIsConnectingCalendar(false);
    if (result.success) {
      setCalendarConnected(true);
      setCalendarUser({ email: result.email || 'operator@vectorops.ai' });
      setCalendarNotice({
        type: 'success',
        message: `Successfully connected Google Calendar (${result.email})! Confirmed appointments will now automatically create calendar events with Google Meet video conferencing.`,
      });
    } else {
      setCalendarNotice({
        type: 'error',
        message: result.error || 'Failed to authenticate Google Calendar. Please check permissions.',
      });
    }
  };

  const handleDisconnectCalendar = async () => {
    if (window.confirm('Disconnect Google Calendar? Future confirmed appointments will require manual meeting links and will not auto-generate Google Meet links.')) {
      await disconnectGoogleCalendar();
      setCalendarConnected(false);
      setCalendarUser(null);
      setCalendarNotice({
        type: 'success',
        message: 'Google Calendar disconnected. Appointments can still be confirmed with manual URLs.',
      });
    }
  };

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
              <label className="font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#E2896A]" />
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

      {/* Google Calendar & Google Meet Integration (Admin-Only) */}
      <div className="neo-raised p-6 rounded-2xl space-y-5 border border-white/[0.04]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#EDEAE2]">
                  Google Calendar & Google Meet Video Conferencing
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-[#8B8D93] mt-0.5">
                Automatically schedule confirmed appointments on your Google Calendar and auto-generate Google Meet links
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full neo-inset text-xs">
            <span className={`w-2 h-2 rounded-full ${calendarConnected ? 'bg-[#4CAF7D] animate-pulse' : 'bg-[#8B8D93]'}`} />
            <span className="font-medium text-[#EDEAE2]">
              {calendarConnected ? 'Calendar Connected' : 'Not Connected (Manual Mode)'}
            </span>
          </div>
        </div>

        {calendarNotice && (
          <div className={`p-3.5 rounded-xl neo-inset text-xs flex items-center gap-2.5 ${
            calendarNotice.type === 'success' ? 'text-[#4CAF7D] border border-[#4CAF7D]/20' : 'text-[#E2604F] border border-[#E2604F]/20'
          }`}>
            {calendarNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#4CAF7D]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E2604F]" />
            )}
            <span>{calendarNotice.message}</span>
          </div>
        )}

        <div className="p-4 rounded-xl neo-inset space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#17181B] border border-white/[0.03] space-y-1">
              <span className="font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#4CAF7D]" />
                Auto-Generate Meet Links
              </span>
              <p className="text-[11px] text-[#8B8D93]">
                When you click "Accept & confirm", Calendar generates a dedicated Google Meet video room automatically.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#17181B] border border-white/[0.03] space-y-1">
              <span className="font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                Direct Calendar Sync
              </span>
              <p className="text-[11px] text-[#8B8D93]">
                The appointment is placed right on your primary Google Calendar, and the client's email is invited as an attendee.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#17181B] border border-white/[0.03] space-y-1">
              <span className="font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E2896A]" />
                Zero Client Google Login
              </span>
              <p className="text-[11px] text-[#8B8D93]">
                Clients never connect Google accounts. They only see the resulting meeting link inside their portal.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.04]">
            {calendarConnected ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4CAF7D]" />
                  <span className="text-xs font-semibold text-[#EDEAE2]">Connected Account:</span>
                  <span className="text-xs text-[#4CAF7D] font-mono">{calendarUser?.email}</span>
                </div>
                <p className="text-[11px] text-[#8B8D93]">
                  All confirmed appointments will automatically sync and generate Meet links. Cancelling an appointment automatically cleans up the calendar event.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#8B8D93]">
                Connect your Google Calendar once. If disconnected, confirming appointments still works with manual meeting links.
              </p>
            )}

            <div className="flex items-center gap-3 shrink-0">
              {calendarConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnectCalendar}
                  className="btn-secondary text-xs px-3.5 py-2 text-[#E2604F] hover:text-[#E2604F] flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect Calendar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectCalendar}
                  disabled={isConnectingCalendar}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-100 text-[#131417] text-xs font-semibold flex items-center gap-2.5 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isConnectingCalendar ? 'Connecting Calendar...' : 'Connect Google Calendar'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cloudflare Hosting & Supabase Database Architecture */}
      <div className="neo-raised p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-[#E2896A]" />
            <div>
              <h2 className="text-sm font-semibold text-[#EDEAE2]">
                Cloudflare Hosting & Supabase Backend Connection
              </h2>
              <p className="text-xs text-[#8B8D93]">
                Zero-friction backend connectivity for Cloudflare Pages deployment
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full neo-inset text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#4CAF7D] animate-pulse' : 'bg-[#E2896A]'}`} />
            <span className="font-medium text-[#EDEAE2]">
              {isConnected ? 'Supabase Remote Cluster Active' : 'Local Enterprise Ledger'}
            </span>
          </div>
        </div>

        {/* Cloudflare Integration Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl neo-inset space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EDEAE2]">
              <div className="w-5 h-5 rounded-md bg-[#E2896A]/20 text-[#E2896A] flex items-center justify-center text-[10px] font-bold">1</div>
              <span>Cloudflare Pages Environment Variables</span>
            </div>
            <p className="text-[11px] text-[#8B8D93] leading-relaxed">
              When hosting on Cloudflare Pages, go to <strong>Pages Dashboard &rarr; Settings &rarr; Environment Variables</strong>, then add:
            </p>
            <div className="bg-[#17181B] p-2.5 rounded-lg font-mono text-[11px] text-[#EDEAE2] space-y-1">
              <div><span className="text-[#E2896A]">VITE_SUPABASE_URL</span>=https://your-id.supabase.co</div>
              <div><span className="text-[#E2896A]">VITE_SUPABASE_ANON_KEY</span>=your-anon-public-key</div>
            </div>
            <p className="text-[10px] text-[#8B8D93]">
              Cloudflare Pages automatically injects these during build. Frontend connects with zero setup.
            </p>
          </div>

          <div className="p-4 rounded-xl neo-inset space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EDEAE2]">
              <div className="w-5 h-5 rounded-md bg-[#4CAF7D]/20 text-[#4CAF7D] flex items-center justify-center text-[10px] font-bold">2</div>
              <span>Frontend Code Config (<code className="text-[#EDEAE2]">src/config/supabaseConfig.ts</code>)</span>
            </div>
            <p className="text-[11px] text-[#8B8D93] leading-relaxed">
              Alternatively, open <code className="text-[#EDEAE2]">src/config/supabaseConfig.ts</code> in your project codebase and write your Supabase URL & Anon Key directly:
            </p>
            <div className="bg-[#17181B] p-2.5 rounded-lg font-mono text-[11px] text-[#EDEAE2] space-y-1">
              <div><span className="text-[#8B8D93]">export const</span> SUPABASE_CONFIG = &#123;</div>
              <div className="pl-4">url: <span className="text-[#4CAF7D]">'https://your-id.supabase.co'</span>,</div>
              <div className="pl-4">anonKey: <span className="text-[#4CAF7D]">'your-anon-key'</span></div>
              <div>&#125;;</div>
            </div>
            <p className="text-[10px] text-[#8B8D93]">
              When you push code to GitHub/Git and deploy to Cloudflare, it connects immediately.
            </p>
          </div>
        </div>

        {/* Live Browser Override & Health Verification Form */}
        <form onSubmit={handleVerifyAndSaveSupabase} className="p-4 rounded-xl neo-flat space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#E2896A]" />
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
            <Server className="w-4 h-4 text-[#E2896A]" />
            <h2 className="text-sm font-semibold text-[#EDEAE2]">
              Production Database Lifecycle & Data State
            </h2>
          </div>
          <span className="text-xs text-[#8B8D93]">
            Active records: <strong className="text-[#EDEAE2] font-mono-numbers">{clientsCount}</strong> clients · <strong className="text-[#EDEAE2] font-mono-numbers">{invoicesCount}</strong> invoices · <strong className="text-[#EDEAE2] font-mono-numbers">{appointmentsCount}</strong> bookings
          </span>
        </div>

        <p className="text-xs text-[#8B8D93] leading-relaxed">
          VectorOps operates with real database schemas and zero mock reliance. You can wipe all initial sample datasets and operate with a 100% clean production store to onboard your actual clients, or restore the baseline verification dataset anytime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl neo-inset space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EDEAE2]">
              <Sparkles className="w-4 h-4 text-[#E2896A]" />
              <span>Clean Slate Production Mode</span>
            </div>
            <p className="text-[11px] text-[#8B8D93]">
              Resets client list, invoices, appointments, payments, and messages to empty (0 records). Gives a completely fresh slate to enter your real enterprise accounts.
            </p>
            <button
              type="button"
              onClick={handleClearToEmptyProduction}
              className="btn-secondary text-xs px-4 py-2 text-[#E2604F] hover:text-[#E2604F] flex items-center gap-2 w-full justify-center"
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
