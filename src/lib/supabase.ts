import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to get the current user session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error fetching session:", error);
    return null;
  }
  return data.session;
};

// Helper to get the current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  return data.user;
};

// Helper to sign in with email/password
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw error;
  }
  return data;
};

// Helper to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

// Helper to sign up with email/password
export const signUp = async (
  email: string,
  password: string,
  options?: { emailRedirectTo?: string; data?: Record<string, unknown> },
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options?.emailRedirectTo,
      data: options?.data,
    },
  });
  if (error) {
    throw error;
  }
  return data;
};

// Helper to provision a new tenant (calls RPC function)
export const provisionTenant = async (
  userId: string,
  email: string,
  companyName: string,
  templateSlug: string = "custom",
) => {
  const { data, error } = await supabase.rpc("provision_tenant", {
    p_user_id: userId,
    p_email: email,
    p_company_name: companyName,
    p_template_slug: templateSlug,
  });

  if (error) {
    throw error;
  }

  return { success: true, ...data };
};

// Helper to reset password
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    throw error;
  }
};

// Helper to get access token for API calls
export const getAccessToken = async (): Promise<string | null> => {
  const session = await getSession();
  return session?.access_token ?? null;
};

// Helper to sign in with Google OAuth
export const signInWithGoogle = async (redirectTo?: string) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo || `${window.location.origin}/sales/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) {
    throw error;
  }
  return data;
};

// Check if user needs tenant provisioning (for OAuth and email verification)
export const checkAndProvisionTenant = async (
  userId: string,
  email: string,
  companyName?: string,
  templateSlug?: string,
) => {
  // Check if user already has an organization
  const { data: existingMember } = await supabase
    .schema("sales")
    .from("team_members")
    .select("organization_id")
    .eq("user_id", userId)
    .single();

  if (existingMember?.organization_id) {
    // User already has an org, return it
    return {
      success: true,
      organization_id: existingMember.organization_id,
      already_exists: true,
    };
  }

  // User needs provisioning
  const { data, error } = await supabase.rpc("provision_tenant", {
    p_user_id: userId,
    p_email: email,
    p_company_name: companyName || "My Company",
    p_template_slug: templateSlug || "custom",
  });

  if (error) {
    console.error("Tenant provisioning error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, ...data };
};
