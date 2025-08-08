import React, { useState, useEffect } from 'react';
import { Bell, User, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationService, DataSpaceInvitation } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter: React.FC = () => {
  const [invitations, setInvitations] = useState<DataSpaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const notificationService = NotificationService.getInstance();

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInvitations();
    }
  }, [isOpen]);

  const handleAccept = async (invitationId: string, dataSpaceTitle: string) => {
    try {
      await notificationService.respondToInvitation(invitationId, 'accepted');
      toast({
        title: "Invitation Accepted",
        description: `You've joined the "${dataSpaceTitle}" data space!`,
      });
      loadInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (invitationId: string, dataSpaceTitle: string) => {
    try {
      await notificationService.respondToInvitation(invitationId, 'rejected');
      toast({
        title: "Invitation Rejected",
        description: `Invitation to "${dataSpaceTitle}" has been declined.`,
      });
      loadInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (invitationId: string) => {
    try {
      await notificationService.removeInvitation(invitationId);
      loadInvitations();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const processedInvitations = invitations.filter(inv => inv.status !== 'pending');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingInvitations.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {pendingInvitations.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Manage your data space invitations and notifications
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Pending Invitations ({pendingInvitations.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <Card key={invitation.id} className="border-2 border-yellow-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <CardTitle className="text-sm">Data Space Invitation</CardTitle>
                            </div>
                            <Badge className={getStatusColor(invitation.status)}>
                              {getStatusIcon(invitation.status)}
                              <span className="ml-1 capitalize">{invitation.status}</span>
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <p className="text-sm">
                              <strong>{invitation.fromUser.split('/').pop()}</strong> invited you to join
                            </p>
                            <p className="text-sm font-medium">"{invitation.dataSpaceTitle}"</p>
                            <p className="text-xs text-muted-foreground">
                              Role: <span className="capitalize">{invitation.role}</span>
                            </p>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(invitation.id, invitation.dataSpaceTitle)}
                              className="flex-1"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(invitation.id, invitation.dataSpaceTitle)}
                              className="flex-1"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {processedInvitations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Previous Notifications
                  </h3>
                  <div className="space-y-3">
                    {processedInvitations.map((invitation) => (
                      <Card key={invitation.id} className="opacity-75">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <CardTitle className="text-sm">Data Space Invitation</CardTitle>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(invitation.status)}>
                                {getStatusIcon(invitation.status)}
                                <span className="ml-1 capitalize">{invitation.status}</span>
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemove(invitation.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <CardDescription className="text-xs">
                            {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-1">
                            <p className="text-sm">
                              <strong>{invitation.fromUser.split('/').pop()}</strong> invited you to join
                            </p>
                            <p className="text-sm font-medium">"{invitation.dataSpaceTitle}"</p>
                            <p className="text-xs text-muted-foreground">
                              Role: <span className="capitalize">{invitation.role}</span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {invitations.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};