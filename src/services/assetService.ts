import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  addBoolean,
  setThing,
  getThing,
  getStringNoLocale,
  getDatetime,
  getBoolean,
  getThingAll,
  removeThing,
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { SolidAuthService } from "./solidAuth";
import { AuditService } from "./auditService";
import { FOAF, DCTERMS, RDF } from "@inrupt/vocab-common-rdf";
import { DataSpaceRole, DataSpaceMember } from "./dataSpaceService";

// Custom vocabulary for Assets
const ASSET = {
  Asset: "https://w3id.org/dataspace/vocab#Asset",
  belongsToDataSpace: "https://w3id.org/dataspace/vocab#belongsToDataSpace",
  Member: "https://w3id.org/dataspace/vocab#AssetMember",
  hasRole: "https://w3id.org/dataspace/vocab#hasRole",
  memberWebId: "https://w3id.org/dataspace/vocab#memberWebId",
  memberRole: "https://w3id.org/dataspace/vocab#memberRole",
  joinedAt: "https://w3id.org/dataspace/vocab#joinedAt",
  isActive: "https://w3id.org/dataspace/vocab#isActive",
  // Metadata vocabulary
  Metadata: "https://w3id.org/dataspace/vocab#AssetMetadata",
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
};

export interface AssetMetadata {
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

export interface Asset {
  id: string;
  title: string;
  description: string;
  dataSpaceId: string;
  createdAt: Date;
  isActive: boolean;
  members: DataSpaceMember[];
  creatorWebId: string;
  metadata: AssetMetadata[];
  tags: string[];
  category?: string;
}

export interface CreateAssetInput {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
}

export interface AddAssetMetadataInput extends Omit<AssetMetadata, 'id' | 'createdAt' | 'createdBy'> {}

export class AssetService {
  private static instance: AssetService;
  private auth: SolidAuthService;
  private auditService: AuditService;

  private constructor() {
    this.auth = SolidAuthService.getInstance();
    this.auditService = AuditService.getInstance();
  }

  static getInstance(): AssetService {
    if (!AssetService.instance) {
      AssetService.instance = new AssetService();
    }
    return AssetService.instance;
  }

  private getAssetsContainerUrl(dataSpaceId: string): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/dataspaces/${dataSpaceId}/assets/`;
  }

  private getAssetUrl(dataSpaceId: string, assetId: string): string {
    return `${this.getAssetsContainerUrl(dataSpaceId)}${assetId}.ttl`;
  }

  async createAsset(dataSpaceId: string, input: CreateAssetInput): Promise<Asset> {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');

    const id = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const assetUrl = this.getAssetUrl(dataSpaceId, id);

    try {
      let dataset = createSolidDataset();
      let assetThing = createThing({ url: `${assetUrl}#${id}` });

      // Add Asset properties
      assetThing = addStringNoLocale(assetThing, RDF.type, ASSET.Asset);
      assetThing = addStringNoLocale(assetThing, DCTERMS.title, input.title);
      assetThing = addStringNoLocale(assetThing, DCTERMS.description, input.description);
      assetThing = addStringNoLocale(assetThing, ASSET.belongsToDataSpace, dataSpaceId);
      assetThing = addDatetime(assetThing, DCTERMS.created, new Date());
      assetThing = addBoolean(assetThing, ASSET.isActive, true);
      assetThing = addStringNoLocale(assetThing, DCTERMS.creator, webId);
      
      // Add category and tags if provided
      if (input.category) {
        assetThing = addStringNoLocale(assetThing, ASSET.category, input.category);
      }
      if (input.tags && input.tags.length > 0) {
        input.tags.forEach(tag => {
          assetThing = addStringNoLocale(assetThing, DCTERMS.subject, tag);
        });
      }

      dataset = setThing(dataset, assetThing);

      // Add creator as admin member
      let memberThing = createThing({ url: `${assetUrl}#member-${Date.now()}` });
      memberThing = addStringNoLocale(memberThing, RDF.type, ASSET.Member);
      memberThing = addStringNoLocale(memberThing, ASSET.memberWebId, webId);
      memberThing = addStringNoLocale(memberThing, ASSET.memberRole, 'admin');
      memberThing = addDatetime(memberThing, ASSET.joinedAt, new Date());
      
      dataset = setThing(dataset, memberThing);

      // Save to Pod
      const fetch = this.auth.getFetch();
      if (!fetch) throw new Error('No authenticated fetch function available');
      
      await saveSolidDatasetAt(assetUrl, dataset, { fetch });

      const result = this.parseAsset(dataSpaceId, id, dataset);

