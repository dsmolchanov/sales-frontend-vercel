import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Copy,
  Building2,
  Pencil,
  Phone,
  Plus,
  Palette,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/authStore";
import { supabase, getAccessToken } from "@/lib/supabase";
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchMembers,
  updateMember,
  removeMember,
} from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
import type {
  Team,
  TeamMember,
  TeamCreate,
  MemberUpdate,
  Invitation,
  InvitationFilters,
  InvitationStatus,
  InvitationRole,
} from "@/types";
import { toast } from "sonner";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

const TEAM_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

interface Organization {
  id: string;
  name: string;
}

export function TeamManagementPage() {
  const { user, organization } = useAuthStore();
  const [activeTab, setActiveTab] = useState("members");

  // Teams state
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<TeamCreate>({
    name: "",
    description: "",
    color: "#6366f1",
  });
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);

  // Members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState<MemberUpdate>({});
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Invitations state (similar to original Invitations page)
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<InvitationFilters>({});
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    organization?.id,
  );

  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("rep");
  const [inviteTeamId, setInviteTeamId] = useState<string | undefined>();
  const [inviteOrgId, setInviteOrgId] = useState<string | undefined>(
    organization?.id,
  );
  const [isInviting, setIsInviting] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] =
    useState<Invitation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const isSuperadmin = user?.is_superadmin ?? false;
  const isAdmin = user?.role === "admin" || isSuperadmin;
  const isManager = user?.role === "manager";
  const canManageTeams = isAdmin;
  const canInvite = isAdmin || isManager;

  // Fetch data on mount
  useEffect(() => {
    loadTeams();
    loadMembers();
    if (isSuperadmin) {
      fetchOrganizations();
    }
    loadInvitations();
  }, []);

  // Reload invitations when org changes
  useEffect(() => {
    if (selectedOrgId || isSuperadmin) {
      loadInvitations();
    }
  }, [selectedOrgId, filters, isSuperadmin]);

  const loadTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to fetch teams");
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to fetch members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .schema("agents")
        .from("organizations")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    }
  };

  const loadInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      let query = supabase
        .schema("agents")
        .from("staff_invitations")
        .select("*")
        .order("invited_at", { ascending: false });

      if (selectedOrgId) {
        query = query.eq("organization_id", selectedOrgId);
      } else if (!isSuperadmin && organization?.id) {
        query = query.eq("organization_id", organization.id);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.role) {
        query = query.eq("role", filters.role);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvitations((data as Invitation[]) || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to fetch invitations");
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  // Team handlers
  const handleOpenTeamDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setTeamForm({
        name: team.name,
        description: team.description || "",
        color: team.color,
      });
    } else {
      setEditingTeam(null);
      setTeamForm({ name: "", description: "", color: "#6366f1" });
    }
    setIsTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setIsSavingTeam(true);
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamForm);
        toast.success("Team updated");
      } else {
        await createTeam(teamForm);
        toast.success("Team created");
      }
      setIsTeamDialogOpen(false);
      loadTeams();
    } catch (error) {
      console.error("Error saving team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save team",
      );
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setIsDeletingTeam(true);
    try {
      await deleteTeam(teamToDelete.id);
      toast.success("Team deleted");
      setTeamToDelete(null);
      loadTeams();
      loadMembers(); // Refresh members as their team_id may have been cleared
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team",
      );
    } finally {
      setIsDeletingTeam(false);
    }
  };

  // Member handlers
  const handleOpenMemberSheet = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name || "",
      role: member.role,
      team_id: member.team_id || undefined,
      phone: member.phone || "",
      email: member.email || "",
      whatsapp_number: member.whatsapp_number || "",
      preferred_channel: member.preferred_channel,
      title: member.title || "",
    });
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;

    setIsSavingMember(true);
    try {
      await updateMember(editingMember.id, memberForm);
      toast.success("Member updated");
      setEditingMember(null);
      loadMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save member",
      );
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemovingMember(true);
    try {
      await removeMember(memberToRemove.id);
      toast.success("Member removed");
      setMemberToRemove(null);
      loadMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Invitation handlers
  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error("Please fill in all fields");
      return;
    }

    const targetOrgId = isSuperadmin ? inviteOrgId : organization?.id;
    if (!targetOrgId) {
      toast.error("Please select an organization");
      return;
    }

    setIsInviting(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${BACKEND_URL}/api/sales/invitations/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
            organization_id: isSuperadmin ? targetOrgId : undefined,
            team_id: inviteTeamId || undefined,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to send invitation");
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("rep");
      setInviteTeamId(undefined);
      loadInvitations();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;

    setIsCancelling(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${BACKEND_URL}/api/sales/invitations/${invitationToCancel.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to cancel invitation");
      }

      toast.success("Invitation cancelled");
      setCancelDialogOpen(false);
      setInvitationToCancel(null);
      loadInvitations();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invitation",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return inv.email.toLowerCase().includes(query);
  });

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: InvitationStatus) => {
    switch (status) {
      case "pending":
        return "outline" as const;
      case "accepted":
        return "default" as const;
      case "expired":
        return "secondary" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "rep":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "";
    }
  };

  const getAvailableRoles = (): InvitationRole[] => {
    if (isSuperadmin) return ["admin", "manager", "rep"];
    if (user?.role === "admin") return ["admin", "manager", "rep"];
    if (user?.role === "manager") return ["rep"];
    return [];
  };

  if (
    isLoadingTeams &&
    isLoadingMembers &&
    isLoadingInvitations &&
    teams.length === 0 &&
    members.length === 0 &&
    invitations.length === 0
  ) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">
            Manage your team members, teams, and invitations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Building2 className="h-4 w-4" />
            Teams ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="h-4 w-4" />
            Invitations (
            {invitations.filter((i) => i.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Team
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {member.name
                                  ? getInitials(member.name)
                                  : member.email?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {member.name || "Unnamed"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                              {member.title && (
                                <p className="text-xs text-muted-foreground">
                                  {member.title}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                          >
                            {member.role}
                            {member.is_superadmin && " (Super)"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {member.team_name ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    teams.find((t) => t.id === member.team_id)
                                      ?.color || "#6366f1",
                                }}
                              />
                              <span className="text-sm">
                                {member.team_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No team
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-sm">
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </span>
                            )}
                            {member.whatsapp_number && (
                              <span className="text-muted-foreground">
                                WhatsApp: {member.whatsapp_number}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenMemberSheet(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && member.user_id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {members.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No team members yet. Invite someone to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-4">
          {canManageTeams && (
            <div className="flex justify-end">
              <Button onClick={() => handleOpenTeamDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                    </div>
                    {canManageTeams && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenTeamDialog(team)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setTeamToDelete(team)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {team.description && (
                    <CardDescription>{team.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team.member_count} members</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {teams.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No teams created yet.
                  {canManageTeams && " Click 'Create Team' to add one."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          {/* Organization Filter (Superadmin only) */}
          {isSuperadmin && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Select
                      value={selectedOrgId || "all"}
                      onValueChange={(v) =>
                        setSelectedOrgId(v === "all" ? undefined : v)
                      }
                    >
                      <SelectTrigger className="w-full md:w-80">
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    status:
                      value === "all" ? undefined : (value as InvitationStatus),
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.role || "all"}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    role:
                      value === "all" ? undefined : (value as InvitationRole),
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="rep">Rep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canInvite && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation email to join your sales team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {isSuperadmin && (
                      <div className="space-y-2">
                        <Label htmlFor="invite-org">Organization</Label>
                        <Select
                          value={inviteOrgId}
                          onValueChange={setInviteOrgId}
                        >
                          <SelectTrigger id="invite-org">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) =>
                          setInviteRole(v as InvitationRole)
                        }
                      >
                        <SelectTrigger id="invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-team">Team (optional)</Label>
                      <Select
                        value={inviteTeamId || "none"}
                        onValueChange={(v) =>
                          setInviteTeamId(v === "none" ? undefined : v)
                        }
                      >
                        <SelectTrigger id="invite-team">
                          <SelectValue placeholder="No team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: team.color }}
                                />
                                {team.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={isInviting}>
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Invited
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInvitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {invitation.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}
                          >
                            {invitation.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={getStatusBadgeVariant(invitation.status)}
                            className="gap-1"
                          >
                            {getStatusIcon(invitation.status)}
                            {invitation.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invitation.invited_at)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-muted-foreground">
                            {formatDate(invitation.expires_at)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {invitation.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Invitation link was sent via email"
                                  onClick={() =>
                                    toast.info(
                                      "Invitation link was sent via email to " +
                                        invitation.email,
                                    )
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Cancel invitation"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setInvitationToCancel(invitation);
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredInvitations.length === 0 && (
                <div className="p-8 text-center">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || filters.status || filters.role
                      ? "No invitations match your filters"
                      : "No invitations yet. Click 'Invite Member' to add team members."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit Team" : "Create Team"}
            </DialogTitle>
            <DialogDescription>
              {editingTeam
                ? "Update team details"
                : "Create a new team for your organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                placeholder="e.g., Sales, Support, Marketing"
                value={teamForm.name}
                onChange={(e) =>
                  setTeamForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description (optional)</Label>
              <Input
                id="team-description"
                placeholder="What does this team do?"
                value={teamForm.description || ""}
                onChange={(e) =>
                  setTeamForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Team Color</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${
                      teamForm.color === color
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setTeamForm((f) => ({ ...f, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTeamDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={isSavingTeam}>
              {isSavingTeam ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTeam ? (
                "Update Team"
              ) : (
                "Create Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <AlertDialog
        open={!!teamToDelete}
        onOpenChange={() => setTeamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{teamToDelete?.name}</strong>?
              {teamToDelete && teamToDelete.member_count > 0 && (
                <>
                  <br />
                  <br />
                  This team has{" "}
                  <strong>{teamToDelete.member_count} members</strong>. They
                  will be unassigned from this team but will remain in the
                  organization.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isDeletingTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingTeam ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Team"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Member Edit Sheet */}
      <Sheet open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Member</SheetTitle>
            <SheetDescription>
              Update member details and contact information
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input
                id="member-name"
                value={memberForm.name || ""}
                onChange={(e) =>
                  setMemberForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-title">Job Title</Label>
              <Input
                id="member-title"
                placeholder="e.g., Sales Manager"
                value={memberForm.title || ""}
                onChange={(e) =>
                  setMemberForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-team">Team</Label>
              <Select
                value={memberForm.team_id || "none"}
                onValueChange={(v) =>
                  setMemberForm((f) => ({
                    ...f,
                    team_id: v === "none" ? null : v,
                  }))
                }
              >
                <SelectTrigger id="member-team">
                  <SelectValue placeholder="No team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isAdmin && editingMember?.user_id !== user?.id && (
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Select
                  value={memberForm.role || editingMember?.role}
                  onValueChange={(v) =>
                    setMemberForm((f) => ({
                      ...f,
                      role: v as "admin" | "manager" | "rep",
                    }))
                  }
                >
                  <SelectTrigger id="member-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="rep">Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="member-phone">Phone</Label>
              <Input
                id="member-phone"
                placeholder="+1 (555) 123-4567"
                value={memberForm.phone || ""}
                onChange={(e) =>
                  setMemberForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-whatsapp">WhatsApp Number</Label>
              <Input
                id="member-whatsapp"
                placeholder="+1 (555) 123-4567"
                value={memberForm.whatsapp_number || ""}
                onChange={(e) =>
                  setMemberForm((f) => ({
                    ...f,
                    whatsapp_number: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-channel">Preferred Contact Channel</Label>
              <Select
                value={memberForm.preferred_channel || "email"}
                onValueChange={(v) =>
                  setMemberForm((f) => ({
                    ...f,
                    preferred_channel: v as "email" | "phone" | "whatsapp",
                  }))
                }
              >
                <SelectTrigger id="member-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember} disabled={isSavingMember}>
              {isSavingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Remove Member Dialog */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToRemove?.name || memberToRemove?.email}</strong>{" "}
              from the organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to{" "}
              <strong>{invitationToCancel?.email}</strong>? They will no longer
              be able to join using this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Invitation"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
