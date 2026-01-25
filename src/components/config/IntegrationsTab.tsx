import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import type { SalesConfigFormData } from "@/types";

interface IntegrationsTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function IntegrationsTab({ form }: IntegrationsTabProps) {
  const hubspotEnabled = form.watch("hubspot_integration.enabled");

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* HubSpot Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-orange-600"
                  >
                    <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-2.212-2.209 2.21 2.21 0 00-2.212 2.21c0 .903.543 1.68 1.318 2.024v2.81a5.568 5.568 0 00-2.39 1.162l-6.426-5a2.466 2.466 0 00.096-.676A2.476 2.476 0 005.13.947 2.476 2.476 0 002.655 3.42a2.476 2.476 0 002.475 2.473c.544 0 1.048-.18 1.456-.48l6.374 4.96a5.585 5.585 0 00-.86 2.97 5.585 5.585 0 00.86 2.971l-2.222 1.73a2.468 2.468 0 00-1.608-.593 2.476 2.476 0 00-2.476 2.474A2.476 2.476 0 009.13 22.4a2.476 2.476 0 002.474-2.476c0-.363-.08-.707-.22-1.017l2.19-1.703a5.594 5.594 0 004.646 2.467 5.594 5.594 0 005.593-5.593 5.594 5.594 0 00-5.649-5.148zm-.945 8.523a3.38 3.38 0 01-3.376-3.376 3.38 3.38 0 013.376-3.377 3.38 3.38 0 013.377 3.377 3.38 3.38 0 01-3.377 3.376z" />
                  </svg>
                </div>
                <div>
                  <CardTitle>HubSpot</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Sync leads to your HubSpot CRM
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name="hubspot_integration.enabled"
                render={({ field }) => (
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                )}
              />
            </div>
          </CardHeader>
          {hubspotEnabled && (
            <CardContent className="space-y-6 pt-0">
              <FormField
                control={form.control}
                name="hubspot_integration.api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your HubSpot Private App access token
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hubspot_integration.sync_as_unqualified"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Sync as Unqualified
                      </FormLabel>
                      <FormDescription>
                        Sync leads before qualification (like inbound marketing
                        leads)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="hubspot_integration.pipeline_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="default" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for default pipeline
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hubspot_integration.stage_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="qualifiedtobuy" {...field} />
                      </FormControl>
                      <FormDescription>Stage to place leads in</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Future integrations placeholder */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                More integrations coming soon
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Badge variant="outline">Salesforce</Badge>
                <Badge variant="outline">Pipedrive</Badge>
                <Badge variant="outline">Slack</Badge>
                <Badge variant="outline">Zapier</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
