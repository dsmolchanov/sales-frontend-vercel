// Product information topics for agent knowledge base
export interface ProductInfoTopic {
  title: string;
  title_en?: string;
  content: string;
}

// Qualification questions asked by the agent
export interface QualificationQuestion {
  id: string;
  question_ru: string;
  question_en?: string;
}

// Criteria for scoring leads
export interface ScoringCriteria {
  hot: { criteria_ru: string; criteria_en?: string };
  warm: { criteria_ru: string; criteria_en?: string };
  cold: { criteria_ru: string; criteria_en?: string };
}

// Timezone regions for sales rep availability
export type TimezoneRegion =
  | "RU"
  | "US_CANADA"
  | "AUSTRALIA_NZ"
  | "EU"
  | "ASIA";

// Sales rep with availability
export interface SalesRepAvailability {
  id: string;
  name: string;
  email: string;
  timezone_regions: TimezoneRegion[];
  working_hours?: {
    start: string; // "09:00"
    end: string; // "18:00"
  };
  calendar_id?: string;
}

// HubSpot integration settings
export interface HubSpotIntegration {
  enabled: boolean;
  api_key?: string;
  sync_as_unqualified: boolean; // true = MQL, false = qualified lead
  pipeline_id?: string;
  stage_id?: string;
}

// CTA (Call-to-Action) settings
export interface CTASettings {
  message_ru: string;
  message_en?: string;
  max_iterations_before_cta: number; // How many exchanges before offering CTA
  offer_call_types: ("phone" | "google_meet" | "zoom" | "whatsapp")[];
  follow_up_hours: number; // "colleague will contact within X hours"
  // Direct purchase CTA when lead declines manager contact
  purchase_url?: string; // Direct purchase link for self-service
  purchase_cta_ru?: string; // CTA message when lead declines manager (Russian)
  purchase_cta_en?: string; // CTA message when lead declines manager (English)
}

// BANT qualification model
export interface BANTQualification {
  need: {
    question_ru: string;
    question_en?: string;
    required: boolean;
  };
  timeline: {
    question_ru: string;
    question_en?: string;
    required: boolean;
  };
  budget: {
    question_ru: string;
    question_en?: string;
    required: boolean;
  };
  authority: {
    question_ru: string;
    question_en?: string;
    required: boolean;
  };
  // Order of questions (NTBA as per user request)
  question_order: ("need" | "timeline" | "budget" | "authority")[];
}

// Human escalation triggers
export interface EscalationTriggers {
  // Always escalate
  manual_intervention: boolean; // Human types in chat
  explicit_request: boolean; // User asks for human
  agent_error: boolean; // Bot encounters error

  // Content-based triggers
  irrelevant_questions: boolean; // Off-topic questions (e.g., "what's 3-16 billion")
  violence_threats: boolean; // Violence, threats, etc.
  competitor_mentions: boolean; // Mentions competitors, price comparisons

  // Value-based triggers
  vip_detection: boolean; // Large deals, enterprise clients
  vip_keywords: string[]; // Keywords that indicate VIP (e.g., "enterprise", "10000 users")
  vip_volume_threshold?: string; // e.g., ">1000 users"
}

// Agent behavior settings
export interface AgentBehavior {
  disclose_bot_identity: boolean; // Don't pretend to be human
  bot_disclosure_message_ru: string;
  bot_disclosure_message_en?: string;
}

// Main sales organization configuration
export interface SalesOrganizationConfig {
  id: string;
  organization_id: string;
  company_name: string;
  company_description?: string;
  agent_name: string;
  escalation_email?: string;
  escalation_phone?: string;
  primary_language: "ru" | "en";
  supported_languages: string[];
  call_duration_minutes: number;
  call_type_name: string;
  product_info: Record<string, ProductInfoTopic>;
  qualification_questions: QualificationQuestion[];
  scoring_criteria: ScoringCriteria;
  system_prompt_template?: string;
  english_addon_template?: string;

