import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  addBoolean,
  removeBoolean,
  addStringWithLocale,
  setThing,
  getThing,
  getStringNoLocale,
  getDatetime,
  getBoolean,
  getThingAll,
  removeThing,
  getSourceUrl,
  setAgentResourceAccess,
  getAgentResourceAccess,
  createContainerAt,
  getResourceAcl,
  createAclFromFallbackAcl,
  setAgentDefaultAccess,
  saveAclFor,
  hasResourceAcl,
  hasFallbackAcl,
  hasAccessibleAcl,
  createAcl,
  getResourceInfoWithAcl
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { SolidAuthService } from "./solidAuth";
import { AuditService } from "./auditService";
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
  // Metadata vocabulary
  Metadata: "https://w3id.org/dataspace/vocab#Metadata",
  hasMetadata: "https://w3id.org/dataspace/vocab#hasMetadata",
  metadataTitle: "https://w3id.org/dataspace/vocab#metadataTitle",
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
  createdBy: "https://w3id.org/dataspace/vocab#createdBy",
  category: "https://w3id.org/dataspace/vocab#category",
  tags: "https://w3id.org/dataspace/vocab#tags",
};

export type DataSpaceRole = 'admin' | 'write' | 'read';
export type AccessMode = 'public' | 'private' | 'restricted';

export interface DataSpaceMetadata {
  id: string;
  title: string;
  // Asset Information
  assetCreated?: Date;
  assetLastModified?: Date;
  description?: string;
  originalTitle?: string;
  openDataSourceLink?: string;
  dataFormat?: string;
  categories?: string[];
  // Usage & Settings
  chargeable?: boolean;
  useSetting?: string;
  datasourceLanguage?: string;
  metadataLanguage?: string;
  // Temporal Coverage
  temporalCoverageBeginning?: Date;
  temporalCoverageEnding?: Date;
  linkedMetadata?: string;
  updateFrequency?: string;
  // Geographic Information
  geographicCoverage?: string;
  geographicExpansion?: string;
  // Resource Information
  resourceSize?: string;
  resourceEncoding?: string;
  datasourceLink?: string;
  // System fields
  createdAt: Date;
  createdBy: string;
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
  metadata: DataSpaceMetadata[];
  tags: string[];
  category?: string;
  allowedUsers: string[]; // WebIDs of users who can access this dataspace
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

export interface AddMetadataInput extends Omit<DataSpaceMetadata, 'id' | 'createdAt' | 'createdBy'> {}

export class DataSpaceService {
  private static instance: DataSpaceService;
  private auth: SolidAuthService;
  private auditService: AuditService;

  private constructor() {
    this.auth = SolidAuthService.getInstance();
    this.auditService = AuditService.getInstance();
  }

  static getInstance(): DataSpaceService {
    if (!DataSpaceService.instance) {
      DataSpaceService.instance = new DataSpaceService();
    }
    return DataSpaceService.instance;
  }

  private getDataSpacesContainerUrl(): string {
    // DataSpaces are always stored in the admin's pod
    const adminWebId = 'https://solid4dpp.solidcommunity.net/profile/card#me';
    const baseUrl = adminWebId.split('/profile')[0];
    return `${baseUrl}/dataspaces/`;
  }

