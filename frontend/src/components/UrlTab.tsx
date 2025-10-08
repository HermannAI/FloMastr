
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import brain from '../brain';

interface UrlTabProps {
  metadata: {
    title: string;
    type: string;
    intent: string;
    tags: string[];
  };
  onMetadataChange: (metadata: any) => void;
}

export const UrlTab = ({ metadata, onMetadataChange }: UrlTabProps) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setValidationError('URL must use HTTP or HTTPS protocol');
        return false;
      }
      setValidationError('');
      return true;
    } catch {
      setValidationError('Please enter a valid URL');
      return false;
    }
  };
  
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value && !validateUrl(value)) {
      return;
    }
    
    // Auto-generate title from URL if metadata title is empty
    if (!metadata.title && value) {
      try {
        const urlObj = new URL(value);
        const hostname = urlObj.hostname.replace('www.', '');
        const pathname = urlObj.pathname !== '/' ? urlObj.pathname : '';
        const suggestedTitle = `${hostname}${pathname}`.replace(/\/$/, '');
        onMetadataChange({ ...metadata, title: suggestedTitle });
      } catch {
        // Ignore invalid URL for title generation
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    if (!validateUrl(url)) {
      toast.error(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Auto-generate title if not provided
      const finalMetadata = {
        ...metadata,
        title: metadata.title || (() => {
          try {
            const urlObj = new URL(url);
            return `${urlObj.hostname.replace('www.', '')}${urlObj.pathname !== '/' ? urlObj.pathname : ''}`;
          } catch {
            return url;
          }
        })()
      };
      
      // Make API call
      const response = await brain.convert_url_to_markdown(
        {
          url: url.trim()
        },
        {
          headers: {
            'X-Tenant-Slug': 'default' // TODO: Get from tenant context
          }
        }
      );
      
      if (response.ok) {
        toast.success('URL submitted successfully and will be processed');
        
        // Reset form
        setUrl('');
        onMetadataChange({
          title: '',
          type: 'General',
          intent: 'Reference',
          tags: []
        });
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('URL submission error:', error);
      toast.error('Failed to submit URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isValid = url.trim() && !validationError;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Website URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://example.com/page"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={`pl-10 ${validationError ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
                {url && !validationError && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
                {validationError && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>
              {validationError && (
                <p className="text-sm text-red-500">{validationError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter the URL of a webpage you'd like to add to your knowledge base.
                The content will be extracted and processed automatically.
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={!isValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing URL...
                </>
              ) : (
                'Submit URL'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* URL Processing Info */}
      <div className="text-sm text-muted-foreground space-y-2">
        <h4 className="font-medium text-foreground">How URL processing works:</h4>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>The webpage content will be extracted and cleaned</li>
          <li>Images, scripts, and styling will be removed</li>
          <li>The page title will be used if no custom title is provided</li>
          <li>Processing may take a few minutes depending on page size</li>
        </ul>
      </div>
    </div>
  );
};
