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
    const { account_id } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get account details
    const { data: account, error: accountError } = await supabaseAdmin
      .from("mail_accounts")
      .select("*")
      .eq("id", account_id)
      .single();

    if (accountError || !account) {
      throw new Error("Account not found");
    }

    // Update sync status
    await supabaseAdmin
      .from("mail_accounts")
      .update({ sync_status: "syncing" })
      .eq("id", account_id);

    // Get OAuth token
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

    // Sync emails based on provider
    let syncedCount = 0;
    if (account.provider === "gmail") {
      syncedCount = await syncGmailMessages(account, accessToken, supabaseAdmin);
    } else if (account.provider === "outlook") {
      syncedCount = await syncOutlookMessages(account, accessToken, supabaseAdmin);
    }

    // Update sync status
    await supabaseAdmin
      .from("mail_accounts")
      .update({
        sync_status: "success",
        last_sync_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", account_id);

    return new Response(
      JSON.stringify({ success: true, synced: syncedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);

    const { account_id } = await req.json().catch(() => ({}));
    if (account_id) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseAdmin
        .from("mail_accounts")
        .update({
          sync_status: "error",
          error_message: error.message,
        })
        .eq("id", account_id);
    }

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

async function syncGmailMessages(account: any, accessToken: string, supabase: any): Promise<number> {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  if (!data.messages) return 0;

  let syncedCount = 0;
  for (const msg of data.messages) {
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const detail = await detailResponse.json();
    const headers = detail.payload.headers;

    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    const subject = getHeader("Subject");
    const from = getHeader("From");
    const to = getHeader("To");
    const cc = getHeader("Cc");
    const date = getHeader("Date");

    const fromMatch = from.match(/(.*?)\s*<(.+?)>/) || [null, from, from];
    const fromName = fromMatch[1]?.trim() || "";
    const fromAddress = fromMatch[2]?.trim() || from;

    let bodyText = "";
    let bodyHtml = "";

    if (detail.payload.parts) {
      for (const part of detail.payload.parts) {
        if (part.mimeType === "text/plain" && part.body.data) {
          bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        } else if (part.mimeType === "text/html" && part.body.data) {
          bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        }
      }
    } else if (detail.payload.body.data) {
      bodyText = atob(detail.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }

    const snippet = detail.snippet || bodyText.substring(0, 200);
    const hasAttachments = detail.payload.parts?.some((p: any) => p.filename) || false;
    const labels = detail.labelIds || [];

    await supabase
      .from("messages")
      .upsert({
        user_id: account.user_id,
        account_id: account.id,
        message_id: detail.id,
        subject,
        from_name: fromName,
        from_address: fromAddress,
        to_addresses: to ? [to] : [],
        cc_addresses: cc ? [cc] : [],
        date: new Date(date).toISOString(),
        body_text: bodyText,
        body_html: bodyHtml,
        snippet,
        has_attachments: hasAttachments,
        is_read: !labels.includes("UNREAD"),
        is_starred: labels.includes("STARRED"),
        labels,
      }, { onConflict: "user_id,message_id" });

    syncedCount++;
  }

  return syncedCount;
}

async function syncOutlookMessages(account: any, accessToken: string, supabase: any): Promise<number> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime DESC",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = await response.json();
  if (!data.value) return 0;

  let syncedCount = 0;
  for (const msg of data.value) {
    const toAddresses = msg.toRecipients?.map((r: any) => r.emailAddress.address) || [];
    const ccAddresses = msg.ccRecipients?.map((r: any) => r.emailAddress.address) || [];

    await supabase
      .from("messages")
      .upsert({
        user_id: account.user_id,
        account_id: account.id,
        message_id: msg.id,
        subject: msg.subject,
        from_name: msg.from?.emailAddress?.name || "",
        from_address: msg.from?.emailAddress?.address || "",
        to_addresses: toAddresses,
        cc_addresses: ccAddresses,
        date: msg.receivedDateTime,
        body_text: msg.bodyPreview,
        body_html: msg.body?.contentType === "html" ? msg.body.content : "",
        snippet: msg.bodyPreview.substring(0, 200),
        has_attachments: msg.hasAttachments,
        is_read: msg.isRead,
        is_starred: msg.flag?.flagStatus === "flagged",
        labels: [],
      }, { onConflict: "user_id,message_id" });

    syncedCount++;
  }

  return syncedCount;
}
