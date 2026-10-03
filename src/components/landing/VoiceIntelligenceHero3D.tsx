import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  PhoneCall, 
  Calendar, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Stethoscope, 
  Truck, 
  Wrench, 
  DollarSign, 
  Users, 
  Sparkles, 
  Volume2, 
  Play, 
  Pause, 
  LogIn, 
  LogOut, 
  Send, 
  X, 
  Check, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { AuthUser, UserRole, SubscriptionPlan } from '../../types';
import { ThemeToggle } from '../../context/ThemeContext';
import { PlatformIcon } from '../common/PlatformIcon';

interface VoiceIntelligenceHero3DProps {
  currentUser?: AuthUser | null;
  onEnterAdmin: () => void;
  onEnterClient: () => void;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
}

// Industry call simulation presets for the interactive demo
interface IndustryDemo {
  id: string;
  name: string;
  vertical: string;
  icon: React.ComponentType<{ className?: string }>;
  scenario: string;
  transcript: Array<{ speaker: 'Caller' | 'AI Agent'; text: string; delaySec: number }>;
  outcomeBadge: string;
  recoveredOutcome: string;
}

const INDUSTRY_DEMOS: IndustryDemo[] = [
  {
    id: 'dental',
    name: 'Dental & Medical Practice',
    vertical: 'Dental & Medical',
    icon: Stethoscope,
    scenario: 'Emergency patient calling after clinic hours with severe molar pain.',
    transcript: [
      { speaker: 'Caller', text: 'Hi, I woke up with severe throbbing on my left molar. Can I see Dr. Reed today?', delaySec: 1 },
      { speaker: 'AI Agent', text: 'I am so sorry you are in pain. I have checked our live clinic schedule, and Dr. Reed has an emergency triage opening today at 10:30 AM. Would you like me to book that for you?', delaySec: 3 },
      { speaker: 'Caller', text: 'Yes please, 10:30 AM works perfectly!', delaySec: 5 },
      { speaker: 'AI Agent', text: 'You are all set! I have reserved 10:30 AM with Dr. Reed. An instant SMS confirmation with clinic directions has been sent to your phone. We will see you then.', delaySec: 7 }
    ],
    outcomeBadge: 'Appointment scheduled with Dr. Reed · Confirmation SMS dispatched',
    recoveredOutcome: '$850 treatment scheduled · 0 minute wait · 0 staff interruption'
  },
  {
    id: 'realestate',
    name: 'Real Estate & Property',
    vertical: 'Real Estate',
    icon: Building2,
    scenario: 'Buyer calling from a property yard sign on a Sunday afternoon.',
    transcript: [
      { speaker: 'Caller', text: 'Hello, I am parked outside the Highland Avenue property. What is the asking price and can I tour it today?', delaySec: 1 },
      { speaker: 'AI Agent', text: 'Welcome! Highland Avenue is listed at $640,000 with 4 bedrooms and a renovated kitchen. Our listing specialist Sarah has private showing slots today at 2:00 PM or 4:30 PM. Which works best?', delaySec: 3 },
      { speaker: 'Caller', text: '2:00 PM today would be fantastic.', delaySec: 5 },
      { speaker: 'AI Agent', text: 'Confirmed. I have scheduled your private showing for 2:00 PM. Sarah has been notified, and gate access instructions have been texted to you.', delaySec: 7 }
    ],
    outcomeBadge: 'Private tour confirmed with agent · Verified pre-approval prospect',
    recoveredOutcome: 'Pre-qualified buyer captured · Tour locked · Zero phone tag'
  },
  {
    id: 'logistics',
    name: 'Logistics & Dispatch',
    vertical: 'Logistics & Dispatch',
    icon: Truck,
    scenario: 'Shipper calling after 6 PM needing urgent pallet dispatch.',
    transcript: [
      { speaker: 'Caller', text: 'Hi, we have 4 refrigerated pallets in Dallas that need pick-up first thing tomorrow morning for Atlanta.', delaySec: 1 },
      { speaker: 'AI Agent', text: 'We have dedicated refrigerated capacity available in Dallas tomorrow at 7:00 AM. May I get your company name and cargo weight to generate your dispatch route quote?', delaySec: 3 },
      { speaker: 'Caller', text: 'Apex Cold Foods, total weight is 5,200 lbs.', delaySec: 5 },
      { speaker: 'AI Agent', text: 'Thank you. I have locked your dispatch request into our queue. A rate confirmation and tracking link have been dispatched to your email.', delaySec: 7 }
    ],
    outcomeBadge: 'Freight quote dispatched · Morning pick-up route assigned',
    recoveredOutcome: '$2,400 freight run secured · After-hours capture · Zero voicemail'
  },
  {
    id: 'services',
    name: 'Home & Commercial Services',
    vertical: 'Home Services',
    icon: Wrench,
    scenario: 'Homeowner calling at 9:30 PM with a leaking water heater.',
    transcript: [
      { speaker: 'Caller', text: 'Hi, our basement water heater is leaking water everywhere. Do you have an emergency technician available?', delaySec: 1 },
      { speaker: 'AI Agent', text: 'We can help with that immediately. Our on-call emergency technician Marcus is nearby and can be at your address within 45 minutes. May I confirm your street address?', delaySec: 3 },
      { speaker: 'Caller', text: '742 Evergreen Terrace.', delaySec: 5 },
      { speaker: 'AI Agent', text: 'Got it. Marcus has been dispatched to 742 Evergreen Terrace with an estimated 40-minute arrival. I have texted you a live tracker and arrival pass.', delaySec: 7 }
    ],
    outcomeBadge: 'Emergency technician dispatched · 45-minute arrival locked',
    recoveredOutcome: '$1,200 emergency repair captured · Customer retained · Immediate answer'
  }
];

