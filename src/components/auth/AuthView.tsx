import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Globe, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { auth } from '../../lib/auth';
import { AuthUser, UserRole } from '../../types';

interface AuthViewProps {
  initialRole?: UserRole;
  onAuthSuccess: (user: AuthUser) => void;
  onBackToLanding: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialRole = 'ADMIN',
  onAuthSuccess,
  onBackToLanding,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim()) {
          setError('Please provide your account email address.');
          setIsLoading(false);
          return;
        }
        if (!password.trim()) {
          setError('Please provide your account password.');
          setIsLoading(false);
          return;
        }

        const res = await auth.login(email, password, role);
        if (res.error || !res.user) {
          setError(res.error || 'Authentication failed. Please verify your credentials.');
          setIsLoading(false);
          return;
        }

        onAuthSuccess(res.user);
      } else {
        // Register mode
        if (!email.trim() || !email.includes('@')) {
          setError('A valid work email is required.');
          setIsLoading(false);
          return;
        }
        if (!password.trim() || password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        if (role === 'CLIENT' && !companyName.trim()) {
          setError('Company / organization name is required for client accounts.');
          setIsLoading(false);
          return;
        }

        const res = await auth.register({
          email,
          password,
          fullName,
          role,
          companyName: role === 'CLIENT' ? companyName : undefined,
          timezone,
        });

        if (res.error || !res.user) {
          setError(res.error || 'Registration failed. Please try again.');
          setIsLoading(false);
          return;
        }

        onAuthSuccess(res.user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (targetEmail: string, targetRole: UserRole) => {
    const testPassword = targetRole === 'ADMIN' ? 'admin123' : 'client123';
    setEmail(targetEmail);
    setPassword(testPassword);
    setRole(targetRole);
    setError(null);
    setIsLoading(true);
    setTimeout(async () => {
      const res = await auth.login(targetEmail, testPassword, targetRole);
      setIsLoading(false);
      if (res.user) {
        onAuthSuccess(res.user);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#17181B] text-[#EDEAE2] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Navigation */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-2 text-xs text-[#8B8D93] hover:text-[#EDEAE2] px-3.5 py-2 rounded-xl neo-raised transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to landing page</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E2896A] text-[#17181B] font-semibold text-xs flex items-center justify-center">
            VO
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#EDEAE2]">VectorOps</span>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="neo-focal rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl neo-inset text-[#E2896A] mb-1">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">
              {mode === 'signin' ? 'Sign in to VectorOps' : 'Create an account'}
            </h1>
            <p className="text-xs text-[#8B8D93]">
              {mode === 'signin' 
                ? 'Enter your credentials to access your autonomous agency operations.' 
                : 'Register a new agency operator or client portal credential.'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Sign In / Register) */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl neo-inset text-xs">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`py-2 rounded-xl transition-all font-medium ${
                mode === 'signin'
                  ? 'neo-raised text-[#EDEAE2]'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2 rounded-xl transition-all font-medium ${
                mode === 'register'
                  ? 'neo-raised text-[#EDEAE2]'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selector Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#8B8D93] uppercase tracking-wider block">
              Access Role
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  role === 'ADMIN'
                    ? 'neo-inset text-[#E2896A] font-semibold'
                    : 'neo-raised text-[#8B8D93] hover:text-[#EDEAE2]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Agency Operator</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('CLIENT')}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  role === 'CLIENT'
                    ? 'neo-inset text-[#4CAF7D] font-semibold'
                    : 'neo-raised text-[#8B8D93] hover:text-[#EDEAE2]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Client Portal</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl neo-inset text-xs text-[#E2604F] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 absolute left-3.5 text-[#8B8D93]" />
                    <input
                      type="text"
                      placeholder="e.g. Eleanor Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] placeholder-[#8B8D93]/60 focus:outline-none"
                    />
                  </div>
                </div>

                {role === 'CLIENT' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#EDEAE2]">Company / Organization</label>
                    <div className="relative flex items-center">
                      <Building2 className="w-4 h-4 absolute left-3.5 text-[#8B8D93]" />
                      <input
                        type="text"
                        placeholder="e.g. Lumina Dental Group"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] placeholder-[#8B8D93]/60 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#EDEAE2]">Operating Timezone</label>
                  <div className="relative flex items-center">
                    <Globe className="w-4 h-4 absolute left-3.5 text-[#8B8D93]" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] bg-[#1D1F23] focus:outline-none"
                    >
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC Universal</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#EDEAE2]">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-[#8B8D93]" />
                <input
                  type="email"
                  placeholder={role === 'ADMIN' ? 'admin@vectorops.ai' : 'client@enterprise.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] placeholder-[#8B8D93]/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#EDEAE2]">Password</label>
                {mode === 'signin' && (
                  <span className="text-[11px] text-[#8B8D93]">Secured session</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-[#8B8D93]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 neo-inset rounded-xl text-xs text-[#EDEAE2] placeholder-[#8B8D93]/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#8B8D93] hover:text-[#EDEAE2]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#17181B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? `Sign in as ${role === 'ADMIN' ? 'Operator' : 'Client'}` : 'Create Account & Enter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials for instant testing & live demo */}
          <div className="pt-2 border-t border-white/[0.04] space-y-2.5">
            <span className="text-[11px] font-medium text-[#8B8D93] block text-center">
              Quick 1-Click Production Access Profiles:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@vectorops.ai', 'ADMIN')}
                className="p-2.5 rounded-xl neo-raised text-left flex items-center gap-2.5 hover:text-[#EDEAE2] text-[#8B8D93] transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-[#E2896A]/20 text-[#E2896A] text-[10px] font-bold flex items-center justify-center">
                  VO
                </div>
                <div className="truncate">
                  <div className="font-semibold text-[#EDEAE2] text-xs leading-none">Agency Admin</div>
                  <div className="text-[10px] text-[#8B8D93] truncate">admin@vectorops.ai</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dr.reed@luminardental.com', 'CLIENT')}
                className="p-2.5 rounded-xl neo-raised text-left flex items-center gap-2.5 hover:text-[#EDEAE2] text-[#8B8D93] transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-[#4CAF7D]/20 text-[#4CAF7D] text-[10px] font-bold flex items-center justify-center">
                  LD
                </div>
                <div className="truncate">
                  <div className="font-semibold text-[#EDEAE2] text-xs leading-none">Luminar Dental</div>
                  <div className="text-[10px] text-[#8B8D93] truncate">dr.reed@luminardental.com</div>
                </div>
              </button>
            </div>
          </div>

          {/* Security Invariant Guarantee */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#8B8D93] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4CAF7D]" />
            <span>Encrypted local session · Multi-tenant token isolation</span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#8B8D93] py-2">
        <span>VectorOps Agency Operating System · Production Release</span>
      </div>
    </div>
  );
};
