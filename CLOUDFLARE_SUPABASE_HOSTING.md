# VectorOps — Cloudflare Pages & Supabase Connection Guide

This guide explains how VectorOps connects directly to your Supabase PostgreSQL backend when deployed on **Cloudflare Pages** (or Cloudflare Workers).

---

## Why did you see "Supabase Disconnected" before?
Previously, the frontend had interactive setup buttons in headers that prompted you to connect if no API keys were detected in the environment. 
**We have now completely cleaned this up**:
- Removed all intrusive "Connect Supabase" and "Supabase Disconnected" badges and buttons from the landing page, client portal, and admin header.
- Provided a dedicated code config file (`src/config/supabaseConfig.ts`) where you can paste your keys directly into the frontend code.
- Supported automatic injection via Cloudflare Pages environment variables.

---

## 2 Ways to Connect Frontend to Supabase on Cloudflare

### Method 1: Cloudflare Pages Environment Variables (Recommended — Zero Code Edits)

When you deploy your GitHub repository to Cloudflare Pages:

1. Go to your **Cloudflare Dashboard** &rarr; **Workers & Pages**.
2. Select your **VectorOps** Pages project.
3. Navigate to **Settings** &rarr; **Environment Variables**.
4. Click **Add variables** and add:
   - Variable Name: `VITE_SUPABASE_URL`  
     Value: `https://your-project-ref.supabase.co`
   - Variable Name: `VITE_SUPABASE_ANON_KEY`  
     Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your public `anon` key from Supabase Project Settings &rarr; API)
5. Save and redeploy!

> **How it works:** Cloudflare Pages automatically injects all variables prefixed with `VITE_` into the Vite build process. When the bundle is built, the Supabase client initializes automatically with your remote database.

---

### Method 2: Write Directly into Frontend Code (`src/config/supabaseConfig.ts`)

If you want the API keys directly written in your frontend repository code without configuring Cloudflare dashboard settings:

1. Open `src/config/supabaseConfig.ts`.
2. Replace the empty strings with your Supabase URL and Anon Key:

```typescript
export const SUPABASE_CONFIG = {
  url: 'https://your-project-ref.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

3. Commit and push your changes to GitHub/Git.
4. When Cloudflare Pages builds your site, it will read these credentials directly from the code and connect to your Supabase backend immediately!

---

## Cloudflare Pages Build Settings

When connecting your repository to Cloudflare Pages, use these standard settings:
- **Framework preset:** `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** `18` or `20`

---

## In-App Admin Verification

If you ever want to check or update credentials from inside the application:
1. Log in as an Administrator (`admin@vectorops.ai`).
2. Go to **Settings** (System Configuration).
3. Scroll to **Cloudflare Hosting & Supabase Backend Connection**.
4. You can view the live connection status, run a test ping against your live Supabase database, or update credentials on the fly.
