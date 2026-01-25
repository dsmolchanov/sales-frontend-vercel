import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Plus, Trash2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { generateId } from "@/lib/utils";
import type { SalesConfigFormData, TimezoneRegion } from "@/types";

interface SalesTeamTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

const TIMEZONE_REGIONS: {
  value: TimezoneRegion;
  label: string;
  flag: string;
}[] = [
  { value: "RU", label: "Russia", flag: "🇷🇺" },
  { value: "US_CANADA", label: "US / Canada", flag: "🇺🇸" },
  { value: "AUSTRALIA_NZ", label: "Australia / NZ", flag: "🇦🇺" },
  { value: "EU", label: "Europe", flag: "🇪🇺" },
  { value: "ASIA", label: "Asia", flag: "🌏" },
];

export function SalesTeamTab({ form }: SalesTeamTabProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sales_reps",
  });

  const addRep = () => {
    append({
      id: generateId(),
      name: "",
      email: "",
      timezone_regions: [],
      working_hours: { start: "09:00", end: "18:00" },
    });
  };

  const toggleRegion = (index: number, region: TimezoneRegion) => {
    const currentRegions =
      form.getValues(`sales_reps.${index}.timezone_regions`) || [];
    if (currentRegions.includes(region)) {
      form.setValue(
        `sales_reps.${index}.timezone_regions`,
        currentRegions.filter((r) => r !== region),
      );
    } else {
      form.setValue(`sales_reps.${index}.timezone_regions`, [
        ...currentRegions,
        region,
      ]);
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Sales Team</h3>
            <p className="text-sm text-muted-foreground">
              Configure sales reps and their timezone coverage. The agent will
              match leads to reps based on timezone.
            </p>
          </div>
          <Button type="button" onClick={addRep} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Sales Rep
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            const regions =
              form.watch(`sales_reps.${index}.timezone_regions`) || [];

            return (
              <Card key={field.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Sales Rep #{index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`sales_reps.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sales_reps.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john@company.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`sales_reps.${index}.working_hours.start`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Working Hours Start</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`sales_reps.${index}.working_hours.end`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Working Hours End</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`sales_reps.${index}.calendar_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Calendar ID (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="calendar@group.calendar.google.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          For automatic availability checking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Timezone Regions Covered</FormLabel>
                    <FormDescription className="mb-2">
                      Select which regions this rep can handle
                    </FormDescription>
                    <div className="flex flex-wrap gap-2">
                      {TIMEZONE_REGIONS.map((tz) => (
                        <Badge
                          key={tz.value}
                          variant={
                            regions.includes(tz.value) ? "default" : "outline"
                          }
                          className="cursor-pointer"
                          onClick={() => toggleRegion(index, tz.value)}
                        >
                          {tz.flag} {tz.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No sales reps configured. Add reps to enable timezone-based lead
              routing.
            </p>
          </div>
        )}
      </div>
    </Form>
  );
}
