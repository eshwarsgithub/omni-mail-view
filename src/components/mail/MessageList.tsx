import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  subject: string;
  from_name: string;
  from_address: string;
  snippet: string;
  date: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
};

type MessageListProps = {
  searchQuery: string;
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
};

export const MessageList = ({
  searchQuery,
  selectedMessageId,
  onSelectMessage,
}: MessageListProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery]);

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .order("date", { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(
          `subject.ilike.%${searchQuery}%,from_address.ilike.%${searchQuery}%,snippet.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (messageId: string, currentStarred: boolean) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_starred: !currentStarred })
        .eq("id", messageId);

      if (error) throw error;
    } catch (error: any) {
      toast.error("Failed to update message");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No messages</p>
          <p className="text-sm">
            {searchQuery
              ? "Try a different search"
              : "Connect an account to get started"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((message) => (
        <Button
          key={message.id}
          variant="ghost"
          className={cn(
            "w-full h-auto p-4 justify-start text-left hover:bg-accent transition-colors",
            selectedMessageId === message.id && "bg-accent",
            !message.is_read && "font-semibold"
          )}
          onClick={() => onSelectMessage(message.id)}
        >
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm truncate flex-1">
                {message.from_name || message.from_address}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(message.date), {
                    addSuffix: true,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(message.id, message.is_starred);
                  }}
                >
                  <Star
                    className={cn(
                      "w-4 h-4",
                      message.is_starred && "fill-yellow-400 text-yellow-400"
                    )}
                  />
                </Button>
              </div>
            </div>
            <div className="text-sm truncate">
              {message.subject || "(No subject)"}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground truncate flex-1">
                {message.snippet}
              </span>
              {message.has_attachments && (
                <Paperclip className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};
