
import { useTenant } from './TenantProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook that provides tenant-aware navigation functions
 * Now works with subdomain-based tenant architecture
 */
export const useTenantNavigation = () => {
  const { tenantSlug } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigate to a path - simplified for subdomain architecture
   * No longer prefixes paths with tenant slug
   */
  const navigateWithTenant = useCallback((path: string) => {
    // Simply navigate to the clean path
    // Tenant context is handled by subdomain, not URL path
    navigate(path);
  }, [navigate]);

  /**
   * Get the current page path (clean path without any prefixes)
   */
  const getCurrentPagePath = useCallback(() => {
    const currentPath = location.pathname;
    const hasBasePath = currentPath.includes('/_projects/');
    const cleanPath = hasBasePath 
      ? currentPath.replace(/^\/_projects\/[^/]+\/dbtn\/devx\/ui/, '')
      : currentPath;
    
    return cleanPath || '/';
  }, [location.pathname]);

  /**
   * Check if a path is currently active
   */
  const isActivePath = useCallback((path: string) => {
    const currentPagePath = getCurrentPagePath();
    
    if (path === '/') {
      return currentPagePath === '/';
    }
    
    return currentPagePath.startsWith(path);
  }, [getCurrentPagePath]);

  /**
   * Generate a clean path (no longer tenant-aware via URL path)
   * Returns the path as-is since tenant context is in subdomain
   */
  const getTenantAwarePath = useCallback((path: string) => {
    // In subdomain architecture, just return the clean path
    // Tenant context is handled by hostname, not URL path
    return path;
  }, []);

  return {
    navigateWithTenant,
    getCurrentPagePath,
    isActivePath,
    getTenantAwarePath,
    tenantSlug,
    isTenantPrefixed: false // Always false in subdomain architecture
  };
};

/**
 * Utility function to check if we're currently in admin routes
 */
export const useIsAdminRoute = () => {
  const location = useLocation();
  
  return useCallback(() => {
    const currentPath = location.pathname;
    const hasBasePath = currentPath.includes('/_projects/');
    const cleanPath = hasBasePath 
      ? currentPath.replace(/^\/_projects\/[^/]+\/dbtn\/devx\/ui/, '')
      : currentPath;
    
    return cleanPath.startsWith('/admin-') || cleanPath.includes('/admin-');
  }, [location.pathname]);
};
