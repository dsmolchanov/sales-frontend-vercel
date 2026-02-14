import { useEffect, useState } from "react";
import { formatDistanceToNow, differenceInSeconds, addHours } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Bot,
  UserCheck,
  Unlock,
  Lock,
  Loader2,
  Clock,
  Plus,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type {
  ConversationSession,
  ConversationMessage,
  ConversationControlMode,
} from "@/types";

interface ConversationSectionProps {
  session: ConversationSession | null | undefined;
  autoReleaseHours: number;
  onEscalate: () => void;
  onRelease: () => void;
  onProlong: () => void;
  isLoading?: boolean;
}

export function ConversationSection({
  session,
  autoReleaseHours,
  onEscalate,
  onRelease,
  onProlong,
  isLoading: isActionLoading,
}: ConversationSectionProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Fetch messages and set up realtime subscription
  useEffect(() => {
    if (!session?.phone) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    fetchMessages();

    // Subscribe to agent_sessions changes for this phone
    const channel = supabase
      .channel(`agent_sessions_${session.phone}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "agents",
          table: "agent_sessions",
          filter: `contact_phone=eq.${session.phone}`,
        },
        () => {
          fetchMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.phone]);

  // Update countdown timer every second
  useEffect(() => {
    if (
      !session ||
      session.control_mode !== "human" ||
      !session.escalated_at ||
      autoReleaseHours <= 0
    ) {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      const escalatedAt = new Date(session.escalated_at!);
      const releaseAt = addHours(escalatedAt, autoReleaseHours);
      const secondsRemaining = differenceInSeconds(releaseAt, new Date());

      if (secondsRemaining <= 0) {
        setTimeRemaining("Auto-releasing...");
        return;
      }

      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s remaining`);
      } else {
        setTimeRemaining(`${seconds}s remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session?.escalated_at, session?.control_mode, autoReleaseHours]);

  const fetchMessages = async () => {
    if (!session?.phone) return;
    try {
      // Messages are stored in agent_sessions.messages JSONB array
      // Link is via contact_phone matching conversation_sessions.phone
      const { data, error } = await supabase
        .schema("agents")
        .from("agent_sessions")
        .select("messages")
        .eq("contact_phone", session.phone)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

      // Transform agent_sessions messages format to ConversationMessage format
      // agent_sessions stores: {role: "user"|"assistant", content: string | [{type: "text", text: "..."}]}
      const rawMessages = data?.messages || [];
      const transformedMessages: ConversationMessage[] = rawMessages.map(
        (
          msg: {
            role: string;
            content: string | Array<{ type: string; text: string }>;
          },
          index: number,
        ) => {
          // Extract text content - can be string or array of content blocks
          let textContent = "";
          if (typeof msg.content === "string") {
            textContent = msg.content;
          } else if (Array.isArray(msg.content)) {
            textContent = msg.content
              .filter((block) => block.type === "text")
              .map((block) => block.text)
              .join("\n");
          }

          return {
            id: `${session.id}-${index}`,
            session_id: session.id,
            content: textContent,
            sender_type: msg.role === "user" ? "lead" : "agent",
            created_at: session.created_at, // Approximate - no per-message timestamp
          };
        },
      );

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getControlModeVariant = (mode: ConversationControlMode) => {
    switch (mode) {
      case "human":
        return "escalated" as const;
      case "paused":
        return "paused" as const;
      default:
        return "agent" as const;
    }
  };

  const getControlModeLabel = (mode: ConversationControlMode) => {
    switch (mode) {
      case "human":
        return "Escalated";
      case "paused":
        return "Paused";
      default:
        return "Agent";
    }
  };

  // No session - show placeholder
  if (!session) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No conversation yet</p>
          <p className="text-sm text-center mt-1">
            A conversation will appear here when this lead sends a message.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </CardTitle>
          <Badge variant={getControlModeVariant(session.control_mode)}>
            {getControlModeLabel(session.control_mode)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Escalation Reason */}
        {session.reason && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground">
              Escalation Reason
            </p>
            <p className="text-sm mt-1">{session.reason}</p>
          </div>
        )}

        {/* Auto-Release Timer */}
        {session.control_mode === "human" && timeRemaining && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800 font-medium">
              {timeRemaining}
            </span>
          </div>
        )}

        {/* Escalation Controls */}
        <div className="flex gap-2">
          {session.control_mode === "agent" && (
            <Button
              onClick={onEscalate}
              disabled={isActionLoading}
              variant="destructive"
              className="flex-1"
            >
              {isActionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Escalate
            </Button>
          )}

          {session.control_mode === "human" && (
            <>
              <Button
                onClick={onRelease}
                disabled={isActionLoading}
                variant="outline"
                className="flex-1"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Release to Agent
              </Button>
              <Button
                onClick={onProlong}
                disabled={isActionLoading}
                variant="secondary"
                title={`Extend by ${autoReleaseHours} hours`}
              >
                <Plus className="h-4 w-4 mr-1" />
                {autoReleaseHours}h
              </Button>
            </>
          )}
        </div>

        {/* Message History */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Message History ({messages.length} messages)
          </p>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isLead = message.sender_type === "lead";
  const isStaff = message.sender_type === "staff";

  const getSenderIcon = () => {
    if (isLead) return <User className="h-4 w-4" />;
    if (isStaff) return <UserCheck className="h-4 w-4" />;
    return <Bot className="h-4 w-4" />;
  };

  const getSenderLabel = () => {
    if (isLead) return "Lead";
    if (isStaff) return "Staff";
    return "Agent";
  };

  const getSenderColor = () => {
    if (isLead) return "bg-blue-100 text-blue-800";
    if (isStaff) return "bg-green-100 text-green-800";
    return "bg-purple-100 text-purple-800";
  };

  const getBubbleStyle = () => {
    if (isLead) return "bg-blue-50 border-blue-200";
    if (isStaff) return "bg-green-50 border-green-200";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className={`flex gap-3 ${isLead ? "flex-row-reverse" : "flex-row"}`}>
      <div className="flex-shrink-0">
        <div className={`rounded-full p-2 ${getSenderColor()}`}>
          {getSenderIcon()}
        </div>
      </div>
      <div
        className={`flex-1 max-w-[75%] ${isLead ? "items-end" : "items-start"} flex flex-col`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={getSenderColor()}>
            {getSenderLabel()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div className={`rounded-lg border p-3 ${getBubbleStyle()}`}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
