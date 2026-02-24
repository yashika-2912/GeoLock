import { useEffect, useState } from 'react';
import { getMyAccessLogs } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { AccessLogWithDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, CheckCircle, XCircle, MapPin, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AccessLogs() {
  const [logs, setLogs] = useState<AccessLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const data = await getMyAccessLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error loading access logs:', error);
      toast.error('Failed to load access logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('access-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'access_logs',
        },
        (payload) => {
          console.log('Access log update:', payload);
          loadLogs(); // Reload logs on any change
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Access Logs Yet</h3>
          <p className="text-muted-foreground">
            Access attempts will appear here in real-time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Access Logs
        </CardTitle>
        <CardDescription>Real-time monitoring of document access attempts</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {log.access_granted ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {log.documents.original_filename}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={log.access_granted ? 'default' : 'destructive'}>
                    {log.access_granted ? 'Granted' : 'Denied'}
                  </Badge>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {log.profiles && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{log.profiles.username}</span>
                    </div>
                  )}
                  {log.viewer_latitude && log.viewer_longitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {log.viewer_latitude.toFixed(4)}, {log.viewer_longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Denial Reason */}
                {!log.access_granted && log.denial_reason && (
                  <div className="p-3 bg-destructive/10 rounded text-sm">
                    <p className="font-semibold text-destructive mb-1">Denial Reason:</p>
                    <p>{log.denial_reason}</p>
                  </div>
                )}

                {/* AI Alert */}
                {log.ai_alert_generated && log.ai_alert_message && (
                  <div className="p-3 bg-warning/10 rounded text-sm">
                    <p className="font-semibold text-warning mb-1">🤖 AI Alert:</p>
                    <p>{log.ai_alert_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
