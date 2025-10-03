import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { code, account_id } = await req.json();

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: Deno.env.get("OUTLOOK_CLIENT_ID") ?? "",
          client_secret: Deno.env.get("OUTLOOK_CLIENT_SECRET") ?? "",
          redirect_uri: Deno.env.get("OUTLOOK_REDIRECT_URI") ?? "",
          grant_type: "authorization_code",
          scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const userInfo = await userInfoResponse.json();

    // Create service role client for oauth_tokens table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update or create mail account
    const { data: mailAccount, error: accountError } = await supabaseAdmin
      .from("mail_accounts")
      .upsert({
        id: account_id || crypto.randomUUID(),
        user_id: user.id,
        provider: "outlook",
        email: userInfo.mail || userInfo.userPrincipalName,
        display_name: userInfo.displayName,
        auth_type: "oauth",
        is_active: true,
        sync_status: "pending",
      })
      .select()
      .single();

    if (accountError) throw accountError;

    // Store OAuth tokens
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const { error: tokenError } = await supabaseAdmin
      .from("oauth_tokens")
      .upsert({
        account_id: mailAccount.id,
        provider: "outlook",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) throw tokenError;

    // Trigger initial sync
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ account_id: mailAccount.id }),
    });

    return new Response(
      JSON.stringify({ success: true, account_id: mailAccount.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
