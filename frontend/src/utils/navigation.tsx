
import { useTenant } from './TenantProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook that provides tenant-aware navigation functions
 * Works with path-based tenant architecture (/tenantSlug/page)
 */
export const useTenantNavigation = () => {
  const { tenantSlug } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigate to a path with tenant context
   * Paths should already include tenant slug prefix (e.g., /acme/hitl-tasks)
   */
  const navigateWithTenant = useCallback((path: string) => {
    // Navigate to the path as-is (should already include tenant slug)
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
   * Generate a tenant-aware path by prefixing with tenant slug
   * Returns path with tenant prefix (e.g., /acme/hitl-tasks)
   */
  const getTenantAwarePath = useCallback((path: string) => {
    // If no tenant slug or path already has tenant prefix, return as-is
    if (!tenantSlug || path.startsWith(`/${tenantSlug}/`)) {
      return path;
    }
    // Add tenant slug prefix to path
    return `/${tenantSlug}${path.startsWith('/') ? path : `/${path}`}`;
  }, [tenantSlug]);

  return {
    navigateWithTenant,
    getCurrentPagePath,
    isActivePath,
    getTenantAwarePath,
    tenantSlug,
    isTenantPrefixed: tenantSlug !== null // True if we have a tenant context
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
