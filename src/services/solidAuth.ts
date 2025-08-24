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
        name: "Inrupt PodSpaces",
        url: "https://login.inrupt.com",
        description: "Commercial Pod provider by Inrupt"
      },
      {
        name: "SolidWeb.org", 
        url: "https://solidweb.org",
        description: "Independent Pod provider"
      },
      {
        name: "Use.id",
        url: "https://use.id",
        description: "European Pod provider"
      }
    ];
  }
}