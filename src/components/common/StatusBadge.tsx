import React from 'react';
import { 
  ClientServiceStatus, 
  BillingStatus, 
  InvoiceStatus, 
  AppointmentStatus, 
  TaskStatus, 
  OnboardingStatus
} from '../../types';

interface StatusBadgeProps {
  status: ClientServiceStatus | BillingStatus | InvoiceStatus | AppointmentStatus | TaskStatus | OnboardingStatus | string;
  type?: 'service' | 'billing' | 'invoice' | 'appointment' | 'task' | 'priority' | 'onboarding';
}

function toSentenceCase(str: string): string {
  if (!str) return '';
  const clean = str.replace(/_/g, ' ').toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'ACTIVE':
      case 'PAID':
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'COMPLETE':
      case 'LOW':
        return {
          bg: 'bg-[var(--accent-green)]/15',
          text: 'text-[var(--accent-green)]',
          dot: 'bg-[var(--accent-green)]',
        };

      case 'ONBOARDING':
      case 'CURRENT':
      case 'DUE_SOON':
      case 'IN_PROGRESS':
      case 'PROPOSED':
      case 'REQUESTED':
      case 'MEDIUM':
        return {
          bg: 'bg-[var(--accent-amber)]/15',
          text: 'text-[var(--accent-amber)]',
          dot: 'bg-[var(--accent-amber)]',
        };

      case 'OVERDUE':
      case 'SUSPENDED':
      case 'BLOCKED':
      case 'URGENT':
      case 'HIGH':
      case 'DECLINED':
      case 'CANCELLED':
      case 'NO_SHOW':
        return {
          bg: 'bg-[var(--accent-red)]/15',
          text: 'text-[var(--accent-red)]',
          dot: 'bg-[var(--accent-red)]',
        };

      case 'PARTIALLY_PAID':
        return {
          bg: 'bg-[var(--accent-blue)]/15',
          text: 'text-[var(--accent-blue)]',
          dot: 'bg-[var(--accent-blue)]',
        };

      case 'EXPIRED':
      case 'ARCHIVED':
      case 'VOID':
      default:
        return {
          bg: 'bg-white/[0.08]',
          text: 'text-[var(--text-muted)]',
          dot: 'bg-[var(--text-muted)]',
        };
    }
  };

  const { bg, text, dot } = getBadgeStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${bg} ${text} select-none transition-all`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{toSentenceCase(status)}</span>
    </span>
  );
};
