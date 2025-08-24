/**
 * Integration service to connect existing asset management with Solid workspace
 */
import { Session } from "@inrupt/solid-client-authn-browser";
import { 
  saveAsset, 
  appendAuditEvent, 
  getAssetsUrl, 
  getAuditLdesUrl, 
  getWorkspaceUrl 
} from "./solidWorkspace";
import { solidLoginManager } from "./solidLoginSample";

export class SolidAssetIntegration {
  
  /**
   * Save asset to user's Solid workspace and log audit event
   */
  static async saveAssetWithAudit(
    assetData: any,
    fileName: string,
    action: "Create" | "Update" | "Delete" = "Create"
  ): Promise<string | null> {
    const session = solidLoginManager.getSession();
    const userWebId = solidLoginManager.getWebId();
    
    if (!session.info.isLoggedIn || !userWebId) {
      console.error("User not logged in");
      return null;
    }

    try {
      const assetsUrl = getAssetsUrl(userWebId);
      const workspaceUrl = getWorkspaceUrl(userWebId);
      const auditUrl = getAuditLdesUrl();
      
      // Save the asset
      const assetContent = JSON.stringify(assetData, null, 2);
      const assetUrl = await saveAsset(
        session,
        assetsUrl,
        fileName,
        assetContent,
        "application/json"
      );
      
      // Log audit event
      await appendAuditEvent(session, auditUrl, {
        actorWebId: userWebId,
        action,
        objectIri: assetUrl,
        targetIri: workspaceUrl,
      });
      
      console.log(`Asset ${action.toLowerCase()}d:`, assetUrl);
      return assetUrl;
      
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing asset:`, error);
      return null;
    }
  }

  /**
   * Create asset wrapper
   */
  static async createAsset(assetData: any, fileName: string): Promise<string | null> {
    return this.saveAssetWithAudit(assetData, fileName, "Create");
  }

  /**
   * Update asset wrapper
   */
  static async updateAsset(assetData: any, fileName: string): Promise<string | null> {
    return this.saveAssetWithAudit(assetData, fileName, "Update");
  }

  /**
   * Delete asset wrapper (saves deletion record)
   */
  static async deleteAsset(assetId: string): Promise<boolean> {
    const session = solidLoginManager.getSession();
    const userWebId = solidLoginManager.getWebId();
    
    if (!session.info.isLoggedIn || !userWebId) {
      console.error("User not logged in");
      return false;
    }

    try {
      const workspaceUrl = getWorkspaceUrl(userWebId);
      const auditUrl = getAuditLdesUrl();
      const assetsUrl = getAssetsUrl(userWebId);
      const assetUrl = `${assetsUrl}${assetId}`;
      
      // Log deletion event
      await appendAuditEvent(session, auditUrl, {
        actorWebId: userWebId,
        action: "Delete",
        objectIri: assetUrl,
        targetIri: workspaceUrl,
      });
      
      console.log(`Asset deletion logged:`, assetId);
      return true;
      
    } catch (error) {
      console.error("Error logging asset deletion:", error);
      return false;
    }
  }

  /**
   * Get user's workspace info
   */
  static getUserWorkspaceInfo(): {
    workspaceUrl: string;
    assetsUrl: string;
    auditUrl: string;
  } | null {
    return solidLoginManager.getUserWorkspaceInfo();
  }
}