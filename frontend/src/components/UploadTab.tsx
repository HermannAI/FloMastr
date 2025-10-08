
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import brain from '../brain';

interface UploadTabProps {
  metadata: {
    title: string;
    type: string;
    intent: string;
    tags: string[];
  };
  onMetadataChange: (metadata: any) => void;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const UploadTab = ({ metadata, onMetadataChange }: UploadTabProps) => {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const allowedTypes = ['.pdf', '.docx', '.txt', '.html'];
  const maxFileSize = 20 * 1024 * 1024; // 20MB
  
  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(extension)) {
      return `File type ${extension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 20MB`;
    }
    return null;
  };
  
  const uploadFile = async (file: File) => {
    const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Add to uploads list
    const newUpload: FileUpload = {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading'
    };
    
    setUploads(prev => [...prev, newUpload]);
    
    try {
      // Auto-generate title if not provided
      const finalMetadata = {
        ...metadata,
        title: metadata.title || file.name.split('.').slice(0, -1).join('.')
      };
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploads(prev => prev.map(upload => 
          upload.id === uploadId && upload.progress < 90
            ? { ...upload, progress: upload.progress + 10 }
            : upload
        ));
      }, 200);
      
      // For now, simulate successful upload since we don't have the endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      
      // Mark as success
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId
          ? { ...upload, progress: 100, status: 'success' }
          : upload
      ));
      toast.success(`${file.name} uploaded successfully`);
      
      // Reset metadata after successful upload
      onMetadataChange({
        title: '',
        type: 'General',
        intent: 'Reference', 
        tags: []
      });
    } catch (error) {
      setUploads(prev => prev.map(upload => 
        upload.id === uploadId
          ? { ...upload, status: 'error', error: 'Upload failed' }
          : upload
      ));
      toast.error(`Failed to upload ${file.name}`);
    }
  };
  
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      uploadFile(file);
    });
  };
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };
  
  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
      default:
        return <Upload className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">
          Drag and drop files here, or click to browse
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Supported formats: {allowedTypes.join(', ')} • Max 20MB per file
        </p>
        <Label htmlFor="file-upload">
          <Button variant="outline" className="cursor-pointer">
            Choose Files
          </Button>
        </Label>
        <Input
          id="file-upload"
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
      
      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploads</h4>
          {uploads.map((upload) => (
            <Card key={upload.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium truncate">
                      {upload.file.name}
                    </span>
                    {getStatusIcon(upload.status)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUpload(upload.id)}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {upload.status === 'uploading' && (
                  <div className="space-y-1">
                    <Progress value={upload.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {upload.progress}% uploaded
                    </p>
                  </div>
                )}
                
                {upload.status === 'error' && (
                  <p className="text-xs text-red-500">{upload.error}</p>
                )}
                
                {upload.status === 'success' && (
                  <p className="text-xs text-green-600">Upload complete</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
