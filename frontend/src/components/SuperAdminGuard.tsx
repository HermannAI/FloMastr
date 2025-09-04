
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from 'components/AuthMiddleware';
import { toast } from 'sonner';

interface Props {
  children: React.ReactNode;
}

export const SuperAdminGuard = ({ children }: Props) => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading, isAuthenticated } = useSuperAdmin();

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, let the main auth middleware handle redirect
  if (!isAuthenticated) {
    return null;
  }

  // If authenticated but not super admin, show error and redirect
  if (!isSuperAdmin) {
    toast.error('Access denied: Super admin privileges required');
    navigate('/');
    return null;
  }

  // User is authenticated and is super admin - render children
  return <>{children}</>;
};
