import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Layers, 
  Bot, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../lib/database';
import { POPULAR_TIMEZONES, formatUSD } from '../../lib/timezone';
import { Client } from '../../types';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [planId, setPlanId] = useState('plan_growth');
  const [retellWorkspaceUrl, setRetellWorkspaceUrl] = useState('');
  const [retellWorkspaceId, setRetellWorkspaceId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdClient, setCreatedClient] = useState<Client | null>(null);

  if (!isOpen) return null;

  const plans = db.getPlans();
  const selectedPlan = plans.find(p => p.id === planId) || plans[0];

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && !companyName.trim()) {
      setErrorMsg('Please specify the company or legal business entity name.');
      return;
    }
    if (step === 2) {
      if (!contactName.trim() || !email.trim()) {
        setErrorMsg('Please provide the primary contact name and valid email address.');
        return;
      }
      if (!email.includes('@')) {
        setErrorMsg('Please enter a valid email format.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = db.createClientWithWizard({
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        timezone,
        address,
        plan_id: planId,
        retell_workspace_url: retellWorkspaceUrl,
        retell_workspace_id: retellWorkspaceId,
        internal_notes: internalNotes,
      });

      if (!result.success || !result.client) {
        setErrorMsg(result.error || 'Failed to complete client onboarding.');
        setIsSubmitting(false);
        return;
      }

      setCreatedClient(result.client);
      setStep(7); // Success step

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E2896A', '#4CAF7D', '#EDEAE2'],
      });

      onClientCreated(result.client);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected failure during wizard orchestration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    onClose();
    // Reset state
    setStep(1);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setRetellWorkspaceUrl('');
    setRetellWorkspaceId('');
    setCreatedClient(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        
        {/* Wizard Header */}
        <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#E2896A]/10 text-[#E2896A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#EDEAE2]">Client onboarding wizard</h2>
              <p className="text-xs text-[#8B8D93]">
                {step < 7 ? `Step ${step} of 6: Automated provisioning pipeline` : 'Onboarding complete'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#8B8D93] hover:text-[#EDEAE2] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        {step < 7 && (
          <div className="w-full bg-[#17181B] h-1">
            <div
              className="bg-[#E2896A] h-1 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Wizard Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg neo-inset text-xs text-[#E2604F]">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: COMPANY */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 1: Client organization</h3>
                <p className="text-xs text-[#8B8D93]">Enter the business organization or practice name.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Company name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Luminar Dental AI, Apex Freight Logistics"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Physical / headquarters address (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 450 Lexington Ave, New York, NY 10017"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 2: Primary stakeholder</h3>
                <p className="text-xs text-[#8B8D93]">Who will receive invoices, appointment notifications, and portal invites?</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Contact full name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Evelyn Reed, Marcus Vance"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Billing & account email *</label>
                  <input
                    type="email"
                    placeholder="e.g. evelyn@luminardental.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Phone number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 349-8291"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TIMEZONE */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 3: Client timezone</h3>
                <p className="text-xs text-[#8B8D93]">
                  All appointments are canonically stored in UTC and dynamically displayed in both agency timezone and the client's local timezone.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#EDEAE2]">Select timezone *</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                >
                  {POPULAR_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: SUBSCRIPTION PLAN */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 4: Voice subscription plan</h3>
                <p className="text-xs text-[#8B8D93]">
                  Pricing will be snapshotted into this subscription. Admin plan edits later will never alter this client's rate.
                </p>
              </div>

              <div className="space-y-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPlanId(p.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-colors ${
                      planId === p.id
                        ? 'neo-raised bg-[#1D1F23]'
                        : 'neo-flat bg-[#1D1F23] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#EDEAE2]">{p.name}</span>
                      <span className="font-mono-numbers text-sm font-semibold text-[#4CAF7D]">
                        {formatUSD(p.recurring_fee_cents)} / month
                      </span>
                    </div>
                    <p className="text-xs text-[#8B8D93] mt-1 leading-relaxed">{p.description}</p>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#8B8D93]">
                      <span>Setup fee: <span className="text-[#E2896A] font-mono-numbers font-semibold">{formatUSD(p.setup_fee_cents)}</span></span>
                      <span>Grace: {p.grace_period_days} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: RETELL WORKSPACE */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 5: External Retell workspace</h3>
                <p className="text-xs text-[#8B8D93]">
                  Retell remains responsible for voice-agent configuration. Provide the external workspace URL for one-click access.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Retell workspace URL</label>
                  <input
                    type="url"
                    placeholder="https://app.retellai.com/dashboard/agent/agent_..."
                    value={retellWorkspaceUrl}
                    onChange={(e) => setRetellWorkspaceUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                  />
                  <span className="text-[11px] text-[#8B8D93]">Can be added later if agent is currently being built.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Retell workspace ID (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ws_luminar_01"
                    value={retellWorkspaceId}
                    onChange={(e) => setRetellWorkspaceId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Internal agency notes</label>
                  <textarea
                    rows={2}
                    placeholder="Initial onboarding notes, telephony requirements..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: REVIEW & CONFIRM */}
          {step === 6 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 6: Review onboarding orchestration</h3>
                <p className="text-xs text-[#8B8D93]">
                  Creating the client will automatically trigger the full onboarding pipeline in a single transaction.
                </p>
              </div>

              <div className="p-4 rounded-xl neo-flat bg-[#1D1F23] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Client:</span>
                  <span className="font-semibold text-[#EDEAE2]">{companyName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Primary contact:</span>
                  <span className="text-[#EDEAE2]">{contactName} ({email})</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Client timezone:</span>
                  <span className="font-mono-numbers text-[#EDEAE2]">{timezone}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Assigned plan:</span>
                  <span className="font-semibold text-[#EDEAE2]">{selectedPlan.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Setup fee invoice:</span>
                  <span className="font-mono-numbers font-semibold text-[#E2896A]">{formatUSD(selectedPlan.setup_fee_cents)}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Monthly retainer:</span>
                  <span className="font-mono-numbers font-semibold text-[#4CAF7D]">{formatUSD(selectedPlan.recurring_fee_cents)} / month</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8B8D93]">Retell workspace:</span>
                  <span className={retellWorkspaceUrl ? 'text-[#4CAF7D]' : 'text-[#E0A94C]'}>
                    {retellWorkspaceUrl ? 'Configured' : 'Missing (will track as blocked)'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[#8B8D93] bg-[#17181B] p-3 rounded-xl space-y-1">
                <span className="text-[#EDEAE2] font-semibold">Automations triggered on creation:</span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Client account instantiated with portal credentials</li>
                  <li>Subscription snapshot recorded at {formatUSD(selectedPlan.recurring_fee_cents)}/mo</li>
                  <li>Setup-fee invoice generated ({formatUSD(selectedPlan.setup_fee_cents)}) with 14-day terms</li>
                  <li>Onboarding checklist initialized</li>
                  <li>Immutable audit log record sealed</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 7: COMPLETE / SUCCESS */}
          {step === 7 && createdClient && (
            <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#4CAF7D]/20 text-[#4CAF7D] flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-[#EDEAE2]">Client successfully onboarded</h3>
                <p className="text-xs text-[#8B8D93]">
                  {createdClient.company_name} is now registered in the operating system.
                </p>
              </div>

              <div className="p-4 rounded-xl neo-flat bg-[#1D1F23] max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Client ID:</span>
                  <span className="font-mono text-[#EDEAE2]">{createdClient.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Service status:</span>
                  <span className="text-[#E0A94C]">Onboarding</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B8D93]">Checklist:</span>
                  <span className="text-[#4CAF7D]">Ready for execution</span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="btn-primary text-xs px-6 py-2.5"
              >
                Go to client record
              </button>
            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        {step < 7 && (
          <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {step < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreate}
                  className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/30 text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Provisioning...' : 'Complete & launch onboarding'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
