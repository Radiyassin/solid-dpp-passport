import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AuditService, AuditEventInput } from '@/services/auditService';
import { SolidAuthService } from '@/services/solidAuth';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import { 
  Activity, 
  FileText, 
  Shield, 
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AuditDemo = () => {
  const [demoEvent, setDemoEvent] = useState<Partial<AuditEventInput>>({
    action: 'Create',
    objectIri: 'https://example.solidcommunity.net/dataspaces/ds-123/assets/asset-456.ttl',
    targetIri: 'https://example.solidcommunity.net/dataspaces/ds-123/assets/',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const auditService = AuditService.getInstance();
  const auth = SolidAuthService.getInstance();

  const handleTestAudit = async () => {
    setIsLoading(true);
    setAuditStatus('idle');

    try {
      const session = getDefaultSession();
      const userWebId = auth.getWebId();

      if (!session || !session.info.isLoggedIn || !userWebId) {
        throw new Error('User not authenticated');
      }

      const completeEvent: AuditEventInput = {
        actorWebId: userWebId,
        action: demoEvent.action as any,
        objectIri: demoEvent.objectIri || '',
        targetIri: demoEvent.targetIri || '',
      };

      await auditService.appendAuditEvent(session, completeEvent);
      
      setAuditStatus('success');
      toast({
        title: 'Audit Event Created',
        description: 'Demo audit event has been logged to the organization Pod.',
      });
    } catch (error) {
      console.error('Error creating audit event:', error);
      setAuditStatus('error');
      toast({
        title: 'Audit Failed',
        description: error instanceof Error ? error.message : 'Failed to create audit event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupAuditSystem = async () => {
    setIsLoading(true);

    try {
      const session = getDefaultSession();
      
      if (!session || !session.info.isLoggedIn) {
        throw new Error('User not authenticated');
      }

      await auditService.protectAuditLdes(session);
      
      toast({
        title: 'Audit System Setup',
        description: 'Audit system has been initialized successfully.',
      });
    } catch (error) {
      console.error('Error setting up audit system:', error);
      toast({
        title: 'Setup Failed',
        description: error instanceof Error ? error.message : 'Failed to setup audit system',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Audit System Demo
          </CardTitle>
          <CardDescription>
            Test the centralized audit logging system that tracks all user actions to the organization Pod.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Organization Pod
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  https://solid4dpp.solidcommunity.net/
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Audit logs: /org/audit/ldes/
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-subtle">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Current User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-all">
                  {auth.getWebId() || 'Not authenticated'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Setup Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Initialize Audit System</h3>
            <Button 
              onClick={handleSetupAuditSystem}
              disabled={isLoading}
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Setup Audit Container & Permissions
            </Button>
            <p className="text-sm text-muted-foreground">
              This creates the audit directory structure and sets up access permissions.
            </p>
          </div>

          {/* Demo Event Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Test Audit Event</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="action">Action Type</Label>
                <select
                  id="action"
                  value={demoEvent.action}
                  onChange={(e) => setDemoEvent(prev => ({ ...prev, action: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="Create">Create</option>
                  <option value="Update">Update</option>
                  <option value="Delete">Delete</option>
                  <option value="PermissionChange">Permission Change</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectIri">Object IRI</Label>
                <Input
                  id="objectIri"
                  value={demoEvent.objectIri}
                  onChange={(e) => setDemoEvent(prev => ({ ...prev, objectIri: e.target.value }))}
                  placeholder="https://user.pod/resource.ttl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetIri">Target Container IRI</Label>
              <Input
                id="targetIri"
                value={demoEvent.targetIri}
                onChange={(e) => setDemoEvent(prev => ({ ...prev, targetIri: e.target.value }))}
                placeholder="https://user.pod/container/"
              />
            </div>

            <Button 
              onClick={handleTestAudit}
              disabled={isLoading}
              className="w-full"
            >
              {auditStatus === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
              {auditStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
              {auditStatus === 'idle' && <FileText className="w-4 h-4 mr-2" />}
              Create Audit Event
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How It Works:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• When users perform actions (create/update/delete), audit events are automatically logged</li>
              <li>• Events are stored in ActivityStreams format as TTL files</li>
              <li>• All events are centralized in the organization Pod at /org/audit/ldes/</li>
              <li>• Only admin WebIDs have access to read the audit logs</li>
              <li>• File names use ISO timestamps for chronological ordering</li>
            </ul>
          </div>

          {/* Sample Output */}
          <div className="space-y-2">
            <Label>Sample Audit Event Format:</Label>
            <Textarea
              readOnly
              value={`@prefix as: <https://www.w3.org/ns/activitystreams#> .
@prefix dct: <http://purl.org/dc/terms/> .

<>
  a as:${demoEvent.action || 'Create'} ;
  as:actor <${auth.getWebId() || 'USER_WEBID'}> ;
  as:object <${demoEvent.objectIri || 'OBJECT_IRI'}> ;
  as:target <${demoEvent.targetIri || 'TARGET_IRI'}> ;
  dct:created "${new Date().toISOString()}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .`}
              className="font-mono text-xs"
              rows={8}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditDemo;