import React, { useState } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  CreditCard,
  Building2,
  FileText
} from 'lucide-react';
import { db } from '../../lib/database';
import { Payment, PaymentMethod, InvoiceWithMetrics } from '../../types';
import { formatUSD } from '../../lib/timezone';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface PaymentsViewProps {
  preselectedInvoice?: InvoiceWithMetrics | null;
  onClearPreselectedInvoice?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  preselectedInvoice,
  onClearPreselectedInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(!!preselectedInvoice);
  const [reversalTargetPayment, setReversalTargetPayment] = useState<Payment | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Payment Form State
  const [selectedClientId, setSelectedClientId] = useState(preselectedInvoice?.client_id || '');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoice?.id || '');
  const [amountDollars, setAmountDollars] = useState(
    preselectedInvoice ? (preselectedInvoice.balance_due_cents / 100).toFixed(2) : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const payments = db.getPayments();
  const clients = db.getAllClientsIncludingArchived();
  const invoices = db.getInvoices();

  // If preselectedInvoice changes
  React.useEffect(() => {
    if (preselectedInvoice) {
      setSelectedClientId(preselectedInvoice.client_id);
      setSelectedInvoiceId(preselectedInvoice.id);
      setAmountDollars((preselectedInvoice.balance_due_cents / 100).toFixed(2));
      setIsRecordModalOpen(true);
    }
  }, [preselectedInvoice]);

  const clientInvoices = invoices.filter(
    i => i.client_id === selectedClientId && i.status !== 'PAID' && i.status !== 'VOID'
  );

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  const filteredPayments = payments.filter(pay => {
    const client = clients.find(c => c.id === pay.client_id);
    const invoice = invoices.find(i => i.id === pay.invoice_id);
    const matchesSearch = 
      (pay.external_reference && pay.external_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client && client.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoice && invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedClientId) {
      setFormError('Please select a client.');
      return;
    }
    if (!selectedInvoiceId) {
      setFormError('Please select the invoice this payment is allocated to.');
      return;
    }
    const amountVal = parseFloat(amountDollars);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFormError('Payment amount must be greater than $0.00.');
      return;
    }

    const amountCents = Math.round(amountVal * 100);

    const result = await db.record_payment(
      selectedInvoiceId,
      amountCents,
      paymentMethod,
      new Date().toISOString(),
      externalReference.trim() || null,
      notes.trim() || null
    );

    if (!result.success) {
      setFormError(result.error || 'Failed to record payment.');
      return;
    }

    setIsRecordModalOpen(false);
    if (onClearPreselectedInvoice) onClearPreselectedInvoice();
    setSelectedClientId('');
    setSelectedInvoiceId('');
    setAmountDollars('');
    setExternalReference('');
    setNotes('');
  };

  const handleConfirmReversal = async () => {
    if (!reversalTargetPayment || !reversalReason.trim()) return;

    await db.reverse_payment(reversalTargetPayment.id, reversalReason.trim());
    setReversalTargetPayment(null);
    setReversalReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Payments</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Immutable transaction records for Wise, Wire, ACH, and PayPal settlements
          </p>
        </div>

        <button
          onClick={() => {
            setIsRecordModalOpen(true);
            setFormError('');
          }}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record payment</span>
        </button>
      </div>

      {/* Safeguards Banner — Raised Neumorphic Container */}
      <div className="p-5 rounded-[16px] neo-raised bg-[#1D1F23] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#4CAF7D] shrink-0" />
          <div>
            <span className="font-semibold text-[#EDEAE2]">Financial integrity guarantee:</span>
            <span className="text-[#8B8D93] ml-1">
              Payments are mathematically bounded by invoice balances, checked for duplicate wire references, and cannot be deleted directly. Reversals produce audit-stamped adjustments.
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-[#8B8D93] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by wire reference, client, or invoice #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none transition-colors"
        />
      </div>

      {/* Payments Table — Raised Neumorphic Container */}
      <div className="neo-raised bg-[#1D1F23] rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17181B] text-[#8B8D93] text-xs font-normal">
              <tr>
                <th className="py-3 px-4 font-normal">Payment ID</th>
                <th className="py-3 px-4 font-normal">Client</th>
                <th className="py-3 px-4 font-normal">Applied invoice</th>
                <th className="py-3 px-4 font-normal">Settlement date</th>
                <th className="py-3 px-4 font-normal">Method</th>
                <th className="py-3 px-4 font-normal">External reference</th>
                <th className="py-3 px-4 font-normal text-right">Amount</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8B8D93]">
                    No recorded external payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => {
                  const client = clients.find(c => c.id === pay.client_id);
                  const invoice = invoices.find(i => i.id === pay.invoice_id);

                  return (
                    <tr
                      key={pay.id}
                      className={`hover:bg-white/[0.02] transition-colors ${pay.is_reversed ? 'opacity-50' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#8B8D93]">
                        {pay.id}
                        {pay.is_reversed && (
                          <span className="ml-1.5 text-[10px] text-[#E2604F] font-semibold uppercase px-1 rounded bg-[#E2604F]/10">
                            Reversed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#EDEAE2]">
                        {client?.company_name || 'Client'}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[#E2896A]">
                        {invoice?.invoice_number || 'INV'}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[#8B8D93]">
                        {new Date(pay.received_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#EDEAE2]">
                          {pay.payment_method.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#EDEAE2]">
                        {pay.external_reference}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers font-bold text-sm">
                        <span className={pay.is_reversed ? 'line-through text-[#8B8D93]' : 'text-[#4CAF7D]'}>
                          {formatUSD(pay.amount_cents)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!pay.is_reversed && (
                          <button
                            onClick={() => setReversalTargetPayment(pay)}
                            className="text-[11px] text-[#8B8D93] hover:text-[#E2604F] transition-colors inline-flex items-center gap-1"
                            title="Reverse Payment (Requires Audit Stamped Reason)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reverse</span>
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

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#4CAF7D]" />
                <h2 className="text-base font-semibold text-[#EDEAE2]">Record external payment</h2>
              </div>
              <button
                onClick={() => {
                  setIsRecordModalOpen(false);
                  if (onClearPreselectedInvoice) onClearPreselectedInvoice();
                }}
                className="p-1 text-[#8B8D93] hover:text-[#EDEAE2] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl text-[#E2604F] neo-inset leading-relaxed">
                  {formError}
                </div>
              )}

              {/* Client Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Client account *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedInvoiceId('');
                  }}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Allocated invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    setSelectedInvoiceId(invId);
                    const inv = invoices.find(i => i.id === invId);
                    if (inv) {
                      setAmountDollars((inv.balance_due_cents / 100).toFixed(2));
                    }
                  }}
                  disabled={!selectedClientId}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select invoice to apply payment against...</option>
                  {clientInvoices.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.invoice_number} ({i.invoice_type === 'SETUP' ? 'Setup fee' : 'Monthly retainer'}) — Balance: {formatUSD(i.balance_due_cents)}
                    </option>
                  ))}
                </select>
                {selectedInvoice && (
                  <div className="text-[11px] text-[#4CAF7D] pt-0.5">
                    Authorized maximum: {formatUSD(selectedInvoice.balance_due_cents)}
                  </div>
                )}
              </div>

              {/* Amount and Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Payment amount (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8D93]">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="499.00"
                      value={amountDollars}
                      onChange={(e) => setAmountDollars(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono-numbers"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Payment method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank transfer (ACH)</option>
                    <option value="WISE">Wise corporate</option>
                    <option value="WIRE">Fedwire / International wire</option>
                    <option value="PAYPAL">PayPal business</option>
                    <option value="OTHER">Other external</option>
                  </select>
                </div>
              </div>

              {/* External Reference */}
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">External wire / settlement reference *</label>
                <input
                  type="text"
                  placeholder="e.g. WISE-TRX-88291, FED-WIRE-99210"
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono"
                />
                <span className="text-[11px] text-[#8B8D93]">Checked against database to prevent duplicate reconciliation.</span>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Payment notes</label>
                <textarea
                  rows={2}
                  placeholder="Sender name, banking institution, or internal reference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/30 text-xs px-5 py-2 shadow-md shadow-emerald-600/20"
                >
                  Record and reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Reversal Modal */}
      {reversalTargetPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl text-[#E2604F]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-[#EDEAE2]">Reverse recorded payment</h3>
                  <p className="text-xs text-[#8B8D93] leading-relaxed">
                    This will reverse <strong className="text-[#EDEAE2]">{formatUSD(reversalTargetPayment.amount_cents)}</strong> (Ref: {reversalTargetPayment.external_reference}) and restore the invoice balance due. Financial history remains immutable.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-[#EDEAE2]">Audit reversal reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Bank chargeback, duplicate manual entry, wire rejected"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReversalTargetPayment(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reversalReason.trim()}
                  onClick={handleConfirmReversal}
                  className="btn-danger text-xs px-4 py-2 disabled:opacity-40"
                >
                  Confirm reversal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
