import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  useOnboardingStore,
  ONBOARDING_STEPS,
  STEP_METADATA,
  type OnboardingStep,
} from "@/stores/onboardingStore";
import { Progress } from "@/components/ui/progress";

// Step components
import { CompanyBasicsStep } from "./steps/CompanyBasics";
import { ProductKnowledgeStep } from "./steps/ProductKnowledge";
import { QualificationSetupStep } from "./steps/QualificationSetup";
import { WhatsAppConnectStep } from "./steps/WhatsAppConnect";
import { TestAndLaunchStep } from "./steps/TestAndLaunch";

const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
  company_basics: CompanyBasicsStep,
  product_knowledge: ProductKnowledgeStep,
  qualification_setup: QualificationSetupStep,
  whatsapp_connect: WhatsAppConnectStep,
  test_and_launch: TestAndLaunchStep,
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const {
    selectedOrgId,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuthStore();
  const {
    initialize,
    currentStep,
    setCurrentStep,
    progress,
    isLoading,
    isSaving,
    getProgress,
    isStepAccessible,
  } = useOnboardingStore();

  // Initialize onboarding when org is available
  useEffect(() => {
    if (selectedOrgId) {
      initialize(selectedOrgId);
    }
  }, [selectedOrgId, initialize]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = STEP_COMPONENTS[currentStep];
  const progressPercent = getProgress();

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Set Up Your Sales Agent</h1>
            <div className="flex items-center gap-4">
              {isSaving && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {progressPercent}% complete
              </span>
            </div>
          </div>
          <Progress value={progressPercent} className="mt-4 h-2" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Step Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {ONBOARDING_STEPS.map((step, idx) => {
                const meta = STEP_METADATA[step];
                const isActive = step === currentStep;
                const isDone = progress[step].done;
                const isSkipped = progress[step].skipped;
                const isAccessible = isStepAccessible(step);

                return (
                  <button
                    key={step}
                    onClick={() => isAccessible && setCurrentStep(step)}
                    disabled={!isAccessible}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isAccessible
                          ? "hover:bg-muted"
                          : "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {/* Step Number / Check */}
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        isDone || isSkipped
                          ? "bg-green-100 text-green-600"
                          : isActive
                            ? "bg-primary-foreground text-primary"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isDone || isSkipped ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="flex-grow min-w-0">
                      <p
                        className={cn(
                          "font-medium truncate",
                          isActive ? "" : "text-foreground",
                        )}
                      >
                        {meta.title}
                      </p>
                      <p
                        className={cn(
                          "text-xs truncate",
                          isActive
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {isSkipped ? "Skipped" : meta.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-grow">
            <div className="bg-background rounded-lg border p-8">
              <CurrentStepComponent />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
