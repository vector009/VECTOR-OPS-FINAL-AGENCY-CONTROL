import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  MessageCircle, 
  Edit3, 
  ExternalLink,
  Bot
} from 'lucide-react';
import { db } from '../../lib/database';
import { Client, Subscription } from '../../types';
import { formatUSD } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';
import { PlatformIcon } from '../common/PlatformIcon';

interface ClientManagementProps {
  onSelectClient: (client: Client) => void;
  onOpenOnboarding: () => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  onSelectClient,
  onOpenOnboarding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPill, setFilterPill] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'ARCHIVED'>('ALL');
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  const allClients = db.getAllClientsIncludingArchived();
  const subscriptions = db.getSubscriptions();
  const payments = db.getPayments();
  const paymentLinks = db.getPaymentLinks();

  // Filter clients based on search and selected pill
  const filteredClients = allClients.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      c.company_name.toLowerCase().includes(term) ||
      c.contact_name.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      c.email.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterPill === 'ACTIVE') {
      return !c.archived_at && c.service_status === 'ACTIVE';
    }
    if (filterPill === 'TRIAL') {
      return !c.archived_at && (c.service_status === 'ONBOARDING' || c.service_status === 'PROSPECT');
    }
    if (filterPill === 'ARCHIVED') {
      return !!c.archived_at;
    }
    // 'ALL' shows all non-archived clients unless searched
    return !c.archived_at || term.length > 0;
  });

  const getClientActiveSub = (clientId: string): Subscription | undefined => {
    return subscriptions.find(s => s.client_id === clientId && s.status === 'ACTIVE');
  };

  const getClientTotalPaid = (clientId: string): number => {
    return payments
      .filter(p => p.client_id === clientId && !p.is_reversed)
      .reduce((sum, p) => sum + p.amount_cents, 0);
  };

  const getClientPaymentMode = (client: Client): string => {
    if (client.preferred_payment_link_id) {
      const link = paymentLinks.find(l => l.id === client.preferred_payment_link_id);
      if (link) return link.label;
    }
    return 'Bank ACH / Wire';
  };

  const handleOpenWhatsApp = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';
    const message = encodeURIComponent(`Hi ${client.contact_name}, this is VectorOps regarding ${client.company_name}.`);
    
    // Check if agency has WhatsApp link or use wa.me direct
    const agencyWa = paymentLinks.find(l => l.platform === 'WHATSAPP' && l.is_active);
    let targetUrl = '';
    if (cleanPhone) {
      targetUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    } else if (agencyWa) {
      targetUrl = `${agencyWa.url.split('?')[0]}?text=${message}`;
    } else {
      targetUrl = `https://wa.me/?text=${message}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const filterTabs: Array<{ id: 'ALL' | 'ACTIVE' | 'TRIAL' | 'ARCHIVED'; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'TRIAL', label: 'Trial' },
    { id: 'ARCHIVED', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Clients</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Client accounts, active AI voice agent subscriptions, and renewal status
        </p>
      </div>

      {/* TOP: Search Bar with "+" Add Button beside it */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, business, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs neo-inset rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] bg-[var(--surface-1)] focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={onOpenOnboarding}
          title="Onboard client"
          className="btn-primary w-10 h-10 rounded-xl flex items-center justify-center shrink-0 p-0 shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* BELOW: Horizontal row of filter pills — selected pill filled, others outlined */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isSelected = filterPill === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterPill(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-[var(--accent-blue)] text-white font-semibold shadow-sm'
                  : 'neo-flat bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BELOW: Vertical list of compact cards */}
      <div className="space-y-2.5">
        {filteredClients.length === 0 ? (
          <div className="neo-raised bg-[var(--surface-2)] p-12 text-center rounded-2xl text-[var(--text-muted)] text-xs space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-sm">No clients match this filter</p>
            <p className="text-[var(--text-muted)]">Try adjusting your search query or onboard a new client account.</p>
            <button
              onClick={onOpenOnboarding}
              className="text-xs text-[var(--accent-blue)] hover:underline font-medium pt-1"
            >
              + Onboard client now
            </button>
          </div>
        ) : (
          filteredClients.map((client) => {
            const sub = getClientActiveSub(client.id);
            const planName = sub?.service_name || 'Voice Agent';
            const identifier = client.phone || client.contact_name || 'No phone on file';

            // Relative / date detail with semantic color
            let dateDetailText = '';
            let dateColorClass = 'text-[var(--text-muted)]';

            if (sub?.next_billing_date) {
              const days = db.days_until_billing(sub.id);
              if (days < 0) {
                dateDetailText = `Expires ${sub.next_billing_date} · ${Math.abs(days)}d overdue`;
                dateColorClass = 'text-[var(--accent-red)] font-semibold';
              } else if (days <= 7) {
                dateDetailText = `${days}d left · Renewing ${sub.next_billing_date}`;
                dateColorClass = 'text-[var(--accent-amber)] font-semibold';
              } else {
                dateDetailText = `${days}d left · Renewing ${sub.next_billing_date}`;
                dateColorClass = 'text-[var(--accent-green)] font-medium';
              }
            } else if (client.archived_at) {
              dateDetailText = `Archived ${client.archived_at.split('T')[0]}`;
              dateColorClass = 'text-[var(--text-muted)]';
            } else {
              dateDetailText = `Onboarded ${client.created_at?.split('T')[0] || 'Recently'}`;
              dateColorClass = 'text-[var(--text-muted)]';
            }

            return (
              <div
                key={client.id}
                onClick={() => setDetailClient(client)}
                className="neo-raised bg-[var(--surface-2)] p-4 rounded-2xl cursor-pointer card-item-enter flex items-center justify-between gap-4"
              >
                {/* Left: 3 Lines */}
                <div className="space-y-1 min-w-0 flex-1">
                  {/* Line 1: Name (bold) */}
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {client.company_name}
                  </div>

                  {/* Line 2: Secondary detail · identifier */}
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {planName} · {identifier}
                  </div>

                  {/* Line 3: Relative / date detail with semantic color */}
                  <div className={`text-xs ${dateColorClass}`}>
                    {dateDetailText}
                  </div>
                </div>

                {/* Right Side: Status Pill & Small Circular Icon Button */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge status={client.archived_at ? 'ARCHIVED' : client.service_status} type="service" />

                  {/* Small circular WhatsApp / Message icon button */}
                  <button
                    onClick={(e) => handleOpenWhatsApp(client, e)}
                    title="Send WhatsApp message"
                    className="w-8 h-8 rounded-full neo-flat bg-[var(--surface-1)] hover:bg-[var(--surface-3)] text-[var(--accent-green)] flex items-center justify-center transition-all shadow-sm shrink-0"
                  >
                    <PlatformIcon platform="WHATSAPP" size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL SHEET PATTERN: Bottom Sheet / Modal */}
      {detailClient && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setDetailClient(null)}
        >
          <div 
            className="w-full max-w-lg bg-[var(--surface-2)] neo-modal rounded-t-3xl sm:rounded-3xl p-6 space-y-5 text-left modal-sheet-enter"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: "[Entity] Details" with X to close */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Client Details
              </h2>
              <button
                onClick={() => setDetailClient(null)}
                className="w-8 h-8 rounded-full neo-flat text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Each field as its own full-width rounded bar, label faded/muted on left, value bold on right */}
            <div className="space-y-2">
              {(() => {
                const sub = getClientActiveSub(detailClient.id);
                const totalPaid = getClientTotalPaid(detailClient.id);
                const paymentMode = getClientPaymentMode(detailClient);
                const startDate = detailClient.created_at ? detailClient.created_at.split('T')[0] : '—';
                const nextBilling = sub?.next_billing_date || '—';

                const fields = [
                  { label: 'Name', value: detailClient.contact_name },
                  { label: 'Business', value: detailClient.company_name },
                  { label: 'Phone', value: detailClient.phone || '—' },
                  { label: 'Plan', value: sub?.service_name || 'Active Retainer' },
                  { label: 'Amount Paid', value: formatUSD(totalPaid) },
                  { label: 'Payment Mode', value: paymentMode },
                  { label: 'Start Date', value: startDate },
                  { label: 'Next Billing Date', value: nextBilling },
                  { label: 'Status', value: detailClient.service_status },
                ];

                return fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="w-full h-11 px-4 rounded-xl bg-[var(--surface-3)] neo-flat flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="text-[var(--text-muted)] font-normal">{f.label}</span>
                    <span className="text-[var(--text-primary)] font-bold truncate max-w-[220px]">{f.value}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Footer: Two pill-shaped action buttons side by side ("WhatsApp" + "Edit") */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleOpenWhatsApp(detailClient)}
                className="w-full py-2.5 rounded-full neo-flat bg-[var(--surface-1)] hover:brightness-105 text-[var(--accent-green)] font-semibold text-xs flex items-center justify-center gap-2 border border-white/[0.06]"
              >
                <PlatformIcon platform="WHATSAPP" size={15} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const clientToEdit = detailClient;
                  setDetailClient(null);
                  onSelectClient(clientToEdit);
                }}
                className="w-full py-2.5 rounded-full btn-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
