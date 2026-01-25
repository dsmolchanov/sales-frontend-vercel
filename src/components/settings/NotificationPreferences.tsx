import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Loader2,
  Save,
} from "lucide-react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

interface NotificationPreferencesProps {
  repId: string;
  calendarConnected?: boolean;
  onPreferencesChange?: (prefs: NotificationPrefs) => void;
}

interface NotificationPrefs {
  email: boolean;
  whatsapp: boolean;
  google_calendar: boolean;
  whatsapp_phone?: string;
}

export function NotificationPreferences({
  repId,
  calendarConnected = false,
  onPreferencesChange,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    email: true,
    whatsapp: false,
    google_calendar: false,
    whatsapp_phone: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPrefs | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch current preferences
  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/calendar/preferences/${repId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load preferences");
      }

      const data = await response.json();

      const prefs = {
        email: data.email ?? true,
        whatsapp: data.whatsapp ?? false,
        google_calendar: data.google_calendar ?? false,
        whatsapp_phone: data.whatsapp_phone || "",
      };

      setPreferences(prefs);
      setOriginalPrefs(prefs);
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      setError("Failed to load notification preferences");
    } finally {
      setIsLoading(false);
    }
  }, [repId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Check for changes
  useEffect(() => {
    if (!originalPrefs) return;

    const changed =
      preferences.email !== originalPrefs.email ||
      preferences.whatsapp !== originalPrefs.whatsapp ||
      preferences.google_calendar !== originalPrefs.google_calendar ||
      preferences.whatsapp_phone !== originalPrefs.whatsapp_phone;

    setHasChanges(changed);
  }, [preferences, originalPrefs]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/calendar/preferences/${repId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to save preferences");
      }

      const data = await response.json();

      const newPrefs = {
        email: data.email ?? true,
        whatsapp: data.whatsapp ?? false,
        google_calendar: data.google_calendar ?? false,
        whatsapp_phone: data.whatsapp_phone || "",
      };

      setPreferences(newPrefs);
      setOriginalPrefs(newPrefs);
      setHasChanges(false);

      onPreferencesChange?.(newPrefs);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save preferences",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = (
    key: keyof NotificationPrefs,
    value: boolean | string,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Choose how you want to be notified when new discovery calls are booked
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <Label className="font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive booking confirmations via email
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Always On
            </Badge>
            <Switch
              checked={preferences.email}
              onCheckedChange={(checked) =>
                handlePreferenceChange("email", checked)
              }
              disabled // Email is always enabled
            />
          </div>
        </div>

        {/* WhatsApp Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <Label className="font-medium">WhatsApp Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get instant notifications on WhatsApp
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.whatsapp}
              onCheckedChange={(checked) =>
                handlePreferenceChange("whatsapp", checked)
              }
              disabled={!preferences.whatsapp_phone}
            />
          </div>

          {/* WhatsApp Phone Input */}
          <div className="ml-11 space-y-2">
            <Label htmlFor="whatsapp_phone" className="text-xs">
              WhatsApp Phone Number
            </Label>
            <Input
              id="whatsapp_phone"
              type="tel"
              placeholder="+7 999 123 4567"
              value={preferences.whatsapp_phone}
              onChange={(e) =>
                handlePreferenceChange("whatsapp_phone", e.target.value)
              }
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Enter your phone number with country code
            </p>
          </div>
        </div>

        {/* Google Calendar Events */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <Label className="font-medium">Google Calendar Events</Label>
              <p className="text-xs text-muted-foreground">
                Automatically create calendar events with Google Meet links
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!calendarConnected && (
              <Badge variant="outline" className="text-xs text-yellow-600">
                Connect Calendar First
              </Badge>
            )}
            <Switch
              checked={preferences.google_calendar}
              onCheckedChange={(checked) =>
                handlePreferenceChange("google_calendar", checked)
              }
              disabled={!calendarConnected}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges && "You have unsaved changes"}
          </div>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
