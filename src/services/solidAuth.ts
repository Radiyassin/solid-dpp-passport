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
  }

  async loginWithProvider(issuer: string): Promise<void> {
    await login({
      oidcIssuer: issuer,
      redirectUrl: new URL("/", window.location.href).toString(),
      clientName: "Digital Product Passport",
    });
    
    // Log the login after successful authentication
    setTimeout(async () => {
      const session = getDefaultSession();
      if (session.info.isLoggedIn && session.info.webId) {
        const { AuditService } = await import('./auditService');
        const auditService = AuditService.getInstance();
        const userName = session.info.webId.split('/profile')[0].split('/').pop() || 'Unknown User';
        await auditService.logLogin(session.info.webId, userName);
      }
    }, 1000); // Small delay to ensure session is fully established
  }

  async logout(): Promise<void> {
    await logout();
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