import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { SolidAuthService } from '@/services/solidAuth';
import { 
  getSolidDataset, 
  getContainedResourceUrlAll,
  getThing,
  getStringNoLocale,
  getDatetime
} from '@inrupt/solid-client';
import { 
  Activity, 
  User, 
  Clock, 
  RefreshCw,
  FileText,
  Database,
  Settings,
  Trash2,
  Edit,
  Plus,
  Shield
} from 'lucide-react';
import { RDF, DCTERMS } from '@inrupt/vocab-common-rdf';

const ORG_POD_BASE = "https://solid4dpp.solidcommunity.net/";
const AUDIT_LDES_URL = `${ORG_POD_BASE}org/audit/ldes/`;

// ActivityStreams vocabulary
const AS = {
  Activity: "https://www.w3.org/ns/activitystreams#Activity",
  Create: "https://www.w3.org/ns/activitystreams#Create",
  Update: "https://www.w3.org/ns/activitystreams#Update",
  Delete: "https://www.w3.org/ns/activitystreams#Delete",
  PermissionChange: "https://www.w3.org/ns/activitystreams#Announce",
  actor: "https://www.w3.org/ns/activitystreams#actor",
  object: "https://www.w3.org/ns/activitystreams#object",
  target: "https://www.w3.org/ns/activitystreams#target",
};

interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  object: string;
  target: string;
  timestamp: Date;
  filename: string;
}

const AuditLogsViewer = () => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const auth = SolidAuthService.getInstance();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const session = auth.getSessionInfo();
      
      if (!session.isLoggedIn) {
        throw new Error('Not logged in');
      }

      // Get the LDES container
      const containerDataset = await getSolidDataset(AUDIT_LDES_URL, { 
        fetch: auth.getFetch() 
      });
      
      // Get all contained resources (audit log files)
      const auditFileUrls = getContainedResourceUrlAll(containerDataset);
      
      // Load each audit log file
      const events: AuditEvent[] = [];
      
      for (const fileUrl of auditFileUrls) {
        if (!fileUrl.endsWith('.ttl')) continue;
        
        try {
          const auditDataset = await getSolidDataset(fileUrl, { 
            fetch: auth.getFetch() 
          });
          
          const auditThing = getThing(auditDataset, fileUrl);
          if (!auditThing) continue;
          
          // Extract ActivityStreams properties
          const actionType = getStringNoLocale(auditThing, RDF.type);
          const actor = getStringNoLocale(auditThing, AS.actor);
          const object = getStringNoLocale(auditThing, AS.object);
          const target = getStringNoLocale(auditThing, AS.target);
          const timestamp = getDatetime(auditThing, DCTERMS.created);
          
          if (actionType && actor && object && target && timestamp) {
            events.push({
              id: fileUrl,
              action: getActionName(actionType),
              actor,
              object,
              target,
              timestamp,
              filename: fileUrl.split('/').pop() || 'unknown'
            });
          }
        } catch (error) {
          console.warn(`Failed to load audit file ${fileUrl}:`, error);
        }
      }
      
      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setAuditEvents(events);
      setLastRefresh(new Date());
      
      toast({
        title: 'Audit Logs Loaded',
        description: `Found ${events.length} audit events`,
      });
      
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs from org Pod',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getActionName = (actionType: string): string => {
    switch (actionType) {
      case AS.Create:
        return 'Create';
      case AS.Update:
        return 'Update';
      case AS.Delete:
        return 'Delete';
      case AS.PermissionChange:
        return 'PermissionChange';
      default:
        return 'Activity';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Create':
        return <Plus className="w-4 h-4" />;
      case 'Update':
        return <Edit className="w-4 h-4" />;
      case 'Delete':
        return <Trash2 className="w-4 h-4" />;
      case 'PermissionChange':
        return <Shield className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'Create':
        return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800';
      case 'Update':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800';
      case 'Delete':
        return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800';
      case 'PermissionChange':
        return 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const formatUserWebId = (webId: string): string => {
    try {
      const url = new URL(webId);
      return url.hostname + url.pathname.split('/')[1];
    } catch {
      return webId.split('/').slice(-2).join('/');
    }
  };

  const formatResourcePath = (resourceIri: string): string => {
    try {
      const url = new URL(resourceIri);
      return url.pathname.split('/').slice(-2).join('/');
    } catch {
      return resourceIri.split('/').slice(-2).join('/');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Audit Logs</CardTitle>
                <CardDescription>
                  System-wide activity logs from all users
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={loadAuditLogs} 
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Events</span>
              </div>
              <p className="text-2xl font-bold text-primary">{auditEvents.length}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Unique Users</span>
              </div>
              <p className="text-2xl font-bold text-accent">
                {new Set(auditEvents.map(e => e.actor)).size}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Refresh</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events List */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest audit events from all connected users
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Loading audit logs...</span>
              </div>
            ) : auditEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No audit events found</h3>
                <p className="text-muted-foreground">
                  Audit events will appear here as users interact with the system
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {auditEvents.map((event, index) => (
                  <div key={event.id}>
                    <div className="flex items-start gap-4 p-4 hover:bg-muted/50">
                      <div className="flex-shrink-0 mt-1">
                        <Badge className={`${getActionColor(event.action)} border`}>
                          <div className="flex items-center gap-1">
                            {getActionIcon(event.action)}
                            {event.action}
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">
                            {formatUserWebId(event.actor)}
                          </span>
                          <span className="text-muted-foreground">performed</span>
                          <span className="font-medium text-primary">{event.action}</span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            <span>Resource: {formatResourcePath(event.object)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {event.filename}
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < auditEvents.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsViewer;