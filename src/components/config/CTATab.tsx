import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import type { SalesConfigFormData } from "@/types";

interface CTATabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

const CALL_TYPES = [
  { value: "phone", label: "Phone Call" },
  { value: "google_meet", label: "Google Meet" },
  { value: "zoom", label: "Zoom" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

const BANT_FIELDS = ["need", "timeline", "budget", "authority"] as const;

export function CTATab({ form }: CTATabProps) {
  const callTypes = form.watch("cta_settings.offer_call_types") || [];
  const bantOrder = form.watch("bant_qualification.question_order") || [];

  const toggleCallType = (type: (typeof CALL_TYPES)[number]["value"]) => {
    const current = form.getValues("cta_settings.offer_call_types") || [];
    if (current.includes(type)) {
      form.setValue(
        "cta_settings.offer_call_types",
        current.filter((t) => t !== type),
      );
    } else {
      form.setValue("cta_settings.offer_call_types", [...current, type]);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* CTA Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Call-to-Action Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="cta_settings.message_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA Message (Russian)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Давайте я назначу звонок..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Message to propose scheduling a call
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cta_settings.message_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA Message (English)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Let me schedule a call..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="cta_settings.max_iterations_before_cta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Exchanges Before CTA</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      After this many message exchanges, offer to schedule
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cta_settings.follow_up_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Within (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={72}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      "Colleague will contact within X hours"
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Offered Call Types</FormLabel>
              <FormDescription className="mb-2">
                Which call options to offer the lead
              </FormDescription>
              <div className="flex flex-wrap gap-2">
                {CALL_TYPES.map((type) => (
                  <Badge
                    key={type.value}
                    variant={
                      callTypes.includes(type.value) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleCallType(type.value)}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Direct Purchase CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Direct Purchase CTA</CardTitle>
            <p className="text-sm text-muted-foreground">
              Alternative CTA when lead declines to speak with a manager
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="cta_settings.purchase_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://emcd.io" {...field} />
                  </FormControl>
                  <FormDescription>
                    Direct link where leads can purchase equipment without
                    manager contact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cta_settings.purchase_cta_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase CTA Message (Russian)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Без проблем! Вы можете приобрести оборудование напрямую по ссылке..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Message when lead doesn't want to talk to manager. Leave
                    empty for default.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cta_settings.purchase_cta_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase CTA Message (English)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="No problem! You can purchase equipment directly at..."
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

        <Separator />

        {/* BANT Qualification */}
        <Card>
          <CardHeader>
            <CardTitle>BANT Qualification Model</CardTitle>
            <p className="text-sm text-muted-foreground">
              Questions to qualify leads. Order: Need → Timeline → Budget →
              Authority
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {BANT_FIELDS.map((fieldName) => (
              <div key={fieldName} className="space-y-4 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">{fieldName}</h4>
                  <FormField
                    control={form.control}
                    name={`bant_qualification.${fieldName}.required`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm">Required</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`bant_qualification.${fieldName}.question_ru`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question (Russian)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`bant_qualification.${fieldName}.question_en`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question (English)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Form>
  );
}
