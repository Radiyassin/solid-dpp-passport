import {
  getSolidDataset,
  createSolidDataset,
  saveSolidDatasetAt,
  overwriteFile,
  getResourceInfoWithAcl,
  createAcl,
  setAgentResourceAccess,
  saveAclFor,
  AclDataset,
  WithResourceInfo,
  SolidDataset,
  hasAccessibleAcl,
  getResourceAcl,
  createAclFromFallbackAcl,
  setPublicResourceAccess,
} from "@inrupt/solid-client";
import { Session } from "@inrupt/solid-client-authn-browser";

const ORG_POD_BASE = "https://solid4dpp.solidcommunity.net/";
const ORG_WEBID = "https://solid4dpp.solidcommunity.net/profile/card#me";

/**
 * Creates the base organization structure if it doesn't exist
 */
export async function provisionOrgStructure(session: Session): Promise<void> {
  const containers = [
    `${ORG_POD_BASE}org/`,
    `${ORG_POD_BASE}org/workspaces/`,
    `${ORG_POD_BASE}org/audit/`,
    `${ORG_POD_BASE}org/audit/ldes/`,
  ];

  for (const containerUrl of containers) {
    try {
      // Check if container exists
      await getSolidDataset(containerUrl, { fetch: session.fetch });
      console.log(`Container exists: ${containerUrl}`);
    } catch (error) {
      // Container doesn't exist, create it
      console.log(`Creating container: ${containerUrl}`);
      
      const containerDataset = createSolidDataset();
      await saveSolidDatasetAt(containerUrl, containerDataset, {
        fetch: session.fetch,
      });
    }
  }
}

/**
 * Creates user workspace with proper WAC permissions
 */
export async function provisionWorkspaceWac({
  session,
  userWebId,
  orgWebId = ORG_WEBID,
}: {
  session: Session;
  userWebId: string;
  orgWebId?: string;
}): Promise<string> {
  const encodedWebId = encodeURIComponent(userWebId);
  const workspaceUrl = `${ORG_POD_BASE}org/workspaces/${encodedWebId}/`;
  const assetsUrl = `${workspaceUrl}assets/`;
  const logsUrl = `${workspaceUrl}logs/`;

  // Create workspace containers
  const containers = [workspaceUrl, assetsUrl, logsUrl];
  
  for (const containerUrl of containers) {
    try {
      await getSolidDataset(containerUrl, { fetch: session.fetch });
      console.log(`Container exists: ${containerUrl}`);
    } catch (error) {
      console.log(`Creating container: ${containerUrl}`);
      
      const containerDataset = createSolidDataset();
      await saveSolidDatasetAt(containerUrl, containerDataset, {
        fetch: session.fetch,
      });
    }
  }

  // Set WAC permissions on workspace
  await setWorkspacePermissions(session, workspaceUrl, userWebId, orgWebId);

  return workspaceUrl;
}

/**
 * Sets WAC permissions on workspace container
 */
async function setWorkspacePermissions(
  session: Session,
  workspaceUrl: string,
  userWebId: string,
  orgWebId: string
): Promise<void> {
  try {
    // Get resource info with ACL
    const resourceInfoWithAcl = await getResourceInfoWithAcl(workspaceUrl, {
      fetch: session.fetch,
    });

    if (!hasAccessibleAcl(resourceInfoWithAcl)) {
      console.log("No accessible ACL found for workspace, skipping ACL setup");
      return;
    }

    // Get existing ACL or create from fallback
    const existingAcl = getResourceAcl(resourceInfoWithAcl);
    let acl: AclDataset;
    
    if (existingAcl) {
      acl = existingAcl;
    } else {
      acl = createAclFromFallbackAcl(resourceInfoWithAcl);
    }

    // Set permissions for user (read, write, append - no control)
    acl = setAgentResourceAccess(acl, userWebId, {
      read: true,
      write: true,
      append: true,
      control: false,
    });

    // Set permissions for org (read, write, append - no control) 
    acl = setAgentResourceAccess(acl, orgWebId, {
      read: true,
      write: true,
      append: true,
      control: false,
    });

    // Save the ACL
    await saveAclFor(resourceInfoWithAcl, acl, { fetch: session.fetch });
    console.log(`ACL set for workspace: ${workspaceUrl}`);
  } catch (error) {
    console.error("Error setting workspace permissions:", error);
    // Don't throw to allow workspace creation to continue
  }
}

