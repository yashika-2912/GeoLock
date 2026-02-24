import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { createDocument, createQRCode, uploadDocument } from '@/db/api';
import { Upload, FileText, MapPin, Clock, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface UploadFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useGeoFencing, setUseGeoFencing] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geoRadius, setGeoRadius] = useState('100');
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const [useOTP, setUseOTP] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        toast.success('Location captured successfully');
      },
      (error) => {
        toast.error(`Error getting location: ${error.message}`);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (useGeoFencing && (!latitude || !longitude)) {
      toast.error('Please provide location coordinates');
      return;
    }

    if (usePassword && !password) {
      toast.error('Please provide a password');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Generate encryption key (simple demo - in production use proper encryption)
      const encryptionKey = crypto.randomUUID();
      
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `${timestamp}_${sanitizedFilename}`;

      setProgress(30);

      // Upload file to storage
      await uploadDocument(file, storagePath);
      setProgress(50);

      // Create document record
      const document = await createDocument({
        filename: sanitizedFilename,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        encryption_key: encryptionKey,
      });

      setProgress(70);

      // Create QR code
      const qrCodeData: any = {
        document_id: document.id,
        geo_radius_meters: useGeoFencing ? Number.parseInt(geoRadius) : 100,
        require_otp: useOTP,
      };

      if (useGeoFencing) {
        qrCodeData.allowed_latitude = Number.parseFloat(latitude);
        qrCodeData.allowed_longitude = Number.parseFloat(longitude);
      }

      if (useExpiry) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + Number.parseInt(expiryHours));
        qrCodeData.expires_at = expiryDate.toISOString();
      }

      if (usePassword) {
        qrCodeData.password_hash = password; // In production, hash this properly
      }

      await createQRCode(qrCodeData);
      setProgress(100);

      toast.success('Document uploaded and QR code generated successfully!');
      
      // Reset form
      setFile(null);
      setUseGeoFencing(false);
      setLatitude('');
      setLongitude('');
      setUseExpiry(false);
      setUseOTP(false);
      setUsePassword(false);
      setPassword('');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${(error as Error).message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Secure Document
        </CardTitle>
        <CardDescription>
          Upload a document and configure access restrictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document File
            </Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
              disabled={uploading}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Geo-Fencing */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <Label htmlFor="geo-fencing" className="cursor-pointer">
                  Enable Geo-Fencing
                </Label>
              </div>
              <Switch
                id="geo-fencing"
                checked={useGeoFencing}
                onCheckedChange={setUseGeoFencing}
                disabled={uploading}
              />
            </div>
            {useGeoFencing && (
              <div className="space-y-3 pl-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={uploading}
                >
                  Get Current Location
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      disabled={uploading}
                      required={useGeoFencing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      disabled={uploading}
                      required={useGeoFencing}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="radius">Allowed Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={geoRadius}
                    onChange={(e) => setGeoRadius(e.target.value)}
                    disabled={uploading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time Expiry */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label htmlFor="expiry" className="cursor-pointer">
                  Set Expiry Time
                </Label>
              </div>
              <Switch
                id="expiry"
                checked={useExpiry}
                onCheckedChange={setUseExpiry}
                disabled={uploading}
              />
            </div>
            {useExpiry && (
              <div className="pl-6">
                <Label htmlFor="expiry-hours">Expires in (hours)</Label>
                <Input
                  id="expiry-hours"
                  type="number"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  disabled={uploading}
                  min="1"
                />
              </div>
            )}
          </div>

          {/* OTP */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <Label htmlFor="otp" className="cursor-pointer">
                  Require OTP Verification
                </Label>
              </div>
              <Switch
                id="otp"
                checked={useOTP}
                onCheckedChange={setUseOTP}
                disabled={uploading}
              />
            </div>
            {useOTP && (
              <Alert>
                <AlertDescription>
                  OTP will be generated when viewer requests access
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Password */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <Label htmlFor="password-protection" className="cursor-pointer">
                  Password Protection
                </Label>
              </div>
              <Switch
                id="password-protection"
                checked={usePassword}
                onCheckedChange={setUsePassword}
                disabled={uploading}
              />
            </div>
            {usePassword && (
              <div className="pl-6">
                <Label htmlFor="password">Access Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={uploading}
                  required={usePassword}
                  placeholder="Enter password for document access"
                />
              </div>
            )}
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Document & Generate QR Code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
