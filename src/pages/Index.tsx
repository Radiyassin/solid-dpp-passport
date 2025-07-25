import { useState, useEffect } from 'react';
import { SolidAuthService } from '@/services/solidAuth';
import SolidLogin from '@/components/SolidLogin';
import DPPDashboard from '@/components/DPPDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await auth.initializeSession();
        setIsAuthenticated(auth.isLoggedIn());
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

  return (
    <>
      {isAuthenticated ? (
        <DPPDashboard onLogout={handleLogout} />
      ) : (
        <SolidLogin onLoginAttempt={handleLoginAttempt} />
      )}
    </>
  );
};

export default Index;