  private getUserDataSpaceIndexUrl(): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/dataspace-access-index.ttl`;
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

    // Check if user is admin
    if (!this.auditService.isAdmin(webId)) {
      console.error('User is not an admin - cannot create dataspaces');
      throw new Error('Only administrators can create Data Spaces');
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

      // Log audit event for DataSpace creation
      try {
        console.log('🔍 Attempting to log audit event for DataSpace creation...');
        const session = getDefaultSession();
        console.log('Session info:', { 
          isLoggedIn: session?.info?.isLoggedIn, 
          webId: session?.info?.webId 
        });
        
        if (session && session.info.isLoggedIn) {
          const userPodBase = webId.split('/profile')[0] + '/';
          console.log('🔍 Calling auditService.logDataSpaceOperation with:', {
            action: 'Create',
            id,
            webId,
            userPodBase
          });
          
          const userName = webId.split('/profile')[0].split('/').pop() || 'Unknown User';
          await this.auditService.logDataSpaceOperation('Create', id, webId, userName);
          console.log('✅ Audit event logged for DataSpace creation');
        } else {
          console.warn('⚠️ Session not available for audit logging');
        }
      } catch (auditError) {
        console.error('❌ Failed to log audit event:', auditError);
        console.error('Audit error details:', {
          message: auditError instanceof Error ? auditError.message : 'Unknown error',
          stack: auditError instanceof Error ? auditError.stack : undefined
        });
      }

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
    const currentWebId = this.auth.getWebId();
    const currentUserIsAdmin = this.auditService.isAdmin(currentWebId);
    
    // Always use the admin pod URL for dataspaces
    const containerUrl = this.getDataSpacesContainerUrl();
    
    // For non-admin users, try to use their authenticated fetch first, then fall back to unauthenticated
    const authenticatedFetch = this.auth.getFetch();
    const fetch = currentUserIsAdmin ? authenticatedFetch : (authenticatedFetch || window.fetch);
    
    try {
      console.log('🔍 Loading dataspaces from container:', containerUrl);
      console.log('Current user is admin:', currentUserIsAdmin);
      
      const dataSpaces: DataSpace[] = [];
      
      // If user is admin, they can access all DataSpaces from their own pod
      if (currentUserIsAdmin) {
        try {
          const containerDataset = await getSolidDataset(containerUrl, { fetch });
          const containerThings = getThingAll(containerDataset);
          
          console.log('📁 Found container things:', containerThings.length);
          
          for (const thing of containerThings) {
            const thingUrl = thing.url;
            
            if (thingUrl && thingUrl.endsWith('.ttl') && thingUrl.includes('/dataspaces/')) {
              try {
                console.log('📖 Reading dataspace file:', thingUrl);
                const dataSpaceDataset = await getSolidDataset(thingUrl, { fetch });
                
                const id = thingUrl.split('/').pop()?.replace('.ttl', '') || '';
                
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
        } catch (containerError) {
          console.log('DataSpaces container does not exist yet, returning empty list');
          return [];
        }
      } else {
        // For non-admin users, try to access DataSpaces using authenticated fetch
        console.log('🔄 Non-admin user, checking accessible dataspaces...');
        
        const testIds = await this.discoverDataSpaceIds();
        
        // Try both with and without authentication for maximum compatibility
        const fetchMethods = [
          { name: 'authenticated', fetch },
          { name: 'unauthenticated', fetch: window.fetch }
        ];
        
        for (const id of testIds) {
          let dataSpaceAdded = false;
          
          for (const { name, fetch: fetchMethod } of fetchMethods) {
            if (dataSpaceAdded) break;
            
            try {
              const dataSpaceUrl = this.getDataSpaceUrl(id);
              console.log(`🔍 Trying ${name} access to:`, dataSpaceUrl);
              
              const dataSpaceDataset = await getSolidDataset(dataSpaceUrl, { fetch: fetchMethod });
              const dataSpace = this.parseDataSpace(id, dataSpaceDataset);
              
              if (dataSpace && dataSpace.isActive && this.checkUserAccess(dataSpace, currentWebId)) {
                dataSpaces.push(dataSpace);
                dataSpaceAdded = true;
                console.log(`✅ Successfully accessed dataspace ${id} via ${name} fetch`);
              }
            } catch (error) {
              console.log(`Cannot access dataspace ${id} via ${name} fetch:`, error.message);
            }
          }
        }
      }
      
      // Filter dataspaces based on user access (additional safety check)
      const accessibleDataSpaces = dataSpaces.filter(dataSpace => 
        this.checkUserAccess(dataSpace, currentWebId)
      );
      
      console.log('📋 Final dataspaces list:', dataSpaces.length, 'found,', accessibleDataSpaces.length, 'accessible to user');
      return accessibleDataSpaces;
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

    // Log audit event for DataSpace update
    try {
      const session = getDefaultSession();
      const webId = this.auth.getWebId();
      if (session && session.info.isLoggedIn && webId) {
        const userPodBase = webId.split('/profile')[0] + '/';
        const userName = webId.split('/profile')[0].split('/').pop() || 'Unknown User';
        await this.auditService.logDataSpaceOperation('Update', id, webId, userName);
        console.log('✅ Audit event logged for DataSpace update');
      }
    } catch (auditError) {
      console.warn('⚠️ Failed to log audit event:', auditError);
    }

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
    
    try {
      let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
      let dataSpaceThing = getThing(dataset, `${dataSpaceUrl}#${id}`);
      
      if (!dataSpaceThing) {
        throw new Error('DataSpace not found');
      }

