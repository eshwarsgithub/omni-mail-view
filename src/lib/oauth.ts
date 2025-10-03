export const OAUTH_CONFIG = {
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
    clientId: import.meta.env.VITE_GMAIL_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/gmail`,
  },
  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.ReadWrite offline_access",
    clientId: import.meta.env.VITE_OUTLOOK_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/outlook`,
  },
};

export function initiateOAuth(provider: "gmail" | "outlook") {
  const config = OAUTH_CONFIG[provider];

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    access_type: provider === "gmail" ? "offline" : undefined,
    prompt: provider === "gmail" ? "consent" : undefined,
  });

  // Remove undefined values
  Array.from(params.entries()).forEach(([key, value]) => {
    if (value === "undefined") params.delete(key);
  });

  const authUrl = `${config.authUrl}?${params.toString()}`;
  window.location.href = authUrl;
}

export async function handleOAuthCallback(
  provider: "gmail" | "outlook",
  code: string,
  supabaseUrl: string,
  anonKey: string,
  authToken: string
): Promise<{ success: boolean; account_id?: string; error?: string }> {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${provider}-oauth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": anonKey,
        },
        body: JSON.stringify({ code }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "OAuth failed");
    }

    return { success: true, account_id: data.account_id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
