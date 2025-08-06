import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from '@/hooks/use-toast';
import { DataSpaceService, AccessMode } from '@/services/dataSpaceService';
import { Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateDataSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateDataSpaceDialog = ({ open, onOpenChange, onSuccess }: CreateDataSpaceDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    purpose: '',
    accessMode: 'private' as AccessMode,
    storageLocation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const dataSpaceService = DataSpaceService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for your Data Space',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description for your Data Space',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await dataSpaceService.createDataSpace({
        title: formData.title.trim(),
        description: formData.description.trim(),
        purpose: formData.purpose.trim() || 'General collaboration',
        accessMode: formData.accessMode,
        storageLocation: formData.storageLocation.trim() || undefined,
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        purpose: '',
        accessMode: 'private',
        storageLocation: '',
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating data space:', error);
      toast({
        title: 'Error',
        description: 'Failed to create Data Space. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Data Space</DialogTitle>
          <DialogDescription>
            Set up a collaborative space for sharing and managing data with others.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Product Development Collaboration"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and scope of this Data Space..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="e.g., Research, Manufacturing, Supply Chain"
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessMode">Access Mode *</Label>
              <Select 
                value={formData.accessMode} 
                onValueChange={(value: AccessMode) => handleInputChange('accessMode', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Private</span>
                      <span className="text-sm text-muted-foreground">Only invited members can access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="restricted">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Restricted</span>
                      <span className="text-sm text-muted-foreground">Members with specific permissions</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Public</span>
                      <span className="text-sm text-muted-foreground">Anyone can discover and request access</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageLocation">Custom Storage Location (Optional)</Label>
              <Input
                id="storageLocation"
                placeholder="Leave empty for auto-generated location"
                value={formData.storageLocation}
                onChange={(e) => handleInputChange('storageLocation', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your Data Space will be created in your Solid Pod with RDF metadata. 
              You'll be automatically added as an administrator and can invite members later.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-primary hover:shadow-elevated transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Data Space'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDataSpaceDialog;