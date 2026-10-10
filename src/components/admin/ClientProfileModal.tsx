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
  Send,
  Link as LinkIcon,
  Check,
  Edit2
} from 'lucide-react';
import { db } from '../../lib/database';
import { Client, ClientServiceStatus, ServiceStatus, Note, NoteType } from '../../types';
import { formatUSD, formatInTimezone } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';
import { PlatformIcon } from '../common/PlatformIcon';

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
  const [selectedPaymentLinkId, setSelectedPaymentLinkId] = useState<string>(client?.preferred_payment_link_id || '');
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [paymentLinkNotice, setPaymentLinkNotice] = useState(false);

  if (!client) return null;

  const subscriptions = db.getSubscriptions().filter(s => s.client_id === client.id);
  const activeSub = subscriptions.find(s => s.status === 'ACTIVE');
  const invoices = db.getInvoices().filter(i => i.client_id === client.id);
  const appointments = db.getAppointments().filter(a => a.client_id === client.id);
  const messages = db.getMessages(client.id);
  const tasks = db.getTasks().filter(t => t.client_id === client.id);
  const notes = db.getNotes(client.id);
  const onboardingItems = db.getOnboardingItems(client.id);
  const activePaymentLinks = db.getActivePaymentLinks();
  const assignedLink = client.preferred_payment_link_id ? db.getPaymentLink(client.preferred_payment_link_id) : null;

  const handleUpdatePaymentLink = async (newLinkId: string) => {
    setSelectedPaymentLinkId(newLinkId);
    setIsUpdatingLink(true);
    await db.updateClientPaymentLink(client.id, newLinkId || null);
    setIsUpdatingLink(false);
    setPaymentLinkNotice(true);
    setTimeout(() => setPaymentLinkNotice(false), 2500);
  };

  // Client online presence & social links editing
  const [isEditingSocialLinks, setIsEditingSocialLinks] = useState(false);
  const [editWebsite, setEditWebsite] = useState(client.website_url || '');
  const [editInstagram, setEditInstagram] = useState(client.instagram_url || '');
  const [editFacebook, setEditFacebook] = useState(client.facebook_url || '');
  const [editX, setEditX] = useState(client.x_url || '');
  const [editOther, setEditOther] = useState(client.other_social_url || '');
  const [socialSavedNotice, setSocialSavedNotice] = useState(false);
  const [socialError, setSocialError] = useState('');

  const isValidHttpUrl = (str: string) => {
    if (!str.trim()) return true;
    try {
      const u = new URL(str.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSaveSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSocialError('');

    if (editWebsite.trim() && !isValidHttpUrl(editWebsite)) {
      setSocialError('Website must be a valid URL (starting with http:// or https://)');
      return;
    }
    if (editInstagram.trim() && !isValidHttpUrl(editInstagram)) {
      setSocialError('Instagram must be a valid URL (starting with http:// or https://)');
      return;
    }
    if (editFacebook.trim() && !isValidHttpUrl(editFacebook)) {
      setSocialError('Facebook must be a valid URL (starting with http:// or https://)');
      return;
    }
    if (editX.trim() && !isValidHttpUrl(editX)) {
      setSocialError('X / Twitter must be a valid URL (starting with http:// or https://)');
      return;
    }
    if (editOther.trim() && !isValidHttpUrl(editOther)) {
      setSocialError('Other link must be a valid URL (starting with http:// or https://)');
      return;
    }

    await db.updateClientSocialLinks(client.id, {
      website_url: editWebsite,
      instagram_url: editInstagram,
      facebook_url: editFacebook,
      x_url: editX,
      other_social_url: editOther,
    });

    setIsEditingSocialLinks(false);
    setSocialSavedNotice(true);
    setTimeout(() => setSocialSavedNotice(false), 2500);
  };

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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col modal-sheet-enter shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[var(--card-bg)]/80 flex items-center justify-between border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9B51E0]/30 to-[#00C6FF]/30 border border-white/[0.1] flex items-center justify-center font-bold text-lg text-white shadow-md">
              {client.company_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{client.company_name}</h2>
                <StatusBadge status={client.service_status} type="service" />
                <StatusBadge status={db.getClientBillingStatus(client.id)} type="billing" />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Contact: {client.contact_name} · Timezone: {client.timezone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="px-6 py-2.5 bg-white/[0.02] border-b border-[var(--card-border)] flex items-center gap-1.5 overflow-x-auto text-xs">
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
              className={`py-1.5 px-3 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#9B51E0]/20 via-[#7662FA]/15 to-[#00C6FF]/15 text-white font-semibold border border-[#7662FA]/40 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.04]'
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
              <div className="p-4 rounded-xl neo-flat flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#00C6FF]/15 text-[#00C6FF] border border-[#00C6FF]/30">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-muted)]">
                      External voice agent
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Retell AI production workspace
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
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
                    className="btn-primary text-xs px-4 py-2 cursor-pointer inline-flex items-center gap-2 self-start sm:self-auto"
                  >
                    <span>Open Retell workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-[var(--warning)] font-mono-numbers px-2.5 py-1 rounded bg-[var(--warning)]/15 border border-[var(--warning)]/30">
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
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-mono-numbers font-medium transition-colors border cursor-pointer ${
                            client.service_status === st
                              ? 'border-[#00C6FF] bg-[#00C6FF]/15 text-white'
                              : 'border-white/5 bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      VectorOps enforces strict separation: overdue invoices will NEVER automatically suspend voice service without explicit human confirmation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Redirect Setting (Admin-Controlled per Client) */}
              <div className="p-4 rounded-xl neo-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-[#00C6FF]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-numbers">
                      Client Portal Payment Redirect ("Pay now" destination)
                    </h3>
                  </div>
                  {paymentLinkNotice && (
                    <span className="text-[11px] text-[var(--success)] flex items-center gap-1 font-semibold animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Updated</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <select
                      value={selectedPaymentLinkId}
                      disabled={isUpdatingLink}
                      onChange={(e) => handleUpdatePaymentLink(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-white focus:outline-none"
                    >
                      <option value="">No redirect link assigned (Pay now button hidden in portal)</option>
                      {activePaymentLinks.map((link) => (
                        <option key={link.id} value={link.id}>
                          {link.label} ({link.platform}) — {link.url}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignedLink && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neo-flat bg-[var(--card-bg)] text-xs shrink-0">
                      <PlatformIcon platform={assignedLink.platform} size={15} />
                      <span className="text-white font-medium">{assignedLink.label}</span>
                      <a
                        href={assignedLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00C6FF] hover:underline"
                        title="Test link"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                  When a payment link is assigned, the client sees a prominent "Pay now" card in their portal when within 7 days of their renewal. If WhatsApp is selected, their specific invoice number and amount are automatically pre-filled!
                </p>
              </div>

              {/* Client Online Presence & Business Reference Links */}
              <div className="p-4 rounded-xl neo-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#4CAF7D]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B8D93] font-mono-numbers">
                      Client Online Presence & Business Links
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {socialSavedNotice && (
                      <span className="text-[11px] text-[#4CAF7D] flex items-center gap-1 font-semibold animate-in fade-in">
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingSocialLinks(!isEditingSocialLinks)}
                      className="px-2.5 py-1 text-xs text-[#00C6FF] hover:brightness-125 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isEditingSocialLinks ? 'Cancel' : 'Edit links'}</span>
                    </button>
                  </div>
                </div>

                {/* Display clickable buttons with exact same visual treatment as "Open Retell Workspace" */}
                {!isEditingSocialLinks && (
                  <div className="space-y-2">
                    {(!client.website_url && !client.instagram_url && !client.facebook_url && !client.x_url && !client.other_social_url) ? (
                      <div className="p-3 rounded-xl neo-flat bg-[var(--card-bg)] text-xs text-[var(--text-muted)] flex items-center justify-between">
                        <span>No social or website reference links registered for this client.</span>
                        <button
                          type="button"
                          onClick={() => setIsEditingSocialLinks(true)}
                          className="text-[#00C6FF] hover:underline font-medium text-xs cursor-pointer"
                        >
                          + Add links
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        {client.website_url && (
                          <a
                            href={client.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2"
                            title={client.website_url}
                          >
                            <Globe className="w-3.5 h-3.5 text-[#00C6FF]" />
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {client.instagram_url && (
                          <a
                            href={client.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-2"
                            title={client.instagram_url}
                          >
                            <PlatformIcon platform="INSTAGRAM" size={14} className="text-[#E1306C]" />
                            <span>Instagram</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {client.facebook_url && (
                          <a
                            href={client.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#2084ff] rounded-lg transition-colors inline-flex items-center gap-2"
                            title={client.facebook_url}
                          >
                            <PlatformIcon platform="FACEBOOK" size={14} className="text-white" />
                            <span>Facebook</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {client.x_url && (
                          <a
                            href={client.x_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 text-xs font-semibold text-[#EDEAE2] bg-[#24272D] hover:bg-[#2e323a] border border-white/10 rounded-lg transition-colors inline-flex items-center gap-2"
                            title={client.x_url}
                          >
                            <PlatformIcon platform="X" size={14} />
                            <span>X / Twitter</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {client.other_social_url && (
                          <a
                            href={client.other_social_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 text-xs font-semibold text-[#EDEAE2] bg-[#24272D] hover:bg-[#2e323a] border border-white/10 rounded-lg transition-colors inline-flex items-center gap-2"
                            title={client.other_social_url}
                          >
                            <LinkIcon className="w-3.5 h-3.5 text-[#8B8D93]" />
                            <span>Online reference</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    <p className="text-[11px] text-[#8B8D93] leading-relaxed pt-1">
                      Reference records only. Not an OAuth connection or login credential.
                    </p>
                  </div>
                )}

                {/* Inline Editing Form */}
                {isEditingSocialLinks && (
                  <form onSubmit={handleSaveSocialLinks} className="space-y-3 pt-1 animate-in fade-in">
                    {socialError && (
                      <div className="p-2.5 rounded-lg bg-[#E2604F]/10 text-[#E2604F] text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{socialError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[#8B8D93] flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#4CAF7D]" />
                          <span>Website (website_url)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://company.com"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          className="w-full px-3 py-1.5 neo-inset rounded-lg text-[#EDEAE2] focus:outline-none font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#8B8D93] flex items-center gap-1.5">
                          <PlatformIcon platform="INSTAGRAM" size={14} />
                          <span>Instagram (instagram_url)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://instagram.com/company"
                          value={editInstagram}
                          onChange={(e) => setEditInstagram(e.target.value)}
                          className="w-full px-3 py-1.5 neo-inset rounded-lg text-[#EDEAE2] focus:outline-none font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#8B8D93] flex items-center gap-1.5">
                          <PlatformIcon platform="FACEBOOK" size={14} />
                          <span>Facebook (facebook_url)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://facebook.com/company"
                          value={editFacebook}
                          onChange={(e) => setEditFacebook(e.target.value)}
                          className="w-full px-3 py-1.5 neo-inset rounded-lg text-[#EDEAE2] focus:outline-none font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#8B8D93] flex items-center gap-1.5">
                          <PlatformIcon platform="X" size={14} />
                          <span>X / Twitter (x_url)</span>
                        </label>
                        <input
                          type="url"
                          placeholder="https://x.com/company"
                          value={editX}
                          onChange={(e) => setEditX(e.target.value)}
                          className="w-full px-3 py-1.5 neo-inset rounded-lg text-[#EDEAE2] focus:outline-none font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-[#8B8D93] flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-[#8B8D93]" />
                        <span>Other (other_social_url)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/company/..."
                        value={editOther}
                        onChange={(e) => setEditOther(e.target.value)}
                        className="w-full px-3 py-1.5 neo-inset rounded-lg text-[#EDEAE2] focus:outline-none font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingSocialLinks(false)}
                        className="px-3 py-1.5 rounded-lg neo-raised text-xs text-[#8B8D93] hover:text-[#EDEAE2]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary text-xs px-4 py-1.5"
                      >
                        Save links
                      </button>
                    </div>
                  </form>
                )}
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
                    <div className="text-xs text-[#8B8D93] mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Rate: <span className="font-mono-numbers text-[#4CAF7D] font-semibold">{formatUSD(activeSub.recurring_fee_cents)}/mo</span></span>
                      <span>·</span>
                      <span>Next Billing: <span className="font-mono-numbers text-[#EDEAE2]">{activeSub.next_billing_date}</span></span>
                      {(() => {
                        const days = db.days_until_billing(activeSub.id);
                        const isUrgent = days <= 7;
                        return (
                          <span className={`text-[10px] font-mono-numbers font-semibold px-2 py-0.5 rounded-full ${
                            isUrgent ? 'bg-[#E0A94C]/20 text-[#E0A94C]' : 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                          }`}>
                            {days > 0 ? `${days} days left` : days === 0 ? 'Due today' : `${Math.abs(days)} days overdue`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[var(--text-muted)] font-mono-numbers uppercase">Setup Fee (Snapshotted)</div>
                    <div className="text-sm font-semibold font-mono-numbers text-[#00C6FF] mt-0.5">
                      {formatUSD(activeSub.setup_fee_cents)}
                    </div>
                  </div>
                </div>
              )}

              <div className="neo-card rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] text-[var(--text-muted)] border-b border-[var(--card-border)] uppercase tracking-wider text-[10px] font-mono-numbers">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--card-border)]">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">No invoices generated for this client.</td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-mono-numbers font-semibold text-white">{inv.invoice_number}</td>
                          <td className="py-3 px-3 text-[var(--text-muted)]">{inv.invoice_type.replace(/_/g, ' ')}</td>
                          <td className="py-3 px-3 font-mono-numbers text-[var(--text-muted)]">{inv.due_date}</td>
                          <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-white">{formatUSD(inv.total_cents)}</td>
                          <td className="py-3 px-3 text-right font-mono-numbers font-semibold text-[#00C6FF]">{formatUSD(inv.balance_due_cents)}</td>
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-numbers">
                  Client Appointments
                </h3>
              </div>

              <div className="space-y-2.5">
                {appointments.length === 0 ? (
                  <div className="neo-card p-6 text-center text-xs text-[var(--text-muted)] rounded-2xl">
                    No scheduled meetings for this client.
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="neo-card p-4 rounded-2xl flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{apt.topic}</span>
                          <StatusBadge status={apt.status} type="appointment" />
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          UTC: <span className="font-mono-numbers text-white">{formatInTimezone(apt.starts_at, 'UTC', 'datetime')}</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          Client ({apt.client_timezone}): <span className="font-mono-numbers text-[#00C6FF]">{formatInTimezone(apt.starts_at, apt.client_timezone, 'datetime')}</span>
                        </div>
                        {apt.meeting_url && (
                          <div className="pt-1">
                            <a
                              href={apt.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--success)] hover:underline inline-flex items-center gap-1"
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
              <div className="neo-card p-4 rounded-2xl max-h-[300px] overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-[var(--text-muted)] py-8">No messages in thread.</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                        msg.sender_type === 'ADMIN'
                          ? 'ml-auto bg-[#7662FA]/15 border border-[#7662FA]/30 text-white'
                          : 'mr-auto bg-[var(--card-bg)] border border-[var(--card-border)] text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                        <span className="font-semibold text-white">{msg.sender_type === 'ADMIN' ? 'Sovereign Operator' : client.contact_name}</span>
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
                  className="flex-1 px-3 py-2 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none focus:border-[#7662FA]"
                />
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5"
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono-numbers">
                10-Step Onboarding Architecture Checklist
              </h3>
              <div className="space-y-2">
                {onboardingItems.map((step) => (
                  <div
                    key={step.id}
                    className="p-3 rounded-xl neo-card flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-numbers text-xs font-bold text-[#00C6FF] w-6">
                        {step.step_order.toString().padStart(2, '0')}.
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">{step.title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={step.status} type="onboarding" />
                      {step.status !== 'COMPLETE' && (
                        <button
                          onClick={() => db.updateOnboardingItemStatus(step.id, 'COMPLETE')}
                          className="px-2.5 py-1 text-[11px] font-medium text-[var(--success)] bg-[var(--success)]/10 hover:bg-[var(--success)]/20 rounded-lg border border-[var(--success)]/30 transition-colors cursor-pointer"
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
              <div className="p-3 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-xs text-[var(--warning)]">
                Admin-Only Internal Workspace: These notes are never visible to the client portal or exposed through client RLS policies.
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5 neo-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Append Internal Audit Note</span>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as any)}
                    className="px-2 py-1 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white"
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
                  className="w-full px-3 py-2 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none focus:border-[#7662FA]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary text-xs px-4 py-1.5 cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              {/* Existing notes */}
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl neo-card space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="font-semibold text-[#00C6FF] uppercase font-mono-numbers">
                        [{n.note_type}] By {n.author_name || 'Admin'}
                      </span>
                      <span className="font-mono-numbers">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--card-border)] bg-[var(--card-bg)]/80 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Client ID: <code className="text-[#00C6FF] font-mono">{client.id}</code></span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-4 py-1.5 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
