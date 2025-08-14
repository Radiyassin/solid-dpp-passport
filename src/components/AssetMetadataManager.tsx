import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  DataSpace, 
  DataSpaceService, 
  UpdateAssetMetadataInput,
  AssetMetadata 
} from '@/services/dataSpaceService';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  Database, 
  Calendar,
  Globe,
  FileText,
  DollarSign,
  MapPin,
  Clock,
  Link,
  Tag,
  Languages,
  Save,
  Edit
} from 'lucide-react';

interface AssetMetadataManagerProps {
  dataSpace: DataSpace;
  onUpdate: () => void;
}

const AssetMetadataManager = ({ dataSpace, onUpdate }: AssetMetadataManagerProps) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<AssetMetadata>(dataSpace.assetMetadata || {});
  
  const dataSpaceService = DataSpaceService.getInstance();
  const auth = SolidAuthService.getInstance();
  const currentWebId = auth.getWebId();
  
  const isAdmin = dataSpace.members.find(m => m.webId === currentWebId)?.role === 'admin';
  const canWrite = isAdmin || dataSpace.members.find(m => m.webId === currentWebId)?.role === 'write';

  const handleSave = async () => {
    try {
      await dataSpaceService.updateAssetMetadata(dataSpace.id, formData);
      setEditMode(false);
      onUpdate();
      toast({
        title: 'Success',
        description: 'Asset metadata updated successfully',
      });
    } catch (error) {
      console.error('Error updating asset metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to update asset metadata',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setFormData(dataSpace.assetMetadata || {});
    setEditMode(false);
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
    setFormData(prev => ({
      ...prev,
      [field]: value ? new Date(value) : undefined
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Asset Metadata
              </CardTitle>
              <CardDescription>
                Core metadata information about this data space asset
              </CardDescription>
            </div>
            {canWrite && (
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button onClick={handleSave} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Asset Created
                </Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formatDateForInput(formData.assetCreated)}
                    onChange={(e) => handleDateChange('assetCreated', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(dataSpace.assetMetadata?.assetCreated)}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Asset Last Modified
                </Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formatDateForInput(formData.assetLastModified)}
                    onChange={(e) => handleDateChange('assetLastModified', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(dataSpace.assetMetadata?.assetLastModified)}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                {editMode ? (
                  <Textarea
                    placeholder="Enter asset description..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.description || 'No description provided'}
                  </p>
                )}
              </div>

              <div>
                <Label>Original Title</Label>
                {editMode ? (
                  <Input
                    placeholder="Enter original title..."
                    value={formData.originalTitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalTitle: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.originalTitle || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Open Data Source Link
                </Label>
                {editMode ? (
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.openDataSourceLink || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, openDataSourceLink: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.openDataSourceLink ? (
                      <a href={dataSpace.assetMetadata.openDataSourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {dataSpace.assetMetadata.openDataSourceLink}
                      </a>
                    ) : 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Technical Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Technical Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data Format</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., CSV, JSON, XML"
                    value={formData.dataFormat || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataFormat: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.dataFormat || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label>Resource Size</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., 10MB, 2GB"
                    value={formData.resourceSize || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, resourceSize: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.resourceSize || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label>Resource Encoding</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., UTF-8, ASCII"
                    value={formData.resourceEncoding || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, resourceEncoding: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.resourceEncoding || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Datasource Link
                </Label>
                {editMode ? (
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.datasourceLink || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, datasourceLink: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.datasourceLink ? (
                      <a href={dataSpace.assetMetadata.datasourceLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {dataSpace.assetMetadata.datasourceLink}
                      </a>
                    ) : 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Usage & Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Usage & Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Label>Chargeable</Label>
                {editMode ? (
                  <Switch
                    checked={formData.chargeable || false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chargeable: checked }))}
                  />
                ) : (
                  <Badge variant={dataSpace.assetMetadata?.chargeable ? "destructive" : "secondary"}>
                    {dataSpace.assetMetadata?.chargeable ? 'Yes' : 'No'}
                  </Badge>
                )}
              </div>

              <div>
                <Label>Use Setting</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., Research only, Commercial use allowed"
                    value={formData.useSetting || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, useSetting: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.useSetting || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Language Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Language Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Datasource Language</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., English, German, French"
                    value={formData.datasourceLanguage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, datasourceLanguage: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.datasourceLanguage || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label>Metadata Language</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., English, German, French"
                    value={formData.metadataLanguage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, metadataLanguage: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.metadataLanguage || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Temporal Coverage */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Temporal Coverage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Beginning</Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formatDateForInput(formData.temporalCoverageBeginning)}
                    onChange={(e) => handleDateChange('temporalCoverageBeginning', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(dataSpace.assetMetadata?.temporalCoverageBeginning)}
                  </p>
                )}
              </div>

              <div>
                <Label>Ending</Label>
                {editMode ? (
                  <Input
                    type="date"
                    value={formatDateForInput(formData.temporalCoverageEnding)}
                    onChange={(e) => handleDateChange('temporalCoverageEnding', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(dataSpace.assetMetadata?.temporalCoverageEnding)}
                  </p>
                )}
              </div>

              <div>
                <Label>Update Frequency</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., Daily, Weekly, Monthly, Annually"
                    value={formData.updateFrequency || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, updateFrequency: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.updateFrequency || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label>Linked Metadata</Label>
                {editMode ? (
                  <Input
                    placeholder="Enter linked metadata reference..."
                    value={formData.linkedMetadata || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedMetadata: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.linkedMetadata || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Geographic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Geographic Coverage</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., Germany, Europe, Global"
                    value={formData.geographicCoverage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, geographicCoverage: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.geographicCoverage || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <Label>Geographic Expansion</Label>
                {editMode ? (
                  <Input
                    placeholder="e.g., City-level, Country-level, Regional"
                    value={formData.geographicExpansion || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, geographicExpansion: e.target.value }))}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dataSpace.assetMetadata?.geographicExpansion || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetMetadataManager;