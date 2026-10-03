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
  ExternalLink,
  KeyRound,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  ShieldCheck,
  Share2,
  Link as LinkIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { saveOnboardedCredentials } from '../../context/AuthContext';
import { POPULAR_TIMEZONES, formatUSD } from '../../lib/timezone';
import { Client } from '../../types';
import { PlatformIcon } from '../common/PlatformIcon';

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
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timezone, setTimezone] = useState('America/New_York');
  const [planId, setPlanId] = useState('plan_growth');
  const [retellWorkspaceUrl, setRetellWorkspaceUrl] = useState('');
  const [retellWorkspaceId, setRetellWorkspaceId] = useState('');
  const [preferredPaymentLinkId, setPreferredPaymentLinkId] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [otherSocialUrl, setOtherSocialUrl] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdClient, setCreatedClient] = useState<Client | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  if (!isOpen) return null;

  const plans = db.getPlans();
  const selectedPlan = plans.find(p => p.id === planId) || plans[0];
  const activePaymentLinks = db.getActivePaymentLinks();

  const isValidHttpUrl = (str: string) => {
    if (!str.trim()) return true;
    try {
      const u = new URL(str.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Secure random password generator (12-14 characters with letters, numbers & special chars)
  const handleGeneratePassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPortalPassword(pass);
    setShowPassword(true);
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && !companyName.trim()) {
      setErrorMsg('Please specify the company or legal business entity name.');
      return;
    }
    if (step === 2) {
      if (!contactName.trim() || !email.trim()) {
        setErrorMsg('Please provide the primary contact name and email address.');
        return;
      }
      if (!email.includes('@')) {
        setErrorMsg('Please enter a valid email format.');
        return;
      }
      if (!portalPassword.trim() || portalPassword.trim().length < 6) {
        setErrorMsg('Please enter a portal password of at least 6 characters (or click "Generate password").');
        return;
      }
    }
    if (step === 5) {
      if (retellWorkspaceUrl.trim() && !isValidHttpUrl(retellWorkspaceUrl)) {
        setErrorMsg('Please enter a valid Retell workspace URL (e.g. https://app.retellai.com/...).');
        return;
      }
      if (websiteUrl.trim() && !isValidHttpUrl(websiteUrl)) {
        setErrorMsg('Please enter a valid Website URL (starting with http:// or https://).');
        return;
      }
      if (instagramUrl.trim() && !isValidHttpUrl(instagramUrl)) {
        setErrorMsg('Please enter a valid Instagram URL (starting with http:// or https://).');
        return;
      }
      if (facebookUrl.trim() && !isValidHttpUrl(facebookUrl)) {
        setErrorMsg('Please enter a valid Facebook URL (starting with http:// or https://).');
        return;
      }
      if (xUrl.trim() && !isValidHttpUrl(xUrl)) {
        setErrorMsg('Please enter a valid X / Twitter URL (starting with http:// or https://).');
        return;
      }
      if (otherSocialUrl.trim() && !isValidHttpUrl(otherSocialUrl)) {
        setErrorMsg('Please enter a valid URL for Other online presence / social link.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => Math.max(prev - 1, 1));
  };

  // On submit: invoke Supabase Edge Function onboard-client for atomic provisioning
  const handleCreate = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = portalPassword.trim();

    try {
      let remoteClientData: any = null;
      let remoteUserId: string | null = null;

      // 1. Call Supabase Edge Function (service_role key stays strictly server-side)
      try {
        const { data: edgeResp, error: edgeError } = await supabase.functions.invoke('onboard-client', {
          body: {
            email: cleanEmail,
            password: cleanPassword,
            company_name: companyName.trim(),
            contact_name: contactName.trim(),
            phone: phone.trim(),
            timezone,
            address: address.trim() || null,
            plan_id: planId,
            retell_workspace_url: retellWorkspaceUrl.trim() || null,
            retell_workspace_id: retellWorkspaceId.trim() || null,
            internal_notes: internalNotes.trim() || null,
          },
        });

        if (!edgeError && edgeResp?.success && edgeResp?.client) {
          remoteClientData = edgeResp.client;
          remoteUserId = edgeResp.user?.id || null;
        } else if (edgeError) {
          console.warn('Edge Function notice:', edgeError.message);
        }
      } catch (err: any) {
        console.warn('Edge function invoke skipped or unavailable:', err?.message || err);
      }

      // 2. Synchronize into local operational database
      const result = db.createClientWithWizard({
        company_name: companyName,
        contact_name: contactName,
        email: cleanEmail,
        phone,
        timezone,
        address,
        plan_id: planId,
        portal_password: cleanPassword,
        override_client_id: remoteClientData?.id || undefined,
        retell_workspace_url: retellWorkspaceUrl,
        retell_workspace_id: retellWorkspaceId,
        preferred_payment_link_id: preferredPaymentLinkId || null,
        website_url: websiteUrl,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        x_url: xUrl,
        other_social_url: otherSocialUrl,
        internal_notes: internalNotes,
      });

      if (!result.success || !result.client) {
        setErrorMsg(result.error || 'Failed to complete client onboarding.');
        setIsSubmitting(false);
        return;
      }

      const client = result.client;
      setCreatedClient(client);

      // 3. Cache confirmed credentials for immediate sign-in without email step
      saveOnboardedCredentials(cleanEmail, cleanPassword, {
        id: remoteUserId || client.id,
        email: cleanEmail,
        role: 'CLIENT',
        full_name: contactName.trim(),
        timezone,
        client_id: client.id,
        company_name: client.company_name,
      });

      setStep(7); // Advance to confirmed credentials screen

      // Celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E2896A', '#4CAF7D', '#EDEAE2'],
      });

      onClientCreated(client);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected failure during client provisioning.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = () => {
    const portalUrl = `${window.location.origin}/login`;
    const textToCopy = `VectorOps Client Portal Access:
Company: ${companyName}
Portal URL: ${portalUrl}
Login Email: ${email}
Password: ${portalPassword}

Note: Your account is active immediately. You can sign in right away.`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedCredentials(true);
      setTimeout(() => setCopiedCredentials(false), 3000);
    });
  };

  const handleFinish = () => {
    onClose();
    // Reset state
    setStep(1);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setPortalPassword('');
    setRetellWorkspaceUrl('');
    setRetellWorkspaceId('');
    setCreatedClient(null);
    setCopiedCredentials(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Wizard Header */}
        <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#E2896A]/10 text-[#E2896A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#EDEAE2]">Onboard client account</h2>
              <p className="text-xs text-[#8B8D93]">
                {step < 7 ? `Step ${step} of 6: Direct password setup & instant provisioning` : 'Client credentials ready to share'}
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

          {/* STEP 2: CONTACT & DIRECT PASSWORD (NO EMAIL INVITES) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#EDEAE2]">Step 2: Primary contact & portal password</h3>
                <p className="text-xs text-[#8B8D93]">
                  Set credentials directly. No email invite is sent — account is created immediately confirmed.
                </p>
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

                {/* PORTAL PASSWORD FIELD & GENERATE PASSWORD BUTTON */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#E2896A]" />
                      <span>Portal password *</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-[#E2896A] hover:text-[#EA9679] flex items-center gap-1 font-medium transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate password</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Type or click 'Generate password'..."
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B8D93] hover:text-[#EDEAE2] transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                    Set the password for the client. Account creation happens immediately confirmed. You will copy & share these credentials manually after submission.
                  </p>
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

                {/* PART 2: Payment redirect selector */}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#E2896A]" />
                      <span>Payment redirect (optional)</span>
                    </label>
                    <span className="text-[10px] text-[#8B8D93]">Portal "Pay now" action</span>
                  </div>

                  <select
                    value={preferredPaymentLinkId}
                    onChange={(e) => setPreferredPaymentLinkId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  >
                    <option value="">No redirect link (Pay now button hidden in portal)</option>
                    {activePaymentLinks.map((link) => (
                      <option key={link.id} value={link.id}>
                        {link.label} ({link.platform})
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                    Selecting a link enables the client's "Pay now" button when within 7 days of their renewal. If WhatsApp is selected, their exact invoice details are automatically pre-filled!
                  </p>
                </div>
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

                {/* Client's online presence (optional) */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#4CAF7D]" />
                      <span>Client's online presence (optional)</span>
                    </h4>
                    <p className="text-[11px] text-[#8B8D93] mt-0.5">
                      Business website and social links kept on file for reference. Not an OAuth or login connection.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-[#8B8D93] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#4CAF7D]" />
                        <span>Website</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://company.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[#8B8D93] flex items-center gap-1.5">
                        <PlatformIcon platform="INSTAGRAM" size={14} />
                        <span>Instagram</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/company"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[#8B8D93] flex items-center gap-1.5">
                        <PlatformIcon platform="FACEBOOK" size={14} />
                        <span>Facebook</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/company"
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[#8B8D93] flex items-center gap-1.5">
                        <PlatformIcon platform="X" size={14} />
                        <span>X / Twitter</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://x.com/company"
                        value={xUrl}
                        onChange={(e) => setXUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-[#8B8D93] flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#8B8D93]" />
                      <span>Other (LinkedIn, Yelp, Linktree, etc.)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={otherSocialUrl}
                      onChange={(e) => setOtherSocialUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono"
                    />
                  </div>
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
                  Creating the client will execute atomic provisioning in Supabase and generate confirmed portal credentials.
                </p>
              </div>

              <div className="p-4 rounded-xl neo-flat bg-[#1D1F23] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Client organization:</span>
                  <span className="font-semibold text-[#EDEAE2]">{companyName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Primary contact:</span>
                  <span className="text-[#EDEAE2]">{contactName} ({email})</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[#8B8D93]">Portal password:</span>
                  <span className="font-mono text-[#E2896A]">
                    {showPassword ? portalPassword : '••••••••••••'}
                  </span>
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
                  <span className="text-[#8B8D93]">Payment redirect:</span>
                  <span className="font-semibold text-[#EDEAE2]">
                    {preferredPaymentLinkId 
                      ? activePaymentLinks.find(l => l.id === preferredPaymentLinkId)?.label || 'Configured'
                      : 'None (Hidden in portal)'}
                  </span>
                </div>
                {(websiteUrl || instagramUrl || facebookUrl || xUrl || otherSocialUrl) && (
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-[#8B8D93]">Online presence:</span>
                    <span className="text-[#EDEAE2] font-medium text-[11px] truncate max-w-[240px]">
                      {[
                        websiteUrl && 'Website',
                        instagramUrl && 'Instagram',
                        facebookUrl && 'Facebook',
                        xUrl && 'X',
                        otherSocialUrl && 'Other'
                      ].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#8B8D93]">Monthly retainer:</span>
                  <span className="font-mono-numbers font-semibold text-[#4CAF7D]">{formatUSD(selectedPlan.recurring_fee_cents)} / month</span>
                </div>
              </div>

              <div className="text-xs text-[#8B8D93] bg-[#17181B] p-3 rounded-xl space-y-1">
                <span className="text-[#EDEAE2] font-semibold">Atomic actions executed on submit:</span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>Creates confirmed user in Supabase auth (no email verification needed)</li>
                  <li>Inserts profiles record (role: CLIENT) & client_users mapping</li>
                  <li>Inserts clients row with snapshotted plan pricing</li>
                  <li>Generates immediate credentials for manual sharing via WhatsApp/Email</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 7: COMPLETE & CONFIRMATION CREDENTIALS SCREEN */}
          {step === 7 && createdClient && (
            <div className="space-y-6 py-2 animate-in zoom-in-95 duration-200">
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#4CAF7D]/20 text-[#4CAF7D] flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-[#EDEAE2]">Client successfully onboarded!</h3>
                <p className="text-xs text-[#8B8D93] max-w-md mx-auto">
                  {createdClient.company_name} is registered and immediately active. No email invite was sent — share the credentials below directly with your client.
                </p>
              </div>

              {/* HIGH-CONTRAST CREDENTIALS DISPLAY CARD */}
              <div className="p-5 rounded-2xl bg-[#17181B] border border-[#E2896A]/30 shadow-xl space-y-4">
                
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#E2896A]" />
                    <span className="text-xs font-semibold text-[#EDEAE2]">Client portal login credentials</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-[#4CAF7D]/15 text-[#4CAF7D] px-2 py-0.5 rounded">
                    Active & Confirmed
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Portal URL */}
                  <div className="p-2.5 rounded-xl bg-[#1D1F23] flex items-center justify-between gap-2">
                    <span className="text-[#8B8D93] text-[11px] whitespace-nowrap">Portal URL:</span>
                    <span className="font-mono text-[#EDEAE2] truncate select-all">
                      {window.location.origin}/login
                    </span>
                  </div>

                  {/* Email */}
                  <div className="p-2.5 rounded-xl bg-[#1D1F23] flex items-center justify-between gap-2">
                    <span className="text-[#8B8D93] text-[11px] whitespace-nowrap">Login Email:</span>
                    <span className="font-mono font-semibold text-[#EDEAE2] truncate select-all">
                      {createdClient.email}
                    </span>
                  </div>

                  {/* Password */}
                  <div className="p-2.5 rounded-xl bg-[#1D1F23] flex items-center justify-between gap-2">
                    <span className="text-[#8B8D93] text-[11px] whitespace-nowrap">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#E2896A] select-all">
                        {showPassword ? portalPassword : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#8B8D93] hover:text-[#EDEAE2] p-0.5 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* COPY CREDENTIALS BUTTON */}
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    copiedCredentials
                      ? 'bg-[#4CAF7D] text-[#17181B] shadow-[0_0_16px_rgba(76,175,125,0.4)]'
                      : 'btn-primary'
                  }`}
                >
                  {copiedCredentials ? (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      <span>Copied to clipboard! Ready to send via WhatsApp or Email</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy credentials to clipboard</span>
                    </>
                  )}
                </button>

              </div>

              {/* Status Note */}
              <div className="flex items-center justify-center gap-2 text-xs text-[#8B8D93]">
                <ShieldCheck className="w-4 h-4 text-[#4CAF7D]" />
                <span>The client can log in directly at the portal URL with these credentials.</span>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={handleFinish}
                  className="btn-secondary text-xs px-6 py-2"
                >
                  Close & view client record
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Wizard Footer Controls */}
        {step < 7 && (
          <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between border-t border-white/[0.04]">
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
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Provisioning account...' : 'Complete & launch onboarding'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
