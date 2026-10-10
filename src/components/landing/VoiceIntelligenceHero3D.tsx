import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  PhoneCall, 
  Calendar, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  DollarSign, 
  Users, 
  Sparkles, 
  Volume2, 
  LogIn, 
  LogOut, 
  X, 
  Check, 
  ExternalLink,
  ChevronDown,
  Moon,
  Target,
  Repeat,
  CreditCard,
  Headphones,
  Bot,
  SlidersHorizontal,
  Activity,
  LineChart,
  ShoppingBag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/database';
import { AuthUser, UserRole, SubscriptionPlan, AgencyPaymentLink } from '../../types';
import { ThemeToggle } from '../../context/ThemeContext';
import { PlatformIcon } from '../common/PlatformIcon';
import { buildGeneralInquiryRedirectUrl } from '../../lib/paymentLinks';
import phoneMockupImg from '../../assets/images/ai_phone_mockup.jpg';

interface VoiceIntelligenceHero3DProps {
  currentUser?: AuthUser | null;
  onEnterAdmin: () => void;
  onEnterClient: () => void;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
}

/**
 * Clean SVG Triangle / Delta Logo Mark for VectorOps
 */
const VectorOpsLogoMark: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M12 2.5L2.5 20.5H21.5L12 2.5Z" 
      fill="url(#vectorops-delta-grad)" 
      stroke="rgba(255, 255, 255, 0.25)" 
      strokeWidth="1.2" 
      strokeLinejoin="round" 
    />
    <path 
      d="M12 7.5L6.5 18H17.5L12 7.5Z" 
      fill="#0B0F17" 
      opacity="0.55" 
    />
    <defs>
      <linearGradient id="vectorops-delta-grad" x1="2.5" y1="2.5" x2="21.5" y2="20.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#B27BFF" />
        <stop offset="0.5" stopColor="#7B61FF" />
        <stop offset="1" stopColor="#00C6FF" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * 8 Exact Common Use Cases
 */
