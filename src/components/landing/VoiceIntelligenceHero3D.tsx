import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Radio,
  Zap,
  Sparkles,
  LogOut,
  User,
  LogIn
} from 'lucide-react';
import { db } from '../../lib/database';
import { formatUSD } from '../../lib/timezone';
import { AuthUser, UserRole } from '../../types';

interface VoiceIntelligenceHero3DProps {
  currentUser?: AuthUser | null;
  onEnterAdmin: () => void;
  onEnterClient: () => void;
  onOpenAuth: (role?: UserRole) => void;
  onLogout: () => void;
}

interface ScenarioStep {
  role: 'agent' | 'caller';
  speaker: string;
  text: string;
  time: string;
}

interface Scenario {
  id: 'dental' | 'realestate' | 'logistics';
  title: string;
  client: string;
  agentName: string;
  voiceModel: string;
  latency: string;
  steps: ScenarioStep[];
}

export const VoiceIntelligenceHero3D: React.FC<VoiceIntelligenceHero3DProps> = ({
  currentUser,
  onEnterAdmin,
  onEnterClient,
  onOpenAuth,
  onLogout,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<'dental' | 'realestate' | 'logistics'>('dental');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>(() => 
    Array.from({ length: 32 }, () => 15)
  );

  const dbClients = db.getClients();
  const totalRetainersCents = db.calculateTotalMonthlyRecurringRevenueCents();

  const scenarios: Record<'dental' | 'realestate' | 'logistics', Scenario> = {
    dental: {
      id: 'dental',
      title: 'Emergency patient triage',
      client: 'Luminar Dental AI',
      agentName: 'Evelyn (Clinical Voice v2)',
      voiceModel: 'Retell Ultra-Low Latency 48kHz',
      latency: '440ms',
      steps: [
        {
          role: 'agent',
          speaker: 'Evelyn (AI)',
          text: 'Thank you for calling Luminar Dental. I am Evelyn, your clinical voice assistant. How may I assist your smile today?',
          time: '00:02'
        },
        {
          role: 'caller',
          speaker: 'Patient (Alex)',
          text: 'Hi Evelyn, I woke up with severe throbbing on my lower left molar. Do you have an emergency slot open this morning?',
          time: '00:07'
        },
        {
          role: 'agent',
          speaker: 'Evelyn (AI)',
          text: 'I am so sorry you are in pain, Alex. I checked Dr. Reed\'s schedule in real time and reserved an emergency triage slot at 10:30 AM EST. Shall I lock that in for you?',
          time: '00:14'
        },
        {
          role: 'caller',
          speaker: 'Patient (Alex)',
          text: 'Yes please! 10:30 AM is perfect. Confirming right now.',
          time: '00:18'
        },
        {
          role: 'agent',
          speaker: 'Evelyn (AI)',
          text: 'Confirmed! A secure appointment pass with parking directions has been dispatched to your mobile. Feel better, and we will see you at 10:30 AM.',
          time: '00:24'
        }
      ]
    },
    realestate: {
      id: 'realestate',
      title: 'High-intent buyer qualification',
      client: 'AeroEstate Realty Group',
      agentName: 'Marcus (Realty Voice v2)',
      voiceModel: 'Retell Neural Multi-Turn',
      latency: '410ms',
      steps: [
        {
          role: 'agent',
          speaker: 'Marcus (AI)',
          text: 'Good afternoon, this is Marcus with AeroEstate Voice. I noticed your inquiry on Penthouse 18B at Harbor Boulevard. Are you looking to tour this weekend?',
          time: '00:02'
        },
        {
          role: 'caller',
          speaker: 'Buyer (Jordan)',
          text: 'Hi Marcus. Yes, looking for 3 bedrooms with dedicated deeded parking, pre-approved for $2.4M.',
          time: '00:08'
        },
        {
          role: 'agent',
          speaker: 'Marcus (AI)',
          text: 'Unit 18B matches your criteria with two deeded parking bays. I have opened an exclusive VIP viewing Saturday at 2:00 PM PST. Shall I put that on your calendar?',
          time: '00:15'
        },
        {
          role: 'caller',
          speaker: 'Buyer (Jordan)',
          text: 'That works great for me. Send over the gate access code.',
          time: '00:20'
        }
      ]
    },
    logistics: {
      id: 'logistics',
      title: 'Freight carrier dispatch & ETA',
      client: 'Apex Dispatch Logistics',
      agentName: 'Orion (Fleet Voice v2)',
      voiceModel: 'Retell Telephony Fast-Path',
      latency: '470ms',
      steps: [
        {
          role: 'agent',
          speaker: 'Orion (AI)',
          text: 'Apex Freight automated dispatch. Please state your bill of lading number and current status.',
          time: '00:02'
        },
        {
          role: 'caller',
          speaker: 'Driver (Swift-402)',
          text: 'BOL 88291. We have a 45-minute weather delay outside Chicago on I-80. Requesting revised dock appointment.',
          time: '00:08'
        },
        {
          role: 'agent',
          speaker: 'Orion (AI)',
          text: 'BOL 88291 verified. Moving dock slot from 15:00 to 15:45 CST. Revised electronic gate pass has been updated on your driver terminal.',
          time: '00:15'
        },
        {
          role: 'caller',
          speaker: 'Driver (Swift-402)',
          text: 'Acknowledged Orion. Revised gate pass received. Resuming route.',
          time: '00:20'
        }
      ]
    }
  };

  const scenario = scenarios[activeScenarioId];

  // Dynamic Audio Equalizer Waveform
  useEffect(() => {
    let animId: number;
    let tick = 0;

    const updateWave = () => {
      tick++;
      if (isPlaying) {
        setWaveAmplitudes(
          Array.from({ length: 32 }, (_, i) => {
            const base = Math.sin(tick * 0.15 + i * 0.4) * 25 + 35;
            const variance = Math.cos(tick * 0.22 - i * 0.3) * 20;
            return Math.max(8, Math.min(88, Math.round(base + variance)));
          })
        );
      } else {
        setWaveAmplitudes(
          Array.from({ length: 32 }, (_, i) => {
            return Math.max(6, Math.round(12 + Math.sin(tick * 0.05 + i * 0.2) * 6));
          })
        );
      }
      animId = requestAnimationFrame(updateWave);
    };

    animId = requestAnimationFrame(updateWave);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Audio Playback & Dialogue Stepper
  const speakCurrentStep = (stepText: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(stepText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio speech synthesis fallback
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const currentStep = scenario.steps[currentStepIndex];
    if (currentStep) {
      speakCurrentStep(currentStep.text);
    }

    const stepTimer = setTimeout(() => {
      if (currentStepIndex < scenario.steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        setTimeout(() => {
          setCurrentStepIndex(0);
        }, 1200);
      }
    }, 4500);

    return () => clearTimeout(stepTimer);
  }, [isPlaying, currentStepIndex, activeScenarioId]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsPlaying(true);
      speakCurrentStep(scenario.steps[currentStepIndex].text);
    }
  };

  const handleScenarioChange = (id: 'dental' | 'realestate' | 'logistics') => {
    setActiveScenarioId(id);
    setCurrentStepIndex(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#17181B] text-[#EDEAE2] flex flex-col justify-between overflow-x-hidden">
      {/* Top Header Navigation (True Neumorphic, no 1px card borders) */}
      <header className="w-full bg-[#1D1F23] neo-raised sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Operational Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E2896A] text-[#17181B] font-semibold text-xs flex items-center justify-center">
              VO
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-semibold text-lg tracking-tight text-[#EDEAE2]">
                VectorOps
              </span>
              <span className="text-[11px] font-normal text-[#8B8D93] hidden sm:inline-block">
                Agency operating system
              </span>
            </div>
          </div>

          {/* Actions: Client Portal, Admin Console & Auth State */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neo-inset text-xs">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    currentUser.role === 'ADMIN' ? 'bg-[#E2896A]/20 text-[#E2896A]' : 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                  }`}>
                    {currentUser.full_name ? currentUser.full_name[0] : 'U'}
                  </div>
                  <span className="font-medium text-[#EDEAE2] max-w-[120px] truncate">{currentUser.full_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
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
                    <span>Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={onEnterClient}
                    className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
                  >
                    <span>Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 rounded-xl neo-raised text-[#8B8D93] hover:text-[#E2604F] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
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

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-16 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Value Proposition & Core Engine Narrative */}
          <div className="lg:col-span-6 space-y-7">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full neo-inset text-xs text-[#8B8D93]">
              <span className="w-2 h-2 rounded-full bg-[#E2896A]" />
              <span className="font-semibold text-[#EDEAE2]">Enterprise voice OS</span>
              <span className="text-[#8B8D93]">·</span>
              <span className="text-[#8B8D93]">Production ready</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEAE2] leading-[1.1] text-balance">
              Autonomous voice operations for elite AI agencies.
            </h1>

            <p className="text-base text-[#8B8D93] leading-relaxed max-w-xl">
              VectorOps runs your entire agency business engine: client workspaces, recurring retainer subscriptions, integer USD invoicing, double-booking safe UTC calendars, and live voice telephony linked with Retell AI.
            </p>

            {/* Production Live Agency Metrics — 3 Distinct Raised Neumorphic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                className="neo-raised p-5 rounded-[16px] space-y-1.5 transition-transform hover:translate-y-[-1px]"
                style={{
                  backgroundColor: '#1D1F23',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '-8px -8px 16px rgba(255,255,255,0.03), 8px 8px 16px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-xs font-normal text-[#8B8D93]">Active clients</div>
                <div className="text-2xl font-semibold text-[#EDEAE2] font-mono-numbers">
                  {dbClients.length} verified
                </div>
                <div className="text-[11px] text-[#4CAF7D] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
                  <span>{dbClients.length > 0 ? '100% operational' : 'Clean production slate'}</span>
                </div>
              </div>

              <div 
                className="neo-raised p-5 rounded-[16px] space-y-1.5 transition-transform hover:translate-y-[-1px]"
                style={{
                  backgroundColor: '#1D1F23',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '-8px -8px 16px rgba(255,255,255,0.03), 8px 8px 16px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-xs font-normal text-[#8B8D93]">Monthly retainers</div>
                <div className="text-2xl font-semibold text-[#4CAF7D] font-mono-numbers">
                  {formatUSD(totalRetainersCents)}
                </div>
                <div className="text-[11px] text-[#8B8D93]">USD cents ledger</div>
              </div>

              <div 
                className="neo-raised p-5 rounded-[16px] space-y-1.5 transition-transform hover:translate-y-[-1px]"
                style={{
                  backgroundColor: '#1D1F23',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '-8px -8px 16px rgba(255,255,255,0.03), 8px 8px 16px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-xs font-normal text-[#8B8D93]">Voice speed</div>
                <div className="text-2xl font-semibold text-[#E2896A] font-mono-numbers">
                  440ms
                </div>
                <div className="text-[11px] text-[#8B8D93]">SIP fast-path latency</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onEnterAdmin}
                className="btn-primary text-sm px-6 py-3"
              >
                <span>Launch admin console</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={onEnterClient}
                className="btn-secondary text-sm px-5 py-3"
              >
                <span>Open client portal</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Voice Intelligence Studio & Telemetry Console */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="w-full rounded-2xl neo-focal p-6 space-y-5">
              
              {/* Scenario Selector & Engine Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#4CAF7D]" />
                    <span className="font-semibold text-sm text-[#EDEAE2]">{scenario.title}</span>
                  </div>
                  <span className="text-xs text-[#8B8D93] mt-0.5 block">{scenario.client} · {scenario.agentName}</span>
                </div>

                {/* Scenario switcher buttons (Neumorphic Inset pills) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl neo-inset">
                  {(['dental', 'realestate', 'logistics'] as const).map((id) => (
                    <button
                      key={id}
                      onClick={() => handleScenarioChange(id)}
                      className={`px-3 py-1 rounded-lg text-xs font-normal transition-all capitalize ${
                        activeScenarioId === id
                          ? 'neo-raised text-[#EDEAE2] font-semibold'
                          : 'text-[#8B8D93] hover:text-[#EDEAE2]'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Sound Wave Spectrum Visualizer (Neumorphic Inset Area) */}
              <div className="p-4 rounded-xl neo-inset space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-[#4CAF7D] animate-pulse' : 'bg-[#8B8D93]'}`} />
                    <span className="text-[#EDEAE2] font-medium">
                      {isPlaying ? 'Live audio stream active' : 'Voice stream standby'}
                    </span>
                  </div>
                  <span className="font-mono-numbers text-[11px] text-[#E2896A]">
                    Latency: {scenario.latency}
                  </span>
                </div>

                {/* Equalizer Frequency Bars */}
                <div className="h-16 flex items-end justify-between gap-1 px-1 pt-2">
                  {waveAmplitudes.map((amp, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${amp}%` }}
                      className={`w-full rounded-full transition-all duration-75 ${
                        isPlaying
                          ? idx % 4 === 0 
                            ? 'bg-[#E2896A]' 
                            : 'bg-[#EDEAE2]'
                          : 'bg-[#25282E]'
                      }`}
                    />
                  ))}
                </div>

                {/* Audio Controls Bar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlayback}
                      className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause stream</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Simulate voice agent call</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg text-[#8B8D93] hover:text-[#EDEAE2] transition-colors"
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-[#E2604F]" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="text-[11px] font-mono-numbers text-[#8B8D93]">
                    Step {currentStepIndex + 1} of {scenario.steps.length}
                  </div>
                </div>
              </div>

              {/* Realtime Conversation Dialogue Box */}
              <div className="space-y-3">
                <div className="text-xs font-normal text-[#8B8D93] flex items-center justify-between">
                  <span>Live call stream transcript</span>
                  <span className="font-mono-numbers text-[11px]">SIP Trunk 48kHz</span>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {scenario.steps.slice(0, currentStepIndex + 1).map((step, idx) => (
                    <motion.div
                      key={`${activeScenarioId}-${idx}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                        step.role === 'agent'
                          ? 'neo-inset text-[#EDEAE2] ml-4'
                          : 'neo-flat bg-[#17181B] text-[#EDEAE2] mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-[11px] ${step.role === 'agent' ? 'text-[#E2896A]' : 'text-[#EDEAE2]'}`}>
                          {step.speaker}
                        </span>
                        <span className="text-[10px] font-mono-numbers text-[#8B8D93]">{step.time}</span>
                      </div>
                      <p className="text-[#EDEAE2]">{step.text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#8B8D93]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF7D]" />
                  <span>Retell workspace connected</span>
                </div>
                <span className="text-[#E2896A] font-normal">Automatic UTC sync</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Production Agency Features Footer (Neumorphic Surface) */}
      <footer className="w-full bg-[#1D1F23] neo-raised py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <div className="font-semibold text-[#EDEAE2] mb-1.5">Enterprise workspaces</div>
            <p className="text-[#8B8D93] leading-relaxed">
              VectorOps manages billing, client portals, and appointment rules. Retell handles speech model execution.
            </p>
          </div>
          <div>
            <div className="font-semibold text-[#EDEAE2] mb-1.5">Zero floating-point math</div>
            <p className="text-[#8B8D93] leading-relaxed">
              Every balance, setup fee, and payment is tracked in exact integer USD cents to eliminate billing rounding drift.
            </p>
          </div>
          <div>
            <div className="font-semibold text-[#EDEAE2] mb-1.5">Timezone invariant engine</div>
            <p className="text-[#8B8D93] leading-relaxed">
              Canonical UTC storage with automatic translation to client timezones and conflict prevention against double-bookings.
            </p>
          </div>
          <div>
            <div className="font-semibold text-[#EDEAE2] mb-1.5">Cryptographic audit ledger</div>
            <p className="text-[#8B8D93] leading-relaxed">
              Every appointment status, invoice payment, and client action is recorded with actor ID and ISO timestamp.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
