import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Clock, User, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import brain from 'brain';
import { useTenant } from 'utils/TenantProvider';
import type { HitlTask } from 'types';

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

  const { data: tasks, isLoading: loading } = useQuery({
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
    <div className="space-y-6">
      {/* Header - moved outside card to match ContextBuilder layout */}
      <div className="border-b px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://static.databutton.com/public/15880048-1dbd-4cea-820f-d5fbc363499d/Whapp Stream.png" 
              alt="WhappStream" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold">WhappStream Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Contextual conversations with your audience
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          {tasks.length === 0 ? (
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
  );
};

export default HitlTasks;
