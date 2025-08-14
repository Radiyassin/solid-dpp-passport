import { useState, useEffect } from 'react';
import { SolidAuthService } from '@/services/solidAuth';
import SolidLogin from '@/components/SolidLogin';
import DataSpaceSidebar from '@/components/DataSpaceSidebar';
import DataSpaceDashboard from '@/components/DataSpaceDashboard';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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

  const handleLogout = async () => {
    await auth.logout();
    setIsAuthenticated(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DataSpaceSidebar onLogout={handleLogout} />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-sidebar-border bg-card/50 backdrop-blur-sm">
            <SidebarTrigger className="ml-4" />
          </header>
          <main className="flex-1 overflow-auto">
            <DataSpaceDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