      // Remove the existing isActive property and set it to false
      dataSpaceThing = removeBoolean(dataSpaceThing, DS.isActive, true);
      dataSpaceThing = addBoolean(dataSpaceThing, DS.isActive, false);
      dataset = setThing(dataset, dataSpaceThing);
      
      await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
      
      // Log audit event for DataSpace deletion
      try {
        const session = getDefaultSession();
        const webId = this.auth.getWebId();
        if (session && session.info.isLoggedIn && webId) {
          const userPodBase = webId.split('/profile')[0] + '/';
          const userName = webId.split('/profile')[0].split('/').pop() || 'Unknown User';
          await this.auditService.logDataSpaceOperation('Delete', id, webId, userName);
          console.log('✅ Audit event logged for DataSpace deletion');
        }
      } catch (auditError) {
        console.warn('⚠️ Failed to log audit event:', auditError);
      }
    } catch (error) {
      console.error('Error deleting data space:', error);
      throw new Error(`Failed to delete DataSpace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addMetadata(dataSpaceId: string, metadata: AddMetadataInput): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    const currentWebId = this.auth.getWebId() || '';
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    
    // Create new metadata thing
    const metadataId = `metadata-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    let metadataThing = createThing({ name: metadataId });
    
    // Add basic metadata properties
    metadataThing = addStringNoLocale(metadataThing, RDF.type, DS.Metadata);
    metadataThing = addStringNoLocale(metadataThing, DS.metadataTitle, metadata.title);
    metadataThing = addDatetime(metadataThing, DCTERMS.created, new Date());
    metadataThing = addStringNoLocale(metadataThing, DS.createdBy, currentWebId);
    
    // Add asset information
    if (metadata.assetCreated) {
      metadataThing = addDatetime(metadataThing, DS.assetCreated, metadata.assetCreated);
    }
    if (metadata.assetLastModified) {
      metadataThing = addDatetime(metadataThing, DS.assetLastModified, metadata.assetLastModified);
    }
    if (metadata.description) {
      metadataThing = addStringNoLocale(metadataThing, DCTERMS.description, metadata.description);
    }
    if (metadata.originalTitle) {
      metadataThing = addStringNoLocale(metadataThing, DS.originalTitle, metadata.originalTitle);
    }
    if (metadata.openDataSourceLink) {
      metadataThing = addStringNoLocale(metadataThing, DS.openDataSourceLink, metadata.openDataSourceLink);
    }
    if (metadata.dataFormat) {
      metadataThing = addStringNoLocale(metadataThing, DS.dataFormat, metadata.dataFormat);
    }
    if (metadata.categories) {
      metadata.categories.forEach(category => {
        metadataThing = addStringNoLocale(metadataThing, DS.category, category);
      });
    }
    
    // Add usage & settings
    if (metadata.chargeable !== undefined) {
      metadataThing = addBoolean(metadataThing, DS.chargeable, metadata.chargeable);
    }
    if (metadata.useSetting) {
      metadataThing = addStringNoLocale(metadataThing, DS.useSetting, metadata.useSetting);
    }
    if (metadata.datasourceLanguage) {
      metadataThing = addStringNoLocale(metadataThing, DS.datasourceLanguage, metadata.datasourceLanguage);
    }
    if (metadata.metadataLanguage) {
      metadataThing = addStringNoLocale(metadataThing, DS.metadataLanguage, metadata.metadataLanguage);
    }
    
    // Add temporal coverage
    if (metadata.temporalCoverageBeginning) {
      metadataThing = addDatetime(metadataThing, DS.temporalCoverageBeginning, metadata.temporalCoverageBeginning);
    }
    if (metadata.temporalCoverageEnding) {
      metadataThing = addDatetime(metadataThing, DS.temporalCoverageEnding, metadata.temporalCoverageEnding);
    }
    if (metadata.linkedMetadata) {
      metadataThing = addStringNoLocale(metadataThing, DS.linkedMetadata, metadata.linkedMetadata);
    }
    if (metadata.updateFrequency) {
      metadataThing = addStringNoLocale(metadataThing, DS.updateFrequency, metadata.updateFrequency);
    }
    
    // Add geographic information
    if (metadata.geographicCoverage) {
      metadataThing = addStringNoLocale(metadataThing, DS.geographicCoverage, metadata.geographicCoverage);
    }
    if (metadata.geographicExpansion) {
      metadataThing = addStringNoLocale(metadataThing, DS.geographicExpansion, metadata.geographicExpansion);
    }
    
    // Add resource information
    if (metadata.resourceSize) {
      metadataThing = addStringNoLocale(metadataThing, DS.resourceSize, metadata.resourceSize);
    }
    if (metadata.resourceEncoding) {
      metadataThing = addStringNoLocale(metadataThing, DS.resourceEncoding, metadata.resourceEncoding);
    }
    if (metadata.datasourceLink) {
      metadataThing = addStringNoLocale(metadataThing, DS.datasourceLink, metadata.datasourceLink);
    }
    
    dataset = setThing(dataset, metadataThing);
    await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });

