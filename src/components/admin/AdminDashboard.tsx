import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { db } from '../../lib/database';
import { formatUSD } from '../../lib/timezone';
import { generateDailyBrief } from '../../lib/ai-copilot';

interface AdminDashboardProps {
  onNavigateTab: (tab: string, context?: any) => void;
  onOpenOnboarding: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
}) => {
  const kpis = db.getAdminKPIs();
  const dailyBrief = generateDailyBrief();
  const auditLogs = db.getAuditLogs().slice(0, 6);
  const [showFullBrief, setShowFullBrief] = useState(false);

  return (
    <div className="space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Operations dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Live agency state, financials, and automated triage</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('copilot')}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>AI Copilot console</span>
          </button>
        </div>
      </div>

      {/* FOCAL ELEMENT: AI Briefing Panel (Surface-2 with Surface-3 nested stat card) */}
      <div className="p-7 rounded-3xl neo-briefing space-y-5 animate-in fade-in duration-300 bg-[var(--surface-2)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">Autonomous agency briefing</h2>
          </div>
          <button
            onClick={() => setShowFullBrief(!showFullBrief)}
            className="text-xs font-medium text-[var(--accent-blue)] hover:underline transition-colors px-2.5 py-1 rounded-lg neo-inset self-start sm:self-auto"
          >
            {showFullBrief ? 'Collapse brief' : 'View full brief'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed max-w-3xl">
            {dailyBrief.executiveSummary}
          </p>

          {/* SURFACE-3 Depth Tier: Subtly raised sub-card inside the briefing panel for the focal number */}
          <div className="surface-3 px-5 py-3.5 rounded-2xl neo-surface-3 shrink-0 space-y-0.5 border border-white/[0.04]">
            <span className="text-[11px] font-mono uppercase text-[var(--text-muted)] block tracking-wider">
              Current MRR
            </span>
            <span className="text-2xl font-bold font-mono-numbers text-[var(--accent-green)] block">
              {dailyBrief.mrrFormatted}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] block">Authoritative integer ledger</span>
          </div>
        </div>

        {showFullBrief && (
          <div className="pt-4 mt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl neo-inset space-y-1">
              <span className="text-[var(--text-muted)] block text-[11px]">Authoritative MRR</span>
              <span className="font-mono-numbers text-base font-semibold text-[var(--accent-green)]">{dailyBrief.mrrFormatted}</span>
            </div>
            <div className="p-3.5 rounded-xl neo-inset space-y-1">
              <span className="text-[var(--text-muted)] block text-[11px]">Collected this month</span>
              <span className="font-mono-numbers text-base font-semibold text-[var(--accent-green)]">{dailyBrief.collectedThisMonthFormatted}</span>
            </div>
            <div className="p-3.5 rounded-xl neo-inset space-y-1">
              <span className="text-[var(--text-muted)] block text-[11px]">Pending balance</span>
              <span className="font-mono-numbers text-base font-semibold text-[var(--accent-amber)]">{dailyBrief.outstandingFormatted}</span>
            </div>
            <div className="p-3.5 rounded-xl neo-inset space-y-1">
              <span className="text-[var(--text-muted)] block text-[11px]">Overdue balance</span>
              <span className="font-mono-numbers text-base font-semibold text-[var(--accent-red)]">{dailyBrief.overdueFormatted}</span>
            </div>
          </div>
        )}
      </div>

      {/* 6 KPI Cards — Surface-2 background, green strictly for money, blue for action links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Active clients (Secondary) */}
        <div className="neo-kpi-secondary p-4 rounded-2xl bg-[var(--surface-2)] space-y-1.5">
          <div className="text-xs text-[var(--text-muted)]">Active clients</div>
          <div className="text-2xl font-semibold font-mono-numbers tracking-tight text-[var(--text-primary)]">
            {kpis.activeClientsCount}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Verified accounts</div>
        </div>

        {/* 2. Monthly recurring revenue (Money positive: Green) */}
        <div className="neo-kpi-primary p-4 rounded-2xl bg-[var(--surface-2)] space-y-1.5 relative flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-[var(--text-muted)]">Monthly recurring revenue</div>
              <span className="text-[9px] uppercase tracking-wider font-bold bg-[var(--accent-green)]/15 text-[var(--accent-green)] px-1.5 py-0.5 rounded">MRR</span>
            </div>
            <div className="text-2xl sm:text-[26px] font-semibold font-mono-numbers tracking-tight text-[var(--accent-green)] flex items-center gap-1.5">
              <span>{formatUSD(kpis.mrrCents)}</span>
              <TrendingUp className="w-4 h-4 text-[var(--accent-green)] shrink-0" />
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Primary recurring cashflow</div>
          </div>
          <button
            onClick={() => onNavigateTab('revenue')}
            className="pt-1.5 text-[11px] font-medium text-[var(--accent-blue)] hover:underline flex items-center gap-1 text-left cursor-pointer transition-colors"
          >
            <span>View revenue report</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* 3. Collected this month (Money positive: Green) */}
        <div className="neo-kpi-primary p-4 rounded-2xl bg-[var(--surface-2)] space-y-1.5 relative flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-[var(--text-muted)]">Collected this month</div>
              <span className="text-[9px] uppercase tracking-wider font-bold bg-[var(--accent-green)]/15 text-[var(--accent-green)] px-1.5 py-0.5 rounded">Cash</span>
            </div>
            <div className="text-2xl sm:text-[26px] font-semibold font-mono-numbers tracking-tight text-[var(--accent-green)]">
              {formatUSD(kpis.collectedThisMonthCents)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">Deposited MTD</div>
          </div>
          <button
            onClick={() => onNavigateTab('revenue')}
            className="pt-1.5 text-[11px] font-medium text-[var(--accent-blue)] hover:underline flex items-center gap-1 text-left cursor-pointer transition-colors"
          >
            <span>View revenue report</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* 4. Outstanding balance (Warning: Amber) */}
        <div className="neo-kpi-secondary p-4 rounded-2xl bg-[var(--surface-2)] space-y-1.5">
          <div className="text-xs text-[var(--text-muted)]">Outstanding balance</div>
          <div className="text-2xl font-semibold font-mono-numbers tracking-tight text-[var(--accent-amber)]">
            {formatUSD(kpis.outstandingCents)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Pending collections</div>
        </div>

        {/* 5. Overdue balance (Danger: Red) */}
        <div className="neo-kpi-secondary p-4 rounded-2xl bg-[var(--surface-2)] space-y-1.5">
          <div className="text-xs text-[var(--text-muted)]">Overdue balance</div>
          <div className="text-2xl font-semibold font-mono-numbers tracking-tight text-[var(--accent-red)]">
            {formatUSD(kpis.overdueCents)}
          </div>
          <div className="text-[10px] text-[var(--accent-red)]">Requires follow-up</div>
        </div>

        {/* 6. Setup fees (Money: Green) */}
        <div className="neo-kpi-secondary p-4 rounded-2xl bg-[var(--surface-2)] space-y-1.5">
          <div className="text-xs text-[var(--text-muted)]">Setup fees collected</div>
          <div className="text-2xl font-semibold font-mono-numbers tracking-tight text-[var(--accent-green)]">
            {formatUSD(kpis.setupFeePaymentsCents)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">One-time onboarding</div>
        </div>
      </div>

      {/* Main Content Grid: Needs attention triage & Recent audit activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Needs attention triage */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#EDEAE2]">Needs attention</h2>
            <span className="text-xs text-[#8B8D93]">
              {dailyBrief.attentionItems.length} {dailyBrief.attentionItems.length === 1 ? 'item requires action' : 'items require action'}
            </span>
          </div>

          <div className="space-y-3.5">
            {dailyBrief.attentionItems.length === 0 ? (
              <div className="p-8 rounded-[16px] neo-raised bg-[#1D1F23] text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-[#4CAF7D] mx-auto" />
                <div className="text-sm font-semibold text-[#EDEAE2]">All caught up</div>
                <div className="text-xs text-[#8B8D93]">No overdue invoices, unread messages, or pending holds.</div>
              </div>
            ) : (
              dailyBrief.attentionItems.map((item) => {
                const isUrgent = item.severity === 'high';
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-[16px] neo-item-raised bg-[#1D1F23] flex items-start justify-between gap-4 transition-transform hover:translate-y-[-1px]"
                    style={{
                      backgroundColor: '#1D1F23',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '-8px -8px 16px rgba(255,255,255,0.03), 8px 8px 16px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isUrgent ? 'bg-[#E2604F]' : 'bg-[#E0A94C]'}`} />
                        <span className="truncate">{item.title}</span>
                        {isUrgent && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#E2604F]/10 text-[#E2604F] shrink-0">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B8D93] leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (item.type === 'invoice') onNavigateTab('invoices');
                        else if (item.type === 'message') onNavigateTab('messages');
                        else if (item.type === 'onboarding') onNavigateTab('clients');
                        else if (item.type === 'renewal') onNavigateTab('subscriptions');
                      }}
                      className="btn-secondary text-xs px-3.5 py-1.5 whitespace-nowrap shrink-0 flex items-center gap-1.5"
                    >
                      <span>{item.actionText}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#00C6FF]" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick shortcuts — raised and tactile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
            <button
              onClick={() => onNavigateTab('appointments')}
              className="p-4 rounded-[16px] neo-raised bg-[#1D1F23] text-left transition-all hover:translate-y-[-1px] cursor-pointer"
            >
              <div className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00C6FF]" />
                <span>Appointments</span>
              </div>
              <div className="text-xs text-[#8B8D93] mt-1 font-mono-numbers">
                {kpis.pendingAppointmentsCount} requested
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('messages')}
              className="p-4 rounded-[16px] neo-raised bg-[#1D1F23] text-left transition-all hover:translate-y-[-1px] cursor-pointer"
            >
              <div className="text-xs font-semibold text-[#EDEAE2] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#4CAF7D]" />
                <span>Client messages</span>
              </div>
              <div className="text-xs text-[#8B8D93] mt-1 font-mono-numbers">
                {kpis.unreadMessagesCount} unread
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('payments')}
              className="p-4 rounded-[16px] neo-raised bg-[#1D1F23] text-left transition-all hover:translate-y-[-1px] cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="text-xs font-semibold text-[#EDEAE2]">Record payment</div>
              <div className="text-xs text-[#8B8D93] mt-1">Wire, Wise, PayPal</div>
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Live audit log — Raised neumorphic container with soft shadow */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#EDEAE2]">Live audit log</h2>
            <button
              onClick={() => onNavigateTab('audit')}
              className="text-xs text-[#8B8D93] hover:text-[#EDEAE2] transition-colors"
            >
              View full log
            </button>
          </div>

          <div className="neo-raised bg-[#1D1F23] rounded-[16px] overflow-hidden p-3 space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl neo-inset space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-xs text-[#00C6FF]">
                    {log.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                  </span>
                  <span className="text-[11px] text-[#8B8D93] font-mono-numbers">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#EDEAE2] leading-snug">
                  {log.details}
                </p>
                <div className="text-[11px] text-[#8B8D93]">
                  {log.actor_name}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
