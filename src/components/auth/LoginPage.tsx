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
      onNavigate(result.redirect);
    }
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <button
          onClick={() => onNavigate('/landing')}
          className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-xl neo-raised transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public site</span>
        </button>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-[#0E1512] font-semibold text-xs flex items-center justify-center">
              VO
            </div>
            <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">VectorOps</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="p-8 rounded-[24px] neo-focal space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">
              Sign in to VectorOps
            </h1>
            <p className="text-xs text-[#8B8D93]">
              Enter your email and password to access your autonomous workspace.
            </p>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="p-3.5 rounded-xl neo-inset text-xs text-[#E2604F] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium leading-relaxed">{displayError}</span>
            </div>
          )}

          {/* Single Form: Just Email + Password (NO role selector) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#EDEAE2] block">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-[#8B8D93] pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                  className="w-full pl-10 pr-3.5 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] placeholder-[#8B8D93]/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#EDEAE2] block">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-[#8B8D93] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                  className="w-full pl-10 pr-10 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] placeholder-[#8B8D93]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#8B8D93] hover:text-[#EDEAE2] transition-colors"
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
                className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#17181B] border-t-transparent rounded-full animate-spin" />
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
      <div className="text-center text-[11px] text-[#8B8D93] py-2">
        VectorOps &copy; 2026. Automated role detection and enterprise security.
      </div>
    </div>
  );
};
