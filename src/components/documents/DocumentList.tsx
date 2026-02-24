import { useEffect, useState } from 'react';
import { getMyDocuments, updateDocument, revokeQRCode } from '@/db/api';
import type { DocumentWithQRCode } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { FileText, QrCode, MapPin, Clock, Lock, Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function DocumentList() {
  const [documents, setDocuments] = useState<DocumentWithQRCode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      const docs = await getMyDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDeactivate = async (documentId: string) => {
    try {
      await updateDocument(documentId, { is_active: false });
      toast.success('Document deactivated successfully');
      loadDocuments();
    } catch (error) {
      console.error('Error deactivating document:', error);
      toast.error('Failed to deactivate document');
    }
  };

  const handleRevokeQR = async (qrCodeId: string) => {
    try {
      await revokeQRCode(qrCodeId);
      toast.success('QR code revoked successfully');
      loadDocuments();
    } catch (error) {
      console.error('Error revoking QR code:', error);
      toast.error('Failed to revoke QR code');
    }
  };

  const getQRCodeUrl = (code: string) => {
    return `${window.location.origin}/scan?code=${code}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
          <p className="text-muted-foreground">
            Upload your first document to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const qrCode = doc.qr_codes[0];
        const qrUrl = qrCode ? getQRCodeUrl(qrCode.code) : '';

        return (
          <Card key={doc.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {doc.original_filename}
                  </CardTitle>
                  <CardDescription>
                    Uploaded {new Date(doc.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                  {doc.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Size:</span>{' '}
                  {(doc.file_size / 1024).toFixed(2)} KB
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span> {doc.mime_type}
                </div>
              </div>

              {/* QR Code Info */}
              {qrCode && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code Access
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {qrCode.allowed_latitude && qrCode.allowed_longitude && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Geo-fenced ({qrCode.geo_radius_meters}m radius)
                        </span>
                      </div>
                    )}
                    {qrCode.expires_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Expires {new Date(qrCode.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {qrCode.require_otp && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span>OTP Required</span>
                      </div>
                    )}
                    {qrCode.password_hash && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span>Password Protected</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={qrCode.is_active ? 'default' : 'secondary'}>
                    {qrCode.is_active ? 'QR Active' : 'QR Revoked'}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {qrCode && qrCode.is_active && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4 mr-2" />
                        View QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>QR Code for {doc.original_filename}</DialogTitle>
                        <DialogDescription>
                          Scan this QR code to access the document
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4 p-4">
                        <QRCodeDataUrl text={qrUrl} width={256} />
                        <p className="text-sm text-muted-foreground text-center break-all">
                          {qrUrl}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(qrUrl);
                            toast.success('URL copied to clipboard');
                          }}
                        >
                          Copy URL
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {qrCode && qrCode.is_active && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke QR
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke QR Code Access?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will prevent anyone from accessing the document using this QR code.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevokeQR(qrCode.id)}>
                          Revoke
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {doc.is_active && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Document?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will prevent all access to this document. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeactivate(doc.id)}>
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
