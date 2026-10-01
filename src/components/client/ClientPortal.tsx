import React, { useState } from 'react';
import { 
  Building2, 
  Bot, 
  Calendar, 
  Clock, 
  CreditCard, 
  MessageSquare, 
  ExternalLink, 
  Plus, 
  Send, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  ArrowRight,
  LogOut,
  Video
} from 'lucide-react';
import { db } from '../../lib/database';
import { Client, Invoice, Appointment, Message, AuthUser } from '../../types';
import { formatUSD, formatInTimezone } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

interface ClientPortalProps {
  currentUser?: AuthUser | null;
  onLogout: () => void;
  onBackToLanding: () => void;
  onSwitchToAdmin: () => void;
  onOpenSupabaseModal?: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  currentUser,
  onLogout,
  onBackToLanding,
  onSwitchToAdmin,
}) => {
  const clients = db.getClients();
  // Match current user client if available
  const matchedUserClient = currentUser?.client_id 
    ? clients.find(c => c.id === currentUser.client_id)
    : clients.find(c => c.email.toLowerCase() === currentUser?.email?.toLowerCase());

  const [activeClientId, setActiveClientId] = useState<string>(
    matchedUserClient?.id || clients[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'dashboard' | 'billing' | 'appointments' | 'messages'>('dashboard');

  // Appointment Request modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [topic, setTopic] = useState('Voice Agent Latency Tuning & Script Review');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:30');
  const [bookReason, setBookReason] = useState('');
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Wire submission modal
  const [isWireModalOpen, setIsWireModalOpen] = useState(false);
  const [wireRef, setWireRef] = useState('');
  const [wireInvoiceId, setWireInvoiceId] = useState('');
  const [wireNotice, setWireNotice] = useState<string | null>(null);

  // Message composer
  const [clientMessageText, setClientMessageText] = useState('');

  const client = clients.find(c => c.id === activeClientId) || clients[0];
  const subscriptions = db.getSubscriptions().filter(s => s.client_id === client?.id);
  const activeSub = subscriptions.find(s => s.status === 'ACTIVE');
  const invoices = db.getInvoices().filter(i => i.client_id === client?.id);
  const appointments = db.getAppointments().filter(a => a.client_id === client?.id);
  const messages = db.getMessages(client?.id);

  // Next upcoming confirmed or requested appointment
  const upcomingAppointment = appointments.find(
    a => (a.status === 'CONFIRMED' || a.status === 'REQUESTED' || a.status === 'PROPOSED') && 
         new Date(a.starts_at) > new Date()
  );

  const outstandingBalanceCents = invoices
    .filter(i => i.status !== 'PAID' && i.status !== 'VOID')
    .reduce((sum, i) => sum + i.balance_due_cents, 0);

  const handleRequestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !client) return;
    setBookingError(null);

    // Build ISO timestamp from client's chosen local time
    const startIso = new Date(`${bookDate}T${bookTime}:00Z`).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 45 * 60 * 1000).toISOString();

    const result = await db.request_appointment(
      client.id,
      startIso,
      endIso,
      client.timezone,
      'Asia/Kolkata',
      topic || bookReason || 'Client Strategic Review'
    );

    if (!result.success) {
      setBookingError(result.error || 'Requested slot is unavailable.');
      return;
    }

    setIsBookModalOpen(false);
    setBookingNotice('Appointment request transmitted! VectorOps will review and confirm your slot.');
    setTimeout(() => setBookingNotice(null), 4000);
  };

  const handleSendClientMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientMessageText.trim() || !client) return;

    db.sendMessage({
      client_id: client.id,
      sender_type: 'CLIENT',
      sender_name: client.contact_name,
      body: clientMessageText.trim(),
    });

    setClientMessageText('');
  };

  const handleSubmitWireRef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wireRef.trim() || !client) return;

    // Send as message to admin to review
    db.sendMessage({
      client_id: client.id,
      sender_type: 'CLIENT',
      sender_name: client.contact_name,
      body: `Submitted wire payment reference: ${wireRef.trim()} for invoice review.`,
    });

    setIsWireModalOpen(false);
    setWireNotice(`Payment reference ${wireRef} submitted to VectorOps operators.`);
    setTimeout(() => setWireNotice(null), 4000);
    setWireRef('');
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-[#17181B] text-[#EDEAE2] flex items-center justify-center p-6">
        <div className="max-w-md w-full neo-focal rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E2896A]/20 text-[#E2896A] mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-[#EDEAE2]">No Client Account Active</h2>
          <p className="text-xs text-[#8B8D93] leading-relaxed">
            There are currently no registered client profiles in the operational database. Use the Admin Console to onboard a client or register a client credentials profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={onSwitchToAdmin} className="btn-primary text-xs px-4 py-2.5 flex-1">
              Open Admin Console
            </button>
            <button onClick={onLogout} className="btn-secondary text-xs px-4 py-2.5 flex-1">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#17181B] text-[#EDEAE2] flex flex-col">
      {/* Top Bar for Client Portal — Surface #1D1F23, Raised, Zero Border */}
      <header className="bg-[#1D1F23] neo-raised sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E2896A] text-[#17181B] font-semibold text-xs flex items-center justify-center">
              VO
            </div>
            <span className="text-sm font-semibold text-[#EDEAE2]">VectorOps</span>
            <span className="text-xs text-[#8B8D93] pl-2 hidden sm:inline-block">
              Client portal
            </span>
          </div>

          {/* Switcher & Role Toggles */}
          <div className="flex items-center gap-3">
            {/* If Admin, show Client Switcher dropdown. If Client, show Company Name pill */}
            {currentUser?.role === 'ADMIN' ? (
              <div className="flex items-center gap-1.5 text-xs text-[#8B8D93]">
                <span className="hidden sm:inline">Preview client:</span>
                <select
                  value={activeClientId}
                  onChange={(e) => setActiveClientId(e.target.value)}
                  className="px-3 py-1.5 text-xs neo-inset rounded-xl text-[#EDEAE2] bg-[#1D1F23] focus:outline-none"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl neo-inset text-xs">
                <span className="w-2 h-2 rounded-full bg-[#4CAF7D]" />
                <span className="text-[#EDEAE2] font-medium">{client.company_name}</span>
                <span className="text-[#8B8D93]">({client.contact_name})</span>
              </div>
            )}

            <button
              onClick={onSwitchToAdmin}
              className="btn-secondary text-xs px-3.5 py-1.5"
            >
              Admin console
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl neo-raised text-xs text-[#8B8D93] hover:text-[#E2604F] transition-colors flex items-center gap-1.5"
              title="Sign out of client portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pb-2 text-xs">
          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'billing', label: `Billing & invoices (${invoices.length})` },
            { id: 'appointments', label: `Appointments (${appointments.length})` },
            { id: 'messages', label: `Messages (${messages.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs transition-all ${
                activeTab === tab.id
                  ? 'neo-inset text-[#EDEAE2] font-semibold'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {bookingNotice && (
          <div className="p-3.5 rounded-xl neo-inset text-xs text-[#4CAF7D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bookingNotice}</span>
          </div>
        )}

        {wireNotice && (
          <div className="p-3.5 rounded-xl neo-inset text-xs text-[#E2896A] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{wireNotice}</span>
          </div>
        )}

        {/* TAB 1: CLIENT DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Welcome banner */}
            <div className="p-6 rounded-2xl neo-raised flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs text-[#8B8D93]">
                  <span>Account overview</span>
                  <span>·</span>
                  <span className="text-[#4CAF7D] font-semibold">Production active</span>
                </div>
                <h1 className="text-2xl font-semibold text-[#EDEAE2]">
                  Welcome, {client.company_name}
                </h1>
                <p className="text-xs text-[#8B8D93] max-w-xl leading-relaxed">
                  Your dedicated voice-agent infrastructure is online and handling callers. Access your Retell workspace, manage appointments, or review invoices below.
                </p>
              </div>

              {/* Retell Direct Workspace Button */}
              {client.retell_workspace_url ? (
                <a
                  href={client.retell_workspace_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-xl transition-colors flex items-center gap-2 self-start md:self-auto shrink-0"
                >
                  <Bot className="w-4 h-4" />
                  <span>Open Retell workspace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div className="px-4 py-2.5 rounded-xl neo-inset text-xs text-[#E0A94C]">
                  Retell setup in progress with your account engineer.
                </div>
              )}
            </div>

            {/* Service & Billing Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="neo-raised p-4 rounded-xl space-y-1">
                <div className="text-xs text-[#8B8D93]">Voice service</div>
                <div className="text-base font-semibold text-[#EDEAE2]">AI Voice Agent</div>
                <div className="text-xs text-[#4CAF7D]">
                  Status: {client.service_status.toLowerCase()}
                </div>
              </div>

              <div className="neo-raised p-4 rounded-xl space-y-1">
                <div className="text-xs text-[#8B8D93]">Contracted plan</div>
                <div className="text-base font-semibold text-[#EDEAE2]">
                  {activeSub?.service_name || 'Active retainer'}
                </div>
                <div className="text-xs text-[#8B8D93] font-mono-numbers">
                  {activeSub ? `${formatUSD(activeSub.recurring_fee_cents)} / mo` : '—'}
                </div>
              </div>

              <div className="neo-raised p-4 rounded-xl space-y-1">
                <div className="text-xs text-[#8B8D93]">Next billing date</div>
                <div className="text-base font-semibold font-mono-numbers text-[#EDEAE2]">
                  {activeSub?.next_billing_date || 'Oct 15, 2026'}
                </div>
                <div className="text-[11px] text-[#8B8D93]">Automatic invoice generation</div>
              </div>

              <div className="neo-raised p-4 rounded-xl space-y-1">
                <div className="text-xs text-[#8B8D93]">Outstanding balance</div>
                <div className={`text-base font-semibold font-mono-numbers ${outstandingBalanceCents > 0 ? 'text-[#E2896A]' : 'text-[#4CAF7D]'}`}>
                  {formatUSD(outstandingBalanceCents)}
                </div>
                <div className="text-[11px] text-[#8B8D93]">
                  {outstandingBalanceCents === 0 ? 'Account settled' : 'Payment due'}
                </div>
              </div>
            </div>

            {/* Upcoming Appointment Spotlight */}
            <div className="neo-raised p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#E2896A]" />
                  <span className="text-xs font-semibold text-[#EDEAE2]">
                    Upcoming appointment
                  </span>
                </div>

                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setBookDate(tomorrow.toISOString().split('T')[0]);
                    setIsBookModalOpen(true);
                  }}
                  className="px-3 py-1 text-xs font-normal text-[#E2896A] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request appointment</span>
                </button>
              </div>

              {upcomingAppointment ? (
                <div className="p-4 rounded-xl neo-flat bg-[#1D1F23] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#EDEAE2]">{upcomingAppointment.topic}</span>
                      <StatusBadge status={upcomingAppointment.status} type="appointment" />
                    </div>
                    <div className="text-xs text-[#8B8D93]">
                      Time in your local timezone ({client.timezone}):{' '}
                      <span className="text-[#E2896A] font-mono-numbers font-semibold">
                        {formatInTimezone(upcomingAppointment.starts_at, client.timezone, 'datetime')}
                      </span>
                    </div>
                  </div>

                  {upcomingAppointment.meeting_url && upcomingAppointment.status === 'CONFIRMED' && (
                    <a
                      href={upcomingAppointment.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#4CAF7D] hover:bg-[#52BD86] rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join meeting</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#8B8D93] neo-flat bg-[#1D1F23] rounded-xl">
                  No upcoming appointments scheduled. Need an architectural review or voice prompt update?
                </div>
              )}
            </div>

            {/* Action Quick Launchers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('appointments')}
                className="p-4 rounded-xl neo-flat bg-[#1D1F23] hover:bg-[#23262B] text-left transition-colors"
              >
                <Calendar className="w-5 h-5 text-[#E2896A] mb-2" />
                <div className="font-semibold text-xs text-[#EDEAE2]">Book appointment</div>
                <div className="text-xs text-[#8B8D93] mt-0.5">Schedule a strategy meeting with VectorOps operators</div>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className="p-4 rounded-xl neo-flat bg-[#1D1F23] hover:bg-[#23262B] text-left transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-[#4CAF7D] mb-2" />
                <div className="font-semibold text-xs text-[#EDEAE2]">Message VectorOps</div>
                <div className="text-xs text-[#8B8D93] mt-0.5">Direct encrypted communication with your agency team</div>
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className="p-4 rounded-xl neo-flat bg-[#1D1F23] hover:bg-[#23262B] text-left transition-colors"
              >
                <CreditCard className="w-5 h-5 text-[#E0A94C] mb-2" />
                <div className="font-semibold text-xs text-[#EDEAE2]">View invoices & billing</div>
                <div className="text-xs text-[#8B8D93] mt-0.5">Review invoices and submit external wire references</div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#EDEAE2]">Contract billing & invoices</h2>
                <p className="text-xs text-[#8B8D93]">Review settled fees and record external wire or ACH references</p>
              </div>

              {outstandingBalanceCents > 0 && (
                <button
                  onClick={() => setIsWireModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors"
                >
                  Submit payment reference
                </button>
              )}
            </div>

            {/* Invoices List — Flat, no shadow */}
            <div className="neo-flat bg-[#1D1F23] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#17181B] text-[#8B8D93] border-b border-white/5 font-normal">
                  <tr>
                    <th className="py-3 px-4 font-normal">Invoice #</th>
                    <th className="py-3 px-4 font-normal">Service period</th>
                    <th className="py-3 px-4 font-normal">Due date</th>
                    <th className="py-3 px-4 font-normal text-right">Amount (USD)</th>
                    <th className="py-3 px-4 font-normal text-right">Balance due</th>
                    <th className="py-3 px-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8B8D93]">
                        No invoices generated yet for this account.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 px-4 font-mono-numbers font-semibold text-[#EDEAE2]">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4 text-[#8B8D93]">
                          {inv.invoice_type === 'SETUP' ? 'Onboarding architecture' : `${inv.service_period_start || inv.issue_date} monthly cycle`}
                        </td>
                        <td className="py-3.5 px-4 font-mono-numbers text-[#8B8D93]">
                          {inv.due_date}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold text-[#EDEAE2]">
                          {formatUSD(inv.total_cents)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold text-[#E2896A]">
                          {formatUSD(inv.balance_due_cents)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} type="invoice" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl neo-flat bg-[#1D1F23] text-xs text-[#8B8D93] space-y-1">
              <span className="font-semibold text-[#EDEAE2]">Payment processing notice:</span>
              <p>
                VectorOps processes payments through direct bank ACH, wire transfer, and Wise. Upon executing your wire, submit the settlement reference number above. The invoice balance will be marked settled once verified by agency accounts.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#EDEAE2]">Agency appointments</h2>
                <p className="text-xs text-[#8B8D93]">Times automatically converted to your local timezone ({client.timezone})</p>
              </div>

              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setBookDate(tomorrow.toISOString().split('T')[0]);
                  setIsBookModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Request appointment</span>
              </button>
            </div>

            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="neo-flat bg-[#1D1F23] p-10 text-center rounded-xl text-xs text-[#8B8D93]">
                  No appointment records found for your organization.
                </div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="neo-flat bg-[#1D1F23] p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#EDEAE2]">{apt.topic}</span>
                        <StatusBadge status={apt.status} type="appointment" />
                      </div>
                      <div className="text-xs text-[#8B8D93]">
                        Scheduled:{' '}
                        <span className="text-[#E2896A] font-mono-numbers font-semibold">
                          {formatInTimezone(apt.starts_at, client.timezone, 'datetime')}
                        </span>{' '}
                        ({client.timezone})
                      </div>
                      {apt.cancellation_reason && (
                        <p className="text-xs text-[#E2604F] pt-0.5">{apt.cancellation_reason}</p>
                      )}
                    </div>

                    {apt.meeting_url && apt.status === 'CONFIRMED' && (
                      <a
                        href={apt.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#4CAF7D] hover:bg-[#52BD86] rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join {apt.meeting_provider ? apt.meeting_provider.replace(/_/g, ' ').toLowerCase() : 'meeting'}</span>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CLIENT MESSAGING */}
        {activeTab === 'messages' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl font-semibold text-[#EDEAE2]">Secure communication channel</h2>
              <p className="text-xs text-[#8B8D93]">Direct encrypted messaging with your account lead</p>
            </div>

            <div className="neo-raised rounded-2xl overflow-hidden flex flex-col min-h-[460px]">
              <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[360px]">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-[#8B8D93] py-12">
                    No messages yet in this channel. Send your question or request below.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isClient = m.sender_type === 'CLIENT';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col max-w-[80%] ${isClient ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="text-[11px] text-[#8B8D93] font-mono-numbers mb-1">
                          {isClient ? client.contact_name : 'Operator'} · {formatInTimezone(m.created_at, client.timezone, 'time')}
                        </div>
                        <div
                          className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                            isClient
                              ? 'bg-[#E2896A]/20 text-[#EDEAE2]'
                              : 'bg-[#17181B] text-[#EDEAE2]'
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendClientMessage} className="p-4 bg-[#17181B] flex gap-2">
                <input
                  type="text"
                  placeholder="Message engineering team..."
                  value={clientMessageText}
                  onChange={(e) => setClientMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!clientMessageText.trim()}
                  className="px-5 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">Request strategy meeting</h2>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1 text-[#8B8D93] hover:text-[#EDEAE2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestBooking} className="p-6 space-y-4 text-xs">
              {bookingError && (
                <div className="p-3 rounded-lg neo-inset text-[#E2604F]">
                  {bookingError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Meeting topic *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Date *</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Time ({client.timezone}) *</label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Agenda / notes</label>
                <textarea
                  rows={2}
                  placeholder="What would you like to review or tune in your voice agent?"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 font-normal text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors"
                >
                  Transmit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wire Reference Modal */}
      {isWireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">Submit payment reference</h2>
              <button onClick={() => setIsWireModalOpen(false)} className="p-1 text-[#8B8D93] hover:text-[#EDEAE2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWireRef} className="p-6 space-y-4 text-xs">
              <p className="text-[#8B8D93] leading-relaxed">
                Provide your bank ACH or wire reference code. The invoice balance will be marked settled once verified by agency accounts.
              </p>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Settlement reference code *</label>
                <input
                  type="text"
                  placeholder="e.g. FED-WIRE-99214, WISE-TRX-88102"
                  value={wireRef}
                  onChange={(e) => setWireRef(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsWireModalOpen(false)}
                  className="px-4 py-2 font-normal text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!wireRef.trim()}
                  className="px-4 py-2 font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors disabled:opacity-50"
                >
                  Submit reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
