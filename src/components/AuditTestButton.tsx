import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuditService } from '@/services/auditService';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import { toast } from '@/hooks/use-toast';
import { SolidAuthService } from '@/services/solidAuth';

const AuditTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const auditService = AuditService.getInstance();
  const auth = SolidAuthService.getInstance();

  const testAuditLog = async () => {
    setIsLoading(true);
    try {
      const session = getDefaultSession();
      const webId = auth.getWebId();
      
      if (!session || !webId) {
        throw new Error('User not authenticated');
      }

      // Test audit event with new JSON system
      const userName = webId.split('/profile')[0].split('/').pop() || 'Test User';
      await auditService.logEvent({
        userId: webId,
        userName,
        action: 'Create',
        resourceType: 'DataSpace',
        resourceName: 'Test DataSpace',
        description: `${userName} created a test dataspace for audit testing`,
      });

      toast({
        title: 'Test Audit Log',
        description: 'Audit event created successfully!',
      });
    } catch (error) {
      console.error('Test audit failed:', error);
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={testAuditLog} 
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? 'Testing...' : 'Test Audit Log'}
    </Button>
  );
};

export default AuditTestButton;