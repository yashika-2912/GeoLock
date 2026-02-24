import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateOTPRequest {
  qrCodeId: string;
}

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    const { qrCodeId }: GenerateOTPRequest = await req.json();

    // Get QR code details
    const { data: qrData, error: qrError } = await supabaseClient
      .from('qr_codes')
      .select('*')
      .eq('id', qrCodeId)
      .eq('is_active', true)
      .maybeSingle();

    if (qrError || !qrData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive QR code' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    if (!qrData.require_otp) {
      return new Response(
        JSON.stringify({ error: 'OTP not required for this QR code' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update QR code with new OTP
    const { error: updateError } = await supabaseClient
      .from('qr_codes')
      .update({
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt.toISOString(),
      })
      .eq('id', qrCodeId);

    if (updateError) {
      throw updateError;
    }

    // In a real application, send OTP via email or SMS
    // For demo purposes, we'll just return it
    console.log(`Generated OTP for QR code ${qrCodeId}: ${otpCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        otpCode, // In production, don't return this - send via email/SMS
        expiresAt: otpExpiresAt.toISOString(),
        message: 'OTP generated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-otp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
