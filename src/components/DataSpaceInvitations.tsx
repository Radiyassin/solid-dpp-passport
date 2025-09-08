import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Bell, 
  Check, 
  X, 
  Users, 
  Calendar, 
  ExternalLink, 
  Database,
  User,
  Clock
} from 'lucide-react';
import { DataSpaceService, DataSpace } from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';

interface DataSpaceInvitation {
  id: string;
  dataSpaceId: string;
  dataSpaceTitle: string;
  dataSpaceDescription: string;
  invitedBy: string;
  invitedAt: Date;
  adminName: string;
  membersCount: number;
  previewItems: string[];
}

const DataSpaceInvitations = () => {
  const [invitations, setInvitations] = useState<DataSpaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewDataSpace, setPreviewDataSpace] = useState<DataSpace | null>(null);
  
  const dataSpaceService = DataSpaceService.getInstance();
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const pendingInvitations = await dataSpaceService.getPendingInvitations();
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error loading invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dataspace invitations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: DataSpaceInvitation) => {
    try {
      await dataSpaceService.acceptInvitation(invitation.id);
      await loadInvitations();
      
      toast({
        title: 'Invitation Accepted',
        description: `You have been added to "${invitation.dataSpaceTitle}"`,
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineInvitation = async (invitation: DataSpaceInvitation) => {
    try {
      await dataSpaceService.declineInvitation(invitation.id);
      await loadInvitations();
      
      toast({
        title: 'Invitation Declined',
        description: `You declined the invitation to "${invitation.dataSpaceTitle}"`,
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewDataSpace = async (invitation: DataSpaceInvitation) => {
    try {
      const dataSpace = await dataSpaceService.getDataSpace(invitation.dataSpaceId);
      setPreviewDataSpace(dataSpace);
    } catch (error) {
      console.error('Error previewing dataspace:', error);
      toast({
        title: 'Error',
        description: 'Failed to preview dataspace',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Bell className="w-8 h-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading invitations...</p>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="text-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
          <p className="text-muted-foreground">
            You don't have any pending dataspace invitations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Dataspace Invitations</h2>
        <Badge variant="secondary" className="ml-2">
          {invitations.length} pending
        </Badge>
      </div>

      <div className="space-y-4">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="bg-gradient-card shadow-card border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    {invitation.dataSpaceTitle}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {invitation.dataSpaceDescription}
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Invitation
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Invited by: <strong>{invitation.adminName}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{invitation.membersCount} member{invitation.membersCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{invitation.invitedAt.toLocaleDateString()}</span>
                </div>
              </div>

              {invitation.previewItems.length > 0 && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Preview of contents:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {invitation.previewItems.slice(0, 3).map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {item}
                      </li>
                    ))}
                    {invitation.previewItems.length > 3 && (
                      <li className="text-xs">
                        +{invitation.previewItems.length - 3} more items
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handlePreviewDataSpace(invitation)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview Details
                </Button>
                <Button
                  onClick={() => handleAcceptInvitation(invitation)}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleDeclineInvitation(invitation)}
                  variant="destructive"
                  size="sm"
                  className="px-4"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDataSpace && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview: {previewDataSpace.title}</CardTitle>
                <Button
                  onClick={() => setPreviewDataSpace(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>Description:</strong> {previewDataSpace.description}</p>
              <p><strong>Purpose:</strong> {previewDataSpace.purpose}</p>
              <p><strong>Access Mode:</strong> {previewDataSpace.accessMode}</p>
              <p><strong>Members:</strong> {previewDataSpace.members.length}</p>
              
              {previewDataSpace.metadata.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Data:</h4>
                  <div className="space-y-2">
                    {previewDataSpace.metadata.slice(0, 5).map((item, index) => (
                      <div key={index} className="bg-muted/50 p-2 rounded text-sm">
                        <strong>{item.title}</strong>
                        {item.description && <p className="text-muted-foreground">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DataSpaceInvitations;