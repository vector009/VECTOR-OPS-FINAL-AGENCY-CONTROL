import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Receipt, 
  Bot, 
  ExternalLink, 
  MessageSquare, 
  CheckSquare, 
  FileText, 
  ShieldCheck, 
  Plus, 
  AlertCircle,
  Archive,
  Send
} from 'lucide-react';
import { db } from '../../lib/database';
import { Client, ClientServiceStatus, ServiceStatus, Note, NoteType } from '../../types';
import { formatUSD, formatInTimezone } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

interface ClientProfileModalProps {
  client: Client | null;
  onClose: () => void;
  onOpenMessageThread?: (clientId: string) => void;
  onOpenAppointmentBooking?: (clientId: string) => void;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  client,
  onClose,
  onOpenMessageThread,
  onOpenAppointmentBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'appointments' | 'messages' | 'tasks' | 'notes' | 'onboarding'>('overview');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<NoteType>('GENERAL');
  const [newMessageText, setNewMessageText] = useState('');

  if (!client) return null;

  const subscriptions = db.getSubscriptions().filter(s => s.client_id === client.id);
  const activeSub = subscriptions.find(s => s.status === 'ACTIVE');
  const invoices = db.getInvoices().filter(i => i.client_id === client.id);
  const appointments = db.getAppointments().filter(a => a.client_id === client.id);
  const messages = db.getMessages(client.id);
  const tasks = db.getTasks().filter(t => t.client_id === client.id);
  const notes = db.getNotes(client.id);
  const onboardingItems = db.getOnboardingItems(client.id);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    db.addNote(client.id, newNoteCategory, newNoteContent.trim(), 'Sovereign Operator');
    setNewNoteContent('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    db.sendMessage({
      client_id: client.id,
      sender_type: 'ADMIN',
      sender_name: 'Sovereign Operator',
      body: newMessageText.trim(),
    });
    setNewMessageText('');
  };

  const handleToggleServiceStatus = (newStatus: ClientServiceStatus) => {
    client.service_status = newStatus;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#24272D] flex items-center justify-center font-semibold text-lg text-[#E2896A]">
              {client.company_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#EDEAE2]">{client.company_name}</h2>
                <StatusBadge status={client.service_status} type="service" />
                <StatusBadge status={db.getClientBillingStatus(client.id)} type="billing" />
              </div>
              <p className="text-xs text-[#8B8D93]">
                Contact: {client.contact_name} · Timezone: {client.timezone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8D93] hover:text-[#EDEAE2] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="px-6 bg-[#17181B] flex items-center gap-1 overflow-x-auto text-xs pb-2">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'billing', label: `Billing (${invoices.length})` },
            { id: 'appointments', label: `Appointments (${appointments.length})` },
            { id: 'messages', label: `Messages (${messages.length})` },
            { id: 'tasks', label: `Tasks (${tasks.length})` },
            { id: 'onboarding', label: `Onboarding (${onboardingItems.filter(s => s.status === 'COMPLETE').length}/${onboardingItems.length})` },
            { id: 'notes', label: `Notes (${notes.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 rounded-lg text-xs transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'neo-inset text-[#EDEAE2] font-semibold'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Retell Workspace Card */}
              <div className="p-4 rounded-xl neo-flat bg-[#1D1F23] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#E2896A]/10 text-[#E2896A]">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[#8B8D93]">
                      External voice agent
                    </div>
                    <div className="text-sm font-semibold text-[#EDEAE2] mt-0.5">
                      Retell AI production workspace
                    </div>
                    <p className="text-xs text-[#8B8D93] mt-0.5">
                      {client.retell_workspace_url 
                        ? `Workspace ID: ${client.retell_workspace_id || 'Configured'}` 
                        : 'No Retell workspace URL attached. Agent calls cannot route until configured.'}
                    </p>
                  </div>
                </div>

                {client.retell_workspace_url ? (
                  <a
                    href={client.retell_workspace_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
                  >
                    <span>Open Retell workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-[#E0A94C] font-mono-numbers px-2.5 py-1 rounded bg-[#E0A94C]/10">
                    Configuration required
                  </span>
                )}
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl neo-card space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] font-mono-numbers">
                    Contact & Telemetry
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-[#8B8D93] flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                      <span className="text-[#EDEAE2] font-mono">{client.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-[#8B8D93] flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                      <span className="text-[#EDEAE2] font-mono-numbers">{client.phone}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-[#8B8D93] flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Timezone</span>
                      <span className="text-[#EDEAE2] font-mono-numbers">{client.timezone}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#8B8D93] flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</span>
                      <span className="text-[#EDEAE2] truncate max-w-[200px]">{client.address || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl neo-card space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] font-mono-numbers">
                    Service Governance & Actions
                  </h3>
                  <div className="space-y-2.5">
                    <div className="text-xs text-[#8B8D93]">
                      Explicit Admin Service Status Toggle (Section 6, 13):
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['ACTIVE', 'PAYMENT_DUE', 'SUSPENDED'] as ServiceStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleToggleServiceStatus(st)}
                          className={`px-2 py-1.5 rounded text-[11px] font-mono-numbers font-medium transition-colors border ${
                            client.service_status === st
                              ? 'border-[#E2896A] bg-[#E2896A]/20 text-[#EDEAE2]'
                              : 'border-white/5 bg-[#17181B] text-[#8B8D93] hover:text-[#EDEAE2]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                      VectorOps enforces strict separation: overdue invoices will NEVER automatically suspend voice service without explicit human confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BILLING & INVOICES */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              {activeSub && (
                <div className="p-4 rounded-xl neo-card border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#8B8D93] font-mono-numbers uppercase">Active Subscription</div>
                    <div className="text-base font-bold text-[#EDEAE2] mt-0.5">{activeSub.service_name}</div>
                    <div className="text-xs text-[#8B8D93] mt-0.5">
                      Rate: <span className="font-mono-numbers text-[#4CAF7D] font-semibold">{formatUSD(activeSub.recurring_fee_cents)}/mo</span> · Next Billing: <span className="font-mono-numbers text-[#EDEAE2]">{activeSub.next_billing_date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#8B8D93] font-mono-numbers uppercase">Setup Fee (Snapshotted)</div>
                    <div className="text-sm font-semibold font-mono-numbers text-[#E2896A] mt-0.5">
                      {formatUSD(activeSub.setup_fee_cents)}
                    </div>
                  </div>
                </div>
              )}

              <div className="neo-card rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#17181B] text-[#8B8D93] border-b border-white/5 uppercase tracking-wider text-[10px] font-mono-numbers">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[#8B8D93]">No invoices generated for this client.</td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-mono-numbers font-semibold text-[#EDEAE2]">{inv.invoice_number}</td>
                          <td className="py-3 px-3 text-[#8B8D93]">{inv.invoice_type.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-3 font-mono-numbers text-[#8B8D93]">{inv.due_date}</td>
                          <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-[#EDEAE2]">{formatUSD(inv.total_cents)}</td>
                          <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-[#E2896A]">{formatUSD(inv.balance_due_cents)}</td>
                          <td className="py-3 px-3"><StatusBadge status={inv.status} type="invoice" /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] font-mono-numbers">
                  Client Appointments
                </h3>
              </div>

              <div className="space-y-2.5">
                {appointments.length === 0 ? (
                  <div className="neo-card p-6 text-center text-xs text-[#8B8D93] rounded-xl">
                    No scheduled meetings for this client.
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="neo-card p-4 rounded-xl flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#EDEAE2]">{apt.topic}</span>
                          <StatusBadge status={apt.status} type="appointment" />
                        </div>
                        <div className="text-xs text-[#8B8D93]">
                          UTC: <span className="font-mono-numbers text-[#EDEAE2]">{formatInTimezone(apt.starts_at, 'UTC', 'datetime')}</span>
                        </div>
                        <div className="text-xs text-[#8B8D93]">
                          Client ({apt.client_timezone}): <span className="font-mono-numbers text-[#E2896A]">{formatInTimezone(apt.starts_at, apt.client_timezone, 'datetime')}</span>
                        </div>
                        {apt.meeting_url && (
                          <div className="pt-1">
                            <a
                              href={apt.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#4CAF7D] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Join {apt.meeting_provider || 'Meeting'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="neo-card p-4 rounded-xl max-h-[300px] overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-[#8B8D93] py-8">No messages in thread.</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                        msg.sender_type === 'ADMIN'
                          ? 'ml-auto bg-[#E2896A]/15 border border-[#E2896A]/30 text-[#EDEAE2]'
                          : 'mr-auto bg-[#17181B] border border-white/5 text-[#EDEAE2]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8B8D93] mb-1">
                        <span className="font-semibold text-[#EDEAE2]">{msg.sender_type === 'ADMIN' ? 'Sovereign Operator' : client.contact_name}</span>
                        <span className="font-mono-numbers">{formatInTimezone(msg.created_at, client.timezone, 'time')}</span>
                      </div>
                      <p>{msg.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Reply Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type secure client reply..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-[#17181B] border border-white/10 rounded-lg text-[#EDEAE2] focus:outline-none focus:border-[#E2896A]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: ONBOARDING CHECKLIST (Section 8, 12) */}
          {activeTab === 'onboarding' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] font-mono-numbers">
                10-Step Onboarding Architecture Checklist
              </h3>
              <div className="space-y-2">
                {onboardingItems.map((step) => (
                  <div
                    key={step.id}
                    className="p-3 rounded-xl neo-card flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-numbers text-xs font-bold text-[#E2896A] w-6">
                        {step.step_order.toString().padStart(2, '0')}.
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-[#EDEAE2]">{step.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={step.status} type="onboarding" />
                      {step.status !== 'COMPLETE' && (
                        <button
                          onClick={() => db.updateOnboardingItemStatus(step.id, 'COMPLETE')}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#4CAF7D] bg-[#4CAF7D]/10 hover:bg-[#4CAF7D]/20 rounded border border-[#4CAF7D]/30 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INTERNAL ADMIN NOTES (Section 35) */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#E0A94C]/10 border border-[#E0A94C]/20 text-xs text-[#E0A94C]">
                Admin-Only Internal Workspace: These notes are never visible to the client portal or exposed through client RLS policies.
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5 neo-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#EDEAE2]">Append Internal Audit Note</span>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as any)}
                    className="px-2 py-1 text-xs bg-[#17181B] border border-white/10 rounded text-[#EDEAE2]"
                  >
                    <option value="GENERAL">General</option>
                    <option value="BILLING">Billing</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="SERVICE">Service & Retell</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  placeholder="Record internal operational context, telephone carrier notes, or billing exceptions..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#17181B] border border-white/10 rounded-lg text-[#EDEAE2] focus:outline-none focus:border-[#E2896A]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-md transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              {/* Existing notes */}
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl neo-card space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#8B8D93]">
                      <span className="font-semibold text-[#E2896A] uppercase font-mono-numbers">
                        [{n.note_type}] By {n.author_name || 'Admin'}
                      </span>
                      <span className="font-mono-numbers">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-[#EDEAE2] leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#17181B] flex items-center justify-between text-xs text-[#8B8D93]">
          <span>Client ID: <code className="text-[#EDEAE2] font-mono">{client.id}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#EDEAE2] bg-[#24272D] hover:bg-[#2C3038] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
