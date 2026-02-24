import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateAccess, generateOTP } from '@/db/api';
import { QrCode, MapPin, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function QRScannerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState('');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);

  useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          setLocationError(`Location error: ${error.message}`);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }

    // Auto-validate if QR code is in URL
    if (searchParams.get('code')) {
      handleValidate();
    }
  }, []);

  const handleValidate = async () => {
    if (!qrCode) {
      setError('Please enter a QR code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await validateAccess({
        qrCode,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        otpCode: otpCode || undefined,
        password: password || undefined,
      });

      if (response.success && response.documentId) {
        toast.success('Access granted! Redirecting...');
        navigate(`/view/${response.documentId}`);
      } else {
        // Check if OTP or password is required
        const reasons = response.reasons || [];
        
        // Check for specific requirements
        const needsOTP = reasons.some((r: string) => r.toLowerCase().includes('otp'));
        const needsPassword = reasons.some((r: string) => r.toLowerCase().includes('password'));
        
        if (needsOTP && !otpCode) {
          setRequiresOTP(true);
          setShowOTPDialog(true);
          setError('OTP verification required');
        } else if (needsPassword && !password) {
          setRequiresPassword(true);
          setShowPasswordDialog(true);
          setError('Password required');
        } else {
          // Format the error message nicely
          const errorMessage = reasons.length > 0 
            ? reasons.join('. ') 
            : 'Access denied';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = (error as Error).message || 'Failed to validate access';
      setError(errorMessage);
      toast.error('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    try {
      // In a real app, we'd need the QR code ID
      // For demo, we'll show a message
      toast.info('OTP would be sent to document owner for approval');
      setShowOTPDialog(true);
    } catch (error) {
      console.error('OTP request error:', error);
      toast.error('Failed to request OTP');
    }
  };

  const handleOTPSubmit = () => {
    setShowOTPDialog(false);
    handleValidate();
  };

  const handlePasswordSubmit = () => {
    setShowPasswordDialog(false);
    handleValidate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <QrCode className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Scan QR Code</CardTitle>
          <CardDescription>Enter the QR code to access the document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {locationError && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {latitude && longitude && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Location detected: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="qrCode">QR Code</Label>
            <Input
              id="qrCode"
              type="text"
              placeholder="Enter QR code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button onClick={handleValidate} className="w-full" disabled={loading}>
            {loading ? 'Validating...' : 'Validate Access'}
          </Button>

          {requiresOTP && (
            <Button
              onClick={handleRequestOTP}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <Lock className="h-4 w-4 mr-2" />
              Request OTP
            </Button>
          )}
        </CardContent>
      </Card>

      {/* OTP Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>
              Enter the one-time password to access the document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <Button onClick={handleOTPSubmit} className="w-full">
              Submit OTP
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              This document is password protected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handlePasswordSubmit} className="w-full">
              Submit Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
