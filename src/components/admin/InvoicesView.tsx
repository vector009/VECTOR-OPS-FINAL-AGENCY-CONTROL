import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { db } from '../../lib/database';
import { Invoice, InvoiceWithMetrics, InvoiceStatus, Client, InvoiceType } from '../../types';
import { formatUSD } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

interface InvoicesViewProps {
  onRecordPaymentForInvoice?: (invoice: InvoiceWithMetrics) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onRecordPaymentForInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithMetrics | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Invoice Form state
  const [newClientId, setNewClientId] = useState('');
  const [newAmountDollars, setNewAmountDollars] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newType, setNewType] = useState<InvoiceType>('RECURRING');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  const invoices = db.getInvoices();
  const clients = db.getAllClientsIncludingArchived();

  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.client_id);
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
    setNewNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Invoices</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            USD integer-cent ledgers with separated setup fees and recurring service cycles
          </p>
        </div>

        <button
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 14);
            setNewDueDate(nextWeek.toISOString().split('T')[0]);
            setIsCreateModalOpen(true);
          }}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate invoice</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8B8D93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice # or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#1D1F23] rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ISSUED', label: 'Issued' },
            { id: 'PARTIALLY_PAID', label: 'Partially paid' },
            { id: 'PAID', label: 'Paid' },
            { id: 'OVERDUE', label: 'Overdue' },
            { id: 'DRAFT', label: 'Draft' },
          ].map((st) => (
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
      </div>

      {/* Invoices Table — Raised Neumorphic Container */}
      <div className="neo-raised bg-[#1D1F23] rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17181B] text-[#8B8D93] text-xs font-normal">
              <tr>
                <th className="py-3 px-4 font-normal">Invoice</th>
                <th className="py-3 px-4 font-normal">Client</th>
                <th className="py-3 px-4 font-normal">Classification</th>
                <th className="py-3 px-4 font-normal">Issue date</th>
                <th className="py-3 px-4 font-normal">Due date</th>
                <th className="py-3 px-4 font-normal text-right">Total</th>
                <th className="py-3 px-4 font-normal text-right">Balance due</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#8B8D93]">
                    No invoices matching current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const client = clients.find(c => c.id === inv.client_id);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono-numbers font-semibold text-[#EDEAE2]">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#EDEAE2]">
                        {client?.company_name || 'Client'}
                      </td>
                      <td className="py-3.5 px-4 text-[#8B8D93]">
                        {inv.invoice_type === 'SETUP' ? (
                          <span className="text-[#E2896A]">Setup fee</span>
                        ) : (
                          <span className="text-[#8B8D93]">Monthly retainer</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[#8B8D93]">
                        {inv.issue_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[#8B8D93]">
                        {inv.due_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold text-[#EDEAE2]">
                        {formatUSD(inv.total_cents)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold">
                        <span className={inv.balance_due_cents > 0 ? 'text-[#E2896A]' : 'text-[#4CAF7D]'}>
                          {formatUSD(inv.balance_due_cents)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={inv.status} type="invoice" />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {inv.balance_due_cents > 0 && onRecordPaymentForInvoice && (
                          <button
                            onClick={() => onRecordPaymentForInvoice(inv)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-md transition-colors"
                          >
                            Record payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E2896A]" />
                <h2 className="text-base font-semibold text-[#EDEAE2]">
                  {selectedInvoice.invoice_number}
                </h2>
                <StatusBadge status={selectedInvoice.status} type="invoice" />
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-[#8B8D93] hover:text-[#EDEAE2] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl neo-inset space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Billed organization:</span>
                  <span className="font-semibold text-[#EDEAE2]">
                    {clients.find(c => c.id === selectedInvoice.client_id)?.company_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Issue date:</span>
                  <span className="font-mono-numbers text-[#EDEAE2]">{selectedInvoice.issue_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Due date:</span>
                  <span className="font-mono-numbers text-[#EDEAE2]">{selectedInvoice.due_date}</span>
                </div>
                {selectedInvoice.service_period_start && (
                  <div className="flex justify-between">
                    <span className="text-[#8B8D93]">Service period:</span>
                    <span className="font-mono-numbers text-[#EDEAE2]">
                      {selectedInvoice.service_period_start} → {selectedInvoice.service_period_end}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-white/5 text-[#8B8D93]">
                  <span>Subtotal:</span>
                  <span className="font-mono-numbers text-[#EDEAE2]">{formatUSD(selectedInvoice.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5 text-[#8B8D93]">
                  <span>Adjustments:</span>
                  <span className="font-mono-numbers text-[#EDEAE2]">{formatUSD(selectedInvoice.adjustments_cents)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5 font-semibold text-[#EDEAE2]">
                  <span>Total amount:</span>
                  <span className="font-mono-numbers text-base">{formatUSD(selectedInvoice.total_cents)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5 text-[#4CAF7D]">
                  <span>Amount settled:</span>
                  <span className="font-mono-numbers font-semibold">{formatUSD(selectedInvoice.amount_paid_cents)}</span>
                </div>
                <div className="flex justify-between py-2.5 text-[#E2896A] font-semibold text-sm neo-inset px-3 rounded-xl">
                  <span>Authorized balance due:</span>
                  <span className="font-mono-numbers">{formatUSD(selectedInvoice.balance_due_cents)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-[#17181B] flex items-center justify-between">
              <span className="text-xs text-[#8B8D93]">Currency: USD (Integer Cents)</span>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 text-xs font-normal text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Generate Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">Generate manual invoice</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#8B8D93] hover:text-[#EDEAE2] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg text-[#E2604F] neo-inset">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Client *</label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.contact_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Amount in USD *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8D93]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="499.00"
                      value={newAmountDollars}
                      onChange={(e) => setNewAmountDollars(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono-numbers"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Due date *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Classification *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('RECURRING')}
                    className={`py-2 px-3 rounded-xl text-center font-medium transition-colors ${
                      newType === 'RECURRING'
                        ? 'neo-inset text-[#EDEAE2] font-semibold'
                        : 'bg-[#17181B] text-[#8B8D93]'
                    }`}
                  >
                    Monthly service retainer
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('SETUP')}
                    className={`py-2 px-3 rounded-xl text-center font-medium transition-colors ${
                      newType === 'SETUP'
                        ? 'neo-inset text-[#E2896A] font-semibold'
                        : 'bg-[#17181B] text-[#8B8D93]'
                    }`}
                  >
                    One-time setup fee
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Notes (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Service description or line item note..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
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
