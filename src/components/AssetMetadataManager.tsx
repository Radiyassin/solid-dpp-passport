import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Asset,
  AssetService,
  AddAssetMetadataInput,
  AssetMetadata 
} from '@/services/assetService';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  Plus, 
  Trash2, 
  Database, 
  Calendar,
  Globe,
  FileText,
  DollarSign,
  MapPin,
  Clock,
  Link,
  Languages,
  Save,
  X,
  Edit
} from 'lucide-react';

interface AssetMetadataManagerProps {
  asset: Asset;
  onUpdate: () => void;
}

const AssetMetadataManager = ({ asset, onUpdate }: AssetMetadataManagerProps) => {
  const [showAddMetadataDialog, setShowAddMetadataDialog] = useState(false);
  
  const [newMetadata, setNewMetadata] = useState<AddAssetMetadataInput>({
    title: '',
    description: '',
  });

  const assetService = AssetService.getInstance();
  const auth = SolidAuthService.getInstance();
  const currentWebId = auth.getWebId();
  
  const isAdmin = asset.members.find(m => m.webId === currentWebId)?.role === 'admin';
  const canWrite = isAdmin || asset.members.find(m => m.webId === currentWebId)?.role === 'write';

  const resetForm = () => {
    setNewMetadata({
      title: '',
      description: '',
    });
  };

  const handleAddMetadata = async () => {
    if (!newMetadata.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a title for the metadata',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assetService.addAssetMetadata(asset.dataSpaceId, asset.id, newMetadata);
      resetForm();
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
      await assetService.removeAssetMetadata(asset.dataSpaceId, asset.id, metadataId);
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

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString();
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field: string, value: string) => {
    setNewMetadata(prev => ({
      ...prev,
      [field]: value ? new Date(value) : undefined
    }));
  };

  const addCategory = (category: string) => {
    if (category && !newMetadata.categories?.includes(category)) {
      setNewMetadata(prev => ({
        ...prev,
        categories: [...(prev.categories || []), category]
      }));
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setNewMetadata(prev => ({
      ...prev,
      categories: prev.categories?.filter(cat => cat !== categoryToRemove) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Metadata Section */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Asset Metadata ({asset.metadata?.length || 0})
              </CardTitle>
              <CardDescription>
                Detailed asset information for this asset
              </CardDescription>
            </div>
            {canWrite && (
              <Dialog open={showAddMetadataDialog} onOpenChange={setShowAddMetadataDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset Metadata
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Asset Metadata</DialogTitle>
                    <DialogDescription>
                      Fill out comprehensive information about this asset
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="metadata-title">Title *</Label>
                      <Input
                        id="metadata-title"
                        placeholder="Asset title"
                        value={newMetadata.title}
                        onChange={(e) => setNewMetadata(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Asset Created</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(newMetadata.assetCreated)}
                        onChange={(e) => handleDateChange('assetCreated', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Asset Last Modified</Label>
                      <Input
                        type="date"
                        value={formatDateForInput(newMetadata.assetLastModified)}
                        onChange={(e) => handleDateChange('assetLastModified', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Detailed description of the asset"
                        value={newMetadata.description || ''}
                        onChange={(e) => setNewMetadata(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      resetForm();
                      setShowAddMetadataDialog(false);
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMetadata}>
                      Add Asset Metadata
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {asset.metadata && asset.metadata.length > 0 ? (
            <div className="space-y-4">
              {asset.metadata.map((metadata) => (
                <Card key={metadata.id} className="border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{metadata.title}</CardTitle>
                        {metadata.description && (
                          <CardDescription className="mt-2">
                            {metadata.description}
                          </CardDescription>
                        )}
                      </div>
                      {canWrite && (
                        <Button
                          onClick={() => handleRemoveMetadata(metadata.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {metadata.assetCreated && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Asset Created</Label>
                          <p>{formatDate(metadata.assetCreated)}</p>
                        </div>
                      )}
                      {metadata.assetLastModified && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Last Modified</Label>
                          <p>{formatDate(metadata.assetLastModified)}</p>
                        </div>
                      )}
                      {metadata.originalTitle && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Original Title</Label>
                          <p>{metadata.originalTitle}</p>
                        </div>
                      )}
                      {metadata.dataFormat && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Data Format</Label>
                          <p>{metadata.dataFormat}</p>
                        </div>
                      )}
                      {metadata.chargeable !== undefined && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Chargeable</Label>
                          <Badge variant={metadata.chargeable ? "destructive" : "secondary"}>
                            {metadata.chargeable ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      )}
                      {metadata.updateFrequency && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Update Frequency</Label>
                          <p>{metadata.updateFrequency}</p>
                        </div>
                      )}
                      {metadata.geographicCoverage && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Geographic Coverage</Label>
                          <p>{metadata.geographicCoverage}</p>
                        </div>
                      )}
                      {metadata.categories && metadata.categories.length > 0 && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <Label className="text-xs font-medium text-muted-foreground">Categories</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {metadata.categories.map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {metadata.openDataSourceLink && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <Label className="text-xs font-medium text-muted-foreground">Open Data Source</Label>
                          <p>
                            <a href={metadata.openDataSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">
                              {metadata.openDataSourceLink}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                      Created on {formatDate(metadata.createdAt)} by {metadata.createdBy}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No asset metadata entries yet</p>
              {canWrite && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add comprehensive asset metadata to describe and categorize this asset
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetMetadataManager;