import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

type AddAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddAccountDialog = ({
  open,
  onOpenChange,
}: AddAccountDialogProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnectProvider = async (provider: "gmail" | "outlook") => {
    setConnecting(provider);
    try {
      // For MVP, we'll simulate the connection
      // In production, this would trigger OAuth flow via edge function
      toast.info("OAuth integration coming soon! For now, adding demo account...");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("mail_accounts").insert({
        user_id: user.id,
        email: `demo@${provider}.com`,
        provider: provider,
        auth_type: "oauth",
        display_name: `Demo ${provider.charAt(0).toUpperCase() + provider.slice(1)} Account`,
      });

      if (error) throw error;

      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account connected!`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to connect account");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Mail Account</DialogTitle>
          <DialogDescription>
            Connect your email accounts to view them in one unified inbox
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
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
