import { useEffect, useState } from "react";
import {
  Search,
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
import { useAuthStore } from "@/stores/authStore";
import { supabase, getAccessToken } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type {
  Invitation,
  InvitationFilters,
  InvitationStatus,
  InvitationRole,
} from "@/types";
import { toast } from "sonner";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

interface Organization {
  id: string;
  name: string;
}

export function InvitationsPage() {
  const { user, organization } = useAuthStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<InvitationFilters>({});
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    organization?.id,
  );

  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("rep");
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
  const canInvite =
    isSuperadmin || user?.role === "admin" || user?.role === "manager";

  // Fetch organizations for superadmin
  useEffect(() => {
    if (isSuperadmin) {
      fetchOrganizations();
    }
  }, [isSuperadmin]);

  // Fetch invitations when org changes
  useEffect(() => {
    if (selectedOrgId || isSuperadmin) {
      fetchInvitations();
    }
  }, [selectedOrgId, filters, isSuperadmin]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .schema("sales")
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

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .schema("sales")
        .from("staff_invitations")
        .select("*")
        .order("invited_at", { ascending: false });

      // Filter by org - superadmin can see all, others see their org only
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
      setIsLoading(false);
    }
  };

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
      fetchInvitations();
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
      fetchInvitations();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invitation",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const copyInviteLink = (invitation: Invitation) => {
    // Note: We can't copy the actual token as it's hashed in DB
    // This is just for UX - actual link is sent via email
    toast.info("Invitation link was sent via email to " + invitation.email);
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

  const getRoleBadgeColor = (role: InvitationRole) => {
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

  // Get available roles based on user's role
  const getAvailableRoles = (): InvitationRole[] => {
    if (isSuperadmin) return ["admin", "manager", "rep"];
    if (user?.role === "admin") return ["admin", "manager", "rep"];
    if (user?.role === "manager") return ["rep"];
    return [];
  };

  if (isLoading && invitations.length === 0) {
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
          <h2 className="text-2xl font-bold tracking-tight">
            Team Invitations
          </h2>
          <p className="text-muted-foreground">
            Manage invitations to your sales team
          </p>
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
                    <Select value={inviteOrgId} onValueChange={setInviteOrgId}>
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
                    onValueChange={(v) => setInviteRole(v as InvitationRole)}
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
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === "admin" &&
                      "Full access to manage team and settings"}
                    {inviteRole === "manager" &&
                      "Can manage leads, calls, and invite reps"}
                    {inviteRole === "rep" &&
                      "Can view and manage assigned leads"}
                  </p>
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

      {/* Organization Filter (Superadmin only) */}
      {isSuperadmin && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="org-filter" className="sr-only">
                  Organization
                </Label>
                <Select
                  value={selectedOrgId || "all"}
                  onValueChange={(v) =>
                    setSelectedOrgId(v === "all" ? undefined : v)
                  }
                >
                  <SelectTrigger id="org-filter" className="w-full md:w-80">
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Invitations Table */}
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
                        <span className="font-medium">{invitation.email}</span>
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
                              title="Copy invite info"
                              onClick={() => copyInviteLink(invitation)}
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

      {/* Cancel Confirmation Dialog */}
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
