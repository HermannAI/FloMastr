
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

// Auth Context Types
interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  tenantAccess: {
    [tenantSlug: string]: boolean;
  };
  error: string | null;
}

interface AuthContextValue extends AuthState {
  checkTenantAccess: (tenantSlug: string) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

// Route Metadata Types
export interface RouteMetadata {
  authRequired?: boolean;
  requireSuperAdmin?: boolean;
  requireTenantAccess?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

// Route configuration mapping paths to metadata
const ROUTE_CONFIG: Record<string, RouteMetadata> = {
  // Public routes (no auth required)
  '/': {},
  '/login': {},
  '/login/*': {}, // Allow all Clerk auth routes including MFA
  '/auth/redirect': {},
  '/auth/*': {},
  
  // Admin routes (super admin access - no auth required for super admins)
  '/admin-dashboard': { authRequired: false, requireSuperAdmin: true }, // Super admin bypass
  '/admin-policies': { authRequired: false, requireSuperAdmin: true },   // Super admin bypass
  '/admin-provisioning': { authRequired: false, requireSuperAdmin: true }, // Super admin bypass
  '/admin-tenants': { authRequired: false, requireSuperAdmin: true },    // Super admin bypass
  '/admin-users': { authRequired: false, requireSuperAdmin: true },      // Super admin bypass
  '/admin-waba-templates': { authRequired: false, requireSuperAdmin: true }, // Super admin bypass
  
  // Tenant routes (authenticated users - but super admins bypass auth)
  '/hitl-tasks': { authRequired: true },
  '/settings': { authRequired: true },
  '/task': { authRequired: true },
  '/tenant-auth': { authRequired: true },
  '/test-context-builder': { authRequired: true },
  '/test-mutation-page': { authRequired: true },
  '/workflow-install': { authRequired: true },
  '/workflows': { authRequired: true },
  '/context-builder': { authRequired: true },
  
  // Tenant-prefixed routes (e.g., /whappstream/hitl-tasks)
  '/*': { authRequired: true } // Catch-all for tenant-prefixed routes
};

// Create Auth Context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for components that require authenticated user (replaces useUserGuardContext)
export const useAuthenticatedUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    throw new Error('useAuthenticatedUser called while auth is loading');
  }
  
  if (!isAuthenticated || !user) {
    throw new Error('useAuthenticatedUser called on non-authenticated route');
  }
  
  return { user };
};

