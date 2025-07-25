import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { SolidAuthService } from '@/services/solidAuth';
import { SolidStorageService, DPPFile } from '@/services/solidStorage';
import { 
  Upload, 
  FileText, 
  LogOut, 
  User, 
  Plus,
  Download,
  Trash2,
  Shield,
  Clock,
  Database
} from 'lucide-react';
import DPPUpload from './DPPUpload';
import DPPList from './DPPList';

interface DPPDashboardProps {
  onLogout: () => void;
}

const DPPDashboard = ({ onLogout }: DPPDashboardProps) => {
  const [files, setFiles] = useState<DPPFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const auth = SolidAuthService.getInstance();
  const storage = SolidStorageService.getInstance();
  const sessionInfo = auth.getSessionInfo();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const dppFiles = await storage.listDPPFiles();
      setFiles(dppFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load DPP files from your Pod',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    onLogout();
  };

  const handleFileUploaded = () => {
    loadFiles();
    setActiveTab('files');
    toast({
      title: 'Success',
      description: 'DPP file uploaded successfully to your Pod',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Digital Product Passport</h1>
                <p className="text-xs text-muted-foreground">Powered by Solid</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate max-w-32">
                  {sessionInfo.webId?.split('/').pop()?.split('#')[0] || 'User'}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Connected
                </Badge>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Files ({files.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total DPP Files</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{files.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Stored in your Pod
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pod Storage</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">Decentralized</div>
                  <p className="text-xs text-muted-foreground">
                    Your data, your control
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Upload</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {files.length > 0 ? 'Recent' : 'None'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {files.length > 0 
                      ? files[0].uploadedAt.toLocaleDateString()
                      : 'Upload your first DPP'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your Digital Product Passports efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button
                  onClick={() => setActiveTab('upload')}
                  className="bg-gradient-primary hover:shadow-elevated transition-all duration-300"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New DPP
                </Button>
                <Button
                  onClick={() => setActiveTab('files')}
                  variant="secondary"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View All Files
                </Button>
                <Button
                  onClick={loadFiles}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isLoading ? 'Syncing...' : 'Sync Pod'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <DPPUpload onFileUploaded={handleFileUploaded} />
          </TabsContent>

          <TabsContent value="files">
            <DPPList files={files} onFilesChanged={loadFiles} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DPPDashboard;