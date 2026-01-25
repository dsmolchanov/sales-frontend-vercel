import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesConfigFormData } from "@/types";

interface LanguageCallsTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

const LANGUAGES = [
  { value: "ru", label: "Russian" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "zh", label: "Chinese" },
];

export function LanguageCallsTab({ form }: LanguageCallsTabProps) {
  const supportedLanguages = form.watch("supported_languages") || [];

  const toggleLanguage = (lang: string) => {
    const current = form.getValues("supported_languages") || [];
    if (current.includes(lang)) {
      form.setValue(
        "supported_languages",
        current.filter((l) => l !== lang),
      );
    } else {
      form.setValue("supported_languages", [...current, lang]);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-8">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Language Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="primary_language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The main language your agent will use
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel>Supported Languages</FormLabel>
                <FormDescription>
                  Languages the agent can switch to if requested
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.value}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">{lang.label}</span>
                    <Switch
                      checked={supportedLanguages.includes(lang.value)}
                      onCheckedChange={() => toggleLanguage(lang.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Call Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Discovery Call Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="call_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Default duration for discovery calls
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="call_type_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="discovery-call" {...field} />
                    </FormControl>
                    <FormDescription>
                      How the call type appears in calendar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
