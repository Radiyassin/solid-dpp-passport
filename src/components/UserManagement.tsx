import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AuditService } from '@/services/auditService';
import { DataSpaceService, DataSpace, DataSpaceRole } from '@/services/dataSpaceService';
import { 
  Users, 
  UserPlus, 
  Calendar,
  Database,
  Loader2,
  Shield,
  Clock
} from 'lucide-react';

interface LoggedInUser {
  userId: string;
  userName: string;
  loginCount: number;
  lastLogin: string;
}

const UserManagement = () => {
  const [loggedInUsers, setLoggedInUsers] = useState<LoggedInUser[]>([]);
  const [dataSpaces, setDataSpaces] = useState<DataSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDataSpace, setSelectedDataSpace] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<DataSpaceRole>('read');
  
  const auditService = AuditService.getInstance();
  const dataSpaceService = DataSpaceService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load logged in users from audit logs
      const users = auditService.getLoggedInUsers();
      setLoggedInUsers(users);
      
      // Load available dataspaces
      const spaces = await dataSpaceService.listDataSpaces();
      setDataSpaces(spaces);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async (userWebId: string, userName: string) => {
    if (!selectedDataSpace) {
      toast({
        title: 'Error',
        description: 'Please select a Data Space first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dataSpaceService.grantUserAccess(selectedDataSpace, userWebId, selectedRole);
      
      toast({
        title: 'Access Granted',
        description: `${userName} has been granted ${selectedRole} access to the selected Data Space`,
      });
      
      // Reload dataspaces to reflect changes
      const spaces = await dataSpaceService.listDataSpaces();
      setDataSpaces(spaces);
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant user access',
        variant: 'destructive',
      });
    }
  };

  const getUserDataSpaceAccess = (userWebId: string): string[] => {
    return dataSpaces
      .filter(ds => ds.members.some(member => member.webId === userWebId))
      .map(ds => `${ds.title} (${ds.members.find(m => m.webId === userWebId)?.role})`);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage user access to Data Spaces</p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={isLoading}>
          <Users className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Logged In Users ({loggedInUsers.length})
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Grant Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{loggedInUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Users who have logged in
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {loggedInUsers.filter(user => 
                    (Date.now() - new Date(user.lastLogin).getTime()) < 24 * 60 * 60 * 1000
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Spaces</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{dataSpaces.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available for access
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Overview of all users who have logged into the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Login Count</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Data Space Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loggedInUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.userName}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {user.userId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.loginCount} login{user.loginCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(user.lastLogin)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 max-w-[300px]">
                          {getUserDataSpaceAccess(user.userId).length > 0 ? (
                            getUserDataSpaceAccess(user.userId).map((access, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                {access}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No access</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Grant Data Space Access</CardTitle>
              <CardDescription>
                Select a Data Space and role, then grant access to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Space</label>
                  <Select value={selectedDataSpace} onValueChange={setSelectedDataSpace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Data Space" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSpaces.map((dataSpace) => (
                        <SelectItem key={dataSpace.id} value={dataSpace.id}>
                          {dataSpace.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={selectedRole} onValueChange={(value: DataSpaceRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="write">Write</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedDataSpace && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Grant Access to Users</h4>
                  <div className="space-y-2">
                    {loggedInUsers.map((user) => {
                      const hasAccess = getUserDataSpaceAccess(user.userId).length > 0;
                      return (
                        <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.loginCount} login{user.loginCount !== 1 ? 's' : ''} • Last: {formatDate(user.lastLogin)}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleGrantAccess(user.userId, user.userName)}
                            variant={hasAccess ? "outline" : "default"}
                            size="sm"
                            disabled={!selectedDataSpace}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Grant {selectedRole} Access
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;