import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type {
  SalesOrganizationConfig,
  SalesConfigFormData,
  DEFAULT_SALES_CONFIG,
} from "@/types/salesConfig";

interface SalesConfigState {
  config: SalesOrganizationConfig | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchConfig: (organizationId: string) => Promise<void>;
  saveConfig: (
    organizationId: string,
    data: SalesConfigFormData,
  ) => Promise<void>;
  clearError: () => void;
}

export const useSalesConfigStore = create<SalesConfigState>((set, get) => ({
  config: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchConfig: async (organizationId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .schema("agents")
        .from("organization_configs")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("agent_type", "sales")
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found
        throw error;
      }

      set({
        config: data as SalesOrganizationConfig | null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching config:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch configuration",
      });
    }
  },

  saveConfig: async (organizationId: string, data: SalesConfigFormData) => {
    try {
      set({ isSaving: true, error: null });

      const existingConfig = get().config;

      if (existingConfig) {
        // Update existing config
        const { data: updated, error } = await supabase
          .schema("agents")
          .from("organization_configs")
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingConfig.id)
          .select()
          .single();

        if (error) throw error;

        set({
          config: updated as SalesOrganizationConfig,
          isSaving: false,
        });
      } else {
        // Create new config
        const { data: created, error } = await supabase
          .schema("agents")
          .from("organization_configs")
          .insert({
            organization_id: organizationId,
            agent_type: "sales",
            ...data,
          })
          .select()
          .single();

        if (error) throw error;

        set({
          config: created as SalesOrganizationConfig,
          isSaving: false,
        });
      }
    } catch (error) {
      console.error("Error saving config:", error);
      set({
        isSaving: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save configuration",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper function to get default config with required fields
export function getDefaultConfig(
  companyName: string,
  escalationEmail: string,
): SalesConfigFormData {
  return {
    agent_name: "Sales Assistant",
    company_description: "",
    escalation_phone: "",
    primary_language: "ru",
    supported_languages: ["ru", "en"],
    call_duration_minutes: 30,
    call_type_name: "discovery-call",
    product_info: {
      general: { title: "About Us", title_en: "About Us", content: "" },
      features: { title: "Features", title_en: "Features", content: "" },
      pricing: { title: "Pricing", title_en: "Pricing", content: "" },
    },
    qualification_questions: [
      {
        id: "use_case",
        question_ru: "What functionality do you need?",
        question_en: "What functionality do you need?",
      },
      {
        id: "timeline",
        question_ru: "When do you plan to start?",
        question_en: "When do you plan to start?",
      },
      {
        id: "company",
        question_ru: "Company name and your role?",
        question_en: "Company name and your role?",
      },
    ],
    scoring_criteria: {
      hot: {
        criteria_ru: "Clear use case + 1-3 month timeline",
        criteria_en: "Clear use case + 1-3 month timeline",
      },
      warm: {
        criteria_ru: "Interesting but unclear timeline",
        criteria_en: "Interesting but unclear timeline",
      },
      cold: {
        criteria_ru: "Just exploring, distant timeline",
        criteria_en: "Just exploring, distant timeline",
      },
    },
    system_prompt_template: "",
    english_addon_template: "",
    company_name: companyName,
    escalation_email: escalationEmail,

    // New fields
    sales_reps: [],
    hubspot_integration: {
      enabled: false,
      sync_as_unqualified: true,
    },
    cta_settings: {
      message_ru:
        "Давайте я назначу звонок с моим коллегой - он ответит на конкретные вопросы по цене, акциям и продукту. Когда вам удобно созвониться? В каком часовом поясе вы находитесь?",
      message_en:
        "Let me schedule a call with my colleague - they can answer specific questions about pricing, promotions, and the product. When would be convenient for you? What timezone are you in?",
      max_iterations_before_cta: 5,
      offer_call_types: ["phone", "google_meet", "zoom", "whatsapp"],
      follow_up_hours: 24,
    },
    bant_qualification: {
      need: {
        question_ru: "Какой функционал вам нужен? Какую задачу хотите решить?",
        question_en:
          "What functionality do you need? What problem are you trying to solve?",
        required: true,
      },
      timeline: {
        question_ru: "Когда планируете начать работу?",
        question_en: "When do you plan to start?",
        required: true,
      },
      budget: {
        question_ru: "Какой бюджет вы рассматриваете?",
        question_en: "What budget are you considering?",
        required: false,
      },
      authority: {
        question_ru: "Как называется ваша компания и какая у вас роль?",
        question_en: "What is your company name and your role?",
        required: false,
      },
      question_order: ["need", "timeline", "budget", "authority"],
    },
    escalation_triggers: {
      manual_intervention: true,
      explicit_request: true,
      agent_error: true,
      irrelevant_questions: true,
      violence_threats: true,
      competitor_mentions: true,
      vip_detection: true,
      vip_keywords: ["enterprise", "крупный", "10000", "миллион", "million"],
      vip_volume_threshold: ">1000 users",
    },
    agent_behavior: {
      disclose_bot_identity: true,
      bot_disclosure_message_ru:
        "Привет! Я бот-помощник команды продаж. Могу ответить на вопросы о продукте и помочь назначить звонок с менеджером.",
      bot_disclosure_message_en:
        "Hi! I'm a sales assistant bot. I can answer questions about the product and help schedule a call with a manager.",
    },

    // Greeting messages
    greeting_messages: { ru: "", en: "" },

    // HITL settings
    hitl_auto_release_hours: 24,
  };
}
