import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  setThing,
  getResourceInfoWithAcl,
  getResourceAcl,
  createAclFromFallbackAcl,
  setAgentResourceAccess,
  saveAclFor,
  createContainerAt,
  overwriteFile,
} from "@inrupt/solid-client";
import { Session } from "@inrupt/solid-client-authn-browser";
import { RDF, DCTERMS } from "@inrupt/vocab-common-rdf";

// ActivityStreams vocabulary
const AS = {
  Activity: "https://www.w3.org/ns/activitystreams#Activity",
  Create: "https://www.w3.org/ns/activitystreams#Create",
  Update: "https://www.w3.org/ns/activitystreams#Update",
  Delete: "https://www.w3.org/ns/activitystreams#Delete",
  PermissionChange: "https://www.w3.org/ns/activitystreams#Announce", // Using Announce for permission changes
  actor: "https://www.w3.org/ns/activitystreams#actor",
  object: "https://www.w3.org/ns/activitystreams#object",
  target: "https://www.w3.org/ns/activitystreams#target",
};

// Organization Pod configuration
const ORG_POD_BASE = "https://solid4dpp.solidcommunity.net/";
const ORG_WEBID = "https://solid4dpp.solidcommunity.net/profile/card#me";
const AUDIT_LDES_URL = `${ORG_POD_BASE}org/audit/ldes/`;

export type AuditAction = 'Create' | 'Update' | 'Delete' | 'PermissionChange';

export interface AuditEventInput {
  actorWebId: string;
  action: AuditAction;
  objectIri: string;
  targetIri: string;
}

