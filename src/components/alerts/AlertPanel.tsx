import { useEffect, useState } from 'react';
import { getMyAccessLogs } from '@/db/api';
import { supabase } from '@/db/supabase';
import type { AccessLogWithDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertPanel() {
  const [alerts, setAlerts] = useState<AccessLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const data = await getMyAccessLogs();
      // Filter only denied access with AI alerts
      const alertLogs = data.filter(
        (log) => !log.access_granted && log.ai_alert_generated
      );
      setAlerts(alertLogs);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'access_logs',
          filter: 'access_granted=eq.false',
        },
        (payload) => {
          console.log('New alert:', payload);
          loadAlerts();
          toast.error('⚠️ New security alert detected!');
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
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-success mb-4" />
          <h3 className="text-lg font-semibold mb-2">All Clear</h3>
          <p className="text-muted-foreground">
            No suspicious activity detected. AI-powered alerts will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          AI Security Alerts
        </CardTitle>
        <CardDescription>
          AI-powered analysis of suspicious access attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 border-2 border-destructive/50 rounded-lg space-y-3 bg-destructive/5"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">
                        Security Alert
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Blocked</Badge>
                </div>

                {/* Document Info */}
                <div className="p-3 bg-background rounded">
                  <p className="text-sm font-semibold mb-1">Document:</p>
                  <p className="text-sm">{alert.documents.original_filename}</p>
                </div>

                {/* AI Alert Message */}
                {alert.ai_alert_message && (
                  <div className="p-3 bg-warning/10 border border-warning/50 rounded">
                    <p className="text-sm font-semibold text-warning mb-2">
                      🤖 AI Analysis:
                    </p>
                    <p className="text-sm">{alert.ai_alert_message}</p>
                  </div>
                )}

                {/* Denial Details */}
                {alert.denial_reason && (
                  <div className="p-3 bg-background rounded">
                    <p className="text-sm font-semibold mb-1">Reasons:</p>
                    <p className="text-sm text-destructive">{alert.denial_reason}</p>
                  </div>
                )}

                {/* Location Info */}
                {alert.viewer_latitude && alert.viewer_longitude && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Attempted from: {alert.viewer_latitude.toFixed(4)},{' '}
                      {alert.viewer_longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(alert.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
