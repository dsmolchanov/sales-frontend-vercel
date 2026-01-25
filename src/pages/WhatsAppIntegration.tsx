import { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  Phone,
  Globe,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { useWhatsAppStore } from "@/stores/whatsappStore";
import type { WhatsAppInstance } from "@/types";

function InstanceCard({
  instance,
  onDelete,
  onConnect,
  onDisconnect,
  onRefresh,
  isLoading,
}: {
  instance: WhatsAppInstance;
  onDelete: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const { getQRCode } = useWhatsAppStore();

  const handleConnect = async () => {
    console.log(
      "[InstanceCard] handleConnect clicked for:",
      instance.instance_name,
    );
    setShowQr(true);
    setQrLoading(true);
    setQrError(null);
    try {
      console.log("[InstanceCard] Calling getQRCode...");
      const qr = await getQRCode(instance.instance_name);
      console.log("[InstanceCard] QR code result:", qr ? "received" : "null");
      if (!qr) {
        setQrError("Failed to get QR code. Check console for details.");
      }
      setQrCode(qr);
    } catch (err) {
      console.error("[InstanceCard] Error getting QR:", err);
      setQrError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setQrLoading(false);
    }
    onConnect();
  };

  const statusColors = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500",
    disconnected: "bg-gray-400",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {instance.instance_name}
                {instance.is_global && (
                  <Badge variant="secondary" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    Global
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`h-2 w-2 rounded-full ${statusColors[instance.status]}`}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {instance.status}
                </span>
                {instance.phone_number && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {instance.phone_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {instance.status === "disconnected" && (
          <div className="space-y-4">
            <Button onClick={handleConnect} className="w-full gap-2">
              <QrCode className="h-4 w-4" />
              Connect WhatsApp
            </Button>
            {showQr && (
              <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                {qrLoading && (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Loading QR code...
                    </p>
                  </>
                )}
                {qrError && (
                  <div className="text-center">
                    <p className="text-sm text-destructive">{qrError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleConnect}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                )}
                {!qrLoading && !qrError && qrCode && (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      Scan this QR code with WhatsApp on your phone
                    </p>
                    <img
                      src={
                        qrCode.startsWith("data:")
                          ? qrCode
                          : `data:image/png;base64,${qrCode}`
                      }
                      alt="WhatsApp QR Code"
                      className="w-64 h-64"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setQrLoading(true);
                        setQrError(null);
                        try {
                          const qr = await getQRCode(instance.instance_name);
                          if (!qr) {
                            setQrError("Failed to refresh QR code");
                          }
                          setQrCode(qr);
                        } catch (err) {
                          setQrError(
                            err instanceof Error
                              ? err.message
                              : "Failed to refresh",
                          );
                        } finally {
                          setQrLoading(false);
                        }
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh QR
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {instance.status === "connecting" && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-muted-foreground">Connecting...</span>
          </div>
        )}
        {instance.status === "connected" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="h-5 w-5" />
              <span>Connected and ready to receive messages</span>
            </div>
            <Button
              variant="outline"
              onClick={onDisconnect}
              className="w-full gap-2"
            >
              <WifiOff className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WhatsAppIntegrationPage() {
  const { user, organization } = useAuthStore();
  const {
    instances,
    globalInstance,
    isLoading,
    error,
    fetchInstances,
    createInstance,
    deleteInstance,
    disconnectInstance,
  } = useWhatsAppStore();

  const [newInstanceName, setNewInstanceName] = useState("");
  const [isGlobalInstance, setIsGlobalInstance] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const isSuperadmin = user?.is_superadmin || false;

  useEffect(() => {
    if (organization?.id) {
      fetchInstances(organization.id, isSuperadmin);
    }
  }, [organization?.id, isSuperadmin, fetchInstances]);

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim() || !user?.id) return;

    setIsCreating(true);
    try {
      await createInstance({
        instanceName: newInstanceName.trim().toLowerCase().replace(/\s+/g, "-"),
        organizationId: isGlobalInstance ? null : organization?.id || null,
        isGlobal: isGlobalInstance,
        userId: user.id,
      });
      setNewInstanceName("");
      setIsGlobalInstance(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (instance: WhatsAppInstance) => {
    if (confirm(`Delete instance "${instance.instance_name}"?`)) {
      await deleteInstance(instance.id, instance.instance_name);
    }
  };

  const handleRefresh = async () => {
    if (organization?.id) {
      await fetchInstances(organization.id, isSuperadmin);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          WhatsApp Integration
        </h2>
        <p className="text-muted-foreground">
          {isSuperadmin
            ? "Manage WhatsApp instances for all organizations"
            : "Connect your WhatsApp number for sales agent"}
        </p>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Global Instance Section (Superadmin only) */}
      {isSuperadmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Plaintalk.Sales Instance
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This instance is shared across all organizations for testing
              </p>
            </CardHeader>
            <CardContent>
              {globalInstance ? (
                <InstanceCard
                  instance={globalInstance}
                  onDelete={() => handleDelete(globalInstance)}
                  onConnect={() => {}}
                  onDisconnect={() =>
                    disconnectInstance(globalInstance.instance_name)
                  }
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    No global instance configured
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Input
                      placeholder="plaintalk-sales"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      onClick={() => {
                        setIsGlobalInstance(true);
                        handleCreateInstance();
                      }}
                      disabled={isCreating || !newInstanceName.trim()}
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Create Global
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />
        </>
      )}

      {/* Organization Instances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isSuperadmin
                  ? "Organization Instances"
                  : "Your WhatsApp Instance"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isSuperadmin
                  ? "Instances created by specific organizations"
                  : "Connect your WhatsApp number to receive leads"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new instance form */}
          <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex-1 space-y-2">
              <Label>Instance Name</Label>
              <Input
                placeholder="my-sales-whatsapp"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
              />
            </div>
            {isSuperadmin && (
              <div className="flex items-center gap-2">
                <Switch
                  id="global"
                  checked={isGlobalInstance}
                  onCheckedChange={setIsGlobalInstance}
                />
                <Label htmlFor="global">Global</Label>
              </div>
            )}
            <Button
              onClick={handleCreateInstance}
              disabled={isCreating || !newInstanceName.trim()}
              className="gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Instance
            </Button>
          </div>

          {/* Instance list */}
          {instances.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  onDelete={() => handleDelete(instance)}
                  onConnect={() => {}}
                  onDisconnect={() =>
                    disconnectInstance(instance.instance_name)
                  }
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No WhatsApp instances yet. Create one to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
