import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import {
  useSalesConfigStore,
  getDefaultConfig,
} from "@/stores/salesConfigStore";
import { BasicInfoTab } from "@/components/config/BasicInfoTab";
import { ProductKnowledgeTab } from "@/components/config/ProductKnowledgeTab";
import { QualificationTab } from "@/components/config/QualificationTab";
import { LanguageCallsTab } from "@/components/config/LanguageCallsTab";
import { AdvancedTab } from "@/components/config/AdvancedTab";
import { SalesTeamTab } from "@/components/config/SalesTeamTab";
import { CTATab } from "@/components/config/CTATab";
import { EscalationTab } from "@/components/config/EscalationTab";
import { IntegrationsTab } from "@/components/config/IntegrationsTab";
import { GreetingTab } from "@/components/config/GreetingTab";
import type { SalesConfigFormData } from "@/types";

const configSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_description: z.string().optional(),
  agent_name: z.string().min(1, "Agent name is required"),
  escalation_email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  escalation_phone: z.string().optional(),
  primary_language: z.enum(["ru", "en"]),
  supported_languages: z.array(z.string()).min(1),
  call_duration_minutes: z.number().min(5).max(120),
  call_type_name: z.string().min(1),
  product_info: z.record(
    z.object({
      title: z.string(),
      title_en: z.string().optional(),
      content: z.string(),
    }),
  ),
  qualification_questions: z.array(
    z.object({
      id: z.string(),
      question_ru: z.string(),
      question_en: z.string().optional(),
    }),
  ),
  scoring_criteria: z.object({
    hot: z.object({
      criteria_ru: z.string(),
      criteria_en: z.string().optional(),
    }),
    warm: z.object({
      criteria_ru: z.string(),
      criteria_en: z.string().optional(),
    }),
    cold: z.object({
      criteria_ru: z.string(),
      criteria_en: z.string().optional(),
    }),
  }),
  system_prompt_template: z.string().optional(),
  english_addon_template: z.string().optional(),
  // Sales team configuration (DB returns null for missing fields)
  sales_reps: z
    .array(
      z
        .object({
          id: z.string().nullable().optional().default(""),
          name: z.string().nullable().optional().default(""),
          email: z.string().nullable().optional().default(""),
          timezone_regions: z
            .array(z.string())
            .nullable()
            .optional()
            .default([]),
          working_hours: z
            .object({
              start: z.string().nullable().optional().default("09:00"),
              end: z.string().nullable().optional().default("18:00"),
            })
            .nullable()
            .optional(),
          calendar_id: z.string().nullable().optional(),
        })
        .passthrough(),
    )
    .nullable()
    .optional()
    .default([]),
  // HubSpot integration (DB returns null for unset fields)
  hubspot_integration: z
    .object({
      enabled: z.boolean().nullable().optional().default(false),
      api_key: z.string().nullable().optional().default(""),
      sync_as_unqualified: z.boolean().nullable().optional().default(true),
      pipeline_id: z.string().nullable().optional().default(""),
      stage_id: z.string().nullable().optional().default(""),
    })
    .passthrough()
    .nullable()
    .optional()
    .default({ enabled: false, sync_as_unqualified: true }),
  // CTA settings
  cta_settings: z
    .object({
      message_ru: z.string(),
      message_en: z.string().optional(),
      max_iterations_before_cta: z.number().min(1).max(20),
      offer_call_types: z.array(
        z.enum(["phone", "google_meet", "zoom", "whatsapp"]),
      ),
      follow_up_hours: z.number().min(1).max(72),
    })
    .optional(),
  // BANT qualification
  bant_qualification: z
    .object({
      need: z.object({
        question_ru: z.string(),
        question_en: z.string().optional(),
        required: z.boolean(),
      }),
      timeline: z.object({
        question_ru: z.string(),
        question_en: z.string().optional(),
        required: z.boolean(),
      }),
      budget: z.object({
        question_ru: z.string(),
        question_en: z.string().optional(),
        required: z.boolean(),
      }),
      authority: z.object({
        question_ru: z.string(),
        question_en: z.string().optional(),
        required: z.boolean(),
      }),
      question_order: z.array(
        z.enum(["need", "timeline", "budget", "authority"]),
      ),
    })
    .optional(),
  // Escalation triggers
  escalation_triggers: z
    .object({
      manual_intervention: z.boolean(),
      explicit_request: z.boolean(),
      agent_error: z.boolean(),
      irrelevant_questions: z.boolean(),
      violence_threats: z.boolean(),
      competitor_mentions: z.boolean(),
      vip_detection: z.boolean(),
      vip_keywords: z.array(z.string()),
      vip_volume_threshold: z.string().optional(),
    })
    .optional(),
  // Agent behavior
  agent_behavior: z
    .object({
      disclose_bot_identity: z.boolean(),
      bot_disclosure_message_ru: z.string(),
      bot_disclosure_message_en: z.string().optional(),
    })
    .optional(),
  // Greeting messages
  greeting_messages: z.record(z.string()).optional(),
  // HITL settings
  hitl_auto_release_hours: z.number().min(1).max(168).optional(),
});

