import { useState, useEffect } from 'react';
import { SolidAuthService } from '@/services/solidAuth';
import { solidLoginManager } from '@/services/solidLoginSample';
import SolidLogin from '@/components/SolidLogin';
import DPPDashboard from '@/components/DPPDashboard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, Database } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize both auth services
        await auth.initializeSession();
        const isLoggedIn = await solidLoginManager.initialize();
        setIsAuthenticated(isLoggedIn || auth.isLoggedIn());
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

  const handleLogout = () => {
    setIsAuthenticated(false);
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
