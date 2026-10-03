import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export const AdminRoute: React.FC<RouteGuardProps> = ({ children, onNavigate }) => {
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        onNavigate('/login');
      } else if (profile.role !== 'ADMIN') {
        onNavigate('/portal/dashboard');
      }
    }
  }, [profile, isLoading, onNavigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] font-medium tracking-wide">
          Verifying agency authorization...
        </div>
      </div>
    );
  }

  // Not authenticated or wrong role
  if (!profile || profile.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
};

export const ClientRoute: React.FC<RouteGuardProps> = ({ children, onNavigate }) => {
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!profile) {
        onNavigate('/login');
      } else if (profile.role !== 'CLIENT') {
        onNavigate('/admin/dashboard');
      }
    }
  }, [profile, isLoading, onNavigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] font-medium tracking-wide">
          Verifying client authorization...
        </div>
      </div>
    );
  }

  // Not authenticated or wrong role
  if (!profile || profile.role !== 'CLIENT') {
    return null;
  }

  return <>{children}</>;
};
