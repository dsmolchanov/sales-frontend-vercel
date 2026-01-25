import { LogOut, Settings, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { getInitials } from "@/lib/utils";

export function Header() {
  const {
    user,
    organization,
    memberships,
    teams,
    selectedOrgId,
    selectedTeamId,
    selectOrganization,
    selectTeam,
    logout,
  } = useAuthStore();

  const hasMultipleOrgs = memberships.length > 1;
  const hasTeams = teams.length > 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-6">
        {/* Organization & Team Selectors */}
        <div className="flex items-center gap-3 flex-1">
          {/* Organization Selector */}
          {hasMultipleOrgs ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedOrgId || undefined}
                onValueChange={selectOrganization}
              >
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {memberships.map((m) => (
                    <SelectItem
                      key={m.organization_id}
                      value={m.organization_id}
                    >
                      <div className="flex items-center gap-2">
                        <span>{m.organization.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          ({m.role})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {organization?.name || "Sales Dashboard"}
              </span>
            </div>
          )}

          {/* Separator */}
          {hasTeams && <span className="text-muted-foreground">/</span>}

          {/* Team Selector */}
          {hasTeams && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedTeamId || "all"}
                onValueChange={(value) =>
                  selectTeam(value === "all" ? null : value)
                }
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="text-muted-foreground">All Teams</span>
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span>{team.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* User Controls (Right Side) */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-2 pl-2 border-l">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {user?.name ? getInitials(user.name) : user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-sm">
              <p className="font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
