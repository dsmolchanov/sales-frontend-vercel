import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChatPreview } from "@/components/ChatPreview";

interface ValidationResult {
  valid: boolean;
  can_activate: boolean;
  errors: string[];
  warnings: string[];
}

export function TestAndLaunchStep() {
  const navigate = useNavigate();
  const { selectedOrgId, organization } = useAuthStore();
  const { setCurrentStep, completeStep, progress, isSaving } =
    useOnboardingStore();

  const [isActivated, setIsActivated] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Check current activation status
  useEffect(() => {
    if (organization) {
      // @ts-expect-error - activation_status may not be in type yet
      setIsActivated(organization.activation_status === "active");
    }
  }, [organization]);

  // Validate on mount
  useEffect(() => {
    validateActivation();
  }, [selectedOrgId]);

  const validateActivation = async () => {
    if (!selectedOrgId) return;

    setIsValidating(true);
    try {
      const { data, error } = await supabase.rpc("validate_activation", {
        p_organization_id: selectedOrgId,
      });

      if (error) throw error;
      setValidation(data as ValidationResult);
    } catch (error) {
      console.error("Validation error:", error);
      setValidation({
        valid: false,
        can_activate: false,
        errors: ["Failed to validate configuration"],
        warnings: [],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleActivationToggle = async (enabled: boolean) => {
    if (!selectedOrgId) return;

    // Validate first if trying to activate
    if (enabled && !validation?.can_activate) {
      toast.error("Please fix the errors before activating");
      return;
    }

    setIsActivating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (enabled) {
        const { data, error } = await supabase.rpc("activate_organization", {
          p_organization_id: selectedOrgId,
          p_user_id: user.id,
        });

        if (error) throw error;

        if (!data.success) {
          toast.error(data.message || "Failed to activate");
          return;
        }

        setIsActivated(true);
        toast.success("Agent activated! Your sales agent is now live.");
      } else {
        const { data, error } = await supabase.rpc("deactivate_organization", {
          p_organization_id: selectedOrgId,
          p_user_id: user.id,
        });

        if (error) throw error;

        if (!data.success) {
          toast.error(data.message || "Failed to deactivate");
          return;
        }

        setIsActivated(false);
        toast.success(
          "Agent paused. Messages will be queued for human review.",
        );
      }
    } catch (error) {
      console.error("Activation error:", error);
      toast.error("Failed to update activation status");
    } finally {
      setIsActivating(false);
    }
  };

  const handleBack = () => {
    setCurrentStep("whatsapp_connect");
  };

  const handleFinish = async () => {
    await completeStep("test_and_launch", { activated: isActivated });
    navigate("/");
    toast.success("Onboarding complete! Welcome to your dashboard.");
  };

  const whatsappSkipped = progress.whatsapp_connect.skipped;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          <Rocket className="inline h-6 w-6 mr-2" />
          Test & Launch
        </h2>
        <p className="text-muted-foreground mt-1">
          Preview your agent and activate when you're ready to go live.
        </p>
      </div>

      {/* Validation Status */}
      {validation && !validation.valid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Incomplete</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation && validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Suggestions</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              {validation.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview Card */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Preview Your Agent
            </CardTitle>
            <CardDescription>
              Test your agent with sample conversations before going live
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="h-[400px] border-t">
              <ChatPreview />
            </div>
          </CardContent>
        </Card>

        {/* Activation Card */}
        <Card className={isActivated ? "border-green-500" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Power className="h-5 w-5" />
              Activation Status
            </CardTitle>
            <CardDescription>
              {isActivated
                ? "Your agent is live and responding to messages"
                : "Activate your agent to start receiving leads"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Activation Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="activation">Agent Active</Label>
                <p className="text-xs text-muted-foreground">
                  {isActivated
                    ? "Agent is responding to WhatsApp messages"
                    : "Agent is paused, messages go to human queue"}
                </p>
              </div>
              <Switch
                id="activation"
                checked={isActivated}
                onCheckedChange={handleActivationToggle}
                disabled={
                  isActivating ||
                  isValidating ||
                  (!isActivated && !validation?.can_activate)
                }
              />
            </div>

            {/* Status Info */}
            {isActivated ? (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Agent is Live!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your sales agent is now responding to incoming WhatsApp
                    messages.
                    {whatsappSkipped &&
                      " Connect WhatsApp from the Integrations page to start receiving leads."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Power className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Agent is Paused</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Incoming messages will be queued for human review. Toggle
                    the switch above to activate your agent.
                  </p>
                </div>
              </div>
            )}

            {/* WhatsApp Status */}
            {whatsappSkipped && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>WhatsApp Not Connected</AlertTitle>
                <AlertDescription>
                  You skipped WhatsApp setup. You can still test with the web
                  preview, but you'll need to connect WhatsApp from the
                  Integrations page to receive real leads.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="pt-4 border-t flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleFinish} disabled={isSaving}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Finish Setup
        </Button>
      </div>
    </div>
  );
}