      // Log audit event for Asset creation
      try {
        const session = getDefaultSession();
        if (session && session.info.isLoggedIn && webId) {
          const userName = webId.split('/profile')[0].split('/').pop() || 'Unknown User';
          await this.auditService.logAssetOperation('Create', id, webId, userName);
          console.log('✅ Audit event logged for Asset creation');
        }
      } catch (auditError) {
        console.warn('⚠️ Failed to log audit event:', auditError);
      }

      return result;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw new Error(`Failed to create Asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listAssets(dataSpaceId: string): Promise<Asset[]> {
    const containerUrl = this.getAssetsContainerUrl(dataSpaceId);
    const fetch = this.auth.getFetch();
    
    try {
      // Try to get the container to find asset files
      let containerDataset;
      try {
        containerDataset = await getSolidDataset(containerUrl, { fetch });
      } catch (containerError) {
        console.log('Assets container does not exist yet, returning empty list');
        return [];
      }

      const assets: Asset[] = [];
      const containerThings = getThingAll(containerDataset);
      
      // Look for references to asset files in the container
      for (const thing of containerThings) {
        const thingUrl = thing.url;
        
        // Check if this is an asset file (.ttl)
        if (thingUrl && thingUrl.endsWith('.ttl') && thingUrl.includes('/assets/')) {
          try {
            const assetDataset = await getSolidDataset(thingUrl, { fetch });
            
            // Extract ID from filename
            const id = thingUrl.split('/').pop()?.replace('.ttl', '') || '';
            
            if (id) {
              const asset = this.parseAsset(dataSpaceId, id, assetDataset);
              
              if (asset.isActive) {
                assets.push(asset);
              }
            }
          } catch (parseError) {
            console.error('Error parsing asset file:', thingUrl, parseError);
          }
        }
      }
      
      return assets;
    } catch (error) {
      console.error('Error listing assets:', error);
      return [];
    }
  }

  async getAsset(dataSpaceId: string, assetId: string): Promise<Asset | null> {
    const assetUrl = this.getAssetUrl(dataSpaceId, assetId);
    const fetch = this.auth.getFetch();
    
    try {
      const dataset = await getSolidDataset(assetUrl, { fetch });
      return this.parseAsset(dataSpaceId, assetId, dataset);
    } catch (error) {
      console.error('Error getting asset:', error);
      return null;
    }
  }

  async updateAsset(dataSpaceId: string, assetId: string, updates: Partial<CreateAssetInput>): Promise<Asset> {
    const assetUrl = this.getAssetUrl(dataSpaceId, assetId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(assetUrl, { fetch });
    let assetThing = getThing(dataset, `${assetUrl}#${assetId}`);
    
    if (!assetThing) {
      throw new Error('Asset not found');
    }

    // Update properties
    if (updates.title !== undefined) {
      assetThing = addStringNoLocale(assetThing, DCTERMS.title, updates.title);
    }
    if (updates.description !== undefined) {
      assetThing = addStringNoLocale(assetThing, DCTERMS.description, updates.description);
    }

    dataset = setThing(dataset, assetThing);
    await saveSolidDatasetAt(assetUrl, dataset, { fetch });

    // Log audit event for Asset update
    try {
      const session = getDefaultSession();
      const webId = this.auth.getWebId();
      if (session && session.info.isLoggedIn && webId) {
        const userName = webId.split('/profile')[0].split('/').pop() || 'Unknown User';
        await this.auditService.logAssetOperation('Update', assetId, webId, userName);
        console.log('✅ Audit event logged for Asset update');
      }
    } catch (auditError) {
      console.warn('⚠️ Failed to log audit event:', auditError);
    }

    return this.parseAsset(dataSpaceId, assetId, dataset);
  }