    // Log audit event for metadata addition
    try {
      const session = getDefaultSession();
      if (session && session.info.isLoggedIn && currentWebId) {
        const userPodBase = currentWebId.split('/profile')[0] + '/';
        const userName = currentWebId.split('/profile')[0].split('/').pop() || 'Unknown User';
        await this.auditService.logDataSpaceOperation('Update', `${dataSpaceId} metadata`, currentWebId, userName);
        console.log('✅ Audit event logged for DataSpace metadata addition');
      }
    } catch (auditError) {
      console.warn('⚠️ Failed to log audit event:', auditError);
    }
  }

  async removeMetadata(dataSpaceId: string, metadataId: string): Promise<void> {
    const dataSpaceUrl = this.getDataSpaceUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(dataSpaceUrl, { fetch });
    const metadataThing = getThing(dataset, `${dataSpaceUrl}#${metadataId}`);
    
    if (metadataThing) {
      dataset = removeThing(dataset, metadataThing);
      await saveSolidDatasetAt(dataSpaceUrl, dataset, { fetch });
    }
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

    // Parse metadata
    const metadataThings = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === DS.Metadata
    );
    
    const metadata: DataSpaceMetadata[] = metadataThings.map(metadataThing => {
      const categories: string[] = [];
      // Extract multiple category values
      const categoryLiterals = metadataThing.predicates[DS.category]?.literals;
      if (categoryLiterals) {
        Object.keys(categoryLiterals).forEach(literal => {
          categories.push(literal);
        });
      }

      return {
        id: metadataThing.url.split('#')[1] || '',
        title: getStringNoLocale(metadataThing, DS.metadataTitle) || '',
        assetCreated: getDatetime(metadataThing, DS.assetCreated) || undefined,
        assetLastModified: getDatetime(metadataThing, DS.assetLastModified) || undefined,
        description: getStringNoLocale(metadataThing, DCTERMS.description) || undefined,
        originalTitle: getStringNoLocale(metadataThing, DS.originalTitle) || undefined,
        openDataSourceLink: getStringNoLocale(metadataThing, DS.openDataSourceLink) || undefined,
        dataFormat: getStringNoLocale(metadataThing, DS.dataFormat) || undefined,
        categories: categories.length > 0 ? categories : undefined,
        chargeable: getBoolean(metadataThing, DS.chargeable) || undefined,
        useSetting: getStringNoLocale(metadataThing, DS.useSetting) || undefined,
        datasourceLanguage: getStringNoLocale(metadataThing, DS.datasourceLanguage) || undefined,
        metadataLanguage: getStringNoLocale(metadataThing, DS.metadataLanguage) || undefined,
        temporalCoverageBeginning: getDatetime(metadataThing, DS.temporalCoverageBeginning) || undefined,
        temporalCoverageEnding: getDatetime(metadataThing, DS.temporalCoverageEnding) || undefined,
        linkedMetadata: getStringNoLocale(metadataThing, DS.linkedMetadata) || undefined,
        updateFrequency: getStringNoLocale(metadataThing, DS.updateFrequency) || undefined,
        geographicCoverage: getStringNoLocale(metadataThing, DS.geographicCoverage) || undefined,
        geographicExpansion: getStringNoLocale(metadataThing, DS.geographicExpansion) || undefined,
        resourceSize: getStringNoLocale(metadataThing, DS.resourceSize) || undefined,
        resourceEncoding: getStringNoLocale(metadataThing, DS.resourceEncoding) || undefined,
        datasourceLink: getStringNoLocale(metadataThing, DS.datasourceLink) || undefined,
        createdAt: getDatetime(metadataThing, DCTERMS.created) || new Date(),
        createdBy: getStringNoLocale(metadataThing, DS.createdBy) || '',
      };
    });

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

    const dataSpace: DataSpace = {
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
      metadata,
      tags,
      category,
      allowedUsers: members.map(member => member.webId), // Populate from members
    };

    return dataSpace;
  }

  /**
   * Check if a user has access to a dataspace
   */
  private checkUserAccess(dataSpace: DataSpace, userWebId: string | undefined): boolean {
    if (!userWebId) return false;

    // Admins can access all dataspaces
    if (this.auditService.isAdmin(userWebId)) {
      return true;
    }

    // Check if user is a member or in allowed users list
    const isMember = dataSpace.members.some(member => member.webId === userWebId);
    const isAllowed = dataSpace.allowedUsers.includes(userWebId);
    
    // Also check localStorage for granted access (temporary solution)
    const hasStoredAccess = this.checkStoredAccess(userWebId, dataSpace.id);

    const hasAccess = isMember || isAllowed || hasStoredAccess;
    console.log(`🔐 Access check for ${userWebId} to ${dataSpace.id}:`, {
      isMember,
      isAllowed,
      hasStoredAccess,
      hasAccess
    });

    return hasAccess;
  }

  private checkStoredAccess(userWebId: string, dataSpaceId: string): boolean {
    try {
      const accessKey = `dataspace_access_${userWebId}`;
      const storedAccess = JSON.parse(localStorage.getItem(accessKey) || '[]');
      return storedAccess.some((access: any) => access.dataSpaceId === dataSpaceId);
    } catch (error) {
      console.warn('Error checking stored access:', error);
      return false;
    }
  }

  /**
   * Grant access to a user for a specific dataspace (admin only)
   */
  async grantUserAccess(dataSpaceId: string, userWebId: string, role: DataSpaceRole = 'read'): Promise<void> {
    const currentWebId = this.auth.getWebId();
    
    if (!this.auditService.isAdmin(currentWebId)) {
      throw new Error('Only administrators can grant user access');
    }

    await this.addMember(dataSpaceId, userWebId, role);
    
    // Create access index entry in user's pod
    try {
      await this.updateUserAccessIndex(userWebId, dataSpaceId, role, 'grant');
    } catch (error) {
      console.warn('Failed to update user access index:', error);
    }
    
    // Log the access grant
    try {
      const userName = userWebId.split('/profile')[0].split('/').pop() || 'Unknown User';
      const adminName = currentWebId?.split('/profile')[0].split('/').pop() || 'Admin';
      await this.auditService.logEvent({
        userId: currentWebId!,
        userName: adminName,
        action: 'Create',
        resourceType: 'DataSpace Access',
        resourceName: dataSpaceId,
        description: `${adminName} granted ${role} access to ${userName} for dataspace "${dataSpaceId}"`,
        metadata: { grantedTo: userWebId, role }
      });
    } catch (error) {
      console.warn('Failed to log access grant:', error);
    }
  }

  private async updateUserAccessIndex(userWebId: string, dataSpaceId: string, role: DataSpaceRole, action: 'grant' | 'revoke'): Promise<void> {
    // This would ideally require the admin to have write access to user's pod
    // For now, we'll implement this as a notification system or skip it
    // In a real implementation, this would need proper access control setup
    console.log(`✅ Access ${action} for user ${userWebId} to dataspace ${dataSpaceId} with role ${role}`);
    
    // Store the access grant info in browser storage as a temporary solution
    const accessKey = `dataspace_access_${userWebId}`;
    const existingAccess = JSON.parse(localStorage.getItem(accessKey) || '[]');
    
    if (action === 'grant') {
      const accessInfo = {
        dataSpaceId,
        role,
        grantedAt: new Date().toISOString(),
        grantedBy: this.auth.getWebId()
      };
      
      // Remove any existing access for this dataspace
      const filteredAccess = existingAccess.filter((access: any) => access.dataSpaceId !== dataSpaceId);
      filteredAccess.push(accessInfo);
      
      localStorage.setItem(accessKey, JSON.stringify(filteredAccess));
      console.log(`✅ Stored access grant in localStorage for ${userWebId}`);
    } else if (action === 'revoke') {
      const filteredAccess = existingAccess.filter((access: any) => access.dataSpaceId !== dataSpaceId);
      localStorage.setItem(accessKey, JSON.stringify(filteredAccess));
      console.log(`✅ Removed access from localStorage for ${userWebId}`);
    }
  }

  /**
   * Helper function to grant proper Solid access to a dataspace container
   * This function grants Read/Write access to the invited member
   */
  async grantAccessToDataspace(adminSession: any, containerUrl: string, memberWebId: string): Promise<void> {
    try {
      console.log('🔐 Granting access to dataspace container:', containerUrl, 'for user:', memberWebId);
      
      const fetch = adminSession?.fetch || this.auth.getFetch();
      
      if (!fetch) {
        throw new Error('No authenticated fetch function available');
      }

      // First, ensure the container exists by trying to access it
      try {
        await getSolidDataset(containerUrl, { fetch });
        console.log('✅ Container exists:', containerUrl);
      } catch (error) {
        console.log('📁 Creating container:', containerUrl);
        try {
          await createContainerAt(containerUrl, { fetch });
        } catch (createError) {
          console.warn('Could not create container, continuing with member-based access control');
          return;
        }
      }

      // Try to set ACL permissions if possible
      try {
        const resourceInfoWithAcl = await getResourceInfoWithAcl(containerUrl, { fetch });
        
        if (hasAccessibleAcl(resourceInfoWithAcl)) {
          let resourceAcl;
          
          if (hasResourceAcl(resourceInfoWithAcl)) {
            resourceAcl = await getResourceAcl(resourceInfoWithAcl);
          } else if (hasFallbackAcl(resourceInfoWithAcl)) {
            resourceAcl = createAclFromFallbackAcl(resourceInfoWithAcl);
          } else {
            resourceAcl = createAcl(resourceInfoWithAcl);
          }
          
          if (resourceAcl) {
            // Grant read/write access to the container itself
            resourceAcl = setAgentResourceAccess(resourceAcl, memberWebId, { 
              read: true, 
              write: true, 
              append: true, 
              control: false 
            });
            
            // Grant default read/write access for items inside the container
            resourceAcl = setAgentDefaultAccess(resourceAcl, memberWebId, { 
              read: true, 
              write: true, 
              append: true, 
              control: false 
            });

            // Save the ACL
            await saveAclFor(resourceInfoWithAcl, resourceAcl, { fetch });
            console.log('✅ Successfully granted ACL access to', memberWebId, 'for container:', containerUrl);
          }
        } else {
          console.log('📝 ACL not accessible, using member-based access control');
        }
      } catch (aclError) {
        console.log('🔧 ACL operation failed, using member-based access control:', aclError);
      }

    } catch (error) {
      console.error('❌ Failed to grant access to dataspace:', error);
      // Don't throw error - app can still function with member-list based access control
      console.log('📝 Falling back to member-list based access control');
    }
  }

  /**
   * Enhanced grantUserAccess that includes proper Solid ACL permissions
   */
  async grantUserAccessEnhanced(dataSpaceId: string, userWebId: string, role: DataSpaceRole = 'read'): Promise<void> {
    const currentWebId = this.auth.getWebId();
    
    if (!this.auditService.isAdmin(currentWebId)) {
      throw new Error('Only administrators can grant user access');
    }

    console.log('🔄 Enhanced access grant for:', userWebId, 'to dataspace:', dataSpaceId);

    // First, add member to the dataspace metadata
    await this.addMember(dataSpaceId, userWebId, role);
    
    // Get the dataspace to find its storage location
    const dataSpace = await this.getDataSpace(dataSpaceId);
    if (!dataSpace) {
      throw new Error('DataSpace not found');
    }

    // Grant Solid ACL access to the storage container
    const containerUrl = dataSpace.storageLocation;
    const session = { fetch: this.auth.getFetch() };
    
    try {
      await this.grantAccessToDataspace(session, containerUrl, userWebId);
    } catch (error) {
      console.warn('⚠️ Failed to set Solid ACL permissions (dataspace may still be accessible):', error);
    }
    
    // Create access index entry in user's pod
    try {
      await this.updateUserAccessIndex(userWebId, dataSpaceId, role, 'grant');
    } catch (error) {
      console.warn('Failed to update user access index:', error);
    }
    
    // Log the access grant
    try {
      const userName = userWebId.split('/profile')[0].split('/').pop() || 'Unknown User';
      const adminName = currentWebId?.split('/profile')[0].split('/').pop() || 'Admin';
      await this.auditService.logEvent({
        userId: currentWebId!,
        userName: adminName,
        action: 'Create',
        resourceType: 'DataSpace Access',
        resourceName: dataSpaceId,
        description: `${adminName} granted ${role} access to ${userName} for dataspace "${dataSpaceId}"`,
        metadata: { grantedTo: userWebId, role }
      });
    } catch (error) {
      console.warn('Failed to log access grant:', error);
    }
  }
}