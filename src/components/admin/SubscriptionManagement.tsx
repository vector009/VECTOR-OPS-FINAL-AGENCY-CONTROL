import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  X,
  TrendingUp,
  Clock
} from 'lucide-react';
import { db } from '../../lib/database';
import { SubscriptionPlan, Subscription, Client } from '../../types';
import { formatUSD, parseDollarsToCents } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

export const SubscriptionManagement: React.FC = () => {
  const plans = db.getPlans();
  const subscriptions = db.getSubscriptions();
  const clients = db.getAllClientsIncludingArchived();

  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Plan Edit Form
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [setupFeeDollars, setSetupFeeDollars] = useState('');
  const [recurringFeeDollars, setRecurringFeeDollars] = useState('');
  const [graceDays, setGraceDays] = useState('7');
  const [serviceDesc, setServiceDesc] = useState('');

  const handleOpenEdit = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name);
      setPlanDesc(plan.description);
      setSetupFeeDollars((plan.setup_fee_cents / 100).toFixed(2));
      setRecurringFeeDollars((plan.recurring_fee_cents / 100).toFixed(2));
      setGraceDays(plan.grace_period_days.toString());
      setServiceDesc(plan.included_service_description);
    } else {
      setEditingPlan(null);
      setPlanName('');
      setPlanDesc('');
      setSetupFeeDollars('499.00');
      setRecurringFeeDollars('499.00');
      setGraceDays('7');
      setServiceDesc('');
    }
    setIsEditPlanOpen(true);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const setupCents = parseDollarsToCents(setupFeeDollars);
    const recurringCents = parseDollarsToCents(recurringFeeDollars);
    const grace = parseInt(graceDays, 10) || 7;

    if (editingPlan) {
      db.updatePlan(editingPlan.id, {
        name: planName.trim(),
        description: planDesc.trim(),
        setup_fee_cents: setupCents,
        recurring_fee_cents: recurringCents,
        grace_period_days: grace,
        included_service_description: serviceDesc.trim(),
      });
    } else {
      db.createPlan({
        name: planName.trim(),
        description: planDesc.trim(),
        setup_fee_cents: setupCents,
        recurring_fee_cents: recurringCents,
        billing_interval: 'MONTHLY',
        grace_period_days: grace,
        included_service_description: serviceDesc.trim(),
        notes: null,
        is_active: true,
      });
    }

    setIsEditPlanOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Subscription plans & retainers</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Package templates with immutable subscription price snapshotting
          </p>
        </div>

        <button
          onClick={() => handleOpenEdit()}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create plan template</span>
        </button>
      </div>

      {/* Price Snapshotting Invariant Notice — Raised Neumorphic Container */}
      <div className="p-5 rounded-[16px] neo-raised bg-[#1D1F23] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#E2896A] shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#EDEAE2]">Snapshot protection:</span>
            <span className="text-[#8B8D93] ml-1">
              Modifying a plan template will never alter existing client subscriptions. Clients retain their contractual snapshotted price.
            </span>
          </div>
        </div>
      </div>

      {/* Plan Templates Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#EDEAE2]">
          Active plan templates ({plans.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const subscribersCount = subscriptions.filter(s => s.plan_id === p.id && s.status === 'ACTIVE').length;

            return (
              <div
                key={p.id}
                className="neo-raised p-5 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-base text-[#EDEAE2]">{p.name}</span>
                    <span className="text-xs text-[#4CAF7D] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
                      Active
                    </span>
                  </div>

                  <p className="text-xs text-[#8B8D93] leading-relaxed min-h-[36px]">
                    {p.description}
                  </p>

                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#8B8D93]">Monthly retainer:</span>
                      <span className="text-xl font-semibold font-mono-numbers text-[#4CAF7D]">
                        {formatUSD(p.recurring_fee_cents)}
                        <span className="text-xs font-normal text-[#8B8D93]"> / mo</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#8B8D93]">
                      <span>Setup fee:</span>
                      <span className="font-mono-numbers text-[#E2896A] font-semibold">
                        {formatUSD(p.setup_fee_cents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#8B8D93]">
                      <span>Grace period:</span>
                      <span className="font-mono-numbers text-[#EDEAE2]">{p.grace_period_days} days</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="font-mono-numbers text-[11px] text-[#8B8D93]">
                    {subscribersCount} active {subscribersCount === 1 ? 'client' : 'clients'}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="px-3 py-1 text-xs text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-md transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Client Subscriptions Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#EDEAE2]">
          Active client subscriptions ({subscriptions.length})
        </h2>

        <div className="neo-raised bg-[#1D1F23] rounded-[16px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#17181B] text-[#8B8D93] font-normal">
                <tr>
                  <th className="py-3 px-4 font-normal">Client</th>
                  <th className="py-3 px-4 font-normal">Contracted service</th>
                  <th className="py-3 px-4 font-normal text-right">Snapshotted monthly fee</th>
                  <th className="py-3 px-4 font-normal text-right">Snapshotted setup fee</th>
                  <th className="py-3 px-4 font-normal">Start date</th>
                  <th className="py-3 px-4 font-normal">Next billing cycle</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map((sub) => {
                  const client = clients.find(c => c.id === sub.client_id);

                  return (
                    <tr key={sub.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-semibold text-[#EDEAE2]">
                        {client?.company_name || 'Client'}
                      </td>
                      <td className="py-3.5 px-4 text-[#EDEAE2]">
                        {sub.service_name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold text-[#4CAF7D]">
                        {formatUSD(sub.recurring_fee_cents)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-numbers font-semibold text-[#E2896A]">
                        {formatUSD(sub.setup_fee_cents)}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[#8B8D93]">
                        {sub.start_date}
                      </td>
                      <td className="py-3.5 px-4 font-mono-numbers text-[#EDEAE2]">
                        {sub.next_billing_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={sub.status} type="service" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Plan Edit Modal */}
      {isEditPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">
                {editingPlan ? `Edit ${editingPlan.name}` : 'New plan template'}
              </h2>
              <button onClick={() => setIsEditPlanOpen(false)} className="p-1 text-[#8B8D93] hover:text-[#EDEAE2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Plan name *</label>
                <input
                  type="text"
                  placeholder="e.g. Starter Voice, Growth Voice Matrix"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Service description..."
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Monthly retainer (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recurringFeeDollars}
                    onChange={(e) => setRecurringFeeDollars(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Setup fee (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={setupFeeDollars}
                    onChange={(e) => setSetupFeeDollars(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Grace period (days)</label>
                <input
                  type="number"
                  value={graceDays}
                  onChange={(e) => setGraceDays(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsEditPlanOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
                >
                  Save plan template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
