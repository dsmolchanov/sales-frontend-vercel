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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SalesConfigFormData } from "@/types";

interface GreetingTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function GreetingTab({ form }: GreetingTabProps) {
  return (
    <Form {...form}>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Proactive Greeting Messages</CardTitle>
            <CardDescription>
              Configure greeting messages that are automatically sent to new
              leads. The appropriate language is selected based on the
              customer's phone number country code. Leave empty to disable
              greeting for that language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ru" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="ru">Russian</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
              </TabsList>

              <TabsContent value="ru" className="space-y-4">
                <FormField
                  control={form.control}
                  name="greeting_messages.ru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Russian Greeting</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Привет! Меня зовут [имя агента]. Чем могу помочь?"
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Sent to leads from Russia, Belarus, Kazakhstan, Ukraine,
                        etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <FormField
                  control={form.control}
                  name="greeting_messages.en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Greeting</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hi! I'm [agent name]. How can I help you today?"
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Sent to leads from USA, UK, Canada, Australia, and other
                        countries.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language Detection Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Initial language</strong> is determined by the customer's
              phone number country code:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>+7 (Russia), +375 (Belarus), +7 (Kazakhstan) → Russian</li>
              <li>+1 (USA/Canada), +44 (UK), +61 (Australia) → English</li>
              <li>Other countries → English (default)</li>
            </ul>
            <p className="mt-4">
              <strong>Language switching:</strong> If the customer replies in a
              different language, the agent will automatically switch to match
              their preference.
            </p>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
