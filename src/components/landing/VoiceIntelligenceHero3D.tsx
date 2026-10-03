import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Zap, 
  LogOut, 
  LogIn,
  DollarSign,
  TrendingUp,
  Calendar,
  PhoneCall,
  UserCheck,
  Building2,
  Stethoscope,
  Scale,
  Briefcase,
  ChevronRight,
  Headphones,
  Sliders,
  Award
} from 'lucide-react';
import { formatUSD } from '../../lib/timezone';
import { AuthUser, UserRole } from '../../types';
import { ThemeToggle } from '../../context/ThemeContext';

interface VoiceIntelligenceHero3DProps {
  currentUser?: AuthUser | null;
  onEnterAdmin: () => void;
  onEnterClient: () => void;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
}

export const VoiceIntelligenceHero3D: React.FC<VoiceIntelligenceHero3DProps> = ({
  currentUser,
  onEnterAdmin,
  onEnterClient,
  onOpenAuth,
  onLogout,
}) => {
  // Business ROI & Profit Calculator state
  const [callVolume, setCallVolume] = useState<number>(450); // Monthly calls
  const [dealValue, setDealValue] = useState<number>(1800); // Average deal/client value ($)
  const [selectedIndustry, setSelectedIndustry] = useState<'medical' | 'legal' | 'realestate' | 'services'>('medical');

  // Industry presets and demonstrations
  const industryDemos = {
    medical: {
      name: 'Medical & Dental Practices',
      icon: Stethoscope,
      headline: 'Emergency Patient Triage & Appointment Booking',
      callerScenario: 'Urgent molar tooth pain patient requesting same-day consultation.',
      transcript: [
        { speaker: 'Caller', text: 'Hi, I woke up with severe throbbing on my left molar. Can I see Dr. Reed today?' },
        { speaker: 'VectorOps AI', text: 'I am so sorry you are in pain. I verified Dr. Reed has an emergency triage slot at 10:30 AM. Shall I lock that in for you?' },
        { speaker: 'Caller', text: 'Yes please! 10:30 AM works.' },
        { speaker: 'VectorOps AI', text: 'Confirmed! A secure calendar pass and clinic directions have been sent to your mobile. See you at 10:30 AM.' }
      ],
      result: 'Booked $850 Emergency Treatment · 0 Wait Time · Synced with Dentrix',
      avgRecovery: '+$34,000 / mo'
    },
    legal: {
      name: 'Private Law Practices',
      icon: Scale,
      headline: 'High-Intent Retainer Qualification & Intake',
      callerScenario: 'Commercial tenant dispute inquiry seeking immediate senior counsel.',
      transcript: [
        { speaker: 'Caller', text: 'Hello, our commercial landlord locked us out in violation of our lease. Can we retain counsel today?' },
        { speaker: 'VectorOps AI', text: 'Understood. I have initiated intake for senior litigation counsel. I have reserved tomorrow at 9:00 AM for your intake review. Shall I confirm?' },
        { speaker: 'Caller', text: 'Yes, please confirm immediately.' },
        { speaker: 'VectorOps AI', text: 'Locked in. Retainer documentation and meeting link have been dispatched to your email.' }
      ],
      result: 'Captured $5,000 Retainer Inquiry · Instant Conflict Pre-Check',
      avgRecovery: '+$48,500 / mo'
    },
    realestate: {
      name: 'Luxury Real Estate',
      icon: Building2,
      headline: 'VIP Buyer Pre-Qualification & Tour Scheduling',
      callerScenario: 'High-net-worth inquiry on luxury penthouse property listing.',
      transcript: [
        { speaker: 'Caller', text: 'Hi, I am calling regarding the Harbor Penthouse listing on Ocean Drive.' },
        { speaker: 'VectorOps AI', text: 'Welcome to AeroEstate. The Harbor Penthouse is available for private showings this Saturday at 2 PM or Sunday at 11 AM. Which suits you?' },
        { speaker: 'Caller', text: 'Saturday at 2 PM is great. We have pre-approval ready.' },
        { speaker: 'VectorOps AI', text: 'Perfect. Your private tour credentials with gate access have been SMS confirmed.' }
      ],
      result: 'Pre-Qualified $2.8M Buyer · Private Showing Locked · 0 Phone Tag',
      avgRecovery: '+$62,000 / mo'
    },
    services: {
      name: 'Commercial & Home Services',
      icon: Briefcase,
      headline: '24/7 Dispatch & Instant Deposit Invoicing',
      callerScenario: 'After-hours commercial HVAC failure requiring emergency technician dispatch.',
      transcript: [
        { speaker: 'Caller', text: 'Our warehouse refrigeration compressor stopped running. We need emergency tech dispatch.' },
        { speaker: 'VectorOps AI', text: 'Emergency logged. An on-call technician has been alerted for 45-minute arrival. I have texted you a deposit invoice pass.' },
        { speaker: 'Caller', text: 'Deposit paid via Apple Pay right now. Thank you!' },
        { speaker: 'VectorOps AI', text: 'Payment settled. Technician Marcus is en route. Live GPS tracker is in your text.' }
      ],
      result: '$1,200 Emergency Service Call Captured at 11:42 PM',
      avgRecovery: '+$28,000 / mo'
    }
  };

  // ROI Math
  // Average missed call rate without 24/7 AI: ~28%
  // Average lead conversion rate on answered calls: ~20%
  const missedCallsPerMonth = Math.round(callVolume * 0.28);
  const recoveredDeals = Math.max(1, Math.round(missedCallsPerMonth * 0.22));
  const estimatedRecoveredRevenue = recoveredDeals * dealValue;
  const staffHoursSaved = Math.round((callVolume * 8) / 60); // approx 8 min per call + notes
  const monthlyCostEstimate = 499; // Standard entry tier
  const roiMultiplier = Math.max(2, Math.round((estimatedRecoveredRevenue / monthlyCostEstimate) * 10) / 10);

  const activeDemo = industryDemos[selectedIndustry];
  const ActiveIcon = activeDemo.icon;

  return (
    <div className="min-h-screen bg-[#131417] text-[#EDEAE2] flex flex-col selection:bg-[#E2896A]/30 selection:text-[#EDEAE2]">
      
      {/* Top Telegram/Instagram Dark-Glass Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#131417]/85 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1D1F23] flex items-center justify-center shadow-lg border border-white/[0.05]">
              <div className="w-4 h-4 rounded-full bg-[#E2896A] shadow-[0_0_12px_rgba(226,137,106,0.6)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight text-[#EDEAE2]">VectorOps</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#E2896A]/15 text-[#E2896A] px-2 py-0.5 rounded-md">
                  For Elite Businesses
                </span>
              </div>
              <p className="text-[11px] text-[#8B8D93] hidden sm:block">
                Autonomous voice intelligence & 24/7 revenue capture
              </p>
            </div>
          </div>

          {/* Quick Anchor Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-[#8B8D93]">
            <a href="#roi-calculator" className="hover:text-[#EDEAE2] transition-colors">ROI Calculator</a>
            <a href="#business-impact" className="hover:text-[#EDEAE2] transition-colors">Business Impact</a>
            <a href="#live-preview" className="hover:text-[#EDEAE2] transition-colors">Live Preview</a>
            <a href="#how-it-works" className="hover:text-[#EDEAE2] transition-colors">How It Works</a>
          </nav>

          {/* Auth & Portal Controls */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neo-inset text-xs bg-[#17181B]">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    currentUser.role === 'ADMIN' ? 'bg-[#E2896A]/20 text-[#E2896A]' : 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                  }`}>
                    {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <span className="font-medium text-[#EDEAE2] max-w-[120px] truncate">{currentUser.full_name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    currentUser.role === 'ADMIN' ? 'bg-[#E2896A]/10 text-[#E2896A]' : 'bg-[#4CAF7D]/10 text-[#4CAF7D]'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>

                {currentUser.role === 'ADMIN' ? (
                  <button
                    onClick={onEnterAdmin}
                    className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                  >
                    <span>Admin console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onEnterClient}
                    className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                  >
                    <span>Client portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 rounded-xl bg-[#1D1F23] hover:text-[#E2604F] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#8B8D93]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('CLIENT')}
                  className="btn-secondary text-xs px-3.5 py-2"
                >
                  Client sign in
                </button>

                <button
                  onClick={() => onOpenAuth('ADMIN')}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Admin portal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-16 space-y-20 w-full">
        
        {/* HERO SECTION: Problem, Solution & High-Impact Business Proposition */}
        <section className="text-center max-w-4xl mx-auto space-y-7 pt-4">
          
          {/* Subtle quiet kicker */}
          <div className="inline-flex items-center gap-2 text-xs text-[#8B8D93]">
            <span className="w-2 h-2 rounded-full bg-[#4CAF7D]" />
            <span className="text-[#EDEAE2] font-medium">Enterprise Voice AI Infrastructure</span>
            <span>·</span>
            <span>Zero Voicemail Drop</span>
            <span>·</span>
            <span>Active In 48h</span>
          </div>

          {/* Master Headline Focused on Elite Businesses */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEAE2] leading-[1.12] text-balance">
            Never lose a high-value customer to voicemail again.
          </h1>

          {/* Business Value Narrative */}
          <p className="text-base sm:text-lg text-[#8B8D93] leading-relaxed max-w-2xl mx-auto text-balance">
            VectorOps deploys human-grade 24/7 AI voice operators that answer every inbound call in 1 ring, pre-qualify high-ticket clients, book appointments into your calendar, and recover $35,000+ in lost monthly revenue without adding receptionist payroll.
          </p>

          {/* Call to Action Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <a
              href="#roi-calculator"
              className="btn-primary text-sm px-6 py-3 shadow-[0_4px_20px_rgba(226,137,106,0.3)] hover:shadow-[0_6px_24px_rgba(226,137,106,0.45)]"
            >
              <span>Calculate your business ROI</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>

            <button
              onClick={() => onOpenAuth('CLIENT')}
              className="btn-secondary text-sm px-5 py-3"
            >
              <span>Access client portal</span>
            </button>
          </div>

          {/* 4 Elite Business Advantage Cards (Replaced Internal Agency Numbers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-left">
            <div className="p-5 rounded-[16px] bg-[#1D1F23] border border-white/[0.04] space-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8B8D93]">Revenue Capture</span>
                <TrendingUp className="w-4 h-4 text-[#4CAF7D]" />
              </div>
              <div className="text-2xl font-semibold text-[#4CAF7D] font-mono-numbers">+38%</div>
              <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                Zero dropped callers during peak hours, lunch breaks, and nights.
              </p>
            </div>

            <div className="p-5 rounded-[16px] bg-[#1D1F23] border border-white/[0.04] space-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8B8D93]">Response Speed</span>
                <Clock className="w-4 h-4 text-[#E2896A]" />
              </div>
              <div className="text-2xl font-semibold text-[#EDEAE2] font-mono-numbers">&lt; 450ms</div>
              <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                Natural conversational latency that sounds indistinguishable from human staff.
              </p>
            </div>

            <div className="p-5 rounded-[16px] bg-[#1D1F23] border border-white/[0.04] space-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8B8D93]">Overhead Reduction</span>
                <DollarSign className="w-4 h-4 text-[#E2896A]" />
              </div>
              <div className="text-2xl font-semibold text-[#EDEAE2] font-mono-numbers">72% Saved</div>
              <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                Eliminate multi-shift phone operator payroll, hiring churn, and training time.
              </p>
            </div>

            <div className="p-5 rounded-[16px] bg-[#1D1F23] border border-white/[0.04] space-y-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8B8D93]">Calendar Accuracy</span>
                <Calendar className="w-4 h-4 text-[#4CAF7D]" />
              </div>
              <div className="text-2xl font-semibold text-[#EDEAE2] font-mono-numbers">100% Sync</div>
              <p className="text-[11px] text-[#8B8D93] leading-relaxed">
                Live Google & Outlook booking with strict double-booking collision prevention.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE BUSINESS ROI & PROFIT CALCULATOR */}
        <section id="roi-calculator" className="scroll-mt-24">
          <div className="p-8 sm:p-10 rounded-[24px] bg-[#17181B] border border-white/[0.06] shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.05] pb-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#E2896A] font-semibold mb-1">
                  <Sliders className="w-4 h-4" />
                  <span>Interactive Business Calculator</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEAE2] tracking-tight">
                  How much lost revenue will VectorOps recover for your business?
                </h2>
                <p className="text-xs sm:text-sm text-[#8B8D93] mt-1 max-w-xl">
                  Adjust your average call volume and customer contract value to see exact monthly revenue reclamation.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-[#1D1F23] border border-white/[0.04] self-start md:self-auto">
                <div className="text-[10px] uppercase font-mono text-[#8B8D93]">Industry Benchmark</div>
                <div className="text-xs font-semibold text-[#EDEAE2]">28% Average Unanswered Calls</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Sliders Area (Left 7 Cols) */}
              <div className="lg:col-span-7 space-y-7">
                
                {/* Slider 1: Inbound Call Volume */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#EDEAE2] flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-[#E2896A]" />
                      <span>Monthly Inbound Calls Received</span>
                    </label>
                    <span className="font-mono-numbers text-base font-semibold text-[#EDEAE2]">
                      {callVolume.toLocaleString()} calls / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2500"
                    step="25"
                    value={callVolume}
                    onChange={(e) => setCallVolume(Number(e.target.value))}
                    className="w-full accent-[#E2896A] cursor-pointer h-2 bg-[#25282E] rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[#8B8D93] font-mono">
                    <span>50 calls</span>
                    <span>1,000 calls</span>
                    <span>2,500+ calls</span>
                  </div>
                </div>

                {/* Slider 2: Average Customer / Deal Value */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#EDEAE2] flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-[#4CAF7D]" />
                      <span>Average Customer / Booking Value</span>
                    </label>
                    <span className="font-mono-numbers text-base font-semibold text-[#4CAF7D]">
                      ${dealValue.toLocaleString()} USD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="10000"
                    step="100"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full accent-[#4CAF7D] cursor-pointer h-2 bg-[#25282E] rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-[#8B8D93] font-mono">
                    <span>$200</span>
                    <span>$5,000</span>
                    <span>$10,000+</span>
                  </div>
                </div>

                {/* Breakdown Summary metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#1D1F23]/60 border border-white/[0.03]">
                    <div className="text-[11px] text-[#8B8D93]">Calls normally lost to voicemail</div>
                    <div className="text-lg font-semibold text-[#EDEAE2] font-mono-numbers mt-0.5">
                      ~{missedCallsPerMonth} calls / mo
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#1D1F23]/60 border border-white/[0.03]">
                    <div className="text-[11px] text-[#8B8D93]">Estimated deals recovered</div>
                    <div className="text-lg font-semibold text-[#4CAF7D] font-mono-numbers mt-0.5">
                      +{recoveredDeals} bookings / mo
                    </div>
                  </div>
                </div>

              </div>

              {/* Output Display Card (Right 5 Cols - Telegram/Instagram Luxury Glow) */}
              <div className="lg:col-span-5 p-6 sm:p-7 rounded-[20px] bg-[#1D1F23] border border-[#E2896A]/20 shadow-[0_12px_32px_rgba(0,0,0,0.6)] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E2896A]/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-[#E2896A]">
                    Estimated Recovered Revenue
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold font-mono-numbers text-[#4CAF7D] mt-1 tracking-tight">
                    +${estimatedRecoveredRevenue.toLocaleString()}
                    <span className="text-sm font-normal text-[#8B8D93] ml-1">/ month</span>
                  </div>
                  <div className="text-xs text-[#8B8D93] mt-1 font-mono-numbers">
                    +${(estimatedRecoveredRevenue * 12).toLocaleString()} annualized new revenue
                  </div>
                </div>

                <div className="space-y-3 border-t border-b border-white/[0.06] py-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B8D93]">Staff Hours Reclaimed:</span>
                    <span className="font-semibold text-[#EDEAE2] font-mono-numbers">{staffHoursSaved} hours / mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B8D93]">Inbound Call Answer Rate:</span>
                    <span className="font-semibold text-[#4CAF7D] font-mono-numbers">99.9% (1-ring pickup)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B8D93]">Calculated ROI Multiplier:</span>
                    <span className="font-semibold text-[#E2896A] font-mono-numbers">{roiMultiplier}x Investment</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenAuth('CLIENT')}
                  className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 font-semibold"
                >
                  <span>Start with VectorOps for your business</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* SECTION 3: REAL BUSINESS IMPACT & WHY TRADITIONAL PHONES FAIL */}
        <section id="business-impact" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEAE2] tracking-tight">
              Why elite businesses replace voicemail with VectorOps
            </h2>
            <p className="text-xs sm:text-sm text-[#8B8D93]">
              The hidden cost of missed calls is the #1 leak in high-ticket client acquisition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Advantage 1 */}
            <div className="p-6 rounded-[20px] bg-[#1D1F23] border border-white/[0.04] space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#E2896A]/10 text-[#E2896A] flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-base font-semibold text-[#EDEAE2]">67% of callers never leave voicemail</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">
                When a high-intent caller hits your voicemail or hears a busy signal, they do not wait. They immediately click the next competitor on Google. VectorOps answers in 1 ring, keeping every lead in your pipeline.
              </p>
            </div>

            {/* Advantage 2 */}
            <div className="p-6 rounded-[20px] bg-[#1D1F23] border border-white/[0.04] space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#4CAF7D]/10 text-[#4CAF7D] flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-base font-semibold text-[#EDEAE2]">Autonomous calendar locking</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">
                Stop playing phone tag. The voice agent verifies your real-time doctor, attorney, or consultant availability, collects client information, and locks appointments directly into your CRM with zero staff intervention.
              </p>
            </div>

            {/* Advantage 3 */}
            <div className="p-6 rounded-[20px] bg-[#1D1F23] border border-white/[0.04] space-y-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-[#E2896A]/10 text-[#E2896A] flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-base font-semibold text-[#EDEAE2]">Instant deposit & payment triage</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">
                For emergency callouts, consultations, or premium bookings, VectorOps generates and sends an instant SMS payment link via Stripe while the caller is still on the line, securing commitment before they hang up.
              </p>
            </div>

          </div>
        </section>

        {/* SECTION 4: LIVE PRODUCTION BUSINESS PREVIEW (TELEGRAM / INSTAGRAM LUXURY UI) */}
        <section id="live-preview" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-[#4CAF7D] mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4CAF7D] animate-pulse" />
                <span>Industry Operations Showcase</span>
              </div>
              <h2 className="text-2xl font-semibold text-[#EDEAE2] tracking-tight">
                See how VectorOps performs in your exact industry
              </h2>
            </div>

            {/* Sector switcher tabs (Telegram-style clean segmented controls) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#17181B] border border-white/[0.05] overflow-x-auto">
              {(Object.keys(industryDemos) as Array<keyof typeof industryDemos>).map((key) => {
                const item = industryDemos[key];
                const isSelected = selectedIndustry === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedIndustry(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#1D1F23] text-[#EDEAE2] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                        : 'text-[#8B8D93] hover:text-[#EDEAE2]'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#17181B] border border-white/[0.06] shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E2896A]/10 text-[#E2896A] flex items-center justify-center">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#EDEAE2]">{activeDemo.headline}</h3>
                  <p className="text-xs text-[#8B8D93]">{activeDemo.callerScenario}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-[#8B8D93] uppercase font-mono">Proven ROI</div>
                  <div className="text-sm font-semibold text-[#4CAF7D] font-mono-numbers">{activeDemo.avgRecovery}</div>
                </div>
              </div>
            </div>

            {/* Transcript dialogue box */}
            <div className="space-y-3">
              <div className="text-xs text-[#8B8D93] font-medium">Real-Time Inbound Voice Interaction:</div>
              <div className="space-y-2.5 max-w-3xl">
                {activeDemo.transcript.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                      msg.speaker === 'Caller'
                        ? 'bg-[#1D1F23] text-[#EDEAE2] mr-8 border border-white/[0.03]'
                        : 'bg-[#1D1F23] text-[#EDEAE2] ml-8 border border-[#E2896A]/20 shadow-[0_2px_10px_rgba(226,137,106,0.08)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-[11px] ${msg.speaker === 'Caller' ? 'text-[#8B8D93]' : 'text-[#E2896A]'}`}>
                        {msg.speaker}
                      </span>
                      <span className="text-[10px] text-[#8B8D93] font-mono">00:0{idx * 4 + 2}s</span>
                    </div>
                    <p className="text-[#EDEAE2]">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcome Banner */}
            <div className="p-4 rounded-xl bg-[#1D1F23] border border-[#4CAF7D]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#4CAF7D] flex-shrink-0" />
                <span className="text-xs font-semibold text-[#EDEAE2]">{activeDemo.result}</span>
              </div>
              <button
                onClick={() => onOpenAuth('CLIENT')}
                className="btn-primary text-xs px-3.5 py-1.5 self-start sm:self-auto"
              >
                Deploy this agent
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS (SIMPLE 3 STEPS) */}
        <section id="how-it-works" className="space-y-8 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEAE2] tracking-tight">
              Up and running in 48 hours
            </h2>
            <p className="text-xs sm:text-sm text-[#8B8D93]">
              Zero disruption to your existing phone numbers, calendar, or clinic workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[20px] bg-[#1D1F23] border border-white/[0.04] space-y-3">
              <div className="text-xs font-mono text-[#E2896A] font-bold">STEP 01</div>
              <h3 className="text-base font-semibold text-[#EDEAE2]">Forward Your Calls</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">
                Keep your existing business phone number. Simply set up automatic call forwarding when your lines are busy, on weekends, or 24/7.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-[#1D1F23] border border-white/[0.04] space-y-3">
              <div className="text-xs font-mono text-[#E2896A] font-bold">STEP 02</div>
              <h3 className="text-base font-semibold text-[#EDEAE2]">Connect Your Calendar & CRM</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">
                Connect your Google Calendar, Outlook, Dentrix, Clio, or custom CRM in 1 click. VectorOps checks availability in real-time.
              </p>
            </div>

            <div className="p-6 rounded-[20px] bg-[#1D1F23] border border-white/[0.04] space-y-3">
              <div className="text-xs font-mono text-[#4CAF7D] font-bold">STEP 03</div>
              <h3 className="text-base font-semibold text-[#EDEAE2]">Watch Bookings Roll In</h3>
              <p className="text-xs text-[#8B8D93] leading-relaxed">
                Access your Client Portal to review live call transcripts, listen to recordings, track revenue recovered, and inspect scheduled appointments.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: READY TO TRANSFORM YOUR BUSINESS CALL CONVERSIONS */}
        <section className="p-10 sm:p-12 rounded-[28px] bg-gradient-to-b from-[#1D1F23] to-[#17181B] border border-white/[0.08] text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#E2896A]/10 to-transparent pointer-events-none" />
          
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#EDEAE2]">
              Ready to recover every lost dollar from missed calls?
            </h2>
            <p className="text-sm text-[#8B8D93] leading-relaxed">
              Join elite medical clinics, law firms, and commercial enterprises using VectorOps to autonomously capture and convert high-ticket demand.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onOpenAuth('CLIENT')}
              className="btn-primary text-sm px-6 py-3 shadow-[0_4px_20px_rgba(226,137,106,0.3)]"
            >
              <span>Get started with VectorOps</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={onEnterAdmin}
              className="btn-secondary text-sm px-5 py-3"
            >
              <span>Administrator console</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-[#8B8D93] pt-4 font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7D]" />
              <span>No Contract Lock-In</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7D]" />
              <span>48-Hour Setup</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7D]" />
              <span>Full HIPAA / SOC-2 Support</span>
            </span>
          </div>
        </section>

      </main>

      {/* Production Ready Footer */}
      <footer className="w-full bg-[#17181B] border-t border-white/[0.05] py-10 mt-16 text-xs text-[#8B8D93]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="font-semibold text-[#EDEAE2] mb-2">VectorOps Enterprise</div>
            <p className="leading-relaxed">
              Autonomous voice intelligence platform powering elite practices, law firms, and commercial services.
            </p>
          </div>

          <div>
            <div className="font-semibold text-[#EDEAE2] mb-2">Integer Financial Engine</div>
            <p className="leading-relaxed">
              Authoritative USD cents accounting ledger eliminating floating-point rounding errors on retainers and setup fees.
            </p>
          </div>

          <div>
            <div className="font-semibold text-[#EDEAE2] mb-2">Canonical UTC Precision</div>
            <p className="leading-relaxed">
              All appointments stored in UTC with real-time translation into client timezones and double-booking conflict guards.
            </p>
          </div>

          <div>
            <div className="font-semibold text-[#EDEAE2] mb-2">Quick Navigation</div>
            <div className="space-y-1.5">
              <div><button onClick={() => onOpenAuth('CLIENT')} className="hover:text-[#EDEAE2] transition-colors">Client Portal Login</button></div>
              <div><button onClick={() => onOpenAuth('ADMIN')} className="hover:text-[#EDEAE2] transition-colors">Administrator Access</button></div>
              <div><a href="#roi-calculator" className="hover:text-[#EDEAE2] transition-colors">Revenue Calculator</a></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© {new Date().getFullYear()} VectorOps Systems. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>SOC-2 Type II Certified</span>
            <span>·</span>
            <span>HIPAA Compliant</span>
            <span>·</span>
            <span>Canonical UTC</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
