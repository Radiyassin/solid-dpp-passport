import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getFile,
  getThingAll,
  getStringNoLocale,
  getDatetime,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";
import { DataSpaceService } from "./dataSpaceService";
import { DCTERMS, RDF } from "@inrupt/vocab-common-rdf";

// Custom vocabulary for Data entries
const DATA = {
  DataEntry: "https://w3id.org/dataspace/vocab#DataEntry",
  fileName: "https://w3id.org/dataspace/vocab#fileName",
  filePath: "https://w3id.org/dataspace/vocab#filePath",
  mimeType: "https://w3id.org/dataspace/vocab#mimeType",
  fileSize: "https://w3id.org/dataspace/vocab#fileSize",
  category: "https://w3id.org/dataspace/vocab#category",
};

export interface RetrievedAsset {
  id: string;
  title: string;
  description: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  category: string;
  dataSpaceId: string;
  dataSpaceName: string;
  uploadedAt: Date;
  blob?: Blob;
}

export interface RetrievalResult {
  success: boolean;
  totalAssets: number;
  retrievedAssets: RetrievedAsset[];
  errors: string[];
}

export class AssetRetrievalService {
  private static instance: AssetRetrievalService;
  private auth: SolidAuthService;
  private dataSpaceService: DataSpaceService;

  private constructor() {
    this.auth = SolidAuthService.getInstance();
    this.dataSpaceService = DataSpaceService.getInstance();
  }

  static getInstance(): AssetRetrievalService {
    if (!AssetRetrievalService.instance) {
      AssetRetrievalService.instance = new AssetRetrievalService();
    }
    return AssetRetrievalService.instance;
  }

  /**
   * Retrieves all assets from all dataspaces the user has access to
   * Command: -retrieve last-assets
   */
  async retrieveLastAssets(limit?: number): Promise<RetrievalResult> {
    console.log('🔍 Starting asset retrieval...');
    
    const result: RetrievalResult = {
      success: false,
      totalAssets: 0,
      retrievedAssets: [],
      errors: [],
    };

    try {
      const fetch = this.auth.getFetch();
      if (!fetch) {
        result.errors.push('No authenticated fetch function available');
        return result;
      }

      // Get all dataspaces
      const dataSpaces = await this.dataSpaceService.listDataSpaces();
      console.log(`📁 Found ${dataSpaces.length} dataspaces`);

      for (const dataSpace of dataSpaces) {
        try {
          const assets = await this.getDataSpaceAssets(dataSpace.id, dataSpace.title, fetch);
          result.retrievedAssets.push(...assets);
          console.log(`✅ Retrieved ${assets.length} assets from ${dataSpace.title}`);
        } catch (error) {
          const errorMsg = `Failed to retrieve assets from ${dataSpace.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.warn(`⚠️ ${errorMsg}`);
        }
      }

      // Sort by upload date, newest first
      result.retrievedAssets.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

      // Apply limit if specified
      if (limit && limit > 0) {
        result.retrievedAssets = result.retrievedAssets.slice(0, limit);
      }

      result.totalAssets = result.retrievedAssets.length;
      result.success = true;
      console.log(`✅ Asset retrieval complete: ${result.totalAssets} assets found`);

    } catch (error) {
      result.errors.push(`Asset retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Asset retrieval failed:', error);
    }

    return result;
  }

  private async getDataSpaceAssets(
    dataSpaceId: string, 
    dataSpaceName: string, 
    fetch: typeof globalThis.fetch
  ): Promise<RetrievedAsset[]> {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');

    const baseUrl = webId.split('/profile')[0];
    const indexUrl = `${baseUrl}/dataspaces/${dataSpaceId}/index.ttl`;

    try {
      const indexDataset = await getSolidDataset(indexUrl, { fetch });
      const dataThings = getThingAll(indexDataset).filter(thing =>
        getStringNoLocale(thing, RDF.type) === DATA.DataEntry
      );

      const assets: RetrievedAsset[] = [];

      for (const dataThing of dataThings) {
        try {
          const thingUrl = dataThing.url;
          const id = thingUrl.split('#').pop() || '';

          assets.push({
            id,
            title: getStringNoLocale(dataThing, DCTERMS.title) || '',
            description: getStringNoLocale(dataThing, DCTERMS.description) || '',
            fileName: getStringNoLocale(dataThing, DATA.fileName) || '',
            filePath: getStringNoLocale(dataThing, DATA.filePath) || '',
            mimeType: getStringNoLocale(dataThing, DATA.mimeType) || 'application/octet-stream',
            fileSize: Number(getStringNoLocale(dataThing, DATA.fileSize)) || 0,
            category: getStringNoLocale(dataThing, DATA.category) || '',
            dataSpaceId,
            dataSpaceName,
            uploadedAt: getDatetime(dataThing, DCTERMS.created) || new Date(),
          });
        } catch (parseError) {
          console.warn('Error parsing asset:', parseError);
        }
      }

      return assets;
    } catch (error) {
      console.log(`No data index found for ${dataSpaceId}`);
      return [];
    }
  }

  /**
   * Downloads a specific asset and returns the blob
   */
  async downloadAsset(asset: RetrievedAsset): Promise<Blob> {
    const fetch = this.auth.getFetch();
    if (!fetch) {
      throw new Error('No authenticated fetch function available');
    }

    try {
      const file = await getFile(asset.filePath, { fetch });
      return file;
    } catch (error) {
      throw new Error(`Failed to download asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Downloads all retrieved assets as a zip file
   * Note: This returns individual downloads since we can't create zip in browser without external lib
   */
  async downloadAllAssets(assets: RetrievedAsset[]): Promise<{ asset: RetrievedAsset; blob: Blob }[]> {
    const downloads: { asset: RetrievedAsset; blob: Blob }[] = [];
    
    for (const asset of assets) {
      try {
        const blob = await this.downloadAsset(asset);
        downloads.push({ asset, blob });
      } catch (error) {
        console.warn(`Failed to download ${asset.fileName}:`, error);
      }
    }

    return downloads;
  }

  /**
   * Triggers browser download for a single asset
   */
  triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a manifest JSON of all assets
   */
  generateManifest(assets: RetrievedAsset[]): string {
    const manifest = {
      retrievedAt: new Date().toISOString(),
      totalAssets: assets.length,
      assets: assets.map(asset => ({
        id: asset.id,
        title: asset.title,
        description: asset.description,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        category: asset.category,
        dataSpace: asset.dataSpaceName,
        uploadedAt: asset.uploadedAt.toISOString(),
        filePath: asset.filePath,
      })),
    };

    return JSON.stringify(manifest, null, 2);
  }
}
