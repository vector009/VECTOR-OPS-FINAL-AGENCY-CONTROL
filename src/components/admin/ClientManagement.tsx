import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Archive, 
  Eye, 
  Bot, 
  AlertCircle, 
  ExternalLink
} from 'lucide-react';
import { db } from '../../lib/database';
import { Client } from '../../types';
import { formatUSD } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface ClientManagementProps {
  onSelectClient: (client: Client) => void;
  onOpenOnboarding: () => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  onSelectClient,
  onOpenOnboarding,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTargetClient, setArchiveTargetClient] = useState<Client | null>(null);

  const allClients = showArchived 
    ? db.getAllClientsIncludingArchived() 
    : db.getClients();

  const subscriptions = db.getSubscriptions();

  // Search and filter
  const filteredClients = allClients.filter(c => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.service_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleArchiveConfirm = () => {
    if (!archiveTargetClient) return;
    db.archive_client(archiveTargetClient.id);
    setArchiveTargetClient(null);
  };

  const statusFilterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'ONBOARDING', label: 'Onboarding' },
    { id: 'PAYMENT_DUE', label: 'Payment due' },
    { id: 'SUSPENDED', label: 'Suspended' },
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Clients</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Voice-agent production subscriptions, billing statuses, and external Retell links
          </p>
        </div>

        {/* Single canonical onboard button */}
        <button
          onClick={onOpenOnboarding}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard client</span>
        </button>
      </div>

      {/* Search, Filter Tabs & Archived Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8B8D93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clients by company, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Status segmented filters */}
          <div className="flex items-center p-1 bg-[#1D1F23] rounded-xl text-xs space-x-0.5">
            {statusFilterOptions.map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === st.id
                    ? 'neo-inset text-[#EDEAE2] font-semibold'
                    : 'text-[#8B8D93] hover:text-[#EDEAE2]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Toggle archived view */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              showArchived
                ? 'text-[#E2896A] font-semibold'
                : 'text-[#8B8D93] hover:text-[#EDEAE2]'
            }`}
          >
            {showArchived ? 'Showing archived' : 'Show archived'}
          </button>
        </div>
      </div>

      {/* Clients Data Table — Raised Neumorphic Container */}
      <div className="neo-raised bg-[#1D1F23] rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17181B] text-[#8B8D93] text-xs font-normal">
              <tr>
                <th className="py-3 px-4 font-normal">Client</th>
                <th className="py-3 px-4 font-normal">Service status</th>
                <th className="py-3 px-4 font-normal">Voice plan</th>
                <th className="py-3 px-4 font-normal text-right">Monthly fee</th>
                <th className="py-3 px-4 font-normal">Next billing</th>
                <th className="py-3 px-4 font-normal">Billing status</th>
                <th className="py-3 px-4 font-normal">Retell workspace</th>
                <th className="py-3 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8B8D93]">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-[#EDEAE2]">No clients match your filter</p>
                      <button
                        onClick={onOpenOnboarding}
                        className="text-xs text-[#E2896A] hover:underline"
                      >
                        Onboard a new client
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const sub = subscriptions.find(s => s.client_id === client.id && s.status === 'ACTIVE');
                  const hasRetell = !!client.retell_workspace_url;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => onSelectClient(client)}
                    >
                      {/* Client info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                            <span>{client.company_name}</span>
                            {client.archived_at && (
                              <span className="text-[10px] text-[#8B8D93] px-1 rounded bg-white/5">
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8B8D93]">
                            {client.contact_name} · {client.timezone}
                          </div>
                        </div>
                      </td>

                      {/* Service Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={client.service_status} type="service" />
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 text-[#EDEAE2]">
                        {sub?.service_name || 'No plan'}
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold text-[#EDEAE2]">
                        {sub ? formatUSD(sub.recurring_fee_cents) : '—'}
                      </td>

                      {/* Next Billing & Real-Time Renewal Countdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sub?.next_billing_date ? (
                          <div className="space-y-0.5">
                            <div className="font-mono-numbers text-[#EDEAE2]">{sub.next_billing_date}</div>
                            {(() => {
                              const days = db.days_until_billing(sub.id);
                              const isUrgent = days <= 7;
                              return (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-mono-numbers font-medium px-1.5 py-0.5 rounded ${
                                  isUrgent 
                                    ? 'bg-[#E0A94C]/15 text-[#E0A94C] font-semibold' 
                                    : 'bg-white/5 text-[#8B8D93]'
                                }`}>
                                  {days > 0 ? `${days}d left` : days === 0 ? 'Due today' : `${Math.abs(days)}d overdue`}
                                </span>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-[#8B8D93] font-mono-numbers">—</span>
                        )}
                      </td>

                      {/* Billing Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={db.getClientBillingStatus(client.id)} type="billing" />
                      </td>

                      {/* Retell Workspace */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {hasRetell ? (
                          <a
                            href={client.retell_workspace_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#E2896A] hover:underline"
                          >
                            <Bot className="w-3.5 h-3.5 text-[#E2896A]" />
                            <span>Open Retell</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#E0A94C] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Retell missing</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectClient(client)}
                            className="p-1.5 text-[#8B8D93] hover:text-[#EDEAE2] rounded-md transition-colors"
                            title="View full client record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {!client.archived_at && (
                            <button
                              onClick={() => setArchiveTargetClient(client)}
                              className="p-1.5 text-[#8B8D93] hover:text-[#E2604F] rounded-md transition-colors"
                              title="Archive client"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Client Archiving */}
      <ConfirmationModal
        isOpen={!!archiveTargetClient}
        title={`Archive ${archiveTargetClient?.company_name}?`}
        description="Archiving this client will disable active portal access and cancel future automated subscription renewals. All historical invoices, payments, and audit logs will be permanently retained."
        confirmLabel="Archive client"
        isDestructive={true}
        requiredConfirmationPhrase={archiveTargetClient ? 'ARCHIVE' : undefined}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTargetClient(null)}
      />
    </div>
  );
};
