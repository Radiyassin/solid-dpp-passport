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
import { Asset, AssetService } from '@/services/assetService';
import { DataSpaceRole } from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  ArrowLeft, 
  Users, 
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
  Package
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
import AssetMetadataManager from './AssetMetadataManager';
import DataManager from './DataManager';

interface AssetDetailsProps {
  asset: Asset;
  onUpdate: () => void;
  onBack: () => void;
}

const AssetDetails = ({ asset, onUpdate, onBack }: AssetDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormData, setEditFormData] = useState({
    title: asset.title,
    description: asset.description,
  });
  const [newMemberWebId, setNewMemberWebId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<DataSpaceRole>('read');
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  
  const assetService = AssetService.getInstance();
  const auth = SolidAuthService.getInstance();
  const currentWebId = auth.getWebId();

  const isAdmin = asset.members.find(m => m.webId === currentWebId)?.role === 'admin';

  const handleSaveEdit = async () => {
    try {
      await assetService.updateAsset(asset.dataSpaceId, asset.id, editFormData);
      setIsEditing(false);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Asset updated successfully',
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to update asset',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditFormData({
      title: asset.title,
      description: asset.description,
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
      await assetService.addAssetMember(asset.dataSpaceId, asset.id, newMemberWebId.trim(), newMemberRole);
      setNewMemberWebId('');
      setNewMemberRole('read');
      setShowAddMemberDialog(false);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Member added successfully',
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
      await assetService.removeAssetMember(asset.dataSpaceId, asset.id, memberWebId);
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
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assets
        </Button>
        
        {isAdmin && activeTab === 'overview' && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveEdit} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Asset Info */}
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
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        {asset.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {asset.description}
                      </CardDescription>
                    </>
                  )}
                </div>
                {!isEditing && asset.category && (
                  <Badge className="ml-4">
                    {asset.category}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {asset.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Creator</Label>
                    <p className="text-sm text-muted-foreground break-all">{asset.creatorWebId}</p>
                  </div>
                  {asset.tags.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {asset.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metadata">
          <AssetMetadataManager 
            asset={asset} 
            onUpdate={onUpdate}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {/* Members Management */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members ({asset.members.length})
                  </CardTitle>
                  <CardDescription>
                    Manage access and permissions for asset members
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Member</DialogTitle>
                        <DialogDescription>
                          Invite someone to access this asset by their WebID
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
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMember}>
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
                  {asset.members.map((member) => (
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
                        <Badge className={getRoleColor(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                        </Badge>
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

        <TabsContent value="data">
          <DataManager dataSpace={{ 
            ...asset, 
            storageLocation: `${asset.dataSpaceId}/assets/${asset.id}/` 
          } as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetDetails;