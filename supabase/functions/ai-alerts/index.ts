import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIAlertRequest {
  qrCodeId: string;
  documentId: string;
  denialReasons: string[];
  latitude?: number;
  longitude?: number;
}

async function generateAIAlert(context: AIAlertRequest): Promise<string> {
  const ollamaUrl = Deno.env.get('OLLAMA_API_URL') || 'http://localhost:11434';
  
  const prompt = `You are a security alert system. Analyze this suspicious document access attempt and generate a concise security alert message (max 200 characters).

Context:
- Document ID: ${context.documentId}
- QR Code ID: ${context.qrCodeId}
- Denial Reasons: ${context.denialReasons.join(', ')}
- Location: ${context.latitude && context.longitude ? `${context.latitude}, ${context.longitude}` : 'Not provided'}

Generate a brief, professional security alert message:`;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || 'Suspicious access attempt detected';
  } catch (error) {
    console.error('Error calling Ollama:', error);
    // Fallback alert message
    return `⚠️ Security Alert: Unauthorized access attempt blocked. Reasons: ${context.denialReasons.join(', ')}`;
  }
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

    const alertRequest: AIAlertRequest = await req.json();

    // Generate AI alert message
    const alertMessage = await generateAIAlert(alertRequest);

    // Find the most recent access log for this attempt
    const { data: logs, error: logError } = await supabaseClient
      .from('access_logs')
      .select('id')
      .eq('qr_code_id', alertRequest.qrCodeId)
      .eq('access_granted', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (logError || !logs || logs.length === 0) {
      console.error('Error finding access log:', logError);
      return new Response(
        JSON.stringify({ error: 'Access log not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Update access log with AI alert
    const { error: updateError } = await supabaseClient
      .from('access_logs')
      .update({
        ai_alert_generated: true,
        ai_alert_message: alertMessage,
      })
      .eq('id', logs[0].id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in ai-alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
