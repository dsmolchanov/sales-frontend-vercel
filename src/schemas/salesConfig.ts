/**
 * Zod schemas for sales configuration validation.
 *
 * These schemas ensure proper validation of organization configurations
 * on the frontend before sending to the backend.
 */

import { z } from "zod";

// =============================================================================
// Product Information
// =============================================================================

export const productInfoTopicSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  title_en: z.string().max(255).optional(),
  content: z.string().min(1, "Content is required"),
});

export const productInfoSchema = z
  .object({
    general: productInfoTopicSchema, // Required
    features: productInfoTopicSchema.optional(),
    pricing: productInfoTopicSchema.optional(),
    security: productInfoTopicSchema.optional(),
    sdk: productInfoTopicSchema.optional(),
    networks: productInfoTopicSchema.optional(),
  })
  .passthrough(); // Allow additional topics

// =============================================================================
// Qualification
// =============================================================================

export const qualificationQuestionSchema = z.object({
  id: z.string().min(1, "ID is required").max(50),
  question_ru: z.string().min(5, "Question must be at least 5 characters"),
  question_en: z.string().min(5).optional(),
});

export const scoringCriteriaItemSchema = z.object({
  criteria_ru: z.string().min(5, "Criteria must be at least 5 characters"),
  criteria_en: z.string().min(5).optional(),
});

export const scoringCriteriaSchema = z.object({
  hot: scoringCriteriaItemSchema,
  warm: scoringCriteriaItemSchema,
  cold: scoringCriteriaItemSchema,
});

// =============================================================================
// BANT Qualification
// =============================================================================

export const bantQuestionSchema = z.object({
  question_ru: z.string().min(5, "Question must be at least 5 characters"),
  question_en: z.string().min(5).optional(),
  required: z.boolean().default(false),
});

export const bantQualificationSchema = z.object({
  need: bantQuestionSchema,
  timeline: bantQuestionSchema,
  budget: bantQuestionSchema.optional(),
  authority: bantQuestionSchema.optional(),
  question_order: z
    .array(z.enum(["need", "timeline", "budget", "authority"]))
    .default(["need", "timeline", "budget", "authority"]),
});

// =============================================================================
// CTA and Agent Behavior
// =============================================================================

export const ctaSettingsSchema = z.object({
  message_ru: z.string().min(10, "CTA message must be at least 10 characters"),
  message_en: z.string().min(10).optional(),
  max_iterations_before_cta: z.number().min(1).max(20).default(5),
  offer_call_types: z
    .array(z.enum(["phone", "google_meet", "zoom", "whatsapp"]))
    .default(["phone", "google_meet", "zoom", "whatsapp"]),
  follow_up_hours: z.number().min(1).max(168).default(24),
});

export const escalationTriggersSchema = z.object({
  manual_intervention: z.boolean().default(true),
  explicit_request: z.boolean().default(true),
  agent_error: z.boolean().default(true),
  irrelevant_questions: z.boolean().default(true),
  violence_threats: z.boolean().default(true),
  competitor_mentions: z.boolean().default(true),
  vip_detection: z.boolean().default(true),
  vip_keywords: z.array(z.string()).default(["enterprise", "10000", "million"]),
  vip_volume_threshold: z.string().optional(),
});

export const agentBehaviorSchema = z.object({
  disclose_bot_identity: z.boolean().default(true),
  bot_disclosure_message_ru: z
    .string()
    .default(
      "I'm a sales assistant bot. I can help answer questions about our product.",
    ),
  bot_disclosure_message_en: z.string().optional(),
});

// =============================================================================
// Integrations
// =============================================================================

export const hubspotIntegrationSchema = z.object({
  enabled: z.boolean().default(false),
  api_key: z.string().optional(),
  sync_as_unqualified: z.boolean().default(true),
  pipeline_id: z.string().optional(),
  stage_id: z.string().optional(),
});

export const salesRepAvailabilitySchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email format"),
  timezone_regions: z
    .array(z.enum(["RU", "US_CANADA", "AUSTRALIA_NZ", "EU", "ASIA"]))
    .default([]),
  working_hours: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  calendar_id: z.string().nullable().optional(),
});

// =============================================================================
// Main Organization Config Schema
// =============================================================================

