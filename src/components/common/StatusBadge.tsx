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
          bg: 'bg-[var(--success)]/15',
          text: 'text-[var(--success)]',
          border: 'border border-[var(--success)]/30',
          dot: 'bg-[var(--success)] shadow-[0_0_6px_var(--success)]',
        };

      case 'ONBOARDING':
      case 'CURRENT':
      case 'DUE_SOON':
      case 'IN_PROGRESS':
      case 'PROPOSED':
      case 'REQUESTED':
      case 'MEDIUM':
        return {
          bg: 'bg-[var(--warning)]/15',
          text: 'text-[var(--warning)]',
          border: 'border border-[var(--warning)]/30',
          dot: 'bg-[var(--warning)] shadow-[0_0_6px_var(--warning)]',
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
          bg: 'bg-[var(--danger)]/15',
          text: 'text-[var(--danger)]',
          border: 'border border-[var(--danger)]/30',
          dot: 'bg-[var(--danger)] shadow-[0_0_6px_var(--danger)]',
        };

      case 'PARTIALLY_PAID':
        return {
          bg: 'bg-[var(--info)]/15',
          text: 'text-[var(--info)]',
          border: 'border border-[var(--info)]/30',
          dot: 'bg-[var(--info)] shadow-[0_0_6px_var(--info)]',
        };

      case 'EXPIRED':
      case 'ARCHIVED':
      case 'VOID':
      default:
        return {
          bg: 'bg-white/[0.06]',
          text: 'text-[var(--text-muted)]',
          border: 'border border-white/[0.12]',
          dot: 'bg-[var(--text-muted)]',
        };
    }
  };

  const { bg, text, border, dot } = getBadgeStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${bg} ${text} ${border} select-none backdrop-blur-sm transition-all`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{toSentenceCase(status)}</span>
    </span>
  );
};
