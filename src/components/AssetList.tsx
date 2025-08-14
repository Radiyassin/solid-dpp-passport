import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CreateAssetInput
} from '@/services/assetService';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  Plus, 
  Package,
  Calendar,
  Users,
  FileText,
  Database,
  Eye
} from 'lucide-react';

interface AssetListProps {
  dataSpaceId: string;
  onAssetSelect: (asset: Asset) => void;
}

const AssetList = ({ dataSpaceId, onAssetSelect }: AssetListProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAsset, setNewAsset] = useState<CreateAssetInput>({
    title: '',
    description: '',
    category: '',
    tags: [],
  });

  const assetService = AssetService.getInstance();
  const auth = SolidAuthService.getInstance();
  const currentWebId = auth.getWebId();

  const loadAssets = async () => {
    setLoading(true);
    try {
      const assetList = await assetService.listAssets(dataSpaceId);
      setAssets(assetList);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [dataSpaceId]);

  const handleCreateAsset = async () => {
    if (!newAsset.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide an asset title',
        variant: 'destructive',
      });
      return;
    }

    try {
      await assetService.createAsset(dataSpaceId, newAsset);
      setNewAsset({
        title: '',
        description: '',
        category: '',
        tags: [],
      });
      setShowCreateDialog(false);
      loadAssets();
      toast({
        title: 'Success',
        description: 'Asset created successfully',
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: 'Error',
        description: 'Failed to create asset',
        variant: 'destructive',
      });
    }
  };

  const addTag = (tag: string) => {
    if (tag && !newAsset.tags?.includes(tag)) {
      setNewAsset(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewAsset(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assets</h2>
          <p className="text-muted-foreground">
            Manage assets within this Data Space
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Asset</DialogTitle>
              <DialogDescription>
                Create a new asset to organize your data and metadata
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-title">Title *</Label>
                <Input
                  id="asset-title"
                  placeholder="Asset title"
                  value={newAsset.title}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="asset-description">Description</Label>
                <Textarea
                  id="asset-description"
                  placeholder="Describe this asset"
                  value={newAsset.description}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="asset-category">Category</Label>
                <Input
                  id="asset-category"
                  placeholder="e.g., Dataset, Report, Analysis"
                  value={newAsset.category || ''}
                  onChange={(e) => setNewAsset(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newAsset.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                      >
                        <span className="w-3 h-3">×</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setNewAsset({
                  title: '',
                  description: '',
                  category: '',
                  tags: [],
                });
                setShowCreateDialog(false);
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateAsset}>
                Create Asset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assets Grid */}
      {assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onAssetSelect(asset)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="w-5 h-5" />
                      {asset.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {asset.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{asset.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{asset.metadata.length} metadata</span>
                    </div>
                  </div>

                  {/* Category */}
                  {asset.category && (
                    <div>
                      <Badge variant="outline">{asset.category}</Badge>
                    </div>
                  )}

                  {/* Tags */}
                  {asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {asset.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{asset.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Created info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="w-3 h-3" />
                    <span>Created {asset.createdAt.toLocaleDateString()}</span>
                  </div>

                  {/* Action */}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View Asset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first asset to start organizing your data and metadata
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Asset
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssetList;