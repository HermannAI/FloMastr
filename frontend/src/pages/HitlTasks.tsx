import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import brain from 'brain';
import { useTenant } from 'utils/TenantProvider';
import type { HitlTask } from '../brain/data-contracts';

// Fetch tasks from the API
const fetchTasks = async (): Promise<HitlTask[]> => {
  const response = await brain.get_hitl_tasks();
  return response.json();
};

const HitlTasks: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);

  // Set current tenant from context
  useEffect(() => {
    if (tenantSlug) {
      setCurrentTenant(tenantSlug);
    }
  }, [tenantSlug]);

  const { data: tasks = [], isLoading: loading, error } = useQuery({
    queryKey: ['hitl-tasks'],
    queryFn: fetchTasks,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  const handleRowClick = (taskId: string) => {
    navigate(`/task?id=${taskId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'new':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="text-center">Loading inbox...</div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">HITL Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage human-in-the-loop tasks for your workspace
          </p>
        </div>

        <Card>
          <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tasks...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Create a task to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow 
                    key={task.task_id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(task.task_id)}
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                    <TableCell>
                      <Badge className={`text-white ${getStatusColor(task.status)}`}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(task.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{task.assigned_to || "Unassigned"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
};

export default HitlTasks;
