
import React from 'react';
import { Button } from './ui/button';
import { Sun, Moon, Settings, Users, Package, Database, MessageSquare, LayoutDashboard, User } from 'lucide-react';
import { useTenant } from '../utils/TenantProvider';
import { useAuth } from './AuthMiddleware';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

interface HeaderProps {
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleTheme, isDarkMode }) => {
  const { tenant, tenantSlug } = useTenant();
  const { isSuperAdmin, isAuthenticated } = useAuth();
  const { user: clerkUser } = useUser(); // Get user directly from Clerk
  const navigate = useNavigate();
  const location = useLocation();

  // Use Clerk user directly for profile information
  const user = clerkUser;

  // Get user information from Clerk
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
  
  // Use correct Clerk properties
  let userProfilePicture = null;
  if (user?.hasImage && user?.imageUrl) {
    userProfilePicture = user.imageUrl;
  }
  
  const userFirstName = user?.firstName;
  const userLastName = user?.lastName;

  // FloMastr static logo URL
  const FLOMASTR_LOGO_URL = "/FloMastr-Logo.png";

  // Admin navigation items
  const adminNavItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin-tenants', label: 'Tenants', icon: Users },
    { path: '/admin-users', label: 'Users', icon: Users },
    { path: '/admin-provisioning', label: 'Provisioning', icon: Package },
    { path: '/admin-policies', label: 'Policies', icon: Database },
    { path: '/admin-waba-templates', label: 'WABA Templates', icon: MessageSquare },
  ];

  // Tenant navigation items
  const tenantNavItems = [
    { path: '/hitl-tasks', label: 'HITL Tasks', icon: Settings },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/workflows', label: 'Workflows', icon: Package },
  ];

  const navItems = isSuperAdmin ? adminNavItems : tenantNavItems;

  return (
    <header className="border-b border-border px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side: Logo and Company Name */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-border flex items-center justify-center flex-shrink-0">
              <img
                src={FLOMASTR_LOGO_URL}
                alt="FloMastr"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  console.error('Failed to load FloMastr logo:', e);
                  // Show fallback text
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    container.innerHTML = '<span class="text-primary font-bold text-sm">FM</span>';
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {tenant?.name || 'FloMastr'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin ? 'Admin Dashboard' : 'AI Business Partner'}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Navigation Menu */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </nav>
        )}

        {/* Right side: User Profile and Theme Toggle */}
        <div className="flex items-center space-x-4">
          {/* User Profile Section */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-3">
              {/* Mobile: Show only profile picture and email */}
              <div className="text-right sm:hidden">
                <p className="text-xs text-muted-foreground">
                  {userEmail}
                </p>
                {isSuperAdmin && (
                  <p className="text-xs text-primary font-medium">
                    Super Admin
                  </p>
                )}
              </div>
              
              {/* Desktop: Show full user info */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {userFirstName && userLastName ? `${userFirstName} ${userLastName}` : 'Admin User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userEmail}
                </p>
                {isSuperAdmin && (
                  <p className="text-xs text-primary font-medium">
                    Super Administrator
                  </p>
                )}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                {userProfilePicture ? (
                  <img
                    src={userProfilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Header profile picture failed to load:', userProfilePicture);
                      // Fallback to user icon if image fails to load
                      const container = e.currentTarget.parentElement;
                      if (container) {
                        container.innerHTML = '<svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                      }
                    }}
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
