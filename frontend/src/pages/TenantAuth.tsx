


import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Building } from 'lucide-react';
import { ThemeToggle } from 'components/ThemeToggle';
import { stackClientApp } from 'app/auth';
import { useUser } from '@stackframe/react';

// IMPORTANT: This page handles both authenticated redirects and unauthenticated users
// It needs to work regardless of UserGuard wrapper
export default function TenantAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Use useUser instead of useUserGuardContext to handle both scenarios
  const currentUser = useUser();
  
  // Get tenant context from localStorage (stored by tenant resolution flow)
  const [tenantContext, setTenantContext] = useState<{
    tenantSlug?: string;
    email?: string;
  }>({});

  useEffect(() => {
    // If user is already authenticated, redirect them to their intended destination
    if (currentUser) {
      const nextUrl = searchParams.get('next') || `/${tenantContext.tenantSlug || 'dashboard'}/hitl-tasks`;
      navigate(nextUrl, { replace: true });
      return;
    }
    
    // Get tenant context from localStorage
    const storedTenantSlug = localStorage.getItem('tenant-slug');
    const storedEmail = localStorage.getItem('tenant-email');
    
    if (storedTenantSlug) {
      setTenantContext({
        tenantSlug: storedTenantSlug,
        email: storedEmail || undefined
      });
    } else {
      // If no tenant context, redirect back to login
      navigate('/login');
    }
  }, [navigate, currentUser, searchParams, tenantContext.tenantSlug]);

  // Don't render the form if user is already authenticated (they'll be redirected)
  if (currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get the next URL to redirect after sign-in
      const nextUrl = searchParams.get('next') || `/${tenantContext.tenantSlug}/hitl-tasks`;
      
      // Redirect to Stack Auth sign-in with return URL
      window.location.href = `${stackClientApp.urls.signIn}?next=${encodeURIComponent(nextUrl)}`;
    } catch (err) {
      console.error('Sign-in redirect error:', err);
      setError('Failed to redirect to sign-in. Please try again.');
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Prepare clientMetadata with tenant context for Stack Auth
      const clientMetadata = {
        tenantSlug: tenantContext.tenantSlug || '',
        tenantEmail: tenantContext.email || '',
        onboardingSource: 'tenant-resolution'
      };
      
      // Store tenant context for sign-up process (fallback)
      if (tenantContext.tenantSlug) {
        localStorage.setItem('signup-tenant-slug', tenantContext.tenantSlug);
      }
      if (tenantContext.email) {
        localStorage.setItem('signup-email', tenantContext.email);
      }
      
      // Get the next URL to redirect after sign-up
      const nextUrl = searchParams.get('next') || `/${tenantContext.tenantSlug}/hitl-tasks`;
      
      // Build Stack Auth sign-up URL with clientMetadata
      const signUpUrl = new URL(stackClientApp.urls.signUp);
      signUpUrl.searchParams.set('next', nextUrl);
      signUpUrl.searchParams.set('clientMetadata', JSON.stringify(clientMetadata));
      
      // Redirect to Stack Auth sign-up with tenant context
      window.location.href = signUpUrl.toString();
    } catch (err) {
      console.error('Sign-up redirect error:', err);
      setError('Failed to redirect to sign-up. Please try again.');
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Clear tenant context and go back to login
    localStorage.removeItem('tenant-slug');
    localStorage.removeItem('tenant-email');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side: Logo */}
          <div className="flex items-center space-x-4">
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
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Building className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm text-muted-foreground">
                  {tenantContext.tenantSlug || 'Unknown Tenant'}
                </span>
              </div>
              <CardTitle className="text-2xl font-bold">Access Your Workspace</CardTitle>
              <CardDescription>
                {tenantContext.email ? 
                  `Welcome back, ${tenantContext.email}` : 
                  'Sign in to your workspace or create a new account'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-3">
                <Button 
                  onClick={handleSignIn}
                  className="w-full bg-[#009DEB] hover:bg-[#007BC4] text-white" 
                  disabled={loading}
                >
                  {loading ? "Redirecting..." : "Sign In"}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSignUp}
                  variant="outline"
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Redirecting..." : "Create New Account"}
                </Button>
              </div>

              <div className="text-center">
                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  ← Use different email
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact your administrator or{" "}
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
