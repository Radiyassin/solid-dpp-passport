import { 
  login, 
  logout, 
  handleIncomingRedirect, 
  getDefaultSession,
  Session 
} from "@inrupt/solid-client-authn-browser";
import { 
  provisionOrgStructure, 
  provisionWorkspaceWac, 
  getWorkspaceUrl,
  getAssetsUrl,
  getAuditLdesUrl 
} from "./solidWorkspace";

const SOLID_ISSUER = "https://solidcommunity.net";
const ORG_WEBID = "https://solid4dpp.solidcommunity.net/profile/card#me";

/**
 * Sample login implementation for Solid OIDC
 */
export class SolidLoginManager {
  private session: Session;

  constructor() {
    this.session = getDefaultSession();
  }

  /**
   * Initialize session and handle redirect
   */
  async initialize(): Promise<boolean> {
    await handleIncomingRedirect();
    
    if (this.session.info.isLoggedIn && this.session.info.webId) {
      console.log("User logged in:", this.session.info.webId);
      
      // Provision workspace on login
      await this.provisionUserWorkspace(this.session.info.webId);
      return true;
    }
    
    return false;
  }

  /**
   * Start login process
   */
  async login(): Promise<void> {
    await login({
      oidcIssuer: SOLID_ISSUER,
      redirectUrl: new URL("/", window.location.href).toString(),
      clientName: "Digital Product Passport App",
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await logout();
  }

  /**
   * Get current session
   */
  getSession(): Session {
    return this.session;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.session.info.isLoggedIn;
  }

  /**
   * Get user's WebID
   */
  getWebId(): string | undefined {
    return this.session.info.webId;
  }

  /**
   * Provision organization structure and user workspace
   */
  private async provisionUserWorkspace(userWebId: string): Promise<void> {
    try {
      // First, ensure org structure exists
      await provisionOrgStructure(this.session);
      
      // Then provision user workspace with WAC
      const workspaceUrl = await provisionWorkspaceWac({
        session: this.session,
        userWebId,
        orgWebId: ORG_WEBID,
      });
      
      console.log("User workspace provisioned:", workspaceUrl);
      
      // Log the workspace setup
      const assetsUrl = getAssetsUrl(userWebId);
      const auditUrl = getAuditLdesUrl();
      
      console.log("Assets container:", assetsUrl);
      console.log("Audit LDES:", auditUrl);
      
    } catch (error) {
      console.error("Error provisioning workspace:", error);
      throw error;
    }
  }

  /**
   * Get user's workspace URLs
   */
  getUserWorkspaceInfo(userWebId?: string): {
    workspaceUrl: string;
    assetsUrl: string;
    auditUrl: string;
  } | null {
    const webId = userWebId || this.getWebId();
    if (!webId) return null;
    
    return {
      workspaceUrl: getWorkspaceUrl(webId),
      assetsUrl: getAssetsUrl(webId),
      auditUrl: getAuditLdesUrl(),
    };
  }
}

// Export singleton instance
export const solidLoginManager = new SolidLoginManager();

/**
 * Example usage:
 * 
 * // Initialize on app start
 * const isLoggedIn = await solidLoginManager.initialize();
 * 
 * // Login
 * await solidLoginManager.login();
 * 
 * // Get session for API calls
 * const session = solidLoginManager.getSession();
 * 
 * // Save an asset
 * import { saveAsset, appendAuditEvent } from "./solidWorkspace";
 * 
 * const userWebId = solidLoginManager.getWebId();
 * const info = solidLoginManager.getUserWorkspaceInfo();
 * 
 * if (userWebId && info) {
 *   // Save asset
 *   const assetUrl = await saveAsset(
 *     session,
 *     info.assetsUrl,
 *     "test-asset.json",
 *     JSON.stringify({ name: "Test Asset" }),
 *     "application/json"
 *   );
 *   
 *   // Log audit event
 *   await appendAuditEvent(session, info.auditUrl, {
 *     actorWebId: userWebId,
 *     action: "Create",
 *     objectIri: assetUrl,
 *     targetIri: info.workspaceUrl,
 *   });
 * }
 */