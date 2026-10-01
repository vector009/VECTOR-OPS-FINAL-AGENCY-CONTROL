import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AdminRoute, ClientRoute } from './components/auth/RouteGuards';
import { AdminShell } from './components/admin/AdminShell';
import { ClientPortal } from './components/client/ClientPortal';
import { VoiceIntelligenceHero3D } from './components/landing/VoiceIntelligenceHero3D';
import { db } from './lib/database';

function AppContent() {
  const { profile, isLoading, signOut } = useAuth();
  const [dbRevision, setDbRevision] = useState(0);

  // Subscribe to reactive database changes
  useEffect(() => {
    const unsubscribeDb = db.subscribe(() => {
      setDbRevision(prev => prev + 1);
    });
    return () => {
      unsubscribeDb();
    };
  }, []);

  // Determine path from window.location.pathname or window.location.hash
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash.startsWith('/') ? hash : `/${hash}`;
      const path = window.location.pathname;
      if (path && path !== '/') return path;
    }
    return '/login';
  });

  const navigate = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    setCurrentPath(cleanPath);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, '', cleanPath);
        window.location.hash = cleanPath;
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        setCurrentPath(hash.startsWith('/') ? hash : `/${hash}`);
      } else {
        const path = window.location.pathname;
        setCurrentPath(path && path !== '/' ? path : '/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Handle Root Redirect
  useEffect(() => {
    if (!isLoading && (currentPath === '/' || currentPath === '')) {
      if (!profile) {
        navigate('/login');
      } else if (profile.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (profile.role === 'CLIENT') {
        navigate('/portal/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [currentPath, profile, isLoading]);

  // Loading state during initial profile fetch
  if (isLoading && currentPath !== '/landing') {
    return (
      <div className="min-h-screen bg-[#17181B] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-[#E2896A] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs text-[#8B8D93] font-medium tracking-wide">
          Loading VectorOps session...
        </div>
      </div>
    );
  }

  // 1. Route: /login
  if (currentPath === '/login') {
    // If already logged in, redirect to respective dashboard
    if (profile) {
      if (profile.role === 'ADMIN') {
        navigate('/admin/dashboard');
        return null;
      } else if (profile.role === 'CLIENT') {
        navigate('/portal/dashboard');
        return null;
      }
    }
    return <LoginPage onNavigate={navigate} />;
  }

  // 2. Route: /landing
  if (currentPath === '/landing') {
    return (
      <VoiceIntelligenceHero3D
        currentUser={profile ? {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          full_name: profile.full_name,
          timezone: profile.timezone,
          client_id: profile.client_id,
          created_at: new Date().toISOString(),
        } : null}
        onEnterAdmin={() => navigate('/admin/dashboard')}
        onEnterClient={() => navigate('/portal/dashboard')}
        onOpenAuth={() => navigate('/login')}
        onLogout={signOut}
      />
    );
  }

  // 3. Route: /admin/dashboard or any /admin/* route
  if (currentPath.startsWith('/admin')) {
    return (
      <AdminRoute onNavigate={navigate}>
        <AdminShell
          key={`admin-${dbRevision}-${profile?.id || 'admin'}`}
          currentUser={profile ? {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            full_name: profile.full_name,
            timezone: profile.timezone,
            client_id: profile.client_id,
            created_at: new Date().toISOString(),
          } : null}
          onLogout={signOut}
          onBackToLanding={() => navigate('/landing')}
          onSwitchToClient={() => navigate('/portal/dashboard')}
        />
      </AdminRoute>
    );
  }

  // 4. Route: /portal/dashboard or any /portal/* route
  if (currentPath.startsWith('/portal')) {
    return (
      <ClientRoute onNavigate={navigate}>
        <ClientPortal
          key={`client-${dbRevision}-${profile?.id || 'client'}`}
          currentUser={profile ? {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            full_name: profile.full_name,
            timezone: profile.timezone,
            client_id: profile.client_id,
            created_at: new Date().toISOString(),
          } : null}
          onLogout={signOut}
          onBackToLanding={() => navigate('/landing')}
          onSwitchToAdmin={() => navigate('/admin/dashboard')}
        />
      </ClientRoute>
    );
  }

  // Fallback -> /login
  return <LoginPage onNavigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#17181B] text-[#EDEAE2]">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
