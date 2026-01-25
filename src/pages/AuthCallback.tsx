import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, checkAndProvisionTenant } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash (OAuth callback)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          throw new Error("No user session found");
        }

        const user = session.user;

        // Check if this is a new user that needs tenant provisioning
        // For email signups, company_name and template come from user_metadata
        // For OAuth, we use email domain as fallback
        const companyName =
          user.user_metadata?.company_name ||
          user.email?.split("@")[1]?.split(".")[0] ||
          "My Company";
        const templateSlug = user.user_metadata?.template || "custom";

        const result = await checkAndProvisionTenant(
          user.id,
          user.email || "",
          companyName,
          templateSlug,
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to provision account");
        }

        // Re-initialize auth store to load user data
        await initialize();

        // Redirect based on whether this is a new user or existing
        if (result.already_exists) {
          // Existing user - go to dashboard
          navigate("/", { replace: true });
        } else {
          // New user - go to onboarding
          navigate("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        // Redirect to login after delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, initialize]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  );
}
