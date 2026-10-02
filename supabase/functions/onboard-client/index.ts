import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY on Edge Function." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize admin client with service_role key to bypass RLS and use auth.admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await req.json();
    const {
      email,
      password,
      company_name,
      contact_name,
      phone = "",
      timezone = "America/New_York",
      address = null,
      plan_id = null,
      retell_workspace_url = null,
      retell_workspace_id = null,
      internal_notes = null,
    } = body;

    if (!email || !password || !company_name || !contact_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, company_name, contact_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Create confirmed user in auth.users (skips email verification entirely)
    const { data: authUserData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        full_name: contact_name.trim(),
        role: "CLIENT",
      },
    });

    if (createAuthError) {
      return new Response(
        JSON.stringify({ error: `Auth account creation failed: ${createAuthError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = authUserData.user.id;

    // 2. Insert profiles row for the new user: role = 'CLIENT', full_name, timezone
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUserId,
      email: cleanEmail,
      role: "CLIENT",
      full_name: contact_name.trim(),
      timezone: timezone,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn("Profile creation warning:", profileError.message);
    }

    // 3. Insert clients row
    const slug = company_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const clientPayload = {
      slug,
      company_name: company_name.trim(),
      contact_name: contact_name.trim(),
      email: cleanEmail,
      phone: phone?.trim() || "",
      timezone: timezone,
      address: address?.trim() || null,
      internal_notes: internal_notes?.trim() || null,
      service_status: "ONBOARDING",
      portal_status: "ENABLED",
      retell_workspace_url: retell_workspace_url?.trim() || null,
      retell_workspace_id: retell_workspace_id?.trim() || null,
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };

    const { data: clientData, error: clientError } = await adminClient
      .from("clients")
      .insert([clientPayload])
      .select()
      .single();

    if (clientError) {
      return new Response(
        JSON.stringify({ error: `Client insertion failed: ${clientError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert client_users row linking profile_id to client_id
    const { error: clientUserError } = await adminClient.from("client_users").insert({
      client_id: clientData.id,
      profile_id: newUserId,
    });

    if (clientUserError) {
      console.warn("client_users insertion warning:", clientUserError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUserId,
          email: cleanEmail,
        },
        client: clientData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unexpected server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
