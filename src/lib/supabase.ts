import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabaseConfig';

// Code configuration, Cloudflare Pages environment variables, or localStorage override
const DEFAULT_URL = SUPABASE_CONFIG.url || (import.meta.env.VITE_SUPABASE_URL as string) || '';
const DEFAULT_KEY = SUPABASE_CONFIG.anonKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  isTesting: boolean;
  lastTestedAt?: string;
  errorMessage?: string | null;
}

const STORAGE_KEY_URL = 'vectorops_supabase_url';
const STORAGE_KEY_KEY = 'vectorops_supabase_key';

let activeClient: SupabaseClient | null = null;

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const url = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_URL;
  const anonKey = localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_KEY;
  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  activeClient = null; // reset client
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  activeClient = null;
}

export const supabase: SupabaseClient = createClient(
  'https://ucvaigdfbkhutpgdibem.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdmFpZ2RmYmtodXRwZ2RpYmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTQyODksImV4cCI6MjEwNjIzMDI4OX0.Z6TZ8A1b-s-46ZRep9MdBMWJrBKtnp2731AeWaV78AY'
);

export default supabase;

export function getSupabaseClient(): SupabaseClient | null {
  if (activeClient) return activeClient;
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) return supabase;

  try {
    activeClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return activeClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return supabase;
  }
}

/**
 * Test connectivity against user's live Supabase instance
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; details?: any }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    // Test query against profiles or check health endpoint
    const { data, error } = await testClient.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      // Check if it's an RLS or table not found error
      if (error.code === '42P01') {
        return { success: false, message: `Connected, but table 'profiles' was not found. Please ensure the VectorOps schema is deployed.` };
      }
      // If error is 401 / invalid key
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        return { success: false, message: `Invalid Anon Key / JWT secret: ${error.message}` };
      }
      return { success: true, message: `Connected to Supabase endpoint! (Response: ${error.message})` };
    }

    return { 
      success: true, 
      message: 'Successfully verified connection with live VectorOps Supabase backend!' 
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed. Check network or URL syntax.' };
  }
}
