import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Users, 
  Activity, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical
} from 'lucide-react';
import { DataSpaceService, DataSpace } from '@/services/dataSpaceService';
import { toast } from '@/hooks/use-toast';
import AssetDetailsCard from './AssetDetailsCard';

export default function DataSpaceDashboard() {
  const [dataspaces, setDataspaces] = useState<DataSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const dataSpaceService = DataSpaceService.getInstance();

  useEffect(() => {
    loadDataSpaces();
  }, []);

  const loadDataSpaces = async () => {
    try {
      setIsLoading(true);
      const spaces = await dataSpaceService.listDataSpaces();
      setDataspaces(spaces);
    } catch (error) {
      console.error('Error loading data spaces:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data spaces',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalDataSpaces: dataspaces.length,
    memberDataSpaces: dataspaces.filter(ds => ds.members.length > 1).length,
    activeAssets: dataspaces.reduce((acc, ds) => acc + (ds.metadata?.length || 0), 0),
    totalMembers: dataspaces.reduce((acc, ds) => acc + ds.members.length, 0)
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Spaces Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your data spaces and explore available assets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button className="bg-gradient-accent hover:shadow-elevated">
            <Plus className="w-4 h-4 mr-2" />
            Create Space
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card shadow-card border border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Spaces</CardTitle>
            <Database className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalDataSpaces}</div>
            <p className="text-xs text-muted-foreground">
              Spaces you're a member of
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborative Spaces</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.memberDataSpaces}</div>
            <p className="text-xs text-muted-foreground">
              Shared with other members
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Activity className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.activeAssets}</div>
            <p className="text-xs text-muted-foreground">
              Data assets available
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border border-sidebar-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Across all spaces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Spaces Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your Data Spaces</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gradient-card shadow-card border border-sidebar-border animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dataspaces.length === 0 ? (
          <Card className="bg-gradient-card shadow-card border border-sidebar-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Data Spaces Found</h3>
              <p className="text-muted-foreground text-center mb-6">
                You're not a member of any data spaces yet. Create your first data space or join an existing one.
              </p>
              <Button className="bg-gradient-accent hover:shadow-elevated">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Data Space
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {dataspaces.map((dataspace) => (
              <Card key={dataspace.id} className="bg-gradient-card shadow-card border border-sidebar-border hover:shadow-elevated transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-foreground group-hover:text-accent transition-colors">
                        {dataspace.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            dataspace.accessMode === 'public' 
                              ? 'bg-success/20 text-success' 
                              : dataspace.accessMode === 'private'
                              ? 'bg-muted/50 text-muted-foreground'
                              : 'bg-accent/20 text-accent'
                          }`}
                        >
                          {dataspace.accessMode}
                        </Badge>
                        {dataspace.category && (
                          <Badge variant="outline" className="text-xs bg-secondary/20 text-secondary-foreground">
                            {dataspace.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                    {dataspace.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        <Users className="w-4 h-4 inline mr-1" />
                        {dataspace.members.length} member{dataspace.members.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground">
                        <Activity className="w-4 h-4 inline mr-1" />
                        {dataspace.metadata?.length || 0} asset{(dataspace.metadata?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dataspace.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  {dataspace.tags && dataspace.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dataspace.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-muted/30">
                          {tag}
                        </Badge>
                      ))}
                      {dataspace.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-muted/30">
                          +{dataspace.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                  >
                    Open Data Space
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Featured Asset Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Featured Asset</h2>
        <AssetDetailsCard />
      </div>
    </div>
  );
}