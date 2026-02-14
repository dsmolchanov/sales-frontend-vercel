import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Building2,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  WifiOff,
  RefreshCw,
  Clock,
  Inbox,
  SkipForward,
  Rewind,
  ArrowRightLeft,
} from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { getAccessToken } from "@/lib/supabase";

const API_URL =
  import.meta.env.VITE_CLINIC_WEBHOOKS_URL ||
  "https://healthcare-clinic-backend.fly.dev";

async function apiFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ============== Shared ==============

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trial: "bg-blue-100 text-blue-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
  healthy: "bg-green-100 text-green-800",
  degraded: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
  unhealthy: "bg-red-100 text-red-800",
  offline: "bg-gray-100 text-gray-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}>
      {status}
    </Badge>
  );
}

function GrowthIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isPositive = pct >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}
    >
      <Icon className="w-3 h-3 mr-0.5" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function useApiFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    apiFetch<T>(path)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, isLoading, error };
}

// ============== Overview Tab ==============

function OverviewTab() {
  const { data, isLoading, error } = useApiFetch<any>(
    "/api/superadmin/platform-overview",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-12 text-center border-red-200 bg-red-50 mt-4">
        <AlertTriangle className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <p className="text-red-500">
          {error?.message || "Failed to load overview"}
        </p>
      </Card>
    );
  }

  const cur = data.current_month;
  const prev = data.previous_month;
  const funnel = data.onboarding_funnel;

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orgs</p>
                <p className="text-2xl font-bold">{data.total_organizations}</p>
                <p className="text-xs text-muted-foreground">
                  {data.active_organizations} active
                </p>
              </div>
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orgs</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.active_organizations}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.trial_organizations} trial, {data.paused_organizations}{" "}
                  paused
                </p>
              </div>
              <Building2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{data.total_users}</p>
                <p className="text-xs text-muted-foreground">
                  {data.total_superadmins} superadmins
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">
                  {cur.total_messages.toLocaleString()}
                </p>
                <GrowthIndicator
                  current={cur.total_messages}
                  previous={prev.total_messages}
                />
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="text-2xl font-bold">
                  {cur.total_tokens.toLocaleString()}
                </p>
                <GrowthIndicator
                  current={cur.total_tokens}
                  previous={prev.total_tokens}
                />
              </div>
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MoM + Funnel */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Month-over-Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <p className="font-medium text-muted-foreground">
                  Current Month
                </p>
                <div className="flex justify-between">
                  <span>Messages</span>
                  <span className="font-semibold">
                    {cur.total_messages.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Leads</span>
                  <span className="font-semibold">{cur.total_leads}</span>
                </div>
                <div className="flex justify-between">
                  <span>Escalations</span>
                  <span className="font-semibold">{cur.total_escalations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Orgs</span>
                  <span className="font-semibold">{cur.active_orgs}</span>
                </div>
              </div>
              <div className="space-y-3">
                <p className="font-medium text-muted-foreground">
                  Previous Month
                </p>
                <div className="flex justify-between">
                  <span>Messages</span>
                  <span className="font-semibold">
                    {prev.total_messages.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Leads</span>
                  <span className="font-semibold">{prev.total_leads}</span>
                </div>
                <div className="flex justify-between">
                  <span>Escalations</span>
                  <span className="font-semibold">
                    {prev.total_escalations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Orgs</span>
                  <span className="font-semibold">{prev.active_orgs}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Registered", value: funnel.total },
                { label: "Company Basics", value: funnel.company_basics_done },
                {
                  label: "Product Knowledge",
                  value: funnel.product_knowledge_done,
                },
                { label: "Qualification", value: funnel.qualification_done },
                { label: "WhatsApp", value: funnel.whatsapp_connected },
                { label: "Test & Launch", value: funnel.test_and_launch_done },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="text-sm w-36 text-muted-foreground">
                    {step.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${funnel.total > 0 ? (step.value / funnel.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">
                    {step.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============== Organizations Tab ==============

function OrganizationsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailOrgId, setDetailOrgId] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);
  params.set("page", String(page));
  params.set("per_page", "20");

  const { data, isLoading, error } = useApiFetch<any>(
    `/api/superadmin/organizations?${params.toString()}`,
  );

  const orgs = data?.organizations || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error.message}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-right p-3 font-medium">Members</th>
                    <th className="text-right p-3 font-medium">Messages</th>
                    <th className="text-right p-3 font-medium">Tokens</th>
                    <th className="text-left p-3 font-medium">Last Activity</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orgs.map((org: any) => (
                    <tr key={org.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{org.name}</td>
                      <td className="p-3">
                        <StatusBadge status={org.activation_status} />
                      </td>
                      <td className="p-3">{org.subscription_plan || "--"}</td>
                      <td className="p-3 text-right">{org.member_count}</td>
                      <td className="p-3 text-right">
                        {org.current_month_messages?.toLocaleString() || 0}
                      </td>
                      <td className="p-3 text-right">
                        {org.current_month_tokens?.toLocaleString() || 0}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {org.last_activity_at
                          ? format(
                              new Date(org.last_activity_at),
                              "MMM d HH:mm",
                            )
                          : "--"}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailOrgId(org.id)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {orgs.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No organizations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} organization{total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {detailOrgId && (
        <OrgDetailDialog
          orgId={detailOrgId}
          onClose={() => setDetailOrgId(null)}
        />
      )}
    </div>
  );
}

function OrgDetailDialog({
  orgId,
  onClose,
}: {
  orgId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useApiFetch<any>(
    `/api/superadmin/organizations/${orgId}/details`,
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data?.organization?.name || "Organization Details"}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                Status:{" "}
                <StatusBadge
                  status={data.organization.activation_status || "unknown"}
                />
              </div>
              <div>
                Plan:{" "}
                <span className="font-medium">
                  {data.organization.subscription_plan || "none"}
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-1">
                Teams ({data.teams.length})
              </h3>
              {data.teams.map((t: any) => (
                <div
                  key={t.id}
                  className="flex justify-between p-2 bg-muted/30 rounded mb-1"
                >
                  <span>{t.name}</span>
                  <Badge variant="outline">{t.agent_type}</Badge>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-1">
                Members ({data.members.length})
              </h3>
              {data.members.map((m: any) => (
                <div
                  key={m.id}
                  className="flex justify-between p-2 bg-muted/30 rounded mb-1"
                >
                  <span>{m.name || "Unnamed"}</span>
                  <Badge variant="outline">{m.role}</Badge>
                </div>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-muted-foreground mb-1">
                Integrations ({data.integrations.length})
              </h3>
              {data.integrations.map((i: any) => (
                <div
                  key={i.id}
                  className="flex justify-between p-2 bg-muted/30 rounded mb-1"
                >
                  <span>
                    {i.provider} ({i.type})
                  </span>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ============== Message Queue Section ==============

function StreamActionButton({
  action,
  label,
  icon: Icon,
  description,
  variant = "default",
  onExecute,
  isPending,
}: {
  action: string;
  label: string;
  icon: React.ElementType;
  description: string;
  variant?: "default" | "destructive";
  onExecute: (action: string) => void;
  isPending: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={isPending}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors disabled:opacity-50 ${
            variant === "destructive"
              ? "border-red-200 text-red-700 hover:bg-red-50"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onExecute(action)}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MessageQueueSection() {
  const [streamData, setStreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const fetchHealth = () => {
    setIsLoading(true);
    apiFetch<any>("/admin/streams/health")
      .then(setStreamData)
      .catch(() => setStreamData(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleAction = (action: string) => {
    setActionPending(true);
    setLastResult(null);
    apiPost<any>(`/admin/streams/${action}`)
      .then((data) => {
        setLastResult(data.message);
        fetchHealth();
      })
      .catch((err) => setLastResult(`Error: ${err.message}`))
      .finally(() => setActionPending(false));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-500" />
            Message Queue
          </CardTitle>
          <div className="flex items-center gap-2">
            {streamData && <StatusBadge status={streamData.status} />}
            <button
              onClick={fetchHealth}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading queue data...
            </span>
          </div>
        ) : streamData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{streamData.queue_depth}</p>
                <p className="text-xs text-muted-foreground">Queue Depth</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p
                  className={`text-2xl font-bold ${streamData.dlq_depth > 0 ? "text-red-600" : ""}`}
                >
                  {streamData.dlq_depth}
                </p>
                <p className="text-xs text-muted-foreground">DLQ Depth</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p
                  className={`text-2xl font-bold ${streamData.consumers_count === 0 ? "text-red-600" : ""}`}
                >
                  {streamData.consumers_count}
                </p>
                <p className="text-xs text-muted-foreground">Consumers</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p
                  className={`text-2xl font-bold ${streamData.pending > 0 ? "text-yellow-600" : ""}`}
                >
                  {streamData.pending}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>

            {streamData.consumers?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Active Consumers
                </h4>
                <div className="space-y-1">
                  {streamData.consumers.map((consumer: any) => (
                    <div
                      key={consumer.name}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2"
                    >
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {consumer.name}
                      </span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{consumer.pending} pending</span>
                        <span>idle {consumer.idle_seconds}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {streamData.issues?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Issues Detected
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {streamData.issues.map((issue: string, i: number) => (
                    <li key={i} className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      {issue.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
                {streamData.recommendations?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-yellow-200">
                    <p className="text-xs text-yellow-600">
                      {streamData.recommendations.join(" | ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {lastResult && (
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  lastResult.startsWith("Error")
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {lastResult}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <StreamActionButton
                action="reset-to-latest"
                label="Reset to Latest"
                icon={SkipForward}
                description="Skip all existing messages and only process new messages going forward. Use this to clear backlogs."
                onExecute={handleAction}
                isPending={actionPending}
              />
              <StreamActionButton
                action="reset-to-begin"
                label="Reset to Begin"
                icon={Rewind}
                description="Reprocess all messages from the beginning. Messages will be redelivered — this relies on idempotency to avoid duplicates."
                variant="destructive"
                onExecute={handleAction}
                isPending={actionPending}
              />
              <StreamActionButton
                action="claim-pending-to-worker"
                label="Claim Pending"
                icon={ArrowRightLeft}
                description="Claim all pending messages from idle or dead consumers and assign them to an active worker for processing."
                onExecute={handleAction}
                isPending={actionPending}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Unable to load queue data
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============== System Health Tab ==============

function SystemHealthTab() {
  const { data: healthData, isLoading: healthLoading } =
    useApiFetch<any>("/api/system/health");
  const { data: errorsData, isLoading: errorsLoading } = useApiFetch<any>(
    "/api/superadmin/recent-errors",
  );

  const services = healthData?.services || [];
  const errors = errorsData?.errors || [];

  return (
    <div className="space-y-6 mt-4">
      <div>
        <h3 className="text-lg font-semibold mb-3">Service Health</h3>
        {healthLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s: any) => (
              <Card key={s.name}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {s.status === "healthy" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : s.status === "degraded" ? (
                        <RefreshCw className="w-5 h-5 text-yellow-600" />
                      ) : s.status === "critical" ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-gray-400" />
                      )}
                      <h4 className="font-medium">{s.name}</h4>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Response</span>
                      <span className="font-medium">
                        {s.response_time_ms}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span className="font-medium">{s.uptime}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Message Queue */}
      <MessageQueueSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : errors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Organization</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {errors.slice(0, 50).map((err: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {err.created_at
                            ? format(new Date(err.created_at), "MMM d HH:mm:ss")
                            : "--"}
                        </div>
                      </td>
                      <td className="p-3">{err.organization_name}</td>
                      <td className="p-3">
                        <Badge variant="outline">{err.error_type}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground max-w-md truncate">
                        {err.error_message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No recent errors
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============== Users Tab ==============

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase
        .schema("agents")
        .from("team_members")
        .select(
          "id, name, role, organization_id, created_at, organizations:organization_id (name)",
        )
        .eq("is_superadmin", true)
        .order("created_at", { ascending: false })
        .then(({ data, error: err }) => {
          if (err) {
            setError(new Error(err.message));
          } else {
            setUsers(data || []);
          }
          setIsLoading(false);
        });
    });
  }, []);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  if (error)
    return <div className="text-center text-red-500 py-8">{error.message}</div>;

  // Deduplicate
  const userMap = new Map<
    string,
    { name: string | null; orgs: string[]; created_at: string }
  >();
  for (const u of users) {
    const key = u.name || u.id;
    const orgName = (u as any).organizations?.name;
    if (userMap.has(key)) {
      if (orgName) userMap.get(key)!.orgs.push(orgName);
    } else {
      userMap.set(key, {
        name: u.name,
        orgs: orgName ? [orgName] : [],
        created_at: u.created_at,
      });
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <p className="text-sm text-muted-foreground">
        {userMap.size} superadmin user{userMap.size !== 1 ? "s" : ""}
      </p>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Organizations</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from(userMap.entries()).map(([key, user]) => (
                <tr key={key} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{user.name || "Unnamed"}</td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.orgs.map((o) => (
                        <Badge key={o} variant="outline" className="text-xs">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============== Main Page ==============

export function PlatformAdminPage() {
  const { user } = useAuthStore();

  if (!user?.is_superadmin) return <Navigate to="/" replace />;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8" />
          Platform Admin
        </h1>
        <p className="text-muted-foreground mt-1">
          Cross-organization platform overview and management
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="organizations">
          <OrganizationsTab />
        </TabsContent>
        <TabsContent value="system">
          <SystemHealthTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
