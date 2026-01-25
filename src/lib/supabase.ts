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
  primaryLanguage: string = "en",
) => {
  const { data, error } = await supabase.rpc("provision_tenant", {
    p_user_id: userId,
    p_email: email,
    p_company_name: companyName,
    p_template_slug: templateSlug,
    p_primary_language: primaryLanguage,
  });

  if (error) {
    throw error;
  }

  return data;
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
