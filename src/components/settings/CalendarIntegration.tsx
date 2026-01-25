import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

interface CalendarIntegrationProps {
  repId: string;
  organizationId: string;
  userId?: string;
}

interface ConnectionStatus {
  checking: boolean;
  connected: boolean;
  provider: string | null;
  message: string;
  expired?: boolean;
}

export function CalendarIntegration({
  repId,
  organizationId,
  userId,
}: CalendarIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    checking: true,
    connected: false,
    provider: null,
    message: "Checking connection status...",
  });

  // Check connection status
  const checkConnectionStatus = useCallback(async () => {
    setConnectionStatus((prev) => ({ ...prev, checking: true }));

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/calendar/status/${repId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to check status");
      }

      const data = await response.json();

      setConnectionStatus({
        checking: false,
        connected: data.connected || false,
        provider: data.provider,
        message: data.message || "Status checked",
        expired: data.expired,
      });

      return data.connected;
    } catch (error) {
      console.error("Status check error:", error);
      setConnectionStatus({
        checking: false,
        connected: false,
        provider: null,
        message: "Could not verify connection status",
      });
      return false;
    }
  }, [repId]);

  // Check status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CALENDAR_CONNECTED") {
        if (event.data.success) {
          checkConnectionStatus();
        }
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [checkConnectionStatus]);

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/calendar/connect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rep_id: repId,
            organization_id: organizationId,
            user_id: userId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to initiate calendar connection");
      }

      const data = await response.json();

      if (data.auth_url) {
        // Open OAuth in popup
        const authWindow = window.open(
          data.auth_url,
          "google-auth",
          "width=500,height=600",
        );

        // Poll for connection status
        let pollCount = 0;
        const maxPolls = 120;

        const pollTimer = setInterval(async () => {
          pollCount++;

          if (pollCount > maxPolls) {
            clearInterval(pollTimer);
            setIsConnecting(false);
            return;
          }

          // Check if window closed or connection made
          try {
            if (authWindow?.closed) {
              const isConnected = await checkConnectionStatus();
              if (isConnected) {
                clearInterval(pollTimer);
                setIsConnecting(false);
              }
            } else if (pollCount % 3 === 0) {
              const isConnected = await checkConnectionStatus();
              if (isConnected) {
                clearInterval(pollTimer);
                setIsConnecting(false);
                authWindow?.close();
              }
            }
          } catch {
            // Continue polling
          }
        }, 1000);

        // Timeout fallback
        setTimeout(() => {
          setIsConnecting(false);
        }, 120000);
      }
    } catch (error) {
      console.error("Calendar connection error:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/calendar/disconnect/${repId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      setConnectionStatus({
        checking: false,
        connected: false,
        provider: null,
        message: "Calendar disconnected",
      });

      await checkConnectionStatus();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Calendar Integration</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Google Calendar
          </Badge>
        </div>
        <CardDescription>
          Connect your Google Calendar to automatically create events for
          discovery calls
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Connection Status</span>
            {connectionStatus.checking ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            ) : connectionStatus.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {connectionStatus.message}
          </div>

          {connectionStatus.expired && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              Your calendar connection has expired. Please reconnect.
            </div>
          )}

          {connectionStatus.connected && connectionStatus.provider && (
            <div className="text-sm">
              <span className="text-muted-foreground">Provider: </span>
              <span className="capitalize">{connectionStatus.provider}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!connectionStatus.connected ? (
            <>
              <Button
                onClick={handleConnect}
                disabled={isConnecting || connectionStatus.checking}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => checkConnectionStatus()}
                disabled={connectionStatus.checking || isConnecting}
                title="Refresh connection status"
              >
                <RefreshCw
                  className={`h-4 w-4 ${connectionStatus.checking ? "animate-spin" : ""}`}
                />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="flex-1"
              >
                Disconnect Calendar
              </Button>

              <Button
                variant="outline"
                onClick={() => checkConnectionStatus()}
                disabled={connectionStatus.checking}
                title="Refresh connection status"
              >
                <RefreshCw
                  className={`h-4 w-4 ${connectionStatus.checking ? "animate-spin" : ""}`}
                />
              </Button>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Connecting your calendar allows the system to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create events for booked discovery calls</li>
            <li>Include Google Meet links automatically</li>
            <li>Send calendar invites to your email</li>
          </ul>
        </div>

        {/* Calendly Coming Soon */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Calendly Integration</span>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Native Calendly integration for advanced scheduling options
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
