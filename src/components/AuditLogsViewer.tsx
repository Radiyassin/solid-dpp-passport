import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Calendar, User, FileText, Activity, Trash2 } from "lucide-react";
import { AuditService, AuditEvent } from '@/services/auditService';

export const AuditLogsViewer = () => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const auditService = AuditService.getInstance();

  const loadAuditLogs = async () => {
    setLoading(true);
    console.log('🔍 Loading audit logs from local storage...');
    
    try {
      const events = auditService.getAuditLogs();
      console.log('✅ Loaded', events.length, 'audit events from local storage');
      setAuditEvents(events);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Failed to load audit logs:', error);
      setAuditEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    auditService.clearAuditLogs();
    setAuditEvents([]);
    console.log('🗑️ Audit logs cleared');
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getActionName = (action: string): string => {
    switch (action) {
      case 'Login': return 'Logged In';
      case 'Create': return 'Created';
      case 'Update': return 'Updated';
      case 'Delete': return 'Deleted';
      case 'View': return 'Viewed';
      case 'Interaction': return 'Interacted';
      default: return action;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Login': return <User className="h-4 w-4" />;
      case 'Create': return <FileText className="h-4 w-4" />;
      case 'Update': return <RefreshCw className="h-4 w-4" />;
      case 'Delete': return <Trash2 className="h-4 w-4" />;
      case 'View': return <Activity className="h-4 w-4" />;
      case 'Interaction': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'Login': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'Create': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Update': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Delete': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'View': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
      case 'Interaction': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getResourceColor = (resourceType: string): string => {
    switch (resourceType) {
      case 'DataSpace': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Asset': return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'Authentication': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      case 'UI Element': return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
      default: return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Monitor all user activities and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={loadAuditLogs}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
          <Button 
            onClick={clearLogs}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Logs
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold">{auditEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unique Users</p>
                  <p className="text-2xl font-bold">
                    {new Set(auditEvents.map(e => e.userId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Refresh</p>
                  <p className="text-sm text-muted-foreground">
                    {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Events</h3>
          <ScrollArea className="h-96 border rounded-md">
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading audit logs...
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit events found. Events will appear here as users interact with the application.
                </div>
              ) : (
                auditEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getActionColor(event.action)}>
                          <div className="flex items-center space-x-1">
                            {getActionIcon(event.action)}
                            <span>{getActionName(event.action)}</span>
                          </div>
                        </Badge>
                        <Badge variant="outline" className={getResourceColor(event.resourceType)}>
                          {event.resourceType}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground mb-2">
                        {event.description}
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>User:</strong> {event.userName}</p>
                        <p><strong>Resource:</strong> {event.resourceName}</p>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <p><strong>Details:</strong> {JSON.stringify(event.metadata, null, 2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsViewer;