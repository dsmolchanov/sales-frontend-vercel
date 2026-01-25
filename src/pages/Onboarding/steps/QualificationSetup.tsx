import { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useOnboardingStore,
  type QualificationQuestion,
  type QualificationSetupData,
} from "@/stores/onboardingStore";
import { useSalesConfigStore } from "@/stores/salesConfigStore";
import { useAuthStore } from "@/stores/authStore";

const DEFAULT_QUESTIONS: QualificationQuestion[] = [
  {
    id: "use_case",
    question_ru: "What problem are you looking to solve?",
    question_en: "What problem are you looking to solve?",
  },
  {
    id: "timeline",
    question_ru: "When are you looking to implement a solution?",
    question_en: "When are you looking to implement a solution?",
  },
  {
    id: "company",
    question_ru: "What is your company name and your role?",
    question_en: "What is your company name and your role?",
  },
];

const DEFAULT_SCORING = {
  hot: {
    criteria_ru: "Clear need + timeline within 1-3 months",
    criteria_en: "Clear need + timeline within 1-3 months",
  },
  warm: {
    criteria_ru: "Interested but no clear timeline",
    criteria_en: "Interested but no clear timeline",
  },
  cold: {
    criteria_ru: "Just exploring, no immediate need",
    criteria_en: "Just exploring, no immediate need",
  },
};

export function QualificationSetupStep() {
  const { selectedOrgId } = useAuthStore();
  const { config, saveConfig } = useSalesConfigStore();
  const { stepData, updateStepData, completeStep, setCurrentStep, isSaving } =
    useOnboardingStore();

  const [questions, setQuestions] =
    useState<QualificationQuestion[]>(DEFAULT_QUESTIONS);
  const [scoring, setScoringState] = useState(DEFAULT_SCORING);

  // Initialize from existing data
  useEffect(() => {
    const savedData = stepData.qualification_setup;
    if (savedData) {
      if (savedData.qualification_questions?.length > 0) {
        setQuestions(savedData.qualification_questions);
      }
      if (savedData.scoring_criteria) {
        setScoringState(savedData.scoring_criteria);
      }
    } else if (config) {
      if (config.qualification_questions?.length > 0) {
        setQuestions(config.qualification_questions);
      }
      if (config.scoring_criteria) {
        setScoringState(config.scoring_criteria);
      }
    }
  }, [config, stepData.qualification_setup]);

  const handleQuestionChange = (
    id: string,
    field: "question_ru" | "question_en",
    value: string,
  ) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );

    // Auto-save
    const updatedQuestions = questions.map((q) =>
      q.id === id ? { ...q, [field]: value } : q,
    );
    updateStepData("qualification_setup", {
      qualification_questions: updatedQuestions,
      scoring_criteria: scoring,
    });
  };

  const addQuestion = () => {
    const newId = `q_${Date.now()}`;
    const newQuestion: QualificationQuestion = {
      id: newId,
      question_ru: "",
      question_en: "",
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleScoringChange = (
    level: "hot" | "warm" | "cold",
    field: "criteria_ru" | "criteria_en",
    value: string,
  ) => {
    setScoringState((prev) => ({
      ...prev,
      [level]: { ...prev[level], [field]: value },
    }));

    // Auto-save
    const updatedScoring = {
      ...scoring,
      [level]: { ...scoring[level], [field]: value },
    };
    updateStepData("qualification_setup", {
      qualification_questions: questions,
      scoring_criteria: updatedScoring,
    });
  };

  const handleContinue = async () => {
    // Save to config
    if (selectedOrgId) {
      await saveConfig(selectedOrgId, {
        qualification_questions: questions,
        scoring_criteria: scoring,
      });
    }

    // Complete step
    const data: QualificationSetupData = {
      qualification_questions: questions,
      scoring_criteria: scoring,
    };
    await completeStep("qualification_setup", data);
  };

  const handleBack = () => {
    setCurrentStep("product_knowledge");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          <ClipboardList className="inline h-6 w-6 mr-2" />
          Lead Qualification
        </h2>
        <p className="text-muted-foreground mt-1">
          Define what questions your agent should ask and how to score leads
          based on their answers.
        </p>
      </div>

      {/* Qualification Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qualification Questions</CardTitle>
          <CardDescription>
            Questions your agent will ask to qualify leads. The agent will
            naturally weave these into the conversation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((question, idx) => (
            <div
              key={question.id}
              className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
            >
              <div className="flex-shrink-0 pt-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-grow space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {idx + 1}
                  </span>
                </div>
                <Input
                  value={question.question_en || question.question_ru}
                  onChange={(e) =>
                    handleQuestionChange(
                      question.id,
                      "question_en",
                      e.target.value,
                    )
                  }
                  placeholder="Enter your qualification question..."
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(question.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Scoring Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead Scoring Criteria</CardTitle>
          <CardDescription>
            Define what makes a lead hot, warm, or cold. Your agent will use
            these criteria to score leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hot */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Hot Lead
            </Label>
            <Textarea
              value={scoring.hot.criteria_en || scoring.hot.criteria_ru}
              onChange={(e) =>
                handleScoringChange("hot", "criteria_en", e.target.value)
              }
              placeholder="e.g., Clear need + budget + timeline within 1-3 months"
              rows={2}
            />
          </div>

          {/* Warm */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              Warm Lead
            </Label>
            <Textarea
              value={scoring.warm.criteria_en || scoring.warm.criteria_ru}
              onChange={(e) =>
                handleScoringChange("warm", "criteria_en", e.target.value)
              }
              placeholder="e.g., Interested but no clear timeline or budget"
              rows={2}
            />
          </div>

          {/* Cold */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Cold Lead
            </Label>
            <Textarea
              value={scoring.cold.criteria_en || scoring.cold.criteria_ru}
              onChange={(e) =>
                handleScoringChange("cold", "criteria_en", e.target.value)
              }
              placeholder="e.g., Just exploring, no immediate need"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="pt-4 border-t flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={isSaving}>
          Continue to WhatsApp Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
