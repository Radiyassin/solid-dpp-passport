import { useEffect } from 'react';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import { AuditService } from '@/services/auditService';
import { SolidAuthService } from '@/services/solidAuth';

interface AuditActionLoggerProps {
  children: React.ReactNode;
}

/**
 * Global audit logger component that wraps the app to capture all user interactions
 */
export const AuditActionLogger: React.FC<AuditActionLoggerProps> = ({ children }) => {
  const auditService = AuditService.getInstance();
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    // Set up global click listener to capture user interactions
    const handleGlobalInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Only log meaningful interactions (buttons, links, form submissions)
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        (target as HTMLInputElement).type === 'submit' ||
        target.classList.contains('audit-track')
      ) {
        logUserInteraction(event);
      }
    };

    const logUserInteraction = async (event: Event) => {
      try {
        const session = getDefaultSession();
        const webId = auth.getWebId();
        
        if (!session || !webId || !session.info.isLoggedIn) return;

        const target = event.target as HTMLElement;
        const actionType = target.getAttribute('data-action') || 'interaction';
        const resourcePath = target.getAttribute('data-resource') || window.location.pathname;
        
        // Log the interaction
        const userPodBase = webId.split('/profile')[0] + '/';
        await auditService.appendAuditEvent(session, {
          actorWebId: webId,
          action: 'Create', // Generic action for user interactions
          objectIri: `${userPodBase}interactions/${Date.now()}`,
          targetIri: `${window.location.origin}${resourcePath}`,
        });
        
        console.log('🔍 User interaction logged:', {
          element: target.tagName,
          action: actionType,
          resource: resourcePath,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('⚠️ Failed to log user interaction:', error);
      }
    };

    // Add global event listeners
    document.addEventListener('click', handleGlobalInteraction);
    document.addEventListener('submit', handleGlobalInteraction);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalInteraction);
      document.removeEventListener('submit', handleGlobalInteraction);
    };
  }, [auditService, auth]);

  return <>{children}</>;
};

export default AuditActionLogger;