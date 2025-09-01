import { useState, useEffect } from 'react';
import { SolidAuthService } from '@/services/solidAuth';
import { AuditService } from '@/services/auditService';
import SolidLogin from '@/components/SolidLogin';
import DPPDashboard from '@/components/DPPDashboard';
import AuditLogsViewer from '@/components/AuditLogsViewer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, Database, LogOut } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';

const ORG_WEBID = "https://solid4dpp.solidcommunity.net/profile/card#me";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  const auth = SolidAuthService.getInstance();
  const auditService = AuditService.getInstance();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await auth.initializeSession();
        const isLoggedIn = auth.isLoggedIn();
        setIsAuthenticated(isLoggedIn);
        
        // Check if user is admin (org WebID or authorized users)
        if (isLoggedIn) {
          const webId = auth.getWebId();
          const isAdmin = webId === ORG_WEBID;
          setIsAdminUser(isAdmin);
          
          // JSON-based audit system is now active - no ACL setup needed
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLoginAttempt = () => {
    // This will be called when user attempts to login
    // The actual auth state change will be handled by the redirect
  };

  const handleLogout = async () => {
    await auth.logout();
    setIsAuthenticated(false);
    setIsAdminUser(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Initializing Solid session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SolidLogin onLoginAttempt={handleLoginAttempt} />;
  }

  // Show admin audit logs view for org WebID
  if (isAdminUser) {
    return (
      <div className="min-h-screen bg-gradient-secondary">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Link to="/dataspaces">
            <Button variant="outline" size="sm">
              <Database className="w-4 h-4 mr-2" />
              Data Spaces
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="container mx-auto p-6 pt-20">
          <AuditLogsViewer />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Link to="/dataspaces">
          <Button variant="outline" size="sm">
            <Database className="w-4 h-4 mr-2" />
            Data Spaces
          </Button>
        </Link>
        <Link to="/admin">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      </div>
      <DPPDashboard onLogout={handleLogout} />
    </div>
  );
};

export default Index;
