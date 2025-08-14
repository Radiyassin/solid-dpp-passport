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
import { Loader2, Info, X, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
    category: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const dataSpaceService = DataSpaceService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form data:', formData);
    
    if (!formData.title.trim()) {
      console.log('Validation failed: No title');
      toast({
        title: 'Error',
        description: 'Please enter a title for your Data Space',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.description.trim()) {
      console.log('Validation failed: No description');
      toast({
        title: 'Error',
        description: 'Please enter a description for your Data Space',
        variant: 'destructive',
      });
      return;
    }

    console.log('Form validation passed, setting loading state...');
    setIsLoading(true);
    
    try {
      console.log('Calling dataSpaceService.createDataSpace...');
      const createInput = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        purpose: formData.purpose.trim() || 'General collaboration',
        accessMode: formData.accessMode,
        storageLocation: formData.storageLocation.trim() || undefined,
        category: formData.category.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };
      console.log('Create input:', createInput);
      
      const result = await dataSpaceService.createDataSpace(createInput);
      console.log('✅ DataSpace creation returned:', result);
      
      // Reset form
      console.log('Resetting form...');
      setFormData({
        title: '',
        description: '',
        purpose: '',
        accessMode: 'private',
        storageLocation: '',
        category: '',
      });
      setTags([]);
      setNewTagInput('');
      
      console.log('Showing success toast...');
      toast({
        title: 'Success',
        description: 'Data Space created successfully!',
      });
      
      console.log('Calling onSuccess callback...');
      onSuccess();
      console.log('✅ Form submission completed successfully');
    } catch (error) {
      console.error('❌ FORM SUBMISSION ERROR:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Failed to create Data Space. Please try again.';
      
      if (error instanceof Error) {
        console.log('Processing error message:', error.message);
        if (error.message.includes('not authenticated')) {
          errorMessage = 'You are not authenticated. Please log in again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'You do not have permission to create Data Spaces in your Pod.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      console.log('Showing error toast with message:', errorMessage);
      toast({
        title: 'Error Creating Data Space',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      console.log('Setting loading state to false...');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    const tag = newTagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., Research, Manufacturing, Supply Chain"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add tag"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                          disabled={isLoading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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