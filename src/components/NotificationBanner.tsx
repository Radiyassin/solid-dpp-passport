import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X } from 'lucide-react';
import { DataSpaceService } from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';

interface NotificationBannerProps {
  onViewInvitations?: () => void;
}

const NotificationBanner = ({ onViewInvitations }: NotificationBannerProps) => {
  const [invitationCount, setInvitationCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const dataSpaceService = DataSpaceService.getInstance();
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    checkForInvitations();
    
    // Check for invitations every 30 seconds
    const interval = setInterval(checkForInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkForInvitations = async () => {
    try {
      const invitations = await dataSpaceService.getPendingInvitations();
      setInvitationCount(invitations.length);
      setIsVisible(invitations.length > 0);
    } catch (error) {
      console.error('Error checking invitations:', error);
    }
  };

  if (!isVisible || invitationCount === 0) return null;

  return (
    <Alert className="mb-4 border-primary bg-primary/5">
      <Bell className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>
            You have{' '}
            <Badge variant="secondary" className="mx-1">
              {invitationCount}
            </Badge>
            pending dataspace invitation{invitationCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onViewInvitations}
            size="sm"
            variant="default"
          >
            View Invitations
          </Button>
          <Button
            onClick={() => setIsVisible(false)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default NotificationBanner;