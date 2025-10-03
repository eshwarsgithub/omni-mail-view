import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, X } from "lucide-react";

type MailAccount = {
  id: string;
  email: string;
  provider: string;
  display_name: string | null;
};

type ComposeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    messageId: string;
    to: string;
    subject: string;
  };
};

export const ComposeDialog = ({ open, onOpenChange, replyTo }: ComposeDialogProps) => {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [to, setTo] = useState(replyTo?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(replyTo?.subject || "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAccounts();
      if (replyTo) {
        setTo(replyTo.to);
        setSubject(replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`);
      }
    }
  }, [open, replyTo]);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("mail_accounts")
        .select("id, email, provider, display_name")
        .eq("is_active", true);

      if (error) throw error;
      setAccounts(data || []);
      if (data && data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error: any) {
      toast.error("Failed to load accounts");
    }
  };

  const handleSend = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account");
      return;
    }

    if (!to) {
      toast.error("Please enter a recipient");
      return;
    }

    if (!subject) {
      toast.error("Please enter a subject");
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            account_id: selectedAccountId,
            to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject,
            body,
            reply_to_message_id: replyTo?.messageId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success("Email sent successfully!");
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setShowCc(false);
    setShowBcc(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{replyTo ? "Reply" : "Compose Email"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account">From</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger id="account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.display_name || account.email} ({account.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cc">Cc</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCc(false);
                    setCc("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                id="cc"
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
              />
            </div>
          )}

          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bcc">Bcc</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBcc(false);
                    setBcc("");
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Input
                id="bcc"
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
              />
            </div>
          )}

          {!showCc || !showBcc ? (
            <div className="flex gap-2">
              {!showCc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                >
                  Add Cc
                </Button>
              )}
              {!showBcc && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                >
                  Add Bcc
                </Button>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={10}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
