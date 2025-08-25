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

      // Test direct audit event
      await auditService.appendAuditEvent(session, {
        actorWebId: webId,
        action: 'Create',
        objectIri: `${webId.split('/profile')[0]}/test-dataspace.ttl`,
        targetIri: `${webId.split('/profile')[0]}/dataspaces/`,
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