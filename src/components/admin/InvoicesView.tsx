import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  DollarSign, 
  Edit3, 
  CheckCircle2, 
  Receipt,
  CreditCard
} from 'lucide-react';
import { db } from '../../lib/database';
import { InvoiceWithMetrics, InvoiceType } from '../../types';
import { formatUSD } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

interface InvoicesViewProps {
  onRecordPaymentForInvoice?: (invoice: InvoiceWithMetrics) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onRecordPaymentForInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPill, setFilterPill] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [detailInvoice, setDetailInvoice] = useState<InvoiceWithMetrics | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Invoice Form state
  const [newClientId, setNewClientId] = useState('');
  const [newAmountDollars, setNewAmountDollars] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState<InvoiceType>('RECURRING');
  const [formError, setFormError] = useState('');

  const invoices = db.getInvoices();
  const clients = db.getAllClientsIncludingArchived();
  const paymentLinks = db.getPaymentLinks();

  // Filter invoices based on search and selected pill
  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.client_id);
    const term = searchTerm.toLowerCase().trim();
    
    const matchesSearch = !term ||
      inv.invoice_number.toLowerCase().includes(term) ||
      (client && client.company_name.toLowerCase().includes(term)) ||
      (client && client.contact_name.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterPill === 'PAID') {
      return inv.status === 'PAID';
    }
    if (filterPill === 'PENDING') {
      return inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID' || inv.status === 'DRAFT';
    }
    if (filterPill === 'OVERDUE') {
      return inv.status === 'OVERDUE';
    }
    return true; // 'ALL'
  });

  const getClientForInvoice = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getInvoicePaymentMethod = (inv: InvoiceWithMetrics) => {
    const payment = db.getPayments().find(p => p.invoice_id === inv.id && !p.is_reversed);
    if (payment) return payment.payment_method.replace(/_/g, ' ');
    const client = getClientForInvoice(inv.client_id);
    if (client?.preferred_payment_link_id) {
      const link = paymentLinks.find(l => l.id === client.preferred_payment_link_id);
      if (link) return link.label;
    }
    return 'Bank ACH / Wire';
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newClientId) {
      setFormError('Please select a client.');
      return;
    }
    const amountVal = parseFloat(newAmountDollars);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFormError('Please enter a valid invoice amount in USD.');
      return;
    }
    if (!newDueDate) {
      setFormError('Please specify the due date.');
      return;
    }

    const subtotalCents = Math.round(amountVal * 100);
    db.generateManualInvoice({
      client_id: newClientId,
      subtotal_cents: subtotalCents,
      due_date: newDueDate,
      invoice_type: newType,
    });

    setIsCreateModalOpen(false);
    setNewClientId('');
    setNewAmountDollars('');
    setNewDueDate('');
  };

  const filterTabs: Array<{ id: 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'PAID', label: 'Paid' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Invoices</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          USD integer-cent ledgers with separated setup fees and recurring service cycles
        </p>
      </div>

      {/* TOP: Search Bar with "+" Add Button beside it */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs neo-inset rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] bg-[var(--surface-1)] focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 14);
            setNewDueDate(nextWeek.toISOString().split('T')[0]);
            setIsCreateModalOpen(true);
          }}
          title="Generate invoice"
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
        {filteredInvoices.length === 0 ? (
          <div className="neo-raised bg-[var(--surface-2)] p-12 text-center rounded-2xl text-[var(--text-muted)] text-xs space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-sm">No invoices match this filter</p>
            <p className="text-[var(--text-muted)]">All balances may be settled or no invoices have been generated yet.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs text-[var(--accent-blue)] hover:underline font-medium pt-1"
            >
              + Generate invoice now
            </button>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const client = getClientForInvoice(inv.client_id);
            const clientName = client?.company_name || 'Client';

            // Calculate date relative detail with semantic color
            let dateDetailText = '';
            let dateColorClass = 'text-[var(--text-muted)]';

            if (inv.status === 'PAID') {
              dateDetailText = `Paid in full · Settled`;
              dateColorClass = 'text-[var(--accent-green)] font-medium';
            } else {
              // Compare due_date to today
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const due = new Date(inv.due_date);
              due.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (diffDays < 0) {
                dateDetailText = `Due ${inv.due_date} · ${Math.abs(diffDays)}d overdue`;
                dateColorClass = 'text-[var(--accent-red)] font-semibold';
              } else if (diffDays <= 7) {
                dateDetailText = `Due ${inv.due_date} · ${diffDays}d left`;
                dateColorClass = 'text-[var(--accent-amber)] font-semibold';
              } else {
                dateDetailText = `Due ${inv.due_date} · ${diffDays}d left`;
                dateColorClass = 'text-[var(--accent-green)] font-medium';
              }
            }

            return (
              <div
                key={inv.id}
                onClick={() => setDetailInvoice(inv)}
                className="neo-raised bg-[var(--surface-2)] p-4 rounded-2xl cursor-pointer hover:brightness-105 active:scale-[0.995] transition-all flex items-center justify-between gap-4"
              >
                {/* Left: 3 Lines */}
                <div className="space-y-1 min-w-0 flex-1">
                  {/* Line 1: Name (bold) */}
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {clientName}
                  </div>

                  {/* Line 2: Secondary detail · identifier */}
                  <div className="text-xs text-[var(--text-muted)] truncate font-mono-numbers">
                    Invoice #{inv.invoice_number} · <strong className="text-[var(--text-primary)]">{formatUSD(inv.total_cents)}</strong>
                  </div>

                  {/* Line 3: Relative / date detail with semantic color */}
                  <div className={`text-xs ${dateColorClass}`}>
                    {dateDetailText}
                  </div>
                </div>

                {/* Right Side: Status Pill & Small Circular Icon Button */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge status={inv.status} type="invoice" />

                  {/* Small circular icon button: Record Payment quick action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRecordPaymentForInvoice) {
                        onRecordPaymentForInvoice(inv);
                      } else {
                        setDetailInvoice(inv);
                      }
                    }}
                    title="Record payment"
                    className="w-8 h-8 rounded-full neo-flat bg-[var(--surface-1)] hover:bg-[var(--surface-3)] text-[var(--accent-green)] flex items-center justify-center transition-all shadow-sm shrink-0"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL SHEET PATTERN: Bottom Sheet / Modal */}
      {detailInvoice && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setDetailInvoice(null)}
        >
          <div 
            className="w-full max-w-lg bg-[var(--surface-2)] neo-modal rounded-t-3xl sm:rounded-3xl p-6 space-y-5 text-left border border-white/[0.08] shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: "Invoice Details" with X to close */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Invoice Details
              </h2>
              <button
                onClick={() => setDetailInvoice(null)}
                className="w-8 h-8 rounded-full neo-flat text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Each field as its own full-width rounded bar, label faded/muted on left, value bold on right */}
            <div className="space-y-2">
              {(() => {
                const client = getClientForInvoice(detailInvoice.client_id);
                const paymentMethod = getInvoicePaymentMethod(detailInvoice);

                const fields = [
                  { label: 'Invoice #', value: detailInvoice.invoice_number },
                  { label: 'Client', value: client?.company_name || '—' },
                  { label: 'Amount', value: `${formatUSD(detailInvoice.total_cents)} (Balance: ${formatUSD(detailInvoice.balance_due_cents)})` },
                  { label: 'Due Date', value: detailInvoice.due_date },
                  { label: 'Status', value: detailInvoice.status },
                  { label: 'Payment Method', value: paymentMethod },
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

            {/* Footer: Two pill-shaped action buttons side by side ("Record Payment" + "Edit") */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const inv = detailInvoice;
                  setDetailInvoice(null);
                  if (onRecordPaymentForInvoice) {
                    onRecordPaymentForInvoice(inv);
                  }
                }}
                className="w-full py-2.5 rounded-full btn-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailInvoice(null);
                  setIsCreateModalOpen(true);
                }}
                className="w-full py-2.5 rounded-full neo-flat bg-[var(--surface-1)] hover:brightness-105 text-[var(--text-primary)] font-semibold text-xs flex items-center justify-center gap-2 border border-white/[0.06]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-md overflow-hidden text-left border border-white/[0.08]">
            <div className="px-6 py-4 bg-[var(--surface-1)] flex items-center justify-between border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Generate invoice</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg neo-inset text-[var(--accent-red)]">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Client *</label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.contact_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Invoice type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                  >
                    <option value="RECURRING">Recurring retainer</option>
                    <option value="SETUP">One-time setup fee</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Amount (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="499.00"
                    value={newAmountDollars}
                    onChange={(e) => setNewAmountDollars(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Due date *</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)] neo-raised rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 font-semibold text-xs rounded-xl"
                >
                  Generate invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
