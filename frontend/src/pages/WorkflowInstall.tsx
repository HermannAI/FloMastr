

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useTenant } from "utils/TenantProvider";
import brain from "brain";
import { WorkflowResponse } from "types";

type SetupState = 'loading' | 'ready' | 'in-progress' | 'completed' | 'error' | 'human-requested';

export default function WorkflowInstall() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupState, setSetupState] = useState<SetupState>('loading');
  const [installationInProgress, setInstallationInProgress] = useState(false);
  const [installedWorkflowId, setInstalledWorkflowId] = useState<string | null>(null);

  // Fetch workflow details and install to tenant
  useEffect(() => {
    const fetchAndInstallWorkflow = async () => {
      if (!workflowId || !tenant) {
        if (!workflowId) setError('Workflow ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Step 1: Fetch workflow template details
        const response = await brain.get_workflow_templates({});
        const data = await response.json();
        
        const foundWorkflow = data.workflows.find((w: WorkflowResponse) => w.id === workflowId);
        
        if (!foundWorkflow) {
          setError('Workflow not found');
          return;
        }
        
        setWorkflow(foundWorkflow);
        
        // Step 2: Install workflow to tenant n8n instance
        setInstallationInProgress(true);
        setSetupState('in-progress');
        
        const installResponse = await brain.install_workflow({
          master_workflow_id: workflowId,
          tenant_slug: tenant.slug
        });
        
        const installData = await installResponse.json();
        
        if (installData.success && installData.tenant_workflow_id) {
          setInstalledWorkflowId(installData.tenant_workflow_id);
          setSetupState('ready');
          console.log('Workflow installed successfully:', installData.tenant_workflow_id);
        } else {
          throw new Error(installData.message || 'Installation failed');
        }
        
      } catch (err) {
        console.error('Failed to fetch or install workflow:', err);
        setError('Failed to load or install workflow. Please try again.');
        setSetupState('error');
      } finally {
        setLoading(false);
        setInstallationInProgress(false);
      }
    };

    fetchAndInstallWorkflow();
  }, [workflowId, tenant]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production, verify event.origin matches tenant n8n domain
      if (event.data?.type === 'setup_done') {
        if (event.data.status === 'pending_human') {
          setSetupState('human-requested');
        } else if (event.data.status === 'completed') {
          setSetupState('completed');
        } else {
          setSetupState('error');
        }
      } else if (event.data?.type === 'setup_started') {
        setSetupState('in-progress');
      } else if (event.data?.type === 'setup_error') {
        setSetupState('error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCancel = () => {
    navigate('/workflows');
  };

  const handleRequestHuman = () => {
    setSetupState('human-requested');
    // In real app, this would make an API call to request human setup
    console.log('Human setup requested for workflow:', workflowId);
  };

  const handleRetry = () => {
    setSetupState('ready');
    // Reload iframe
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Construct iframe URL
  const iframeUrl = tenant && installedWorkflowId
    ? `https://${tenant.slug}.n8n.flomastr.com/workflow-setup/${installedWorkflowId}?embed=true&theme=${theme}&brand_primary=${encodeURIComponent(tenant.branding?.primary_color || '#0052cc')}`
    : null;

  if (loading || tenantLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {installationInProgress ? 'Installing workflow to your instance...' : 'Loading workflow details...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold">Installation Failed</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!workflow || !tenant || !installedWorkflowId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Preparing workflow installation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]">
      <Header 
        onToggleTheme={() => {
          const currentTheme = localStorage.getItem('theme') || 'system';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('theme', newTheme);
          document.documentElement.className = newTheme;
        }}
        isDarkMode={localStorage.getItem('theme') === 'dark'}
      />
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Back to Workflows</span>
        </div>

        {/* Workflow header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {workflow.icon_url ? (
                <img src={workflow.icon_url} alt={workflow.name} className="w-8 h-8" />
              ) : (
                <div className="w-8 h-8 rounded bg-primary/20" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold mb-2">{workflow.name}</h1>
              <p className="text-muted-foreground mb-4">{workflow.description}</p>
              <div className="flex flex-wrap gap-2">
                {workflow.tags?.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Setup progress */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              setupState === 'loading' ? 'bg-yellow-500 animate-pulse' :
              setupState === 'in-progress' ? 'bg-blue-500 animate-pulse' :
              setupState === 'ready' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {setupState === 'loading' && 'Preparing workflow...'}
              {setupState === 'in-progress' && 'Installing workflow...'}
              {setupState === 'ready' && 'Workflow installed successfully'}
              {setupState === 'error' && 'Installation failed'}
            </span>
          </div>
        </div>

        {/* Setup iframe */}
        {setupState === 'ready' && iframeUrl && (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b">
              <h3 className="text-sm font-medium">Workflow Configuration</h3>
              <p className="text-xs text-muted-foreground">Configure your workflow settings below</p>
            </div>
            <div className="relative">
              <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-96 border-0"
                title="Workflow Setup"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          {setupState === 'pending-human' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Your setup request is in queue. Our engineers will finalize AI prompts, test, and activate within 24 hours.
              </p>
              <Button onClick={handleCancel}>
                Done
              </Button>
            </div>
          )}
          
          {setupState === 'ready' && (
            <Button onClick={() => setSetupState('pending-human')}>
              Request Human Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
