import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
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
import type { SalesConfigFormData } from "@/types";

interface ProductKnowledgeTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function ProductKnowledgeTab({ form }: ProductKnowledgeTabProps) {
  const productInfo = form.watch("product_info");
  const [newTopicKey, setNewTopicKey] = useState("");

  const topics = Object.entries(productInfo || {});

  const addTopic = () => {
    if (!newTopicKey.trim()) return;

    const key = newTopicKey.toLowerCase().replace(/\s+/g, "_");
    form.setValue(`product_info.${key}`, {
      title: newTopicKey,
      title_en: newTopicKey,
      content: "",
    });
    setNewTopicKey("");
  };

  const removeTopic = (key: string) => {
    const current = form.getValues("product_info");
    const { [key]: _, ...rest } = current;
    form.setValue("product_info", rest);
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Product Information</h3>
          <p className="text-sm text-muted-foreground">
            Add knowledge topics that your agent can discuss with leads
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="New topic name (e.g., Pricing, Features)"
            value={newTopicKey}
            onChange={(e) => setNewTopicKey(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTopic())
            }
          />
          <Button type="button" onClick={addTopic} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Topic
          </Button>
        </div>

        <div className="space-y-4">
          {topics.map(([key, topic]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{topic.title}</CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTopic(key)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`product_info.${key}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (Primary Language)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`product_info.${key}.title_en`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (English)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`product_info.${key}.content`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detailed information about this topic..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This information will be used by the agent to answer
                        questions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No product topics yet. Add topics to give your agent knowledge
              about your product.
            </p>
          </div>
        )}
      </div>
    </Form>
  );
}
