

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '../components/ui/dialog';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from '../components/ui/alert-dialog';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '../components/ui/table';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Shield, User, Crown, Users } from 'lucide-react';
import brain, { UserRole } from '../brain';
import { AdminLayout } from '../components/AdminLayout';
import { useSuperAdmin } from '../components/AuthMiddleware';

interface UserRoleInfo {
  id: string;
  email: string;
  role: UserRole;
  assigned_by?: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

interface NewUserData {
  email: string;
  role: UserRole;
}

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const { isSuperAdmin, isLoading: authLoading } = useSuperAdmin();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserData>({ email: '', role: 'user' });
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Fetch users query - only if user is confirmed super admin
  const { data: users = [], isLoading, error } = useQuery<UserRoleInfo[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await brain.list_users();
      return await response.json();
    },
    retry: (failureCount, error: any) => {
      console.log('AdminUsers: Query failed', failureCount, error);
      // Don't retry on 403/401 errors (authentication/authorization issues)
      if (error?.status === 403 || error?.status === 401) {
        return false;
      }
      return failureCount < 1;
    },
    enabled: isSuperAdmin && !authLoading, // Only run if user is super admin
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUserData) => {
      const response = await brain.create_user_role(userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User role created successfully');
      setIsAddDialogOpen(false);
      setNewUserData({ email: '', role: 'user' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user role');
    },
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    createUserMutation.mutate(newUserData);
  };

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show access denied only if user is not a super admin
  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to view this page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show error only for actual API errors when user is authenticated as super admin
  if (error && isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Users</h1>
            <p className="text-muted-foreground">Failed to load user data. Please try again.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage user roles and permissions</p>
            </div>
          </div>
          
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User Role
          </Button>

          {/* Add User Modal */}
          {isAddDialogOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Add User Role</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Assign a role to a user. The user will be created if they don't exist.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      value={newUserData.role}
                      onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a role</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>
              View and manage user permissions. You can add new user roles, but updates and deletions must be done through the backend API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">User</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Assigned By</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Assigned At</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-600">
                        {user.assigned_by || 'System'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-600">
                        {new Date(user.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Actions disabled - only create and list operations are supported */}
                          <span className="text-sm text-gray-500">View only</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
