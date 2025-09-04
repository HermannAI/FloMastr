


import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthenticatedUser } from 'components/AuthMiddleware';
import { stackClientApp } from 'app/auth';

interface AdminNavigationProps {
  currentMode?: 'admin' | 'tenant';
  onModeSwitch?: (mode: 'admin' | 'tenant') => void;
}

export const AdminNavigation = ({ currentMode = 'admin', onModeSwitch }: AdminNavigationProps) => {
  const { user } = useAuthenticatedUser(); // Use consolidated auth context
  const navigate = useNavigate();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSignOut = async () => {
    try {
      await stackClientApp.signOut();
      navigate('/auth/sign-in');
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" />
                <span>{currentMode === 'admin' ? 'Admin Mode' : 'Tenant Mode'}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Navigation Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onModeSwitch?.('admin')}
              className={currentMode === 'admin' ? 'bg-accent' : ''}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Mode
              {currentMode === 'admin' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onModeSwitch?.('tenant')}
              className={currentMode === 'tenant' ? 'bg-accent' : ''}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Tenant Mode
              {currentMode === 'tenant' && <Badge variant="secondary" className="ml-auto">Active</Badge>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Separator />
      
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
      
      <Separator />
      
      {/* User Info & Sign Out */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">
              {user.primaryEmail || user.email || 'Admin User'}
            </p>
            <p className="text-xs text-gray-300">Super Administrator</p>
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
