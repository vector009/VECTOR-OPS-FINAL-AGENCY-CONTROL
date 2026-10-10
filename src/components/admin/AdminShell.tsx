import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Layers, 
  Receipt, 
  DollarSign, 
  CheckSquare, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Settings, 
  Search, 
  Menu, 
  X,
  LogOut,
  TrendingUp
} from 'lucide-react';
import { ThemeToggle } from '../../context/ThemeContext';
import { db } from '../../lib/database';
import { Client, InvoiceWithMetrics, AuthUser } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { ClientManagement } from './ClientManagement';
import { ClientProfileModal } from './ClientProfileModal';
import { OnboardingWizardModal } from './OnboardingWizardModal';
import { InvoicesView } from './InvoicesView';
import { PaymentsView } from './PaymentsView';
import { AppointmentsView } from './AppointmentsView';
import { MessagesView } from './MessagesView';
import { SubscriptionManagement } from './SubscriptionManagement';
import { RevenueView } from './RevenueView';
import { TasksView } from './TasksView';
import { AICopilotView } from './AICopilotView';
import { AuditLogView } from './AuditLogView';
import { SystemHealthView } from './SystemHealthView';
import { SettingsView } from './SettingsView';

interface AdminShellProps {
  currentUser?: AuthUser | null;
  onLogout: () => void;
  onBackToLanding: () => void;
  onSwitchToClient: () => void;
  onOpenSupabaseModal?: () => void;
  isSupabaseConnected?: boolean;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  currentUser,
  onLogout,
  onBackToLanding,
  onSwitchToClient,
  onOpenSupabaseModal,
  isSupabaseConnected = false,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedClientForProfile, setSelectedClientForProfile] = useState<Client | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [preselectedPaymentInvoice, setPreselectedPaymentInvoice] = useState<InvoiceWithMetrics | null>(null);

  // Global Search state
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const kpis = db.getAdminKPIs();
  const clients = db.getAllClientsIncludingArchived();
  const invoices = db.getInvoices();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users, badge: kpis.activeClientsCount },
    { id: 'appointments', label: 'Appointments', icon: Calendar, alert: kpis.pendingAppointmentsCount > 0 },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: kpis.unreadMessagesCount > 0 ? kpis.unreadMessagesCount : undefined },
    { id: 'subscriptions', label: 'Subscriptions', icon: Layers },
    { id: 'invoices', label: 'Invoices', icon: Receipt, alert: kpis.overdueInvoicesCount > 0 },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
    { id: 'audit', label: 'Audit log', icon: ShieldCheck },
    { id: 'health', label: 'System health', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Global Search results
  const searchResults = globalSearchTerm.trim().length > 1 ? {
    clients: clients.filter(c => c.company_name.toLowerCase().includes(globalSearchTerm.toLowerCase()) || c.contact_name.toLowerCase().includes(globalSearchTerm.toLowerCase())),
    invoices: invoices.filter(i => i.invoice_number.toLowerCase().includes(globalSearchTerm.toLowerCase())),
  } : null;

  const handleSelectInvoiceForPayment = (invoice: InvoiceWithMetrics) => {
    setPreselectedPaymentInvoice(invoice);
    setActiveTab('payments');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex selection:bg-[#7662FA]/30 selection:text-white">
      {/* Desktop Sidebar — Glassmorphism, Navy Backdrop, Subtle Border */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--card-bg)]/85 backdrop-blur-2xl border-r border-[var(--card-border)] shrink-0 sticky top-0 h-screen select-none z-20 shadow-2xl">
        {/* Brand Lockup */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[var(--card-border)]">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-3 text-left cursor-pointer hover:opacity-85 transition-opacity"
            title="Return to Public Landing Page"
          >
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.5L2.5 20.5H21.5L12 2.5Z" fill="url(#admin-nav-delta)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinejoin="round" />
                <path d="M12 7.5L6.5 18H17.5L12 7.5Z" fill="#0B0F17" opacity="0.6" />
                <defs>
                  <linearGradient id="admin-nav-delta" x1="2.5" y1="2.5" x2="21.5" y2="20.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9B51E0" />
                    <stop offset="0.5" stopColor="#7662FA" />
                    <stop offset="1" stopColor="#00C6FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block leading-none">
                Vector<span className="text-gradient-purple-blue">Ops</span>
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)] mt-1 block font-mono">
                Admin Console
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#9B51E0]/20 via-[#7662FA]/15 to-[#00C6FF]/15 text-white font-semibold border border-[#7662FA]/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00C6FF]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className="font-mono-numbers text-[11px] text-[var(--text-muted)]">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Database & Operator Footer */}
        <div className="p-4 space-y-3 border-t border-[var(--card-border)]">
          {/* Active Operator Profile Card */}
          <div className="w-full p-2.5 rounded-xl glass-card flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#7662FA]/20 text-[#00C6FF] text-xs font-bold flex items-center justify-center shrink-0">
                {currentUser?.full_name ? currentUser.full_name[0] : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {currentUser?.full_name || 'Sovereign Operator'}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {currentUser?.email || 'admin@vectorops.ai'}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick link to client portal and landing page */}
          <div className="flex items-center justify-between text-xs px-1 text-[var(--text-muted)]">
            <button
              onClick={onSwitchToClient}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Client portal
            </button>
            <button
              onClick={onBackToLanding}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Landing page
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar — Glass Panel with subtle border */}
        <header className="h-16 px-6 bg-[var(--card-bg)]/80 backdrop-blur-2xl border-b border-[var(--card-border)] sticky top-0 z-30 flex items-center justify-between gap-4">
          
          {/* Mobile hamburger & Clean view title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[var(--text-muted)] hover:text-white rounded-md cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:block text-xs font-semibold text-white capitalize font-mono">
              {navItems.find(n => n.id === activeTab)?.label || activeTab}
            </div>
          </div>

          {/* Center: Global Search with Inset Depth */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clients, invoices, appointments..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl text-white placeholder-[var(--text-muted)] focus:outline-none transition-all"
            />

            {/* Live Global Search Dropdown */}
            {isSearchFocused && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-xl glass-panel z-50 space-y-2 text-xs shadow-2xl">
                {searchResults.clients.length > 0 && (
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] px-2 py-0.5 font-mono">
                      Clients
                    </div>
                    {searchResults.clients.map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setSelectedClientForProfile(c);
                          setGlobalSearchTerm('');
                        }}
                        className="px-2 py-1.5 hover:bg-white/[0.06] rounded-lg cursor-pointer text-white"
                      >
                        {c.company_name} ({c.contact_name})
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.invoices.length > 0 && (
                  <div>
                    <div className="text-[11px] text-[var(--text-muted)] px-2 py-0.5 font-mono">
                      Invoices
                    </div>
                    {searchResults.invoices.map(i => (
                      <div
                        key={i.id}
                        onMouseDown={() => {
                          setActiveTab('invoices');
                          setGlobalSearchTerm('');
                        }}
                        className="px-2 py-1.5 hover:bg-white/[0.06] rounded-lg cursor-pointer text-white flex justify-between"
                      >
                        <span>{i.invoice_number}</span>
                        <span className="font-mono-numbers text-[var(--warning)]">${(i.balance_due_cents / 100).toFixed(2)} due</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls — Theme toggle, User profile pill, Client Portal & Logout */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-[var(--card-border)] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#00C6FF] shadow-[0_0_8px_#00C6FF]" />
              <span className="text-white font-medium">{currentUser?.full_name || 'Operator'}</span>
              <span className="text-[10px] text-[#00C6FF] font-mono uppercase bg-[#00C6FF]/10 px-1.5 py-0.5 rounded border border-[#00C6FF]/20">
                Admin
              </span>
            </div>

            <button
              onClick={onBackToLanding}
              className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              title="View public landing page"
            >
              Landing page
            </button>

            <button
              onClick={onSwitchToClient}
              className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
            >
              Client portal
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign out of VectorOps"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[var(--surface-2)] p-4 space-y-1 neo-raised border-b border-white/[0.08]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs ${
                  activeTab === item.id ? 'neo-inset text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tab Viewport Content — pb-24 on mobile/tablet to account for native bottom tab bar */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <div key={activeTab} className="screen-enter w-full">
            {activeTab === 'dashboard' && (
              <AdminDashboard
                onNavigateTab={(tab) => setActiveTab(tab)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
              />
            )}

            {activeTab === 'clients' && (
              <ClientManagement
                onSelectClient={(c) => setSelectedClientForProfile(c)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesView
                onRecordPaymentForInvoice={handleSelectInvoiceForPayment}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsView
                preselectedInvoice={preselectedPaymentInvoice}
                onClearPreselectedInvoice={() => setPreselectedPaymentInvoice(null)}
              />
            )}

            {activeTab === 'appointments' && <AppointmentsView />}

            {activeTab === 'messages' && <MessagesView />}

            {activeTab === 'subscriptions' && <SubscriptionManagement />}

            {activeTab === 'revenue' && <RevenueView />}

            {activeTab === 'tasks' && <TasksView />}

            {activeTab === 'copilot' && <AICopilotView />}

            {activeTab === 'audit' && <AuditLogView />}

            {activeTab === 'health' && (
              <SystemHealthView onOpenSupabaseModal={onOpenSupabaseModal} />
            )}

            {activeTab === 'settings' && (
              <SettingsView onOpenSupabaseModal={onOpenSupabaseModal} />
            )}
          </div>
        </main>

        {/* Native Mobile / Tablet Bottom Tab Bar (Dashboard / Clients / Billing / Appointments / Settings) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card-bg)]/90 backdrop-blur-2xl border-t border-[var(--card-border)] shadow-2xl px-2 py-1.5 flex items-center justify-around select-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'clients', label: 'Clients', icon: Users, badge: kpis.activeClientsCount },
            { id: 'invoices', label: 'Billing', icon: Receipt, alert: kpis.overdueInvoicesCount > 0 },
            { id: 'appointments', label: 'Appointments', icon: Calendar, alert: kpis.pendingAppointmentsCount > 0 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-[#00C6FF] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`} />
                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-red)] absolute -top-0.5 -right-0.5 ring-2 ring-[var(--surface-2)]" />
                  )}
                  {item.badge !== undefined && item.badge > 0 && !item.alert && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] font-mono rounded-full bg-[var(--accent-blue)] text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 truncate ${isActive ? 'text-[var(--accent-blue)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Client Profile Modal */}
      {selectedClientForProfile && (
        <ClientProfileModal
          client={selectedClientForProfile}
          onClose={() => setSelectedClientForProfile(null)}
          onOpenMessageThread={() => setActiveTab('messages')}
          onOpenAppointmentBooking={() => setActiveTab('appointments')}
        />
      )}

      {/* Global Onboarding Wizard Modal */}
      {isOnboardingOpen && (
        <OnboardingWizardModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onClientCreated={(client) => {
            setSelectedClientForProfile(client);
          }}
        />
      )}
    </div>
  );
};
