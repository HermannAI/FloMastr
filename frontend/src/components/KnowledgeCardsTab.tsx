



import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Edit3, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import brain from '../brain';

interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
  type: string;
  intent: string;
  tags: string[];
  status: 'review' | 'embedded' | 'rejected';
  source: string;
  created_at: string;
}

export const KnowledgeCardsTab = () => {
  const [editingCard, setEditingCard] = useState<KnowledgeCard | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);
  
  // Mock data - will be replaced with React Query
  const awaitingReview: KnowledgeCard[] = [
    {
      id: '1',
      title: 'Customer Support Guidelines',
      content: '# Customer Support Guidelines\n\nOur customer support team should always:\n- Respond within 24 hours\n- Be polite and professional\n- Escalate complex issues to supervisors',
      type: 'Policy',
      intent: 'Reference',
      tags: ['support', 'guidelines'],
      status: 'review',
      source: 'hitl',
      created_at: '2024-01-20T10:00:00Z'
    },
    {
      id: '2', 
      title: 'Return Policy FAQ',
      content: '# Return Policy\n\nQ: How long do customers have to return items?\nA: 30 days from purchase date\n\nQ: What condition must items be in?\nA: Original packaging, unused condition',
      type: 'FAQ',
      intent: 'Answer',
      tags: ['returns', 'policy'],
      status: 'review',
      source: 'hitl',
      created_at: '2024-01-20T09:30:00Z'
    }
  ];
  
  const recentlyPublished: KnowledgeCard[] = [
    {
      id: '3',
      title: 'Onboarding Checklist',
      content: '# New Employee Onboarding\n\n- Set up email account\n- Complete HR paperwork\n- Schedule orientation session',
      type: 'Training',
      intent: 'Reference',
      tags: ['onboarding', 'hr'],
      status: 'embedded',
      source: 'hitl',
      created_at: '2024-01-19T14:00:00Z'
    }
  ];
  
  const validateAnonymization = (content: string): { isValid: boolean; message: string } => {
    // Simple anonymization check - look for patterns that might be personal data
    const personalDataPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone pattern
    ];
    
    for (const pattern of personalDataPatterns) {
      if (pattern.test(content)) {
        return { 
          isValid: false, 
          message: 'Content may contain personal information that should be anonymized' 
        };
      }
    }
    
    return { isValid: true, message: 'Content appears to be properly anonymized' };
  };
  
  const handleEditCard = (card: KnowledgeCard) => {
    setEditingCard(card);
    setEditContent(card.content);
  };
  
  const handleSaveEdit = () => {
    if (editingCard) {
      // TODO: Update card with edited content via API
      toast.success('Knowledge card updated successfully');
      setEditingCard(null);
      setEditContent('');
    }
  };
  
  const handlePublishCard = async (card: KnowledgeCard) => {
    const validation = validateAnonymization(card.content);
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }
    
    setIsPublishing(card.id);
    
    try {
      // For now, simulate publishing since we don't have the endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Knowledge card published successfully');
      // TODO: Refresh knowledge list when real API is available
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish knowledge card');
    } finally {
      setIsPublishing(null);
    }
  };
  
  const handleRejectCard = async (cardId: string) => {
    setIsRejecting(cardId);
    
    try {
      // For now, simulate rejection since we don't have the endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Knowledge card rejected');
      // TODO: Refresh knowledge list when real API is available
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Failed to reject knowledge card');
    } finally {
      setIsRejecting(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'review':
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Review</Badge>;
      case 'embedded':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Embedded</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Awaiting Review Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Awaiting Review</h3>
          <p className="text-sm text-muted-foreground">
            Knowledge cards created from HITL approvals that need review before publishing
          </p>
        </div>
        
        {awaitingReview.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No knowledge cards awaiting review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {awaitingReview.map((card) => {
              const validation = validateAnonymization(card.content);
              
              return (
                <Card key={card.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {getStatusBadge(card.status)}
                          <Badge variant="outline">{card.type}</Badge>
                          <Badge variant="outline">{card.intent}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{card.title}</DialogTitle>
                              <DialogDescription>Preview knowledge card content</DialogDescription>
                            </DialogHeader>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <pre className="whitespace-pre-wrap">{card.content}</pre>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCard(card)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {card.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className={`flex items-center gap-2 text-sm ${
                        validation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {validation.isValid ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {validation.message}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handlePublishCard(card)}
                          disabled={!validation.isValid || isPublishing === card.id}
                          className="flex-1"
                        >
                          {isPublishing === card.id ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing...</>
                          ) : (
                            <><CheckCircle className="h-4 w-4 mr-2" />Publish</>
                          )}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectCard(card.id)}
                          disabled={isRejecting === card.id}
                        >
                          {isRejecting === card.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <Separator />
      
      {/* Recently Published Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recently Published</h3>
          <p className="text-sm text-muted-foreground">
            Knowledge cards that have been published and are available in the knowledge base
          </p>
        </div>
        
        {recentlyPublished.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No recently published knowledge cards</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recentlyPublished.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {getStatusBadge(card.status)}
                        <Badge variant="outline">{card.type}</Badge>
                        <Badge variant="outline">{card.intent}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{card.title}</DialogTitle>
                            <DialogDescription>Knowledge card content</DialogDescription>
                          </DialogHeader>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap">{card.content}</pre>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm">
                        Retire
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Dialog */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Edit Knowledge Card</DialogTitle>
              <DialogDescription>Make changes to the knowledge card content</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{editingCard.title}</h4>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[300px] font-mono"
                  placeholder="Edit the knowledge card content..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCard(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