// Hook for super admin checks (replaces SuperAdminGuard logic)
export const useSuperAdmin = () => {
  const { isSuperAdmin, isAuthenticated, isLoading } = useAuth();
  
  return {
    isSuperAdmin: isAuthenticated ? isSuperAdmin : false,
    isLoading,
    isAuthenticated
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
const AuthProvider = ({ children }: AuthProviderProps) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isSuperAdmin: false,
    tenantAccess: {},
    error: null
  });

  // Cache for super admin status to prevent repeated API calls
  const [superAdminCache, setSuperAdminCache] = useState<{
    status: boolean;
    checked: boolean;
    timestamp: number;
  }>({ status: false, checked: false, timestamp: 0 });

  // Prevent concurrent API calls
  const [ongoingRequests, setOngoingRequests] = useState<{
    tenantResolution: Promise<any> | null;
    superAdminCheck: Promise<any> | null;
  }>({
    tenantResolution: null,
    superAdminCheck: null
  });

  // Cache for tenant resolution to avoid repeated calls
  const [tenantCache, setTenantCache] = useState<{
    [email: string]: {
      tenantSlug: string | null;
      timestamp: number;
      isSuperAdmin: boolean;
    }
  }>({});

  // Check if super admin status needs refresh (cache for session)
  const needsSuperAdminCheck = (user: any) => {
    if (!user) return false;
    if (!superAdminCache.checked) return true;
    
    // If cache shows false but we haven't actually called the API (due to previous bug),
    // we should recheck to ensure we get the correct status
    if (!superAdminCache.status && superAdminCache.checked) {
      // Reset cache to force recheck
      setSuperAdminCache({ status: false, checked: false, timestamp: 0 });
      return true;
    }
    
    // Cache is valid for the entire session
    return false;
  };

  // Check super admin status using Clerk user metadata or backend API
  const checkSuperAdminStatus = async (user: any): Promise<boolean> => {
    if (!user) return false;
    
    // Return cached result if available
    if (superAdminCache.checked) {
      return superAdminCache.status;
    }

    try {
      // Check if user has super admin metadata in Clerk
      const isSuperAdmin = user?.publicMetadata?.isSuperAdmin === true || 
                          user?.privateMetadata?.isSuperAdmin === true;
      
      if (isSuperAdmin) {
        setSuperAdminCache({
          status: true,
          checked: true,
          timestamp: Date.now()
        });
        return true;
      }

      // Fallback: Check via backend API if not in metadata
      console.log('Checking super admin status via tenant resolution API...');
      
      try {
        const response = await fetch(`/routes/resolve-tenant?email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress)}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Tenant resolution API response:', data);
          
          const isSuperAdmin = data.is_super_admin || false;
          
          setSuperAdminCache({
            status: isSuperAdmin,
            checked: true,
            timestamp: Date.now()
          });
          return isSuperAdmin;
        } else {
          console.error('Tenant resolution API failed:', response.status);
        }
      } catch (apiError) {
        console.error('Error calling tenant resolution API:', apiError);
      }
      
      // If API call fails, default to false
      setSuperAdminCache({
        status: false,
        checked: true,
        timestamp: Date.now()
      });
      return false;
    } catch (error) {
      console.error('Super admin check failed:', error);
      // In case of error, cache as false to prevent repeated calls
      setSuperAdminCache({
        status: false,
        checked: true,
        timestamp: Date.now()
      });
      return false;
    }
  };

  // Check tenant access
  const checkTenantAccess = async (tenantSlug: string): Promise<boolean> => {
    // Check cache first
    if (authState.tenantAccess[tenantSlug] !== undefined) {
      return authState.tenantAccess[tenantSlug];
    }

    try {
      // This would be implemented based on existing tenant validation logic
      // For now, return true as placeholder
      const hasAccess = true; // TODO: Implement actual tenant access check
      
      // Cache the result
      setAuthState(prev => ({
        ...prev,
        tenantAccess: {
          ...prev.tenantAccess,
          [tenantSlug]: hasAccess
        }
      }));
      
      return hasAccess;
    } catch (error) {
      console.error('Tenant access check failed:', error);
      return false;
    }
  };

  // Refresh auth state
  const refreshAuth = async (): Promise<void> => {
    if (!clerkLoaded) {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      return;
    }

    try {
      // Handle undefined isSignedIn (Clerk not fully loaded)
      const isAuthenticated = isSignedIn === true;
      const user = clerkUser;
      
      console.log('refreshAuth called:', {
        isSignedIn,
        isAuthenticated,
        user: user ? { email: user.primaryEmailAddress?.emailAddress } : null
      });
      
      let isSuperAdmin = false;
      if (isAuthenticated && user && needsSuperAdminCheck(user)) {
        isSuperAdmin = await checkSuperAdminStatus(user);
      } else if (superAdminCache.checked) {
        isSuperAdmin = superAdminCache.status;
      }

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated,
        isSuperAdmin,
        tenantAccess: {},
        error: null
      });
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isSuperAdmin: false,
        tenantAccess: {},
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  };

  // Initialize auth state when Clerk user changes
  useEffect(() => {
    console.log('AuthProvider useEffect triggered:', {
      clerkUser: clerkUser ? { email: clerkUser.primaryEmailAddress?.emailAddress } : null,
      clerkLoaded,
      isSignedIn,
      isSignedInType: typeof isSignedIn
    });
    refreshAuth();
  }, [clerkUser, clerkLoaded, isSignedIn]);

  const contextValue: AuthContextValue = {
    ...authState,
    checkTenantAccess,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Route Protection Component
interface RouteProtectionProps {
  children: ReactNode;
}

const RouteProtection = ({ children }: RouteProtectionProps) => {
  const { isLoading, isAuthenticated, isSuperAdmin, error, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Prevent concurrent API calls and cache results
  const [ongoingRequests, setOngoingRequests] = useState<{
    tenantResolution: Promise<any> | null;
  }>({
    tenantResolution: null
  });

  // Cache for tenant resolution to avoid repeated calls
  const [tenantCache, setTenantCache] = useState<{
    [email: string]: {
      tenantSlug: string | null;
      timestamp: number;
      isSuperAdmin: boolean;
    }
  }>({});

  const handlePostLoginRedirect = async () => {
    try {
      console.log('Starting post-login redirect. isSuperAdmin:', isSuperAdmin);

      // First check super admin status directly via API to ensure we have the latest status
      let isUserSuperAdmin = isSuperAdmin;
      if (user?.primaryEmailAddress?.emailAddress) {
        try {
          const email = user.primaryEmailAddress.emailAddress;
          console.log('Checking super admin status for email:', email);
          
          const response = await fetch(`/routes/resolve-tenant?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            isUserSuperAdmin = data.is_super_admin || false;
            console.log('Direct super admin check result:', isUserSuperAdmin);
            
            // Update the auth state if needed
            if (isUserSuperAdmin !== isSuperAdmin) {
              console.log('Updating auth state with correct super admin status');
              // Note: We can't directly update the auth state here, but the AuthProvider should handle this
            }
          }
        } catch (error) {
          console.error('Error checking super admin status:', error);
        }
      }

      // Check if user is super admin
      if (isUserSuperAdmin) {
        // Check if we're in development environment
        const isDevelopment = import.meta.env.DEV || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
          console.log('User is super admin in development, redirecting to local admin dashboard');
          // Redirect super admins to local admin dashboard in development
          navigate('/admin-dashboard', { replace: true });
        } else {
          console.log('User is super admin in production, redirecting to production admin dashboard');
          // Redirect super admins to production admin dashboard
          window.location.href = 'https://app.flomastr.com';
        }
        return;
      }

      console.log('User is not super admin, resolving tenant...');
      // For regular users, try to resolve tenant
      const { tenantSlug, isSuperAdmin: resolvedSuperAdmin } = await resolveUserTenant();
      console.log('Resolved tenant slug:', tenantSlug, 'Super admin status:', resolvedSuperAdmin);

      // If the tenant resolution shows the user is actually a super admin, handle that
      if (resolvedSuperAdmin && !isUserSuperAdmin) {
        console.log('Tenant resolution revealed user is super admin, redirecting accordingly');
        isUserSuperAdmin = true;
        // Redirect to admin dashboard
        const isDevelopment = import.meta.env.DEV || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
        
        if (isDevelopment) {
          navigate('/admin-dashboard', { replace: true });
        } else {
          window.location.href = 'https://app.flomastr.com';
        }
        return;
      }

      if (tenantSlug) {
        // Redirect to tenant-specific dashboard
        const tenantPath = `/${tenantSlug}/hitl-tasks`;
        console.log('Redirecting to tenant path:', tenantPath);
        navigate(tenantPath, { replace: true });
      } else {
        // No tenant found, redirect to general dashboard
        const nextPath = localStorage.getItem('dtbn-login-next') || '/dashboard';
        localStorage.removeItem('dtbn-login-next');
        console.log('No tenant found, redirecting to:', nextPath);
        navigate(nextPath, { replace: true });
      }
    } catch (error) {
      console.error('Error during post-login redirect:', error);
      // Fallback to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  const resolveUserTenant = async (): Promise<{ tenantSlug: string | null; isSuperAdmin: boolean }> => {
    try {
      // Use the user from component scope instead of calling useAuth hook
      if (!user?.primaryEmailAddress?.emailAddress) {
        console.log('No user email found for tenant resolution');
        return { tenantSlug: null, isSuperAdmin: false };
      }

      const email = user.primaryEmailAddress.emailAddress;
      console.log('Resolving tenant for email:', email);

      // Check cache first (cache for 5 minutes)
      const cachedResult = tenantCache[email];
      if (cachedResult && (Date.now() - cachedResult.timestamp) < 5 * 60 * 1000) {
        console.log('Using cached tenant resolution:', cachedResult);
        return { tenantSlug: cachedResult.tenantSlug, isSuperAdmin: cachedResult.isSuperAdmin };
      }

      // Check if there's already an ongoing request for this user
      if (ongoingRequests.tenantResolution) {
        console.log('Waiting for ongoing tenant resolution request...');
        return await ongoingRequests.tenantResolution;
      }

      // Create new request
      const apiUrl = `/routes/resolve-tenant?email=${encodeURIComponent(email)}`;
      console.log('Calling tenant resolution API:', apiUrl);

      const requestPromise = (async () => {
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          console.log('Tenant resolution response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Tenant resolution data:', data);
            
            const result = {
              tenantSlug: data.tenant_slug || null,
              isSuperAdmin: data.is_super_admin || false
            };

            // Cache the result
            setTenantCache(prev => ({
              ...prev,
              [email]: {
                ...result,
                timestamp: Date.now()
              }
            }));

            return result;
          } else {
            console.log('Tenant resolution failed with status:', response.status);
            const errorText = await response.text();
            console.log('Error response:', errorText);
            return { tenantSlug: null, isSuperAdmin: false };
          }
        } catch (error) {
          // Handle AbortError specifically
          if (error.name === 'AbortError') {
            console.log('Tenant resolution request was aborted (timeout or cancellation)');
          } else {
            console.error('Error in tenant resolution request:', error);
          }
          return { tenantSlug: null, isSuperAdmin: false };
        } finally {
          // Clear the ongoing request
          setOngoingRequests(prev => ({ ...prev, tenantResolution: null }));
        }
      })();

      // Store the ongoing request
      setOngoingRequests(prev => ({ ...prev, tenantResolution: requestPromise }));

      return await requestPromise;
    } catch (error) {
      console.error('Error resolving tenant:', error);
      return { tenantSlug: null, isSuperAdmin: false };
    }
  };

  // Handle post-login redirects based on user role
  useEffect(() => {
    console.log('AuthMiddleware useEffect triggered:', {
      pathname: location.pathname,
      isAuthenticated,
      isLoading,
      isSuperAdmin,
      user: user ? { email: user.primaryEmailAddress?.emailAddress } : null,
      isOnClerkRoute: location.pathname.startsWith('/login/') || location.pathname.startsWith('/sign-in/') || location.pathname.startsWith('/sign-up/')
    });

    // Only trigger redirect if we're on the auth redirect page and fully authenticated
    if (location.pathname === '/auth/redirect' && isAuthenticated && !isLoading && user) {
      console.log('Triggering post-login redirect for authenticated user');
      handlePostLoginRedirect();
    } else if (location.pathname === '/auth/redirect') {
      console.log('On auth redirect but not ready for redirect:', { isAuthenticated, isLoading, hasUser: !!user });
    }
  }, [location.pathname, isAuthenticated, isLoading, isSuperAdmin, user]);

  // Get route metadata from configuration
  const getRouteMetadata = (): RouteMetadata | null => {
    const path = location.pathname;
    
    // Check exact match first
    if (ROUTE_CONFIG[path]) {
      return ROUTE_CONFIG[path];
    }
    
    // Check for wildcard matches (like /auth/*)
    for (const configPath in ROUTE_CONFIG) {
      if (configPath.endsWith('/*')) {
        const basePath = configPath.slice(0, -2);
        if (path.startsWith(basePath)) {
          return ROUTE_CONFIG[configPath];
        }
      }
    }
    
    // Check for tenant-prefixed routes (e.g., /whappstream/hitl-tasks)
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const potentialTenantSlug = pathParts[0];
      const routePath = '/' + pathParts.slice(1).join('/');
      
      // If the second part matches a known route, treat it as a tenant route
      if (ROUTE_CONFIG[routePath]) {
        return ROUTE_CONFIG[routePath];
      }
    }
    
    // Default to requiring auth for unmatched routes
    return { authRequired: true };
  };

  const routeMetadata = getRouteMetadata();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  // Show error if auth failed
  if (error) {
    toast.error(`Authentication error: ${error}`);
    return <Navigate to="/login" replace />;
  }

  // If no route metadata, allow access (public route)
  if (!routeMetadata) {
    return <>{children}</>;
  }

  // Handle authenticated users on auth routes FIRST - before any other checks
  if (isAuthenticated && !isLoading && (location.pathname === '/login' || location.pathname.startsWith('/login/'))) {
    console.log('Authenticated user on login route, redirecting to dashboard');
    // Trigger post-login redirect logic
    handlePostLoginRedirect();
    // Return loading state while redirect happens
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  // Check authentication requirement - but allow super admins to bypass
  if (routeMetadata.authRequired && !isAuthenticated) {
    // SUPER ADMIN BYPASS: If user is a super admin, allow access even without full auth
    if (isSuperAdmin) {
      console.log('Super admin bypassing authentication requirement for:', location.pathname);
      return <>{children}</>;
    }

    // Don't redirect if user is on Clerk auth routes (including MFA)
    if (location.pathname.startsWith('/login/') || location.pathname.startsWith('/sign-in/') || location.pathname.startsWith('/sign-up/')) {
      console.log('Allowing access to Clerk auth route:', location.pathname);
      return <>{children}</>;
    }

    // Store current path for redirect after login
    localStorage.setItem('dtbn-login-next', location.pathname + location.search);
    console.log('Redirecting to login from:', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Check super admin requirement - but this is now just informational since we bypass auth above
  if (routeMetadata.requireSuperAdmin && !isSuperAdmin) {
    // If we get here and the user isn't authenticated, it means they need to login to check super admin status
    if (!isAuthenticated) {
      // Store current path for redirect after login
      localStorage.setItem('dtbn-login-next', location.pathname + location.search);
      console.log('Redirecting to login to check super admin status:', location.pathname);
      return <Navigate to="/login" replace />;
    }
    
    toast.error('Access denied: Super admin privileges required');
    return <Navigate to="/" replace />;
  }

  // TODO: Add tenant access checks when needed
  // if (routeMetadata.requireTenantAccess) {
  //   // Check tenant access
  // }

  // All checks passed, render children
  return <>{children}</>;
};

// Main Auth Middleware Component
interface AuthMiddlewareProps {
  children: ReactNode;
}

export const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
  return (
    <AuthProvider>
      <RouteProtection>
        {children}
      </RouteProtection>
    </AuthProvider>
  );
};

export default AuthMiddleware;
