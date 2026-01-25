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
import { supabase, signUp, provisionTenant } from "@/lib/supabase";
import { toast } from "sonner";

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
      // Step 1: Create auth user with email verification
      const { user } = await signUp(email, password, {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          company_name: companyName,
          template: selectedTemplate,
        },
      });

      if (!user) {
        throw new Error("Failed to create user account");
      }

      // Step 2: Provision tenant atomically
      const result = await provisionTenant(
        user.id,
        email,
        companyName,
        selectedTemplate,
        primaryLanguage,
      );

      if (!result.success) {
        // Handle specific errors
        if (result.error === "organization_name_exists") {
          setError(
            "An organization with this name already exists. Did you mean to log in?",
          );
          return;
        }
        throw new Error(result.message || "Failed to create organization");
      }

      // Success - show email verification message
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
