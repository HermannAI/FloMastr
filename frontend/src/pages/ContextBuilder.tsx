


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe, Clipboard, Library } from 'lucide-react';
import { UploadTab } from '@/components/UploadTab';
import { UrlTab } from '@/components/UrlTab';
import { PasteTab } from '@/components/PasteTab';
import { KnowledgeCardsTab } from '@/components/KnowledgeCardsTab';
import { KnowledgeList } from '@/components/KnowledgeList';
import { MetadataPanel } from '@/components/MetadataPanel';
import { Layout } from '@/components/Layout';
import { useAuthenticatedUser } from '@/components/AuthMiddleware';
import { useTenant } from '@/utils/TenantProvider';
import brain from '@/brain';
import { toast } from '@/extensions/shadcn/hooks/use-toast';

const ContextBuilder = () => {
  // Ensure user is authenticated for this protected page
  const { user } = useAuthenticatedUser(); // Use consolidated auth context
  // Access tenant context for tenant-aware operations
  const { tenant, tenantSlug, isValidTenant } = useTenant();

  const [activeTab, setActiveTab] = useState('upload');
  const [showMetadata, setShowMetadata] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    type: 'General',
    intent: 'Reference',
    tags: []
  });

  // Fetch knowledge list on mount and when tenant changes
  useEffect(() => {
    if (tenantSlug) {
      fetchKnowledgeList();
    }
  }, [tenantSlug]);

  const fetchKnowledgeList = async () => {
    if (!tenantSlug) return;
    
    setIsLoading(true);
    try {
      const response = await brain.get_knowledge_index({ tenantSlug });
      if (response.data) {
        setKnowledgeList(response.data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching knowledge list:', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge bases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKnowledge = () => {
    setShowMetadata(true);
  };

  const handleSaveWithMetadata = async () => {
    if (!tenantSlug) {
      toast({
        title: 'Error',
        description: 'No tenant context available',
        variant: 'destructive',
      });
      return;
    }

    if (!metadata.title || !metadata.type) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a title and type',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create knowledge base with metadata
      const response = await brain.upsert_knowledge_index(
        { tenantSlug },
        {
          title: metadata.title,
          content: `${metadata.type} - ${metadata.intent}`,
          metadata: {
            type: metadata.type,
            intent: metadata.intent,
            tags: metadata.tags,
            source_type: activeTab, // track which tab was used
          },
        }
      );

      if (response.data) {
        toast({
          title: 'Success',
          description: 'Knowledge base created successfully',
        });
        
        // Reset form and refresh list
        setMetadata({
          title: '',
          type: 'General',
          intent: 'Reference',
          tags: []
        });
        setShowMetadata(false);
        await fetchKnowledgeList();
      }
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast({
        title: 'Error',
        description: 'Failed to create knowledge base',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-200px)] flex">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/assets/business-brain-icon.png" 
                  alt="Business Brain" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold">Business Brain</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      Train your AI with your specific business context
                    </p>
                    {tenant && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <Badge variant="outline">{tenant.name}</Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={handleAddKnowledge}>
                Add to Knowledge Base
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Create Knowledge</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="upload" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Upload
                      </TabsTrigger>
                      <TabsTrigger value="url" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        URL
                      </TabsTrigger>
                      <TabsTrigger value="paste" className="flex items-center gap-2">
                        <Clipboard className="h-4 w-4" />
                        Paste
                      </TabsTrigger>
                      <TabsTrigger value="cards" className="flex items-center gap-2">
                        <Library className="h-4 w-4" />
                        Knowledge Cards
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="mt-6">
                      <UploadTab 
                        metadata={metadata}
                        onMetadataChange={setMetadata}
                      />
                    </TabsContent>
                    
                    <TabsContent value="url" className="mt-6">
                      <UrlTab 
                        metadata={metadata}
                        onMetadataChange={setMetadata}
                      />
                    </TabsContent>
                    
                    <TabsContent value="paste" className="mt-6">
                      <PasteTab 
                        metadata={metadata}
                        onMetadataChange={setMetadata}
                      />
                    </TabsContent>
                    
                    <TabsContent value="cards" className="mt-6">
                      <KnowledgeCardsTab />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Metadata Panel */}
        {showMetadata && (
          <MetadataPanel
            metadata={metadata}
            onMetadataChange={setMetadata}
            onSave={handleSaveWithMetadata}
            onCancel={() => setShowMetadata(false)}
            isLoading={isSaving}
          />
        )}
      </div>
    </Layout>
  );
};

export default ContextBuilder;
