import { Session } from "@inrupt/solid-client-authn-browser";

export type AuditAction = 'Login' | 'Create' | 'Update' | 'Delete' | 'View' | 'Interaction';

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: string;
  resourceName: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface AuditEventInput {
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: string;
  resourceName: string;
  description: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  private static instance: AuditService;
  private readonly STORAGE_KEY = 'app_audit_logs';

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Appends an audit event to local storage
   */
  async logEvent(event: AuditEventInput): Promise<void> {
    try {
      console.log('📝 Creating audit event:', event);

      const auditEvent: AuditEvent = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userId: event.userId,
        userName: event.userName,
        action: event.action,
        resourceType: event.resourceType,
        resourceName: event.resourceName,
        description: event.description,
        metadata: event.metadata,
      };

      // Get existing logs
      const existingLogs = this.getAuditLogs();
      
      // Add new event at the beginning (most recent first)
      existingLogs.unshift(auditEvent);
      
      // Keep only last 1000 events to prevent storage bloat
      const trimmedLogs = existingLogs.slice(0, 1000);
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
      
      console.log('✅ Audit event saved successfully:', auditEvent);
    } catch (error) {
      console.error('❌ Failed to save audit event:', error);
    }
  }

  /**
   * Gets all audit logs from local storage
   */
  getAuditLogs(): AuditEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to load audit logs:', error);
      return [];
    }
  }

  /**
   * Clears all audit logs
   */
  clearAuditLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Audit logs cleared');
  }

  /**
   * Helper method to log user login
   */
  async logLogin(userId: string, userName: string): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'Login',
      resourceType: 'Authentication',
      resourceName: 'User Session',
      description: `${userName} logged into the application`,
    });
  }

  /**
   * Helper method to log DataSpace operations
   */
  async logDataSpaceOperation(
    action: AuditAction,
    dataSpaceId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action,
      resourceType: 'DataSpace',
      resourceName: dataSpaceId,
      description: `${userName} ${action.toLowerCase()}d dataspace "${dataSpaceId}"`,
    });
  }

  /**
   * Helper method to log asset operations
   */
  async logAssetOperation(
    action: AuditAction,
    assetName: string,
    userId: string,
    userName: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action,
      resourceType: 'Asset',
      resourceName: assetName,
      description: `${userName} ${action.toLowerCase()}d asset "${assetName}"`,
    });
  }

  /**
   * Helper method to log user interactions
   */
  async logInteraction(
    interactionType: string,
    elementText: string,
    userId: string,
    userName: string,
    page?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      userName,
      action: 'Interaction',
      resourceType: 'UI Element',
      resourceName: elementText || interactionType,
      description: `${userName} ${interactionType} "${elementText}"${page ? ` on ${page}` : ''}`,
    });
  }
}

export default AuditService;