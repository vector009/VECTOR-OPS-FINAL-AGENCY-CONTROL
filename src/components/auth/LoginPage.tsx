import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../context/ThemeContext';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setLocalError('Please enter your password.');
      return;
    }

    const result = await signIn(email, password);
    if (result.success && result.redirect) {
      const target = result.redirect.startsWith('/admin') ? '/admin' : '/client';
      onNavigate(target);
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <button
          onClick={() => onNavigate('/')}
          className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public site</span>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer hover:opacity-85 transition-opacity"
            title="Return to Public Site"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.5L2.5 20.5H21.5L12 2.5Z" fill="url(#login-delta)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinejoin="round" />
                <path d="M12 7.5L6.5 18H17.5L12 7.5Z" fill="#0B0F17" opacity="0.6" />
                <defs>
                  <linearGradient id="login-delta" x1="2.5" y1="2.5" x2="21.5" y2="20.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9B51E0" />
                    <stop offset="0.5" stopColor="#7662FA" />
                    <stop offset="1" stopColor="#00C6FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-none">
                Vector<span className="text-gradient-purple-blue">Ops</span>
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)] mt-0.5 leading-none font-mono">
                AI AUTOMATION AGENCY
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="p-8 rounded-[24px] glass-card bg-[var(--card-bg)] border border-[var(--card-border)] space-y-6 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              Sign in to VectorOps
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Enter your email and password to access your autonomous workspace.
            </p>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="p-3.5 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-xs text-[var(--danger)] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium leading-relaxed">{displayError}</span>
            </div>
          )}

          {/* Single Form: Just Email + Password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text)] block">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text)] block">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                  className="w-full pl-10 pr-10 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 rounded-full flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[var(--text-muted)] py-2 font-mono">
        VectorOps &copy; 2026. Automated role detection and enterprise security.
      </div>
    </div>
  );
};
