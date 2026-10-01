/**
 * VectorOps Supabase & Cloudflare Hosting Configuration
 * 
 * HOW TO CONNECT SUPABASE WHEN HOSTING ON CLOUDFLARE:
 * ----------------------------------------------------
 * Method A (Recommended for Cloudflare Pages):
 *   In Cloudflare Pages Dashboard -> Settings -> Environment Variables,
 *   add:
 *     - VITE_SUPABASE_URL = https://your-project.supabase.co
 *     - VITE_SUPABASE_ANON_KEY = your-supabase-anon-public-key
 *   Cloudflare will inject these during build and your frontend connects automatically!
 * 
 * Method B (Direct in frontend code):
 *   You can write your Supabase URL and Anon Key directly below in `SUPABASE_CONFIG`.
 *   When you push to Git and Cloudflare builds, it will connect directly to Supabase.
 */

export const SUPABASE_CONFIG = {
  // Hardcoded live Supabase endpoint with optional Cloudflare Pages env variable override
  url: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ucvaigdfbkhutpgdibem.supabase.co',
  
  // Hardcoded live Supabase anon key with optional Cloudflare Pages env variable override
  anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjdmFpZ2RmYmtodXRwZ2RpYmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTQyODksImV4cCI6MjEwNjIzMDI4OX0.Z6TZ8A1b-s-46ZRep9MdBMWJrBKtnp2731AeWaV78AY',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
}
