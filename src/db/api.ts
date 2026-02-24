import { supabase } from './supabase';
import type {
  Profile,
  Document,
  QRCode,
  AccessLog,
  DocumentWithQRCode,
  AccessLogWithDetails,
  CreateDocumentRequest,
  CreateQRCodeRequest,
  ValidateAccessRequest,
  ValidateAccessResponse,
} from '@/types';

// Profile APIs
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updateUserRole(userId: string, role: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
}

// Document APIs
export async function createDocument(doc: CreateDocumentRequest) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .insert({
      owner_id: user.id,
      ...doc,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

export async function getMyDocuments() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .select('*, qr_codes(*)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? (data as DocumentWithQRCode[]) : [];
}

export async function getDocument(documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();

  if (error) throw error;
  return data as Document | null;
}

export async function updateDocument(documentId: string, updates: Partial<Document>) {
  const { error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId);

  if (error) throw error;
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase.from('documents').delete().eq('id', documentId);

  if (error) throw error;
}

// QR Code APIs
export async function createQRCode(qrCode: CreateQRCodeRequest) {
  const code = crypto.randomUUID();

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      ...qrCode,
      code,
    })
    .select()
    .single();

  if (error) throw error;
  return data as QRCode;
}

export async function getQRCodeByCode(code: string) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, documents(*)')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateQRCode(qrCodeId: string, updates: Partial<QRCode>) {
  const { error } = await supabase
    .from('qr_codes')
    .update(updates)
    .eq('id', qrCodeId);

  if (error) throw error;
}

export async function revokeQRCode(qrCodeId: string) {
  const { error } = await supabase
    .from('qr_codes')
    .update({ is_active: false })
    .eq('id', qrCodeId);

  if (error) throw error;
}

// Access Log APIs
export async function getAccessLogsForDocument(documentId: string, limit = 50) {
  const { data, error } = await supabase
    .from('access_logs')
    .select('*, documents(*), qr_codes(*), profiles(*)')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? (data as AccessLogWithDetails[]) : [];
}

export async function getMyAccessLogs(limit = 100) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('access_logs')
    .select('*, documents!inner(*), qr_codes(*), profiles(*)')
    .eq('documents.owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? (data as AccessLogWithDetails[]) : [];
}

export async function createAccessLog(log: Partial<AccessLog>) {
  const { error } = await supabase.from('access_logs').insert(log);

  if (error) throw error;
}

// Edge Function APIs
export async function validateAccess(
  request: ValidateAccessRequest
): Promise<ValidateAccessResponse> {
  const { data, error } = await supabase.functions.invoke<ValidateAccessResponse>(
    'validate-access',
    {
      body: {
        ...request,
        userAgent: navigator.userAgent,
      },
    }
  );

  // If there's an error, try to parse the response body
  if (error) {
    try {
      const errorText = await error?.context?.text();
      if (errorText) {
        // Try to parse as JSON (Edge Function returns JSON even on error)
        const errorData = JSON.parse(errorText);
        // If it has the expected structure, return it
        if (errorData && typeof errorData === 'object') {
          return errorData as ValidateAccessResponse;
        }
      }
    } catch (parseError) {
      // If parsing fails, throw the original error
      console.error('Edge function error in validate-access:', error?.message);
    }
    throw new Error(error?.message || 'Failed to validate access');
  }

  return data as ValidateAccessResponse;
}

export async function generateOTP(qrCodeId: string) {
  const { data, error } = await supabase.functions.invoke('generate-otp', {
    body: { qrCodeId },
  });

  if (error) {
    const errorMsg = await error?.context?.text();
    console.error('Edge function error in generate-otp:', errorMsg || error?.message);
    throw new Error(errorMsg || error?.message || 'Failed to generate OTP');
  }

  return data;
}

// Storage APIs
export async function uploadDocument(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('app-9u0cqizefu2p_documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function downloadDocument(path: string) {
  const { data, error } = await supabase.storage
    .from('app-9u0cqizefu2p_documents')
    .download(path);

  if (error) throw error;
  return data;
}

export async function getDocumentUrl(path: string) {
  const { data } = supabase.storage
    .from('app-9u0cqizefu2p_documents')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteStorageFile(path: string) {
  const { error } = await supabase.storage
    .from('app-9u0cqizefu2p_documents')
    .remove([path]);

  if (error) throw error;
}
