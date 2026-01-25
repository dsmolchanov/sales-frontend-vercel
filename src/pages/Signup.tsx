import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bot, Loader2, Building2, Globe, CheckCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase, signUp, signInWithGoogle } from "@/lib/supabase";
import { toast } from "sonner";

// Google icon component
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface Template {
  id: string;
  name: string;
  slug: string;
  industry: string;
  description: string;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ru", label: "Russian" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
];

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [primaryLanguage, setPrimaryLanguage] = useState("en");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle(`${window.location.origin}/sales/onboarding`);
      // OAuth will redirect, so we don't need to do anything here
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign up with Google",
      );
      setIsGoogleLoading(false);
    }
  };

  // Detect browser locale for default language
  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    const supportedLang = LANGUAGES.find((l) => l.value === browserLang);
    if (supportedLang) {
      setPrimaryLanguage(supportedLang.value);
    }
  }, []);

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .schema("sales")
          .from("organization_templates")
          .select("id, name, slug, industry, description")
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        console.error("Failed to load templates:", err);
        // Default to custom if templates can't be loaded
        setTemplates([
          {
            id: "custom",
            name: "Custom",
            slug: "custom",
            industry: "Other",
            description: "Start from scratch",
          },
        ]);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword || !companyName) {
      setError("All fields are required");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (companyName.length < 2) {
      setError("Company name must be at least 2 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Create auth user with email verification
      // Note: Tenant will be provisioned after email verification via AuthCallback
      const { user } = await signUp(email, password, {
        emailRedirectTo: `${window.location.origin}/sales/auth/callback`,
        data: {
          company_name: companyName,
          template: selectedTemplate,
          primary_language: primaryLanguage,
        },
      });

      if (!user) {
        throw new Error("Failed to create user account");
      }

      // Success - show email verification message
      // Tenant will be provisioned when user clicks the verification link
      setEmailSent(true);
      toast.success("Account created! Please check your email to verify.");
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show email verification message after successful signup
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              <p className="mb-2">
                Click the link in the email to verify your account and continue
                setting up your sales agent.
              </p>
              <p>
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="text-primary hover:underline"
                >
                  resend verification email
                </button>
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Create Your Sales Agent</CardTitle>
          <CardDescription>
            Set up your AI-powered sales assistant in minutes
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">
                <Building2 className="inline h-4 w-4 mr-1" />
                Company Name
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Inc."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoComplete="organization"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Industry Template */}
            <div className="space-y-2">
              <Label htmlFor="template">Industry Template (optional)</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.slug} value={template.slug}>
                      <span className="font-medium">{template.name}</span>
                      <span className="text-muted-foreground ml-2">
                        - {template.industry}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Templates provide pre-configured settings you can customize
                later
              </p>
            </div>

            {/* Primary Language */}
            <div className="space-y-2">
              <Label htmlFor="language">
                <Globe className="inline h-4 w-4 mr-1" />
                Primary Language
              </Label>
              <Select
                value={primaryLanguage}
                onValueChange={setPrimaryLanguage}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The language your sales agent will use by default
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span className="ml-2">Sign up with Google</span>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
