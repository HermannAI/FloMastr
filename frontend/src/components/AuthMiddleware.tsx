
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import { toast } from 'sonner';
import brain from 'brain';
import { mode, Mode } from 'app';

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
  '/auth/redirect': {},
  '/auth/*': {},
  
  // Protected routes (auth required)
  '/admin-dashboard': { authRequired: true, requireSuperAdmin: true },
  '/admin-policies': { authRequired: true, requireSuperAdmin: true },
  '/admin-provisioning': { authRequired: true, requireSuperAdmin: true },
  '/admin-tenants': { authRequired: true, requireSuperAdmin: true },
  '/admin-users': { authRequired: true, requireSuperAdmin: true },
  '/admin-waba-templates': { authRequired: true, requireSuperAdmin: true },
  '/context-builder': { authRequired: true },
  '/hitl-tasks': { authRequired: true },
  '/settings': { authRequired: true },
  '/task': { authRequired: true },
  '/tenant-auth': { authRequired: true },
  '/test-context-builder': { authRequired: true },
  '/test-mutation-page': { authRequired: true },
  '/workflow-install': { authRequired: true },
  '/workflows': { authRequired: true }
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
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const stackUser = useUser();
  
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

  // Check if super admin status needs refresh (cache for session)
  const needsSuperAdminCheck = (user: any) => {
    if (!user) return false;
    if (!superAdminCache.checked) return true;
    
    // Cache is valid for the entire session
    return false;
  };

  // Check super admin status
  const checkSuperAdminStatus = async (user: any): Promise<boolean> => {
    if (!user) return false;
    
    // Return cached result if available
    if (superAdminCache.checked) {
      return superAdminCache.status;
    }

    try {
      const response = await brain.check_super_admin();
      const result = await response.json();
      const isSuperAdmin = result.is_super_admin || false;
      
      // Cache the result for the session
      setSuperAdminCache({
        status: isSuperAdmin,
        checked: true,
        timestamp: Date.now()
      });
      
      return isSuperAdmin;
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
    if (!stackUser) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        isSuperAdmin: false,
        tenantAccess: {},
        error: null
      });
      return;
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const isSuperAdmin = await checkSuperAdminStatus(stackUser);
      
      setAuthState({
        user: stackUser,
        isLoading: false,
        isAuthenticated: true,
        isSuperAdmin,
        tenantAccess: {}, // Will be populated as needed
        error: null
      });
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Authentication failed'
      }));
    }
  };

  // Initialize auth state when user changes
  useEffect(() => {
    refreshAuth();
  }, [stackUser]);

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

const RouteProtection: React.FC<RouteProtectionProps> = ({ children }) => {
  const { isLoading, isAuthenticated, isSuperAdmin, error } = useAuth();
  const location = useLocation();

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

  // Check authentication requirement
  if (routeMetadata.authRequired && !isAuthenticated) {
    // Store current path for redirect after login
    localStorage.setItem('dtbn-login-next', location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  // Check super admin requirement
  if (routeMetadata.requireSuperAdmin && !isSuperAdmin) {
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
