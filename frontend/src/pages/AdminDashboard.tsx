



import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Package, Settings, Activity, Database, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import brain from 'brain';
import { AdminLayout } from 'components/AdminLayout';

interface DashboardStats {
  totalTenants: number;
  activeBundles: number;
  pendingTasks: number;
  totalUsers: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    activeBundles: 0,
    pendingTasks: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load dashboard statistics
        const [tenantsResponse, usersResponse] = await Promise.allSettled([
          brain.list_tenants(),
          brain.list_users()
        ]);

        const newStats: DashboardStats = {
          totalTenants: tenantsResponse.status === 'fulfilled' ? 
            (await tenantsResponse.value.json()).length : 0,
          activeBundles: 0, // Placeholder until bundles API is implemented
          totalUsers: usersResponse.status === 'fulfilled' ? 
            (await usersResponse.value.json()).length : 0,
          pendingTasks: 0 // Will implement when HITL tasks endpoint is available
        };

        setStats(newStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Manage Tenants',
      description: 'View and configure tenant organizations',
      icon: Users,
      action: () => navigate('/admin-tenants'),
      count: stats.totalTenants
    },
    {
      title: 'Workflow Bundles',
      description: 'Deploy and manage workflow packages',
      icon: Package,
      action: () => navigate('/admin-bundles'),
      count: stats.activeBundles
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: Settings,
      action: () => navigate('/admin-users'),
      count: stats.totalUsers
    },
    {
      title: 'System Policies',
      description: 'Configure global policies and settings',
      icon: Database,
      action: () => navigate('/admin-policies'),
      count: null
    },
    {
      title: 'WABA Templates',
      description: 'Manage WhatsApp Business templates',
      icon: MessageSquare,
      action: () => navigate('/admin-waba-templates'),
      count: null
    },
    {
      title: 'Tenant Provisioning',
      description: 'Create and configure new tenants',
      icon: Users,
      action: () => navigate('/admin-provisioning'),
      count: null
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-400">
            Platform management and system administration
          </p>
          <Badge variant="outline" className="w-fit">
            Super Administrator
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalTenants}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bundles</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.activeBundles}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalUsers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.pendingTasks}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8" style={{color: 'var(--brand-primary)'}} />
                      {action.count !== null && (
                        <Badge variant="secondary">{action.count}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                    <Button className="w-full mt-4" variant="outline">
                      Open
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
