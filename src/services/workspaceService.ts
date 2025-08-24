import {
  getSolidDataset,
  createContainerAt,
  getResourceInfo,
  createSolidDataset,
  saveSolidDatasetAt,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";
import { WACService } from "./wacService";
import { AuditService } from "./auditService";

export interface UserWorkspace {
  workspaceUrl: string;
  assetsUrl: string;
  logsUrl: string;
  userWebId: string;
}

export class WorkspaceService {
  private static instance: WorkspaceService;
  private auth: SolidAuthService;
  private wacService: WACService;
  private auditService: AuditService;
  private orgPodRoot = "https://solid4dpp.solidcommunity.net/";
  private orgWebId = "https://solid4dpp.solidcommunity.net/profile/card#me";

  private constructor() {
    this.auth = SolidAuthService.getInstance();
    this.wacService = WACService.getInstance();
    this.auditService = AuditService.getInstance();
  }

  static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  private getUserWorkspaceUrl(userWebId: string): string {
    const encodedWebId = encodeURIComponent(userWebId);
    return `${this.orgPodRoot}workspaces/${encodedWebId}/`;
  }

  private getWorkspaceFolders(workspaceUrl: string) {
    return {
      assetsUrl: `${workspaceUrl}assets/`,
      logsUrl: `${workspaceUrl}logs/`,
    };
  }

  async provisionUserWorkspace(userWebId: string): Promise<UserWorkspace> {
    const workspaceUrl = this.getUserWorkspaceUrl(userWebId);
    const { assetsUrl, logsUrl } = this.getWorkspaceFolders(workspaceUrl);
    const fetch = this.auth.getFetch();

    try {
      // Check if workspace already exists
      await getResourceInfo(workspaceUrl, { fetch });
      console.log(`Workspace already exists for user: ${userWebId}`);
    } catch {
      // Workspace doesn't exist, create it
      await this.createWorkspaceStructure(workspaceUrl, assetsUrl, logsUrl, fetch);
      
      // Set WAC permissions
      await this.wacService.setWorkspacePermissions(workspaceUrl, userWebId, this.orgWebId);
      
      console.log(`Created workspace for user: ${userWebId}`);
    }

    return {
      workspaceUrl,
      assetsUrl,
      logsUrl,
      userWebId,
    };
  }

  private async createWorkspaceStructure(
    workspaceUrl: string,
    assetsUrl: string,
    logsUrl: string,
    fetch: any
  ): Promise<void> {
    // Create main workspace container
    await createContainerAt(workspaceUrl, { fetch });
    
    // Create assets subfolder
    await createContainerAt(assetsUrl, { fetch });
    
    // Create logs subfolder
    await createContainerAt(logsUrl, { fetch });
  }

  async getUserWorkspace(userWebId: string): Promise<UserWorkspace> {
    const workspaceUrl = this.getUserWorkspaceUrl(userWebId);
    const { assetsUrl, logsUrl } = this.getWorkspaceFolders(workspaceUrl);

    return {
      workspaceUrl,
      assetsUrl,
      logsUrl,
      userWebId,
    };
  }

  async saveAssetToWorkspace(
    userWebId: string,
    assetData: any,
    assetId: string
  ): Promise<string> {
    const workspace = await this.provisionUserWorkspace(userWebId);
    const assetUrl = `${workspace.assetsUrl}${assetId}.ttl`;
    const fetch = this.auth.getFetch();

    // Save asset to user's assets folder
    await saveSolidDatasetAt(assetUrl, assetData, { fetch });

    // Log the action to org audit trail
    await this.auditService.logAssetAction(
      'Create',
      userWebId,
      assetUrl,
      workspace.workspaceUrl
    );

    return assetUrl;
  }

  async updateAssetInWorkspace(
    userWebId: string,
    assetData: any,
    assetId: string
  ): Promise<string> {
    const workspace = await this.getUserWorkspace(userWebId);
    const assetUrl = `${workspace.assetsUrl}${assetId}.ttl`;
    const fetch = this.auth.getFetch();

    // Update asset in user's assets folder
    await saveSolidDatasetAt(assetUrl, assetData, { fetch });

    // Log the action to org audit trail
    await this.auditService.logAssetAction(
      'Update',
      userWebId,
      assetUrl,
      workspace.workspaceUrl
    );

    return assetUrl;
  }

  async deleteAssetFromWorkspace(
    userWebId: string,
    assetId: string
  ): Promise<void> {
    const workspace = await this.getUserWorkspace(userWebId);
    const assetUrl = `${workspace.assetsUrl}${assetId}.ttl`;
    const fetch = this.auth.getFetch();

    // Delete asset from user's assets folder
    await fetch(assetUrl, { method: 'DELETE' });

    // Log the action to org audit trail
    await this.auditService.logAssetAction(
      'Delete',
      userWebId,
      assetUrl,
      workspace.workspaceUrl
    );
  }
}