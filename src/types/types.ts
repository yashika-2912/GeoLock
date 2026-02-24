export type UserRole = 'owner' | 'viewer' | 'admin';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  owner_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  encryption_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  document_id: string;
  code: string;
  allowed_latitude: number | null;
  allowed_longitude: number | null;
  geo_radius_meters: number;
  expires_at: string | null;
  require_otp: boolean;
  otp_code: string | null;
  otp_expires_at: string | null;
  password_hash: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccessLog {
  id: string;
  qr_code_id: string;
  document_id: string;
  viewer_id: string | null;
  access_granted: boolean;
  denial_reason: string | null;
  viewer_latitude: number | null;
  viewer_longitude: number | null;
  user_agent: string | null;
  ip_address: string | null;
  ai_alert_generated: boolean;
  ai_alert_message: string | null;
  created_at: string;
}

export interface DocumentWithQRCode extends Document {
  qr_codes: QRCode[];
}

export interface AccessLogWithDetails extends AccessLog {
  documents: Document;
  qr_codes: QRCode;
  profiles: Profile | null;
}

export interface CreateDocumentRequest {
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  encryption_key: string;
}

export interface CreateQRCodeRequest {
  document_id: string;
  allowed_latitude?: number;
  allowed_longitude?: number;
  geo_radius_meters?: number;
  expires_at?: string;
  require_otp?: boolean;
  password_hash?: string;
}

export interface ValidateAccessRequest {
  qrCode: string;
  latitude?: number;
  longitude?: number;
  otpCode?: string;
  password?: string;
}

export interface ValidateAccessResponse {
  success: boolean;
  documentId?: string;
  storagePath?: string;
  filename?: string;
  reasons?: string[];
}
