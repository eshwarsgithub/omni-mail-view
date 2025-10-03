import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { handleOAuthCallback } from "@/lib/oauth";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const OAuthCallback = () => {
  const { provider } = useParams<{ provider: "gmail" | "outlook" }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your account...");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        if (!provider || (provider !== "gmail" && provider !== "outlook")) {
          throw new Error("Invalid provider");
        }

        setMessage("Exchanging authorization code...");

        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }

        // Exchange code for tokens via edge function
        const result = await handleOAuthCallback(
          provider,
          code,
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          session.access_token
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to connect account");
        }

        setStatus("success");
        setMessage(`Successfully connected your ${provider} account!`);
        toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account connected!`);

        // Redirect to inbox after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to connect account");
        toast.error(error.message || "Failed to connect account");
      }
    };

    processCallback();
  }, [provider, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Connecting Account"}
            {status === "success" && "Success!"}
            {status === "error" && "Connection Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "loading" && (
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle className="w-12 h-12 text-green-500" />
          )}
          {status === "error" && (
            <XCircle className="w-12 h-12 text-destructive" />
          )}

          <p className="text-center text-muted-foreground">{message}</p>

          {status === "error" && (
            <Button onClick={() => navigate("/")}>
              Return to Inbox
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
