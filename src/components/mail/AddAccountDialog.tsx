import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

type AddAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddAccountDialog = ({
  open,
  onOpenChange,
}: AddAccountDialogProps) => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) {
      loadApiKeys();
    }
  }, [open]);

  const loadApiKeys = async () => {
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true);
    setApiKeys(data || []);
  };

  const handleConnectProvider = async (provider: "gmail" | "outlook") => {
    setConnecting(provider);
    try {
      const providerApiKeys = apiKeys.filter(k => k.provider === provider);

      if (providerApiKeys.length === 0) {
        toast.error(`No API keys configured for ${provider}. Please add one in Settings.`, {
          action: {
            label: 'Go to Settings',
            onClick: () => {
              onOpenChange(false);
              navigate('/settings');
            }
          }
        });
        setConnecting(null);
        return;
      }

      const apiKeyId = selectedApiKey || providerApiKeys[0].id;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create mail account
      const { data: account, error: accountError } = await supabase
        .from("mail_accounts")
        .insert({
          user_id: user.id,
          email: email || `user@${provider}.com`,
          provider: provider,
          auth_type: "oauth",
          display_name: email || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Account`,
          sync_status: 'pending'
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Initiate OAuth flow
      const { data: authData, error: authError } = await supabase.functions.invoke('gmail-oauth', {
        body: {
          action: 'initiate',
          accountId: account.id,
          apiKeyId: apiKeyId
        }
      });

      if (authError) throw authError;

      // Open OAuth URL in new window
      const authWindow = window.open(authData.authUrl, '_blank', 'width=500,height=600');

      toast.success(`Opening ${provider} authorization...`);

      // Listen for OAuth callback
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'oauth-success') {
          toast.success('Account connected successfully!');

          // Start initial sync
          await supabase.functions.invoke('sync-emails', {
            body: {
              accountId: account.id,
              syncType: 'full'
            }
          });

          onOpenChange(false);
          setEmail('');
          setSelectedApiKey('');
        }
      }, { once: true });

    } catch (error: any) {
      toast.error(error.message || "Failed to connect account");
    } finally {
      setConnecting(null);
    }
  };

  const gmailKeys = apiKeys.filter(k => k.provider === 'gmail');
  const outlookKeys = apiKeys.filter(k => k.provider === 'outlook');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Mail Account</DialogTitle>
          <DialogDescription>
            Connect your email accounts to view them in one unified inbox
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {apiKeys.length === 0 && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">No API keys configured</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Add OAuth credentials in Settings to connect accounts.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/settings');
                    }}
                  >
                    Go to Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            <Label>Email Address (Optional)</Label>
            <Input
              type="email"
              placeholder="your.email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {gmailKeys.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Gmail API Key</Label>
                <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                  <SelectTrigger>
                    <SelectValue placeholder={gmailKeys[0].key_name} />
                  </SelectTrigger>
                  <SelectContent>
                    {gmailKeys.map(key => (
                      <SelectItem key={key.id} value={key.id}>{key.key_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <Button
                  variant="ghost"
                  className="w-full h-auto p-0 hover:bg-transparent"
                  onClick={() => handleConnectProvider("gmail")}
                  disabled={connecting !== null}
                >
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Gmail</p>
                      <p className="text-sm text-muted-foreground">
                        Connect your Google account
                      </p>
                    </div>
                    {connecting === "gmail" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-sm text-primary">Connect</span>
                    )}
                  </div>
                </Button>
              </Card>
            </>
          )}

          {outlookKeys.length > 0 && (
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <Button
                variant="ghost"
                className="w-full h-auto p-0 hover:bg-transparent"
                onClick={() => handleConnectProvider("outlook")}
                disabled={connecting !== null}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Outlook</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your Microsoft account
                    </p>
                  </div>
                  {connecting === "outlook" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-sm text-primary">Connect</span>
                  )}
                </div>
              </Button>
            </Card>
          )}

          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-muted-foreground">IMAP / POP3</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
