import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UploadForm from '@/components/documents/UploadForm';
import DocumentList from '@/components/documents/DocumentList';
import AccessLogs from '@/components/logs/AccessLogs';
import AlertPanel from '@/components/alerts/AlertPanel';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Upload, FileText, Activity, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Secure Document Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.username || 'User'} ({profile?.role || 'viewer'})
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden md:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Access Logs</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden md:inline">AI Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <DocumentList />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <UploadForm onUploadSuccess={() => setActiveTab('documents')} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <AccessLogs />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <AlertPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
