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
  const getDotAndTextColor = () => {
    switch (status) {
      case 'ACTIVE':
      case 'PAID':
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'COMPLETE':
      case 'LOW':
        return { dot: 'bg-[#4CAF7D]', text: 'text-[#4CAF7D]' };

      case 'ONBOARDING':
      case 'CURRENT':
      case 'DUE_SOON':
      case 'IN_PROGRESS':
      case 'PROPOSED':
      case 'MEDIUM':
        return { dot: 'bg-[#E0A94C]', text: 'text-[#E0A94C]' };

      case 'OVERDUE':
      case 'SUSPENDED':
      case 'BLOCKED':
      case 'URGENT':
      case 'HIGH':
      case 'DECLINED':
        return { dot: 'bg-[#E2604F]', text: 'text-[#E2604F]' };

      case 'PARTIALLY_PAID':
        return { dot: 'bg-[#E2896A]', text: 'text-[#E2896A]' };

      case 'CANCELLED':
      case 'EXPIRED':
      case 'ARCHIVED':
      case 'VOID':
      case 'NO_SHOW':
        return { dot: 'bg-[#8B8D93]', text: 'text-[#8B8D93] line-through' };

      default:
        return { dot: 'bg-[#8B8D93]', text: 'text-[#EDEAE2]' };
    }
  };

  const { dot, text } = getDotAndTextColor();

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${text} font-normal select-none`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{toSentenceCase(status)}</span>
    </span>
  );
};
