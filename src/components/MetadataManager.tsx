import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  DataSpace, 
  DataSpaceService, 
  AddMetadataInput,
  DataSpaceMetadata 
} from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  Plus, 
  Trash2, 
  Tag, 
  Database, 
  Calendar,
  Hash,
  Type,
  Link,
  ToggleLeft,
  X,
  Save
} from 'lucide-react';

interface MetadataManagerProps {
  dataSpace: DataSpace;
  onUpdate: () => void;
}

const MetadataManager = ({ dataSpace, onUpdate }: MetadataManagerProps) => {
  const [showAddMetadataDialog, setShowAddMetadataDialog] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [tempTags, setTempTags] = useState<string[]>(dataSpace.tags || []);
  
  const [newMetadata, setNewMetadata] = useState<AddMetadataInput>({
    key: '',
    value: '',
    type: 'string',
    category: '',
  });

  const dataSpaceService = DataSpaceService.getInstance();
  const auth = SolidAuthService.getInstance();
  const currentWebId = auth.getWebId();
  
  const isAdmin = dataSpace.members.find(m => m.webId === currentWebId)?.role === 'admin';
  const canWrite = isAdmin || dataSpace.members.find(m => m.webId === currentWebId)?.role === 'write';

  const handleAddMetadata = async () => {
    if (!newMetadata.key.trim() || !newMetadata.value.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both key and value',
        variant: 'destructive',
      });
      return;
    }

    try {
      await dataSpaceService.addMetadata(dataSpace.id, newMetadata);
      setNewMetadata({
        key: '',
        value: '',
        type: 'string',
        category: '',
      });
      setShowAddMetadataDialog(false);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Metadata added successfully',
      });
    } catch (error) {
      console.error('Error adding metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to add metadata',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMetadata = async (metadataId: string) => {
    try {
      await dataSpaceService.removeMetadata(dataSpace.id, metadataId);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Metadata removed successfully',
      });
    } catch (error) {
      console.error('Error removing metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove metadata',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTags = async () => {
    try {
      await dataSpaceService.updateDataSpaceTags(dataSpace.id, tempTags);
      setEditingTags(false);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Tags updated successfully',
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tags',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEditTags = () => {
    setTempTags(dataSpace.tags || []);
    setEditingTags(false);
    setNewTagInput('');
  };

  const addTag = () => {
    const tag = newTagInput.trim();
    if (tag && !tempTags.includes(tag)) {
      setTempTags([...tempTags, tag]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTempTags(tempTags.filter(tag => tag !== tagToRemove));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <Type className="w-4 h-4" />;
      case 'number':
        return <Hash className="w-4 h-4" />;
      case 'boolean':
        return <ToggleLeft className="w-4 h-4" />;
      case 'date':
        return <Calendar className="w-4 h-4" />;
      case 'url':
        return <Link className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'number':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'boolean':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'date':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'url':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getAllCategories = () => {
    const categories = new Set<string>();
    dataSpace.metadata.forEach(m => {
      if (m.category) categories.add(m.category);
    });
    return Array.from(categories);
  };

  return (
    <div className="space-y-6">
      {/* Tags Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags ({dataSpace.tags?.length || 0})
              </CardTitle>
              <CardDescription>
                Organize and categorize this Data Space
              </CardDescription>
            </div>
            {canWrite && (
              <div className="flex gap-2">
                {editingTags ? (
                  <>
                    <Button onClick={handleSaveTags} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancelEditTags} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditingTags(true)} variant="outline" size="sm">
                    <Tag className="w-4 h-4 mr-2" />
                    Edit Tags
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingTags ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tempTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dataSpace.tags && dataSpace.tags.length > 0 ? (
                dataSpace.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No tags assigned</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Metadata ({dataSpace.metadata?.length || 0})
              </CardTitle>
              <CardDescription>
                Key-value metadata indexed in the Data Space pod
              </CardDescription>
            </div>
            {canWrite && (
              <Dialog open={showAddMetadataDialog} onOpenChange={setShowAddMetadataDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Metadata
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Metadata</DialogTitle>
                    <DialogDescription>
                      Add key-value metadata that will be indexed in the Data Space pod
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="metadata-key">Key</Label>
                      <Input
                        id="metadata-key"
                        placeholder="e.g., project-status, contact-email"
                        value={newMetadata.key}
                        onChange={(e) => setNewMetadata(prev => ({ ...prev, key: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="metadata-value">Value</Label>
                      <Input
                        id="metadata-value"
                        placeholder="e.g., active, john@example.com"
                        value={newMetadata.value}
                        onChange={(e) => setNewMetadata(prev => ({ ...prev, value: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="metadata-type">Type</Label>
                      <Select 
                        value={newMetadata.type} 
                        onValueChange={(value: any) => setNewMetadata(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="metadata-category">Category (Optional)</Label>
                      <Input
                        id="metadata-category"
                        placeholder="e.g., project, contact, technical"
                        value={newMetadata.category}
                        onChange={(e) => setNewMetadata(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddMetadataDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMetadata}>
                      Add Metadata
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dataSpace.metadata && dataSpace.metadata.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  {canWrite && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSpace.metadata.map((metadata) => (
                  <TableRow key={metadata.id}>
                    <TableCell className="font-medium">
                      {metadata.key}
                    </TableCell>
                    <TableCell className="max-w-xs break-all">
                      {metadata.value}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(metadata.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(metadata.type)}
                          {metadata.type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {metadata.category ? (
                        <Badge variant="outline">{metadata.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {metadata.createdAt.toLocaleDateString()}
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <Button
                          onClick={() => handleRemoveMetadata(metadata.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No metadata entries yet</p>
              {canWrite && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add key-value metadata to help organize and describe this Data Space
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetadataManager;