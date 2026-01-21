import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AlertCircle,
  User,
  Trash2
} from 'lucide-react';

const AuditDemo = () => {
  const [demoEvent, setDemoEvent] = useState<Partial<AuditEventInput>>({
    action: 'Create',
    resourceType: 'DataSpace',
    resourceName: 'Test DataSpace',
    description: 'Test user created a new dataspace',
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

      const userName = userWebId.split('/profile')[0].split('/').pop() || 'Unknown User';

      const completeEvent: AuditEventInput = {
        userId: userWebId,
        userName,
        action: demoEvent.action ,
        resourceType: demoEvent.resourceType || 'Resource',
        resourceName: demoEvent.resourceName || 'Test Resource',
        description: demoEvent.description || `${userName} performed ${demoEvent.action?.toLowerCase()} on ${demoEvent.resourceType}`,
      };

      await auditService.logEvent(completeEvent);

      setAuditStatus('success');
      toast({
        title: 'Audit Event Created',
        description: 'Test audit event has been logged successfully.',
      });
    } catch (error) {
      console.error('Failed to create test audit event:', error);
      setAuditStatus('error');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create audit event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Login': return <User className="w-4 h-4" />;
      case 'Create': return <FileText className="w-4 h-4" />;
      case 'Update': return <Activity className="w-4 h-4" />;
      case 'Delete': return <Trash2 className="w-4 h-4" />;
      case 'View': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (auditStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Database className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (auditStatus) {
      case 'success':
        return 'Audit event created successfully!';
      case 'error':
        return 'Failed to create audit event.';
      default:
        return 'Ready to test audit logging.';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>Audit System Demo</CardTitle>
            <CardDescription>
              Test the JSON-based audit logging system
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusMessage()}</span>
        </div>

        {/* Event Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select
                value={demoEvent.action}
                onValueChange={(value) => setDemoEvent(prev => ({ ...prev, action: value any}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Login">Login</SelectItem>
                  <SelectItem value="Create">Create</SelectItem>
                  <SelectItem value="Update">Update</SelectItem>
                  <SelectItem value="Delete">Delete</SelectItem>
                  <SelectItem value="View">View</SelectItem>
                  <SelectItem value="Interaction">Interaction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                value={demoEvent.resourceType}
                onValueChange={(value) => setDemoEvent(prev => ({ ...prev, resourceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DataSpace">DataSpace</SelectItem>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="Authentication">Authentication</SelectItem>
                  <SelectItem value="UI Element">UI Element</SelectItem>
                  <SelectItem value="File">File</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resourceName">Resource Name</Label>
            <Input
              id="resourceName"
              value={demoEvent.resourceName}
              onChange={(e) => setDemoEvent(prev => ({ ...prev, resourceName: e.target.value }))}
              placeholder="e.g., My DataSpace, asset-123, login-button"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={demoEvent.description}
              onChange={(e) => setDemoEvent(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Human-readable description of the action"
              rows={3}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Event Preview</Label>
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              {getActionIcon(demoEvent.action || 'Create')}
              <span className="font-medium">{demoEvent.action}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm bg-secondary px-2 py-1 rounded">
                {demoEvent.resourceType}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {demoEvent.description || `User performed ${demoEvent.action?.toLowerCase()} on ${demoEvent.resourceType} "${demoEvent.resourceName}"`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={handleTestAudit}
            disabled={isLoading || !auth.isLoggedIn()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Create Test Event
              </>
            )}
          </Button>
        </div>

        {!auth.isLoggedIn() && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Please log in to test audit logging functionality.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditDemo;