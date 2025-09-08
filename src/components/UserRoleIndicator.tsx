import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SolidAuthService } from '@/services/solidAuth';
import { AuditService } from '@/services/auditService';
import { DataSpaceService, DataSpace } from '@/services/dataSpaceService';
import { Shield, User, Database, Users, Clock } from 'lucide-react';

const UserRoleIndicator = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataSpaces, setDataSpaces] = useState<DataSpace[]>([]);
  const [loggedInUsers, setLoggedInUsers] = useState<any[]>([]);
  
  const auth = SolidAuthService.getInstance();
  const auditService = AuditService.getInstance();
  const dataSpaceService = DataSpaceService.getInstance();

  useEffect(() => {
    const loadUserData = async () => {
      const sessionInfo = auth.getSessionInfo();
      const webId = auth.getWebId();
      
      if (sessionInfo.isLoggedIn && webId) {
        setUserInfo(sessionInfo);
        setIsAdmin(auditService.isAdmin(webId));
        
        // Load available dataspaces
        const spaces = await dataSpaceService.listDataSpaces();
        setDataSpaces(spaces);
        
        // Load logged in users (admin only)
        if (auditService.isAdmin(webId)) {
          const users = auditService.getLoggedInUsers();
          setLoggedInUsers(users);
        }
      }
    };

    loadUserData();
  }, []);

  if (!userInfo || !userInfo.isLoggedIn) {
    return null;
  }

  const userName = userInfo.webId?.split('/profile')[0].split('/').pop() || 'Unknown User';
  const userRole = isAdmin ? 'Administrator' : 'Regular User';

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* User Role Card */}
      <Card className="bg-gradient-card shadow-elevated border-0 min-w-[300px]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isAdmin ? 'bg-gradient-primary' : 'bg-gradient-secondary'
            }`}>
              {isAdmin ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{userName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant={isAdmin ? "default" : "secondary"}>
                  {userRole}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span>DataSpaces: {dataSpaces.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Role: {isAdmin ? 'Admin' : 'User'}</span>
            </div>
          </div>
          
          {isAdmin && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Administrator Capabilities:</p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Create Data Spaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Grant user access ({loggedInUsers.length} users available)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Full system access</span>
                </div>
              </div>
            </div>
          )}
          
          {!isAdmin && dataSpaces.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Available Data Spaces:</p>
              <div className="space-y-1">
                {dataSpaces.slice(0, 3).map((ds, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="truncate">{ds.title}</span>
                  </div>
                ))}
                {dataSpaces.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dataSpaces.length - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!isAdmin && dataSpaces.length === 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                No Data Spaces available. Contact an administrator for access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleIndicator;