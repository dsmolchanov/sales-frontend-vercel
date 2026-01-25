import { getAccessToken } from "./supabase";
import type { Team, TeamCreate, TeamMember, MemberUpdate } from "@/types";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

// Teams API
export async function fetchTeams(): Promise<Team[]> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/teams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch teams" }));
    throw new Error(error.detail || "Failed to fetch teams");
  }
  return res.json();
}

export async function createTeam(data: TeamCreate): Promise<Team> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to create team" }));
    throw new Error(error.detail || "Failed to create team");
  }
  return res.json();
}

export async function updateTeam(
  id: string,
  data: Partial<TeamCreate>,
): Promise<Team> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/teams/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to update team" }));
    throw new Error(error.detail || "Failed to update team");
  }
  return res.json();
}

export async function deleteTeam(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/teams/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to delete team" }));
    throw new Error(error.detail || "Failed to delete team");
  }
}

// Members API
export async function fetchMembers(teamId?: string): Promise<TeamMember[]> {
  const token = await getAccessToken();
  const url = new URL(`${BACKEND_URL}/api/sales/members`);
  if (teamId) url.searchParams.set("team_id", teamId);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch members" }));
    throw new Error(error.detail || "Failed to fetch members");
  }
  return res.json();
}

export async function getMember(id: string): Promise<TeamMember> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch member" }));
    throw new Error(error.detail || "Failed to fetch member");
  }
  return res.json();
}

export async function updateMember(
  id: string,
  data: MemberUpdate,
): Promise<TeamMember> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/members/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to update member" }));
    throw new Error(error.detail || "Failed to update member");
  }
  return res.json();
}

export async function removeMember(id: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${BACKEND_URL}/api/sales/members/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ detail: "Failed to remove member" }));
    throw new Error(error.detail || "Failed to remove member");
  }
}
