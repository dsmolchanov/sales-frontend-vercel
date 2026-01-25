import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  QrCode,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";

const POLL_INTERVAL = 3000; // Poll every 3 seconds

export function WhatsAppConnectStep() {
  const { completeStep, skipStep, setCurrentStep, isSaving } =
    useOnboardingStore();
  const { session } = useAuthStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "waiting_qr" | "connected" | "error"
  >("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getAuthHeaders = () => {
    if (!session?.access_token) return {};
    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const pollConnectionStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CLINIC_WEBHOOKS_URL}/api/sales/whatsapp/status`,
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to check status");
      }

      const data = await response.json();

      if (data.status === "connected") {
        // Stop polling
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setConnectionStatus("connected");
        setPhoneNumber(data.phone_number);
        setQrCode(null);
      } else if (data.status === "waiting_qr" && data.qr_code) {
        setQrCode(data.qr_code);
        setConnectionStatus("waiting_qr");
      }
    } catch (err) {
      console.error("Polling error:", err);
      // Don't stop polling on error, just log it
    }
  };

  const startPolling = () => {
    // Clear any existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Start polling
    pollingRef.current = setInterval(pollConnectionStatus, POLL_INTERVAL);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus("connecting");
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_CLINIC_WEBHOOKS_URL}/api/sales/whatsapp/setup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to set up WhatsApp");
      }

      const data = await response.json();

      if (data.success) {
        if (data.status === "connected") {
          setConnectionStatus("connected");
          setPhoneNumber(data.phone_number);
        } else {
          setConnectionStatus("waiting_qr");
          setQrCode(data.qr_code);
          // Start polling for connection status
          startPolling();
        }
      } else {
        throw new Error(data.message || "Setup failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setConnectionStatus("error");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshQR = async () => {
    setIsConnecting(true);
    try {
      await pollConnectionStatus();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = async () => {
    await completeStep("whatsapp_connect", {
      connected: true,
      skipped: false,
      phone_number: phoneNumber,
    });
  };

  const handleSkip = async () => {
    // Stop polling when skipping
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    await skipStep("whatsapp_connect");
  };

  const handleBack = () => {
    // Stop polling when going back
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setCurrentStep("qualification_setup");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          <MessageSquare className="inline h-6 w-6 mr-2" />
          Connect WhatsApp
        </h2>
        <p className="text-muted-foreground mt-1">
          Connect your WhatsApp Business number to receive leads. You can skip
          this and test with the web preview first.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Connect WhatsApp Card */}
        <Card
          className={connectionStatus === "connected" ? "border-green-500" : ""}
        >
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {connectionStatus === "connected" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <QrCode className="h-5 w-5" />
              )}
              {connectionStatus === "connected"
                ? "WhatsApp Connected"
                : "Connect via QR Code"}
            </CardTitle>
            <CardDescription>
              {connectionStatus === "connected"
                ? `Connected to ${phoneNumber || "WhatsApp Business"}`
                : "Scan the QR code with your WhatsApp Business app to connect"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(connectionStatus === "idle" || connectionStatus === "error") && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-8 flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-24 w-24 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground mt-4">
                      QR code will appear here
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConnect}
                  className="w-full"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up WhatsApp...
                    </>
                  ) : (
                    "Set Up WhatsApp"
                  )}
                </Button>
              </div>
            )}

            {connectionStatus === "connecting" && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-8 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-24 w-24 text-primary mx-auto animate-spin" />
                    <p className="text-sm text-muted-foreground mt-4">
                      Setting up WhatsApp instance...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {connectionStatus === "waiting_qr" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 flex items-center justify-center border">
                  {qrCode ? (
                    <div className="text-center">
                      <img
                        src={
                          qrCode.startsWith("data:")
                            ? qrCode
                            : `data:image/png;base64,${qrCode}`
                        }
                        alt="WhatsApp QR Code"
                        className="w-64 h-64 mx-auto"
                      />
                      <p className="text-sm text-muted-foreground mt-4">
                        Scan with WhatsApp on your phone
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-24 w-24 text-primary mx-auto animate-spin" />
                      <p className="text-sm text-muted-foreground mt-4">
                        Loading QR code...
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRefreshQR}
                    disabled={isConnecting}
                    className="flex-1"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${isConnecting ? "animate-spin" : ""}`}
                    />
                    Refresh QR
                  </Button>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Open WhatsApp on your phone, go to Settings → Linked Devices →
                  Link a Device
                </p>
              </div>
            )}

            {connectionStatus === "connected" && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-8 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
                    <p className="text-lg font-medium mt-4">Connected!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {phoneNumber
                        ? `Connected to ${phoneNumber}`
                        : "Your WhatsApp Business is ready"}
                    </p>
                  </div>
                </div>
                <Button onClick={handleContinue} className="w-full">
                  Continue to Test & Launch
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip Option Card */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SkipForward className="h-5 w-5" />
              Skip for Now
            </CardTitle>
            <CardDescription>
              Test your agent with the web preview first, then connect WhatsApp
              later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Test conversations in the web preview
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  See how your agent responds to questions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Refine your product knowledge and settings
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Connect WhatsApp when you're ready
                </li>
              </ul>
              <Button
                variant="outline"
                onClick={handleSkip}
                className="w-full"
                disabled={isSaving}
              >
                Skip & Preview Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="pt-4 border-t">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    </div>
  );
}
