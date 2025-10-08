

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
// import { useUserGuardContext } from 'app/auth';
// import { LoginRedirect } from 'app/auth';
import brain from '../brain';
import { mode, Mode } from 'app';

const popFromLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const value = localStorage.getItem(key);
    localStorage.removeItem(key);
    return value;
  }
  return null;
};

const isSuperAdmin = (email: string): boolean => {
  if (mode === Mode.DEV) {
    return email === 'hermann@changemastr.com';
  }
  
  // In production, we'll need to check against the backend
  // For now, return false for safety
  return false;
};

export const CustomLoginRedirect = () => {
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get query params for next URL
        const queryParams = new URLSearchParams(window.location.search);
        const next = queryParams.get('next') || popFromLocalStorage('dtbn-login-next');
        
        if (mode === Mode.PROD) {
          // In production, check admin status via backend
          try {
            const response = await brain.check_super_admin();
            const result = await response.json();
            
            if (result.is_super_admin) {
              setRedirectPath('/admin-dashboard'); // Use existing route path
            } else {
              setRedirectPath(next || '/');
            }
          } catch (error) {
            console.error('Failed to check admin status:', error);
            // Fallback to regular redirect if admin check fails
            setRedirectPath(next || '/');
          }
        } else {
          // Development mode fallback
          setRedirectPath(next || '/');
        }
      } catch (error) {
        console.error('Error in admin status check:', error);
        setRedirectPath('/');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    // Only run once on mount
    if (isCheckingAdmin) {
      checkAdminStatus();
    }
  }, []); // Remove dependencies to prevent infinite loop

  // Show loading while checking
  if (isCheckingAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to determined path
  if (redirectPath) {
    return <Navigate to={redirectPath} replace={true} />;
  }
  
  // Fallback to default login page
  return <Navigate to="/login" replace={true} />;
};
