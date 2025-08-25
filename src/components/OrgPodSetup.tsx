import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { SolidAuthService } from '@/services/solidAuth';
import { OrgPodSetupService } from '@/services/orgPodSetup';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import { 
  Settings, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Play,
  RefreshCw
} from 'lucide-react';

const ORG_WEBID = "https://solid4dpp.solidcommunity.net/profile/card#me";

const OrgPodSetup = () => {
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verificationStatus, setVerificationStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  
  const auth = SolidAuthService.getInstance();
  const orgSetup = OrgPodSetupService.getInstance();
  const currentWebId = auth.getWebId();
  const isOrgUser = currentWebId === ORG_WEBID;

  const runSetup = async () => {
    if (!isOrgUser) {
      toast({
        title: 'Permission Denied',
        description: 'Only the org Pod owner can run this setup',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSetupRunning(true);
      setSetupStatus('idle');
      
      const session = getDefaultSession();
      await orgSetup.setupOrgPodForAuditLogging(session);
      
      setSetupStatus('success');
      toast({
        title: 'Setup Complete',
        description: 'Org Pod is now configured for audit logging',
      });
      
      // Automatically verify after setup
      await verifySetup();
      
    } catch (error) {
      console.error('Setup failed:', error);
      setSetupStatus('error');
      toast({
        title: 'Setup Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSetupRunning(false);
    }
  };

  const verifySetup = async () => {
    try {
      setIsVerifying(true);
      
      const session = getDefaultSession();
      const isValid = await orgSetup.verifyOrgPodSetup(session);
      
      setVerificationStatus(isValid ? 'valid' : 'invalid');
      
      toast({
        title: isValid ? 'Verification Passed' : 'Verification Failed',
        description: isValid 
          ? 'Org Pod is properly configured for audit logging'
          : 'Org Pod configuration issues detected',
        variant: isValid ? 'default' : 'destructive',
      });
      
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationStatus('invalid');
      toast({
        title: 'Verification Error',
        description: 'Failed to verify org Pod setup',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
      case 'valid':
        return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800';
      case 'error':
      case 'invalid':
        return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800';
      case 'unknown':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400 dark:border-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning for non-org users */}
      {!isOrgUser && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Restricted:</strong> Only the org Pod owner ({ORG_WEBID}) can configure audit logging settings.
            Current user: {currentWebId || 'Not logged in'}
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Card */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Org Pod Setup</CardTitle>
              <CardDescription>
                Configure the organization Pod for audit logging
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current User */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current User</span>
              </div>
              <p className="text-sm text-muted-foreground break-all">{currentWebId || 'Not logged in'}</p>
              <Badge className={`mt-2 ${isOrgUser ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-red-500/10 text-red-700 border-red-200'}`}>
                {isOrgUser ? 'Org Admin' : 'Regular User'}
              </Badge>
            </div>

            {/* Setup Status */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Setup Status</span>
              </div>
              <Badge className={getStatusColor(setupStatus)}>
                {setupStatus === 'success' && '✅ Completed'}
                {setupStatus === 'error' && '❌ Failed'}
                {setupStatus === 'idle' && '⏳ Not Run'}
              </Badge>
            </div>
          </div>

          {/* Setup Description */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What this setup does:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Creates the audit LDES container structure (/org/audit/ldes/)</li>
              <li>• Sets up ACL permissions for audit logging</li>
              <li>• Allows authenticated users to append audit logs</li>
              <li>• Restricts read access to org administrators only</li>
            </ul>
          </div>

          {/* Setup Button */}
          <div className="flex gap-4">
            <Button 
              onClick={runSetup}
              disabled={!isOrgUser || isSetupRunning}
              className="bg-gradient-primary hover:shadow-elevated transition-all duration-300"
            >
              {isSetupRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running Setup...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Setup
                </>
              )}
            </Button>

            <Button 
              onClick={verifySetup}
              disabled={isVerifying}
              variant="outline"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Setup
                </>
              )}
            </Button>
          </div>

          {/* Verification Status */}
          {verificationStatus !== 'unknown' && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Verification Result</span>
              </div>
              <Badge className={getStatusColor(verificationStatus)}>
                {verificationStatus === 'valid' && '✅ Configuration Valid'}
                {verificationStatus === 'invalid' && '❌ Configuration Issues'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to enable audit logging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium">Login as Org Admin</h4>
                <p className="text-sm text-muted-foreground">
                  Log in with the org WebID: {ORG_WEBID}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium">Run Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Run Setup" to configure the Pod structure and permissions
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium">Verify Configuration</h4>
                <p className="text-sm text-muted-foreground">
                  Run verification to ensure everything is set up correctly
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-primary text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-medium">Test Audit Logging</h4>
                <p className="text-sm text-muted-foreground">
                  Users can now create dataspaces and audit logs will appear in the admin view
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgPodSetup;