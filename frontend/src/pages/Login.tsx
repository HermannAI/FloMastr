


import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ThemeToggle } from "components/ThemeToggle";
import { stackClientApp } from "app/auth";
import brain from "brain";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get('next');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For regular users, resolve tenant
      const response = await brain.resolve_tenant_by_email({ identifier: email });
      const result = await response.json();
      
      if (result.found) {
        if (result.is_super_admin) {
          // Super admin found, redirect to admin dashboard
          // We will rely on Stack's auth guard on the admin page
          navigate("/admin-dashboard");
          return;
        }

        if (result.tenant_slug) {
          // Tenant found, redirect to the correct tenant subdomain for authentication
          const returnPath = nextUrl || `/hitl-tasks`;
          
          // Persist tenant context for downstream flows (branding, after-login redirects)
          try {
            localStorage.setItem('tenant-slug', result.tenant_slug);
            localStorage.setItem('tenant-email', email);
            // Store the full tenant context for post-login redirect
            localStorage.setItem('tenant-context', JSON.stringify({
              slug: result.tenant_slug,
              returnPath: returnPath
            }));
          } catch {}
          
          // Perform full browser redirect to tenant subdomain for Stack Auth sign-in
          // This replaces the navigate() call to support subdomain architecture
          window.location.href = `https://${result.tenant_slug}.flomastr.com/auth/sign-in?next=${encodeURIComponent(returnPath)}`;
        } else {
          // This case should ideally not happen if found is true but slug is null
          setError("Tenant information is incomplete. Please contact support.");
        }
      } else {
        setError("No tenant found for this email address. Please contact support.");
      }
    } catch (err) {
      console.error("Tenant resolution error:", err);
      setError("Failed to identify your tenant. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleGoogleSignIn = () => {
    // For now, just show message that Google sign-in will be implemented
    setError("Google sign-in coming soon. Please use email for now.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side: Logo */}
          <div className="flex items-center space-x-4">
            {/* Logo - Use FloMastr static logo */}
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <div className="text-xl font-bold">FloMastr</div>
          </div>
          
          {/* Right side: Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Tenant Login</CardTitle>
              <CardDescription>
                Enter your email address to identify your tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#009DEB] hover:bg-[#007BC4] text-white" 
                  disabled={loading}
                >
                  {loading ? "Finding your tenant..." : "Continue"}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={handleBackToHome}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to home
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Don't have access? Contact your administrator or{" "}
              <a 
                href="mailto:support@whappstream.com" 
                className="text-[#009DEB] hover:underline"
              >
                contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
