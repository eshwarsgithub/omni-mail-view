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

    const { account_id, to, cc, bcc, subject, body, reply_to_message_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get account and token
    const { data: account } = await supabaseAdmin
      .from("mail_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("user_id", user.id)
      .single();

    if (!account) {
      throw new Error("Account not found");
    }

    const { data: tokenData } = await supabaseAdmin
      .from("oauth_tokens")
      .select("*")
      .eq("account_id", account_id)
      .single();

    if (!tokenData) {
      throw new Error("No OAuth token found");
    }

    // Check if token needs refresh
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date()) {
      accessToken = await refreshToken(account.provider, tokenData.refresh_token, account_id, supabaseAdmin);
    }

    let messageId;
    if (account.provider === "gmail") {
      messageId = await sendGmail(accessToken, { to, cc, bcc, subject, body, from: account.email, reply_to_message_id });
    } else if (account.provider === "outlook") {
      messageId = await sendOutlook(accessToken, { to, cc, bcc, subject, body, reply_to_message_id });
    } else {
      throw new Error("Unsupported provider");
    }

    // Log to audit
    await supabaseAdmin.from("audit_log").insert({
      user_id: user.id,
      action: "send_email",
      resource_type: "message",
      resource_id: messageId,
      metadata: { account_id, to, subject },
    });

    return new Response(
      JSON.stringify({ success: true, message_id: messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function refreshToken(provider: string, refreshToken: string, accountId: string, supabase: any): Promise<string> {
  let tokenUrl = "";
  let clientId = "";
  let clientSecret = "";

  if (provider === "gmail") {
    tokenUrl = "https://oauth2.googleapis.com/token";
    clientId = Deno.env.get("GMAIL_CLIENT_ID") ?? "";
    clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") ?? "";
  } else if (provider === "outlook") {
    tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    clientId = Deno.env.get("OUTLOOK_CLIENT_ID") ?? "";
    clientSecret = Deno.env.get("OUTLOOK_CLIENT_SECRET") ?? "";
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  const tokens = await response.json();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

  await supabase
    .from("oauth_tokens")
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
    })
    .eq("account_id", accountId);

  return tokens.access_token;
}

async function sendGmail(accessToken: string, emailData: any): Promise<string> {
  const email = [
    `From: ${emailData.from}`,
    `To: ${emailData.to}`,
    emailData.cc ? `Cc: ${emailData.cc}` : "",
    emailData.bcc ? `Bcc: ${emailData.bcc}` : "",
    `Subject: ${emailData.subject}`,
    emailData.reply_to_message_id ? `In-Reply-To: ${emailData.reply_to_message_id}` : "",
    "",
    emailData.body,
  ]
    .filter(Boolean)
    .join("\r\n");

  const encodedEmail = btoa(email)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  const result = await response.json();
  return result.id;
}

async function sendOutlook(accessToken: string, emailData: any): Promise<string> {
  const message = {
    subject: emailData.subject,
    body: {
      contentType: "HTML",
      content: emailData.body,
    },
    toRecipients: [{ emailAddress: { address: emailData.to } }],
    ccRecipients: emailData.cc ? [{ emailAddress: { address: emailData.cc } }] : [],
    bccRecipients: emailData.bcc ? [{ emailAddress: { address: emailData.bcc } }] : [],
  };

  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return crypto.randomUUID(); // Outlook doesn't return message ID
}
