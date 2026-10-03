import React from 'react';
import { Mail, Link as LinkIcon } from 'lucide-react';
import { PaymentPlatform } from '../../types';

interface PlatformIconProps {
  platform: PaymentPlatform;
  className?: string;
  size?: number;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ 
  platform, 
  className = "w-4 h-4", 
  size = 16 
}) => {
  switch (platform) {
    case 'WHATSAPP':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`text-[#25D366] ${className}`}
        >
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      );

    case 'INSTAGRAM':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`text-[#E1306C] ${className}`}
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );

    case 'X':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="currentColor" 
          className={`text-[var(--text-primary)] ${className}`}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    case 'PAYPAL':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="currentColor" 
          className={`text-[#0079C1] ${className}`}
        >
          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.76A1.282 1.282 0 0 1 6.21 1.7h7.24c3.486 0 5.86 1.836 5.568 4.962-.31 3.327-2.738 5.176-6.02 5.176h-2.31l-1.353 8.5a.641.641 0 0 1-.633.54z" opacity="0.8" />
          <path d="M9.13 18.995l1.625-10.282a.641.641 0 0 1 .633-.54h4.82c3.486 0 5.86 1.836 5.568 4.962-.31 3.327-2.738 5.176-6.02 5.176h-2.31a.641.641 0 0 0-.633.54l-.79 4.96a.641.641 0 0 1-.633.54h-2.26z" />
        </svg>
      );

    case 'TELEGRAM':
      return (
        <svg 
          viewBox="0 0 24 24" 
          width={size} 
          height={size} 
          fill="currentColor" 
          className={`text-[#229ED9] ${className}`}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.18 3.35-1.39 3.73-1.39.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24-.03.38z" />
        </svg>
      );

    case 'EMAIL':
      return <Mail className={`text-[#E0A94C] ${className}`} size={size} />;

    case 'CUSTOM':
    default:
      return <LinkIcon className={`text-[#8B8D93] ${className}`} size={size} />;
  }
};
