


import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useClerk, useUser } from '@clerk/clerk-react';
import { 
  Users, 
  Settings, 
  Package, 
  MessageSquare, 
  Activity, 
  Database,
  Building2,
  Shield,
  LayoutDashboard,
  ChevronDown,
  ToggleLeft,
  LogOut
} from 'lucide-react';
import { useAuthenticatedUser } from './AuthMiddleware';
// import { stackClientApp } from 'app/auth';

interface AdminNavigationProps {
  currentMode?: 'admin' | 'tenant';
  onModeSwitch?: (mode: 'admin' | 'tenant') => void;
}

export const AdminNavigation = ({ currentMode = 'admin', onModeSwitch }: AdminNavigationProps) => {
  const { user: clerkUser } = useUser(); // Get user directly from Clerk
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Use Clerk user directly
  const user = clerkUser;

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSignOut = async () => {
    try {
      // Use Clerk's sign out functionality
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigationSections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      items: [
        { path: '/admin-dashboard', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    {
      id: 'platform',
      title: 'Platform Management',
      items: [
        { path: '/admin-tenants', label: 'Tenants', icon: Building2 },
        { path: '/admin-users', label: 'Users', icon: Users },
        { path: '/admin-policies', label: 'Policies', icon: Shield }
      ]
    },
    {
      id: 'operations',
      title: 'Operations',
      items: [
        { path: '/admin-provisioning', label: 'Provisioning', icon: Activity },
        { path: '/test-context-builder', label: 'Context Builder', icon: Database },
        { path: '/admin-waba-templates', label: 'WABA Templates', icon: MessageSquare }
      ]
    }
  ];

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">System Management</p>
          </div>
        </div>
        
        {/* Mode Switcher */}
        <Button variant="outline" className="w-full justify-center">
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            <span>{currentMode === 'admin' ? 'Admin Mode' : 'Tenant Mode'}</span>
          </div>
        </Button>
      </div>
      
      <div className="border-t border-gray-200 my-4" />
      
      {/* Navigation Sections */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationSections.map((section) => {
          const isCollapsed = collapsedSections[section.id];
          
          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              {section.title && (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full px-2 py-2 text-xs font-medium text-gray-300 uppercase tracking-wider hover:text-gray-100 transition-colors"
                >
                  <span>{section.title}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
              )}
              
              {/* Section Items */}
              {!isCollapsed && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
                          }`
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      <div className="border-t border-gray-200 my-4" />
      
      {/* User Info & Sign Out */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary/10 border border-border rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(() => {
              // Use correct Clerk properties
              let profileUrl = null;
              if (user?.hasImage && user?.imageUrl) {
                profileUrl = user.imageUrl;
              }
              
              return profileUrl ? (
                <img
                  src={profileUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('AdminNavigation profile picture failed to load:', profileUrl);
                    // Fallback to user icon if image fails to load
                    const container = e.currentTarget.parentElement;
                    if (container) {
                      container.innerHTML = '<svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
                    }
                  }}
                />
              ) : (
                <Users className="h-4 w-4 text-primary" />
              );
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName || user?.lastName || 'Admin User'}
            </p>
            <p className="text-xs text-gray-300 truncate">
              {user?.primaryEmailAddress?.emailAddress || 
               user?.emailAddresses?.[0]?.emailAddress || 
               'admin@changemastr.com'}
            </p>
            <p className="text-xs text-primary font-medium">Super Administrator</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
