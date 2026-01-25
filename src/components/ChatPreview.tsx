import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  tool_calls?: Array<{
    name: string;
    result: Record<string, unknown>;
    sandbox: boolean;
  }>;
}

interface Suggestion {
  label: string;
  message: string;
}

interface ChatPreviewProps {
  className?: string;
}

export function ChatPreview({ className }: ChatPreviewProps) {
  const { session } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const getAuthHeaders = () => {
    if (!session?.access_token) return {};
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CLINIC_WEBHOOKS_URL}/api/sales/preview/suggestions`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
      // Use default suggestions
      setSuggestions([
        {
          label: "Ask about pricing",
          message: "What are your pricing options?",
        },
        { label: "Ask about features", message: "What features do you offer?" },
        { label: "Try booking", message: "I'd like to schedule a demo call" },
        {
          label: "Test qualification",
          message: "I'm looking for a solution for my 50-person team",
        },
      ]);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_CLINIC_WEBHOOKS_URL}/api/sales/preview/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            message: messageText,
            session_token: sessionToken,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send message");
      }

      const data = await response.json();

      // Update session token
      if (data.session_token) {
        setSessionToken(data.session_token);
      }

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        tool_calls: data.tool_calls,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    sendMessage(suggestion.message);
  };

  const handleReset = () => {
    setMessages([]);
    setSessionToken(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium">Sales Agent Preview</span>
          <Badge variant="secondary" className="text-xs">
            Sandbox Mode
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Test Your Sales Agent</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Try asking questions like a potential customer would. This is
              sandbox mode - no real bookings will be created.
            </p>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs"
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Show tool calls if any */}
                  {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                      <p className="text-xs text-muted-foreground mb-1">
                        Actions taken:
                      </p>
                      {message.tool_calls.map((tool, toolIdx) => (
                        <Badge
                          key={toolIdx}
                          variant="outline"
                          className="text-xs mr-1 mb-1"
                        >
                          {tool.sandbox && "🔒 "}
                          {tool.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Suggestions row (when there are messages) */}
      {messages.length > 0 && suggestions.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs whitespace-nowrap flex-shrink-0"
              >
                {suggestion.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