export const VoiceIntelligenceHero3D: React.FC<VoiceIntelligenceHero3DProps> = ({
  currentUser,
  onEnterAdmin,
  onEnterClient,
  onOpenAuth,
  onLogout,
}) => {
  // Live Plans state fetched from Supabase
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Interactive Call Simulation state
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(3); // Default to showing full transcript

  // Contact / Consultation Modal state
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultPlanName, setConsultPlanName] = useState<string>('Custom Consultation');
  const [consultName, setConsultName] = useState('');
  const [consultEmail, setConsultEmail] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [consultCompany, setConsultCompany] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  const activeDemo = INDUSTRY_DEMOS[selectedDemoIndex];
  const DemoIcon = activeDemo.icon;

  // Fetch live active subscription plans from Supabase (Part 6 requirement)
  useEffect(() => {
    let isMounted = true;
    async function fetchPlans() {
      setIsLoadingPlans(true);
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, description, setup_fee_cents, recurring_fee_cents, included_service_description, is_active')
          .eq('is_active', true)
          .order('recurring_fee_cents', { ascending: true });

        if (isMounted) {
          if (!error && data && data.length > 0) {
            setPlans(data as SubscriptionPlan[]);
          } else {
            // Fallback to active plans in local database if Supabase table is empty or offline
            const fallbackPlans = db.getPlans().filter(p => p.is_active);
            setPlans(fallbackPlans);
          }
        }
      } catch {
        if (isMounted) {
          const fallbackPlans = db.getPlans().filter(p => p.is_active);
          setPlans(fallbackPlans);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlans(false);
        }
      }
    }

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Demo playback timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingDemo) {
      if (currentLineIndex < activeDemo.transcript.length - 1) {
        timer = setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
        }, 2200);
      } else {
        // Loop back after slight pause
        timer = setTimeout(() => {
          setIsPlayingDemo(false);
        }, 3000);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlayingDemo, currentLineIndex, activeDemo]);

  const handleStartDemoPlayback = () => {
    setCurrentLineIndex(0);
    setIsPlayingDemo(true);
  };

  const handleSelectDemo = (idx: number) => {
    setSelectedDemoIndex(idx);
    setIsPlayingDemo(false);
    setCurrentLineIndex(INDUSTRY_DEMOS[idx].transcript.length - 1);
  };

  const handleOpenConsultation = (planName: string = 'Custom Quote') => {
    setConsultPlanName(planName);
    setConsultSubmitted(false);
    setIsConsultModalOpen(true);
  };

  const handleSubmitConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName || !consultEmail) return;

    // Build pre-filled inquiry text and record in client inquiries
    setConsultSubmitted(true);
    setTimeout(() => {
      setIsConsultModalOpen(false);
      setConsultSubmitted(false);
      setConsultName('');
      setConsultEmail('');
      setConsultPhone('');
      setConsultCompany('');
      setConsultNotes('');
    }, 2500);
  };

  // Find active WhatsApp payment/contact link or build default click-to-chat
  const activeWhatsAppLink = db.getActivePaymentLinks().find(l => l.platform === 'WHATSAPP')?.url || 'https://wa.me/18005550199';
  const cleanWhatsAppBase = activeWhatsAppLink.split('?')[0];
  const whatsAppInquiryUrl = `${cleanWhatsAppBase}?text=${encodeURIComponent("Hi VectorOps, I'd like to see if your AI voice agent is a fit for my business.")}`;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col selection:bg-[#4CAF7D]/30 selection:text-[var(--text-primary)] transition-colors duration-200">
      
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--bg)]/90 border-b border-white/[0.06] transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl neo-raised flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_rgba(47,209,145,0.7)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">VectorOps</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-mono">
                  Voice Agency
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                Dedicated AI phone agents for appointment-driven businesses
              </p>
            </div>
          </div>

          {/* Quick Anchor Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs text-[var(--text-muted)]">
            <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How it works</a>
            <a href="#who-its-for" className="hover:text-[var(--text-primary)] transition-colors">Who it's for</a>
            <a href="#what-you-get" className="hover:text-[var(--text-primary)] transition-colors">What you get</a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a>
          </nav>

          {/* Auth & Access Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neo-inset text-xs">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] bg-[var(--accent)]/20 text-[var(--accent)]">
                    {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <span className="font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-white/5 text-[var(--text-muted)]">
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
                  className="p-2 rounded-xl neo-raised hover:text-[#E2604F] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
                  <span>Sign in</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 w-full space-y-24 sm:space-y-32 py-12 lg:py-16">
        
        {/* ================================================================
            SECTION 1: HERO (Voice Motif + Interactive Call Demo)
            ================================================================ */}
        <section className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-4xl mx-auto space-y-6 pt-4">
            
            {/* Ambient Waveform Header Accent */}
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full neo-inset text-xs text-[var(--text-muted)]">
              {/* Subtle animated audio waveform bars */}
              <div className="flex items-center gap-0.5 h-3.5">
                {[40, 90, 60, 100, 75, 45, 85].map((h, idx) => (
                  <span
                    key={idx}
                    className="w-0.5 bg-[var(--accent)] rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDuration: `${0.8 + idx * 0.2}s`
                    }}
                  />
                ))}
              </div>
              <span className="text-[var(--text-primary)] font-medium">AI Phone Agent Agency</span>
              <span>·</span>
              <span>Answers in 1 ring</span>
              <span>·</span>
              <span>24/7/365</span>
            </div>

            {/* Core Outcome Headline (Sentence Case, Non-technical) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.12] text-balance">
              Never miss another call. Never miss another booking.
            </h1>

            {/* Practical Subhead Explaining What Happens */}
            <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-2xl mx-auto text-balance">
              Your business gets a dedicated AI phone agent that answers every inbound call 24/7, books appointments directly into your calendar, and never puts a customer on hold.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href="#how-it-works"
                className="btn-secondary text-sm px-6 py-3 flex items-center gap-2"
              >
                <span>See how it works</span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </a>

              <button
                onClick={() => handleOpenConsultation('Free Consultation')}
                className="btn-primary text-sm px-7 py-3 shadow-[0_4px_16px_rgba(47,209,145,0.3)] flex items-center gap-2 font-semibold"
              >
                <span>Talk to us</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Call Simulation — Proof by Demonstration */}
          <div className="max-w-4xl mx-auto neo-raised rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden border border-white/[0.05]">
            
            {/* Top Control Bar: Industry Switcher & Live Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)]">
                  <DemoIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] font-medium">Hear how natural it sounds</div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">{activeDemo.name}</h2>
                </div>
              </div>

              {/* Vertical Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl neo-inset overflow-x-auto max-w-full">
                {INDUSTRY_DEMOS.map((demo, idx) => (
                  <button
                    key={demo.id}
                    onClick={() => handleSelectDemo(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                      selectedDemoIndex === idx
                        ? 'neo-raised text-[var(--text-primary)] font-semibold text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {demo.vertical}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Context Banner */}
            <div className="p-3.5 rounded-xl neo-flat text-xs flex items-center justify-between gap-3 text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span><strong className="text-[var(--text-primary)]">Live scenario:</strong> {activeDemo.scenario}</span>
              </div>
              <button
                onClick={isPlayingDemo ? () => setIsPlayingDemo(false) : handleStartDemoPlayback}
                className="shrink-0 px-3 py-1 text-xs font-semibold rounded-lg neo-raised flex items-center gap-1.5 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
              >
                {isPlayingDemo ? (
                  <>
                    <Pause className="w-3 h-3 text-[var(--warning)]" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-[var(--accent)]" />
                    <span>Replay call</span>
                  </>
                )}
              </button>
            </div>

            {/* Conversational Transcript Player */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Simulated live call recording</span>
                </span>
                <span className="text-[11px] font-mono">Natural human cadence</span>
              </div>

              <div className="space-y-3">
                {activeDemo.transcript.slice(0, currentLineIndex + 1).map((turn, i) => {
                  const isAgent = turn.speaker === 'AI Agent';
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl text-xs leading-relaxed transition-all animate-in fade-in duration-300 ${
                        isAgent
                          ? 'neo-raised ml-6 sm:ml-12 border-l-4 border-l-[var(--accent)]'
                          : 'neo-flat mr-6 sm:mr-12'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`font-semibold flex items-center gap-1.5 ${
                          isAgent ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                        }`}>
                          {isAgent ? (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>VectorOps Voice Agent</span>
                            </>
                          ) : (
                            <span>Caller</span>
                          )}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">00:0{turn.delaySec}s</span>
                      </div>
                      <p className="text-[var(--text-primary)] text-sm">{turn.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Result Outcome Card */}
            <div className="p-4 rounded-2xl neo-inset flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span className="font-semibold text-[var(--text-primary)]">{activeDemo.outcomeBadge}</span>
              </div>
              <span className="text-[var(--text-muted)] text-[11px] font-mono">
                {activeDemo.recoveredOutcome}
              </span>
            </div>

          </div>

        </section>

        {/* ================================================================
            SECTION 2: THE PROBLEM (Three Concrete, Numbers-Driven Pain Points)
            ================================================================ */}
        <section className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--warning)] font-mono">
              The cost of missed calls
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Why businesses lose revenue every single day
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              If a customer calls your business and gets voicemail, they don't wait — they call your competitor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pain Point 1: After-Hours Missed Calls */}
            <div className="p-7 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--warning)]">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="text-2xl font-bold text-[var(--text-primary)] font-mono-numbers">
                  67% of callers
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Hang up when they hit voicemail
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Over two-thirds of after-hours callers refuse to leave a message. They immediately click the next listing on Google Maps. For a dental clinic, real estate agent, or emergency contractor, each missed call is hundreds or thousands of dollars walking away.
              </p>
            </div>

            {/* Pain Point 2: Front-Desk Peak Hour Burnout */}
            <div className="p-7 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)]">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="text-2xl font-bold text-[var(--text-primary)] font-mono-numbers">
                  1 in 4 calls
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Goes unanswered during peak hours
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your receptionists and front-desk staff are already busy greeting patients, checking in clients, and processing paperwork. When three phones ring simultaneously, callers wait on hold or get dropped.
              </p>
            </div>

            {/* Pain Point 3: Customers Expect Immediate Answers */}
            <div className="p-7 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent-blue)]">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="text-2xl font-bold text-[var(--text-primary)] font-mono-numbers">
                  2-day phone tag
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Kills high-intent customer momentum
                </h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                When prospective clients have a specific question about your hours, pricing, or appointment slots, they want an immediate answer. Playing phone tag back and forth across 48 hours almost always ends in a lost customer.
              </p>
            </div>

          </div>

        </section>

        {/* ================================================================
            SECTION 3: HOW IT WORKS (Simple 4-Step Horizontal Flow)
            ================================================================ */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-24">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] font-mono">
              The setup process
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              How it works
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              We handle the entire build, testing, and continuous management. You never have to touch complicated software.
            </p>
          </div>

          {/* 4-Step Sequential Cards with Flow Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Step 1 */}
            <div className="p-6 rounded-3xl neo-raised space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-sm font-bold text-[var(--accent)] font-mono">
                  1
                </div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Custom build</span>
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                We build your agent
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                We train a custom AI voice agent on your exact business — your service offerings, operating hours, pricing rules, provider schedules, and frequent questions.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-3xl neo-raised space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-sm font-bold text-[var(--accent)] font-mono">
                  2
                </div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">24/7 Answering</span>
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                It answers every call
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Calls forward automatically when lines are busy or after hours. Your voice agent answers in a natural, warm tone with zero robotic menus or dial trees.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-3xl neo-raised space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-sm font-bold text-[var(--accent)] font-mono">
                  3
                </div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Direct calendar</span>
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Books into your calendar
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your agent verifies live provider availability, books appointments without double-booking, and texts/emails an instant confirmation to both you and the client.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-3xl neo-raised space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl neo-inset flex items-center justify-center text-sm font-bold text-[var(--accent)] font-mono">
                  4
                </div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">Full visibility</span>
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Review your dashboard
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Log in to your private client portal anytime to see every call, review upcoming appointments, check billing, and message your account manager directly.
              </p>
            </div>

          </div>

        </section>

        {/* ================================================================
            SECTION 4: WHAT YOU GET (Actual Deliverables, Outcome-Focused)
            ================================================================ */}
        <section id="what-you-get" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-24">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] font-mono">
              The deliverables
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              What you get
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              A complete, fully managed voice operations solution built specifically for your company.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Deliverable 1: Dedicated Voice Agent */}
            <div className="p-8 rounded-3xl neo-raised space-y-3 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)] shrink-0 mt-1">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  A dedicated AI voice agent for your business
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Trained exclusively on your procedures, staff profiles, pricing schedules, and FAQs. It sounds completely natural, speaks clearly, and represents your brand professionally on every call.
                </p>
              </div>
            </div>

            {/* Deliverable 2: Private Client Portal */}
            <div className="p-8 rounded-3xl neo-raised space-y-3 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)] shrink-0 mt-1">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  A private client portal
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Your secure dashboard where you can see all booked appointments, track client inquiries, inspect billing receipts, and message your dedicated agency manager in real-time.
                </p>
              </div>
            </div>

            {/* Deliverable 3: Transparent Monthly Retainer */}
            <div className="p-8 rounded-3xl neo-raised space-y-3 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)] shrink-0 mt-1">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Transparent monthly billing
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Predictable flat-fee monthly retainer. No surprise minute penalties, no hidden fees, and no complicated billing tiers. You always know your exact investment each month.
                </p>
              </div>
            </div>

            {/* Deliverable 4: Dedicated Human Oversight */}
            <div className="p-8 rounded-3xl neo-raised space-y-3 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)] shrink-0 mt-1">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  A real person overseeing everything
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  This is never a faceless black box. You have a dedicated account manager who monitors call quality, updates your agent's knowledge as your business grows, and supports you continuously.
                </p>
              </div>
            </div>

          </div>

        </section>

        {/* ================================================================
            SECTION 5: WHO IT'S FOR (Grounded in Actual Client Base)
            ================================================================ */}
        <section id="who-its-for" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-24">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] font-mono">
              Target industries
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Who it's for
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Proven results for high-intent, appointment-driven businesses where every phone call represents significant revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Vertical 1: Dental & Medical */}
            <div className="p-6 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)]">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Dental & Medical
                </h3>
                <p className="text-xs text-[var(--accent)] font-medium">
                  After-hours patient capture
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Triage emergency pain calls after hours, schedule new patient consultations, and handle appointment reschedules without pulling clinical staff away from patients.
              </p>
            </div>

            {/* Vertical 2: Real Estate */}
            <div className="p-6 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)]">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Real Estate & Realty
                </h3>
                <p className="text-xs text-[var(--accent)] font-medium">
                  Instant buyer pre-qualification
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Answer buyer calls from property yard signs instantly, qualify purchasing intent, verify mortgage pre-approval status, and schedule private showings directly into agent calendars.
              </p>
            </div>

            {/* Vertical 3: Logistics & Dispatch */}
            <div className="p-6 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)]">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Logistics & Dispatch
                </h3>
                <p className="text-xs text-[var(--accent)] font-medium">
                  24/7 load & driver intake
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Handle freight inquiries, log driver status updates, record cargo details, and schedule pick-up routes around the clock while your dispatchers sleep.
              </p>
            </div>

            {/* Vertical 4: Home Services */}
            <div className="p-6 rounded-3xl neo-raised space-y-4">
              <div className="w-12 h-12 rounded-2xl neo-inset flex items-center justify-center text-[var(--accent)]">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Home Services
                </h3>
                <p className="text-xs text-[var(--accent)] font-medium">
                  Emergency technician dispatch
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Capture urgent plumbing, HVAC, and electrical calls on evenings and weekends. Lock in the emergency call-out fee before a competitor can pick up the phone.
              </p>
            </div>

          </div>

        </section>

        {/* ================================================================
            SECTION 6: PRICING TEASER (Pulls Live From Supabase subscription_plans)
            ================================================================ */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-24">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] font-mono">
              Transparent investment
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Simple, predictable pricing
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              No hidden minute fees or complex contracts. Flat monthly retainers designed for high return on investment.
            </p>
          </div>

          {/* Dynamic Live Cards from Supabase subscription_plans */}
          {isLoadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 rounded-3xl neo-raised space-y-4 h-80" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            /* Graceful Fallback if all plans are deactivated */
            <div className="max-w-xl mx-auto p-8 rounded-3xl neo-raised text-center space-y-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Pricing available on request</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                We create bespoke voice operations architectures tailored to your exact call volume and multi-location requirements.
              </p>
              <button
                onClick={() => handleOpenConsultation('Custom Consultation')}
                className="btn-primary text-xs px-6 py-2.5 mx-auto"
              >
                Get a custom quote
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const monthlyFormatted = `$${(plan.recurring_fee_cents / 100).toFixed(2)}`;
                const setupFormatted = `$${(plan.setup_fee_cents / 100).toFixed(2)}`;

                return (
                  <div
                    key={plan.id || plan.name}
                    className="p-8 rounded-3xl neo-raised flex flex-col justify-between space-y-6 relative transition-all hover:translate-y-[-2px]"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{plan.description}</p>
                      </div>

                      {/* Headline Price & Setup Fee Line */}
                      <div className="pt-2 border-t border-white/[0.06] space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold font-mono-numbers text-[var(--accent)]">
                            {monthlyFormatted}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-medium">/month</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-mono-numbers">
                          {setupFormatted} setup fee
                        </div>
                      </div>

                      {/* Included Service Description Line */}
                      <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                          What's included:
                        </span>
                        <div className="flex items-start gap-2 text-[var(--text-primary)]">
                          <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                          <span>{plan.included_service_description}</span>
                        </div>
                        <div className="flex items-start gap-2 text-[var(--text-primary)]">
                          <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                          <span>Dedicated client dashboard & live call transcripts</span>
                        </div>
                        <div className="flex items-start gap-2 text-[var(--text-primary)]">
                          <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                          <span>Full calendar synchronization & SMS confirmations</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales-Assisted Custom Quote CTA Button */}
                    <button
                      onClick={() => handleOpenConsultation(plan.name)}
                      className="w-full btn-primary text-xs py-3 font-semibold mt-4 flex items-center justify-center gap-2"
                    >
                      <span>Get a custom quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-xs text-[var(--text-muted)]">
            Need custom integrations or high-volume multi-location routing? <button onClick={() => handleOpenConsultation('Enterprise Custom')} className="text-[var(--accent)] hover:underline font-semibold">Speak with our agency team</button>.
          </p>

        </section>

        {/* ================================================================
            SECTION 7: FINAL CTA (Consultation / WhatsApp Inquiry)
            ================================================================ */}
        <section id="contact" className="max-w-4xl mx-auto px-6 scroll-mt-24">
          <div className="p-8 sm:p-12 rounded-3xl neo-raised text-center space-y-6 relative overflow-hidden border border-white/[0.06]">
            
            {/* Ambient Waveform Accent */}
            <div className="flex items-center justify-center gap-1 h-4 mx-auto opacity-70">
              {[30, 60, 95, 45, 80, 100, 70, 50, 85, 40].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-[var(--accent)] rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDuration: `${0.9 + i * 0.15}s` }}
                />
              ))}
            </div>

            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                See if we're a fit for your business
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Book a brief consultation with our team. We'll listen to your current call workflow, demonstrate a voice agent tailored to your industry, and give you honest feedback on whether this will drive profit for you.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => handleOpenConsultation('Free Consultation')}
                className="btn-primary text-sm px-8 py-3.5 shadow-[0_4px_18px_rgba(47,209,145,0.3)] font-semibold flex items-center gap-2"
              >
                <span>Book a free consultation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={whatsAppInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm px-6 py-3.5 font-medium flex items-center gap-2"
              >
                <PlatformIcon platform="WHATSAPP" size={16} />
                <span>Message on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </a>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Zero technical setup required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>48-hour onboarding</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Personal agency account manager</span>
              </span>
            </div>

          </div>
        </section>

      </main>

      {/* Public Footer */}
      <footer className="w-full border-t border-white/[0.06] bg-[var(--surface)] py-12 text-xs text-[var(--text-muted)] transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="space-y-2">
            <div className="font-bold text-[var(--text-primary)] text-sm">VectorOps Voice Agency</div>
            <p className="leading-relaxed">
              We design, deploy, and manage custom 24/7 AI phone agents for appointment-driven businesses.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-[var(--text-primary)] text-sm">Industries Served</div>
            <ul className="space-y-1">
              <li>Dental & Medical Clinics</li>
              <li>Real Estate & Property Groups</li>
              <li>Logistics & Dispatch Operators</li>
              <li>Contractors & Home Services</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-[var(--text-primary)] text-sm">Quick Links</div>
            <ul className="space-y-1">
              <li><a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How it works</a></li>
              <li><a href="#who-its-for" className="hover:text-[var(--text-primary)] transition-colors">Who it's for</a></li>
              <li><a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing tiers</a></li>
              <li><button onClick={() => onOpenAuth('CLIENT')} className="hover:text-[var(--text-primary)] transition-colors">Client Portal Login</button></li>
              <li><button onClick={() => onOpenAuth('ADMIN')} className="hover:text-[var(--text-primary)] transition-colors">Admin Sign In</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-[var(--text-primary)] text-sm">Contact Agency</div>
            <p className="leading-relaxed">
              Ready to eliminate missed calls? Reach out for a live consultation and personalized demonstration.
            </p>
            <div className="pt-1">
              <a
                href={whatsAppInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Direct WhatsApp inquiry</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© {new Date().getFullYear()} VectorOps Systems. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>24/7 Voice Operations</span>
            <span>·</span>
            <span>Human-Managed Architecture</span>
            <span>·</span>
            <span>Private Client Portal</span>
          </div>
        </div>
      </footer>

      {/* ================================================================
          CONSULTATION & INQUIRY MODAL (Sales-Assisted Model)
          ================================================================ */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg neo-raised rounded-3xl p-6 sm:p-8 space-y-5 relative bg-[var(--surface)] text-[var(--text-primary)]">
            
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-[var(--accent)] font-semibold">Free consultation</span>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {consultPlanName}
                </h3>
              </div>
              <button
                onClick={() => setIsConsultModalOpen(false)}
                className="p-1.5 rounded-lg neo-inset hover:text-[#E2604F] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {consultSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl neo-inset text-[var(--accent)] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">Inquiry received!</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Thank you, {consultName}. Our account director will review your business requirements and contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitConsultation} className="space-y-4 text-xs">
                <p className="text-[var(--text-muted)] leading-relaxed">
                  Fill out your details below and our agency director will prepare a tailored voice agent demonstration for your business.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-primary)] font-medium">Your name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={consultName}
                      onChange={(e) => setConsultName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neo-inset text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-primary)] font-medium">Company name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Highland Dental Practice"
                      value={consultCompany}
                      onChange={(e) => setConsultCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neo-inset text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[var(--text-primary)] font-medium">Email address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={consultEmail}
                      onChange={(e) => setConsultEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neo-inset text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[var(--text-primary)] font-medium">Phone number (optional)</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={consultPhone}
                      onChange={(e) => setConsultPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl neo-inset text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--text-primary)] font-medium">Current monthly call volume or questions</label>
                  <textarea
                    rows={2}
                    placeholder="We get ~300 calls/month and want to stop missing after-hours patients..."
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl neo-inset text-[var(--text-primary)] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={whatsAppInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <PlatformIcon platform="WHATSAPP" size={14} />
                    <span>Prefer WhatsApp?</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConsultModalOpen(false)}
                      className="px-4 py-2 rounded-xl neo-raised text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary px-5 py-2 font-semibold"
                    >
                      Request consultation
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
