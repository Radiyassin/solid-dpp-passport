import { useState, useEffect } from 'react';
import { SolidAuthService } from '@/services/solidAuth';
import SolidLogin from '@/components/SolidLogin';
import AdminDPPManager from '@/components/AdminDPPManager';
import OrgPodSetup from '@/components/OrgPodSetup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, LogOut, Home, Settings, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    const initializeAuth = async () => {
      await auth.initializeSession();
      const loginStatus = auth.isLoggedIn();
      setIsLoggedIn(loginStatus);
      
      if (loginStatus) {
        setUserInfo(auth.getSessionInfo());
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLoginAttempt = () => {
    setIsLoading(true);
  };

  const handleLogout = async () => {
    await auth.logout();
    setIsLoggedIn(false);
    setUserInfo(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-glow mx-auto">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <SolidLogin onLoginAttempt={handleLoginAttempt} />;
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      <div className="container mx-auto p-6">
        {/* Admin Header */}
        <Card className="bg-gradient-card shadow-card border-0 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Admin Panel</CardTitle>
                  <CardDescription>
                    Manage Digital Product Passports and System Configuration
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/">
                  <Button variant="outline" size="sm">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Logged in as:</p>
              <p className="font-medium text-foreground break-all">{userInfo?.webId}</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <Tabs defaultValue="dpps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="dpps" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              DPP Manager
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Org Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dpps">
            <AdminDPPManager />
          </TabsContent>

          <TabsContent value="setup">
            <OrgPodSetup />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;