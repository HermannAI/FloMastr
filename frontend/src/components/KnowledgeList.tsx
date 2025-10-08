import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Archive, Search, Filter, RefreshCw, Calendar, Tag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import brain from '../brain';

interface KnowledgeEntry {
  id: string;
  title: string;
  type: string;
  intent: string;
  tags: string[];
  added: string;
  status: 'Review' | 'Processing' | 'Embedded' | 'Error' | 'Retired' | 'Rejected';
  source: 'upload' | 'url' | 'paste' | 'hitl';
  size?: number;
  url?: string;
}

export const KnowledgeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState(false);
  
  // Mock data - will be replaced with React Query
  const knowledgeEntries: KnowledgeEntry[] = [
    {
      id: '1',
      title: 'Customer Support Guidelines',
      type: 'Policy',
      intent: 'Reference',
      tags: ['support', 'guidelines'],
      added: '2024-01-20T10:00:00Z',
      status: 'Embedded',
      source: 'upload',
      size: 1024
    },
    {
      id: '2',
      title: 'Product Documentation',
      type: 'Training',
      intent: 'Reference',
      tags: ['product', 'docs'],
      added: '2024-01-20T09:30:00Z',
      status: 'Processing',
      source: 'url',
      url: 'https://example.com/docs'
    },
    {
      id: '3',
      title: 'Return Policy FAQ',
      type: 'FAQ',
      intent: 'Answer',
      tags: ['returns', 'policy'],
      added: '2024-01-19T14:00:00Z',
      status: 'Review',
      source: 'paste'
    },
    {
      id: '4',
      title: 'Onboarding Checklist',
      type: 'Training',
      intent: 'Reference',
      tags: ['onboarding', 'hr'],
      added: '2024-01-19T12:00:00Z',
      status: 'Embedded',
      source: 'hitl'
    },
    {
      id: '5',
      title: 'API Integration Guide',
      type: 'General',
      intent: 'Reference',
      tags: ['api', 'integration'],
      added: '2024-01-18T16:00:00Z',
      status: 'Error',
      source: 'upload'
    }
  ];
  
  const getStatusBadge = (status: string) => {
    const variants = {
      'Review': 'secondary',
      'Processing': 'default',
      'Embedded': 'default',
      'Error': 'destructive',
      'Retired': 'outline',
      'Rejected': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };
  
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'upload':
        return <FileText className="h-4 w-4" />;
      case 'url':
        return <Search className="h-4 w-4" />;
      case 'paste':
        return <FileText className="h-4 w-4" />;
      case 'hitl':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleViewEntry = async (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setIsLoadingMarkdown(true);
    
    try {
      // For now, simulate loading markdown content since we don't have the endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock markdown content based on entry
      const mockContent = `# ${entry.title}

**Type:** ${entry.type}
**Intent:** ${entry.intent}
**Tags:** ${entry.tags.join(', ')}
**Added:** ${formatDate(entry.added)}
**Source:** ${entry.source}

## Content

This is mock content for demonstration purposes. In the real implementation, this would be the actual markdown content retrieved from the knowledge base.

- Sample bullet point 1
- Sample bullet point 2
- Sample bullet point 3

The content would be processed and stored when the knowledge entry was originally submitted.`;
      
      setMarkdownContent(mockContent);
    } catch (error) {
      console.error('Error loading markdown:', error);
      setMarkdownContent('Error loading content');
    } finally {
      setIsLoadingMarkdown(false);
    }
  };
  
  const handleRetireEntry = async (entryId: string) => {
    try {
      // For now, simulate retiring the entry since we don't have the endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Knowledge entry retired successfully');
      // TODO: Refresh knowledge list when real API is available
    } catch (error) {
      console.error('Error retiring entry:', error);
      toast.error('Failed to retire knowledge entry');
    }
  };
  
  // Filter entries based on search and filters
  const filteredEntries = knowledgeEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || entry.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || entry.type.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  const statusOptions = ['all', 'Review', 'Processing', 'Embedded', 'Error', 'Retired', 'Rejected'];
  const typeOptions = ['all', 'General', 'Policy', 'Contract', 'Training', 'FAQ'];
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>
                {status === 'all' ? 'All Status' : status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map(type => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEntries.length} of {knowledgeEntries.length} entries
      </div>
      
      {/* Knowledge Entries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No knowledge entries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(entry.source)}
                        <div>
                          <div className="font-medium">{entry.title}</div>
                          {entry.url && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {entry.url}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.intent}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{entry.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.added)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(entry.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {entry.status !== 'Retired' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetireEntry(entry.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Markdown Preview Dialog */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getSourceIcon(selectedEntry.source)}
                {selectedEntry.title}
              </DialogTitle>
              <DialogDescription>
                {selectedEntry.type} • {selectedEntry.intent} • Added {formatDate(selectedEntry.added)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              
              <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                {isLoadingMarkdown ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading content...
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{markdownContent}</pre>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
