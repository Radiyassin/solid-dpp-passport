/**
 * Local Sync Service
 * Automatically saves uploaded files to the browser's local storage
 * and provides download functionality for syncing to local DATA folder
 */

export interface LocalAsset {
  originalUrl: string;
  fileName: string;
  content: string | ArrayBuffer;
  contentType: string;
  uploadedAt: string;
  type: 'dpp' | 'dataspace';
  dataSpaceId?: string;
}

export interface SyncManifest {
  lastSync: string;
  assets: {
    originalUrl: string;
    localPath: string;
    type: string;
    contentType: string;
    timestamp: string;
  }[];
}

class LocalSyncService {
  private static instance: LocalSyncService;
  private assets: LocalAsset[] = [];
  private storageKey = 'solid_local_assets';
  private manifestKey = 'solid_sync_manifest';

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): LocalSyncService {
    if (!LocalSyncService.instance) {
      LocalSyncService.instance = new LocalSyncService();
    }
    return LocalSyncService.instance;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.assets = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load local assets from storage:', error);
      this.assets = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.assets));
      this.updateManifest();
    } catch (error) {
      console.error('Failed to save local assets to storage:', error);
    }
  }

  private updateManifest(): void {
    const manifest: SyncManifest = {
      lastSync: new Date().toISOString(),
      assets: this.assets.map(asset => ({
        originalUrl: asset.originalUrl,
        localPath: this.getLocalPath(asset),
        type: asset.type,
        contentType: asset.contentType,
        timestamp: asset.uploadedAt,
      })),
    };
    localStorage.setItem(this.manifestKey, JSON.stringify(manifest));
  }

  private getLocalPath(asset: LocalAsset): string {
    if (asset.type === 'dpp') {
      return `DATA/dpp/${asset.fileName}`;
    }
    return `DATA/dataspaces/${asset.dataSpaceId}/data/${asset.fileName}`;
  }

  /**
   * Store a DPP file locally after upload
   */
  async storeDPP(file: File, podUrl: string): Promise<void> {
    const content = await file.text();
    const fileName = file.name.endsWith('.ttl') ? file.name : `${file.name}.ttl`;
    
    const asset: LocalAsset = {
      originalUrl: `${podUrl}dpp/${fileName}`,
      fileName,
      content,
      contentType: 'text/turtle',
      uploadedAt: new Date().toISOString(),
      type: 'dpp',
    };

    // Remove existing file with same name
    this.assets = this.assets.filter(a => !(a.type === 'dpp' && a.fileName === fileName));
    this.assets.push(asset);
    this.saveToStorage();
    
    console.log(`[LocalSync] Stored DPP file locally: ${fileName}`);
  }

  /**
   * Store a dataspace asset locally after upload
   */
  async storeDataspaceAsset(
    file: File, 
    podUrl: string, 
    dataSpaceId: string
  ): Promise<void> {
    const content = await this.fileToBase64(file);
    
    const asset: LocalAsset = {
      originalUrl: `${podUrl}dataspaces/${dataSpaceId}/data/${file.name}`,
      fileName: file.name,
      content,
      contentType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      type: 'dataspace',
      dataSpaceId,
    };

    // Remove existing file with same name in same dataspace
    this.assets = this.assets.filter(a => 
      !(a.type === 'dataspace' && a.dataSpaceId === dataSpaceId && a.fileName === file.name)
    );
    this.assets.push(asset);
    this.saveToStorage();
    
    console.log(`[LocalSync] Stored dataspace asset locally: ${file.name} in ${dataSpaceId}`);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get all locally stored assets
   */
  getAssets(): LocalAsset[] {
    return [...this.assets];
  }

  /**
   * Get the sync manifest
   */
  getManifest(): SyncManifest | null {
    try {
      const stored = localStorage.getItem(this.manifestKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Download all assets as a ZIP-like structure (individual file downloads)
   */
  async downloadAll(): Promise<void> {
    for (const asset of this.assets) {
      await this.downloadAsset(asset);
    }
  }

  /**
   * Download a single asset
   */
  async downloadAsset(asset: LocalAsset): Promise<void> {
    const blob = this.assetToBlob(asset);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.getLocalPath(asset);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private assetToBlob(asset: LocalAsset): Blob {
    if (typeof asset.content === 'string') {
      // Check if it's base64 encoded
      if (asset.content.startsWith('data:')) {
        const base64 = asset.content.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: asset.contentType });
      }
      return new Blob([asset.content], { type: asset.contentType });
    }
    return new Blob([asset.content], { type: asset.contentType });
  }

  /**
   * Export manifest as JSON file
   */
  exportManifest(): void {
    const manifest = this.getManifest();
    if (!manifest) return;
    
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DATA/manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all locally stored assets
   */
  clear(): void {
    this.assets = [];
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.manifestKey);
  }
}

export const localSyncService = LocalSyncService.getInstance();
