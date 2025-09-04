import React from 'react';
import { UserGuard, useUserGuardContext } from 'app/auth';
import { useTenant } from 'utils/TenantProvider';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import brain from 'brain';

interface TenantUserGuardProps {
  children: React.ReactNode;
}

/**
 * Component that validates user has access to the current tenant
 * Must be used inside a UserGuard
 */
const TenantValidator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUserGuardContext(); // User is guaranteed to exist here
  const { tenant, tenantSlug, isLoading, error, isValidTenant } = useTenant();
  const navigate = useNavigate();
  const [isValidatingAccess, setIsValidatingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const validateUserTenantAccess = async () => {
      if (!tenant || !user) return;
      
      setIsValidatingAccess(true);
      setAccessError(null);
      
      try {
        // Check if user has access to this tenant
        // This could be done by checking user permissions, tenant membership, etc.
        // For now, we'll do a simple check by trying to access a protected endpoint
        
        // Try to get tenant profile to validate access
        const response = await brain.get_tenant_profile();
        
        if (response.ok) {
          setHasAccess(true);
        } else {
          setAccessError('You do not have access to this tenant');
          setHasAccess(false);
        }
      } catch (err: any) {
        console.error('Error validating tenant access:', err);
        if (err.status === 403) {
          setAccessError('You do not have permission to access this tenant');
        } else if (err.status === 404) {
          setAccessError('Tenant not found or you do not have access');
        } else {
          setAccessError('Failed to validate tenant access');
        }
        setHasAccess(false);
      } finally {
        setIsValidatingAccess(false);
      }
    };
    
    if (isValidTenant && tenant && user) {
      validateUserTenantAccess();
    }
  }, [isValidTenant, tenant, user]);

  // Show loading state while resolving tenant
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Resolving tenant...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if tenant resolution failed
  if (error || !isValidTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Tenant Not Found
            </CardTitle>
            <CardDescription>
              {error || 'The requested tenant could not be found or is inactive.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  {tenantSlug ? (
                    <>Tenant slug: <code className="text-sm font-mono">{tenantSlug}</code></>
                  ) : (
                    'No tenant slug found in URL'
                  )}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while validating user access
  if (isValidatingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Validating access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if user doesn't have access to tenant
  if (accessError || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              {accessError || 'You do not have permission to access this tenant.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Tenant: <strong>{tenant?.name}</strong> ({tenant?.slug})
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/auth/sign-out'}
                  className="flex-1"
                >
                  Sign Out
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
};

/**
 * Enhanced UserGuard that validates both authentication and tenant access
 * Combines UserGuard (auth check) with TenantValidator (tenant access check)
 */
export const TenantUserGuard: React.FC<TenantUserGuardProps> = ({ children }) => {
  return (
    <UserGuard>
      <TenantValidator>
        {children}
      </TenantValidator>
    </UserGuard>
  );
};
