import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateAccessRequest {
  qrCode: string;
  latitude?: number;
  longitude?: number;
  otpCode?: string;
  password?: string;
  userAgent?: string;
  ipAddress?: string;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      qrCode,
      latitude,
      longitude,
      otpCode,
      password,
      userAgent,
      ipAddress,
    }: ValidateAccessRequest = await req.json();

    // Get QR code details
    const { data: qrData, error: qrError } = await supabaseClient
      .from('qr_codes')
      .select('*, documents(*)')
      .eq('code', qrCode)
      .eq('is_active', true)
      .maybeSingle();

    if (qrError || !qrData) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: 'Invalid or inactive QR code',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    const denialReasons: string[] = [];
    let accessGranted = true;

    // Check if document is active
    if (!qrData.documents.is_active) {
      denialReasons.push('Document is no longer active');
      accessGranted = false;
    }

    // Check expiry time
    if (qrData.expires_at) {
      const expiryTime = new Date(qrData.expires_at);
      if (new Date() > expiryTime) {
        denialReasons.push('QR code has expired');
        accessGranted = false;
      }
    }

    // Check geo-fencing
    if (qrData.allowed_latitude && qrData.allowed_longitude && latitude && longitude) {
      const distance = calculateDistance(
        qrData.allowed_latitude,
        qrData.allowed_longitude,
        latitude,
        longitude
      );

      if (distance > qrData.geo_radius_meters) {
        denialReasons.push(
          `Location outside allowed radius (${Math.round(distance)}m away)`
        );
        accessGranted = false;
      }
    } else if (qrData.allowed_latitude && qrData.allowed_longitude && (!latitude || !longitude)) {
      denialReasons.push('Location verification required but not provided');
      accessGranted = false;
    }

    // Check OTP
    if (qrData.require_otp) {
      if (!otpCode) {
        denialReasons.push('OTP required but not provided');
        accessGranted = false;
      } else if (qrData.otp_code !== otpCode) {
        denialReasons.push('Invalid OTP code');
        accessGranted = false;
      } else if (qrData.otp_expires_at) {
        const otpExpiry = new Date(qrData.otp_expires_at);
        if (new Date() > otpExpiry) {
          denialReasons.push('OTP has expired');
          accessGranted = false;
        }
      }
    }

    // Check password
    if (qrData.password_hash && password) {
      // Simple password check (in production, use proper hashing)
      if (qrData.password_hash !== password) {
        denialReasons.push('Invalid password');
        accessGranted = false;
      }
    } else if (qrData.password_hash && !password) {
      denialReasons.push('Password required but not provided');
      accessGranted = false;
    }

    // Get viewer ID from auth header if available
    const authHeader = req.headers.get('Authorization');
    let viewerId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      viewerId = user?.id || null;
    }

    // Log access attempt
    const { error: logError } = await supabaseClient.from('access_logs').insert({
      qr_code_id: qrData.id,
      document_id: qrData.document_id,
      viewer_id: viewerId,
      access_granted: accessGranted,
      denial_reason: denialReasons.join('; ') || null,
      viewer_latitude: latitude || null,
      viewer_longitude: longitude || null,
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
    });

    if (logError) {
      console.error('Error logging access attempt:', logError);
    }

    // If access denied, trigger AI alert
    if (!accessGranted) {
      // Call AI alerts function asynchronously
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          qrCodeId: qrData.id,
          documentId: qrData.document_id,
          denialReasons,
          latitude,
          longitude,
        }),
      }).catch(err => console.error('Error calling AI alerts:', err));
    }

    return new Response(
      JSON.stringify({
        success: accessGranted,
        documentId: accessGranted ? qrData.document_id : null,
        storagePath: accessGranted ? qrData.documents.storage_path : null,
        filename: accessGranted ? qrData.documents.original_filename : null,
        reasons: denialReasons,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: accessGranted ? 200 : 403,
      }
    );
  } catch (error) {
    console.error('Error in validate-access:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
