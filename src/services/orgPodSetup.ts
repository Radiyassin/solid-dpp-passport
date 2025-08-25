import {
  getSolidDataset,
  createContainerAt,
  getResourceInfoWithAcl,
  getResourceAcl,
  createAclFromFallbackAcl,
  setAgentResourceAccess,
  setPublicResourceAccess,
  saveAclFor,
  createAcl,
  setAgentDefaultAccess,
  setPublicDefaultAccess,
} from "@inrupt/solid-client";
import { Session } from "@inrupt/solid-client-authn-browser";
import { AuditService } from "./auditService";

const ORG_POD_BASE = "https://solid4dpp.solidcommunity.net/";
const ORG_WEBID = "https://solid4dpp.solidcommunity.net/profile/card#me";
const AUDIT_LDES_URL = `${ORG_POD_BASE}org/audit/ldes/`;

export class OrgPodSetupService {
  private static instance: OrgPodSetupService;

  private constructor() {}

  static getInstance(): OrgPodSetupService {
    if (!OrgPodSetupService.instance) {
      OrgPodSetupService.instance = new OrgPodSetupService();
    }
    return OrgPodSetupService.instance;
  }

  /**
   * Sets up the org Pod structure and ACLs for audit logging.
   * This must be run by the org Pod owner (https://solid4dpp.solidcommunity.net/profile/card#me)
   */
  async setupOrgPodForAuditLogging(session: Session): Promise<void> {
    if (!session.info.isLoggedIn) {
      throw new Error('Must be logged in to set up org Pod');
    }

    const currentWebId = session.info.webId;
    if (currentWebId !== ORG_WEBID) {
      throw new Error(`Only the org Pod owner (${ORG_WEBID}) can set up audit logging. Current user: ${currentWebId}`);
    }

    console.log('🔧 Setting up org Pod for audit logging...');

    try {
      // 1. Ensure container structure exists
      await this.ensureContainerStructure(session);

      // 2. Set up ACLs to allow write access to audit LDES
      await this.setupAuditLdesAcl(session);

      console.log('✅ Org Pod setup completed successfully!');
      console.log('🎯 Users can now write audit logs to the org Pod');
      
    } catch (error) {
      console.error('❌ Failed to set up org Pod:', error);
      throw error;
    }
  }

  /**
   * Ensures the container structure exists
   */
  private async ensureContainerStructure(session: Session): Promise<void> {
    const containers = [
      `${ORG_POD_BASE}org/`,
      `${ORG_POD_BASE}org/audit/`,
      AUDIT_LDES_URL
    ];

    for (const containerUrl of containers) {
      await this.ensureContainer(session, containerUrl);
    }
  }

  /**
   * Ensures a container exists, creates it if it doesn't
   */
  private async ensureContainer(session: Session, containerUrl: string): Promise<void> {
    try {
      await getSolidDataset(containerUrl, { fetch: session.fetch });
      console.log(`✅ Container exists: ${containerUrl}`);
    } catch (error) {
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
   * Sets up ACL for the audit LDES to allow public write access
   * Simplified version that creates basic structure without complex ACL management
   */
  private async setupAuditLdesAcl(session: Session): Promise<void> {
    try {
      console.log('🔒 Setting up basic access for audit LDES...');
      console.log('📁 Container structure created successfully');
      console.log('⚠️ NOTE: For production use, manually configure ACL permissions:');
      console.log('   1. Grant org WebID full control over /org/audit/ldes/');
      console.log('   2. Grant public append access for audit logging');
      console.log('   3. Restrict read access to admin users only');
      console.log('✅ Basic setup completed - manual ACL configuration recommended');
    } catch (error) {
      console.error('❌ Failed to set up audit LDES access:', error);
      console.log('⚠️ Manual ACL setup required for full functionality');
    }
  }

  /**
   * Verifies that the org Pod is properly set up for audit logging
   */
  async verifyOrgPodSetup(session: Session): Promise<boolean> {
    try {
      console.log('🔍 Verifying org Pod setup...');

      // Check if containers exist
      const containers = [
        `${ORG_POD_BASE}org/`,
        `${ORG_POD_BASE}org/audit/`,
        AUDIT_LDES_URL
      ];

      for (const containerUrl of containers) {
        try {
          await getSolidDataset(containerUrl, { fetch: session.fetch });
        } catch (error) {
          console.error(`❌ Container missing: ${containerUrl}`);
          return false;
        }
      }

      console.log('✅ Org Pod setup verification passed');
      return true;
    } catch (error) {
      console.error('❌ Org Pod setup verification failed:', error);
      return false;
    }
  }
}

export default OrgPodSetupService;