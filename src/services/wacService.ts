import {
  createSolidDataset,
  saveSolidDatasetAt,
  createThing,
  addUrl,
  addStringNoLocale,
  setThing,
  SolidDataset,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";

export class WACService {
  private static instance: WACService;
  private auth: SolidAuthService;

  // WAC vocabulary
  private WAC = {
    Authorization: "http://www.w3.org/ns/auth/acl#Authorization",
    accessTo: "http://www.w3.org/ns/auth/acl#accessTo",
    agent: "http://www.w3.org/ns/auth/acl#agent",
    mode: "http://www.w3.org/ns/auth/acl#mode",
    Read: "http://www.w3.org/ns/auth/acl#Read",
    Write: "http://www.w3.org/ns/auth/acl#Write",
    Control: "http://www.w3.org/ns/auth/acl#Control",
  };

  private constructor() {
    this.auth = SolidAuthService.getInstance();
  }

  static getInstance(): WACService {
    if (!WACService.instance) {
      WACService.instance = new WACService();
    }
    return WACService.instance;
  }

  async setWorkspacePermissions(
    workspaceUrl: string,
    userWebId: string,
    orgWebId: string
  ): Promise<void> {
    const aclUrl = `${workspaceUrl}.acl`;
    const fetch = this.auth.getFetch();

    // Create ACL dataset
    let aclDataset = createSolidDataset();

    // User permissions (Read + Write + Control)
    const userAuth = createThing({ name: "user-auth" });
    const userAuthWithType = addUrl(userAuth, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", this.WAC.Authorization);
    const userAuthWithAccessTo = addUrl(userAuthWithType, this.WAC.accessTo, workspaceUrl);
    const userAuthWithAgent = addUrl(userAuthWithAccessTo, this.WAC.agent, userWebId);
    const userAuthWithReadMode = addUrl(userAuthWithAgent, this.WAC.mode, this.WAC.Read);
    const userAuthWithWriteMode = addUrl(userAuthWithReadMode, this.WAC.mode, this.WAC.Write);
    const userAuthWithControlMode = addUrl(userAuthWithWriteMode, this.WAC.mode, this.WAC.Control);

    aclDataset = setThing(aclDataset, userAuthWithControlMode);

    // Org permissions (Read + Write)
    const orgAuth = createThing({ name: "org-auth" });
    const orgAuthWithType = addUrl(orgAuth, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", this.WAC.Authorization);
    const orgAuthWithAccessTo = addUrl(orgAuthWithType, this.WAC.accessTo, workspaceUrl);
    const orgAuthWithAgent = addUrl(orgAuthWithAccessTo, this.WAC.agent, orgWebId);
    const orgAuthWithReadMode = addUrl(orgAuthWithAgent, this.WAC.mode, this.WAC.Read);
    const orgAuthWithWriteMode = addUrl(orgAuthWithReadMode, this.WAC.mode, this.WAC.Write);

    aclDataset = setThing(aclDataset, orgAuthWithWriteMode);

    // Save ACL file
    await saveSolidDatasetAt(aclUrl, aclDataset, { fetch });
    console.log(`Set WAC permissions for workspace: ${workspaceUrl}`);
  }

  async setContainerPermissions(
    containerUrl: string,
    userWebId: string,
    orgWebId: string,
    userModes: string[] = [this.WAC.Read, this.WAC.Write],
    orgModes: string[] = [this.WAC.Read]
  ): Promise<void> {
    const aclUrl = `${containerUrl}.acl`;
    const fetch = this.auth.getFetch();

    let aclDataset = createSolidDataset();

    // User permissions
    let userAuth = createThing({ name: "user-auth" });
    userAuth = addUrl(userAuth, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", this.WAC.Authorization);
    userAuth = addUrl(userAuth, this.WAC.accessTo, containerUrl);
    userAuth = addUrl(userAuth, this.WAC.agent, userWebId);
    
    userModes.forEach(mode => {
      userAuth = addUrl(userAuth, this.WAC.mode, mode);
    });

    aclDataset = setThing(aclDataset, userAuth);

    // Org permissions
    let orgAuth = createThing({ name: "org-auth" });
    orgAuth = addUrl(orgAuth, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", this.WAC.Authorization);
    orgAuth = addUrl(orgAuth, this.WAC.accessTo, containerUrl);
    orgAuth = addUrl(orgAuth, this.WAC.agent, orgWebId);
    
    orgModes.forEach(mode => {
      orgAuth = addUrl(orgAuth, this.WAC.mode, mode);
    });

    aclDataset = setThing(aclDataset, orgAuth);

    // Save ACL file
    await saveSolidDatasetAt(aclUrl, aclDataset, { fetch });
    console.log(`Set WAC permissions for container: ${containerUrl}`);
  }
}