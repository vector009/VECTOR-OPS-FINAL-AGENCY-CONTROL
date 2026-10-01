import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export const AdminRoute: React.FC<RouteGuardProps> = ({ children, onNavigate }) => {
  const { profile, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#17181B] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-[#E2896A] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs text-[#8B8D93] font-medium tracking-wide">
          Verifying agency authorization...
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to /login
  if (!profile) {
    // If error exists, show error or redirect to login
    onNavigate('/login');
    return null;
  }

  // Role !== 'ADMIN' -> redirect to /portal/dashboard
  if (profile.role !== 'ADMIN') {
    onNavigate('/portal/dashboard');
    return null;
  }

  return <>{children}</>;
};

export const ClientRoute: React.FC<RouteGuardProps> = ({ children, onNavigate }) => {
  const { profile, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#17181B] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-2xl neo-raised flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-[#4CAF7D] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs text-[#8B8D93] font-medium tracking-wide">
          Verifying client authorization...
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to /login
  if (!profile) {
    onNavigate('/login');
    return null;
  }

  // Role !== 'CLIENT' -> redirect to /admin/dashboard
  if (profile.role !== 'CLIENT') {
    onNavigate('/admin/dashboard');
    return null;
  }

  return <>{children}</>;
};
