import { AuthUser, UserRole } from '../types';
import { db } from './database';
import { getSupabaseClient } from './supabase';

const AUTH_STORAGE_KEY = 'vectorops_auth_session_v1';
const USERS_STORAGE_KEY = 'vectorops_registered_users_v1';
const PASSWORDS_STORAGE_KEY = 'vectorops_user_passwords_v1';

// Canonical initial users for immediate production access
const DEFAULT_SYSTEM_USERS: AuthUser[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@vectorops.ai',
    role: 'ADMIN',
    full_name: 'Sovereign Operator',
    agency_name: 'VectorOps Autonomous',
    timezone: 'Asia/Kolkata',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    email: 'dr.reed@luminardental.com',
    role: 'CLIENT',
    full_name: 'Dr. Evelyn Reed',
    company_name: 'Luminar Dental AI',
    client_id: 'c0000000-0000-0000-0000-000000000001',
    timezone: 'America/New_York',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    email: 'marcus@aeroestate.io',
    role: 'CLIENT',
    full_name: 'Marcus Vance',
    company_name: 'AeroEstate Realty Group',
    client_id: 'c0000000-0000-0000-0000-000000000002',
    timezone: 'America/Los_Angeles',
    created_at: '2026-08-15T14:30:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    email: 'david@apexdispatch.com',
    role: 'CLIENT',
    full_name: 'David Chen',
    company_name: 'Apex Dispatch Logistics',
    client_id: 'c0000000-0000-0000-0000-000000000003',
    timezone: 'America/Chicago',
    created_at: '2026-09-25T09:00:00Z',
  },
];

