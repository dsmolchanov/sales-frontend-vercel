import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  Flame,
  Thermometer,
  Snowflake,
  Users,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase";
import { formatPhone } from "@/lib/utils";
import { LeadDetailPanel } from "@/components/leads";
import type {
  LeadWithSession,
  UnifiedLeadFilters,
  ConversationSession,
  ConversationControlMode,
} from "@/types";
import type { QualificationScore, LeadStatus, Lead } from "@/types/salesConfig";

export function LeadsPage() {
  const { organization } = useAuthStore();
  const [leads, setLeads] = useState<LeadWithSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadWithSession | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UnifiedLeadFilters>({});
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [autoReleaseHours, setAutoReleaseHours] = useState(24);
  const [leadToDelete, setLeadToDelete] = useState<LeadWithSession | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch leads, sessions, and org config on mount
  useEffect(() => {
    if (organization?.id) {
      fetchLeadsWithSessions();
      fetchOrgConfig();

      // Set up realtime subscriptions for both leads and sessions
      const leadsChannel = supabase
        .channel(`leads_${organization.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "sales",
            table: "leads",
            filter: `organization_id=eq.${organization.id}`,
          },
          () => {
            fetchLeadsWithSessions();
          },
        )
        .subscribe();

      const sessionsChannel = supabase
        .channel(`sessions_${organization.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "agents",
            table: "conversation_sessions",
            filter: `organization_id=eq.${organization.id}`,
          },
          () => {
            fetchLeadsWithSessions();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(leadsChannel);
        supabase.removeChannel(sessionsChannel);
      };
    }
  }, [organization?.id, filters.status, filters.qualification_score]);

  const fetchOrgConfig = async () => {
    if (!organization?.id) return;
    try {
      const { data } = await supabase
        .schema("agents")
        .from("organization_configs")
        .select("hitl_auto_release_hours")
        .eq("organization_id", organization.id)
        .eq("agent_type", "sales")
        .single();
      if (data?.hitl_auto_release_hours) {
        setAutoReleaseHours(data.hitl_auto_release_hours);
      }
    } catch (error) {
      console.error("Error fetching org config:", error);
    }
  };

  const fetchLeadsWithSessions = async () => {
    if (!organization?.id) return;

    setIsLoading(true);
    try {
      // Fetch ALL sessions first (to catch orphan sessions without leads)
      const { data: allSessionsData } = await supabase
        .schema("agents")
        .from("conversation_sessions")
        .select("*")
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false });

      const sessionsMap = new Map<string, ConversationSession>(
        (allSessionsData || []).map((s) => [s.phone, s as ConversationSession]),
      );

      // Fetch leads with filters
      let leadsQuery = supabase
        .schema("sales")
        .from("leads")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (filters.status) {
        leadsQuery = leadsQuery.eq("status", filters.status);
      }
      if (filters.qualification_score) {
        leadsQuery = leadsQuery.eq(
          "qualification_score",
          filters.qualification_score,
        );
      }

      const { data: leadsData, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      // Track which phones have leads
      const leadPhones = new Set((leadsData || []).map((l) => l.phone));

      // Join sessions to leads
      const leadsWithSessions: LeadWithSession[] = (
        (leadsData || []) as Lead[]
      ).map((lead) => ({
        ...lead,
        session: sessionsMap.get(lead.phone) || null,
      }));

      // Create virtual leads for orphan sessions (sessions without matching leads)
      // Only if no status/score filters are active (orphan sessions have no lead data)
      if (!filters.status && !filters.qualification_score) {
        const orphanSessions = (allSessionsData || []).filter(
          (s) => !leadPhones.has(s.phone),
        );

        const virtualLeads: LeadWithSession[] = orphanSessions.map(
          (session) => ({
            // Virtual lead with minimal data from session
            id: `virtual-${session.id}`,
            organization_id: session.organization_id,
            phone: session.phone,
            contact_name: session.lead?.contact_name || undefined,
            company_name: session.lead?.company_name || undefined,
            qualification_score: "new" as const,
            status: "new" as const,
            created_at: session.created_at,
            updated_at: session.updated_at,
            session: session as ConversationSession,
          }),
        );

        leadsWithSessions.push(...virtualLeads);
      }

      // Sort by most recent activity (session update or lead update)
      leadsWithSessions.sort((a, b) => {
        const aTime = new Date(a.session?.updated_at || a.updated_at).getTime();
        const bTime = new Date(b.session?.updated_at || b.updated_at).getTime();
        return bTime - aTime;
      });

      setLeads(leadsWithSessions);

      // Update selected lead if it changed
      if (selectedLead) {
        const updatedSelectedLead = leadsWithSessions.find(
          (l) => l.id === selectedLead.id,
        );
        if (updatedSelectedLead) {
          setSelectedLead(updatedSelectedLead);
        }
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering for search and conversation_status
  const filteredLeads = leads.filter((lead) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        lead.phone.includes(query) ||
        lead.contact_name?.toLowerCase().includes(query) ||
        lead.company_name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Conversation status filter
    if (filters.conversation_status) {
      if (filters.conversation_status === "none") {
        if (lead.session) return false;
      } else {
        if (!lead.session) return false;
        if (lead.session.control_mode !== filters.conversation_status)
          return false;
      }
    }

    return true;
  });

  // Escalation handlers
  const handleEscalate = async () => {
    if (!selectedLead?.session) return;

    setIsActionLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .schema("agents")
        .from("conversation_sessions")
        .update({
          control_mode: "human",
          escalated_at: now,
          reason: "Manual escalation from UI",
        })
        .eq("id", selectedLead.session.id);

      if (error) throw error;

      // Update local state
      setSelectedLead({
        ...selectedLead,
        session: {
          ...selectedLead.session,
          control_mode: "human",
          escalated_at: now,
          reason: "Manual escalation from UI",
        },
      });
    } catch (error) {
      console.error("Error escalating session:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedLead?.session) return;

    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .schema("agents")
        .from("conversation_sessions")
        .update({
          control_mode: "agent",
          escalated_at: null,
          reason: null,
        })
        .eq("id", selectedLead.session.id);

      if (error) throw error;

      // Update local state
      setSelectedLead({
        ...selectedLead,
        session: {
          ...selectedLead.session,
          control_mode: "agent",
          escalated_at: undefined,
          reason: undefined,
        },
      });
    } catch (error) {
      console.error("Error releasing session:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleProlong = async () => {
    if (!selectedLead?.session) return;

    setIsActionLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .schema("agents")
        .from("conversation_sessions")
        .update({
          escalated_at: now,
        })
        .eq("id", selectedLead.session.id);

      if (error) throw error;

      // Update local state
      setSelectedLead({
        ...selectedLead,
        session: {
          ...selectedLead.session,
          escalated_at: now,
        },
      });
    } catch (error) {
      console.error("Error prolonging session:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete lead and all related data
  const handleDeleteLead = async () => {
    if (!leadToDelete || !organization?.id) return;

    setIsDeleting(true);
    try {
      const phone = leadToDelete.phone;
      const isVirtualLead = leadToDelete.id.startsWith("virtual-");

      console.log("Deleting lead:", {
        id: leadToDelete.id,
        phone,
        isVirtualLead,
        orgId: organization.id,
      });

      // 1. Delete conversation_sessions by phone
      const { error: sessionsError, count: sessionsCount } = await supabase
        .schema("agents")
        .from("conversation_sessions")
        .delete({ count: "exact" })
        .eq("phone", phone)
        .eq("organization_id", organization.id);

      console.log("Deleted conversation_sessions:", {
        sessionsCount,
        sessionsError,
      });

      if (sessionsError) {
        console.error("Error deleting conversation sessions:", sessionsError);
      }

      // 2. Delete agent_sessions by lead_phone
      const { error: agentSessionsError, count: agentCount } = await supabase
        .schema("agents")
        .from("agent_sessions")
        .delete({ count: "exact" })
        .eq("lead_phone", phone);

      console.log("Deleted agent_sessions:", {
        agentCount,
        agentSessionsError,
      });

      if (agentSessionsError) {
        console.error("Error deleting agent sessions:", agentSessionsError);
      }

      // 3. Delete conversation_messages (if any exist)
      if (leadToDelete.session?.id) {
        const { count: msgCount } = await supabase
          .schema("agents")
          .from("conversation_messages")
          .delete({ count: "exact" })
          .eq("session_id", leadToDelete.session.id);

        console.log("Deleted conversation_messages:", { msgCount });
      }

      // 4. Delete the lead itself (only if it's a real lead, not virtual)
      if (!isVirtualLead) {
        const { error: leadError, count: leadCount } = await supabase
          .schema("sales")
          .from("leads")
          .delete({ count: "exact" })
          .eq("id", leadToDelete.id);

        console.log("Deleted lead:", { leadCount, leadError });

        if (leadError) throw leadError;

        // Check if delete actually worked
        if (leadCount === 0) {
          throw new Error("Lead deletion was blocked - no rows affected");
        }
      }

      // Clear selection if deleted lead was selected
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }

      // Immediately remove from local state for instant UI feedback
      const deletedId = leadToDelete.id;
      const deletedPhone = leadToDelete.phone;
      setLeads((prevLeads) =>
        prevLeads.filter((l) => l.id !== deletedId && l.phone !== deletedPhone),
      );

      toast.success(
        `Lead ${leadToDelete.contact_name || leadToDelete.phone} deleted`,
      );

      // Also refresh from server to ensure consistency
      fetchLeadsWithSessions();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete lead",
      );
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
    }
  };

  // Helper functions
  const getScoreIcon = (score: QualificationScore) => {
    switch (score) {
      case "hot":
        return <Flame className="h-4 w-4" />;
      case "warm":
        return <Thermometer className="h-4 w-4" />;
      case "cold":
        return <Snowflake className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getScoreBadgeVariant = (score: QualificationScore) => {
    switch (score) {
      case "hot":
        return "hot" as const;
      case "warm":
        return "warm" as const;
      case "cold":
        return "cold" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "qualified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "converted":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "lost":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  const getControlModeVariant = (mode: ConversationControlMode) => {
    switch (mode) {
      case "human":
        return "escalated" as const;
      case "paused":
        return "paused" as const;
      default:
        return "agent" as const;
    }
  };

  const getControlModeLabel = (mode: ConversationControlMode) => {
    switch (mode) {
      case "human":
        return "Escalated";
      case "paused":
        return "Paused";
      default:
        return "Agent";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">
            Manage and track your sales leads
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select
                value={filters.qualification_score || "all"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    qualification_score:
                      value === "all"
                        ? undefined
                        : (value as QualificationScore),
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    status: value === "all" ? undefined : (value as LeadStatus),
                  }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.conversation_status || "all"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    conversation_status:
                      value === "all"
                        ? undefined
                        : (value as "none" | ConversationControlMode),
                  }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Conversation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conversations</SelectItem>
                  <SelectItem value="none">No Conversation</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="human">Escalated</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads List */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Leads</span>
              <Badge variant="secondary">{filteredLeads.length}</Badge>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No leads</p>
                <p className="text-sm text-center">
                  {searchQuery ||
                  filters.status ||
                  filters.qualification_score ||
                  filters.conversation_status
                    ? "No leads match your filters"
                    : "Leads will appear here when the agent qualifies them"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-blue-300 ${
                      selectedLead?.id === lead.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {lead.contact_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {formatPhone(lead.phone)}
                          {lead.company_name && ` • ${lead.company_name}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadToDelete(lead);
                        }}
                        title="Delete lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={getScoreBadgeVariant(lead.qualification_score)}
                        className="gap-1"
                      >
                        {getScoreIcon(lead.qualification_score)}
                        {lead.qualification_score}
                      </Badge>

                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(lead.status)}`}
                      >
                        {lead.status}
                      </span>

                      {lead.session ? (
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={getControlModeVariant(
                              lead.session.control_mode,
                            )}
                          >
                            {getControlModeLabel(lead.session.control_mode)}
                          </Badge>
                          {lead.session.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {lead.session.unread_count}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          No conv
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Updated{" "}
                      {formatDistanceToNow(
                        new Date(lead.session?.updated_at || lead.updated_at),
                        { addSuffix: true },
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <div>
          {selectedLead ? (
            <LeadDetailPanel
              lead={selectedLead}
              autoReleaseHours={autoReleaseHours}
              onEscalate={handleEscalate}
              onRelease={handleRelease}
              onProlong={handleProlong}
              isLoading={isActionLoading}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">No lead selected</p>
                <p className="text-sm">Select a lead to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!leadToDelete}
        onOpenChange={(open) => !open && setLeadToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {leadToDelete?.contact_name || leadToDelete?.phone}
              </strong>
              ? This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The lead record</li>
                <li>All conversation history</li>
                <li>All agent session data</li>
                <li>Any scheduled discovery calls</li>
              </ul>
              <span className="block mt-2 text-destructive font-medium">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
