import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  MoreVertical,
  Paperclip,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ComposeDialog } from "./ComposeDialog";

type Message = {
  id: string;
  subject: string;
  from_name: string;
  from_address: string;
  to_addresses: string[];
  cc_addresses: string[];
  date: string;
  body_html: string;
  body_text: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
};

type MessageDetailProps = {
  messageId: string | null;
};

export const MessageDetail = ({ messageId }: MessageDetailProps) => {
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [replyInfo, setReplyInfo] = useState<any>(null);

  useEffect(() => {
    if (messageId) {
      fetchMessage(messageId);
      markAsRead(messageId);
    } else {
      setMessage(null);
    }
  }, [messageId]);

  const fetchMessage = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setMessage(data);
    } catch (error: any) {
      toast.error("Failed to fetch message");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from("messages").update({ is_read: true }).eq("id", id);
    } catch (error) {
      // Silent fail
    }
  };

  const toggleStar = async () => {
    if (!message) return;
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: !message.is_starred })
        .eq("id", message.id);

      if (error) throw error;
      setMessage({ ...message, is_starred: !message.is_starred });
    } catch (error: any) {
      toast.error("Failed to update message");
    }
  };

  const handleReply = () => {
    if (!message) return;
    setReplyInfo({
      messageId: message.id,
      subject: message.subject,
      from: message.from_address
    });
    setShowCompose(true);
  };

  if (!messageId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No message selected</p>
          <p className="text-sm">Select a message to view its contents</p>
        </div>
      </div>
    );
  }

  if (loading || !message) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header Actions */}
        <div className="p-4 border-b flex items-center gap-2">
          <Button variant="ghost" size="sm" title="Reply" onClick={handleReply}>
            <Reply className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Reply All" onClick={handleReply}>
            <ReplyAll className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Forward">
            <Forward className="w-4 h-4" />
          </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm" title="Archive">
          <Archive className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Delete">
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleStar}
          title={message.is_starred ? "Unstar" : "Star"}
        >
          <Star
            className={cn(
              "w-4 h-4",
              message.is_starred && "fill-yellow-400 text-yellow-400"
            )}
          />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      {/* Message Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Subject */}
          <h1 className="text-2xl font-bold">{message.subject || "(No subject)"}</h1>

          {/* From/To Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                {(message.from_name || message.from_address)[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {message.from_name || message.from_address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {message.from_address}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(message.date), "PPp")}
                  </span>
                </div>
                {message.to_addresses && message.to_addresses.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    To: {message.to_addresses.join(", ")}
                  </p>
                )}
                {message.cc_addresses && message.cc_addresses.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Cc: {message.cc_addresses.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Body */}
          <div className="prose prose-sm max-w-none">
            {message.body_html ? (
              <div
                dangerouslySetInnerHTML={{ __html: message.body_html }}
                className="text-foreground"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-foreground">
                {message.body_text}
              </pre>
            )}
          </div>

          {/* Attachments */}
          {message.has_attachments && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments
                </p>
                <Badge variant="outline">Feature coming soon</Badge>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>

    <ComposeDialog
      open={showCompose}
      onOpenChange={setShowCompose}
      replyTo={replyInfo}
    />
  </>
  );
};
