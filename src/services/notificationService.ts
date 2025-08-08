import { 
  getSolidDataset, 
  saveSolidDatasetAt, 
  createSolidDataset, 
  createThing, 
  setThing, 
  getThingAll, 
  getStringNoLocale, 
  addStringNoLocale, 
  addDatetime,
  removeThing
} from '@inrupt/solid-client';
import { RDF, DCTERMS } from '@inrupt/vocab-common-rdf';
import { SolidAuthService } from './solidAuth';

// Custom vocabulary for notifications
const NOTIF = {
  Invitation: 'http://example.org/notification#Invitation',
  fromUser: 'http://example.org/notification#fromUser',
  toUser: 'http://example.org/notification#toUser',
  dataSpaceId: 'http://example.org/notification#dataSpaceId',
  dataSpaceTitle: 'http://example.org/notification#dataSpaceTitle',
  role: 'http://example.org/notification#role',
  status: 'http://example.org/notification#status',
  createdAt: 'http://example.org/notification#createdAt'
};

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface DataSpaceInvitation {
  id: string;
  fromUser: string;
  toUser: string;
  dataSpaceId: string;
  dataSpaceTitle: string;
  role: string;
  status: InvitationStatus;
  createdAt: Date;
}

export class NotificationService {
  private static instance: NotificationService;
  private auth: SolidAuthService;