export const organizationConfigSchema = z.object({
  // Core identifiers
  id: z.string().optional(),
  organization_id: z.string().optional(),

  // Company basics (required for activation)
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(255),
  company_description: z
    .string()
    .min(10, "Description must be at least 10 characters"),

  // Contact/Escalation (required for activation)
  escalation_email: z.string().email("Invalid email format"),
  escalation_phone: z.string().optional(),

  // Agent settings
  agent_name: z.string().min(1).max(100).default("Sales Assistant"),

  // Language settings
  primary_language: z.enum(["en", "ru", "es", "de"]).default("en"),
  supported_languages: z.array(z.string()).default(["en"]),

  // Call settings
  call_duration_minutes: z.number().min(15).max(120).default(30),
  call_type_name: z.string().min(1).default("discovery-call"),

  // Product knowledge (required for activation)
  product_info: productInfoSchema,

  // Qualification
  qualification_questions: z.array(qualificationQuestionSchema).default([]),
  scoring_criteria: scoringCriteriaSchema.optional(),
  bant_qualification: bantQualificationSchema.optional(),

  // CTA and behavior
  cta_settings: ctaSettingsSchema.optional(),
  escalation_triggers: escalationTriggersSchema.optional(),
  agent_behavior: agentBehaviorSchema.optional(),

  // Prompt customization
  system_prompt_template: z.string().optional(),
  english_addon_template: z.string().optional(),

  // Greeting messages
  greeting_messages: z.record(z.string(), z.string()).default({}),

  // HITL settings
  hitl_auto_release_hours: z.number().min(1).max(168).default(24),

  // Sales team
  sales_reps: z.array(salesRepAvailabilitySchema).default([]),

  // Integrations
  hubspot_integration: hubspotIntegrationSchema.optional(),

  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// =============================================================================
// Create/Update Schemas
// =============================================================================

export const organizationConfigCreateSchema = z.object({
  company_name: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(255),
  company_description: z.string().min(10).optional(),
  escalation_email: z.string().email().optional(),
  primary_language: z.enum(["en", "ru", "es", "de"]).default("en"),
  agent_name: z.string().default("Sales Assistant"),
  product_info: z.record(z.string(), z.unknown()).optional(),
  qualification_questions: z
    .array(z.record(z.string(), z.unknown()))
    .optional(),
});

export const organizationConfigUpdateSchema = z
  .object({
    company_name: z.string().min(2).max(255).optional(),
    company_description: z.string().min(10).optional(),
    escalation_email: z.string().email().optional(),
    escalation_phone: z.string().optional(),
    agent_name: z.string().min(1).max(100).optional(),
    primary_language: z.enum(["en", "ru", "es", "de"]).optional(),
    supported_languages: z.array(z.string()).optional(),
    call_duration_minutes: z.number().min(15).max(120).optional(),
    call_type_name: z.string().min(1).optional(),
    product_info: z.record(z.string(), z.unknown()).optional(),
    qualification_questions: z
      .array(z.record(z.string(), z.unknown()))
      .optional(),
    scoring_criteria: z.record(z.string(), z.unknown()).optional(),
    bant_qualification: z.record(z.string(), z.unknown()).optional(),
    cta_settings: z.record(z.string(), z.unknown()).optional(),
    escalation_triggers: z.record(z.string(), z.unknown()).optional(),
    agent_behavior: z.record(z.string(), z.unknown()).optional(),
    system_prompt_template: z.string().optional(),
    english_addon_template: z.string().optional(),
    greeting_messages: z.record(z.string(), z.string()).optional(),
    hitl_auto_release_hours: z.number().min(1).max(168).optional(),
    sales_reps: z.array(z.record(z.string(), z.unknown())).optional(),
    hubspot_integration: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

// =============================================================================
// Activation Validation
// =============================================================================

export const activationValidationResultSchema = z.object({
  valid: z.boolean(),
  can_activate: z.boolean().default(false),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
});

/**
 * Validate organization config meets minimum requirements for activation.
 *
 * Minimum requirements:
 * - company_name: 2-255 chars
 * - company_description: 10+ chars
 * - escalation_email: valid email format
 * - product_info.general: non-empty content
 */
export function validateForActivation(
  config: Record<string, unknown>,
): z.infer<typeof activationValidationResultSchema> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Company name
  const companyName = config.company_name as string | undefined;
  if (!companyName || companyName.length < 2) {
    errors.push("Company name is required (minimum 2 characters)");
  }

  // Company description
  const companyDescription = config.company_description as string | undefined;
  if (!companyDescription || companyDescription.length < 10) {
    errors.push("Company description must be at least 10 characters");
  }

  // Escalation email
  const escalationEmail = config.escalation_email as string | undefined;
  if (!escalationEmail) {
    errors.push("Escalation email is required");
  } else {
    const emailRegex = /^[\w.\-+]+@[\w.\-]+\.\w+$/;
    if (!emailRegex.test(escalationEmail)) {
      errors.push("Invalid escalation email format");
    }
  }

  // Product info
  const productInfo = config.product_info as
    | Record<string, unknown>
    | undefined;
  const generalInfo = productInfo?.general as
    | Record<string, unknown>
    | undefined;
  const generalContent = (generalInfo?.content as string) || "";
  if (!generalContent || generalContent.trim().length < 10) {
    errors.push(
      "Basic product information is required (minimum 10 characters)",
    );
  }

  // Warnings (non-blocking)
  const qualificationQuestions = config.qualification_questions as
    | unknown[]
    | undefined;
  if (!qualificationQuestions || qualificationQuestions.length === 0) {
    warnings.push(
      "No qualification questions defined - agent may not qualify leads effectively",
    );
  }

  if (!config.scoring_criteria) {
    warnings.push("No scoring criteria defined - leads will not be scored");
  }

  return {
    valid: errors.length === 0,
    can_activate: errors.length === 0,
    errors,
    warnings,
  };
}

// =============================================================================
// Type Exports
// =============================================================================

export type ProductInfoTopic = z.infer<typeof productInfoTopicSchema>;
export type ProductInfo = z.infer<typeof productInfoSchema>;
export type QualificationQuestion = z.infer<typeof qualificationQuestionSchema>;
export type ScoringCriteriaItem = z.infer<typeof scoringCriteriaItemSchema>;
export type ScoringCriteria = z.infer<typeof scoringCriteriaSchema>;
export type BANTQuestion = z.infer<typeof bantQuestionSchema>;
export type BANTQualification = z.infer<typeof bantQualificationSchema>;
export type CTASettings = z.infer<typeof ctaSettingsSchema>;
export type EscalationTriggers = z.infer<typeof escalationTriggersSchema>;
export type AgentBehavior = z.infer<typeof agentBehaviorSchema>;
export type HubSpotIntegration = z.infer<typeof hubspotIntegrationSchema>;
export type SalesRepAvailability = z.infer<typeof salesRepAvailabilitySchema>;
export type OrganizationConfig = z.infer<typeof organizationConfigSchema>;
export type OrganizationConfigCreate = z.infer<
  typeof organizationConfigCreateSchema
>;
export type OrganizationConfigUpdate = z.infer<
  typeof organizationConfigUpdateSchema
>;
export type ActivationValidationResult = z.infer<
  typeof activationValidationResultSchema
>;
