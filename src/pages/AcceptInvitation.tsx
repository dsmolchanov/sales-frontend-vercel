import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bot,
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "https://healthcare-clinic-backend.fly.dev";

interface InvitationInfo {
  valid: boolean;
  email: string;
  role: string;
  organization_name: string;
  expires_at: string;
  existing_user: boolean;
}

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setValidationError("No invitation token provided");
      return;
    }

    validateToken(token);
  }, [token]);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/invitations/validate/${token}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Invalid invitation");
      }

      const data = await response.json();
      setInvitationInfo(data);

      // Pre-fill name from email if not set and not existing user
      if (!name && !data.existing_user) {
        const emailName = data.email.split("@")[0];
        setName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      }
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Failed to validate invitation",
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Only validate password for new users
    if (!invitationInfo?.existing_user) {
      if (password.length < 6) {
        setSubmitError("Password must be at least 6 characters");
        return;
      }

      if (password !== confirmPassword) {
        setSubmitError("Passwords do not match");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/sales/invitations/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: invitationInfo?.existing_user ? "placeholder" : password,
            name: name.trim() || undefined,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to accept invitation");
      }

      if (invitationInfo?.existing_user) {
        toast.success(
          "You've been added to the team! Please sign in with your existing password.",
        );
      } else {
        toast.success("Account created successfully! Please sign in.");
      }

      // Redirect to login
      navigate("/login");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to accept invitation",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                Validating invitation...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>{validationError}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Existing user - simplified form
  if (invitationInfo?.existing_user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <UserCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              Join {invitationInfo?.organization_name}
            </CardTitle>
            <CardDescription>
              You already have an account with{" "}
              <span className="font-medium">{invitationInfo?.email}</span>.
              Click below to join the team as a{" "}
              <span className="font-medium capitalize">
                {invitationInfo?.role}
              </span>
              .
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {submitError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                After joining, you can sign in with your existing password. If
                you signed up with Google or don't have a password set, use the
                "Forgot password?" link on the login page to set one.
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining team...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Join Team
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // New user - full registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            Join {invitationInfo?.organization_name}
          </CardTitle>
          <CardDescription>
            You've been invited to join as a{" "}
            <span className="font-medium capitalize">
              {invitationInfo?.role}
            </span>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {submitError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitationInfo?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
