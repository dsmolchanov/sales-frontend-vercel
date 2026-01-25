import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateId } from "@/lib/utils";
import type { SalesConfigFormData } from "@/types";

interface QualificationTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function QualificationTab({ form }: QualificationTabProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "qualification_questions",
  });

  const addQuestion = () => {
    append({
      id: generateId(),
      question_ru: "",
      question_en: "",
    });
  };

  return (
    <Form {...form}>
      <div className="space-y-8">
        {/* Qualification Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Qualification Questions</h3>
              <p className="text-sm text-muted-foreground">
                Questions the agent asks to qualify leads
              </p>
            </div>
            <Button type="button" onClick={addQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name={`qualification_questions.${index}.question_ru`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question (Primary)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., What functionality do you need?"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`qualification_questions.${index}.question_en`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question (English)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="English version of the question"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {fields.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No qualification questions yet. Add questions to help qualify
                leads.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Scoring Criteria */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Scoring Criteria</h3>
            <p className="text-sm text-muted-foreground">
              Define criteria for categorizing leads as hot, warm, or cold
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  Hot Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="scoring_criteria.hot.criteria_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria (Primary)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Clear use case + 1-3 month timeline"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scoring_criteria.hot.criteria_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria (English)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="English version"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  Warm Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="scoring_criteria.warm.criteria_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria (Primary)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Interesting use case but unclear timeline"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scoring_criteria.warm.criteria_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria (English)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="English version"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  Cold Leads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="scoring_criteria.cold.criteria_ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria (Primary)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Just exploring, distant timeline"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scoring_criteria.cold.criteria_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criteria (English)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="English version"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Form>
  );
}
