

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Type, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import brain from '../brain';

interface PasteTabProps {
  metadata: {
    title: string;
    type: string;
    intent: string;
    tags: string[];
  };
  onMetadataChange: (metadata: any) => void;
}

export const PasteTab = ({ metadata, onMetadataChange }: PasteTabProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const maxChars = 200000; // 200k character limit
  const isOverLimit = content.length > maxChars;
  const remainingChars = maxChars - content.length;
  
  const handleContentChange = (value: string) => {
    setContent(value);
    
    // Auto-generate title from first line if metadata title is empty
    if (!metadata.title && value.trim()) {
      const firstLine = value.trim().split('\n')[0];
      if (firstLine) {
        // Take first 50 characters of first line as title
        const suggestedTitle = firstLine.length > 50 
          ? firstLine.substring(0, 47) + '...'
          : firstLine;
        onMetadataChange({ ...metadata, title: suggestedTitle });
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }
    
    if (isOverLimit) {
      toast.error(`Content exceeds maximum length of ${maxChars.toLocaleString()} characters`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Auto-generate title if not provided
      const finalTitle = metadata.title || (() => {
        const firstLine = content.trim().split('\n')[0];
        if (firstLine) {
          return firstLine.length > 50 
            ? firstLine.substring(0, 47) + '...'
            : firstLine;
        }
        return 'Pasted Content';
      })();
      
      // Call the real add-paste API endpoint
      const response = await brain.add_paste({
        title: finalTitle,
        content: content.trim()
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Content submitted successfully and sent for ingestion');
        
        // Reset form
        setContent('');
        onMetadataChange({
          title: '',
          type: 'General',
          intent: 'Reference',
          tags: []
        });
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Content submission error:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('webhook')) {
          toast.error('Content submitted but processing service is unavailable. Please contact support.');
        } else {
          toast.error(`Failed to submit content: ${error.message}`);
        }
      } else {
        toast.error('Failed to submit content. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCharCountColor = () => {
    if (isOverLimit) return 'text-red-500';
    if (remainingChars < 10000) return 'text-yellow-600';
    return 'text-muted-foreground';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content-textarea">Content</Label>
                <div className={`text-sm ${getCharCountColor()}`}>
                  {content.length.toLocaleString()} / {maxChars.toLocaleString()} characters
                  {isOverLimit && (
                    <span className="ml-2 inline-flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Over limit
                    </span>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="content-textarea"
                  placeholder="Paste or type your content here...\n\nThis could be:
• Documentation or policies
• Training materials  
• FAQ content
• Meeting notes
• Any text-based knowledge"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className={`min-h-[300px] pl-10 resize-y ${isOverLimit ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              
              {isOverLimit && (
                <p className="text-sm text-red-500">
                  Content is too long. Please reduce by {Math.abs(remainingChars).toLocaleString()} characters.
                </p>
              )}
              
              <p className="text-sm text-muted-foreground">
                Paste any text content you'd like to add to your knowledge base.
                The content will be processed and made searchable.
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={!content.trim() || isOverLimit || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Content...
                </>
              ) : (
                'Submit Content'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Content Processing Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <h4 className="font-medium text-foreground">Content processing:</h4>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Text will be cleaned and formatted for optimal searchability</li>
          <li>First line will be used as title if no custom title is provided</li>
          <li>Content is processed immediately and becomes searchable</li>
          <li>Supports markdown formatting and structured text</li>
        </ul>
      </div>
    </div>
  );
};