function formatValidationErrors(
  errors: FieldErrors<SalesConfigFormData>,
): string[] {
  const messages: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (
      value &&
      typeof value === "object" &&
      "message" in value &&
      value.message
    ) {
      messages.push(`${key}: ${value.message}`);
    } else if (value && typeof value === "object") {
      // Nested object errors
      messages.push(`${key}: invalid value`);
    }
  }
  return messages;
}

export function AgentConfigPage() {
  const { organization, user } = useAuthStore();
  const { config, isLoading, isSaving, fetchConfig, saveConfig, error } =
    useSalesConfigStore();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<SalesConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: getDefaultConfig(
      organization?.name || "",
      user?.email || "",
    ),
  });

  useEffect(() => {
    if (organization?.id) {
      fetchConfig(organization.id);
    }
  }, [organization?.id, fetchConfig]);

  useEffect(() => {
    if (config) {
      form.reset({
        company_name: config.company_name,
        company_description: config.company_description || "",
        agent_name: config.agent_name,
        escalation_email: config.escalation_email || "",
        escalation_phone: config.escalation_phone || "",
        primary_language: config.primary_language,
        supported_languages: config.supported_languages,
        call_duration_minutes: config.call_duration_minutes,
        call_type_name: config.call_type_name,
        product_info: config.product_info,
        qualification_questions: config.qualification_questions,
        scoring_criteria: config.scoring_criteria,
        system_prompt_template: config.system_prompt_template || "",
        english_addon_template: config.english_addon_template || "",
        // New fields
        sales_reps: config.sales_reps || [],
        hubspot_integration: config.hubspot_integration || {
          enabled: false,
          sync_as_unqualified: true,
        },
        cta_settings: config.cta_settings || {
          message_ru: "",
          max_iterations_before_cta: 5,
          offer_call_types: ["phone", "google_meet"],
          follow_up_hours: 24,
        },
        bant_qualification: config.bant_qualification || {
          need: { question_ru: "", required: true },
          timeline: { question_ru: "", required: true },
          budget: { question_ru: "", required: false },
          authority: { question_ru: "", required: false },
          question_order: ["need", "timeline", "budget", "authority"],
        },
        escalation_triggers: config.escalation_triggers || {
          manual_intervention: true,
          explicit_request: true,
          agent_error: true,
          irrelevant_questions: true,
          violence_threats: true,
          competitor_mentions: true,
          vip_detection: true,
          vip_keywords: [],
        },
        agent_behavior: config.agent_behavior || {
          disclose_bot_identity: true,
          bot_disclosure_message_ru: "",
        },
        greeting_messages: config.greeting_messages || { ru: "", en: "" },
        hitl_auto_release_hours: config.hitl_auto_release_hours ?? 24,
      });
    }
  }, [config, form]);

  const onSubmit = async (data: SalesConfigFormData) => {
    if (!organization?.id) return;
    setValidationErrors([]);

    try {
      await saveConfig(organization.id, data);
      toast.success("Configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    }
  };

  const onValidationError = (errors: FieldErrors<SalesConfigFormData>) => {
    const messages = formatValidationErrors(errors);
    setValidationErrors(messages);
    toast.error(`Validation errors: ${messages.join(", ")}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Agent Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure your sales agent's behavior and knowledge
          </p>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit, onValidationError)}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {(error || validationErrors.length > 0) && (
        <Card className="border-destructive">
          <CardContent className="pt-6 space-y-1">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {validationErrors.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Validation errors:
                  </p>
                  <ul className="text-sm text-destructive list-disc list-inside">
                    {validationErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="product">Product Knowledge</TabsTrigger>
              <TabsTrigger value="qualification">Qualification</TabsTrigger>
              <TabsTrigger value="language">Language & Calls</TabsTrigger>
              <TabsTrigger value="team">Sales Team</TabsTrigger>
              <TabsTrigger value="cta">CTA & BANT</TabsTrigger>
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="greeting">Greeting</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicInfoTab form={form} />
            </TabsContent>

            <TabsContent value="product">
              <ProductKnowledgeTab form={form} />
            </TabsContent>

            <TabsContent value="qualification">
              <QualificationTab form={form} />
            </TabsContent>

            <TabsContent value="language">
              <LanguageCallsTab form={form} />
            </TabsContent>

            <TabsContent value="team">
              <SalesTeamTab form={form} />
            </TabsContent>

            <TabsContent value="cta">
              <CTATab form={form} />
            </TabsContent>

            <TabsContent value="escalation">
              <EscalationTab form={form} />
            </TabsContent>

            <TabsContent value="integrations">
              <IntegrationsTab form={form} />
            </TabsContent>

            <TabsContent value="greeting">
              <GreetingTab form={form} />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedTab form={form} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
