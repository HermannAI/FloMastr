


import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@stackframe/react';
import brain from 'brain';

interface TenantInfo {
  id: number;
  slug: string;
  name: string;
  n8n_url: string;
  status: string;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  tenantSlug: string | null;
  isLoading: boolean;
  error: string | null;
  isValidTenant: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Hook to access tenant context
 * Must be used within a TenantProvider
 */
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

/**
 * Extracts tenant slug from hostname format: {tenant_slug}.flomastr.com
 * Returns null for the base admin domain (app.flomastr.com)
 */
const extractTenantSlugFromHostname = (hostname: string): string | null => {
  // Handle localhost and development environments
  if (hostname.includes('localhost') || hostname.includes('databutton.com')) {
    return null;
  }
  
  // Check if this is the base admin domain
  if (hostname === 'app.flomastr.com') {
    return null;
  }
  
  // Extract tenant slug from subdomain pattern: {tenant_slug}.flomastr.com
  const parts = hostname.split('.');
  
  // Must have at least 3 parts: [tenant_slug, flomastr, com]
  if (parts.length < 3) {
    return null;
  }
  
  // Check if it's a flomastr.com subdomain
  const domain = parts.slice(-2).join('.'); // Get 'flomastr.com'
  if (domain !== 'flomastr.com') {
    return null;
  }
  
  // Return the first part as tenant slug
  const tenantSlug = parts[0];
  
  // Validate tenant slug format (basic validation)
  if (!tenantSlug || tenantSlug === 'app' || tenantSlug === 'www') {
    return null;
  }
  
  return tenantSlug;
};

/**
 * Provides tenant context based on hostname subdomain
 * Supports both admin domain (app.flomastr.com) and tenant subdomains ({tenant_slug}.flomastr.com)
 */
export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidTenant, setIsValidTenant] = useState(false);
  const location = useLocation();
  const user = useUser();

  useEffect(() => {
    const resolveTenant = async () => {
      // Skip tenant resolution on auth pages to prevent redirect loops during sign-in
      if (location.pathname.startsWith('/auth/')) {
        setTenant(null);
        setTenantSlug(null);
        setIsValidTenant(false);
        setIsLoading(false);
        setError(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Extract tenant slug from hostname instead of URL path
        const extractedSlug = extractTenantSlugFromHostname(window.location.hostname);
        
        if (extractedSlug) {
          // Try to resolve tenant by slug
          try {
            const response = await brain.get_tenant_by_slug({ tenantSlug: extractedSlug });
            const tenantData = await response.json();
            
            setTenant(tenantData);
            setTenantSlug(extractedSlug);
            setIsValidTenant(true);
          } catch (tenantError: any) {
            if (tenantError.status === 404) {
              setError(`Tenant '${extractedSlug}' not found`);
              setIsValidTenant(false);
            } else {
              throw tenantError;
            }
          }
        } else {
          // No tenant slug in hostname - try to resolve by user email if logged in
          if (user?.primaryEmail) {
            try {
              const response = await brain.resolve_tenant({ email: user.primaryEmail });
              const resolveData = await response.json();
              
              if (resolveData.found && resolveData.tenant_slug) {
                // Get full tenant details
                const tenantResponse = await brain.get_tenant_by_slug({ tenantSlug: resolveData.tenant_slug });
                const tenantData = await tenantResponse.json();
                
                setTenant(tenantData);
                setTenantSlug(resolveData.tenant_slug);
                setIsValidTenant(true);
              } else {
                // User has no associated tenant - use fallback
                setTenant(null);
                setTenantSlug(null);
                setIsValidTenant(false);
              }
            } catch (resolveError) {
              console.warn('Failed to resolve tenant by email:', resolveError);
              // Don't set error for unresolved email - just use fallback
              setTenant(null);
              setTenantSlug(null);
              setIsValidTenant(false);
            }
          } else {
            // No user logged in or no email - no tenant context needed
            setTenant(null);
            setTenantSlug(null);
            setIsValidTenant(false);
          }
        }
      } catch (error: any) {
        console.error('Error resolving tenant:', error);
        setError(error.message || 'Failed to resolve tenant');
        setIsValidTenant(false);
      } finally {
        setIsLoading(false);
      }
    };

    resolveTenant();
  }, [location.pathname, user?.primaryEmail]); // Note: keeping location.pathname for auth page detection

  const contextValue: TenantContextType = {
    tenant,
    tenantSlug,
    isLoading,
    error,
    isValidTenant
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
