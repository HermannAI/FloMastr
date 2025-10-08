import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import brain from '../brain';
import { useTenant } from '../utils/TenantProvider';
import type { HitlTaskDetail } from '../brain/data-contracts';

// Fetch task detail from the API
const fetchTaskDetail = async (taskId: string): Promise<HitlTaskDetail> => {
  const response = await brain.get_hitl_task_detail({ taskId });
  return response.json();
};

interface PayloadComponent {
  component_type: string;
  text_content?: string;
  [key: string]: any;
}

interface PayloadBlock {
  block_type: string;
  components: PayloadComponent[];
}

const Task: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { tenantSlug } = useTenant();

  const { data: task, isLoading: taskLoading, error: taskError } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => fetchTaskDetail(taskId!),
    enabled: !!taskId,
  });

  const { data: tenantInfo, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant-info', tenantSlug],
    queryFn: () => ({ tenant_slug: tenantSlug }),
    enabled: !!tenantSlug,
  });

  return (
    <Layout>
      <h1>Task Detail</h1>
      <p>Task ID: {taskId}</p>
      <p>Tenant Slug: {tenantSlug}</p>
    </Layout>
  );
};

export default Task;
