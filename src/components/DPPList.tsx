import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { DPPFile, SolidStorageService } from '@/services/solidStorage';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  HardDrive,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface DPPListProps {
  files: DPPFile[];
  onFilesChanged: () => void;
}

const DPPList = ({ files, onFilesChanged }: DPPListProps) => {
  const [selectedFile, setSelectedFile] = useState<DPPFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const storage = SolidStorageService.getInstance();

  const handleViewFile = async (file: DPPFile) => {
    setSelectedFile(file);
    setIsLoading(true);
    
    try {
      const content = await storage.getDPPContent(file.url);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (file: DPPFile) => {
    try {
      const content = await storage.getDPPContent(file.url);
      const blob = new Blob([content], { type: 'text/turtle' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${file.name}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFile = async (file: DPPFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(file.url);
    
    try {
      await storage.deleteDPP(file.url);
      onFilesChanged();
      
      toast({
        title: 'File Deleted',
        description: `Successfully deleted ${file.name}`,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file from your Pod',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  if (files.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No DPP Files Yet</h3>
          <p className="text-muted-foreground mb-6">
            Upload your first Digital Product Passport file to get started
          </p>
          <Button className="bg-gradient-primary hover:shadow-elevated transition-all duration-300">
            <FileText className="w-4 h-4 mr-2" />
            Upload Your First DPP
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your DPP Files ({files.length})
          </CardTitle>
          <CardDescription>
            Digital Product Passports stored in your Solid Pod
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file) => (
              <div
                key={file.url}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{file.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(file.uploadedAt)}
                      </div>
                      {file.size && (
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(file.size)}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {file.contentType || 'text/turtle'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => handleViewFile(file)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {selectedFile?.name}
                        </DialogTitle>
                        <DialogDescription>
                          Digital Product Passport content from your Solid Pod
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh] rounded-md border p-4">
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="ml-2">Loading file content...</span>
                          </div>
                        ) : (
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                            {fileContent}
                          </pre>
                        )}
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => selectedFile && handleDownloadFile(selectedFile)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          onClick={() => window.open(selectedFile?.url, '_blank')}
                          variant="outline"
                          className="flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open in Pod
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => handleDownloadFile(file)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={() => handleDeleteFile(file)}
                    variant="outline"
                    size="sm"
                    disabled={isDeleting === file.url}
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                  >
                    {isDeleting === file.url ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DPPList;