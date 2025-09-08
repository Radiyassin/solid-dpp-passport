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
      
      // Only log meaningful interactions (links, form submissions, special tracked elements)
      // Removed button clicks as per user request
      if (
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
        
        if (!session || !webId || !session.info.isLoggedIn) {
          console.log('🔍 Skipping audit log - user not authenticated');
          return;
        }

        const target = event.target as HTMLElement;
        const actionText = target.textContent?.trim() || target.getAttribute('aria-label') || target.tagName;
        
        // Extract user name from webId
        const userName = webId.split('/profile')[0].split('/').pop() || 'Unknown User';
        
        console.log('🔍 Logging user interaction:', {
          webId,
          userName,
          element: target.tagName,
          actionText,
          page: window.location.pathname
        });
        
        // Log the interaction using the new JSON-based service
        await auditService.logInteraction(
          'clicked',
          actionText,
          webId,
          userName,
          window.location.pathname
        );
        
        console.log('✅ User interaction logged successfully');
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