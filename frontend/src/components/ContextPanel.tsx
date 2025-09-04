import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, User, Phone, MessageSquare, Route, Database } from 'lucide-react';
import { ContextEnvelope } from 'brain/data-contracts';
import { useContextEnvelope } from 'utils/useContextEnvelope';

interface ContextPanelProps {
  tenantId: string;
  contactId?: string | null;
  whatsapp?: string | null;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
  tenantId,
  contactId,
  whatsapp
}) => {
  const { data: envelope, isLoading, error } = useContextEnvelope({
    tenantId,
    contactId,
    whatsapp,
    enabled: Boolean(tenantId && (contactId || whatsapp))
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              {error.message.includes('Session expired') 
                ? 'Session expired' 
                : error.message.includes('not found')
                ? 'Contact not found'
                : 'Failed to load context'
              }
            </span>
          </div>
          {error.message.includes('Session expired') && (
            <p className="text-xs text-muted-foreground mt-1">
              Please refresh the page and try again
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // No data
  if (!envelope) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No context data available</p>
        </CardContent>
      </Card>
    );
  }

  const isStubContact = !envelope.contact.id;
  const hasMessages = envelope.conversation_history.recent_messages && 
                      envelope.conversation_history.recent_messages.length > 0;
  const hasCustomData = envelope.custom_data && 
                        Object.keys(envelope.custom_data).length > 0;

  return (
    <div className="space-y-4">
      {/* Partial response warning */}
      {envelope.partial && envelope.errors && envelope.errors.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Partial Response
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                  {envelope.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Contact Information
            {isStubContact && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                Stub Contact
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Name</p>
            <p className="text-sm">
              {envelope.contact.name || (
                <span className="text-muted-foreground italic">
                  {isStubContact ? 'Unknown contact' : 'No name provided'}
                </span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              Phone
            </p>
            <p className="text-sm font-mono">
              {envelope.contact.phone || (
                <span className="text-muted-foreground italic">No phone number</span>
              )}
            </p>
          </div>
          
          {envelope.contact.id && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Contact ID</p>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {envelope.contact.id}
              </p>
            </div>
          )}
          
          {envelope.contact.metadata && Object.keys(envelope.contact.metadata).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
              <div className="text-xs bg-muted rounded p-2">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(envelope.contact.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Recent Messages ({envelope.conversation_history.recent_messages?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasMessages ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {envelope.conversation_history.recent_messages!.map((message, index) => {
                const isInbound = message.dir === 'in';
                const timestamp = new Date(message.ts);
                
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      isInbound 
                        ? 'bg-muted/50 border-l-2 border-blue-500' 
                        : 'bg-primary/5 border-l-2 border-green-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge 
                        variant={isInbound ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {isInbound ? 'Inbound' : 'Outbound'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {isStubContact ? 'No conversation history for stub contacts' : 'No recent messages'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Routing Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="w-4 h-4" />
            Routing Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Assigned Agent</p>
            <p className="text-sm">
              {envelope.routing.assigned_agent || (
                <span className="text-muted-foreground italic">No agent assigned</span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">SLA</p>
            <p className="text-sm">
              {envelope.routing.sla_seconds 
                ? `${Math.round(envelope.routing.sla_seconds / 60)} minutes`
                : 'No SLA set'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Data */}
      {hasCustomData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Custom Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs bg-muted rounded p-3">
              <pre className="whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(envelope.custom_data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContextPanel;
