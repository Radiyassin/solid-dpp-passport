import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { DataSpace, DataSpaceService, DataSpaceRole } from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';
import { AuditService } from '@/services/auditService';
import { 
  ArrowLeft, 
  Users, 
  Globe, 
  Lock, 
  Calendar,
  Database,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Shield,
  Eye,
  FileText,
  Settings,
  UserPlus,
  Upload
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataManager from './DataManager';
import AssetList from './AssetList';
import AssetDetails from './AssetDetails';
import { Asset } from '@/services/assetService';

interface DataSpaceDetailsProps {
  dataSpace: DataSpace;
  onUpdate: () => void;
  onBack: () => void;
}

const DataSpaceDetails = ({ dataSpace, onUpdate, onBack }: DataSpaceDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: dataSpace.title,
    description: dataSpace.description,
    purpose: dataSpace.purpose,
    accessMode: dataSpace.accessMode,
  });
  const [newMemberWebId, setNewMemberWebId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<DataSpaceRole>('read');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  
  const dataSpaceService = DataSpaceService.getInstance();
  const auth = SolidAuthService.getInstance();
  const auditService = AuditService.getInstance();
  const currentWebId = auth.getWebId();

  // Check if user is system admin or dataspace admin
  const isSystemAdmin = auditService.isAdmin(currentWebId);
  const isDataSpaceAdmin = dataSpace.members.find(m => m.webId === currentWebId)?.role === 'admin';
  const isAdmin = isSystemAdmin || isDataSpaceAdmin;

  const handleSaveEdit = async () => {
    try {
      await dataSpaceService.updateDataSpace(dataSpace.id, editFormData);
      setIsEditing(false);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Data Space updated successfully',
      });
    } catch (error) {
      console.error('Error updating data space:', error);
      toast({
        title: 'Error',
        description: 'Failed to update Data Space',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditFormData({
      title: dataSpace.title,
      description: dataSpace.description,
      purpose: dataSpace.purpose,
      accessMode: dataSpace.accessMode,
    });
    setIsEditing(false);
  };

  const handleAddMember = async () => {
    if (!newMemberWebId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid WebID',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🔄 Adding member:', newMemberWebId.trim(), 'with role:', newMemberRole);
      
      // Use enhanced access granting that includes Solid ACL permissions
      await dataSpaceService.grantUserAccessEnhanced(dataSpace.id, newMemberWebId.trim(), newMemberRole);
      
      setNewMemberWebId('');
      setNewMemberRole('read');
      setShowAddMemberDialog(false);
      onUpdate();
      
      toast({
        title: 'Success',
        description: `Access granted to ${newMemberWebId.trim()} with ${newMemberRole} role`,
      });
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberWebId: string) => {
    try {
      await dataSpaceService.removeMember(dataSpace.id, memberWebId);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMemberRole = async (memberWebId: string, newRole: DataSpaceRole) => {
    try {
      await dataSpaceService.updateMemberRole(dataSpace.id, memberWebId, newRole);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Member role updated successfully',
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  const getAccessModeIcon = (mode: string) => {
    switch (mode) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleIcon = (role: DataSpaceRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'write':
        return <Edit className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: DataSpaceRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'write':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 hover:bg-muted/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Button>
        
        {isAdmin && activeTab === 'overview' && (
          <div className="flex gap-2">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} variant="success" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Data Space Info */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-purpose">Purpose</Label>
                    <Input
                      id="edit-purpose"
                      value={editFormData.purpose}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-access-mode">Access Mode</Label>
                    <Select 
                      value={editFormData.accessMode} 
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, accessMode: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl">{dataSpace.title}</CardTitle>
                  <CardDescription className="text-base">
                    {dataSpace.description}
                  </CardDescription>
                </>
              )}
            </div>
            {!isEditing && (
              <Badge className="ml-4">
                <span className="flex items-center gap-1">
                  {getAccessModeIcon(dataSpace.accessMode)}
                  {dataSpace.accessMode}
                </span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Purpose</Label>
                <p className="text-sm text-muted-foreground">{dataSpace.purpose}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {dataSpace.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Storage Location</Label>
                <p className="text-sm text-muted-foreground break-all">{dataSpace.storageLocation}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Creator</Label>
                <p className="text-sm text-muted-foreground break-all">{dataSpace.creatorWebId}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="assets">
          {selectedAsset ? (
            <AssetDetails 
              asset={selectedAsset}
              dataSpaceId={dataSpace.id}
              onBack={() => setSelectedAsset(null)}
              onUpdate={() => {
                // Refresh asset data if needed
                setSelectedAsset(null);
              }}
            />
          ) : (
            <AssetList 
              dataSpaceId={dataSpace.id} 
              onAssetSelect={(asset) => setSelectedAsset(asset)}
            />
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {/* Members Management */}
          <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({dataSpace.members.length})
              </CardTitle>
              <CardDescription>
                Manage access and permissions for Data Space members
              </CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                <DialogTrigger asChild>
                  <Button variant="premium" size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                    <DialogDescription>
                      Invite someone to join this Data Space by their WebID
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="member-webid">WebID</Label>
                      <Input
                        id="member-webid"
                        placeholder="https://example.solidcommunity.net/profile/card#me"
                        value={newMemberWebId}
                        onChange={(e) => setNewMemberWebId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="member-role">Role</Label>
                      <Select value={newMemberRole} onValueChange={(value: DataSpaceRole) => setNewMemberRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read - Can view data</SelectItem>
                          <SelectItem value="write">Write - Can modify data</SelectItem>
                          <SelectItem value="admin">Admin - Full access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMember} variant="success">
                      Add Member
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WebID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSpace.members.map((member) => (
                <TableRow key={member.webId}>
                  <TableCell>
                    <div className="font-mono text-sm break-all max-w-xs">
                      {member.webId}
                      {member.webId === currentWebId && (
                        <Badge variant="secondary" className="ml-2">You</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin && member.webId !== currentWebId ? (
                      <Select 
                        value={member.role} 
                        onValueChange={(value: DataSpaceRole) => handleUpdateMemberRole(member.webId, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getRoleColor(member.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.joinedAt.toLocaleDateString()}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {member.webId !== currentWebId && (
                        <Button
                          onClick={() => handleRemoveMember(member.webId)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataSpaceDetails;