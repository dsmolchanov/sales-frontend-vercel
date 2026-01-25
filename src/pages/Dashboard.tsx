import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Phone,
  TrendingUp,
  Calendar,
  ArrowRight,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
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
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import type { Lead, DiscoveryCall, DashboardMetrics } from "@/types";

export function DashboardPage() {
  const { organization } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [upcomingCalls, setUpcomingCalls] = useState<DiscoveryCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id]);

  const fetchDashboardData = async () => {
    if (!organization?.id) return;

    setIsLoading(true);
    try {
      // Fetch metrics
      const [leadsResult, callsResult] = await Promise.all([
        supabase
          .schema("sales")
          .from("leads")
          .select("qualification_score, status", { count: "exact" })
          .eq("organization_id", organization.id),
        supabase
          .schema("sales")
          .from("discovery_calls")
          .select("status, scheduled_at", { count: "exact" })
          .eq("organization_id", organization.id)
          .gte("scheduled_at", new Date().toISOString().split("T")[0]),
      ]);

      const leads = leadsResult.data || [];
      const calls = callsResult.data || [];

      const newLeads = leads.filter((l) => l.status === "new").length;
      const qualifiedLeads = leads.filter(
        (l) => l.status === "qualified",
      ).length;
      const scheduledCalls = calls.filter(
        (c) => c.status === "scheduled",
      ).length;
      const convertedLeads = leads.filter(
        (l) => l.status === "converted",
      ).length;
      const totalLeads = leads.length;

      setMetrics({
        newLeadsCount: newLeads,
        qualifiedLeadsCount: qualifiedLeads,
        scheduledCallsCount: scheduledCalls,
        conversionRate:
          totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        todayCallsCount: calls.filter((c) =>
          c.scheduled_at.startsWith(new Date().toISOString().split("T")[0]),
        ).length,
      });

      // Fetch recent leads
      const { data: recentLeadsData } = await supabase
        .schema("sales")
        .from("leads")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentLeads((recentLeadsData as Lead[]) || []);

      // Fetch upcoming calls
      const { data: upcomingCallsData } = await supabase
        .schema("sales")
        .from("discovery_calls")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5);

      setUpcomingCalls((upcomingCallsData as DiscoveryCall[]) || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case "hot":
        return <Flame className="h-4 w-4 text-red-500" />;
      case "warm":
        return <Thermometer className="h-4 w-4 text-orange-500" />;
      case "cold":
        return <Snowflake className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your sales pipeline and upcoming calls
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.newLeadsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.qualifiedLeadsCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.todayCallsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest leads from the agent</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/leads">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            ) : (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {getScoreIcon(lead.qualification_score)}
                      <div>
                        <p className="font-medium">
                          {lead.contact_name || lead.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.company_name || "Unknown company"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        lead.qualification_score === "hot"
                          ? "hot"
                          : lead.qualification_score === "warm"
                            ? "warm"
                            : lead.qualification_score === "cold"
                              ? "cold"
                              : "secondary"
                      }
                    >
                      {lead.qualification_score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Calls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming Calls</CardTitle>
                <CardDescription>Scheduled discovery calls</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/calls">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming calls scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatDateTime(call.scheduled_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {call.duration_minutes} min call
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{call.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
