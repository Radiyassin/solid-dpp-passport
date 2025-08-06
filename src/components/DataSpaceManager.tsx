import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { DataSpaceService, DataSpace } from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  Plus, 
  Users, 
  Globe, 
  Lock, 
  Settings, 
  Calendar,
  Database,
  Loader2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import CreateDataSpaceDialog from './CreateDataSpaceDialog';
import DataSpaceDetails from './DataSpaceDetails';

const DataSpaceManager = () => {
  const [dataSpaces, setDataSpaces] = useState<DataSpace[]>([]);
  const [selectedDataSpace, setSelectedDataSpace] = useState<DataSpace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  const dataSpaceService = DataSpaceService.getInstance();
  const auth = SolidAuthService.getInstance();
  const currentWebId = auth.getWebId();

  useEffect(() => {
    loadDataSpaces();
  }, []);

  const loadDataSpaces = async () => {
    try {
      setIsLoading(true);
      const spaces = await dataSpaceService.listDataSpaces();
      setDataSpaces(spaces);
    } catch (error) {
      console.error('Error loading data spaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Data Spaces from your Pod',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDataSpace = async () => {
    await loadDataSpaces();
    setShowCreateDialog(false);
    toast({
      title: 'Success',
      description: 'Data Space created successfully',
    });
  };

  const handleViewDataSpace = (dataSpace: DataSpace) => {
    setSelectedDataSpace(dataSpace);
    setActiveTab('details');
  };

  const handleDeleteDataSpace = async (dataSpace: DataSpace) => {
    try {
      await dataSpaceService.deleteDataSpace(dataSpace.id);
      await loadDataSpaces();
      toast({
        title: 'Success',
        description: 'Data Space deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting data space:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete Data Space',
        variant: 'destructive',
      });
    }
  };

  const getAccessModeIcon = (mode: string) => {
    switch (mode) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getAccessModeColor = (mode: string) => {
    switch (mode) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'private':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getUserRole = (dataSpace: DataSpace): string => {
    const member = dataSpace.members.find(m => m.webId === currentWebId);
    return member?.role || 'none';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Data Spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Spaces
            </TabsTrigger>
            {selectedDataSpace && (
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {selectedDataSpace.title}
              </TabsTrigger>
            )}
          </TabsList>
          
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-primary hover:shadow-elevated transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Data Space
          </Button>
        </div>

        <TabsContent value="list" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Data Spaces</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{dataSpaces.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active collaborative spaces
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">As Admin</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  {dataSpaces.filter(ds => getUserRole(ds) === 'admin').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Spaces you manage
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public Spaces</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {dataSpaces.filter(ds => ds.accessMode === 'public').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Open to everyone
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Spaces List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Data Spaces</h3>
              <Button
                onClick={loadDataSpaces}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <Database className="w-4 h-4 mr-2" />
                {isLoading ? 'Syncing...' : 'Refresh'}
              </Button>
            </div>

            {dataSpaces.length === 0 ? (
              <Card className="bg-gradient-card shadow-card">
                <CardContent className="text-center py-12">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Spaces Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first Data Space to start collaborating with others
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-primary hover:shadow-elevated transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Data Space
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dataSpaces.map((dataSpace) => (
                  <Card key={dataSpace.id} className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{dataSpace.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {dataSpace.description}
                          </CardDescription>
                        </div>
                        <Badge className={`ml-2 ${getAccessModeColor(dataSpace.accessMode)}`}>
                          <span className="flex items-center gap-1">
                            {getAccessModeIcon(dataSpace.accessMode)}
                            {dataSpace.accessMode}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {dataSpace.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {dataSpace.members.length} member{dataSpace.members.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm"><strong>Purpose:</strong> {dataSpace.purpose}</p>
                        <p className="text-sm"><strong>Your Role:</strong> 
                          <Badge variant="secondary" className="ml-2">
                            {getUserRole(dataSpace)}
                          </Badge>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewDataSpace(dataSpace)}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {getUserRole(dataSpace) === 'admin' && (
                          <Button
                            onClick={() => handleDeleteDataSpace(dataSpace)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details">
          {selectedDataSpace && (
            <DataSpaceDetails 
              dataSpace={selectedDataSpace} 
              onUpdate={loadDataSpaces}
              onBack={() => setActiveTab('list')}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateDataSpaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateDataSpace}
      />
    </div>
  );
};

export default DataSpaceManager;