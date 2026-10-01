import { db } from './database';
import { formatUSD } from './timezone';

export interface DailyBrief {
  activeClientsCount: number;
  mrrFormatted: string;
  collectedThisMonthFormatted: string;
  outstandingFormatted: string;
  overdueFormatted: string;
  pendingAppointmentsCount: number;
  unreadMessagesCount: number;
  blockedOnboardingCount: number;
  attentionItems: {
    id: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    actionText: string;
    type: 'invoice' | 'message' | 'onboarding' | 'renewal';
  }[];
  executiveSummary: string;
}

/**
 * Generate daily AI brief using authoritative database state.
 * Never fabricates numbers. Calculates from database first.
 */
export function generateDailyBrief(): DailyBrief {
  const kpis = db.getAdminKPIs();
  const clients = db.getClients();
  const invoices = db.getInvoices();
  const messages = db.getMessages();
  const appointments = db.getAppointments();

  const attentionItems: DailyBrief['attentionItems'] = [];

  // Overdue invoices
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
  overdueInvoices.forEach(inv => {
    const client = clients.find(c => c.id === inv.client_id);
    attentionItems.push({
      id: `att_inv_${inv.id}`,
      title: `${client?.company_name || 'Client'} — Invoice Overdue`,
      description: `${inv.invoice_number} is overdue with an outstanding balance of ${formatUSD(inv.balance_due_cents)} (due ${inv.due_date}).`,
      severity: 'high',
      actionText: 'View Invoice',
      type: 'invoice',
    });
  });

  // Unread messages
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'CLIENT');
  unreadMessages.forEach(msg => {
    const thread = db.getThreads().find(t => t.id === msg.thread_id);
    const client = clients.find(c => c.id === thread?.client_id);
    attentionItems.push({
      id: `att_msg_${msg.id}`,
      title: `${client?.company_name || 'Client'} — Unanswered Message`,
      description: `"${msg.body.slice(0, 75)}${msg.body.length > 75 ? '...' : ''}"`,
      severity: 'high',
      actionText: 'Reply',
      type: 'message',
    });
  });

  // Blocked onboarding
  clients.forEach(c => {
    const items = db.getOnboardingItems(c.id);
    const blockedItem = items.find(s => s.status === 'BLOCKED');
    if (blockedItem) {
      attentionItems.push({
        id: `att_obs_${c.id}`,
        title: `${c.company_name} — Onboarding Blocked`,
        description: `Blocked on step ${blockedItem.step_order}: ${blockedItem.title}.`,
        severity: 'high',
        actionText: 'Review Onboarding',
        type: 'onboarding',
      });
    }
  });

  // Upcoming renewals (7-day window)
  const now = new Date();
  const subscriptions = db.getSubscriptions();
  subscriptions.forEach(sub => {
    if (sub.status !== 'ACTIVE') return;
    const client = clients.find(c => c.id === sub.client_id);
    const nextDate = new Date(sub.next_billing_date);
    const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays <= 7) {
      attentionItems.push({
        id: `att_sub_${sub.id}`,
        title: `${client?.company_name || 'Client'} — Renewal Approaching`,
        description: `Monthly renewal for ${sub.service_name} (${formatUSD(sub.recurring_fee_cents)}) is scheduled for ${sub.next_billing_date} (${diffDays} days).`,
        severity: 'medium',
        actionText: 'Review Renewal Draft',
        type: 'renewal',
      });
    }
  });

  const executiveSummary = `VectorOps OS is tracking ${kpis.activeClientsCount} active clients generating ${formatUSD(kpis.mrrCents)} in monthly recurring revenue. You have collected ${formatUSD(kpis.collectedThisMonthCents)} this calendar month. ${attentionItems.length > 0 ? `${attentionItems.length} operational priorities require your attention today.` : 'All agency systems and client accounts are nominal.'}`;

  return {
    activeClientsCount: kpis.activeClientsCount,
    mrrFormatted: formatUSD(kpis.mrrCents),
    collectedThisMonthFormatted: formatUSD(kpis.collectedThisMonthCents),
    outstandingFormatted: formatUSD(kpis.outstandingCents),
    overdueFormatted: formatUSD(kpis.overdueCents),
    pendingAppointmentsCount: kpis.pendingAppointmentsCount,
    unreadMessagesCount: kpis.unreadMessagesCount,
    blockedOnboardingCount: kpis.blockedOnboardingCount,
    attentionItems,
    executiveSummary,
  };
}

/**
 * Natural language business query evaluator (Section 31)
 * Extracts real facts from authoritative database records
 */
export function queryBusinessAssistant(query: string): string {
  const q = query.toLowerCase();
  const kpis = db.getAdminKPIs();
  const clients = db.getClients();
  const invoices = db.getInvoices();

  if (q.includes('collect') || q.includes('revenue') || q.includes('this month')) {
    return `Authoritative Record: You have collected ${formatUSD(kpis.collectedThisMonthCents)} this month from recorded payments. Setup fees collected this month: ${formatUSD(kpis.setupFeePaymentsCents)}.`;
  }

  if (q.includes('mrr') || q.includes('recurring')) {
    return `Authoritative Record: Current Monthly Recurring Revenue (MRR) is ${formatUSD(kpis.mrrCents)} across ${kpis.activeClientsCount} active subscription retainers (excluding one-time setup fees).`;
  }

  if (q.includes('overdue')) {
    const overdue = invoices.filter(i => i.status === 'OVERDUE');
    if (overdue.length === 0) return 'There are currently zero overdue invoices across all client accounts.';
    const details = overdue.map(i => {
      const c = clients.find(cl => cl.id === i.client_id);
      return `${c?.company_name}: ${i.invoice_number} balance ${formatUSD(i.balance_due_cents)} (due ${i.due_date})`;
    }).join('; ');
    return `Authoritative Record: Total overdue balance is ${formatUSD(kpis.overdueCents)} across ${overdue.length} invoice(s): ${details}.`;
  }

  if (q.includes('retell') || q.includes('workspace')) {
    const missing = clients.filter(c => !c.retell_workspace_url);
    if (missing.length === 0) return 'All active clients have configured Retell workspace links.';
    return `Retell Status: ${missing.length} client(s) are missing Retell workspaces: ${missing.map(m => m.company_name).join(', ')}.`;
  }

  if (q.includes('appointment') || q.includes('meeting')) {
    const requested = db.getAppointments().filter(a => a.status === 'REQUESTED');
    if (requested.length === 0) return 'There are no pending appointment requests awaiting admin review.';
    return `You have ${requested.length} appointment request(s) awaiting approval: ${requested.map(r => `'${r.topic}'`).join(', ')}.`;
  }

  return `System Status: ${kpis.activeClientsCount} active clients, MRR ${formatUSD(kpis.mrrCents)}, Collected ${formatUSD(kpis.collectedThisMonthCents)}, Outstanding ${formatUSD(kpis.outstandingCents)}, Overdue ${formatUSD(kpis.overdueCents)}. Pending appointments: ${kpis.pendingAppointmentsCount}, Unread messages: ${kpis.unreadMessagesCount}.`;
}