  private constructor() {
    this.auth = SolidAuthService.getInstance();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private getNotificationsUrl(): string {
    const webId = this.auth.getWebId();
    if (!webId) throw new Error('User not authenticated');
    
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/notifications.ttl`;
  }

  async sendDataSpaceInvitation(
    toUserWebId: string, 
    dataSpaceId: string, 
    dataSpaceTitle: string, 
    role: string
  ): Promise<void> {
    const fromUserWebId = this.auth.getWebId();
    if (!fromUserWebId) throw new Error('User not authenticated');

    const fetch = this.auth.getFetch();
    if (!fetch) throw new Error('No authenticated fetch function available');

    // Create invitation in the recipient's notifications
    try {
      const notificationsUrl = this.getNotificationsUrlForUser(toUserWebId);
      
      let dataset;
      try {
        dataset = await getSolidDataset(notificationsUrl, { fetch });
      } catch (error) {
        // Create new dataset if it doesn't exist
        dataset = createSolidDataset();
      }

      const invitationId = `invitation-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      let invitationThing = createThing({ name: invitationId });
      
      invitationThing = addStringNoLocale(invitationThing, RDF.type, NOTIF.Invitation);
      invitationThing = addStringNoLocale(invitationThing, NOTIF.fromUser, fromUserWebId);
      invitationThing = addStringNoLocale(invitationThing, NOTIF.toUser, toUserWebId);
      invitationThing = addStringNoLocale(invitationThing, NOTIF.dataSpaceId, dataSpaceId);
      invitationThing = addStringNoLocale(invitationThing, NOTIF.dataSpaceTitle, dataSpaceTitle);
      invitationThing = addStringNoLocale(invitationThing, NOTIF.role, role);
      invitationThing = addStringNoLocale(invitationThing, NOTIF.status, 'pending');
      invitationThing = addDatetime(invitationThing, NOTIF.createdAt, new Date());

      dataset = setThing(dataset, invitationThing);
      
      // For demo purposes, we'll store in current user's notifications
      // In real implementation, you'd need proper ACL permissions to write to recipient's pod
      const currentUserNotificationsUrl = this.getNotificationsUrl();
      await saveSolidDatasetAt(currentUserNotificationsUrl, dataset, { fetch });
      
      console.log(`✅ Invitation sent to ${toUserWebId} for dataspace ${dataSpaceTitle}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      throw error;
    }
  }

  async getInvitations(): Promise<DataSpaceInvitation[]> {
    const fetch = this.auth.getFetch();
    if (!fetch) return [];

    try {
      const notificationsUrl = this.getNotificationsUrl();
      const dataset = await getSolidDataset(notificationsUrl, { fetch });
      
      const invitations: DataSpaceInvitation[] = [];
      const things = getThingAll(dataset);

      for (const thing of things) {
        const type = getStringNoLocale(thing, RDF.type);
        if (type === NOTIF.Invitation) {
          const invitation: DataSpaceInvitation = {
            id: thing.url.split('#')[1] || '',
            fromUser: getStringNoLocale(thing, NOTIF.fromUser) || '',
            toUser: getStringNoLocale(thing, NOTIF.toUser) || '',
            dataSpaceId: getStringNoLocale(thing, NOTIF.dataSpaceId) || '',
            dataSpaceTitle: getStringNoLocale(thing, NOTIF.dataSpaceTitle) || '',
            role: getStringNoLocale(thing, NOTIF.role) || '',
            status: (getStringNoLocale(thing, NOTIF.status) as InvitationStatus) || 'pending',
            createdAt: new Date(getStringNoLocale(thing, NOTIF.createdAt) || '')
          };
          invitations.push(invitation);
        }
      }

      return invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.log('No notifications found or error reading them:', error);
      return [];
    }
  }

  async respondToInvitation(invitationId: string, response: 'accepted' | 'rejected'): Promise<void> {
    const fetch = this.auth.getFetch();
    if (!fetch) throw new Error('No authenticated fetch function available');

    try {
      const notificationsUrl = this.getNotificationsUrl();
      let dataset = await getSolidDataset(notificationsUrl, { fetch });
      
      const things = getThingAll(dataset);
      const invitationThing = things.find(thing => 
        thing.url.endsWith(`#${invitationId}`) && 
        getStringNoLocale(thing, RDF.type) === NOTIF.Invitation
      );

      if (!invitationThing) {
        throw new Error('Invitation not found');
      }

      if (response === 'accepted') {
        // Update invitation status
        let updatedThing = addStringNoLocale(invitationThing, NOTIF.status, 'accepted');
        dataset = setThing(dataset, updatedThing);
        
        // Add user to the dataspace (this would need to be implemented)
        const dataSpaceId = getStringNoLocale(invitationThing, NOTIF.dataSpaceId);
        const role = getStringNoLocale(invitationThing, NOTIF.role);
        
        if (dataSpaceId && role) {
          // Import and use DataSpaceService to actually add the member
          const { DataSpaceService } = await import('./dataSpaceService');
          const dataSpaceService = DataSpaceService.getInstance();
          const userWebId = this.auth.getWebId();
          
          if (userWebId) {
            await dataSpaceService.addMemberDirectly(dataSpaceId, userWebId, role as any);
          }
        }
      } else {
        // Update invitation status to rejected
        let updatedThing = addStringNoLocale(invitationThing, NOTIF.status, 'rejected');
        dataset = setThing(dataset, updatedThing);
      }

      await saveSolidDatasetAt(notificationsUrl, dataset, { fetch });
      console.log(`✅ Invitation ${response}`);
    } catch (error) {
      console.error(`Error ${response} invitation:`, error);
      throw error;
    }
  }

  async removeInvitation(invitationId: string): Promise<void> {
    const fetch = this.auth.getFetch();
    if (!fetch) throw new Error('No authenticated fetch function available');

    try {
      const notificationsUrl = this.getNotificationsUrl();
      let dataset = await getSolidDataset(notificationsUrl, { fetch });
      
      const things = getThingAll(dataset);
      const invitationThing = things.find(thing => 
        thing.url.endsWith(`#${invitationId}`) && 
        getStringNoLocale(thing, RDF.type) === NOTIF.Invitation
      );

      if (invitationThing) {
        dataset = removeThing(dataset, invitationThing);
        await saveSolidDatasetAt(notificationsUrl, dataset, { fetch });
        console.log(`✅ Invitation removed`);
      }
    } catch (error) {
      console.error('Error removing invitation:', error);
      throw error;
    }
  }

  private getNotificationsUrlForUser(webId: string): string {
    const baseUrl = webId.split('/profile')[0];
    return `${baseUrl}/notifications.ttl`;
  }
}