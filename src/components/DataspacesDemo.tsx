import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Folder, 
  Shield, 
  Users, 
  Calendar, 
  FileText, 
  Image, 
  Music, 
  Video,
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';
import { SolidAuthService } from '@/services/solidAuth';

interface Dataspace {
  name: string;
  url: string;
  type: 'public' | 'private' | 'shared';
  description: string;
  icon: any;
  fileCount: number;
  lastModified: Date;
}

const DataspacesDemo = () => {
  const [dataspaces, setDataspaces] = useState<Dataspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const auth = SolidAuthService.getInstance();
  const webId = auth.getWebId();

  useEffect(() => {
    // Simulate loading dataspaces
    const loadDataspaces = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo dataspaces based on common Solid Pod structure
      const demoDataspaces: Dataspace[] = [
        {
          name: 'Digital Product Passports',
          url: `${webId?.split('/profile')[0]}/dpp/`,
          type: 'private',
          description: 'Store and manage your product passport data',
          icon: Shield,
          fileCount: 12,
          lastModified: new Date('2024-01-20')
        },
        {
          name: 'Personal Documents',
          url: `${webId?.split('/profile')[0]}/documents/`,
          type: 'private',
          description: 'Personal files and documents',
          icon: FileText,
          fileCount: 8,
          lastModified: new Date('2024-01-18')
        },
        {
          name: 'Public Profile',
          url: `${webId?.split('/profile')[0]}/public/`,
          type: 'public',
          description: 'Publicly accessible information',
          icon: Globe,
          fileCount: 3,
          lastModified: new Date('2024-01-15')
        },
        {
          name: 'Shared Projects',
          url: `${webId?.split('/profile')[0]}/shared/`,
          type: 'shared',
          description: 'Collaborative workspace with others',
          icon: Users,
          fileCount: 15,
          lastModified: new Date('2024-01-22')
        },
        {
          name: 'Media Gallery',
          url: `${webId?.split('/profile')[0]}/media/`,
          type: 'private',
          description: 'Photos, videos, and audio files',
          icon: Image,
          fileCount: 24,
          lastModified: new Date('2024-01-19')
        },
        {
          name: 'Calendar Events',
          url: `${webId?.split('/profile')[0]}/calendar/`,
          type: 'private',
          description: 'Schedule and event data',
          icon: Calendar,
          fileCount: 6,
          lastModified: new Date('2024-01-21')
        }
      ];
      
      setDataspaces(demoDataspaces);
      setIsLoading(false);
    };

    loadDataspaces();
  }, [webId]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'shared': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'private': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public': return <Globe className="w-3 h-3" />;
      case 'shared': return <Users className="w-3 h-3" />;
      case 'private': return <Lock className="w-3 h-3" />;
      default: return <Lock className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Your Dataspaces</h2>
          <p className="text-muted-foreground">
            Explore your Solid Pod's data containers and storage spaces
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Skeleton className="h-8 w-8 rounded-lg mr-3" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Your Dataspaces</h2>
        <p className="text-muted-foreground">
          Explore your Solid Pod's data containers and storage spaces. Each dataspace represents a different area of your Pod where data is organized.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dataspaces.map((dataspace, index) => {
          const IconComponent = dataspace.icon;
          
          return (
            <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">
                    {dataspace.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className={`text-xs ${getTypeColor(dataspace.type)}`}>
                      {getTypeIcon(dataspace.type)}
                      <span className="ml-1 capitalize">{dataspace.type}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <CardDescription className="text-xs line-clamp-2">
                  {dataspace.description}
                </CardDescription>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{dataspace.fileCount} items</span>
                  <span>{dataspace.lastModified.toLocaleDateString()}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                  onClick={() => window.open(dataspace.url, '_blank')}
                >
                  <span>Explore</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Card className="bg-gradient-card shadow-card border-dashed">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Folder className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Create New Dataspace</CardTitle>
          <CardDescription>
            Organize your data by creating custom dataspaces for different purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            variant="outline" 
            className="bg-background hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
          >
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataspacesDemo;