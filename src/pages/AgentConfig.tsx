import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
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
  // Sales team configuration
  sales_reps: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email().optional().or(z.literal("")),
        timezone_regions: z.array(
          z.enum(["RU", "US_CANADA", "AUSTRALIA_NZ", "EU", "ASIA"]),
        ),
        working_hours: z
          .object({
            start: z.string(),
            end: z.string(),
          })
          .optional(),
        calendar_id: z.string().optional(),
      }),
    )
    .optional(),
  // HubSpot integration
  hubspot_integration: z
    .object({
      enabled: z.boolean(),
      api_key: z.string().optional(),
      sync_as_unqualified: z.boolean(),
      pipeline_id: z.string().optional(),
      stage_id: z.string().optional(),
    })
    .optional(),
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
});

export function AgentConfigPage() {
  const { organization, user } = useAuthStore();
  const { config, isLoading, isSaving, fetchConfig, saveConfig, error } =
    useSalesConfigStore();

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
      });
    }
  }, [config, form]);

  const onSubmit = async (data: SalesConfigFormData) => {
    if (!organization?.id) return;

    try {
      await saveConfig(organization.id, data);
    } catch {
      // Error handled in store
    }
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
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
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
