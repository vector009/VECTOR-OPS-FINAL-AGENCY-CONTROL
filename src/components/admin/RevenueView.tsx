import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Layers, 
  RotateCcw,
  Receipt,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { db } from '../../lib/database';
import { formatUSD } from '../../lib/timezone';
import { RevenueSummary, RevenueByMonth, RevenueByYear } from '../../types';

export const RevenueView: React.FC = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<RevenueByMonth[]>([]);
  const [yearlyData, setYearlyData] = useState<RevenueByYear[]>([]);
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredBar, setHoveredBar] = useState<{ label: string; amount: number; count: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, monthly, yearly] = await Promise.all([
        db.getRevenueSummary(),
        db.getRevenueByMonth(),
        db.getRevenueByYear()
      ]);
      setSummary(sum);
      setMonthlyData(monthly);
      setYearlyData(yearly);
    } catch (err) {
      console.error('Failed to load revenue data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format month label e.g. "2026-01-01" -> "Jan"
  const formatMonthLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  // Format year label e.g. "2026-01-01" -> "2026"
  const formatYearLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.getUTCFullYear().toString();
    } catch {
      return dateStr;
    }
  };

  const chartData = timeframe === 'monthly'
    ? monthlyData.map(d => ({
        label: formatMonthLabel(d.month),
        fullLabel: d.month,
        revenueCents: d.revenue_cents,
        count: d.payment_count
      }))
    : yearlyData.map(d => ({
        label: formatYearLabel(d.year),
        fullLabel: d.year,
        revenueCents: d.revenue_cents,
        count: d.payment_count
      }));

  const maxRevenueCents = Math.max(
    ...chartData.map(d => d.revenueCents),
    100000 // default minimum peak: $1,000 to avoid zero-division
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Revenue analytics</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Authoritative cashflow from PostgreSQL views and transaction ledger
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-2 self-start sm:self-auto"
          title="Refresh ledger totals"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh ledger</span>
        </button>
      </div>

      {/* 3 Summary Numbers at Top (Neumorphic Raised Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Lifetime Revenue */}
        <div className="neo-kpi-primary p-5 rounded-[16px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#E2896A]">Lifetime revenue</span>
            <span className="text-[9px] uppercase tracking-wider font-bold bg-[#E2896A]/20 text-[#E2896A] px-1.5 py-0.5 rounded">All-Time</span>
          </div>
          <div className="text-3xl font-semibold font-mono-numbers tracking-tight text-[#4CAF7D]">
            {summary ? formatUSD(summary.lifetime_revenue_cents) : '$0.00'}
          </div>
          <div className="text-[11px] text-[#8B8D93]">
            Total settled payments collected
          </div>
        </div>

        {/* This Year */}
        <div className="neo-raised p-5 rounded-[16px] space-y-1.5">
          <div className="text-xs text-[#8B8D93]">This year</div>
          <div className="text-3xl font-semibold font-mono-numbers tracking-tight text-[#EDEAE2]">
            {summary ? formatUSD(summary.this_year_revenue_cents) : '$0.00'}
          </div>
          <div className="text-[11px] text-[#8B8D93]">
            Calendar year collections to date
          </div>
        </div>

        {/* This Month */}
        <div className="neo-raised p-5 rounded-[16px] space-y-1.5">
          <div className="text-xs text-[#8B8D93]">This month</div>
          <div className="text-3xl font-semibold font-mono-numbers tracking-tight text-[#EDEAE2]">
            {summary ? formatUSD(summary.this_month_revenue_cents) : '$0.00'}
          </div>
          <div className="text-[11px] text-[#4CAF7D] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
            <span>Active billing period</span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="neo-raised p-6 sm:p-7 rounded-[20px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#EDEAE2] tracking-tight">Revenue trajectory</h2>
            <p className="text-xs text-[#8B8D93] mt-0.5">
              {timeframe === 'monthly' ? 'Monthly settled collections from January through December' : 'Annual revenue across all recorded years'}
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center p-1 rounded-xl neo-inset bg-[#17181B] self-start sm:self-auto">
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                timeframe === 'monthly'
                  ? 'bg-[#1D1F23] text-[#EDEAE2] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              Monthly (Jan – Dec)
            </button>
            <button
              onClick={() => setTimeframe('yearly')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                timeframe === 'yearly'
                  ? 'bg-[#1D1F23] text-[#EDEAE2] shadow-[0_2px_8px_rgba(0,0,0,0.5)]'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="pt-2">
          {/* Active tooltip indicator */}
          <div className="h-7 mb-2 flex items-center justify-between text-xs">
            {hoveredBar ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[#EDEAE2]">{hoveredBar.label}:</span>
                <span className="font-mono-numbers text-sm font-semibold text-[#E2896A]">
                  {formatUSD(hoveredBar.amount)}
                </span>
                <span className="text-[11px] text-[#8B8D93]">
                  ({hoveredBar.count} {hoveredBar.count === 1 ? 'payment' : 'payments'})
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-[#8B8D93] italic">
                Hover over bars to inspect payment breakdown
              </span>
            )}
            <span className="text-[11px] text-[#8B8D93] font-mono-numbers">
              Peak: {formatUSD(maxRevenueCents)}
            </span>
          </div>

          {/* High-fidelity CSS / SVG Bar Chart */}
          <div className="w-full h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 rounded-xl neo-inset bg-[#17181B] relative">
            {/* Background horizontal guide lines */}
            <div className="absolute inset-x-0 top-1/4 border-b border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-x-0 top-2/4 border-b border-white/[0.03] pointer-events-none" />
            <div className="absolute inset-x-0 top-3/4 border-b border-white/[0.03] pointer-events-none" />

            {chartData.map((item, idx) => {
              const heightPercent = maxRevenueCents > 0 
                ? Math.max(Math.round((item.revenueCents / maxRevenueCents) * 100), item.revenueCents > 0 ? 4 : 2)
                : 2;

              const isZero = item.revenueCents === 0;

              return (
                <div
                  key={idx}
                  className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredBar({ label: item.label, amount: item.revenueCents, count: item.count })}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Visual Bar with Accent Color #E2896A */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 relative ${
                      isZero
                        ? 'bg-[#1D1F23]/60 hover:bg-[#1D1F23]'
                        : 'bg-[#E2896A] hover:bg-[#EA9679] hover:shadow-[0_0_12px_rgba(226,137,106,0.4)]'
                    }`}
                  >
                    {!isZero && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-mono-numbers bg-[#1D1F23] px-1.5 py-0.5 rounded shadow text-[#EDEAE2] z-10 pointer-events-none">
                        {formatUSD(item.revenueCents)}
                      </div>
                    )}
                  </div>

                  {/* X-axis Label */}
                  <span className="text-[10px] text-[#8B8D93] group-hover:text-[#EDEAE2] transition-colors mt-2 text-center truncate max-w-full font-mono">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown Row Below Chart: Lifetime Setup-fee vs Recurring Revenue */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E2896A]" />
          <h3 className="text-sm font-semibold text-[#EDEAE2]">Revenue model breakdown</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Setup Fees */}
          <div className="neo-raised p-5 rounded-[16px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8B8D93]">Lifetime setup fees</span>
              <Receipt className="w-4 h-4 text-[#E2896A]" />
            </div>
            <div className="text-2xl font-semibold font-mono-numbers tracking-tight text-[#EDEAE2]">
              {summary ? formatUSD(summary.lifetime_setup_fees_cents) : '$0.00'}
            </div>
            <p className="text-[11px] text-[#8B8D93] leading-relaxed">
              One-time agency client onboarding and voice telephony infrastructure setup charges.
            </p>
          </div>

          {/* Recurring Retainers */}
          <div className="neo-raised p-5 rounded-[16px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8B8D93]">Lifetime recurring retainers</span>
              <TrendingUp className="w-4 h-4 text-[#4CAF7D]" />
            </div>
            <div className="text-2xl font-semibold font-mono-numbers tracking-tight text-[#4CAF7D]">
              {summary ? formatUSD(summary.lifetime_recurring_cents) : '$0.00'}
            </div>
            <p className="text-[11px] text-[#8B8D93] leading-relaxed">
              Continuous monthly voice agent AI service retainers and ongoing SLA subscription contracts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
