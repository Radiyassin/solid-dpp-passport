import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  addBoolean,
  addStringWithLocale,
  setThing,
  getThing,
  getStringNoLocale,
  getDatetime,
  getBoolean,
  getThingAll,
  removeThing,
  getSourceUrl,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";
import { FOAF, DCTERMS, RDF } from "@inrupt/vocab-common-rdf";

// Custom vocabulary for Data Spaces
const DS = {
  DataSpace: "https://w3id.org/dataspace/vocab#DataSpace",
  Member: "https://w3id.org/dataspace/vocab#Member",
  hasRole: "https://w3id.org/dataspace/vocab#hasRole",
  accessMode: "https://w3id.org/dataspace/vocab#accessMode",
  purpose: "https://w3id.org/dataspace/vocab#purpose",
  storageLocation: "https://w3id.org/dataspace/vocab#storageLocation",
  isActive: "https://w3id.org/dataspace/vocab#isActive",
  memberWebId: "https://w3id.org/dataspace/vocab#memberWebId",
  memberRole: "https://w3id.org/dataspace/vocab#memberRole",
  joinedAt: "https://w3id.org/dataspace/vocab#joinedAt",
  // Asset Metadata vocabulary
  assetCreated: "https://w3id.org/dataspace/vocab#assetCreated",
  assetLastModified: "https://w3id.org/dataspace/vocab#assetLastModified",
  originalTitle: "https://w3id.org/dataspace/vocab#originalTitle",
  openDataSourceLink: "https://w3id.org/dataspace/vocab#openDataSourceLink",
  dataFormat: "https://w3id.org/dataspace/vocab#dataFormat",
  chargeable: "https://w3id.org/dataspace/vocab#chargeable",
  useSetting: "https://w3id.org/dataspace/vocab#useSetting",
  datasourceLanguage: "https://w3id.org/dataspace/vocab#datasourceLanguage",
  metadataLanguage: "https://w3id.org/dataspace/vocab#metadataLanguage",
  temporalCoverageBeginning: "https://w3id.org/dataspace/vocab#temporalCoverageBeginning",
  temporalCoverageEnding: "https://w3id.org/dataspace/vocab#temporalCoverageEnding",
  linkedMetadata: "https://w3id.org/dataspace/vocab#linkedMetadata",
  updateFrequency: "https://w3id.org/dataspace/vocab#updateFrequency",
  geographicCoverage: "https://w3id.org/dataspace/vocab#geographicCoverage",
  geographicExpansion: "https://w3id.org/dataspace/vocab#geographicExpansion",
  resourceSize: "https://w3id.org/dataspace/vocab#resourceSize",
  resourceEncoding: "https://w3id.org/dataspace/vocab#resourceEncoding",
  datasourceLink: "https://w3id.org/dataspace/vocab#datasourceLink",
  category: "https://w3id.org/dataspace/vocab#category",
  tags: "https://w3id.org/dataspace/vocab#tags",
};

export type DataSpaceRole = 'admin' | 'write' | 'read';
export type AccessMode = 'public' | 'private' | 'restricted';

export interface AssetMetadata {
  assetCreated?: Date;
  assetLastModified?: Date;
  description?: string;
  originalTitle?: string;
  openDataSourceLink?: string;
  dataFormat?: string;
  categories?: string[];
  chargeable?: boolean;
  useSetting?: string;
  datasourceLanguage?: string;
  metadataLanguage?: string;
  temporalCoverageBeginning?: Date;
  temporalCoverageEnding?: Date;
  linkedMetadata?: string;
  updateFrequency?: string;
  geographicCoverage?: string;
  geographicExpansion?: string;
  resourceSize?: string;
  resourceEncoding?: string;
  datasourceLink?: string;
}

export interface DataSpace {
  id: string;
  title: string;
  description: string;
  purpose: string;
  accessMode: AccessMode;
  storageLocation: string;
  createdAt: Date;
  isActive: boolean;
  members: DataSpaceMember[];
  creatorWebId: string;
  assetMetadata: AssetMetadata;
  tags: string[];
  category?: string;
}

export interface DataSpaceMember {
  webId: string;
  role: DataSpaceRole;
  joinedAt: Date;
}

export interface CreateDataSpaceInput {
  title: string;
  description: string;
  purpose: string;
  accessMode: AccessMode;
  storageLocation?: string;
  category?: string;
  tags?: string[];
}

export interface UpdateAssetMetadataInput extends Partial<AssetMetadata> {}

