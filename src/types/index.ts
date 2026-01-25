export * from "./salesConfig";

// User types
export interface SalesUser {
  id: string;
  email: string;
  organization_id: string;
  team_id?: string;
  role: "admin" | "manager" | "rep";
  name?: string;
  is_superadmin?: boolean;
}

// WhatsApp instance types
export type WhatsAppInstanceStatus =
  | "disconnected"
  | "connecting"
  | "connected";

export interface WhatsAppInstance {
  id: string;
  organization_id: string | null;
  instance_name: string;
  phone_number: string | null;
  status: WhatsAppInstanceStatus;
  qr_code: string | null;
  is_global: boolean;
  evolution_instance_id: string | null;
  webhook_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Auth state
export interface AuthState {
  user: SalesUser | null;
  organization: import("./salesConfig").SalesOrganization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Dashboard metrics
export interface DashboardMetrics {
  newLeadsCount: number;
  qualifiedLeadsCount: number;
  scheduledCallsCount: number;
  conversionRate: number;
  todayCallsCount: number;
}

// Lead filters
export interface LeadFilters {
  status?: import("./salesConfig").LeadStatus;
  qualification_score?: import("./salesConfig").QualificationScore;
  search?: string;
  assigned_rep_id?: string;
}

// Call filters
export interface CallFilters {
  status?: import("./salesConfig").CallStatus;
  rep_id?: string;
  from_date?: string;
  to_date?: string;
}

// Invitation types
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";
export type InvitationRole = "admin" | "manager" | "rep";

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitationFilters {
  status?: InvitationStatus;
  role?: InvitationRole;
  organization_id?: string;
}

// Conversation control mode (escalation status)
export type ConversationControlMode = "agent" | "human" | "paused";

// Message sender types
export type MessageSenderType = "lead" | "staff" | "agent";

// Conversation session (with optional lead join)
export interface ConversationSession {
  id: string;
  phone: string;
  team_id: string;
  organization_id: string;
  control_mode: ConversationControlMode;
  reason?: string;
  source?: string;
  unread_count: number;
  escalated_at?: string; // Timestamp when escalated to human - for timer calculation
  created_at: string;
  updated_at: string;
  // Joined from leads table
  lead?: {
    id: string;
    contact_name?: string;
    company_name?: string;
    qualification_score: import("./salesConfig").QualificationScore;
    status: import("./salesConfig").LeadStatus;
  };
}

// Conversation message
export interface ConversationMessage {
  id: string;
  session_id: string;
  content: string;
  from_phone?: string;
  sender_type: MessageSenderType;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Conversation filters
export interface ConversationFilters {
  control_mode?: ConversationControlMode;
  search?: string;
}

// Lead with optional session for unified view
export interface LeadWithSession extends import("./salesConfig").Lead {
  session?: ConversationSession | null;
}

// Unified lead filters (combines lead filters with conversation status)
export interface UnifiedLeadFilters {
  status?: import("./salesConfig").LeadStatus;
  qualification_score?: import("./salesConfig").QualificationScore;
  conversation_status?: "none" | ConversationControlMode;
  search?: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  member_count: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  role: "admin" | "manager" | "rep";
  team_id?: string;
  team_name?: string;
  phone?: string;
  whatsapp_number?: string;
  preferred_channel: "email" | "phone" | "whatsapp";
  title?: string;
  avatar_url?: string;
  is_superadmin: boolean;
  created_at: string;
}

export interface TeamCreate {
  name: string;
  description?: string;
  color?: string;
}

export interface MemberUpdate {
  name?: string;
  role?: "admin" | "manager" | "rep";
  team_id?: string | null;
  phone?: string;
  email?: string;
  whatsapp_number?: string;
  preferred_channel?: "email" | "phone" | "whatsapp";
  title?: string;
  avatar_url?: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  organization: import("./salesConfig").SalesOrganization;
  role: "admin" | "manager" | "rep";
  team_id?: string;
  team?: Team;
  is_superadmin: boolean;
}
