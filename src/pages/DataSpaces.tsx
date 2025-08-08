import { useState, useEffect } from 'react';
import { SolidAuthService } from '@/services/solidAuth';
import SolidLogin from '@/components/SolidLogin';
import DataSpaceManager from '@/components/DataSpaceManager';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, Settings, Database } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const DataSpaces = () => {
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
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Data Spaces</h1>
                <p className="text-xs text-muted-foreground">Collaborative data management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataSpaceManager />
      </main>
    </div>
  );
};

export default DataSpaces;