export class AuditService {
  private static instance: AuditService;

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Appends an audit event to the organization's LDES
   */
  async appendAuditEvent(session: Session, event: AuditEventInput): Promise<void> {
    if (!session.fetch) {
      throw new Error('Session fetch not available');
    }

    try {
      console.log('📝 Creating audit event:', event);

      // Ensure the audit LDES container exists
      await this.ensureAuditContainer(session);

      // Create the audit entry
      const timestamp = new Date();
      const filename = this.generateAuditFilename(timestamp);
      const auditFileUrl = `${AUDIT_LDES_URL}${filename}`;

      console.log('📝 Attempting to save audit event to:', auditFileUrl);

      // Create the ActivityStreams audit entry
      let dataset = createSolidDataset();
      let auditThing = createThing({ url: auditFileUrl });

      // Add ActivityStreams properties
      const actionType = this.getActivityStreamType(event.action);
      auditThing = addStringNoLocale(auditThing, RDF.type, actionType);
      auditThing = addStringNoLocale(auditThing, AS.actor, event.actorWebId);
      auditThing = addStringNoLocale(auditThing, AS.object, event.objectIri);
      auditThing = addStringNoLocale(auditThing, AS.target, event.targetIri);
      auditThing = addDatetime(auditThing, DCTERMS.created, timestamp);

      dataset = setThing(dataset, auditThing);

      // Save the audit entry to the org Pod
      await saveSolidDatasetAt(auditFileUrl, dataset, { fetch: session.fetch });
      
      console.log('✅ Audit event saved successfully to:', auditFileUrl);
    } catch (error) {
      console.error('❌ Failed to save audit event:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        url: (error as any)?.url
      });
      
      // Check if it's a permission error
      if ((error as any)?.status === 403 || (error as any)?.status === 401) {
        console.warn('⚠️ Permission denied writing to org Pod - user may not have write access');
      }
      
      // Don't throw - we don't want audit failures to break user operations
      // Just log the error and continue
    }
  }

  /**
   * Sets up ACL protection for the audit LDES container with proper permissions
   */
  async ensureAuditAcl(session: Session): Promise<void> {
    console.log('🔒 Setting up ACL for audit LDES...');
    
    try {
      // Ensure the audit container exists first
      await this.ensureAuditContainer(session);
      
      const ACL_URL = AUDIT_LDES_URL + ".acl";
      const aclTurtle = `
@prefix acl:  <http://www.w3.org/ns/auth/acl#> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

<#owner>
  a acl:Authorization ;
  acl:agent   <${ORG_WEBID}> ;
  acl:accessTo <./> ;
  acl:default  <./> ;
  acl:mode acl:Read, acl:Write, acl:Control .

<#appenders>
  a acl:Authorization ;
  acl:agentClass foaf:Agent ;   # any logged-in WebID
  acl:accessTo <./> ;
  acl:default  <./> ;
  acl:mode acl:Append .
`.trim();

      await overwriteFile(
        ACL_URL,
        new Blob([aclTurtle], { type: "text/turtle" }) as any,
        { contentType: "text/turtle", fetch: session.fetch }
      );
      
      console.log('✅ ACL configured for audit LDES');
    } catch (error) {
      console.error('❌ Failed to setup audit ACL:', error);
      throw error;
    }
  }

  /**
   * Ensures the audit container structure exists
   */
  private async ensureAuditContainer(session: Session): Promise<void> {
    if (!session.fetch) {
      throw new Error('Session fetch not available');
    }

    try {
      // Check if /org/ exists
      const orgUrl = `${ORG_POD_BASE}org/`;
      await this.ensureContainer(session, orgUrl);

      // Check if /org/audit/ exists
      const auditUrl = `${ORG_POD_BASE}org/audit/`;
      await this.ensureContainer(session, auditUrl);

      // Check if /org/audit/ldes/ exists
      await this.ensureContainer(session, AUDIT_LDES_URL);
    } catch (error) {
      console.error('Failed to ensure audit container structure:', error);
      throw error;
    }
  }

  /**
   * Ensures a container exists, creates it if it doesn't
   */
  private async ensureContainer(session: Session, containerUrl: string): Promise<void> {
    try {
      // Try to get the container
      await getSolidDataset(containerUrl, { fetch: session.fetch });
      console.log(`✅ Container exists: ${containerUrl}`);
    } catch (error) {
      // Container doesn't exist, try to create it
      console.log(`📁 Creating container: ${containerUrl}`);
      try {
        await createContainerAt(containerUrl, { fetch: session.fetch });
        console.log(`✅ Container created: ${containerUrl}`);
      } catch (createError) {
        console.error(`❌ Failed to create container ${containerUrl}:`, createError);
        throw createError;
      }
    }
  }

  /**
   * Generates a filename for audit entries based on timestamp
   */
  private generateAuditFilename(timestamp: Date): string {
    // Convert to ISO string and replace colons with hyphens for safe filename
    const isoString = timestamp.toISOString();
    const safeFilename = isoString.replace(/:/g, '-');
    return `${safeFilename}.ttl`;
  }

  /**
   * Maps audit actions to ActivityStreams types
   */
  private getActivityStreamType(action: AuditAction): string {
    switch (action) {
      case 'Create':
        return AS.Create;
      case 'Update':
        return AS.Update;
      case 'Delete':
        return AS.Delete;
      case 'PermissionChange':
        return AS.PermissionChange;
      default:
        return AS.Activity;
    }
  }

  /**
   * Helper method to log DataSpace operations
   */
  async logDataSpaceOperation(
    session: Session,
    action: AuditAction,
    dataSpaceId: string,
    userWebId: string,
    userPodBase: string
  ): Promise<void> {
    console.log('🔍 AuditService.logDataSpaceOperation called with:', {
      action,
      dataSpaceId,
      userWebId,
      userPodBase,
      sessionAvailable: !!session
    });
    
    const objectIri = `${userPodBase}dataspaces/${dataSpaceId}.ttl`;
    const targetIri = `${userPodBase}dataspaces/`;

    console.log('🔍 Will create audit event with:', {
      actorWebId: userWebId,
      action,
      objectIri,
      targetIri
    });

    await this.appendAuditEvent(session, {
      actorWebId: userWebId,
      action,
      objectIri,
      targetIri,
    });
  }

  /**
   * Helper method to log asset operations
   */
  async logAssetOperation(
    session: Session,
    action: AuditAction,
    assetPath: string,
    userWebId: string,
    userPodBase: string
  ): Promise<void> {
    const objectIri = `${userPodBase}${assetPath}`;
    const targetIri = `${userPodBase}assets/`;

    await this.appendAuditEvent(session, {
      actorWebId: userWebId,
      action,
      objectIri,
      targetIri,
    });
  }
}

export default AuditService;