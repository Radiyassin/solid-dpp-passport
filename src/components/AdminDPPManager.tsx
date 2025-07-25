import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SolidStorageService } from '@/services/solidStorage';
import { Upload, FileText, Calendar, User, Download, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DPPFile {
  name: string;
  url: string;
  size?: number;
  lastModified?: Date;
  content?: string;
}

const AdminDPPManager = () => {
  const [files, setFiles] = useState<DPPFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const storage = SolidStorageService.getInstance();
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const dppFiles = await storage.listDPPFiles();
      setFiles(dppFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load DPP files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      await storage.uploadDPP(selectedFile);
      toast({
        title: "Success",
        description: `${selectedFile.name} uploaded successfully`,
      });
      setSelectedFile(null);
      setFileName('');
      await loadFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!fileName || !fileContent) return;

    setIsLoading(true);
    try {
      const file = new File([fileContent], fileName.endsWith('.ttl') ? fileName : fileName + '.ttl', {
        type: 'text/turtle'
      });
      await storage.uploadDPP(file);
      toast({
        title: "Success",
        description: `${file.name} created successfully`,
      });
      setFileName('');
      setFileContent('');
      setIsCreatingNew(false);
      await loadFiles();
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: "Error",
        description: "Failed to create file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileUrl: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    setIsLoading(true);
    try {
      await storage.deleteDPP(fileUrl);
      toast({
        title: "Success",
        description: `${fileName} deleted successfully`,
      });
      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (file: DPPFile) => {
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
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="manage">Manage Files</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload DPP File
              </CardTitle>
              <CardDescription>
                Upload a .ttl (Turtle RDF) file to your Pod
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select TTL File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".ttl,.turtle"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>
              
              {selectedFile && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                className="w-full bg-gradient-primary hover:shadow-elevated transition-all duration-300"
              >
                {isLoading ? 'Uploading...' : 'Upload to Pod'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New DPP
              </CardTitle>
              <CardDescription>
                Create a new Digital Product Passport file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-filename">File Name</Label>
                <Input
                  id="new-filename"
                  placeholder="product-passport.ttl"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="file-content">TTL Content</Label>
                <Textarea
                  id="file-content"
                  placeholder="@prefix dpp: <http://example.org/dpp#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

<#product> a dpp:DigitalProductPassport ;
    rdfs:label 'Example Product' ;
    dpp:serialNumber '12345' ;
    dpp:manufacturer 'Example Corp' ."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="mt-1 min-h-[200px] font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleCreateNew}
                disabled={!fileName || !fileContent || isLoading}
                className="w-full bg-gradient-primary hover:shadow-elevated transition-all duration-300"
              >
                {isLoading ? 'Creating...' : 'Create DPP File'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card className="bg-gradient-card shadow-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Manage DPP Files
              </CardTitle>
              <CardDescription>
                View and manage your uploaded Digital Product Passports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No DPP files found</p>
                  <p className="text-sm text-muted-foreground">Upload your first file to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div key={index} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <h3 className="font-medium">{file.name}</h3>
                            <Badge variant="secondary">TTL</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {file.size && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            )}
                            {file.lastModified && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {file.lastModified.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleDownload(file)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(file.url, file.name)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDPPManager;