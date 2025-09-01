import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  addDecimal,
  setThing,
  getThing,
  getStringNoLocale,
  getDatetime,
  getDecimal,
  getThingAll,
  removeThing,
  getFile,
  overwriteFile,
  deleteFile,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";
import { AuditService } from "./auditService";
import { DCTERMS, RDF, FOAF } from "@inrupt/vocab-common-rdf";
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';

// Custom vocabulary for Data entries
const DATA = {
  DataEntry: "https://w3id.org/dataspace/vocab#DataEntry",
  hasMetadata: "https://w3id.org/dataspace/vocab#hasMetadata",
  fileName: "https://w3id.org/dataspace/vocab#fileName",
  fileSize: "https://w3id.org/dataspace/vocab#fileSize",
  mimeType: "https://w3id.org/dataspace/vocab#mimeType",
  uploadedBy: "https://w3id.org/dataspace/vocab#uploadedBy",
  dataSpaceId: "https://w3id.org/dataspace/vocab#dataSpaceId",
  filePath: "https://w3id.org/dataspace/vocab#filePath",
  tags: "https://w3id.org/dataspace/vocab#tags",
  category: "https://w3id.org/dataspace/vocab#category",
};

export interface DataEntry {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  dataSpaceId: string;
  uploadedBy: string;
  uploadedAt: Date;
  tags: string[];
  category: string;
  metadata: Record<string, any>;
}

export interface UploadDataInput {
  title: string;
  description: string;
  file: File;
  tags: string[];
  category: string;
  metadata?: Record<string, any>;
}

export class DataService {
  private static instance: DataService;
  private auth: SolidAuthService;

  private constructor() {
    this.auth = SolidAuthService.getInstance();
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private getDataSpaceDataUrl(dataSpaceId: string): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/dataspaces/${dataSpaceId}/data/`;
  }

  private getDataIndexUrl(dataSpaceId: string): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/dataspaces/${dataSpaceId}/index.ttl`;
  }

  async uploadData(dataSpaceId: string, input: UploadDataInput): Promise<DataEntry> {
    console.log('=== STARTING DATA UPLOAD ===');
    console.log('DataSpace ID:', dataSpaceId);
    console.log('File:', input.file.name, input.file.size, input.file.type);

    const webId = this.auth.getWebId();
    if (!webId) {
      throw new Error('User not authenticated');
    }

    const fetch = this.auth.getFetch();
    if (!fetch) {
      throw new Error('No authenticated fetch function available');
    }

    try {
      // Generate unique ID for the data entry
      const dataId = `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `${dataId}-${input.file.name}`;
      
      // Upload file to data space storage
      const dataFolderUrl = this.getDataSpaceDataUrl(dataSpaceId);
      const fileUrl = `${dataFolderUrl}${fileName}`;
      
      console.log('Uploading file to:', fileUrl);
      await overwriteFile(fileUrl, input.file, { fetch });
      console.log('✅ File uploaded successfully');

      // Create metadata entry
      const indexUrl = this.getDataIndexUrl(dataSpaceId);
      let indexDataset;
      
      try {
        indexDataset = await getSolidDataset(indexUrl, { fetch });
      } catch (error) {
        console.log('Creating new index dataset');
        indexDataset = createSolidDataset();
      }

      // Create data entry thing
      let dataEntryThing = createThing({ url: `${indexUrl}#${dataId}` });
      dataEntryThing = addStringNoLocale(dataEntryThing, RDF.type, DATA.DataEntry);
      dataEntryThing = addStringNoLocale(dataEntryThing, DCTERMS.title, input.title);
      dataEntryThing = addStringNoLocale(dataEntryThing, DCTERMS.description, input.description);
      dataEntryThing = addStringNoLocale(dataEntryThing, DATA.fileName, input.file.name);
      dataEntryThing = addDecimal(dataEntryThing, DATA.fileSize, input.file.size);
      dataEntryThing = addStringNoLocale(dataEntryThing, DATA.mimeType, input.file.type);
      dataEntryThing = addStringNoLocale(dataEntryThing, DATA.filePath, fileUrl);
      dataEntryThing = addStringNoLocale(dataEntryThing, DATA.dataSpaceId, dataSpaceId);
      dataEntryThing = addStringNoLocale(dataEntryThing, DATA.uploadedBy, webId);
      dataEntryThing = addDatetime(dataEntryThing, DCTERMS.created, new Date());
      dataEntryThing = addStringNoLocale(dataEntryThing, DATA.category, input.category);

      // Add tags
      input.tags.forEach(tag => {
        dataEntryThing = addStringNoLocale(dataEntryThing, DATA.tags, tag);
      });

      // Add metadata as JSON string if provided
      if (input.metadata && Object.keys(input.metadata).length > 0) {
        dataEntryThing = addStringNoLocale(dataEntryThing, DATA.hasMetadata, JSON.stringify(input.metadata));
      }

      indexDataset = setThing(indexDataset, dataEntryThing);
      
      console.log('Saving index to:', indexUrl);
      await saveSolidDatasetAt(indexUrl, indexDataset, { fetch });
      console.log('✅ Data entry indexed successfully');

      const result: DataEntry = {
        id: dataId,
        title: input.title,
        description: input.description,
        fileName: input.file.name,
        fileSize: input.file.size,
        mimeType: input.file.type,
        filePath: fileUrl,
        dataSpaceId,
        uploadedBy: webId,
        uploadedAt: new Date(),
        tags: input.tags,
        category: input.category,
        metadata: input.metadata || {},
      };

      console.log('✅ Data upload completed successfully:', result);
      
      // Log the data upload action
      try {
        const session = getDefaultSession();
        const userPodBase = webId.split('/profile/card#me')[0] + '/';
        await AuditService.getInstance().logDataSpaceOperation(
          session,
          'Create',
          dataId,
          webId,
          userPodBase
        );
        console.log('✅ Data upload logged to audit');
      } catch (auditError) {
        console.warn('⚠️ Failed to log data upload:', auditError);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error uploading data:', error);
      throw new Error(`Failed to upload data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listDataEntries(dataSpaceId: string): Promise<DataEntry[]> {
    const indexUrl = this.getDataIndexUrl(dataSpaceId);
    const fetch = this.auth.getFetch();

    try {
      console.log('🔍 Loading data entries from index:', indexUrl);
      
      let indexDataset;
      try {
        indexDataset = await getSolidDataset(indexUrl, { fetch });
      } catch (error) {
        console.log('No data index found, returning empty list');
        return [];
      }

      const dataEntries: DataEntry[] = [];
      const dataThings = getThingAll(indexDataset).filter(thing =>
        getStringNoLocale(thing, RDF.type) === DATA.DataEntry
      );

      console.log('📁 Found data entries:', dataThings.length);

      for (const dataThing of dataThings) {
        try {
          const dataEntry = this.parseDataEntry(dataThing);
          dataEntries.push(dataEntry);
        } catch (parseError) {
          console.error('❌ Error parsing data entry:', parseError);
        }
      }

      console.log('📋 Final data entries list:', dataEntries.length, 'found');
      return dataEntries.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    } catch (error) {
      console.error('❌ Error listing data entries:', error);
      return [];
    }
  }

  async getDataEntry(dataSpaceId: string, dataId: string): Promise<DataEntry | null> {
    const indexUrl = this.getDataIndexUrl(dataSpaceId);
    const fetch = this.auth.getFetch();

    try {
      const indexDataset = await getSolidDataset(indexUrl, { fetch });
      const dataThing = getThing(indexDataset, `${indexUrl}#${dataId}`);
      
      if (!dataThing) {
        return null;
      }

      return this.parseDataEntry(dataThing);
    } catch (error) {
      console.error('Error getting data entry:', error);
      return null;
    }
  }

  async deleteDataEntry(dataSpaceId: string, dataId: string): Promise<void> {
    const indexUrl = this.getDataIndexUrl(dataSpaceId);
    const fetch = this.auth.getFetch();

    try {
      // Get the data entry to find file path
      const dataEntry = await this.getDataEntry(dataSpaceId, dataId);
      
      if (dataEntry) {
        // Delete the actual file
        try {
          await deleteFile(dataEntry.filePath, { fetch });
          console.log('✅ File deleted:', dataEntry.filePath);
        } catch (fileError) {
          console.warn('Could not delete file:', fileError);
        }
      }

      // Remove from index
      let indexDataset = await getSolidDataset(indexUrl, { fetch });
      const dataThing = getThing(indexDataset, `${indexUrl}#${dataId}`);
      
      if (dataThing) {
        indexDataset = removeThing(indexDataset, dataThing);
        await saveSolidDatasetAt(indexUrl, indexDataset, { fetch });
        console.log('✅ Data entry removed from index');
      }
    } catch (error) {
      console.error('❌ Error deleting data entry:', error);
      throw new Error(`Failed to delete data entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(filePath: string): Promise<Blob> {
    const fetch = this.auth.getFetch();
    if (!fetch) {
      throw new Error('No authenticated fetch function available');
    }

    try {
      const file = await getFile(filePath, { fetch });
      return file;
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchDataEntries(dataSpaceId: string, query: string): Promise<DataEntry[]> {
    const allEntries = await this.listDataEntries(dataSpaceId);
    
    if (!query.trim()) {
      return allEntries;
    }

    const searchTerm = query.toLowerCase();
    return allEntries.filter(entry => 
      entry.title.toLowerCase().includes(searchTerm) ||
      entry.description.toLowerCase().includes(searchTerm) ||
      entry.fileName.toLowerCase().includes(searchTerm) ||
      entry.category.toLowerCase().includes(searchTerm) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  private parseDataEntry(dataThing: any): DataEntry {
    const thingUrl = dataThing.url;
    const id = thingUrl.split('#').pop() || '';

    // Get all tag values
    const tags: string[] = [];
    const tagUrls = dataThing.predicates[DATA.tags];
    if (tagUrls) {
      for (const tagUrl of tagUrls.namedNodes || []) {
        tags.push(tagUrl.value);
      }
      for (const tagLiteral of tagUrls.literals || []) {
        tags.push(tagLiteral.value);
      }
    }

    // Parse metadata if available
    let metadata = {};
    const metadataString = getStringNoLocale(dataThing, DATA.hasMetadata);
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString);
      } catch (error) {
        console.warn('Could not parse metadata JSON:', error);
      }
    }

    return {
      id,
      title: getStringNoLocale(dataThing, DCTERMS.title) || '',
      description: getStringNoLocale(dataThing, DCTERMS.description) || '',
      fileName: getStringNoLocale(dataThing, DATA.fileName) || '',
      fileSize: getDecimal(dataThing, DATA.fileSize) || 0,
      mimeType: getStringNoLocale(dataThing, DATA.mimeType) || '',
      filePath: getStringNoLocale(dataThing, DATA.filePath) || '',
      dataSpaceId: getStringNoLocale(dataThing, DATA.dataSpaceId) || '',
      uploadedBy: getStringNoLocale(dataThing, DATA.uploadedBy) || '',
      uploadedAt: getDatetime(dataThing, DCTERMS.created) || new Date(),
      tags,
      category: getStringNoLocale(dataThing, DATA.category) || '',
      metadata,
    };
  }
}