  async addAssetMetadata(dataSpaceId: string, assetId: string, metadata: AddAssetMetadataInput): Promise<void> {
    const assetUrl = this.getAssetUrl(dataSpaceId, assetId);
    const fetch = this.auth.getFetch();
    const currentWebId = this.auth.getWebId() || '';
    
    let dataset = await getSolidDataset(assetUrl, { fetch });
    
    // Create new metadata thing
    const metadataId = `metadata-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    let metadataThing = createThing({ name: metadataId });
    
    // Add basic metadata properties
    metadataThing = addStringNoLocale(metadataThing, RDF.type, ASSET.Metadata);
    metadataThing = addStringNoLocale(metadataThing, ASSET.metadataTitle, metadata.title);
    metadataThing = addDatetime(metadataThing, DCTERMS.created, new Date());
    metadataThing = addStringNoLocale(metadataThing, ASSET.createdBy, currentWebId);
    
    // Add all the metadata fields (same as before but using ASSET vocabulary)
    if (metadata.assetCreated) {
      metadataThing = addDatetime(metadataThing, ASSET.assetCreated, metadata.assetCreated);
    }
    if (metadata.assetLastModified) {
      metadataThing = addDatetime(metadataThing, ASSET.assetLastModified, metadata.assetLastModified);
    }
    if (metadata.description) {
      metadataThing = addStringNoLocale(metadataThing, DCTERMS.description, metadata.description);
    }
    if (metadata.originalTitle) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.originalTitle, metadata.originalTitle);
    }
    if (metadata.openDataSourceLink) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.openDataSourceLink, metadata.openDataSourceLink);
    }
    if (metadata.dataFormat) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.dataFormat, metadata.dataFormat);
    }
    if (metadata.categories) {
      metadata.categories.forEach(category => {
        metadataThing = addStringNoLocale(metadataThing, ASSET.category, category);
      });
    }
    if (metadata.chargeable !== undefined) {
      metadataThing = addBoolean(metadataThing, ASSET.chargeable, metadata.chargeable);
    }
    if (metadata.useSetting) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.useSetting, metadata.useSetting);
    }
    if (metadata.datasourceLanguage) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.datasourceLanguage, metadata.datasourceLanguage);
    }
    if (metadata.metadataLanguage) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.metadataLanguage, metadata.metadataLanguage);
    }
    if (metadata.temporalCoverageBeginning) {
      metadataThing = addDatetime(metadataThing, ASSET.temporalCoverageBeginning, metadata.temporalCoverageBeginning);
    }
    if (metadata.temporalCoverageEnding) {
      metadataThing = addDatetime(metadataThing, ASSET.temporalCoverageEnding, metadata.temporalCoverageEnding);
    }
    if (metadata.linkedMetadata) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.linkedMetadata, metadata.linkedMetadata);
    }
    if (metadata.updateFrequency) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.updateFrequency, metadata.updateFrequency);
    }
    if (metadata.geographicCoverage) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.geographicCoverage, metadata.geographicCoverage);
    }
    if (metadata.geographicExpansion) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.geographicExpansion, metadata.geographicExpansion);
    }
    if (metadata.resourceSize) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.resourceSize, metadata.resourceSize);
    }
    if (metadata.resourceEncoding) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.resourceEncoding, metadata.resourceEncoding);
    }
    if (metadata.datasourceLink) {
      metadataThing = addStringNoLocale(metadataThing, ASSET.datasourceLink, metadata.datasourceLink);
    }
    
    dataset = setThing(dataset, metadataThing);
    await saveSolidDatasetAt(assetUrl, dataset, { fetch });

    // Log audit event for metadata addition
    try {
      const session = getDefaultSession();
      if (session && session.info.isLoggedIn && currentWebId) {
        const userName = currentWebId.split('/profile')[0].split('/').pop() || 'Unknown User';
        await this.auditService.logAssetOperation('Update', `${assetId} metadata`, currentWebId, userName);
        console.log('✅ Audit event logged for Asset metadata addition');
      }
    } catch (auditError) {
      console.warn('⚠️ Failed to log audit event:', auditError);
    }
  }

  async removeAssetMetadata(dataSpaceId: string, assetId: string, metadataId: string): Promise<void> {
    const assetUrl = this.getAssetUrl(dataSpaceId, assetId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(assetUrl, { fetch });
    const metadataThing = getThing(dataset, `${assetUrl}#${metadataId}`);
    
    if (metadataThing) {
      dataset = removeThing(dataset, metadataThing);
      await saveSolidDatasetAt(assetUrl, dataset, { fetch });
    }
  }

  async addAssetMember(dataSpaceId: string, assetId: string, memberWebId: string, role: DataSpaceRole): Promise<void> {
    const assetUrl = this.getAssetUrl(dataSpaceId, assetId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(assetUrl, { fetch });
    
    // Create new member thing
    let memberThing = createThing({ name: `member-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` });
    memberThing = addStringNoLocale(memberThing, RDF.type, ASSET.Member);
    memberThing = addStringNoLocale(memberThing, ASSET.memberWebId, memberWebId);
    memberThing = addStringNoLocale(memberThing, ASSET.memberRole, role);
    memberThing = addDatetime(memberThing, ASSET.joinedAt, new Date());
    
    dataset = setThing(dataset, memberThing);
    await saveSolidDatasetAt(assetUrl, dataset, { fetch });
  }

  async removeAssetMember(dataSpaceId: string, assetId: string, memberWebId: string): Promise<void> {
    const assetUrl = this.getAssetUrl(dataSpaceId, assetId);
    const fetch = this.auth.getFetch();
    
    let dataset = await getSolidDataset(assetUrl, { fetch });
    const members = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === ASSET.Member &&
      getStringNoLocale(thing, ASSET.memberWebId) === memberWebId
    );

    for (const member of members) {
      dataset = removeThing(dataset, member);
    }

    await saveSolidDatasetAt(assetUrl, dataset, { fetch });
  }

