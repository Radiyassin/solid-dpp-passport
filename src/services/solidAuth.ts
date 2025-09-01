import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession,
  fetch as authenticatedFetch,
} from "@inrupt/solid-client-authn-browser";

export class SolidAuthService {
  private static instance: SolidAuthService;
  
  static getInstance(): SolidAuthService {
    if (!SolidAuthService.instance) {
      SolidAuthService.instance = new SolidAuthService();
    }
    return SolidAuthService.instance;
  }

  async initializeSession(): Promise<void> {
    await handleIncomingRedirect();
    
    // Log login if user just authenticated
    const session = getDefaultSession();
    if (session.info.isLoggedIn && session.info.webId) {
      // Check if this is a fresh login (not just a page refresh)
      const lastLoginKey = `last_login_${session.info.webId}`;
      const lastLogin = localStorage.getItem(lastLoginKey);
      const now = Date.now();
      
      // Only log if more than 5 minutes since last login or first time
      if (!lastLogin || (now - parseInt(lastLogin)) > 5 * 60 * 1000) {
        try {
          const { AuditService } = await import('./auditService');
          const auditService = AuditService.getInstance();
          const userName = session.info.webId.split('/profile')[0].split('/').pop() || 'Unknown User';
          await auditService.logLogin(session.info.webId, userName);
          localStorage.setItem(lastLoginKey, now.toString());
          console.log('✅ Login event logged for user:', userName);
        } catch (error) {
          console.warn('⚠️ Failed to log login event:', error);
        }
      }
    }
  }

  async loginWithProvider(issuer: string): Promise<void> {
    // Store login attempt timestamp
    const loginTimestamp = Date.now().toString();
    localStorage.setItem('pending_login_timestamp', loginTimestamp);
    
    await login({
      oidcIssuer: issuer,
      redirectUrl: new URL("/", window.location.href).toString(),
      clientName: "Digital Product Passport",
    });
  }

  async logout(): Promise<void> {
    // Log logout before clearing session
    const session = getDefaultSession();
    if (session.info.isLoggedIn && session.info.webId) {
      try {
        const { AuditService } = await import('./auditService');
        const auditService = AuditService.getInstance();
        const userName = session.info.webId.split('/profile')[0].split('/').pop() || 'Unknown User';
        await auditService.logEvent({
          userId: session.info.webId,
          userName,
          action: 'Login', // We'll use Login action for logout too, but with different description
          resourceType: 'Authentication',
          resourceName: 'User Session',
          description: `${userName} logged out of the application`,
        });
        console.log('✅ Logout event logged for user:', userName);
      } catch (error) {
        console.warn('⚠️ Failed to log logout event:', error);
      }
    }
    
    await logout();
    
    // Clear login tracking
    if (session.info.webId) {
      localStorage.removeItem(`last_login_${session.info.webId}`);
    }
  }

  isLoggedIn(): boolean {
    return getDefaultSession().info.isLoggedIn;
  }

  getWebId(): string | undefined {
    return getDefaultSession().info.webId;
  }

  getSessionInfo() {
    return getDefaultSession().info;
  }

  getFetch() {
    return authenticatedFetch;
  }

  // Common Solid Pod providers
  getProviders() {
    return [
      {
        name: "SolidCommunity.net",
        url: "https://solidcommunity.net",
        description: "Community-run Pod provider"
      },
      {
        name: "SolidWeb.org",
        url: "https://solidweb.org",
        description: "Independent Pod provider"
      }
    ];
  }
}