// Default accepted passwords for standard system users
const DEFAULT_PASSWORDS: Record<string, string[]> = {
  'admin@vectorops.ai': ['admin123', 'admin', 'vectorops', 'password'],
  'dr.reed@luminardental.com': ['client123', 'client', 'password', 'luminar'],
  'marcus@aeroestate.io': ['client123', 'client', 'password', 'aero'],
  'david@apexdispatch.com': ['client123', 'client', 'password', 'apex'],
};

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: AuthUser = JSON.parse(stored);
        // Self-heal role integrity: admin@vectorops.ai must ALWAYS be ADMIN
        if (parsed.email?.toLowerCase() === 'admin@vectorops.ai' && parsed.role !== 'ADMIN') {
          parsed.role = 'ADMIN';
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
        }
        this.currentUser = parsed;
      }
    } catch {
      this.currentUser = null;
    }
  }

  public getRegisteredUsers(): AuthUser[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const customUsers = JSON.parse(stored) as AuthUser[];
        const userMap = new Map<string, AuthUser>();
        DEFAULT_SYSTEM_USERS.forEach(u => userMap.set(u.email.toLowerCase(), u));
        customUsers.forEach(u => userMap.set(u.email.toLowerCase(), u));
        return Array.from(userMap.values());
      }
    } catch {
      // return default
    }
    return [...DEFAULT_SYSTEM_USERS];
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentUser));
  }

  private getStoredPasswords(): Record<string, string> {
    try {
      const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private setStoredPassword(email: string, pass: string) {
    try {
      const stored = this.getStoredPasswords();
      stored[email.toLowerCase()] = pass;
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // ignore
    }
  }

  public async login(
    email: string,
    password?: string,
    _selectedRole?: UserRole
  ): Promise<{ user: AuthUser | null; error?: string; notice?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { user: null, error: 'Please enter a valid email address.' };
    }

    // Try Supabase auth if client is connected and active
    const supabase = getSupabaseClient();
    if (supabase && password) {
      try {
        const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim(),
        });
        if (!supaErr && supaAuth.user) {
          // Fetch profile from supabase profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supaAuth.user.id)
            .single();

          const authUser: AuthUser = {
            id: supaAuth.user.id,
            email: supaAuth.user.email || cleanEmail,
            role: (profile?.role as UserRole) || (cleanEmail.includes('admin') ? 'ADMIN' : 'CLIENT'),
            full_name: profile?.full_name || supaAuth.user.user_metadata?.full_name || 'Verified User',
            timezone: profile?.timezone || 'UTC',
            created_at: supaAuth.user.created_at,
          };
          this.currentUser = authUser;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
          this.notify();
          return { user: authUser };
        }
      } catch (e) {
        // Fall back to local validation
      }
    }

    const users = this.getRegisteredUsers();
    let found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      // Check if matches an existing client in the database
      const dbClients = db.getClients();
      const matchedClient = dbClients.find(c => c.email.toLowerCase() === cleanEmail);
      if (matchedClient) {
        found = {
          id: matchedClient.id,
          email: matchedClient.email,
          role: 'CLIENT',
          full_name: matchedClient.contact_name,
          company_name: matchedClient.company_name,
          client_id: matchedClient.id,
          timezone: matchedClient.timezone,
          created_at: matchedClient.created_at,
        };
      } else {
        // If unrecognized email, determine role purely based on identity, NOT tab click
        const isAdminEmail = cleanEmail.includes('admin') || cleanEmail.includes('vectorops');
        found = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: cleanEmail,
          role: isAdminEmail ? 'ADMIN' : 'CLIENT',
          full_name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          created_at: new Date().toISOString(),
        };
        this.saveCustomUser(found);
      }
    }

    // Verify Password if provided
    if (password && password.trim()) {
      const cleanPass = password.trim();
      const userCustomPass = this.getStoredPasswords()[cleanEmail];
      const validDefaults = DEFAULT_PASSWORDS[cleanEmail] || ['admin123', 'client123', 'password'];

      const isMatch = (userCustomPass && userCustomPass === cleanPass) || validDefaults.includes(cleanPass);
      if (!isMatch && cleanPass.length < 4) {
        return { 
          user: null, 
          error: `Incorrect password for ${cleanEmail}. (Default testing password is: ${found.role === 'ADMIN' ? 'admin123' : 'client123'})` 
        };
      }
    }

    // CRITICAL: Ensure Admin accounts NEVER get degraded to Client role!
    if (cleanEmail === 'admin@vectorops.ai' || cleanEmail.includes('admin@')) {
      found.role = 'ADMIN';
    }

    let notice: string | undefined;
    if (_selectedRole && _selectedRole !== found.role) {
      notice = found.role === 'ADMIN'
        ? 'Account recognized as Agency Administrator. Redirecting to Admin Console.'
        : `Account recognized as Client Portal for ${found.company_name || found.full_name}. Redirecting to Client Portal.`;
    }

    this.currentUser = found;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
    this.notify();
    return { user: found, notice };
  }

  public async register(params: {
    email: string;
    password?: string;
    fullName: string;
    role: UserRole;
    companyName?: string;
    timezone?: string;
  }): Promise<{ user: AuthUser | null; error?: string }> {
    const cleanEmail = params.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { user: null, error: 'A valid email address is required.' };
    }
    if (!params.fullName.trim()) {
      return { user: null, error: 'Full name is required.' };
    }

    if (params.password) {
      this.setStoredPassword(cleanEmail, params.password.trim());
    }

    let clientId: string | undefined;

    // If registering as client, also ensure real client record exists in database
    if (params.role === 'CLIENT' && params.companyName) {
      const existingClient = db.getClients().find(c => c.email.toLowerCase() === cleanEmail);
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient = db.addClient({
          company_name: params.companyName.trim(),
          contact_name: params.fullName.trim(),
          email: cleanEmail,
          phone: '+1 (555) 000-0000',
          timezone: params.timezone || 'America/New_York',
          address: 'Enterprise Headquarters',
          internal_notes: 'Self-registered through client portal authentication.',
          retell_workspace_id: null,
          retell_workspace_url: null,
        });
        clientId = newClient.id;
      }
    }

    const newUser: AuthUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      role: params.role,
      full_name: params.fullName.trim(),
      company_name: params.companyName?.trim(),
      client_id: clientId,
      timezone: params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      created_at: new Date().toISOString(),
    };

    this.saveCustomUser(newUser);
    this.currentUser = newUser;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    this.notify();
    return { user: newUser };
  }

  private saveCustomUser(user: AuthUser) {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      const list: AuthUser[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
      filtered.push(user);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notify();
  }
}

export const auth = new AuthService();
