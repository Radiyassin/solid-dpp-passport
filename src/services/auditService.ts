import {
  createSolidDataset,
  saveSolidDatasetAt,
  createThing,
  addUrl,
  addStringNoLocale,
  addDatetime,
  setThing,
  createContainerAt,
  getResourceInfo,
} from "@inrupt/solid-client";
import { SolidAuthService } from "./solidAuth";

export type AuditAction = 'Create' | 'Update' | 'Delete' | 'Read';

export class AuditService {
  private static instance: AuditService;
  private auth: SolidAuthService;
  private orgAuditUrl = "https://solid4dpp.solidcommunity.net/org/audit/ldes/";

  // ActivityStreams vocabulary
  private AS = {
    Create: "https://www.w3.org/ns/activitystreams#Create",
    Update: "https://www.w3.org/ns/activitystreams#Update", 
    Delete: "https://www.w3.org/ns/activitystreams#Delete",
    Read: "https://www.w3.org/ns/activitystreams#Read",
    actor: "https://www.w3.org/ns/activitystreams#actor",
    object: "https://www.w3.org/ns/activitystreams#object",
    target: "https://www.w3.org/ns/activitystreams#target",
  };

  // Dublin Core Terms
  private DCT = {
    created: "http://purl.org/dc/terms/created",
  };

  private constructor() {
    this.auth = SolidAuthService.getInstance();
  }

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private async ensureAuditContainerExists(): Promise<void> {
    const fetch = this.auth.getFetch();
    
    try {
      // Check if audit container exists
      await getResourceInfo(this.orgAuditUrl, { fetch });
    } catch {
      // Create the audit container if it doesn't exist
      // First ensure parent containers exist
      const orgUrl = "https://solid4dpp.solidcommunity.net/org/";
      const auditUrl = "https://solid4dpp.solidcommunity.net/org/audit/";
      
      try {
        await createContainerAt(orgUrl, { fetch });
      } catch {
        // Might already exist
      }
      
      try {
        await createContainerAt(auditUrl, { fetch });
      } catch {
        // Might already exist
      }
      
      await createContainerAt(this.orgAuditUrl, { fetch });
      console.log("Created audit LDES container");
    }
  }

  async logAssetAction(
    action: AuditAction,
    userWebId: string,
    assetUrl: string,
    workspaceUrl: string
  ): Promise<void> {
    await this.ensureAuditContainerExists();
    
    const fetch = this.auth.getFetch();
    const timestamp = new Date();
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const eventUrl = `${this.orgAuditUrl}${eventId}.ttl`;

    // Create event dataset
    let eventDataset = createSolidDataset();

    // Create the event thing
    let event = createThing({ name: "" }); // Empty name means it refers to the document itself

    // Add ActivityStreams type based on action
    const actionType = this.AS[action];
    event = addUrl(event, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", actionType);

    // Add actor (user who performed the action)
    event = addUrl(event, this.AS.actor, userWebId);

    // Add object (the asset that was acted upon)
    event = addUrl(event, this.AS.object, assetUrl);

    // Add target (the workspace where the action occurred)
    event = addUrl(event, this.AS.target, workspaceUrl);

    // Add creation timestamp
    event = addDatetime(event, this.DCT.created, timestamp);

    // Add the event to the dataset
    eventDataset = setThing(eventDataset, event);

    // Save the event file
    await saveSolidDatasetAt(eventUrl, eventDataset, { fetch });

    console.log(`Logged ${action} action for asset ${assetUrl} by user ${userWebId}`);
  }

  async logCustomEvent(
    action: string,
    userWebId: string,
    objectUrl: string,
    targetUrl: string,
    additionalProperties: Record<string, any> = {}
  ): Promise<void> {
    await this.ensureAuditContainerExists();
    
    const fetch = this.auth.getFetch();
    const timestamp = new Date();
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const eventUrl = `${this.orgAuditUrl}${eventId}.ttl`;

    let eventDataset = createSolidDataset();
    let event = createThing({ name: "" });

    // Add basic ActivityStreams properties
    event = addStringNoLocale(event, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", action);
    event = addUrl(event, this.AS.actor, userWebId);
    event = addUrl(event, this.AS.object, objectUrl);
    event = addUrl(event, this.AS.target, targetUrl);
    event = addDatetime(event, this.DCT.created, timestamp);

    // Add any additional properties
    Object.entries(additionalProperties).forEach(([property, value]) => {
      if (typeof value === 'string') {
        event = addStringNoLocale(event, property, value);
      } else if (value instanceof Date) {
        event = addDatetime(event, property, value);
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        event = addStringNoLocale(event, property, value.toString());
      }
    });

    eventDataset = setThing(eventDataset, event);
    await saveSolidDatasetAt(eventUrl, eventDataset, { fetch });

    console.log(`Logged custom event: ${action} for ${objectUrl} by ${userWebId}`);
  }
}