interface UseCaseItem {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMMON_USE_CASES: UseCaseItem[] = [
  {
    title: 'AI Receptionist',
    desc: 'Answers every call instantly, greets customers naturally, and routes inquiries without hold times.',
    icon: PhoneCall
  },
  {
    title: 'After-Hours Support',
    desc: '24/7 emergency answering so you capture business and support callers while competitors sleep.',
    icon: Moon
  },
  {
    title: 'Lead Generation',
    desc: 'Qualifies prospect intent, captures critical contact details, and routes hot deals to your team.',
    icon: Target
  },
  {
    title: 'Sales Follow-Ups',
    desc: 'Proactively calls warm leads, re-engages inactive inquiries, and accelerates conversion velocity.',
    icon: Repeat
  },
  {
    title: 'Appointment Booking',
    desc: 'Checks live availability, coordinates dates and times, and locks bookings into your calendar.',
    icon: Calendar
  },
  {
    title: 'Order & Payment Updates',
    desc: 'Delivers real-time status updates, tracks shipments, and guides customers through payment links.',
    icon: CreditCard
  },
  {
    title: 'Customer Support',
    desc: 'Resolves common questions, troubleshoots issues, and escalates complex requests to staff.',
    icon: Headphones
  },
  {
    title: 'Custom Voice Agents',
    desc: 'Bespoke conversational workflows tailored specifically to your company’s unique operational logic.',
    icon: Bot
  }
];

/**
 * Reusable "Talk to us" popover / direct button powered by agency_payment_links
 */
interface TalkToUsControlProps {
  links: AgencyPaymentLink[];
  label?: string;
  className?: string;
  onFallbackOpenModal: () => void;
}

const TalkToUsControl: React.FC<TalkToUsControlProps> = ({
  links,
  label = "Talk to us",
  className = "gradient-pill-btn text-xs sm:text-sm px-6 py-3 font-semibold",
  onFallbackOpenModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  if (links.length === 0) {
    return (
      <button
        onClick={onFallbackOpenModal}
        className={`${className} flex items-center gap-2 cursor-pointer`}
      >
        <span>{label}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    );
  }

  if (links.length === 1) {
    const single = links[0];
    const targetUrl = buildGeneralInquiryRedirectUrl(single);

    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} flex items-center gap-2`}
      >
        <PlatformIcon platform={single.platform} size={16} />
        <span>{label} ({single.label})</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
      </a>
    );
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center gap-2 cursor-pointer`}
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-72 p-2.5 rounded-2xl glass-panel shadow-2xl z-50 text-left animate-in fade-in duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] font-mono">
            Connect with our team
          </div>
          <div className="space-y-1 mt-1">
            {links.map((link) => {
              const url = buildGeneralInquiryRedirectUrl(link);
              return (
                <a
                  key={link.id || link.label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-xs text-white group"
                >
                  <div className="flex items-center gap-2.5">
                    <PlatformIcon platform={link.platform} size={18} />
                    <div>
                      <div className="font-semibold text-white group-hover:text-[#00C6FF] transition-colors">
                        {link.label}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {link.platform === 'WHATSAPP' 
                          ? 'Instant WhatsApp chat' 
                          : link.platform === 'EMAIL' 
                            ? 'Direct inquiry email' 
                            : `${link.platform} channel`}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-white" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const VoiceIntelligenceHero3D: React.FC<VoiceIntelligenceHero3DProps> = ({
  currentUser,
  onEnterAdmin,
  onEnterClient,
  onOpenAuth,
  onLogout,
}) => {
  // Live Plans from Supabase subscription_plans table
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  // Live Agency Payment / Contact Links from agency_payment_links table
  const [agencyLinks, setAgencyLinks] = useState<AgencyPaymentLink[]>([]);

  // Consultation Modal State
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultPlanName, setConsultPlanName] = useState<string>('Custom Consultation');
  const [consultName, setConsultName] = useState('');
  const [consultEmail, setConsultEmail] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [consultCompany, setConsultCompany] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  // 1. Fetch live active subscription plans from Supabase
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
            setPlans(db.getPlans().filter(p => p.is_active));
          }
        }
      } catch {
        if (isMounted) {
          setPlans(db.getPlans().filter(p => p.is_active));
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

  // 2. Fetch live active links from agency_payment_links table
  useEffect(() => {
    let isMounted = true;
    async function fetchAgencyLinks() {
      try {
        const { data, error } = await supabase
          .from('agency_payment_links')
          .select('id, platform, label, url, is_active')
          .eq('is_active', true);

        if (isMounted) {
          if (!error && data && data.length > 0) {
            setAgencyLinks(data as AgencyPaymentLink[]);
          } else {
            setAgencyLinks(db.getActivePaymentLinks());
          }
        }
      } catch {
        if (isMounted) {
          setAgencyLinks(db.getActivePaymentLinks());
        }
      }
    }

    fetchAgencyLinks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenConsultation = (planName: string = 'Custom Quote') => {
    setConsultPlanName(planName);
    setConsultSubmitted(false);
    setIsConsultModalOpen(true);
  };

  const handleCtaAction = () => {
    // If WhatsApp is active, trigger direct WhatsApp or modal
    const waLink = agencyLinks.find(l => l.platform === 'WHATSAPP' && l.is_active);
    if (waLink) {
      const redirect = buildGeneralInquiryRedirectUrl(waLink);
      window.open(redirect, '_blank', 'noopener,noreferrer');
    } else {
      handleOpenConsultation("Let's Build Your AI Voice Agents");
    }
  };

  const handleSubmitConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName || !consultEmail) return;

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

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F0F4F8] flex flex-col selection:bg-[#7B61FF]/30 selection:text-white transition-colors duration-200">
      
      {/* Ambient Top Glow Spheres */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(circle,rgba(155,81,224,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />
      <div className="fixed top-10 right-0 w-[550px] h-[450px] bg-[radial-gradient(circle,rgba(0,194,255,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl -z-10" />

      {/* ================================================================
          NAV
          Left: Logo (triangle mark + "VectorOps" + "AI AUTOMATION AGENCY" small label underneath)
          Right: Three nav links: "VOICE AGENTS / AUTOMATIONS / REAL RESULTS"
          ================================================================ */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#0B0F17]/85 border-b border-white/[0.07] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo on the left */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-[#7B61FF]/50 transition-colors shadow-lg">
              <VectorOpsLogoMark className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white leading-none">
                Vector<span className="text-gradient-purple-blue">Ops</span>
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#8292A6] mt-1 leading-none font-mono">
                AI AUTOMATION AGENCY
              </span>
            </div>
          </a>

          {/* Three nav links on the right */}
          <div className="flex items-center gap-6 lg:gap-8">
            <nav className="hidden md:flex items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-[#8292A6]">
              <a href="#voice-agents" className="hover:text-white transition-colors">
                VOICE AGENTS
              </a>
              <span className="text-white/20 select-none">/</span>
              <a href="#automations" className="hover:text-white transition-colors">
                AUTOMATIONS
              </a>
              <span className="text-white/20 select-none">/</span>
              <a href="#real-results" className="hover:text-white transition-colors">
                REAL RESULTS
              </a>
            </nav>

            {/* Auth Controls & Theme toggle */}
            <div className="flex items-center gap-2.5">
              <ThemeToggle />

              {currentUser ? (
                <div className="flex items-center gap-2">
                  {currentUser.role === 'ADMIN' ? (
                    <button
                      onClick={onEnterAdmin}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] transition-all flex items-center gap-1.5"
                    >
                      <span>Admin</span>
                      <ArrowRight className="w-3 h-3 text-[#00C6FF]" />
                    </button>
                  ) : (
                    <button
                      onClick={onEnterClient}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1] transition-all flex items-center gap-1.5"
                    >
                      <span>Client portal</span>
                      <ArrowRight className="w-3 h-3 text-[#00C6FF]" />
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    title="Sign out"
                    className="p-1.5 rounded-lg text-[#8292A6] hover:text-[#FF4D4D] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('CLIENT')}
                    className="hidden sm:inline-flex text-xs text-[#8292A6] hover:text-white px-2.5 py-1.5 transition-colors font-medium"
                  >
                    Client sign in
                  </button>
                  <button
                    onClick={() => onOpenAuth('ADMIN')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] transition-all flex items-center gap-1.5"
                  >
                    <LogIn className="w-3 h-3 text-[#7B61FF]" />
                    <span>Sign in</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 w-full space-y-20 sm:space-y-28 py-10 lg:py-16">
        
        {/* ================================================================
            HERO — TWO COLUMNS
            Left:
              - Headline: "AI Voice Agents" in white, "That Work 24/7" with "Work 24/7" in purple-to-blue gradient
              - Paragraph: "We build and manage AI voice agents that answer calls, qualify leads, handle customer support, book appointments and more — so you never miss a business opportunity."
              - Small uppercase label: "COMMON USE CASES"
              - 8-item grid (2 columns x 4 rows): dark glass container, small icon, bold title, one-line description
            Right:
              - Generated phone mockup image
              - 4 chat-bubble cards floating beside it (Caller/AI Agent alternating)
              - Below phone: thin horizontal glowing waveform graphic
              - Handwritten-style script text: "Real Conversations. Real Business Value."
            ================================================================ */}
        <section id="voice-agents" className="max-w-7xl mx-auto px-6 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
            
            {/* LEFT COLUMN (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Headlines */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] text-balance">
                  AI Voice Agents<br />
                  That <span className="text-gradient-purple-blue">Work 24/7</span>
                </h1>

                <p className="text-sm sm:text-base text-[#8292A6] leading-relaxed max-w-xl text-balance">
                  We build and manage AI voice agents that answer calls, qualify leads, handle customer support, book appointments and more — so you never miss a business opportunity.
                </p>
              </div>

              {/* COMMON USE CASES Section */}
              <div className="space-y-4 pt-2">
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#8292A6] font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF]" />
                  <span>COMMON USE CASES</span>
                </div>

                {/* 8-Item Grid: 2 Columns x 4 Rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {COMMON_USE_CASES.map((useCase) => {
                    const Icon = useCase.icon;
                    return (
                      <div
                        key={useCase.title}
                        className="glass-card rounded-2xl p-4 flex items-start gap-3.5 group hover:border-[#7B61FF]/40 transition-all"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#9B51E0] group-hover:text-[#00C6FF] shrink-0 transition-colors shadow-sm">
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-white transition-colors">
                            {useCase.title}
                          </div>
                          <p className="text-[11px] sm:text-xs text-[#8292A6] leading-relaxed">
                            {useCase.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6 lg:pl-2">
              
              {/* Phone Mockup Canvas with Floating Chat Bubbles */}
              <div className="relative mx-auto max-w-[420px] sm:max-w-[460px] lg:max-w-none flex flex-col items-center">
                
                {/* Backlight Glow Behind Phone */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[380px] h-[480px] bg-gradient-to-tr from-[#9B51E0]/20 via-[#7B61FF]/25 to-[#00C2FF]/20 rounded-full blur-3xl -z-10 pointer-events-none" />

                {/* Central Phone Mockup Container */}
                <div className="relative w-full max-w-[280px] sm:max-w-[310px] mx-auto z-10 transition-transform duration-300 hover:scale-[1.01]">
                  <img
                    src={phoneMockupImg}
                    alt="VectorOps AI Receptionist Voice Agent Phone Mockup"
                    className="w-full h-auto object-contain rounded-[38px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] drop-shadow-[0_10px_30px_rgba(123,97,255,0.25)] select-none pointer-events-none border border-white/[0.08]"
                  />

                  {/* Bubble 1: Floating top-left (Caller) */}
                  <div className="absolute -top-3 -left-10 sm:-left-16 z-20 glass-card rounded-2xl p-3 sm:p-3.5 max-w-[210px] sm:max-w-[230px] shadow-2xl animate-in fade-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between text-[10px] text-[#8292A6] font-mono mb-1">
                      <span className="font-semibold text-white/90">Caller</span>
                      <span>00:03</span>
                    </div>
                    <p className="text-[11px] text-[#E2E8F0] leading-snug">
                      "Hi, I need to book a dental checkup and teeth cleaning this Thursday."
                    </p>
                  </div>

                  {/* Bubble 2: Floating mid-right (AI Agent) */}
                  <div className="absolute top-[26%] -right-8 sm:-right-16 z-20 glass-card rounded-2xl p-3 sm:p-3.5 max-w-[220px] sm:max-w-[240px] shadow-2xl border-[#7B61FF]/40 animate-in fade-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-semibold text-[#00C6FF] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> AI Agent
                      </span>
                      <span className="text-[#8292A6]">00:07</span>
                    </div>
                    <p className="text-[11px] text-white leading-snug">
                      "Certainly! Dr. Reed has openings this Thursday at 10:30 AM and 2:15 PM. Which time suits you best?"
                    </p>
                  </div>

                  {/* Bubble 3: Floating mid-left (Caller) */}
                  <div className="absolute top-[54%] -left-8 sm:-left-14 z-20 glass-card rounded-2xl p-3 sm:p-3.5 max-w-[190px] sm:max-w-[210px] shadow-2xl animate-in fade-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between text-[10px] text-[#8292A6] font-mono mb-1">
                      <span className="font-semibold text-white/90">Caller</span>
                      <span>00:11</span>
                    </div>
                    <p className="text-[11px] text-[#E2E8F0] leading-snug">
                      "10:30 AM works great for me."
                    </p>
                  </div>

                  {/* Bubble 4: Floating bottom-right (AI Agent) */}
                  <div className="absolute -bottom-3 -right-8 sm:-right-14 z-20 glass-card rounded-2xl p-3 sm:p-3.5 max-w-[220px] sm:max-w-[240px] shadow-2xl border-[#00C6FF]/40 animate-in fade-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-semibold text-[#00C6FF] flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> AI Agent
                      </span>
                      <span className="text-[#8292A6]">00:15</span>
                    </div>
                    <p className="text-[11px] text-white leading-snug">
                      "All set! I've confirmed your appointment for Thursday at 10:30 AM and texted you the directions."
                    </p>
                  </div>

                </div>

                {/* Below the Phone: Thin Horizontal Glowing Waveform Graphic */}
                <div className="w-full max-w-[340px] sm:max-w-[380px] mt-7 space-y-3">
                  
                  {/* Glowing Animated Waveform Bar */}
                  <div className="relative h-2 w-full rounded-full bg-white/[0.06] overflow-hidden p-[1px]">
                    <div className="waveform-glow-bar h-full w-full rounded-full bg-gradient-to-r from-[#9B51E0] via-[#7B61FF] via-[#00C6FF] to-[#9B51E0]" />
                  </div>

                  {/* Frequency bars + Handwritten script tagline */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    
                    {/* Animated sound frequency bars */}
                    <div className="flex items-center gap-1 h-3.5 opacity-85 shrink-0">
                      {[35, 80, 50, 100, 65, 90, 45, 85, 95, 60, 40].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-gradient-to-t from-[#7B61FF] to-[#00C6FF] rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDuration: `${0.75 + (i % 4) * 0.2}s`
                          }}
                        />
                      ))}
                    </div>

                    {/* Small handwritten-style script text */}
                    <span className="font-script text-lg sm:text-xl text-[#C4B5FD] tracking-wide select-none">
                      Real Conversations. Real Business Value.
                    </span>

                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* ================================================================
              STRIP — BELOW THE HERO
              Full-width bordered glass panel:
              Left: "FULLY MANAGED FROM START TO SCALE"
              Right: 4 icon+label items:
                - Setup & Configuration
                - Testing & Optimization
                - Monitoring & Performance
                - Ongoing Support & Maintenance
              ================================================================ */}
          <div id="automations" className="mt-14 w-full glass-panel rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl scroll-mt-24">
            
            {/* Left title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00C6FF] shadow-[0_0_10px_#00C6FF]" />
              <span className="text-xs sm:text-sm font-bold tracking-[0.16em] uppercase text-white font-mono">
                FULLY MANAGED FROM START TO SCALE
              </span>
            </div>

            {/* 4 Icon + Label items on the right */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 flex-1 lg:max-w-3xl">
              
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#B27BFF] shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">
                  Setup & Configuration
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#7B61FF] shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">
                  Testing & Optimization
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#00C6FF] shrink-0">
                  <LineChart className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">
                  Monitoring & Performance
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#1AE598] shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-white leading-tight">
                  Ongoing Support & Maintenance
                </span>
              </div>

            </div>

          </div>

          {/* ================================================================
              FOOTER (OF THIS SECTION, NOT THE PAGE FOOTER)
              Left: Logo + "YOUR AI VOICE. OUR EXPERTISE." tagline
              Right: Gradient-bordered pill CTA button "Let's Build Your AI Voice Agents →"
              (wired to the agency_payment_links / contact flow)
              ================================================================ */}
          <div className="mt-8 pt-6 pb-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <VectorOpsLogoMark className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-[#8292A6] font-mono">
                YOUR AI VOICE. OUR EXPERTISE.
              </span>
            </div>

            <button
              type="button"
              onClick={handleCtaAction}
              className="gradient-pill-btn px-7 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Let's Build Your AI Voice Agents</span>
              <ArrowRight className="w-4 h-4 text-[#00C6FF]" />
            </button>

          </div>

        </section>

        {/* ================================================================
            REAL RESULTS / PROOF SECTION
            ================================================================ */}
        <section id="real-results" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#7B61FF] font-mono">
              REAL BUSINESS IMPACT
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Why growing businesses switch to VectorOps
            </h2>
            <p className="text-sm text-[#8292A6] leading-relaxed">
              Eliminate missed calls, remove phone tag, and capture every customer when intent is highest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-7 rounded-3xl glass-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#FFA726]">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-white font-mono-numbers">
                67% of callers
              </div>
              <h3 className="text-base font-semibold text-white">
                Hang up when they hit voicemail
              </h3>
              <p className="text-xs text-[#8292A6] leading-relaxed">
                Callers rarely leave voicemails. They immediately call your competitor. Our voice agents answer in under one second.
              </p>
            </div>

            <div className="p-7 rounded-3xl glass-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#00C6FF]">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-white font-mono-numbers">
                1 in 4 calls
              </div>
              <h3 className="text-base font-semibold text-white">
                Dropped during front-desk rush hours
              </h3>
              <p className="text-xs text-[#8292A6] leading-relaxed">
                When phones ring while front-desk staff are greeting clients, VectorOps absorbs excess call volume without hold times.
              </p>
            </div>

            <div className="p-7 rounded-3xl glass-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#1AE598]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-white font-mono-numbers">
                100% scheduled
              </div>
              <h3 className="text-base font-semibold text-white">
                Locked directly into your calendar
              </h3>
              <p className="text-xs text-[#8292A6] leading-relaxed">
                Live calendar slot synchronization prevents double-booking and dispatches SMS directions straight to the client.
              </p>
            </div>

          </div>
        </section>

        {/* ================================================================
            PRICING SECTION (Pulls Live From Supabase subscription_plans)
            ================================================================ */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-24">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#1AE598] font-mono">
              TRANSPARENT INVESTMENT
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Simple, predictable monthly pricing
            </h2>
            <p className="text-sm text-[#8292A6] leading-relaxed">
              No hidden minute penalties or complex usage tiers. Flat monthly retainers with complete management included.
            </p>
          </div>

          {/* Dynamic Live Cards from Supabase subscription_plans */}
          {isLoadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 rounded-3xl glass-card space-y-4 h-80" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="max-w-xl mx-auto p-8 rounded-3xl glass-card text-center space-y-4">
              <h3 className="text-lg font-bold text-white">Pricing available on request</h3>
              <p className="text-xs text-[#8292A6] leading-relaxed">
                We design bespoke voice operations architectures tailored to your exact call volume and multi-location requirements.
              </p>
              <button
                onClick={() => handleOpenConsultation('Custom Consultation')}
                className="gradient-pill-btn text-xs px-6 py-2.5 mx-auto cursor-pointer"
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
                    className="p-8 rounded-3xl glass-card flex flex-col justify-between space-y-6 relative transition-all hover:translate-y-[-2px]"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-xs text-[#8292A6] leading-relaxed">{plan.description}</p>
                      </div>

                      {/* Headline Price & Setup Fee Line */}
                      <div className="pt-2 border-t border-white/[0.08] space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold font-mono-numbers text-[#1AE598]">
                            {monthlyFormatted}
                          </span>
                          <span className="text-xs text-[#8292A6] font-medium">/month</span>
                        </div>
                        <div className="text-xs text-[#8292A6] font-mono-numbers">
                          {setupFormatted} setup fee
                        </div>
                      </div>

                      {/* Included Service Description Line */}
                      <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8292A6] font-mono">
                          What's included:
                        </span>
                        <div className="flex items-start gap-2 text-white">
                          <Check className="w-4 h-4 text-[#1AE598] shrink-0 mt-0.5" />
                          <span>{plan.included_service_description}</span>
                        </div>
                        <div className="flex items-start gap-2 text-white">
                          <Check className="w-4 h-4 text-[#1AE598] shrink-0 mt-0.5" />
                          <span>Dedicated client dashboard & live call transcripts</span>
                        </div>
                        <div className="flex items-start gap-2 text-white">
                          <Check className="w-4 h-4 text-[#1AE598] shrink-0 mt-0.5" />
                          <span>Full calendar synchronization & SMS confirmations</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenConsultation(plan.name)}
                      className="w-full gradient-pill-btn text-xs py-3 font-semibold mt-4 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Get a custom quote</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#00C6FF]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-xs text-[#8292A6]">
            Need multi-location routing or custom integrations?{' '}
            <button 
              onClick={() => handleOpenConsultation('Enterprise Custom')} 
              className="text-[#00C6FF] hover:underline font-semibold cursor-pointer"
            >
              Speak with our agency team
            </button>.
          </p>

        </section>

        {/* ================================================================
            CONTACT SECTION (Dynamic Settings Links + Consultation)
            ================================================================ */}
        <section id="contact" className="max-w-4xl mx-auto px-6 scroll-mt-24">
          <div className="p-8 sm:p-12 rounded-3xl glass-panel text-center space-y-6 relative overflow-hidden shadow-2xl">
            
            <div className="space-y-3 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                See if VectorOps is right for your business
              </h2>
              <p className="text-sm text-[#8292A6] leading-relaxed">
                Book a brief consultation with our team. We'll listen to your current call workflow, demonstrate a voice agent tailored to your industry, and give you honest feedback on whether this will drive profit for you.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => handleOpenConsultation('Free Consultation')}
                className="gradient-pill-btn text-sm px-8 py-3.5 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span>Book a free consultation</span>
                <ArrowRight className="w-4 h-4 text-[#00C6FF]" />
              </button>

              <TalkToUsControl
                links={agencyLinks}
                label="Direct chat & inquiry"
                className="px-6 py-3.5 rounded-full text-sm font-medium bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] transition-all cursor-pointer"
                onFallbackOpenModal={() => handleOpenConsultation('Direct Inquiry')}
              />
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-6 text-xs text-[#8292A6]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1AE598]" />
                <span>Zero technical setup required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1AE598]" />
                <span>48-hour onboarding</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C6FF]" />
                <span>Dedicated account manager</span>
              </span>
            </div>

          </div>
        </section>

      </main>

      {/* Public Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-[#0B0F17] py-12 text-xs text-[#8292A6] transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <VectorOpsLogoMark className="w-5 h-5" />
              <span className="font-bold text-white text-sm">VectorOps Agency</span>
            </div>
            <p className="leading-relaxed">
              We design, deploy, and manage custom 24/7 AI phone agents for appointment-driven businesses.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-white text-sm">Use Cases</div>
            <ul className="space-y-1">
              <li>AI Receptionist & Booking</li>
              <li>After-Hours Emergency Triage</li>
              <li>Lead Generation & Qualification</li>
              <li>Order Updates & Customer Care</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-white text-sm">Quick Links</div>
            <ul className="space-y-1">
              <li><a href="#voice-agents" className="hover:text-white transition-colors">Voice Agents</a></li>
              <li><a href="#automations" className="hover:text-white transition-colors">Managed Automations</a></li>
              <li><a href="#real-results" className="hover:text-white transition-colors">Real Results</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing tiers</a></li>
              <li>
                <button
                  onClick={() => currentUser?.role === 'CLIENT' ? onEnterClient() : onOpenAuth('CLIENT')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Client Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => currentUser?.role === 'ADMIN' ? onEnterAdmin() : onOpenAuth('ADMIN')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Admin Console
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Agency — DYNAMICALLY pulls all active links from agency_payment_links table */}
          <div className="space-y-2">
            <div className="font-bold text-white text-sm">Contact Agency</div>
            <p className="leading-relaxed">
              Ready to eliminate missed calls? Reach out to our team through any configured channel:
            </p>
            <div className="space-y-1.5 pt-1">
              {agencyLinks.length > 0 ? (
                agencyLinks.map((link) => (
                  <div key={link.id || link.label}>
                    <a
                      href={buildGeneralInquiryRedirectUrl(link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00C6FF] hover:underline inline-flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <PlatformIcon platform={link.platform} size={14} />
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                ))
              ) : (
                <button
                  onClick={() => handleOpenConsultation('General Inquiry')}
                  className="text-[#00C6FF] hover:underline font-medium cursor-pointer"
                >
                  Book a consultation
                </button>
              )}
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
          CONSULTATION & INQUIRY MODAL
          ================================================================ */}
      {isConsultModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsConsultModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 space-y-5 relative text-white modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#00C6FF] font-semibold">Free consultation</span>
                <h3 className="text-lg font-bold text-white">
                  {consultPlanName}
                </h3>
              </div>
              <button
                onClick={() => setIsConsultModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8292A6] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {consultSubmitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1AE598]/15 text-[#1AE598] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Inquiry received!</h4>
                <p className="text-xs text-[#8292A6] leading-relaxed">
                  Thank you, {consultName}. Our account director will review your business requirements and contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitConsultation} className="space-y-4 text-xs">
                <p className="text-[#8292A6] leading-relaxed">
                  Fill out your details below and our team will prepare a tailored voice agent demonstration for your business.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white font-medium">Your name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={consultName}
                      onChange={(e) => setConsultName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-[#8292A6] focus:outline-none focus:border-[#7B61FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white font-medium">Company name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Highland Dental Practice"
                      value={consultCompany}
                      onChange={(e) => setConsultCompany(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-[#8292A6] focus:outline-none focus:border-[#7B61FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-white font-medium">Email address *</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={consultEmail}
                      onChange={(e) => setConsultEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-[#8292A6] focus:outline-none focus:border-[#7B61FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-white font-medium">Phone number (optional)</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={consultPhone}
                      onChange={(e) => setConsultPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-[#8292A6] focus:outline-none focus:border-[#7B61FF]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-white font-medium">Current monthly call volume or questions</label>
                  <textarea
                    rows={2}
                    placeholder="We get ~300 calls/month and want to stop missing after-hours patients..."
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-[#8292A6] focus:outline-none focus:border-[#7B61FF] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {agencyLinks.find(l => l.platform === 'WHATSAPP') && (
                      <a
                        href={buildGeneralInquiryRedirectUrl(agencyLinks.find(l => l.platform === 'WHATSAPP')!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00C6FF] hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        <PlatformIcon platform="WHATSAPP" size={14} />
                        <span>WhatsApp chat</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsConsultModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-[#8292A6] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="gradient-pill-btn px-5 py-2 font-semibold cursor-pointer"
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
