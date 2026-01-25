import { useEffect, useState } from "react";
import { Building2, Mail, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useOnboardingStore,
  type CompanyBasicsData,
} from "@/stores/onboardingStore";
import { useSalesConfigStore } from "@/stores/salesConfigStore";
import { useAuthStore } from "@/stores/authStore";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
];

export function CompanyBasicsStep() {
  const { selectedOrgId } = useAuthStore();
  const { config, fetchConfig, saveConfig } = useSalesConfigStore();
  const { stepData, updateStepData, completeStep, isSaving } =
    useOnboardingStore();

  // Local form state
  const [formData, setFormData] = useState<CompanyBasicsData>({
    company_name: "",
    company_description: "",
    escalation_email: "",
    primary_language: "en",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CompanyBasicsData, string>>
  >({});

  // Load existing data
  useEffect(() => {
    if (selectedOrgId) {
      fetchConfig(selectedOrgId);
    }
  }, [selectedOrgId, fetchConfig]);

  // Initialize form with existing data
  useEffect(() => {
    const savedData = stepData.company_basics;
    if (savedData) {
      setFormData(savedData);
    } else if (config) {
      setFormData({
        company_name: config.company_name || "",
        company_description: config.company_description || "",
        escalation_email: config.escalation_email || "",
        primary_language: config.primary_language || "en",
      });
    }
  }, [config, stepData.company_basics]);

  const handleChange = (field: keyof CompanyBasicsData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Auto-save to store (debounced)
    updateStepData("company_basics", { ...formData, [field]: value });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyBasicsData, string>> = {};

    if (!formData.company_name || formData.company_name.length < 2) {
      newErrors.company_name = "Company name must be at least 2 characters";
    }

    if (
      !formData.company_description ||
      formData.company_description.length < 10
    ) {
      newErrors.company_description =
        "Description must be at least 10 characters";
    }

    if (!formData.escalation_email) {
      newErrors.escalation_email = "Escalation email is required";
    } else if (!/^[\w.\-+]+@[\w.\-]+\.\w+$/.test(formData.escalation_email)) {
      newErrors.escalation_email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    // Save to organization config
    if (selectedOrgId) {
      await saveConfig(selectedOrgId, {
        company_name: formData.company_name,
        company_description: formData.company_description,
        escalation_email: formData.escalation_email,
        primary_language: formData.primary_language as "en" | "ru",
      });
    }

    // Complete the step
    await completeStep("company_basics", formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Company Basics</h2>
        <p className="text-muted-foreground mt-1">
          Let's start with some basic information about your company. This helps
          your sales agent understand your business.
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="company_name">
            <Building2 className="inline h-4 w-4 mr-1" />
            Company Name
          </Label>
          <Input
            id="company_name"
            placeholder="Acme Inc."
            value={formData.company_name}
            onChange={(e) => handleChange("company_name", e.target.value)}
            className={errors.company_name ? "border-destructive" : ""}
          />
          {errors.company_name && (
            <p className="text-sm text-destructive">{errors.company_name}</p>
          )}
        </div>

        {/* Company Description */}
        <div className="space-y-2">
          <Label htmlFor="company_description">Company Description</Label>
          <Textarea
            id="company_description"
            placeholder="We provide innovative solutions for..."
            value={formData.company_description}
            onChange={(e) =>
              handleChange("company_description", e.target.value)
            }
            rows={4}
            className={errors.company_description ? "border-destructive" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Describe what your company does. This helps the agent answer
            questions about your business.
          </p>
          {errors.company_description && (
            <p className="text-sm text-destructive">
              {errors.company_description}
            </p>
          )}
        </div>

        {/* Escalation Email */}
        <div className="space-y-2">
          <Label htmlFor="escalation_email">
            <Mail className="inline h-4 w-4 mr-1" />
            Escalation Email
          </Label>
          <Input
            id="escalation_email"
            type="email"
            placeholder="sales@company.com"
            value={formData.escalation_email}
            onChange={(e) => handleChange("escalation_email", e.target.value)}
            className={errors.escalation_email ? "border-destructive" : ""}
          />
          <p className="text-xs text-muted-foreground">
            Where to send notifications when a lead needs human attention.
          </p>
          {errors.escalation_email && (
            <p className="text-sm text-destructive">
              {errors.escalation_email}
            </p>
          )}
        </div>

        {/* Primary Language */}
        <div className="space-y-2">
          <Label htmlFor="primary_language">
            <Globe className="inline h-4 w-4 mr-1" />
            Primary Language
          </Label>
          <Select
            value={formData.primary_language}
            onValueChange={(value) => handleChange("primary_language", value)}
          >
            <SelectTrigger id="primary_language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The main language your sales agent will use when responding to
            leads.
          </p>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4 border-t">
        <Button onClick={handleContinue} disabled={isSaving}>
          Continue to Product Knowledge
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
