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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, Save } from "lucide-react";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    messageId: string;
    subject: string;
    from: string;
  };
}

export const ComposeDialog = ({ open, onOpenChange, replyTo }: ComposeDialogProps) => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadAccounts();
      if (replyTo) {
        setTo(replyTo.from);
        setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      }
    }
  }, [open, replyTo]);

  const loadAccounts = async () => {
    const { data } = await supabase
      .from('mail_accounts')
      .select('*')
      .eq('is_active', true)
      .eq('sync_status', 'success');

    setAccounts(data || []);
    if (data && data.length > 0 && !selectedAccount) {
      setSelectedAccount(data[0].id);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('drafts')
        .insert({
          user_id: user.id,
          account_id: selectedAccount || null,
          subject,
          to_addresses: to.split(',').map(s => s.trim()).filter(Boolean),
          cc_addresses: cc.split(',').map(s => s.trim()).filter(Boolean),
          bcc_addresses: bcc.split(',').map(s => s.trim()).filter(Boolean),
          body_text: body,
          body_html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
        });

      if (error) throw error;

      toast.success('Draft saved');
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    if (!to.trim()) {
      toast.error('Please enter a recipient');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          accountId: selectedAccount,
          to: to.split(',').map(s => s.trim()).filter(Boolean),
          cc: cc.split(',').map(s => s.trim()).filter(Boolean),
          bcc: bcc.split(',').map(s => s.trim()).filter(Boolean),
          subject,
          bodyText: body,
          bodyHtml: `<p>${body.replace(/\n/g, '<br>')}</p>`,
        }
      });

      if (error) throw error;

      toast.success('Email sent successfully!');
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.display_name || account.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>CC (optional)</Label>
            <Input
              type="email"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>BCC (optional)</Label>
            <Input
              type="email"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={sending || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
            <Button onClick={handleSend} disabled={sending || saving}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
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
