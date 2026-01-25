import { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
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
import type { SalesConfigFormData } from "@/types";

interface AdvancedTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function AdvancedTab({ form }: AdvancedTabProps) {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Warning:</strong> These settings are for advanced users.
            Incorrect configuration may affect agent behavior. Leave empty to
            use system defaults.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Prompt Template</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="system_prompt_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`You are {agent_name}, a sales assistant for {company_name}.

Your goal is to:
1. Understand the prospect's needs
2. Qualify them based on our criteria
3. Schedule discovery calls with qualified leads

Company information:
{company_description}

Available product topics:
{product_info}

Qualification criteria:
- Hot: {hot_criteria}
- Warm: {warm_criteria}
- Cold: {cold_criteria}`}
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Available variables: {"{agent_name}"}, {"{company_name}"},
                    {"{company_description}"}, {"{product_info}"},
                    {"{hot_criteria}"}, {"{warm_criteria}"}, {"{cold_criteria}"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>English Language Addon</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="english_addon_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>English Mode Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`When the user switches to English:
- Respond only in English
- Use professional business language
- Maintain the same qualification flow`}
                      className="min-h-[150px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional instructions when the agent switches to English
                    mode
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
