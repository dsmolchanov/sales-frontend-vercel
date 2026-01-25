import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
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
import type { SalesConfigFormData } from "@/types";

interface BasicInfoTabProps {
  form: UseFormReturn<SalesConfigFormData>;
}

export function BasicInfoTab({ form }: BasicInfoTabProps) {
  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="EMCD Hashport" {...field} />
                </FormControl>
                <FormDescription>
                  Your company name as the agent will introduce it
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agent_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Sales Assistant" {...field} />
                </FormControl>
                <FormDescription>
                  How the agent introduces itself
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of what your company does..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Used to give context to the agent about your business
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="escalation_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escalation Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="sales@company.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Email for human takeover requests
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="escalation_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escalation Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+7 999 123 4567" {...field} />
                </FormControl>
                <FormDescription>
                  Phone number for urgent escalations
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}
