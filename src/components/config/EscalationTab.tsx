import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Shield,
  Crown,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";

interface EscalationTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function EscalationTab({ form }: EscalationTabProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const vipKeywords = form.watch("escalation_triggers.vip_keywords") || [];

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    form.setValue("escalation_triggers.vip_keywords", [
      ...vipKeywords,
      newKeyword.trim(),
    ]);
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    form.setValue(
      "escalation_triggers.vip_keywords",
      vipKeywords.filter((k) => k !== keyword),
    );
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Agent Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Agent Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="agent_behavior.disclose_bot_identity"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Disclose Bot Identity
                    </FormLabel>
                    <FormDescription>
                      Don't pretend to be human - clearly state this is a bot
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

            <FormField
              control={form.control}
              name="agent_behavior.bot_disclosure_message_ru"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Disclosure Message (Russian)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agent_behavior.bot_disclosure_message_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Disclosure Message (English)</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Standard Escalation Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Escalation Triggers
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Conditions that trigger human takeover
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="escalation_triggers.manual_intervention"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">
                        Manual Intervention
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Human types in chat
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

              <FormField
                control={form.control}
                name="escalation_triggers.explicit_request"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">
                        Explicit Request
                      </FormLabel>
                      <FormDescription className="text-xs">
                        User asks for human
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

              <FormField
                control={form.control}
                name="escalation_triggers.agent_error"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Agent Error</FormLabel>
                      <FormDescription className="text-xs">
                        Bot encounters error
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

              <FormField
                control={form.control}
                name="escalation_triggers.irrelevant_questions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">
                        Irrelevant Questions
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Off-topic or test questions
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

              <FormField
                control={form.control}
                name="escalation_triggers.violence_threats"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">
                        Violence / Threats
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Harmful content detected
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

              <FormField
                control={form.control}
                name="escalation_triggers.competitor_mentions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">
                        Competitor Mentions
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Price comparisons, competitors
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
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* VIP Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              VIP / Large Deal Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="escalation_triggers.vip_detection"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable VIP Detection
                    </FormLabel>
                    <FormDescription>
                      Escalate large deals and enterprise clients
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

            <div>
              <FormLabel>VIP Keywords</FormLabel>
              <FormDescription className="mb-2">
                Keywords that indicate a VIP or large deal
              </FormDescription>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Add keyword (e.g., enterprise, million)"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addKeyword())
                  }
                />
                <Button type="button" onClick={addKeyword} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {vipKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword}
                    <Trash2 className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="escalation_triggers.vip_volume_threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Threshold</FormLabel>
                  <FormControl>
                    <Input placeholder=">1000 users, >$10000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Volume or value that triggers VIP escalation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Auto-Release Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Auto-Release Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Escalated conversations will automatically return to agent control
              after this duration
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hitl_auto_release_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-Release Duration (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={168}
                      placeholder="24"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Set to 0 to disable auto-release. Maximum 168 hours (1
                    week).
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
