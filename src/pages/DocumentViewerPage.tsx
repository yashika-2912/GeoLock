import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, downloadDocument } from '@/db/api';
import type { Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentViewerPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      toast.error('Invalid document ID');
      navigate('/scan');
      return;
    }

    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const doc = await getDocument(documentId!);
      if (!doc) {
        toast.error('Document not found');
        navigate('/scan');
        return;
      }

      if (!doc.is_active) {
        toast.error('Document is no longer active');
        navigate('/scan');
        return;
      }

      setDocument(doc);

      // Download and display the document
      const blob = await downloadDocument(doc.storage_path);
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
      navigate('/scan');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document || !fileUrl) return;

    setDownloading(true);
    try {
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = document.original_filename;
      link.click();
      toast.success('Document downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const isImage = document.mime_type.startsWith('image/');
  const isPDF = document.mime_type === 'application/pdf';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success" />
                  Access Granted
                </CardTitle>
                <CardDescription>
                  You have been granted access to this secure document
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/scan')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{document.original_filename}</h2>
                <p className="text-sm text-muted-foreground">
                  {(document.file_size / 1024).toFixed(2)} KB • {document.mime_type}
                </p>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download Document'}
            </Button>
          </CardContent>
        </Card>

        {/* Document Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {fileUrl && isImage && (
              <div className="flex justify-center">
                <img
                  src={fileUrl}
                  alt={document.original_filename}
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
            {fileUrl && isPDF && (
              <div className="w-full h-[800px]">
                <iframe
                  src={fileUrl}
                  className="w-full h-full border rounded-lg"
                  title={document.original_filename}
                />
              </div>
            )}
            {!isImage && !isPDF && (
              <div className="text-center p-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Preview not available for this file type. Please download to view.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
