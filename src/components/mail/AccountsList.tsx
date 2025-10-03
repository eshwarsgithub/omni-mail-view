import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MoreVertical } from "lucide-react";
import { toast } from "sonner";

type MailAccount = {
  id: string;
  email: string;
  provider: string;
  is_active: boolean;
  sync_status: string;
};

export const AccountsList = () => {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("mail_accounts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mail_accounts",
        },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("mail_accounts")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    return <Mail className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No accounts connected yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {accounts.map((account) => (
        <Button
          key={account.id}
          variant="ghost"
          className="w-full justify-start h-auto py-2 px-2"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getProviderIcon(account.provider)}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate">
                {account.email}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {account.provider}
              </div>
            </div>
            {account.sync_status === "syncing" && (
              <Badge variant="secondary" className="text-xs">
                Syncing
              </Badge>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
};
