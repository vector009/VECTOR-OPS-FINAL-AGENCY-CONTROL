import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Globe, 
  Key,
  Copy,
  Check,
  FileCode,
  Trash2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  clearSupabaseConfig, 
  testSupabaseConnection 
} from '../../lib/supabase';
import { db } from '../../lib/database';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
}

const SAMPLE_SQL_SCHEMA = `-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CLIENT')),
  full_name TEXT NOT NULL,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  address TEXT,
  internal_notes TEXT,
  service_status TEXT NOT NULL DEFAULT 'ACTIVE',
  portal_status TEXT NOT NULL DEFAULT 'ENABLED',
  retell_workspace_url TEXT,
  retell_workspace_id TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INVOICES & PAYMENTS (Integer USD Cents)
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('SETUP', 'RECURRING', 'ADJUSTMENT')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ISSUED',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  adjustments_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT NOT NULL,
  external_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  client_timezone TEXT NOT NULL,
  admin_timezone TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const isConnected = !!currentConfig.url && !!currentConfig.anonKey;

  const [activeTab, setActiveTab] = useState<'connection' | 'sql'>('connection');
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setStatus('error');
      setStatusMessage('Please enter both your Supabase Project URL and anon public key.');
      return;
    }

    setStatus('testing');
    setStatusMessage('Verifying credentials and pinging Supabase PostgreSQL tables...');

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    if (result.success) {
      saveSupabaseConfig(url, anonKey);
      setStatus('testing');
      setStatusMessage('Connected! Synchronizing records from Supabase tables...');

      const syncResult = await db.syncWithSupabase();
      if (syncResult.success) {
        setStatus('success');
        setStatusMessage(
          `Connected & fully synced! Loaded ${syncResult.count || 0} live clients from your Supabase backend.`
        );
      } else {
        setStatus('success');
        setStatusMessage(
          `Connected to Supabase endpoint! (${syncResult.error || 'Ready for data synchronization'})`
        );
      }
      onConnectionChanged();
    } else {
      setStatus('error');
      setStatusMessage(result.message);
    }
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setStatus('idle');
    setStatusMessage('Supabase backend disconnected. VectorOps is now operating in standalone production store mode.');
    onConnectionChanged();
  };

  const handleClearMockData = () => {
    if (confirm('Clear all sample/mock data immediately? The database will have 0 records, completely clean and ready for your real clients.')) {
      db.clearToEmptyProduction();
      setStatus('success');
      setStatusMessage('All sample data purged! Database is now empty (0 records).');
      onConnectionChanged();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SAMPLE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1D1F23] neo-modal rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#17181B] border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl neo-inset text-[#E2896A]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#EDEAE2]">Supabase Backend Integration</h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isConnected ? 'bg-[#4CAF7D]/20 text-[#4CAF7D]' : 'bg-[#E2604F]/20 text-[#E2604F]'
                }`}>
                  {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-[#8B8D93]">
                {isConnected 
                  ? 'Frontend is connected to your Supabase PostgreSQL database' 
                  : 'Frontend is running in local standalone store. Follow steps below to link Supabase'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8D93] hover:text-[#EDEAE2] rounded-xl neo-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/[0.04] text-xs">
          <button
            onClick={() => setActiveTab('connection')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 ${
              activeTab === 'connection'
                ? 'border-[#E2896A] text-[#EDEAE2]'
                : 'border-transparent text-[#8B8D93] hover:text-[#EDEAE2]'
            }`}
          >
            API Connection & Keys
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-[#E2896A] text-[#EDEAE2]'
                : 'border-transparent text-[#8B8D93] hover:text-[#EDEAE2]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>SQL Schema Migration</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'connection' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              
              {/* How to connect banner */}
              <div className="p-4 rounded-2xl neo-inset space-y-2 text-xs">
                <span className="font-semibold text-[#EDEAE2] block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#4CAF7D]" />
                  <span>How to connect your Supabase backend to this frontend:</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[#8B8D93] leading-relaxed">
                  <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#E2896A] underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a>.</li>
                  <li>Click on <strong>Project Settings</strong> (gear icon) &rarr; <strong>API</strong>.</li>
                  <li>Copy <strong>Project URL</strong> and paste into "Database API Endpoint" below.</li>
                  <li>Copy <strong>anon public API key</strong> and paste into "Public Anon Key" below.</li>
                  <li>Click <strong>Connect & Synchronize Database</strong>.</li>
                </ol>
              </div>

              {/* URL input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#EDEAE2] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#E2896A]" />
                    <span>Project URL</span>
                  </div>
                  <span className="text-[11px] text-[#8B8D93]">e.g. https://your-ref.supabase.co</span>
                </label>
                <input
                  type="url"
                  placeholder="https://abcdefghijkl.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono"
                />
              </div>

              {/* Anon key input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#EDEAE2] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#E2896A]" />
                    <span>Anon / Public API Key</span>
                  </div>
                  <span className="text-[11px] text-[#8B8D93]">JWT client token</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono"
                />
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  status === 'success' 
                    ? 'neo-inset text-[#4CAF7D]' 
                    : status === 'error'
                    ? 'neo-inset text-[#E2604F]'
                    : 'neo-inset text-[#8B8D93]'
                }`}>
                  {status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                  {status === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {status === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
                  <div className="leading-relaxed">{statusMessage}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleClearMockData}
                  className="text-xs text-[#E2604F] hover:underline flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge mock data & start clean (0 records)</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {isConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="btn-secondary text-xs px-3.5 py-2 text-[#E2604F]"
                    >
                      Disconnect
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'testing'}
                    className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
                  >
                    {status === 'testing' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying & syncing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Connect & Synchronize Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#8B8D93]">
                  Deploy these tables in your Supabase project (<strong>SQL Editor</strong> &rarr; <strong>New Query</strong>):
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#4CAF7D]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl neo-inset font-mono text-[11px] text-[#EDEAE2] max-h-72 overflow-y-auto leading-relaxed whitespace-pre select-all">
                {SAMPLE_SQL_SCHEMA}
              </div>

              <div className="p-3.5 rounded-xl neo-inset text-[#8B8D93] text-[11px] leading-relaxed">
                Full schema with all 15 tables and integer USD functions is also saved in <code className="text-[#E2896A]">supabase/schema.sql</code>.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
