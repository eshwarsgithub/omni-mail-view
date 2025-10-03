import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Plus, LogOut, Mail, Inbox as InboxIcon, Star, Archive, Settings as SettingsIcon, PenSquare } from "lucide-react";
import { AccountsList } from "@/components/mail/AccountsList";
import { MessageList } from "@/components/mail/MessageList";
import { MessageDetail } from "@/components/mail/MessageDetail";
import { AddAccountDialog } from "@/components/mail/AddAccountDialog";
import { ComposeDialog } from "@/components/mail/ComposeDialog";

const Inbox = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Unified Mail</span>
          </div>
          <Button
            onClick={() => setShowCompose(true)}
            className="w-full"
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Compose
          </Button>
          <Button
            onClick={() => setShowAddAccount(true)}
            className="w-full"
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <InboxIcon className="w-4 h-4 mr-2" />
            Inbox
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Star className="w-4 h-4 mr-2" />
            Starred
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>

          <div className="pt-4 border-t mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              ACCOUNTS
            </p>
            <AccountsList />
          </div>
        </div>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Middle Panel - Message List */}
      <div className="w-96 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <MessageList
          searchQuery={searchQuery}
          selectedMessageId={selectedMessageId}
          onSelectMessage={setSelectedMessageId}
        />
      </div>

      {/* Right Panel - Message Detail */}
      <div className="flex-1 bg-background">
        <MessageDetail messageId={selectedMessageId} />
      </div>

      <AddAccountDialog
        open={showAddAccount}
        onOpenChange={setShowAddAccount}
      />

      <ComposeDialog
        open={showCompose}
        onOpenChange={setShowCompose}
      />
    </div>
  );
};

export default Inbox;
