import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
  // Root URL ("/") ALWAYS starts at "/" and renders the public landing page!
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== '/') return hash.startsWith('/') ? hash : `/${hash}`;
      const path = window.location.pathname;
      if (path && path !== '') return path;
    }
    return '/';
  });

  const navigate = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    setCurrentPath(cleanPath);
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState(null, '', cleanPath);
        if (cleanPath === '/' || cleanPath === '') {
          if (window.location.hash) {
            window.history.replaceState(null, '', '/');
          }
        } else {
          window.location.hash = cleanPath;
        }
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== '/') {
        setCurrentPath(hash.startsWith('/') ? hash : `/${hash}`);
      } else {
        const path = window.location.pathname;
        setCurrentPath(path || '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Handle Login route auto-skip if session is already active:
  // "They'd click 'Login' (which can detect their existing session and skip straight to their dashboard)"
  // Notice: We NEVER redirect when currentPath is "/"! Root URL always renders the landing page!
  useEffect(() => {
    if (!isLoading && currentPath === '/login' && profile) {
      if (profile.role === 'ADMIN') {
        navigate('/admin');
      } else if (profile.role === 'CLIENT') {
        navigate('/client');
      }
    }
  }, [currentPath, profile, isLoading]);

  // Loading state during initial profile fetch ONLY for protected dashboard routes!
  // When hitting "/" or "/login", we NEVER block the visitor behind a full loading screen!
  const isProtectedRoute = currentPath.startsWith('/admin') || currentPath.startsWith('/client') || currentPath.startsWith('/portal');
  if (isLoading && isProtectedRoute) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl neo-raised flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs text-[var(--text-secondary)] font-medium tracking-wide">
          Loading VectorOps session...
        </div>
      </div>
    );
  }

  // 1. Route: /login
  if (currentPath === '/login') {
    // If already logged in, wait for redirect effect to dashboard
    if (profile) {
      return null;
    }
    return <LoginPage onNavigate={navigate} />;
  }

  // 2. Route: /admin or /admin/*
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
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
          onBackToLanding={() => navigate('/')}
          onSwitchToClient={() => navigate('/client')}
        />
      </AdminRoute>
    );
  }

  // 3. Route: /client or /client/* or /portal or /portal/*
  if (
    currentPath === '/client' ||
    currentPath.startsWith('/client/') ||
    currentPath === '/portal' ||
    currentPath.startsWith('/portal/')
  ) {
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
          onBackToLanding={() => navigate('/')}
          onSwitchToAdmin={() => navigate('/admin')}
        />
      </ClientRoute>
    );
  }

  // 4. Root ("/") and all other public routes: ALWAYS render the public landing page!
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
      onEnterAdmin={() => navigate('/admin')}
      onEnterClient={() => navigate('/client')}
      onOpenAuth={() => navigate('/login')}
      onLogout={signOut}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
          <AppContent />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
