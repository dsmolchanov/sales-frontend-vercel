import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { AgentConfigPage } from "@/pages/AgentConfig";
import { LeadsPage } from "@/pages/Leads";
import { SettingsPage } from "@/pages/Settings";
import { IntegrationsPage } from "@/pages/Integrations";
import { TeamManagementPage } from "@/pages/TeamManagement";
import { AcceptInvitationPage } from "@/pages/AcceptInvitation";
import { ResetPasswordPage } from "@/pages/ResetPassword";
import { SignupPage } from "@/pages/Signup";
import { OnboardingPage } from "@/pages/Onboarding";
import { AuthCallbackPage } from "@/pages/AuthCallback";

// Protected route wrapper
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Public route wrapper (redirects to dashboard if already authenticated)
function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <TooltipProvider>
      <BrowserRouter basename="/sales">
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Onboarding has its own layout */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/agent-config" element={<AgentConfigPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route
                path="/conversations"
                element={<Navigate to="/leads" replace />}
              />
              <Route path="/calls" element={<Navigate to="/leads" replace />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route
                path="/whatsapp"
                element={<Navigate to="/integrations" replace />}
              />
              <Route path="/team" element={<TeamManagementPage />} />
              <Route
                path="/invitations"
                element={<Navigate to="/team" replace />}
              />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Accept invitation - accessible without auth */}
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

          {/* Reset password - accessible without auth */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* OAuth callback - handles Google auth redirect */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </TooltipProvider>
  );
}
