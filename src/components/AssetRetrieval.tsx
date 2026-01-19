import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Download, 
  RefreshCw, 
  FileText, 
  FolderDown,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Terminal,
  File,
  Image,
  FileJson,
} from 'lucide-react';
import { AssetRetrievalService, RetrievedAsset, RetrievalResult } from '@/services/assetRetrievalService';

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('json')) return FileJson;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const AssetRetrieval: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RetrievalResult | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commandInput, setCommandInput] = useState('');

  const assetService = AssetRetrievalService.getInstance();

  const handleCommand = useCallback(async (command: string) => {
    const trimmedCommand = command.trim().toLowerCase();
    
    if (trimmedCommand === '-retrieve last-assets' || trimmedCommand === 'retrieve last-assets') {
      await executeRetrieval();
    } else if (trimmedCommand.startsWith('-retrieve last-assets ')) {
      const limitMatch = trimmedCommand.match(/limit[=:]?(\d+)/i);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : undefined;
      await executeRetrieval(limit);
    } else {
      toast.error('Unknown command. Use: -retrieve last-assets');
    }
  }, []);

  const executeRetrieval = async (limit?: number) => {
    setIsLoading(true);
    setResult(null);
    setSelectedAssets(new Set());

    try {
      const retrievalResult = await assetService.retrieveLastAssets(limit);
      setResult(retrievalResult);
      
      if (retrievalResult.success) {
        toast.success(`Retrieved ${retrievalResult.totalAssets} assets`);
      } else {
        toast.error('Asset retrieval completed with errors');
      }
    } catch (error) {
      toast.error('Failed to retrieve assets');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (!result) return;
    
    const filteredAssets = getFilteredAssets();
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(filteredAssets.map(a => a.id)));
    }
  };

  const handleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleDownloadSelected = async () => {
    if (!result || selectedAssets.size === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    const assetsToDownload = result.retrievedAssets.filter(a => selectedAssets.has(a.id));
    let downloaded = 0;

    for (const asset of assetsToDownload) {
      try {
        const blob = await assetService.downloadAsset(asset);
        assetService.triggerDownload(blob, asset.fileName);
        downloaded++;
        setDownloadProgress((downloaded / assetsToDownload.length) * 100);
      } catch (error) {
        console.error(`Failed to download ${asset.fileName}:`, error);
        toast.error(`Failed to download ${asset.fileName}`);
      }
    }

    setIsDownloading(false);
    toast.success(`Downloaded ${downloaded} assets`);
  };

  const handleDownloadManifest = () => {
    if (!result) return;

    const manifest = assetService.generateManifest(result.retrievedAssets);
    const blob = new Blob([manifest], { type: 'application/json' });
    assetService.triggerDownload(blob, 'assets-manifest.json');
    toast.success('Manifest downloaded');
  };

  const getFilteredAssets = (): RetrievedAsset[] => {
    if (!result) return [];
    
    if (!searchQuery.trim()) {
      return result.retrievedAssets;
    }

    const query = searchQuery.toLowerCase();
    return result.retrievedAssets.filter(asset =>
      asset.title.toLowerCase().includes(query) ||
      asset.fileName.toLowerCase().includes(query) ||
      asset.dataSpaceName.toLowerCase().includes(query) ||
      asset.category.toLowerCase().includes(query)
    );
  };

  const filteredAssets = getFilteredAssets();

  return (
    <div className="space-y-6">
      {/* Command Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Asset Retrieval Command
          </CardTitle>
          <CardDescription>
            Query the Solid database for all assets uploaded via the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                $
              </span>
              <Input
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCommand(commandInput);
                  }
                }}
                placeholder="-retrieve last-assets"
                className="pl-8 font-mono"
              />
            </div>
            <Button 
              onClick={() => handleCommand(commandInput || '-retrieve last-assets')}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Execute</span>
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => executeRetrieval()}
              disabled={isLoading}
            >
              <FolderDown className="h-4 w-4 mr-2" />
              Retrieve All Assets
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => executeRetrieval(10)}
              disabled={isLoading}
            >
              Retrieve Last 10
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => executeRetrieval(50)}
              disabled={isLoading}
            >
              Retrieve Last 50
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Querying Solid database...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  Retrieval Results
                </CardTitle>
                <CardDescription>
                  Found {result.totalAssets} assets
                  {result.errors.length > 0 && ` (${result.errors.length} errors)`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadManifest}
                  disabled={result.retrievedAssets.length === 0}
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Download Manifest
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadSelected}
                  disabled={selectedAssets.size === 0 || isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download Selected ({selectedAssets.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Select All */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All ({filteredAssets.length})
                </Label>
              </div>
            </div>

            {/* Download Progress */}
            {isDownloading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Downloading assets...</span>
                  <span>{Math.round(downloadProgress)}%</span>
                </div>
                <Progress value={downloadProgress} />
              </div>
            )}

            {/* Asset List */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredAssets.map((asset) => {
                  const FileIcon = getFileIcon(asset.mimeType);
                  
                  return (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selectedAssets.has(asset.id) 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedAssets.has(asset.id)}
                        onCheckedChange={() => handleSelectAsset(asset.id)}
                      />
                      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{asset.title || asset.fileName}</span>
                          {asset.category && (
                            <Badge variant="secondary" className="text-xs">
                              {asset.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="truncate">{asset.fileName}</span>
                          <span>{formatFileSize(asset.fileSize)}</span>
                          <span>{asset.dataSpaceName}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {asset.uploadedAt.toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            const blob = await assetService.downloadAsset(asset);
                            assetService.triggerDownload(blob, asset.fileName);
                            toast.success(`Downloaded ${asset.fileName}`);
                          } catch (error) {
                            toast.error(`Failed to download ${asset.fileName}`);
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                {filteredAssets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No assets match your search' : 'No assets found'}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Errors:</h4>
                <ul className="text-sm text-destructive/80 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
