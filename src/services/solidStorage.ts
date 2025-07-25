import {
  getSolidDataset,
  saveSolidDatasetAt,
  overwriteFile,
  getFile,
  getContainedResourceUrlAll,
  createContainerAt,
  getResourceInfo,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";

export interface DPPFile {
  url: string;
  name: string;
  uploadedAt: Date;
  size?: number;
  contentType?: string;
}

export class SolidStorageService {
  private static instance: SolidStorageService;
  private auth: SolidAuthService;
  private dppFolderPath = "dpp/";

  private constructor() {
    this.auth = SolidAuthService.getInstance();
  }

  static getInstance(): SolidStorageService {
    if (!SolidStorageService.instance) {
      SolidStorageService.instance = new SolidStorageService();
    }
    return SolidStorageService.instance;
  }

  private async getPodRoot(): Promise<string> {
    const webId = this.auth.getWebId();
    if (!webId) {
      throw new Error("Not authenticated");
    }

    // Extract pod root from WebID
    // Most WebIDs follow pattern: https://pod.provider.com/username/profile/card#me
    const webIdUrl = new URL(webId);
    const pathSegments = webIdUrl.pathname.split('/').filter(Boolean);
    
    // Construct pod root URL
    if (pathSegments.length > 0) {
      return `${webIdUrl.origin}/${pathSegments[0]}/`;
    }
    
    throw new Error("Could not determine Pod root from WebID");
  }

  private async getDPPFolderUrl(): Promise<string> {
    const podRoot = await this.getPodRoot();
    return `${podRoot}${this.dppFolderPath}`;
  }

  async ensureDPPFolderExists(): Promise<void> {
    try {
      const dppFolderUrl = await this.getDPPFolderUrl();
      const fetch = this.auth.getFetch();
      
      // Try to get the folder info
      await getResourceInfo(dppFolderUrl, { fetch });
    } catch (error) {
      // If folder doesn't exist, create it
      const dppFolderUrl = await this.getDPPFolderUrl();
      const fetch = this.auth.getFetch();
      await createContainerAt(dppFolderUrl, { fetch });
    }
  }

  async uploadDPP(file: File): Promise<string> {
    await this.ensureDPPFolderExists();
    
    const dppFolderUrl = await this.getDPPFolderUrl();
    const fileName = file.name.endsWith('.ttl') ? file.name : `${file.name}.ttl`;
    const fileUrl = `${dppFolderUrl}${fileName}`;
    
    const fetch = this.auth.getFetch();
    
    await overwriteFile(fileUrl, file, {
      contentType: 'text/turtle',
      fetch,
    });

    return fileUrl;
  }

  async listDPPFiles(): Promise<DPPFile[]> {
    try {
      await this.ensureDPPFolderExists();
      
      const dppFolderUrl = await this.getDPPFolderUrl();
      const fetch = this.auth.getFetch();
      
      const dataset = await getSolidDataset(dppFolderUrl, { fetch });
      const containedUrls = getContainedResourceUrlAll(dataset);
      
      const dppFiles: DPPFile[] = [];
      
      for (const url of containedUrls) {
        // Skip if it's a container (folder)
        if (url.endsWith('/')) continue;
        
        try {
          const resourceInfo = await getResourceInfo(url, { fetch });
          const urlObj = new URL(url);
          const fileName = urlObj.pathname.split('/').pop() || 'unknown';
          
          dppFiles.push({
            url,
            name: fileName,
            uploadedAt: new Date(), // We'll use current date as fallback
            size: undefined,
            contentType: 'text/turtle',
          });
        } catch (error) {
          console.warn(`Could not get info for file ${url}:`, error);
        }
      }
      
      // Sort by upload date, newest first
      return dppFiles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      console.error("Error listing DPP files:", error);
      return [];
    }
  }

  async getDPPContent(fileUrl: string): Promise<string> {
    const fetch = this.auth.getFetch();
    const file = await getFile(fileUrl, { fetch });
    return await file.text();
  }

  async deleteDPP(fileUrl: string): Promise<void> {
    const fetch = this.auth.getFetch();
    
    await fetch(fileUrl, {
      method: 'DELETE',
    });
  }
}