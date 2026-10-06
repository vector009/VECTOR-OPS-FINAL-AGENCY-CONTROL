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
    <div className="min-h-screen bg-[var(--surface-1)] text-[var(--text-primary)] flex">
      {/* Desktop Sidebar — Neumorphic Depth, Surface-2, Zero Borders */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--surface-2)] neo-sidebar shrink-0 sticky top-0 h-screen select-none z-20">
        {/* Brand Lockup */}
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue)] text-white font-semibold text-xs flex items-center justify-center shadow-sm">
              VO
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)] block leading-none">
                VectorOps
              </span>
              <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">
                Agency operating system
              </span>
            </div>
          </div>
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-normal transition-all duration-150 ${
                  isActive
                    ? 'neo-inset text-[var(--accent-blue)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className="font-mono-numbers text-[11px] text-[var(--text-muted)]">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-red)]" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Database & Operator Footer */}
        <div className="p-4 space-y-3">
          {/* Active Operator Profile Card */}
          <div className="w-full p-2.5 rounded-xl neo-flat flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] text-xs font-bold flex items-center justify-center shrink-0">
                {currentUser?.full_name ? currentUser.full_name[0] : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--text-primary)] truncate">
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
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick link to client portal and landing page */}
          <div className="flex items-center justify-between text-xs px-1 text-[var(--text-muted)]">
            <button
              onClick={onSwitchToClient}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Client portal
            </button>
            <button
              onClick={onBackToLanding}
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Landing page
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar — Surface-2, Raised Shadow, Zero Border */}
        <header className="h-16 px-6 bg-[var(--surface-2)] neo-raised sticky top-0 z-30 flex items-center justify-between gap-4">
          
          {/* Mobile hamburger & Clean view title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#8B8D93] hover:text-[#EDEAE2] rounded-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden sm:block text-xs font-semibold text-[#EDEAE2] capitalize">
              {navItems.find(n => n.id === activeTab)?.label || activeTab}
            </div>
          </div>

          {/* Center: Global Search with Inset Depth */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#8B8D93] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clients, invoices, appointments..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none neo-inset transition-all"
            />

            {/* Live Global Search Dropdown */}
            {isSearchFocused && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#1D1F23] rounded-xl neo-raised z-50 space-y-2 text-xs">
                {searchResults.clients.length > 0 && (
                  <div>
                    <div className="text-[11px] text-[#8B8D93] px-2 py-0.5">
                      Clients
                    </div>
                    {searchResults.clients.map(c => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setSelectedClientForProfile(c);
                          setGlobalSearchTerm('');
                        }}
                        className="px-2 py-1.5 hover:bg-white/[0.04] rounded-lg cursor-pointer text-[#EDEAE2]"
                      >
                        {c.company_name} ({c.contact_name})
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.invoices.length > 0 && (
                  <div>
                    <div className="text-[11px] text-[#8B8D93] px-2 py-0.5">
                      Invoices
                    </div>
                    {searchResults.invoices.map(i => (
                      <div
                        key={i.id}
                        onMouseDown={() => {
                          setActiveTab('invoices');
                          setGlobalSearchTerm('');
                        }}
                        className="px-2 py-1.5 hover:bg-white/[0.04] rounded-lg cursor-pointer text-[#EDEAE2] flex justify-between"
                      >
                        <span>{i.invoice_number}</span>
                        <span className="font-mono-numbers text-[#E2896A]">${(i.balance_due_cents / 100).toFixed(2)} due</span>
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

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl neo-inset text-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
              <span className="text-[var(--text-primary)] font-medium">{currentUser?.full_name || 'Operator'}</span>
              <span className="text-[10px] text-[var(--accent-blue)] font-mono uppercase bg-[var(--accent-blue)]/10 px-1.5 py-0.5 rounded">
                Admin
              </span>
            </div>

            <button
              onClick={onBackToLanding}
              className="btn-secondary text-xs px-3 py-1.5"
              title="View public landing page"
            >
              Landing page
            </button>

            <button
              onClick={onSwitchToClient}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Client portal
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl neo-raised text-xs text-[#8B8D93] hover:text-[#E2604F] transition-colors flex items-center gap-1.5"
              title="Sign out of VectorOps"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
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
        </main>

        {/* Native Mobile / Tablet Bottom Tab Bar (Dashboard / Clients / Billing / Appointments / Settings) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface-2)]/95 backdrop-blur-lg border-t border-white/[0.08] shadow-2xl px-2 py-1.5 flex items-center justify-around select-none">
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
                    ? 'text-[var(--accent-blue)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
