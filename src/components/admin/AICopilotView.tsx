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
          <h1 className="text-2xl font-bold tracking-tight text-white">AI copilot console</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Grounded operational intelligence querying live database records
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl neo-flat bg-[var(--card-bg)] text-xs text-[#00C6FF] border border-[#00C6FF]/30">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Operational guardrails: AI proposes, admin confirms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Natural Language Query Terminal */}
        <div className="lg:col-span-8 flex flex-col neo-raised rounded-2xl overflow-hidden min-h-[520px] bg-[var(--card-bg)] border border-[var(--card-border)]">
          <div className="p-4 bg-white/[0.02] border-b border-[var(--card-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00C6FF]" />
              <span className="text-xs font-semibold text-white">Autonomous business query terminal</span>
            </div>
            <span className="text-xs text-[var(--success)] font-mono">Grounded in database state</span>
          </div>

          {/* Chat transcript */}
          <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[380px]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-[#00C6FF]/15 text-[#00C6FF] border border-[#00C6FF]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl leading-relaxed max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#9B51E0] to-[#00C6FF] text-white font-medium shadow-md'
                      : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-white'
                  }`}
                >
                  <p>{m.text}</p>
                  <span className="text-[10px] opacity-70 block mt-1 text-right font-mono-numbers">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] animate-pulse">
                <Bot className="w-4 h-4 text-[#00C6FF]" />
                <span>Querying authoritative PostgreSQL views...</span>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-4 py-2 bg-white/[0.02] border-t border-[var(--card-border)] flex flex-wrap gap-2 text-xs">
            {suggestedQueries.map((sq) => (
              <button
                key={sq}
                onClick={() => {
                  setQueryInput(sq);
                }}
                className="px-2.5 py-1 rounded-xl neo-flat bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-white transition-colors text-xs cursor-pointer"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleAsk} className="p-4 bg-white/[0.02] border-t border-[var(--card-border)] flex gap-2">
            <input
              type="text"
              placeholder="Ask anything regarding clients, revenue, appointments, or unread messages..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="flex-1 px-4 py-2 text-xs bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[#7662FA]"
            />
            <button
              type="submit"
              disabled={!queryInput.trim() || isThinking}
              className="btn-primary text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Query</span>
            </button>
          </form>
        </div>

        {/* Right Column: Grounded Brief & Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          <div className="neo-raised p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Live business telemetry
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Active clients:</span>
                <span className="font-semibold text-white">{dailyBrief.activeClientsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Verified MRR:</span>
                <span className="font-semibold text-[var(--success)] font-mono-numbers">{dailyBrief.mrrFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Collected this month:</span>
                <span className="font-semibold text-white font-mono-numbers">{dailyBrief.collectedThisMonthFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Overdue invoices:</span>
                <span className="font-semibold text-[var(--danger)] font-mono-numbers">{dailyBrief.overdueFormatted}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Unread client messages:</span>
                <span className="font-semibold text-[var(--warning)] font-mono-numbers">{dailyBrief.unreadMessagesCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--text-muted)]">Blocked onboardings:</span>
                <span className="font-semibold text-[#00C6FF] font-mono-numbers">{dailyBrief.blockedOnboardingCount}</span>
              </div>
            </div>
          </div>

          <div className="neo-raised p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Safety invariants
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              The AI copilot does not have independent write access to create payments, delete clients, alter pricing, or waive invoices. All financial mutations must be explicitly reviewed and confirmed by an administrator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
