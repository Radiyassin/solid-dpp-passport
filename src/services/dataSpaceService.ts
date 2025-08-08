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
};

export type DataSpaceRole = 'admin' | 'write' | 'read';
export type AccessMode = 'public' | 'private' | 'restricted';

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
}

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

  private getSharedDataSpacesUrl(): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/shared-dataspaces.ttl`;
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
      
      const dataSpaces: DataSpace[] = [];
      const dataSpaceIds = new Set<string>(); // Track IDs to avoid duplicates
      
      // 1. Load data spaces owned by the current user
      let containerDataset;
      try {
        containerDataset = await getSolidDataset(containerUrl, { fetch });
        const containerThings = getThingAll(containerDataset);
        
        console.log('📁 Found container things:', containerThings.length);
        
        // Look for references to dataspace files in the container
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
              
              if (id && !dataSpaceIds.has(id)) {
                const dataSpace = this.parseDataSpace(id, dataSpaceDataset);
                console.log('✅ Parsed owned dataspace:', dataSpace.title, 'active:', dataSpace.isActive);
                
                if (dataSpace.isActive) {
                  dataSpaces.push(dataSpace);
                  dataSpaceIds.add(id);
                }
              }
            } catch (parseError) {
              console.error('❌ Error parsing dataspace file:', thingUrl, parseError);
            }
          }
        }
      } catch (containerError) {
        console.log('DataSpaces container does not exist yet for owned spaces');
      }

      // 2. Load shared data spaces where the user is a member
      const sharedDataSpaces = await this.getSharedDataSpaces();
      for (const sharedSpace of sharedDataSpaces) {
        if (!dataSpaceIds.has(sharedSpace.id) && sharedSpace.isActive) {
          dataSpaces.push(sharedSpace);
          dataSpaceIds.add(sharedSpace.id);
        }
      }
      
      // 3. Fallback: If no dataspaces found, try direct discovery
      if (dataSpaces.length === 0) {
        console.log('🔄 No dataspaces found via container, trying direct discovery...');
        
        const testIds = await this.discoverDataSpaceIds();
        for (const id of testIds) {
          if (!dataSpaceIds.has(id)) {
            try {
              const dataSpace = await this.getDataSpace(id);
              if (dataSpace && dataSpace.isActive) {
                dataSpaces.push(dataSpace);
                dataSpaceIds.add(id);
              }
            } catch (error) {
              // Ignore errors for non-existent dataspaces
            }
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
    // For demo purposes, directly add the member and create a demonstration notification
    try {
      // First, add the member directly to the dataspace
      await this.addMemberDirectly(dataSpaceId, memberWebId, role);
      
      // Then create a demo notification for testing purposes
      const dataSpace = await this.getDataSpace(dataSpaceId);
      if (dataSpace) {
        const { NotificationService } = await import('./notificationService');
        const notificationService = NotificationService.getInstance();
        
        // This creates a demo notification that shows up in the current user's notification center
        // In a real implementation, this would send notifications to the actual recipient
        await notificationService.sendDataSpaceInvitation(
          memberWebId,
          dataSpaceId,
          dataSpace.title,
          role
        );
      }
      
      console.log(`✅ Member ${memberWebId} added to dataspace and notification sent`);
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  async addMemberDirectly(dataSpaceId: string, memberWebId: string, role: DataSpaceRole): Promise<void> {
    // This method directly adds a member (used when accepting invitations)
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

    // Store reference in member's pod if it's the current user
    await this.storeSharedDataSpaceReference(memberWebId, dataSpaceId, dataSpaceUrl);
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
    };
  }

  private async storeSharedDataSpaceReference(memberWebId: string, dataSpaceId: string, dataSpaceUrl: string): Promise<void> {
    try {
      // For demonstration purposes, we'll try to store a reference in the current user's pod
      // In a real implementation, you'd need proper Solid ACL permissions to write to another user's pod
      
      const fetch = this.auth.getFetch();
      const currentWebId = this.auth.getWebId();
      
      // Only store reference if we're trying to add the current user as a member
      if (memberWebId === currentWebId) {
        const sharedUrl = this.getSharedDataSpacesUrl();
        
        let sharedDataset;
        try {
          sharedDataset = await getSolidDataset(sharedUrl, { fetch });
        } catch (error) {
          // Create new dataset if it doesn't exist
          sharedDataset = createSolidDataset();
        }
        
        // Create a reference thing
        let referenceThing = createThing({ name: `ref-${dataSpaceId}` });
        referenceThing = addStringNoLocale(referenceThing, DCTERMS.identifier, dataSpaceId);
        referenceThing = addStringNoLocale(referenceThing, DS.storageLocation, dataSpaceUrl);
        referenceThing = addDatetime(referenceThing, DCTERMS.created, new Date());
        
        sharedDataset = setThing(sharedDataset, referenceThing);
        await saveSolidDatasetAt(sharedUrl, sharedDataset, { fetch });
        
        console.log(`✅ Stored shared dataspace reference for ${dataSpaceId}`);
      } else {
        console.log(`ℹ️ Cannot store reference in ${memberWebId}'s pod - would need proper ACL permissions`);
      }
    } catch (error) {
      console.error('Error storing shared dataspace reference:', error);
    }
  }

  private async getSharedDataSpaces(): Promise<DataSpace[]> {
    const webId = this.auth.getWebId();
    if (!webId) return [];

    const dataSpaces: DataSpace[] = [];
    const fetch = this.auth.getFetch();
    
    try {
      // Check if the user has a shared-dataspaces reference file
      const sharedUrl = this.getSharedDataSpacesUrl();
      const sharedDataset = await getSolidDataset(sharedUrl, { fetch });
      
      // Extract dataspace references from the shared file
      const sharedThings = getThingAll(sharedDataset);
      
      for (const thing of sharedThings) {
        const dataSpaceUrl = getStringNoLocale(thing, DS.storageLocation);
        const dataSpaceId = getStringNoLocale(thing, DCTERMS.identifier);
        
        if (dataSpaceUrl && dataSpaceId) {
          try {
            // Try to access the shared dataspace
            const dataSpaceDataset = await getSolidDataset(dataSpaceUrl, { fetch });
            const dataSpace = this.parseDataSpace(dataSpaceId, dataSpaceDataset);
            
            // Verify the user is actually a member
            const isMember = dataSpace.members.some(member => member.webId === webId);
            if (isMember && dataSpace.isActive) {
              dataSpaces.push(dataSpace);
            }
          } catch (error) {
            console.log(`Could not access shared dataspace ${dataSpaceId}:`, error);
          }
        }
      }
    } catch (error) {
      console.log('No shared dataspaces file found or error reading it:', error);
    }
    
    return dataSpaces;
  }
}