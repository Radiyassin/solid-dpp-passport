import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { SolidStorageService } from '@/services/solidStorage';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  CloudUpload
} from 'lucide-react';

interface DPPUploadProps {
  onFileUploaded: () => void;
}

const DPPUpload = ({ onFileUploaded }: DPPUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const storage = SolidStorageService.getInstance();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.ttl') && !file.type.includes('turtle')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a .ttl (Turtle RDF) file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const fileUrl = await storage.uploadDPP(selectedFile);
      
      // Automatically store locally for sync
      const { localSyncService } = await import('@/services/localSyncService');
      const podUrl = fileUrl.split('/dpp/')[0] + '/';
      await localSyncService.storeDPP(selectedFile, podUrl);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: 'Upload Successful',
        description: `DPP file uploaded to your Pod and synced locally: ${selectedFile.name}`,
      });

      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      onFileUploaded();

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload DPP file to your Pod. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload DPP File
          </CardTitle>
          <CardDescription>
            Upload your Digital Product Passport (.ttl) files to your Solid Pod for secure, decentralized storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${isDragOver 
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
              }
              ${selectedFile ? 'border-success bg-success/5' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttl,text/turtle"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="space-y-4">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                    </p>
                  </div>
                  <Button
                    onClick={clearSelection}
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <CloudUpload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground mb-2">
                      Drag & drop your DPP file here
                    </p>
                    <p className="text-muted-foreground mb-4">
                      or click to browse your files
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      Supports .ttl (Turtle RDF) files up to 10MB
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uploading to your Pod...</span>
                <span className="text-primary font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-gradient-primary hover:shadow-elevated transition-all duration-300"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload to Pod'}
            </Button>
            
            {selectedFile && !isUploading && (
              <Button
                onClick={clearSelection}
                variant="outline"
                size="lg"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-foreground">Upload Guidelines:</p>
                <ul className="text-muted-foreground space-y-1 ml-4">
                  <li>• Only .ttl (Turtle RDF) files are supported</li>
                  <li>• Files are stored directly in your personal Solid Pod</li>
                  <li>• You maintain full ownership and control of your data</li>
                  <li>• Files will be saved in /dpp/ folder in your Pod</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DPPUpload;