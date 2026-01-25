import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, signIn, signOut } from "@/lib/supabase";
import type { SalesUser, SalesOrganization, Team, Membership } from "@/types";

interface AuthState {
  user: SalesUser | null;
  memberships: Membership[]; // ALL orgs user belongs to
  selectedOrgId: string | null;
  selectedTeamId: string | null;

  // Computed from selected
  organization: SalesOrganization | null;
  currentMembership: Membership | null;
  teams: Team[]; // Teams in selected org

  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  selectOrganization: (orgId: string) => void;
  selectTeam: (teamId: string | null) => void;
  fetchTeams: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      memberships: [],
      selectedOrgId: null,
      selectedTeamId: null,
      organization: null,
      currentMembership: null,
      teams: [],
      isLoading: true,
      isAuthenticated: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true, error: null });
          console.log("[AuthStore] Starting initialization...");

          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("[AuthStore] Session error:", sessionError);
            set({
              user: null,
              memberships: [],
              organization: null,
              isAuthenticated: false,
              isLoading: false,
              error: sessionError.message,
            });
            return;
          }

          console.log("[AuthStore] Session:", session ? "exists" : "none");

          if (session?.user) {
            console.log("[AuthStore] User ID:", session.user.id);

            // First check if user is a superadmin
            const { data: superadminCheck, error: saError } = await supabase
              .schema("sales")
              .from("team_members")
              .select("id, is_superadmin")
              .eq("user_id", session.user.id)
              .eq("is_superadmin", true)
              .limit(1);

            if (saError) {
              console.error("[AuthStore] Superadmin check error:", saError);
            }

            const isSuperadmin = superadminCheck && superadminCheck.length > 0;

            let memberships: Membership[] = [];

            if (isSuperadmin) {
              // Superadmin: fetch ALL organizations
              const { data: allOrgs, error: orgsError } = await supabase
                .schema("sales")
                .from("organizations")
                .select(
                  "id, name, slug, owner_id, settings, created_at, updated_at",
                )
                .order("name");

              if (orgsError || !allOrgs || allOrgs.length === 0) {
                console.error("Superadmin but no orgs found:", orgsError);
                set({
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                    organization_id: undefined,
                    team_id: undefined,
                    role: "admin",
                    name: session.user.user_metadata?.name,
                    is_superadmin: true,
                  },
                  memberships: [],
                  organization: null,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              }

              // Create synthetic memberships for all orgs (superadmin has admin access to all)
              memberships = allOrgs.map((org: any) => ({
                id: `superadmin-${org.id}`,
                organization_id: org.id,
                organization: org as SalesOrganization,
                role: "admin" as const,
                team_id: undefined,
                team: undefined,
                is_superadmin: true,
              }));
            } else {
              // Regular user: fetch only their memberships
              const { data: teamMembers, error: teamError } = await supabase
                .schema("sales")
                .from("team_members")
                .select(
                  `
                  id,
                  organization_id,
                  role,
                  team_id,
                  is_superadmin,
                  organizations:organization_id (
                    id, name, slug, owner_id, settings, created_at, updated_at
                  ),
                  teams:team_id (
                    id, name, description, color
                  )
                `,
                )
                .eq("user_id", session.user.id);

              console.log(
                "[AuthStore] Team members result:",
                teamMembers?.length,
                "error:",
                teamError,
              );

              if (teamError) {
                console.error(
                  "[AuthStore] Error fetching team members:",
                  teamError,
                );
                // On error, still mark as authenticated but with no org
                // This prevents redirect loops
                set({
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                    organization_id: undefined,
                    team_id: undefined,
                    role: "owner",
                    name: session.user.user_metadata?.name,
                    is_superadmin: false,
                  },
                  memberships: [],
                  organization: null,
                  isAuthenticated: true, // Keep authenticated to prevent loop
                  isLoading: false,
                  error: "Failed to load organization data",
                });
                return;
              }

              if (!teamMembers || teamMembers.length === 0) {
                // User is authenticated but has no organization yet
                // This can happen during onboarding
                console.log("User has no team memberships yet");
                set({
                  user: {
                    id: session.user.id,
                    email: session.user.email || "",
                    organization_id: undefined,
                    team_id: undefined,
                    role: "owner",
                    name: session.user.user_metadata?.name,
                    is_superadmin: false,
                  },
                  memberships: [],
                  organization: null,
                  isAuthenticated: true, // Keep authenticated
                  isLoading: false,
                });
                return;
              }

              memberships = teamMembers.map((tm: any) => ({
                id: tm.id,
                organization_id: tm.organization_id,
                organization: tm.organizations as SalesOrganization,
                role: tm.role,
                team_id: tm.team_id,
                team: tm.teams as Team | undefined,
                is_superadmin: tm.is_superadmin || false,
              }));
            }

            // Get previously selected org or default to first
            const storedOrgId = get().selectedOrgId;
            const validOrgId = memberships.find(
              (m) => m.organization_id === storedOrgId,
            )
              ? storedOrgId
              : memberships[0].organization_id;

            const currentMembership = memberships.find(
              (m) => m.organization_id === validOrgId,
            )!;

            const salesUser: SalesUser = {
              id: session.user.id,
              email: session.user.email || "",
              organization_id: currentMembership.organization_id,
              team_id: currentMembership.team_id,
              role: currentMembership.role,
              name: session.user.user_metadata?.name,
              is_superadmin: isSuperadmin,
            };

            set({
              user: salesUser,
              memberships,
              selectedOrgId: validOrgId,
              selectedTeamId: currentMembership.team_id || null,
              organization: currentMembership.organization,
              currentMembership,
              isAuthenticated: true,
              isLoading: false,
            });

            // Fetch teams for selected org
            await get().fetchTeams();
          } else {
            set({
              user: null,
              memberships: [],
              organization: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          set({
            user: null,
            memberships: [],
            organization: null,
            isAuthenticated: false,
            isLoading: false,
            error: "Failed to initialize authentication",
          });
        }
      },

      selectOrganization: (orgId: string) => {
        const { memberships, user } = get();
        const membership = memberships.find((m) => m.organization_id === orgId);

        if (!membership) return;

        // Update user context
        const updatedUser = user
          ? {
              ...user,
              organization_id: membership.organization_id,
              team_id: membership.team_id,
              role: membership.role,
              is_superadmin: membership.is_superadmin,
            }
          : null;

        set({
          selectedOrgId: orgId,
          selectedTeamId: membership.team_id || null,
          organization: membership.organization,
          currentMembership: membership,
          user: updatedUser,
          teams: [], // Clear teams until fetched
        });

        // Fetch teams for new org
        get().fetchTeams();
      },

      selectTeam: (teamId: string | null) => {
        const { user } = get();

        set({
          selectedTeamId: teamId,
          user: user ? { ...user, team_id: teamId || undefined } : null,
        });
      },

      fetchTeams: async () => {
        const { selectedOrgId } = get();
        if (!selectedOrgId) return;

        try {
          const { data, error } = await supabase
            .schema("sales")
            .from("teams")
            .select("id, name, description, color")
            .eq("organization_id", selectedOrgId)
            .order("name");

          if (error) throw error;
          set({ teams: (data as Team[]) || [] });
        } catch (error) {
          console.error("Error fetching teams:", error);
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          await signIn(email, password);
          await get().initialize();
        } catch (error) {
          console.error("Login error:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to sign in",
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          await signOut();
          set({
            user: null,
            memberships: [],
            organization: null,
            selectedOrgId: null,
            selectedTeamId: null,
            teams: [],
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error("Logout error:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Failed to sign out",
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "sales-auth-storage",
      partialize: (state) => ({
        // Only persist minimal data, re-fetch user on init
        isAuthenticated: state.isAuthenticated,
        selectedOrgId: state.selectedOrgId, // Persist selected org
        selectedTeamId: state.selectedTeamId, // Persist selected team
      }),
    },
  ),
);

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    useAuthStore.getState().logout();
  } else if (event === "SIGNED_IN" && session) {
    useAuthStore.getState().initialize();
  }
});