export class DataSpaceService {
  private static instance: DataSpaceService;
  private auth: SolidAuthService;

  private constructor() {
    this.auth = SolidAuthService.getInstance();
  }

  static getInstance(): DataSpaceService {
    if (!DataSpaceService.instance) {
      DataSpaceService.instance = new DataSpaceService();
    }
    return DataSpaceService.instance;
  }

  private getDataSpacesContainerUrl(): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/dataspaces/`;
  }

  private getDataSpaceUrl(id: string): string {
    return `${this.getDataSpacesContainerUrl()}${id}.ttl`;
  }

  async createDataSpace(input: CreateDataSpaceInput): Promise<DataSpace> {
    console.log('=== STARTING DATASPACE CREATION ===');
    console.log('Input received:', input);
    
    const webId = this.auth.getWebId();
    console.log('WebID:', webId);
    
    if (!webId) {
      console.error('User not authenticated - no WebID found');
      throw new Error('User not authenticated');
    }

    const id = `ds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated DataSpace ID:', id);
    
    const dataSpaceUrl = this.getDataSpaceUrl(id);
    console.log('DataSpace URL will be:', dataSpaceUrl);

    try {
      console.log('Creating Solid dataset...');
      // Create the DataSpace thing
      let dataset = createSolidDataset();
      let dataSpaceThing = createThing({ url: `${dataSpaceUrl}#${id}` });
      console.log('Created dataset and thing');

      // Add DataSpace properties
      console.log('Adding DataSpace properties...');
      dataSpaceThing = addStringNoLocale(dataSpaceThing, RDF.type, DS.DataSpace);
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DCTERMS.title, input.title);
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DCTERMS.description, input.description);
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.purpose, input.purpose);
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.accessMode, input.accessMode);
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.storageLocation, input.storageLocation || `${this.getDataSpacesContainerUrl()}${id}/`);
      dataSpaceThing = addDatetime(dataSpaceThing, DCTERMS.created, new Date());
      dataSpaceThing = addBoolean(dataSpaceThing, DS.isActive, true);
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DCTERMS.creator, webId);
      
      // Add category and tags if provided
      if (input.category) {
        dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.category, input.category);
      }
      if (input.tags && input.tags.length > 0) {
        input.tags.forEach(tag => {
          dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.tags, tag);
        });
      }
      console.log('Properties added to DataSpace thing');

      dataset = setThing(dataset, dataSpaceThing);
      console.log('DataSpace thing added to dataset');

      // Add creator as admin member
      console.log('Creating admin member...');
      let memberThing = createThing({ url: `${dataSpaceUrl}#member-${Date.now()}` });
      memberThing = addStringNoLocale(memberThing, RDF.type, DS.Member);
      memberThing = addStringNoLocale(memberThing, DS.memberWebId, webId);
      memberThing = addStringNoLocale(memberThing, DS.memberRole, 'admin');
      memberThing = addDatetime(memberThing, DS.joinedAt, new Date());
      
      dataset = setThing(dataset, memberThing);
      console.log('Admin member added to dataset');

      // Save to Pod
      const fetch = this.auth.getFetch();
      console.log('Getting fetch function for authentication...');
      
      if (!fetch) {
        console.error('No authenticated fetch function available');
        throw new Error('No authenticated fetch function available');
      }
      
      console.log('Attempting to save dataset to Pod at:', dataSpaceUrl);
      await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
      console.log('✅ DataSpace saved successfully to Pod!');

      const result = this.parseDataSpace(id, dataset);
      console.log('✅ DataSpace creation completed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ DETAILED ERROR creating DataSpace:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        dataSpaceUrl,
        webId,
        input
      });
      
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to create DataSpace: ${error.message}`);
      } else {
        throw new Error('Failed to create DataSpace: Unknown error occurred');
      }
    }
  }

  async listDataSpaces(): Promise<DataSpace[]> {
    const containerUrl = this.getDataSpacesContainerUrl();
    const fetch = this.auth.getFetch();
    
    try {
      console.log('🔍 Loading dataspaces from container:', containerUrl);
      
      // Try to get the container to find dataspace files
      let containerDataset;
      try {
        containerDataset = await getSolidDataset(containerUrl, { fetch });
      } catch (containerError) {
        console.log('DataSpaces container does not exist yet, returning empty list');
        return [];
      }

      const dataSpaces: DataSpace[] = [];
      const containerThings = getThingAll(containerDataset);
      
      console.log('📁 Found container things:', containerThings.length);
      
      // Look for references to dataspace files in the container
      // Since each dataspace is in its own .ttl file, we need to find and read each file
      for (const thing of containerThings) {
        const thingUrl = thing.url;
        console.log('🔍 Checking thing:', thingUrl);
        
        // Check if this is a dataspace file (.ttl)
        if (thingUrl && thingUrl.endsWith('.ttl') && thingUrl.includes('/dataspaces/')) {
          try {
            console.log('📖 Reading dataspace file:', thingUrl);
            const dataSpaceDataset = await getSolidDataset(thingUrl, { fetch });
            
            // Extract ID from filename
            const id = thingUrl.split('/').pop()?.replace('.ttl', '') || '';
            console.log('🆔 Extracted ID:', id);
            
            if (id) {
              const dataSpace = this.parseDataSpace(id, dataSpaceDataset);
              console.log('✅ Parsed dataspace:', dataSpace.title, 'active:', dataSpace.isActive);
              
              if (dataSpace.isActive) {
                dataSpaces.push(dataSpace);
              }
            }
          } catch (parseError) {
            console.error('❌ Error parsing dataspace file:', thingUrl, parseError);
          }
        }
      }
      
      // Fallback: If no dataspaces found via container, try direct discovery
      if (dataSpaces.length === 0) {
        console.log('🔄 No dataspaces found via container, trying direct discovery...');
        
        // Try to discover dataspaces by checking known patterns
        // This is a fallback for when container indexing doesn't work properly
        const testIds = await this.discoverDataSpaceIds();
        for (const id of testIds) {
          try {
            const dataSpace = await this.getDataSpace(id);
            if (dataSpace && dataSpace.isActive) {
              dataSpaces.push(dataSpace);
            }
          } catch (error) {
            // Ignore errors for non-existent dataspaces
          }
        }
      }
      
      console.log('📋 Final dataspaces list:', dataSpaces.length, 'found');
      return dataSpaces;
    } catch (error) {
      console.error('❌ Error listing data spaces:', error);
      return [];
    }
  }

  private async discoverDataSpaceIds(): Promise<string[]> {
    // This method tries to discover existing dataspace IDs
    // by checking common patterns or using container listings
    const containerUrl = this.getDataSpacesContainerUrl();
    const fetch = this.auth.getFetch();
    
    try {
      const response = await fetch(containerUrl, {
        headers: { 'Accept': 'text/turtle' }
      });
      
      if (response.ok) {
        const content = await response.text();
        // Extract .ttl file references from the container content
        const fileMatches = content.match(/ds-\d+-\w+\.ttl/g) || [];
        return fileMatches.map(filename => filename.replace('.ttl', ''));
      }
    } catch (error) {
      console.log('Could not discover dataspace IDs:', error);
    }
    
    return [];
  }

  async getDataSpace(id: string): Promise<DataSpace | null> {
    const dataSpaceUrl = this.getDataSpaceUrl(id);
    const fetch = this.auth.getFetch();
    
    try {
      const dataset = await getSolidDataset(dataSpaceUrl, { fetch });
      return this.parseDataSpace(id, dataset);
    } catch (error) {
      console.error('Error getting data space:', error);
      return null;
    }
  }

  async updateDataSpace(id: string, updates: Partial<CreateDataSpaceInput>): Promise<DataSpace> {
    const dataSpaceUrl = this.getDataSpaceUrl(id);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    let dataSpaceThing = getThing(dataset, `${dataSpaceUrl}#${id}`);
    
    if (!dataSpaceThing) {
      throw new Error('DataSpace not found');
    }

    // Update properties
    if (updates.title !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DCTERMS.title, updates.title);
    }
    if (updates.description !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DCTERMS.description, updates.description);
    }
    if (updates.purpose !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.purpose, updates.purpose);
    }
    if (updates.accessMode !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.accessMode, updates.accessMode);
    }

    dataset = setThing(dataset, dataSpaceThing);
    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });

    return this.parseDataSpace(id, dataset);
  }

  async addMember(dataSpaceId: string, memberWebId: string, role: DataSpaceRole): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    
    // Create new member thing
    let memberThing = createThing({ name: `member-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` });
    memberThing = addStringNoLocale(memberThing, RDF.type, DS.Member);
    memberThing = addStringNoLocale(memberThing, DS.memberWebId, memberWebId);
    memberThing = addStringNoLocale(memberThing, DS.memberRole, role);
    memberThing = addDatetime(memberThing, DS.joinedAt, new Date());
    
    dataset = setThing(dataset, memberThing);
    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
  }

  async removeMember(dataSpaceId: string, memberWebId: string): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    const members = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === DS.Member &&
      getStringNoLocale(thing, DS.memberWebId) === memberWebId
    );

    for (const member of members) {
      dataset = removeThing(dataset, member);
    }

    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
  }

  async updateMemberRole(dataSpaceId: string, memberWebId: string, newRole: DataSpaceRole): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    const members = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === DS.Member &&
      getStringNoLocale(thing, DS.memberWebId) === memberWebId
    );

    for (let member of members) {
      member = addStringNoLocale(member, DS.memberRole, newRole);
      dataset = setThing(dataset, member);
    }

    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
  }

  async deleteDataSpace(id: string): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(id);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    let dataSpaceThing = getThing(dataset, `${dataSpaceUrl}#${id}`);
    
    if (!dataSpaceThing) {
      throw new Error('DataSpace not found');
    }

    // Mark as inactive instead of deleting
    dataSpaceThing = addBoolean(dataSpaceThing, DS.isActive, false);
    dataset = setThing(dataset, dataSpaceThing);
    
    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
  }

  async updateAssetMetadata(dataSpaceId: string, metadata: UpdateAssetMetadataInput): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    let dataSpaceThing = getThing(dataset, `${dataSpaceUrl}#${dataSpaceId}`);
    
    if (!dataSpaceThing) {
      throw new Error('DataSpace not found');
    }

    // Update asset metadata fields
    if (metadata.assetCreated !== undefined) {
      dataSpaceThing = addDatetime(dataSpaceThing, DS.assetCreated, metadata.assetCreated);
    }
    if (metadata.assetLastModified !== undefined) {
      dataSpaceThing = addDatetime(dataSpaceThing, DS.assetLastModified, metadata.assetLastModified);
    }
    if (metadata.description !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DCTERMS.description, metadata.description);
    }
    if (metadata.originalTitle !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.originalTitle, metadata.originalTitle);
    }
    if (metadata.openDataSourceLink !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.openDataSourceLink, metadata.openDataSourceLink);
    }
    if (metadata.dataFormat !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.dataFormat, metadata.dataFormat);
    }
    if (metadata.categories !== undefined) {
      metadata.categories.forEach(category => {
        dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.category, category);
      });
    }
    if (metadata.chargeable !== undefined) {
      dataSpaceThing = addBoolean(dataSpaceThing, DS.chargeable, metadata.chargeable);
    }
    if (metadata.useSetting !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.useSetting, metadata.useSetting);
    }
    if (metadata.datasourceLanguage !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.datasourceLanguage, metadata.datasourceLanguage);
    }
    if (metadata.metadataLanguage !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.metadataLanguage, metadata.metadataLanguage);
    }
    if (metadata.temporalCoverageBeginning !== undefined) {
      dataSpaceThing = addDatetime(dataSpaceThing, DS.temporalCoverageBeginning, metadata.temporalCoverageBeginning);
    }
    if (metadata.temporalCoverageEnding !== undefined) {
      dataSpaceThing = addDatetime(dataSpaceThing, DS.temporalCoverageEnding, metadata.temporalCoverageEnding);
    }
    if (metadata.linkedMetadata !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.linkedMetadata, metadata.linkedMetadata);
    }
    if (metadata.updateFrequency !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.updateFrequency, metadata.updateFrequency);
    }
    if (metadata.geographicCoverage !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.geographicCoverage, metadata.geographicCoverage);
    }
    if (metadata.geographicExpansion !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.geographicExpansion, metadata.geographicExpansion);
    }
    if (metadata.resourceSize !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.resourceSize, metadata.resourceSize);
    }
    if (metadata.resourceEncoding !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.resourceEncoding, metadata.resourceEncoding);
    }
    if (metadata.datasourceLink !== undefined) {
      dataSpaceThing = addStringNoLocale(dataSpaceThing, DS.datasourceLink, metadata.datasourceLink);
    }

    dataset = setThing(dataset, dataSpaceThing);
    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
  }

  private handleUpdate = () => {
    // Function to trigger re-renders when data changes
    // This would be used by components to refresh their data
  };

  private parseDataSpace(id: string, dataset: any): DataSpace {
    const dataSpaceUrl = this.getDataSpaceUrl(id);
    // Try different ways to get the DataSpace thing
    let dataSpaceThing = getThing(dataset, `${dataSpaceUrl}#${id}`);
    
    if (!dataSpaceThing) {
      // Fallback: look for any thing with DataSpace type
      const things = getThingAll(dataset);
      dataSpaceThing = things.find(thing => 
        getStringNoLocale(thing, RDF.type) === DS.DataSpace
      );
    }
    
    if (!dataSpaceThing) {
      console.error('DataSpace not found in dataset. Available things:', getThingAll(dataset).map(t => ({ url: t.url, type: getStringNoLocale(t, RDF.type) })));
      throw new Error('DataSpace not found in dataset');
    }

    // Parse members
    const memberThings = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === DS.Member
    );
    
    const members: DataSpaceMember[] = memberThings.map(memberThing => ({
      webId: getStringNoLocale(memberThing, DS.memberWebId) || '',
      role: (getStringNoLocale(memberThing, DS.memberRole) as DataSpaceRole) || 'read',
      joinedAt: getDatetime(memberThing, DS.joinedAt) || new Date(),
    }));

    // Parse asset metadata
    const assetMetadata: AssetMetadata = {
      assetCreated: getDatetime(dataSpaceThing, DS.assetCreated) || undefined,
      assetLastModified: getDatetime(dataSpaceThing, DS.assetLastModified) || undefined,
      description: getStringNoLocale(dataSpaceThing, DCTERMS.description) || undefined,
      originalTitle: getStringNoLocale(dataSpaceThing, DS.originalTitle) || undefined,
      openDataSourceLink: getStringNoLocale(dataSpaceThing, DS.openDataSourceLink) || undefined,
      dataFormat: getStringNoLocale(dataSpaceThing, DS.dataFormat) || undefined,
      chargeable: getBoolean(dataSpaceThing, DS.chargeable) || undefined,
      useSetting: getStringNoLocale(dataSpaceThing, DS.useSetting) || undefined,
      datasourceLanguage: getStringNoLocale(dataSpaceThing, DS.datasourceLanguage) || undefined,
      metadataLanguage: getStringNoLocale(dataSpaceThing, DS.metadataLanguage) || undefined,
      temporalCoverageBeginning: getDatetime(dataSpaceThing, DS.temporalCoverageBeginning) || undefined,
      temporalCoverageEnding: getDatetime(dataSpaceThing, DS.temporalCoverageEnding) || undefined,
      linkedMetadata: getStringNoLocale(dataSpaceThing, DS.linkedMetadata) || undefined,
      updateFrequency: getStringNoLocale(dataSpaceThing, DS.updateFrequency) || undefined,
      geographicCoverage: getStringNoLocale(dataSpaceThing, DS.geographicCoverage) || undefined,
      geographicExpansion: getStringNoLocale(dataSpaceThing, DS.geographicExpansion) || undefined,
      resourceSize: getStringNoLocale(dataSpaceThing, DS.resourceSize) || undefined,
      resourceEncoding: getStringNoLocale(dataSpaceThing, DS.resourceEncoding) || undefined,
      datasourceLink: getStringNoLocale(dataSpaceThing, DS.datasourceLink) || undefined,
    };

    // Parse tags - get all tag values from the dataspace thing
    const allThings = getThingAll(dataset);
    const dataSpaceThingForTags = allThings.find(thing => 
      getStringNoLocale(thing, RDF.type) === DS.DataSpace
    );
    
    let tags: string[] = [];
    if (dataSpaceThingForTags && dataSpaceThingForTags.predicates[DS.tags]) {
      const tagLiterals = dataSpaceThingForTags.predicates[DS.tags].literals;
      if (tagLiterals) {
        tags = Object.keys(tagLiterals);
      }
    }

    // Parse category
    const category = getStringNoLocale(dataSpaceThing, DS.category) || undefined;

    return {
      id,
      title: getStringNoLocale(dataSpaceThing, DCTERMS.title) || '',
      description: getStringNoLocale(dataSpaceThing, DCTERMS.description) || '',
      purpose: getStringNoLocale(dataSpaceThing, DS.purpose) || '',
      accessMode: (getStringNoLocale(dataSpaceThing, DS.accessMode) as AccessMode) || 'private',
      storageLocation: getStringNoLocale(dataSpaceThing, DS.storageLocation) || '',
      createdAt: getDatetime(dataSpaceThing, DCTERMS.created) || new Date(),
      isActive: getBoolean(dataSpaceThing, DS.isActive) ?? true,
      creatorWebId: getStringNoLocale(dataSpaceThing, DCTERMS.creator) || '',
      members,
      assetMetadata,
      tags,
      category,
    };
  }
}