  private parseAsset(dataSpaceId: string, id: string, dataset: any): Asset {
    const assetUrl = this.getAssetUrl(dataSpaceId, id);
    
    let assetThing = getThing(dataset, `${assetUrl}#${id}`);
    
    if (!assetThing) {
      const things = getThingAll(dataset);
      assetThing = things.find(thing => 
        getStringNoLocale(thing, RDF.type) === ASSET.Asset
      );
    }

    if (!assetThing) {
      throw new Error('Asset not found in dataset');
    }

    // Parse members
    const memberThings = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === ASSET.Member
    );
    
    const members: DataSpaceMember[] = memberThings.map(memberThing => ({
      webId: getStringNoLocale(memberThing, ASSET.memberWebId) || '',
      role: (getStringNoLocale(memberThing, ASSET.memberRole) as DataSpaceRole) || 'read',
      joinedAt: getDatetime(memberThing, ASSET.joinedAt) || new Date(),
    }));

    // Parse metadata
    const metadataThings = getThingAll(dataset).filter(thing => 
      getStringNoLocale(thing, RDF.type) === ASSET.Metadata
    );
    
    const metadata: AssetMetadata[] = metadataThings.map(metadataThing => {
      const categories: string[] = [];
      const categoryLiterals = metadataThing.predicates[ASSET.category]?.literals;
      if (categoryLiterals) {
        Object.keys(categoryLiterals).forEach(literal => {
          categories.push(literal);
        });
      }

      return {
        id: metadataThing.url.split('#')[1] || '',
        title: getStringNoLocale(metadataThing, ASSET.metadataTitle) || '',
        assetCreated: getDatetime(metadataThing, ASSET.assetCreated) || undefined,
        assetLastModified: getDatetime(metadataThing, ASSET.assetLastModified) || undefined,
        description: getStringNoLocale(metadataThing, DCTERMS.description) || undefined,
        originalTitle: getStringNoLocale(metadataThing, ASSET.originalTitle) || undefined,
        openDataSourceLink: getStringNoLocale(metadataThing, ASSET.openDataSourceLink) || undefined,
        dataFormat: getStringNoLocale(metadataThing, ASSET.dataFormat) || undefined,
        categories: categories.length > 0 ? categories : undefined,
        chargeable: getBoolean(metadataThing, ASSET.chargeable) || undefined,
        useSetting: getStringNoLocale(metadataThing, ASSET.useSetting) || undefined,
        datasourceLanguage: getStringNoLocale(metadataThing, ASSET.datasourceLanguage) || undefined,
        metadataLanguage: getStringNoLocale(metadataThing, ASSET.metadataLanguage) || undefined,
        temporalCoverageBeginning: getDatetime(metadataThing, ASSET.temporalCoverageBeginning) || undefined,
        temporalCoverageEnding: getDatetime(metadataThing, ASSET.temporalCoverageEnding) || undefined,
        linkedMetadata: getStringNoLocale(metadataThing, ASSET.linkedMetadata) || undefined,
        updateFrequency: getStringNoLocale(metadataThing, ASSET.updateFrequency) || undefined,
        geographicCoverage: getStringNoLocale(metadataThing, ASSET.geographicCoverage) || undefined,
        geographicExpansion: getStringNoLocale(metadataThing, ASSET.geographicExpansion) || undefined,
        resourceSize: getStringNoLocale(metadataThing, ASSET.resourceSize) || undefined,
        resourceEncoding: getStringNoLocale(metadataThing, ASSET.resourceEncoding) || undefined,
        datasourceLink: getStringNoLocale(metadataThing, ASSET.datasourceLink) || undefined,
        createdAt: getDatetime(metadataThing, DCTERMS.created) || new Date(),
        createdBy: getStringNoLocale(metadataThing, ASSET.createdBy) || '',
      };
    });

    // Parse tags
    const tagPredicates = assetThing.predicates[DCTERMS.subject];
    const tags: string[] = [];
    if (tagPredicates?.literals) {
      Object.keys(tagPredicates.literals).forEach(literal => {
        tags.push(literal);
      });
    }

    return {
      id,
      dataSpaceId,
      title: getStringNoLocale(assetThing, DCTERMS.title) || '',
      description: getStringNoLocale(assetThing, DCTERMS.description) || '',
      createdAt: getDatetime(assetThing, DCTERMS.created) || new Date(),
      isActive: getBoolean(assetThing, ASSET.isActive) ?? true,
      creatorWebId: getStringNoLocale(assetThing, DCTERMS.creator) || '',
      members,
      metadata,
      tags,
      category: getStringNoLocale(assetThing, ASSET.category) || undefined,
    };
  }
}