/**
 * Saves an asset file to the user's assets container
 */
export async function saveAsset(
  session: Session,
  assetsUrl: string,
  fileName: string,
  content: string | Blob,
  contentType: string
): Promise<string> {
  const fileUrl = `${assetsUrl}${fileName}`;
  
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
    
    await overwriteFile(fileUrl, blob, {
      fetch: session.fetch,
      contentType,
    });
    
    console.log(`Asset saved: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    console.error("Error saving asset:", error);
    throw error;
  }
}

/**
 * Appends an audit event to the LDES container
 */
export async function appendAuditEvent(
  session: Session,
  ldesBase: string,
  {
    actorWebId,
    action,
    objectIri,
    targetIri,
  }: {
    actorWebId: string;
    action: "Create" | "Update" | "Delete" | "PermissionChange";
    objectIri: string;
    targetIri: string;
  }
): Promise<string> {
  const timestamp = new Date().toISOString();
  const safeTimestamp = timestamp.replace(/:/g, "-");
  const fileName = `${safeTimestamp}.ttl`;
  const eventUrl = `${ldesBase}${fileName}`;

  const turtleContent = `@prefix as: <https://www.w3.org/ns/activitystreams#> .
@prefix dct: <http://purl.org/dc/terms/> .

<>
  a as:${action} ;
  as:actor <${actorWebId}> ;
  as:object <${objectIri}> ;
  as:target <${targetIri}> ;
  dct:created "${timestamp}"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
`;

  try {
    const blob = new Blob([turtleContent], { type: "text/turtle" });
    
    await overwriteFile(eventUrl, blob, {
      fetch: session.fetch,
      contentType: "text/turtle",
    });
    
    console.log(`Audit event logged: ${eventUrl}`);
    return eventUrl;
  } catch (error) {
    console.error("Error logging audit event:", error);
    throw error;
  }
}

/**
 * Sets public read access on a resource
 */
export async function setPublicRead(session: Session, resourceUrl: string): Promise<void> {
  try {
    const resourceInfoWithAcl = await getResourceInfoWithAcl(resourceUrl, {
      fetch: session.fetch,
    });

    if (!hasAccessibleAcl(resourceInfoWithAcl)) {
      console.log("No accessible ACL found for public read setup");
      return;
    }

    const existingAcl = getResourceAcl(resourceInfoWithAcl);
    let acl: AclDataset;
    
    if (existingAcl) {
      acl = existingAcl;
    } else {
      acl = createAclFromFallbackAcl(resourceInfoWithAcl);
    }

    // Set public read access
    acl = setPublicResourceAccess(acl, { 
      read: true, 
      append: false, 
      write: false, 
      control: false 
    });

    await saveAclFor(resourceInfoWithAcl, acl, { fetch: session.fetch });
    console.log(`Public read access set for: ${resourceUrl}`);
  } catch (error) {
    console.error("Error setting public read access:", error);
    throw error;
  }
}

/**
 * Gets the workspace URL for a user
 */
export function getWorkspaceUrl(userWebId: string): string {
  const encodedWebId = encodeURIComponent(userWebId);
  return `${ORG_POD_BASE}org/workspaces/${encodedWebId}/`;
}

/**
 * Gets the assets URL for a user
 */
export function getAssetsUrl(userWebId: string): string {
  return `${getWorkspaceUrl(userWebId)}assets/`;
}

/**
 * Gets the audit LDES URL
 */
export function getAuditLdesUrl(): string {
  return `${ORG_POD_BASE}org/audit/ldes/`;
}