  // New fields
  sales_reps: SalesRepAvailability[];
  hubspot_integration: HubSpotIntegration;
  cta_settings: CTASettings;
  bant_qualification: BANTQualification;
  escalation_triggers: EscalationTriggers;
  agent_behavior: AgentBehavior;

  // Greeting messages per language
  greeting_messages: Record<string, string>;

  // HITL settings
  hitl_auto_release_hours: number;

  created_at: string;
  updated_at: string;
}

// Lead qualification scores
export type QualificationScore = "new" | "hot" | "warm" | "cold";

// Lead status in the pipeline
export type LeadStatus =
  | "new"
  | "qualified"
  | "scheduled"
  | "converted"
  | "lost";

// Lead record
export interface Lead {
  id: string;
  organization_id: string;
  phone: string;
  contact_name?: string;
  company_name?: string;
  use_case?: string;
  current_stack?: string;
  expected_volume?: string;
  timeline?: string;
  qualification_score: QualificationScore;
  status: LeadStatus;
  notes?: string;
  assigned_rep_id?: string;
  created_at: string;
  updated_at: string;
}

// Discovery call status
export type CallStatus = "scheduled" | "completed" | "cancelled" | "no_show";

// Discovery call record
export interface DiscoveryCall {
  id: string;
  organization_id: string;
  lead_id: string;
  rep_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: CallStatus;
  google_event_id?: string;
  notes?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

// Sales organization (tenant)
export interface SalesOrganization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Sales team member
export interface SalesTeamMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "admin" | "manager" | "rep";
  email: string;
  name?: string;
  calendar_id?: string;
  created_at: string;
}

// Form data for creating/updating config
export interface SalesConfigFormData {
  company_name: string;
  company_description?: string;
  agent_name: string;
  escalation_email?: string;
  escalation_phone?: string;
  primary_language: "ru" | "en";
  supported_languages: string[];
  call_duration_minutes: number;
  call_type_name: string;
  product_info: Record<string, ProductInfoTopic>;
  qualification_questions: QualificationQuestion[];
  scoring_criteria: ScoringCriteria;
  system_prompt_template?: string;
  english_addon_template?: string;

  // New fields
  sales_reps: SalesRepAvailability[];
  hubspot_integration: HubSpotIntegration;
  cta_settings: CTASettings;
  bant_qualification: BANTQualification;
  escalation_triggers: EscalationTriggers;
  agent_behavior: AgentBehavior;

  // Greeting messages
  greeting_messages: Record<string, string>;

  // HITL settings
  hitl_auto_release_hours: number;
}

// Default config for new organizations
export const DEFAULT_SALES_CONFIG: Omit<
  SalesConfigFormData,
  "company_name" | "escalation_email"
> = {
  agent_name: "Sales Assistant",
  company_description: "",
  escalation_phone: "",
  primary_language: "ru",
  supported_languages: ["ru", "en"],
  call_duration_minutes: 30,
  call_type_name: "discovery-call",
  product_info: {
    general: { title: "About Us", title_en: "About Us", content: "" },
    features: {
      title: "Features",
      title_en: "Features",
      content: "",
    },
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

  // New field defaults
  sales_reps: [],
  hubspot_integration: {
    enabled: false,
    sync_as_unqualified: true, // Default: sync as unqualified (not MQL)
  },
  cta_settings: {
    message_ru:
      "Давайте я назначу звонок с моим коллегой - он ответит на конкретные вопросы по цене, акциям и продукту. Когда вам удобно созвониться? В каком часовом поясе вы находитесь?",
    message_en:
      "Let me schedule a call with my colleague - they can answer specific questions about pricing, promotions, and the product. When would be convenient for you? What timezone are you in?",
    max_iterations_before_cta: 5,
    offer_call_types: ["phone", "google_meet", "zoom", "whatsapp"],
    follow_up_hours: 24,
    purchase_url: "",
    purchase_cta_ru: "",
    purchase_cta_en: "",
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
  greeting_messages: {
    ru: "",
    en: "",
  },
  hitl_auto_release_hours: 24,
};
