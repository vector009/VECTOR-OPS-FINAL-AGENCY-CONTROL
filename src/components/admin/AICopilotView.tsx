import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Send, 
  Bot, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { generateDailyBrief, queryBusinessAssistant } from '../../lib/ai-copilot';
import { db } from '../../lib/database';

export const AICopilotView: React.FC = () => {
  const [queryInput, setQueryInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; timestamp: string }[]>([
    {
      role: 'assistant',
      text: 'VectorOps Autonomous Copilot initialized. I have direct read access to your PostgreSQL database state. You can ask me about live monthly revenue, overdue invoices, client onboarding blockers, or appointment availability.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const dailyBrief = generateDailyBrief();

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const userQ = queryInput.trim();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { role: 'user', text: userQ, timestamp: nowTime }]);
    setQueryInput('');
    setIsThinking(true);

    setTimeout(() => {
      const response = queryBusinessAssistant(userQ);
      setMessages(prev => [...prev, { role: 'assistant', text: response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setIsThinking(false);
    }, 450);
  };

  const suggestedQueries = [
    'What needs my attention today?',
    'How much did we collect this month?',
    'Which clients are overdue?',
    'Are any Retell workspaces missing?',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">AI copilot console</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Grounded operational intelligence querying live database records
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl neo-flat bg-[#1D1F23] text-xs text-[#E2896A]">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Operational guardrails: AI proposes, admin confirms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Natural Language Query Terminal */}
        <div className="lg:col-span-8 flex flex-col neo-raised rounded-2xl overflow-hidden min-h-[520px] bg-[#1D1F23]">
          <div className="p-4 bg-[#17181B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E2896A]" />
              <span className="text-xs font-semibold text-[#EDEAE2]">Autonomous business query terminal</span>
            </div>
            <span className="text-xs text-[#4CAF7D]">Grounded in database state</span>
          </div>

          {/* Chat transcript */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[380px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#E2896A]/10 text-[#E2896A] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-xl leading-relaxed max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-[#E2896A] text-[#17181B] font-medium'
                      : 'bg-[#17181B] text-[#EDEAE2]'
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="text-[10px] opacity-60 block mt-1 text-right font-mono-numbers">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-[#8B8D93] animate-pulse">
                <Bot className="w-4 h-4 text-[#E2896A]" />
                <span>Querying authoritative PostgreSQL views...</span>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-4 py-2 bg-[#17181B] flex flex-wrap gap-2 text-xs">
            {suggestedQueries.map((sq) => (
              <button
                key={sq}
                onClick={() => {
                  setQueryInput(sq);
                }}
                className="px-2.5 py-1 rounded-lg neo-flat bg-[#1D1F23] text-[#8B8D93] hover:text-[#EDEAE2] transition-colors text-xs"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleAsk} className="p-4 bg-[#17181B] flex gap-2">
            <input
              type="text"
              placeholder="Ask anything regarding clients, revenue, appointments, or unread messages..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="flex-1 px-4 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!queryInput.trim() || isThinking}
              className="px-5 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Query</span>
            </button>
          </form>
        </div>

        {/* Right Column: Grounded Brief & Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          <div className="neo-raised p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-[#EDEAE2]">
              Live business telemetry
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B8D93]">Active clients:</span>
                <span className="font-semibold text-[#EDEAE2]">{dailyBrief.activeClientsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B8D93]">Verified MRR:</span>
                <span className="font-semibold text-[#4CAF7D] font-mono-numbers">{dailyBrief.mrrFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B8D93]">Collected this month:</span>
                <span className="font-semibold text-[#EDEAE2] font-mono-numbers">{dailyBrief.collectedThisMonthFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B8D93]">Overdue invoices:</span>
                <span className="font-semibold text-[#E2604F] font-mono-numbers">{dailyBrief.overdueFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#8B8D93]">Unread client messages:</span>
                <span className="font-semibold text-[#E0A94C] font-mono-numbers">{dailyBrief.unreadMessagesCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8B8D93]">Blocked onboardings:</span>
                <span className="font-semibold text-[#E2896A] font-mono-numbers">{dailyBrief.blockedOnboardingCount}</span>
              </div>
            </div>
          </div>

          <div className="neo-raised p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-[#EDEAE2]">
              Safety invariants
            </h3>
            <p className="text-xs text-[#8B8D93] leading-relaxed">
              The AI copilot does not have independent write access to create payments, delete clients, alter pricing, or waive invoices. All financial mutations must be explicitly reviewed and confirmed by an administrator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
