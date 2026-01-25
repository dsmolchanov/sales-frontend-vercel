import { useEffect, useState } from "react";
import { Calendar, Clock, Phone, User, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatDate } from "@/lib/utils";
import type { DiscoveryCall, CallStatus, CallFilters } from "@/types";

export function CallsPage() {
  const { organization } = useAuthStore();
  const [calls, setCalls] = useState<DiscoveryCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CallFilters>({});

  useEffect(() => {
    if (organization?.id) {
      fetchCalls();
    }
  }, [organization?.id, filters]);

  const fetchCalls = async () => {
    if (!organization?.id) return;

    setIsLoading(true);
    try {
      let query = supabase
        .schema("sales")
        .from("discovery_calls")
        .select("*")
        .eq("organization_id", organization.id)
        .order("scheduled_at", { ascending: true });

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.from_date) {
        query = query.gte("scheduled_at", filters.from_date);
      }
      if (filters.to_date) {
        query = query.lte("scheduled_at", filters.to_date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCalls((data as DiscoveryCall[]) || []);
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: CallStatus) => {
    switch (status) {
      case "scheduled":
        return "default" as const;
      case "completed":
        return "secondary" as const;
      case "cancelled":
        return "destructive" as const;
      case "no_show":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "no_show":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "";
    }
  };

  // Group calls by date
  const groupedCalls = calls.reduce(
    (acc, call) => {
      const date = formatDate(call.scheduled_at);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(call);
      return acc;
    },
    {} as Record<string, DiscoveryCall[]>,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Discovery Calls</h2>
          <p className="text-muted-foreground">
            View and manage scheduled discovery calls
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  status: value === "all" ? undefined : (value as CallStatus),
                }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calls List */}
      <div className="space-y-6">
        {Object.entries(groupedCalls).map(([date, dateCalls]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {date}
            </h3>
            <div className="space-y-2">
              {dateCalls.map((call) => (
                <Card key={call.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatDateTime(call.scheduled_at)}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {call.duration_minutes} min call
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(call.status)}`}
                        >
                          {call.status.replace("_", " ")}
                        </span>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {call.notes && (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">
                          {call.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {calls.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Phone className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {filters.status
                  ? "No calls match your filters"
                  : "No discovery calls scheduled yet. They will appear here when leads are qualified."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
