import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useOnboardingStore,
  type ProductKnowledgeData,
} from "@/stores/onboardingStore";
import { useSalesConfigStore } from "@/stores/salesConfigStore";
import { useAuthStore } from "@/stores/authStore";

interface ProductTopic {
  key: string;
  title: string;
  title_en?: string;
  content: string;
}

const DEFAULT_TOPICS = [
  { key: "general", title: "About Us", required: true },
  { key: "features", title: "Key Features", required: false },
  { key: "pricing", title: "Pricing", required: false },
];

export function ProductKnowledgeStep() {
  const { selectedOrgId } = useAuthStore();
  const { config, saveConfig } = useSalesConfigStore();
  const { stepData, updateStepData, completeStep, setCurrentStep, isSaving } =
    useOnboardingStore();

  const [topics, setTopics] = useState<ProductTopic[]>([
    { key: "general", title: "About Us", content: "" },
    { key: "features", title: "Key Features", content: "" },
    { key: "pricing", title: "Pricing", content: "" },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize from existing data
  useEffect(() => {
    const savedData = stepData.product_knowledge;
    if (savedData) {
      const loadedTopics = Object.entries(savedData)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => ({
          key,
          title: value?.title || key,
          title_en: value?.title_en,
          content: value?.content || "",
        }));
      if (loadedTopics.length > 0) {
        setTopics(loadedTopics);
      }
    } else if (config?.product_info) {
      const loadedTopics = Object.entries(config.product_info).map(
        ([key, value]) => ({
          key,
          title: value.title || key,
          title_en: value.title_en,
          content: value.content || "",
        }),
      );
      if (loadedTopics.length > 0) {
        setTopics(loadedTopics);
      }
    }
  }, [config, stepData.product_knowledge]);

  const handleTopicChange = (
    key: string,
    field: "title" | "content",
    value: string,
  ) => {
    setTopics((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t)),
    );

    // Clear error
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }

    // Build product knowledge data and auto-save
    const updatedTopics = topics.map((t) =>
      t.key === key ? { ...t, [field]: value } : t,
    );
    const productData: ProductKnowledgeData = {
      general: { title: "", content: "" },
    };
    updatedTopics.forEach((t) => {
      productData[t.key] = { title: t.title, content: t.content };
    });
    updateStepData("product_knowledge", productData);
  };

  const addTopic = () => {
    const newKey = `topic_${Date.now()}`;
    setTopics((prev) => [
      ...prev,
      { key: newKey, title: "New Topic", content: "" },
    ]);
  };

  const removeTopic = (key: string) => {
    // Don't allow removing the general topic
    if (key === "general") return;
    setTopics((prev) => prev.filter((t) => t.key !== key));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // General topic is required with content
    const generalTopic = topics.find((t) => t.key === "general");
    if (
      !generalTopic ||
      !generalTopic.content ||
      generalTopic.content.length < 10
    ) {
      newErrors.general =
        "Basic product information is required (minimum 10 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    // Build product_info object
    const productInfo: Record<
      string,
      { title: string; title_en?: string; content: string }
    > = {};
    topics.forEach((t) => {
      productInfo[t.key] = {
        title: t.title,
        title_en: t.title_en,
        content: t.content,
      };
    });

    // Save to config
    if (selectedOrgId) {
      await saveConfig(selectedOrgId, {
        product_info: productInfo,
      });
    }

    // Complete step
    const productData: ProductKnowledgeData = { general: productInfo.general };
    Object.entries(productInfo).forEach(([key, value]) => {
      productData[key] = value;
    });
    await completeStep("product_knowledge", productData);
  };

  const handleBack = () => {
    setCurrentStep("company_basics");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          <Package className="inline h-6 w-6 mr-2" />
          Product Knowledge
        </h2>
        <p className="text-muted-foreground mt-1">
          Teach your sales agent about your products and services. The more
          information you provide, the better it can answer customer questions.
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={["general"]}
        className="space-y-4"
      >
        {topics.map((topic, idx) => (
          <AccordionItem
            key={topic.key}
            value={topic.key}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-medium">{topic.title}</span>
                {topic.key === "general" && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
                {errors[topic.key] && (
                  <span className="text-xs text-destructive">
                    {errors[topic.key]}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              {/* Topic Title */}
              <div className="space-y-2">
                <Label>Topic Title</Label>
                <Input
                  value={topic.title}
                  onChange={(e) =>
                    handleTopicChange(topic.key, "title", e.target.value)
                  }
                  placeholder="Enter topic title"
                />
              </div>

              {/* Topic Content */}
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={topic.content}
                  onChange={(e) =>
                    handleTopicChange(topic.key, "content", e.target.value)
                  }
                  placeholder={
                    topic.key === "general"
                      ? "Describe what your company does, your main products/services, and your value proposition..."
                      : topic.key === "features"
                        ? "List your key features and capabilities..."
                        : topic.key === "pricing"
                          ? "Describe your pricing model, tiers, or how to get pricing information..."
                          : "Add information about this topic..."
                  }
                  rows={6}
                  className={errors[topic.key] ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {topic.content.length} characters
                </p>
              </div>

              {/* AI Draft Button (placeholder for future) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Draft (Coming Soon)
              </Button>

              {/* Remove Topic (not for general) */}
              {topic.key !== "general" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTopic(topic.key)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Topic
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Add Topic Button */}
      <Button type="button" variant="outline" onClick={addTopic}>
        <Plus className="h-4 w-4 mr-2" />
        Add Topic
      </Button>

      {/* Navigation */}
      <div className="pt-4 border-t flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={isSaving}>
          Continue to Qualification Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
