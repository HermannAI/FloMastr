
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantProvider } from "utils/TenantProvider";
import { AuthMiddleware } from "components/AuthMiddleware";
import { APP_BASE_PATH } from "app";
import { useLocation, Navigate } from "react-router-dom";
import { StackHandlerRoutes, LoginRedirect } from "app/auth";

interface AppProviderProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 404 errors to prevent spam
        if (error?.status === 404) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

/**
 * AuthRouteHandler handles tenant-prefixed auth routes and auth redirects
 */
function AuthRouteHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Handle auth redirect after login with tenant context
  if (location.pathname === '/auth/redirect') {
    // Check if there's tenant context from the login flow
    const tenantContext = localStorage.getItem('tenant-context');
    
    if (tenantContext) {
      try {
        const context = JSON.parse(tenantContext);
        // Clean up the stored context after use
        localStorage.removeItem('tenant-context');
        // Redirect to clean path (no tenant slug prefix for subdomain architecture)
        return <Navigate to={context.returnPath} replace={true} />;
      } catch (e) {
        console.warn('Failed to parse tenant context:', e);
      }
    }
    
    // Check for basic tenant slug
    const tenantSlug = localStorage.getItem('tenant-slug');
    if (tenantSlug) {
      const queryParams = new URLSearchParams(location.search);
      const next = queryParams.get('next') || '/hitl-tasks';
      // Use clean path for subdomain architecture
      return <Navigate to={next} replace={true} />;
    }
    
    // Fall back to default LoginRedirect for non-tenant users
    return <LoginRedirect />;
  }

  // Handle tenant-prefixed auth routes like /whappstream/auth/sign-in
  const tenantAuthMatch = location.pathname.match(/^\/([^/]+)\/auth\/(.*)/); 
  if (tenantAuthMatch) {
    const [, tenantSlug] = tenantAuthMatch;
    // Store tenant slug for context and render Stack Auth
    localStorage.setItem('tenant-slug', tenantSlug);
    return <StackHandlerRoutes />;
  }
  
  // Handle regular auth routes (missing from auto-generated router)
  if (location.pathname.startsWith('/auth/')) {
    return <StackHandlerRoutes />;
  }
  
  return <>{children}</>;
}

/**
 * AppProvider is the main provider for the app.
 * It wraps the app with all the necessary providers.
 * 
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 * Note: ThemeProvider is already included in AppWrapper.tsx and does not need to be added here.
 */
export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthMiddleware>
        <TenantProvider>
          <AuthRouteHandler>
            {children}
          </AuthRouteHandler>
        </TenantProvider>
      </AuthMiddleware>
    </QueryClientProvider>
  );
}
