import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

// Step definitions
export const ONBOARDING_STEPS = [
  "company_basics",
  "product_knowledge",
  "qualification_setup",
  "whatsapp_connect",
  "test_and_launch",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface StepStatus {
  done: boolean;
  skipped: boolean;
}

export interface OnboardingProgress {
  company_basics: StepStatus;
  product_knowledge: StepStatus;
  qualification_setup: StepStatus;
  whatsapp_connect: StepStatus;
  test_and_launch: StepStatus;
}

export interface CompanyBasicsData {
  company_name: string;
  company_description: string;
  escalation_email: string;
  primary_language: string;
}

export interface ProductKnowledgeData {
  general: { title: string; title_en?: string; content: string };
  features?: { title: string; title_en?: string; content: string };
  pricing?: { title: string; title_en?: string; content: string };
  [key: string]:
    | { title: string; title_en?: string; content: string }
    | undefined;
}

export interface QualificationQuestion {
  id: string;
  question_ru: string;
  question_en?: string;
}

export interface QualificationSetupData {
  qualification_questions: QualificationQuestion[];
  scoring_criteria: {
    hot: { criteria_ru: string; criteria_en?: string };
    warm: { criteria_ru: string; criteria_en?: string };
    cold: { criteria_ru: string; criteria_en?: string };
  };
}

export interface StepData {
  company_basics?: CompanyBasicsData;
  product_knowledge?: ProductKnowledgeData;
  qualification_setup?: QualificationSetupData;
  whatsapp_connect?: { connected: boolean; skipped: boolean };
  test_and_launch?: { activated: boolean };
}

interface OnboardingState {
  organizationId: string | null;
  progress: OnboardingProgress;
  stepData: StepData;
  currentStep: OnboardingStep;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Auto-save debounce timer
  saveTimeout: ReturnType<typeof setTimeout> | null;

  // Actions
  initialize: (organizationId: string) => Promise<void>;
  setCurrentStep: (step: OnboardingStep) => void;
  updateStepData: <T extends keyof StepData>(
    step: T,
    data: Partial<StepData[T]>,
  ) => void;
  completeStep: (
    step: OnboardingStep,
    data?: StepData[OnboardingStep],
  ) => Promise<void>;
  skipStep: (step: OnboardingStep) => Promise<void>;
  canProceed: (step: OnboardingStep) => boolean;
  getNextStep: () => OnboardingStep | null;
  getPreviousStep: () => OnboardingStep | null;
  isStepAccessible: (step: OnboardingStep) => boolean;
  getProgress: () => number;

  // Internal
  _saveToDatabase: () => Promise<void>;
  _debouncedSave: () => void;
}

const DEFAULT_PROGRESS: OnboardingProgress = {
  company_basics: { done: false, skipped: false },
  product_knowledge: { done: false, skipped: false },
  qualification_setup: { done: false, skipped: false },
  whatsapp_connect: { done: false, skipped: false },
  test_and_launch: { done: false, skipped: false },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      organizationId: null,
      progress: DEFAULT_PROGRESS,
      stepData: {},
      currentStep: "company_basics",
      isLoading: false,
      isSaving: false,
      error: null,
      saveTimeout: null,

      initialize: async (organizationId: string) => {
        set({ isLoading: true, error: null, organizationId });

        try {
          // Fetch onboarding progress from database
          const { data, error } = await supabase
            .schema("agents")
            .from("onboarding_progress")
            .select("progress, step_data")
            .eq("organization_id", organizationId)
            .single();

          if (error && error.code !== "PGRST116") {
            throw error;
          }

          if (data) {
            const progress = data.progress as OnboardingProgress;
            const stepData = (data.step_data as StepData) || {};

            // Find the first incomplete step
            const currentStep =
              ONBOARDING_STEPS.find(
                (step) => !progress[step].done && !progress[step].skipped,
              ) || "test_and_launch";

            set({
              progress,
              stepData,
              currentStep,
              isLoading: false,
            });
          } else {
            set({
              progress: DEFAULT_PROGRESS,
              stepData: {},
              currentStep: "company_basics",
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error initializing onboarding:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load onboarding progress",
          });
        }
      },

      setCurrentStep: (step: OnboardingStep) => {
        const { isStepAccessible } = get();
        if (isStepAccessible(step)) {
          set({ currentStep: step });
        }
      },

      updateStepData: (step, data) => {
        const { stepData, _debouncedSave } = get();
        const currentStepData = stepData[step] || {};

        set({
          stepData: {
            ...stepData,
            [step]: { ...currentStepData, ...data },
          },
        });

        // Auto-save with debounce
        _debouncedSave();
      },

      completeStep: async (
        step: OnboardingStep,
        data?: StepData[OnboardingStep],
      ) => {
        const { organizationId, progress, stepData, getNextStep } = get();

        if (!organizationId) return;

        set({ isSaving: true });

        try {
          // Update local state
          const newProgress = {
            ...progress,
            [step]: { done: true, skipped: false },
          };

          const newStepData = data ? { ...stepData, [step]: data } : stepData;

          // Call RPC function to update database
          const { error } = await supabase.rpc("update_onboarding_step", {
            p_organization_id: organizationId,
            p_step_name: step,
            p_done: true,
            p_skipped: false,
            p_step_data: newStepData[step]
              ? JSON.stringify(newStepData[step])
              : null,
          });

          if (error) throw error;

          // Update local state and move to next step
          const nextStep = getNextStep();
          set({
            progress: newProgress,
            stepData: newStepData,
            currentStep: nextStep || step,
            isSaving: false,
          });
        } catch (error) {
          console.error("Error completing step:", error);
          set({
            isSaving: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to save progress",
          });
        }
      },

      skipStep: async (step: OnboardingStep) => {
        const { organizationId, progress, getNextStep } = get();

        if (!organizationId) return;

        // Only certain steps can be skipped
        if (!["whatsapp_connect"].includes(step)) {
          return;
        }

        set({ isSaving: true });

        try {
          const newProgress = {
            ...progress,
            [step]: { done: false, skipped: true },
          };

          // Call RPC function
          const { error } = await supabase.rpc("update_onboarding_step", {
            p_organization_id: organizationId,
            p_step_name: step,
            p_done: false,
            p_skipped: true,
            p_step_data: null,
          });

          if (error) throw error;

          const nextStep = getNextStep();
          set({
            progress: newProgress,
            currentStep: nextStep || step,
            isSaving: false,
          });
        } catch (error) {
          console.error("Error skipping step:", error);
          set({
            isSaving: false,
            error:
              error instanceof Error ? error.message : "Failed to skip step",
          });
        }
      },

      canProceed: (step: OnboardingStep): boolean => {
        const { progress } = get();
        const idx = ONBOARDING_STEPS.indexOf(step);

        if (idx === 0) return true;

        // Check if previous step is completed or skipped
        const prevStep = ONBOARDING_STEPS[idx - 1];
        return progress[prevStep].done || progress[prevStep].skipped;
      },

      getNextStep: (): OnboardingStep | null => {
        const { currentStep, progress } = get();
        const currentIdx = ONBOARDING_STEPS.indexOf(currentStep);

        // Find next incomplete step
        for (let i = currentIdx + 1; i < ONBOARDING_STEPS.length; i++) {
          const step = ONBOARDING_STEPS[i];
          if (!progress[step].done && !progress[step].skipped) {
            return step;
          }
        }

        return null;
      },

      getPreviousStep: (): OnboardingStep | null => {
        const { currentStep } = get();
        const currentIdx = ONBOARDING_STEPS.indexOf(currentStep);

        if (currentIdx > 0) {
          return ONBOARDING_STEPS[currentIdx - 1];
        }

        return null;
      },

      isStepAccessible: (step: OnboardingStep): boolean => {
        const { progress } = get();
        const idx = ONBOARDING_STEPS.indexOf(step);

        // First step is always accessible
        if (idx === 0) return true;

        // Step is accessible if all previous steps are done or skipped
        for (let i = 0; i < idx; i++) {
          const prevStep = ONBOARDING_STEPS[i];
          if (!progress[prevStep].done && !progress[prevStep].skipped) {
            return false;
          }
        }

        return true;
      },

      getProgress: (): number => {
        const { progress } = get();
        const completed = ONBOARDING_STEPS.filter(
          (step) => progress[step].done || progress[step].skipped,
        ).length;
        return Math.round((completed / ONBOARDING_STEPS.length) * 100);
      },

      _saveToDatabase: async () => {
        const { organizationId, stepData } = get();

        if (!organizationId) return;

        try {
          await supabase
            .schema("agents")
            .from("onboarding_progress")
            .update({
              step_data: stepData,
              updated_at: new Date().toISOString(),
            })
            .eq("organization_id", organizationId);
        } catch (error) {
          console.error("Error auto-saving:", error);
        }
      },

      _debouncedSave: () => {
        const { saveTimeout, _saveToDatabase } = get();

        // Clear existing timeout
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        // Set new timeout for debounced save (1 second)
        const timeout = setTimeout(() => {
          _saveToDatabase();
        }, 1000);

        set({ saveTimeout: timeout });
      },
    }),
    {
      name: "onboarding-storage",
      partialize: (state) => ({
        // Only persist non-sensitive data locally
        currentStep: state.currentStep,
        organizationId: state.organizationId,
      }),
    },
  ),
);

// Step metadata for UI
export const STEP_METADATA: Record<
  OnboardingStep,
  {
    title: string;
    description: string;
    activeForm: string;
    canSkip: boolean;
  }
> = {
  company_basics: {
    title: "Company Basics",
    description: "Tell us about your company",
    activeForm: "Setting up company basics",
    canSkip: false,
  },
  product_knowledge: {
    title: "Product Knowledge",
    description: "Teach your agent about your product",
    activeForm: "Adding product knowledge",
    canSkip: false,
  },
  qualification_setup: {
    title: "Lead Qualification",
    description: "Define how to qualify and score leads",
    activeForm: "Setting up qualification",
    canSkip: false,
  },
  whatsapp_connect: {
    title: "Connect WhatsApp",
    description: "Connect your WhatsApp Business number",
    activeForm: "Connecting WhatsApp",
    canSkip: true, // Can skip to preview first
  },
  test_and_launch: {
    title: "Test & Launch",
    description: "Preview and activate your agent",
    activeForm: "Testing agent",
    canSkip: false,
  },
};
