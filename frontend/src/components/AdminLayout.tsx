
import React, { useState } from 'react';
import { Button } from './ui/button';
import { useAuthenticatedUser, useSuperAdmin } from './AuthMiddleware';
import { toast } from 'sonner';
import { AdminNavigation } from './AdminNavigation';
import { Header } from './Header';
import { useTenantNavigation } from '../utils/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

type NavigationMode = 'admin' | 'tenant';

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user } = useAuthenticatedUser(); // Ensures user is authenticated
  const { isSuperAdmin, isLoading } = useSuperAdmin(); // Gets super admin status from shared context
  const { navigateWithTenant } = useTenantNavigation();
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('admin');

  const handleModeSwitch = (mode: NavigationMode) => {
    setNavigationMode(mode);
    // TODO: Implement tenant impersonation logic here
    if (mode === 'tenant') {
      toast.info('Tenant mode - select a tenant to access their functionality');
    } else {
      toast.info('Admin mode - managing platform-wide settings');
    }
  };

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not super admin, show access denied (this should rarely happen as route protection handles it)
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">Super-Admin privileges required</p>
          <Button className="mt-4" onClick={() => navigateWithTenant("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Admin Navigation Sidebar */}
      <AdminNavigation 
        currentMode={navigationMode}
        onModeSwitch={handleModeSwitch}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onToggleTheme={() => {
            // For admin layout, we can implement theme toggle or make it a no-op
            const currentTheme = localStorage.getItem('theme') || 'system';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.documentElement.className = newTheme;
          }}
          isDarkMode={localStorage.getItem('theme') === 'dark'}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
export { AdminLayout };
