import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MetadataProps {
  metadata: {
    title: string;
    type: string;
    intent: string;
    tags: string[];
  };
  onMetadataChange: (metadata: any) => void;
}

export const MetadataPanel = ({ metadata, onMetadataChange }: MetadataProps) => {
  const [newTag, setNewTag] = React.useState('');
  
  const handleTitleChange = (value: string) => {
    onMetadataChange({ ...metadata, title: value });
  };
  
  const handleTypeChange = (value: string) => {
    onMetadataChange({ ...metadata, type: value });
  };
  
  const handleIntentChange = (value: string) => {
    onMetadataChange({ ...metadata, intent: value });
  };
  
  const addTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      onMetadataChange({ 
        ...metadata, 
        tags: [...metadata.tags, newTag.trim()] 
      });
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    onMetadataChange({ 
      ...metadata, 
      tags: metadata.tags.filter(tag => tag !== tagToRemove) 
    });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="title">Title</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Custom title for this knowledge entry. If left empty, will use filename, page title, or first line of content.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="title"
              placeholder="Auto-generated if empty"
              value={metadata.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          
          {/* Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="type">Type</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Category of content: Policy (formal rules), Contract (legal docs), Training (educational), FAQ (questions/answers), General (other)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={metadata.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="Policy">Policy</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Training">Training</SelectItem>
                <SelectItem value="FAQ">FAQ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Intent */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="intent">Intent</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How this content should be used: Reference (lookup), Answer (direct responses), Compliance (regulatory), Internal (team-only)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={metadata.intent} onValueChange={handleIntentChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reference">Reference</SelectItem>
                <SelectItem value="Answer">Answer</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
                <SelectItem value="Internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="tags">Tags</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Optional tags for better organization and searchability</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="tags"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
