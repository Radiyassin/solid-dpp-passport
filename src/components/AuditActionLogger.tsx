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

  // No UI interaction tracking - only business logic events are logged

  return <>{children}</>;
};

export default AuditActionLogger;